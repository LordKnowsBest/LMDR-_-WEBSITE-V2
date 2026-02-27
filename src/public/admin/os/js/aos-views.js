// ============================================================================
// AOS-VIEWS — View Lifecycle Manager
// ============================================================================

(function () {
    'use strict';

    const registry = {};
    let currentViewId = null;

    window.AOS = window.AOS || {};
    AOS.views = { registerView, showView, getCurrentView, routeMessage, comingSoonTemplate };

    /**
     * Register a view module
     */
    function registerView(id, opts) {
        registry[id] = {
            render: opts.render || (() => ''),
            onMount: opts.onMount || (() => { }),
            onUnmount: opts.onUnmount || (() => { }),
            onMessage: opts.onMessage || (() => { }),
            messages: opts.messages || []
        };
    }

    /**
     * Switch to a view
     */
    function showView(id) {
        const container = document.getElementById('aos-view-container');
        if (!container) return;

        const tool = AOS.getToolByView ? AOS.getToolByView(id) : { name: id, gradient: 'from-slate-500 to-slate-700', icon: 'construction' };

        // Fallback: if no view registered, show coming soon
        if (!registry[id]) {
            mountComingSoon(container, tool);
            currentViewId = id;
            if (AOS.shell && AOS.shell.syncNav) AOS.shell.syncNav(id);
            return;
        }

        // Unmount current
        if (currentViewId && registry[currentViewId]) {
            try { registry[currentViewId].onUnmount(); } catch (e) { console.warn('[AOS] unmount error:', e); }
        }

        // Render new view
        const view = registry[id];
        container.innerHTML = `<div class="w-full h-full flex flex-col" style="animation:fadeUp .4s ease">${view.render()}</div>`;

        // Mount
        currentViewId = id;
        try { view.onMount(container.firstElementChild); } catch (e) { console.warn('[AOS] mount error:', e); }

        // Sync UI
        if (AOS.shell && AOS.shell.syncNav) AOS.shell.syncNav(id);
    }

    /**
     * Route an inbound message to the active view
     */
    function routeMessage(type, data) {
        for (const [id, view] of Object.entries(registry)) {
            if (view.messages.includes(type)) {
                try { view.onMessage(type, data); } catch (e) { console.warn('[AOS] message error:', e); }
                return true;
            }
        }
        return false;
    }

    function getCurrentView() { return currentViewId; }

    function comingSoonTemplate(name, icon, gradient) {
        return `
      <div class="coming-soon-card flex flex-col items-center justify-center p-12 text-center h-full">
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient || 'from-slate-600 to-slate-800'} flex items-center justify-center mb-6 neu-s">
          <span class="material-symbols-outlined text-white text-[32px]">${icon || 'construction'}</span>
        </div>
        <h2 class="text-2xl font-black text-white mb-2 tracking-tight">${name}</h2>
        <p class="text-sm text-slate-400 max-w-sm mx-auto">This tool is currently a highly specialized standalone page. We are migrating it to the unified AdminOS framework soon.</p>
        <span class="mt-4 px-3 py-1 bg-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider rounded-md border border-amber-500/30">In Migration Pipeline</span>
      </div>`;
    }

    function mountComingSoon(container, tool) {
        container.innerHTML = `<div class="w-full h-full" style="animation:fadeUp .4s ease">${comingSoonTemplate(tool.name, tool.icon, tool.gradient)}</div>`;
    }

})();
