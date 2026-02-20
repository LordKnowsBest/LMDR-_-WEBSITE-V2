/* =========================================
   ADMIN DRIVERS — Render Module
   Depends on: AdminDriversConfig
   All DOM rendering and update functions
   ========================================= */
var AdminDriversRender = (function () {
    'use strict';

    /* --- Utility helpers --- */

    function stripHtml(str) {
        if (typeof str !== 'string') return '';
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function escapeHtml(str) {
        return stripHtml(str);
    }

    function getInitials(firstName, lastName) {
        return ((firstName && firstName[0] || '') + (lastName && lastName[0] || '')).toUpperCase() || '?';
    }

    function maskEmail(email) {
        if (!email) return 'N/A';
        var parts = email.split('@');
        if (!parts[1]) return email;
        return parts[0][0] + '***@' + parts[1];
    }

    function formatRelativeTime(date) {
        if (!date) return 'Never';
        var now = new Date();
        var then = new Date(date);
        var diffMs = now - then;
        var diffMins = Math.floor(diffMs / 60000);
        var diffHours = Math.floor(diffMs / 3600000);
        var diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return diffMins + 'm ago';
        if (diffHours < 24) return diffHours + 'h ago';
        if (diffDays < 7) return diffDays + 'd ago';
        return formatDate(date);
    }

    function formatDate(date) {
        if (!date) return 'N/A';
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function getProfileBarColor(percentage) {
        if (percentage >= 80) return 'bg-primary';
        if (percentage >= 50) return 'bg-amber-500';
        return 'bg-slate-400';
    }

    /* --- Badge renderers --- */

    function renderStatusBadge(status) {
        var badges = {
            active: '<span class="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">Active</span>',
            pending: '<span class="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-400">Pending</span>',
            suspended: '<span class="inline-flex items-center rounded-full bg-rose-500/10 px-2 py-0.5 text-[11px] font-medium text-rose-400">Suspended</span>',
            incomplete: '<span class="inline-flex items-center rounded-full bg-slate-500/10 px-2 py-0.5 text-[11px] font-medium text-slate-400">Incomplete</span>'
        };
        return badges[status] || badges.incomplete;
    }

    function renderVerificationBadge(status) {
        var badges = {
            verified: '<span class="inline-flex items-center gap-1 text-[11px] text-emerald-400"><span class="material-symbols-outlined text-[14px]">verified</span></span>',
            in_review: '<span class="inline-flex items-center gap-1 text-[11px] text-amber-400"><span class="material-symbols-outlined text-[14px]">pending</span></span>',
            expired: '<span class="inline-flex items-center gap-1 text-[11px] text-rose-400"><span class="material-symbols-outlined text-[14px]">warning</span></span>',
            unverified: ''
        };
        return badges[status] || '';
    }

    function renderVerificationStatus(status) {
        var statuses = {
            verified: '<div class="flex items-center gap-1.5"><span class="material-symbols-outlined text-[18px] text-emerald-500">verified</span><span class="text-sm text-slate-300">Verified</span></div>',
            in_review: '<div class="flex items-center gap-1.5"><span class="material-symbols-outlined text-[18px] text-amber-500">pending_actions</span><span class="text-sm text-slate-300">In Review</span></div>',
            expired: '<div class="flex items-center gap-1.5"><span class="material-symbols-outlined text-[18px] text-rose-500">warning</span><span class="text-sm text-slate-300">Expired</span></div>',
            unverified: '<div class="flex items-center gap-1.5"><span class="material-symbols-outlined text-[18px] text-slate-400">gpp_bad</span><span class="text-sm text-slate-300">Unverified</span></div>'
        };
        return statuses[status] || statuses.unverified;
    }

    /* --- Content renderers --- */

    function renderContent(state) {
        if (state.isMobile && state.viewMode === 'card') {
            renderCards(state);
        } else {
            renderTable(state);
        }
        document.getElementById('mobileResultCount').textContent = state.totalCount.toLocaleString();
    }

    function renderCards(state) {
        var container = document.getElementById('driversCardContainer');

        if (state.drivers.length === 0) {
            container.innerHTML =
                '<div class="flex flex-col items-center justify-center py-12">' +
                    '<span class="material-symbols-outlined text-[48px] text-text-muted mb-3">search_off</span>' +
                    '<p class="text-text-muted text-sm mb-3">No drivers found</p>' +
                    '<button onclick="clearAllFilters()" class="text-primary text-sm">Clear filters</button>' +
                '</div>';
            return;
        }

        container.innerHTML = state.drivers.map(function (driver) {
            return renderDriverCard(driver, state);
        }).join('');
    }

    function renderDriverCard(driver, state) {
        var isSelected = state.selectedIds.has(driver._id);
        return '<div class="driver-card ' + (isSelected ? 'selected' : '') + '" data-id="' + driver._id + '">' +
            '<div class="flex items-start gap-3">' +
                '<input type="checkbox" ' + (isSelected ? 'checked' : '') + ' onchange="toggleSelect(\'' + driver._id + '\')" ' +
                    'class="mt-1 h-5 w-5 rounded border-border-dark bg-surface-dark text-primary flex-shrink-0"/>' +
                '<div class="w-12 h-12 rounded-full bg-surface-darker flex items-center justify-center text-sm font-bold flex-shrink-0 ' + (driver.profileImage ? 'bg-cover bg-center' : '') + '" ' +
                    'style="' + (driver.profileImage ? "background-image: url('" + driver.profileImage + "')" : '') + '">' +
                    (!driver.profileImage ? getInitials(driver.firstName, driver.lastName) : '') +
                '</div>' +
                '<div class="flex-1 min-w-0">' +
                    '<div class="flex items-start justify-between gap-2">' +
                        '<div>' +
                            '<div class="font-semibold truncate">' + escapeHtml(driver.firstName || '') + ' ' + escapeHtml(driver.lastName || '') + '</div>' +
                            '<div class="text-xs text-text-muted truncate">' + maskEmail(driver.email) + '</div>' +
                        '</div>' +
                        '<button onclick="showMobileActions(\'' + driver._id + '\')" class="touch-target flex items-center justify-center w-8 h-8 -mr-2 text-text-muted">' +
                            '<span class="material-symbols-outlined">more_vert</span>' +
                        '</button>' +
                    '</div>' +
                    '<div class="flex flex-wrap items-center gap-2 mt-2">' +
                        renderStatusBadge(driver.status) +
                        renderVerificationBadge(driver.verificationStatus) +
                    '</div>' +
                    '<div class="flex items-center gap-2 mt-3">' +
                        '<div class="flex-1 h-1.5 rounded-full bg-surface-darker overflow-hidden">' +
                            '<div class="h-full rounded-full ' + getProfileBarColor(driver.profileCompletion) + '" style="width: ' + (driver.profileCompletion || 0) + '%;"></div>' +
                        '</div>' +
                        '<span class="text-xs text-text-muted">' + (driver.profileCompletion || 0) + '%</span>' +
                    '</div>' +
                    '<div class="flex items-center gap-3 mt-2 text-xs text-text-muted">' +
                        '<span class="flex items-center gap-1">' +
                            '<span class="material-symbols-outlined text-[14px]">location_on</span>' +
                            escapeHtml(driver.location || 'N/A') +
                        '</span>' +
                        '<span>' + formatRelativeTime(driver.lastActive) + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    }

    function renderTable(state) {
        var tbody = document.getElementById('driversTableBody');

        if (state.drivers.length === 0) {
            tbody.innerHTML =
                '<tr><td colspan="9" class="px-4 py-12 text-center">' +
                    '<div class="flex flex-col items-center gap-3">' +
                        '<span class="material-symbols-outlined text-[48px] text-text-muted">search_off</span>' +
                        '<span class="text-text-muted">No drivers found matching your criteria</span>' +
                        '<button onclick="clearAllFilters()" class="text-primary text-sm hover:underline">Clear all filters</button>' +
                    '</div>' +
                '</td></tr>';
            return;
        }

        tbody.innerHTML = state.drivers.map(function (driver, index) {
            return renderDriverRow(driver, index, state);
        }).join('');
    }

    function renderDriverRow(driver, index, state) {
        var isSelected = state.selectedIds.has(driver._id);
        var isOddRow = index % 2 === 1;

        return '<tr class="group ' + (isSelected ? 'selected' : '') + ' ' + (isOddRow ? 'bg-[#1a1f2e]' : '') + ' hover:bg-[#1f2937] transition-colors" data-id="' + driver._id + '">' +
            '<td class="px-4 py-4">' +
                '<input type="checkbox" ' + (isSelected ? 'checked' : '') + ' onchange="toggleSelect(\'' + driver._id + '\')" class="h-4 w-4 rounded border-border-dark bg-surface-dark text-primary focus:ring-primary cursor-pointer"/>' +
            '</td>' +
            '<td class="px-4 py-4">' +
                '<div class="flex items-center gap-3">' +
                    '<div class="w-10 h-10 rounded-full bg-surface-dark flex items-center justify-center text-sm font-bold ' + (driver.profileImage ? 'bg-cover bg-center' : '') + '" ' +
                        'style="' + (driver.profileImage ? "background-image: url('" + driver.profileImage + "')" : '') + '">' +
                        (!driver.profileImage ? getInitials(driver.firstName, driver.lastName) : '') +
                    '</div>' +
                    '<div>' +
                        '<div class="text-sm font-medium">' + escapeHtml(driver.firstName || '') + ' ' + escapeHtml(driver.lastName || '') + '</div>' +
                        '<div class="text-xs text-text-muted">ID: #' + (driver._id ? driver._id.substring(0, 8) : 'N/A') + '</div>' +
                    '</div>' +
                '</div>' +
            '</td>' +
            '<td class="px-4 py-4">' +
                '<div class="flex items-center gap-2 text-sm text-text-muted font-mono">' +
                    maskEmail(driver.email) +
                    '<button onclick="revealEmail(\'' + driver._id + '\')" class="text-text-muted hover:text-primary transition-colors">' +
                        '<span class="material-symbols-outlined text-[16px]">visibility</span>' +
                    '</button>' +
                '</div>' +
            '</td>' +
            '<td class="px-4 py-4">' + renderStatusBadge(driver.status) + '</td>' +
            '<td class="px-4 py-4">' + renderVerificationStatus(driver.verificationStatus) + '</td>' +
            '<td class="px-4 py-4">' +
                '<div class="flex items-center gap-3">' +
                    '<div class="h-1.5 w-24 rounded-full bg-surface-dark overflow-hidden">' +
                        '<div class="h-full rounded-full ' + getProfileBarColor(driver.profileCompletion) + '" style="width: ' + (driver.profileCompletion || 0) + '%;"></div>' +
                    '</div>' +
                    '<span class="text-xs font-medium">' + (driver.profileCompletion || 0) + '%</span>' +
                '</div>' +
            '</td>' +
            '<td class="px-4 py-4 text-sm text-text-muted">' + escapeHtml(driver.location || 'Not specified') + '</td>' +
            '<td class="px-4 py-4">' +
                '<div class="text-sm">' + formatRelativeTime(driver.lastActive) + '</div>' +
                '<div class="text-xs text-text-muted">Joined ' + formatDate(driver._createdDate) + '</div>' +
            '</td>' +
            '<td class="px-4 py-4 text-right relative">' +
                '<button onclick="toggleActionMenu(\'' + driver._id + '\')" class="action-btn rounded-lg p-2 text-text-muted hover:bg-surface-dark hover:text-primary transition-colors">' +
                    '<span class="material-symbols-outlined">more_horiz</span>' +
                '</button>' +
                '<div id="actionMenu-' + driver._id + '" class="dropdown-menu bg-surface-dark border border-border-dark rounded-lg shadow-xl overflow-hidden">' +
                    '<button onclick="viewDriver(\'' + driver._id + '\')" class="w-full px-4 py-2.5 text-left text-sm hover:bg-[#2d3a4f] transition-colors flex items-center gap-2">' +
                        '<span class="material-symbols-outlined text-[18px]">visibility</span> View Profile' +
                    '</button>' +
                    '<button onclick="messageDriver(\'' + driver._id + '\')" class="w-full px-4 py-2.5 text-left text-sm hover:bg-[#2d3a4f] transition-colors flex items-center gap-2">' +
                        '<span class="material-symbols-outlined text-[18px]">mail</span> Send Message' +
                    '</button>' +
                    '<button onclick="verifyDriver(\'' + driver._id + '\')" class="w-full px-4 py-2.5 text-left text-sm hover:bg-[#2d3a4f] transition-colors flex items-center gap-2 text-emerald-400">' +
                        '<span class="material-symbols-outlined text-[18px]">verified</span> Mark Verified' +
                    '</button>' +
                    '<div class="border-t border-border-dark"></div>' +
                    '<button onclick="suspendDriver(\'' + driver._id + '\')" class="w-full px-4 py-2.5 text-left text-sm hover:bg-[#2d3a4f] transition-colors flex items-center gap-2 text-rose-400">' +
                        '<span class="material-symbols-outlined text-[18px]">block</span> Suspend Account' +
                    '</button>' +
                '</div>' +
            '</td>' +
        '</tr>';
    }

    /* --- Loading state --- */

    function showLoadingState(isMobile) {
        if (isMobile) {
            document.getElementById('driversCardContainer').innerHTML =
                '<div class="flex flex-col items-center justify-center py-12">' +
                    '<div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>' +
                    '<span class="text-text-muted text-sm mt-3">Loading...</span>' +
                '</div>';
        } else {
            document.getElementById('driversTableBody').innerHTML =
                '<tr><td colspan="9" class="px-4 py-8 text-center">' +
                    '<div class="flex flex-col items-center gap-3">' +
                        '<div class="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>' +
                        '<span class="text-text-muted text-sm">Loading drivers...</span>' +
                    '</div>' +
                '</td></tr>';
        }
    }

    /* --- Stats update --- */

    function updateStats(stats) {
        // Desktop stats
        document.getElementById('statTotalDrivers').textContent = stats.total ? stats.total.toLocaleString() : '0';
        document.getElementById('statTotalDriversTrend').textContent = '+' + (stats.newThisWeek || 0) + ' this week';
        document.getElementById('statActiveDrivers').textContent = stats.active ? stats.active.toLocaleString() : '0';
        document.getElementById('statActiveDriversPercent').textContent = (stats.activePercent || 0) + '% of total';
        document.getElementById('statPendingDrivers').textContent = stats.pending ? stats.pending.toLocaleString() : '0';
        document.getElementById('statExpiredDocs').textContent = stats.expiredDocs ? stats.expiredDocs.toLocaleString() : '0';

        // Mobile stats
        document.getElementById('statTotalDriversMobile').textContent = stats.total ? stats.total.toLocaleString() : '0';
        document.getElementById('statTotalDriversTrendMobile').textContent = '+' + (stats.newThisWeek || 0);
        document.getElementById('statActiveDriversMobile').textContent = stats.active ? stats.active.toLocaleString() : '0';
        document.getElementById('statActiveDriversPercentMobile').textContent = (stats.activePercent || 0) + '%';
        document.getElementById('statPendingDriversMobile').textContent = stats.pending ? stats.pending.toLocaleString() : '0';
        document.getElementById('statExpiredDocsMobile').textContent = stats.expiredDocs ? stats.expiredDocs.toLocaleString() : '0';
    }

    /* --- Pagination update --- */

    function updatePagination(state) {
        var from = state.totalCount === 0 ? 0 : (state.currentPage - 1) * state.pageSize + 1;
        var to = Math.min(state.currentPage * state.pageSize, state.totalCount);

        document.getElementById('paginationFrom').textContent = from;
        document.getElementById('paginationTo').textContent = to;
        document.getElementById('paginationTotal').textContent = state.totalCount;

        document.getElementById('prevPageBtn').disabled = state.currentPage === 1;
        document.getElementById('nextPageBtn').disabled = to >= state.totalCount;

        document.getElementById('loadMoreBtn').classList.toggle('hidden', to >= state.totalCount);
    }

    /* --- Selection UI --- */

    function updateSelectionUI(selectedCount) {
        var bulkBar = document.getElementById('bulkActionsBar');
        if (selectedCount > 0) {
            bulkBar.classList.remove('hidden');
            document.getElementById('selectedCount').textContent = selectedCount;
        } else {
            bulkBar.classList.add('hidden');
        }
    }

    /* --- View mode --- */

    function setViewModeUI(mode) {
        document.getElementById('viewCardBtn').className = mode === 'card'
            ? 'flex items-center justify-center w-9 h-8 rounded-md bg-primary text-white'
            : 'flex items-center justify-center w-9 h-8 rounded-md text-text-muted';
        document.getElementById('viewTableBtn').className = mode === 'table'
            ? 'flex items-center justify-center w-9 h-8 rounded-md bg-primary text-white'
            : 'flex items-center justify-center w-9 h-8 rounded-md text-text-muted';
    }

    /* --- Filter UI --- */

    function updateClearFiltersVisibility(filters) {
        var hasFilters = filters.status !== 'all' ||
            filters.verification !== 'all' ||
            filters.tier !== 'all' ||
            filters.search !== '';
        document.getElementById('clearFiltersBtn').classList.toggle('hidden', !hasFilters);
        document.getElementById('clearFiltersBtn').classList.toggle('flex', hasFilters);
    }

    /* --- Driver detail modal --- */

    function showDriverDetail(driver) {
        var content = document.getElementById('driverDetailContent');
        content.innerHTML =
            '<div class="sticky top-0 bg-surface-darker border-b border-border-dark px-4 md:px-6 py-4 flex items-center justify-between safe-top">' +
                '<h2 class="text-lg font-bold">Driver Profile</h2>' +
                '<button onclick="closeDriverModal()" class="touch-target flex items-center justify-center w-10 h-10 hover:bg-surface-dark rounded-lg transition-colors">' +
                    '<span class="material-symbols-outlined">close</span>' +
                '</button>' +
            '</div>' +
            '<div class="p-4 md:p-6">' +
                '<div class="flex items-center gap-4 mb-6">' +
                    '<div class="w-16 h-16 rounded-full bg-surface-dark flex items-center justify-center text-xl font-bold flex-shrink-0 ' + (driver.profileImage ? 'bg-cover bg-center' : '') + '" ' +
                        'style="' + (driver.profileImage ? "background-image: url('" + driver.profileImage + "')" : '') + '">' +
                        (!driver.profileImage ? getInitials(driver.firstName, driver.lastName) : '') +
                    '</div>' +
                    '<div class="min-w-0">' +
                        '<h3 class="text-xl font-bold truncate">' + escapeHtml(driver.firstName || '') + ' ' + escapeHtml(driver.lastName || '') + '</h3>' +
                        '<p class="text-text-muted truncate">' + escapeHtml(driver.email || '') + '</p>' +
                    '</div>' +
                '</div>' +
                '<div class="grid grid-cols-2 gap-3 mb-6">' +
                    '<div class="bg-surface-dark rounded-lg p-3">' +
                        '<div class="text-[10px] text-text-muted uppercase mb-1">Status</div>' +
                        renderStatusBadge(driver.status) +
                    '</div>' +
                    '<div class="bg-surface-dark rounded-lg p-3">' +
                        '<div class="text-[10px] text-text-muted uppercase mb-1">Verification</div>' +
                        renderVerificationStatus(driver.verificationStatus) +
                    '</div>' +
                    '<div class="bg-surface-dark rounded-lg p-3">' +
                        '<div class="text-[10px] text-text-muted uppercase mb-1">Profile</div>' +
                        '<div class="text-lg font-bold">' + (driver.profileCompletion || 0) + '%</div>' +
                    '</div>' +
                    '<div class="bg-surface-dark rounded-lg p-3">' +
                        '<div class="text-[10px] text-text-muted uppercase mb-1">Location</div>' +
                        '<div class="text-sm truncate">' + escapeHtml(driver.location || 'Not specified') + '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="space-y-3">' +
                    '<h4 class="font-bold text-xs uppercase text-text-muted">Quick Actions</h4>' +
                    '<div class="grid grid-cols-2 gap-3">' +
                        '<button onclick="messageDriver(\'' + driver._id + '\')" class="touch-active flex items-center justify-center gap-2 py-3 bg-surface-dark rounded-lg">' +
                            '<span class="material-symbols-outlined text-[20px]">mail</span>' +
                            '<span class="text-sm">Message</span>' +
                        '</button>' +
                        '<button onclick="verifyDriver(\'' + driver._id + '\')" class="touch-active flex items-center justify-center gap-2 py-3 bg-emerald-500/20 text-emerald-400 rounded-lg">' +
                            '<span class="material-symbols-outlined text-[20px]">verified</span>' +
                            '<span class="text-sm">Verify</span>' +
                        '</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
    }

    /* --- Mobile action sheet --- */

    function showMobileActions(driver) {
        var content = document.getElementById('mobileActionSheetContent');
        content.innerHTML =
            '<div class="text-center mb-4">' +
                '<div class="font-semibold">' + escapeHtml(driver.firstName) + ' ' + escapeHtml(driver.lastName) + '</div>' +
                '<div class="text-sm text-text-muted">' + maskEmail(driver.email) + '</div>' +
            '</div>' +
            '<div class="space-y-2">' +
                '<button onclick="viewDriver(\'' + driver._id + '\'); closeMobileActionSheet();" class="touch-active w-full flex items-center gap-3 px-4 py-3 bg-surface-darker rounded-lg">' +
                    '<span class="material-symbols-outlined">visibility</span>' +
                    '<span>View Profile</span>' +
                '</button>' +
                '<button onclick="messageDriver(\'' + driver._id + '\'); closeMobileActionSheet();" class="touch-active w-full flex items-center gap-3 px-4 py-3 bg-surface-darker rounded-lg">' +
                    '<span class="material-symbols-outlined">mail</span>' +
                    '<span>Send Message</span>' +
                '</button>' +
                '<button onclick="verifyDriver(\'' + driver._id + '\'); closeMobileActionSheet();" class="touch-active w-full flex items-center gap-3 px-4 py-3 bg-emerald-500/10 text-emerald-400 rounded-lg">' +
                    '<span class="material-symbols-outlined">verified</span>' +
                    '<span>Mark Verified</span>' +
                '</button>' +
                '<button onclick="suspendDriver(\'' + driver._id + '\'); closeMobileActionSheet();" class="touch-active w-full flex items-center gap-3 px-4 py-3 bg-rose-500/10 text-rose-400 rounded-lg">' +
                    '<span class="material-symbols-outlined">block</span>' +
                    '<span>Suspend Account</span>' +
                '</button>' +
            '</div>';

        document.getElementById('mobileActionSheet').classList.remove('hidden');
    }

    /* --- Toast notifications --- */

    function showToast(message, type) {
        type = type || 'info';
        var container = document.getElementById('toastContainer');
        var colors = {
            success: 'bg-emerald-500',
            error: 'bg-rose-500',
            info: 'bg-primary',
            warning: 'bg-amber-500'
        };

        var icon = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';
        var toast = document.createElement('div');
        toast.className = 'toast ' + colors[type] + ' text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2';
        toast.innerHTML =
            '<span class="material-symbols-outlined text-[20px]">' + icon + '</span>' +
            '<span class="text-sm font-medium flex-1">' + escapeHtml(message) + '</span>' +
            '<button onclick="this.parentElement.remove()" class="ml-2">' +
                '<span class="material-symbols-outlined text-[18px]">close</span>' +
            '</button>';

        container.appendChild(toast);

        setTimeout(function () {
            if (toast.parentElement) {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(100%)';
                toast.style.transition = 'all 0.3s ease-out';
                setTimeout(function () { toast.remove(); }, 300);
            }
        }, 4000);
    }

    /* --- Theme icons --- */

    function updateThemeIcons(theme) {
        var icon = theme === 'dark' ? 'dark_mode' : 'light_mode';
        var mobileBtn = document.getElementById('themeToggleMobile');
        var desktopBtn = document.getElementById('themeToggleDesktop');
        if (mobileBtn) mobileBtn.querySelector('.material-symbols-outlined').textContent = icon;
        if (desktopBtn) desktopBtn.querySelector('.material-symbols-outlined').textContent = icon;
    }

    /* --- Sort icons --- */

    function updateSortIcons(sortField, sortDirection) {
        document.querySelectorAll('[id^="sortIcon"]').forEach(function (icon) {
            icon.textContent = 'unfold_more';
        });
        var fieldName = sortField.charAt(0).toUpperCase() + sortField.slice(1);
        var icon = document.getElementById('sortIcon' + fieldName);
        if (icon) {
            icon.textContent = sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward';
        }
    }

    return {
        escapeHtml: escapeHtml,
        getInitials: getInitials,
        maskEmail: maskEmail,
        formatRelativeTime: formatRelativeTime,
        formatDate: formatDate,
        renderContent: renderContent,
        renderStatusBadge: renderStatusBadge,
        renderVerificationBadge: renderVerificationBadge,
        renderVerificationStatus: renderVerificationStatus,
        showLoadingState: showLoadingState,
        updateStats: updateStats,
        updatePagination: updatePagination,
        updateSelectionUI: updateSelectionUI,
        setViewModeUI: setViewModeUI,
        updateClearFiltersVisibility: updateClearFiltersVisibility,
        showDriverDetail: showDriverDetail,
        showMobileActions: showMobileActions,
        showToast: showToast,
        updateThemeIcons: updateThemeIcons,
        updateSortIcons: updateSortIcons
    };
})();
