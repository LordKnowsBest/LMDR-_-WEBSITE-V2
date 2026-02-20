/* =========================================
   ADMIN PLATFORM CONFIG — Config Module
   No dependencies
   ========================================= */
var PlatformConfigConfig = (function () {
  'use strict';

  var CARRIER_WEIGHT_LABELS = {
    location: 'Home Location Match',
    pay: 'Pay / CPM Target',
    operationType: 'Operation Type (OTR/Reg/Local)',
    turnover: 'Carrier Turnover Rate',
    safety: 'Safety Rating & Accident Rate',
    truckAge: 'Average Fleet Truck Age',
    fleetSize: 'Carrier Fleet Size',
    qualityScore: 'AI Match Quality Score'
  };

  var DRIVER_WEIGHT_LABELS = {
    qualifications: 'CDL & Endorsements',
    experience: 'Years of Experience',
    location: 'Distance from Carrier',
    availability: 'Availability Timeline',
    salaryFit: 'Salary Expectations',
    engagement: 'Platform Activity'
  };

  return {
    CARRIER_WEIGHT_LABELS: CARRIER_WEIGHT_LABELS,
    DRIVER_WEIGHT_LABELS: DRIVER_WEIGHT_LABELS
  };
})();
