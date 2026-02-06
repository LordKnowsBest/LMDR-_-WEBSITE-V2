/**
 * Driver Scoring Module for Reverse Matching Engine
 *
 * Scores drivers against carrier hiring preferences using weighted criteria.
 * This module mirrors the carrier scoring approach but evaluates drivers
 * against carrier requirements.
 *
 * @module backend/driverScoring
 */

/**
 * Default weights for driver scoring (must sum to 100)
 */
const DEFAULT_WEIGHTS = {
  qualifications: 30,   // CDL type, endorsements, clean record
  experience: 20,       // Years driving, equipment familiarity
  location: 20,         // Distance from carrier terminals
  availability: 15,     // Ready now vs. 30-day notice
  salaryFit: 10,        // Driver expectation vs. carrier offer
  engagement: 5         // Platform activity, response rate
};

/**
 * Filter boost multipliers - how much to boost weight when filter is active
 */
const FILTER_BOOST_MULTIPLIERS = {
  cdl_types: { affects: 'qualifications', boost: 1.5 },
  endorsements: { affects: 'qualifications', boost: 2.0 },
  min_experience: { affects: 'experience', boost: 1.5 },
  zip_code: { affects: 'location', boost: 1.5 },
  radius_miles: { affects: 'location', boost: 1.3 },
  availability: { affects: 'availability', boost: 1.5 }
};

/**
 * Normalizes weights to sum to 100
 * @param {Object} weights - Raw weights object
 * @returns {Object} Normalized weights summing to 100
 */
const normalizeWeights = (weights) => {
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  if (sum === 0) return { ...DEFAULT_WEIGHTS };

  const normalized = {};
  for (const key of Object.keys(weights)) {
    normalized[key] = Math.round((weights[key] / sum) * 100);
  }

  // Ensure sum is exactly 100 (handle rounding errors)
  const normalizedSum = Object.values(normalized).reduce((a, b) => a + b, 0);
  if (normalizedSum !== 100) {
    const diff = 100 - normalizedSum;
    // Add/subtract difference to largest weight
    const largestKey = Object.keys(normalized).reduce((a, b) =>
      normalized[a] > normalized[b] ? a : b
    );
    normalized[largestKey] += diff;
  }

  return normalized;
};

/**
 * Calculates dynamic weights based on carrier preferences AND active filters
 *
 * Layer 1: Carrier Hiring Preferences (what this carrier values)
 * Layer 2: Active Filter Boosting (what recruiter prioritizes in this search)
 *
 * @param {Object} carrierPrefs - Carrier hiring preferences from CarrierHiringPreferences collection
 * @param {Object} activeFilters - Currently active search filters from the UI
 * @returns {Object} Dynamic weights object normalized to 100
 */
