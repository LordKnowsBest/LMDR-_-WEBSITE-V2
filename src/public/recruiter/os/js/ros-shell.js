// ============================================================================
// ROS-SHELL — Layout Builder
// Renders topbar, left rail, drawers, dock, command bar
// ============================================================================

(function() {
  'use strict';

  const CFG = ROS.config;
  const TOOLS = ROS.TOOL_REGISTRY;

  // ── State ──
  let openDrawers = new Set();

  // ── Init ──
  ROS.shell = { init, toggleDrawer, openDrawer, closeDrawer };

  function init() {
    const root = document.getElementById('ros-root');
    if (!root) { console.error('ROS: #ros-root not found'); return; }
    root.innerHTML = buildLayout();
    startClock();
    bindMobileHamburger();
  }

  // ── Full Layout ──
  function buildLayout() {
    return `
      ${buildTopbar()}
      <div class="flex flex-1 min-h-0 relative">
        <div class="rail-overlay" id="railOverlay"></div>
        ${buildRail()}
        <div class="flex-1 overflow-y-auto relative pb-24 px-5 ws-grid" id="ros-stage">
          <div id="ros-view-container" class="h-full"></div>
        </div>
        ${buildChatThread()}
      </div>
      ${buildDock()}
      ${buildCommandBar()}
      ${buildSpotlight()}
    `;
  }

  // ── Topbar ──
  function buildTopbar() {
    return `
    <header id="ros-topbar">
      <div class="flex items-center gap-6">
        <button class="hamburger-btn" id="hamburgerBtn">
          <span class="material-symbols-outlined">menu</span>
        </button>
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
            <span class="material-symbols-outlined text-lmdr-yellow text-[16px]">${CFG.brand.icon}</span>
          </div>
          <span class="text-[13px] font-black tracking-[3px] text-white">${CFG.brand.logo}</span>
        </div>
        <nav class="flex gap-5">
          <span class="text-[11px] text-white/50 hover:text-white cursor-pointer font-semibold transition-colors">File</span>
          <span class="text-[11px] text-white/50 hover:text-white cursor-pointer font-semibold transition-colors">View</span>
          <span class="text-[11px] text-white/50 hover:text-white cursor-pointer font-semibold transition-colors">Tools</span>
          <span class="text-[11px] text-white/50 hover:text-white cursor-pointer font-semibold transition-colors">Automations</span>
        </nav>
      </div>
      <div class="flex items-center gap-4">
        <div class="search-pill flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[.08] cursor-pointer hover:bg-white/[.12] transition-colors" onclick="ROS.spotlight.open()">
          <span class="material-symbols-outlined text-white/40 text-[14px]">search</span>
          <span class="text-[10px] text-white/30 font-medium">Search</span>
          <span class="text-[9px] text-white/20 font-bold bg-white/[0.06] px-1.5 py-0.5 rounded ml-2">\u2318K</span>
        </div>
        <div class="relative cursor-pointer">
          <span class="material-symbols-outlined text-white/50 text-[18px] hover:text-lmdr-yellow transition-colors">notifications</span>
          <span class="absolute -top-1 -right-1.5 bg-red-500 text-white text-[8px] font-bold px-1 rounded-full leading-tight" id="notifBadge">0</span>
        </div>
        <span id="ros-clock" class="text-[11px] text-white/50 font-semibold tracking-wide"></span>
      </div>
    </header>`;
  }

  // ── Left Rail ──
  function buildRail() {
    const drawers = CFG.drawers.map(d => buildDrawer(d)).join('');
    return `
    <div id="ros-rail">
      <div class="flex items-center px-3 py-2 neu-ins rounded-full mb-1 cursor-pointer" onclick="ROS.spotlight.open()">
        <span class="material-symbols-outlined text-tan text-[16px]">search</span>
        <span class="text-[11px] text-tan/50 ml-2 font-medium flex-1">Search tools...</span>
        <span class="text-[9px] text-tan/40 font-bold bg-beige-d px-1.5 py-0.5 rounded">\u2318K</span>
      </div>
      ${drawers}
    </div>`;
  }

  // ── Single Drawer ──
  function buildDrawer(drawer) {
    const tools = ROS.getDrawerTools(drawer.id);
    const cols = drawer.id === 'rank' ? 2 : 3;
    const toolGrid = tools.map(t => buildToolOrb(t)).join('');

    // Rank drawer has extra XP bar
    let extra = '';
    if (drawer.id === 'rank') {
      extra = `
        <div class="p-2 neu-ins rounded-lg flex items-center gap-2 mt-2">
          <div class="w-7 h-7 rounded-full bg-gradient-to-br from-lmdr-yellow to-amber-500 flex items-center justify-center text-lmdr-dark font-black text-[10px]" id="ros-rank-avatar">--</div>
          <div class="flex-1">
            <p class="text-[9px] font-bold text-lmdr-dark" id="ros-rank-label">-- \u00b7 0 XP</p>
            <div class="h-1 w-full bg-beige-d rounded-full mt-0.5 overflow-hidden">
              <div class="h-full bg-gradient-to-r from-lmdr-yellow to-amber-500 rounded-full" style="width:0%" id="ros-rank-bar"></div>
            </div>
          </div>
        </div>`;
    }

    return `
    <div class="neu-s rounded-xl overflow-hidden">
      <div class="flex items-center gap-2 px-3.5 py-2.5 cursor-pointer hover:bg-beige-d/30 transition-colors" onclick="ROS.shell.toggleDrawer('${drawer.id}')">
        <div class="w-6 h-6 rounded-md bg-gradient-to-br ${drawer.iconGradient} flex items-center justify-center">
          <span class="material-symbols-outlined ${drawer.id === 'anl' ? 'text-lmdr-yellow' : 'text-white'} text-[14px]">${drawer.icon}</span>
        </div>
        <span class="text-[11px] font-bold text-lmdr-dark flex-1">${drawer.label}</span>
        <span class="text-[9px] text-tan font-bold">${tools.length}</span>
        <span class="material-symbols-outlined text-tan text-[16px] drawer-chev" id="ch-${drawer.id}">expand_more</span>
      </div>
      <div class="drawer-body" id="dr-${drawer.id}">
        <div class="grid grid-cols-${cols} gap-1.5">
          ${toolGrid}
        </div>
        ${extra}
      </div>
    </div>`;
  }

  // ── Tool Orb ──
  function buildToolOrb(tool) {
    const badgeClass = tool.badge ? ' ndot' : '';
    const animStyle = tool.animate ? ` style="animation:${tool.animate} 4s infinite"` : '';
    const iconColor = tool.iconColor || 'text-white';
    const clickAction = tool.view
      ? `ROS.views.showView('${tool.view}')`
      : `ROS.chat.flashMsg('${tool.name} — Coming Soon')`;

    return `
      <div class="tool-orb neu-x rounded-lg p-2 flex flex-col items-center gap-1 text-center${badgeClass}" onclick="${clickAction}">
        <div class="w-8 h-8 rounded-md bg-gradient-to-br ${tool.gradient} flex items-center justify-center"${animStyle}>
          <span class="material-symbols-outlined ${iconColor} text-[16px]">${tool.icon}</span>
        </div>
        <span class="text-[8px] font-bold text-lmdr-dark leading-tight">${tool.name}</span>
      </div>`;
  }

  // ── Chat Thread ──
  function buildChatThread() {
    return `
    <div class="chat-thread" id="chatThread">
      <div class="thread-head">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-lmdr-blue to-lmdr-deep flex items-center justify-center">
            <span class="material-symbols-outlined text-white text-[16px]">smart_toy</span>
          </div>
          <div>
            <span class="text-[13px] font-extrabold text-lmdr-dark">Command Center</span>
            <div class="flex items-center gap-1 mt-0.5">
              <div class="w-1.5 h-1.5 rounded-full bg-emerald-500" style="animation:pulse 2s infinite"></div>
              <span class="text-[9px] text-tan font-medium">Online</span>
            </div>
          </div>
        </div>
        <button onclick="ROS.chat.closeThread()" class="w-7 h-7 neu-x rounded-lg flex items-center justify-center hover:bg-beige-d transition-colors">
          <span class="material-symbols-outlined text-tan text-[16px]">close</span>
        </button>
      </div>
      <div class="thread-msgs" id="chatMsgs"></div>
    </div>`;
  }

  // ── Dock ──
  function buildDock() {
    const items = CFG.dock.map(d => {
      const activeClass = d.view === 'home' ? ' active' : '';
      const badge = d.badge ? '<span class="dk-badge"></span>' : '';
      return `
        <div class="dk-i${activeClass}" data-view="${d.view}" onclick="ROS.shell.dockNav('${d.view}', this)">
          <span class="material-symbols-outlined">${d.icon}</span>
          <span class="dk-tip">${d.label}</span>
          ${badge}
        </div>`;
    }).join('');

    return `<div class="dock-pill" id="dockPill">${items}</div>`;
  }

  // ── Command Bar ──
  function buildCommandBar() {
    return `
    <div class="cmd-bar" id="cmdBar">
      <div class="cmd-chips">
        <button onclick="ROS.chat.send('Find top matches')"><span class="material-symbols-outlined text-[14px]">person_search</span>Find Drivers</button>
        <button onclick="ROS.chat.send('Open pipeline')"><span class="material-symbols-outlined text-[14px]">view_kanban</span>Pipeline</button>
        <button onclick="ROS.chat.send('Run funnel report')"><span class="material-symbols-outlined text-[14px]">insights</span>Analytics</button>
        <button onclick="ROS.chat.send('Start onboarding')"><span class="material-symbols-outlined text-[14px]">verified</span>Onboard</button>
        <button onclick="ROS.chat.send('Open messages')"><span class="material-symbols-outlined text-[14px]">chat</span>Messages</button>
      </div>
      <div class="cmd-chat">
        <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-lmdr-blue to-lmdr-deep flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-white text-[16px]">smart_toy</span>
        </div>
        <input id="chatInput" type="text" placeholder="Ask the AI anything \u2014 try 'find drivers near Dallas'..." onkeydown="if(event.key==='Enter'){ROS.chat.handleSend()}"/>
        <button class="send-btn" onclick="ROS.chat.handleSend()">
          <span class="material-symbols-outlined text-white text-[16px]">arrow_upward</span>
        </button>
      </div>
    </div>`;
  }

  // ── Spotlight (container only, logic in ros-spotlight.js) ──
  function buildSpotlight() {
    return `
    <div class="spot-ov" id="spot" onclick="if(event.target===this)ROS.spotlight.close()">
      <div class="spot-box w-[520px] rounded-2xl overflow-hidden shadow-2xl">
        <div class="bg-lmdr-dark p-4 flex items-center gap-3 border-b border-white/5">
          <span class="material-symbols-outlined text-white/30 text-[20px]">search</span>
          <input id="slIn" class="flex-1 bg-transparent border-none outline-none text-white text-[16px] font-medium placeholder-white/25" placeholder="Search tools, drivers, commands..." oninput="ROS.spotlight.filter(this.value)"/>
          <span class="text-[9px] text-white/20 font-bold bg-white/[0.06] px-2 py-0.5 rounded border border-white/[0.06]">ESC</span>
        </div>
        <div class="bg-lmdr-dark p-2 max-h-[320px] overflow-y-auto" id="slR"></div>
      </div>
    </div>`;
  }

  // ── Drawer Toggle ──
  function toggleDrawer(id) {
    const body = document.getElementById('dr-' + id);
    const chev = document.getElementById('ch-' + id);
    if (!body || !chev) return;

    if (openDrawers.has(id)) {
      body.classList.remove('open');
      chev.classList.remove('open');
      openDrawers.delete(id);
    } else {
      body.classList.add('open');
      chev.classList.add('open');
      openDrawers.add(id);
    }
  }

  function openDrawer(id) {
    if (!openDrawers.has(id)) toggleDrawer(id);
  }

  function closeDrawer(id) {
    if (openDrawers.has(id)) toggleDrawer(id);
  }

  // ── Dock Navigation ──
  ROS.shell.dockNav = function(view, el) {
    document.querySelectorAll('.dock-pill .dk-i').forEach(d => d.classList.remove('active'));
    if (el) el.classList.add('active');
    ROS.views.showView(view);
  };

  ROS.shell.syncDock = function(viewId) {
    document.querySelectorAll('.dock-pill .dk-i').forEach(d => {
      d.classList.toggle('active', d.dataset.view === viewId);
    });
  };

  // ── Chat Push Layout ──
  ROS.shell.pushChatLayout = function(open) {
    const cmdBar = document.getElementById('cmdBar');
    const dock = document.getElementById('dockPill');
    if (open) {
      if (cmdBar) cmdBar.style.right = '400px';
      if (dock) dock.style.left = 'calc(50% - 75px)';
    } else {
      if (cmdBar) cmdBar.style.right = '0';
      if (dock) dock.style.left = 'calc(50% + 125px)';
    }
  };

  // ── Clock ──
  function startClock() {
    const update = () => {
      const el = document.getElementById('ros-clock');
      if (el) el.textContent = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    };
    update();
    setInterval(update, 30000);
  }

  // ── Mobile Hamburger ──
  function bindMobileHamburger() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('#hamburgerBtn');
      const overlay = document.getElementById('railOverlay');
      const rail = document.getElementById('ros-rail');
      if (btn && rail) {
        rail.classList.toggle('open');
        if (overlay) overlay.classList.toggle('vis', rail.classList.contains('open'));
      }
      if (e.target === overlay && rail) {
        rail.classList.remove('open');
        overlay.classList.remove('vis');
      }
    });
  }

  // Close rail when a tool is clicked on mobile
  ROS.shell.closeMobileRail = function() {
    const rail = document.getElementById('ros-rail');
    const overlay = document.getElementById('railOverlay');
    if (rail) rail.classList.remove('open');
    if (overlay) overlay.classList.remove('vis');
  };

})();
