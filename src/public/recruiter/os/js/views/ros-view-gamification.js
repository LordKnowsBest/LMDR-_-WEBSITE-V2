// ============================================================================
// ROS-VIEW-GAMIFICATION — XP, Achievements, Streaks
// Ported from: RECRUITER_GAMIFICATION.html
// ============================================================================

(function () {
    'use strict';

    const VIEW_ID = 'gamification';
    const MESSAGES = ['gamificationLoaded'];

    let data = { rank: 1, title: 'Associate', points: 0, nextLevel: 250, streak: 0, badges: [], achievements: [] };

    function render() {
        const pct = data.nextLevel ? Math.round((data.points / data.nextLevel) * 100) : 0;
        return `
      <div class="flex items-center gap-3">
        <button onclick="ROS.views.showView('home')" class="w-8 h-8 neu-s rounded-lg flex items-center justify-center">
          <span class="material-symbols-outlined text-tan text-[16px]">arrow_back</span>
        </button>
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
          <span class="material-symbols-outlined text-white text-[16px]">emoji_events</span>
        </div>
        <h2 class="text-lg font-bold text-lmdr-dark">Gamification</h2>
      </div>

      <!-- Rank Card -->
      <div class="mt-4 neu rounded-2xl p-5">
        <div class="flex items-center justify-between mb-3">
          <div>
            <p class="text-[10px] font-bold text-tan uppercase tracking-wider">Current Rank</p>
            <h3 class="text-[20px] font-black text-lmdr-dark">Rank ${data.rank}: ${escapeHtml(data.title)}</h3>
          </div>
          <div class="text-right">
            <p class="text-[22px] font-black text-lmdr-blue">${data.points.toLocaleString()}</p>
            <p class="text-[9px] font-bold text-tan uppercase tracking-wider">Points</p>
          </div>
        </div>
        <div class="w-full h-3 rounded-full neu-ins overflow-hidden">
          <div class="h-full bg-gradient-to-r from-lmdr-blue to-lmdr-deep rounded-full transition-all" style="width: ${pct}%"></div>
        </div>
        <p class="text-[9px] text-tan mt-1">${data.points} / ${data.nextLevel} to next rank</p>
      </div>

      <!-- Stats Strip -->
      <div class="grid grid-cols-4 gap-3 mt-4">
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-amber-400 text-[18px]">local_fire_department</span>
          <h3 class="text-[20px] font-black text-lmdr-dark mt-0.5">${data.streak}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Day Streak</p>
        </div>
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-purple-400 text-[18px]">stars</span>
          <h3 class="text-[20px] font-black text-lmdr-dark mt-0.5">${data.badges.length}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Badges</p>
        </div>
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-emerald-500 text-[18px]">military_tech</span>
          <h3 class="text-[20px] font-black text-lmdr-dark mt-0.5">${data.achievements.length}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Achievements</p>
        </div>
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-lmdr-blue text-[18px]">leaderboard</span>
          <h3 class="text-[20px] font-black text-lmdr-dark mt-0.5">#${data.leaderboardPos || '—'}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Rank</p>
        </div>
      </div>

      <!-- Badges -->
      <div class="mt-4">
        <h3 class="text-[12px] font-bold text-lmdr-dark mb-2">Badges</h3>
        ${data.badges.length ? `<div class="grid grid-cols-4 gap-2">${data.badges.map(b => `
          <div class="neu-x rounded-xl p-3 text-center"><span class="text-[24px]">${b.emoji || '🏆'}</span><p class="text-[9px] font-bold text-lmdr-dark mt-1">${escapeHtml(b.name)}</p></div>`).join('')}</div>` :
                `<div class="neu-in rounded-xl p-6 text-center"><span class="material-symbols-outlined text-tan/30 text-[28px]">stars</span><p class="text-[12px] text-tan mt-1">No badges earned yet. Keep recruiting!</p></div>`}
      </div>

      <!-- Achievements -->
      <div class="mt-4">
        <h3 class="text-[12px] font-bold text-lmdr-dark mb-2">Recent Achievements</h3>
        ${data.achievements.length ? `<div class="space-y-2">${data.achievements.slice(0, 5).map(a => `
          <div class="neu-x rounded-xl p-3 flex items-center gap-3"><span class="material-symbols-outlined text-amber-400 text-[18px]">military_tech</span><div><p class="text-[12px] font-bold text-lmdr-dark">${escapeHtml(a.title)}</p><p class="text-[9px] text-tan">${a.desc || ''} · +${a.xp || 0} XP</p></div></div>`).join('')}</div>` :
                `<div class="neu-in rounded-xl p-6 text-center"><span class="material-symbols-outlined text-tan/30 text-[28px]">military_tech</span><p class="text-[12px] text-tan mt-1">No achievements yet.</p></div>`}
      </div>`;
    }

    function onMount() { ROS.bridge.sendToVelo('fetchGamification', {}); }
    function onUnmount() { data = { rank: 1, title: 'Associate', points: 0, nextLevel: 250, streak: 0, badges: [], achievements: [] }; }
    function onMessage(type, payload) { if (type === 'gamificationLoaded') { data = { ...data, ...payload }; const s = document.getElementById('ros-stage'); if (s) s.innerHTML = render(); } }
    function escapeHtml(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

    ROS.views.registerView(VIEW_ID, { render, onMount, onUnmount, onMessage, messages: MESSAGES });
})();
