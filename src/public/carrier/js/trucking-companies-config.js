/* =========================================
   TRUCKING COMPANIES — Config Module
   VelocityMatch Carrier Landing Page
   No dependencies
   ========================================= */
var TruckingConfig = (function () {
  'use strict';

  var SUBMISSION_TIMEOUT_MS = 15000;

  var VALIDATORS = {
    contactName: function (value) {
      return { valid: value.trim().length >= 2, message: 'Please enter your name' };
    },
    email: function (value) {
      return { valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), message: 'Please enter a valid email' };
    },
    phone: function (value) {
      return { valid: value.replace(/\D/g, '').length >= 10, message: 'Please enter a valid phone number' };
    },
    driversNeeded: function (value) {
      return { valid: value && value !== '', message: 'Please select drivers needed' };
    }
  };

  var PROGRESSIVE_SECTIONS = ['driverTypesSection', 'equipmentSection', 'companySection', 'notesSection'];

  return {
    SUBMISSION_TIMEOUT_MS: SUBMISSION_TIMEOUT_MS,
    VALIDATORS: VALIDATORS,
    PROGRESSIVE_SECTIONS: PROGRESSIVE_SECTIONS
  };
})();
