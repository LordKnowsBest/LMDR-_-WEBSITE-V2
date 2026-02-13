// ============================================================================
// ROS-VIEWS — View Lifecycle Manager
// register, mount, unmount, showView, comingSoonTemplate
// ============================================================================

(function() {
  'use strict';

  const registry = {};
  let currentViewId = null;

  ROS.views = { registerView, showView, getCurrentView, comingSoonTemplate };

  /**
   * Register a view module
   * @param {string} id - View identifier (e.g. 'search', 'pipeline')
   * @param {object} opts - { render, onMount, onUnmount, onMessage, messages }
   */
  function registerView(id, opts) {
    registry[id] = {
      render: opts.render || (() => ''),
      onMount: opts.onMount || (() => {}),
      onUnmount: opts.onUnmount || (() => {}),
      onMessage: opts.onMessage || (() => {}),
      messages: opts.messages || []
    };
  }

  /**
   * Switch to a view — unmounts current, mounts new with fade
   * @param {string} id - View ID to switch to
   */
  function showView(id) {
    const container = document.getElementById('ros-view-container');
    if (!container) return;

    // Check if tool is 'future' status and has no registered view
    const tool = ROS.getTool(id);
    if (!registry[id] && tool && tool.status === 'future') {
      mountComingSoon(container, tool);
      currentViewId = id;
      if (ROS.shell && ROS.shell.syncDock) ROS.shell.syncDock(id);
      if (ROS.shell && ROS.shell.closeMobileRail) ROS.shell.closeMobileRail();
      return;
    }

    // Fallback: if no view registered, show coming soon with generic info
    if (!registry[id]) {
      mountComingSoon(container, { name: id, icon: 'construction', gradient: 'from-slate-500 to-slate-700' });
      currentViewId = id;
      if (ROS.shell && ROS.shell.syncDock) ROS.shell.syncDock(id);
      return;
    }

    // Unmount current
    if (currentViewId && registry[currentViewId]) {
      try { registry[currentViewId].onUnmount(); } catch (e) { console.warn('ROS unmount error:', e); }
    }

    // Render new view
    const view = registry[id];
    container.innerHTML = `<div class="center-view active flex-col" style="animation:fadeUp .4s ease">${view.render()}</div>`;

    // Mount
    currentViewId = id;
    try { view.onMount(container.firstElementChild); } catch (e) { console.warn('ROS mount error:', e); }

    // Sync dock
    if (ROS.shell && ROS.shell.syncDock) ROS.shell.syncDock(id);
    if (ROS.shell && ROS.shell.closeMobileRail) ROS.shell.closeMobileRail();
  }

  /**
   * Route an inbound message to the active view
   * @param {string} type - Message type
   * @param {*} data - Message payload
   */
  ROS.views.routeMessage = function(type, data) {
    // Route to whichever view declared this message type
    for (const [id, view] of Object.entries(registry)) {
      if (view.messages.includes(type)) {
        try { view.onMessage(type, data); } catch (e) { console.warn('ROS message error:', e); }
        return true;
      }
    }
    return false;
  };

  function getCurrentView() { return currentViewId; }

  /**
   * "Coming Soon" placeholder card
   */
  function comingSoonTemplate(name, icon, gradient) {
    return `
      <div class="coming-soon-card">
        <div class="cs-icon bg-gradient-to-br ${gradient}">
          <span class="material-symbols-outlined">${icon}</span>
        </div>
        <h2>${name}</h2>
        <p>This tool is being built for a future release. It will appear here when ready.</p>
        <span class="coming-soon-badge">Coming Soon</span>
        <button onclick="ROS.views.showView('home')" class="mt-4 px-5 py-2.5 rounded-xl neu-s text-[12px] font-bold text-tan hover:text-lmdr-blue transition-colors">
          <span class="material-symbols-outlined text-[14px] align-middle mr-1">arrow_back</span>Back to Home
        </button>
      </div>`;
  }

  function mountComingSoon(container, tool) {
    const gradient = tool.gradient || 'from-slate-500 to-slate-700';
    const icon = tool.icon || 'construction';
    const name = tool.name || tool.id || 'Unknown Tool';
    container.innerHTML = `<div class="center-view active flex-col items-center justify-center h-full" style="animation:fadeUp .4s ease">${comingSoonTemplate(name, icon, gradient)}</div>`;
  }

})();
