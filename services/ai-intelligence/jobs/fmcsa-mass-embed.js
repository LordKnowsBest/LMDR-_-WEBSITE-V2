/**
 * POST /v1/jobs/fmcsa-mass-embed
 *
 * Mass-ingests carriers from the full FMCSA universe (DOTs 1–4,500,000)
 * directly into Pinecone, bypassing Airtable.
 *
 * Strategy:
 *   1. Read progress sentinel from Pinecone (last DOT processed).
 *   2. Scan SCAN_WINDOW DOTs starting from last_dot + 1.
 *   3. For each DOT:
 *        a. Call FMCSA QC API — skip 404/403 (invalid/restricted).
 *        b. Build carrier profile text.
 *        c. Generate voyage-3 embedding.
 *        d. Upsert into lmdr-carriers index with ID `dot:{dotNumber}`.
 *   4. Save updated progress sentinel to Pinecone.
 *   5. Return { scanned, found, embedded, failed, dot_start, dot_end, dot_next }.
 *
 * Vector IDs:
 *   Airtable-backed carriers — Airtable record ID (recXXXXX)
 *   Mass-embedded carriers   — `dot:{dotNumber}` (e.g., `dot:1234567`)
 *
 * Progress:
 *   Stored as a sentinel Pinecone vector with ID `fmcsa-mass-embed:progress`.
 *   metadata.last_dot tracks the highest DOT number processed.
 *
 * Concurrency:
 *   CONCURRENT = 3 parallel FMCSA requests, 300 ms batch delay (~10 DOTs/sec).
 *   SCAN_WINDOW defaults to 2000 per invocation (~200 seconds).
 *   Override via POST body: { scan_window, dot_override_start }
 *
 * Rate:
 *   ~10 DOTs/sec → 2000 DOTs ≈ 3.5 min per scheduled run.
 *   Daily scheduler covers ~2000 DOTs/day → full 4.3M range in ~6 years.
 *   For faster coverage, trigger manually with larger scan_window.
 */

import { Hono } from 'hono';
import { embed, buildCarrierText, EMBEDDING_DIMENSION } from '../lib/embeddings.js';
import { upsertVector, fetchVector }                    from '../lib/pinecone.js';

export const fmcsaMassEmbedRouter = new Hono();

// ── Constants ──────────────────────────────────────────────────────────────────

const DEFAULT_SCAN_WINDOW = 2_000;
const DOT_MAX             = 4_500_000;
const CONCURRENT          = 3;      // parallel FMCSA requests per batch
const BATCH_DELAY_MS      = 300;    // delay between concurrent batches
const EMBED_TIMEOUT_MS    = 8_000;

const PROGRESS_ID = 'fmcsa-mass-embed:progress';

// Sentinel vector: unit vector in dim-0 (valid for cosine; won't collide with real embeddings)
const SENTINEL_VECTOR = Array.from({ length: EMBEDDING_DIMENSION }, (_, i) => (i === 0 ? 1.0 : 0.0));

// ── Progress helpers ───────────────────────────────────────────────────────────

async function getLastDot() {
  try {
    const vec = await fetchVector('carriers', PROGRESS_ID);
    return Number(vec?.metadata?.last_dot) || 0;
  } catch {
    return 0;
  }
}

async function saveProgress(lastDot) {
  try {
    await upsertVector('carriers', PROGRESS_ID, SENTINEL_VECTOR, {
      last_dot:   lastDot,
      updated_at: new Date().toISOString(),
      source:     'progress-tracker',
    });
  } catch (err) {
    console.warn(`[fmcsa-mass-embed] Progress save failed: ${err.message}`);
  }
}

// ── FMCSA fetch ────────────────────────────────────────────────────────────────

async function fetchFmcsaCarrier(dotNumber) {
  const url = `https://mobile.fmcsa.dot.gov/qc/services/carriers/${dotNumber}?webKey=${process.env.FMCSA_WEB_KEY}`;
  const res = await fetch(url);

  if (res.status === 404) return null;
  if (res.status === 403) return null; // Restricted — investigation hold or revocation pending
  if (!res.ok) throw new Error(`FMCSA API ${res.status} for DOT ${dotNumber}`);

  const data = await res.json();

  // Detect invalid web key — FMCSA returns HTTP 200 with string content "Webkey not found"
  if (typeof data?.content === 'string' && data.content.toLowerCase().includes('webkey')) {
    throw new Error(`FMCSA web key invalid or not set (FMCSA_WEB_KEY env var missing)`);
  }

  return data?.content?.carrier || data?.carrier || null;
}

// ── Profile builder ────────────────────────────────────────────────────────────

/**
 * Map FMCSA carrier object to the buildCarrierText profile shape.
 */
