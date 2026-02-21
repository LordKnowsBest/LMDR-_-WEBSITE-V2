// ============================================================================
// ROS-VIEW-SEARCH — Driver Search + AI Match + Saved Searches
// Full feature parity with RECRUITER_DRIVER_SEARCH.html
// ============================================================================

(function () {
  'use strict';

  const VIEW_ID = 'search';
  const MESSAGES = [
    'searchDriversResult', 'viewDriverProfileResult', 'saveDriverResult',
    'contactDriverResult', 'getQuotaStatusResult', 'getWeightPreferencesResult',
    'saveWeightPreferencesResult', 'recruiterProfile', 'driverSearchInit',
    'saveSearchResult', 'savedSearchesLoaded', 'savedSearchExecuted',
    'savedSearchDeleted', 'savedSearchUpdated', 'generateAIDraftResult',
    'noCarrierAssigned'
  ];

  // ── State ──
  let allDrivers = [];
  let drivers = [];
  let totalCount = 0;
  let currentPage = 0;
  const PAGE_SIZE = 5;
  let filters = {};
  let savedSearches = [];
  let quotaStatus = null;
  let selectedDriver = null;
  let selectedDriverData = null;
  let messageMode = 'email';
  const viewedDriverIds = new Set();
  let sortField = 'matchScore';
  let isSearching = false;
  let hasCarrier = true; // assume true until told otherwise
  let weights = {
    qualifications: 25, experience: 20, location: 20,
    availability: 15, salary_fit: 10, engagement: 10
  };

  // ── Filter Definitions ──
  const FILTER_GROUPS = {
    cdlClass: { label: 'CDL Class', type: 'multi', options: ['A', 'B'] },
    endorsements: { label: 'Endorsements', type: 'multi', options: ['HazMat', 'Tanker', 'Doubles/Triples', 'Passenger', 'School Bus'] },
    experience: {
      label: 'Experience', type: 'radio', options: [
        { value: '', label: 'Any' }, { value: '1', label: '1+ yr' },
        { value: '3', label: '3+ yr' }, { value: '5', label: '5+ yr' }
      ]
    },
    availability: {
      label: 'Availability', type: 'radio', options: [
        { value: '', label: 'Any' }, { value: 'immediate', label: 'Immediate' },
        { value: '2_weeks', label: '2 Weeks' }
      ]
    },
    equipment: { label: 'Equipment', type: 'multi', options: ['Dry Van', 'Reefer', 'Flatbed', 'Tanker', 'Step Deck'] }
  };

  // ── Helpers ──
  function escapeHtml(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  function getScoreClass(score) {
    if (score >= 85) return 'score-excellent';
    if (score >= 70) return 'score-good';
    if (score >= 50) return 'score-fair';
    return 'score-poor';
  }

  function getScoreColor(score) {
    if (score >= 85) return 'text-emerald-500';
    if (score >= 70) return 'text-lmdr-blue';
    if (score >= 50) return 'text-amber-500';
    return 'text-red-400';
  }

  function getSourceBadge(source) {
    if (!source || source === 'driver_profiles') return '';
    const map = {
      scored: { cls: 'source-scored', label: 'Scored' },
      application: { cls: 'source-application', label: 'Applied' },
      fb_campaign: { cls: 'source-fb', label: 'Campaign' },
      legacy_lead: { cls: 'source-legacy', label: 'Lead' }
    };
    const badge = map[source] || { cls: 'source-legacy', label: source };
    return `<span class="source-badge ${badge.cls}">${badge.label}</span>`;
  }

  function showToast(msg, type) {
    const toast = document.createElement('div');
    const icon = type === 'error' ? 'error' : 'check_circle';
    const color = type === 'error' ? 'text-red-400' : 'text-emerald-500';
    toast.className = 'fixed top-16 right-4 z-[10000] px-4 py-2.5 rounded-xl neu-s text-[12px] font-bold text-lmdr-dark flex items-center gap-2';
    toast.style.animation = 'fadeUp .3s ease';
    toast.innerHTML = `<span class="material-symbols-outlined ${color} text-[16px]">${icon}</span>${escapeHtml(msg)}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // ── Render ──
  function render() {
    return `
      <!-- Header Row -->
      <div class="flex items-center justify-between flex-wrap gap-2">
        <div class="flex items-center gap-3">
          <button onclick="ROS.views.showView('home')" class="w-8 h-8 neu-s rounded-lg flex items-center justify-center hover:shadow-none transition-shadow">
            <span class="material-symbols-outlined text-tan text-[16px]">arrow_back</span>
          </button>
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-lmdr-blue to-lmdr-deep flex items-center justify-center">
            <span class="material-symbols-outlined text-white text-[16px]">person_search</span>
          </div>
          <h2 class="text-lg font-bold text-lmdr-dark">Driver Search</h2>
        </div>
        <div class="flex items-center gap-2 flex-wrap">
          <div id="search-quota-bar" class="flex items-center gap-2"></div>
          <span class="text-[11px] text-tan font-medium" id="search-count">0 results</span>
          <button onclick="ROS.views._search.openSaveModal()" class="px-3 py-1.5 text-[10px] font-bold rounded-full neu-x text-tan hover:text-lmdr-blue transition-colors">
            <span class="material-symbols-outlined text-[12px] align-middle">save</span> Save
          </button>
          <button onclick="ROS.views._search.loadSaved()" class="px-3 py-1.5 text-[10px] font-bold rounded-full neu-x text-tan hover:text-lmdr-blue transition-colors">
            <span class="material-symbols-outlined text-[12px] align-middle">bookmark</span> Saved
          </button>
        </div>
      </div>

      <!-- Search Bar + Sort -->
      <div class="flex gap-2 mt-4 items-center flex-wrap">
        <div class="flex-1 flex items-center px-4 py-3 neu-in rounded-xl min-w-[200px]">
          <span class="material-symbols-outlined text-tan text-[18px]">search</span>
          <input id="search-input" class="bg-transparent border-none focus:ring-0 text-base text-lmdr-dark placeholder-tan/50 w-full ml-2 outline-none font-medium"
                 placeholder="Name, CDL type, location, endorsements..."
                 onkeydown="if(event.key==='Enter')ROS.views._search.doSearch()"/>
        </div>
        <select id="search-sort" class="px-3 py-3 rounded-xl neu-in text-[12px] font-bold text-lmdr-dark outline-none cursor-pointer" onchange="ROS.views._search.doSort()">
          <option value="matchScore">Match Score</option>
          <option value="experience">Experience</option>
          <option value="location">Location</option>
        </select>
        <button onclick="ROS.views._search.doSearch()" class="px-5 py-3 rounded-xl neu text-lmdr-blue text-sm font-bold flex items-center gap-2 hover:neu-raised transition-shadow whitespace-nowrap">
          <span class="material-symbols-outlined text-[18px]">search</span>Search
        </button>
        <button onclick="ROS.views._search.toggleWeights()" class="px-3 py-3 rounded-xl neu-x text-tan hover:text-lmdr-blue transition-colors" title="Match Weight Preferences">
          <span class="material-symbols-outlined text-[18px]">tune</span>
        </button>
      </div>

      <!-- Filter Orbs -->
      <div class="mt-3 flex flex-col gap-2" id="search-filter-orbs">
        ${renderFilterOrbs()}
      </div>

      <!-- Location Row -->
      <div class="flex gap-3 mt-2 items-center">
        <div class="flex items-center gap-2 px-3 py-2 neu-in rounded-xl flex-1 max-w-[200px]">
          <span class="material-symbols-outlined text-tan text-[14px]">location_on</span>
          <input id="filter-zip" class="bg-transparent border-none focus:ring-0 text-[12px] text-lmdr-dark placeholder-tan/50 w-full outline-none font-medium"
                 placeholder="ZIP code" maxlength="5"/>
        </div>
        <select id="filter-radius" class="px-3 py-2 rounded-xl neu-in text-[11px] font-bold text-lmdr-dark outline-none cursor-pointer">
          <option value="25">25 mi</option>
          <option value="50" selected>50 mi</option>
          <option value="100">100 mi</option>
          <option value="200">200 mi</option>
          <option value="">Any</option>
        </select>
        <div class="flex-1"></div>
        <button onclick="ROS.views._search.clearFilters()" class="px-3 py-1.5 text-[10px] font-bold rounded-full neu-x text-red-400 hover:text-red-500 transition-colors">
          <span class="material-symbols-outlined text-[12px] align-middle">filter_list_off</span> Clear All
        </button>
      </div>

      <!-- Active Filters Summary -->
      <div id="search-active-filters" class="flex gap-2 flex-wrap mt-2"></div>

      <!-- Results -->
      <div class="flex flex-col gap-3 mt-4" id="search-results">
        <div id="search-empty-state" class="text-center py-12 text-tan text-[13px]">
          <span class="material-symbols-outlined text-[48px] text-tan/30 block mb-3">person_search</span>
          Select your filters and click Search to find matching drivers
        </div>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-center gap-1 mt-4 flex-wrap" id="search-pagination" style="display:none"></div>

      <!-- Saved Searches Panel (hidden by default) -->
      <div id="saved-searches-panel" style="display:none" class="mt-4 neu rounded-2xl p-4">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-[13px] font-bold text-lmdr-dark">Saved Searches</h3>
          <button onclick="document.getElementById('saved-searches-panel').style.display='none'" class="text-tan hover:text-lmdr-dark">
            <span class="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
        <div id="saved-searches-list" class="flex flex-col gap-2"></div>
      </div>`;
  }

  // ── Filter Orbs ──
  function renderFilterOrbs() {
    let html = '';
    for (const [groupKey, group] of Object.entries(FILTER_GROUPS)) {
      html += `<div class="flex items-center gap-2 flex-wrap">
        <span class="text-[10px] font-bold text-tan uppercase tracking-wider w-[80px] shrink-0">${group.label}</span>
        <div class="flex gap-1.5 flex-wrap filter-orb-scroll">`;

      if (group.type === 'multi') {
        group.options.forEach(opt => {
          const filterKey = groupKey === 'cdlClass' ? `cdl_${opt}` : `${groupKey}_${opt.replace(/[/\\s]/g, '_')}`;
          html += `<button class="filter-orb px-3 py-1.5 text-[10px] font-bold rounded-full neu-x text-tan transition-all"
                    data-filter-group="${groupKey}" data-filter-value="${opt}" id="orb-${filterKey}"
                    onclick="ROS.views._search.toggleOrb(this,'${groupKey}','${escapeHtml(opt)}')">${escapeHtml(opt)}</button>`;
        });
      } else {
        group.options.forEach(opt => {
          const isDefault = opt.value === '';
          const filterKey = `${groupKey}_${opt.value || 'any'}`;
          html += `<button class="filter-orb px-3 py-1.5 text-[10px] font-bold rounded-full ${isDefault ? 'filter-orb-active' : 'neu-x'} text-tan transition-all"
                    data-filter-group="${groupKey}" data-filter-value="${opt.value}" id="orb-${filterKey}"
                    onclick="ROS.views._search.selectRadioOrb(this,'${groupKey}','${opt.value}')">${opt.label}</button>`;
        });
      }
      html += `</div></div>`;
    }
    return html;
  }

  // ── onMount ──
  function onMount() {
    ROS.bridge.sendToVelo('driverSearchReady', {});
    ROS.bridge.sendToVelo('getQuotaStatus', {});
    ROS.bridge.sendToVelo('getWeightPreferences', {});
  }

  function onUnmount() {
    allDrivers = [];
    drivers = [];
    totalCount = 0;
    currentPage = 0;
    filters = {};
    selectedDriver = null;
    selectedDriverData = null;
    viewedDriverIds.clear();
    isSearching = false;
    // Clean up floating elements
    const alertEl = document.getElementById('no-carrier-alert');
    if (alertEl) alertEl.remove();
    const orbEl = document.getElementById('weights-orb');
    if (orbEl) orbEl.remove();
  }

  // ── onMessage ──
  function onMessage(type, data) {
    switch (type) {
      case 'driverSearchInit':
        if (data && data.quotaStatus) {
          quotaStatus = data.quotaStatus;
          renderQuotaBar();
        }
        if (data && data.currentCarrierDOT) {
          hasCarrier = true;
        } else if (data && data.carriers && data.carriers.length === 0) {
          hasCarrier = false;
          renderNoCarrierState();
        }
        break;

      case 'searchDriversResult':
        isSearching = false;
        if (data && data.success) {
          allDrivers = data.drivers || [];
          totalCount = allDrivers.length;
          if (data.quotaStatus) {
            quotaStatus = data.quotaStatus;
            renderQuotaBar();
          }
          currentPage = 0;
          applySortAndPaginate();
        } else {
          const err = data && data.error ? data.error : 'Search failed';
          if (err.toLowerCase().includes('no carrier')) {
            hasCarrier = false;
            renderNoCarrierState();
          } else {
            renderError(err);
          }
        }
        break;

      case 'viewDriverProfileResult':
        if (data && data.success) {
          if (data.quotaStatus) {
            quotaStatus = data.quotaStatus;
            renderQuotaBar();
          }
          selectedDriverData = data.driver;
          if (selectedDriver) viewedDriverIds.add(selectedDriver);
          renderProfileModal(data.driver);
        } else if (data && data.quotaExceeded) {
          if (data.quotaStatus) {
            quotaStatus = data.quotaStatus;
            renderQuotaBar();
          }
          renderQuotaExceededModal();
        } else {
          showToast(data && data.error ? data.error : 'Failed to load profile', 'error');
        }
        break;

      case 'saveDriverResult':
        if (data && data.success) {
          showToast(data.alreadyExists ? 'Driver already in pipeline' : 'Driver saved to pipeline');
        } else {
          showToast(data && data.error ? data.error : 'Failed to save driver', 'error');
        }
        break;

      case 'contactDriverResult':
        closeModal('message-modal');
        showToast(data && data.success ? 'Message sent successfully' : (data && data.error ? data.error : 'Failed to send message'), data && data.success ? 'success' : 'error');
        break;

      case 'getQuotaStatusResult':
        quotaStatus = data;
        renderQuotaBar();
        break;

      case 'generateAIDraftResult':
        handleAIDraftResult(data);
        break;

      case 'savedSearchesLoaded':
        savedSearches = (data && data.searches) || [];
        renderSavedSearches();
        break;

      case 'savedSearchExecuted':
        if (data && data.success) {
          allDrivers = data.drivers || [];
          totalCount = allDrivers.length;
          currentPage = 0;
          applySortAndPaginate();
          showToast('Saved search executed');
        }
        break;

      case 'savedSearchDeleted':
        showToast('Search deleted');
        ROS.bridge.sendToVelo('loadSavedSearches', {});
        break;

      case 'saveSearchResult':
        closeModal('save-search-modal');
        showToast(data && data.success ? 'Search saved' : 'Failed to save search', data && data.success ? 'success' : 'error');
        break;

      case 'getWeightPreferencesResult':
        if (data && data.success && data.preferences) {
          loadWeightsFromVelo(data.preferences);
        }
        break;

      case 'saveWeightPreferencesResult':
        handleWeightSaveResult(data);
        break;

      case 'noCarrierAssigned':
        hasCarrier = false;
        renderNoCarrierState();
        break;
    }
  }

  // ── Sort & Paginate (client-side) ──
  function applySortAndPaginate() {
    // Sort
    const sorted = [...allDrivers].sort((a, b) => {
      switch (sortField) {
        case 'experience':
          return (b.years_experience || b.experienceYears || 0) - (a.years_experience || a.experienceYears || 0);
        case 'location':
          const locA = a.city || a.location || '';
          const locB = b.city || b.location || '';
          return locA.localeCompare(locB);
        default: // matchScore
          return (b.matchScore || b.match_score || 0) - (a.matchScore || a.match_score || 0);
      }
    });

    totalCount = sorted.length;
    const start = currentPage * PAGE_SIZE;
    drivers = sorted.slice(start, start + PAGE_SIZE);
    renderResults();
    renderPagination();
  }

  // ── Render Results ──
  function renderResults() {
    const container = document.getElementById('search-results');
    const countEl = document.getElementById('search-count');
    if (!container) return;

    if (countEl) countEl.textContent = totalCount + ' results';

    if (isSearching) {
      container.innerHTML = renderSkeletons(3);
      return;
    }

    if (totalCount === 0 && allDrivers.length === 0) {
      container.innerHTML = '<div class="text-center py-8 text-tan text-[13px]">No drivers found matching your criteria</div>';
      return;
    }

    container.innerHTML = drivers.map(d => renderDriverCard(d)).join('');
  }

  function renderSkeletons(count) {
    let html = '';
    for (let i = 0; i < count; i++) {
      html += `<div class="flex items-center gap-4 p-4 neu-s rounded-xl skeleton-card">
        <div class="w-12 h-12 rounded-xl skeleton-shimmer"></div>
        <div class="flex-1 space-y-2">
          <div class="h-4 w-3/4 rounded skeleton-shimmer"></div>
          <div class="h-3 w-1/2 rounded skeleton-shimmer"></div>
        </div>
        <div class="w-12 h-12 rounded skeleton-shimmer"></div>
      </div>`;
    }
    return html;
  }

  function renderDriverCard(driver) {
    const name = driver.name || driver.full_name || 'Unknown';
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const matchScore = Math.round(driver.matchScore || driver.match_score || 0);
    const cdl = driver.cdl_type || driver.cdlType || driver.cdlClass || '';
    const rawEndorsements = driver.endorsements || '';
    const endorseStr = Array.isArray(rawEndorsements) ? rawEndorsements.join(', ') : rawEndorsements;
    const location = driver.city ? `${driver.city}, ${driver.state}` : (driver.location || '');
    const expYears = driver.years_experience || driver.experienceYears || 0;
    const exp = expYears ? `${expYears}yr exp` : '';
    const details = [cdl ? `CDL-${cdl}` : '', endorseStr, location, exp].filter(Boolean).join(' \u00b7 ');
    const rationale = driver.rationale || driver.match_rationale || '';

    const colors = ['from-lmdr-yb to-amber-500', 'from-lmdr-blue to-lmdr-deep', 'from-emerald-400 to-teal-600', 'from-violet-400 to-purple-600', 'from-amber-400 to-orange-500'];
    const colorIdx = name.charCodeAt(0) % colors.length;
    const textColor = colorIdx === 0 ? 'text-lmdr-dark' : 'text-white';
    const scoreColor = getScoreColor(matchScore);
    const source = driver.source || driver._source || '';
    const sourceBadge = getSourceBadge(source);

    const driverId = driver._id || driver.id || driver.record_id || '';
    const isViewed = viewedDriverIds.has(driverId);

    return `
      <div class="flex items-center gap-4 p-4 neu-s rounded-xl cursor-pointer hover:shadow-none transition-shadow group"
           onclick="ROS.views._search.viewProfile('${driverId}', ${matchScore})">
        <div class="w-12 h-12 rounded-xl bg-gradient-to-br ${colors[colorIdx]} flex items-center justify-center font-black ${textColor} text-[14px] shrink-0">${initials}</div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="text-[14px] font-bold text-lmdr-dark group-hover:text-lmdr-blue transition-colors">${escapeHtml(name)}</span>
            ${sourceBadge}
            ${driver.isMutualMatch ? '<span class="source-badge source-scored">Mutual</span>' : ''}
          </div>
          <div class="text-[12px] text-tan mt-0.5 truncate">${escapeHtml(details)}</div>
          ${rationale ? `<div class="text-[10px] text-tan/70 mt-0.5 truncate italic">${escapeHtml(typeof rationale === 'string' ? rationale : rationale.join(' '))}</div>` : ''}
        </div>
        <div class="text-right shrink-0">
          <div class="text-2xl font-black ${scoreColor}">${matchScore}%</div>
          <div class="text-[9px] font-bold text-tan uppercase tracking-wider">Match</div>
        </div>
        <button class="px-3 py-2 rounded-lg ${isViewed ? 'neu-in text-lmdr-blue' : 'neu-x text-tan hover:neu-s'} text-[11px] font-bold transition-all shrink-0"
                onclick="event.stopPropagation();ROS.views._search.saveDriver('${driverId}', ${matchScore})"
                title="${isViewed ? 'Add to Pipeline' : 'View profile first to save'}">+ Pipeline</button>
      </div>`;
  }

  function renderError(msg) {
    const container = document.getElementById('search-results');
    if (container) container.innerHTML = `<div class="text-center py-8 text-red-400 text-[13px]"><span class="material-symbols-outlined text-[32px] block mb-2">error</span>${escapeHtml(msg)}</div>`;
  }

  // ── Pagination (numbered) ──
  function renderPagination() {
    const container = document.getElementById('search-pagination');
    if (!container) return;

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);
    if (totalPages <= 1) {
      container.style.display = 'none';
      return;
    }
    container.style.display = 'flex';

    let html = '';

    // Prev button
    html += `<button onclick="ROS.views._search.goToPage(${currentPage - 1})" class="px-2.5 py-1.5 rounded-lg neu-x text-[11px] font-bold text-tan ${currentPage === 0 ? 'opacity-40 pointer-events-none' : 'hover:text-lmdr-blue'}" ${currentPage === 0 ? 'disabled' : ''}>
      <span class="material-symbols-outlined text-[14px]">chevron_left</span>
    </button>`;

    // Page numbers with ellipsis
    const pages = getPageNumbers(currentPage, totalPages);
    pages.forEach(p => {
      if (p === '...') {
        html += `<span class="px-1.5 py-1.5 text-[11px] text-tan">...</span>`;
      } else {
        const isActive = p === currentPage;
        html += `<button onclick="ROS.views._search.goToPage(${p})" class="w-8 h-8 rounded-lg ${isActive ? 'neu-in text-lmdr-blue' : 'neu-x text-tan hover:neu-s hover:text-lmdr-blue'} text-[11px] font-bold transition-all">${p + 1}</button>`;
      }
    });

    // Next button
    html += `<button onclick="ROS.views._search.goToPage(${currentPage + 1})" class="px-2.5 py-1.5 rounded-lg neu-x text-[11px] font-bold text-tan ${currentPage >= totalPages - 1 ? 'opacity-40 pointer-events-none' : 'hover:text-lmdr-blue'}" ${currentPage >= totalPages - 1 ? 'disabled' : ''}>
      <span class="material-symbols-outlined text-[14px]">chevron_right</span>
    </button>`;

    container.innerHTML = html;
  }

  function getPageNumbers(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i);
    const pages = [];
    pages.push(0);
    if (current > 2) pages.push('...');
    for (let i = Math.max(1, current - 1); i <= Math.min(total - 2, current + 1); i++) {
      pages.push(i);
    }
    if (current < total - 3) pages.push('...');
    pages.push(total - 1);
    return pages;
  }

  // ── Quota Bar ──
  function renderQuotaBar() {
    const container = document.getElementById('search-quota-bar');
    if (!container || !quotaStatus) return;

    const used = quotaStatus.used || 0;
    const limit = quotaStatus.limit || 5;
    const isUnlimited = limit === 'Unlimited' || limit === -1;
    const pct = isUnlimited ? 10 : Math.min((used / limit) * 100, 100);
    const barColor = pct >= 90 ? 'bg-red-400' : pct >= 50 ? 'bg-amber-400' : 'bg-emerald-400';
    const tier = (quotaStatus.tier || 'free').charAt(0).toUpperCase() + (quotaStatus.tier || 'free').slice(1);

    container.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="text-[9px] font-bold text-tan uppercase">${escapeHtml(tier)}</span>
        <div class="w-16 h-1.5 rounded-full bg-tan/20 overflow-hidden">
          <div class="h-full rounded-full ${barColor} transition-all" style="width:${pct}%"></div>
        </div>
        <span class="text-[10px] font-bold ${pct >= 90 ? 'text-red-400' : 'text-tan'}">${used}/${isUnlimited ? '\u221e' : limit}</span>
        ${pct >= 50 && !isUnlimited ? `<button onclick="ROS.views._search.upgrade()" class="text-[9px] font-bold text-lmdr-blue hover:underline">Upgrade</button>` : ''}
      </div>`;
  }

  // ── Profile Modal ──
  function renderProfileModal(driver) {
    closeModal('profile-modal');
    const name = driver.name || driver.full_name || 'Unknown';
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const matchScore = Math.round(driver.matchScore || driver.match_score || 0);
    const cdl = driver.cdl_type || driver.cdlType || driver.cdlClass || '';
    const rawEndorsements = driver.endorsements || [];
    const endorsements = Array.isArray(rawEndorsements) ? rawEndorsements : (typeof rawEndorsements === 'string' && rawEndorsements ? rawEndorsements.split(',').map(e => e.trim()) : []);
    const location = driver.city ? `${driver.city}, ${driver.state}` : (driver.location || 'Unknown');
    const expYears = driver.years_experience || driver.experienceYears || 0;
    const scoreColor = getScoreColor(matchScore);
    const availability = driver.availability || 'Unknown';
    const equipment = Array.isArray(driver.equipment) ? driver.equipment : (Array.isArray(driver.equipment_experience) ? driver.equipment_experience : []);
    const preferredRoutes = Array.isArray(driver.preferredRoutes) ? driver.preferredRoutes : (Array.isArray(driver.preferred_routes) ? driver.preferred_routes : []);
    const homeTime = driver.homeTime || driver.home_time_preference || '';
    const salaryExpectation = driver.salaryExpectation || driver.salary_expectation || '';
    const mvrStatus = driver.mvrStatus || driver.mvr_status || '';
    const rationale = driver.rationale || [];
    const rationaleArr = Array.isArray(rationale) ? rationale : [rationale];

    const modal = document.createElement('div');
    modal.id = 'profile-modal';
    modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4';
    modal.style.animation = 'fadeIn .2s ease';
    modal.innerHTML = `
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" onclick="ROS.views._search.closeModal('profile-modal')"></div>
      <div class="relative w-full max-w-lg max-h-[85vh] overflow-y-auto neu rounded-2xl p-6" style="animation:fadeUp .3s ease">

        <!-- Header -->
        <div class="flex items-center gap-4 mb-4">
          <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-lmdr-blue to-lmdr-deep flex items-center justify-center font-black text-white text-[16px] shrink-0">${initials}</div>
          <div class="flex-1 min-w-0">
            <h3 class="text-[16px] font-bold text-lmdr-dark">${escapeHtml(name)}</h3>
            <div class="text-[12px] text-tan mt-0.5">${cdl ? `CDL-${escapeHtml(cdl)}` : ''} ${endorsements.length ? '\u00b7 ' + escapeHtml(endorsements.join(', ')) : ''}</div>
            <div class="text-[11px] text-tan">${escapeHtml(location)} ${expYears ? `\u00b7 ${expYears}yr exp` : ''}</div>
          </div>
          <div class="text-center shrink-0">
            <div class="text-3xl font-black ${scoreColor}">${matchScore}%</div>
            <div class="text-[9px] font-bold text-tan uppercase">Match</div>
          </div>
          <button onclick="ROS.views._search.closeModal('profile-modal')" class="absolute top-4 right-4 text-tan hover:text-lmdr-dark">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <!-- Match Rationale -->
        ${rationaleArr.length > 0 ? `
        <div class="p-3 rounded-xl bg-blue-50/50 neu-ins mb-4">
          <div class="text-[10px] font-bold text-lmdr-blue uppercase mb-1.5">Why This Match</div>
          ${rationaleArr.map(r => `<div class="flex items-start gap-2 text-[11px] text-lmdr-dark mb-1">
            <span class="material-symbols-outlined text-[14px] text-emerald-500 shrink-0 mt-0.5">check_circle</span>
            <span>${escapeHtml(r)}</span>
          </div>`).join('')}
        </div>` : ''}

        <!-- 2x2 Grid -->
        <div class="grid grid-cols-2 gap-3 mb-4">
          <!-- Qualifications -->
          <div class="p-3 rounded-xl neu-x">
            <div class="text-[10px] font-bold text-tan uppercase mb-2">Qualifications</div>
            <div class="text-[11px] text-lmdr-dark space-y-1">
              ${cdl ? `<div><span class="font-bold">CDL:</span> Class ${escapeHtml(cdl)}</div>` : ''}
              ${endorsements.length ? `<div><span class="font-bold">Endorsements:</span> ${escapeHtml(endorsements.join(', '))}</div>` : ''}
              ${mvrStatus ? `<div><span class="font-bold">MVR:</span> ${escapeHtml(mvrStatus)}</div>` : ''}
            </div>
          </div>

          <!-- Equipment -->
          <div class="p-3 rounded-xl neu-x">
            <div class="text-[10px] font-bold text-tan uppercase mb-2">Equipment</div>
            <div class="flex flex-wrap gap-1">
              ${equipment.length ? equipment.map(e => `<span class="px-2 py-0.5 rounded-full bg-lmdr-blue/10 text-[10px] font-bold text-lmdr-blue">${escapeHtml(e)}</span>`).join('') : '<span class="text-[11px] text-tan">Not specified</span>'}
            </div>
          </div>

          <!-- Preferences -->
          <div class="p-3 rounded-xl neu-x">
            <div class="text-[10px] font-bold text-tan uppercase mb-2">Preferences</div>
            <div class="text-[11px] text-lmdr-dark space-y-1">
              ${preferredRoutes.length ? `<div><span class="font-bold">Routes:</span> ${escapeHtml(preferredRoutes.join(', '))}</div>` : ''}
              ${homeTime ? `<div><span class="font-bold">Home Time:</span> ${escapeHtml(homeTime)}</div>` : ''}
              ${salaryExpectation ? `<div><span class="font-bold">Pay:</span> ${escapeHtml(String(salaryExpectation))}</div>` : ''}
            </div>
          </div>

          <!-- Availability -->
          <div class="p-3 rounded-xl neu-x">
            <div class="text-[10px] font-bold text-tan uppercase mb-2">Availability</div>
            <div class="text-[11px] text-lmdr-dark">
              <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full ${availability === 'immediate' ? 'bg-emerald-400' : availability === '2_weeks' ? 'bg-amber-400' : 'bg-slate-300'}"></span>
                <span class="font-bold">${escapeHtml(availability === 'immediate' ? 'Immediately Available' : availability === '2_weeks' ? 'Available in 2 Weeks' : availability)}</span>
              </div>
              ${expYears ? `<div class="mt-1"><span class="font-bold">Experience:</span> ${expYears} years</div>` : ''}
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2 flex-wrap">
          <button onclick="ROS.views._search.saveDriverFromModal()" class="flex-1 px-4 py-2.5 rounded-xl neu text-lmdr-blue text-[12px] font-bold flex items-center justify-center gap-2 hover:neu-s transition-all">
            <span class="material-symbols-outlined text-[16px]">person_add</span>Save to Pipeline
          </button>
          <button onclick="ROS.views._search.openMessageModal('email')" class="px-4 py-2.5 rounded-xl neu-x text-[12px] font-bold text-tan hover:text-lmdr-blue transition-colors flex items-center gap-2">
            <span class="material-symbols-outlined text-[16px]">mail</span>Email
          </button>
          <button onclick="ROS.views._search.openMessageModal('text')" class="px-4 py-2.5 rounded-xl neu-x text-[12px] font-bold text-tan hover:text-lmdr-blue transition-colors flex items-center gap-2">
            <span class="material-symbols-outlined text-[16px]">sms</span>Text
          </button>
        </div>
      </div>`;

    document.body.appendChild(modal);
  }

  // ── Quota Exceeded Modal ──
  function renderQuotaExceededModal() {
    closeModal('profile-modal');
    const modal = document.createElement('div');
    modal.id = 'profile-modal';
    modal.className = 'fixed inset-0 z-[9999] flex items-center justify-center p-4';
    modal.style.animation = 'fadeIn .2s ease';
    modal.innerHTML = `
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" onclick="ROS.views._search.closeModal('profile-modal')"></div>
      <div class="relative w-full max-w-sm neu rounded-2xl p-6 text-center" style="animation:fadeUp .3s ease">
        <span class="material-symbols-outlined text-[48px] text-amber-400 block mb-3">lock</span>
        <h3 class="text-[16px] font-bold text-lmdr-dark mb-2">Profile View Quota Exceeded</h3>
        <p class="text-[12px] text-tan mb-4">You've used all your profile views for this period. Upgrade your plan for more views.</p>
        <div class="flex gap-2 justify-center">
          <button onclick="ROS.views._search.upgrade()" class="px-5 py-2.5 rounded-xl neu text-lmdr-blue text-[12px] font-bold hover:neu-s transition-all">Upgrade Plan</button>
          <button onclick="ROS.views._search.closeModal('profile-modal')" class="px-5 py-2.5 rounded-xl neu-x text-[12px] font-bold text-tan">Close</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
  }

  // ── Message Compose Modal ──
  function openMessageModal(mode) {
    closeModal('message-modal');
    messageMode = mode;
    const isText = mode === 'text';
    const driverName = selectedDriverData ? (selectedDriverData.name || selectedDriverData.full_name || 'the driver') : 'the driver';

    const modal = document.createElement('div');
    modal.id = 'message-modal';
    modal.className = 'fixed inset-0 z-[10000] flex items-center justify-center p-4';
    modal.style.animation = 'fadeIn .2s ease';
    modal.innerHTML = `
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" onclick="ROS.views._search.closeModal('message-modal')"></div>
      <div class="relative w-full max-w-md neu rounded-2xl p-6" style="animation:fadeUp .3s ease">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-[15px] font-bold text-lmdr-dark">${isText ? 'Send Text Message' : 'Send Email'}</h3>
          <button onclick="ROS.views._search.closeModal('message-modal')" class="text-tan hover:text-lmdr-dark">
            <span class="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <p class="text-[12px] text-tan mb-3">To: <span class="font-bold text-lmdr-dark">${escapeHtml(driverName)}</span></p>
        <textarea id="msg-textarea" class="w-full p-3 rounded-xl neu-in text-[13px] text-lmdr-dark placeholder-tan/50 outline-none resize-none font-medium"
                  rows="${isText ? 3 : 6}" placeholder="${isText ? 'Short message (160 chars recommended)...' : "Write your message or click 'Generate with AI' for a personalized draft..."}"
                  oninput="document.getElementById('msg-char-count').textContent=this.value.length+' characters'"></textarea>
        <div class="flex items-center justify-between mt-2 mb-4">
          <span id="msg-char-count" class="text-[10px] text-tan">0 characters</span>
          <button id="ai-draft-btn" onclick="ROS.views._search.generateAIDraft()" class="flex items-center gap-1.5 px-3 py-1.5 rounded-full neu-x text-[10px] font-bold text-lmdr-blue hover:shadow-none transition-shadow">
            <span class="material-symbols-outlined text-[14px]">auto_awesome</span>
            <span id="ai-draft-btn-text">Generate with AI</span>
          </button>
        </div>
        <div class="flex gap-2">
          <button onclick="ROS.views._search.sendMessage()" class="flex-1 px-4 py-2.5 rounded-xl neu text-lmdr-blue text-[12px] font-bold hover:neu-s transition-all">
            ${isText ? 'Send Text' : 'Send Email'}
          </button>
          <button onclick="ROS.views._search.closeModal('message-modal')" class="px-4 py-2.5 rounded-xl neu-x text-[12px] font-bold text-tan">Cancel</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
  }

  function handleAIDraftResult(data) {
    const btn = document.getElementById('ai-draft-btn');
    const btnText = document.getElementById('ai-draft-btn-text');
    if (btn) {
      btn.disabled = false;
      btn.classList.remove('opacity-50');
    }
    if (data && data.success && data.draft) {
      const textarea = document.getElementById('msg-textarea');
      const charCount = document.getElementById('msg-char-count');
      if (textarea) {
        textarea.value = data.draft;
        if (charCount) charCount.textContent = data.draft.length + ' characters';
      }
      if (btnText) btnText.textContent = 'Generate with AI';
      showToast('AI draft generated \u2014 review and edit before sending');
    } else {
      if (btnText) btnText.textContent = 'Generate with AI';
      showToast(data && data.error ? data.error : 'AI draft failed', 'error');
    }
  }

  // ── Save Search Modal ──
  function openSaveSearchModal() {
    closeModal('save-search-modal');
    const modal = document.createElement('div');
    modal.id = 'save-search-modal';
    modal.className = 'fixed inset-0 z-[10000] flex items-center justify-center p-4';
    modal.style.animation = 'fadeIn .2s ease';
    modal.innerHTML = `
      <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" onclick="ROS.views._search.closeModal('save-search-modal')"></div>
      <div class="relative w-full max-w-sm neu rounded-2xl p-6" style="animation:fadeUp .3s ease">
        <h3 class="text-[15px] font-bold text-lmdr-dark mb-4">Save This Search</h3>
        <div class="space-y-3">
          <div>
            <label class="text-[10px] font-bold text-tan uppercase">Search Name</label>
            <input id="save-search-name" class="w-full mt-1 px-3 py-2 rounded-xl neu-in text-[12px] text-lmdr-dark placeholder-tan/50 outline-none font-medium"
                   placeholder="e.g. CDL-A OTR Drivers Near Dallas"/>
          </div>
          <div>
            <label class="text-[10px] font-bold text-tan uppercase">Alert Frequency</label>
            <select id="save-search-freq" class="w-full mt-1 px-3 py-2 rounded-xl neu-in text-[12px] font-bold text-lmdr-dark outline-none cursor-pointer">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="never">Never</option>
            </select>
          </div>
          <div>
            <label class="text-[10px] font-bold text-tan uppercase mb-1 block">Alert Channel</label>
            <div class="flex gap-3">
              <label class="flex items-center gap-1.5 text-[11px] text-lmdr-dark cursor-pointer">
                <input type="radio" name="save-alert-ch" value="in_app" checked class="accent-blue-600"> In-App
              </label>
              <label class="flex items-center gap-1.5 text-[11px] text-lmdr-dark cursor-pointer">
                <input type="radio" name="save-alert-ch" value="email" class="accent-blue-600"> Email
              </label>
              <label class="flex items-center gap-1.5 text-[11px] text-lmdr-dark cursor-pointer">
                <input type="radio" name="save-alert-ch" value="both" class="accent-blue-600"> Both
              </label>
            </div>
          </div>
        </div>
        <div class="flex gap-2 mt-5">
          <button onclick="ROS.views._search.submitSaveSearch()" class="flex-1 px-4 py-2.5 rounded-xl neu text-lmdr-blue text-[12px] font-bold hover:neu-s transition-all">Save Search</button>
          <button onclick="ROS.views._search.closeModal('save-search-modal')" class="px-4 py-2.5 rounded-xl neu-x text-[12px] font-bold text-tan">Cancel</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
  }

  // ── Saved Searches Panel ──
  function renderSavedSearches() {
    const list = document.getElementById('saved-searches-list');
    const panel = document.getElementById('saved-searches-panel');
    if (!list || !panel) return;
    panel.style.display = 'block';

    if (savedSearches.length === 0) {
      list.innerHTML = '<div class="text-[12px] text-tan text-center py-2">No saved searches yet</div>';
      return;
    }
    list.innerHTML = savedSearches.map(s => {
      const newBadge = s.new_matches_since_last > 0 ? `<span class="ml-1 px-1.5 py-0.5 rounded-full bg-lmdr-blue text-white text-[9px] font-bold">${s.new_matches_since_last} new</span>` : '';
      return `
      <div class="flex items-center gap-3 p-2.5 neu-x rounded-xl">
        <span class="material-symbols-outlined text-lmdr-blue text-[16px]">bookmark</span>
        <div class="flex-1 min-w-0">
          <div class="text-[12px] font-bold text-lmdr-dark truncate">${escapeHtml(s.name || s.search_name || 'Unnamed')}${newBadge}</div>
          <div class="text-[10px] text-tan">${s.resultCount || s.result_count || 0} results \u00b7 ${escapeHtml(s.alert_frequency || s.frequency || 'daily')}</div>
        </div>
        <button onclick="ROS.views._search.runSaved('${s._id || s.id}')" class="text-[10px] font-bold text-lmdr-blue hover:underline">Run</button>
        <button onclick="ROS.views._search.deleteSaved('${s._id || s.id}')" class="text-tan hover:text-red-400">
          <span class="material-symbols-outlined text-[14px]">delete</span>
        </button>
      </div>`;
    }).join('');
  }

  // ── Active Filters Display ──
  function renderActiveFilters() {
    const el = document.getElementById('search-active-filters');
    if (!el) return;
    const entries = Object.entries(filters);
    if (entries.length === 0) { el.innerHTML = ''; return; }
    el.innerHTML = entries.map(([k, v]) => {
      const label = Array.isArray(v) ? v.join(', ') : v;
      if (!label) return '';
      return `
      <span class="px-3 py-1.5 text-[10px] font-bold rounded-full neu-ins text-lmdr-blue flex items-center gap-1">
        ${escapeHtml(String(label))}
        <span class="material-symbols-outlined text-[12px] cursor-pointer hover:text-red-400" onclick="ROS.views._search.removeFilter('${k}')">close</span>
      </span>`;
    }).filter(Boolean).join('');
  }

  // ── No Carrier Alert (side-sliding) ──
  function renderNoCarrierState() {
    if (document.getElementById('no-carrier-alert')) return;
    const alert = document.createElement('div');
    alert.id = 'no-carrier-alert';
    alert.className = 'no-carrier-alert';
    alert.innerHTML = `
      <div class="neu-s rounded-2xl p-4 border-l-4 border-amber-400" style="background:#F5F5DC">
        <div class="flex items-start gap-3">
          <span class="material-symbols-outlined text-amber-400 text-[24px] shrink-0 mt-0.5">warning</span>
          <div class="flex-1 min-w-0">
            <h4 class="text-[13px] font-bold text-lmdr-dark leading-tight">No Carrier Assigned</h4>
            <p class="text-[11px] text-tan mt-1 leading-snug">Add a carrier (DOT number) to start searching for drivers.</p>
            <button onclick="ROS.views.showView('carriers');var a=document.getElementById('no-carrier-alert');if(a)a.remove()"
                    class="mt-2.5 px-4 py-2 rounded-xl bg-gradient-to-br from-lmdr-blue to-lmdr-deep text-white text-[11px] font-bold shadow-md hover:shadow-lg transition-shadow inline-flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[14px]">add_business</span>Add Carrier
            </button>
          </div>
          <button onclick="document.getElementById('no-carrier-alert').remove()" class="text-tan hover:text-lmdr-dark shrink-0 mt-0.5">
            <span class="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      </div>`;
    document.body.appendChild(alert);
  }

  // ── Weight Preferences (floating orb with donut chart) ──
  const WEIGHT_META = {
    qualifications: { name: 'Qualifications', icon: 'verified', color: 'text-lmdr-blue', hex: '#2563eb' },
    experience: { name: 'Experience', icon: 'work_history', color: 'text-violet-500', hex: '#8b5cf6' },
    location: { name: 'Location', icon: 'location_on', color: 'text-emerald-500', hex: '#10b981' },
    availability: { name: 'Availability', icon: 'event_available', color: 'text-amber-500', hex: '#f59e0b' },
    salary_fit: { name: 'Salary Fit', icon: 'payments', color: 'text-teal-500', hex: '#14b8a6' },
    engagement: { name: 'Engagement', icon: 'trending_up', color: 'text-rose-400', hex: '#fb7185' }
  };

  function renderDonutChart() {
    const entries = Object.entries(weights);
    const total = entries.reduce((s, [, v]) => s + v, 0);
    const r = 36, cx = 48, cy = 48, sw = 10;
    const C = 2 * Math.PI * r;
    let arcs = '', offset = 0;
    for (const [key, val] of entries) {
      if (val <= 0) continue;
      const dash = (val / (total || 1)) * C;
      arcs += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${WEIGHT_META[key].hex}"
        stroke-width="${sw}" stroke-dasharray="${dash} ${C - dash}" stroke-dashoffset="${-offset}"
        stroke-linecap="butt" transform="rotate(-90 ${cx} ${cy})"/>`;
      offset += dash;
    }
    const fill = total === 100 ? '#10b981' : total > 100 ? '#f87171' : '#f59e0b';
    return `<svg width="96" height="96" viewBox="0 0 96 96">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#E8E0C8" stroke-width="${sw}"/>
      ${arcs}
      <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central"
            font-size="14" font-weight="800" fill="${fill}">${total}%</text>
    </svg>`;
  }

  function buildWeightsOrbHTML() {
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    const sliders = Object.entries(weights).map(([key, val]) => {
      const m = WEIGHT_META[key];
      return `<div class="flex items-center gap-2">
        <span class="material-symbols-outlined ${m.color} text-[14px] w-4">${m.icon}</span>
        <span class="text-[10px] font-bold text-lmdr-dark w-[68px] truncate">${m.name}</span>
        <input type="range" min="0" max="100" value="${val}" class="flex-1 accent-blue-600 h-1"
               id="wslider-${key}" oninput="ROS.views._search.updateWeight('${key}',this.value)"/>
        <span class="text-[10px] font-bold text-lmdr-blue w-[28px] text-right" id="wval-${key}">${val}%</span>
      </div>`;
    }).join('');

    return `
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-lmdr-blue text-[16px]">tune</span>
          <span class="text-[12px] font-bold text-lmdr-dark">Match Weights</span>
        </div>
        <button onclick="document.getElementById('weights-orb').remove()" class="text-tan hover:text-lmdr-dark">
          <span class="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
      <div class="flex gap-3 items-start">
        <div id="weights-donut" class="shrink-0">${renderDonutChart()}</div>
        <div class="flex-1 space-y-1.5">${sliders}</div>
      </div>
      <div class="flex items-center justify-between mt-3 pt-2 border-t border-tan/10">
        <div class="flex items-center gap-3">
          <span class="text-[10px] font-bold ${total === 100 ? 'text-emerald-500' : 'text-red-400'}" id="weights-total">Total: ${total}%</span>
          <button onclick="ROS.views._search.resetWeights()" class="text-[9px] font-bold text-tan hover:text-lmdr-dark underline">Reset</button>
        </div>
        <button onclick="ROS.views._search.saveWeights()" id="save-weights-btn"
                class="px-3 py-1.5 rounded-lg bg-gradient-to-br from-lmdr-blue to-lmdr-deep text-white text-[10px] font-bold shadow-md">Save</button>
      </div>`;
  }

  function refreshWeightsOrb() {
    const orb = document.getElementById('weights-orb');
    if (orb) orb.innerHTML = buildWeightsOrbHTML();
  }

  function updateWeightsTotal() {
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    const el = document.getElementById('weights-total');
    if (el) {
      el.textContent = `Total: ${total}%`;
      el.className = total === 100 ? 'text-[10px] font-bold text-emerald-500' : 'text-[10px] font-bold text-red-400';
    }
    const donut = document.getElementById('weights-donut');
    if (donut) donut.innerHTML = renderDonutChart();
  }

  function loadWeightsFromVelo(prefs) {
    if (prefs.weight_qualifications !== undefined) weights.qualifications = prefs.weight_qualifications;
    if (prefs.weight_experience !== undefined) weights.experience = prefs.weight_experience;
    if (prefs.weight_location !== undefined) weights.location = prefs.weight_location;
    if (prefs.weight_availability !== undefined) weights.availability = prefs.weight_availability;
    if (prefs.weight_salary_fit !== undefined) weights.salary_fit = prefs.weight_salary_fit;
    if (prefs.weight_engagement !== undefined) weights.engagement = prefs.weight_engagement;
    refreshWeightsOrb();
  }

  function handleWeightSaveResult(data) {
    const btn = document.getElementById('save-weights-btn');
    if (!btn) return;
    if (data && data.success) {
      btn.textContent = 'Saved!';
      btn.classList.remove('from-lmdr-blue', 'to-lmdr-deep');
      btn.classList.add('from-emerald-400', 'to-emerald-600');
      setTimeout(() => {
        btn.textContent = 'Save';
        btn.classList.add('from-lmdr-blue', 'to-lmdr-deep');
        btn.classList.remove('from-emerald-400', 'to-emerald-600');
      }, 1500);
      showToast('Weight preferences saved');
    } else {
      showToast(data && data.error ? data.error : 'Failed to save', 'error');
      btn.textContent = 'Save';
      btn.disabled = false;
    }
  }

  // ── Close Modal ──
  function closeModal(id) {
    const existing = document.getElementById(id);
    if (existing) existing.remove();
  }

  // ── Collect Filters ──
  function getFilters() {
    const f = {};

    // CDL Classes
    const cdlOrbs = document.querySelectorAll('[data-filter-group="cdlClass"].filter-orb-active');
    if (cdlOrbs.length) f.cdlClasses = Array.from(cdlOrbs).map(o => o.dataset.filterValue);

    // Endorsements
    const endOrbs = document.querySelectorAll('[data-filter-group="endorsements"].filter-orb-active');
    if (endOrbs.length) f.endorsements = Array.from(endOrbs).map(o => o.dataset.filterValue);

    // Experience (radio)
    const expOrb = document.querySelector('[data-filter-group="experience"].filter-orb-active');
    if (expOrb && expOrb.dataset.filterValue) f.minExperience = Number(expOrb.dataset.filterValue);

    // Availability (radio)
    const availOrb = document.querySelector('[data-filter-group="availability"].filter-orb-active');
    if (availOrb && availOrb.dataset.filterValue) f.availability = availOrb.dataset.filterValue;

    // Equipment
    const equipOrbs = document.querySelectorAll('[data-filter-group="equipment"].filter-orb-active');
    if (equipOrbs.length) f.equipment = Array.from(equipOrbs).map(o => o.dataset.filterValue);

    // ZIP + Radius
    const zipEl = document.getElementById('filter-zip');
    const radiusEl = document.getElementById('filter-radius');
    if (zipEl && zipEl.value.trim()) {
      f.zip = zipEl.value.trim();
      if (radiusEl && radiusEl.value) f.radius = Number(radiusEl.value);
    }

    return f;
  }

  // ── Public API ──
  ROS.views._search = {
    doSearch: function () {
      if (!hasCarrier) {
        renderNoCarrierState();
        return;
      }
      filters = getFilters();
      renderActiveFilters();
      isSearching = true;
      const container = document.getElementById('search-results');
      if (container) container.innerHTML = renderSkeletons(3);

      const input = document.getElementById('search-input');
      const query = input ? input.value.trim() : '';
      const searchData = { ...filters, query, limit: 500, usePreferences: true, includeMutualMatches: true };
      ROS.bridge.sendToVelo('searchDrivers', searchData);
    },

    doSort: function () {
      const sel = document.getElementById('search-sort');
      sortField = sel ? sel.value : 'matchScore';
      if (allDrivers.length) {
        currentPage = 0;
        applySortAndPaginate();
      }
    },

    toggleOrb: function (btn, group, value) {
      btn.classList.toggle('filter-orb-active');
      btn.classList.toggle('neu-x');
    },

    selectRadioOrb: function (btn, group, value) {
      // Deselect all in group
      document.querySelectorAll(`[data-filter-group="${group}"]`).forEach(o => {
        o.classList.remove('filter-orb-active');
        o.classList.add('neu-x');
      });
      btn.classList.add('filter-orb-active');
      btn.classList.remove('neu-x');
    },

    clearFilters: function () {
      document.querySelectorAll('.filter-orb-active').forEach(o => {
        o.classList.remove('filter-orb-active');
        o.classList.add('neu-x');
      });
      // Reset radio "Any" buttons
      ['experience', 'availability'].forEach(group => {
        const anyBtn = document.querySelector(`[data-filter-group="${group}"][data-filter-value=""]`);
        if (anyBtn) {
          anyBtn.classList.add('filter-orb-active');
          anyBtn.classList.remove('neu-x');
        }
      });
      const zipEl = document.getElementById('filter-zip');
      const radiusEl = document.getElementById('filter-radius');
      if (zipEl) zipEl.value = '';
      if (radiusEl) radiusEl.value = '50';
      filters = {};
      renderActiveFilters();
    },

    removeFilter: function (key) {
      delete filters[key];
      renderActiveFilters();
    },

    viewProfile: function (id, score) {
      selectedDriver = id;
      // Show loading state in results
      ROS.bridge.sendToVelo('viewDriverProfile', { driverId: id, matchScore: score });
    },

    saveDriver: function (id, score) {
      if (!viewedDriverIds.has(id)) {
        showToast('View the driver\'s profile first before saving', 'error');
        return;
      }
      ROS.bridge.sendToVelo('saveDriver', { driverId: id, matchScore: score || 0 });
    },

    saveDriverFromModal: function () {
      if (selectedDriver) {
        viewedDriverIds.add(selectedDriver);
        const score = selectedDriverData ? (selectedDriverData.matchScore || selectedDriverData.match_score || 0) : 0;
        ROS.bridge.sendToVelo('saveDriver', { driverId: selectedDriver, matchScore: score });
      }
    },

    openMessageModal: function (mode) {
      openMessageModal(mode);
    },

    generateAIDraft: function () {
      if (!selectedDriverData) {
        showToast('No driver selected', 'error');
        return;
      }
      const btn = document.getElementById('ai-draft-btn');
      const btnText = document.getElementById('ai-draft-btn-text');
      if (btn) {
        btn.disabled = true;
        btn.classList.add('opacity-50');
      }
      if (btnText) btnText.textContent = 'Generating...';

      ROS.bridge.sendToVelo('generateAIDraft', {
        driverId: selectedDriver,
        driver: selectedDriverData,
        mode: messageMode
      });
    },

    sendMessage: function () {
      const textarea = document.getElementById('msg-textarea');
      const message = textarea ? textarea.value.trim() : '';
      if (!message) {
        showToast('Please enter a message', 'error');
        return;
      }
      if (!selectedDriver) {
        showToast('No driver selected', 'error');
        return;
      }
      ROS.bridge.sendToVelo('contactDriver', { driverId: selectedDriver, message });
    },

    closeModal: function (id) {
      closeModal(id);
    },

    goToPage: function (n) {
      const totalPages = Math.ceil(totalCount / PAGE_SIZE);
      if (n < 0 || n >= totalPages) return;
      currentPage = n;
      applySortAndPaginate();
      // Scroll results into view
      const results = document.getElementById('search-results');
      if (results) results.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    openSaveModal: function () {
      openSaveSearchModal();
    },

    submitSaveSearch: function () {
      const nameEl = document.getElementById('save-search-name');
      const freqEl = document.getElementById('save-search-freq');
      const channelEl = document.querySelector('input[name="save-alert-ch"]:checked');
      const name = nameEl ? nameEl.value.trim() : '';
      if (!name) {
        showToast('Please enter a search name', 'error');
        return;
      }
      ROS.bridge.sendToVelo('saveSearch', {
        searchName: name,
        criteria: getFilters(),
        alertFrequency: freqEl ? freqEl.value : 'daily',
        alertChannel: channelEl ? channelEl.value : 'in_app'
      });
    },

    loadSaved: function () {
      ROS.bridge.sendToVelo('loadSavedSearches', {});
    },

    runSaved: function (id) {
      ROS.bridge.sendToVelo('runSavedSearch', { searchId: id });
    },

    deleteSaved: function (id) {
      ROS.bridge.sendToVelo('deleteSavedSearch', { searchId: id });
    },

    toggleWeights: function () {
      const existing = document.getElementById('weights-orb');
      if (existing) { existing.remove(); return; }
      const orb = document.createElement('div');
      orb.id = 'weights-orb';
      orb.className = 'weights-float-orb neu rounded-2xl p-4';
      orb.style.animation = 'fadeUp .3s ease';
      orb.innerHTML = buildWeightsOrbHTML();
      document.body.appendChild(orb);
    },

    updateWeight: function (key, val) {
      const raw = parseInt(val) || 0;
      const otherTotal = Object.entries(weights).filter(([k]) => k !== key).reduce((s, [, v]) => s + v, 0);
      const clamped = Math.min(Math.max(raw, 0), 100 - otherTotal);
      weights[key] = clamped;
      const slider = document.getElementById('wslider-' + key);
      if (slider && clamped !== raw) slider.value = clamped;
      const valEl = document.getElementById('wval-' + key);
      if (valEl) valEl.textContent = clamped + '%';
      updateWeightsTotal();
    },

    resetWeights: function () {
      weights = { qualifications: 25, experience: 20, location: 20, availability: 15, salary_fit: 10, engagement: 10 };
      refreshWeightsOrb();
    },

    saveWeights: function () {
      const btn = document.getElementById('save-weights-btn');
      if (btn) { btn.textContent = 'Saving\u2026'; btn.disabled = true; }
      ROS.bridge.sendToVelo('saveWeightPreferences', {
        weight_qualifications: weights.qualifications,
        weight_experience: weights.experience,
        weight_location: weights.location,
        weight_availability: weights.availability,
        weight_salary_fit: weights.salary_fit,
        weight_engagement: weights.engagement
      });
    },

    upgrade: function () {
      ROS.bridge.sendToVelo('navigateTo', { page: '/pricing' });
    }
  };

  ROS.views.registerView(VIEW_ID, { render, onMount, onUnmount, onMessage, messages: MESSAGES });
})();