const calculateDynamicWeights = (carrierPrefs = {}, activeFilters = {}) => {
  // Start with default weights
  let weights = { ...DEFAULT_WEIGHTS };

  // =========================================================================
  // LAYER 1: Apply Carrier Preference Weights (if defined)
  // =========================================================================
  // Carriers can set custom weights in CarrierHiringPreferences collection
  // Fields: weight_qualifications, weight_experience, weight_location, etc.

  if (carrierPrefs) {
    // Check for custom carrier weights
    if (typeof carrierPrefs.weight_qualifications === 'number' && carrierPrefs.weight_qualifications > 0) {
      weights.qualifications = carrierPrefs.weight_qualifications;
    }
    if (typeof carrierPrefs.weight_experience === 'number' && carrierPrefs.weight_experience > 0) {
      weights.experience = carrierPrefs.weight_experience;
    }
    if (typeof carrierPrefs.weight_location === 'number' && carrierPrefs.weight_location > 0) {
      weights.location = carrierPrefs.weight_location;
    }
    if (typeof carrierPrefs.weight_availability === 'number' && carrierPrefs.weight_availability > 0) {
      weights.availability = carrierPrefs.weight_availability;
    }
    if (typeof carrierPrefs.weight_salaryFit === 'number' && carrierPrefs.weight_salaryFit > 0) {
      weights.salaryFit = carrierPrefs.weight_salaryFit;
    }
    if (typeof carrierPrefs.weight_engagement === 'number' && carrierPrefs.weight_engagement > 0) {
      weights.engagement = carrierPrefs.weight_engagement;
    }
  }

  // =========================================================================
  // LAYER 2: Apply Filter Boosts (active filters get priority)
  // =========================================================================
  // When a recruiter actively selects a filter, that criteria matters MORE
  // to them for THIS specific search - boost its weight accordingly

  if (activeFilters) {
    // CDL type filter active - boost qualifications
    if (activeFilters.cdl_types && Array.isArray(activeFilters.cdl_types) && activeFilters.cdl_types.length > 0) {
      weights.qualifications *= FILTER_BOOST_MULTIPLIERS.cdl_types.boost;
    }

    // Endorsements filter active - boost qualifications more significantly
    if (activeFilters.endorsements && Array.isArray(activeFilters.endorsements) && activeFilters.endorsements.length > 0) {
      weights.qualifications *= FILTER_BOOST_MULTIPLIERS.endorsements.boost;
    }

    // Experience filter active - boost experience weight
    if (activeFilters.min_experience && typeof activeFilters.min_experience === 'number') {
      weights.experience *= FILTER_BOOST_MULTIPLIERS.min_experience.boost;
    }

    // Location filters active - boost location weight
    if (activeFilters.zip_code && typeof activeFilters.zip_code === 'string' && activeFilters.zip_code.length > 0) {
      weights.location *= FILTER_BOOST_MULTIPLIERS.zip_code.boost;
    }
    if (activeFilters.radius_miles && typeof activeFilters.radius_miles === 'number' && activeFilters.radius_miles < 100) {
      // Tighter radius = more emphasis on location
      weights.location *= FILTER_BOOST_MULTIPLIERS.radius_miles.boost;
    }

    // Availability filter active - boost availability weight
    if (activeFilters.availability && typeof activeFilters.availability === 'string') {
      weights.availability *= FILTER_BOOST_MULTIPLIERS.availability.boost;
    }
  }

  // Normalize to 100 and return
  return normalizeWeights(weights);
};

/**
 * Availability score mapping based on urgency level
 */
const AVAILABILITY_SCORES = {
  immediate: { immediate: 100, '2_week': 70, '30_day': 40, ongoing: 80 },
  '2_week': { immediate: 100, '2_week': 100, '30_day': 70, ongoing: 90 },
  '30_day': { immediate: 100, '2_week': 100, '30_day': 100, ongoing: 100 },
  ongoing: { immediate: 100, '2_week': 90, '30_day': 80, ongoing: 100 }
};

/**
 * Score driver qualifications against carrier requirements
 * Evaluates: CDL type match, endorsement match, violations
 *
 * @param {Object} driver - Driver profile
 * @param {Object} preferences - Carrier hiring preferences
 * @returns {number} Score from 0-100
 */
const scoreQualifications = (driver, preferences) => {
  // Handle null/undefined inputs
  if (!driver || !preferences) {
    return 0;
  }

  const driverCdl = driver.cdl_class;
  const requiredCdlTypes = preferences.required_cdl_types || [];
  const requiredEndorsements = preferences.required_endorsements || [];
  const driverEndorsements = driver.endorsements || [];

  // CDL type check - must match one of the required types
  if (requiredCdlTypes.length > 0 && !requiredCdlTypes.includes(driverCdl)) {
    return 0;
  }

  // If no CDL class specified on driver, fail
  if (!driverCdl) {
    return 0;
  }

  let score = 100;

  // Endorsement scoring
  if (requiredEndorsements.length > 0) {
    const matchedEndorsements = requiredEndorsements.filter(
      endorsement => driverEndorsements.includes(endorsement)
    );
    const endorsementRatio = matchedEndorsements.length / requiredEndorsements.length;

    // If no endorsements match when some are required, return 0
    if (endorsementRatio === 0) {
      return 0;
    }

    // Partial endorsement match reduces score proportionally
    score = Math.round(endorsementRatio * 100);
  }

  // Violation penalties
  if (driver.violations && driver.violations > 0) {
    const severity = driver.violation_severity || 'minor';
    if (severity === 'major') {
      // Major violations: 50 point penalty per violation
      score = Math.max(0, score - (driver.violations * 50));
    } else {
      // Minor violations: 15 point penalty per violation
      score = Math.max(0, score - (driver.violations * 15));
    }
  }

  return Math.round(score);
};

