// ============================================================================
// AOS-SHELL — AdminOS Layout Builder
// Renders the powerful vertical command strip and bottom telemetry bar
// ============================================================================

(function () {
    'use strict';

    const CFG = AOS.config;
    const TOOLS = AOS.TOOL_REGISTRY;

    // ── State ──
    let openDrawerId = null; // Only one drawer open at a time in the strip

    window.AOS = window.AOS || {};
    AOS.shell = { init, toggleDrawer, syncNav };

    function init() {
        const root = document.getElementById('aos-root');
        if (!root) { console.error('AOS: #aos-root not found'); return; }

        // Core Layout: Left Strip, Center Canvas, Bottom Telemetry
        root.innerHTML = `
      <div class="flex flex-1 w-full h-[calc(100vh-48px)] overflow-hidden">
        ${buildCommandStrip()}
        <main class="flex-1 bg-solar-base03 overflow-y-auto relative" id="aos-canvas">
          <header class="h-16 border-b border-white/5 flex items-center justify-between px-6 shrink-0 bg-solar-base03 sticky top-0 z-10">
            <div class="flex items-center gap-3">
              <span class="material-symbols-outlined text-solar-blue text-[24px]">${CFG.brand.icon}</span>
              <h1 class="text-lg font-black tracking-widest text-slate-200">${CFG.brand.logo} <span class="text-solar-blue">OS</span></h1>
            </div>
            <div class="flex items-center gap-4">
              <div class="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 flex items-center gap-2 text-[11px] text-slate-300 font-medium cursor-pointer hover:bg-white/10 transition-colors">
                <span class="material-symbols-outlined text-[16px]">search</span> \u2318K Search
              </div>
              <div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
                SA
              </div>
            </div>
          </header>
          <div id="aos-view-container" class="p-6 h-[calc(100%-64px)] overflow-y-auto"></div>
        </main>
      </div>
      ${buildTelemetryBar()}
    `;

        startTelemetryClock();
    }

    // ── Vertical Command Strip ──
    function buildCommandStrip() {
        const drawersHtml = CFG.drawers.map(drawer => {
            const tools = AOS.getDrawerTools(drawer.id);

            const toolItems = tools.map(t => {
                const badge = t.badge ? `<span class="w-1.5 h-1.5 rounded-full bg-red-500 absolute top-2 right-2 ${t.animate ? 'animate-pulse' : ''}"></span>` : '';
                return `
          <div class="aos-tool-item flex flex-col items-center justify-center p-2 mx-2 mb-1 rounded-xl cursor-pointer hover:bg-white/5 transition-colors relative" data-view="${t.view}" onclick="AOS.views.showView('${t.view}')">
            <div class="w-8 h-8 rounded-lg bg-gradient-to-br ${t.gradient} flex items-center justify-center mb-1">
              <span class="material-symbols-outlined text-white text-[16px]">${t.icon}</span>
            </div>
            <span class="text-[9px] font-bold text-slate-400 text-center leading-tight w-full truncate px-1">${t.name}</span>
            ${badge}
          </div>
        `;
            }).join('');

            return `
        <div class="aos-drawer-group mb-2 border-b border-white/5 pb-2 last:border-0 pl-1">
          <div class="aos-drawer-header flex flex-col items-center p-3 cursor-pointer text-slate-500 hover:text-slate-300 transition-colors" onclick="AOS.shell.toggleDrawer('${drawer.id}')" title="${drawer.label}">
            <span class="material-symbols-outlined text-[22px]">${drawer.icon}</span>
            <span class="text-[8px] font-black uppercase tracking-widest mt-1 opacity-60 text-center w-full truncate">${drawer.label.split(' ')[0]}</span>
          </div>
          <div class="aos-drawer-body flex-col hidden" id="dr-${drawer.id}">
            ${toolItems}
          </div>
        </div>
      `;
        }).join('');

        return `
      <aside class="w-24 bg-solar-base02 border-r border-white/5 flex flex-col h-full overflow-y-auto overflow-x-hidden no-scrollbar py-2 shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
        ${drawersHtml}
      </aside>
    `;
    }

    // ── Bottom Telemetry Bar ──
    function buildTelemetryBar() {
        return `
      <div class="h-12 bg-solar-base02 border-t border-white/10 flex items-center justify-between px-4 shrink-0 shadow-[0_-4px_24px_rgba(0,0,0,0.5)] z-30">
        <div class="flex items-center gap-6">
          <div class="flex items-center gap-2 neu-ins bg-solar-base03 px-3 py-1 rounded-md border border-white/5">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span class="text-[10px] font-bold text-slate-300 tracking-wider">SYSTEM: NOMINAL</span>
          </div>
          
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-solar-blue text-[14px]">database</span>
            <span class="text-[10px] text-slate-400 font-mono">DB: <span class="text-emerald-400">12ms</span></span>
          </div>
          
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-cyan-400 text-[14px]">api</span>
            <span class="text-[10px] text-slate-400 font-mono">API: <span class="text-emerald-400">45ms</span></span>
          </div>
          
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-purple-400 text-[14px]">smart_toy</span>
            <span class="text-[10px] text-slate-400 font-mono">LLM: <span class="text-amber-400">850ms</span></span>
          </div>
        </div>
        
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-3 mr-4">
            ${CFG.commands.map(cmd => `
              <button class="w-7 h-7 rounded-md hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors" title="${cmd.label}">
                <span class="material-symbols-outlined text-[16px]">${cmd.icon}</span>
              </button>
            `).join('')}
          </div>
          <div class="w-px h-6 bg-white/10 mx-2"></div>
          <span id="aos-clock" class="text-[11px] font-mono text-slate-400 tracking-wider"></span>
        </div>
      </div>
    `;
    }

    // ── Interactions ──
    function toggleDrawer(id) {
        // Close current if open and different
        if (openDrawerId && openDrawerId !== id) {
            const oldBody = document.getElementById('dr-' + openDrawerId);
            const oldHeader = oldBody.previousElementSibling;
            if (oldBody) {
                oldBody.classList.replace('flex', 'hidden');
                oldHeader.classList.remove('text-solar-blue', 'bg-white/5');
            }
        }

        const body = document.getElementById('dr-' + id);
        const header = body.previousElementSibling;
        if (!body) return;

        if (openDrawerId === id) {
            // Toggle off
            body.classList.replace('flex', 'hidden');
            header.classList.remove('text-solar-blue', 'bg-white/5');
            openDrawerId = null;
        } else {
            // Toggle on
            body.classList.replace('hidden', 'flex');
            header.classList.add('text-solar-blue', 'bg-white/5');
            openDrawerId = id;
        }
    }

    // Keep navigation UI in sync with the current view
    function syncNav(viewId) {
        document.querySelectorAll('.aos-tool-item').forEach(el => {
            if (el.dataset.view === viewId) {
                el.classList.add('bg-white/10', 'ring-1', 'ring-white/20');
                // Ensure parent drawer is open
                const drawerBody = el.closest('.aos-drawer-body');
                if (drawerBody) {
                    const drawerId = drawerBody.id.replace('dr-', '');
                    if (openDrawerId !== drawerId) {
                        toggleDrawer(drawerId);
                    }
                }
            } else {
                el.classList.remove('bg-white/10', 'ring-1', 'ring-white/20');
            }
        });
    }

    function startTelemetryClock() {
        const update = () => {
            const el = document.getElementById('aos-clock');
            if (el) el.textContent = new Date().toISOString().replace('T', ' ').substr(0, 19) + ' UTC';
        };
        update();
        setInterval(update, 1000);
    }

})();
