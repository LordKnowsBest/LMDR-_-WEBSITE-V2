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

        // Update breadcrumb
        const breadcrumb = document.getElementById('aos-breadcrumb-view');

        const tool = AOS.getToolByView ? AOS.getToolByView(id) : null;
        if (breadcrumb && tool) {
            breadcrumb.textContent = tool.name;
        } else if (breadcrumb) {
            breadcrumb.textContent = id;
        }

        // Fallback: if no view registered, show coming soon
        if (!registry[id]) {
            mountComingSoon(container, tool || { name: id, gradient: 'from-slate-500 to-slate-700', icon: 'construction' });
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
      <div class="coming-soon-card flex flex-col items-center justify-center p-12 text-center h-full max-w-md mx-auto">
        <div class="w-20 h-20 rounded-[28px] bg-gradient-to-br ${gradient || 'from-slate-600 to-slate-800'} flex items-center justify-center mb-6 shadow-[8px_8px_16px_rgba(0,0,0,0.1),_-8px_-8px_16px_rgba(255,255,255,0.8)] dark:shadow-[8px_8px_16px_rgba(0,0,0,0.4),_-8px_-8px_16px_rgba(255,255,255,0.05)] border border-white/20 dark:border-white/5">
          <span class="material-symbols-outlined text-white text-[40px] drop-shadow-md">${icon || 'construction'}</span>
        </div>
        <h2 class="text-3xl font-black text-lmdr-dark dark:text-solar-bg mb-3 tracking-tight">${name}</h2>
        <p class="text-[13px] text-lmdr-dark/60 dark:text-solar-bg/60 max-w-sm mx-auto leading-relaxed mb-6 font-medium">This tool is currently a standalone page. It is scheduled to be migrated into the unified AdminOS Hub architecture.</p>
        <div class="neu-s px-4 py-2 bg-beige dark:bg-solar-base02 rounded-full border border-black/5 dark:border-white/5">
            <span class="text-[10px] font-black uppercase tracking-[2px] text-solar-blue">Migration Pending</span>
        </div>
      </div>`;
    }

    function mountComingSoon(container, tool) {
        container.innerHTML = `<div class="w-full h-full flex flex-col items-center justify-center" style="animation:fadeUp .4s ease">${comingSoonTemplate(tool.name, tool.icon, tool.gradient)}</div>`;
    }

})();
