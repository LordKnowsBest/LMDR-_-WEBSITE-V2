/* =========================================
   ADMIN AI ROUTER — Config Module
   No dependencies
   ========================================= */
var AiRouterConfig = (function () {
  'use strict';

  var THEME_KEY = 'lmdr-admin-theme';

  var PROVIDER_ICONS = {
    anthropic: '<i class="fas fa-brain"></i>',
    openai: '<i class="fas fa-robot"></i>',
    groq: '<i class="fas fa-bolt"></i>',
    perplexity: '<i class="fas fa-search"></i>',
    google: '<i class="fab fa-google"></i>',
    mistral: '<i class="fas fa-wind"></i>',
    cohere: '<i class="fas fa-link"></i>'
  };

  var DEFAULT_ICON = '<i class="fas fa-cloud"></i>';

  return {
    THEME_KEY: THEME_KEY,
    PROVIDER_ICONS: PROVIDER_ICONS,
    DEFAULT_ICON: DEFAULT_ICON
  };
})();
