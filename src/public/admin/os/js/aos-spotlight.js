// ============================================================================
// AOS-SPOTLIGHT — Admin ⌘K Command Palette
// ============================================================================

(function () {
    'use strict';

    window.AOS = window.AOS || {};
    AOS.spotlight = { open, close, filter };

    let isOpen = false;

    /**
     * Build the spotlight DOM structure
     */
    function buildSpotlight() {
        if (document.getElementById('aos-spotlight-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'aos-spotlight-overlay';
        overlay.className = 'fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] hidden flex items-start justify-center pt-32 transition-opacity duration-200 opacity-0';
        overlay.onclick = (e) => {
            if (e.target === overlay) close();
        };

        const box = document.createElement('div');
        box.id = 'aos-spotlight-box';
        box.className = 'w-full max-w-[520px] bg-beige dark:bg-solar-base03 rounded-2xl shadow-2xl border border-black/10 dark:border-white/10 overflow-hidden transform scale-95 opacity-0 transition-all duration-200 mx-4';

        box.innerHTML = `
            <div class="relative flex items-center border-b border-black/5 dark:border-white/5 px-4 h-16">
                <span class="material-symbols-outlined text-slate-400 absolute left-4">search</span>
                <input id="aos-spotlight-input" type="text" class="w-full h-full bg-transparent border-none outline-none pl-10 pr-4 text-lmdr-dark dark:text-solar-bg text-lg placeholder-slate-400 focus:ring-0 neu-in" placeholder="Search tools, views, actions..." autocomplete="off">
                <div class="absolute right-4 flex gap-1 items-center bg-black/5 dark:bg-white/5 rounded mx-1 px-1.5 py-1 text-[10px] font-bold text-slate-400 select-none pointer-events-none">
                    <span class="opacity-80">ESC</span> to Close
                </div>
            </div>
            <div id="aos-spotlight-results" class="max-h-[300px] overflow-y-auto py-2 no-scrollbar">
                <!-- Results go here -->
            </div>
            <div class="bg-black/5 dark:bg-white/5 px-4 h-10 flex items-center border-t border-black/5 dark:border-white/5 text-[11px] text-slate-500 font-medium select-none">
                <span class="flex items-center gap-1"><span class="bg-black/10 dark:bg-white/10 rounded px-1 min-w-[16px] text-center mb-[1px]">↵</span> to Select</span>
                <span class="flex items-center gap-1 ml-4"><span class="bg-black/10 dark:bg-white/10 rounded px-1 min-w-[16px] text-center mb-[1px]">↑</span> <span class="bg-black/10 dark:bg-white/10 rounded px-1 min-w-[16px] text-center mb-[1px]">↓</span> to Navigate</span>
            </div>
        `;

        overlay.appendChild(box);
        document.body.appendChild(overlay);

        const input = document.getElementById('aos-spotlight-input');
        input.addEventListener('input', (e) => filter(e.target.value));
        input.addEventListener('keydown', handleKeydown);
    }

    /**
     * Open the spotlight
     */
    function open() {
        buildSpotlight();
        isOpen = true;

        const overlay = document.getElementById('aos-spotlight-overlay');
        const box = document.getElementById('aos-spotlight-box');
        const input = document.getElementById('aos-spotlight-input');

        overlay.classList.remove('hidden');

        // Trigger generic animation by forcing reflow
        void overlay.offsetWidth;

        overlay.classList.remove('opacity-0');
        overlay.classList.add('opacity-100');

        box.classList.remove('scale-95', 'opacity-0');
        box.classList.add('scale-100', 'opacity-100');

        input.value = '';
        filter(''); // Show all initial

        setTimeout(() => input.focus(), 50);
    }

    /**
     * Close the spotlight
     */
    function close() {
        if (!isOpen) return;
        isOpen = false;

        const overlay = document.getElementById('aos-spotlight-overlay');
        const box = document.getElementById('aos-spotlight-box');

        if (!overlay) return;

        overlay.classList.remove('opacity-100');
        overlay.classList.add('opacity-0');

        box.classList.remove('scale-100', 'opacity-100');
        box.classList.add('scale-95', 'opacity-0');

        setTimeout(() => {
            overlay.classList.add('hidden');
        }, 200);
    }

    /**
     * Filter results
     */
    function filter(query) {
        if (!AOS.TOOL_REGISTRY) return;

        const resultsContainer = document.getElementById('aos-spotlight-results');
        if (!resultsContainer) return;

        const q = query.toLowerCase().trim();

        // Filter logic: match on name or id
        let results = AOS.TOOL_REGISTRY;
        if (q) {
            results = AOS.TOOL_REGISTRY.filter(t =>
                t.name.toLowerCase().includes(q) ||
                t.id.toLowerCase().includes(q)
            );

            // Try matching categories (drawers)
            const matchedDrawers = (AOS.config.drawers || []).filter(d => d.label.toLowerCase().includes(q));
            if (matchedDrawers.length > 0) {
                const extraTools = AOS.TOOL_REGISTRY.filter(t => matchedDrawers.some(d => d.id === t.drawer));
                // Combine unique
                results = [...new Set([...results, ...extraTools])];
            }
        }

        // Limit to 8
        results = results.slice(0, 8);

        if (results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="px-6 py-8 text-center text-slate-400">
                    <span class="material-symbols-outlined text-[32px] opacity-50 mb-2">search_off</span>
                    <p class="text-sm font-medium">No tools found matching "${query}"</p>
                </div>
            `;
            return;
        }

        let html = '';
        results.forEach((tool, index) => {
            const drawerObj = (AOS.config.drawers || []).find(d => d.id === tool.drawer);
            const categoryLabel = drawerObj ? drawerObj.label : 'Application';

            html += `
                <div class="spotlight-item group flex items-center gap-4 px-4 py-2.5 mx-2 rounded-lg cursor-pointer ${index === 0 ? 'bg-black/5 dark:bg-white/5 active-item' : 'hover:bg-black/5 dark:hover:bg-white/5'}" data-view="${tool.view}" onclick="AOS.views.showView('${tool.view}'); AOS.spotlight.close(); AOS.shell.dockNav('${tool.view}')">
                    <div class="w-10 h-10 rounded-xl bg-gradient-to-br ${tool.gradient || 'from-slate-500 to-slate-700'} flex items-center justify-center shadow-sm flex-shrink-0 relative">
                        <span class="material-symbols-outlined text-white text-[20px] drop-shadow-sm">${tool.icon || 'extension'}</span>
                        ${tool.badge ? '<div class="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></div>' : ''}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="text-sm font-bold text-lmdr-dark dark:text-solar-bg truncate tracking-tight group-hover:text-solar-blue transition-colors">${tool.name}</div>
                        <div class="text-[11px] font-medium text-slate-400 truncate tracking-wide uppercase opacity-80">${categoryLabel}</div>
                    </div>
                    <div class="w-6 h-6 rounded flex items-center justify-center opacity-0 group-[.active-item]:opacity-100 group-hover:opacity-100 transition-opacity bg-black/10 dark:bg-white/10 text-slate-500 flex-shrink-0">
                        <span class="material-symbols-outlined text-[14px]">keyboard_return</span>
                    </div>
                </div>
            `;
        });

        resultsContainer.innerHTML = html;

        // Add hover logic to update active class
        const items = resultsContainer.querySelectorAll('.spotlight-item');
        items.forEach(item => {
            item.addEventListener('mouseenter', () => {
                items.forEach(i => i.classList.remove('bg-black/5', 'dark:bg-white/5', 'active-item'));
                item.classList.add('bg-black/5', 'dark:bg-white/5', 'active-item');
            });
        });
    }

    /**
     * Keyboard navigation inside spotlight
     */
    function handleKeydown(e) {
        if (!isOpen) return;

        const resultsContainer = document.getElementById('aos-spotlight-results');
        if (!resultsContainer) return;

        const items = Array.from(resultsContainer.querySelectorAll('.spotlight-item'));
        if (items.length === 0) return;

        const activeIdx = items.findIndex(item => item.classList.contains('active-item'));

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIdx = activeIdx < items.length - 1 ? activeIdx + 1 : 0;
            items.forEach(i => i.classList.remove('bg-black/5', 'dark:bg-white/5', 'active-item'));
            items[nextIdx].classList.add('bg-black/5', 'dark:bg-white/5', 'active-item');
            items[nextIdx].scrollIntoView({ block: 'nearest' });
        }
        else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevIdx = activeIdx > 0 ? activeIdx - 1 : items.length - 1;
            items.forEach(i => i.classList.remove('bg-black/5', 'dark:bg-white/5', 'active-item'));
            items[prevIdx].classList.add('bg-black/5', 'dark:bg-white/5', 'active-item');
            items[prevIdx].scrollIntoView({ block: 'nearest' });
        }
        else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIdx >= 0) {
                const view = items[activeIdx].getAttribute('data-view');
                if (view) {
                    if (window.AOS && window.AOS.views && typeof window.AOS.views.showView === 'function') {
                        window.AOS.views.showView(view);
                    }
                    if (window.AOS && window.AOS.shell && typeof window.AOS.shell.dockNav === 'function') {
                        window.AOS.shell.dockNav(view);
                    }
                    close();
                }
            }
        }
    }

    // Global keyboard listener for open/close
    document.addEventListener('keydown', e => {
        // cmd+k or ctrl+k
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            if (isOpen) close(); else open();
        }
        if (e.key === 'Escape') {
            close();
        }
    });

    // Make spotlight build on init (DOM content loaded)
    window.addEventListener('DOMContentLoaded', () => {
        // Optionally preload the DOM structure
        // buildSpotlight();
    });

})();
