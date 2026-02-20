/* =========================================
   DRIVER RETENTION — Logic Module
   Depends on: RetentionBridge
   Assessment quiz + form submission logic
   ========================================= */
var RetentionLogic = (function () {
  'use strict';

  // ── Assessment Data ──
  var questions = [
    {
      text: 'Driver Communication Frequency',
      benchmark: 'Industry leaders conduct weekly check-ins.',
      options: [
        { text: 'Weekly or bi-weekly', score: 3 },
        { text: 'Monthly', score: 2 },
        { text: 'Quarterly or less', score: 1 },
        { text: 'Never/Only when problems arise', score: 0 }
      ]
    },
    {
      text: 'Compensation Strategy',
      benchmark: 'Top fleets pay 15% above market + bonuses.',
      options: [
        { text: 'Above-market + performance bonuses', score: 3 },
        { text: 'Competitive market rates', score: 2 },
        { text: 'Slightly below market w/ benefits', score: 1 },
        { text: 'Lowest cost per mile focus', score: 0 }
      ]
    },
    {
      text: 'Home Time Flexibility',
      benchmark: 'Guaranteed home time reduces turnover by 45%.',
      options: [
        { text: 'Guaranteed + flexible scheduling', score: 3 },
        { text: 'Reasonable requests accommodated', score: 2 },
        { text: 'Limited flexibility', score: 1 },
        { text: 'Based solely on operational needs', score: 0 }
      ]
    },
    {
      text: 'Driver Recognition',
      benchmark: 'Recognition increases retention by 31%.',
      options: [
        { text: 'Multiple formal programs', score: 3 },
        { text: 'Driver of the month/Safety awards', score: 2 },
        { text: 'Occasional recognition', score: 1 },
        { text: 'No formal programs', score: 0 }
      ]
    },
    {
      text: 'New Driver Onboarding',
      benchmark: 'Comprehensive onboarding cuts 90-day churn by 58%.',
      options: [
        { text: '2-week+ mentorship program', score: 3 },
        { text: 'Structured orientation', score: 2 },
        { text: 'Basic paperwork', score: 1 },
        { text: 'Minimal/Learn on job', score: 0 }
      ]
    },
    {
      text: 'Satisfaction Measurement',
      benchmark: 'Feedback loops prevent 70% of avoidable turnover.',
      options: [
        { text: 'Quarterly + action plans', score: 3 },
        { text: 'Annually', score: 2 },
        { text: 'Only when issues arise', score: 1 },
        { text: 'Never', score: 0 }
      ]
    },
    {
      text: 'Equipment Quality',
      benchmark: 'Modern equipment correlates with 38% longer tenure.',
      options: [
        { text: 'Latest models + proactive maintenance', score: 3 },
        { text: 'Well-maintained + updates', score: 2 },
        { text: 'Adequate + reactive maintenance', score: 1 },
        { text: 'Older + fix when broken', score: 0 }
      ]
    }
  ];

  var currentQIndex = 0;
  var answers = [];

  // ── Assessment Functions ──
  function initAssessment() {
    currentQIndex = 0;
    answers = [];
    document.getElementById('question-view').classList.remove('hidden');
    document.getElementById('results-view').classList.add('hidden');
    renderQuestion();
  }

  function renderQuestion() {
    var q = questions[currentQIndex];
    document.getElementById('q-number').textContent = currentQIndex + 1;
    document.getElementById('q-text').textContent = q.text;
    document.getElementById('q-benchmark').textContent = 'Benchmark: ' + q.benchmark;
    document.getElementById('progress-text').textContent = (currentQIndex + 1) + ' of ' + questions.length;
    document.getElementById('progress-fill').style.width = (((currentQIndex + 1) / questions.length) * 100) + '%';

    var grid = document.getElementById('options-grid');
    grid.innerHTML = '';

    q.options.forEach(function (opt) {
      var btn = document.createElement('button');
      btn.className = 'p-4 rounded-xl border border-slate-200 text-left hover:border-blue-500 hover:bg-blue-50 transition-all text-slate-700 font-medium h-full flex items-center';
      btn.textContent = opt.text;
      btn.onclick = function () { selectAnswer(opt.score); };
      grid.appendChild(btn);
    });

    // Re-trigger animation
    var view = document.getElementById('question-view');
    view.classList.remove('assessment-fade-in');
    void view.offsetWidth;
    view.classList.add('assessment-fade-in');

    // Scroll to widget on mobile
    if (window.innerWidth < 768) {
      document.getElementById('assessment-container').scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function selectAnswer(score) {
    answers.push(score);
    if (currentQIndex < questions.length - 1) {
      currentQIndex++;
      renderQuestion();
    } else {
      showResults();
    }
  }

  function showResults() {
    var totalScore = answers.reduce(function (a, b) { return a + b; }, 0);
    var maxScore = questions.length * 3;
    var pct = Math.round((totalScore / maxScore) * 100);

    document.getElementById('question-view').classList.add('hidden');
    document.getElementById('results-view').classList.remove('hidden');

    // Animate Score
    var start = 0;
    var scoreEl = document.getElementById('score-display');
    var timer = setInterval(function () {
      start += 1;
      scoreEl.textContent = start + '%';
      if (start >= pct) clearInterval(timer);
    }, 20);

    // Set Status Badge
    var badge = document.getElementById('status-badge');
    if (pct >= 80) {
      badge.textContent = 'Excellent Retention Practices';
      badge.className = 'inline-block mt-4 px-4 py-2 rounded-full bg-green-900/30 text-green-400 text-sm font-bold border border-green-500/50';
    } else if (pct >= 60) {
      badge.textContent = 'Solid Foundation';
      badge.className = 'inline-block mt-4 px-4 py-2 rounded-full bg-blue-900/30 text-blue-400 text-sm font-bold border border-blue-500/50';
    } else if (pct >= 40) {
      badge.textContent = 'Action Needed';
      badge.className = 'inline-block mt-4 px-4 py-2 rounded-full bg-amber-900/30 text-amber-400 text-sm font-bold border border-amber-500/50';
    } else {
      badge.textContent = 'Immediate Action Required';
      badge.className = 'inline-block mt-4 px-4 py-2 rounded-full bg-red-900/30 text-red-400 text-sm font-bold border border-red-500/50';
    }

    // Recommendations
    var list = document.getElementById('recommendations-list');
    list.innerHTML = '';
    var recs = pct >= 60
      ? [
          'Document retention playbook for consistency',
          'Offer advanced wellness programs',
          'Implement predictive analytics for at-risk drivers'
        ]
      : [
          'Establish weekly driver check-ins immediately',
          'Benchmark compensation against top 10% market',
          'Audit equipment maintenance protocols'
        ];

    recs.forEach(function (r) {
      var li = document.createElement('li');
      li.className = 'flex items-start gap-3';
      li.innerHTML = '<i class="fa-solid fa-check text-blue-500 mt-1"></i> <span>' + r + '</span>';
      list.appendChild(li);
    });
  }

  function restartAssessment() {
    initAssessment();
  }

  // ── Form Submission ──
  function submitCarrierForm() {
    var formData = {
      companyName: document.getElementById('companyName').value,
      contactName: document.getElementById('contactName').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      dotNumber: document.getElementById('dotNumber').value,
      staffingType: (document.querySelector('input[name="staffingType"]:checked') || {}).value || 'Retention',
      driversNeeded: document.getElementById('driversNeeded').value,
      driverTypes: Array.from(document.querySelectorAll('input[name="driverTypes"]:checked')).map(function (cb) { return cb.value; }),
      additionalNotes: document.getElementById('additionalNotes').value
    };

    RetentionBridge.submitForm(formData);
  }

  // ── Init ──
  function init() {
    RetentionBridge.listen();
    RetentionBridge.signalReady();
    initAssessment();
  }

  // ── Expose globals for onclick handlers ──
  function exposeGlobals() {
    window.submitCarrierForm = submitCarrierForm;
    window.restartAssessment = restartAssessment;
  }

  exposeGlobals();

  return {
    init: init,
    submitCarrierForm: submitCarrierForm,
    restartAssessment: restartAssessment
  };
})();
