// ============================================================================
// ROS-VIEW-INTEL — Competitor Intelligence
// Pay rates, hiring velocity, driver sentiment, threat levels
// ============================================================================

(function() {
  'use strict';

  const VIEW_ID = 'intel';
  const MESSAGES = ['competitorDataLoaded', 'intelAdded'];

  let intelData = null;

  function render() {
    return `
      <div class="flex items-center gap-3">
        <button onclick="ROS.views.showView('home')" class="w-8 h-8 neu-s rounded-lg flex items-center justify-center">
          <span class="material-symbols-outlined text-tan text-[16px]">arrow_back</span>
        </button>
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
          <span class="material-symbols-outlined text-white text-[16px]">visibility</span>
        </div>
        <h2 class="text-lg font-bold text-lmdr-dark">Competitor Intelligence</h2>
        <span class="ml-auto text-[11px] text-tan font-medium" id="intel-updated">--</span>
      </div>

      <!-- Top KPI Cards -->
      <div class="grid grid-cols-4 gap-4 mt-4">
        <div class="neu-s p-5 rounded-xl">
          <p class="text-[10px] font-bold uppercase tracking-widest text-tan">Your Avg CPM</p>
          <h3 class="text-[28px] font-black text-lmdr-dark mt-1" id="intel-your-cpm">--</h3>
          <span class="text-[11px] text-tan font-medium">cents/mile</span>
        </div>
        <div class="neu-s p-5 rounded-xl">
          <p class="text-[10px] font-bold uppercase tracking-widest text-tan">Market Avg</p>
          <h3 class="text-[28px] font-black text-lmdr-blue mt-1" id="intel-market-cpm">--</h3>
          <span class="text-[11px] text-tan font-medium">cents/mile</span>
        </div>
        <div class="neu-s p-5 rounded-xl">
          <p class="text-[10px] font-bold uppercase tracking-widest text-tan">Tracked</p>
          <h3 class="text-[28px] font-black text-lmdr-dark mt-1" id="intel-tracked">--</h3>
          <span class="text-[11px] text-tan font-medium">competitors</span>
        </div>
        <div class="neu-s p-5 rounded-xl">
          <p class="text-[10px] font-bold uppercase tracking-widest text-tan">Threat Level</p>
          <h3 class="text-[22px] font-black mt-1" id="intel-threat">--</h3>
          <div class="h-1.5 w-full neu-ins rounded-full overflow-hidden mt-2">
            <div class="h-full rounded-full transition-all" id="intel-threat-bar" style="width:0%"></div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-5 mt-4">
        <!-- Pay Rate Comparison -->
        <div class="neu rounded-2xl p-6">
          <h3 class="text-[14px] font-bold text-lmdr-dark mb-4">Pay Rate Comparison</h3>
          <div class="flex flex-col gap-3" id="intel-pay-bars">
            <div class="text-center text-[12px] text-tan py-4">Loading pay data...</div>
          </div>
        </div>

        <!-- Hiring Velocity Table -->
        <div class="neu rounded-2xl p-6">
          <h3 class="text-[14px] font-bold text-lmdr-dark mb-4">Hiring Velocity</h3>
          <div class="overflow-auto">
            <table class="w-full text-[11px]">
              <thead>
                <tr class="text-left text-tan font-bold uppercase tracking-wider">
                  <th class="pb-2">Competitor</th>
                  <th class="pb-2 text-center">Hires/Mo</th>
                  <th class="pb-2 text-center">Trend</th>
                </tr>
              </thead>
              <tbody id="intel-velocity-rows">
                <tr><td colspan="3" class="text-center text-tan py-4">Loading...</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Driver Sentiment -->
      <div class="neu rounded-2xl p-6 mt-4">
        <h3 class="text-[14px] font-bold text-lmdr-dark mb-4">Driver Sentiment by Carrier</h3>
        <div class="flex flex-col gap-2" id="intel-sentiment-list">
          <div class="text-center text-[12px] text-tan py-4">Loading sentiment data...</div>
        </div>
      </div>`;
  }

  function onMount() {
    ROS.bridge.sendToVelo('getCompetitorData', {});
  }

  function onUnmount() {
    intelData = null;
  }

  function onMessage(type, data) {
    switch (type) {
      case 'competitorDataLoaded':
        intelData = data;
        renderIntel(data);
        break;

      case 'intelAdded':
        showToast('Intel entry added');
        ROS.bridge.sendToVelo('getCompetitorData', {});
        break;
    }
  }

  function renderIntel(data) {
    if (!data) return;
    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

    setText('intel-your-cpm', data.yourCPM || '--');
    setText('intel-market-cpm', data.marketCPM || '--');
    setText('intel-tracked', data.competitorsTracked || '0');
    setText('intel-updated', data.lastUpdated ? 'Updated ' + data.lastUpdated : '');

    // Threat level
    const threatEl = document.getElementById('intel-threat');
    const threatBar = document.getElementById('intel-threat-bar');
    const threat = data.threatLevel || 'Low';
    const threatConfig = {
      'Critical': { color: 'text-red-500', barColor: 'bg-red-500', pct: 100 },
      'High':     { color: 'text-orange-500', barColor: 'bg-orange-500', pct: 75 },
      'Medium':   { color: 'text-amber-500', barColor: 'bg-amber-500', pct: 50 },
      'Low':      { color: 'text-sg', barColor: 'bg-emerald-500', pct: 25 }
    };
    const tc = threatConfig[threat] || threatConfig['Low'];
    if (threatEl) { threatEl.textContent = threat; threatEl.className = 'text-[22px] font-black mt-1 ' + tc.color; }
    if (threatBar) { threatBar.style.width = tc.pct + '%'; threatBar.className = 'h-full rounded-full transition-all ' + tc.barColor; }

    // Pay rate bars
    if (data.payComparison) renderPayBars(data.payComparison);

    // Hiring velocity table
    if (data.hiringVelocity) renderVelocityTable(data.hiringVelocity);

    // Driver sentiment
    if (data.driverSentiment) renderSentiment(data.driverSentiment);
  }

  function renderPayBars(comparisons) {
    const container = document.getElementById('intel-pay-bars');
    if (!container || !Array.isArray(comparisons)) return;

    const max = Math.max(...comparisons.map(c => c.cpm || c.rate || 0), 1);

    container.innerHTML = comparisons.map(c => {
      const name = c.name || c.carrier || 'Unknown';
      const rate = c.cpm || c.rate || 0;
      const pct = Math.round((rate / max) * 100);
      const isYou = c.isYou || c.isSelf;
      const barColor = isYou ? 'bg-gradient-to-r from-violet-500 to-purple-500' : 'bg-lmdr-blue/25';
      const textClass = isYou ? 'text-violet-600 font-black' : 'text-lmdr-dark';

      return `
        <div>
          <div class="flex items-center justify-between mb-1">
            <span class="text-[11px] font-bold ${textClass}">${escapeHtml(name)} ${isYou ? '(You)' : ''}</span>
            <span class="text-[11px] font-bold text-lmdr-dark">${rate}\u00a2</span>
          </div>
          <div class="h-3 w-full neu-ins rounded-full overflow-hidden">
            <div class="h-full ${barColor} rounded-full" style="width:${pct}%"></div>
          </div>
        </div>`;
    }).join('');
  }

  function renderVelocityTable(velocity) {
    const tbody = document.getElementById('intel-velocity-rows');
    if (!tbody || !Array.isArray(velocity)) return;

    tbody.innerHTML = velocity.map(v => {
      const name = v.name || v.carrier || 'Unknown';
      const hires = v.hiresPerMonth || v.hires || 0;
      const trend = v.trend || 'flat';
      const trendIcon = trend === 'up' ? 'trending_up' : trend === 'down' ? 'trending_down' : 'trending_flat';
      const trendColor = trend === 'up' ? 'text-sg' : trend === 'down' ? 'text-red-400' : 'text-tan';

      return `
        <tr class="border-t border-beige-d/30">
          <td class="py-2.5 text-[12px] font-bold text-lmdr-dark">${escapeHtml(name)}</td>
          <td class="py-2.5 text-center text-[12px] font-bold text-lmdr-dark">${hires}</td>
          <td class="py-2.5 text-center">
            <span class="material-symbols-outlined text-[16px] ${trendColor}">${trendIcon}</span>
          </td>
        </tr>`;
    }).join('');
  }

  function renderSentiment(sentiment) {
    const list = document.getElementById('intel-sentiment-list');
    if (!list || !Array.isArray(sentiment)) return;

    list.innerHTML = sentiment.map(s => {
      const name = s.name || s.carrier || 'Unknown';
      const rating = s.rating || s.score || 0;
      const maxStars = 5;
      const fullStars = Math.floor(rating);
      const halfStar = rating % 1 >= 0.5;
      const stars = Array.from({ length: maxStars }, (_, i) => {
        if (i < fullStars) return '<span class="material-symbols-outlined text-[14px] text-amber-400">star</span>';
        if (i === fullStars && halfStar) return '<span class="material-symbols-outlined text-[14px] text-amber-400">star_half</span>';
        return '<span class="material-symbols-outlined text-[14px] text-tan/30">star</span>';
      }).join('');
      const reviews = s.reviewCount || s.reviews || 0;

      return `
        <div class="flex items-center gap-3 p-2.5 neu-x rounded-xl">
          <div class="flex-1">
            <div class="text-[12px] font-bold text-lmdr-dark">${escapeHtml(name)}</div>
          </div>
          <div class="flex items-center gap-1">${stars}</div>
          <span class="text-[10px] text-tan font-medium">${rating.toFixed(1)} (${reviews})</span>
        </div>`;
    }).join('');
  }

  function showToast(msg) {
    const t = document.createElement('div');
    t.className = 'fixed top-16 right-4 z-[9999] px-4 py-2.5 rounded-xl neu-s text-[12px] font-bold text-lmdr-dark';
    t.style.animation = 'fadeUp .3s ease';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  function escapeHtml(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  ROS.views.registerView(VIEW_ID, { render, onMount, onUnmount, onMessage, messages: MESSAGES });
})();
