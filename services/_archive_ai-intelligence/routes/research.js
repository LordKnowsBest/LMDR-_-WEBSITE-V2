/**
 * POST /v1/research/company
 *
 * B2B parallel research endpoint — Phase 4.
 *
 * Runs up to 4 specialised researchers in parallel against a carrier:
 *   fmcsa    — live FMCSA safety data (real HTTP call)
 *   social   — company social media intelligence (Claude Haiku)
 *   news     — recent news and press coverage (Claude Haiku)
 *   linkedin — LinkedIn company profile estimate (Claude Haiku)
 *
 * Each researcher gets a 15 s individual timeout via Promise.race().
 * A final Claude Haiku synthesis call (10 s timeout) summarises all sections.
 *
 * Partial results are returned when any section times out or errors:
 *   { partial: true, sections: { fmcsa: { status:'ok',...}, linkedin: { status:'timeout',...} } }
 *
 * Caller timeout budget: 20 000 ms. The overall endpoint can complete in
 * 15 s (one full-timeout section + 10 s synthesis at worst).
 *
 * Request body:
 * {
 *   dotNumber:         string (required)
 *   companyName:       string (required)
 *   requestedSections: string[] (optional, defaults to all 4)
 * }
 */

import { Hono }           from 'hono';
import { fmcsaResearch }  from '../lib/researchers/fmcsaResearcher.js';
import { claudeResearch } from '../lib/researchers/claudeResearcher.js';
import Anthropic          from '@anthropic-ai/sdk';
import crypto             from 'node:crypto';

export const researchRouter = new Hono();

const synthClient     = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const ALL_SECTIONS    = ['fmcsa', 'social', 'news', 'linkedin'];
const SECTION_TIMEOUT = 15_000;
const SYNTH_TIMEOUT   = 10_000;

// ── Helpers ──────────────────────────────────────────────────────────────────

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('SECTION_TIMEOUT')), ms)
    ),
  ]);
}

async function runSection(section, dotNumber, companyName) {
  try {
    let result;
    if (section === 'fmcsa') {
      result = await withTimeout(fmcsaResearch(dotNumber), SECTION_TIMEOUT);
    } else {
      result = await withTimeout(claudeResearch(section, companyName, dotNumber), SECTION_TIMEOUT);
    }
    return { section, result };
  } catch (err) {
    return {
      section,
      result: {
        status: err.message === 'SECTION_TIMEOUT' ? 'timeout' : 'error',
        note:   err.message,
      },
    };
  }
}

async function synthesise(companyName, dotNumber, sectionsMap) {
  const successSections = Object.entries(sectionsMap)
    .filter(([, v]) => v.status === 'ok')
    .map(([k, v]) => `${k.toUpperCase()}:\n${JSON.stringify(v, null, 2)}`)
    .join('\n\n');

  if (!successSections) return null;

  try {
    const response = await withTimeout(
      synthClient.messages.create({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system:     'You are a B2B intelligence analyst for a trucking driver recruitment platform. Write a crisp, actionable synthesis. No markdown.',
        messages: [{
          role:    'user',
          content: `Synthesise this research for ${companyName} (DOT# ${dotNumber}):\n\n${successSections}\n\nWrite 2-3 sentences covering: safety posture, market presence, and hiring/growth signals. Be specific where data supports it.`,
        }],
      }),
      SYNTH_TIMEOUT
    );
    return response.content[0]?.text?.trim() || null;
  } catch (err) {
    console.warn(`[research] Synthesis failed for ${dotNumber}:`, err.message);
    return null;
  }
}

// ── Route ─────────────────────────────────────────────────────────────────────

researchRouter.post('/company', async (c) => {
  const requestId = crypto.randomUUID();
  const startMs   = Date.now();

  let body;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: { code: 'validation_error', message: 'Invalid JSON body', requestId } }, 400);
  }

  // fmcsaData: optional pre-fetched FMCSA data from Velo (bypasses the live
  // FMCSA API call which is blocked by Railway datacenter IPs).
  // Shape: { safetyRating, operatingStatus, totalDrivers, powerUnits, legalName, ... }
  const { dotNumber, companyName, requestedSections = ALL_SECTIONS, fmcsaData } = body;

  if (!dotNumber || !companyName) {
    return c.json({
      error: { code: 'validation_error', message: 'dotNumber and companyName are required', requestId },
    }, 400);
  }

  // Filter to known sections, deduplicate
  const sections = [...new Set(requestedSections.filter(s => ALL_SECTIONS.includes(s)))];
  if (sections.length === 0) {
    return c.json({
      error: { code: 'validation_error', message: 'No valid requestedSections — use one or more of: fmcsa, social, news, linkedin', requestId },
    }, 400);
  }

  console.log(`[research] Starting ${dotNumber} sections=[${sections}] preloadedFmcsa=${!!fmcsaData} requestId=${requestId}`);

  // ── Run all sections in parallel ──────────────────────────────────────────
  // If fmcsaData was pre-fetched by Velo (Railway IPs are blocked by FMCSA),
  // inject it directly instead of making a live API call.
  const outcomes = await Promise.all(
    sections.map(section => {
      if (section === 'fmcsa' && fmcsaData) {
        return Promise.resolve({
          section: 'fmcsa',
          result: { status: 'ok', ...fmcsaData },
        });
      }
      return runSection(section, dotNumber, companyName);
    })
  );

  // Build sections map
  const sectionsMap = {};
  let anySuccess = false;
  let anyFailure = false;

  for (const { section, result } of outcomes) {
    sectionsMap[section] = result;
    if (result.status === 'ok') anySuccess = true;
    else                        anyFailure = true;
  }

  // ── Synthesise ────────────────────────────────────────────────────────────
  const synthesis = anySuccess ? await synthesise(companyName, dotNumber, sectionsMap) : null;

  const latencyMs = Date.now() - startMs;
  console.log(`[research] ${dotNumber} done in ${latencyMs}ms partial=${anyFailure} requestId=${requestId}`);

  return c.json({
    dotNumber,
    companyName,
    partial:     anyFailure,
    generatedAt: new Date().toISOString(),
    latencyMs,
    sections:    sectionsMap,
    synthesis,
    requestId,
  });
});
