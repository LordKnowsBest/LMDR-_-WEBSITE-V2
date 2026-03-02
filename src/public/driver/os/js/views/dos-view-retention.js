/**
 * dos-view-retention.js
 * Retention view — risk score card, accordion framework sections, best practices.
 */
(function () {
  'use strict';
  window.DOS = window.DOS || {};
  DOS.viewModules = DOS.viewModules || {};

  DOS.viewModules['retention'] = {
    _listeners: [],
    _root: null,
    _contentEl: null,
    _framework: null,
    _loading: true,

    mount: function (root) {
      while (root.firstChild) root.removeChild(root.firstChild);
      this._root = root;
      this._framework = null;
      this._loading = true;

      var container = document.createElement('div');
      container.className = 'dos-container';
      container.style.paddingTop = '16px';

      // Header
      var heading = document.createElement('h1');
      heading.className = 'dos-text-heading';
      heading.textContent = 'Retention & Best Practices';
      heading.style.marginBottom = '4px';
      container.appendChild(heading);

      var subtitle = document.createElement('p');
      subtitle.className = 'dos-text-small';
      subtitle.textContent = 'Tips and framework to grow your driving career';
      subtitle.style.marginBottom = '16px';
      container.appendChild(subtitle);

      // Content container
      var contentEl = document.createElement('div');
      this._contentEl = contentEl;
      container.appendChild(contentEl);

      root.appendChild(container);

      // Skeleton + fetch
      this._showSkeleton();
      if (DOS.bridge) {
        DOS.bridge.send('getRetentionFramework', {});
      }
    },

    _showSkeleton: function () {
      if (!this._contentEl) return;
      while (this._contentEl.firstChild) this._contentEl.removeChild(this._contentEl.firstChild);
      // Risk card skeleton
      var riskSkel = document.createElement('div');
      riskSkel.className = 'dos-card dos-skeleton';
      riskSkel.style.cssText = 'height:100px;margin-bottom:16px;';
      this._contentEl.appendChild(riskSkel);
      // Accordion skeletons
      for (var i = 0; i < 3; i++) {
        var skel = document.createElement('div');
        skel.className = 'dos-card dos-skeleton';
        skel.style.cssText = 'height:56px;margin-bottom:8px;';
        this._contentEl.appendChild(skel);
      }
    },

    _renderContent: function () {
      if (!this._contentEl || !this._framework) return;
      while (this._contentEl.firstChild) this._contentEl.removeChild(this._contentEl.firstChild);

      var fw = this._framework;

      // Risk score card (if available)
      if (fw.riskScore !== undefined && fw.riskScore !== null) {
        this._contentEl.appendChild(this._buildRiskCard(fw.riskScore, fw.riskLabel));
      }

      // Accordion sections
      var sections = fw.sections || fw.topics || [];
      if (sections.length > 0) {
        var accTitle = document.createElement('h2');
        accTitle.className = 'dos-text-subheading';
        accTitle.textContent = 'Retention Framework';
        accTitle.style.marginBottom = '12px';
        this._contentEl.appendChild(accTitle);

        for (var i = 0; i < sections.length; i++) {
          this._contentEl.appendChild(this._buildAccordion(sections[i], i));
        }
      }

      // Best practices cards
      var practices = fw.bestPractices || fw.tips || [];
      if (practices.length > 0) {
        var bpTitle = document.createElement('h2');
        bpTitle.className = 'dos-text-subheading';
        bpTitle.style.cssText = 'margin-top:24px;margin-bottom:12px;';
        bpTitle.textContent = 'Best Practices';
        this._contentEl.appendChild(bpTitle);

        var grid = document.createElement('div');
        grid.className = 'dos-grid';
        for (var p = 0; p < practices.length; p++) {
          grid.appendChild(this._buildPracticeCard(practices[p]));
        }
        this._contentEl.appendChild(grid);
      }

      // Empty state
      if (sections.length === 0 && practices.length === 0) {
        var empty = document.createElement('div');
        empty.className = 'dos-empty';
        var emptyIcon = document.createElement('span');
        emptyIcon.className = 'material-symbols-outlined';
        emptyIcon.textContent = 'trending_up';
        var emptyText = document.createElement('p');
        emptyText.className = 'dos-text-body';
        emptyText.textContent = 'Retention framework loading...';
        empty.appendChild(emptyIcon);
        empty.appendChild(emptyText);
        this._contentEl.appendChild(empty);
      }
    },

    _buildRiskCard: function (score, label) {
      var card = document.createElement('div');
      card.className = 'dos-card';
      card.style.marginBottom = '20px';

      var header = document.createElement('div');
      header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;';

      var left = document.createElement('div');
      var cardTitle = document.createElement('div');
      cardTitle.className = 'dos-text-small';
      cardTitle.textContent = 'Your Retention Risk';
      left.appendChild(cardTitle);

      var scoreLabel = document.createElement('div');
      scoreLabel.style.cssText = 'font-size:28px;font-weight:800;color:#0f172a;';
      scoreLabel.textContent = score;
      left.appendChild(scoreLabel);

      var riskLabel = document.createElement('div');
      var riskColor = score <= 30 ? '#22c55e' : score <= 60 ? '#fbbf24' : '#ef4444';
      var riskText = label || (score <= 30 ? 'Low Risk' : score <= 60 ? 'Moderate' : 'High Risk');
      riskLabel.className = 'dos-chip';
      riskLabel.style.cssText = 'background:' + riskColor + '22;color:' + riskColor + ';font-size:12px;padding:2px 10px;min-height:24px;margin-top:4px;';
      riskLabel.textContent = riskText;
      left.appendChild(riskLabel);

      // Score gauge (visual)
      var gauge = document.createElement('div');
      gauge.style.cssText = 'width:64px;height:64px;border-radius:50%;border:6px solid #e2e8f0;display:flex;align-items:center;justify-content:center;position:relative;';
      gauge.style.borderColor = riskColor + '33';
      gauge.style.borderTopColor = riskColor;
      gauge.style.transform = 'rotate(' + (score * 3.6) + 'deg)';

      var gaugeIcon = document.createElement('span');
      gaugeIcon.className = 'material-symbols-outlined';
      gaugeIcon.textContent = score <= 30 ? 'shield' : score <= 60 ? 'warning' : 'error';
      gaugeIcon.style.cssText = 'font-size:28px;color:' + riskColor + ';transform:rotate(-' + (score * 3.6) + 'deg);';
      gauge.appendChild(gaugeIcon);

      header.appendChild(left);
      header.appendChild(gauge);
      card.appendChild(header);

      // Progress bar
      var barBg = document.createElement('div');
      barBg.style.cssText = 'height:8px;background:#e2e8f0;border-radius:4px;overflow:hidden;';
      var barFill = document.createElement('div');
      barFill.style.cssText = 'height:100%;border-radius:4px;transition:width 0.5s ease;';
      barFill.style.width = Math.min(score, 100) + '%';
      barFill.style.background = riskColor;
      barBg.appendChild(barFill);
      card.appendChild(barBg);

      return card;
    },

    _buildAccordion: function (section, index) {
      var self = this;
      var wrapper = document.createElement('div');
      wrapper.className = 'dos-card';
      wrapper.style.cssText = 'margin-bottom:8px;padding:0;overflow:hidden;';

      // Header (clickable)
      var header = document.createElement('button');
      header.style.cssText = 'width:100%;display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:none;border:none;cursor:pointer;min-height:48px;text-align:left;';

      var titleWrap = document.createElement('div');
      titleWrap.style.cssText = 'display:flex;align-items:center;gap:8px;flex:1;';

      var numBadge = document.createElement('div');
      numBadge.style.cssText = 'width:28px;height:28px;border-radius:50%;background:#dbeafe;color:#2563eb;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0;';
      numBadge.textContent = (index + 1).toString();

      var titleText = document.createElement('span');
      titleText.style.cssText = 'font-size:15px;font-weight:600;color:#0f172a;';
      titleText.textContent = section.title || section.name || 'Section ' + (index + 1);

      titleWrap.appendChild(numBadge);
      titleWrap.appendChild(titleText);

      var chevron = document.createElement('span');
      chevron.className = 'material-symbols-outlined';
      chevron.textContent = 'expand_more';
      chevron.style.cssText = 'font-size:22px;color:#94a3b8;transition:transform 0.2s ease;flex-shrink:0;';

      header.appendChild(titleWrap);
      header.appendChild(chevron);

      // Body (hidden by default)
      var body = document.createElement('div');
      body.style.cssText = 'max-height:0;overflow:hidden;transition:max-height 0.3s ease;';

      var bodyInner = document.createElement('div');
      bodyInner.style.cssText = 'padding:0 16px 16px;';

      var desc = document.createElement('p');
      desc.className = 'dos-text-body';
      desc.textContent = section.description || section.content || '';
      bodyInner.appendChild(desc);

      // Action items
      var items = section.actionItems || section.items || [];
      if (items.length > 0) {
        var itemList = document.createElement('ul');
        itemList.style.cssText = 'margin-top:8px;padding-left:20px;';
        for (var i = 0; i < items.length; i++) {
          var li = document.createElement('li');
          li.className = 'dos-text-body';
          li.style.cssText = 'padding:4px 0;font-size:14px;';
          li.textContent = typeof items[i] === 'string' ? items[i] : (items[i].text || items[i].title || '');
          itemList.appendChild(li);
        }
        bodyInner.appendChild(itemList);
      }

      body.appendChild(bodyInner);

      // Toggle
      var expanded = false;
      var toggleHandler = function () {
        expanded = !expanded;
        if (expanded) {
          body.style.maxHeight = body.scrollHeight + 'px';
          chevron.style.transform = 'rotate(180deg)';
        } else {
          body.style.maxHeight = '0';
          chevron.style.transform = 'rotate(0deg)';
        }
      };
      header.addEventListener('click', toggleHandler);
      self._listeners.push({ el: header, type: 'click', fn: toggleHandler });

      wrapper.appendChild(header);
      wrapper.appendChild(body);

      return wrapper;
    },

    _buildPracticeCard: function (practice) {
      var card = document.createElement('div');
      card.className = 'dos-card';

      // Icon + title
      var topRow = document.createElement('div');
      topRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:8px;';

      var iconWrap = document.createElement('div');
      iconWrap.style.cssText = 'width:36px;height:36px;border-radius:8px;background:#fef3c7;display:flex;align-items:center;justify-content:center;flex-shrink:0;';
      var icon = document.createElement('span');
      icon.className = 'material-symbols-outlined';
      icon.textContent = 'lightbulb';
      icon.style.cssText = 'font-size:20px;color:#92400e;';
      iconWrap.appendChild(icon);

      var title = document.createElement('div');
      title.style.cssText = 'font-size:15px;font-weight:600;color:#0f172a;';
      title.textContent = practice.title || practice.name || '';

      topRow.appendChild(iconWrap);
      topRow.appendChild(title);
      card.appendChild(topRow);

      // Description
      var desc = document.createElement('p');
      desc.className = 'dos-text-body';
      desc.style.fontSize = '14px';
      desc.textContent = practice.description || practice.content || '';
      card.appendChild(desc);

      // Action items
      var actions = practice.actionItems || practice.actions || [];
      if (actions.length > 0) {
        var divider = document.createElement('div');
        divider.className = 'dos-divider';
        card.appendChild(divider);

        var actLabel = document.createElement('div');
        actLabel.className = 'dos-text-small';
        actLabel.textContent = 'Action Items';
        actLabel.style.cssText = 'font-weight:600;margin-bottom:6px;';
        card.appendChild(actLabel);

        for (var a = 0; a < actions.length; a++) {
          var item = document.createElement('div');
          item.style.cssText = 'display:flex;align-items:flex-start;gap:6px;padding:3px 0;';

          var check = document.createElement('span');
          check.className = 'material-symbols-outlined';
          check.textContent = 'check_box_outline_blank';
          check.style.cssText = 'font-size:18px;color:#94a3b8;flex-shrink:0;margin-top:1px;';

          var actText = document.createElement('span');
          actText.className = 'dos-text-body';
          actText.style.fontSize = '13px';
          actText.textContent = typeof actions[a] === 'string' ? actions[a] : (actions[a].text || '');

          item.appendChild(check);
          item.appendChild(actText);
          card.appendChild(item);
        }
      }

      return card;
    },

    unmount: function () {
      this._listeners.forEach(function (l) { l.el.removeEventListener(l.type, l.fn); });
      this._listeners = [];
      this._contentEl = null;
      this._root = null;
    },

    onMessage: function (action, payload) {
      if (action === 'retentionFrameworkLoaded') {
        this._framework = payload.framework || payload;
        this._loading = false;
        this._renderContent();
      }
    },

    getSnapshot: function () {
      return {
        hasFramework: !!this._framework,
        riskScore: this._framework ? this._framework.riskScore : null
      };
    }
  };
})();
