/* =========================================
   TRUCK DRIVER PAGE — Config Module
   No dependencies
   ========================================= */
var TruckDriverConfig = (function () {
  'use strict';

  var STEPS = [
    { id: 'step-contact', label: 'Contact' },
    { id: 'step-experience', label: 'Experience' },
    { id: 'step-documents', label: 'Documents' }
  ];

  var ENDORSEMENT_OPTIONS = [
    { value: 'H', label: 'Hazmat (H)' },
    { value: 'N', label: 'Tanker (N)' },
    { value: 'P', label: 'Passenger (P)' },
    { value: 'S', label: 'School Bus (S)' },
    { value: 'T', label: 'Doubles/Triples (T)' },
    { value: 'X', label: 'HazMat+Tank (X)' }
  ];

  var CDL_CLASSES = [
    { value: 'A', label: 'Class A' },
    { value: 'B', label: 'Class B' },
    { value: 'C', label: 'Class C' }
  ];

  var RUN_TYPES = [
    { value: 'OTR', label: 'OTR (Long Haul)', icon: 'fa-road' },
    { value: 'Regional', label: 'Regional', icon: 'fa-map' },
    { value: 'Local', label: 'Home Daily', icon: 'fa-house' },
    { value: 'any', label: 'Any', icon: 'fa-check-double' }
  ];

  var EXPERIENCE_OPTIONS = [
    { value: '0', label: 'Student / No CDL experience' },
    { value: '1', label: '< 1 year' },
    { value: '2', label: '1-3 years' },
    { value: '5', label: '3-5 years' },
    { value: '10', label: '5-10 years' },
    { value: '15', label: '10+ years' }
  ];

  var REQUIRED_DOCS = [
    { id: 'cdlFront', label: 'CDL Front', icon: 'fa-id-card', accept: 'image/*,.pdf' },
    { id: 'cdlBack', label: 'CDL Back', icon: 'fa-id-card-clip', accept: 'image/*,.pdf' },
    { id: 'medCard', label: 'DOT Medical Card', icon: 'fa-file-medical', accept: 'image/*,.pdf' }
  ];

  var MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  var MESSAGE_TYPES = {
    SUBMIT: 'submitQuickApply',
    OCR: 'extractDocumentOCR',
    PAGE_READY: 'pageReady',
    CARRIER_READY: 'carrierMatchingReady',
    QUICK_APPLY_READY: 'quickApplyReady',
    QUICK_APPLY_FORM_READY: 'quickApplyFormReady'
  };

  var PROTOCOL_VERSION = 'truck-driver-v2';

  var ALLOWED_PARENT_ORIGIN_PATTERNS = [
    /^https:\/\/www\.lastmiledr\.app$/i,
    /^https:\/\/[^/]+\.wixsite\.com$/i,
    /^https:\/\/[^/]+\.wixstudio\.com$/i,
    /^https:\/\/[^/]+\.wix\.com$/i
  ];

  var OCR_DOC_TYPES = {
    cdlFront: 'CDL_FRONT',
    cdlBack: 'CDL_BACK',
    medCard: 'MED_CARD'
  };

  return {
    STEPS: STEPS,
    ENDORSEMENT_OPTIONS: ENDORSEMENT_OPTIONS,
    CDL_CLASSES: CDL_CLASSES,
    RUN_TYPES: RUN_TYPES,
    EXPERIENCE_OPTIONS: EXPERIENCE_OPTIONS,
    REQUIRED_DOCS: REQUIRED_DOCS,
    MAX_FILE_SIZE: MAX_FILE_SIZE,
    MESSAGE_TYPES: MESSAGE_TYPES,
    OCR_DOC_TYPES: OCR_DOC_TYPES,
    PROTOCOL_VERSION: PROTOCOL_VERSION,
    ALLOWED_PARENT_ORIGIN_PATTERNS: ALLOWED_PARENT_ORIGIN_PATTERNS
  };
})();
