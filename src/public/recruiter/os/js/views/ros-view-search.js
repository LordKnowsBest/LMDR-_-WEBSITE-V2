// ============================================================================
// ROS-VIEW-SEARCH — Driver Search + AI Match + Saved Searches
// Extracted from RECRUITER_DRIVER_SEARCH.html
// ============================================================================

(function() {
  'use strict';

  const VIEW_ID = 'search';
  const MESSAGES = [
    'searchDriversResult', 'viewDriverProfileResult', 'saveDriverResult',
    'contactDriverResult', 'getQuotaStatusResult', 'getWeightPreferencesResult',
    'saveWeightPreferencesResult', 'recruiterProfile', 'driverSearchInit',
    'saveSearchResult', 'savedSearchesLoaded', 'savedSearchExecuted',
    'savedSearchDeleted', 'savedSearchUpdated'
  ];

  // State
  let drivers = [];
  let totalCount = 0;
  let currentPage = 1;
  let pageSize = 20;
  let filters = {};
  let savedSearches = [];
  let quotaStatus = null;

  function render() {
    return `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button onclick="ROS.views.showView('home')" class="w-8 h-8 neu-s rounded-lg flex items-center justify-center hover:shadow-none transition-shadow">
            <span class="material-symbols-outlined text-tan text-[16px]">arrow_back</span>
          </button>
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-lmdr-blue to-lmdr-deep flex items-center justify-center">
            <span class="material-symbols-outlined text-white text-[16px]">person_search</span>
          </div>
          <h2 class="text-lg font-bold text-lmdr-dark">Driver Search</h2>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-[11px] text-tan font-medium" id="search-count">0 results</span>
          <button onclick="ROS.views._search.loadSaved()" class="px-3 py-1.5 text-[10px] font-bold rounded-full neu-x text-tan hover:text-lmdr-blue transition-colors">
            <span class="material-symbols-outlined text-[12px] align-middle">bookmark</span> Saved
          </button>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="flex gap-3 mt-4">
        <div class="flex-1 flex items-center px-4 py-3 neu-in rounded-xl">
          <span class="material-symbols-outlined text-tan text-[18px]">search</span>
          <input id="search-input" class="bg-transparent border-none focus:ring-0 text-base text-lmdr-dark placeholder-tan/50 w-full ml-2 outline-none font-medium"
                 placeholder="Name, CDL type, location, endorsements..."
                 onkeydown="if(event.key==='Enter')ROS.views._search.doSearch()"/>
        </div>
        <button onclick="ROS.views._search.doSearch()" class="px-5 py-3 rounded-xl bg-gradient-to-br from-lmdr-blue to-lmdr-deep text-white text-sm font-bold flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-shadow">
          <span class="material-symbols-outlined text-[18px]">auto_awesome</span>AI Match
        </button>
      </div>

      <!-- Filter Pills -->
      <div class="flex gap-2 flex-wrap mt-3" id="search-filters">
        <span class="px-3 py-1.5 text-[10px] font-bold rounded-full neu-x text-tan cursor-pointer hover:text-lmdr-blue transition-colors" onclick="ROS.views._search.addFilter('cdlType','CDL-A')">CDL-A</span>
        <span class="px-3 py-1.5 text-[10px] font-bold rounded-full neu-x text-tan cursor-pointer hover:text-lmdr-blue transition-colors" onclick="ROS.views._search.addFilter('cdlType','CDL-B')">CDL-B</span>
        <span class="px-3 py-1.5 text-[10px] font-bold rounded-full neu-x text-tan cursor-pointer hover:text-lmdr-blue transition-colors" onclick="ROS.views._search.addFilter('endorsement','HazMat')">HazMat</span>
        <span class="px-3 py-1.5 text-[10px] font-bold rounded-full neu-x text-tan cursor-pointer hover:text-lmdr-blue transition-colors" onclick="ROS.views._search.addFilter('endorsement','Tanker')">Tanker</span>
        <span class="px-3 py-1.5 text-[10px] font-bold rounded-full neu-x text-tan cursor-pointer hover:text-lmdr-blue transition-colors" onclick="ROS.views._search.addFilter('runType','OTR')">OTR</span>
        <span class="px-3 py-1.5 text-[10px] font-bold rounded-full neu-x text-tan cursor-pointer hover:text-lmdr-blue transition-colors" onclick="ROS.views._search.addFilter('runType','Local')">Local</span>
      </div>

      <!-- Active Filters -->
      <div id="search-active-filters" class="flex gap-2 flex-wrap mt-2"></div>

      <!-- Results -->
      <div class="flex flex-col gap-3 mt-4" id="search-results">
        <div class="text-center py-12 text-tan text-[13px]">
          <span class="material-symbols-outlined text-[48px] text-tan/30 block mb-3">person_search</span>
          Enter search criteria and click AI Match to find drivers
        </div>
      </div>

      <!-- Pagination -->
      <div class="flex items-center justify-center gap-3 mt-4" id="search-pagination" style="display:none">
        <button onclick="ROS.views._search.prevPage()" class="px-3 py-1.5 rounded-lg neu-x text-[11px] font-bold text-tan">Prev</button>
        <span class="text-[11px] text-tan font-medium" id="search-page-info"></span>
        <button onclick="ROS.views._search.nextPage()" class="px-3 py-1.5 rounded-lg neu-x text-[11px] font-bold text-tan">Next</button>
      </div>

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

  function onMount() {
    // Signal Velo that search is ready
    ROS.bridge.sendToVelo('driverSearchReady', {});
    ROS.bridge.sendToVelo('getQuotaStatus', {});
  }

  function onUnmount() {
    drivers = [];
    totalCount = 0;
    currentPage = 1;
  }

  function onMessage(type, data) {
    switch (type) {
      case 'driverSearchInit':
        if (data && data.quotaStatus) quotaStatus = data.quotaStatus;
        break;

      case 'searchDriversResult':
        if (data && data.success) {
          drivers = data.drivers || [];
          totalCount = data.total || drivers.length;
          renderResults();
        } else {
          renderError(data && data.error ? data.error : 'Search failed');
        }
        break;

      case 'viewDriverProfileResult':
        if (data && data.success) renderProfileModal(data.driver);
        break;

      case 'saveDriverResult':
        showToast(data && data.success ? 'Driver saved to pipeline' : 'Failed to save driver');
        break;

      case 'contactDriverResult':
        showToast(data && data.success ? 'Message sent' : 'Failed to send message');
        break;

      case 'getQuotaStatusResult':
        quotaStatus = data;
        break;

      case 'savedSearchesLoaded':
        savedSearches = (data && data.searches) || [];
        renderSavedSearches();
        break;

      case 'savedSearchExecuted':
        if (data && data.success) {
          drivers = data.drivers || [];
          totalCount = data.total || drivers.length;
          renderResults();
        }
        break;

      case 'savedSearchDeleted':
        showToast('Search deleted');
        ROS.bridge.sendToVelo('loadSavedSearches', {});
        break;
    }
  }

  // ── Render Results ──
  function renderResults() {
    const container = document.getElementById('search-results');
    const countEl = document.getElementById('search-count');
    const pagination = document.getElementById('search-pagination');
    if (!container) return;

    if (countEl) countEl.textContent = totalCount + ' results';

    if (drivers.length === 0) {
      container.innerHTML = '<div class="text-center py-8 text-tan text-[13px]">No drivers found matching your criteria</div>';
      if (pagination) pagination.style.display = 'none';
      return;
    }

    container.innerHTML = drivers.map(d => renderDriverCard(d)).join('');

    if (pagination) {
      pagination.style.display = totalCount > pageSize ? 'flex' : 'none';
      const pageInfo = document.getElementById('search-page-info');
      if (pageInfo) pageInfo.textContent = `Page ${currentPage} of ${Math.ceil(totalCount / pageSize)}`;
    }
  }

  function renderDriverCard(driver) {
    const name = driver.name || driver.full_name || 'Unknown';
    const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const matchScore = driver.matchScore || driver.match_score || 0;
    const cdl = driver.cdl_type || driver.cdlType || '';
    const location = driver.city ? `${driver.city}, ${driver.state}` : (driver.location || '');
    const exp = driver.years_experience ? `${driver.years_experience}yr exp` : '';
    const endorsements = driver.endorsements || '';
    const details = [cdl, endorsements, location, exp].filter(Boolean).join(' \u00b7 ');

    const colors = ['from-lmdr-yb to-amber-500', 'from-lmdr-blue to-lmdr-deep', 'from-emerald-400 to-teal-600', 'from-violet-400 to-purple-600', 'from-amber-400 to-orange-500'];
    const colorIdx = name.charCodeAt(0) % colors.length;
    const textColor = colorIdx === 0 ? 'text-lmdr-dark' : 'text-white';

    const driverId = driver._id || driver.id || driver.record_id || '';

    return `
      <div class="flex items-center gap-4 p-4 neu-s rounded-xl cursor-pointer hover:shadow-neu transition-shadow group"
           onclick="ROS.views._search.viewProfile('${driverId}')">
        <div class="w-12 h-12 rounded-xl bg-gradient-to-br ${colors[colorIdx]} flex items-center justify-center font-black ${textColor}">${initials}</div>
        <div class="flex-1">
          <div class="text-[14px] font-bold text-lmdr-dark group-hover:text-lmdr-blue transition-colors">${escapeHtml(name)}</div>
          <div class="text-[12px] text-tan mt-0.5">${escapeHtml(details)}</div>
        </div>
        <div class="text-right">
          <div class="text-2xl font-black text-lmdr-blue">${Math.round(matchScore)}%</div>
          <div class="text-[9px] font-bold text-tan uppercase tracking-wider">Match</div>
        </div>
        <button class="px-3 py-2 rounded-lg bg-gradient-to-br from-lmdr-blue to-lmdr-deep text-white text-[11px] font-bold shadow-md hover:shadow-lg transition-shadow"
                onclick="event.stopPropagation();ROS.views._search.saveDriver('${driverId}')">+ Pipeline</button>
      </div>`;
  }

  function renderError(msg) {
    const container = document.getElementById('search-results');
    if (container) container.innerHTML = `<div class="text-center py-8 text-red-400 text-[13px]">${escapeHtml(msg)}</div>`;
  }

  function renderSavedSearches() {
    const list = document.getElementById('saved-searches-list');
    const panel = document.getElementById('saved-searches-panel');
    if (!list || !panel) return;
    panel.style.display = 'block';

    if (savedSearches.length === 0) {
      list.innerHTML = '<div class="text-[12px] text-tan">No saved searches yet</div>';
      return;
    }
    list.innerHTML = savedSearches.map(s => `
      <div class="flex items-center gap-3 p-2.5 neu-x rounded-xl">
        <span class="material-symbols-outlined text-lmdr-blue text-[16px]">bookmark</span>
        <div class="flex-1">
          <div class="text-[12px] font-bold text-lmdr-dark">${escapeHtml(s.name || 'Unnamed')}</div>
          <div class="text-[10px] text-tan">${s.resultCount || 0} results</div>
        </div>
        <button onclick="ROS.views._search.runSaved('${s._id || s.id}')" class="text-[10px] font-bold text-lmdr-blue hover:underline">Run</button>
        <button onclick="ROS.views._search.deleteSaved('${s._id || s.id}')" class="text-tan hover:text-red-400">
          <span class="material-symbols-outlined text-[14px]">delete</span>
        </button>
      </div>`).join('');
  }

  function renderProfileModal(driver) {
    // Simple profile overlay (future: full modal)
    const name = driver.name || driver.full_name || 'Unknown';
    showToast('Viewing profile: ' + name);
  }

  function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'fixed top-16 right-4 z-[9999] px-4 py-2.5 rounded-xl neu-s text-[12px] font-bold text-lmdr-dark';
    toast.style.animation = 'fadeUp .3s ease';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  function escapeHtml(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // ── Public API (for onclick handlers) ──
  ROS.views._search = {
    doSearch: function() {
      const input = document.getElementById('search-input');
      const query = input ? input.value.trim() : '';
      currentPage = 1;
      ROS.bridge.sendToVelo('searchDrivers', { query, filters, page: currentPage, pageSize });
    },
    addFilter: function(key, value) {
      filters[key] = value;
      renderActiveFilters();
    },
    removeFilter: function(key) {
      delete filters[key];
      renderActiveFilters();
    },
    viewProfile: function(id) {
      ROS.bridge.sendToVelo('viewDriverProfile', { driverId: id });
    },
    saveDriver: function(id) {
      ROS.bridge.sendToVelo('saveDriver', { driverId: id });
    },
    contactDriver: function(id) {
      ROS.bridge.sendToVelo('contactDriver', { driverId: id });
    },
    nextPage: function() {
      if (currentPage * pageSize < totalCount) {
        currentPage++;
        ROS.bridge.sendToVelo('searchDrivers', { filters, page: currentPage, pageSize });
      }
    },
    prevPage: function() {
      if (currentPage > 1) {
        currentPage--;
        ROS.bridge.sendToVelo('searchDrivers', { filters, page: currentPage, pageSize });
      }
    },
    loadSaved: function() {
      ROS.bridge.sendToVelo('loadSavedSearches', {});
    },
    runSaved: function(id) {
      ROS.bridge.sendToVelo('runSavedSearch', { searchId: id });
    },
    deleteSaved: function(id) {
      ROS.bridge.sendToVelo('deleteSavedSearch', { searchId: id });
    }
  };

  function renderActiveFilters() {
    const el = document.getElementById('search-active-filters');
    if (!el) return;
    const entries = Object.entries(filters);
    if (entries.length === 0) { el.innerHTML = ''; return; }
    el.innerHTML = entries.map(([k, v]) => `
      <span class="px-3 py-1.5 text-[10px] font-bold rounded-full neu-ins text-lmdr-blue flex items-center gap-1">
        ${escapeHtml(v)}
        <span class="material-symbols-outlined text-[12px] cursor-pointer hover:text-red-400" onclick="ROS.views._search.removeFilter('${k}')">close</span>
      </span>`).join('');
  }

  ROS.views.registerView(VIEW_ID, { render, onMount, onUnmount, onMessage, messages: MESSAGES });
})();
