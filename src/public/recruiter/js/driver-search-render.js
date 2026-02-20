/* =========================================
   RECRUITER DRIVER SEARCH — Render Module
   Depends on: DriverSearchConfig, DriverSearchBridge
   DOM rendering functions
   ========================================= */
var DriverSearchRender = (function () {
  'use strict';

  /* --- Helpers --- */
  function getInitials(name) {
    if (!name) return '??';
    var parts = name.split(' ');
    return (parts[0] ? parts[0][0] : '') + (parts[1] ? parts[1][0] : '');
  }

  function getScoreClass(score) {
    if (score >= 85) return 'score-excellent';
    if (score >= 70) return 'score-good';
    if (score >= 50) return 'score-fair';
    return 'score-poor';
  }

  /* --- Toast --- */
  function showToast(message) {
    alert(message);
  }

  /* --- Loading / Empty / Error states --- */
  function showLoading(show) {
    var el = document.getElementById('loadingState');
    if (show) el.classList.remove('hidden');
    else el.classList.add('hidden');
  }

  function showEmpty() {
    document.getElementById('emptyState').classList.remove('hidden');
  }

  function hideEmpty() {
    document.getElementById('emptyState').classList.add('hidden');
  }

  function showError(message) {
    document.getElementById('resultsCount').innerHTML =
      '<span class="text-red-600"><i class="fa-solid fa-exclamation-circle mr-1"></i>' + message + '</span>';
  }

  function updateResultsCount(total) {
    document.getElementById('resultsCount').textContent =
      total + ' driver' + (total !== 1 ? 's' : '') + ' found';
  }

  /* --- Quota display --- */
  function updateQuotaDisplay(status) {
    if (!status) return status;
    var used = status.used || 0;
    var limit = status.limit || 0;
    var percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;

    var quotaText = document.getElementById('quotaText');
    var quotaBar = document.getElementById('quotaBar');
    var upgradeBtn = document.getElementById('upgradeBtn');

    quotaText.textContent = limit > 0 ? used + ' / ' + limit : 'Unlimited';
    quotaBar.style.width = percentage + '%';
    quotaBar.setAttribute('data-percent', String(Math.round(percentage)));

    quotaBar.className = 'h-full rounded-full transition-all ' +
      (percentage >= 90 ? 'quota-red' : percentage >= 70 ? 'quota-yellow' : 'quota-green');

    if (status.tier !== 'enterprise' && percentage >= 50) {
      upgradeBtn.classList.remove('hidden');
    } else {
      upgradeBtn.classList.add('hidden');
    }

    return status;
  }

  /* --- Driver card rendering --- */
  function renderDrivers(drivers, viewProfileFn, saveDriverFn) {
    var resultsList = document.getElementById('resultsList');
    var template = document.getElementById('driverCardTemplate');

    // Remove existing cards (keep empty/loading states)
    var existing = document.querySelectorAll('.driver-card');
    for (var i = 0; i < existing.length; i++) existing[i].remove();

    if (drivers.length === 0) {
      showEmpty();
      return;
    }

    hideEmpty();

    drivers.forEach(function (driver) {
      var card = template.content.cloneNode(true);
      var cardEl = card.querySelector('.driver-card');

      cardEl.dataset.driverId = driver.id;
      cardEl.querySelector('.driver-initials').textContent = getInitials(driver.name);
      cardEl.querySelector('.driver-name').textContent = driver.name;
      cardEl.querySelector('.driver-location span').textContent = driver.location;
      cardEl.querySelector('.driver-experience').textContent = driver.experienceYears + ' years exp';

      var scoreEl = cardEl.querySelector('.driver-score');
      scoreEl.textContent = driver.matchScore + '%';
      scoreEl.className = 'driver-score text-2xl font-black ' + getScoreClass(driver.matchScore);

      cardEl.querySelector('.driver-cdl').innerHTML = driver.cdlClass
        ? '<i class="fa-solid fa-id-card"></i> Class ' + driver.cdlClass
        : '<i class="fa-solid fa-id-card"></i> CDL';

      var endorsementsEl = cardEl.querySelector('.driver-endorsements');
      if (driver.endorsements && driver.endorsements.length > 0) {
        endorsementsEl.innerHTML = driver.endorsements.map(function (e) {
          return '<span class="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium">' + e + '</span>';
        }).join('');
      }

      var sourceBadge = cardEl.querySelector('.driver-source-badge');
      if (driver.source && driver.source !== 'driver_profiles') {
        sourceBadge.textContent = driver.sourceLabel || driver.source;
        sourceBadge.classList.add(DriverSearchConfig.SOURCE_CLASS_MAP[driver.source] || 'source-legacy-lead');
        sourceBadge.style.display = '';
      }

      cardEl.querySelector('.driver-rationale').textContent = driver.rationale || 'Good match based on your criteria.';

      cardEl.querySelector('.view-profile-btn').addEventListener('click', function () {
        viewProfileFn(driver.id, driver.matchScore);
      });
      var saveBtn = cardEl.querySelector('.save-driver-btn');
      saveBtn.addEventListener('click', function () {
        saveDriverFn(driver.id, saveBtn);
      });

      resultsList.appendChild(card);
    });
  }

  /* --- Profile modal --- */
  function renderProfile(driver) {
    var profileContent = document.getElementById('profileContent');
    profileContent.innerHTML =
      '<div>' +
      '<div class="flex items-center gap-4 mb-4">' +
        '<div class="w-14 h-14 rounded-full bg-gradient-to-br from-lmdr-blue to-blue-700 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">' +
          getInitials(driver.name) +
        '</div>' +
        '<div class="flex-1 min-w-0">' +
          '<div class="flex items-center justify-between">' +
            '<div>' +
              '<h2 class="text-lg font-black text-slate-800 leading-tight">' + driver.name + '</h2>' +
              '<p class="text-xs text-slate-500">' +
                'Class ' + driver.cdlClass + ' CDL' +
                (driver.endorsements && driver.endorsements.length > 0 ? ' | ' + driver.endorsements.join(', ') : '') +
                ' <span class="mx-1">&middot;</span> ' +
                '<i class="fa-solid fa-location-dot"></i> ' + driver.location +
                ' <span class="mx-1">&middot;</span> ' +
                driver.experienceYears + 'yr exp' +
              '</p>' +
            '</div>' +
            '<div class="text-right flex-shrink-0 ml-2">' +
              '<div class="text-2xl font-black ' + getScoreClass(driver.matchScore) + '">' + driver.matchScore + '%</div>' +
              '<div class="text-[10px] text-slate-400">Match</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">' +
        '<h3 class="font-bold text-blue-800 text-xs mb-1.5"><i class="fa-solid fa-chart-line mr-1"></i>Why This Match</h3>' +
        '<div class="space-y-1">' +
          (driver.matchReasons || []).map(function (reason) {
            return '<div class="flex items-start gap-1.5">' +
              '<i class="fa-solid ' + (reason.positive ? 'fa-check text-green-600' : 'fa-exclamation-triangle text-amber-500') + ' text-[10px] mt-0.5"></i>' +
              '<span class="text-xs text-slate-700">' + reason.text + '</span>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>' +
      '<div class="grid grid-cols-2 gap-3 mb-3">' +
        '<div class="bg-white border border-slate-200 rounded-lg p-3">' +
          '<h3 class="font-bold text-slate-800 text-xs mb-2"><i class="fa-solid fa-id-card mr-1 text-lmdr-blue"></i>Qualifications</h3>' +
          '<div class="space-y-1.5 text-xs">' +
            '<div class="flex justify-between"><span class="text-slate-500">CDL</span><span class="font-medium">Class ' + driver.cdlClass + '</span></div>' +
            '<div class="flex justify-between"><span class="text-slate-500">Endorse.</span><span class="font-medium">' + (driver.endorsements ? driver.endorsements.join(', ') : 'None') + '</span></div>' +
            '<div class="flex justify-between"><span class="text-slate-500">MVR</span><span class="font-medium text-green-600">' + (driver.mvrStatus || 'Clean') + '</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="bg-white border border-slate-200 rounded-lg p-3">' +
          '<h3 class="font-bold text-slate-800 text-xs mb-2"><i class="fa-solid fa-truck mr-1 text-lmdr-blue"></i>Equipment</h3>' +
          '<div class="flex flex-wrap gap-1">' +
            ((driver.equipment || []).map(function (eq) {
              return '<span class="px-2 py-0.5 bg-slate-100 rounded text-xs font-medium text-slate-700">' + eq + '</span>';
            }).join('') || '<span class="text-xs text-slate-400">Not specified</span>') +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div class="grid grid-cols-2 gap-3">' +
        '<div class="bg-white border border-slate-200 rounded-lg p-3">' +
          '<h3 class="font-bold text-slate-800 text-xs mb-2"><i class="fa-solid fa-sliders mr-1 text-lmdr-blue"></i>Preferences</h3>' +
          '<div class="space-y-1.5 text-xs">' +
            '<div class="flex justify-between"><span class="text-slate-500">Route</span><span class="font-medium">' + (driver.routePreference || 'Flexible') + '</span></div>' +
            '<div class="flex justify-between"><span class="text-slate-500">Home</span><span class="font-medium">' + (driver.homeTime || 'Weekly') + '</span></div>' +
            '<div class="flex justify-between"><span class="text-slate-500">Pay</span><span class="font-medium">' + (driver.salaryRange || 'Negotiable') + '</span></div>' +
          '</div>' +
        '</div>' +
        '<div class="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">' +
          '<div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">' +
            '<i class="fa-solid fa-calendar-check text-green-600 text-xs"></i>' +
          '</div>' +
          '<div>' +
            '<h3 class="font-bold text-green-800 text-xs leading-tight">' + (driver.availability || 'Immediate') + '</h3>' +
            '<p class="text-[10px] text-green-700">Start ' + (driver.availabilityDate || 'ASAP') + '</p>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '</div>';

    document.getElementById('messageDriverName').textContent = driver.name;
  }

  /* --- Pagination --- */
  function renderPagination(currentPage, totalResults, goToPageFn) {
    var totalPages = Math.ceil(totalResults / DriverSearchConfig.PAGE_SIZE);
    var container = document.getElementById('paginationContainer');
    var nav = document.getElementById('paginationNav');

    if (totalPages <= 1) {
      container.classList.add('hidden');
      return;
    }

    container.classList.remove('hidden');
    nav.innerHTML = '';

    var btnClass = 'min-w-[36px] h-9 px-2 flex items-center justify-center rounded-lg text-sm font-medium transition-colors';
    var activeClass = 'bg-blue-600 text-white';
    var inactiveClass = 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 cursor-pointer';
    var disabledClass = 'bg-white border border-slate-200 text-slate-300 cursor-not-allowed';

    // Previous
    var prevBtn = document.createElement('button');
    prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left text-xs"></i>';
    prevBtn.className = btnClass + ' ' + (currentPage === 0 ? disabledClass : inactiveClass);
    prevBtn.disabled = currentPage === 0;
    prevBtn.addEventListener('click', function () { if (currentPage > 0) goToPageFn(currentPage - 1); });
    nav.appendChild(prevBtn);

    // Page numbers
    var pages = getPageRange(currentPage, totalPages, 7);
    pages.forEach(function (p) {
      if (p === '...') {
        var ellipsis = document.createElement('span');
        ellipsis.textContent = '...';
        ellipsis.className = 'min-w-[36px] h-9 flex items-center justify-center text-sm text-slate-400';
        nav.appendChild(ellipsis);
      } else {
        var btn = document.createElement('button');
        btn.textContent = p + 1;
        btn.className = btnClass + ' ' + (p === currentPage ? activeClass : inactiveClass);
        btn.addEventListener('click', (function (page) {
          return function () { goToPageFn(page); };
        })(p));
        nav.appendChild(btn);
      }
    });

    // Next
    var nextBtn = document.createElement('button');
    nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right text-xs"></i>';
    nextBtn.className = btnClass + ' ' + (currentPage >= totalPages - 1 ? disabledClass : inactiveClass);
    nextBtn.disabled = currentPage >= totalPages - 1;
    nextBtn.addEventListener('click', function () { if (currentPage < totalPages - 1) goToPageFn(currentPage + 1); });
    nav.appendChild(nextBtn);
  }

  function getPageRange(current, total, maxButtons) {
    if (total <= maxButtons) {
      var arr = [];
      for (var i = 0; i < total; i++) arr.push(i);
      return arr;
    }
    var pages = [0];
    var start = Math.max(1, current - 1);
    var end = Math.min(total - 2, current + 1);
    if (current <= 2) { start = 1; end = Math.min(total - 2, 4); }
    if (current >= total - 3) { start = Math.max(1, total - 5); end = total - 2; }
    if (start > 1) pages.push('...');
    for (var j = start; j <= end; j++) pages.push(j);
    if (end < total - 2) pages.push('...');
    pages.push(total - 1);
    return pages;
  }

  /* --- Saved searches rendering --- */
  function renderSavedSearches(searches) {
    var panel = document.getElementById('savedSearchesPanel');
    var list = document.getElementById('savedSearchesList');
    var count = document.getElementById('savedSearchCount');

    count.textContent = searches.length;
    if (searches.length === 0) {
      panel.classList.add('hidden');
      return;
    }

    panel.classList.remove('hidden');
    list.innerHTML = searches.map(function (s) {
      var newBadge = (s.new_matches_since_last > 0)
        ? '<span class="ml-2 px-1.5 py-0.5 bg-blue-600 text-white text-xs rounded-full">' + s.new_matches_since_last + ' new</span>'
        : '';
      return '<div class="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm">'
        + '<div class="flex-1 min-w-0">'
        + '<span class="text-sm text-slate-800 font-medium truncate block">' + (s.search_name || 'Unnamed') + '</span>'
        + '<span class="text-xs text-slate-500">' + (s.alert_frequency || 'daily') + ' alerts</span>'
        + newBadge
        + '</div>'
        + '<div class="flex gap-2 ml-2">'
        + '<button onclick="DriverSearchLogic.runSavedSearch(\'' + s._id + '\')" class="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 font-medium">Run</button>'
        + '<button onclick="DriverSearchLogic.deleteSavedSearchItem(\'' + s._id + '\')" class="text-xs text-red-500 hover:text-red-700 px-2 py-1 font-medium">Delete</button>'
        + '</div>'
        + '</div>';
    }).join('');
  }

  /* --- Tooltip helpers --- */
  function showTooltip(btnElement, message) {
    removeTooltip(btnElement);
    var tooltip = document.createElement('div');
    tooltip.className = 'save-tooltip absolute left-0 right-0 top-full mt-2 bg-slate-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg z-50 whitespace-normal';
    tooltip.innerHTML =
      '<div class="flex items-start gap-2">' +
        '<i class="fa-solid fa-circle-info text-amber-400 mt-0.5 flex-shrink-0"></i>' +
        '<span>' + message + '</span>' +
      '</div>' +
      '<div class="absolute -top-1 left-4 w-2 h-2 bg-slate-900 rotate-45"></div>';
    btnElement.style.position = 'relative';
    btnElement.appendChild(tooltip);
  }

  function removeTooltip(btnElement) {
    var existing = btnElement.querySelector('.save-tooltip');
    if (existing) existing.remove();
  }

  /* --- Donut chart --- */
  function updateDonutChart(weights) {
    var total = 0;
    var keys = Object.keys(weights);
    for (var i = 0; i < keys.length; i++) total += weights[keys[i]];
    document.getElementById('totalPercent').textContent = total + '%';

    var circumference = 2 * Math.PI * 40; // 251.2
    var offset = 0;

    keys.forEach(function (key) {
      var percent = weights[key] / 100;
      var dashLength = percent * circumference;
      var segment = document.getElementById('seg-' + key);
      if (segment) {
        segment.style.strokeDasharray = dashLength + ' ' + circumference;
        segment.style.strokeDashoffset = -offset;
        offset += dashLength;
      }
    });
  }

  /* --- Weight sliders --- */
  function updateWeightSliders(weights) {
    Object.keys(weights).forEach(function (key) {
      var slider = document.getElementById('slider-' + key);
      var valEl = document.getElementById('val-' + key);
      if (slider) slider.value = weights[key];
      if (valEl) valEl.textContent = weights[key] + '%';
    });
    updateDonutChart(weights);
  }

  /* --- Sidebar user --- */
  function updateSidebarUser(profile) {
    if (!profile) return;
    var name = profile.firstName || profile.name || 'Recruiter';
    var company = profile.company || '--';
    var initials = name.split(' ').map(function (n) { return n[0]; }).join('').toUpperCase().slice(0, 2);

    var nameEl = document.getElementById('sidebar-user-name');
    var companyEl = document.getElementById('sidebar-user-company');
    var initialsEl = document.getElementById('sidebar-user-initials');

    if (nameEl) nameEl.textContent = name;
    if (companyEl) companyEl.textContent = company;
    if (initialsEl) initialsEl.textContent = initials || '--';
  }

  return {
    getInitials: getInitials,
    getScoreClass: getScoreClass,
    showToast: showToast,
    showLoading: showLoading,
    showEmpty: showEmpty,
    hideEmpty: hideEmpty,
    showError: showError,
    updateResultsCount: updateResultsCount,
    updateQuotaDisplay: updateQuotaDisplay,
    renderDrivers: renderDrivers,
    renderProfile: renderProfile,
    renderPagination: renderPagination,
    renderSavedSearches: renderSavedSearches,
    showTooltip: showTooltip,
    removeTooltip: removeTooltip,
    updateDonutChart: updateDonutChart,
    updateWeightSliders: updateWeightSliders,
    updateSidebarUser: updateSidebarUser
  };
})();
