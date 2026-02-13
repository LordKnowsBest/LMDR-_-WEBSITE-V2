// ============================================================================
// ROS-VIEW-ATTRIBUTION — Source Attribution (Coming Soon)
// ============================================================================

(function() {
  'use strict';

  const VIEW_ID = 'attribution';
  const MESSAGES = [];

  function render() {
    return ROS.views.comingSoonTemplate('Source Attribution', 'pie_chart', 'from-lmdr-dark to-blue-900');
  }

  function onMount() {
    // No-op — coming soon placeholder
  }

  function onUnmount() {
    // No-op — coming soon placeholder
  }

  function onMessage() {
    // No-op — coming soon placeholder
  }

  ROS.views.registerView(VIEW_ID, { render, onMount, onUnmount, onMessage, messages: MESSAGES });
})();
