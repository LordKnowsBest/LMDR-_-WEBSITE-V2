/* =========================================
   ADMIN CARRIERS — Logic Module
   Depends on: AdminCarriersConfig, AdminCarriersBridge, AdminCarriersRender
   Business logic, event handlers, state management
   ========================================= */
var AdminCarriersLogic = (function () {
  'use strict';

  var Config = AdminCarriersConfig;
  var Bridge = AdminCarriersBridge;
  var Render = AdminCarriersRender;

  var state = Config.createInitialState();
  var isLoadingMore = false;
  var searchTimeout;

  // ============================================
  // INITIALIZATION
  // ============================================
  function init() {
    initTheme();
    handleResize();
    Bridge.getCarriers(state.filters, 1, state.pageSize);
    Bridge.getStats();

    Bridge.listen(handleMessage);
    window.addEventListener('resize', handleResize);

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.filter-chip') && !e.target.closest('.filter-dropdown')) {
        document.querySelectorAll('.filter-dropdown').forEach(function (d) { d.classList.remove('open'); });
        document.getElementById('mobileOverlay').classList.remove('open');
      }
      if (!e.target.closest('.action-btn') && !e.target.closest('.dropdown-menu')) {
        document.querySelectorAll('.dropdown-menu').forEach(function (d) { d.classList.remove('open'); });
      }
    });
  }

  function handleResize() {
    var wasMobile = state.isMobile;
    state.isMobile = window.innerWidth < 768;
    if (wasMobile !== state.isMobile) {
      Render.renderContent(state);
    }
  }

  // ============================================
  // MESSAGE HANDLING
  // ============================================
  function handleMessage(data) {
    switch (data.action) {
      case 'init':
        Bridge.getCarriers(state.filters, 1, state.pageSize);
        Bridge.getStats();
        break;
      case 'carriersLoaded':
        handleCarriersLoaded(data.payload);
        break;
      case 'carrierDetail':
        Render.showCarrierDetail(data.payload, state);
        break;
      case 'statsLoaded':
        Render.updateStats(data.payload);
        break;
      case 'actionSuccess':
        Render.showToast(data.message || 'Action completed successfully', 'success');
        refreshData();
        break;
      case 'actionError':
        Render.showToast(data.message || 'An error occurred', 'error');
        break;
      case 'exportReady':
        downloadCSV(data.payload);
        break;
    }
  }

  function handleCarriersLoaded(payload) {
    if (isLoadingMore) {
      state.carriers = state.carriers.concat(payload.carriers || []);
      isLoadingMore = false;
    } else {
      state.carriers = payload.carriers || [];
    }
    state.totalCount = payload.totalCount || 0;
    state.currentPage = payload.currentPage || 1;
    state.pageSize = payload.pageSize || 25;
    state.isLoading = false;

    Render.renderContent(state);
    Render.updatePagination(state);
  }

  function refreshData() {
    state.isLoading = true;
    state.selectedIds.clear();
    Render.updateBulkActions(state);
    Bridge.getCarriers(state.filters, state.currentPage, state.pageSize, state.sortField, state.sortDirection);
    Bridge.getStats();
  }

  // ============================================
  // SELECTION & BULK ACTIONS
  // ============================================
  function toggleSelection(id) {
    if (state.selectedIds.has(id)) {
      state.selectedIds.delete(id);
    } else {
      state.selectedIds.add(id);
    }
    Render.updateBulkActions(state);
    Render.renderContent(state);
  }

  function toggleSelectAll() {
    var checkbox = document.getElementById('selectAllCheckbox');
    if (checkbox.checked) {
      state.carriers.forEach(function (c) { state.selectedIds.add(c._id); });
    } else {
      state.selectedIds.clear();
    }
    Render.updateBulkActions(state);
    Render.renderContent(state);
  }

  function bulkActivate() {
    if (state.selectedIds.size === 0) return;
    Bridge.bulkActivate(Array.from(state.selectedIds));
  }

  function bulkFlag() {
    if (state.selectedIds.size === 0) return;
    Bridge.bulkFlag(Array.from(state.selectedIds));
  }

  // ============================================
  // ACTIONS
  // ============================================
  function viewCarrier(id) {
    closeAllMenus();
    Bridge.getCarrierDetail(id);
  }

  function viewFMCSA(dotNumber) {
    closeAllMenus();
    Bridge.viewFMCSA(dotNumber);
  }

  function activateCarrier(id) {
    closeAllMenus();
    Bridge.updateStatus(id, 'active', 'Admin activated');
  }

  function deactivateCarrier(id) {
    closeAllMenus();
    Bridge.updateStatus(id, 'inactive', 'Admin deactivated');
  }

  function flagCarrier(id) {
    closeAllMenus();
    Bridge.flagCarrier(id, 'Flagged via admin panel');
  }

  function unflagCarrier(id) {
    closeAllMenus();
    Bridge.unflagCarrier(id);
  }

  function refreshEnrichment(id) {
    closeAllMenus();
    Bridge.refreshEnrichment(id);
  }

  function exportCarriers() {
    Bridge.exportCarriers(state.filters);
  }

  function openAddCarrierModal() {
    Bridge.openAddCarrierModal();
  }

  function downloadCSV(csvContent) {
    var blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var link = document.createElement('a');
    link.href = url;
    link.download = 'carriers_export_' + new Date().toISOString().split('T')[0] + '.csv';
    link.click();
    URL.revokeObjectURL(url);
    Render.showToast('Export downloaded', 'success');
  }

  // ============================================
  // FILTERING & SEARCH
  // ============================================
  function handleSearch() {
    var input = document.getElementById('searchInput');
    var clearBtn = document.getElementById('clearSearchBtn');
    clearBtn.classList.toggle('hidden', !input.value);

    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(function () {
      state.filters.search = input.value;
      state.currentPage = 1;
      refreshData();
    }, 300);
  }

  function clearSearch() {
    var input = document.getElementById('searchInput');
    input.value = '';
    document.getElementById('clearSearchBtn').classList.add('hidden');
    state.filters.search = '';
    state.currentPage = 1;
    refreshData();
  }

  function setFilter(filterName, value) {
    state.filters[filterName] = value;
    state.currentPage = 1;

    if (filterName === 'status') {
      document.getElementById('statusFilterLabel').textContent = Config.FILTER_LABELS.status[value] || 'Status';
    } else if (filterName === 'fleetSize') {
      document.getElementById('fleetFilterLabel').textContent = Config.FILTER_LABELS.fleetSize[value] || 'Fleet Size';
    } else if (filterName === 'safetyRating') {
      document.getElementById('safetyFilterLabel').textContent = Config.FILTER_LABELS.safetyRating[value] || 'Safety';
    }

    closeAllMenus();
    refreshData();
  }

  function toggleFilterDropdown(id) {
    var dropdown = document.getElementById(id);
    var wasOpen = dropdown.classList.contains('open');
    closeAllMenus();
    if (!wasOpen) {
      dropdown.classList.add('open');
      if (state.isMobile) {
        document.getElementById('mobileOverlay').classList.add('open');
      }
    }
  }

  // ============================================
  // PAGINATION & SORTING
  // ============================================
  function goToPage(direction) {
    if (direction === 'prev' && state.currentPage > 1) {
      state.currentPage--;
    } else if (direction === 'next') {
      state.currentPage++;
    }
    refreshData();
  }

  function changePageSize() {
    state.pageSize = parseInt(document.getElementById('pageSizeSelect').value);
    state.currentPage = 1;
    refreshData();
  }

  function loadMore() {
    isLoadingMore = true;
    state.currentPage++;
    Bridge.getCarriers(state.filters, state.currentPage, state.pageSize, state.sortField, state.sortDirection);
  }

  function sortBy(field) {
    if (state.sortField === field) {
      state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      state.sortField = field;
      state.sortDirection = 'desc';
    }

    document.querySelectorAll('[id^="sortIcon"]').forEach(function (el) {
      el.textContent = 'unfold_more';
    });
    var activeIcon = document.getElementById('sortIcon' + Config.capitalizeFirst(field));
    if (activeIcon) {
      activeIcon.textContent = state.sortDirection === 'asc' ? 'expand_less' : 'expand_more';
    }

    state.currentPage = 1;
    refreshData();
  }

  // ============================================
  // MODALS & MENUS
  // ============================================
  function showMobileActions(carrierId) {
    var carrier = state.carriers.find(function (c) { return c._id === carrierId; });
    if (!carrier) return;
    Render.showMobileActionSheet(carrier);
  }

  function closeCarrierModal() {
    document.getElementById('carrierDetailModal').classList.add('hidden');
  }

  function closeMobileActionSheet() {
    document.getElementById('mobileActionSheet').classList.add('hidden');
  }

  function toggleActionMenu(menuId) {
    var menu = document.getElementById(menuId);
    var wasOpen = menu.classList.contains('open');
    document.querySelectorAll('.dropdown-menu').forEach(function (m) { m.classList.remove('open'); });
    if (!wasOpen) {
      menu.classList.add('open');
    }
  }

  function closeAllMenus() {
    document.querySelectorAll('.filter-dropdown').forEach(function (d) { d.classList.remove('open'); });
    document.querySelectorAll('.dropdown-menu').forEach(function (d) { d.classList.remove('open'); });
    document.getElementById('mobileOverlay').classList.remove('open');
    closeMobileActionSheet();
  }

  // ============================================
  // THEME MANAGEMENT
  // ============================================
  function initTheme() {
    var saved = localStorage.getItem(Config.THEME_KEY);
    var theme = saved || 'dark';
    applyTheme(theme);
  }

  function applyTheme(theme) {
    if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    }
    updateThemeIcons(theme);
  }

  function toggleTheme() {
    var current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    var newTheme = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(Config.THEME_KEY, newTheme);
    applyTheme(newTheme);
  }

  function updateThemeIcons(theme) {
    var icon = theme === 'dark' ? 'dark_mode' : 'light_mode';
    var mobileBtn = document.getElementById('themeToggleMobile');
    var desktopBtn = document.getElementById('themeToggleDesktop');
    if (mobileBtn) mobileBtn.querySelector('.material-symbols-outlined').textContent = icon;
    if (desktopBtn) desktopBtn.querySelector('.material-symbols-outlined').textContent = icon;
  }

  // ============================================
  // EXPOSE GLOBALS (for onclick handlers in HTML)
  // ============================================
  function exposeGlobals() {
    window.toggleTheme = toggleTheme;
    window.exportCarriers = exportCarriers;
    window.openAddCarrierModal = openAddCarrierModal;
    window.handleSearch = handleSearch;
    window.clearSearch = clearSearch;
    window.toggleFilterDropdown = toggleFilterDropdown;
    window.setFilter = setFilter;
    window.bulkActivate = bulkActivate;
    window.bulkFlag = bulkFlag;
    window.toggleSelectAll = toggleSelectAll;
    window.sortBy = sortBy;
    window.goToPage = goToPage;
    window.changePageSize = changePageSize;
    window.loadMore = loadMore;
    window.closeCarrierModal = closeCarrierModal;
    window.closeMobileActionSheet = closeMobileActionSheet;
    window.closeAllMenus = closeAllMenus;
  }

  return {
    init: init,
    exposeGlobals: exposeGlobals,
    toggleSelection: toggleSelection,
    toggleSelectAll: toggleSelectAll,
    viewCarrier: viewCarrier,
    viewFMCSA: viewFMCSA,
    activateCarrier: activateCarrier,
    deactivateCarrier: deactivateCarrier,
    flagCarrier: flagCarrier,
    unflagCarrier: unflagCarrier,
    refreshEnrichment: refreshEnrichment,
    showMobileActions: showMobileActions,
    closeCarrierModal: closeCarrierModal,
    toggleActionMenu: toggleActionMenu
  };
})();
