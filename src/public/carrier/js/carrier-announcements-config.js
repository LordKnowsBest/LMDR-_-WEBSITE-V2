/* =========================================
   CARRIER ANNOUNCEMENTS — Config Module
   VelocityMatch Carrier Portal
   No dependencies
   ========================================= */
var AnnouncementsConfig = (function () {
  'use strict';

  var TABS = ['published', 'scheduled', 'draft', 'archived'];

  var PRIORITY_COLORS = {
    urgent: 'bg-red-500/20 text-red-200',
    important: 'bg-amber-500/20 text-amber-200',
    normal: 'bg-emerald-500/20 text-emerald-200'
  };

  var AUDIENCE_PRESETS = {
    all: { type: 'all', segments: [] },
    state: { type: 'segment', segments: [{ field: 'state', operator: 'equals', value: 'TX' }] },
    experience: { type: 'segment', segments: [{ field: 'years_experience', operator: 'greater_than_or_equal', value: 3 }] }
  };

  var ALLOWED_ATTACHMENT_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/plain'];
  var MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;

  return {
    TABS: TABS,
    PRIORITY_COLORS: PRIORITY_COLORS,
    AUDIENCE_PRESETS: AUDIENCE_PRESETS,
    ALLOWED_ATTACHMENT_TYPES: ALLOWED_ATTACHMENT_TYPES,
    MAX_ATTACHMENT_BYTES: MAX_ATTACHMENT_BYTES
  };
})();
