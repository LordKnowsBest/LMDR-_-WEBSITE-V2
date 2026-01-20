// ============================================================================
// SCORING MODULE - Pure functions for carrier matching
// These functions have no side effects and can be unit tested
// ============================================================================

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  freeUserMaxResults: 2,
  premiumUserMaxResults: 10,
  defaultMaxDistance: 100,

  weights: {
    location: 25,
    pay: 20,
    operationType: 15,
    turnover: 12,
    safety: 10,
    truckAge: 8,
    fleetSize: 5,
    qualityScore: 5
  }
};

// ============================================================================
// FIELD MAPPING - Matches your actual Wix Collection field IDs
// ============================================================================

const FIELD_MAPPING = {
  DOT_NUMBER: ['dot_number'],
  LEGAL_NAME: ['legal_name', 'title'],
  DBA_NAME: ['dba_name'],
  PHY_CITY: ['phy_city'],
  PHY_STATE: ['phy_state'],
  PHY_ZIP: ['phy_zip'],
  TELEPHONE: ['telephone'],
  EMAIL_ADDRESS: ['email_address'],
  CARRIER_OPERATION: ['carrier_operation'],
  NBR_POWER_UNIT: ['nbr_power_unit'],
  DRIVER_TOTAL: ['driver_total'],
  RECENT_MILEAGE: ['recent_mileage'],
  PAY_CPM: ['pay_cpm'],
  TURNOVER_PERCENT: ['turnover_percent'],
  ACCIDENT_RATE: ['accident_rate'],
  AVG_TRUCK_AGE: ['avg_truck_age'],
  COMBINED_SCORE: ['combined_score'],
  RECRUITMENT_SCORE: ['recruitment_score'],
  FLEET_SCORE: ['fleetScore'],
  Client_Carriers: ['clientCarriers'],
  Client_Carriers_2: ['clientCarriers2']
};

// ============================================================================
// FIELD GETTER - Safely extracts field values from raw Wix data
// ============================================================================