/**
 * Score driver experience against carrier requirements
 * Evaluates: Years of experience, equipment familiarity
 *
 * @param {Object} driver - Driver profile
 * @param {Object} preferences - Carrier hiring preferences
 * @returns {number} Score from 0-100
 */
const scoreExperience = (driver, preferences) => {
  // Handle null/undefined inputs
  if (!driver || !preferences) {
    return 0;
  }

  const driverYears = driver.years_experience;
  const minYears = preferences.min_experience_years;
  const maxYears = preferences.max_experience_years;
  const requiredEquipment = preferences.equipment_types || [];
  const driverEquipment = driver.equipment_experience || [];

  // If driver has null/undefined/0 years and a minimum is required
  if ((driverYears === null || driverYears === undefined || driverYears === 0) && minYears && minYears > 0) {
    return 0;
  }

  // Handle null years_experience with no minimum requirement
  if (driverYears === null || driverYears === undefined) {
    // If there's no minimum requirement, allow but score based on equipment
    if (!minYears) {
      return scoreEquipmentOnly(driverEquipment, requiredEquipment);
    }
    return 0;
  }

  // Handle zero experience
  if (driverYears === 0 && minYears && minYears > 0) {
    return 0;
  }

  let experienceScore = 100;

  // Check minimum experience
  if (minYears && driverYears < minYears) {
    // Score proportionally based on how close to minimum
    experienceScore = Math.round((driverYears / minYears) * 100);
  }

  // Check maximum experience (some carriers prefer less experienced drivers)
  if (maxYears && driverYears > maxYears) {
    // Penalize but don't zero out - 30 point penalty
    experienceScore = Math.max(50, experienceScore - 30);
  }

  // Equipment familiarity bonus/penalty
  if (requiredEquipment.length > 0) {
    const matchedEquipment = requiredEquipment.filter(
      equip => driverEquipment.includes(equip)
    );
    const equipmentRatio = matchedEquipment.length / requiredEquipment.length;

    // Blend experience score with equipment match (70% experience, 30% equipment)
    const equipmentScore = equipmentRatio * 100;
    experienceScore = Math.round(experienceScore * 0.7 + equipmentScore * 0.3);
  }

  // Handle undefined equipment_experience - reduce score
  if (driverEquipment === undefined || driverEquipment === null) {
    experienceScore = Math.round(experienceScore * 0.5);
  }

  return Math.min(100, Math.max(0, experienceScore));
};

/**
 * Helper to score equipment only when experience data is missing
 */
const scoreEquipmentOnly = (driverEquipment, requiredEquipment) => {
  if (!requiredEquipment || requiredEquipment.length === 0) {
    return 100;
  }
  if (!driverEquipment || driverEquipment.length === 0) {
    return 50;
  }
  const matched = requiredEquipment.filter(e => driverEquipment.includes(e));
  return Math.round((matched.length / requiredEquipment.length) * 100);
};

/**
 * Score driver location against carrier preferences
 * Evaluates: ZIP code match, distance from terminals, state match
 *
 * @param {Object} driver - Driver profile
 * @param {Object} preferences - Carrier hiring preferences
 * @returns {number} Score from 0-100
 */
const scoreLocation = (driver, preferences) => {
  // Handle null/undefined inputs
  if (!driver || !preferences) {
    return 0;
  }

  const driverZip = driver.home_zip;
  const targetZips = preferences.target_zip_codes || [];
  const targetStates = preferences.target_states || [];
  const radiusMiles = preferences.target_radius_miles || 100; // Default 100 miles

  // Invalid or missing driver ZIP
  if (!driverZip || typeof driverZip !== 'string' || driverZip === 'invalid') {
    return 0;
  }

  // Validate ZIP format (basic check - 5 digits for US)
  if (!/^\d{5}(-\d{4})?$/.test(driverZip)) {
    return 0;
  }

  // Extract state from ZIP code (simplified US ZIP to state mapping)
  const driverState = getStateFromZip(driverZip);

  // State filtering - if target states specified and driver not in them
  if (targetStates.length > 0 && driverState && !targetStates.includes(driverState)) {
    return 0;
  }

  // Exact ZIP match
  if (targetZips.length > 0 && targetZips.includes(driverZip)) {
    return 100;
  }

  // If no target ZIPs specified but driver is in target state or no state requirement
  if (targetZips.length === 0) {
    if (targetStates.length === 0 || (driverState && targetStates.includes(driverState))) {
      return 100;
    }
    return 50; // Default middle score for unknown location match
  }

  // Calculate approximate distance based on ZIP prefix similarity
  // This is a simplified calculation - in production would use geocoding
  const closestDistance = estimateDistance(driverZip, targetZips);

  // Score based on distance within radius
  if (closestDistance > radiusMiles) {
    return 0;
  }

  // Linear score decay based on distance
  const distanceScore = Math.round(100 * (1 - closestDistance / radiusMiles));
  return Math.max(0, Math.min(100, distanceScore));
};

