/**
 * dos-view-matching.js
 * DriverOS Discovery & Matching view.
 * Search form + carrier match result cards.
 */
(function () {
  'use strict';
  window.DOS = window.DOS || {};
  DOS.viewModules = DOS.viewModules || {};

  var CDL_CLASSES = ['Any', 'Class A', 'Class B', 'Class C'];
  var ENDORSEMENTS = ['Hazmat', 'Tanker', 'Doubles/Triples', 'Passenger', 'School Bus'];
  var state = { results: [], loading: false, filters: {} };

  function icon(name) {
    var s = document.createElement('span');
    s.className = 'material-symbols-outlined';
    s.textContent = name;
    s.style.fontSize = '20px';
    return s;
  }

  function skeleton(count) {
    var wrap = document.createElement('div');
    wrap.className = 'dos-grid';
    for (var i = 0; i < count; i++) {
      var sk = document.createElement('div');
      sk.className = 'dos-card dos-skeleton';
      sk.style.height = '160px';
      sk.style.background = 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)';
      sk.style.backgroundSize = '200% 100%';
      sk.style.animation = 'dosShimmer 1.5s infinite';
      wrap.appendChild(sk);
    }
    return wrap;
  }

  function buildSearchForm(self) {
    var form = document.createElement('div');
    form.className = 'dos-card';
    form.style.marginBottom = '12px';

    var title = document.createElement('h2');
    title.className = 'dos-text-subheading';
    title.textContent = 'Find Your Match';
    title.style.marginBottom = '12px';
    form.appendChild(title);

    // CDL Class
    var cdlLabel = document.createElement('label');
    cdlLabel.className = 'dos-text-small';
    cdlLabel.textContent = 'CDL Class';
    cdlLabel.style.display = 'block';
    cdlLabel.style.marginBottom = '4px';
    form.appendChild(cdlLabel);

    var cdlSelect = document.createElement('select');
    cdlSelect.className = 'dos-input';
    cdlSelect.style.marginBottom = '12px';
    CDL_CLASSES.forEach(function (c) {
      var opt = document.createElement('option');
      opt.value = c === 'Any' ? '' : c;
      opt.textContent = c;
      cdlSelect.appendChild(opt);
    });
    form.appendChild(cdlSelect);
    self._cdlSelect = cdlSelect;

    // Years Experience
    var expLabel = document.createElement('label');
    expLabel.className = 'dos-text-small';
    expLabel.textContent = 'Years Experience';
    expLabel.style.display = 'block';
    expLabel.style.marginBottom = '4px';
    form.appendChild(expLabel);

    var expInput = document.createElement('input');
    expInput.type = 'number';
    expInput.className = 'dos-input';
    expInput.placeholder = 'e.g. 3';
    expInput.min = '0';
    expInput.max = '50';
    expInput.style.marginBottom = '12px';
    form.appendChild(expInput);
    self._expInput = expInput;

    // Endorsements (chips)
    var endLabel = document.createElement('label');
    endLabel.className = 'dos-text-small';
    endLabel.textContent = 'Endorsements';
    endLabel.style.display = 'block';
    endLabel.style.marginBottom = '4px';
    form.appendChild(endLabel);

    var chipRow = document.createElement('div');
    chipRow.style.display = 'flex';
    chipRow.style.flexWrap = 'wrap';
    chipRow.style.gap = '8px';
    chipRow.style.marginBottom = '12px';
    self._selectedEndorsements = {};

    ENDORSEMENTS.forEach(function (e) {
      var chip = document.createElement('button');
      chip.className = 'dos-chip dos-chip-gray dos-touch-target';
      chip.textContent = e;
      chip.style.cursor = 'pointer';
      chip.setAttribute('aria-pressed', 'false');
      var handler = function () {
        self._selectedEndorsements[e] = !self._selectedEndorsements[e];
        if (self._selectedEndorsements[e]) {
          chip.className = 'dos-chip dos-chip-blue dos-touch-target';
          chip.setAttribute('aria-pressed', 'true');
        } else {
          chip.className = 'dos-chip dos-chip-gray dos-touch-target';
          chip.setAttribute('aria-pressed', 'false');
        }
      };
      chip.addEventListener('click', handler);
      self._listeners.push({ el: chip, type: 'click', fn: handler });
      chipRow.appendChild(chip);
    });
    form.appendChild(chipRow);

    // Preferred State
    var stateLabel = document.createElement('label');
    stateLabel.className = 'dos-text-small';
    stateLabel.textContent = 'Preferred State';
    stateLabel.style.display = 'block';
    stateLabel.style.marginBottom = '4px';
    form.appendChild(stateLabel);

    var stateInput = document.createElement('input');
    stateInput.type = 'text';
    stateInput.className = 'dos-input';
    stateInput.placeholder = 'e.g. TX, CA';
    stateInput.style.marginBottom = '16px';
    form.appendChild(stateInput);
    self._stateInput = stateInput;

    // Search button
    var btn = document.createElement('button');
    btn.className = 'dos-btn-primary dos-full-width';
    btn.textContent = 'Search Carriers';
    var searchHandler = function () { self._doSearch(); };
    btn.addEventListener('click', searchHandler);
    self._listeners.push({ el: btn, type: 'click', fn: searchHandler });
    form.appendChild(btn);
    self._searchBtn = btn;

    return form;
  }

  function buildResultCard(carrier, self) {
    var card = document.createElement('div');
    card.className = 'dos-card-interactive';
    card.style.marginBottom = '12px';

    // Header row
    var header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'flex-start';
    header.style.marginBottom = '8px';

    var name = document.createElement('h3');
    name.className = 'dos-text-subheading';
    name.textContent = carrier.carrierName || carrier.name || 'Unknown Carrier';
    name.style.flex = '1';
    name.style.marginRight = '8px';
    header.appendChild(name);

    if (carrier.matchScore !== undefined) {
      var badge = document.createElement('span');
      var score = Math.round(carrier.matchScore);
      badge.className = score >= 80 ? 'dos-chip dos-chip-green' : score >= 60 ? 'dos-chip dos-chip-amber' : 'dos-chip dos-chip-gray';
      badge.textContent = score + '% Match';
      header.appendChild(badge);
    }
    card.appendChild(header);

    // Info rows
    var infoGrid = document.createElement('div');
    infoGrid.style.display = 'grid';
    infoGrid.style.gridTemplateColumns = '1fr 1fr';
    infoGrid.style.gap = '6px';
    infoGrid.style.marginBottom = '12px';

    var infoPairs = [
      ['location', carrier.city && carrier.state ? carrier.city + ', ' + carrier.state : carrier.location || '--'],
      ['payments', carrier.payRange || carrier.avgPay || '--'],
      ['local_shipping', carrier.jobType || carrier.freightType || '--'],
      ['verified', 'DOT: ' + (carrier.dotNumber || carrier.dot || '--')]
    ];

    infoPairs.forEach(function (pair) {
      var row = document.createElement('div');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.gap = '4px';
      var ic = icon(pair[0]);
      ic.style.color = '#94a3b8';
      ic.style.fontSize = '16px';
      row.appendChild(ic);
      var txt = document.createElement('span');
      txt.className = 'dos-text-small';
      txt.textContent = pair[1];
      row.appendChild(txt);
      infoGrid.appendChild(row);
    });
    card.appendChild(infoGrid);

    // Action row
    var actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '8px';

    var detailBtn = document.createElement('button');
    detailBtn.className = 'dos-btn-secondary';
    detailBtn.style.flex = '1';
    detailBtn.style.padding = '10px 16px';
    detailBtn.textContent = 'View Details';
    var detailHandler = function () {
      DOS.bridge.send('getCarrierDetail', { carrierDot: carrier.dotNumber || carrier.dot });
    };
    detailBtn.addEventListener('click', detailHandler);
    self._listeners.push({ el: detailBtn, type: 'click', fn: detailHandler });
    actions.appendChild(detailBtn);

    var interestBtn = document.createElement('button');
    interestBtn.className = 'dos-btn-primary';
    interestBtn.style.flex = '1';
    interestBtn.style.padding = '10px 16px';
    interestBtn.textContent = "I'm Interested";
    var interestHandler = function () {
      DOS.bridge.send('logInterest', {
        carrierDOT: carrier.dotNumber || carrier.dot,
        carrierName: carrier.carrierName || carrier.name,
        matchScore: carrier.matchScore
      });
      interestBtn.textContent = 'Logged!';
      interestBtn.disabled = true;
      interestBtn.style.opacity = '0.6';
    };
    interestBtn.addEventListener('click', interestHandler);
    self._listeners.push({ el: interestBtn, type: 'click', fn: interestHandler });
    actions.appendChild(interestBtn);

    card.appendChild(actions);
    return card;
  }

  function buildEmptyState() {
    var empty = document.createElement('div');
    empty.className = 'dos-empty';
    var ic = icon('search');
    ic.style.fontSize = '48px';
    ic.style.marginBottom = '12px';
    ic.style.opacity = '0.5';
    empty.appendChild(ic);
    var msg = document.createElement('p');
    msg.className = 'dos-text-body';
    msg.textContent = 'Search for carriers to see your matches';
    empty.appendChild(msg);
    return empty;
  }

  DOS.viewModules['matching'] = {
    _listeners: [],
    _resultsContainer: null,
    _cdlSelect: null,
    _expInput: null,
    _stateInput: null,
    _searchBtn: null,
    _selectedEndorsements: {},

    mount: function (root) {
      var self = this;
      while (root.firstChild) root.removeChild(root.firstChild);

      var container = document.createElement('div');
      container.className = 'dos-container';
      container.style.paddingTop = '16px';
      container.style.paddingBottom = '100px';

      // Heading
      var heading = document.createElement('h1');
      heading.className = 'dos-text-heading';
      heading.textContent = 'Carrier Matching';
      heading.style.marginBottom = '16px';
      container.appendChild(heading);

      // Search form
      container.appendChild(buildSearchForm(self));

      // Results area
      var resultsContainer = document.createElement('div');
      resultsContainer.setAttribute('id', 'matching-results');
      self._resultsContainer = resultsContainer;
      container.appendChild(resultsContainer);

      // Show empty or previous results
      if (state.results.length > 0) {
        self._renderResults();
      } else {
        resultsContainer.appendChild(buildEmptyState());
      }

      root.appendChild(container);

      // Inject shimmer keyframes if not present
      if (!document.getElementById('dos-shimmer-style')) {
        var style = document.createElement('style');
        style.id = 'dos-shimmer-style';
        style.textContent = '@keyframes dosShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}';
        document.head.appendChild(style);
      }
    },

    unmount: function () {
      this._listeners.forEach(function (l) { l.el.removeEventListener(l.type, l.fn); });
      this._listeners = [];
      this._resultsContainer = null;
    },

    _doSearch: function () {
      var endorsements = [];
      var keys = Object.keys(this._selectedEndorsements);
      for (var i = 0; i < keys.length; i++) {
        if (this._selectedEndorsements[keys[i]]) endorsements.push(keys[i]);
      }

      state.filters = {
        cdlClass: this._cdlSelect ? this._cdlSelect.value : '',
        yearsExp: this._expInput ? Number(this._expInput.value) || undefined : undefined,
        endorsements: endorsements.length > 0 ? endorsements : undefined,
        preferredState: this._stateInput ? this._stateInput.value.trim() : ''
      };

      state.loading = true;
      if (this._resultsContainer) {
        while (this._resultsContainer.firstChild) this._resultsContainer.removeChild(this._resultsContainer.firstChild);
        this._resultsContainer.appendChild(skeleton(4));
      }
      if (this._searchBtn) {
        this._searchBtn.disabled = true;
        this._searchBtn.textContent = 'Searching...';
      }

      DOS.bridge.send('findMatches', state.filters);
    },

    _renderResults: function () {
      var self = this;
      if (!this._resultsContainer) return;
      while (this._resultsContainer.firstChild) this._resultsContainer.removeChild(this._resultsContainer.firstChild);

      if (state.results.length === 0) {
        var empty = document.createElement('div');
        empty.className = 'dos-empty';
        var ic = icon('search_off');
        ic.style.fontSize = '48px';
        ic.style.marginBottom = '12px';
        ic.style.opacity = '0.5';
        empty.appendChild(ic);
        var msg = document.createElement('p');
        msg.className = 'dos-text-body';
        msg.textContent = 'No carriers matched your criteria. Try broadening your search.';
        empty.appendChild(msg);
        this._resultsContainer.appendChild(empty);
        return;
      }

      var countLabel = document.createElement('p');
      countLabel.className = 'dos-text-small';
      countLabel.textContent = state.results.length + ' carriers found';
      countLabel.style.marginBottom = '12px';
      this._resultsContainer.appendChild(countLabel);

      state.results.forEach(function (carrier) {
        self._resultsContainer.appendChild(buildResultCard(carrier, self));
      });
    },

    onMessage: function (action, payload) {
      if (action === 'matchResults') {
        state.loading = false;
        state.results = payload.results || [];
        if (this._searchBtn) {
          this._searchBtn.disabled = false;
          this._searchBtn.textContent = 'Search Carriers';
        }
        this._renderResults();
      } else if (action === 'matchError') {
        state.loading = false;
        if (this._searchBtn) {
          this._searchBtn.disabled = false;
          this._searchBtn.textContent = 'Search Carriers';
        }
        if (this._resultsContainer) {
          while (this._resultsContainer.firstChild) this._resultsContainer.removeChild(this._resultsContainer.firstChild);
          var errDiv = document.createElement('div');
          errDiv.className = 'dos-card';
          errDiv.style.borderLeft = '4px solid #ef4444';
          var errText = document.createElement('p');
          errText.className = 'dos-text-body';
          errText.style.color = '#ef4444';
          errText.textContent = payload.message || 'Search failed. Please try again.';
          errDiv.appendChild(errText);
          this._resultsContainer.appendChild(errDiv);
        }
      } else if (action === 'interestLogged') {
        // Confirmation already handled inline
      }
    },

    getSnapshot: function () {
      return { filters: state.filters, resultCount: state.results.length };
    }
  };
})();
