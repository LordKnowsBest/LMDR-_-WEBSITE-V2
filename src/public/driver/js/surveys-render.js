(function () {
  var root = null;

  function getRoot() {
    if (!root) root = document.getElementById('app-root');
    return root;
  }

  function setHTML(html) {
    var el = getRoot();
    if (el) el.innerHTML = html;
  }

  window.SurveysRender = {

    showLoading: function () {
      setHTML(
        '<div class="state-screen">' +
          '<div class="spinner"></div>' +
          '<p class="state-text">Loading your surveys...</p>' +
        '</div>'
      );
    },

    showEmpty: function () {
      setHTML(
        '<div class="state-screen">' +
          '<div class="state-icon">✅</div>' +
          '<h2 class="state-heading">You\'re all caught up!</h2>' +
          '<p class="state-text">No pending surveys right now. Check back after your next milestone.</p>' +
          '<button class="btn-primary" style="max-width:280px;margin-top:12px;" onclick="SurveysLogic.goBack()">Back to Dashboard</button>' +
        '</div>'
      );
    },

    showSurveyList: function (surveys) {
      var cards = surveys.map(function (s) {
        var type = s.survey_type || '';
        var icon = (window.SurveysConfig && SurveysConfig.ICONS[type]) || '📋';
        var label = (window.SurveysConfig && SurveysConfig.LABELS[type]) || type;
        var xp = (window.SurveysConfig && SurveysConfig.XP[type]) || 0;
        var carrier = s.carrier_name || s.carrierName || 'Your Carrier';
        var xpText = xp > 0 ? ' &middot; +' + xp + ' XP' : '';
        return (
          '<button class="survey-card" onclick="SurveysLogic.startSurvey(' +
            JSON.stringify(s.id || s._id || '') + ',' +
            JSON.stringify(type) + ',' +
            JSON.stringify(carrier) +
          ')">' +
            '<span class="survey-icon">' + icon + '</span>' +
            '<div class="survey-card-info">' +
              '<div class="survey-card-title">' + label + '</div>' +
              '<div class="survey-card-meta">' + carrier + xpText + '</div>' +
            '</div>' +
            '<span class="survey-card-arrow">›</span>' +
          '</button>'
        );
      }).join('');

      setHTML(
        '<div class="surveys-header">' +
          '<div class="page-title">📋 Pulse Check</div>' +
          '<div class="page-subtitle">Share your experience and earn XP</div>' +
        '</div>' +
        '<div class="survey-list">' + cards + '</div>'
      );
    },

    showQuestion: function (survey, question, questionIndex, totalQuestions, answers) {
      var type = survey.survey_type || survey.surveyType || '';
      var label = (window.SurveysConfig && SurveysConfig.LABELS[type]) || type || 'Survey';
      var qNum = questionIndex + 1;
      var progressPct = Math.round((questionIndex / totalQuestions) * 100);
      var currentValue = answers[question.id] !== undefined ? answers[question.id] : null;
      var isLast = questionIndex === totalQuestions - 1;
      var isOptional = question.type === 'text_optional';
      var hasAnswer = currentValue !== null && currentValue !== undefined && currentValue !== '';
      var nextDisabled = (!hasAnswer && !isOptional) ? ' disabled' : '';
      var nextLabel = isLast ? 'Submit Survey' : 'Next';

      var skipBtn = isOptional
        ? '<button class="btn-skip" onclick="SurveysLogic.skipQuestion(' + JSON.stringify(question.id) + ')">Skip</button>'
        : '';

      var answerHTML = this.renderAnswerInput(question, currentValue);

      setHTML(
        '<div class="question-screen">' +
          '<div class="question-header">' +
            '<button class="back-btn" onclick="SurveysLogic.prevQuestion()">‹</button>' +
            '<span class="survey-label">' + label + '</span>' +
            '<span class="q-counter">' + qNum + '/' + totalQuestions + '</span>' +
          '</div>' +
          '<div class="progress-bar">' +
            '<div class="progress-fill" id="progressFill" style="width:' + progressPct + '%"></div>' +
          '</div>' +
          '<div class="question-body">' +
            '<div class="question-text">' + question.text + '</div>' +
            '<div class="answers-container" id="answersContainer">' + answerHTML + '</div>' +
          '</div>' +
          '<div class="question-footer">' +
            skipBtn +
            '<button class="btn-primary" id="nextBtn"' + nextDisabled +
              ' onclick="SurveysLogic.nextQuestion(' + JSON.stringify(question.id) + ')">' +
              nextLabel +
            '</button>' +
          '</div>' +
        '</div>'
      );
    },

    renderAnswerInput: function (question, currentValue) {
      var type = question.type;
      if (type === 'scale_1_5') return this._scaleInput(question.id, currentValue);
      if (type === 'yes_no') return this._yesNoInput(question.id, currentValue);
      if (type === 'multiple_choice') return this._multiChoiceInput(question.id, question.options || [], currentValue);
      if (type === 'text_optional' || type === 'text') return this._textInput(question.id, currentValue);
      return '';
    },

    _scaleInput: function (qId, current) {
      var labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];
      var btns = '';
      for (var i = 1; i <= 5; i++) {
        var sel = (current === i || current === String(i)) ? ' selected' : '';
        btns +=
          '<button class="scale-btn' + sel + '" onclick="SurveysLogic.selectAnswer(' + JSON.stringify(qId) + ',' + i + ')">' +
            '<span class="scale-num">' + i + '</span>' +
            '<span class="scale-label">' + labels[i] + '</span>' +
          '</button>';
      }
      return '<div class="scale-row">' + btns + '</div>';
    },

    _yesNoInput: function (qId, current) {
      var yesSel = current === 'yes' ? ' selected' : '';
      var noSel = current === 'no' ? ' selected' : '';
      return (
        '<div class="yes-no-row">' +
          '<button class="yn-btn' + yesSel + '" onclick="SurveysLogic.selectAnswer(' + JSON.stringify(qId) + ',\'yes\')">👍 Yes</button>' +
          '<button class="yn-btn' + noSel + '" onclick="SurveysLogic.selectAnswer(' + JSON.stringify(qId) + ',\'no\')">👎 No</button>' +
        '</div>'
      );
    },

    _multiChoiceInput: function (qId, options, current) {
      var btns = options.map(function (opt) {
        var sel = current === opt ? ' selected' : '';
        var escaped = opt.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        return (
          '<button class="mc-btn' + sel + '" onclick="SurveysLogic.selectAnswer(' +
            JSON.stringify(qId) + ',' + JSON.stringify(opt) +
          ')">' + opt + '</button>'
        );
      }).join('');
      return '<div class="mc-list">' + btns + '</div>';
    },

    _textInput: function (qId, current) {
      var val = current ? String(current).replace(/"/g, '&quot;') : '';
      return (
        '<textarea class="text-input" id="textInput_' + qId + '"' +
          ' placeholder="Type your response here (optional)..."' +
          ' oninput="SurveysLogic.selectAnswer(' + JSON.stringify(qId) + ',this.value)">' +
          val +
        '</textarea>'
      );
    },

    showSubmitting: function () {
      var btn = document.getElementById('nextBtn');
      if (btn) {
        btn.disabled = true;
        btn.textContent = 'Submitting...';
      }
    },

    showComplete: function (surveyType, xpAwarded) {
      var xpPill = (xpAwarded && xpAwarded > 0)
        ? '<div class="xp-pill">+' + xpAwarded + ' XP earned</div>'
        : '';

      setHTML(
        '<div class="state-screen complete-screen">' +
          '<div class="complete-badge">🏆</div>' +
          '<h2 class="state-heading">Survey Complete!</h2>' +
          xpPill +
          '<p class="state-text">Thank you for sharing your experience. Your feedback helps us match drivers with better carriers.</p>' +
          '<button class="btn-primary" style="max-width:280px;margin-top:20px;" onclick="SurveysLogic.afterComplete()">Done</button>' +
        '</div>'
      );
    },

    showError: function (message) {
      var existing = document.querySelector('.error-banner');
      if (existing) existing.remove();

      var banner = document.createElement('div');
      banner.className = 'error-banner';
      banner.textContent = message || 'Something went wrong. Please try again.';

      var el = getRoot();
      if (el) el.insertBefore(banner, el.firstChild);

      setTimeout(function () {
        if (banner.parentNode) banner.parentNode.removeChild(banner);
      }, 4000);
    }

  };
})();