/**
 * Simplified state lookup from ZIP code prefix
 */
const getStateFromZip = (zip) => {
  const prefix = parseInt(zip.substring(0, 3), 10);

  // Texas ZIPs: 75xxx-79xxx
  if (prefix >= 750 && prefix <= 799) return 'TX';
  // California ZIPs: 90xxx-96xxx
  if (prefix >= 900 && prefix <= 961) return 'CA';
  // Oklahoma ZIPs: 73xxx-74xxx
  if (prefix >= 730 && prefix <= 749) return 'OK';
  // Georgia ZIPs: 30xxx-31xxx
  if (prefix >= 300 && prefix <= 319) return 'GA';
  // Florida ZIPs: 32xxx-34xxx
  if (prefix >= 320 && prefix <= 349) return 'FL';
  // South Carolina ZIPs: 29xxx
  if (prefix >= 290 && prefix <= 299) return 'SC';
  // Louisiana ZIPs: 70xxx-71xxx
  if (prefix >= 700 && prefix <= 714) return 'LA';

  return null;
};

/**
 * Estimate distance between driver ZIP and target ZIPs
 * Simplified calculation based on ZIP prefix for demonstration
 * In production, this would use actual geocoding/distance calculation
 */
const estimateDistance = (driverZip, targetZips) => {
  const driverPrefix = parseInt(driverZip.substring(0, 3), 10);

  let minDistance = Infinity;

  for (const targetZip of targetZips) {
    const targetPrefix = parseInt(targetZip.substring(0, 3), 10);
    const prefixDiff = Math.abs(driverPrefix - targetPrefix);

    // Rough estimation: each prefix difference ~= 30 miles average
    // This is a simplification - real implementation would use geocoding
    const estimatedDistance = prefixDiff * 30;
    minDistance = Math.min(minDistance, estimatedDistance);
  }

  return minDistance === Infinity ? 1000 : minDistance;
};

/**
 * Score driver availability against carrier urgency
 * Evaluates: How well driver availability matches carrier timeline
 *
 * @param {Object} driver - Driver profile
 * @param {Object} preferences - Carrier hiring preferences
 * @returns {number} Score from 0-100
 */
const scoreAvailability = (driver, preferences) => {
  // Handle null/undefined inputs
  if (!driver || !preferences) {
    return 0;
  }

  const driverAvailability = driver.availability;
  const carrierUrgency = preferences.urgency;

  // If no urgency specified, any availability is fine
  if (!carrierUrgency) {
    return 100;
  }

  // If driver availability is null, return middle score
  if (!driverAvailability) {
    return 50;
  }

  // Check for unknown/invalid availability value
  const validAvailabilities = ['immediate', '2_week', '30_day'];
  if (!validAvailabilities.includes(driverAvailability)) {
    return 0;
  }

  // Get score from mapping
  const urgencyScores = AVAILABILITY_SCORES[carrierUrgency];
  if (!urgencyScores) {
    // Unknown urgency - default to accepting any availability
    return driverAvailability === 'immediate' ? 100 :
           driverAvailability === '2_week' ? 80 : 60;
  }

  return urgencyScores[driverAvailability] || 50;
};

/**
 * Score salary fit between driver expectation and carrier offer
 * Evaluates: Whether carrier pay meets driver expectations
 *
 * @param {Object} driver - Driver profile
 * @param {Object} preferences - Carrier hiring preferences
 * @returns {number} Score from 0-100
 */
