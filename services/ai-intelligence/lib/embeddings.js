/**
 * Voyage AI embedding client.
 * Model: voyage-3 — 1024 dimensions, optimized for retrieval with Claude.
 */

const VOYAGE_API = 'https://api.voyageai.com/v1/embeddings';
const MODEL      = 'voyage-3';
export const EMBEDDING_DIMENSION = 1024;

/**
 * Expand CDL abbreviations for semantic embedding clarity.
 * Replaces shorthand with full phrases so embeddings capture full context.
 */
function expandAbbreviations(text) {
  if (!text) return text;
  return text
    .replace(/\bOTR\b/g, 'over the road')
    .replace(/\bCDL-A\b/g, 'CDL Class A')
    .replace(/\bO\/O\b/g, 'owner operator')
    .replace(/\bHH\b/g, 'home daily')
    .replace(/\bRgn\b/g, 'regional');
}

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
 * Weights high-signal CDL terms (CDL, haul types, pay, benefits) through repetition.
 */
export function buildDriverText(profile) {
  const parts = [];

  // Bio - expand abbreviations for clarity
  if (profile.bio) {
    parts.push(expandAbbreviations(profile.bio));
  }

  // Endorsements - high signal for driver qualification
  if (profile.endorsements) {
    const endorsementsStr = Array.isArray(profile.endorsements) ? profile.endorsements.join(', ') : profile.endorsements;
    parts.push(`Endorsements: ${endorsementsStr}`);
  }

  // Haul types - repeat 2-3x (critical matching signal)
  if (profile.haul_types) {
    const haulStr = Array.isArray(profile.haul_types) ? profile.haul_types.join(', ') : profile.haul_types;
    parts.push(`Haul types: ${haulStr}. Specializes in ${haulStr}.`);
  }

  // CDL class - repeat 3x (highest signal for driver type)
  if (profile.cdl_class) {
    parts.push(`CDL class: ${profile.cdl_class}. Holds CDL ${profile.cdl_class}. CDL ${profile.cdl_class} certified driver.`);
  }

  // Experience - context enricher
  if (profile.experience_years) {
    parts.push(`${profile.experience_years} years of CDL driving experience.`);
  }

  // Home state - location anchor
  if (profile.home_state) {
    parts.push(`Home state: ${profile.home_state}`);
  }

  // Pay range - repeat 2x (critical for matching)
  if (profile.pay_min) {
    parts.push(`Pay expectation: minimum $${profile.pay_min}/mi. Seeking per mile compensation of $${profile.pay_min} or higher.`);
  }

  // Home time preferences - repeat 2x (quality of life signal)
  if (profile.home_time_preference) {
    parts.push(`Home time: ${profile.home_time_preference}. ${profile.home_time_preference} home preference for work-life balance.`);
  }

  // Hazmat certification - repeat 2x (specialized signal)
  if (profile.hazmat_certified) {
    parts.push(`Hazmat certified. Qualified for hazmat loads.`);
  }

  // Route preferences - repeat 2x (operational signal)
  if (profile.route_preference) {
    const routeStr = profile.route_preference;
    parts.push(`Route type: ${routeStr}. Prefers ${routeStr} work.`);
  }

  // Benefits preferences - repeat 2x (retention signal)
  if (profile.benefits_interest && Array.isArray(profile.benefits_interest)) {
    const benefitsStr = profile.benefits_interest.join(', ');
    parts.push(`Benefits sought: ${benefitsStr}. Interested in 401k and company benefits.`);
  }

  return parts.join('. ') || 'CDL driver profile';
}

/**
 * Build a flat text string from a carrier profile for embedding.
 * Supports both legacy fields (description/home_states) and FMCSA fields
 * (legal_name/state/city/operation_type/turnover_pct/accident_rate).
 * Weights high-signal CDL terms through repetition.
 */
