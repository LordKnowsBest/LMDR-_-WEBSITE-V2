(function () {
  window.SurveysBridge = {
    send: function (action, payload) {
      try {
        window.parent.postMessage({ action: action, payload: payload }, '*');
      } catch (e) {
        console.warn('[SurveysBridge] send failed:', e.message);
      }
    },

    listen: function (handler) {
      window.addEventListener('message', function (event) {
        var msg = event.data;
        if (!msg || !msg.action) return;
        handler(msg);
      });
    },

    ready: function () { this.send('surveysReady', {}); },

    submit: function (surveyRequestId, surveyType, responses) {
      this.send('submitSurvey', {
        surveyRequestId: surveyRequestId,
        surveyType: surveyType,
        responses: responses
      });
    }
  };
})();