const scoreSalaryFit = (driver, preferences) => {
  // Handle null/undefined inputs
  if (!driver || !preferences) {
    return 0;
  }

  const driverExpectation = driver.min_cpm_expectation;
  const offeredMin = preferences.offered_pay_min;
  const offeredMax = preferences.offered_pay_max;

  // If driver has no expectation, any offer works
  if (driverExpectation === null || driverExpectation === undefined || driverExpectation === 0) {
    return 100;
  }

  // If carrier has no pay info, return neutral score
  if ((offeredMin === null || offeredMin === undefined) &&
      (offeredMax === null || offeredMax === undefined)) {
    return 50;
  }

  // Determine the effective offer range
  const effectiveMax = offeredMax !== null && offeredMax !== undefined ? offeredMax : offeredMin;
  const effectiveMin = offeredMin !== null && offeredMin !== undefined ? offeredMin : offeredMax;

  // If offer meets or exceeds expectation, perfect score
  if (effectiveMax >= driverExpectation) {
    return 100;
  }

  // Calculate how close the max offer is to driver expectation
  const gap = driverExpectation - effectiveMax;
  const gapPercentage = gap / driverExpectation;

  // Score based on gap - smaller gap = higher score
  if (gapPercentage <= 0.05) {
    // Within 5% - still pretty good
    return 85;
  } else if (gapPercentage <= 0.10) {
    // Within 10%
    return 70;
  } else if (gapPercentage <= 0.15) {
    // Within 15%
    return 50;
  } else if (gapPercentage <= 0.25) {
    // Within 25%
    return 25;
  } else {
    // More than 25% gap
    return 0;
  }
};

/**
 * Score driver engagement on the platform
 * Evaluates: Login recency, profile completeness, response rate
 *
 * @param {Object} driver - Driver profile
 * @returns {number} Score from 0-100
 */
const scoreEngagement = (driver) => {
  // Handle null/undefined driver
  if (!driver) {
    return 0;
  }

  const lastActive = driver.last_active_date;
  const profileScore = driver.profile_completeness_score;
  const responseRate = driver.response_rate;

  // Missing last active date is a critical issue
  if (!lastActive) {
    return 0;
  }

  // Calculate days since last active
  const now = new Date();
  const lastActiveDate = new Date(lastActive);
  const daysSinceActive = Math.floor((now - lastActiveDate) / (1000 * 60 * 60 * 24));

  // Recency score (50% weight)
  let recencyScore;
  if (daysSinceActive <= 0) {
    recencyScore = 100;
  } else if (daysSinceActive <= 3) {
    recencyScore = 95;
  } else if (daysSinceActive <= 7) {
    recencyScore = 80;
  } else if (daysSinceActive <= 14) {
    recencyScore = 60;
  } else if (daysSinceActive <= 30) {
    recencyScore = 40;
  } else if (daysSinceActive <= 60) {
    recencyScore = 20;
  } else if (daysSinceActive <= 90) {
    recencyScore = 10;
  } else {
    recencyScore = 5;
  }

  // Profile completeness score (30% weight)
  const completenessScore = profileScore !== null && profileScore !== undefined ?
    profileScore : 50;

  // Response rate score (20% weight) - if available
  let responseScore = 70; // Default if not available
  if (responseRate !== null && responseRate !== undefined) {
    responseScore = Math.round(responseRate * 100);
  }

  // Weighted combination
  const totalScore = Math.round(
    recencyScore * 0.5 +
    completenessScore * 0.3 +
    responseScore * 0.2
  );

  return Math.min(100, Math.max(0, totalScore));
};

/**
 * Calculate overall weighted driver match score
 *
 * Now supports dynamic weighting based on:
 * 1. Carrier hiring preferences (what the carrier values)
 * 2. Active search filters (what the recruiter prioritizes in this search)
 *
 * @param {Object} driver - Driver profile
 * @param {Object} preferences - Carrier hiring preferences
 * @param {Object} weights - Optional custom weights (defaults to dynamic calculation)
 * @param {Object} activeFilters - Optional active search filters for dynamic boosting
 * @returns {Object} Result with overallScore, component scores, and metadata
 */
