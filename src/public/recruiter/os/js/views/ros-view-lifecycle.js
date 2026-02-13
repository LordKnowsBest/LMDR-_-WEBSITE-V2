// ============================================================================
// ROS-VIEW-LIFECYCLE — Lifecycle Monitor (Coming Soon)
// ============================================================================

(function() {
  'use strict';

  const VIEW_ID = 'lifecycle';
  const MESSAGES = [];

  function render() {
    return ROS.views.comingSoonTemplate('Lifecycle Monitor', 'monitoring', 'from-slate-800 to-slate-900');
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
