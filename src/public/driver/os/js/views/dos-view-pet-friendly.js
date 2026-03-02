/**
 * dos-view-pet-friendly.js
 * Pet-friendly locations — search, location cards, amenity chips, reviews.
 */
(function () {
  'use strict';
  window.DOS = window.DOS || {};
  DOS.viewModules = DOS.viewModules || {};

  var AMENITIES = ['Dog Park', 'Water Station', 'Shade', 'Fenced Area', 'Pet Wash', 'Waste Bags', 'Vet Nearby'];

  DOS.viewModules['pet-friendly'] = {
    _listeners: [],
    _root: null,
    _listEl: null,
    _locations: [],
    _selectedLocation: null,
    _loading: false,

    mount: function (root) {
      while (root.firstChild) root.removeChild(root.firstChild);
      this._root = root;
      this._locations = [];
      this._selectedLocation = null;
      this._loading = true;

      var container = document.createElement('div');
      container.className = 'dos-container';
      container.style.paddingTop = '16px';

      // Header
      var heading = document.createElement('h1');
      heading.className = 'dos-text-heading';
      heading.textContent = 'Pet-Friendly Stops';
      heading.style.marginBottom = '4px';
      container.appendChild(heading);

      var subtitle = document.createElement('p');
      subtitle.className = 'dos-text-small';
      subtitle.textContent = 'Find pet-friendly truck stops and rest areas';
      subtitle.style.marginBottom = '12px';
      container.appendChild(subtitle);

      // Search input
      var searchWrap = document.createElement('div');
      searchWrap.style.cssText = 'position:relative;margin-bottom:16px;';
      var searchIcon = document.createElement('span');
      searchIcon.className = 'material-symbols-outlined';
      searchIcon.textContent = 'pets';
      searchIcon.style.cssText = 'position:absolute;left:12px;top:50%;transform:translateY(-50%);color:#94a3b8;font-size:20px;';
      var searchInput = document.createElement('input');
      searchInput.className = 'dos-input';
      searchInput.type = 'text';
      searchInput.placeholder = 'Search by city, state, or ZIP...';
      searchInput.style.paddingLeft = '40px';
      searchWrap.appendChild(searchIcon);
      searchWrap.appendChild(searchInput);
      container.appendChild(searchWrap);

      var self = this;
      var searchHandler = debounce(function () {
        var q = searchInput.value.trim();
        if (q.length >= 2 && DOS.bridge) {
          self._loading = true;
          self._showSkeleton();
          DOS.bridge.send('searchPetFriendly', { filters: { query: q }, radius: 50 });
        }
      }, 400);
      searchInput.addEventListener('input', searchHandler);
      this._listeners.push({ el: searchInput, type: 'input', fn: searchHandler });

      // Results list
      var listEl = document.createElement('div');
      listEl.className = 'dos-grid';
      this._listEl = listEl;
      container.appendChild(listEl);

      root.appendChild(container);

      // Initial load
      this._showSkeleton();
      if (DOS.bridge) {
        DOS.bridge.send('searchPetFriendly', { filters: {}, radius: 50 });
      }
    },

    _showSkeleton: function () {
      if (!this._listEl) return;
      while (this._listEl.firstChild) this._listEl.removeChild(this._listEl.firstChild);
      for (var i = 0; i < 3; i++) {
        var skel = document.createElement('div');
        skel.className = 'dos-card dos-skeleton';
        skel.style.height = '130px';
        this._listEl.appendChild(skel);
      }
    },

    _renderLocations: function () {
      if (!this._listEl) return;
      while (this._listEl.firstChild) this._listEl.removeChild(this._listEl.firstChild);
      this._loading = false;

      if (this._locations.length === 0) {
        var empty = document.createElement('div');
        empty.className = 'dos-empty';
        var emptyIcon = document.createElement('span');
        emptyIcon.className = 'material-symbols-outlined';
        emptyIcon.textContent = 'pets';
        var emptyText = document.createElement('p');
        emptyText.className = 'dos-text-body';
        emptyText.textContent = 'No pet-friendly locations found nearby.';
        empty.appendChild(emptyIcon);
        empty.appendChild(emptyText);
        this._listEl.appendChild(empty);
        return;
      }

      for (var i = 0; i < this._locations.length; i++) {
        this._listEl.appendChild(this._renderLocationCard(this._locations[i]));
      }
    },

    _renderLocationCard: function (loc) {
      var self = this;
      var card = document.createElement('div');
      card.className = 'dos-card-interactive';

      // Top row: name + distance
      var topRow = document.createElement('div');
      topRow.style.cssText = 'display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px;';

      var name = document.createElement('div');
      name.style.cssText = 'font-size:16px;font-weight:700;color:#0f172a;flex:1;';
      name.textContent = loc.name || 'Unknown Location';

      var distEl = document.createElement('div');
      distEl.className = 'dos-chip dos-chip-gray';
      distEl.style.cssText = 'font-size:11px;padding:2px 8px;min-height:22px;flex-shrink:0;margin-left:8px;';
      distEl.textContent = loc.distance ? loc.distance + ' mi' : '--';

      topRow.appendChild(name);
      topRow.appendChild(distEl);
      card.appendChild(topRow);

      // Address
      var addr = document.createElement('div');
      addr.className = 'dos-text-small';
      addr.textContent = loc.address || '';
      addr.style.marginBottom = '8px';
      card.appendChild(addr);

      // Star rating
      var ratingRow = document.createElement('div');
      ratingRow.style.cssText = 'display:flex;align-items:center;gap:4px;margin-bottom:8px;';
      var rating = loc.rating || 0;
      for (var s = 0; s < 5; s++) {
        var star = document.createElement('span');
        star.className = 'material-symbols-outlined';
        star.textContent = s < Math.round(rating) ? 'star' : 'star_border';
        star.style.cssText = 'font-size:18px;color:' + (s < Math.round(rating) ? '#fbbf24' : '#cbd5e1') + ';';
        ratingRow.appendChild(star);
      }
      var ratingText = document.createElement('span');
      ratingText.className = 'dos-text-small';
      ratingText.textContent = rating.toFixed(1) + (loc.reviewCount ? ' (' + loc.reviewCount + ')' : '');
      ratingRow.appendChild(ratingText);
      card.appendChild(ratingRow);

      // Amenity chips
      var amenities = loc.amenities || [];
      if (amenities.length > 0) {
        var amenRow = document.createElement('div');
        amenRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;';
        for (var a = 0; a < amenities.length; a++) {
          var chip = document.createElement('span');
          chip.className = 'dos-chip dos-chip-green';
          chip.style.cssText = 'font-size:11px;padding:2px 8px;min-height:22px;';
          chip.textContent = amenities[a];
          amenRow.appendChild(chip);
        }
        card.appendChild(amenRow);
      }

      // Tap handler — show detail
      var tapHandler = function () {
        self._selectedLocation = loc;
        self._showDetailView(loc);
      };
      card.addEventListener('click', tapHandler);
      this._listeners.push({ el: card, type: 'click', fn: tapHandler });

      return card;
    },

    _showDetailView: function (loc) {
      if (!this._root) return;
      var overlay = document.createElement('div');
      overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:60;display:flex;align-items:flex-end;';

      var sheet = document.createElement('div');
      sheet.style.cssText = 'background:#fff;border-radius:16px 16px 0 0;padding:24px 16px;width:100%;max-height:80vh;overflow-y:auto;';

      // Handle bar
      var handle = document.createElement('div');
      handle.style.cssText = 'width:36px;height:4px;background:#cbd5e1;border-radius:2px;margin:0 auto 16px;';
      sheet.appendChild(handle);

      // Name
      var title = document.createElement('h2');
      title.className = 'dos-text-heading';
      title.textContent = loc.name || 'Location';
      title.style.marginBottom = '4px';
      sheet.appendChild(title);

      var addr = document.createElement('p');
      addr.className = 'dos-text-body';
      addr.textContent = loc.address || '';
      addr.style.marginBottom = '12px';
      sheet.appendChild(addr);

      // Amenities
      if (loc.amenities && loc.amenities.length > 0) {
        var amenTitle = document.createElement('h3');
        amenTitle.className = 'dos-text-subheading';
        amenTitle.textContent = 'Amenities';
        amenTitle.style.marginBottom = '8px';
        sheet.appendChild(amenTitle);

        var amenRow = document.createElement('div');
        amenRow.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px;';
        for (var a = 0; a < loc.amenities.length; a++) {
          var chip = document.createElement('span');
          chip.className = 'dos-chip dos-chip-green';
          chip.textContent = loc.amenities[a];
          amenRow.appendChild(chip);
        }
        sheet.appendChild(amenRow);
      }

      // Reviews section
      var reviewTitle = document.createElement('h3');
      reviewTitle.className = 'dos-text-subheading';
      reviewTitle.textContent = 'Reviews';
      reviewTitle.style.marginBottom = '8px';
      sheet.appendChild(reviewTitle);

      var reviewsContainer = document.createElement('div');
      reviewsContainer.id = 'pet-reviews-list';
      var loadingText = document.createElement('p');
      loadingText.className = 'dos-text-small';
      loadingText.textContent = 'Loading reviews...';
      reviewsContainer.appendChild(loadingText);
      sheet.appendChild(reviewsContainer);

      // Add Review form
      var divider = document.createElement('div');
      divider.className = 'dos-divider';
      sheet.appendChild(divider);

      var formTitle = document.createElement('h3');
      formTitle.style.cssText = 'font-size:15px;font-weight:600;color:#0f172a;margin-bottom:8px;';
      formTitle.textContent = 'Add a Review';
      sheet.appendChild(formTitle);

      // Star rating input
      var ratingRow = document.createElement('div');
      ratingRow.style.cssText = 'display:flex;gap:4px;margin-bottom:8px;';
      var selectedRating = 0;
      var stars = [];
      var self = this;

      for (var s = 0; s < 5; s++) {
        (function (idx) {
          var star = document.createElement('button');
          star.style.cssText = 'background:none;border:none;cursor:pointer;padding:4px;min-width:44px;min-height:44px;display:flex;align-items:center;justify-content:center;';
          var starIcon = document.createElement('span');
          starIcon.className = 'material-symbols-outlined';
          starIcon.textContent = 'star_border';
          starIcon.style.cssText = 'font-size:28px;color:#cbd5e1;';
          star.appendChild(starIcon);
          stars.push(starIcon);

          var starHandler = function () {
            selectedRating = idx + 1;
            for (var j = 0; j < 5; j++) {
              stars[j].textContent = j < selectedRating ? 'star' : 'star_border';
              stars[j].style.color = j < selectedRating ? '#fbbf24' : '#cbd5e1';
            }
          };
          star.addEventListener('click', starHandler);
          self._listeners.push({ el: star, type: 'click', fn: starHandler });
          ratingRow.appendChild(star);
        })(s);
      }
      sheet.appendChild(ratingRow);

      // Review text
      var reviewInput = document.createElement('textarea');
      reviewInput.className = 'dos-textarea';
      reviewInput.placeholder = 'Share your experience...';
      reviewInput.style.marginBottom = '12px';
      sheet.appendChild(reviewInput);

      // Submit review button
      var submitBtn = document.createElement('button');
      submitBtn.className = 'dos-btn-primary';
      submitBtn.textContent = 'Submit Review';
      submitBtn.style.width = '100%';
      var submitHandler = function () {
        if (selectedRating === 0 || !reviewInput.value.trim()) return;
        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;
        DOS.bridge.send('submitPetReview', {
          locationId: loc.id || loc._id,
          reviewData: { rating: selectedRating, text: reviewInput.value.trim() }
        });
      };
      submitBtn.addEventListener('click', submitHandler);
      this._listeners.push({ el: submitBtn, type: 'click', fn: submitHandler });
      sheet.appendChild(submitBtn);

      // Close button
      var closeBtn = document.createElement('button');
      closeBtn.className = 'dos-btn-ghost';
      closeBtn.textContent = 'Close';
      closeBtn.style.cssText = 'width:100%;margin-top:8px;';
      var closeHandler = function () { overlay.remove(); };
      closeBtn.addEventListener('click', closeHandler);
      this._listeners.push({ el: closeBtn, type: 'click', fn: closeHandler });
      sheet.appendChild(closeBtn);

      overlay.addEventListener('click', function (e) { if (e.target === overlay) overlay.remove(); });

      overlay.appendChild(sheet);
      this._root.appendChild(overlay);

      // Request reviews
      if (DOS.bridge && (loc.id || loc._id)) {
        DOS.bridge.send('getReviews', { locationId: loc.id || loc._id });
      }
    },

    unmount: function () {
      this._listeners.forEach(function (l) { l.el.removeEventListener(l.type, l.fn); });
      this._listeners = [];
      this._listEl = null;
      this._root = null;
    },

    onMessage: function (action, payload) {
      if (action === 'petFriendlyLocationsLoaded') {
        this._locations = payload.locations || [];
        this._renderLocations();
      } else if (action === 'reviewsLoaded') {
        this._renderReviews(payload.reviews || []);
      } else if (action === 'petReviewSubmitted') {
        // Refresh the current search
        if (DOS.bridge) DOS.bridge.send('searchPetFriendly', { filters: {}, radius: 50 });
      }
    },

    _renderReviews: function (reviews) {
      var container = document.getElementById('pet-reviews-list');
      if (!container) return;
      while (container.firstChild) container.removeChild(container.firstChild);

      if (reviews.length === 0) {
        var empty = document.createElement('p');
        empty.className = 'dos-text-small';
        empty.textContent = 'No reviews yet. Be the first!';
        container.appendChild(empty);
        return;
      }

      for (var i = 0; i < reviews.length; i++) {
        var r = reviews[i];
        var card = document.createElement('div');
        card.style.cssText = 'padding:8px 0;border-bottom:1px solid #e2e8f0;';

        var rRow = document.createElement('div');
        rRow.style.cssText = 'display:flex;align-items:center;gap:4px;margin-bottom:4px;';
        for (var s = 0; s < 5; s++) {
          var star = document.createElement('span');
          star.className = 'material-symbols-outlined';
          star.textContent = s < (r.rating || 0) ? 'star' : 'star_border';
          star.style.cssText = 'font-size:14px;color:' + (s < (r.rating || 0) ? '#fbbf24' : '#cbd5e1') + ';';
          rRow.appendChild(star);
        }
        card.appendChild(rRow);

        var text = document.createElement('p');
        text.className = 'dos-text-body';
        text.style.fontSize = '14px';
        text.textContent = r.text || r.content || '';
        card.appendChild(text);

        container.appendChild(card);
      }
    },

    getSnapshot: function () {
      return { locationCount: this._locations.length, selectedLocation: this._selectedLocation ? this._selectedLocation.name : null };
    }
  };

  function debounce(fn, ms) {
    var timer;
    return function () { clearTimeout(timer); timer = setTimeout(fn, ms); };
  }
})();
