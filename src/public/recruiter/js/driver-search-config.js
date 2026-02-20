/* =========================================
   RECRUITER DRIVER SEARCH — Config Module
   No dependencies
   ========================================= */
var DriverSearchConfig = (function () {
  'use strict';

  var DEBUG = true;
  var VELO_TIMEOUT = 30000;
  var PAGE_SIZE = 5;

  var DEFAULT_WEIGHTS = {
    qualifications: 30,
    experience: 20,
    location: 20,
    availability: 15,
    salaryFit: 10,
    engagement: 5
  };

  var PRESETS = {
    otr_heavy_haul: { qualifications: 35, experience: 25, location: 10, availability: 15, salaryFit: 10, engagement: 5 },
    regional_dedicated: { qualifications: 25, experience: 15, location: 30, availability: 15, salaryFit: 10, engagement: 5 },
    local_pd: { qualifications: 20, experience: 10, location: 40, availability: 20, salaryFit: 5, engagement: 5 },
    tanker_hazmat: { qualifications: 45, experience: 20, location: 15, availability: 10, salaryFit: 5, engagement: 5 },
    flatbed_stepdeck: { qualifications: 30, experience: 25, location: 15, availability: 15, salaryFit: 10, engagement: 5 }
  };

  var SOURCE_CLASS_MAP = {
    scored_drivers: 'source-scored',
    applications: 'source-application',
    fb_campaign: 'source-fb-campaign',
    legacy_leads: 'source-legacy-lead'
  };

  var MESSAGE_REGISTRY = {
    inbound: [
      'saveSearchResult',
      'savedSearchesLoaded',
      'savedSearchExecuted',
      'savedSearchDeleted',
      'savedSearchUpdated',
      'getWeightPreferencesResult',
      'saveWeightPreferencesResult',
      'recruiterProfile'
    ],
    outbound: [
      'driverSearchReady',
      'searchDrivers',
      'viewDriverProfile',
      'saveDriver',
      'contactDriver',
      'getQuotaStatus',
      'generateAIDraft',
      'saveSearch',
      'loadSavedSearches',
      'runSavedSearch',
      'deleteSavedSearch',
      'getWeightPreferences',
      'saveWeightPreferences',
      'navigateTo'
    ]
  };

  return {
    DEBUG: DEBUG,
    VELO_TIMEOUT: VELO_TIMEOUT,
    PAGE_SIZE: PAGE_SIZE,
    DEFAULT_WEIGHTS: DEFAULT_WEIGHTS,
    PRESETS: PRESETS,
    SOURCE_CLASS_MAP: SOURCE_CLASS_MAP,
    MESSAGE_REGISTRY: MESSAGE_REGISTRY
  };
})();
