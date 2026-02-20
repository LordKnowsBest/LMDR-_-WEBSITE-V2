/**
 * Voyage AI embedding client.
 * Model: voyage-3 — 1024 dimensions, optimized for retrieval with Claude.
 */

const VOYAGE_API = 'https://api.voyageai.com/v1/embeddings';
const MODEL      = 'voyage-3';
export const EMBEDDING_DIMENSION = 1024;

/**
 * Generate an embedding vector for a single text string.
 * @param {string} text
 * @returns {Promise<number[]>} 1024-dim vector
 */
export async function embed(text) {
  const res = await fetch(VOYAGE_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({ input: [text], model: MODEL }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Voyage embed failed ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.data[0].embedding;
}

/**
 * Build a flat text string from a driver profile for embedding.
 * Higher-signal fields (bio, endorsements, haul_types) appear first.
 */
export function buildDriverText(profile) {
  const parts = [];
  if (profile.bio)              parts.push(profile.bio);
  if (profile.endorsements)     parts.push(`Endorsements: ${Array.isArray(profile.endorsements) ? profile.endorsements.join(', ') : profile.endorsements}`);
  if (profile.haul_types)       parts.push(`Haul types: ${Array.isArray(profile.haul_types) ? profile.haul_types.join(', ') : profile.haul_types}`);
  if (profile.cdl_class)        parts.push(`CDL class: ${profile.cdl_class}`);
  if (profile.experience_years) parts.push(`Experience: ${profile.experience_years} years`);
  if (profile.home_state)       parts.push(`Home state: ${profile.home_state}`);
  if (profile.pay_min)          parts.push(`Min pay: $${profile.pay_min}/mi`);
  return parts.join('. ') || 'CDL driver profile';
}

/**
 * Build a flat text string from a carrier profile for embedding.
 */
export function buildCarrierText(profile) {
  const parts = [];
  if (profile.description)    parts.push(profile.description);
  if (profile.haul_types)     parts.push(`Haul types: ${Array.isArray(profile.haul_types) ? profile.haul_types.join(', ') : profile.haul_types}`);
  if (profile.home_states)    parts.push(`Operating states: ${Array.isArray(profile.home_states) ? profile.home_states.join(', ') : profile.home_states}`);
  if (profile.fleet_size)     parts.push(`Fleet size: ${profile.fleet_size}`);
  if (profile.pay_range_min)  parts.push(`Pay: $${profile.pay_range_min}–$${profile.pay_range_max || '?'}/mi`);
  if (profile.dot_number)     parts.push(`DOT: ${profile.dot_number}`);
  return parts.join('. ') || 'Carrier profile';
}
