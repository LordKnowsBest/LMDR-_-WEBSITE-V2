/**
 * dos-view-road.js
 * Road Utilities view — Parking, Fuel, Weather, Rest Areas, Weigh Stations.
 * Horizontal tool pills, search input, result list with distance.
 */
(function () {
  'use strict';
  window.DOS = window.DOS || {};
  DOS.viewModules = DOS.viewModules || {};

  var TOOLS = [
    { id: 'parking',        label: 'Parking',        icon: 'local_parking',   action: 'searchParking' },
    { id: 'fuel',           label: 'Fuel',           icon: 'local_gas_station', action: 'searchFuel' },
    { id: 'weather',        label: 'Weather',        icon: 'cloud',           action: 'getWeather' },
    { id: 'rest-areas',     label: 'Rest Areas',     icon: 'hotel',           action: 'searchParking' },
    { id: 'weigh-stations', label: 'Weigh Stations', icon: 'scale',           action: 'searchWeighStations' }
  ];

  var RESULT_ACTIONS = {
    'parking': 'parkingResults',
    'fuel': 'fuelResults',
    'weather': 'weatherData',
    'rest-areas': 'parkingResults',
    'weigh-stations': 'weighStationResults'
  };

  DOS.viewModules['road'] = {
    _listeners: [],
    _activeTool: 'parking',
    _query: '',
    _results: [],
    _loading: false,
    _root: null,
    _listEl: null,
    _pillsContainer: null,

    mount: function (root) {
      while (root.firstChild) root.removeChild(root.firstChild);
      this._root = root;
      this._results = [];
      this._loading = false;
      this._activeTool = 'parking';

      var container = document.createElement('div');
      container.className = 'dos-container';
      container.style.paddingTop = '16px';

      // Header
      var heading = document.createElement('h1');
      heading.className = 'dos-text-heading';
      heading.textContent = 'Road Utilities';
      heading.style.marginBottom = '12px';
      container.appendChild(heading);

      // Search input
      var searchWrap = document.createElement('div');
      searchWrap.style.cssText = 'position:relative;margin-bottom:12px;';
      var searchIcon = document.createElement('span');
      searchIcon.className = 'material-symbols-outlined';
      searchIcon.textContent = 'search';
      searchIcon.style.cssText = 'position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#94a3b8;font-size:20px;';
      var searchInput = document.createElement('input');
      searchInput.className = 'dos-input';
      searchInput.type = 'text';
      searchInput.placeholder = 'Search by location or ZIP...';
      searchInput.style.paddingLeft = '40px';
      searchWrap.appendChild(searchIcon);
      searchWrap.appendChild(searchInput);
      container.appendChild(searchWrap);

      var self = this;
      var searchHandler = function () {
        self._query = searchInput.value.trim();
        if (self._query.length >= 2) {
          self._fetchResults();
        }
      };
      searchInput.addEventListener('input', debounce(searchHandler, 400));
      this._listeners.push({ el: searchInput, type: 'input', fn: searchHandler });

      // Tool pills
      var pillRow = document.createElement('div');
      pillRow.className = 'dos-scroll-row';
      pillRow.style.marginBottom = '16px';
      this._pillsContainer = pillRow;

      for (var i = 0; i < TOOLS.length; i++) {
        var pill = this._createPill(TOOLS[i]);
        pillRow.appendChild(pill);
      }
      container.appendChild(pillRow);

      // Result list
      var listEl = document.createElement('div');
      listEl.className = 'dos-grid';
      this._listEl = listEl;
      container.appendChild(listEl);

      root.appendChild(container);

      // Show skeleton and fetch initial
      this._showSkeleton();
      this._fetchResults();
    },

    _createPill: function (tool) {
      var self = this;
      var pill = document.createElement('button');
      pill.className = 'dos-chip ' + (tool.id === this._activeTool ? 'dos-chip-amber' : 'dos-chip-gray');
      pill.style.cssText = 'cursor:pointer;border:none;white-space:nowrap;flex-shrink:0;min-height:40px;';
      pill.setAttribute('data-tool', tool.id);

      var icon = document.createElement('span');
      icon.className = 'material-symbols-outlined';
      icon.textContent = tool.icon;
      icon.style.fontSize = '18px';

      var label = document.createElement('span');
      label.textContent = tool.label;

      pill.appendChild(icon);
      pill.appendChild(label);

      var handler = function () {
        self._activeTool = tool.id;
        self._updatePillStates();
        self._results = [];
        self._showSkeleton();
        self._fetchResults();
      };
      pill.addEventListener('click', handler);
      this._listeners.push({ el: pill, type: 'click', fn: handler });

      return pill;
    },

    _updatePillStates: function () {
      if (!this._pillsContainer) return;
      var pills = this._pillsContainer.children;
      for (var i = 0; i < pills.length; i++) {
        var toolId = pills[i].getAttribute('data-tool');
        pills[i].className = 'dos-chip ' + (toolId === this._activeTool ? 'dos-chip-amber' : 'dos-chip-gray');
        pills[i].style.cssText = 'cursor:pointer;border:none;white-space:nowrap;flex-shrink:0;min-height:40px;';
      }
    },

    _fetchResults: function () {
      this._loading = true;
      var tool = null;
      for (var i = 0; i < TOOLS.length; i++) {
        if (TOOLS[i].id === this._activeTool) { tool = TOOLS[i]; break; }
      }
      if (!tool || !DOS.bridge) return;

      var payload = { toolType: this._activeTool };
      if (this._query) payload.query = this._query;
      // Default coordinates (placeholder — bridge fills in real geolocation)
      payload.lat = 39.8283;
      payload.lng = -98.5795;
      payload.radius = 50;

      DOS.bridge.send(tool.action, payload);
    },

    _showSkeleton: function () {
      if (!this._listEl) return;
      while (this._listEl.firstChild) this._listEl.removeChild(this._listEl.firstChild);
      for (var i = 0; i < 4; i++) {
        var skel = document.createElement('div');
        skel.className = 'dos-card dos-skeleton';
        skel.style.height = '88px';
        this._listEl.appendChild(skel);
      }
    },

    _renderResults: function () {
      if (!this._listEl) return;
      while (this._listEl.firstChild) this._listEl.removeChild(this._listEl.firstChild);
      this._loading = false;

      if (!this._results || this._results.length === 0) {
        var empty = document.createElement('div');
        empty.className = 'dos-empty';
        var emptyIcon = document.createElement('span');
        emptyIcon.className = 'material-symbols-outlined';
        emptyIcon.textContent = 'explore_off';
        var emptyText = document.createElement('p');
        emptyText.className = 'dos-text-body';
        emptyText.textContent = 'No results found. Try a different location.';
        empty.appendChild(emptyIcon);
        empty.appendChild(emptyText);
        this._listEl.appendChild(empty);
        return;
      }

      for (var i = 0; i < this._results.length; i++) {
        this._listEl.appendChild(this._renderResultCard(this._results[i]));
      }
    },

    _renderResultCard: function (item) {
      var card = document.createElement('div');
      card.className = 'dos-card-interactive';
      card.style.cssText = 'display:flex;align-items:center;gap:12px;';

      var iconWrap = document.createElement('div');
      iconWrap.style.cssText = 'width:44px;height:44px;border-radius:10px;background:#fef3c7;display:flex;align-items:center;justify-content:center;flex-shrink:0;';
      var icon = document.createElement('span');
      icon.className = 'material-symbols-outlined';
      icon.style.cssText = 'font-size:22px;color:#92400e;';
      var toolDef = null;
      for (var t = 0; t < TOOLS.length; t++) {
        if (TOOLS[t].id === this._activeTool) { toolDef = TOOLS[t]; break; }
      }
      icon.textContent = toolDef ? toolDef.icon : 'place';
      iconWrap.appendChild(icon);

      var info = document.createElement('div');
      info.style.cssText = 'flex:1;min-width:0;';

      var name = document.createElement('div');
      name.className = 'dos-text-body';
      name.style.cssText = 'font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
      name.textContent = item.name || item.title || 'Unknown';

      var addr = document.createElement('div');
      addr.className = 'dos-text-small';
      addr.style.cssText = 'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
      addr.textContent = item.address || item.location || '';

      info.appendChild(name);
      info.appendChild(addr);

      // Distance badge
      var distBadge = document.createElement('div');
      distBadge.style.cssText = 'flex-shrink:0;text-align:right;';
      var dist = document.createElement('div');
      dist.className = 'dos-text-body';
      dist.style.fontWeight = '700';
      dist.textContent = item.distance ? item.distance + ' mi' : '--';
      var status = document.createElement('div');
      status.className = 'dos-text-small';
      status.textContent = item.status || '';
      distBadge.appendChild(dist);
      distBadge.appendChild(status);

      card.appendChild(iconWrap);
      card.appendChild(info);
      card.appendChild(distBadge);

      // Tap for details
      var self = this;
      var detailHandler = function () {
        if (item.id || item.locationId) {
          DOS.bridge.send('getParkingDetails', { locationId: item.id || item.locationId });
        }
      };
      card.addEventListener('click', detailHandler);
      this._listeners.push({ el: card, type: 'click', fn: detailHandler });

      return card;
    },

    unmount: function () {
      this._listeners.forEach(function (l) { l.el.removeEventListener(l.type, l.fn); });
      this._listeners = [];
      this._listEl = null;
      this._pillsContainer = null;
      this._root = null;
    },

    onMessage: function (action, payload) {
      if (action === 'parkingResults') {
        this._results = payload.locations || [];
        this._renderResults();
      } else if (action === 'fuelResults') {
        this._results = payload.stations || [];
        this._renderResults();
      } else if (action === 'weatherData') {
        this._results = payload.forecast || [];
        this._renderResults();
      } else if (action === 'weighStationResults') {
        this._results = payload.stations || [];
        this._renderResults();
      } else if (action === 'roadConditionsData') {
        this._results = payload.conditions || [];
        this._renderResults();
      } else if (action === 'parkingDetailsLoaded') {
        this._showDetailOverlay(payload.location || {});
      }
    },

    _showDetailOverlay: function (loc) {
      if (!this._root) return;
      var overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:60;display:flex;align-items:flex-end;';

      var sheet = document.createElement('div');
      sheet.style.cssText = 'background:#fff;border-radius:16px 16px 0 0;padding:24px 16px;width:100%;max-height:70vh;overflow-y:auto;';

      var title = document.createElement('h2');
      title.className = 'dos-text-subheading';
      title.textContent = loc.name || 'Location Details';
      title.style.marginBottom = '8px';
      sheet.appendChild(title);

      var addr = document.createElement('p');
      addr.className = 'dos-text-body';
      addr.textContent = loc.address || '';
      sheet.appendChild(addr);

      if (loc.amenities && loc.amenities.length > 0) {
        var amenRow = document.createElement('div');
        amenRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-top:12px;';
        for (var a = 0; a < loc.amenities.length; a++) {
          var chip = document.createElement('span');
          chip.className = 'dos-chip dos-chip-blue';
          chip.textContent = loc.amenities[a];
          amenRow.appendChild(chip);
        }
        sheet.appendChild(amenRow);
      }

      var closeBtn = document.createElement('button');
      closeBtn.className = 'dos-btn-primary';
      closeBtn.textContent = 'Close';
      closeBtn.style.cssText = 'width:100%;margin-top:20px;';
      var closeHandler = function () { overlay.remove(); };
      closeBtn.addEventListener('click', closeHandler);
      this._listeners.push({ el: closeBtn, type: 'click', fn: closeHandler });

      overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });

      sheet.appendChild(closeBtn);
      overlay.appendChild(sheet);
      this._root.appendChild(overlay);
    },

    getSnapshot: function () {
      return { activeTool: this._activeTool, query: this._query, resultCount: this._results.length };
    }
  };

  function debounce(fn, ms) {
    var timer;
    return function () {
      clearTimeout(timer);
      timer = setTimeout(fn, ms);
    };
  }
})();
