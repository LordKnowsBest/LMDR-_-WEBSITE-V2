/**
 * dos-view-jobs.js
 * DriverOS Job Listings view.
 * Filterable job search with apply/save actions.
 */
(function () {
  'use strict';
  window.DOS = window.DOS || {};
  DOS.viewModules = DOS.viewModules || {};

  var CDL_TYPES = ['Any', 'Class A', 'Class B', 'Class C'];
  var PAY_RANGES = ['Any', '$50k-$60k', '$60k-$70k', '$70k-$80k', '$80k+'];
  var state = { jobs: [], loading: false, filters: {}, savedJobs: {}, page: 1 };

  function icon(name) {
    var s = document.createElement('span');
    s.className = 'material-symbols-outlined';
    s.textContent = name;
    return s;
  }

  function skeleton(count) {
    var wrap = document.createElement('div');
    for (var i = 0; i < count; i++) {
      var sk = document.createElement('div');
      sk.className = 'dos-card';
      sk.style.height = '150px';
      sk.style.marginBottom = '12px';
      sk.style.background = 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)';
      sk.style.backgroundSize = '200% 100%';
      sk.style.animation = 'dosShimmer 1.5s infinite';
      wrap.appendChild(sk);
    }
    return wrap;
  }

  function timeAgo(dateStr) {
    if (!dateStr) return '';
    var now = Date.now();
    var then = new Date(dateStr).getTime();
    var days = Math.floor((now - then) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    if (days < 30) return days + ' days ago';
    return Math.floor(days / 30) + ' mo ago';
  }

  function buildFilters(self) {
    var wrap = document.createElement('div');
    wrap.className = 'dos-card';
    wrap.style.marginBottom = '12px';

    var title = document.createElement('h2');
    title.className = 'dos-text-subheading';
    title.textContent = 'Filter Jobs';
    title.style.marginBottom = '12px';
    wrap.appendChild(title);

    var grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = '1fr 1fr';
    grid.style.gap = '10px';
    grid.style.marginBottom = '12px';

    // CDL Type
    var cdlWrap = document.createElement('div');
    var cdlLabel = document.createElement('label');
    cdlLabel.className = 'dos-text-small';
    cdlLabel.textContent = 'CDL Type';
    cdlLabel.style.display = 'block';
    cdlLabel.style.marginBottom = '4px';
    cdlWrap.appendChild(cdlLabel);
    var cdlSelect = document.createElement('select');
    cdlSelect.className = 'dos-input';
    CDL_TYPES.forEach(function (t) {
      var o = document.createElement('option');
      o.value = t === 'Any' ? '' : t;
      o.textContent = t;
      cdlSelect.appendChild(o);
    });
    cdlWrap.appendChild(cdlSelect);
    grid.appendChild(cdlWrap);
    self._cdlFilter = cdlSelect;

    // Pay Range
    var payWrap = document.createElement('div');
    var payLabel = document.createElement('label');
    payLabel.className = 'dos-text-small';
    payLabel.textContent = 'Pay Range';
    payLabel.style.display = 'block';
    payLabel.style.marginBottom = '4px';
    payWrap.appendChild(payLabel);
    var paySelect = document.createElement('select');
    paySelect.className = 'dos-input';
    PAY_RANGES.forEach(function (p) {
      var o = document.createElement('option');
      o.value = p === 'Any' ? '' : p;
      o.textContent = p;
      paySelect.appendChild(o);
    });
    payWrap.appendChild(paySelect);
    grid.appendChild(payWrap);
    self._payFilter = paySelect;
    wrap.appendChild(grid);

    // Location
    var locLabel = document.createElement('label');
    locLabel.className = 'dos-text-small';
    locLabel.textContent = 'Location';
    locLabel.style.display = 'block';
    locLabel.style.marginBottom = '4px';
    wrap.appendChild(locLabel);
    var locInput = document.createElement('input');
    locInput.type = 'text';
    locInput.className = 'dos-input';
    locInput.placeholder = 'City or State';
    locInput.style.marginBottom = '12px';
    wrap.appendChild(locInput);
    self._locFilter = locInput;

    // Search button
    var btn = document.createElement('button');
    btn.className = 'dos-btn-primary dos-full-width';
    btn.textContent = 'Search Jobs';
    var handler = function () { self._doSearch(); };
    btn.addEventListener('click', handler);
    self._listeners.push({ el: btn, type: 'click', fn: handler });
    wrap.appendChild(btn);
    self._searchBtn = btn;

    return wrap;
  }

  function buildJobCard(job, self) {
    var card = document.createElement('div');
    card.className = 'dos-card';
    card.style.marginBottom = '12px';

    // Title
    var titleRow = document.createElement('div');
    titleRow.style.marginBottom = '6px';
    var title = document.createElement('h3');
    title.className = 'dos-text-subheading';
    title.textContent = job.title || 'CDL Driver Position';
    titleRow.appendChild(title);
    card.appendChild(titleRow);

    // Company
    var company = document.createElement('p');
    company.className = 'dos-text-body';
    company.style.fontWeight = '600';
    company.style.marginBottom = '8px';
    company.textContent = job.company || job.carrierName || 'Company';
    card.appendChild(company);

    // Details row
    var details = document.createElement('div');
    details.style.display = 'flex';
    details.style.flexWrap = 'wrap';
    details.style.gap = '6px';
    details.style.marginBottom = '10px';

    var detailItems = [];
    if (job.payRange || job.salary) detailItems.push({ icon: 'payments', text: job.payRange || job.salary, cls: 'dos-chip-green' });
    if (job.location) detailItems.push({ icon: 'location_on', text: job.location, cls: 'dos-chip-gray' });
    if (job.jobType || job.type) detailItems.push({ icon: 'local_shipping', text: job.jobType || job.type, cls: 'dos-chip-blue' });

    detailItems.forEach(function (item) {
      var chip = document.createElement('span');
      chip.className = 'dos-chip ' + item.cls;
      var ic = icon(item.icon);
      ic.style.fontSize = '14px';
      chip.appendChild(ic);
      var txt = document.createTextNode(' ' + item.text);
      chip.appendChild(txt);
      details.appendChild(chip);
    });
    card.appendChild(details);

    // Posted date
    if (job.postedDate || job.createdAt) {
      var posted = document.createElement('p');
      posted.className = 'dos-text-small';
      posted.textContent = 'Posted ' + timeAgo(job.postedDate || job.createdAt);
      posted.style.marginBottom = '12px';
      card.appendChild(posted);
    }

    // Description snippet
    if (job.description) {
      var desc = document.createElement('p');
      desc.className = 'dos-text-body';
      desc.textContent = job.description.length > 120 ? job.description.substring(0, 120) + '...' : job.description;
      desc.style.marginBottom = '12px';
      card.appendChild(desc);
    }

    // Actions
    var actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.gap = '8px';

    var applyBtn = document.createElement('button');
    applyBtn.className = 'dos-btn-primary';
    applyBtn.style.flex = '1';
    applyBtn.textContent = 'Apply';
    var applyHandler = function () {
      DOS.bridge.send('applyToJob', { jobId: job._id || job.id });
      applyBtn.textContent = 'Applied!';
      applyBtn.disabled = true;
      applyBtn.style.opacity = '0.6';
    };
    applyBtn.addEventListener('click', applyHandler);
    self._listeners.push({ el: applyBtn, type: 'click', fn: applyHandler });
    actions.appendChild(applyBtn);

    var saveBtn = document.createElement('button');
    saveBtn.className = 'dos-btn-ghost';
    saveBtn.style.flex = '1';
    var isSaved = state.savedJobs[job._id || job.id];
    saveBtn.textContent = isSaved ? 'Saved' : 'Save';
    if (isSaved) { saveBtn.style.opacity = '0.6'; saveBtn.disabled = true; }
    var saveHandler = function () {
      DOS.bridge.send('saveJob', { jobId: job._id || job.id });
      state.savedJobs[job._id || job.id] = true;
      saveBtn.textContent = 'Saved';
      saveBtn.disabled = true;
      saveBtn.style.opacity = '0.6';
    };
    saveBtn.addEventListener('click', saveHandler);
    self._listeners.push({ el: saveBtn, type: 'click', fn: saveHandler });
    actions.appendChild(saveBtn);

    card.appendChild(actions);
    return card;
  }

  function buildEmpty() {
    var wrap = document.createElement('div');
    wrap.className = 'dos-empty';
    var ic = icon('work_off');
    ic.style.fontSize = '48px';
    ic.style.marginBottom = '12px';
    ic.style.opacity = '0.5';
    wrap.appendChild(ic);
    var msg = document.createElement('p');
    msg.className = 'dos-text-body';
    msg.textContent = 'No jobs found. Try adjusting your filters.';
    wrap.appendChild(msg);
    return wrap;
  }

  DOS.viewModules['jobs'] = {
    _listeners: [],
    _listContainer: null,
    _cdlFilter: null,
    _payFilter: null,
    _locFilter: null,
    _searchBtn: null,

    mount: function (root) {
      var self = this;
      while (root.firstChild) root.removeChild(root.firstChild);

      var container = document.createElement('div');
      container.className = 'dos-container';
      container.style.paddingTop = '16px';
      container.style.paddingBottom = '100px';

      var heading = document.createElement('h1');
      heading.className = 'dos-text-heading';
      heading.textContent = 'Job Listings';
      heading.style.marginBottom = '16px';
      container.appendChild(heading);

      container.appendChild(buildFilters(self));

      var listContainer = document.createElement('div');
      self._listContainer = listContainer;
      container.appendChild(listContainer);

      root.appendChild(container);

      // Auto-search on mount
      state.loading = true;
      listContainer.appendChild(skeleton(3));
      DOS.bridge.send('searchJobs', { filters: {}, page: 1, pageSize: 20 });
    },

    unmount: function () {
      this._listeners.forEach(function (l) { l.el.removeEventListener(l.type, l.fn); });
      this._listeners = [];
      this._listContainer = null;
    },

    _doSearch: function () {
      state.filters = {
        cdlType: this._cdlFilter ? this._cdlFilter.value : '',
        payRange: this._payFilter ? this._payFilter.value : '',
        location: this._locFilter ? this._locFilter.value.trim() : ''
      };
      state.loading = true;
      state.page = 1;

      if (this._listContainer) {
        while (this._listContainer.firstChild) this._listContainer.removeChild(this._listContainer.firstChild);
        this._listContainer.appendChild(skeleton(3));
      }
      if (this._searchBtn) {
        this._searchBtn.disabled = true;
        this._searchBtn.textContent = 'Searching...';
      }
      DOS.bridge.send('searchJobs', { filters: state.filters, page: 1, pageSize: 20 });
    },

    _renderList: function () {
      var self = this;
      if (!this._listContainer) return;
      while (this._listContainer.firstChild) this._listContainer.removeChild(this._listContainer.firstChild);

      if (state.jobs.length === 0) {
        this._listContainer.appendChild(buildEmpty());
        return;
      }

      var count = document.createElement('p');
      count.className = 'dos-text-small';
      count.textContent = state.jobs.length + ' jobs found';
      count.style.marginBottom = '12px';
      this._listContainer.appendChild(count);

      state.jobs.forEach(function (job) {
        self._listContainer.appendChild(buildJobCard(job, self));
      });
    },

    onMessage: function (action, payload) {
      if (action === 'jobsLoaded') {
        state.loading = false;
        state.jobs = payload.jobs || [];
        if (this._searchBtn) {
          this._searchBtn.disabled = false;
          this._searchBtn.textContent = 'Search Jobs';
        }
        this._renderList();
      } else if (action === 'jobSaved') {
        // Handled inline
      } else if (action === 'savedJobsLoaded') {
        var jobs = payload.jobs || [];
        jobs.forEach(function (j) {
          state.savedJobs[j._id || j.id] = true;
        });
      }
    },

    getSnapshot: function () {
      return { jobCount: state.jobs.length, filters: state.filters, page: state.page };
    }
  };
})();
