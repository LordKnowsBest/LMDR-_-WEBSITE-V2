/**
 * dos-view-career.js
 * DriverOS Career Profile Management view.
 * CDL info, experience, endorsements, preferences with edit mode.
 */
(function () {
  'use strict';
  window.DOS = window.DOS || {};
  DOS.viewModules = DOS.viewModules || {};

  var CDL_CLASSES = ['Class A', 'Class B', 'Class C'];
  var ENDORSEMENTS_LIST = ['Hazmat', 'Tanker', 'Doubles/Triples', 'Passenger', 'School Bus'];
  var JOB_TYPES = ['OTR', 'Regional', 'Local', 'Dedicated', 'Team'];
  var state = { profile: null, loading: true, editMode: false };

  function icon(name) {
    var s = document.createElement('span');
    s.className = 'material-symbols-outlined';
    s.textContent = name;
    return s;
  }

  function skeleton() {
    var wrap = document.createElement('div');
    for (var i = 0; i < 5; i++) {
      var sk = document.createElement('div');
      sk.className = 'dos-card';
      sk.style.height = '80px';
      sk.style.marginBottom = '12px';
      sk.style.background = 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)';
      sk.style.backgroundSize = '200% 100%';
      sk.style.animation = 'dosShimmer 1.5s infinite';
      wrap.appendChild(sk);
    }
    return wrap;
  }

  function buildReadOnlyField(label, value) {
    var row = document.createElement('div');
    row.style.marginBottom = '10px';
    var lab = document.createElement('p');
    lab.className = 'dos-text-small';
    lab.style.fontWeight = '600';
    lab.textContent = label;
    row.appendChild(lab);
    var val = document.createElement('p');
    val.className = 'dos-text-body';
    val.textContent = value || '--';
    row.appendChild(val);
    return row;
  }

  function buildSection(titleText, iconName, content) {
    var card = document.createElement('div');
    card.className = 'dos-card';
    card.style.marginBottom = '12px';

    var header = document.createElement('div');
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.gap = '8px';
    header.style.marginBottom = '12px';

    var ic = icon(iconName);
    ic.style.fontSize = '22px';
    ic.style.color = '#2563eb';
    header.appendChild(ic);

    var title = document.createElement('h3');
    title.className = 'dos-text-subheading';
    title.textContent = titleText;
    header.appendChild(title);

    card.appendChild(header);
    card.appendChild(content);
    return card;
  }

  function buildReadView(profile, self) {
    var wrap = document.createElement('div');
    var p = profile || {};

    // CDL Info
    var cdlContent = document.createElement('div');
    cdlContent.appendChild(buildReadOnlyField('CDL Class', p.cdlClass || p.cdl_class));
    cdlContent.appendChild(buildReadOnlyField('CDL Number', p.cdlNumber || p.cdl_number));
    cdlContent.appendChild(buildReadOnlyField('CDL State', p.cdlState || p.cdl_state));
    cdlContent.appendChild(buildReadOnlyField('Expiration', p.cdlExpiration || p.cdl_expiration));
    wrap.appendChild(buildSection('CDL Information', 'badge', cdlContent));

    // Experience
    var expContent = document.createElement('div');
    expContent.appendChild(buildReadOnlyField('Years Experience', p.yearsExperience || p.years_experience));
    expContent.appendChild(buildReadOnlyField('Total Miles', p.totalMiles || p.total_miles));
    expContent.appendChild(buildReadOnlyField('Accident History', p.accidentFree === true || p.accident_free === 'Yes' ? 'Clean record' : p.accidentHistory || 'Not specified'));
    wrap.appendChild(buildSection('Experience', 'timeline', expContent));

    // Endorsements
    var endContent = document.createElement('div');
    var endorsements = p.endorsements || [];
    if (typeof endorsements === 'string') endorsements = endorsements.split(',').map(function (e) { return e.trim(); });
    if (endorsements.length > 0) {
      var chipRow = document.createElement('div');
      chipRow.style.display = 'flex';
      chipRow.style.flexWrap = 'wrap';
      chipRow.style.gap = '6px';
      endorsements.forEach(function (e) {
        var chip = document.createElement('span');
        chip.className = 'dos-chip dos-chip-blue';
        chip.textContent = e;
        chipRow.appendChild(chip);
      });
      endContent.appendChild(chipRow);
    } else {
      var none = document.createElement('p');
      none.className = 'dos-text-body';
      none.style.color = '#94a3b8';
      none.textContent = 'No endorsements added';
      endContent.appendChild(none);
    }
    wrap.appendChild(buildSection('Endorsements', 'verified', endContent));

    // Preferences
    var prefContent = document.createElement('div');
    prefContent.appendChild(buildReadOnlyField('Preferred Job Type', p.preferredJobType || p.preferred_job_type));
    prefContent.appendChild(buildReadOnlyField('Preferred Region', p.preferredRegion || p.preferred_region || p.preferredState || p.preferred_state));
    prefContent.appendChild(buildReadOnlyField('Minimum Pay', p.minimumPay || p.min_pay ? '$' + (p.minimumPay || p.min_pay) : '--'));
    prefContent.appendChild(buildReadOnlyField('Home Time Preference', p.homeTime || p.home_time_preference));
    wrap.appendChild(buildSection('Preferences', 'tune', prefContent));

    return wrap;
  }

  function buildEditView(profile, self) {
    var wrap = document.createElement('div');
    var p = profile || {};
    self._editFields = {};

    // CDL Class
    var cdlContent = document.createElement('div');

    var cdlLabel = document.createElement('label');
    cdlLabel.className = 'dos-text-small';
    cdlLabel.textContent = 'CDL Class';
    cdlLabel.style.display = 'block';
    cdlLabel.style.marginBottom = '4px';
    cdlContent.appendChild(cdlLabel);
    var cdlSelect = document.createElement('select');
    cdlSelect.className = 'dos-input';
    cdlSelect.style.marginBottom = '10px';
    CDL_CLASSES.forEach(function (c) {
      var opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      if (c === (p.cdlClass || p.cdl_class)) opt.selected = true;
      cdlSelect.appendChild(opt);
    });
    cdlContent.appendChild(cdlSelect);
    self._editFields.cdlClass = cdlSelect;

    var stateLabel = document.createElement('label');
    stateLabel.className = 'dos-text-small';
    stateLabel.textContent = 'CDL State';
    stateLabel.style.display = 'block';
    stateLabel.style.marginBottom = '4px';
    cdlContent.appendChild(stateLabel);
    var stateInput = document.createElement('input');
    stateInput.type = 'text';
    stateInput.className = 'dos-input';
    stateInput.style.marginBottom = '10px';
    stateInput.value = p.cdlState || p.cdl_state || '';
    cdlContent.appendChild(stateInput);
    self._editFields.cdlState = stateInput;

    wrap.appendChild(buildSection('CDL Information', 'badge', cdlContent));

    // Experience
    var expContent = document.createElement('div');
    var yearsLabel = document.createElement('label');
    yearsLabel.className = 'dos-text-small';
    yearsLabel.textContent = 'Years Experience';
    yearsLabel.style.display = 'block';
    yearsLabel.style.marginBottom = '4px';
    expContent.appendChild(yearsLabel);
    var yearsInput = document.createElement('input');
    yearsInput.type = 'number';
    yearsInput.className = 'dos-input';
    yearsInput.style.marginBottom = '10px';
    yearsInput.min = '0';
    yearsInput.max = '50';
    yearsInput.value = p.yearsExperience || p.years_experience || '';
    expContent.appendChild(yearsInput);
    self._editFields.yearsExperience = yearsInput;

    var milesLabel = document.createElement('label');
    milesLabel.className = 'dos-text-small';
    milesLabel.textContent = 'Total Miles';
    milesLabel.style.display = 'block';
    milesLabel.style.marginBottom = '4px';
    expContent.appendChild(milesLabel);
    var milesInput = document.createElement('input');
    milesInput.type = 'number';
    milesInput.className = 'dos-input';
    milesInput.style.marginBottom = '10px';
    milesInput.value = p.totalMiles || p.total_miles || '';
    expContent.appendChild(milesInput);
    self._editFields.totalMiles = milesInput;

    wrap.appendChild(buildSection('Experience', 'timeline', expContent));

    // Endorsements
    var endContent = document.createElement('div');
    var currentEndorsements = p.endorsements || [];
    if (typeof currentEndorsements === 'string') currentEndorsements = currentEndorsements.split(',').map(function (e) { return e.trim(); });
    self._selectedEndorsements = {};
    currentEndorsements.forEach(function (e) { self._selectedEndorsements[e] = true; });

    var chipRow = document.createElement('div');
    chipRow.style.display = 'flex';
    chipRow.style.flexWrap = 'wrap';
    chipRow.style.gap = '8px';
    ENDORSEMENTS_LIST.forEach(function (e) {
      var chip = document.createElement('button');
      var isSelected = self._selectedEndorsements[e];
      chip.className = isSelected ? 'dos-chip dos-chip-blue dos-touch-target' : 'dos-chip dos-chip-gray dos-touch-target';
      chip.textContent = e;
      chip.style.cursor = 'pointer';
      chip.setAttribute('aria-pressed', String(!!isSelected));
      var handler = function () {
        self._selectedEndorsements[e] = !self._selectedEndorsements[e];
        chip.className = self._selectedEndorsements[e] ? 'dos-chip dos-chip-blue dos-touch-target' : 'dos-chip dos-chip-gray dos-touch-target';
        chip.setAttribute('aria-pressed', String(self._selectedEndorsements[e]));
      };
      chip.addEventListener('click', handler);
      self._listeners.push({ el: chip, type: 'click', fn: handler });
      chipRow.appendChild(chip);
    });
    endContent.appendChild(chipRow);
    wrap.appendChild(buildSection('Endorsements', 'verified', endContent));

    // Preferences
    var prefContent = document.createElement('div');

    var jobLabel = document.createElement('label');
    jobLabel.className = 'dos-text-small';
    jobLabel.textContent = 'Preferred Job Type';
    jobLabel.style.display = 'block';
    jobLabel.style.marginBottom = '4px';
    prefContent.appendChild(jobLabel);
    var jobSelect = document.createElement('select');
    jobSelect.className = 'dos-input';
    jobSelect.style.marginBottom = '10px';
    JOB_TYPES.forEach(function (j) {
      var opt = document.createElement('option');
      opt.value = j;
      opt.textContent = j;
      if (j === (p.preferredJobType || p.preferred_job_type)) opt.selected = true;
      jobSelect.appendChild(opt);
    });
    prefContent.appendChild(jobSelect);
    self._editFields.preferredJobType = jobSelect;

    var regLabel = document.createElement('label');
    regLabel.className = 'dos-text-small';
    regLabel.textContent = 'Preferred Region / State';
    regLabel.style.display = 'block';
    regLabel.style.marginBottom = '4px';
    prefContent.appendChild(regLabel);
    var regInput = document.createElement('input');
    regInput.type = 'text';
    regInput.className = 'dos-input';
    regInput.style.marginBottom = '10px';
    regInput.value = p.preferredRegion || p.preferred_region || p.preferredState || p.preferred_state || '';
    prefContent.appendChild(regInput);
    self._editFields.preferredRegion = regInput;

    var payLabel = document.createElement('label');
    payLabel.className = 'dos-text-small';
    payLabel.textContent = 'Minimum Pay ($)';
    payLabel.style.display = 'block';
    payLabel.style.marginBottom = '4px';
    prefContent.appendChild(payLabel);
    var payInput = document.createElement('input');
    payInput.type = 'number';
    payInput.className = 'dos-input';
    payInput.style.marginBottom = '10px';
    payInput.value = p.minimumPay || p.min_pay || '';
    prefContent.appendChild(payInput);
    self._editFields.minimumPay = payInput;

    wrap.appendChild(buildSection('Preferences', 'tune', prefContent));

    return wrap;
  }

  DOS.viewModules['career'] = {
    _listeners: [],
    _content: null,
    _editFields: {},
    _selectedEndorsements: {},
    _editToggle: null,
    _saveBtn: null,

    mount: function (root) {
      var self = this;
      while (root.firstChild) root.removeChild(root.firstChild);

      var container = document.createElement('div');
      container.className = 'dos-container';
      container.style.paddingTop = '16px';
      container.style.paddingBottom = '100px';

      // Header with edit toggle
      var header = document.createElement('div');
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';
      header.style.marginBottom = '16px';

      var heading = document.createElement('h1');
      heading.className = 'dos-text-heading';
      heading.textContent = 'Career Profile';
      header.appendChild(heading);

      var editBtn = document.createElement('button');
      editBtn.className = 'dos-btn-ghost dos-touch-target';
      editBtn.style.padding = '8px 16px';
      editBtn.textContent = state.editMode ? 'Cancel' : 'Edit';
      self._editToggle = editBtn;
      var editHandler = function () {
        state.editMode = !state.editMode;
        editBtn.textContent = state.editMode ? 'Cancel' : 'Edit';
        self._renderContent();
      };
      editBtn.addEventListener('click', editHandler);
      self._listeners.push({ el: editBtn, type: 'click', fn: editHandler });
      header.appendChild(editBtn);
      container.appendChild(header);

      self._content = document.createElement('div');
      container.appendChild(self._content);
      root.appendChild(container);

      // Load data
      if (state.profile) {
        self._renderContent();
      } else {
        state.loading = true;
        self._content.appendChild(skeleton());
        DOS.bridge.send('getDriverProfile', {});
      }
    },

    unmount: function () {
      this._listeners.forEach(function (l) { l.el.removeEventListener(l.type, l.fn); });
      this._listeners = [];
      this._content = null;
      this._editToggle = null;
      this._saveBtn = null;
    },

    _renderContent: function () {
      var self = this;
      if (!this._content) return;
      while (this._content.firstChild) this._content.removeChild(this._content.firstChild);

      if (state.editMode) {
        this._content.appendChild(buildEditView(state.profile, self));

        // Save button
        var saveBtn = document.createElement('button');
        saveBtn.className = 'dos-btn-primary dos-full-width';
        saveBtn.style.marginTop = '4px';
        saveBtn.textContent = 'Save Changes';
        self._saveBtn = saveBtn;
        var saveHandler = function () { self._saveProfile(); };
        saveBtn.addEventListener('click', saveHandler);
        self._listeners.push({ el: saveBtn, type: 'click', fn: saveHandler });
        this._content.appendChild(saveBtn);
      } else {
        this._content.appendChild(buildReadView(state.profile, self));
      }
    },

    _saveProfile: function () {
      var fields = this._editFields;
      var endorsements = [];
      var keys = Object.keys(this._selectedEndorsements);
      for (var i = 0; i < keys.length; i++) {
        if (this._selectedEndorsements[keys[i]]) endorsements.push(keys[i]);
      }

      var profileData = {
        cdlClass: fields.cdlClass ? fields.cdlClass.value : undefined,
        cdlState: fields.cdlState ? fields.cdlState.value.trim() : undefined,
        yearsExperience: fields.yearsExperience ? Number(fields.yearsExperience.value) || undefined : undefined,
        totalMiles: fields.totalMiles ? Number(fields.totalMiles.value) || undefined : undefined,
        endorsements: endorsements,
        preferredJobType: fields.preferredJobType ? fields.preferredJobType.value : undefined,
        preferredRegion: fields.preferredRegion ? fields.preferredRegion.value.trim() : undefined,
        minimumPay: fields.minimumPay ? Number(fields.minimumPay.value) || undefined : undefined
      };

      if (this._saveBtn) {
        this._saveBtn.disabled = true;
        this._saveBtn.textContent = 'Saving...';
      }

      DOS.bridge.send('updateProfile', { profileData: profileData });
    },

    onMessage: function (action, payload) {
      if (action === 'driverProfileLoaded') {
        state.loading = false;
        state.profile = payload.profile || payload;
        state.editMode = false;
        if (this._editToggle) this._editToggle.textContent = 'Edit';
        this._renderContent();
      } else if (action === 'profileSaved' || action === 'profileUpdated') {
        state.editMode = false;
        if (this._editToggle) this._editToggle.textContent = 'Edit';
        // Refresh profile data
        DOS.bridge.send('getDriverProfile', {});
      }
    },

    getSnapshot: function () {
      return { editMode: state.editMode, hasProfile: !!state.profile };
    }
  };
})();
