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
 * Supports both legacy fields (description/home_states) and FMCSA fields
 * (legal_name/state/city/operation_type/turnover_pct/accident_rate).
 */
const OP_TYPE = { A: 'for-hire carrier', B: 'for-hire and private carrier', C: 'private carrier' };

export function buildCarrierText(profile) {
  const parts = [];

  if (profile.legal_name)                          parts.push(profile.legal_name);
  if (profile.description && profile.description !== profile.legal_name)
                                                   parts.push(profile.description);
  if (profile.operation_type)                      parts.push(OP_TYPE[profile.operation_type] || profile.operation_type);

  // Location
  if (profile.city && profile.state)               parts.push(`Based in ${profile.city}, ${profile.state}`);
  else if (profile.state)                          parts.push(`Operating in ${profile.state}`);
  else if (profile.home_states)                    parts.push(`Operating states: ${Array.isArray(profile.home_states) ? profile.home_states.join(', ') : profile.home_states}`);

  // Fleet
  if (profile.fleet_size)                          parts.push(`Fleet: ${profile.fleet_size} trucks`);
  if (profile.driver_count)                        parts.push(`${profile.driver_count} drivers`);

  // Pay
  if (profile.pay_cpm)                             parts.push(`Pay: $${profile.pay_cpm}/mi`);
  else if (profile.pay_range_min)                  parts.push(`Pay: $${profile.pay_range_min}–$${profile.pay_range_max || '?'}/mi`);

  // Safety and retention signals — high value for driver decision-making
  if (profile.turnover_pct   != null)              parts.push(`Driver turnover: ${profile.turnover_pct}%`);
  if (profile.accident_rate  != null)              parts.push(`Accident rate: ${profile.accident_rate}`);
  if (profile.avg_truck_age  != null)              parts.push(`Avg truck age: ${profile.avg_truck_age} yrs`);

  // Haul types
  if (profile.haul_types)                          parts.push(`Haul types: ${Array.isArray(profile.haul_types) ? profile.haul_types.join(', ') : profile.haul_types}`);

  if (profile.dot_number)                          parts.push(`DOT: ${profile.dot_number}`);

  return parts.join('. ') || 'Carrier profile';
}