const calculateDriverMatchScore = (driver, preferences, weights = null, activeFilters = null) => {
  // Handle null/undefined inputs
  if (!driver) {
    return {
      overallScore: 0,
      error: 'Invalid driver'
    };
  }

  if (!preferences) {
    return {
      overallScore: 0,
      error: 'Invalid preferences'
    };
  }

  // Check if driver is searchable
  if (driver.is_searchable === false || driver.visibility_level === 'hidden') {
    return {
      overallScore: 0,
      error: 'Driver not searchable',
      driverId: driver._id,
      preferenceId: preferences._id
    };
  }

  // Determine weights to use - now supports dynamic calculation!
  let effectiveWeights = DEFAULT_WEIGHTS;
  let normalizedWeights = DEFAULT_WEIGHTS;
  let weightSource = 'default';

  if (weights && Object.keys(weights).length > 0) {
    // Explicit weights passed - use them (legacy behavior)
    const weightSum = Object.values(weights).reduce((a, b) => a + b, 0);
    if (weightSum > 0 && weightSum !== 100) {
      normalizedWeights = {};
      for (const key of Object.keys(weights)) {
        normalizedWeights[key] = Math.round((weights[key] / weightSum) * 100);
      }
      effectiveWeights = normalizedWeights;
    } else if (weightSum === 100) {
      effectiveWeights = weights;
      normalizedWeights = weights;
    }
    weightSource = 'explicit';
  } else {
    // No explicit weights - use dynamic calculation based on:
    // 1. Carrier preferences (what this carrier values)
    // 2. Active filters (what recruiter prioritizes in this search)
    effectiveWeights = calculateDynamicWeights(preferences, activeFilters);
    normalizedWeights = effectiveWeights;
    weightSource = 'dynamic';
  }

  // Calculate individual scores
  const scores = {
    qualifications: scoreQualifications(driver, preferences),
    experience: scoreExperience(driver, preferences),
    location: scoreLocation(driver, preferences),
    availability: scoreAvailability(driver, preferences),
    salaryFit: scoreSalaryFit(driver, preferences),
    engagement: scoreEngagement(driver)
  };

  // Calculate weighted overall score
  let overallScore = 0;
  for (const [category, score] of Object.entries(scores)) {
    const weight = effectiveWeights[category] || 0;
    overallScore += score * (weight / 100);
  }

  const baseScore = Math.round(overallScore);

  // Check for mutual match boost
  const isMutualMatch = driver.hasExpressedInterest === true &&
                        driver.interestCarrierDot === preferences.carrier_dot;

  let finalScore = baseScore;
  let mutualMatchBoost = 0;

  if (isMutualMatch) {
    mutualMatchBoost = 10;
    finalScore = Math.min(100, baseScore + mutualMatchBoost);
  }

  return {
    overallScore: finalScore,
    baseScore: isMutualMatch ? baseScore : finalScore,
    scores,
    weights: effectiveWeights,
    normalizedWeights,
    weightSource, // 'default', 'explicit', or 'dynamic'
    driverId: driver._id,
    preferenceId: preferences._id,
    isMutualMatch,
    mutualMatchBoost: isMutualMatch ? mutualMatchBoost : 0
  };
};

/**
 * Generate human-readable rationale for match score
 *
 * @param {Object} scores - Component scores from calculateDriverMatchScore
 * @param {Object} driver - Driver profile
 * @param {Object} preferences - Carrier hiring preferences
 * @returns {Object} Rationale with summary, points, and concerns
 */
