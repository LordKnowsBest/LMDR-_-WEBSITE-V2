/* =========================================
   TRUCKING COMPANIES — Render Module
   VelocityMatch Carrier Landing Page
   Depends on: TruckingConfig
   ========================================= */
var TruckingRender = (function () {
  'use strict';

  function revealSection(sectionId) {
    var section = document.getElementById(sectionId);
    if (section && !section.classList.contains('revealed')) {
      section.classList.add('revealed');
      section.setAttribute('aria-hidden', 'false');
    }
  }

  function updateProgress() {
    var steps = document.querySelectorAll('.progress-step');
    var driverTypesRevealed = document.getElementById('driverTypesSection').classList.contains('revealed');
    var equipmentRevealed = document.getElementById('equipmentSection').classList.contains('revealed');

    steps[0].classList.add('complete');
    if (driverTypesRevealed) { steps[1].classList.add('active'); }
    if (equipmentRevealed) { steps[1].classList.add('complete'); steps[2].classList.add('active'); }
  }

  function showValidationState(input, isValid, message) {
    var wrapper = input.closest('.input-wrapper');
    if (!wrapper) return;
    wrapper.classList.remove('valid', 'invalid');
    if (input.value.trim()) {
      wrapper.classList.add(isValid ? 'valid' : 'invalid');
    }
    var errorSpan = wrapper.querySelector('.input-error-message');
    if (errorSpan && message) { errorSpan.textContent = message; }
  }

  function setSubmitLoading(isLoading) {
    var btn = document.getElementById('submitBtn');
    if (isLoading) {
      btn.disabled = true;
      btn.classList.add('loading');
      btn.textContent = '';
    }
  }

  function showSuccess() {
    var btn = document.getElementById('submitBtn');
    var successDiv = document.getElementById('formSuccess');
    var errorDiv = document.getElementById('formError');

    btn.classList.remove('loading');
    btn.classList.add('success');
    btn.textContent = 'Submitted \u2713';
    successDiv.style.display = 'block';
    errorDiv.style.display = 'none';
  }

  function showError(message) {
    var btn = document.getElementById('submitBtn');
    var errorDiv = document.getElementById('formError');
    btn.classList.remove('loading');
    btn.disabled = false;
    btn.textContent = 'Get Drivers Now \u2192';
    errorDiv.style.display = 'block';
    document.getElementById('errorMessage').textContent = message;
  }

  function resetForm() {
    document.getElementById('carrierStaffingForm').reset();
    TruckingConfig.PROGRESSIVE_SECTIONS.forEach(function (id) {
      var section = document.getElementById(id);
      section.classList.remove('revealed');
      section.setAttribute('aria-hidden', 'true');
    });
    document.querySelectorAll('.progress-step').forEach(function (step, i) {
      step.classList.remove('complete', 'active');
      if (i === 0) step.classList.add('active');
    });
    document.querySelectorAll('.input-wrapper').forEach(function (w) {
      w.classList.remove('valid', 'invalid');
    });
  }

  function hideMessages() {
    document.getElementById('formSuccess').style.display = 'none';
    document.getElementById('formError').style.display = 'none';
  }

  return {
    revealSection: revealSection,
    updateProgress: updateProgress,
    showValidationState: showValidationState,
    setSubmitLoading: setSubmitLoading,
    showSuccess: showSuccess,
    showError: showError,
    resetForm: resetForm,
    hideMessages: hideMessages
  };
})();
