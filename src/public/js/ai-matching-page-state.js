export function createAIMatchingPageState() {
  return {
    cachedUserStatus: null,
    cachedDriverProfile: null,
    cachedDriverInterests: [],
    lastSearchResults: null,
    veloInitDone: false,
    htmlReadyPending: false
  };
}

export function normalizeDriverProfileForHtml(profile) {
  if (!profile) return null;

  return {
    id: profile._id,
    displayName: profile.display_name,
    email: profile.email,
    homeZip: profile.home_zip,
    maxDistance: profile.max_commute_miles,
    minCPM: profile.min_cpm,
    operationType: profile.preferred_operation_type,
    maxTurnover: profile.max_turnover_percent,
    maxTruckAge: profile.max_truck_age_years,
    fleetSize: profile.fleet_size_preference,
    yearsExperience: profile.years_experience,
    cdlClass: profile.cdl_class,
    endorsements: profile.endorsements,
    cleanMVR: profile.clean_mvr,
    completeness: profile.profile_completeness_score,
    totalSearches: profile.total_searches,
    isComplete: profile.is_complete,
    isDiscoverable: profile.is_discoverable,
    missingFields: profile.missing_fields,
    cdl_front_image: profile.cdl_front_image,
    cdl_back_image: profile.cdl_back_image,
    med_card_image: profile.med_card_image,
    resume_file: profile.resume_file
  };
}

export function normalizeAppliedCarriersForHtml(interests = []) {
  return interests.map((interest) => ({
    carrierDOT: interest.carrier_dot,
    carrierName: interest.carrier_name,
    actionType: interest.action_type,
    timestamp: interest.action_timestamp
  }));
}

export function buildPageReadyPayload(state, memberId = null) {
  return {
    userStatus: state.cachedUserStatus,
    memberId: memberId,
    driverProfile: normalizeDriverProfileForHtml(state.cachedDriverProfile),
    appliedCarriers: normalizeAppliedCarriersForHtml(state.cachedDriverInterests)
  };
}
