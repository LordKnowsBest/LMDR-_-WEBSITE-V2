/**
 * FMCSA carrier data researcher.
 *
 * Calls the FMCSA Mobile API to retrieve live carrier safety data.
 * Returns a normalised section object compatible with /v1/research/company.
 *
 * Requires env var: FMCSA_WEB_KEY
 * If the key is absent the section degrades gracefully to { status: 'error' }
 * so the rest of the research report still returns.
 */

const FMCSA_BASE       = 'https://mobile.fmcsa.dot.gov/qc/services';
const FMCSA_TIMEOUT_MS = 8_000;

const RATING_MAP = {
  S: 'Satisfactory',
  C: 'Conditional',
  U: 'Unsatisfactory',
  N: 'Not Rated',
};

/**
 * Fetch carrier safety data from FMCSA.
 * @param {string} dotNumber
 * @returns {Promise<object>} Section result — always resolves (never throws)
 */
export async function fmcsaResearch(dotNumber) {
  const webKey = process.env.FMCSA_WEB_KEY;
  if (!webKey) {
    return { status: 'error', note: 'FMCSA_WEB_KEY not configured' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FMCSA_TIMEOUT_MS);

  let res;
  try {
    res = await fetch(
      `${FMCSA_BASE}/carriers/${encodeURIComponent(dotNumber)}?webKey=${webKey}`,
      {
        headers: { 'Accept': 'application/json' },
        signal:  controller.signal,
      }
    );
  } catch (err) {
    clearTimeout(timer);
    return {
      status: err.name === 'AbortError' ? 'timeout' : 'error',
      note:   err.message,
    };
  }

  clearTimeout(timer);

  if (!res.ok) {
    return { status: 'error', note: `FMCSA API responded ${res.status}` };
  }

  let data;
  try {
    data = await res.json();
  } catch {
    return { status: 'error', note: 'FMCSA response was not valid JSON' };
  }

  // FMCSA returns content as object (not array)
  const carrier = data?.content?.carrier;
  if (!carrier) {
    return { status: 'not_found', note: 'No carrier record found for DOT number' };
  }

  return {
    status:          'ok',
    safetyRating:    RATING_MAP[carrier.safetyRating] || carrier.safetyRating || 'Not Rated',
    operatingStatus: carrier.dotActiveFlag === 'Y' ? 'active' : 'inactive',
    entityType:      carrier.entityType   || null,
    carrierName:     carrier.legalName    || carrier.dbaName || null,
    totalDrivers:    carrier.totalDrivers      != null ? Number(carrier.totalDrivers)      : null,
    powerUnits:      carrier.totalPowerUnits   != null ? Number(carrier.totalPowerUnits)   : null,
    // out-of-service and crash data require the /carriers/{dot}/cargo endpoint
    // surfaced here as nulls so callers know to check SMS for deeper data
    outOfServiceRate: null,
    crashes12mo:      null,
    inspections12mo:  null,
    note: 'crash/OOS data requires FMCSA SMS endpoint',
  };
}
