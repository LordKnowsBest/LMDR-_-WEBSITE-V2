/**
 * dos-view-health.js
 * Health & Wellness view — resource cards by category, community tips, tip submission.
 */
(function () {
  'use strict';
  window.DOS = window.DOS || {};
  DOS.viewModules = DOS.viewModules || {};

  var CATEGORIES = ['All', 'Exercise', 'Nutrition', 'Mental Health', 'Sleep', 'General'];

  DOS.viewModules['health'] = {
    _listeners: [],
    _root: null,
    _listEl: null,
    _tipsEl: null,
    _activeCategory: 'All',
    _resources: [],
    _loading: false,
    _showForm: false,

    mount: function (root) {
      while (root.firstChild) root.removeChild(root.firstChild);
      this._root = root;
      this._resources = [];
      this._loading = true;
      this._showForm = false;
      this._activeCategory = 'All';

      var container = document.createElement('div');
      container.className = 'dos-container';
      container.style.paddingTop = '16px';

      // Header
      var heading = document.createElement('h1');
      heading.className = 'dos-text-heading';
      heading.textContent = 'Health & Wellness';
      heading.style.marginBottom = '12px';
      container.appendChild(heading);

      // Category pills
      var pillRow = document.createElement('div');
      pillRow.className = 'dos-scroll-row';
      pillRow.style.marginBottom = '16px';
      this._pillRow = pillRow;

      var self = this;
      for (var i = 0; i < CATEGORIES.length; i++) {
        (function (cat) {
          var pill = document.createElement('button');
          pill.className = 'dos-chip ' + (cat === self._activeCategory ? 'dos-chip-amber' : 'dos-chip-gray');
          pill.style.cssText = 'cursor:pointer;border:none;white-space:nowrap;flex-shrink:0;min-height:40px;';
          pill.setAttribute('data-cat', cat);
          pill.textContent = cat;

          var handler = function () {
            self._activeCategory = cat;
            self._updatePills();
            self._renderResources();
          };
          pill.addEventListener('click', handler);
          self._listeners.push({ el: pill, type: 'click', fn: handler });

          pillRow.appendChild(pill);
        })(CATEGORIES[i]);
      }
      container.appendChild(pillRow);

      // Resources list
      var listEl = document.createElement('div');
      listEl.className = 'dos-grid';
      this._listEl = listEl;
      container.appendChild(listEl);

      // Divider
      var divider = document.createElement('div');
      divider.className = 'dos-divider';
      divider.style.margin = '20px 0';
      container.appendChild(divider);

      // Community Tips section
      var tipsHeader = document.createElement('div');
      tipsHeader.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;';
      var tipsTitle = document.createElement('h2');
      tipsTitle.className = 'dos-text-subheading';
      tipsTitle.textContent = 'Community Tips';

      var addTipBtn = document.createElement('button');
      addTipBtn.className = 'dos-btn-secondary';
      addTipBtn.style.cssText = 'padding:8px 16px;font-size:14px;min-height:40px;';
      addTipBtn.textContent = 'Submit Tip';
      var addTipHandler = function () {
        self._showForm = !self._showForm;
        self._renderTipForm();
      };
      addTipBtn.addEventListener('click', addTipHandler);
      this._listeners.push({ el: addTipBtn, type: 'click', fn: addTipHandler });

      tipsHeader.appendChild(tipsTitle);
      tipsHeader.appendChild(addTipBtn);
      container.appendChild(tipsHeader);

      // Tip form placeholder
      var formEl = document.createElement('div');
      formEl.id = 'health-tip-form';
      container.appendChild(formEl);

      // Tips list
      var tipsEl = document.createElement('div');
      tipsEl.className = 'dos-grid';
      this._tipsEl = tipsEl;
      container.appendChild(tipsEl);

      root.appendChild(container);

      // Skeleton + fetch
      this._showSkeleton();
      if (DOS.bridge) {
        DOS.bridge.send('getHealthResources', {});
      }
    },

    _updatePills: function () {
      if (!this._pillRow) return;
      var pills = this._pillRow.children;
      for (var i = 0; i < pills.length; i++) {
        var cat = pills[i].getAttribute('data-cat');
        pills[i].className = 'dos-chip ' + (cat === this._activeCategory ? 'dos-chip-amber' : 'dos-chip-gray');
        pills[i].style.cssText = 'cursor:pointer;border:none;white-space:nowrap;flex-shrink:0;min-height:40px;';
      }
    },

    _showSkeleton: function () {
      if (!this._listEl) return;
      while (this._listEl.firstChild) this._listEl.removeChild(this._listEl.firstChild);
      for (var i = 0; i < 3; i++) {
        var skel = document.createElement('div');
        skel.className = 'dos-card dos-skeleton';
        skel.style.height = '120px';
        this._listEl.appendChild(skel);
      }
    },

    _renderResources: function () {
      if (!this._listEl) return;
      while (this._listEl.firstChild) this._listEl.removeChild(this._listEl.firstChild);

      var filtered = this._resources;
      if (this._activeCategory !== 'All') {
        filtered = this._resources.filter(function (r) {
          return r.category === this._activeCategory;
        }.bind(this));
      }

      if (filtered.length === 0) {
        var empty = document.createElement('div');
        empty.className = 'dos-empty';
        var emptyIcon = document.createElement('span');
        emptyIcon.className = 'material-symbols-outlined';
        emptyIcon.textContent = 'health_and_safety';
        var emptyText = document.createElement('p');
        emptyText.className = 'dos-text-body';
        emptyText.textContent = 'No resources in this category yet.';
        empty.appendChild(emptyIcon);
        empty.appendChild(emptyText);
        this._listEl.appendChild(empty);
        return;
      }

      for (var i = 0; i < filtered.length; i++) {
        this._listEl.appendChild(this._renderResourceCard(filtered[i]));
      }
    },

    _renderResourceCard: function (resource) {
      var card = document.createElement('div');
      card.className = 'dos-card';

      // Category chip
      var chip = document.createElement('span');
      chip.className = 'dos-chip dos-chip-blue';
      chip.style.cssText = 'font-size:11px;padding:4px 8px;min-height:24px;margin-bottom:8px;';
      chip.textContent = resource.category || 'General';
      card.appendChild(chip);

      // Title
      var title = document.createElement('h3');
      title.style.cssText = 'font-size:16px;font-weight:700;color:#0f172a;margin:4px 0;';
      title.textContent = resource.title || 'Untitled';
      card.appendChild(title);

      // Summary
      var summary = document.createElement('p');
      summary.className = 'dos-text-body';
      summary.style.cssText = 'margin:4px 0 8px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;';
      summary.textContent = resource.summary || resource.content || '';
      card.appendChild(summary);

      // Expand toggle
      var expandBtn = document.createElement('button');
      expandBtn.style.cssText = 'background:none;border:none;color:#2563eb;font-weight:600;font-size:14px;cursor:pointer;padding:4px 0;min-height:40px;';
      expandBtn.textContent = 'Read More';
      var expanded = false;

      var expandHandler = function () {
        expanded = !expanded;
        if (expanded) {
          summary.style.display = 'block';
          summary.style.webkitLineClamp = 'unset';
          expandBtn.textContent = 'Show Less';
        } else {
          summary.style.display = '-webkit-box';
          summary.style.webkitLineClamp = '3';
          expandBtn.textContent = 'Read More';
        }
      };
      expandBtn.addEventListener('click', expandHandler);
      this._listeners.push({ el: expandBtn, type: 'click', fn: expandHandler });
      card.appendChild(expandBtn);

      return card;
    },

    _renderTipForm: function () {
      var formContainer = document.getElementById('health-tip-form');
      if (!formContainer) return;
      while (formContainer.firstChild) formContainer.removeChild(formContainer.firstChild);

      if (!this._showForm) return;

      var self = this;
      var form = document.createElement('div');
      form.className = 'dos-card';
      form.style.marginBottom = '16px';

      // Category select
      var catLabel = document.createElement('label');
      catLabel.className = 'dos-text-small';
      catLabel.textContent = 'Category';
      catLabel.style.display = 'block';
      catLabel.style.marginBottom = '4px';
      form.appendChild(catLabel);

      var catSelect = document.createElement('select');
      catSelect.className = 'dos-input';
      catSelect.style.marginBottom = '12px';
      for (var i = 1; i < CATEGORIES.length; i++) {
        var opt = document.createElement('option');
        opt.value = CATEGORIES[i];
        opt.textContent = CATEGORIES[i];
        catSelect.appendChild(opt);
      }
      form.appendChild(catSelect);

      // Title input
      var titleLabel = document.createElement('label');
      titleLabel.className = 'dos-text-small';
      titleLabel.textContent = 'Tip Title';
      titleLabel.style.display = 'block';
      titleLabel.style.marginBottom = '4px';
      form.appendChild(titleLabel);

      var titleInput = document.createElement('input');
      titleInput.className = 'dos-input';
      titleInput.type = 'text';
      titleInput.placeholder = 'Give your tip a short title';
      titleInput.style.marginBottom = '12px';
      form.appendChild(titleInput);

      // Content textarea
      var contentLabel = document.createElement('label');
      contentLabel.className = 'dos-text-small';
      contentLabel.textContent = 'Content';
      contentLabel.style.display = 'block';
      contentLabel.style.marginBottom = '4px';
      form.appendChild(contentLabel);

      var contentArea = document.createElement('textarea');
      contentArea.className = 'dos-textarea';
      contentArea.placeholder = 'Share your health tip with fellow drivers...';
      contentArea.style.marginBottom = '12px';
      form.appendChild(contentArea);

      // Submit button
      var submitBtn = document.createElement('button');
      submitBtn.className = 'dos-btn-primary';
      submitBtn.textContent = 'Submit Tip';
      submitBtn.style.width = '100%';
      var submitHandler = function () {
        var tipData = {
          category: catSelect.value,
          title: titleInput.value.trim(),
          content: contentArea.value.trim()
        };
        if (!tipData.title || !tipData.content) return;
        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;
        DOS.bridge.send('submitHealthTip', { tipData: tipData });
      };
      submitBtn.addEventListener('click', submitHandler);
      self._listeners.push({ el: submitBtn, type: 'click', fn: submitHandler });
      form.appendChild(submitBtn);

      formContainer.appendChild(form);
    },

    _renderTips: function (tips) {
      if (!this._tipsEl) return;
      while (this._tipsEl.firstChild) this._tipsEl.removeChild(this._tipsEl.firstChild);

      if (!tips || tips.length === 0) {
        var empty = document.createElement('p');
        empty.className = 'dos-text-small';
        empty.textContent = 'No community tips yet. Be the first to share!';
        empty.style.textAlign = 'center';
        this._tipsEl.appendChild(empty);
        return;
      }

      for (var i = 0; i < tips.length; i++) {
        var tip = tips[i];
        var card = document.createElement('div');
        card.className = 'dos-card';

        var tipTitle = document.createElement('div');
        tipTitle.style.cssText = 'font-size:15px;font-weight:600;color:#0f172a;margin-bottom:4px;';
        tipTitle.textContent = tip.title || '';
        card.appendChild(tipTitle);

        var tipContent = document.createElement('p');
        tipContent.className = 'dos-text-body';
        tipContent.textContent = tip.content || '';
        card.appendChild(tipContent);

        this._tipsEl.appendChild(card);
      }
    },

    unmount: function () {
      this._listeners.forEach(function (l) { l.el.removeEventListener(l.type, l.fn); });
      this._listeners = [];
      this._listEl = null;
      this._tipsEl = null;
      this._pillRow = null;
      this._root = null;
    },

    onMessage: function (action, payload) {
      if (action === 'healthResourcesLoaded') {
        var data = payload.resources || [];
        // Separate resources from community tips
        this._resources = data.filter(function (r) { return r.type !== 'tip'; });
        var tips = data.filter(function (r) { return r.type === 'tip'; });
        this._renderResources();
        this._renderTips(tips);
      } else if (action === 'healthTipSubmitted') {
        this._showForm = false;
        this._renderTipForm();
        // Refresh resources to include new tip
        if (DOS.bridge) DOS.bridge.send('getHealthResources', {});
      }
    },

    getSnapshot: function () {
      return { activeCategory: this._activeCategory, resourceCount: this._resources.length };
    }
  };
})();
