/**
 * dos-view-mentors.js
 * Mentor Program view — CDL class filter pills, mentor cards, request session.
 */
(function () {
  'use strict';
  window.DOS = window.DOS || {};
  DOS.viewModules = DOS.viewModules || {};

  var CDL_CLASSES = ['All', 'Class A', 'Class B', 'Class C'];

  DOS.viewModules['mentors'] = {
    _listeners: [],
    _root: null,
    _listEl: null,
    _pillRow: null,
    _mentors: [],
    _activeFilter: 'All',
    _loading: false,

    mount: function (root) {
      while (root.firstChild) root.removeChild(root.firstChild);
      this._root = root;
      this._mentors = [];
      this._loading = true;
      this._activeFilter = 'All';

      var container = document.createElement('div');
      container.className = 'dos-container';
      container.style.paddingTop = '16px';

      // Header
      var heading = document.createElement('h1');
      heading.className = 'dos-text-heading';
      heading.textContent = 'Mentor Program';
      heading.style.marginBottom = '4px';
      container.appendChild(heading);

      var subtitle = document.createElement('p');
      subtitle.className = 'dos-text-small';
      subtitle.textContent = 'Connect with experienced CDL drivers for guidance';
      subtitle.style.marginBottom = '12px';
      container.appendChild(subtitle);

      // CDL class filter pills
      var pillRow = document.createElement('div');
      pillRow.className = 'dos-scroll-row';
      pillRow.style.marginBottom = '16px';
      this._pillRow = pillRow;

      var self = this;
      for (var i = 0; i < CDL_CLASSES.length; i++) {
        (function (cls) {
          var pill = document.createElement('button');
          pill.className = 'dos-chip ' + (cls === self._activeFilter ? 'dos-chip-amber' : 'dos-chip-gray');
          pill.style.cssText = 'cursor:pointer;border:none;white-space:nowrap;flex-shrink:0;min-height:40px;';
          pill.setAttribute('data-cls', cls);
          pill.textContent = cls;

          var handler = function () {
            self._activeFilter = cls;
            self._updatePills();
            self._renderMentors();
          };
          pill.addEventListener('click', handler);
          self._listeners.push({ el: pill, type: 'click', fn: handler });

          pillRow.appendChild(pill);
        })(CDL_CLASSES[i]);
      }
      container.appendChild(pillRow);

      // Mentor list
      var listEl = document.createElement('div');
      listEl.className = 'dos-grid';
      this._listEl = listEl;
      container.appendChild(listEl);

      root.appendChild(container);

      this._showSkeleton();
      if (DOS.bridge) {
        DOS.bridge.send('getMentors', {});
      }
    },

    _updatePills: function () {
      if (!this._pillRow) return;
      var pills = this._pillRow.children;
      for (var i = 0; i < pills.length; i++) {
        var cls = pills[i].getAttribute('data-cls');
        pills[i].className = 'dos-chip ' + (cls === this._activeFilter ? 'dos-chip-amber' : 'dos-chip-gray');
        pills[i].style.cssText = 'cursor:pointer;border:none;white-space:nowrap;flex-shrink:0;min-height:40px;';
      }
    },

    _showSkeleton: function () {
      if (!this._listEl) return;
      while (this._listEl.firstChild) this._listEl.removeChild(this._listEl.firstChild);
      for (var i = 0; i < 3; i++) {
        var skel = document.createElement('div');
        skel.className = 'dos-card dos-skeleton';
        skel.style.height = '140px';
        this._listEl.appendChild(skel);
      }
    },

    _renderMentors: function () {
      if (!this._listEl) return;
      while (this._listEl.firstChild) this._listEl.removeChild(this._listEl.firstChild);

      var filtered = this._mentors;
      if (this._activeFilter !== 'All') {
        var filterVal = this._activeFilter;
        filtered = this._mentors.filter(function (m) {
          return m.cdlClass === filterVal || m.cdl_class === filterVal;
        });
      }

      if (filtered.length === 0) {
        var empty = document.createElement('div');
        empty.className = 'dos-empty';
        var emptyIcon = document.createElement('span');
        emptyIcon.className = 'material-symbols-outlined';
        emptyIcon.textContent = 'school';
        var emptyText = document.createElement('p');
        emptyText.className = 'dos-text-body';
        emptyText.textContent = this._activeFilter === 'All' ? 'No mentors available right now.' : 'No mentors for ' + this._activeFilter + '.';
        empty.appendChild(emptyIcon);
        empty.appendChild(emptyText);
        this._listEl.appendChild(empty);
        return;
      }

      for (var i = 0; i < filtered.length; i++) {
        this._listEl.appendChild(this._renderMentorCard(filtered[i]));
      }
    },

    _renderMentorCard: function (mentor) {
      var self = this;
      var card = document.createElement('div');
      card.className = 'dos-card';

      // Top row: avatar + info
      var topRow = document.createElement('div');
      topRow.style.cssText = 'display:flex;gap:12px;align-items:flex-start;margin-bottom:12px;';

      // Avatar placeholder
      var avatar = document.createElement('div');
      avatar.style.cssText = 'width:52px;height:52px;border-radius:50%;background:#dbeafe;display:flex;align-items:center;justify-content:center;flex-shrink:0;';
      var avatarIcon = document.createElement('span');
      avatarIcon.className = 'material-symbols-outlined';
      avatarIcon.textContent = 'person';
      avatarIcon.style.cssText = 'font-size:28px;color:#2563eb;';
      avatar.appendChild(avatarIcon);

      // Info block
      var info = document.createElement('div');
      info.style.cssText = 'flex:1;min-width:0;';

      var name = document.createElement('div');
      name.style.cssText = 'font-size:16px;font-weight:700;color:#0f172a;';
      name.textContent = mentor.name || mentor.fullName || 'Mentor';

      var cdlChip = document.createElement('span');
      cdlChip.className = 'dos-chip dos-chip-blue';
      cdlChip.style.cssText = 'font-size:11px;padding:2px 8px;min-height:20px;margin-top:4px;display:inline-flex;';
      cdlChip.textContent = mentor.cdlClass || mentor.cdl_class || 'CDL';

      var expText = document.createElement('div');
      expText.className = 'dos-text-small';
      expText.style.marginTop = '4px';
      var years = mentor.yearsExperience || mentor.years_experience || 0;
      expText.textContent = years + ' years experience';

      info.appendChild(name);
      info.appendChild(cdlChip);
      info.appendChild(expText);

      topRow.appendChild(avatar);
      topRow.appendChild(info);
      card.appendChild(topRow);

      // Rating row
      var ratingRow = document.createElement('div');
      ratingRow.style.cssText = 'display:flex;align-items:center;gap:4px;margin-bottom:12px;';
      var rating = mentor.rating || 0;
      for (var s = 0; s < 5; s++) {
        var star = document.createElement('span');
        star.className = 'material-symbols-outlined';
        star.textContent = s < Math.round(rating) ? 'star' : 'star_border';
        star.style.cssText = 'font-size:16px;color:' + (s < Math.round(rating) ? '#fbbf24' : '#cbd5e1') + ';';
        ratingRow.appendChild(star);
      }
      var ratingText = document.createElement('span');
      ratingText.className = 'dos-text-small';
      ratingText.textContent = rating.toFixed(1);
      ratingRow.appendChild(ratingText);
      card.appendChild(ratingRow);

      // Specialties if present
      var specs = mentor.specialties || mentor.specialty || [];
      if (typeof specs === 'string') specs = [specs];
      if (specs.length > 0) {
        var specRow = document.createElement('div');
        specRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px;';
        for (var sp = 0; sp < specs.length; sp++) {
          var specChip = document.createElement('span');
          specChip.className = 'dos-chip dos-chip-green';
          specChip.style.cssText = 'font-size:11px;padding:2px 8px;min-height:20px;';
          specChip.textContent = specs[sp];
          specRow.appendChild(specChip);
        }
        card.appendChild(specRow);
      }

      // Buttons row
      var btnRow = document.createElement('div');
      btnRow.style.cssText = 'display:flex;gap:8px;';

      var requestBtn = document.createElement('button');
      requestBtn.className = 'dos-btn-primary';
      requestBtn.style.cssText = 'flex:1;padding:10px;font-size:14px;';
      requestBtn.textContent = 'Request Session';
      var requestHandler = function () {
        requestBtn.textContent = 'Requesting...';
        requestBtn.disabled = true;
        DOS.bridge.send('requestMentorSession', { mentorId: mentor.id || mentor._id });
      };
      requestBtn.addEventListener('click', requestHandler);
      self._listeners.push({ el: requestBtn, type: 'click', fn: requestHandler });

      var profileBtn = document.createElement('button');
      profileBtn.className = 'dos-btn-ghost';
      profileBtn.style.cssText = 'flex:0 0 auto;padding:10px 16px;font-size:14px;';
      profileBtn.textContent = 'Profile';
      var profileHandler = function () {
        DOS.views.mount('mentor-profile');
        // Send mentor ID to the profile view after mount
        setTimeout(function () {
          if (DOS.bridge) {
            DOS.bridge.send('getMentorProfile', { mentorId: mentor.id || mentor._id });
          }
        }, 100);
      };
      profileBtn.addEventListener('click', profileHandler);
      self._listeners.push({ el: profileBtn, type: 'click', fn: profileHandler });

      btnRow.appendChild(requestBtn);
      btnRow.appendChild(profileBtn);
      card.appendChild(btnRow);

      return card;
    },

    unmount: function () {
      this._listeners.forEach(function (l) { l.el.removeEventListener(l.type, l.fn); });
      this._listeners = [];
      this._listEl = null;
      this._pillRow = null;
      this._root = null;
    },

    onMessage: function (action, payload) {
      if (action === 'mentorsLoaded') {
        this._mentors = payload.mentors || [];
        this._renderMentors();
      } else if (action === 'sessionRequested') {
        if (payload.success) {
          this._showToast('Session request sent!');
        }
      }
    },

    _showToast: function (msg) {
      if (!this._root) return;
      var toast = document.createElement('div');
      toast.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#0f172a;color:#fff;padding:12px 24px;border-radius:12px;font-size:14px;font-weight:600;z-index:70;';
      toast.textContent = msg;
      this._root.appendChild(toast);
      setTimeout(function () { toast.remove(); }, 2500);
    },

    getSnapshot: function () {
      return { mentorCount: this._mentors.length, activeFilter: this._activeFilter };
    }
  };
})();
