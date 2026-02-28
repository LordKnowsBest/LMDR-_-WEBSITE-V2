// ============================================================================
// AOS-SHELL — AdminOS Layout Builder
// Implements the 5-zone approved design (Topbar, Left Rail, Workspace, Copilot, Command Bar, Dock)
// ============================================================================

(function () {
  'use strict';

  const CFG = AOS.config;
  const TOOLS = AOS.TOOL_REGISTRY;

  window.AOS = window.AOS || {};
  AOS.shell = {
    init,
    syncNav,
    dockNav,
    toggleTheme,
    toggleCopilot,
    toggleVoice,
    openDrawerPanel,
    closeDrawerPanel,
    toggleDrawer
  };

  // ── Init ──
  function init() {
    const root = document.getElementById('aos-root');
    if (!root) { console.error('AOS: #aos-root not found'); return; }

    root.innerHTML = buildLayout();

    startClock();
    syncThemeIcon();

    // Close drawer panel if clicked outside
    document.addEventListener('click', (e) => {
      const panel = document.getElementById('aos-drawer-panel');
      const moreBtn = document.getElementById('aosMoreOrb');
      if (panel && !panel.classList.contains('hidden')) {
        if (!panel.contains(e.target) && (!moreBtn || !moreBtn.contains(e.target))) {
          closeDrawerPanel();
        }
      }
    });
  }

  // ── Layout (The 5 Zones + Drawer Flyout) ──
  function buildLayout() {
    return `
      ${buildTopbar()}
      <div class="flex flex-1 min-h-0 relative">
        ${buildLeftRail()}
        ${buildDrawerPanel()}
        ${buildWorkspace()}
        ${buildCopilot()}
      </div>
      ${buildCommandBar()}
      ${buildDock()}
    `;
  }

  // ── 1. Topbar ──
  function buildTopbar() {
    return `
    <header id="aos-topbar" class="h-12 flex items-center justify-between px-6 shrink-0 z-20 relative transition-colors" style="background:linear-gradient(135deg,#2563eb 0%,#1e40af 100%);box-shadow:0 4px 16px rgba(37,99,235,.12)">
      <div class="flex items-center gap-6">
        <button class="md:hidden" id="aosHamburger" aria-label="Menu">
          <span class="material-symbols-outlined text-white/80">menu</span>
        </button>
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
            <span class="material-symbols-outlined text-white text-[16px]">admin_panel_settings</span>
          </div>
          <span class="text-[13px] font-black tracking-[4px] text-white uppercase">AdminOS</span>
        </div>
        <nav class="hidden md:flex gap-5">
          <span class="text-[11px] text-white/70 hover:text-white cursor-pointer font-semibold transition-colors">Admin</span>
          <span class="text-[11px] text-white/70 hover:text-white cursor-pointer font-semibold transition-colors">Data</span>
          <span class="text-[11px] text-white/70 hover:text-white cursor-pointer font-semibold transition-colors">Platform</span>
        </nav>
      </div>
      <div class="flex items-center gap-4">
        <div class="search-pill flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 cursor-pointer hover:bg-white/25 transition-colors" onclick="if(AOS.spotlight) AOS.spotlight.open()">
          <span class="material-symbols-outlined text-white/70 text-[14px]">search</span>
          <span class="text-[10px] text-white/60 font-medium">Search tools...</span>
          <span class="text-[9px] text-white/40 font-bold bg-white/10 px-1.5 py-0.5 rounded ml-2">\u2318K</span>
        </div>
        <div class="cursor-pointer relative" id="aosNotifBell">
          <span class="material-symbols-outlined text-white/70 text-[18px] hover:text-white transition-colors">notifications</span>
          <span id="aosNotifBadge" class="absolute -top-1 -right-1 bg-solar-red text-white text-[8px] font-bold w-3.5 h-3.5 flex items-center justify-center rounded-full border-2 border-lmdr-blue">0</span>
        </div>
        <div class="cursor-pointer" onclick="AOS.shell.toggleCopilot()">
          <span class="material-symbols-outlined text-white/70 text-[18px] hover:text-white transition-colors">forum</span>
        </div>
        <div class="cursor-pointer" onclick="AOS.shell.toggleTheme()">
          <span class="material-symbols-outlined text-white/70 text-[18px] hover:text-white transition-colors" id="aosThemeIcon">dark_mode</span>
        </div>
        <span id="aosClock" class="text-[11px] text-white/60 font-semibold tracking-wide hidden sm:block"></span>
      </div>
    </header>`;
  }

  // ── 2. Left Rail (9 Orbs) ──
  function buildLeftRail() {
    // Top 9 primary orbs
    const primaryToolIds = ['home', 'observability', 'ai-router', 'drivers', 'carriers', 'matches', 'billing', 'content', 'gamification-analytics'];

    // Safely lookup tools from registry
    const primaryTools = primaryToolIds.map(id => AOS.getToolByView ? AOS.getToolByView(id) : null).filter(Boolean);

    const orbsHtml = primaryTools.map(t => buildRailOrb(t)).join('');

    return `
    <div id="aos-left-rail" style="background:var(--ros-bg-d)" class="z-10 transition-colors">
      ${orbsHtml}
      
      <!-- Divider -->
      <div class="w-8 h-px bg-black/10 dark:bg-white/10 my-1 rounded-full"></div>
      
      <!-- More Orb -->
      <button id="aosMoreOrb" class="tool-orb neu-x rounded-lg mb-auto group relative flex items-center justify-center w-12 h-12 p-1 outline-none" onclick="AOS.shell.openDrawerPanel()" aria-label="More Tools">
        <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center">
          <span class="material-symbols-outlined text-white text-[18px]">grid_view</span>
        </div>
      </button>
    </div>`;
  }

  function buildRailOrb(tool) {
    if (!tool) return '';
    const badgeClass = tool.badge ? ' ndot' : '';
    return `
    <button class="tool-orb neu-x rounded-lg aos-rail-orb group relative flex items-center justify-center w-12 h-12 p-1 outline-none" data-view="${tool.view}" onclick="AOS.shell.dockNav('${tool.view}', this)" aria-label="${tool.name}">
      <div class="w-9 h-9 rounded-lg bg-gradient-to-br ${tool.gradient || 'from-gray-400 to-gray-500'} flex items-center justify-center">
        <span class="material-symbols-outlined text-white text-[18px] ${badgeClass}">${tool.icon}</span>
      </div>
      <!-- Tooltip -->
      <div class="absolute left-14 bg-lmdr-dark text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 pointer-events-none" style="box-shadow:0 4px 12px rgba(0,0,0,.2)">
        ${tool.name}
      </div>
    </button>`;
  }

  // ── 3. Full Drawer Panel (Flyout) ──
  function buildDrawerPanel() {
    if (!CFG.drawers) return '<div id="aos-drawer-panel" class="hidden"></div>';

    const drawersHtml = CFG.drawers.map(d => buildDrawer(d)).join('');

    return `
    <div id="aos-drawer-panel" class="hidden neu-lg flex flex-col pt-3 pb-24 px-3 overflow-y-auto no-scrollbar" style="border-radius:0">
      <div class="flex items-center justify-between px-2 mb-4">
        <span class="text-[12px] font-black tracking-widest uppercase" style="color:var(--ros-text-muted)">All Tools</span>
        <button onclick="AOS.shell.closeDrawerPanel()" class="w-7 h-7 neu-x rounded-lg flex items-center justify-center hover:scale-105 transition-transform">
          <span class="material-symbols-outlined text-[16px]" style="color:var(--ros-text-muted)">close</span>
        </button>
      </div>
      ${drawersHtml}
    </div>`;
  }

  function buildDrawer(drawer) {
    const tools = AOS.getDrawerTools ? AOS.getDrawerTools(drawer.id) : [];
    const cols = 3;
    const toolGrid = tools.map(t => buildDrawerToolOrb(t)).join('');

    return `
    <div class="neu-s rounded-xl overflow-hidden mb-3">
      <div class="flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors" onclick="AOS.shell.toggleDrawer('${drawer.id}')" style="border-bottom:1px solid var(--ros-border)">
        <div class="w-6 h-6 rounded-md bg-gradient-to-br ${drawer.iconGradient || 'from-gray-400 to-gray-500'} flex items-center justify-center">
          <span class="material-symbols-outlined text-white text-[14px]">${drawer.icon}</span>
        </div>
        <span class="text-[11px] font-bold flex-1" style="color:var(--ros-text)">${drawer.label}</span>
        <span class="text-[10px] font-bold" style="color:var(--ros-text-muted)">${tools.length}</span>
        <span class="material-symbols-outlined text-[16px] transition-transform duration-200" style="color:var(--ros-text-muted)" id="aos-ch-${drawer.id}">expand_more</span>
      </div>
      <div class="transition-all duration-300 overflow-hidden" id="aos-dr-${drawer.id}" style="height:0;">
        <div class="p-2 pt-1 w-full">
          <div class="grid grid-cols-${cols} gap-1.5 w-full">
            ${toolGrid}
          </div>
        </div>
      </div>
    </div>`;
  }

  function buildDrawerToolOrb(tool) {
    return `
    <div class="tool-orb neu-x rounded-lg p-2 flex flex-col items-center gap-1 text-center aos-drawer-orb"
         data-view="${tool.view}" onclick="AOS.shell.dockNav('${tool.view}', this); AOS.shell.closeDrawerPanel();">
      <div class="w-8 h-8 rounded-md bg-gradient-to-br ${tool.gradient || 'from-gray-400 to-gray-500'} flex items-center justify-center">
        <span class="material-symbols-outlined text-white text-[16px]">${tool.icon}</span>
      </div>
      <span class="text-[8px] font-bold leading-tight" style="color:var(--ros-text)">${tool.name}</span>
    </div>`;
  }

  // ── 4. Central Workspace ──
  function buildWorkspace() {
    return `
    <div id="aos-stage" class="flex-1 w-full overflow-y-auto relative p-4 lg:p-6 pb-40 ws-grid transition-colors">
      <div id="aos-breadcrumb" class="text-[11px] font-bold tracking-wider uppercase mb-4 flex items-center gap-2" style="color:var(--ros-text-muted)">
        <span>AdminOS</span>
        <span class="material-symbols-outlined text-[12px]">chevron_right</span>
        <span id="aos-breadcrumb-view" style="color:var(--ros-accent)">Home</span>
      </div>
      <div id="aos-view-container" class="w-full h-full min-h-[500px] flex flex-col relative transition-opacity duration-200">
        <!-- View modules render here -->
      </div>
    </div>`;
  }

  // ── 5. Right Copilot Sidebar ──
  function buildCopilot() {
    return `
    <div id="aos-copilot" class="chat-thread hidden shrink-0 transition-colors z-20">
      
      <!-- Copilot Header -->
      <div class="thread-head">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-lmdr-blue to-lmdr-deep flex items-center justify-center">
            <span class="material-symbols-outlined text-white text-[16px]">smart_toy</span>
          </div>
          <div>
            <span class="text-[13px] font-extrabold" style="color:var(--ros-text)">Admin Copilot</span>
            <div class="flex items-center gap-1 mt-0.5">
              <div class="w-1.5 h-1.5 rounded-full bg-emerald-500" style="animation:pulse 2s infinite"></div>
              <span class="text-[9px] font-medium" style="color:var(--ros-text-muted)">Online</span>
            </div>
          </div>
        </div>
        <button onclick="AOS.shell.toggleCopilot()" class="w-7 h-7 neu-x rounded-lg flex items-center justify-center transition-colors">
          <span class="material-symbols-outlined text-[16px]" style="color:var(--ros-text-muted)">close</span>
        </button>
      </div>
      
      <!-- Copilot Messages -->
      <div id="aos-copilot-msgs" class="thread-msgs no-scrollbar pb-[140px]">
        <div class="flex gap-2 w-full pr-4" style="animation:msgIn .4s ease">
          <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-lmdr-blue to-lmdr-deep flex items-center justify-center shrink-0 mt-1">
             <span class="material-symbols-outlined text-white text-[14px]">smart_toy</span>
          </div>
          <div class="neu-s p-3 rounded-2xl rounded-tl-sm text-[12px] font-medium" style="color:var(--ros-text)">
            How can I assist? Try "show system health" or "find carrier 12345".
          </div>
        </div>
      </div>
      
      <!-- Copilot Input Area (Pinned to bottom of sidebar) -->
      <div class="absolute bottom-0 w-full p-4 backdrop-blur-md transition-colors" style="background:var(--ros-bg-d);border-top:1px solid var(--ros-border)">
        <div class="cmd-chips mb-3">
          <button onclick="if(AOS.chat)AOS.chat.send('System Health')">System Health</button>
          <button onclick="if(AOS.chat)AOS.chat.send('Find Driver #1234')">Find Driver #1234</button>
          <button onclick="if(AOS.chat)AOS.chat.send('AI Cost Report')">AI Cost Report</button>
          <button onclick="if(AOS.chat)AOS.chat.send('View Audit Log')">View Audit Log</button>
        </div>
        
        <!-- Standard Text Input -->
        <div id="aos-copilot-input-container" class="neu-in rounded-xl p-1 flex items-center gap-2 transition-all duration-300">
           <button id="aos-voice-btn" onclick="AOS.shell.toggleVoice()" class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0" style="background:var(--ros-surface);color:var(--ros-text-muted)">
             <span class="material-symbols-outlined text-[16px]">mic</span>
           </button>
           <input type="text" id="aos-copilot-input" class="flex-1 bg-transparent border-none outline-none text-[13px] font-medium px-1" style="color:var(--ros-text)" placeholder="Message Admin Copilot..." onkeydown="if(event.key==='Enter' && AOS.chat) AOS.chat.send(this.value)">
           <button class="send-btn" onclick="const i=document.getElementById('aos-copilot-input'); if(AOS.chat && i.value) AOS.chat.send(i.value)">
             <span class="material-symbols-outlined text-white text-[16px]">arrow_upward</span>
           </button>
        </div>
        
        <!-- Voice Active Orb Overlay -->
        <div id="aos-voice-orb-container" class="hidden absolute left-4 right-4 bottom-4 h-10 flex items-center justify-center opacity-0 transition-opacity duration-300 pointer-events-none">
           <div class="relative flex items-center justify-center w-full h-full">
             <!-- The pulsing aura -->
             <div class="absolute w-12 h-12 bg-solar-blue rounded-full animate-ping opacity-75"></div>
             <!-- The solid orb -->
             <button class="z-10 w-10 h-10 bg-gradient-to-br from-solar-blue to-cyan-400 rounded-full shadow-[0_0_20px_rgba(38,139,210,0.6)] flex items-center justify-center pointer-events-auto hover:scale-95 transition-transform" onclick="AOS.shell.toggleVoice()">
               <div class="flex gap-1 items-center justify-center h-4 w-4">
                 <div class="w-1 bg-white rounded-full animate-[bounce_1s_ease-in-out_infinite] h-full"></div>
                 <div class="w-1 bg-white rounded-full animate-[bounce_1s_ease-in-out_infinite_0.2s] h-3/4"></div>
                 <div class="w-1 bg-white rounded-full animate-[bounce_1s_ease-in-out_infinite_0.4s] h-full"></div>
               </div>
             </button>
           </div>
        </div>
      </div>
    </div>`;
  }

  // ── 6. Command Bar (Floating bottom strip) ──
  function buildCommandBar() {
    return `
    <div class="cmd-bar" id="aos-cmd-bar">
      <div class="cmd-chips">
        <button onclick="if(AOS.chat)AOS.chat.send('Run Diagnostics')"><span class="material-symbols-outlined text-[12px]">troubleshoot</span> Run Diagnostics</button>
        <button onclick="if(AOS.chat)AOS.chat.send('Audit AI Spend')"><span class="material-symbols-outlined text-[12px]">payments</span> Audit AI Spend</button>
        <button onclick="if(AOS.chat)AOS.chat.send('Find Carrier')"><span class="material-symbols-outlined text-[12px]">local_shipping</span> Find Carrier</button>
        <button onclick="if(AOS.chat)AOS.chat.send('View Logs')"><span class="material-symbols-outlined text-[12px]">description</span> View Logs</button>
        <button onclick="if(AOS.chat)AOS.chat.send('Feature Flags')"><span class="material-symbols-outlined text-[12px]">flag</span> Feature Flags</button>
      </div>
      <div class="cmd-chat">
        <input type="text" id="aos-cmd-input" placeholder="Ask AdminOS anything — try 'show system health'..." onkeydown="if(event.key==='Enter' && AOS.chat) AOS.chat.send(this.value)">
        <button class="send-btn" onclick="const i=document.getElementById('aos-cmd-input'); if(AOS.chat && i.value) AOS.chat.send(i.value)">
          <span class="material-symbols-outlined text-white text-[16px]">arrow_upward</span>
        </button>
      </div>
      <!-- Thread area for command bar responses (hidden by default) -->
      <div id="aos-cmd-thread" class="hidden mt-2 max-h-[150px] overflow-y-auto px-2 pb-1 text-[12px] space-y-2 no-scrollbar"></div>
    </div>`;
  }

  // ── 7. Floating Dock ──
  function buildDock() {
    const DOCK = [
      { view: 'home', icon: 'space_dashboard', label: 'Home' },
      { view: 'observability', icon: 'monitoring', label: 'Traces', badge: true },
      { view: 'ai-router', icon: 'account_tree', label: 'AI Router' },
      { view: 'drivers', icon: 'group', label: 'Drivers' },
      { view: 'carriers', icon: 'business_center', label: 'Carriers' }
    ];

    const items = DOCK.map(d => {
      const activeClass = d.view === 'home' ? ' active' : '';
      const badge = d.badge ? '<span class="dk-badge"></span>' : '';
      return `
        <button class="dk-i${activeClass} outline-none" data-view="${d.view}" onclick="AOS.shell.dockNav('${d.view}', this)">
          <span class="material-symbols-outlined">${d.icon}</span>
          <span class="dk-tip">${d.label}</span>
          ${badge}
        </button>`;
    }).join('');

    return `<div class="dock-pill" id="aosDock">${items}</div>`;
  }

  // ── Interactions & State ──

  function dockNav(viewId, el) {
    if (AOS.views && AOS.views.showView) {
      AOS.views.showView(viewId);
    }
  }

  function syncNav(viewId) {
    // 1. Sync Left Rail Orbs
    document.querySelectorAll('.aos-rail-orb').forEach(el => {
      const isMatch = el.dataset.view === viewId;
      if (isMatch) el.classList.add('ring-2', 'ring-solar-blue');
      else el.classList.remove('ring-2', 'ring-solar-blue');
    });

    // 2. Sync Dock Icons
    document.querySelectorAll('.dk-i').forEach(el => {
      if (el.dataset.view === viewId) el.classList.add('active');
      else el.classList.remove('active');
    });

    // 3. Sync Drawer panel tools if open
    document.querySelectorAll('.aos-drawer-orb').forEach(el => {
      const body = el.closest('.transition-all');
      if (!body) return;

      if (el.dataset.view === viewId) {
        el.classList.add('ring-1', 'ring-solar-blue');
        // Auto-open the drawer containing this tool if closed
        const idMatch = body.id.replace('aos-dr-', '');
        const currentDrawerEl = document.querySelector(`.drawer-body[style*="height: auto"]`);
        if (body.style.height === '0px' || body.style.height === '') {
          toggleDrawer(idMatch, true); // force open
        }
      } else {
        el.classList.remove('ring-1', 'ring-solar-blue');
      }
    });
  }

  function openDrawerPanel() {
    const p = document.getElementById('aos-drawer-panel');
    if (p) {
      p.classList.remove('hidden');
      setTimeout(() => p.style.transform = 'translateX(0)', 10);
    }
  }

  function closeDrawerPanel() {
    const p = document.getElementById('aos-drawer-panel');
    if (p) {
      p.style.transform = 'translateX(-100%)';
      setTimeout(() => p.classList.add('hidden'), 250);
    }
  }

  let activeDrawerId = null;
  function toggleDrawer(id, forceOpen = false) {
    const el = document.getElementById('aos-dr-' + id);
    const chev = document.getElementById('aos-ch-' + id);
    if (!el || !chev) return;

    const isOpen = el.style.height !== '0px' && el.style.height !== '';

    // Close previously active drawer if it exists and isn't this one
    if (activeDrawerId && activeDrawerId !== id) {
      const activeEl = document.getElementById('aos-dr-' + activeDrawerId);
      const activeChev = document.getElementById('aos-ch-' + activeDrawerId);
      if (activeEl) activeEl.style.height = '0px';
      if (activeChev) activeChev.style.transform = 'rotate(0deg)';
    }

    if (isOpen && !forceOpen) {
      // Close this one
      el.style.height = '0px';
      chev.style.transform = 'rotate(0deg)';
      activeDrawerId = null;
    } else {
      // Open this one
      el.style.height = el.scrollHeight + 'px';
      chev.style.transform = 'rotate(180deg)';
      activeDrawerId = id;
    }
  }

  function toggleCopilot() {
    const c = document.getElementById('aos-copilot');
    if (!c) return;

    if (c.classList.contains('hidden')) {
      c.classList.remove('hidden');
      setTimeout(() => c.style.transform = 'translateX(0)', 10);
      // Auto-focus input
      const i = document.getElementById('aos-copilot-input');
      if (i) setTimeout(() => i.focus(), 300);
    } else {
      c.style.transform = 'translateX(100%)';
      setTimeout(() => c.classList.add('hidden'), 300);
    }
  }

  function toggleVoice() {
    const c = document.getElementById('aos-copilot');
    if (!c) return;

    // Make sure copilot is open
    if (c.classList.contains('hidden')) toggleCopilot();

    const inputContainer = document.getElementById('aos-copilot-input-container');
    const orbContainer = document.getElementById('aos-voice-orb-container');
    const isVoiceActive = c.classList.contains('voice-active');

    if (!isVoiceActive) {
      // Turn ON Voice Mode
      c.classList.add('voice-active');
      if (inputContainer) {
        inputContainer.style.opacity = '0';
        inputContainer.style.pointerEvents = 'none';
      }
      if (orbContainer) {
        orbContainer.classList.remove('hidden');
        setTimeout(() => orbContainer.style.opacity = '1', 10);
      }
      // Simulate listening (in reality this hooks into admin-agent.js)
    } else {
      // Turn OFF Voice Mode
      c.classList.remove('voice-active');
      if (orbContainer) {
        orbContainer.style.opacity = '0';
        setTimeout(() => orbContainer.classList.add('hidden'), 300);
      }
      if (inputContainer) {
        inputContainer.style.opacity = '1';
        inputContainer.style.pointerEvents = 'auto';
      }
    }
  }

  function toggleTheme() {
    const doc = document.documentElement;
    let current = 'light';
    if (doc.classList.contains('solar')) current = 'solar';
    else if (doc.classList.contains('dark')) current = 'dark';

    let next = current === 'light' ? 'solar' : current === 'solar' ? 'dark' : 'light';

    doc.classList.remove('light', 'solar', 'dark');
    doc.classList.add(next);
    localStorage.setItem('aos-theme', next);
    syncThemeIcon();
  }

  function syncThemeIcon() {
    const doc = document.documentElement;
    const icon = document.getElementById('aosThemeIcon');
    if (icon) {
      if (doc.classList.contains('solar')) icon.textContent = 'dark_mode';
      else if (doc.classList.contains('dark')) icon.textContent = 'light_mode';
      else icon.textContent = 'contrast';
    }
  }

  function startClock() {
    const update = () => {
      const el = document.getElementById('aosClock');
      if (el) {
        const d = new Date();
        el.textContent = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
          ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      }
    };
    update();
    setInterval(update, 60000);
  }

})();
