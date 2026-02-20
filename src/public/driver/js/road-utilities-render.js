/* =========================================
   DRIVER ROAD UTILITIES — Render Module
   Depends on: RoadUtilitiesConfig, Leaflet, GSAP
   All DOM rendering and visual helper functions
   ========================================= */
var RoadUtilitiesRender = (function () {
  'use strict';

  /* --- Utility Helpers --- */
  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  function formatTimeAgo(dateString) {
    if (!dateString) return '';
    var date = new Date(dateString);
    var now = new Date();
    var diffMs = now - date;
    var diffMins = Math.floor(diffMs / 60000);
    var diffHours = Math.floor(diffMs / 3600000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return diffMins + 'm ago';
    if (diffHours < 24) return diffHours + 'h ago';
    return Math.floor(diffHours / 24) + 'd ago';
  }

  function animateCards(selector) {
    if (typeof gsap !== 'undefined') {
      gsap.to(selector, { opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: 'power2.out' });
    }
  }

  function animateSection(section) {
    if (typeof gsap !== 'undefined' && section) {
      gsap.fromTo(section, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });
    }
  }

  function animateModal(el, show) {
    if (typeof gsap === 'undefined') return;
    if (show) {
      gsap.fromTo(el, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' });
    } else {
      gsap.to(el, { scale: 0.9, opacity: 0, duration: 0.2, ease: 'power2.in' });
    }
  }

  /* --- Toast --- */
  function showToast(message, type) {
    type = type || 'info';
    var bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    var toast = document.createElement('div');
    toast.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 ' + bgColor + ' text-white px-4 py-2 rounded-lg shadow-lg text-sm font-bold z-50';
    toast.textContent = message;
    document.body.appendChild(toast);

    if (typeof gsap !== 'undefined') {
      gsap.fromTo(toast, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });
      setTimeout(function () {
        gsap.to(toast, { opacity: 0, y: -20, duration: 0.3, ease: 'power2.in', onComplete: function () { toast.remove(); } });
      }, 3000);
    } else {
      setTimeout(function () { toast.remove(); }, 3500);
    }
  }

  /* --- Location Status --- */
  function showLocationStatus(message, isError) {
    var statusEl = document.getElementById('location-status');
    var textEl = document.getElementById('location-status-text');
    if (!statusEl || !textEl) return;
    statusEl.classList.remove('hidden', 'text-red-500', 'text-green-600', 'text-slate-500');
    statusEl.classList.add(isError ? 'text-red-500' : 'text-green-600');
    textEl.textContent = message;
    if (!isError) {
      setTimeout(function () { statusEl.classList.add('hidden'); }, 5000);
    }
  }

  /* ==========================================
     PARKING RENDERING
     ========================================== */
  function getStatusColor(item) {
    var ratio = item.available_spaces / item.total_spaces;
    if (item.available_spaces === 0) return { bg: 'bg-red-100', text: 'text-red-700', bar: 'bg-red-500', hex: '#ef4444', label: 'Full' };
    if (ratio < 0.1 || item.available_spaces < 5) return { bg: 'bg-yellow-100', text: 'text-yellow-700', bar: 'bg-yellow-500', hex: '#eab308', label: 'Limited' };
    return { bg: 'bg-green-100', text: 'text-green-700', bar: 'bg-green-500', hex: '#22c55e', label: 'Available' };
  }

  function getDataSourceBadge(item) {
    if (item.data_confidence === 'sensor') {
      return '<span class="bg-blue-100 text-blue-700 text-[9px] font-black px-1.5 py-0.5 rounded uppercase" title="Real-time sensor data from TPIMS"><i class="fa-solid fa-signal mr-0.5"></i>LIVE</span>';
    }
    if (item.data_confidence === 'reported') {
      return '<span class="bg-purple-100 text-purple-700 text-[9px] font-black px-1.5 py-0.5 rounded uppercase" title="Reported by drivers"><i class="fa-solid fa-users mr-0.5"></i>REPORTED</span>';
    }
    if (item.source_label) {
      return '<span class="bg-slate-100 text-slate-500 text-[9px] font-medium px-1.5 py-0.5 rounded">' + item.source_label + '</span>';
    }
    return '';
  }

  function renderAmenityIcons(amenities) {
    if (!amenities) return '';
    var iconMap = { 'shower': 'fa-shower', 'wifi': 'fa-wifi', 'food': 'fa-utensils', 'fuel': 'fa-gas-pump' };
    return amenities.map(function (a) { return '<i class="fa-solid ' + (iconMap[a] || 'fa-circle-info') + '"></i>'; }).join('');
  }

  function renderParkingCards(items, container) {
    container.innerHTML = '';
    if (!items || items.length === 0) {
      container.classList.add('hidden');
      document.getElementById('parking-empty').classList.remove('hidden');
      return;
    }
    container.classList.remove('hidden');
    document.getElementById('parking-empty').classList.add('hidden');

    items.forEach(function (item) {
      var sc = getStatusColor(item);
      var card = document.createElement('div');
      card.className = 'parking-card opacity-0 translate-y-4 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group hover:border-lmdr-yellow hover:shadow-md transition-all cursor-pointer';
      card.innerHTML =
        '<div class="p-4 sm:p-5">' +
          '<div class="flex justify-between items-start mb-3">' +
            '<div>' +
              '<h3 class="font-black text-lg text-slate-900 group-hover:text-lmdr-blue transition-colors mb-1">' + escapeHtml(item.name) + '</h3>' +
              '<p class="text-xs font-medium text-slate-500 uppercase tracking-wide"><i class="fa-solid fa-location-dot mr-1 text-slate-400"></i>' + (item.distance_miles || 0).toFixed(1) + ' MILES AWAY</p>' +
            '</div>' +
            '<div class="flex flex-col items-end gap-1">' +
              '<span class="bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border border-slate-200">' + (item.total_spaces || '??') + ' SPOTS</span>' +
              '<div class="' + sc.bg + ' ' + sc.text + ' px-2 py-1 rounded text-[10px] font-black uppercase">' + sc.label + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="flex items-center gap-4 mb-4">' +
            '<div class="flex-grow bg-gray-100 h-2 rounded-full overflow-hidden">' +
              '<div class="' + sc.bar + ' h-full" style="width: ' + (item.total_spaces > 0 ? (item.available_spaces / item.total_spaces * 100) : 0) + '%"></div>' +
            '</div>' +
            '<span class="text-xs font-bold text-slate-700">' + (item.available_spaces != null ? item.available_spaces : '?') + ' / ' + (item.total_spaces || '?') + '</span>' +
          '</div>' +
          '<div class="flex items-center justify-between">' +
            '<div class="flex gap-2 text-gray-400 text-sm">' + renderAmenityIcons(item.amenities) + '</div>' +
            '<div class="text-right"><p class="text-[10px] font-black text-slate-400 uppercase">Distance</p><p class="text-sm font-black text-slate-900">' + (item.distance_miles || 0) + ' mi</p></div>' +
          '</div>' +
        '</div>' +
        '<div class="bg-slate-50 px-4 py-3 flex gap-2">' +
          '<button onclick="navigate(\'' + item.location.lat + '\', \'' + item.location.lng + '\')" class="flex-grow bg-slate-900 text-white font-bold py-2 rounded-lg text-xs hover:bg-slate-800 transition-all">NAVIGATE</button>' +
          '<button onclick="showDetails(\'' + item._id + '\')" class="bg-white border border-slate-200 text-slate-700 font-bold px-4 py-2 rounded-lg text-xs hover:bg-gray-50 transition-all">DETAILS</button>' +
        '</div>';
      container.appendChild(card);
    });

    animateCards('.parking-card');
  }

  /* ==========================================
     FUEL RENDERING
     ========================================== */
  function renderFuelCards(items, container) {
    var loadingEl = document.getElementById('fuel-loading');
    var emptyEl = document.getElementById('fuel-empty');
    if (loadingEl) loadingEl.classList.add('hidden');

    if (!items || items.length === 0) {
      container.innerHTML = '';
      if (emptyEl) emptyEl.classList.remove('hidden');
      return;
    }
    if (emptyEl) emptyEl.classList.add('hidden');
    container.innerHTML = '';

    items.forEach(function (station, index) {
      var savingsClass = station.savings > 0 ? 'text-green-600' : 'text-slate-500';
      var savingsText = station.savings > 0 ? '-$' + station.savings.toFixed(2) + '/gal' : 'Retail';
      var priceColor = index === 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700';
      var addr = typeof station.address === 'object' ? (station.address.street + ', ' + station.address.city) : (station.address || '');

      var card = document.createElement('div');
      card.className = 'fuel-card opacity-0 translate-y-4 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group hover:border-lmdr-yellow transition-all';
      card.innerHTML =
        '<div class="p-4">' +
          '<div class="flex justify-between items-start mb-3">' +
            '<div class="flex-grow">' +
              '<div class="flex items-center gap-2 mb-1">' +
                (index === 0 ? '<span class="bg-lmdr-yellow text-slate-900 text-[10px] font-black px-2 py-0.5 rounded uppercase">Best Price</span>' : '') +
                '<span class="text-[10px] font-bold text-slate-400 uppercase">' + (station.brand || 'Independent') + '</span>' +
              '</div>' +
              '<h3 class="font-black text-slate-900 group-hover:text-lmdr-blue transition-colors">' + escapeHtml(station.name) + '</h3>' +
              '<p class="text-xs text-slate-500">' + escapeHtml(addr) + '</p>' +
            '</div>' +
            '<div class="text-right">' +
              '<p class="' + priceColor + ' px-3 py-2 rounded-xl text-lg font-black">$' + station.diesel_price.toFixed(2) + '</p>' +
              '<p class="' + savingsClass + ' text-[10px] font-bold mt-1">' + savingsText + '</p>' +
            '</div>' +
          '</div>' +
          '<div class="flex items-center gap-4 text-xs">' +
            '<div class="flex items-center gap-1 text-slate-500"><i class="fa-solid fa-location-dot"></i><span class="font-bold">' + (station.distance_miles ? station.distance_miles.toFixed(1) : '?') + ' mi</span></div>' +
            (station.has_def ? '<div class="flex items-center gap-1 text-blue-500"><i class="fa-solid fa-droplet"></i><span class="font-bold">DEF</span></div>' : '') +
            (station.has_scales ? '<div class="flex items-center gap-1 text-purple-500"><i class="fa-solid fa-weight-scale"></i><span class="font-bold">Scales</span></div>' : '') +
            (station.accepts_card ? '<div class="flex items-center gap-1 text-green-500"><i class="fa-solid fa-credit-card"></i><span class="font-bold">' + (station.card_type || 'Card') + '</span></div>' : '') +
          '</div>' +
        '</div>' +
        '<div class="bg-slate-50 px-4 py-3 flex gap-2">' +
          '<button onclick="navigateToFuel(\'' + (station.location ? station.location.lat : '') + '\', \'' + (station.location ? station.location.lng : '') + '\')" class="flex-grow bg-slate-900 text-white font-bold py-2 rounded-lg text-xs hover:bg-slate-800 transition-all"><i class="fa-solid fa-diamond-turn-right mr-1"></i> NAVIGATE</button>' +
          '<button onclick="calculateRouteSavings(\'' + station._id + '\')" class="bg-lmdr-yellow text-slate-900 font-bold px-4 py-2 rounded-lg text-xs hover:shadow-md transition-all"><i class="fa-solid fa-calculator mr-1"></i> SAVINGS</button>' +
        '</div>';
      container.appendChild(card);
    });

    animateCards('.fuel-card');
  }

  /* ==========================================
     WEIGH STATION RENDERING
     ========================================== */
  function getStationStatusInfo(station) {
    var status = (station.status || '').toLowerCase();
    if (status === 'open') return { bg: 'bg-green-100', text: 'text-green-700', label: 'Open' };
    if (status === 'closed') return { bg: 'bg-red-100', text: 'text-red-700', label: 'Closed' };
    return { bg: 'bg-slate-100', text: 'text-slate-500', label: 'Unknown' };
  }

  function getConfidenceBadge(confidence) {
    if (confidence === 'sensor') return '<span class="bg-blue-100 text-blue-700 text-[9px] font-black px-1.5 py-0.5 rounded uppercase" title="Real-time sensor data"><i class="fa-solid fa-signal mr-0.5"></i>LIVE</span>';
    if (confidence === 'reported') return '<span class="bg-purple-100 text-purple-700 text-[9px] font-black px-1.5 py-0.5 rounded uppercase" title="Reported by drivers"><i class="fa-solid fa-users mr-0.5"></i>REPORTED</span>';
    if (confidence === 'historical') return '<span class="bg-slate-100 text-slate-500 text-[9px] font-medium px-1.5 py-0.5 rounded" title="Based on typical hours"><i class="fa-solid fa-clock mr-0.5"></i>HISTORICAL</span>';
    return '';
  }

  function getBypassInfo(station, prepassEnabled, drivewyzeEnabled) {
    var badges = [];
    if (station.prepass_enabled) {
      var rate = station.prepass_bypass_rate || 0;
      var active = prepassEnabled;
      badges.push('<div class="flex items-center gap-1.5 text-xs ' + (active ? '' : 'opacity-50') + '"><span class="w-6 h-6 bg-green-500 text-white rounded flex items-center justify-center text-[10px] font-black">P</span><span class="font-bold ' + (active ? 'text-green-700' : 'text-slate-500') + '">' + rate + '% bypass</span></div>');
    }
    if (station.drivewyze_enabled) {
      var dRate = station.drivewyze_bypass_rate || 0;
      var dActive = drivewyzeEnabled;
      badges.push('<div class="flex items-center gap-1.5 text-xs ' + (dActive ? '' : 'opacity-50') + '"><span class="w-6 h-6 bg-blue-500 text-white rounded flex items-center justify-center text-[10px] font-black">D</span><span class="font-bold ' + (dActive ? 'text-blue-700' : 'text-slate-500') + '">' + dRate + '% bypass</span></div>');
    }
    if (badges.length === 0) return '<div class="text-xs text-slate-400 mb-3"><i class="fa-solid fa-ban mr-1"></i>No bypass services available</div>';
    return '<div class="flex items-center gap-4 mb-3">' + badges.join('') + '</div>';
  }

  function renderWeighStationCards(items, container, prepassEnabled, drivewyzeEnabled) {
    var loadingEl = document.getElementById('weighstation-loading');
    var emptyEl = document.getElementById('weighstation-empty');
    if (loadingEl) loadingEl.classList.add('hidden');

    if (!items || items.length === 0) {
      container.innerHTML = '';
      if (emptyEl) emptyEl.classList.remove('hidden');
      return;
    }
    if (emptyEl) emptyEl.classList.add('hidden');
    container.innerHTML = '';

    items.forEach(function (station) {
      var statusInfo = getStationStatusInfo(station);
      var bypassInfo = getBypassInfo(station, prepassEnabled, drivewyzeEnabled);

      var card = document.createElement('div');
      card.className = 'weighstation-card opacity-0 translate-y-4 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group hover:border-lmdr-yellow hover:shadow-md transition-all';
      card.innerHTML =
        '<div class="p-4">' +
          '<div class="flex justify-between items-start mb-2">' +
            '<div class="flex-grow">' +
              '<div class="flex items-center gap-2 mb-1">' +
                '<h3 class="font-black text-slate-900 group-hover:text-lmdr-blue transition-colors">' + escapeHtml(station.name) + '</h3>' +
                getConfidenceBadge(station.status_confidence) +
              '</div>' +
              '<p class="text-xs text-slate-500">' +
                (station.highway || '') + ' ' + (station.direction || '') +
                (station.mile_marker ? ' &bull; MM ' + station.mile_marker : '') +
                (station.state ? ' &bull; ' + station.state : '') +
              '</p>' +
            '</div>' +
            '<div class="' + statusInfo.bg + ' ' + statusInfo.text + ' px-3 py-1.5 rounded-lg text-xs font-black uppercase">' + statusInfo.label + '</div>' +
          '</div>' +
          bypassInfo +
          (station.wait_estimate ? '<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mb-3 text-xs"><i class="fa-solid fa-clock text-yellow-600 mr-1"></i><span class="font-bold text-yellow-800">Est. wait: ' + station.wait_estimate + ' min</span>' + (station.report_count ? '<span class="text-yellow-600 ml-2">(' + station.report_count + ' reports)</span>' : '') + '</div>' : '') +
          '<div class="flex items-center justify-between text-xs">' +
            '<div class="flex items-center gap-1 text-slate-500"><i class="fa-solid fa-location-dot"></i><span class="font-bold">' + (station.distance_miles ? station.distance_miles.toFixed(1) : '?') + ' mi away</span></div>' +
            (station.last_status_update ? '<span class="text-slate-400">Updated ' + formatTimeAgo(station.last_status_update) + '</span>' : '') +
          '</div>' +
        '</div>' +
        '<div class="bg-slate-50 px-4 py-3 flex gap-2">' +
          '<button onclick="navigateToStation(\'' + (station.location ? station.location.lat : '') + '\', \'' + (station.location ? station.location.lng : '') + '\')" class="flex-grow bg-slate-900 text-white font-bold py-2 rounded-lg text-xs hover:bg-slate-800 transition-all"><i class="fa-solid fa-diamond-turn-right mr-1"></i> NAVIGATE</button>' +
          '<button onclick="openReportModal(\'' + station._id + '\', \'' + escapeHtml(station.name) + '\')" class="bg-lmdr-yellow text-slate-900 font-bold px-4 py-2 rounded-lg text-xs hover:shadow-md transition-all"><i class="fa-solid fa-bullhorn mr-1"></i>REPORT</button>' +
        '</div>';
      container.appendChild(card);
    });

    animateCards('.weighstation-card');
  }

  /* ==========================================
     CONDITIONS RENDERING
     ========================================== */
  function getSeverityColor(severity) {
    if (severity === 'major') return { bg: 'bg-red-50', text: 'text-red-600', badgeBg: 'bg-red-100', badgeText: 'text-red-700', badgeBorder: 'border-red-200' };
    if (severity === 'moderate') return { bg: 'bg-orange-50', text: 'text-orange-600', badgeBg: 'bg-orange-100', badgeText: 'text-orange-700', badgeBorder: 'border-orange-200' };
    return { bg: 'bg-slate-50', text: 'text-slate-600', badgeBg: 'bg-slate-100', badgeText: 'text-slate-600', badgeBorder: 'border-slate-200' };
  }

  function getConditionIcon(type) {
    if (type === 'closure') return 'fa-ban';
    if (type === 'accident') return 'fa-car-burst';
    if (type === 'construction') return 'fa-screwdriver-wrench';
    if (type === 'weather') return 'fa-cloud-showers-heavy';
    return 'fa-triangle-exclamation';
  }

  function renderConditions(conditions) {
    var list = document.getElementById('conditions-list');
    if (!list) return;
    list.innerHTML = '';

    if (!conditions || conditions.length === 0) {
      list.innerHTML =
        '<div class="bg-white rounded-2xl shadow-sm p-6 text-center border border-slate-100">' +
          '<div class="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">' +
            '<i class="fa-solid fa-road text-2xl text-green-500"></i>' +
          '</div>' +
          '<p class="font-bold text-slate-900">Roads Look Clear</p>' +
          '<p class="text-xs text-slate-500 mt-1">No major incidents reported on your route.</p>' +
        '</div>';
      return;
    }

    conditions.forEach(function (c) {
      var sc = getSeverityColor(c.severity);
      var icon = getConditionIcon(c.type);
      var altRouteHtml = '';

      if (c.alternate_routes && c.alternate_routes.length > 0) {
        altRouteHtml =
          '<div class="mt-3 pt-3 border-t border-slate-100">' +
            '<button onclick="document.getElementById(\'alt-route-' + c._id + '\').classList.toggle(\'hidden\')" class="w-full text-left flex justify-between items-center group">' +
              '<span class="text-xs font-black text-lmdr-blue uppercase tracking-wider group-hover:underline"><i class="fa-solid fa-route mr-1"></i> Alternate Route Available</span>' +
              '<i class="fa-solid fa-chevron-down text-slate-400 text-xs"></i>' +
            '</button>' +
            '<div id="alt-route-' + c._id + '" class="hidden mt-2 bg-blue-50 border border-blue-100 rounded-lg p-3">' +
              c.alternate_routes.map(function (r) {
                return '<div class="mb-2 last:mb-0">' +
                  '<div class="flex justify-between items-start">' +
                    '<p class="font-bold text-sm text-blue-900">' + escapeHtml(r.name) + '</p>' +
                    '<span class="bg-green-100 text-green-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-green-200">SAVE ' + r.savings_minutes + 'm</span>' +
                  '</div>' +
                  '<p class="text-xs text-blue-800 mt-1">' + escapeHtml(r.description) + '</p>' +
                  '<p class="text-[10px] text-blue-500 mt-1"><i class="fa-solid fa-person-walking-dashed-line-arrow-right mr-1"></i>+' + r.distance_diff_miles + ' miles &bull; +' + r.time_diff_minutes + ' min vs normal</p>' +
                '</div>';
              }).join('') +
              '<button onclick="switchTab(\'parking\')" class="w-full mt-2 bg-blue-600 text-white font-bold text-xs py-2 rounded hover:bg-blue-700 transition-colors">FIND PARKING ON THIS ROUTE</button>' +
            '</div>' +
          '</div>';
      }

      list.innerHTML +=
        '<div class="bg-white rounded-xl shadow-sm border border-slate-100 p-4 transition-all hover:shadow-md">' +
          '<div class="flex items-start gap-3">' +
            '<div class="' + sc.bg + ' ' + sc.text + ' w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">' +
              '<i class="fa-solid ' + icon + ' text-lg"></i>' +
            '</div>' +
            '<div class="flex-grow">' +
              '<div class="flex justify-between items-start">' +
                '<h4 class="font-bold text-sm text-slate-900">' + escapeHtml(c.highway) + ' ' + escapeHtml(c.state || '') + '</h4>' +
                '<span class="' + sc.badgeBg + ' ' + sc.badgeText + ' text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ' + sc.badgeBorder + '">' + (c.severity || 'Notice') + '</span>' +
              '</div>' +
              '<p class="text-xs font-medium text-slate-500 mt-1 uppercase tracking-wide flex items-center">' +
                (c.type || '').toUpperCase() + ' <span class="mx-1">&bull;</span> ' +
                (c.delay_minutes > 0 ? '<span class="text-red-500 font-bold">+' + c.delay_minutes + ' MIN DELAY</span>' : 'NO DELAY') +
              '</p>' +
              '<p class="text-sm text-slate-700 mt-2 leading-relaxed">' + escapeHtml(c.description) + '</p>' +
              (c.expected_end ? '<p class="text-[10px] text-slate-400 mt-2 italic"><i class="fa-regular fa-clock mr-1"></i>Clearing by ' + new Date(c.expected_end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '</p>' : '') +
              altRouteHtml +
            '</div>' +
          '</div>' +
        '</div>';
    });
  }

  function renderConditionSummary(summary) {
    if (!summary || !summary.total_delay_minutes || summary.total_delay_minutes <= 0) return;
    var list = document.getElementById('conditions-list');
    if (!list) return;
    var summaryDiv = document.createElement('div');
    summaryDiv.className = 'bg-slate-900 text-white p-4 rounded-xl shadow-lg mb-4 flex justify-between items-center';
    summaryDiv.innerHTML =
      '<div>' +
        '<p class="text-[10px] uppercase font-bold text-slate-400">Total Route Delay</p>' +
        '<p class="text-2xl font-black text-lmdr-yellow">+' + summary.total_delay_minutes + ' <span class="text-sm text-white">MIN</span></p>' +
      '</div>' +
      '<div class="text-right">' +
        '<p class="text-xs font-bold">' + (summary.total_incidents || 0) + ' INCIDENTS</p>' +
        '<p class="text-[10px] text-slate-400">' + ((summary.counts && summary.counts.closure) || 0) + ' CLOSURES &bull; ' + ((summary.counts && summary.counts.accident) || 0) + ' CRASHES</p>' +
      '</div>';
    list.insertBefore(summaryDiv, list.firstChild);
  }

  /* ==========================================
     WEATHER RENDERING
     ========================================== */
  function renderChainLaws(items) {
    var list = document.getElementById('chain-laws-list');
    if (!list) return;
    list.innerHTML = '';
    items.forEach(function (item) {
      var colorClass = item.status === 'Clear' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200';
      var icon = item.status === 'Clear' ? 'fa-check' : 'fa-link';
      list.innerHTML +=
        '<div class="' + colorClass + ' border p-3 rounded-xl flex items-center justify-between">' +
          '<div><p class="font-bold text-sm">' + escapeHtml(item.name) + '</p><p class="text-xs font-medium opacity-80">' + escapeHtml(item.status) + '</p></div>' +
          '<i class="fa-solid ' + icon + ' text-lg"></i>' +
        '</div>';
    });
  }

  function renderAlerts(alerts) {
    var container = document.getElementById('weather-alerts-container');
    if (!container) return;
    container.innerHTML = '';

    var demoBtn = document.createElement('div');
    demoBtn.className = 'flex justify-center mb-4';
    demoBtn.innerHTML = '<button onclick="window.demoWeather=\'ACTIVE\'; refreshWeather();" class="text-xs border border-slate-200 text-slate-500 hover:text-lmdr-blue px-3 py-1 rounded-full transition-colors"><i class="fa-solid fa-cloud-bolt mr-1"></i> Live Demo: National Weather Service</button>';
    container.appendChild(demoBtn);

    if (!alerts || alerts.length === 0) {
      container.innerHTML +=
        '<div class="bg-white rounded-2xl shadow-sm p-6 text-center border border-slate-100">' +
          '<i class="fa-solid fa-check-circle text-4xl text-green-500 mb-2"></i>' +
          '<p class="font-bold text-slate-900">No active alerts</p>' +
          '<p class="text-xs text-slate-500 mt-1">Safe travels!</p>' +
        '</div>';
      return;
    }

    container.innerHTML += alerts.map(function (a) {
      return '<div class="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl shadow-sm">' +
        '<div class="flex items-start justify-between">' +
          '<div>' +
            '<h4 class="font-black text-red-700 uppercase text-xs tracking-wider">' + escapeHtml(a.event) + '</h4>' +
            '<p class="text-sm font-bold text-slate-900 mt-1">' + escapeHtml(a.headline) + '</p>' +
            '<p class="text-xs text-slate-500 mt-2">' + (a.description ? escapeHtml(a.description.substring(0, 100)) + '...' : '') + '</p>' +
          '</div>' +
          '<i class="fa-solid fa-triangle-exclamation text-red-500 text-xl"></i>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  /* ==========================================
     RESTRICTIONS RENDERING
     ========================================== */
  function renderRestrictions(items) {
    var list = document.getElementById('restrictions-list');
    if (!list) return;
    if (!items || items.length === 0) {
      list.classList.add('hidden');
      return;
    }
    list.classList.remove('hidden');
    list.innerHTML = '<h4 class="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Active Restrictions for Your Truck</h4>';
    items.forEach(function (r) {
      list.innerHTML +=
        '<div class="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">' +
          '<div class="bg-white p-1.5 rounded-md shadow-sm text-red-600 font-bold text-xs border border-red-100">' + r.value + r.unit + '</div>' +
          '<div>' +
            '<p class="text-xs font-bold text-slate-900">' + r.restriction_type.toUpperCase() + ' RESTRICTION</p>' +
            '<p class="text-[10px] text-slate-500">' + escapeHtml(r.details) + '</p>' +
            '<p class="text-[9px] text-slate-400 mt-1"><i class="fa-solid fa-location-dot mr-1"></i>' + escapeHtml(r.highway) + ' ' + escapeHtml(r.state) + '</p>' +
          '</div>' +
        '</div>';
    });
  }

  /* ==========================================
     RATINGS / REVIEWS RENDERING
     ========================================== */
  function renderReviews(reviews) {
    var list = document.getElementById('top-rated-list');
    var loadingEl = document.getElementById('ratings-loading');
    if (loadingEl) loadingEl.classList.add('hidden');
    if (!list) return;

    if (!reviews || reviews.length === 0) {
      list.innerHTML = '<div class="text-center py-6 text-slate-400 text-sm">No reviews yet. Be the first to review!</div>';
      return;
    }

    list.innerHTML = reviews.map(function (r) {
      var stars = '';
      for (var i = 0; i < Math.round(r.overall_rating || 0); i++) {
        stars += '<i class="fa-solid fa-star text-xs"></i>';
      }
      return '<div class="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-all">' +
        '<div class="flex justify-between items-start mb-2">' +
          '<h4 class="font-bold text-sm text-slate-900">' + escapeHtml(r.location_name || 'Rest Stop') + '</h4>' +
          '<div class="flex items-center gap-1 text-lmdr-yellow">' + stars +
            '<span class="text-xs font-bold text-slate-500 ml-1">' + (r.overall_rating || 0).toFixed(1) + '</span>' +
          '</div>' +
        '</div>' +
        '<p class="text-xs text-slate-500 leading-relaxed">' + escapeHtml(r.review_text || '') + '</p>' +
        '<div class="flex items-center gap-3 mt-3 text-[10px] text-slate-400 font-bold uppercase tracking-wider">' +
          '<span><i class="fa-solid fa-thumbs-up mr-1"></i>' + (r.helpful_votes || 0) + ' helpful</span>' +
          '<span>' + new Date(r._createdDate || r.created_at).toLocaleDateString() + '</span>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  /* ==========================================
     DASHBOARD RENDERING
     ========================================== */
  function renderRecentActivity(recent) {
    var activityDiv = document.getElementById('dash-recent-activity');
    if (!activityDiv) return;

    if (!recent || recent.length === 0) {
      recent = [
        { type: 'parking', icon: 'fa-square-parking', color: 'text-lmdr-yellow', text: 'Checked parking in Memphis, TN', time: '10 mins ago' },
        { type: 'fuel', icon: 'fa-gas-pump', color: 'text-blue-500', text: 'Found diesel at $3.45/gal', time: '2 hours ago' }
      ];
    }

    activityDiv.innerHTML = recent.map(function (item) {
      return '<div class="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">' +
        '<div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center ' + (item.color || 'text-slate-500') + '">' +
          '<i class="fa-solid ' + (item.icon || 'fa-circle-info') + '"></i>' +
        '</div>' +
        '<div class="flex-grow">' +
          '<p class="text-xs font-bold text-slate-900">' + escapeHtml(item.text) + '</p>' +
          '<p class="text-[10px] text-slate-400">' + escapeHtml(item.time) + '</p>' +
        '</div>' +
        '<i class="fa-solid fa-chevron-right text-xs text-slate-300"></i>' +
      '</div>';
    }).join('');
  }

  return {
    escapeHtml: escapeHtml,
    formatTimeAgo: formatTimeAgo,
    animateCards: animateCards,
    animateSection: animateSection,
    animateModal: animateModal,
    showToast: showToast,
    showLocationStatus: showLocationStatus,
    getStatusColor: getStatusColor,
    renderParkingCards: renderParkingCards,
    renderFuelCards: renderFuelCards,
    renderWeighStationCards: renderWeighStationCards,
    renderConditions: renderConditions,
    renderConditionSummary: renderConditionSummary,
    renderChainLaws: renderChainLaws,
    renderAlerts: renderAlerts,
    renderRestrictions: renderRestrictions,
    renderReviews: renderReviews,
    renderRecentActivity: renderRecentActivity
  };
})();