const generateDriverMatchRationale = (scores, driver, preferences) => {
  // Handle null/undefined inputs
  if (!scores) {
    return {
      summary: 'Unable to generate rationale',
      points: [],
      error: 'Invalid scores'
    };
  }

  if (!driver) {
    return {
      summary: 'Unable to generate rationale',
      points: [],
      error: 'Invalid driver'
    };
  }

  if (!preferences) {
    return {
      summary: 'Unable to generate rationale',
      points: [],
      error: 'Invalid preferences'
    };
  }

  const points = [];
  const concerns = [];

  // Check for mutual match
  const isMutualMatch = driver.hasExpressedInterest === true &&
                        driver.interestCarrierDot === preferences.carrier_dot;

  if (isMutualMatch) {
    points.push('This driver has already expressed interest in your company');
  }

  // Qualification explanations
  if (scores.qualifications !== undefined) {
    if (scores.qualifications >= 100) {
      const endorsements = preferences.required_endorsements || [];
      if (endorsements.length > 0) {
        points.push(`Holds Class ${driver.cdl_class} CDL with ${endorsements.join(' and ')} endorsements you require`);
      } else {
        points.push(`Holds required Class ${driver.cdl_class} CDL`);
      }
    } else if (scores.qualifications >= 50) {
      const driverEndorsements = driver.endorsements || [];
      const requiredEndorsements = preferences.required_endorsements || [];
      const hasEndorsements = driverEndorsements.filter(e => requiredEndorsements.includes(e));
      const missingEndorsements = requiredEndorsements.filter(e => !driverEndorsements.includes(e));
      if (hasEndorsements.length > 0 && missingEndorsements.length > 0) {
        points.push(`Has ${hasEndorsements.join(', ')} endorsement but missing ${missingEndorsements.join(', ')} endorsement`);
      }
    } else if (scores.qualifications < 50 && scores.qualifications > 0) {
      concerns.push('Missing required endorsements');
    }
  }

  // Location explanations
  if (scores.location !== undefined) {
    if (scores.location >= 100) {
      const targetZips = preferences.target_zip_codes || [];
      if (targetZips.includes(driver.home_zip)) {
        points.push('Home ZIP matches your target location in Dallas');
      } else {
        points.push('Located within your target area');
      }
    } else if (scores.location >= 50) {
      points.push('Located within reasonable distance from your terminal');
    } else if (scores.location < 50 && scores.location > 0) {
      points.push(`Located ${Math.round((100 - scores.location) / 10) * 10} miles from your Dallas terminal`);
    } else if (scores.location === 0) {
      concerns.push('Driver is located outside your preferred radius');
    }
  }

  // Experience explanations
  if (scores.experience !== undefined) {
    if (scores.experience >= 100) {
      const minYears = preferences.min_experience_years;
      if (minYears) {
        points.push(`${driver.years_experience} years OTR experience exceeds your ${minYears}-year minimum`);
      } else {
        points.push(`${driver.years_experience} years of driving experience`);
      }

      const requiredEquipment = preferences.equipment_types || [];
      const driverEquipment = driver.equipment_experience || [];
      const matchedEquipment = requiredEquipment.filter(e => driverEquipment.includes(e));
      if (matchedEquipment.length > 0) {
        points.push(`Experienced with ${matchedEquipment.join(', ')} equipment`);
      }
      if (matchedEquipment.length === requiredEquipment.length && requiredEquipment.length > 0) {
        points.push('Has experience with all your required equipment types');
      }
    } else if (scores.experience < 50) {
      concerns.push('Experience level may not meet requirements');
    }
  }

  // Availability explanations
  if (scores.availability !== undefined) {
    if (scores.availability >= 100) {
      points.push('Available to start immediately');
    } else if (scores.availability < 70 && scores.availability > 0) {
      const driverAvail = driver.availability === '30_day' ? '30 days' :
                          driver.availability === '2_week' ? '2 weeks' : driver.availability;
      const carrierUrgency = preferences.urgency === 'immediate' ? 'immediate start' :
                             preferences.urgency === '2_week' ? '2 weeks' : preferences.urgency;
      concerns.push(`Available in ${driverAvail} but you need ${carrierUrgency}`);
    }
  }

  // Salary explanations
  if (scores.salaryFit !== undefined) {
    if (scores.salaryFit >= 100 && driver.min_cpm_expectation && preferences.offered_pay_max) {
      points.push(`Pay expectation ($${driver.min_cpm_expectation.toFixed(2)}/mi) within your range`);
    } else if (scores.salaryFit < 50 && scores.salaryFit >= 0) {
      const driverExp = driver.min_cpm_expectation;
      const maxOffer = preferences.offered_pay_max;
      if (driverExp && maxOffer) {
        concerns.push(`Pay expectation ($${driverExp.toFixed(2)}/mi) exceeds your max offer ($${maxOffer.toFixed(2)}/mi)`);
      } else {
        concerns.push('Pay expectation may exceed your budget');
      }
    }
  }

  // Engagement explanations
  if (scores.engagement !== undefined && scores.engagement < 50) {
    concerns.push('Limited platform activity recently');
  }

  // Generate summary based on overall assessment
  const avgScore = Object.values(scores).reduce((a, b) => a + (b || 0), 0) / Object.keys(scores).length;

  let summary;
  let overallAssessment;

  if (avgScore >= 85) {
    summary = 'Excellent match - meets all key criteria with strong experience';
    overallAssessment = 'highly_recommended';
  } else if (avgScore >= 70) {
    summary = 'Good match - meets most requirements with some considerations';
    overallAssessment = 'recommended';
  } else if (avgScore >= 50) {
    summary = 'Partial match - some criteria met but gaps exist';
    overallAssessment = 'consider';
  } else if (avgScore >= 30) {
    summary = 'Limited match - several key criteria not met';
    overallAssessment = 'not_recommended';
  } else {
    summary = 'Poor match - does not meet core requirements';
    overallAssessment = 'not_recommended';
  }

  if (isMutualMatch) {
    summary = 'Mutual match - driver has expressed interest';
  }

  return {
    summary,
    points,
    concerns: concerns.length > 0 ? concerns : undefined,
    overallAssessment,
    isMutualMatch
  };
};

