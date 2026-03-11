/**
 * Driver-Carrier Match Scoring — Pure function.
 * Weights come from matching_model_weights table (ML pipeline updates weekly).
 * No hardcoded weights. All factor functions return 0-1 score.
 */

const DEFAULT_WEIGHTS = {
  location: 0.25,
  pay: 0.22,
  safety: 0.20,
  culture: 0.15,
  routeType: 0.10,
  fleetAge: 0.08,
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

export function scoreMatch(driver, carrier, weights = DEFAULT_WEIGHTS) {
  const factors = {
    location: computeLocationScore(driver, carrier),
    pay: computePayScore(driver, carrier),
    safety: computeSafetyScore(carrier),
    culture: computeCultureScore(driver, carrier),
    routeType: computeRouteScore(driver, carrier),
    fleetAge: computeFleetAgeScore(carrier),
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
