/**
 * dos-view-surveys.js
 * DriverOS Surveys view — survey list, question cards, star ratings, submit.
 * Extracted from DRIVER_SURVEYS.html + 4 CDN modules.
 */
(function () {
  'use strict';
  window.DOS = window.DOS || {};
  DOS.viewModules = DOS.viewModules || {};

  var STATUS_CHIPS = {
    'new':          { cls: 'dos-chip-blue',  label: 'New' },
    'in-progress':  { cls: 'dos-chip-amber', label: 'In Progress' },
    'in_progress':  { cls: 'dos-chip-amber', label: 'In Progress' },
    'completed':    { cls: 'dos-chip-green', label: 'Completed' }
  };

  var state = {
    subview: 'list',        // 'list' | 'detail'
    surveys: [],
    selectedSurvey: null,
    answers: {}             // questionId -> answer value
  };
  var els = {};

  function h(tag, cls, text) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function icon(name, cls) {
    var sp = h('span', 'material-symbols-outlined' + (cls ? ' ' + cls : ''));
    sp.textContent = name;
    return sp;
  }

  function clearEl(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  function buildUI(root) {
    clearEl(root);

    if (!document.getElementById('dos-surveys-style')) {
      var style = document.createElement('style');
      style.id = 'dos-surveys-style';
      style.textContent =
        '@keyframes dosShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}' +
        '.dos-star{cursor:pointer;-webkit-tap-highlight-color:transparent;transition:color .15s ease}' +
        '.dos-star:active{transform:scale(1.2)}' +
        '.dos-star.filled{color:#fbbf24}' +
        '.dos-star.empty{color:#cbd5e1}';
      document.head.appendChild(style);
    }

    var container = h('div', 'dos-container');
    container.style.paddingTop = '12px';
    container.style.paddingBottom = '80px';

    // Header
    var headerRow = h('div', '');
    headerRow.style.cssText = 'display:flex;align-items:center;gap:12px;margin-bottom:16px';
    headerRow.id = 'sur-header';

    var backBtn = h('button', 'dos-btn-ghost');
    backBtn.id = 'sur-back';
    backBtn.style.cssText = 'display:none;padding:8px;min-width:40px;min-height:40px;border-radius:10px';
    backBtn.appendChild(icon('arrow_back', ''));
    headerRow.appendChild(backBtn);

    var titleEl = h('div', 'dos-text-heading', 'Pulse Surveys');
    titleEl.id = 'sur-title';
    titleEl.style.flex = '1';
    headerRow.appendChild(titleEl);

    container.appendChild(headerRow);

    // Skeleton
    var skel = h('div', '');
    skel.id = 'sur-skeleton';
    for (var i = 0; i < 3; i++) {
      var sk = h('div', 'dos-card');
      sk.style.cssText = 'height:80px;margin-bottom:12px;background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);background-size:200% 100%;animation:dosShimmer 1.5s infinite';
      skel.appendChild(sk);
    }
    container.appendChild(skel);

    // Survey list
    var list = h('div', '');
    list.id = 'sur-list';
    list.style.display = 'none';
    container.appendChild(list);

    // Survey detail (questions)
    var detail = h('div', '');
    detail.id = 'sur-detail';
    detail.style.display = 'none';
    container.appendChild(detail);

    // Empty
    var empty = h('div', 'dos-empty');
    empty.id = 'sur-empty';
    empty.style.display = 'none';
    empty.appendChild(icon('assignment', ''));
    empty.appendChild(h('div', 'dos-text-body', 'No surveys available'));
    container.appendChild(empty);

    root.appendChild(container);
    els = { skeleton: skel, list: list, detail: detail, empty: empty, backBtn: backBtn, title: titleEl };
  }

  function renderSurveyList() {
    clearEl(els.list);
    els.detail.style.display = 'none';
    els.list.style.display = '';
    els.backBtn.style.display = 'none';
    els.title.textContent = 'Pulse Surveys';

    if (state.surveys.length === 0) {
      els.list.style.display = 'none';
      els.empty.style.display = '';
      return;
    }
    els.empty.style.display = 'none';

    state.surveys.forEach(function (survey) {
      var card = h('div', 'dos-card dos-card-interactive');
      card.style.marginBottom = '12px';
      card.setAttribute('data-survey-id', survey._id);

      var top = h('div', '');
      top.style.cssText = 'display:flex;align-items:flex-start;justify-content:space-between;gap:12px';

      var left = h('div', '');
      left.style.cssText = 'flex:1;min-width:0';

      // Status chip
      var statusKey = (survey.status || 'new').replace(/ /g, '_').toLowerCase();
      var statusDef = STATUS_CHIPS[statusKey] || STATUS_CHIPS['new'];
      var statusChip = h('span', 'dos-chip ' + statusDef.cls);
      statusChip.textContent = statusDef.label;
      statusChip.style.cssText = 'font-size:10px;padding:2px 8px;min-height:auto;font-weight:700;margin-bottom:6px;display:inline-flex';
      left.appendChild(statusChip);

      var titleText = h('div', 'dos-text-body', survey.title || 'Survey');
      titleText.style.fontWeight = '700';
      left.appendChild(titleText);

      if (survey.description) {
        var desc = h('div', 'dos-text-small', survey.description);
        desc.style.cssText = 'margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
        left.appendChild(desc);
      }

      // Question count
      var qCount = h('div', 'dos-text-small');
      qCount.style.cssText = 'margin-top:6px;display:flex;align-items:center;gap:4px';
      var qIcon = icon('help_outline', '');
      qIcon.style.fontSize = '16px';
      qCount.appendChild(qIcon);
      qCount.appendChild(document.createTextNode((survey.questions ? survey.questions.length : 0) + ' questions'));
      left.appendChild(qCount);

      top.appendChild(left);

      // Arrow
      var arrow = icon('chevron_right', '');
      arrow.style.cssText = 'font-size:24px;color:#94a3b8;flex-shrink:0';
      top.appendChild(arrow);

      card.appendChild(top);
      els.list.appendChild(card);
    });
  }

  function renderSurveyDetail() {
    var survey = state.selectedSurvey;
    if (!survey) return;

    clearEl(els.detail);
    els.list.style.display = 'none';
    els.empty.style.display = 'none';
    els.detail.style.display = '';
    els.backBtn.style.display = '';
    els.title.textContent = survey.title || 'Survey';

    state.answers = {};
    var questions = survey.questions || [];

    if (survey.description) {
      var descCard = h('div', 'dos-card');
      descCard.style.marginBottom = '12px';
      descCard.appendChild(h('div', 'dos-text-body', survey.description));
      els.detail.appendChild(descCard);
    }

    questions.forEach(function (q, idx) {
      var qCard = h('div', 'dos-card');
      qCard.style.marginBottom = '12px';

      // Question number + text
      var qNum = h('div', 'dos-text-small', 'Question ' + (idx + 1) + ' of ' + questions.length);
      qNum.style.marginBottom = '6px';
      qCard.appendChild(qNum);

      var qText = h('div', 'dos-text-body', q.text || q.question || '');
      qText.style.cssText = 'font-weight:700;margin-bottom:12px';
      qCard.appendChild(qText);

      var qType = (q.type || 'text').toLowerCase();

      if (qType === 'rating' || qType === 'stars') {
        // Star rating (5 stars, 48px each)
        var starRow = h('div', '');
        starRow.style.cssText = 'display:flex;gap:8px;justify-content:center';
        for (var s = 1; s <= 5; s++) {
          var star = icon('star', 'dos-star empty');
          star.style.fontSize = '48px';
          star.setAttribute('data-q-id', q._id || q.id || idx);
          star.setAttribute('data-star', s);
          starRow.appendChild(star);
        }
        qCard.appendChild(starRow);
      } else if (qType === 'choice' || qType === 'multiple_choice' || qType === 'select') {
        // Choice options
        var options = q.options || q.choices || [];
        options.forEach(function (opt) {
          var optBtn = h('button', 'dos-card');
          optBtn.style.cssText = 'display:block;width:100%;text-align:left;margin-bottom:8px;cursor:pointer;-webkit-tap-highlight-color:transparent;border:2px solid transparent;min-height:48px';
          optBtn.setAttribute('data-q-id', q._id || q.id || idx);
          optBtn.setAttribute('data-value', typeof opt === 'string' ? opt : opt.value || opt.label);
          optBtn.textContent = typeof opt === 'string' ? opt : opt.label || opt.value;
          qCard.appendChild(optBtn);
        });
      } else if (qType === 'scale' || qType === 'nps') {
        // NPS 0-10 scale
        var scaleRow = h('div', '');
        scaleRow.style.cssText = 'display:flex;gap:4px;justify-content:center;flex-wrap:wrap';
        for (var n = 0; n <= 10; n++) {
          var numBtn = h('button', '');
          numBtn.style.cssText = 'width:40px;height:40px;border-radius:10px;border:2px solid #e2e8f0;font-weight:700;font-size:14px;cursor:pointer;background:#fff;color:#475569;-webkit-tap-highlight-color:transparent;transition:all .15s';
          numBtn.textContent = n;
          numBtn.setAttribute('data-q-id', q._id || q.id || idx);
          numBtn.setAttribute('data-value', n);
          scaleRow.appendChild(numBtn);
        }
        qCard.appendChild(scaleRow);
      } else {
        // Text input (default)
        var input = h('textarea', 'dos-textarea');
        input.placeholder = 'Your answer...';
        input.rows = 3;
        input.setAttribute('data-q-id', q._id || q.id || idx);
        qCard.appendChild(input);
      }

      els.detail.appendChild(qCard);
    });

    // Submit button
    if (survey.status !== 'completed') {
      var submitWrap = h('div', '');
      submitWrap.style.cssText = 'padding:16px 0';
      var submitBtn = h('button', 'dos-btn-primary dos-full-width', 'Submit Survey');
      submitBtn.id = 'sur-submit';
      submitBtn.style.cssText = 'width:100%;min-height:52px;font-size:16px';
      submitWrap.appendChild(submitBtn);
      els.detail.appendChild(submitWrap);
    }
  }

  function collectAnswers() {
    var questions = (state.selectedSurvey && state.selectedSurvey.questions) || [];
    var answers = {};
    questions.forEach(function (q, idx) {
      var qId = q._id || q.id || idx;
      if (state.answers[qId] !== undefined) {
        answers[qId] = state.answers[qId];
      } else {
        // Check textarea
        var textarea = els.detail.querySelector('textarea[data-q-id="' + qId + '"]');
        if (textarea && textarea.value.trim()) {
          answers[qId] = textarea.value.trim();
        }
      }
    });
    return answers;
  }

  function bindEvents(self) {
    // Survey list clicks
    var listFn = function (e) {
      var card = e.target.closest('[data-survey-id]');
      if (!card) return;
      var sid = card.getAttribute('data-survey-id');
      var survey = state.surveys.find(function (s) { return s._id === sid; });
      if (survey) {
        state.selectedSurvey = survey;
        state.subview = 'detail';
        state.answers = {};
        renderSurveyDetail();
      }
    };
    els.list.addEventListener('click', listFn);
    self._listeners.push({ el: els.list, type: 'click', fn: listFn });

    // Back button
    var backFn = function () {
      state.subview = 'list';
      state.selectedSurvey = null;
      state.answers = {};
      renderSurveyList();
    };
    els.backBtn.addEventListener('click', backFn);
    self._listeners.push({ el: els.backBtn, type: 'click', fn: backFn });

    // Detail interactions (stars, choices, scale, submit)
    var detailFn = function (e) {
      var target = e.target;

      // Star rating
      var starEl = target.closest('.dos-star');
      if (starEl) {
        var qId = starEl.getAttribute('data-q-id');
        var val = parseInt(starEl.getAttribute('data-star'), 10);
        state.answers[qId] = val;
        // Update star visuals
        var siblings = starEl.parentElement.querySelectorAll('.dos-star');
        for (var i = 0; i < siblings.length; i++) {
          var sv = parseInt(siblings[i].getAttribute('data-star'), 10);
          siblings[i].className = 'material-symbols-outlined dos-star ' + (sv <= val ? 'filled' : 'empty');
        }
        return;
      }

      // Choice option
      var choiceEl = target.closest('button[data-q-id][data-value]');
      if (choiceEl && !choiceEl.id) {
        var qIdC = choiceEl.getAttribute('data-q-id');
        var valC = choiceEl.getAttribute('data-value');
        state.answers[qIdC] = valC;
        // Highlight selected
        var parent = choiceEl.parentElement;
        var allBtns = parent.querySelectorAll('button[data-q-id="' + qIdC + '"]');
        for (var j = 0; j < allBtns.length; j++) {
          allBtns[j].style.borderColor = allBtns[j].getAttribute('data-value') === valC ? '#2563eb' : 'transparent';
          allBtns[j].style.background = allBtns[j].getAttribute('data-value') === valC ? '#dbeafe' : '#fff';
        }
        return;
      }

      // Submit
      if (target.closest('#sur-submit')) {
        var answers = collectAnswers();
        if (!state.selectedSurvey) return;
        DOS.bridge.send('submitSurvey', { surveyId: state.selectedSurvey._id, answers: answers });
        var btn = target.closest('#sur-submit');
        btn.textContent = 'Submitting...';
        btn.disabled = true;
        return;
      }
    };
    els.detail.addEventListener('click', detailFn);
    self._listeners.push({ el: els.detail, type: 'click', fn: detailFn });
  }

  DOS.viewModules['surveys'] = {
    _listeners: [],

    mount: function (root) {
      buildUI(root);
      bindEvents(this);
      DOS.bridge.send('getSurveys', {});
    },

    unmount: function () {
      this._listeners.forEach(function (l) { l.el.removeEventListener(l.type, l.fn); });
      this._listeners = [];
      els = {};
      state.subview = 'list';
      state.selectedSurvey = null;
      state.answers = {};
    },

    onMessage: function (action, payload) {
      if (action === 'surveysLoaded') {
        var d = payload || {};
        state.surveys = d.surveys || d.items || [];
        if (els.skeleton) els.skeleton.style.display = 'none';
        renderSurveyList();
      } else if (action === 'surveySubmitted') {
        // Mark as completed in local state
        if (state.selectedSurvey) {
          state.selectedSurvey.status = 'completed';
          var idx = state.surveys.findIndex(function (s) { return s._id === state.selectedSurvey._id; });
          if (idx >= 0) state.surveys[idx].status = 'completed';
        }
        // Go back to list
        state.subview = 'list';
        state.selectedSurvey = null;
        state.answers = {};
        renderSurveyList();
      }
    },

    getSnapshot: function () {
      return { subview: state.subview, surveyCount: state.surveys.length, selectedId: state.selectedSurvey ? state.selectedSurvey._id : null };
    }
  };
})();
