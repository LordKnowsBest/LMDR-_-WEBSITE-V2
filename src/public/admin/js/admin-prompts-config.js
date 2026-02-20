/* =========================================
   ADMIN PROMPTS — Config Module
   No dependencies
   ========================================= */
var AdminPromptsConfig = (function () {
  'use strict';

  var THEME_KEY = 'lmdr-admin-theme';

  var VALID_ACTIONS = [
    'promptsLoaded', 'promptLoaded', 'promptCreated', 'promptUpdated',
    'promptDeleted', 'promptRestored', 'promptRolledBack',
    'categoriesLoaded', 'seedComplete', 'actionError', 'init'
  ];

  return {
    THEME_KEY: THEME_KEY,
    VALID_ACTIONS: VALID_ACTIONS
  };
})();
