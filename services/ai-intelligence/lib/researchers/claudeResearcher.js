/**
 * Claude-powered researchers for social, news, and linkedin sections.
 *
 * Each section runs a focused Claude Haiku call with a JSON-output system
 * prompt. Haiku is used (not Sonnet) because these are short structured
 * tasks that don't need full reasoning depth — keeps cost and latency low.
 *
 * The outer withTimeout() in routes/research.js handles per-section
 * timeouts; no internal timeout is needed here.
 */

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SECTION_CONFIGS = {
  social: {
    system: `You are a B2B intelligence analyst specialising in trucking company research.
Respond ONLY with a JSON object — no markdown, no explanation, no code fences.`,
    userTemplate: (companyName, dotNumber) =>
      `Research the social media and online presence of this trucking carrier:
Company: ${companyName}
DOT#: ${dotNumber}

Return this exact JSON schema:
{
  "platforms": ["<platform>"],
  "followerCount": <integer or null>,
  "recentPostSentiment": "positive" | "neutral" | "negative" | "unknown",
  "hiringPostsVisible": true | false | null,
  "summary": "<1-2 sentence summary>",
  "confidence": "high" | "medium" | "low"
}`,
    maxTokens: 350,
  },

  news: {
    system: `You are a B2B intelligence analyst specialising in trucking industry news.
Respond ONLY with a JSON object — no markdown, no explanation, no code fences.`,
    userTemplate: (companyName, dotNumber) =>
      `Find recent news, press releases, and coverage for this carrier:
Company: ${companyName}
DOT#: ${dotNumber}

Return this exact JSON schema:
{
  "articleCount": <integer or null>,
  "headlines": ["<headline>"],
  "overallSentiment": "positive" | "neutral" | "negative" | "unknown",
  "expansionSignals": true | false | null,
  "summary": "<1-2 sentences on news landscape>",
  "confidence": "high" | "medium" | "low"
}`,
    maxTokens: 400,
  },

  linkedin: {
    system: `You are a B2B intelligence analyst specialising in company workforce data.
Respond ONLY with a JSON object — no markdown, no explanation, no code fences.`,
    userTemplate: (companyName, dotNumber) =>
      `Estimate LinkedIn company profile data for this trucking carrier:
Company: ${companyName}
DOT#: ${dotNumber}

Return this exact JSON schema:
{
  "employeeCount": <integer or null>,
  "recentHires": <integer estimate or null>,
  "openPositions": <integer or null>,
  "growthTrend": "growing" | "stable" | "shrinking" | "unknown",
  "summary": "<1-2 sentences on hiring activity and growth>",
  "note": "<caveat if data is estimated>",
  "confidence": "high" | "medium" | "low"
}`,
    maxTokens: 350,
  },
};

/**
 * Run a Claude-powered research section.
 *
 * @param {'social'|'news'|'linkedin'} section
 * @param {string} companyName
 * @param {string} dotNumber
 * @returns {Promise<object>} Section result — always resolves (never throws)
 */
export async function claudeResearch(section, companyName, dotNumber) {
  const config = SECTION_CONFIGS[section];
  if (!config) {
    return { status: 'error', note: `Unknown section: ${section}` };
  }

  let response;
  try {
    response = await client.messages.create({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: config.maxTokens,
      system:     config.system,
      messages:   [{ role: 'user', content: config.userTemplate(companyName, dotNumber) }],
    });
  } catch (err) {
    return { status: 'error', note: err.message };
  }

  const raw = response.content[0]?.text || '{}';

  // Parse JSON — strip accidental markdown fences if Claude misbehaved
  let parsed;
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch?.[0] ?? raw);
  } catch {
    return { status: 'parse_error', note: 'Claude returned non-JSON', raw: raw.slice(0, 200) };
  }

  return { status: 'ok', ...parsed };
}
