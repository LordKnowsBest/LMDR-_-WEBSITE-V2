/**
 * Driver-Carrier Match Scoring — Pure function.
 * Weights come from matching_model_weights table (ML pipeline updates weekly).
 * No hardcoded weights. All factor functions return 0-1 score.
 */

const DEFAULT_WEIGHTS = {
  location: 0.23,
  pay: 0.20,
  safety: 0.18,
  culture: 0.14,
  routeType: 0.09,
  fleetAge: 0.08,
  engagement: 0.08,
};

function computeLocationScore(driver, carrier) {
  if (!driver.home_state || !carrier.state) return 0.5;
  if (driver.home_state === carrier.state) {
    if (driver.home_city && carrier.city && driver.home_city.toLowerCase() === carrier.city.toLowerCase()) return 1.0;
    return 0.8;
  }
  return 0.3;
}

function computePayScore(driver, carrier) {
  const driverMin = parseFloat(driver.min_cpm || driver.minimum_pay) || 0.45;
  const carrierPay = parseFloat(carrier.avg_cpm || carrier.pay_per_mile) || 0.50;
  if (carrierPay >= driverMin) return 1.0;
  const ratio = carrierPay / driverMin;
  return Math.max(0, ratio);
}

function computeSafetyScore(carrier) {
  const oosRate = parseFloat(carrier.vehicle_oos_rate || carrier.oos_rate) || 0;
  if (oosRate <= 5) return 1.0;
  if (oosRate >= 30) return 0.0;
  return 1.0 - ((oosRate - 5) / 25);
}

function computeCultureScore(driver, carrier) {
  const sentiment = parseFloat(carrier.sentiment_score || carrier.culture_score) || 50;
  return sentiment / 100;
}

function computeRouteScore(driver, carrier) {
  const pref = (driver.preferred_route || driver.route_type || '').toLowerCase();
  const offers = (carrier.route_types || carrier.run_type || '').toLowerCase();
  if (!pref || !offers) return 0.5;
  if (offers.includes(pref)) return 1.0;
  return 0.3;
}

function computeFleetAgeScore(carrier) {
  const age = parseFloat(carrier.avg_truck_age || carrier.equipment_age) || 5;
  if (age <= 2) return 1.0;
  if (age >= 10) return 0.2;
  return 1.0 - ((age - 2) / 10);
}

/**
 * Compute engagement score (0-1) from driver gamification data.
 * Components:
 *   total_xp:           0-2000 maps to 0-0.50
 *   streak_days:        0-30   maps to 0-0.25
 *   documents_uploaded:  0-5   maps to 0-0.15
 *   completeness_score: 0-100  maps to 0-0.10
 * If no engagement data exists, returns 0.3 (neutral default).
 */
export function computeEngagementScore(driver) {
  const totalXp = parseFloat(driver.total_xp) || 0;
  const streakDays = parseFloat(driver.streak_days) || 0;
  const docsUploaded = parseFloat(driver.documents_uploaded) || 0;
  const completeness = parseFloat(driver.completeness_score) || 0;

  // Check if driver has any engagement data at all
  const hasData = totalXp > 0 || streakDays > 0 || docsUploaded > 0 || completeness > 0;
  if (!hasData) return 0.3; // neutral default for new drivers

  const xpComponent = Math.min(totalXp / 2000, 1.0) * 0.50;
  const streakComponent = Math.min(streakDays / 30, 1.0) * 0.25;
  const docsComponent = Math.min(docsUploaded / 5, 1.0) * 0.15;
  const completenessComponent = Math.min(completeness / 100, 1.0) * 0.10;

  return Math.min(xpComponent + streakComponent + docsComponent + completenessComponent, 1.0);
}

export function scoreMatch(driver, carrier, weights = DEFAULT_WEIGHTS) {
  const factors = {
    location: computeLocationScore(driver, carrier),
    pay: computePayScore(driver, carrier),
    safety: computeSafetyScore(carrier),
    culture: computeCultureScore(driver, carrier),
    routeType: computeRouteScore(driver, carrier),
    fleetAge: computeFleetAgeScore(carrier),
    engagement: computeEngagementScore(driver),
  };

  let total = 0;
  for (const [key, value] of Object.entries(factors)) {
    total += value * (weights[key] || 0);
  }

  return { score: Math.round(total * 100), factors };
}

export function rankMatches(driver, carriers, weights = DEFAULT_WEIGHTS) {
  return carriers
    .map(carrier => ({
      carrier,
      ...scoreMatch(driver, carrier, weights),
    }))
    .sort((a, b) => b.score - a.score);
}

export { DEFAULT_WEIGHTS };
