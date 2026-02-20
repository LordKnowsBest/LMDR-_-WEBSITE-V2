/* =========================================
   DRIVER ROAD UTILITIES — Logic Module
   Depends on: RoadUtilitiesConfig, RoadUtilitiesBridge, RoadUtilitiesRender
   ========================================= */
var RoadUtilitiesLogic = (function () {
  'use strict';

  var Config = RoadUtilitiesConfig;
  var Bridge = RoadUtilitiesBridge;
  var Render = RoadUtilitiesRender;

  /* --- State --- */
  var map = null;
  var markers = [];
  var currentView = 'list';
  var currentTab = 'dashboard';
  var fuelDataLoaded = false;
  var fuelMarkers = [];
  var currentFuelResults = [];
  var weighStationDataLoaded = false;
  var currentWeighStationResults = [];
  var currentReportStationId = null;
  var selectedReportType = null;
  var selectedReportDetails = [];
  var driverBypassServices = { prepass: false, drivewyze: false };
  var selectedReviewRating = 5;
  var pendingReviewPhotos = [];

  /* ==========================================
     INITIALIZATION
     ========================================== */
  function init() {
    Bridge.getDriverFuelCards();
    Bridge.getDriverBypassServices();
    bindTruckSpecListeners();
    setupMessageListeners();

    if (window.parent === window) {
      setupStandaloneDebug();
    }

    exposeGlobals();
  }

  function exposeGlobals() {
    window.switchTab = switchTab;
    window.searchByLocation = searchByLocation;
    window.useMyLocation = useMyLocation;
    window.toggleView = toggleView;
    window.searchThisArea = searchThisArea;
    window.searchFuel = doSearchFuel;
    window.openAddCardModal = openAddCardModal;
    window.searchWeighStations = doSearchWeighStations;
    window.useMyLocationForScales = useMyLocationForScales;
    window.searchReviews = searchReviews;
    window.showRestStopReportModal = showRestStopReportModal;
    window.closeRestStopReportModal = closeRestStopReportModal;
    window.submitCondition = submitCondition;
    window.openReportModal = openReportModal;
    window.closeReportModal = closeReportModal;
    window.selectReportType = selectReportType;
    window.toggleReportDetail = toggleReportDetail;
    window.submitStationReport = submitStationReport;
    window.openReviewModal = openReviewModal;
    window.closeReviewModal = closeReviewModal;
    window.setReviewRating = setReviewRating;
    window.submitReviewForm = submitReviewForm;
    window.refreshWeather = refreshWeather;
    window.refreshConditions = refreshConditions;
    window.saveWeatherPreferences = saveWeatherPreferences;
    window.saveBypassPreferences = saveBypassPreferences;
    window.planRoute = planRoute;
    window.navigate = navigate;
    window.showDetails = showDetails;
    window.navigateToFuel = navigateToFuel;
    window.calculateRouteSavings = calculateRouteSavings;
    window.navigateToStation = navigateToStation;
    window.reportCondition = doReportCondition;
    window.showToast = Render.showToast;
  }

  /* ==========================================
     POSTMESSAGE LISTENER (unified)
     ========================================== */
  function setupMessageListeners() {
    Bridge.listen({
      init: function (data) {
        if (data && data.initialTab && data.initialTab !== currentTab) {
          switchTab(data.initialTab);
        }
      },
      parkingResults: function (data) {
        var loadingEl = document.getElementById('parking-loading');
        if (loadingEl) loadingEl.classList.add('hidden');
        handleParkingResults(data.items || data);
      },
      fuelResults: function (data) {
        handleFuelResults(data.items || data);
      },
      fuelCardsLoaded: function (data) {
        updateFuelCardDropdown(data.cards || data);
      },
      fuelCardLinked: function (data) {
        if (data && data.success) console.log('Fuel card linked successfully');
      },
      savingsResult: function (data) {
        if (data && data.success) {
          var savingsEl = document.getElementById('savings-amount');
          if (savingsEl && data.totalSavings !== undefined) {
            savingsEl.textContent = '$' + (data.totalSavings || 0).toFixed(2);
          }
        }
      },
      weatherResults: function (data) {
        if (data.chainLaws) Render.renderChainLaws(data.chainLaws);
        if (data.alerts) Render.renderAlerts(data.alerts);
      },
      conditionsResults: function (data) {
        Render.renderConditions(data.conditions || []);
        Render.renderConditionSummary(data.summary || {});
      },
      weighStationResults: function (data) {
        handleWeighStationResults(data.items || data);
      },
      stationStatusResult: function (data) {
        if (data && data.success) {
          Render.showToast('Thanks for your report!', 'success');
          doSearchWeighStations();
        } else {
          Render.showToast((data && data.message) || 'Failed to submit report', 'error');
        }
      },
      restrictionResults: function (data) {
        Render.renderRestrictions(data.restrictions || []);
      },
      roadConditionReported: function (data) {
        if (data && data.success) {
          Render.showToast('Road condition reported. Thank you!', 'success');
        } else {
          Render.showToast('Failed to report condition', 'error');
        }
      },
      bypassServicesLoaded: function (data) {
        updateBypassCheckboxes(data.services || data);
      },
      bypassServicesSaved: function (data) {
        if (data && data.success) console.log('Bypass services saved');
      },
      parkingDetails: function (data) {
        if (data && data.item) {
          Render.showToast(data.item.name + ' — ' + (data.item.available_spaces || '?') + ' spaces available', 'info');
        }
      },
      reportResult: function (data) {
        Render.showToast((data && data.message) || (data && data.success ? 'Report submitted!' : 'Report failed'), data && data.success ? 'success' : 'error');
      },
      reviewsLoaded: function (data) {
        Render.renderReviews(data.reviews || []);
      },
      reviewSubmitted: function (data) {
        if (data && data.success) {
          Render.showToast(data.message || 'Review submitted!', 'success');
          loadTopRated();
        } else {
          Render.showToast((data && data.message) || 'Failed to submit review', 'error');
        }
      },
      conditionReported: function (data) {
        if (data && data.success) {
          Render.showToast(data.message || 'Condition reported!', 'success');
          closeRestStopReportModal();
        } else {
          Render.showToast((data && data.message) || 'Report failed', 'error');
        }
      },
      voteRegistered: function (data) {
        if (data && data.reviewId) Render.showToast('Vote recorded', 'success');
      },
      weatherSubscriptionSaved: function (data) {
        Render.showToast((data && data.message) || (data && data.success ? 'Preferences saved' : 'Failed to save preferences'), data && data.success ? 'success' : 'error');
      },
      error: function () {
        ['parking-loading', 'fuel-loading', 'weighstation-loading'].forEach(function (id) {
          var el = document.getElementById(id);
          if (el) el.classList.add('hidden');
        });
      }
    });
  }

  /* ==========================================
     TAB NAVIGATION
     ========================================== */
  function switchTab(tabId) {
    Config.TABS.forEach(function (t) {
      var btn = document.getElementById('tab-' + t);
      var section = document.getElementById('section-' + t);

      if (t === tabId) {
        if (btn) btn.className = Config.TAB_ACTIVE_CLASS;
        if (section) section.classList.remove('hidden');

        if (tabId === 'dashboard') initDashboard();
        if (tabId === 'parking' && map) setTimeout(function () { map.invalidateSize(); }, 100);
        if (tabId === 'fuel' && !fuelDataLoaded) doSearchFuel();
        if (tabId === 'weighstation' && !weighStationDataLoaded) doSearchWeighStations();
        if (tabId === 'ratings') loadTopRated();
        if (tabId === 'weather') refreshWeather();
        if (tabId === 'conditions') refreshConditions();
      } else {
        if (btn) btn.className = Config.TAB_INACTIVE_CLASS;
        if (section) section.classList.add('hidden');
      }
    });

    currentTab = tabId;
    var activeSection = document.getElementById('section-' + tabId);
    Render.animateSection(activeSection);
    Bridge.notifyTabSwitch(tabId);
  }

  /* ==========================================
     DASHBOARD
     ========================================== */
  function initDashboard() {
    setTimeout(function () {
      setTextById('dash-diesel-price', '$3.45');
      setTextById('dash-parking-dist', '2.4 mi');
      setTextById('dash-parking-status', '12 SPOTS LEFT');
      setTextById('dash-diesel-loc', 'Speedway (1.2mi)');
    }, 500);

    var recent = [];
    try { recent = JSON.parse(localStorage.getItem('lmdr_recent_activity') || '[]'); } catch (e) { }
    Render.renderRecentActivity(recent);
  }

  function planRoute() {
    var input = document.getElementById('dash-route-input');
    if (!input || !input.value) return;

    switchTab('conditions');

    var newActivity = {
      type: 'route', icon: 'fa-route', color: 'text-red-500',
      text: 'Planned route to ' + input.value, time: 'Just now'
    };
    try {
      var recent = JSON.parse(localStorage.getItem('lmdr_recent_activity') || '[]');
      recent.unshift(newActivity);
      if (recent.length > 5) recent.pop();
      localStorage.setItem('lmdr_recent_activity', JSON.stringify(recent));
    } catch (e) { }
  }

  function setTextById(id, text) {
    var el = document.getElementById(id);
    if (el) el.innerHTML = text;
  }

  /* ==========================================
     MAP & VIEW TOGGLE
     ========================================== */
  function initMap() {
    if (map) return;
    map = L.map('map').setView([Config.DEFAULT_COORDS.lat, Config.DEFAULT_COORDS.lng], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
  }

  function toggleView(view) {
    currentView = view;
    var list = document.getElementById('parking-results');
    var mapContainer = document.getElementById('parking-map-container');
    var listBtn = document.getElementById('view-list-btn');
    var mapBtn = document.getElementById('view-map-btn');

    if (view === 'map') {
      list.classList.add('hidden');
      mapContainer.classList.remove('hidden');
      listBtn.classList.remove('bg-slate-900', 'text-white');
      listBtn.classList.add('text-slate-500');
      mapBtn.classList.add('bg-slate-900', 'text-white');
      mapBtn.classList.remove('text-slate-500');
      setTimeout(function () { initMap(); map.invalidateSize(); }, 100);
    } else {
      list.classList.remove('hidden');
      mapContainer.classList.add('hidden');
      mapBtn.classList.remove('bg-slate-900', 'text-white');
      mapBtn.classList.add('text-slate-500');
      listBtn.classList.add('bg-slate-900', 'text-white');
      listBtn.classList.remove('text-slate-500');
    }
  }

  /* ==========================================
     LOCATION SEARCH & GEOLOCATION
     ========================================== */
  function searchByLocation() {
    var input = document.getElementById('location-search').value.trim();
    if (!input) {
      Render.showLocationStatus('Please enter a zip code or city, state', true);
      return;
    }
    Render.showLocationStatus('Searching for location...');

    var query = encodeURIComponent(input + ', USA');
    fetch('https://nominatim.openstreetmap.org/search?q=' + query + '&format=json&limit=1&countrycodes=us', { headers: { 'Accept': 'application/json' } })
      .then(function (response) { return response.json(); })
      .then(function (results) {
        if (!results || results.length === 0) {
          Render.showLocationStatus('Location not found. Try a different zip code or city.', true);
          return;
        }
        var lat = parseFloat(results[0].lat);
        var lng = parseFloat(results[0].lon);
        var shortName = results[0].display_name.split(',').slice(0, 2).join(',').trim();
        Render.showLocationStatus('Found: ' + shortName);
        goToLocationAndSearch(lat, lng, 25);
      })
      .catch(function () {
        Render.showLocationStatus('Error searching location. Please try again.', true);
      });
  }

  function useMyLocation() {
    var btn = document.getElementById('my-location-btn');
    var originalContent = btn.innerHTML;

    if (!navigator.geolocation) {
      Render.showLocationStatus('Geolocation is not supported by your browser', true);
      return;
    }

    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i>';
    btn.disabled = true;
    Render.showLocationStatus('Getting your location...');

    navigator.geolocation.getCurrentPosition(
      function (position) {
        var lat = position.coords.latitude;
        var lng = position.coords.longitude;
        Render.showLocationStatus('Location found! Searching nearby parking...');
        document.getElementById('location-search').value = lat.toFixed(4) + ', ' + lng.toFixed(4);
        goToLocationAndSearch(lat, lng, 25);
        btn.innerHTML = originalContent;
        btn.disabled = false;
      },
      function (error) {
        var message = 'Unable to get your location. ';
        if (error.code === error.PERMISSION_DENIED) message += 'Location access was denied.';
        else if (error.code === error.POSITION_UNAVAILABLE) message += 'Location unavailable.';
        else if (error.code === error.TIMEOUT) message += 'Request timed out.';
        else message += 'Please try entering a zip code instead.';
        Render.showLocationStatus(message, true);
        btn.innerHTML = originalContent;
        btn.disabled = false;
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }

  function goToLocationAndSearch(lat, lng, radius) {
    if (!map) initMap();
    toggleView('map');
    setTimeout(function () {
      map.setView([lat, lng], 10, { animate: true });
      map.invalidateSize();
      setTimeout(function () { searchThisArea(); }, 500);
    }, 200);
  }

  function searchThisArea() {
    var center = map.getCenter();
    var bounds = map.getBounds();
    var radius = map.distance(center, bounds.getNorthWest()) / 1609.34;
    document.getElementById('parking-loading').classList.remove('hidden');
    Bridge.searchParking(center.lat, center.lng, radius);
  }

  /* ==========================================
     PARKING
     ========================================== */
  function handleParkingResults(items) {
    var container = document.getElementById('parking-results');

    if (map) {
      markers.forEach(function (m) { map.removeLayer(m); });
      markers = [];
    }

    Render.renderParkingCards(items, container);

    if (map && items && items.length > 0) {
      items.forEach(function (item) {
        if (!item.location) return;
        var sc = Render.getStatusColor(item);
        var marker = L.circleMarker([item.location.lat, item.location.lng], {
          radius: 8, fillColor: sc.hex, color: '#fff', weight: 2, opacity: 1, fillOpacity: 0.8
        }).addTo(map);
        marker.bindPopup('<b>' + Render.escapeHtml(item.name) + '</b><br>' + item.available_spaces + ' spaces available');
        markers.push(marker);
      });
      var group = new L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }

  function navigate(lat, lng) {
    var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    var url = isIOS
      ? 'maps://maps.apple.com/?daddr=' + lat + ',' + lng
      : 'https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lng;
    window.open(url, '_blank');
  }

  function showDetails(locationId) {
    if (!locationId) return;
    Bridge.getParkingDetails(locationId);
  }

  /* ==========================================
     FUEL
     ========================================== */
  function doSearchFuel() {
    var loadingEl = document.getElementById('fuel-loading');
    var resultsEl = document.getElementById('fuel-results');
    var emptyEl = document.getElementById('fuel-empty');

    if (loadingEl) loadingEl.classList.remove('hidden');
    if (resultsEl) resultsEl.innerHTML = '';
    if (emptyEl) emptyEl.classList.add('hidden');

    var selectedCard = document.getElementById('fuel-card-select').value;
    var searchQuery = document.getElementById('fuel-search-input').value;

    function doFuelSearch(lat, lng) {
      Bridge.searchFuel({ lat: lat, lng: lng, radius: 50, fuelCardType: selectedCard, query: searchQuery });
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function (pos) { doFuelSearch(pos.coords.latitude, pos.coords.longitude); },
        function () { doFuelSearch(Config.DEFAULT_COORDS.lat, Config.DEFAULT_COORDS.lng); }
      );
    } else {
      doFuelSearch(Config.DEFAULT_COORDS.lat, Config.DEFAULT_COORDS.lng);
    }
  }

  function handleFuelResults(items) {
    fuelDataLoaded = true;
    currentFuelResults = items || [];
    var resultsEl = document.getElementById('fuel-results');
    Render.renderFuelCards(items, resultsEl);
    updateFuelMarkers(items);
  }

  function updateFuelMarkers(items) {
    if (!map) return;
    fuelMarkers.forEach(function (m) { map.removeLayer(m); });
    fuelMarkers = [];

    (items || []).forEach(function (station, index) {
      if (!station.location) return;
      var color = index === 0 ? '#22c55e' : '#3b82f6';
      var marker = L.circleMarker([station.location.lat, station.location.lng], {
        radius: index === 0 ? 12 : 8, fillColor: color, color: '#fff', weight: 2, opacity: 1, fillOpacity: 0.9
      }).addTo(map);
      marker.bindPopup('<b>' + Render.escapeHtml(station.name) + '</b><br><span style="font-size:18px;font-weight:bold;color:' + (index === 0 ? '#16a34a' : '#1e40af') + '">$' + station.diesel_price.toFixed(2) + '</span><br><small>' + (station.distance_miles ? station.distance_miles.toFixed(1) : '?') + ' miles away</small>');
      fuelMarkers.push(marker);
    });
  }

  function navigateToFuel(lat, lng) {
    window.open('https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lng, '_blank');
  }

  function calculateRouteSavings(stationId) {
    var station = currentFuelResults.find(function (s) { return s._id === stationId; });
    if (!station) return;

    var modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
    modal.id = 'savings-modal';
    modal.onclick = function (e) { if (e.target === modal) modal.remove(); };
    modal.innerHTML =
      '<div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">' +
        '<div class="flex justify-between items-start mb-4">' +
          '<h3 class="font-black text-xl text-slate-900">Fuel Savings Calculator</h3>' +
          '<button onclick="document.getElementById(\'savings-modal\').remove()" class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark text-xl"></i></button>' +
        '</div>' +
        '<div class="space-y-4">' +
          '<div class="bg-green-50 border border-green-200 rounded-xl p-4">' +
            '<p class="text-xs font-black text-green-500 uppercase mb-1">Selected Station</p>' +
            '<p class="font-bold text-slate-900">' + Render.escapeHtml(station.name) + '</p>' +
            '<p class="text-2xl font-black text-green-700">$' + station.diesel_price.toFixed(2) + '/gal</p>' +
          '</div>' +
          '<div><label class="text-xs font-black text-slate-500 uppercase mb-2 block">Gallons Needed</label>' +
            '<input type="number" id="gallons-input" value="100" min="1" max="500" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-lg focus:ring-2 focus:ring-lmdr-yellow/50 focus:outline-none">' +
          '</div>' +
          '<div class="grid grid-cols-2 gap-3">' +
            '<div class="bg-slate-50 rounded-xl p-3"><p class="text-[10px] font-black text-slate-400 uppercase">State Avg</p><p class="text-lg font-black text-slate-700">$3.89/gal</p></div>' +
            '<div class="bg-green-50 rounded-xl p-3"><p class="text-[10px] font-black text-green-500 uppercase">You Save</p><p class="text-lg font-black text-green-700" id="savings-display">$' + ((3.89 - station.diesel_price) * 100).toFixed(2) + '</p></div>' +
          '</div>' +
          '<button onclick="navigateToFuel(\'' + (station.location ? station.location.lat : '') + '\', \'' + (station.location ? station.location.lng : '') + '\')" class="w-full bg-lmdr-yellow text-slate-900 font-black py-3 rounded-xl hover:shadow-lg transition-all"><i class="fa-solid fa-diamond-turn-right mr-2"></i>NAVIGATE TO STATION</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
    Render.animateModal(modal.firstElementChild, true);

    var gallonsInput = document.getElementById('gallons-input');
    var savingsDisplay = document.getElementById('savings-display');
    gallonsInput.addEventListener('input', function () {
      var gallons = parseFloat(gallonsInput.value) || 0;
      savingsDisplay.textContent = '$' + ((3.89 - station.diesel_price) * gallons).toFixed(2);
    });
  }

  function openAddCardModal() {
    var modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4';
    modal.id = 'add-card-modal';
    modal.onclick = function (e) { if (e.target === modal) modal.remove(); };
    modal.innerHTML =
      '<div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">' +
        '<div class="flex justify-between items-start mb-4">' +
          '<h3 class="font-black text-xl text-slate-900">Add Fuel Card</h3>' +
          '<button onclick="document.getElementById(\'add-card-modal\').remove()" class="text-slate-400 hover:text-slate-600"><i class="fa-solid fa-xmark text-xl"></i></button>' +
        '</div>' +
        '<div class="space-y-4">' +
          '<div><label class="text-xs font-black text-slate-500 uppercase mb-2 block">Card Provider</label>' +
            '<select id="card-provider" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-lmdr-yellow/50 focus:outline-none">' +
              '<option value="comdata">Comdata</option><option value="efs">EFS (Electronic Funds Source)</option><option value="tchek">T-Chek</option><option value="fleetone">Fleet One</option><option value="wex">WEX</option>' +
            '</select>' +
          '</div>' +
          '<div><label class="text-xs font-black text-slate-500 uppercase mb-2 block">Card Number (Last 4 Digits)</label>' +
            '<input type="text" id="card-last4" maxlength="4" pattern="[0-9]{4}" placeholder="1234" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-lg tracking-widest focus:ring-2 focus:ring-lmdr-yellow/50 focus:outline-none">' +
          '</div>' +
          '<div><label class="text-xs font-black text-slate-500 uppercase mb-2 block">Nickname (Optional)</label>' +
            '<input type="text" id="card-nickname" placeholder="My Fleet Card" class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-lmdr-yellow/50 focus:outline-none">' +
          '</div>' +
          '<div class="bg-blue-50 border border-blue-200 rounded-xl p-3"><p class="text-xs text-blue-700"><i class="fa-solid fa-info-circle mr-1"></i> Adding your fuel card lets us show you discounted prices at participating locations.</p></div>' +
          '<button onclick="submitFuelCard()" class="w-full bg-lmdr-yellow text-slate-900 font-black py-3 rounded-xl hover:shadow-lg transition-all"><i class="fa-solid fa-plus mr-2"></i>ADD CARD</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
    Render.animateModal(modal.firstElementChild, true);
  }

  function submitFuelCard() {
    var provider = document.getElementById('card-provider').value;
    var last4 = document.getElementById('card-last4').value;
    var nickname = document.getElementById('card-nickname').value;

    if (!last4 || last4.length !== 4) {
      Render.showToast('Please enter the last 4 digits of your card.', 'error');
      return;
    }

    Bridge.linkFuelCard({
      cardType: provider,
      cardLast4: last4,
      nickname: nickname || (provider.charAt(0).toUpperCase() + provider.slice(1) + ' Card')
    });

    var modalEl = document.getElementById('add-card-modal');
    if (modalEl) modalEl.remove();

    var select = document.getElementById('fuel-card-select');
    var option = document.createElement('option');
    option.value = provider;
    option.textContent = provider.charAt(0).toUpperCase() + provider.slice(1) + ' (**** ' + last4 + ')';
    option.selected = true;
    select.appendChild(option);

    doSearchFuel();
  }

  function updateFuelCardDropdown(cards) {
    cards = cards || [];
    var select = document.getElementById('fuel-card-select');
    if (!select) return;
    select.innerHTML = '<option value="none">No Card (Retail Price)</option>';
    cards.forEach(function (card) {
      var option = document.createElement('option');
      option.value = card.card_type;
      option.textContent = (card.nickname || card.card_type) + ' (**** ' + card.card_last4 + ')';
      select.appendChild(option);
    });
    if (cards.length > 0) select.value = cards[0].card_type;
  }

  /* ==========================================
     WEIGH STATIONS
     ========================================== */
  function doSearchWeighStations() {
    var loadingEl = document.getElementById('weighstation-loading');
    var resultsEl = document.getElementById('weighstation-results');
    var emptyEl = document.getElementById('weighstation-empty');

    if (loadingEl) loadingEl.classList.remove('hidden');
    if (resultsEl) resultsEl.innerHTML = '';
    if (emptyEl) emptyEl.classList.add('hidden');

    var state = document.getElementById('weighstation-state').value;
    var prepass = document.getElementById('prepass-checkbox').checked;
    var drivewyze = document.getElementById('drivewyze-checkbox').checked;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function (pos) { sendWeighStationSearch(pos.coords.latitude, pos.coords.longitude, state, { prepass: prepass, drivewyze: drivewyze }); },
        function () { sendWeighStationSearch(Config.DEFAULT_COORDS.lat, Config.DEFAULT_COORDS.lng, state, { prepass: prepass, drivewyze: drivewyze }); }
      );
    } else {
      sendWeighStationSearch(Config.DEFAULT_COORDS.lat, Config.DEFAULT_COORDS.lng, state, { prepass: prepass, drivewyze: drivewyze });
    }
  }

  function sendWeighStationSearch(lat, lng, state, bypassServices) {
    Bridge.searchWeighStations(lat, lng, 100, state, bypassServices);
  }

  function useMyLocationForScales() {
    var loadingEl = document.getElementById('weighstation-loading');
    if (!navigator.geolocation) {
      Render.showToast('Geolocation is not supported by your browser', 'error');
      return;
    }
    if (loadingEl) loadingEl.classList.remove('hidden');

    navigator.geolocation.getCurrentPosition(
      function (pos) {
        var state = document.getElementById('weighstation-state').value;
        var prepass = document.getElementById('prepass-checkbox').checked;
        var drivewyze = document.getElementById('drivewyze-checkbox').checked;
        sendWeighStationSearch(pos.coords.latitude, pos.coords.longitude, state, { prepass: prepass, drivewyze: drivewyze });
      },
      function () {
        if (loadingEl) loadingEl.classList.add('hidden');
        Render.showToast('Unable to get your location. Please try selecting a state instead.', 'error');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }

  function handleWeighStationResults(items) {
    weighStationDataLoaded = true;
    currentWeighStationResults = items || [];
    var container = document.getElementById('weighstation-results');
    var prepass = document.getElementById('prepass-checkbox').checked;
    var drivewyze = document.getElementById('drivewyze-checkbox').checked;
    Render.renderWeighStationCards(items, container, prepass, drivewyze);
  }

  function navigateToStation(lat, lng) {
    if (!lat || !lng) return;
    var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    var url = isIOS
      ? 'maps://maps.apple.com/?daddr=' + lat + ',' + lng
      : 'https://www.google.com/maps/dir/?api=1&destination=' + lat + ',' + lng;
    window.open(url, '_blank');
  }

  /* ==========================================
     STATION REPORT MODAL
     ========================================== */
  function openReportModal(stationId, stationName) {
    currentReportStationId = stationId || null;
    selectedReportType = null;
    selectedReportDetails = [];

    var nameEl = document.getElementById('report-station-name');
    if (nameEl) nameEl.textContent = stationName || '';
    var waitEl = document.getElementById('wait-time-select');
    if (waitEl) waitEl.value = '';

    document.querySelectorAll('.report-type-btn').forEach(function (btn) {
      btn.classList.remove('ring-2', 'ring-offset-2', 'ring-lmdr-yellow');
    });
    document.querySelectorAll('.report-detail-btn').forEach(function (btn) {
      btn.classList.remove('bg-lmdr-yellow', 'text-slate-900');
      btn.classList.add('bg-slate-100', 'text-slate-600');
    });

    var modal = document.getElementById('report-modal');
    modal.classList.remove('hidden');
    Render.animateModal(modal.querySelector('.bg-white'), true);
  }

  function closeReportModal() {
    var modal = document.getElementById('report-modal');
    var inner = modal.querySelector('.bg-white');
    if (typeof gsap !== 'undefined') {
      gsap.to(inner, {
        scale: 0.9, opacity: 0, duration: 0.2, ease: 'power2.in',
        onComplete: function () { modal.classList.add('hidden'); currentReportStationId = null; }
      });
    } else {
      modal.classList.add('hidden');
      currentReportStationId = null;
    }
  }

  function selectReportType(type) {
    selectedReportType = type;
    document.querySelectorAll('.report-type-btn').forEach(function (btn) {
      if (btn.dataset.type === type) {
        btn.classList.add('ring-2', 'ring-offset-2', 'ring-lmdr-yellow');
      } else {
        btn.classList.remove('ring-2', 'ring-offset-2', 'ring-lmdr-yellow');
      }
    });
  }

  function toggleReportDetail(detail) {
    var btn = document.querySelector('.report-detail-btn[data-detail="' + detail + '"]');
    var idx = selectedReportDetails.indexOf(detail);
    if (idx > -1) {
      selectedReportDetails.splice(idx, 1);
      btn.classList.remove('bg-lmdr-yellow', 'text-slate-900');
      btn.classList.add('bg-slate-100', 'text-slate-600');
    } else {
      selectedReportDetails.push(detail);
      btn.classList.add('bg-lmdr-yellow', 'text-slate-900');
      btn.classList.remove('bg-slate-100', 'text-slate-600');
    }
  }

  function submitStationReport() {
    if (!selectedReportType) {
      Render.showToast('Please select whether the station is open or closed.', 'error');
      return;
    }
    if (!currentReportStationId) {
      Render.showToast('Error: No station selected.', 'error');
      return;
    }
    var waitMinutes = document.getElementById('wait-time-select').value;
    Bridge.reportStationStatus({
      stationId: currentReportStationId,
      reportType: selectedReportType,
      waitMinutes: waitMinutes ? parseInt(waitMinutes) : null,
      details: selectedReportDetails
    });
    closeReportModal();
  }

  function saveBypassPreferences() {
    var prepass = document.getElementById('prepass-checkbox').checked;
    var drivewyze = document.getElementById('drivewyze-checkbox').checked;
    driverBypassServices = { prepass: prepass, drivewyze: drivewyze };
    Bridge.saveDriverBypassServices({ prepass: prepass, drivewyze: drivewyze });
    if (currentWeighStationResults.length > 0) {
      handleWeighStationResults(currentWeighStationResults);
    }
  }

  function updateBypassCheckboxes(services) {
    if (!services) return;
    driverBypassServices = services;
    var pp = document.getElementById('prepass-checkbox');
    var dw = document.getElementById('drivewyze-checkbox');
    if (pp) pp.checked = services.prepass || false;
    if (dw) dw.checked = services.drivewyze || false;
  }

  /* ==========================================
     REVIEWS
     ========================================== */
  function openReviewModal() {
    var modal = document.getElementById('review-modal');
    if (modal) modal.classList.remove('hidden');
    var input = document.getElementById('review-photo-input');
    if (input) {
      input.value = '';
      input.onchange = handleReviewPhotoChange;
    }
    setReviewRating(5);
  }

  function closeReviewModal() {
    var modal = document.getElementById('review-modal');
    if (modal) modal.classList.add('hidden');
  }

  function setReviewRating(rating) {
    selectedReviewRating = rating;
    var stars = document.querySelectorAll('#review-stars i');
    stars.forEach(function (star, index) {
      star.className = index < rating ? 'fa-solid fa-star text-lmdr-yellow' : 'fa-solid fa-star text-slate-300';
    });
  }

  function handleReviewPhotoChange(event) {
    var files = Array.from(event.target.files || []).slice(0, 4);
    pendingReviewPhotos = [];
    files.forEach(function (file) {
      var reader = new FileReader();
      reader.onload = function () { pendingReviewPhotos.push(reader.result); };
      reader.readAsDataURL(file);
    });
  }

  function submitReviewForm() {
    var reviewText = (document.getElementById('review-text') ? document.getElementById('review-text').value : '').trim();
    if (!reviewText) {
      Render.showToast('Please add review notes', 'error');
      return;
    }
    if (!navigator.geolocation) {
      Render.showToast('Location access is required for verified reviews', 'error');
      return;
    }
    navigator.geolocation.getCurrentPosition(function (position) {
      Bridge.submitReview('current', {
        overall_rating: selectedReviewRating,
        text: reviewText,
        ratings: { overall: selectedReviewRating },
        photos: pendingReviewPhotos,
        userLocation: { lat: position.coords.latitude, lng: position.coords.longitude }
      });
      closeReviewModal();
    }, function () {
      Render.showToast('Unable to verify your GPS location', 'error');
    }, { enableHighAccuracy: true, timeout: 10000 });
  }

  function loadTopRated() {
    var loadingEl = document.getElementById('ratings-loading');
    if (loadingEl) loadingEl.classList.remove('hidden');
    setTimeout(function () {
      Bridge.getReviews('all', { sort: 'rating' });
      if (loadingEl) loadingEl.classList.add('hidden');
    }, 500);
  }

  function searchReviews() {
    /* placeholder */
  }

  function showRestStopReportModal() {
    var modal = document.getElementById('rest-stop-report-modal');
    if (modal) modal.classList.remove('hidden');
  }

  function closeRestStopReportModal() {
    var modal = document.getElementById('rest-stop-report-modal');
    if (modal) modal.classList.add('hidden');
  }

  function submitCondition(type, details) {
    Bridge.reportCondition('current', { type: type, details: details });
    closeRestStopReportModal();
    Render.showToast('Report submitted', 'success');
  }

  function doReportCondition() {
    openReportModal();
  }

  /* ==========================================
     WEATHER & CONDITIONS
     ========================================== */
  function refreshWeather() {
    var list = document.getElementById('chain-laws-list');
    if (list) list.innerHTML = '<div class="text-center py-4"><i class="fa-solid fa-circle-notch fa-spin"></i> Loading...</div>';

    var routePoints = [{ lat: 39.31, lng: -120.33 }, { lat: 39.5, lng: -120.5 }];
    if (window.demoWeather === 'ACTIVE') {
      routePoints = [{ lat: 35.14, lng: -90.04 }, { lat: 35.2, lng: -90.0 }];
      var alertsContainer = document.getElementById('weather-alerts-container');
      if (alertsContainer) alertsContainer.innerHTML += '<div class="text-xs text-center text-blue-500 mb-2">Fetching LIVE data from National Weather Service...</div>';
    }

    Bridge.getWeather(routePoints);

    if (window.parent === window) {
      setTimeout(function () {
        Render.renderChainLaws([
          { name: 'Donner Pass (I-80)', status: 'Requirement 1 (Chains Required)', color: 'red' },
          { name: 'Snoqualmie Pass (I-90)', status: 'Clear', color: 'green' }
        ]);
        Render.renderAlerts([]);
      }, 1000);
    }
  }

  function refreshConditions() {
    var list = document.getElementById('conditions-list');
    if (list) list.innerHTML = '<div class="text-center py-8 text-slate-400"><i class="fa-solid fa-circle-notch fa-spin text-2xl mb-2"></i><p>Checking road conditions...</p></div>';

    var routePoints = [{ lat: 39.31, lng: -120.33 }];
    if (window.demoMode === 'IA') {
      routePoints = [{ lat: 41.6, lng: -93.6 }, { lat: 42.0, lng: -93.6 }];
    }

    Bridge.getRoadConditions(routePoints);

    if (window.parent === window) {
      setTimeout(function () {
        var mockData = {
          conditions: [
            { type: 'closure', highway: 'I-80', location: { lat: 0, lng: 0 }, description: 'Westbound closed due to spin-outs.', severity: 'major', delay_minutes: 120 },
            { type: 'construction', highway: 'I-5', location: { lat: 0, lng: 0 }, description: 'Bridge work. 1 lane open.', severity: 'moderate', delay_minutes: 20 }
          ],
          summary: { total_incidents: 2, total_delay_minutes: 140, counts: { closure: 1, construction: 1 } }
        };
        Render.renderConditions(mockData.conditions);
        Render.renderConditionSummary(mockData.summary);
      }, 800);
    }
  }

  function saveWeatherPreferences() {
    var alertTypes = [];
    if (document.getElementById('pref-type-severe') && document.getElementById('pref-type-severe').checked) alertTypes.push('severe_weather');
    if (document.getElementById('pref-type-winter') && document.getElementById('pref-type-winter').checked) alertTypes.push('winter');
    if (document.getElementById('pref-type-wind') && document.getElementById('pref-type-wind').checked) alertTypes.push('wind');
    if (document.getElementById('pref-type-flood') && document.getElementById('pref-type-flood').checked) alertTypes.push('flood');

    Bridge.subscribeAlerts({
      alert_types: alertTypes,
      min_severity: (document.getElementById('pref-min-severity') ? document.getElementById('pref-min-severity').value : 'moderate'),
      push_enabled: true,
      email_enabled: true
    });
  }

  /* ==========================================
     TRUCK SPECS / RESTRICTIONS
     ========================================== */
  function bindTruckSpecListeners() {
    ['spec-height', 'spec-weight', 'spec-hazmat'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('change', updateTruckRestrictions);
    });
  }

  function updateTruckRestrictions() {
    var height = parseFloat(document.getElementById('spec-height').value) || 13.5;
    var weight = parseFloat(document.getElementById('spec-weight').value) || 80;
    var hazmat = document.getElementById('spec-hazmat').checked;
    var routePoints = window.currentRoute || [{ lat: 39.31, lng: -120.33 }, { lat: 39.5, lng: -120.5 }];

    if (window.demoMode === 'IA') {
      routePoints = [{ lat: 41.6, lng: -93.6 }];
    }

    Bridge.getTruckRestrictions(routePoints, { height: height, weight: weight, hazmat: hazmat });
  }

  /* ==========================================
     STANDALONE DEBUG MODE
     ========================================== */
  function setupStandaloneDebug() {
    console.warn('Running in standalone mode - Simulating Backend Data');

    setTimeout(function () {
      updateFuelCardDropdown([
        { card_type: 'comdata', card_last4: '4521', nickname: 'Comdata' },
        { card_type: 'efs', card_last4: '8892', nickname: 'EFS' }
      ]);
      updateBypassCheckboxes({ prepass: true, drivewyze: false });
    }, 500);

    setTimeout(function () {
      handleParkingResults([
        { _id: '1', name: 'Loves Travel Stop #452', available_spaces: 12, total_spaces: 80, distance_miles: 2.4, address: { city: 'Memphis', state: 'TN' }, amenities: ['shower', 'food', 'wifi'], location: { lat: 35.1495, lng: -90.0490 }, data_confidence: 'sensor' },
        { _id: '2', name: 'Pilot Travel Center', available_spaces: 5, total_spaces: 120, distance_miles: 15.1, address: { city: 'West Memphis', state: 'AR' }, amenities: ['shower', 'fuel'], location: { lat: 35.1595, lng: -90.1490 }, data_confidence: 'reported' },
        { _id: '3', name: 'Rest Area I-40', available_spaces: 0, total_spaces: 25, distance_miles: 34.2, address: { city: 'Arlington', state: 'TN' }, amenities: [], location: { lat: 35.2495, lng: -89.9490 } }
      ]);
    }, 800);

    window.addEventListener('message', function (event) {
      if (event.source !== window) return;
      var msg = event.data || {};

      if (msg.type === 'searchFuel') {
        setTimeout(function () {
          handleFuelResults([
            { _id: 'f1', name: 'Speedway', diesel_price: 3.45, savings: 0.44, distance_miles: 1.2, brand: 'Speedway', address: '123 Main St', has_def: true, location: { lat: 35.14, lng: -90.05 } },
            { _id: 'f2', name: 'Maverick', diesel_price: 3.52, savings: 0.37, distance_miles: 3.5, brand: 'Maverick', address: '456 Oak Ave', has_scales: true, location: { lat: 35.12, lng: -90.03 } },
            { _id: 'f3', name: 'Chevron', diesel_price: 3.89, savings: 0.00, distance_miles: 0.5, brand: 'Chevron', address: '789 Pine Ln', location: { lat: 35.15, lng: -90.05 } }
          ]);
        }, 1000);
      }

      if (msg.type === 'searchWeighStations') {
        setTimeout(function () {
          handleWeighStationResults([
            { _id: 'ws1', name: 'I-40 Weigh Station', state: 'TN', highway: 'I-40', direction: 'EB', mile_marker: 125, status: 'open', status_confidence: 'sensor', prepass_enabled: true, prepass_bypass_rate: 82, drivewyze_enabled: true, drivewyze_bypass_rate: 78, distance_miles: 5.2, location: { lat: 35.15, lng: -90.05 }, last_status_update: new Date().toISOString() },
            { _id: 'ws2', name: 'I-55 Scale House', state: 'TN', highway: 'I-55', direction: 'SB', mile_marker: 12, status: 'closed', status_confidence: 'reported', prepass_enabled: true, prepass_bypass_rate: 75, drivewyze_enabled: false, distance_miles: 12.8, location: { lat: 35.08, lng: -90.12 }, wait_estimate: 15, report_count: 3, last_status_update: new Date(Date.now() - 1800000).toISOString() },
            { _id: 'ws3', name: 'Arkansas Welcome Center Scale', state: 'AR', highway: 'I-40', direction: 'WB', mile_marker: 280, status: 'unknown', status_confidence: 'historical', prepass_enabled: false, drivewyze_enabled: true, drivewyze_bypass_rate: 68, distance_miles: 18.5, location: { lat: 35.16, lng: -90.25 } }
          ]);
        }, 1000);
      }

      if (msg.type === 'reportStationStatus') {
        setTimeout(function () {
          window.postMessage({ type: 'stationStatusResult', data: { success: true } }, '*');
        }, 500);
      }
    });
  }

  return {
    init: init,
    switchTab: switchTab
  };
})();
