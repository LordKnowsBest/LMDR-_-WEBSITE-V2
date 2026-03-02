/**
 * dos-view-mentor-profile.js
 * Mentor profile detail — avatar, bio, experience, availability grid, reviews.
 */
(function () {
  'use strict';
  window.DOS = window.DOS || {};
  DOS.viewModules = DOS.viewModules || {};

  var DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  var TIMES = ['Morning', 'Afternoon', 'Evening'];

  DOS.viewModules['mentor-profile'] = {
    _listeners: [],
    _root: null,
    _mentor: null,
    _loading: true,

    mount: function (root) {
      while (root.firstChild) root.removeChild(root.firstChild);
      this._root = root;
      this._mentor = null;
      this._loading = true;

      var container = document.createElement('div');
      container.className = 'dos-container';
      container.style.paddingTop = '16px';

      // Back button
      var backBtn = document.createElement('button');
      backBtn.style.cssText = 'background:none;border:none;display:flex;align-items:center;gap:4px;color:#2563eb;font-weight:600;font-size:14px;cursor:pointer;padding:8px 0;min-height:48px;margin-bottom:8px;';
      var backIcon = document.createElement('span');
      backIcon.className = 'material-symbols-outlined';
      backIcon.textContent = 'arrow_back';
      backIcon.style.fontSize = '20px';
      var backLabel = document.createElement('span');
      backLabel.textContent = 'Back to Mentors';
      backBtn.appendChild(backIcon);
      backBtn.appendChild(backLabel);
      var backHandler = function () { DOS.views.mount('mentors'); };
      backBtn.addEventListener('click', backHandler);
      this._listeners.push({ el: backBtn, type: 'click', fn: backHandler });
      container.appendChild(backBtn);

      // Content placeholder
      var contentEl = document.createElement('div');
      contentEl.id = 'mentor-profile-content';
      container.appendChild(contentEl);

      root.appendChild(container);

      // Show skeleton
      this._showSkeleton(contentEl);

      // If bridge sends the profile via ready signal, it comes through onMessage
      if (DOS.bridge) {
        DOS.bridge.send('mentorProfileReady', {});
      }
    },

    _showSkeleton: function (el) {
      while (el.firstChild) el.removeChild(el.firstChild);
      // Avatar skeleton
      var avatarSkel = document.createElement('div');
      avatarSkel.className = 'dos-skeleton';
      avatarSkel.style.cssText = 'width:80px;height:80px;border-radius:50%;margin:0 auto 16px;';
      el.appendChild(avatarSkel);
      for (var i = 0; i < 4; i++) {
        var skel = document.createElement('div');
        skel.className = 'dos-skeleton';
        skel.style.cssText = 'height:20px;margin-bottom:12px;border-radius:8px;';
        if (i === 0) skel.style.width = '60%';
        el.appendChild(skel);
      }
    },

    _renderProfile: function () {
      var contentEl = document.getElementById('mentor-profile-content');
      if (!contentEl || !this._mentor) return;
      while (contentEl.firstChild) contentEl.removeChild(contentEl.firstChild);

      var m = this._mentor;

      // Avatar + name
      var headerSection = document.createElement('div');
      headerSection.style.cssText = 'text-align:center;margin-bottom:20px;';

      var avatar = document.createElement('div');
      avatar.style.cssText = 'width:80px;height:80px;border-radius:50%;background:#dbeafe;display:flex;align-items:center;justify-content:center;margin:0 auto 12px;';
      var avatarIcon = document.createElement('span');
      avatarIcon.className = 'material-symbols-outlined';
      avatarIcon.textContent = 'person';
      avatarIcon.style.cssText = 'font-size:40px;color:#2563eb;';
      avatar.appendChild(avatarIcon);
      headerSection.appendChild(avatar);

      var name = document.createElement('h1');
      name.className = 'dos-text-heading';
      name.textContent = m.name || m.fullName || 'Mentor';
      headerSection.appendChild(name);

      if (m.title || m.bio) {
        var title = document.createElement('p');
        title.className = 'dos-text-body';
        title.textContent = m.title || m.bio || '';
        title.style.marginTop = '4px';
        headerSection.appendChild(title);
      }

      // CDL info row
      var infoRow = document.createElement('div');
      infoRow.style.cssText = 'display:flex;justify-content:center;gap:8px;margin-top:8px;';
      var cdlChip = document.createElement('span');
      cdlChip.className = 'dos-chip dos-chip-blue';
      cdlChip.textContent = m.cdlClass || m.cdl_class || 'CDL';
      infoRow.appendChild(cdlChip);

      var expChip = document.createElement('span');
      expChip.className = 'dos-chip dos-chip-amber';
      var years = m.yearsExperience || m.years_experience || 0;
      expChip.textContent = years + ' yrs exp';
      infoRow.appendChild(expChip);

      // Rating chip
      var ratingChip = document.createElement('span');
      ratingChip.className = 'dos-chip dos-chip-green';
      var starIcon = document.createElement('span');
      starIcon.className = 'material-symbols-outlined';
      starIcon.textContent = 'star';
      starIcon.style.cssText = 'font-size:14px;';
      ratingChip.appendChild(starIcon);
      var ratingVal = document.createElement('span');
      ratingVal.textContent = (m.rating || 0).toFixed(1);
      ratingChip.appendChild(ratingVal);
      infoRow.appendChild(ratingChip);

      headerSection.appendChild(infoRow);
      contentEl.appendChild(headerSection);

      // Experience section
      var expSection = this._buildSection('Experience', 'work');
      var expCard = document.createElement('div');
      expCard.className = 'dos-card';

      var specialties = m.specialties || [];
      if (typeof specialties === 'string') specialties = [specialties];
      if (specialties.length > 0) {
        var specLabel = document.createElement('div');
        specLabel.className = 'dos-text-small';
        specLabel.textContent = 'Specialties';
        specLabel.style.marginBottom = '6px';
        expCard.appendChild(specLabel);

        var specRow = document.createElement('div');
        specRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px;';
        for (var i = 0; i < specialties.length; i++) {
          var chip = document.createElement('span');
          chip.className = 'dos-chip dos-chip-green';
          chip.style.cssText = 'font-size:11px;padding:2px 8px;min-height:20px;';
          chip.textContent = specialties[i];
          specRow.appendChild(chip);
        }
        expCard.appendChild(specRow);
      }

      var companies = m.companies || m.previousCompanies || [];
      if (companies.length > 0) {
        var compLabel = document.createElement('div');
        compLabel.className = 'dos-text-small';
        compLabel.textContent = 'Companies';
        compLabel.style.marginBottom = '6px';
        expCard.appendChild(compLabel);

        for (var c = 0; c < companies.length; c++) {
          var compItem = document.createElement('div');
          compItem.className = 'dos-text-body';
          compItem.style.cssText = 'padding:4px 0;';
          compItem.textContent = typeof companies[c] === 'string' ? companies[c] : (companies[c].name || '');
          expCard.appendChild(compItem);
        }
      }

      expSection.appendChild(expCard);
      contentEl.appendChild(expSection);

      // Availability grid
      var avail = m.availability || {};
      var availSection = this._buildSection('Availability', 'calendar_month');
      var gridCard = document.createElement('div');
      gridCard.className = 'dos-card';
      gridCard.style.overflowX = 'auto';

      var table = document.createElement('table');
      table.style.cssText = 'width:100%;border-collapse:collapse;font-size:13px;';

      // Header row
      var thead = document.createElement('tr');
      var emptyTh = document.createElement('th');
      emptyTh.style.cssText = 'padding:6px 8px;text-align:left;';
      thead.appendChild(emptyTh);
      for (var d = 0; d < DAYS.length; d++) {
        var th = document.createElement('th');
        th.style.cssText = 'padding:6px 4px;text-align:center;color:#94a3b8;font-weight:500;font-size:12px;';
        th.textContent = DAYS[d];
        thead.appendChild(th);
      }
      table.appendChild(thead);

      // Time rows
      for (var t = 0; t < TIMES.length; t++) {
        var tr = document.createElement('tr');
        var labelTd = document.createElement('td');
        labelTd.style.cssText = 'padding:6px 8px;font-weight:500;color:#475569;font-size:12px;white-space:nowrap;';
        labelTd.textContent = TIMES[t];
        tr.appendChild(labelTd);

        for (var d2 = 0; d2 < DAYS.length; d2++) {
          var td = document.createElement('td');
          td.style.cssText = 'padding:4px;text-align:center;';
          var dayKey = DAYS[d2].toLowerCase();
          var timeKey = TIMES[t].toLowerCase();
          var isAvailable = avail[dayKey] && avail[dayKey][timeKey];
          if (!isAvailable && avail[dayKey] && Array.isArray(avail[dayKey])) {
            isAvailable = avail[dayKey].indexOf(timeKey) >= 0;
          }

          var dot = document.createElement('span');
          dot.className = 'material-symbols-outlined';
          dot.textContent = isAvailable ? 'check_circle' : 'cancel';
          dot.style.cssText = 'font-size:18px;color:' + (isAvailable ? '#22c55e' : '#e2e8f0') + ';';
          td.appendChild(dot);
          tr.appendChild(td);
        }
        table.appendChild(tr);
      }

      gridCard.appendChild(table);
      availSection.appendChild(gridCard);
      contentEl.appendChild(availSection);

      // Reviews section
      var reviewsSection = this._buildSection('Reviews from Mentees', 'rate_review');
      var reviews = m.reviews || [];
      if (reviews.length === 0) {
        var noReviews = document.createElement('p');
        noReviews.className = 'dos-text-small';
        noReviews.textContent = 'No reviews yet.';
        noReviews.style.textAlign = 'center';
        reviewsSection.appendChild(noReviews);
      } else {
        for (var r = 0; r < reviews.length; r++) {
          reviewsSection.appendChild(this._renderReviewCard(reviews[r]));
        }
      }
      contentEl.appendChild(reviewsSection);

      // Schedule Session CTA
      var ctaWrap = document.createElement('div');
      ctaWrap.style.cssText = 'padding:16px 0 24px;';
      var ctaBtn = document.createElement('button');
      ctaBtn.className = 'dos-btn-primary';
      ctaBtn.style.width = '100%';
      ctaBtn.textContent = 'Schedule Session';
      var self = this;
      var ctaHandler = function () {
        ctaBtn.textContent = 'Requesting...';
        ctaBtn.disabled = true;
        DOS.bridge.send('requestMentorSession', { mentorId: m.id || m._id });
      };
      ctaBtn.addEventListener('click', ctaHandler);
      this._listeners.push({ el: ctaBtn, type: 'click', fn: ctaHandler });
      ctaWrap.appendChild(ctaBtn);
      contentEl.appendChild(ctaWrap);
    },

    _buildSection: function (titleText, iconName) {
      var section = document.createElement('div');
      section.style.marginBottom = '20px';

      var header = document.createElement('div');
      header.style.cssText = 'display:flex;align-items:center;gap:6px;margin-bottom:10px;';
      var icon = document.createElement('span');
      icon.className = 'material-symbols-outlined';
      icon.textContent = iconName;
      icon.style.cssText = 'font-size:20px;color:#2563eb;';
      var title = document.createElement('h2');
      title.className = 'dos-text-subheading';
      title.textContent = titleText;
      header.appendChild(icon);
      header.appendChild(title);
      section.appendChild(header);

      return section;
    },

    _renderReviewCard: function (review) {
      var card = document.createElement('div');
      card.className = 'dos-card';
      card.style.marginBottom = '8px';

      var rRow = document.createElement('div');
      rRow.style.cssText = 'display:flex;align-items:center;gap:4px;margin-bottom:6px;';
      for (var s = 0; s < 5; s++) {
        var star = document.createElement('span');
        star.className = 'material-symbols-outlined';
        star.textContent = s < (review.rating || 0) ? 'star' : 'star_border';
        star.style.cssText = 'font-size:14px;color:' + (s < (review.rating || 0) ? '#fbbf24' : '#cbd5e1') + ';';
        rRow.appendChild(star);
      }
      if (review.author) {
        var author = document.createElement('span');
        author.className = 'dos-text-small';
        author.style.marginLeft = '6px';
        author.textContent = review.author;
        rRow.appendChild(author);
      }
      card.appendChild(rRow);

      var text = document.createElement('p');
      text.className = 'dos-text-body';
      text.style.fontSize = '14px';
      text.textContent = review.text || review.content || '';
      card.appendChild(text);

      return card;
    },

    unmount: function () {
      this._listeners.forEach(function (l) { l.el.removeEventListener(l.type, l.fn); });
      this._listeners = [];
      this._root = null;
    },

    onMessage: function (action, payload) {
      if (action === 'mentorProfileLoaded') {
        this._mentor = payload.mentor || payload;
        this._loading = false;
        this._renderProfile();
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
      return { mentorId: this._mentor ? (this._mentor.id || this._mentor._id) : null };
    }
  };
})();
