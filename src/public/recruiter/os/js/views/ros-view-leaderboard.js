// ============================================================================
// ROS-VIEW-LEADERBOARD — Recruiter Leaderboard + Badges
// Top 3 podium, full rankings with XP/hires, badge grid
// ============================================================================

(function() {
  'use strict';

  const VIEW_ID = 'leaderboard';
  const MESSAGES = ['leaderboardLoaded', 'badgesLoaded', 'progressionLoaded'];

  let rankings = [];
  let badges = [];

  function render() {
    return `
      <div class="flex items-center gap-3">
        <button onclick="ROS.views.showView('home')" class="w-8 h-8 neu-s rounded-lg flex items-center justify-center">
          <span class="material-symbols-outlined text-tan text-[16px]">arrow_back</span>
        </button>
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
          <span class="material-symbols-outlined text-white text-[16px]">emoji_events</span>
        </div>
        <h2 class="text-lg font-bold text-lmdr-dark">Leaderboard</h2>
      </div>

      <!-- Top 3 Podium -->
      <div class="flex items-end justify-center gap-4 mt-6 mb-2" id="lb-podium">
        <div class="text-center text-[12px] text-tan py-8">Loading leaderboard...</div>
      </div>

      <!-- Full Rankings Table -->
      <div class="neu rounded-2xl p-5 mt-4">
        <h3 class="text-[14px] font-bold text-lmdr-dark mb-3">Full Rankings</h3>
        <div class="overflow-auto">
          <table class="w-full text-[11px]">
            <thead>
              <tr class="text-left text-tan font-bold uppercase tracking-wider text-[9px]">
                <th class="pb-2 w-10">#</th>
                <th class="pb-2">Recruiter</th>
                <th class="pb-2 text-center">XP</th>
                <th class="pb-2 text-center">Hires</th>
                <th class="pb-2 text-center">Level</th>
              </tr>
            </thead>
            <tbody id="lb-rankings-rows">
              <tr><td colspan="5" class="text-center text-tan py-4">Loading...</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Badge Grid -->
      <div class="neu rounded-2xl p-5 mt-4">
        <h3 class="text-[14px] font-bold text-lmdr-dark mb-3">Badges</h3>
        <div class="grid grid-cols-6 gap-3" id="lb-badge-grid">
          <div class="col-span-6 text-center text-[12px] text-tan py-4">Loading badges...</div>
        </div>
      </div>`;
  }

  function onMount() {
    ROS.bridge.sendToVelo('getLeaderboard', {});
    ROS.bridge.sendToVelo('getBadges', {});
  }

  function onUnmount() {
    rankings = [];
    badges = [];
  }

  function onMessage(type, data) {
    switch (type) {
      case 'leaderboardLoaded':
        rankings = (data && data.rankings) || data || [];
        if (Array.isArray(rankings)) {
          renderPodium();
          renderRankings();
        }
        break;

      case 'badgesLoaded':
        badges = (data && data.badges) || data || [];
        if (Array.isArray(badges)) renderBadges();
        break;

      case 'progressionLoaded':
        // Future: render level progression overlay
        break;
    }
  }

  function renderPodium() {
    const podium = document.getElementById('lb-podium');
    if (!podium) return;

    const top3 = rankings.slice(0, 3);
    if (top3.length === 0) {
      podium.innerHTML = '<div class="text-center text-[12px] text-tan py-8">No rankings available yet</div>';
      return;
    }

    const podiumConfig = [
      { place: 2, height: 'h-[100px]', color: 'from-slate-300 to-slate-400', medal: '#C0C0C0', label: '2nd' },
      { place: 1, height: 'h-[130px]', color: 'from-amber-300 to-yellow-500', medal: '#FFD700', label: '1st' },
      { place: 3, height: 'h-[80px]',  color: 'from-orange-400 to-amber-600', medal: '#CD7F32', label: '3rd' }
    ];

    const order = [1, 0, 2]; // Display: 2nd, 1st, 3rd

    podium.innerHTML = order.map(idx => {
      const config = podiumConfig[idx];
      const recruiter = top3[config.place - 1];
      if (!recruiter) return '';

      const name = recruiter.name || recruiter.recruiter_name || 'Unknown';
      const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
      const xp = recruiter.xp || recruiter.total_xp || 0;
      const hires = recruiter.hires || recruiter.total_hires || 0;

      return `
        <div class="flex flex-col items-center w-[120px]">
          <div class="w-14 h-14 rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center font-black text-white text-[16px] shadow-lg mb-2 relative">
            ${initials}
            <span class="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white shadow-md" style="background:${config.medal}">${config.place}</span>
          </div>
          <div class="text-[12px] font-bold text-lmdr-dark text-center">${escapeHtml(name)}</div>
          <div class="text-[10px] text-tan">${formatNumber(xp)} XP \u00b7 ${hires} hires</div>
          <div class="w-full ${config.height} rounded-t-xl bg-gradient-to-t ${config.color} mt-2 flex items-end justify-center pb-2">
            <span class="text-[11px] font-black text-white/80">${config.label}</span>
          </div>
        </div>`;
    }).join('');
  }

  function renderRankings() {
    const tbody = document.getElementById('lb-rankings-rows');
    if (!tbody) return;

    if (rankings.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center text-tan py-4">No rankings available</td></tr>';
      return;
    }

    tbody.innerHTML = rankings.map((r, i) => {
      const name = r.name || r.recruiter_name || 'Unknown';
      const xp = r.xp || r.total_xp || 0;
      const hires = r.hires || r.total_hires || 0;
      const level = r.level || r.recruiter_level || 1;
      const rankColors = { 0: 'text-amber-500', 1: 'text-slate-400', 2: 'text-orange-600' };
      const rankColor = rankColors[i] || 'text-lmdr-dark';

      const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
      const avatarColors = ['from-lmdr-blue to-lmdr-deep', 'from-amber-400 to-orange-500', 'from-emerald-400 to-teal-600', 'from-violet-400 to-purple-600'];
      const ci = name.charCodeAt(0) % avatarColors.length;

      return `
        <tr class="border-t border-beige-d/30">
          <td class="py-2.5 ${rankColor} font-black">${i + 1}</td>
          <td class="py-2.5">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-lg bg-gradient-to-br ${avatarColors[ci]} flex items-center justify-center text-[10px] font-black text-white">${initials}</div>
              <span class="text-[12px] font-bold text-lmdr-dark">${escapeHtml(name)}</span>
            </div>
          </td>
          <td class="py-2.5 text-center text-[12px] font-bold text-lmdr-dark">${formatNumber(xp)}</td>
          <td class="py-2.5 text-center text-[12px] font-bold text-sg">${hires}</td>
          <td class="py-2.5 text-center">
            <span class="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-700">Lv ${level}</span>
          </td>
        </tr>`;
    }).join('');
  }

  function renderBadges() {
    const grid = document.getElementById('lb-badge-grid');
    if (!grid) return;

    if (badges.length === 0) {
      grid.innerHTML = '<div class="col-span-6 text-center text-[12px] text-tan py-4">No badges earned yet</div>';
      return;
    }

    grid.innerHTML = badges.map(b => {
      const name = b.name || b.badge_name || 'Badge';
      const icon = b.icon || 'military_tech';
      const earned = b.earned || b.unlocked;
      const opacity = earned ? '' : 'opacity-30 grayscale';

      return `
        <div class="flex flex-col items-center p-3 neu-s rounded-xl ${opacity}" title="${escapeHtml(b.description || name)}">
          <span class="material-symbols-outlined text-[24px] text-amber-500">${icon}</span>
          <span class="text-[9px] font-bold text-lmdr-dark mt-1.5 text-center leading-tight">${escapeHtml(name)}</span>
        </div>`;
    }).join('');
  }

  function formatNumber(n) {
    if (!n) return '0';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return String(n);
  }

  function escapeHtml(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  ROS.views.registerView(VIEW_ID, { render, onMount, onUnmount, onMessage, messages: MESSAGES });
})();
