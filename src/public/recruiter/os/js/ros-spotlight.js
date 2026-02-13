// ============================================================================
// ROS-SPOTLIGHT — Cmd+K Fuzzy Search Overlay
// ============================================================================

(function() {
  'use strict';

  const TOOLS = ROS.TOOL_REGISTRY;
  let selectedIndex = 0;
  let filteredTools = [];

  ROS.spotlight = { open, close, filter };

  function open() {
    const spot = document.getElementById('spot');
    const input = document.getElementById('slIn');
    if (!spot) return;
    spot.classList.add('vis');
    if (input) { input.value = ''; input.focus(); }
    selectedIndex = 0;
    filteredTools = TOOLS.slice();
    renderList(filteredTools);
  }

  function close() {
    const spot = document.getElementById('spot');
    if (spot) spot.classList.remove('vis');
  }

  function filter(query) {
    if (!query) {
      selectedIndex = 0;
      filteredTools = TOOLS.slice();
      renderList(filteredTools);
      return;
    }
    const q = query.toLowerCase();
    filteredTools = TOOLS.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.desc.toLowerCase().includes(q) ||
      t.id.toLowerCase().includes(q)
    );
    selectedIndex = 0;
    renderList(filteredTools);
  }

  function renderList(list) {
    const container = document.getElementById('slR');
    if (!container) return;

    container.innerHTML = list.map((t, i) => {
      const activeClass = i === selectedIndex ? 'bg-lmdr-blue/10' : '';
      const statusBadge = t.status === 'future'
        ? '<span class="text-[8px] text-white/20 font-bold bg-white/[.05] px-1.5 py-0.5 rounded ml-auto">Soon</span>'
        : '';
      return `
        <div class="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer ${activeClass} hover:bg-lmdr-blue/10 transition-colors"
             data-sl-idx="${i}" onclick="ROS.spotlight._select(${i})">
          <div class="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style="background:${t.color}">
            <span class="material-symbols-outlined text-white text-[14px]">${t.icon}</span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-[12px] font-semibold text-white">${t.name}</div>
            <div class="text-[10px] text-white/30 truncate">${t.desc}</div>
          </div>
          ${statusBadge}
        </div>`;
    }).join('');
  }

  // Public handler for onclick
  ROS.spotlight._select = function(idx) {
    const tool = filteredTools[idx];
    if (!tool) return;
    close();
    if (tool.view) {
      ROS.views.showView(tool.view);
    } else {
      ROS.chat.flashMsg(tool.name + ' \u2014 Coming Soon');
    }
  };

  // ── Keyboard Navigation ──
  document.addEventListener('keydown', (e) => {
    const spot = document.getElementById('spot');
    if (!spot) return;
    const isOpen = spot.classList.contains('vis');

    // Cmd+K / Ctrl+K to toggle
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      isOpen ? close() : open();
      return;
    }

    if (!isOpen) return;

    // ESC to close
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }

    // Arrow navigation
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, filteredTools.length - 1);
      renderList(filteredTools);
      scrollToSelected();
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
      renderList(filteredTools);
      scrollToSelected();
    }

    // Enter to select
    if (e.key === 'Enter') {
      e.preventDefault();
      ROS.spotlight._select(selectedIndex);
    }
  });

  function scrollToSelected() {
    const container = document.getElementById('slR');
    if (!container) return;
    const item = container.querySelector(`[data-sl-idx="${selectedIndex}"]`);
    if (item) item.scrollIntoView({ block: 'nearest' });
  }

})();