function getField(carrier, fieldKey, defaultValue = null) {
  const possibleNames = FIELD_MAPPING[fieldKey] || [fieldKey.toLowerCase()];

  for (const name of possibleNames) {
    const value = carrier[name];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  return defaultValue;
}

// ============================================================================
// NORMALIZE CARRIER - Converts raw Wix data to consistent internal format
// ============================================================================

function normalizeCarrier(rawCarrier) {
  let legalName = getField(rawCarrier, 'LEGAL_NAME');
  if (!legalName) {
    legalName = getField(rawCarrier, 'DBA_NAME');
  }
  if (!legalName) {
    legalName = rawCarrier.title || 'Unknown Carrier';
  }

  return {
    DOT_NUMBER: getField(rawCarrier, 'DOT_NUMBER'),
    LEGAL_NAME: legalName,
    DBA_NAME: getField(rawCarrier, 'DBA_NAME'),
    PHY_CITY: getField(rawCarrier, 'PHY_CITY') || '',
    PHY_STATE: getField(rawCarrier, 'PHY_STATE') || '',
    PHY_ZIP: getField(rawCarrier, 'PHY_ZIP') || '',
    TELEPHONE: getField(rawCarrier, 'TELEPHONE'),
    EMAIL_ADDRESS: getField(rawCarrier, 'EMAIL_ADDRESS'),
    NBR_POWER_UNIT: parseInt(getField(rawCarrier, 'NBR_POWER_UNIT', 0)) || 0,
    DRIVER_TOTAL: parseInt(getField(rawCarrier, 'DRIVER_TOTAL', 1)) || 1,
    RECENT_MILEAGE: parseFloat(getField(rawCarrier, 'RECENT_MILEAGE', 0)) || 0,
    PAY_CPM: parseFloat(getField(rawCarrier, 'PAY_CPM', 0)) || 0,
    TURNOVER_PERCENT: parseFloat(getField(rawCarrier, 'TURNOVER_PERCENT', 0)) || 0,
    ACCIDENT_RATE: parseFloat(getField(rawCarrier, 'ACCIDENT_RATE', 0)) || 0,
    AVG_TRUCK_AGE: parseFloat(getField(rawCarrier, 'AVG_TRUCK_AGE', 0)) || 0,
    COMBINED_SCORE: parseFloat(getField(rawCarrier, 'COMBINED_SCORE', 50)) || 50,
    isClient: getField(rawCarrier, 'Client_Carriers', false) || getField(rawCarrier, 'Client_Carriers_2', false),
    _raw: rawCarrier
  };
}

// ============================================================================
// SCORING FUNCTIONS
// ============================================================================

function estimateDistanceFromZips(zip1, zip2) {
  if (!zip1 || !zip2) return 500;
  if (String(zip1) === String(zip2)) return 0;
  const prefix1 = String(zip1).substring(0, 3);
  const prefix2 = String(zip2).substring(0, 3);
  if (prefix1 === prefix2) return 15;
  const diff = Math.abs(parseInt(prefix1) - parseInt(prefix2));
  return Math.min(diff * 50, 500);
}

function inferOperationType(carrier) {
  const recentMileage = carrier.RECENT_MILEAGE || 0;
  const driverTotal = carrier.DRIVER_TOTAL || 1;
  const avgMiles = recentMileage / driverTotal;
  if (avgMiles > 100000) return 'OTR';
  if (avgMiles > 50000) return 'Regional';
  return 'Local';
}

function categorizeFleetSize(powerUnits) {
  const units = parseInt(powerUnits) || 0;
  if (units < 50) return 'small';
  if (units < 500) return 'medium';
  return 'large';
}

function scoreLocation(driverZip, carrierZip, maxDistance) {
  const distance = estimateDistanceFromZips(driverZip, carrierZip);
  if (distance > maxDistance) return 0;
  return Math.max(0, (1 - (distance / maxDistance)) * 100);
}

function scorePay(carrierCPM, minCPM) {
  if (!carrierCPM || carrierCPM === 0) return 50;
  if (carrierCPM < minCPM) return 20;
  let score = 60;
  score += Math.min(40, (carrierCPM - minCPM) * 100);
  return Math.min(100, score);
}

function scoreOperationType(inferredType, preferredType) {
  if (!preferredType || preferredType === 'no_preference') return 80;
  if (inferredType === preferredType) return 100;
  const map = {
    'OTR': { 'Regional': 40, 'Local': 10 },
    'Regional': { 'OTR': 50, 'Local': 60 },
    'Local': { 'Regional': 50, 'OTR': 10 }
  };
  return map[preferredType]?.[inferredType] || 20;
}

function scoreTurnover(turnover, max) {
  if (!turnover || turnover === 0) return 50;
  if (turnover > max) return 10;
  return (1 - (turnover / 100)) * 100;
}

function scoreSafety(rate) {
  if (rate === 0) return 100;
  if (!rate) return 50;
  if (rate > 5) return 10;
  return Math.max(0, 100 - (rate * 50));
}

function scoreTruckAge(age, max) {
  if (!age || age === 0) return 50;
  if (age > max) return 10;
  return (1 - (age / max)) * 100;
}

function scoreFleetSize(units, pref) {
  const cat = categorizeFleetSize(units);
  if (!pref || pref === 'no_preference') return 80;
  if (cat === pref) return 100;
  return 40;
}

/**
 * Generate human-readable rationale for the match
 */
function generateMatchRationale(scores, driver, carrier) {
  const rationales = [];

  // Pay Rationale
  if (scores.pay >= 90) {
    rationales.push(`Excellent pay: $${carrier.PAY_CPM.toFixed(2)} CPM exceeds your target.`);
  } else if (scores.pay >= 70) {
    rationales.push("Competitive pay that meets your minimum requirements.");
  } else if (scores.pay < 40 && carrier.PAY_CPM > 0) {
    rationales.push(`Pay ($${carrier.PAY_CPM.toFixed(2)}) is below your preferred minimum.`);
  }

  // Location Rationale
  if (scores.location >= 95) {
    rationales.push("Perfect location: Carrier is in your immediate home area.");
  } else if (scores.location >= 70) {
    rationales.push("Good commute: Carrier is within your comfortable driving range.");
  }

  // Operation Type Rationale
  if (scores.operationType >= 95) {
    rationales.push(`Matches your preference for ${driver.operationType || 'this operation'} runs.`);
  }

  // Safety Rationale
  if (scores.safety >= 90) {
    rationales.push("Strong safety record: Low accident and violation rates.");
  }

  // Truck Age Rationale
  if (scores.truckAge >= 90) {
    rationales.push("Modern fleet: Trucks are newer on average.");
  }

  return rationales;
}

function calculateMatchScore(driver, rawCarrier, weights = CONFIG.weights) {
  const carrier = normalizeCarrier(rawCarrier);
  const inferredOpType = inferOperationType(carrier);

  const scores = {
    location: scoreLocation(driver.homeZip, carrier.PHY_ZIP, driver.maxDistance || 100),
    pay: scorePay(carrier.PAY_CPM, driver.minCPM || 0),
    operationType: scoreOperationType(inferredOpType, driver.operationType),
    turnover: scoreTurnover(carrier.TURNOVER_PERCENT, driver.maxTurnover || 100),
    safety: scoreSafety(carrier.ACCIDENT_RATE),
    truckAge: scoreTruckAge(carrier.AVG_TRUCK_AGE, driver.maxTruckAge || 10),
    fleetSize: scoreFleetSize(carrier.NBR_POWER_UNIT, driver.fleetSize),
    qualityScore: carrier.COMBINED_SCORE || 50
  };

  let totalWeight = 0;
  let weightedScore = 0;

  for (const [key, score] of Object.entries(scores)) {
    if (weights[key]) {
      weightedScore += score * weights[key];
      totalWeight += weights[key];
    }
  }

  const overallScore = totalWeight > 0 ? weightedScore / totalWeight : 0;
  const rationale = generateMatchRationale(scores, driver, carrier);

  return {
    overallScore: Math.round(overallScore),
    scores,
    rationale,
    inferredOpType,
    carrier
  };
}

// ============================================================================
// EXPORTS (CommonJS for Jest compatibility)
// ============================================================================

module.exports = {
  CONFIG,
  FIELD_MAPPING,
  getField,
  normalizeCarrier,
  estimateDistanceFromZips,
  inferOperationType,
  categorizeFleetSize,
  scoreLocation,
  scorePay,
  scoreOperationType,
  scoreTurnover,
  scoreSafety,
  scoreTruckAge,
  scoreFleetSize,
  calculateMatchScore,
  generateMatchRationale
};