// ============================================================================
// CARRIER FEEDBACK WEIGHT ADJUSTMENT (Phase 2 - Call Outcomes)
// ============================================================================

/**
 * Fetch carrier-specific feedback weights from CallFeedback table
 * @param {string} carrierDot - Carrier DOT number
 * @returns {Object|null} { positive_weight, negative_weight } or null if no feedback data
 */
const getCarrierFeedbackWeights = async (carrierDot) => {
  try {
    const dataAccess = require('backend/dataAccess');

    const result = await dataAccess.queryRecords('callFeedback', {
      filters: { carrier_dot: String(carrierDot) },
      limit: 1,
      suppressAuth: true
    });

    return result.items?.[0] || null;
  } catch (err) {
    console.warn('[driverScoring] getCarrierFeedbackWeights failed:', err.message);
    return null;
  }
};

/**
 * Apply feedback-based adjustments to scoring weights, capped at ±20%
 * @param {Object} baseWeights - Original scoring weights
 * @param {Object} feedbackWeights - { positive_weight, negative_weight } from CallFeedback
 * @returns {Object} Adjusted weights (same structure as baseWeights)
 */
const applyFeedbackAdjustments = (baseWeights, feedbackWeights) => {
  if (!feedbackWeights) return baseWeights;

  const positiveAdj = Math.min(0.20, feedbackWeights.positive_weight || 0);
  const negativeAdj = Math.min(0.20, feedbackWeights.negative_weight || 0);

  // Net adjustment factor: positive boosts engagement + qualifications, negative reduces salary fit
  const adjusted = { ...baseWeights };

  // Boost qualifications weight when positive outcomes correlate
  if (adjusted.weight_qualifications !== undefined) {
    adjusted.weight_qualifications = Math.round(
      adjusted.weight_qualifications * (1 + positiveAdj)
    );
  }

  // Reduce salary_fit weight when negative outcomes suggest pay mismatch isn't the issue
  if (adjusted.weight_salary_fit !== undefined) {
    adjusted.weight_salary_fit = Math.round(
      adjusted.weight_salary_fit * (1 - negativeAdj)
    );
  }

  // Boost engagement weight to reward drivers who are actively responding
  if (adjusted.weight_engagement !== undefined) {
    adjusted.weight_engagement = Math.round(
      adjusted.weight_engagement * (1 + positiveAdj * 0.5)
    );
  }

  return adjusted;
};

module.exports = {
  DEFAULT_WEIGHTS,
  FILTER_BOOST_MULTIPLIERS,
  normalizeWeights,
  calculateDynamicWeights,
  scoreQualifications,
  scoreExperience,
  scoreLocation,
  scoreAvailability,
  scoreSalaryFit,
  scoreEngagement,
  calculateDriverMatchScore,
  generateDriverMatchRationale,
  getCarrierFeedbackWeights,
  applyFeedbackAdjustments
};
