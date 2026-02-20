(function () {
  var L = {
    state: {
      surveys: [],
      activeSurvey: null,
      activeQuestions: [],
      currentQIndex: 0,
      answers: {},
      submitted: false
    }
  };

  // ── Init ─────────────────────────────────────────────────────────────────

  L.init = function () {
    SurveysRender.showLoading();
    SurveysBridge.listen(function (msg) { L._onMessage(msg); });
    SurveysBridge.ready();
  };

  // ── Message Router ────────────────────────────────────────────────────────

  L._onMessage = function (msg) {
    var payload = msg.payload || {};
    switch (msg.action) {
      case 'init':
        SurveysBridge.send('surveysReady', {});
        break;
      case 'surveysLoaded':
        L._handleSurveysLoaded(payload);
        break;
      case 'surveySubmitted':
        L._handleSubmitResult(payload);
        break;
      case 'error':
        SurveysRender.showError(payload.message || 'An error occurred.');
        break;
      default:
        break;
    }
  };

  // ── Surveys Loaded ────────────────────────────────────────────────────────

  L._handleSurveysLoaded = function (payload) {
    var surveys = payload.surveys || payload || [];
    if (!Array.isArray(surveys)) surveys = [];
    L.state.surveys = surveys;

    if (surveys.length === 0) {
      SurveysRender.showEmpty();
      return;
    }

    // Check URL param 'type' for deep-link
    try {
      var params = new URLSearchParams(window.location.search);
      var typeParam = params.get('type');
      if (typeParam) {
        var matched = surveys.find(function (s) {
          return (s.survey_type || '').toUpperCase() === typeParam.toUpperCase();
        });
        if (matched) {
          var carrier = matched.carrier_name || matched.carrierName || 'Your Carrier';
          L.startSurvey(matched.id || matched._id, matched.survey_type, carrier);
          return;
        }
      }
    } catch (e) {
      // URL parsing failed — continue to fallback
    }

    // Auto-start if only one survey
    if (surveys.length === 1) {
      var s = surveys[0];
      var singleCarrier = s.carrier_name || s.carrierName || 'Your Carrier';
      L.startSurvey(s.id || s._id, s.survey_type, singleCarrier);
      return;
    }

    SurveysRender.showSurveyList(surveys);
  };

  // ── Start Survey ──────────────────────────────────────────────────────────

  L.startSurvey = function (surveyRequestId, surveyType, carrierName) {
    var questions = (window.SurveysConfig && SurveysConfig.QUESTIONS[surveyType]) || [];
    L.state.activeSurvey = {
      id: surveyRequestId,
      survey_type: surveyType,
      carrier_name: carrierName
    };
    L.state.activeQuestions = questions;
    L.state.currentQIndex = 0;
    L.state.answers = {};
    L.state.submitted = false;
    L._renderCurrentQuestion();
  };

  // ── Render Current Question ───────────────────────────────────────────────

  L._renderCurrentQuestion = function () {
    var s = L.state;
    if (!s.activeSurvey || s.activeQuestions.length === 0) {
      SurveysRender.showEmpty();
      return;
    }
    var question = s.activeQuestions[s.currentQIndex];
    SurveysRender.showQuestion(
      s.activeSurvey,
      question,
      s.currentQIndex,
      s.activeQuestions.length,
      s.answers
    );
  };

  // ── Select Answer ─────────────────────────────────────────────────────────

  L.selectAnswer = function (questionId, value) {
    L.state.answers[questionId] = value;

    // Re-render only the answers container and enable next button
    var question = L.state.activeQuestions[L.state.currentQIndex];
    var container = document.getElementById('answersContainer');
    if (container) {
      container.innerHTML = SurveysRender.renderAnswerInput(question, value);
    }

    var btn = document.getElementById('nextBtn');
    if (btn) btn.disabled = false;
  };

  // ── Next Question ─────────────────────────────────────────────────────────

  L.nextQuestion = function (questionId) {
    // Capture textarea value if present
    var textarea = document.getElementById('textInput_' + questionId);
    if (textarea) {
      L.state.answers[questionId] = textarea.value || '';
    }

    var s = L.state;
    if (s.currentQIndex < s.activeQuestions.length - 1) {
      s.currentQIndex++;
      L._renderCurrentQuestion();
    } else {
      L._submit();
    }
  };

  // ── Skip Question ─────────────────────────────────────────────────────────

  L.skipQuestion = function (questionId) {
    delete L.state.answers[questionId];

    var s = L.state;
    if (s.currentQIndex < s.activeQuestions.length - 1) {
      s.currentQIndex++;
      L._renderCurrentQuestion();
    } else {
      L._submit();
    }
  };

  // ── Previous Question ─────────────────────────────────────────────────────

  L.prevQuestion = function () {
    if (L.state.currentQIndex > 0) {
      L.state.currentQIndex--;
      L._renderCurrentQuestion();
    } else {
      // At first question — go back to list or dashboard
      if (L.state.surveys.length > 1) {
        L.state.activeSurvey = null;
        SurveysRender.showSurveyList(L.state.surveys);
      } else {
        L.goBack();
      }
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  L._submit = function () {
    if (L.state.submitted) return;
    L.state.submitted = true;

    SurveysRender.showSubmitting();

    var s = L.state;
    SurveysBridge.submit(
      s.activeSurvey.id,
      s.activeSurvey.survey_type,
      s.answers
    );
  };

  // ── Handle Submit Result ──────────────────────────────────────────────────

  L._handleSubmitResult = function (payload) {
    var xpAwarded = payload.xpAwarded || payload.xp_awarded || 0;
    if (!xpAwarded && L.state.activeSurvey) {
      var type = L.state.activeSurvey.survey_type;
      xpAwarded = (window.SurveysConfig && SurveysConfig.XP[type]) || 0;
    }
    var surveyType = L.state.activeSurvey ? L.state.activeSurvey.survey_type : '';
    SurveysRender.showComplete(surveyType, xpAwarded);
  };

  // ── After Complete ────────────────────────────────────────────────────────

  L.afterComplete = function () {
    // Remove the completed survey from the list
    if (L.state.activeSurvey) {
      var completedId = L.state.activeSurvey.id;
      L.state.surveys = L.state.surveys.filter(function (s) {
        return (s.id || s._id) !== completedId;
      });
    }
    L.state.activeSurvey = null;
    L.state.activeQuestions = [];
    L.state.answers = {};
    L.state.submitted = false;

    if (L.state.surveys.length > 0) {
      SurveysRender.showSurveyList(L.state.surveys);
    } else {
      L.goBack();
    }
  };

  // ── Go Back ───────────────────────────────────────────────────────────────

  L.goBack = function () {
    try {
      window.parent.postMessage({ action: 'navigate', payload: { url: '/driver-dashboard' } }, '*');
    } catch (e) {
      // fallback for standalone / non-iframe context
    }
    setTimeout(function () {
      try {
        window.location.href = 'https://www.lastmiledr.app/driver-dashboard';
      } catch (e2) {
        // ignore
      }
    }, 300);
  };

  window.SurveysLogic = L;
})();
