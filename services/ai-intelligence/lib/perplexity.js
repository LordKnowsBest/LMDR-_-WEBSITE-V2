/**
 * perplexity.js — Carrier enrichment via Perplexity Sonar (web-grounded AI)
 *
 * Uses sonar-pro to search trucking forums, job boards, and review sites
 * for real driver sentiment on a given carrier — before results hit the card.
 *
 * Targeted sources: TheTruckersReport, CDLLife, TruckingTruth,
 *                   Indeed driver reviews, Glassdoor, TruckPaper job listings
 *
 * Runs inside the Railway async pipeline — no Wix timeout to worry about.
 * Output shape matches aiEnrichment.jsw so the existing renderer works unchanged.
 */

const PERPLEXITY_ENDPOINT = 'https://api.perplexity.ai/chat/completions';
const MODEL       = 'sonar-pro';
const TIMEOUT_MS  = 14_000; // generous — Railway is async

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Enrich a single carrier with web-sourced driver intelligence.
 *
 * @param {string} carrierName
 * @param {string|number} dotNumber
 * @param {object} [knownData]  Any structured data we already have
 *   { state, city, fleet_size, safety_rating, carrier_operation }
 * @returns {Promise<object>} Enrichment payload matching aiEnrichment.jsw shape
 */
export async function enrichCarrierWithPerplexity(carrierName, dotNumber, knownData = {}) {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey) {
    console.warn(`[perplexity] No PERPLEXITY_API_KEY — skipping enrichment for DOT ${dotNumber}`);
    return _fallback(dotNumber, carrierName, 'API key not configured');
  }

  const prompt = _buildPrompt(carrierName, dotNumber, knownData);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const res = await fetch(PERPLEXITY_ENDPOINT, {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        model:    MODEL,
        messages: [
          {
            role:    'system',
            content: 'You are a trucking industry researcher. Search the web for recent CDL driver reviews and job postings. Return ONLY valid JSON — no markdown fences, no prose, no explanation.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens:             700,
        temperature:            0.1,
        search_recency_filter:  'year',
        search_domain_filter:   [
          'thetruckersreport.com',
          'cdllife.com',
          'truckingtruth.com',
          'indeed.com',
          'glassdoor.com',
          'truckpaper.com',
          'reddit.com',
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errBody = await res.text().catch(() => String(res.status));
      console.warn(`[perplexity] DOT ${dotNumber}: HTTP ${res.status} — ${errBody.slice(0, 120)}`);
      return _fallback(dotNumber, carrierName, `HTTP ${res.status}`);
    }

    const body      = await res.json();
    const raw       = body.choices?.[0]?.message?.content || '';
    const citations = body.citations || [];

    console.log(`[perplexity] DOT ${dotNumber}: got ${raw.length} chars, ${citations.length} citations`);
    return _parse(raw, dotNumber, carrierName, citations);

  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn(`[perplexity] DOT ${dotNumber}: timed out after ${TIMEOUT_MS}ms`);
    } else {
      console.warn(`[perplexity] DOT ${dotNumber}:`, err.message);
    }
    return _fallback(dotNumber, carrierName, err.message);
  }
}

/**
 * Enrich multiple carriers in parallel (batched to avoid hammering the API).
 *
 * @param {Array<{ name, dotNumber, knownData }>} carriers
 * @param {{ maxConcurrent?: number }} opts
 * @returns {Promise<Record<string, object>>} Map of dotNumber → enrichment
 */
export async function enrichCarriersBatch(carriers, { maxConcurrent = 5 } = {}) {
  const results = {};

  for (let i = 0; i < carriers.length; i += maxConcurrent) {
    const chunk = carriers.slice(i, i + maxConcurrent);

    const settled = await Promise.allSettled(
      chunk.map(c =>
        enrichCarrierWithPerplexity(c.name, c.dotNumber, c.knownData || {})
          .then(r => ({ dotNumber: String(c.dotNumber), result: r }))
      )
    );

    for (const s of settled) {
      if (s.status === 'fulfilled') {
        results[s.value.dotNumber] = s.value.result;
      } else {
        console.warn('[perplexity] Batch item rejected:', s.reason?.message);
      }
    }
  }

  return results;
}

// ── Prompt builder ────────────────────────────────────────────────────────────

function _buildPrompt(name, dot, data) {
  const parts = [
    data.city && data.state ? `based in ${data.city}, ${data.state}` : data.state ? `based in ${data.state}` : null,
    data.fleet_size  ? `fleet of ~${data.fleet_size} trucks`  : data.NBR_POWER_UNIT ? `fleet of ~${data.NBR_POWER_UNIT} trucks` : null,
    data.safety_rating || data.SAFETY_RATING ? `FMCSA safety rating: ${data.safety_rating || data.SAFETY_RATING}` : null,
    data.carrier_operation || data.CARRIER_OPERATION ? `operation type: ${data.carrier_operation || data.CARRIER_OPERATION}` : null,
  ].filter(Boolean);

  const context = parts.length > 0 ? ` (${parts.join(', ')})` : '';

  return `Research CDL truck driver reviews and current pay for "${name}"${context}, DOT# ${dot}.

Search TheTruckersReport forums, CDLLife, TruckingTruth, Indeed, and Glassdoor for driver feedback and job postings from 2024–2026.

Return ONLY this exact JSON (no code fences, no extra text):
{
  "ai_summary": "• **Fleet:** size, operation type, location\\n• **Safety:** FMCSA rating or reputation\\n• **Pay:** CPM range or salary from recent job postings\\n• **Sentiment:** overall driver mood + key point\\n• **Bottom Line:** one-sentence hire-or-skip verdict",
  "driver_sentiment": "Positive | Mixed | Negative | No Reviews",
  "sentiment_pros": ["up to 3 real pros from driver reviews"],
  "sentiment_cons": ["up to 3 real cons from driver reviews"],
  "pay_estimate": "e.g. $0.52–0.58 CPM or $1,200/wk average, or null if not found",
  "benefits": "health/dental/401k details or Unknown",
  "hiring_status": "Actively Hiring | Unknown | Not Hiring",
  "data_confidence": "High | Medium | Low"
}`;
}

// ── Parse + normalize ─────────────────────────────────────────────────────────

function _parse(raw, dotNumber, carrierName, citations) {
  try {
    const clean  = raw.replace(/^```(?:json)?\n?|\n?```$/g, '').trim();
    const parsed = JSON.parse(clean);

    const sources = citations.length > 0
      ? citations.map(url => {
          try { return new URL(url).hostname.replace('www.', ''); } catch { return url; }
        }).slice(0, 5)
      : (parsed.sources_found || ['Web Search']);

    return {
      dot_number:       String(dotNumber),
      ai_summary:       parsed.ai_summary        || _defaultSummary(carrierName),
      driver_sentiment: parsed.driver_sentiment  || 'No Reviews',
      sentiment_pros:   JSON.stringify(Array.isArray(parsed.sentiment_pros) ? parsed.sentiment_pros : []),
      sentiment_cons:   JSON.stringify(Array.isArray(parsed.sentiment_cons) ? parsed.sentiment_cons : []),
      pay_estimate:     parsed.pay_estimate      || null,
      benefits:         parsed.benefits          || 'Contact for details',
      hiring_status:    parsed.hiring_status     || 'Unknown',
      data_confidence:  parsed.data_confidence   || 'Medium',
      sources_found:    JSON.stringify(sources),
      enriched_by:      'perplexity-sonar-pro',
      enriched_at:      new Date().toISOString(),
      error:            false,
    };
  } catch (parseErr) {
    console.warn(`[perplexity] JSON parse failed for DOT ${dotNumber}:`, parseErr.message,
      '— raw snippet:', raw.slice(0, 200));
    return _fallback(dotNumber, carrierName, 'JSON parse error');
  }
}

function _fallback(dotNumber, carrierName, reason) {
  return {
    dot_number:       String(dotNumber),
    ai_summary:       _defaultSummary(carrierName),
    driver_sentiment: 'No Reviews',
    sentiment_pros:   JSON.stringify([]),
    sentiment_cons:   JSON.stringify([]),
    pay_estimate:     null,
    benefits:         'Contact for details',
    hiring_status:    'Unknown',
    data_confidence:  'Low',
    sources_found:    JSON.stringify(['FMCSA SAFER']),
    enriched_by:      'fallback',
    enriched_at:      new Date().toISOString(),
    error:            true,
    error_reason:     reason,
  };
}

function _defaultSummary(name) {
  return `• **Carrier:** ${name}\n• **Status:** Web research unavailable\n• **Action:** Check FMCSA records and contact carrier directly`;
}
