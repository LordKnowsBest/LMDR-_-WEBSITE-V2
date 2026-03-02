/**
 * dos-view-opportunities.js
 * DriverOS Recommended Opportunities view.
 * Shows AI-recommended carriers based on driver profile.
 */
(function () {
  'use strict';
  window.DOS = window.DOS || {};
  DOS.viewModules = DOS.viewModules || {};

  var state = { opportunities: [], loading: false };

  function icon(name) {
    var s = document.createElement('span');
    s.className = 'material-symbols-outlined';
    s.textContent = name;
    return s;
  }

  function skeleton(count) {
    var wrap = document.createElement('div');
    wrap.className = 'dos-grid';
    for (var i = 0; i < count; i++) {
      var sk = document.createElement('div');
      sk.className = 'dos-card';
      sk.style.height = '180px';
      sk.style.background = 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)';
      sk.style.backgroundSize = '200% 100%';
      sk.style.animation = 'dosShimmer 1.5s infinite';
      wrap.appendChild(sk);
    }
    return wrap;
  }

  function buildOpportunityCard(opp, self) {
    var card = document.createElement('div');
    card.className = 'dos-card';
    card.style.marginBottom = '12px';

    // Header with name + score
    var header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '8px';

    var name = document.createElement('h3');
    name.className = 'dos-text-subheading';
    name.textContent = opp.carrierName || opp.name || 'Carrier';
    name.style.flex = '1';
    header.appendChild(name);

    if (opp.matchScore !== undefined) {
      var scoreBadge = document.createElement('span');
      var pct = Math.round(opp.matchScore);
      scoreBadge.className = pct >= 80 ? 'dos-chip dos-chip-green' : pct >= 60 ? 'dos-chip dos-chip-amber' : 'dos-chip dos-chip-gray';
      scoreBadge.textContent = pct + '%';
      header.appendChild(scoreBadge);
    }
    card.appendChild(header);

    // Benefits list
    var benefits = opp.benefits || opp.highlights || [];
    if (benefits.length > 0) {
      var benefitsList = document.createElement('div');
      benefitsList.style.marginBottom = '12px';
      benefits.forEach(function (b) {
        var row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.gap = '6px';
        row.style.marginBottom = '4px';
        var ic = icon('check_circle');
        ic.style.fontSize = '16px';
        ic.style.color = '#22c55e';
        row.appendChild(ic);
        var txt = document.createElement('span');
        txt.className = 'dos-text-body';
        txt.textContent = b;
        row.appendChild(txt);
        benefitsList.appendChild(row);
      });
      card.appendChild(benefitsList);
    }

    // Info chips
    var chipRow = document.createElement('div');
    chipRow.style.display = 'flex';
    chipRow.style.flexWrap = 'wrap';
    chipRow.style.gap = '6px';
    chipRow.style.marginBottom = '12px';

    if (opp.location || (opp.city && opp.state)) {
      var locChip = document.createElement('span');
      locChip.className = 'dos-chip dos-chip-gray';
      locChip.textContent = opp.location || (opp.city + ', ' + opp.state);
      chipRow.appendChild(locChip);
    }
    if (opp.payRange || opp.avgPay) {
      var payChip = document.createElement('span');
      payChip.className = 'dos-chip dos-chip-green';
      payChip.textContent = opp.payRange || opp.avgPay;
      chipRow.appendChild(payChip);
    }
    if (opp.jobType) {
      var typeChip = document.createElement('span');
      typeChip.className = 'dos-chip dos-chip-blue';
      typeChip.textContent = opp.jobType;
      chipRow.appendChild(typeChip);
    }
    card.appendChild(chipRow);

    // Why recommended
    if (opp.reason || opp.matchReason) {
      var reasonBox = document.createElement('div');
      reasonBox.style.background = '#f8fafc';
      reasonBox.style.borderRadius = '8px';
      reasonBox.style.padding = '10px 12px';
      reasonBox.style.marginBottom = '12px';
      var reasonLabel = document.createElement('p');
      reasonLabel.className = 'dos-text-small';
      reasonLabel.style.fontWeight = '600';
      reasonLabel.style.marginBottom = '2px';
      reasonLabel.textContent = 'Why recommended';
      reasonBox.appendChild(reasonLabel);
      var reasonText = document.createElement('p');
      reasonText.className = 'dos-text-small';
      reasonText.textContent = opp.reason || opp.matchReason;
      reasonBox.appendChild(reasonText);
      card.appendChild(reasonBox);
    }

    // Action button
    var btn = document.createElement('button');
    btn.className = 'dos-btn-secondary dos-full-width';
    btn.textContent = 'Learn More';
    var handler = function () {
      DOS.bridge.send('getCarrierDetail', { carrierDot: opp.dotNumber || opp.dot });
    };
    btn.addEventListener('click', handler);
    self._listeners.push({ el: btn, type: 'click', fn: handler });
    card.appendChild(btn);

    return card;
  }

  function buildEmpty() {
    var wrap = document.createElement('div');
    wrap.className = 'dos-empty';
    var ic = icon('explore');
    ic.style.fontSize = '48px';
    ic.style.marginBottom = '12px';
    ic.style.opacity = '0.5';
    wrap.appendChild(ic);
    var heading = document.createElement('p');
    heading.className = 'dos-text-subheading';
    heading.textContent = 'No Opportunities Yet';
    wrap.appendChild(heading);
    var sub = document.createElement('p');
    sub.className = 'dos-text-body';
    sub.textContent = 'Complete your profile to get personalized carrier recommendations.';
    sub.style.marginTop = '8px';
    wrap.appendChild(sub);
    return wrap;
  }

  DOS.viewModules['opportunities'] = {
    _listeners: [],
    _listContainer: null,

    mount: function (root) {
      var self = this;
      while (root.firstChild) root.removeChild(root.firstChild);

      var container = document.createElement('div');
      container.className = 'dos-container';
      container.style.paddingTop = '16px';
      container.style.paddingBottom = '100px';

      var heading = document.createElement('h1');
      heading.className = 'dos-text-heading';
      heading.textContent = 'Opportunities';
      heading.style.marginBottom = '4px';
      container.appendChild(heading);

      var subtitle = document.createElement('p');
      subtitle.className = 'dos-text-body';
      subtitle.textContent = 'Carriers recommended for you';
      subtitle.style.marginBottom = '16px';
      container.appendChild(subtitle);

      var listContainer = document.createElement('div');
      self._listContainer = listContainer;
      container.appendChild(listContainer);

      root.appendChild(container);

      // Show skeleton and request data
      state.loading = true;
      listContainer.appendChild(skeleton(3));
      DOS.bridge.send('getOpportunities', {});
    },

    unmount: function () {
      this._listeners.forEach(function (l) { l.el.removeEventListener(l.type, l.fn); });
      this._listeners = [];
      this._listContainer = null;
    },

    _renderList: function () {
      var self = this;
      if (!this._listContainer) return;
      while (this._listContainer.firstChild) this._listContainer.removeChild(this._listContainer.firstChild);

      if (state.opportunities.length === 0) {
        this._listContainer.appendChild(buildEmpty());
        return;
      }

      state.opportunities.forEach(function (opp) {
        self._listContainer.appendChild(buildOpportunityCard(opp, self));
      });
    },

    onMessage: function (action, payload) {
      if (action === 'opportunitiesLoaded' || action === 'matchResults') {
        state.loading = false;
        state.opportunities = payload.opportunities || payload.results || [];
        this._renderList();
      }
    },

    getSnapshot: function () {
      return { opportunityCount: state.opportunities.length };
    }
  };
})();
