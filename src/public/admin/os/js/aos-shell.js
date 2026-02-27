// ============================================================================
// AOS-SHELL — AdminOS Layout Builder
// Mirrors the RecruiterOS structure (Topbar, Left Rail, Drawers, Floating Dock)
// ============================================================================

(function () {
  'use strict';

  const CFG = AOS.config;
  const TOOLS = AOS.TOOL_REGISTRY;

  // ── State ──
  let openDrawerId = 'core';

  window.AOS = window.AOS || {};
  AOS.shell = { init, toggleDrawer, syncNav, dockNav, toggleTheme, toggleChat };

  function init() {
    const root = document.getElementById('aos-root');
    if (!root) { console.error('AOS: #aos-root not found'); return; }

    // Core Layout
    root.innerHTML = buildLayout();

    startClock();

    // Sync theme icon
    const _theme = document.documentElement.classList.contains('solar') ? 'solar'
      : document.documentElement.classList.contains('dark') ? 'dark'
        : 'light';
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
      themeIcon.textContent = _theme === 'light' ? 'contrast'
        : _theme === 'solar' ? 'dark_mode'
          : 'light_mode';
    }

    // Default open drawer
    setTimeout(() => { toggleDrawer('core'); }, 100);
  }

  // ── Layout ──
  function buildLayout() {
    return `
      ${buildTopbar()}
      <div class="flex flex-1 min-h-0 relative">
        <div class="rail-overlay" id="railOverlay"></div>
        ${buildRail()}
        <div class="flex-1 overflow-y-auto relative pb-24 px-5 ws-grid" id="aos-stage">
          <div id="aos-view-container" class="h-full"></div>
        </div>
        ${buildChatThread()}
      </div>
      ${buildDock()}
    `;
  }

  // ── Topbar ──
  function buildTopbar() {
    return `
    <header id="aos-topbar" class="h-12 border-b border-black/5 dark:border-white/5 flex items-center justify-between px-4 bg-beige dark:bg-lmdr-dark z-20 shrink-0 shadow-sm relative">
      <div class="flex items-center gap-6">
        <button class="hamburger-btn md:hidden" id="hamburgerBtn">
          <span class="material-symbols-outlined text-lmdr-dark dark:text-white">menu</span>
        </button>
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center">
            <span class="material-symbols-outlined text-solar-blue text-[16px]">${CFG.brand.icon}</span>
          </div>
          <span class="text-[13px] font-black tracking-[3px] text-lmdr-dark dark:text-white">${CFG.brand.logo}</span>
        </div>
        <nav class="hidden md:flex gap-5">
          <span class="text-[11px] text-lmdr-dark/50 dark:text-white/50 hover:text-lmdr-blue dark:hover:text-white cursor-pointer font-semibold transition-colors">Admin</span>
          <span class="text-[11px] text-lmdr-dark/50 dark:text-white/50 hover:text-lmdr-blue dark:hover:text-white cursor-pointer font-semibold transition-colors">Data</span>
          <span class="text-[11px] text-lmdr-dark/50 dark:text-white/50 hover:text-lmdr-blue dark:hover:text-white cursor-pointer font-semibold transition-colors">Platform</span>
        </nav>
      </div>
      <div class="flex items-center gap-4">
        <div class="search-pill flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/5 dark:bg-white/[.08] cursor-pointer hover:bg-black/10 dark:hover:bg-white/[.12] transition-colors">
          <span class="material-symbols-outlined text-lmdr-dark/40 dark:text-white/40 text-[14px]">search</span>
          <span class="text-[10px] text-lmdr-dark/50 dark:text-white/30 font-medium">Search tools...</span>
          <span class="text-[9px] text-lmdr-dark/40 dark:text-white/20 font-bold bg-black/[0.04] dark:bg-white/[0.06] px-1.5 py-0.5 rounded ml-2">\u2318K</span>
        </div>
        <div class="cursor-pointer" onclick="AOS.shell.toggleChat()">
          <span class="material-symbols-outlined text-lmdr-dark/50 dark:text-white/50 text-[18px] hover:text-solar-blue transition-colors">forum</span>
        </div>
        <div class="cursor-pointer" onclick="AOS.shell.toggleTheme()">
          <span class="material-symbols-outlined text-lmdr-dark/50 dark:text-white/50 text-[18px] hover:text-solar-blue transition-colors" id="theme-icon">dark_mode</span>
        </div>
        <span id="aos-clock" class="text-[11px] text-lmdr-dark/50 dark:text-white/50 font-semibold tracking-wide hidden sm:block"></span>
      </div>
    </header>`;
  }

  // ── Left Rail & Drawers ──
  function buildRail() {
    const drawers = CFG.drawers.map(d => buildDrawer(d)).join('');
    return `
    <div id="aos-rail" class="w-64 border-r border-black/5 dark:border-white/5 bg-beige-d/50 dark:bg-[#0c1222] p-3 flex-col gap-2 overflow-y-auto shrink-0 z-10 transition-transform md:translate-x-0 -translate-x-full fixed md:static inset-y-0 left-0 h-full md:h-auto shadow-2xl md:shadow-none hidden md:flex no-scrollbar">
      ${drawers}
    </div>`;
  }

  function buildDrawer(drawer) {
    const tools = AOS.getDrawerTools(drawer.id);
    const cols = 2; // Fixed to 2 cols for AdminOS
    const toolGrid = tools.map(t => buildToolOrb(t)).join('');

    return `
    <div class="neu-s rounded-xl overflow-hidden shadow-sm dark:shadow-none bg-white/50 dark:bg-white/5 mb-2">
      <div class="flex items-center gap-2 px-3.5 py-2.5 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors" onclick="AOS.shell.toggleDrawer('${drawer.id}')">
        <div class="w-6 h-6 rounded-md bg-gradient-to-br ${drawer.iconGradient} flex items-center justify-center shadow-inner">
          <span class="material-symbols-outlined text-white text-[14px]">${drawer.icon}</span>
        </div>
        <span class="text-[11px] font-bold text-lmdr-dark dark:text-white/80 flex-1">${drawer.label}</span>
        <span class="text-[9px] text-lmdr-dark/40 dark:text-white/40 font-bold">${tools.length}</span>
        <span class="material-symbols-outlined text-lmdr-dark/40 dark:text-white/40 text-[16px] transition-transform duration-200" id="ch-${drawer.id}">expand_more</span>
      </div>
      <div class="transition-all duration-300 overflow-hidden" id="dr-${drawer.id}" style="height:0;">
        <div class="p-2 pt-0">
          <div class="grid grid-cols-${cols} gap-1.5">
            ${toolGrid}
          </div>
        </div>
      </div>
    </div>`;
  }

  function buildToolOrb(tool) {
    const badgeClass = tool.badge ? ' ndot' : '';
    // A nice neumorphic orb matching RecruiterOS style
    return `
    <div class="flex flex-col items-center justify-center p-3 rounded-lg bg-beige dark:bg-[#0f172a] shadow-[inset_1px_1px_2px_rgba(255,255,255,0.8),_inset_-1px_-1px_3px_rgba(0,0,0,0.1)] dark:shadow-[inset_1px_1px_1px_rgba(255,255,255,0.05),_inset_-1px_-1px_2px_rgba(0,0,0,0.3)] hover:shadow-none dark:hover:bg-white/5 cursor-pointer transition-all active:scale-95 group relative aos-orb"
         data-view="${tool.view}" onclick="AOS.views.showView('${tool.view}')">
      <div class="${badgeClass} w-8 h-8 rounded-full bg-gradient-to-br ${tool.gradient} flex items-center justify-center mb-1.5 shadow-md group-hover:-translate-y-0.5 transition-transform duration-200">
        <span class="material-symbols-outlined text-white text-[16px]">${tool.icon}</span>
      </div>
      <span class="text-[9px] font-bold text-lmdr-dark/60 dark:text-white/60 text-center leading-tight tracking-wide mx-px w-full truncate px-1">${tool.name}</span>
    </div>`;
  }

  // ── Floating Dock ──
  // RecruiterOS has fixed hardcoded dock items. AdminOS will feature quick-access core tools.
  const DOCK_ITEMS = [
    { view: 'home', icon: 'space_dashboard', label: 'Home' },
    { view: 'observability', icon: 'visibility', label: 'Traces', badge: true },
    { view: 'ai-router', icon: 'account_tree', label: 'AI Router' },
    { view: 'drivers', icon: 'local_shipping', label: 'Drivers' },
    { view: 'carriers', icon: 'business_center', label: 'Carriers' }
  ];

  function buildDock() {
    const items = DOCK_ITEMS.map(d => {
      const activeClass = d.view === 'home' ? ' active' : '';
      const badge = d.badge ? '<span class="dk-badge"></span>' : '';
      return `
        <div class="dk-i${activeClass}" data-view="${d.view}" onclick="AOS.shell.dockNav('${d.view}', this)">
          <span class="material-symbols-outlined">${d.icon}</span>
          <span class="dk-tip">${d.label}</span>
          ${badge}
        </div>`;
    }).join('');

    return `<div class="dock-pill shadow-[0_8px_32px_rgba(0,0,0,0.15)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]" id="dockPill">${items}</div>`;
  }

  // ── Chat/Agent Thread ──
  function buildChatThread() {
    return `
    <div class="w-[340px] border-l border-black/5 dark:border-white/5 bg-beige-d/50 dark:bg-[#0c1222] shrink-0 h-full right-0 max-w-full z-20 transition-transform translate-x-full fixed md:relative shadow-2xl md:shadow-none" id="chatThread" style="display:none;">
      <div class="h-12 border-b border-black/5 dark:border-white/5 flex items-center justify-between px-4 bg-beige dark:bg-lmdr-dark">
        <div class="flex items-center gap-2.5">
          <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-solar-blue to-cyan-500 flex items-center justify-center shadow-inner">
            <span class="material-symbols-outlined text-white text-[14px]">smart_toy</span>
          </div>
          <div>
            <span class="text-[12px] font-black tracking-wide text-lmdr-dark dark:text-white">Admin Copilot</span>
            <div class="flex items-center gap-1 mt-0.5">
              <div class="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
              <span class="text-[8px] text-lmdr-dark/50 dark:text-white/50 font-medium uppercase tracking-wider">Online</span>
            </div>
          </div>
        </div>
        <button onclick="AOS.shell.toggleChat()" class="w-6 h-6 rounded-md hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center transition-colors">
          <span class="material-symbols-outlined text-lmdr-dark/50 dark:text-white/50 text-[16px]">close</span>
        </button>
      </div>
      <div class="flex-1 overflow-y-auto p-4 space-y-4" id="chatMsgs" style="height: calc(100% - 100px);">
        <div class="text-center my-4">
          <span class="text-[10px] text-lmdr-dark/40 dark:text-white/30 font-bold uppercase tracking-widest bg-black/5 dark:bg-white/5 px-3 py-1 rounded-full">System secure</span>
        </div>
        <div class="flex gap-2">
          <div class="w-6 h-6 rounded-md bg-gradient-to-br from-solar-blue to-cyan-500 flex items-center justify-center shrink-0 mt-1">
             <span class="material-symbols-outlined text-white text-[12px]">smart_toy</span>
          </div>
          <div class="bg-white dark:bg-white/5 p-3 rounded-2xl rounded-tl-sm shadow-sm border border-black/5 dark:border-white/5 text-[12px] text-lmdr-dark/80 dark:text-white/80 neu-s">
            How can I assist you with platform operations today? Say "run diagnostics" or "search drivers".
          </div>
        </div>
      </div>
      
      <!-- Voice/Chat Input Focus Area -->
      <div class="absolute bottom-0 w-full p-4 bg-beige dark:bg-lmdr-dark border-t border-black/5 dark:border-white/5">
        <div class="flex items-center gap-2 mb-2 px-1">
          <span class="text-[9px] font-bold text-lmdr-dark/40 dark:text-white/40 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors">Run Diagnostics</span>
          <span class="text-[9px] font-bold text-lmdr-dark/40 dark:text-white/40 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full cursor-pointer hover:bg-black/10 dark:hover:bg-white/10 transition-colors">Audit AI Spend</span>
        </div>
        <div class="flex items-center gap-2 neu-in bg-white dark:bg-black/20 p-1.5 rounded-xl border border-black/5 dark:border-white/5 shadow-inner">
           <!-- Voice Toggle -->
           <button class="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center hover:bg-solar-blue hover:text-white text-lmdr-dark/50 dark:text-white/50 transition-colors shrink-0">
             <span class="material-symbols-outlined text-[16px]">mic</span>
           </button>
           <input type="text" class="flex-1 bg-transparent border-none outline-none text-[12px] text-lmdr-dark dark:text-white placeholder-lmdr-dark/30 dark:placeholder-white/30" placeholder="Message AdminOS Agent...">
           <button class="w-8 h-8 rounded-lg bg-solar-blue flex items-center justify-center text-white shrink-0 shadow-md">
             <span class="material-symbols-outlined text-[16px]">arrow_upward</span>
           </button>
        </div>
      </div>
    </div>`;
  }

  // ── Interactions ──
  function toggleDrawer(id) {
    const el = document.getElementById('dr-' + id);
    const chev = document.getElementById('ch-' + id);
    if (!el || !chev) return;

    const isOpen = el.style.height !== '0px';

    // Close current
    if (openDrawerId && openDrawerId !== id) {
      const curEl = document.getElementById('dr-' + openDrawerId);
      const curChev = document.getElementById('ch-' + openDrawerId);
      if (curEl) curEl.style.height = '0px';
      if (curChev) curChev.style.transform = 'rotate(0deg)';
    }

    // Toggle target
    if (isOpen) {
      el.style.height = '0px';
      chev.style.transform = 'rotate(0deg)';
      openDrawerId = null;
    } else {
      el.style.height = el.scrollHeight + 'px';
      chev.style.transform = 'rotate(180deg)';
      openDrawerId = id;
    }
  }

  function syncNav(viewId) {
    // Sync orbs
    document.querySelectorAll('.aos-orb').forEach(el => {
      if (el.dataset.view === viewId) el.classList.add('ring-2', 'ring-solar-blue', 'ring-offset-2', 'dark:ring-offset-[#0f172a]');
      else el.classList.remove('ring-2', 'ring-solar-blue', 'ring-offset-2', 'dark:ring-offset-[#0f172a]');

      if (el.dataset.view === viewId) {
        // Find parent drawer and open if needed
        const body = el.closest('.transition-all');
        if (body) {
          const idMatch = body.id.replace('dr-', '');
          if (openDrawerId !== idMatch) {
            toggleDrawer(idMatch);
          }
        }
      }
    });

    // Sync dock
    document.querySelectorAll('.dk-i').forEach(el => {
      if (el.dataset.view === viewId) el.classList.add('active');
      else el.classList.remove('active');
    });
  }

  function dockNav(viewId, el) {
    document.querySelectorAll('.dk-i').forEach(n => n.classList.remove('active'));
    if (el) el.classList.add('active');
    AOS.views.showView(viewId);
  }

  function toggleTheme() {
    const doc = document.documentElement;
    let next = 'light';
    if (doc.classList.contains('light')) next = 'solar';
    else if (doc.classList.contains('solar')) next = 'dark';

    doc.classList.remove('light', 'solar', 'dark');
    doc.classList.add(next);
    localStorage.setItem('aos-theme', next);

    const icon = document.getElementById('theme-icon');
    if (icon) {
      icon.textContent = next === 'light' ? 'contrast' : next === 'solar' ? 'dark_mode' : 'light_mode';
    }
  }

  function toggleChat() {
    const chat = document.getElementById('chatThread');
    if (!chat) return;

    if (chat.style.display === 'none') {
      chat.style.display = 'block';
      setTimeout(() => chat.classList.remove('translate-x-full'), 10);
    } else {
      chat.classList.add('translate-x-full');
      setTimeout(() => chat.style.display = 'none', 300);
    }
  }

  function startClock() {
    const update = () => {
      const el = document.getElementById('aos-clock');
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
