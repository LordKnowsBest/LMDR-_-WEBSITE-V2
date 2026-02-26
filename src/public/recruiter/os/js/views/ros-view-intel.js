// ============================================================================
// ROS-VIEW-INTEL — Competitor Intelligence
// Pay rates, hiring velocity, driver sentiment, threat levels
// ============================================================================

(function () {
  'use strict';

  const VIEW_ID = 'intel';
  const MESSAGES = ['competitorDataLoaded', 'intelAdded'];

  let intelData = null;

  function render() {
    return `
      <div class="flex items-center gap-3 justify-between flex-wrap">
        <div class="flex items-center gap-3">
          <button onclick="ROS.views.showView('home')" class="w-8 h-8 neu-s rounded-lg flex items-center justify-center">
            <span class="material-symbols-outlined text-tan text-[16px]">arrow_back</span>
          </button>
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <span class="material-symbols-outlined text-white text-[16px]">visibility</span>
          </div>
          <h2 class="text-lg font-bold text-lmdr-dark">Competitor Intelligence</h2>
          <span class="ml-2 text-[11px] text-tan font-medium" id="intel-updated"></span>
        </div>
        
        <div class="flex items-center gap-3">
          <button onclick="ROS.views._intel.openModal()" class="neu-s px-3 py-1.5 rounded-lg flex items-center gap-1.5 hover:text-violet-600 transition-colors">
            <span class="material-symbols-outlined text-[14px]">add</span>
            <span class="text-[11px] font-bold uppercase tracking-wider">Add Intel</span>
          </button>
          
          <div class="relative group neu-in rounded-xl overflow-hidden flex items-center">
            <select id="intel-region-filter" onchange="ROS.views._intel.fetchData()"
              class="appearance-none bg-transparent border-none text-[12px] font-bold text-lmdr-dark pl-3 pr-8 py-2 focus:ring-0 outline-none cursor-pointer">
              <option value="Southeast">Southeast</option>
              <option value="Northeast">Northeast</option>
              <option value="Midwest">Midwest</option>
              <option value="West">West</option>
              <option value="National">National</option>
            </select>
            <span class="material-symbols-outlined text-tan text-[14px] absolute right-2 pointer-events-none">expand_more</span>
          </div>

          <div class="relative group neu-in rounded-xl overflow-hidden flex items-center">
            <select id="intel-job-type-filter" onchange="ROS.views._intel.fetchData()"
              class="appearance-none bg-transparent border-none text-[12px] font-bold text-lmdr-dark pl-3 pr-8 py-2 focus:ring-0 outline-none cursor-pointer">
              <option value="OTR">OTR</option>
              <option value="Regional">Regional</option>
              <option value="Local">Local</option>
            </select>
            <span class="material-symbols-outlined text-tan text-[14px] absolute right-2 pointer-events-none">expand_more</span>
          </div>
        </div>
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
      <!-- Market Pay Benchmarks -->
      <div class="neu rounded-2xl p-6 mt-4">
        <div class="flex justify-between items-center mb-6">
          <div>
            <h3 class="text-[14px] font-bold text-lmdr-dark">Market Pay Benchmarks (CPM)</h3>
            <p class="text-[10px] text-tan font-medium mt-1 uppercase tracking-wider">Based on <span id="intel-sample-size" class="text-lmdr-dark font-bold">0</span> tracked competitors</p>
          </div>
          <div class="text-right">
            <p class="text-[9px] font-bold text-tan uppercase tracking-widest">Your Position</p>
            <p class="text-[16px] font-black text-violet-600" id="intel-percentile-text">--</p>
          </div>
        </div>

        <!-- Pay Scale Visualization -->
        <div class="relative h-20 mx-4 mt-8 bg-transparent">
          <div class="absolute top-1/2 left-0 right-0 h-2 neu-ins rounded-full transform -translate-y-1/2"></div>
          
          <div id="intel-range-fill" class="absolute top-1/2 h-2 bg-gradient-to-r from-lmdr-blue/30 to-lmdr-blue/80 rounded-full transform -translate-y-1/2"></div>
          
          <div id="intel-marker-min" class="absolute top-1/2 w-0.5 h-6 bg-tan/50 transform -translate-y-1/2">
            <span class="absolute top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-tan" id="intel-label-min">--</span>
          </div>
          <div id="intel-marker-avg" class="absolute top-1/2 w-0.5 h-8 bg-tan transform -translate-y-1/2">
            <span class="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-bold text-tan uppercase">AVG</span>
            <span class="absolute top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-lmdr-dark" id="intel-label-avg">--</span>
          </div>
          <div id="intel-marker-max" class="absolute top-1/2 w-0.5 h-6 bg-tan/50 transform -translate-y-1/2">
            <span class="absolute top-8 left-1/2 -translate-x-1/2 text-[10px] font-bold text-tan" id="intel-label-max">--</span>
          </div>

          <!-- Your Position Dot -->
          <div id="intel-your-dot" class="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 flex flex-col items-center z-10 transition-all duration-500">
            <div class="bg-violet-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap mb-1">YOU</div>
            <div class="w-4 h-4 bg-violet-500 border-2 border-beige-d rounded-full shadow-md"></div>
            <span class="text-[10px] font-black text-violet-700 mt-1" id="intel-label-you">--</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-5 mt-4">
        <!-- Competitor Offers Table -->
        <div class="neu rounded-2xl overflow-hidden flex flex-col">
          <div class="p-4 border-b border-black/5">
            <h3 class="text-[14px] font-bold text-lmdr-dark">Competitor Offers</h3>
          </div>
          <div class="overflow-auto flex-1 h-[250px] thin-scroll">
            <table class="w-full text-[11px]">
              <thead class="bg-black/5 sticky top-0">
                <tr class="text-left text-tan font-bold uppercase tracking-wider">
                  <th class="px-4 py-3">Carrier</th>
                  <th class="px-3 py-3 text-right">CPM Range</th>
                  <th class="px-3 py-3 text-right">Sign-On</th>
                  <th class="px-4 py-3 text-center">Home Time</th>
                </tr>
              </thead>
              <tbody id="intel-offers-rows" class="divide-y divide-black/5">
                <tr><td colspan="4" class="text-center text-tan py-4">Loading...</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Hiring Velocity Table -->
        <div class="neu rounded-2xl overflow-hidden flex flex-col">
          <div class="p-4 border-b border-black/5">
            <h3 class="text-[14px] font-bold text-lmdr-dark">Hiring Velocity</h3>
          </div>
          <div class="overflow-auto flex-1 h-[250px] thin-scroll">
            <table class="w-full text-[11px]">
              <thead>
                <tr class="text-left text-tan font-bold uppercase tracking-wider">
                  <th class="px-4 py-3">Competitor</th>
                  <th class="px-4 py-3 text-center">Hires/Mo</th>
                  <th class="px-4 py-3 text-center">Trend</th>
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
      <div class="neu rounded-2xl p-6 mt-4 mb-8">
        <h3 class="text-[14px] font-bold text-lmdr-dark mb-4">Driver Sentiment by Carrier</h3>
        <div class="flex flex-col gap-2" id="intel-sentiment-list">
          <div class="text-center text-[12px] text-tan py-4">Loading sentiment data...</div>
        </div>
      </div>

      <!-- ADD INTEL MODAL -->
      <div id="intel-add-modal" class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center hidden opacity-0 transition-opacity duration-300">
        <div class="neu bg-lmdr-canvas rounded-2xl w-[500px] overflow-hidden transform scale-95 transition-transform duration-300" id="intel-add-modal-content">
          <div class="p-5 border-b border-black/5 flex justify-between items-center">
            <h3 class="font-bold text-[16px] text-lmdr-dark">Add Competitor Intel</h3>
            <button onclick="ROS.views._intel.closeModal()" class="w-8 h-8 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors text-tan hover:text-lmdr-dark">
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          <div class="p-6 space-y-5">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-[10px] font-bold text-tan uppercase tracking-wider mb-2">Competitor Name</label>
                <input type="text" id="add-intel-name" class="w-full neu-in bg-transparent border-none rounded-xl px-4 py-3 text-[12px] font-bold text-lmdr-dark focus:ring-2 focus:ring-lmdr-blue outline-none" placeholder="e.g. JB Hunt">
              </div>
              <div>
                <label class="block text-[10px] font-bold text-tan uppercase tracking-wider mb-2">Region</label>
                <select id="add-intel-region" class="w-full neu-in bg-transparent border-none rounded-xl px-4 py-3 text-[12px] font-bold text-lmdr-dark focus:ring-2 focus:ring-lmdr-blue outline-none">
                  <option value="Southeast">Southeast</option>
                  <option value="Northeast">Northeast</option>
                  <option value="Midwest">Midwest</option>
                  <option value="West">West</option>
                  <option value="National">National</option>
                </select>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-[10px] font-bold text-tan uppercase tracking-wider mb-2">Min CPM</label>
                <input type="number" id="add-intel-cpm-min" class="w-full neu-in bg-transparent border-none rounded-xl px-4 py-3 text-[12px] font-bold text-lmdr-dark focus:ring-2 focus:ring-lmdr-blue outline-none" placeholder="0.50" step="0.01">
              </div>
              <div>
                <label class="block text-[10px] font-bold text-tan uppercase tracking-wider mb-2">Max CPM</label>
                <input type="number" id="add-intel-cpm-max" class="w-full neu-in bg-transparent border-none rounded-xl px-4 py-3 text-[12px] font-bold text-lmdr-dark focus:ring-2 focus:ring-lmdr-blue outline-none" placeholder="0.65" step="0.01">
              </div>
              <div>
                <label class="block text-[10px] font-bold text-tan uppercase tracking-wider mb-2">Sign-On ($)</label>
                <input type="number" id="add-intel-bonus" class="w-full neu-in bg-transparent border-none rounded-xl px-4 py-3 text-[12px] font-bold text-lmdr-dark focus:ring-2 focus:ring-lmdr-blue outline-none" placeholder="5000">
              </div>
            </div>
            <div>
              <label class="block text-[10px] font-bold text-tan uppercase tracking-wider mb-2">Benefits / Notes</label>
              <textarea id="add-intel-notes" rows="3" class="w-full neu-in bg-transparent border-none rounded-xl px-4 py-3 text-[12px] font-medium text-lmdr-dark focus:ring-2 focus:ring-lmdr-blue outline-none thin-scroll" placeholder="Summary of benefits..."></textarea>
            </div>
            <div>
              <label class="block text-[10px] font-bold text-tan uppercase tracking-wider mb-2">Source URL <span class="text-black/30 font-normal lowercase">(Optional)</span></label>
              <input type="text" id="add-intel-url" class="w-full neu-in bg-transparent border-none rounded-xl px-4 py-3 text-[12px] font-medium text-lmdr-dark focus:ring-2 focus:ring-lmdr-blue outline-none" placeholder="https://...">
            </div>
          </div>
          <div class="p-5 border-t border-black/5 flex justify-end gap-3">
            <button onclick="ROS.views._intel.closeModal()" class="px-5 py-2.5 rounded-xl text-[12px] font-bold text-tan hover:text-lmdr-dark transition-colors">Cancel</button>
            <button onclick="ROS.views._intel.saveIntel()" class="neu-s px-6 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-wider text-lmdr-dark hover:text-lmdr-blue transition-colors">Save Intel</button>
          </div>
        </div>
      </div>`;
  }

  function onMount() {
    ROS.views._intel.fetchData();
  }

  function onUnmount() {
    intelData = null;
    ROS.views._intel.closeModal();
  }

  function onMessage(type, data) {
    switch (type) {
      case 'competitorDataLoaded':
        intelData = data;
        renderIntel(data);
        break;

      case 'intelAdded':
        showToast('Intel entry added');
        ROS.views._intel.closeModal();
        ROS.views._intel.fetchData();
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
      'High': { color: 'text-orange-500', barColor: 'bg-orange-500', pct: 75 },
      'Medium': { color: 'text-amber-500', barColor: 'bg-amber-500', pct: 50 },
      'Low': { color: 'text-sg', barColor: 'bg-emerald-500', pct: 25 }
    };
    const tc = threatConfig[threat] || threatConfig['Low'];
    if (threatEl) { threatEl.textContent = threat; threatEl.className = 'text-[22px] font-black mt-1 ' + tc.color; }
    if (threatBar) { threatBar.style.width = tc.pct + '%'; threatBar.className = 'h-full rounded-full transition-all ' + tc.barColor; }

    if (data.payComparison || (data.benchmarks && data.competitors)) {
      renderBenchmarks(data.benchmarks || data.payComparison, parseFloat(data.yourCPM) || 0.58);
      renderCompetitorTable(data.competitors || data.payComparison);
    }

    if (data.hiringVelocity) renderVelocityTable(data.hiringVelocity);
    if (data.driverSentiment) renderSentiment(data.driverSentiment);
  }

  function renderBenchmarks(benchmarks, yourCPM) {
    let bench = benchmarks;
    if (Array.isArray(benchmarks) && benchmarks.length > 0) {
      const cpms = benchmarks.map(c => typeof c.cpm === 'string' ? parseFloat(c.cpm) : (c.cpm || c.rate || 0)).filter(v => !isNaN(v));
      if (cpms.length > 0) {
        const min = Math.min(...cpms);
        const max = Math.max(...cpms);
        const avg = cpms.reduce((a, b) => a + b, 0) / cpms.length;
        cpms.sort((a, b) => a - b);
        const p25 = cpms[Math.floor(cpms.length * 0.25)] || min;
        const p75 = cpms[Math.floor(cpms.length * 0.75)] || max;
        bench = { min, max, avg, percentiles: { p25, p75 }, sampleSize: cpms.length };
      }
    }

    if (!bench || bench.min == null) return;

    document.getElementById('intel-sample-size').textContent = bench.sampleSize || 0;

    const rangeMin = Math.max(0, bench.min * 0.9);
    const rangeMax = bench.max * 1.1;
    const rangeSpan = rangeMax - rangeMin || 1;

    function getPercent(val) {
      return Math.max(0, Math.min(100, ((val - rangeMin) / rangeSpan) * 100));
    }

    document.getElementById('intel-marker-min').style.left = getPercent(bench.min) + '%';
    document.getElementById('intel-label-min').textContent = (bench.min >= 1 ? '$' + bench.min.toFixed(2) : bench.min.toFixed(2) + '\u00a2');

    document.getElementById('intel-marker-max').style.left = getPercent(bench.max) + '%';
    document.getElementById('intel-label-max').textContent = (bench.max >= 1 ? '$' + bench.max.toFixed(2) : bench.max.toFixed(2) + '\u00a2');

    document.getElementById('intel-marker-avg').style.left = getPercent(bench.avg) + '%';
    document.getElementById('intel-label-avg').textContent = (bench.avg >= 1 ? '$' + bench.avg.toFixed(2) : bench.avg.toFixed(2) + '\u00a2');

    if (bench.percentiles) {
      const p25 = getPercent(bench.percentiles.p25);
      const p75 = getPercent(bench.percentiles.p75);
      const fill = document.getElementById('intel-range-fill');
      fill.style.left = p25 + '%';
      fill.style.width = (p75 - p25) + '%';
    }

    const yourPercent = getPercent(yourCPM);
    const yourDot = document.getElementById('intel-your-dot');
    yourDot.style.left = yourPercent + '%';
    document.getElementById('intel-label-you').textContent = (yourCPM >= 1 ? '$' + yourCPM.toFixed(2) : (yourCPM || 0).toFixed(2) + '\u00a2');

    let percentile = 50;
    if (yourCPM > bench.avg) {
      percentile = 50 + ((yourCPM - bench.avg) / (bench.max - bench.avg || 1)) * 50;
    } else {
      percentile = ((yourCPM - bench.min) / (bench.avg - bench.min || 1)) * 50;
    }
    percentile = Math.max(1, Math.min(99, percentile));
    document.getElementById('intel-percentile-text').textContent = Math.round(percentile) + 'th percentile';
  }

  function renderCompetitorTable(competitors) {
    const tbody = document.getElementById('intel-offers-rows');
    if (!tbody || !Array.isArray(competitors)) return;

    if (competitors.length === 0) {
      tbody.innerHTML = '<tr><td colspan="4" class="px-4 py-8 text-center text-tan">No data available</td></tr>';
      return;
    }

    tbody.innerHTML = competitors.map(c => {
      const name = c.name || c.carrier || 'Unknown';
      const isYou = c.isYou || c.isSelf;
      const cpmRange = c.cpmRange || (c.cpm ? c.cpm + '\u00a2' : '--');
      const signOn = c.signOn || c.signOnBonus ? '$' + (c.signOnBonus || c.signOn) : '--';
      const homeTime = c.homeTime || '--';

      return `
        <tr class="hover:bg-black/5 transition-colors ${isYou ? 'bg-violet-500/5' : ''}">
          <td class="px-4 py-2.5 text-[12px] font-bold ${isYou ? 'text-violet-600' : 'text-lmdr-dark'}">
            ${escapeHtml(name)} ${isYou ? '<span class="px-1.5 py-0.5 ml-1 bg-violet-600/10 text-violet-700 text-[9px] rounded uppercase">You</span>' : ''}
          </td>
          <td class="px-3 py-2.5 text-right font-mono text-[11px] text-tan font-bold">${escapeHtml(cpmRange.toString())}</td>
          <td class="px-3 py-2.5 text-right text-emerald-500 font-bold text-[11px]">${escapeHtml(signOn.toString())}</td>
          <td class="px-4 py-2.5 text-center text-[11px] text-lmdr-dark truncate max-w-[100px]">${escapeHtml(homeTime)}</td>
        </tr>`;
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
        <tr class="hover:bg-black/5 transition-colors">
          <td class="px-4 py-2.5 text-[12px] font-bold text-lmdr-dark">${escapeHtml(name)}</td>
          <td class="px-4 py-2.5 text-center text-[12px] font-black text-lmdr-dark">${hires}</td>
          <td class="px-4 py-2.5 text-center">
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
        <div class="flex items-center gap-3 p-3 neu-x rounded-xl">
          <div class="flex-1">
            <div class="text-[12px] font-bold text-lmdr-dark">${escapeHtml(name)}</div>
          </div>
          <div class="flex items-center gap-1">${stars}</div>
          <span class="text-[10px] text-tan font-black">${rating.toFixed(1)} <span class="font-medium text-black/30">(${reviews})</span></span>
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

  ROS.views._intel = {
    fetchData: function () {
      const pRegion = document.getElementById('intel-region-filter') ? document.getElementById('intel-region-filter').value : 'Southeast';
      const pJob = document.getElementById('intel-job-type-filter') ? document.getElementById('intel-job-type-filter').value : 'OTR';
      ROS.bridge.sendToVelo('getCompetitorData', { region: pRegion, jobType: pJob });
    },
    openModal: function () {
      const modal = document.getElementById('intel-add-modal');
      const content = document.getElementById('intel-add-modal-content');
      if (modal && content) {
        modal.classList.remove('hidden');
        // trigger reflow
        void modal.offsetWidth;
        modal.classList.add('opacity-100');
        content.classList.remove('scale-95');
      }
    },
    closeModal: function () {
      const modal = document.getElementById('intel-add-modal');
      const content = document.getElementById('intel-add-modal-content');
      if (modal && content) {
        modal.classList.remove('opacity-100');
        content.classList.add('scale-95');
        setTimeout(() => modal.classList.add('hidden'), 300);
      }
      // reset forms
      ['add-intel-name', 'add-intel-cpm-min', 'add-intel-cpm-max', 'add-intel-bonus', 'add-intel-notes', 'add-intel-url'].forEach(id => {
        const e = document.getElementById(id); if (e) e.value = '';
      });
    },
    saveIntel: function () {
      const name = document.getElementById('add-intel-name').value;
      if (!name) { showToast('Competitor name is required'); return; }

      const data = {
        competitor_name: name,
        region: document.getElementById('add-intel-region').value,
        cpm_min: parseFloat(document.getElementById('add-intel-cpm-min').value),
        cpm_max: parseFloat(document.getElementById('add-intel-cpm-max').value),
        sign_on_bonus: parseFloat(document.getElementById('add-intel-bonus').value),
        benefits_summary: document.getElementById('add-intel-notes').value,
        source_url: document.getElementById('add-intel-url').value,
        source_type: 'manual_entry'
      };

      ROS.bridge.sendToVelo('saveIntel', data);
    }
  };

  ROS.views.registerView(VIEW_ID, { render, onMount, onUnmount, onMessage, messages: MESSAGES });
})();
