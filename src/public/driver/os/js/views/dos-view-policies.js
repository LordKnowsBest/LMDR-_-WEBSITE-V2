/**
 * dos-view-policies.js
 * Driver Policies view — policy list, full-text viewer, acknowledgement.
 * MIGRATED from type-key protocol to action-key protocol.
 */
(function () {
  'use strict';
  window.DOS = window.DOS || {};
  DOS.viewModules = DOS.viewModules || {};

  DOS.viewModules['policies'] = {
    _listeners: [],
    _root: null,
    _listEl: null,
    _policies: [],
    _loading: false,
    _viewingPolicy: null,

    mount: function (root) {
      while (root.firstChild) root.removeChild(root.firstChild);
      this._root = root;
      this._policies = [];
      this._loading = true;
      this._viewingPolicy = null;

      var container = document.createElement('div');
      container.className = 'dos-container';
      container.style.paddingTop = '16px';

      // Header
      var heading = document.createElement('h1');
      heading.className = 'dos-text-heading';
      heading.textContent = 'Company Policies';
      heading.style.marginBottom = '4px';
      container.appendChild(heading);

      var subtitle = document.createElement('p');
      subtitle.className = 'dos-text-small';
      subtitle.textContent = 'Review and acknowledge required policies';
      subtitle.style.marginBottom = '16px';
      container.appendChild(subtitle);

      // Policy list
      var listEl = document.createElement('div');
      listEl.className = 'dos-grid';
      this._listEl = listEl;
      container.appendChild(listEl);

      root.appendChild(container);

      // Skeleton + fetch
      this._showSkeleton();
      if (DOS.bridge) {
        DOS.bridge.send('getDriverPolicies', {});
      }
    },

    _showSkeleton: function () {
      if (!this._listEl) return;
      while (this._listEl.firstChild) this._listEl.removeChild(this._listEl.firstChild);
      for (var i = 0; i < 4; i++) {
        var skel = document.createElement('div');
        skel.className = 'dos-card dos-skeleton';
        skel.style.height = '80px';
        this._listEl.appendChild(skel);
      }
    },

    _renderPolicies: function () {
      if (!this._listEl) return;
      while (this._listEl.firstChild) this._listEl.removeChild(this._listEl.firstChild);

      if (this._policies.length === 0) {
        var empty = document.createElement('div');
        empty.className = 'dos-empty';
        var emptyIcon = document.createElement('span');
        emptyIcon.className = 'material-symbols-outlined';
        emptyIcon.textContent = 'policy';
        var emptyText = document.createElement('p');
        emptyText.className = 'dos-text-body';
        emptyText.textContent = 'No policies assigned to you.';
        empty.appendChild(emptyIcon);
        empty.appendChild(emptyText);
        this._listEl.appendChild(empty);
        return;
      }

      for (var i = 0; i < this._policies.length; i++) {
        this._listEl.appendChild(this._renderPolicyCard(this._policies[i]));
      }
    },

    _renderPolicyCard: function (policy) {
      var self = this;
      var card = document.createElement('div');
      card.className = 'dos-card-interactive';
      card.style.cssText = 'display:flex;align-items:center;gap:12px;';

      // Icon
      var iconWrap = document.createElement('div');
      iconWrap.style.cssText = 'width:44px;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0;';
      iconWrap.style.background = policy.acknowledged ? '#dcfce7' : '#fef3c7';
      var icon = document.createElement('span');
      icon.className = 'material-symbols-outlined';
      icon.textContent = policy.acknowledged ? 'check_circle' : 'description';
      icon.style.cssText = 'font-size:22px;color:' + (policy.acknowledged ? '#166534' : '#92400e') + ';';
      iconWrap.appendChild(icon);

      // Info
      var info = document.createElement('div');
      info.style.cssText = 'flex:1;min-width:0;';

      var title = document.createElement('div');
      title.style.cssText = 'font-size:15px;font-weight:600;color:#0f172a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
      title.textContent = policy.title || 'Untitled Policy';

      var meta = document.createElement('div');
      meta.className = 'dos-text-small';
      var parts = [];
      if (policy.category) parts.push(policy.category);
      if (policy.lastUpdated) parts.push('Updated ' + formatDate(policy.lastUpdated));
      meta.textContent = parts.join(' · ');

      info.appendChild(title);
      info.appendChild(meta);

      // Status chip
      var chip = document.createElement('span');
      chip.className = 'dos-chip ' + (policy.acknowledged ? 'dos-chip-green' : 'dos-chip-amber');
      chip.style.cssText = 'font-size:11px;padding:2px 8px;min-height:22px;flex-shrink:0;';
      chip.textContent = policy.acknowledged ? 'Signed' : 'Pending';

      card.appendChild(iconWrap);
      card.appendChild(info);
      card.appendChild(chip);

      // Tap to view
      var tapHandler = function () {
        self._viewingPolicy = policy;
        if (policy.content) {
          self._showPolicyViewer(policy);
        } else {
          // Request full content from bridge
          DOS.bridge.send('getPolicyContent', { policyId: policy.id || policy._id });
        }
      };
      card.addEventListener('click', tapHandler);
      this._listeners.push({ el: card, type: 'click', fn: tapHandler });

      return card;
    },

    _showPolicyViewer: function (policy) {
      if (!this._root) return;
      var overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:60;display:flex;align-items:flex-end;';

      var sheet = document.createElement('div');
      sheet.style.cssText = 'background:#fff;border-radius:16px 16px 0 0;padding:0;width:100%;max-height:90vh;display:flex;flex-direction:column;';

      // Handle + header
      var header = document.createElement('div');
      header.style.cssText = 'padding:16px 16px 12px;border-bottom:1px solid #e2e8f0;flex-shrink:0;';
      var handle = document.createElement('div');
      handle.style.cssText = 'width:36px;height:4px;background:#cbd5e1;border-radius:2px;margin:0 auto 12px;';
      header.appendChild(handle);

      var title = document.createElement('h2');
      title.className = 'dos-text-subheading';
      title.textContent = policy.title || 'Policy';
      header.appendChild(title);

      if (policy.category) {
        var catChip = document.createElement('span');
        catChip.className = 'dos-chip dos-chip-blue';
        catChip.style.cssText = 'font-size:11px;padding:2px 8px;min-height:22px;margin-top:4px;';
        catChip.textContent = policy.category;
        header.appendChild(catChip);
      }
      sheet.appendChild(header);

      // Scrollable content
      var contentArea = document.createElement('div');
      contentArea.style.cssText = 'flex:1;overflow-y:auto;padding:16px;-webkit-overflow-scrolling:touch;';

      var contentText = document.createElement('div');
      contentText.className = 'dos-text-body';
      contentText.style.whiteSpace = 'pre-wrap';
      contentText.textContent = policy.content || 'Loading policy content...';
      contentArea.appendChild(contentText);
      sheet.appendChild(contentArea);

      // Footer with acknowledge button
      var footer = document.createElement('div');
      footer.style.cssText = 'padding:12px 16px;border-top:1px solid #e2e8f0;flex-shrink:0;display:flex;gap:8px;';

      var self = this;
      if (!policy.acknowledged) {
        var ackBtn = document.createElement('button');
        ackBtn.className = 'dos-btn-primary';
        ackBtn.textContent = 'Acknowledge Policy';
        ackBtn.style.flex = '1';
        var ackHandler = function () {
          ackBtn.textContent = 'Submitting...';
          ackBtn.disabled = true;
          DOS.bridge.send('acknowledgePolicy', {
            policyId: policy.id || policy._id,
            signatureType: 'electronic',
            deviceInfo: navigator.userAgent
          });
        };
        ackBtn.addEventListener('click', ackHandler);
        this._listeners.push({ el: ackBtn, type: 'click', fn: ackHandler });
        footer.appendChild(ackBtn);
      }

      var closeBtn = document.createElement('button');
      closeBtn.className = policy.acknowledged ? 'dos-btn-primary' : 'dos-btn-ghost';
      closeBtn.textContent = 'Close';
      closeBtn.style.flex = policy.acknowledged ? '1' : '0 0 auto';
      closeBtn.style.minWidth = '80px';
      var closeHandler = function () { overlay.remove(); };
      closeBtn.addEventListener('click', closeHandler);
      this._listeners.push({ el: closeBtn, type: 'click', fn: closeHandler });
      footer.appendChild(closeBtn);

      sheet.appendChild(footer);

      overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });

      overlay.appendChild(sheet);
      this._root.appendChild(overlay);
    },

    unmount: function () {
      this._listeners.forEach(function (l) { l.el.removeEventListener(l.type, l.fn); });
      this._listeners = [];
      this._listEl = null;
      this._root = null;
    },

    onMessage: function (action, payload) {
      if (action === 'driverPoliciesLoaded') {
        this._policies = payload.policies || [];
        this._renderPolicies();
      } else if (action === 'policyContentLoaded') {
        var policy = payload.policy || {};
        if (this._viewingPolicy) {
          this._viewingPolicy.content = policy.content || policy.body || '';
          this._showPolicyViewer(this._viewingPolicy);
        }
      } else if (action === 'policyAcknowledged') {
        // Mark as acknowledged locally and refresh
        if (this._viewingPolicy) {
          this._viewingPolicy.acknowledged = true;
        }
        // Re-fetch to get updated list
        if (DOS.bridge) DOS.bridge.send('getDriverPolicies', {});
      }
    },

    getSnapshot: function () {
      var pending = this._policies.filter(function (p) { return !p.acknowledged; }).length;
      return { totalPolicies: this._policies.length, pendingCount: pending };
    }
  };

  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      var d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  }
})();
