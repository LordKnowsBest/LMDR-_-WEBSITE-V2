/* =========================================
   ADMIN CARRIERS — Render Module
   Depends on: AdminCarriersConfig
   DOM rendering functions
   ========================================= */
var AdminCarriersRender = (function () {
  'use strict';

  var Config = AdminCarriersConfig;

  function renderContent(state) {
    if (state.isMobile) {
      renderMobileCards(state);
    } else {
      renderDesktopTable(state);
    }
  }

  function renderMobileCards(state) {
    var container = document.getElementById('mobileCarrierCards');
    document.getElementById('mobileResultCount').textContent = state.totalCount;

    if (state.carriers.length === 0) {
      container.innerHTML =
        '<div class="text-center py-12">' +
          '<span class="material-symbols-outlined text-4xl text-text-muted mb-3 block">local_shipping</span>' +
          '<p class="text-text-muted">No carriers found</p>' +
        '</div>';
      return;
    }

    container.innerHTML = state.carriers.map(function (carrier) {
      return renderCarrierCard(carrier, state);
    }).join('');
  }

  function renderCarrierCard(carrier, state) {
    var isSelected = state.selectedIds.has(carrier._id);
    var safetyClass = Config.getSafetyClass(carrier.safetyRating);
    var enrichmentClass = Config.getEnrichmentClass(carrier.enrichmentStatus);

    return (
      '<div class="carrier-card ' + (isSelected ? 'selected' : '') + '" data-id="' + carrier._id + '">' +
        '<div class="flex items-start gap-3">' +
          '<input type="checkbox" ' + (isSelected ? 'checked' : '') +
            ' class="h-5 w-5 rounded border-border-dark bg-surface-dark text-primary mt-1"' +
            ' onchange="AdminCarriersLogic.toggleSelection(\'' + carrier._id + '\')"/>' +
          '<div class="flex-1 min-w-0">' +
            '<div class="flex items-center gap-2 mb-1">' +
              '<button onclick="AdminCarriersLogic.viewCarrier(\'' + carrier._id + '\')" class="font-semibold text-white hover:text-primary truncate text-left">' +
                carrier.legalName +
              '</button>' +
              (carrier.isFlagged ? '<span class="material-symbols-outlined text-amber-400 text-[16px]">flag</span>' : '') +
            '</div>' +
            '<div class="text-xs text-text-muted mb-2">DOT: ' + carrier.dotNumber + (carrier.mcNumber ? ' | MC: ' + carrier.mcNumber : '') + '</div>' +
            '<div class="flex flex-wrap gap-2 mb-3">' +
              '<span class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium ' + safetyClass + '">' +
                '<span class="material-symbols-outlined text-[12px]">verified_user</span>' +
                (carrier.safetyRating || 'Not Rated') +
              '</span>' +
              '<span class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium ' + enrichmentClass + '">' +
                '<span class="material-symbols-outlined text-[12px]">auto_awesome</span>' +
                (carrier.enrichmentStatus || 'None') +
              '</span>' +
            '</div>' +
            '<div class="grid grid-cols-2 gap-2 text-xs">' +
              '<div><span class="text-text-muted">Location:</span><span class="ml-1">' + carrier.city + ', ' + carrier.state + '</span></div>' +
              '<div><span class="text-text-muted">Fleet:</span><span class="ml-1">' + carrier.fleetSize + ' trucks</span></div>' +
            '</div>' +
          '</div>' +
          '<button onclick="AdminCarriersLogic.showMobileActions(\'' + carrier._id + '\')" class="touch-target flex items-center justify-center w-10 h-10 -mr-2 text-text-muted">' +
            '<span class="material-symbols-outlined">more_vert</span>' +
          '</button>' +
        '</div>' +
      '</div>'
    );
  }

  function renderDesktopTable(state) {
    var tbody = document.getElementById('carriersTableBody');

    if (state.carriers.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="9" class="px-4 py-12 text-center">' +
          '<span class="material-symbols-outlined text-4xl text-text-muted mb-3 block">local_shipping</span>' +
          '<p class="text-text-muted">No carriers found</p>' +
        '</td></tr>';
      return;
    }

    tbody.innerHTML = state.carriers.map(function (carrier) {
      var isSelected = state.selectedIds.has(carrier._id);
      var safetyClass = Config.getSafetyClass(carrier.safetyRating);
      var enrichmentClass = Config.getEnrichmentClass(carrier.enrichmentStatus);
      var statusClass = Config.getStatusClass(carrier.status);

      var actionMenuItems =
        '<button onclick="AdminCarriersLogic.viewCarrier(\'' + carrier._id + '\')" class="w-full text-left px-4 py-2.5 text-sm hover:bg-[#2d3a4f] flex items-center gap-2">' +
          '<span class="material-symbols-outlined text-[18px]">visibility</span>View Details</button>' +
        '<button onclick="AdminCarriersLogic.viewFMCSA(\'' + carrier.dotNumber + '\')" class="w-full text-left px-4 py-2.5 text-sm hover:bg-[#2d3a4f] flex items-center gap-2">' +
          '<span class="material-symbols-outlined text-[18px]">open_in_new</span>View FMCSA</button>' +
        '<button onclick="AdminCarriersLogic.refreshEnrichment(\'' + carrier._id + '\')" class="w-full text-left px-4 py-2.5 text-sm hover:bg-[#2d3a4f] flex items-center gap-2">' +
          '<span class="material-symbols-outlined text-[18px]">refresh</span>Refresh Enrichment</button>' +
        '<div class="border-t border-border-dark my-1"></div>';

      if (carrier.status === 'active') {
        actionMenuItems +=
          '<button onclick="AdminCarriersLogic.flagCarrier(\'' + carrier._id + '\')" class="w-full text-left px-4 py-2.5 text-sm text-amber-400 hover:bg-[#2d3a4f] flex items-center gap-2">' +
            '<span class="material-symbols-outlined text-[18px]">flag</span>Flag for Review</button>' +
          '<button onclick="AdminCarriersLogic.deactivateCarrier(\'' + carrier._id + '\')" class="w-full text-left px-4 py-2.5 text-sm text-rose-400 hover:bg-[#2d3a4f] flex items-center gap-2">' +
            '<span class="material-symbols-outlined text-[18px]">block</span>Deactivate</button>';
      } else {
        actionMenuItems +=
          '<button onclick="AdminCarriersLogic.activateCarrier(\'' + carrier._id + '\')" class="w-full text-left px-4 py-2.5 text-sm text-emerald-400 hover:bg-[#2d3a4f] flex items-center gap-2">' +
            '<span class="material-symbols-outlined text-[18px]">check_circle</span>Activate</button>';
      }

      return (
        '<tr class="' + (isSelected ? 'selected' : '') + ' hover:bg-surface-dark/50 transition-colors">' +
          '<td class="px-4 py-3">' +
            '<input type="checkbox" ' + (isSelected ? 'checked' : '') +
              ' class="h-4 w-4 rounded border-border-dark bg-surface-dark text-primary cursor-pointer"' +
              ' onchange="AdminCarriersLogic.toggleSelection(\'' + carrier._id + '\')"/>' +
          '</td>' +
          '<td class="px-4 py-3">' +
            '<div class="flex items-center gap-3">' +
              '<div class="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">' +
                '<span class="material-symbols-outlined text-primary text-[20px]">local_shipping</span>' +
              '</div>' +
              '<div class="min-w-0">' +
                '<button onclick="AdminCarriersLogic.viewCarrier(\'' + carrier._id + '\')" class="font-medium text-white hover:text-primary text-left block truncate max-w-[200px]">' +
                  carrier.legalName +
                '</button>' +
                (carrier.dbaName ? '<div class="text-xs text-text-muted truncate">DBA: ' + carrier.dbaName + '</div>' : '') +
              '</div>' +
              (carrier.isFlagged ? '<span class="material-symbols-outlined text-amber-400 text-[16px]">flag</span>' : '') +
            '</div>' +
          '</td>' +
          '<td class="px-4 py-3">' +
            '<div class="text-sm">' + carrier.dotNumber + '</div>' +
            (carrier.mcNumber ? '<div class="text-xs text-text-muted">MC: ' + carrier.mcNumber + '</div>' : '') +
          '</td>' +
          '<td class="px-4 py-3 text-sm">' + carrier.city + ', ' + carrier.state + '</td>' +
          '<td class="px-4 py-3">' +
            '<div class="text-sm font-medium">' + carrier.fleetSize + '</div>' +
            '<div class="text-xs text-text-muted">' + carrier.driverCount + ' drivers</div>' +
          '</td>' +
          '<td class="px-4 py-3">' +
            '<span class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ' + safetyClass + '">' +
              (carrier.safetyRating || 'Not Rated') +
            '</span>' +
          '</td>' +
          '<td class="px-4 py-3">' +
            '<span class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium ' + enrichmentClass + '">' +
              '<span class="material-symbols-outlined text-[14px]">auto_awesome</span>' +
              (Config.capitalizeFirst(carrier.enrichmentStatus) || 'None') +
            '</span>' +
          '</td>' +
          '<td class="px-4 py-3">' +
            '<span class="inline-block px-2 py-1 rounded-md text-xs font-medium ' + statusClass + '">' +
              Config.capitalizeFirst(carrier.status) +
            '</span>' +
          '</td>' +
          '<td class="px-4 py-3 text-right">' +
            '<div class="relative inline-block">' +
              '<button onclick="AdminCarriersLogic.toggleActionMenu(\'menu-' + carrier._id + '\')" class="action-btn touch-target flex items-center justify-center w-8 h-8 rounded-lg hover:bg-surface-dark transition-colors">' +
                '<span class="material-symbols-outlined text-[20px]">more_horiz</span>' +
              '</button>' +
              '<div id="menu-' + carrier._id + '" class="dropdown-menu bg-surface-dark border border-border-dark rounded-xl shadow-xl py-2">' +
                actionMenuItems +
              '</div>' +
            '</div>' +
          '</td>' +
        '</tr>'
      );
    }).join('');
  }

  function updateStats(stats) {
    // Desktop
    document.getElementById('statTotalCarriers').textContent = stats.total ? stats.total.toLocaleString() : '0';
    document.getElementById('statActiveCarriers').textContent = stats.active ? stats.active.toLocaleString() : '0';
    document.getElementById('statActiveCarriersPercent').textContent = (stats.activePercent || 0) + '% of total';
    document.getElementById('statFlaggedCarriers').textContent = stats.flagged ? stats.flagged.toLocaleString() : '0';
    document.getElementById('statEnrichedCarriers').textContent = stats.enriched ? stats.enriched.toLocaleString() : '0';
    document.getElementById('statEnrichedPercent').textContent = (stats.enrichedPercent || 0) + '% coverage';
    document.getElementById('statTotalCarriersTrend').textContent = '+' + (stats.newThisWeek || 0) + ' this week';
    // Mobile
    document.getElementById('statTotalCarriersMobile').textContent = stats.total ? stats.total.toLocaleString() : '0';
    document.getElementById('statActiveCarriersMobile').textContent = stats.active ? stats.active.toLocaleString() : '0';
    document.getElementById('statActiveCarriersPercentMobile').textContent = (stats.activePercent || 0) + '%';
    document.getElementById('statFlaggedCarriersMobile').textContent = stats.flagged ? stats.flagged.toLocaleString() : '0';
    document.getElementById('statEnrichedCarriersMobile').textContent = stats.enriched ? stats.enriched.toLocaleString() : '0';
    document.getElementById('statEnrichedPercentMobile').textContent = (stats.enrichedPercent || 0) + '%';
    document.getElementById('statTotalCarriersTrendMobile').textContent = '+' + (stats.newThisWeek || 0);
  }

  function updatePagination(state) {
    var from = state.totalCount === 0 ? 0 : (state.currentPage - 1) * state.pageSize + 1;
    var to = Math.min(state.currentPage * state.pageSize, state.totalCount);
    var totalPages = Math.ceil(state.totalCount / state.pageSize);

    document.getElementById('paginationFrom').textContent = from;
    document.getElementById('paginationTo').textContent = to;
    document.getElementById('paginationTotal').textContent = state.totalCount;

    document.getElementById('prevPageBtn').disabled = state.currentPage <= 1;
    document.getElementById('nextPageBtn').disabled = state.currentPage >= totalPages;

    var loadMoreBtn = document.getElementById('loadMoreBtn');
    if (state.currentPage < totalPages) {
      loadMoreBtn.classList.remove('hidden');
    } else {
      loadMoreBtn.classList.add('hidden');
    }
  }

  function updateBulkActions(state) {
    var container = document.getElementById('bulkActionsContainer');
    document.getElementById('selectedCount').textContent = state.selectedIds.size;
    if (state.selectedIds.size > 0) {
      container.classList.remove('hidden');
    } else {
      container.classList.add('hidden');
    }
  }

  function showCarrierDetail(carrier, state) {
    var modal = document.getElementById('carrierDetailModal');
    var content = document.getElementById('carrierDetailContent');

    var safetyHtml = '';
    if (carrier.safetyData) {
      safetyHtml =
        '<div class="bg-surface-dark rounded-xl p-4 mb-4">' +
          '<h4 class="text-sm font-semibold mb-3 flex items-center gap-2">' +
            '<span class="material-symbols-outlined text-[18px]">verified_user</span>FMCSA Safety Data</h4>' +
          '<div class="grid grid-cols-2 gap-3 text-sm">' +
            '<div><span class="text-text-muted">Rating:</span>' +
              '<span class="ml-2 font-medium ' + Config.getSafetyClass(carrier.safetyData.safetyRating).split(' ')[1] + '">' + carrier.safetyData.safetyRating + '</span></div>' +
            '<div><span class="text-text-muted">Authorized:</span>' +
              '<span class="ml-2 ' + (carrier.safetyData.isAuthorized ? 'text-emerald-400' : 'text-rose-400') + '">' + (carrier.safetyData.isAuthorized ? 'Yes' : 'No') + '</span></div>' +
          '</div>' +
          (carrier.safetyData.lastFetched ? '<div class="text-xs text-text-muted mt-3">Last updated: ' + new Date(carrier.safetyData.lastFetched).toLocaleDateString() + '</div>' : '') +
        '</div>';
    }

    var enrichmentHtml = '';
    if (carrier.enrichment && carrier.enrichment.hasEnrichment) {
      enrichmentHtml =
        '<div class="bg-surface-dark rounded-xl p-4 mb-4">' +
          '<h4 class="text-sm font-semibold mb-3 flex items-center gap-2">' +
            '<span class="material-symbols-outlined text-[18px]">auto_awesome</span>AI Enrichment</h4>' +
          '<div class="text-sm space-y-2">' +
            '<div class="flex justify-between"><span class="text-text-muted">Cache Age:</span><span>' + carrier.enrichment.cacheAge + ' days</span></div>' +
            (carrier.enrichment.socialScore ? '<div class="flex justify-between"><span class="text-text-muted">Social Score:</span><span>' + carrier.enrichment.socialScore + '/100</span></div>' : '') +
          '</div>' +
        '</div>';
    }

    var dotNumber = carrier.dot_number || carrier.dotNumber;
    var flagHtml = carrier.isFlagged
      ? '<button onclick="AdminCarriersLogic.unflagCarrier(\'' + carrier._id + '\')" class="touch-target w-full flex items-center justify-center gap-2 h-12 rounded-lg bg-emerald-600/20 text-emerald-400 text-sm font-medium hover:bg-emerald-600/30 transition-colors">' +
          '<span class="material-symbols-outlined text-[18px]">flag_off</span>Remove Flag</button>'
      : '<button onclick="AdminCarriersLogic.flagCarrier(\'' + carrier._id + '\')" class="touch-target w-full flex items-center justify-center gap-2 h-12 rounded-lg bg-amber-600/20 text-amber-400 text-sm font-medium hover:bg-amber-600/30 transition-colors">' +
          '<span class="material-symbols-outlined text-[18px]">flag</span>Flag for Review</button>';

    content.innerHTML =
      '<div class="sticky top-0 z-10 bg-surface-darker border-b border-border-dark px-4 md:px-6 py-4 flex items-center justify-between">' +
        '<h2 class="text-lg font-bold truncate pr-4">' + (carrier.legal_name || carrier.legalName) + '</h2>' +
        '<button onclick="AdminCarriersLogic.closeCarrierModal()" class="touch-target flex items-center justify-center w-10 h-10 rounded-lg hover:bg-surface-dark transition-colors">' +
          '<span class="material-symbols-outlined">close</span></button>' +
      '</div>' +
      '<div class="px-4 md:px-6 py-4">' +
        '<div class="bg-surface-dark rounded-xl p-4 mb-4">' +
          '<div class="grid grid-cols-2 gap-4 text-sm">' +
            '<div><span class="text-text-muted block text-xs mb-1">DOT Number</span><span class="font-medium">' + dotNumber + '</span></div>' +
            '<div><span class="text-text-muted block text-xs mb-1">MC Number</span><span class="font-medium">' + (carrier.mc_number || carrier.mcNumber || 'N/A') + '</span></div>' +
            '<div><span class="text-text-muted block text-xs mb-1">Location</span><span class="font-medium">' + (carrier.phy_city || carrier.city) + ', ' + (carrier.phy_state || carrier.state) + '</span></div>' +
            '<div><span class="text-text-muted block text-xs mb-1">Phone</span><span class="font-medium">' + (carrier.telephone || 'N/A') + '</span></div>' +
            '<div><span class="text-text-muted block text-xs mb-1">Fleet Size</span><span class="font-medium">' + (carrier.nbr_power_unit || carrier.fleetSize || 0) + ' trucks</span></div>' +
            '<div><span class="text-text-muted block text-xs mb-1">Drivers</span><span class="font-medium">' + (carrier.driver_total || carrier.driverCount || 0) + '</span></div>' +
          '</div>' +
        '</div>' +
        safetyHtml +
        enrichmentHtml +
        '<div class="bg-surface-dark rounded-xl p-4 mb-4">' +
          '<h4 class="text-sm font-semibold mb-3">Match Activity</h4>' +
          '<div class="grid grid-cols-2 gap-4 text-sm">' +
            '<div class="text-center p-3 bg-surface-darker rounded-lg">' +
              '<div class="text-2xl font-bold text-primary">' + ((carrier.stats && carrier.stats.totalMatches) || 0) + '</div>' +
              '<div class="text-xs text-text-muted">Total Matches</div></div>' +
            '<div class="text-center p-3 bg-surface-darker rounded-lg">' +
              '<div class="text-2xl font-bold text-violet-400">' + ((carrier.stats && carrier.stats.driverInterests) || 0) + '</div>' +
              '<div class="text-xs text-text-muted">Driver Interests</div></div>' +
          '</div>' +
        '</div>' +
        '<div class="flex flex-col gap-2">' +
          '<button onclick="AdminCarriersLogic.viewFMCSA(\'' + dotNumber + '\')" class="touch-target w-full flex items-center justify-center gap-2 h-12 rounded-lg bg-surface-dark border border-border-dark text-sm font-medium hover:bg-[#2d3a4f] transition-colors">' +
            '<span class="material-symbols-outlined text-[18px]">open_in_new</span>View on FMCSA SAFER</button>' +
          '<button onclick="AdminCarriersLogic.refreshEnrichment(\'' + carrier._id + '\')" class="touch-target w-full flex items-center justify-center gap-2 h-12 rounded-lg bg-violet-600/20 text-violet-400 text-sm font-medium hover:bg-violet-600/30 transition-colors">' +
            '<span class="material-symbols-outlined text-[18px]">refresh</span>Refresh Enrichment</button>' +
          flagHtml +
        '</div>' +
      '</div>';

    modal.classList.remove('hidden');
  }

  function showMobileActionSheet(carrier) {
    var sheet = document.getElementById('mobileActionSheet');
    var content = document.getElementById('mobileActionSheetContent');

    var statusActions = carrier.status === 'active'
      ? '<button onclick="AdminCarriersLogic.flagCarrier(\'' + carrier._id + '\')" class="touch-target w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-surface-darker text-amber-400 text-left">' +
          '<span class="material-symbols-outlined text-[20px]">flag</span><span>Flag for Review</span></button>' +
        '<button onclick="AdminCarriersLogic.deactivateCarrier(\'' + carrier._id + '\')" class="touch-target w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-surface-darker text-rose-400 text-left">' +
          '<span class="material-symbols-outlined text-[20px]">block</span><span>Deactivate</span></button>'
      : '<button onclick="AdminCarriersLogic.activateCarrier(\'' + carrier._id + '\')" class="touch-target w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-surface-darker text-emerald-400 text-left">' +
          '<span class="material-symbols-outlined text-[20px]">check_circle</span><span>Activate</span></button>';

    content.innerHTML =
      '<div class="text-sm font-semibold text-text-muted mb-3 truncate">' + carrier.legalName + '</div>' +
      '<div class="space-y-2">' +
        '<button onclick="AdminCarriersLogic.viewCarrier(\'' + carrier._id + '\')" class="touch-target w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-surface-darker text-left">' +
          '<span class="material-symbols-outlined text-[20px]">visibility</span><span>View Details</span></button>' +
        '<button onclick="AdminCarriersLogic.viewFMCSA(\'' + carrier.dotNumber + '\')" class="touch-target w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-surface-darker text-left">' +
          '<span class="material-symbols-outlined text-[20px]">open_in_new</span><span>View on FMCSA</span></button>' +
        '<button onclick="AdminCarriersLogic.refreshEnrichment(\'' + carrier._id + '\')" class="touch-target w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-surface-darker text-left">' +
          '<span class="material-symbols-outlined text-[20px]">refresh</span><span>Refresh Enrichment</span></button>' +
        '<div class="border-t border-border-dark my-2"></div>' +
        statusActions +
      '</div>';

    sheet.classList.remove('hidden');
  }

  function showToast(message, type) {
    var container = document.getElementById('toastContainer');
    var id = 'toast-' + Date.now();
    var bgColor = type === 'success' ? 'bg-emerald-600' : type === 'error' ? 'bg-rose-600' : 'bg-primary';
    var icon = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';

    var toast = document.createElement('div');
    toast.id = id;
    toast.className = 'toast flex items-center gap-3 px-4 py-3 rounded-lg ' + bgColor + ' shadow-lg';
    toast.innerHTML =
      '<span class="material-symbols-outlined text-[20px]">' + icon + '</span>' +
      '<span class="text-sm font-medium flex-1">' + message + '</span>' +
      '<button onclick="document.getElementById(\'' + id + '\').remove()" class="text-white/80 hover:text-white">' +
        '<span class="material-symbols-outlined text-[18px]">close</span></button>';

    container.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 5000);
  }

  return {
    renderContent: renderContent,
    updateStats: updateStats,
    updatePagination: updatePagination,
    updateBulkActions: updateBulkActions,
    showCarrierDetail: showCarrierDetail,
    showMobileActionSheet: showMobileActionSheet,
    showToast: showToast
  };
})();
