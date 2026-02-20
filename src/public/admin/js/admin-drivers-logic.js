/* =========================================
   ADMIN DRIVERS — Logic Module
   Depends on: AdminDriversConfig, AdminDriversBridge, AdminDriversRender
   State management, event handlers, user actions
   ========================================= */
var AdminDriversLogic = (function () {
    'use strict';

    var C = AdminDriversConfig;
    var B = AdminDriversBridge;
    var R = AdminDriversRender;

    /* --- State --- */

    var state = {
        drivers: [],
        selectedIds: new Set(),
        currentPage: 1,
        pageSize: C.DEFAULT_PAGE_SIZE,
        totalCount: 0,
        sortField: C.DEFAULT_SORT_FIELD,
        sortDirection: C.DEFAULT_SORT_DIRECTION,
        filters: Object.assign({}, C.DEFAULT_FILTERS),
        isLoading: false,
        viewMode: 'card',
        isMobile: window.innerWidth < 768
    };

    /* --- Theme management --- */

    function initTheme() {
        var saved = localStorage.getItem(C.THEME_KEY);
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
        R.updateThemeIcons(theme);
    }

    function toggleTheme() {
        var current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        var newTheme = current === 'dark' ? 'light' : 'dark';
        localStorage.setItem(C.THEME_KEY, newTheme);
        applyTheme(newTheme);
    }

    /* --- Data actions --- */

    function refreshData() {
        state.isLoading = true;
        R.showLoadingState(state.isMobile);
        B.getDrivers(state.filters, state.currentPage, state.pageSize, state.sortField, state.sortDirection);
        B.getStats();
    }

    function handleDriversLoaded(data) {
        var payload = data.payload;
        state.drivers = payload.drivers || [];
        state.totalCount = payload.totalCount || 0;
        state.currentPage = payload.currentPage || 1;
        state.isLoading = false;
        R.renderContent(state);
        R.updatePagination(state);
    }

    function downloadCSV(payload) {
        var blob = new Blob([payload.csv || payload.data || ''], { type: 'text/csv' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = payload.filename || 'drivers_export.csv';
        a.click();
        URL.revokeObjectURL(url);
        R.showToast('Export downloaded', 'success');
    }

    /* --- View mode --- */

    function setViewMode(mode) {
        state.viewMode = mode;
        R.setViewModeUI(mode);
        R.renderContent(state);
    }

    /* --- Search & filters --- */

    function handleSearch() {
        var searchValue = document.getElementById('searchInput').value;
        state.filters.search = searchValue;
        state.currentPage = 1;

        document.getElementById('clearSearchBtn').classList.toggle('hidden', !searchValue);
        R.updateClearFiltersVisibility(state.filters);

        clearTimeout(window._adminDriversSearchTimeout);
        window._adminDriversSearchTimeout = setTimeout(function () {
            refreshData();
        }, 300);
    }

    function clearSearch() {
        document.getElementById('searchInput').value = '';
        state.filters.search = '';
        document.getElementById('clearSearchBtn').classList.add('hidden');
        R.updateClearFiltersVisibility(state.filters);
        refreshData();
    }

    function toggleFilter(filterName) {
        var dropdown = document.getElementById(filterName + 'FilterDropdown');
        var isOpen = dropdown.classList.contains('open');

        document.querySelectorAll('.filter-dropdown').forEach(function (d) { d.classList.remove('open'); });
        document.getElementById('mobileOverlay').classList.remove('open');

        if (!isOpen) {
            dropdown.classList.add('open');
            if (state.isMobile) {
                document.getElementById('mobileOverlay').classList.add('open');
            }
        }
    }

    function setFilter(filterName, value, label) {
        state.filters[filterName] = value;
        document.getElementById(filterName + 'FilterLabel').textContent = label;
        document.getElementById(filterName + 'FilterDropdown').classList.remove('open');
        document.getElementById('mobileOverlay').classList.remove('open');
        state.currentPage = 1;
        R.updateClearFiltersVisibility(state.filters);
        refreshData();
    }

    function clearAllFilters() {
        state.filters = Object.assign({}, C.DEFAULT_FILTERS);
        document.getElementById('searchInput').value = '';
        document.getElementById('clearSearchBtn').classList.add('hidden');
        document.getElementById('statusFilterLabel').textContent = 'All';
        document.getElementById('verificationFilterLabel').textContent = 'All';
        document.getElementById('tierFilterLabel').textContent = 'All';
        state.currentPage = 1;
        R.updateClearFiltersVisibility(state.filters);
        refreshData();
    }

    /* --- Sorting --- */

    function sortBy(field) {
        if (state.sortField === field) {
            state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            state.sortField = field;
            state.sortDirection = 'desc';
        }
        R.updateSortIcons(state.sortField, state.sortDirection);
        refreshData();
    }

    /* --- Selection --- */

    function toggleSelect(id) {
        if (state.selectedIds.has(id)) {
            state.selectedIds.delete(id);
        } else {
            state.selectedIds.add(id);
        }
        R.updateSelectionUI(state.selectedIds.size);

        var element = document.querySelector('[data-id="' + id + '"]');
        if (element) {
            element.classList.toggle('selected', state.selectedIds.has(id));
        }
    }

    function toggleSelectAll() {
        var checkbox = document.getElementById('selectAllCheckbox');
        if (checkbox.checked) {
            state.drivers.forEach(function (d) { state.selectedIds.add(d._id); });
        } else {
            state.selectedIds.clear();
        }
        R.renderContent(state);
        R.updateSelectionUI(state.selectedIds.size);
    }

    function clearSelection() {
        state.selectedIds.clear();
        var checkbox = document.getElementById('selectAllCheckbox');
        if (checkbox) checkbox.checked = false;
        R.renderContent(state);
        R.updateSelectionUI(state.selectedIds.size);
    }

    /* --- Pagination --- */

    function goToPage(direction) {
        if (direction === 'prev' && state.currentPage > 1) {
            state.currentPage--;
        } else if (direction === 'next') {
            state.currentPage++;
        }
        refreshData();
    }

    function loadMore() {
        state.currentPage++;
        refreshData();
    }

    function changePageSize() {
        state.pageSize = parseInt(document.getElementById('pageSizeSelect').value);
        state.currentPage = 1;
        refreshData();
    }

    /* --- Action menus --- */

    function toggleActionMenu(id) {
        var menu = document.getElementById('actionMenu-' + id);
        document.querySelectorAll('.dropdown-menu').forEach(function (d) {
            if (d !== menu) d.classList.remove('open');
        });
        menu.classList.toggle('open');
    }

    function showMobileActions(driverId) {
        var driver = state.drivers.find(function (d) { return d._id === driverId; });
        if (!driver) return;
        R.showMobileActions(driver);
    }

    function closeMobileActionSheet() {
        document.getElementById('mobileActionSheet').classList.add('hidden');
    }

    function closeAllMenus() {
        document.querySelectorAll('.dropdown-menu').forEach(function (d) { d.classList.remove('open'); });
        document.querySelectorAll('.filter-dropdown').forEach(function (d) { d.classList.remove('open'); });
        document.getElementById('mobileOverlay').classList.remove('open');
    }

    /* --- Driver actions --- */

    function viewDriver(id) {
        B.getDriverDetail(id);
        document.getElementById('driverDetailModal').classList.remove('hidden');
        document.getElementById('driverDetailContent').innerHTML =
            '<div class="flex items-center justify-center h-64">' +
                '<div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>' +
            '</div>';
        closeAllMenus();
    }

    function closeDriverModal() {
        document.getElementById('driverDetailModal').classList.add('hidden');
    }

    function messageDriver(id) {
        B.openMessageModal(id);
        closeAllMenus();
    }

    function verifyDriver(id) {
        if (confirm('Mark this driver as verified?')) {
            B.verifyDriver(id);
        }
        closeAllMenus();
    }

    function suspendDriver(id) {
        if (confirm('Suspend this driver account?')) {
            B.suspendDriver(id);
        }
        closeAllMenus();
    }

    function bulkAction(action) {
        var ids = Array.from(state.selectedIds);
        if (ids.length === 0) return;

        if (confirm(action.charAt(0).toUpperCase() + action.slice(1) + ' ' + ids.length + ' driver(s)?')) {
            B.bulkAction('bulk' + action.charAt(0).toUpperCase() + action.slice(1), ids);
        }
    }

    function exportDrivers() {
        B.exportDrivers(state.filters);
        R.showToast('Preparing export...', 'info');
    }

    function openAddDriverModal() {
        B.openAddDriverModal();
    }

    function revealEmail(id) {
        B.revealEmail(id);
    }

    /* --- Resize handler --- */

    function handleResize() {
        var wasMobile = state.isMobile;
        state.isMobile = window.innerWidth < 768;
        if (wasMobile !== state.isMobile) {
            R.renderContent(state);
        }
    }

    /* --- Expose globals for onclick handlers in HTML --- */

    function exposeGlobals() {
        window.toggleTheme = toggleTheme;
        window.refreshData = refreshData;
        window.setViewMode = setViewMode;
        window.handleSearch = handleSearch;
        window.clearSearch = clearSearch;
        window.toggleFilter = toggleFilter;
        window.setFilter = setFilter;
        window.clearAllFilters = clearAllFilters;
        window.sortBy = sortBy;
        window.toggleSelect = toggleSelect;
        window.toggleSelectAll = toggleSelectAll;
        window.clearSelection = clearSelection;
        window.goToPage = goToPage;
        window.loadMore = loadMore;
        window.changePageSize = changePageSize;
        window.toggleActionMenu = toggleActionMenu;
        window.showMobileActions = showMobileActions;
        window.closeMobileActionSheet = closeMobileActionSheet;
        window.closeAllMenus = closeAllMenus;
        window.viewDriver = viewDriver;
        window.closeDriverModal = closeDriverModal;
        window.messageDriver = messageDriver;
        window.verifyDriver = verifyDriver;
        window.suspendDriver = suspendDriver;
        window.bulkAction = bulkAction;
        window.exportDrivers = exportDrivers;
        window.openAddDriverModal = openAddDriverModal;
        window.revealEmail = revealEmail;
    }

    /* --- Initialization --- */

    function init() {
        exposeGlobals();
        initTheme();

        window.addEventListener('resize', handleResize);

        // Close dropdowns when clicking outside
        document.addEventListener('click', function (e) {
            if (!e.target.closest('.filter-chip') && !e.target.closest('.filter-dropdown')) {
                document.querySelectorAll('.filter-dropdown').forEach(function (d) { d.classList.remove('open'); });
                document.getElementById('mobileOverlay').classList.remove('open');
            }
            if (!e.target.closest('.action-btn') && !e.target.closest('.dropdown-menu')) {
                document.querySelectorAll('.dropdown-menu').forEach(function (d) { d.classList.remove('open'); });
            }
        });

        B.listen({
            'init': function () {
                refreshData();
            },
            'pong': function () {
                B.setConnectionVerified();
                console.log('CONNECTION: Health check successful');
            },
            'driversLoaded': handleDriversLoaded,
            'driverDetail': function (data) {
                R.showDriverDetail(data.payload);
            },
            'statsLoaded': function (data) {
                R.updateStats(data.payload);
            },
            'actionSuccess': function (data) {
                R.showToast(data.message || 'Action completed successfully', 'success');
                refreshData();
            },
            'actionError': function (data) {
                R.showToast(data.message || 'An error occurred', 'error');
            },
            'emailRevealed': function (data) {
                if (data.payload && data.payload.driverId && data.payload.email) {
                    var emailEl = document.querySelector('[data-email-driver="' + data.payload.driverId + '"]');
                    if (emailEl) {
                        emailEl.textContent = data.payload.email;
                        emailEl.classList.remove('blur-sm');
                    }
                    R.showToast('Email revealed', 'success');
                }
            },
            'exportReady': function (data) {
                if (data.payload) {
                    downloadCSV(data.payload);
                }
            }
        });

        handleResize();
        B.verifyConnection();
        refreshData();
        B.getStats();
    }

    return {
        init: init
    };
})();
