// ============================================================================
// ROS-PROACTIVE — Proactive AI Insight Push
// On home view load, fires a delayed agent call to surface 2-3 actionable
// insight bullets. Renders as cards in #ros-proactive-insights.
// Only fires once per session (loaded guard).
// ============================================================================

(function () {
  'use strict';

  ROS.proactive = { init: init, trigger: trigger };

  var _loaded = false;

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    // Patch bridge routing to intercept proactiveInsightsLoaded
    var _orig = ROS.views.routeMessage;
    ROS.views.routeMessage = function (type, data) {
      if (type === 'proactiveInsightsLoaded') { _applyInsights(data); return true; }
      return _orig(type, data);
    };
  }

  // ── Trigger — call from home view after render ────────────────────────────
  function trigger(context) {
    if (_loaded) return;
    // 2-second delay — don't block initial render
    setTimeout(function () {
      ROS.bridge.sendToVelo('getProactiveInsights', { context: context || {} });
    }, 2000);
  }

  // ── Apply insight data ────────────────────────────────────────────────────
  function _applyInsights(data) {
    _loaded = true;
    var insights = (data && data.insights) || [];
    if (!insights.length) return;
    _renderInsights(insights);
  }

  // ── Render insight cards ──────────────────────────────────────────────────
  function _renderInsights(insights) {
    var target = document.getElementById('ros-proactive-insights');
    if (!target) return;

    while (target.firstChild) target.removeChild(target.firstChild);

    insights.forEach(function (text) {
      var card = document.createElement('div');
      card.className = 'ros-insight-card';
      card.textContent = text;
      target.appendChild(card);
    });

    target.classList.remove('hidden');
    target.style.display = 'flex';
  }

})();
