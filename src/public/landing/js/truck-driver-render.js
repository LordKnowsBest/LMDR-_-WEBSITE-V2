/* =========================================
   TRUCK DRIVER PAGE — Render Module
   Depends on: TruckDriverConfig
   ========================================= */
var TruckDriverRender = (function () {
  'use strict';

  function updateStepIndicator(currentStep) {
    var items = document.querySelectorAll('.step-item');
    var connectors = document.querySelectorAll('.step-connector');
    items.forEach(function (item, i) {
      var dot = item.querySelector('.step-dot');
      var label = item.querySelector('.step-label');
      dot.classList.remove('active', 'complete');
      label.classList.remove('active', 'complete');
      if (i < currentStep) {
        dot.classList.add('complete');
        label.classList.add('complete');
      } else if (i === currentStep) {
        dot.classList.add('active');
        label.classList.add('active');
      }
    });
    connectors.forEach(function (c, i) {
      c.classList.toggle('complete', i < currentStep);
    });
  }

  function showStep(step) {
    document.querySelectorAll('.form-step').forEach(function (el) { el.classList.remove('active'); });
    var target = document.getElementById(TruckDriverConfig.STEPS[step].id);
    if (target) target.classList.add('active');
    updateStepIndicator(step);
  }

  function showLoading() {
    document.getElementById('formSection').style.display = 'none';
    var loading = document.getElementById('loadingSection');
    loading.classList.add('active');
    var steps = ['lstep1', 'lstep2', 'lstep3', 'lstep4'];
    steps.forEach(function (id, i) {
      setTimeout(function () {
        var el = document.getElementById(id);
        if (!el) return;
        el.classList.add('active');
        if (i > 0) {
          var prev = document.getElementById(steps[i - 1]);
          if (prev) {
            prev.classList.remove('active');
            prev.classList.add('complete');
            prev.querySelector('i').className = 'fa-solid fa-check text-green-500';
          }
        }
      }, i * 800);
    });
  }

  function hideLoading() {
    document.getElementById('loadingSection').classList.remove('active');
  }

  function showResults(data) {
    hideLoading();
    var section = document.getElementById('resultsSection');
    section.classList.add('active');
    var scored = document.getElementById('totalScored');
    if (scored) scored.textContent = data.totalScored || 0;
    renderMatches(data.matches || []);
  }

  function showSuccess(data) {
    hideLoading();
    var section = document.getElementById('resultsSection');
    section.classList.add('active');
    var list = document.getElementById('matchesList');
    list.innerHTML =
      '<div class="bg-white rounded-xl p-10 text-center border border-green-200 shadow-md">' +
        '<i class="fa-solid fa-circle-check text-5xl text-green-500 mb-4"></i>' +
        '<h3 class="text-2xl font-black text-lmdr-dark mb-2">Application Submitted!</h3>' +
        '<p class="text-slate-600 mb-6">' + (data.message || 'Your profile is being matched with carriers.') + '</p>' +
        '<p class="text-sm text-slate-400">You\'ll receive match results at your email address.</p>' +
      '</div>';
  }

  function renderMatches(matches) {
    var list = document.getElementById('matchesList');
    if (matches.length === 0) {
      list.innerHTML =
        '<div class="text-center p-10 bg-white rounded-xl border border-slate-200">' +
          '<i class="fa-solid fa-road text-4xl text-slate-300 mb-4"></i>' +
          '<h3 class="text-xl font-bold text-slate-700">No matches found</h3>' +
          '<p class="text-slate-500">Try expanding your search criteria.</p>' +
        '</div>';
      return;
    }
    list.innerHTML = matches.map(function (match, index) {
      var c = match.carrier || {};
      var name = c.LEGAL_NAME || c.DBA_NAME || 'Unknown Carrier';
      var dot = c.DOT_NUMBER;
      var score = match.overallScore || 0;
      var loc = (c.PHY_CITY || '') + ', ' + (c.PHY_STATE || '');
      return (
        '<div class="match-card">' +
          '<div class="match-card-header">' +
            '<div class="match-rank">' + (index + 1) + '</div>' +
            '<div class="match-info">' +
              '<div class="match-name">' + escapeHtml(name) + '</div>' +
              '<div class="match-location"><i class="fa-solid fa-location-dot"></i> ' + escapeHtml(loc) + '</div>' +
            '</div>' +
            '<div class="match-score-block">' +
              '<div class="match-score-value">' + score + '%</div>' +
              '<div class="match-score-label">Match Score</div>' +
            '</div>' +
          '</div>' +
          '<div class="carrier-metrics">' +
            metric(c.PAY_CPM ? '$' + c.PAY_CPM.toFixed(2) : 'N/A', 'CPM') +
            metric(c.NBR_POWER_UNIT || 'N/A', 'Fleet') +
            metric(c.TURNOVER_PERCENT ? c.TURNOVER_PERCENT + '%' : 'N/A', 'Turnover') +
            metric(c.AVG_TRUCK_AGE ? c.AVG_TRUCK_AGE + 'yr' : 'N/A', 'Truck Age') +
          '</div>' +
          '<div class="match-actions">' +
            '<button class="interested-btn" data-dot="' + dot + '" data-name="' + escapeAttr(name) + '" onclick="TruckDriverLogic.handleInterest(this)">' +
              '<i class="fa-solid fa-heart"></i> I\'m Interested' +
            '</button>' +
          '</div>' +
        '</div>'
      );
    }).join('');
  }

  function metric(value, label) {
    return (
      '<div class="carrier-metric">' +
        '<div class="carrier-metric-value">' + value + '</div>' +
        '<div class="carrier-metric-label">' + label + '</div>' +
      '</div>'
    );
  }

  function markUploadComplete(inputId, fileName) {
    var zone = document.getElementById('zone-' + inputId);
    if (!zone) return;
    zone.classList.add('has-file');
    zone.innerHTML =
      '<i class="fa-solid fa-check-circle"></i>' +
      '<p class="file-name">' + escapeHtml(fileName) + '</p>' +
      '<p>Tap to replace</p>';
  }

  function flashOCRField(fieldId) {
    var el = document.getElementById(fieldId);
    if (el) {
      el.classList.add('ocr-filled');
      setTimeout(function () { el.classList.remove('ocr-filled'); }, 1200);
    }
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function escapeAttr(str) {
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  }

  return {
    showStep: showStep,
    showLoading: showLoading,
    hideLoading: hideLoading,
    showResults: showResults,
    showSuccess: showSuccess,
    renderMatches: renderMatches,
    markUploadComplete: markUploadComplete,
    flashOCRField: flashOCRField
  };
})();
