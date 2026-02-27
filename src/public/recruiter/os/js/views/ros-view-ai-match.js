// ============================================================================
// ROS-VIEW-AI-MATCH — AI Driver Match Cards with Spider Charts
// Usage-limited regeneration, per-card and bulk regen, action buttons
// ============================================================================

(function () {
  'use strict';

  const VIEW_ID = 'ai-match';
  const MESSAGES = ['aiMatchesLoaded', 'aiMatchRegenerated'];
  const MAX_DAILY_USES = 5;

  let matches = [];
  let contentEl = null;

  // ── Usage Tracking (localStorage) ──────────────────────────────────────────

  function getStorageKey() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return 'ros-ai-match-usage-' + yyyy + '-' + mm + '-' + dd;
  }

  function getUsageToday() {
    try { return parseInt(localStorage.getItem(getStorageKey()) || '0', 10); }
    catch (e) { return 0; }
  }

  function incrementUsage() {
    try { localStorage.setItem(getStorageKey(), String(getUsageToday() + 1)); }
    catch (e) { /* storage full */ }
  }

  function getRemainingUses() {
    return Math.max(0, MAX_DAILY_USES - getUsageToday());
  }

  // ── Spider Chart SVG ───────────────────────────────────────────────────────

  function renderSpider(scores, id) {
    var axes = ['experience', 'qualifications', 'availability', 'location', 'salaryFit', 'engagement'];
    var labels = ['Exp', 'CDL', 'Avail', 'Loc', 'Pay', 'Stable'];
    var cx = 80, cy = 80, maxR = 60;

    var rings = [0.25, 0.5, 0.75, 1.0].map(function (f) {
      var pts = axes.map(function (_, i) {
        var angle = (i * 60 - 90) * Math.PI / 180;
        return (cx + Math.cos(angle) * maxR * f).toFixed(1) + ',' + (cy + Math.sin(angle) * maxR * f).toFixed(1);
      }).join(' ');
      return '<polygon points="' + pts + '" fill="none" stroke="#C8B896" stroke-width="0.5" opacity="0.4"/>';
    }).join('');

    var polyPts = axes.map(function (ax, i) {
      var val = ((scores && scores[ax]) || 0) / 100;
      var angle = (i * 60 - 90) * Math.PI / 180;
      return (cx + Math.cos(angle) * maxR * val).toFixed(1) + ',' + (cy + Math.sin(angle) * maxR * val).toFixed(1);
    }).join(' ');

    var axisLines = axes.map(function (_, i) {
      var angle = (i * 60 - 90) * Math.PI / 180;
      var x2 = cx + Math.cos(angle) * maxR;
      var y2 = cy + Math.sin(angle) * maxR;
      var lx = cx + Math.cos(angle) * (maxR + 12);
      var ly = cy + Math.sin(angle) * (maxR + 12);
      return '<line x1="' + cx + '" y1="' + cy + '" x2="' + x2.toFixed(1) + '" y2="' + y2.toFixed(1) + '" stroke="#C8B896" stroke-width="0.5" opacity="0.4"/>' +
        '<text x="' + lx.toFixed(1) + '" y="' + (ly + 3).toFixed(1) + '" text-anchor="middle" font-size="7" fill="#C8B896" font-family="Inter,sans-serif">' + labels[i] + '</text>';
    }).join('');

    return '<svg width="160" height="160" viewBox="0 0 160 160" id="aim-spider-' + id + '">' +
      rings + axisLines +
      '<polygon points="' + polyPts + '" fill="#2563eb" fill-opacity="0.25" stroke="#2563eb" stroke-width="1.5"/>' +
      '</svg>';
  }

  // ── Render Helpers ─────────────────────────────────────────────────────────

  function esc(s) { return (s || '').replace(/'/g, "\\'").replace(/"/g, '&quot;'); }

  function initials(name) {
    return (name || '?').split(' ').map(function (n) { return n[0]; }).join('').slice(0, 2).toUpperCase();
  }

  function renderSkeleton() {
    var card = '<div class="neu rounded-2xl p-5 mb-4 animate-pulse">' +
      '<div class="h-4 rounded w-3/4 mb-3" style="background:rgba(200,184,150,0.2)"></div>' +
      '<div class="h-32 rounded-xl mb-3" style="background:rgba(200,184,150,0.1)"></div>' +
      '<div class="h-3 rounded w-full mb-2" style="background:rgba(200,184,150,0.2)"></div>' +
      '<div class="h-3 rounded w-2/3" style="background:rgba(200,184,150,0.2)"></div>' +
      '</div>';
    return card + card + card;
  }

  function renderCard(m) {
    var jobsText = m.jobsLast3Years !== undefined ? m.jobsLast3Years + ' jobs/3yr' : '';
    return '<div class="neu rounded-2xl p-5 relative mb-4" id="aim-card-' + esc(m.id) + '">' +
      /* match badge */
      '<div class="absolute top-4 right-4 px-2 py-0.5 rounded-full text-white text-[11px] font-black" style="background:linear-gradient(135deg,#2563eb,#1e40af)">' + (m.matchPct || 0) + '%</div>' +
      /* avatar + name */
      '<div class="flex items-center gap-3 mb-3">' +
        '<div class="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-[14px]" style="background:linear-gradient(135deg,#2563eb,#1e40af)">' + initials(m.name) + '</div>' +
        '<div>' +
          '<p class="text-[14px] font-bold text-lmdr-dark">' + (m.name || 'Unknown') + '</p>' +
          '<p class="text-[11px]" style="color:rgba(200,184,150,0.8)">' + (m.location || 'Location unknown') + '</p>' +
        '</div>' +
      '</div>' +
      /* chips */
      '<div class="flex items-center gap-2 mb-3 flex-wrap">' +
        '<span class="neu-x px-2 py-0.5 rounded-full text-[10px] font-bold text-lmdr-dark">CDL-' + (m.cdlClass || 'A') + '</span>' +
        '<span class="flex items-center gap-1 text-[11px]" style="color:rgba(200,184,150,0.8)"><span class="material-symbols-outlined" style="font-size:13px">work</span>' + (m.experience || '0') + ' yrs</span>' +
        '<span class="ml-auto text-[10px] font-bold" style="color:rgba(200,184,150,0.8)">' + jobsText + '</span>' +
      '</div>' +
      /* spider chart */
      '<div class="flex justify-center my-2">' + renderSpider(m.scores || {}, m.id) + '</div>' +
      /* synopsis */
      '<div class="neu-ins rounded-xl p-3 mt-2"><p class="text-[12px] italic" style="color:rgba(200,184,150,0.85)" id="aim-synopsis-' + esc(m.id) + '">' + (m.synopsis || 'AI synopsis loading...') + '</p></div>' +
      /* action buttons */
      '<div class="flex items-center gap-2 mt-3">' +
        '<button class="aim-action-btn neu-x w-9 h-9 rounded-full flex items-center justify-center" title="Call" data-action="callDriver" data-driver-id="' + esc(m.id) + '" data-phone="' + esc(m.phone) + '"><span class="material-symbols-outlined text-sg text-[16px]">phone</span></button>' +
        '<button class="aim-action-btn neu-x w-9 h-9 rounded-full flex items-center justify-center" title="Text" data-action="sendSMS" data-driver-id="' + esc(m.id) + '" data-phone="' + esc(m.phone) + '"><span class="material-symbols-outlined text-lmdr-blue text-[16px]">sms</span></button>' +
        '<button class="aim-action-btn neu-x w-9 h-9 rounded-full flex items-center justify-center" title="Email" data-action="sendEmail" data-driver-id="' + esc(m.id) + '" data-email="' + esc(m.email) + '"><span class="material-symbols-outlined text-[16px]" style="color:#f97316">mail</span></button>' +
        '<button class="aim-action-btn neu-x w-9 h-9 rounded-full flex items-center justify-center" title="Add to Pipeline" data-action="addToPipeline" data-driver-id="' + esc(m.id) + '"><span class="material-symbols-outlined text-lmdr-yellow text-[16px]">add_circle_outline</span></button>' +
        '<button class="aim-regen-one ml-auto neu-x px-3 py-1 rounded-xl text-[11px] font-bold text-lmdr-dark flex items-center gap-1" data-driver-id="' + esc(m.id) + '"><span class="material-symbols-outlined text-[14px]">refresh</span>Regen</button>' +
      '</div>' +
    '</div>';
  }

  function renderCards(list) {
    return list.map(renderCard).join('');
  }

  function usageChipText() {
    return getUsageToday() + '/' + MAX_DAILY_USES + ' today';
  }

  function remainingText() {
    var rem = getRemainingUses();
    return rem > 0 ? '(' + rem + '/' + MAX_DAILY_USES + ' remaining)' : 'Refreshes tomorrow';
  }

  // ── Main render ────────────────────────────────────────────────────────────

  function render() {
    return '' +
      '<div class="flex items-center gap-3 mb-4">' +
        '<button id="aim-back" class="w-8 h-8 neu-s rounded-lg flex items-center justify-center">' +
          '<span class="material-symbols-outlined text-tan text-[16px]">arrow_back</span>' +
        '</button>' +
        '<div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:linear-gradient(135deg,#3b82f6,#4f46e5)">' +
          '<span class="material-symbols-outlined text-white text-[16px]">neurology</span>' +
        '</div>' +
        '<h2 class="text-lg font-bold text-lmdr-dark">AI Match</h2>' +
        '<div id="aim-usage-chip" class="ml-auto px-3 py-1 rounded-full text-[10px] font-bold" style="background:rgba(37,99,235,0.1);color:#2563eb">' + usageChipText() + '</div>' +
      '</div>' +
      '<div id="aim-cards-container">' + renderSkeleton() + '</div>' +
      '<div id="aim-regen-all-bar" class="mt-4 flex justify-center">' +
        '<button id="aim-regen-all" class="px-5 py-2.5 rounded-xl neu font-bold text-[13px] text-lmdr-dark flex items-center gap-2">' +
          '<span class="material-symbols-outlined text-lmdr-blue text-[18px]">auto_awesome</span>' +
          'Regenerate All' +
          '<span id="aim-remaining" class="text-[11px] font-medium" style="color:rgba(200,184,150,0.8)">' + remainingText() + '</span>' +
        '</button>' +
      '</div>';
  }

  // ── Usage display update ───────────────────────────────────────────────────

  function updateUsageDisplay() {
    var chip = document.getElementById('aim-usage-chip');
    if (chip) chip.textContent = usageChipText();

    var rem = getRemainingUses();
    var remainEl = document.getElementById('aim-remaining');
    if (remainEl) remainEl.textContent = remainingText();

    var btn = document.getElementById('aim-regen-all');
    if (btn) {
      if (rem <= 0) {
        btn.classList.add('opacity-50', 'cursor-not-allowed');
        btn.disabled = true;
      } else {
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
        btn.disabled = false;
      }
    }
  }

  // ── Event Handlers ─────────────────────────────────────────────────────────

  function handleRegenAll() {
    if (getRemainingUses() <= 0) return;
    incrementUsage();
    updateUsageDisplay();
    ROS.bridge.sendToVelo('regenerateAIMatches', {});
  }

  function handleRegenOne(driverId) {
    if (getRemainingUses() <= 0) return;
    incrementUsage();
    updateUsageDisplay();
    ROS.bridge.sendToVelo('regenerateAIMatch', { driverId: driverId });
  }

  function handleActionClick(e) {
    var btn = e.target.closest('.aim-action-btn');
    if (!btn) return;
    var action = btn.getAttribute('data-action');
    var driverId = btn.getAttribute('data-driver-id');
    var payload = { driverId: driverId };
    if (btn.getAttribute('data-phone')) payload.phone = btn.getAttribute('data-phone');
    if (btn.getAttribute('data-email')) payload.email = btn.getAttribute('data-email');
    ROS.bridge.sendToVelo(action, payload);
  }

  function handleRegenOneClick(e) {
    var btn = e.target.closest('.aim-regen-one');
    if (!btn) return;
    var driverId = btn.getAttribute('data-driver-id');
    if (driverId) handleRegenOne(driverId);
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  function onMount() {
    contentEl = document.getElementById('aim-cards-container');

    var back = document.getElementById('aim-back');
    if (back) back.addEventListener('click', function () { ROS.views.showView('home'); });

    var regenAll = document.getElementById('aim-regen-all');
    if (regenAll) regenAll.addEventListener('click', handleRegenAll);

    if (contentEl) {
      contentEl.addEventListener('click', handleActionClick);
      contentEl.addEventListener('click', handleRegenOneClick);
    }

    updateUsageDisplay();
    ROS.bridge.sendToVelo('getAIMatches', {});
  }

  function onUnmount() {
    if (contentEl) {
      contentEl.removeEventListener('click', handleActionClick);
      contentEl.removeEventListener('click', handleRegenOneClick);
    }
    contentEl = null;
    matches = [];
  }

  function onMessage(action, data) {
    if (action === 'aiMatchesLoaded' && contentEl) {
      matches = (data && data.matches) || [];
      if (matches.length > 0) {
        contentEl.innerHTML = renderCards(matches);
      } else {
        contentEl.textContent = '';
        var msg = document.createElement('p');
        msg.className = 'text-center text-[13px] py-8';
        msg.style.color = 'rgba(200,184,150,0.7)';
        msg.textContent = 'No AI matches found. Try adjusting filters.';
        contentEl.appendChild(msg);
      }
      updateUsageDisplay();
    }

    if (action === 'aiMatchRegenerated' && contentEl && data) {
      var idx = matches.findIndex(function (m) { return m.id === data.id; });
      if (idx !== -1) {
        matches[idx] = data;
        var cardEl = document.getElementById('aim-card-' + data.id);
        if (cardEl) {
          var tmp = document.createElement('div');
          tmp.innerHTML = renderCard(data);
          cardEl.replaceWith(tmp.firstElementChild);
        }
      }
      updateUsageDisplay();
    }
  }

  // ── Register ───────────────────────────────────────────────────────────────

  ROS.views.registerView(VIEW_ID, {
    render: render,
    onMount: onMount,
    onUnmount: onUnmount,
    onMessage: onMessage,
    messages: MESSAGES
  });

})();