const OP_TYPE = { A: 'for-hire carrier', B: 'for-hire and private carrier', C: 'private carrier' };

export function buildCarrierText(profile) {
  const parts = [];

  // Legal name - primary identifier
  if (profile.legal_name) {
    parts.push(profile.legal_name);
  }

  // Description - expand abbreviations
  if (profile.description && profile.description !== profile.legal_name) {
    parts.push(expandAbbreviations(profile.description));
  }

  // Operation type - repeat 2x (operational model signal)
  if (profile.operation_type) {
    const opTypeStr = OP_TYPE[profile.operation_type] || profile.operation_type;
    parts.push(`${opTypeStr}. Operating as a ${opTypeStr}.`);
  }

  // Location - key for regional/OTR distinction
  if (profile.city && profile.state) {
    parts.push(`Based in ${profile.city}, ${profile.state}`);
  } else if (profile.state) {
    parts.push(`Operating in ${profile.state}`);
  } else if (profile.home_states) {
    const statesStr = Array.isArray(profile.home_states) ? profile.home_states.join(', ') : profile.home_states;
    parts.push(`Operating states: ${statesStr}`);
  }

  // Fleet and driver count - scale signals
  if (profile.fleet_size) {
    parts.push(`Fleet: ${profile.fleet_size} trucks`);
  }
  if (profile.driver_count) {
    parts.push(`Employs ${profile.driver_count} drivers`);
  }

  // Pay - repeat 2-3x (critical for driver matching)
  if (profile.pay_cpm) {
    parts.push(`Pay: $${profile.pay_cpm}/mi. Offers per mile compensation of $${profile.pay_cpm}/mi.`);
  } else if (profile.pay_range_min) {
    const maxPay = profile.pay_range_max || '?';
    parts.push(`Pay: $${profile.pay_range_min}–$${maxPay}/mi. Compensation ranges from $${profile.pay_range_min} to $${maxPay} per mile.`);
  }

  // Safety signals — repeat 2x (driver confidence factors)
  if (profile.turnover_pct != null) {
    parts.push(`Driver turnover: ${profile.turnover_pct}%. Has a turnover rate of ${profile.turnover_pct}%.`);
  }
  if (profile.accident_rate != null) {
    parts.push(`Accident rate: ${profile.accident_rate}. Safety record shows accident rate of ${profile.accident_rate}.`);
  }
  if (profile.avg_truck_age != null) {
    parts.push(`Average truck age: ${profile.avg_truck_age} years`);
  }

  // Haul types - repeat 2-3x (specialty/fit signal)
  if (profile.haul_types) {
    const haulStr = Array.isArray(profile.haul_types) ? profile.haul_types.join(', ') : profile.haul_types;
    parts.push(`Haul types: ${haulStr}. Specializes in ${haulStr} operations. Runs ${haulStr}.`);
  }

  // Benefits and home time - repeat 2x (retention/lifestyle signal)
  if (profile.home_time_policy) {
    parts.push(`Home time: ${profile.home_time_policy}. Supports ${profile.home_time_policy} home time.`);
  }
  if (profile.benefits && Array.isArray(profile.benefits)) {
    const benefitsStr = profile.benefits.join(', ');
    parts.push(`Benefits: ${benefitsStr}. Offers 401k and company benefits including ${benefitsStr}.`);
  }

  // Regional/OTR designation - repeat 2x (route type signal)
  if (profile.route_type) {
    const routeStr = profile.route_type;
    parts.push(`Route type: ${routeStr}. Operates ${routeStr} trucking.`);
  }

  // Dedicated/regional distinction - repeat 2x (dispatch model)
  if (profile.dedicated_routes) {
    parts.push(`Offers dedicated routes. Provides dedicated account driving.`);
  }

  // DOT identifier
  if (profile.dot_number) {
    parts.push(`DOT: ${profile.dot_number}`);
  }

  return parts.join('. ') || 'Carrier profile';
}