function buildProfile(dotNumber, fmcsa) {
  return {
    dot_number:     dotNumber,
    legal_name:     fmcsa.legalName        || fmcsa.legal_name        || null,
    operation_type: fmcsa.carrierOperation || fmcsa.carrier_operation || null,
    city:           fmcsa.phyCity          || fmcsa.phy_city          || null,
    state:          fmcsa.phyState         || fmcsa.phy_state         || null,
    fleet_size:     fmcsa.nbrPowerUnit     != null ? Number(fmcsa.nbrPowerUnit)  :
                    fmcsa.nbr_power_unit   != null ? Number(fmcsa.nbr_power_unit) : null,
    driver_count:   fmcsa.totalDrivers     != null ? Number(fmcsa.totalDrivers)  :
                    fmcsa.total_drivers    != null ? Number(fmcsa.total_drivers)  : null,
    safety_rating:  fmcsa.safetyRating     || fmcsa.safety_rating     || null,
  };
}

/**
 * Build Pinecone metadata for a mass-embedded carrier.
 * All values must be non-null (Pinecone rejects null metadata fields).
 */
function buildMetadata(dotNumber, profile, today) {
  return {
    source:           'fmcsa-mass-embed',
    profileUpdatedAt: today,
    dot_number:       dotNumber,
    legal_name:       profile.legal_name     || 'unknown',
    operation_type:   profile.operation_type || 'unknown',
    state:            profile.state          || 'unknown',
    fleet_size:       profile.fleet_size     ?? 0,
    driver_count:     profile.driver_count   ?? 0,
    safety_rating:    profile.safety_rating  || 'unknown',
    last_active:      new Date().toISOString(),
  };
}

// ── Embed with timeout ─────────────────────────────────────────────────────────

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error('EMBED_TIMEOUT')), ms)),
  ]);
}

// ── Per-DOT processing ─────────────────────────────────────────────────────────

async function processDot(dot, today, stats) {
  try {
    const fmcsa = await fetchFmcsaCarrier(dot);
    if (!fmcsa) return; // 404 or 403 — skip silently

    stats.found++;

    const profile  = buildProfile(dot, fmcsa);
    const text     = buildCarrierText(profile);
    const vector   = await withTimeout(embed(text), EMBED_TIMEOUT_MS);
    const metadata = buildMetadata(dot, profile, today);

    await upsertVector('carriers', `dot:${dot}`, vector, metadata);
    stats.embedded++;

    console.log(`[fmcsa-mass-embed] ✓ DOT ${dot} → ${profile.legal_name || 'unnamed'} (${profile.state || '?'})`);
  } catch (err) {
    stats.failed++;
    console.error(`[fmcsa-mass-embed] ✗ DOT ${dot}: ${err.message}`);
  }
}

// ── Route ──────────────────────────────────────────────────────────────────────

fmcsaMassEmbedRouter.post('/', async (c) => {
  const startedAt = new Date().toISOString();

  // Parse optional override params
  let body = {};
  try { body = await c.req.json(); } catch { /* no body is fine */ }

  const scanWindow        = Math.min(Number(body.scan_window) || DEFAULT_SCAN_WINDOW, 20_000);
  const dotOverrideStart  = Number(body.dot_override_start) || null;

  const stats = { scanned: 0, found: 0, embedded: 0, failed: 0 };

  // Determine start DOT
  let lastDot;
  if (dotOverrideStart) {
    lastDot = dotOverrideStart - 1;
    console.log(`[fmcsa-mass-embed] Manual start at DOT ${dotOverrideStart}`);
  } else {
    lastDot = await getLastDot();
    console.log(`[fmcsa-mass-embed] Resuming from DOT ${lastDot + 1} (progress sentinel)`);
  }

  const dotStart = lastDot + 1;
  const dotEnd   = Math.min(dotStart + scanWindow - 1, DOT_MAX);

  if (dotStart > DOT_MAX) {
    return c.json({
      ...stats,
      message:    'All DOTs scanned — reset progress sentinel to restart',
      dot_start:  dotStart,
      dot_end:    dotEnd,
      dot_next:   null,
      startedAt,
      completedAt: new Date().toISOString(),
    });
  }

  console.log(`[fmcsa-mass-embed] Scanning DOT ${dotStart}–${dotEnd} (window: ${scanWindow})`);

  const today = new Date().toISOString().split('T')[0];

  // Process DOTs in concurrent batches
  for (let dot = dotStart; dot <= dotEnd; dot += CONCURRENT) {
    const batch = [];
    for (let i = 0; i < CONCURRENT && dot + i <= dotEnd; i++) {
      batch.push(dot + i);
    }

    stats.scanned += batch.length;

    await Promise.all(batch.map(d => processDot(d, today, stats)));

    if (dot + CONCURRENT <= dotEnd) {
      await new Promise(r => setTimeout(r, BATCH_DELAY_MS));
    }
  }

  const dotNext = dotEnd + 1 <= DOT_MAX ? dotEnd + 1 : null;

  // Save progress unless this was a manual override (let normal progression continue)
  if (!dotOverrideStart) {
    await saveProgress(dotEnd);
  }

  return c.json({
    ...stats,
    dot_start:   dotStart,
    dot_end:     dotEnd,
    dot_next:    dotNext,
    startedAt,
    completedAt: new Date().toISOString(),
  });
});
