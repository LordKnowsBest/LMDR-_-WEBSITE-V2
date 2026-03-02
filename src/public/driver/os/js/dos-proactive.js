/**
 * dos-proactive.js
 * ═══════════════════════════════════════════════════════════════════
 * Proactive intelligence insights for DriverOS.
 * Displays AI-generated insight cards fetched from the backend
 * with a skeleton loading state.
 *
 * Depends on: driver-os-bridge.js (DOS.bridge)
 * Provides:  DOS.proactive
 * ═══════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  window.DOS = window.DOS || {};

  var MAX_INSIGHTS = 3;
  var SKELETON_COUNT = 2;
  var FETCH_DELAY_MS = 2000;
  var TIMEOUT_MS = 8000;

  function createIcon(name) {
    var span = document.createElement('span');
    span.className = 'material-symbols-outlined';
    span.textContent = name;
    span.style.fontSize = '24px';
    span.style.color = '#2563eb';
    span.style.flexShrink = '0';
    return span;
  }

  function createSkeleton() {
    var el = document.createElement('div');
    el.className = 'dos-skeleton';
    el.style.height = '60px';
    el.style.borderRadius = '12px';
    el.style.background = 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)';
    el.style.backgroundSize = '200% 100%';
    el.style.animation = 'dos-shimmer 1.5s ease-in-out infinite';
    return el;
  }

  function createInsightCard(insight) {
    var card = document.createElement('div');
    card.className = 'dos-card';
    card.style.display = 'flex';
    card.style.alignItems = 'flex-start';
    card.style.gap = '12px';

    var icon = createIcon(insight.icon || 'lightbulb');
    card.appendChild(icon);

    var text = document.createElement('p');
    text.className = 'dos-text-body';
    text.textContent = insight.text || '';
    text.style.margin = '0';
    card.appendChild(text);

    return card;
  }

  function clearElement(el) {
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }

  function injectShimmerKeyframes() {
    if (document.getElementById('dos-shimmer-style')) return;
    var style = document.createElement('style');
    style.id = 'dos-shimmer-style';
    style.textContent = '@keyframes dos-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }';
    document.head.appendChild(style);
  }

  var proactive = {
    _container: null,
    _fetchTimer: null,
    _timeoutTimer: null,
    _listener: null,
    _resolved: false,

    render: function (containerEl) {
      if (!containerEl) return;
      this._container = containerEl;
      this._resolved = false;

      injectShimmerKeyframes();

      // Show skeleton loaders
      var skeletonWrap = document.createElement('div');
      skeletonWrap.className = 'dos-grid';
      skeletonWrap.setAttribute('data-dos-skeleton', 'proactive');

      for (var i = 0; i < SKELETON_COUNT; i++) {
        skeletonWrap.appendChild(createSkeleton());
      }
      containerEl.appendChild(skeletonWrap);

      var self = this;

      // Register listener for response
      this._listener = function (payload) {
        if (self._resolved) return;
        self._resolved = true;
        clearTimeout(self._timeoutTimer);
        self._renderInsights(payload);
      };

      if (DOS.bridge) {
        DOS.bridge.on('proactiveInsightsLoaded', this._listener);
      }

      // Delay before sending request (show skeleton first)
      this._fetchTimer = setTimeout(function () {
        if (DOS.bridge) {
          DOS.bridge.send('getProactiveInsights', {});
        }
      }, FETCH_DELAY_MS);

      // Timeout: remove skeleton if no response
      this._timeoutTimer = setTimeout(function () {
        if (!self._resolved) {
          self._resolved = true;
          self._removeSkeleton();
        }
      }, TIMEOUT_MS);
    },

    _renderInsights: function (payload) {
      this._removeSkeleton();
      if (!this._container) return;

      var insights = (payload && Array.isArray(payload.insights)) ? payload.insights : [];
      if (insights.length === 0) return;

      var count = Math.min(insights.length, MAX_INSIGHTS);
      var wrap = document.createElement('div');
      wrap.className = 'dos-grid';
      wrap.setAttribute('data-dos-insights', 'proactive');

      for (var i = 0; i < count; i++) {
        wrap.appendChild(createInsightCard(insights[i]));
      }
      this._container.appendChild(wrap);
    },

    _removeSkeleton: function () {
      if (!this._container) return;
      var skeleton = this._container.querySelector('[data-dos-skeleton="proactive"]');
      if (skeleton && skeleton.parentNode) {
        skeleton.parentNode.removeChild(skeleton);
      }
    },

    destroy: function () {
      clearTimeout(this._fetchTimer);
      clearTimeout(this._timeoutTimer);
      this._resolved = true;

      if (DOS.bridge && this._listener) {
        DOS.bridge.off('proactiveInsightsLoaded', this._listener);
        this._listener = null;
      }

      if (this._container) {
        var skeleton = this._container.querySelector('[data-dos-skeleton="proactive"]');
        if (skeleton && skeleton.parentNode) skeleton.parentNode.removeChild(skeleton);
        var insights = this._container.querySelector('[data-dos-insights="proactive"]');
        if (insights && insights.parentNode) insights.parentNode.removeChild(insights);
        this._container = null;
      }
    }
  };

  DOS.proactive = proactive;

})();
