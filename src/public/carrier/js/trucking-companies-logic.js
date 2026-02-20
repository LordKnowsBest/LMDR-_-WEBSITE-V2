/* =========================================
   TRUCKING COMPANIES — Logic Module
   VelocityMatch Carrier Landing Page
   Depends on: TruckingConfig, TruckingBridge, TruckingRender
   ========================================= */
var TruckingLogic = (function () {
  'use strict';

  var submissionTimeout = null;

  function formatPhoneNumber(value) {
    var digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '';
    if (digits.length <= 3) return '(' + digits;
    if (digits.length <= 6) return '(' + digits.slice(0, 3) + ') ' + digits.slice(3);
    return '(' + digits.slice(0, 3) + ') ' + digits.slice(3, 6) + '-' + digits.slice(6, 10);
  }

  function validateField(input) {
    var fieldName = input.id || input.name;
    var validator = TruckingConfig.VALIDATORS[fieldName];
    if (!validator) return { valid: true };
    return validator(input.value);
  }

  function validateAll() {
    var allValid = true;
    var firstInvalid = null;

    ['contactName', 'email', 'phone'].forEach(function (fieldId) {
      var input = document.getElementById(fieldId);
      var result = validateField(input);
      TruckingRender.showValidationState(input, result.valid, result.message);
      if (!result.valid) {
        allValid = false;
        if (!firstInvalid) firstInvalid = input;
      }
    });

    var driversNeeded = document.getElementById('driversNeeded');
    if (!driversNeeded.value) {
      allValid = false;
      if (!firstInvalid) firstInvalid = driversNeeded;
    }

    if (firstInvalid) firstInvalid.focus();
    return allValid;
  }

  function collectFormData() {
    var form = document.getElementById('carrierStaffingForm');
    var driverTypes = Array.from(form.querySelectorAll('input[name="driverTypes"]:checked')).map(function (cb) { return cb.value; });
    var equipmentTypes = Array.from(form.querySelectorAll('input[name="equipmentTypes"]:checked')).map(function (cb) { return cb.value; });

    return {
      companyName: document.getElementById('companyName').value.trim(),
      contactName: document.getElementById('contactName').value.trim(),
      email: document.getElementById('email').value.trim(),
      phone: document.getElementById('phone').value.replace(/\D/g, ''),
      dotNumber: document.getElementById('dotNumber').value.trim(),
      driversNeeded: document.getElementById('driversNeeded').value,
      driverTypes: driverTypes,
      equipmentTypes: equipmentTypes,
      additionalNotes: document.getElementById('additionalNotes').value.trim(),
      staffingType: 'Strategic',
      source: 'trucking-companies-page',
      submittedAt: new Date().toISOString()
    };
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!validateAll()) return;

    var formData = collectFormData();
    TruckingRender.setSubmitLoading(true);
    TruckingRender.hideMessages();

    TruckingBridge.submitStaffingRequest(formData);

    submissionTimeout = setTimeout(function () {
      TruckingRender.showError('Connection timeout. Please try again or call us at (214) 531-3751.');
    }, TruckingConfig.SUBMISSION_TIMEOUT_MS);
  }

  function handleStaffingResult(msg) {
    clearTimeout(submissionTimeout);
    if (msg.data && msg.data.success) {
      TruckingRender.showSuccess();
      setTimeout(function () { TruckingRender.resetForm(); }, 2000);
      if (typeof gtag !== 'undefined') {
        gtag('event', 'generate_lead', {
          'event_category': 'engagement',
          'event_label': 'carrier_staffing_request',
          'value': 1999
        });
      }
    } else {
      TruckingRender.showError(
        (msg.data && msg.data.error) || 'Please try again or call us at (214) 531-3751.'
      );
    }
  }

  function init() {
    // Progressive disclosure: drivers needed -> driver types
    document.getElementById('driversNeeded').addEventListener('change', function () {
      if (this.value) {
        TruckingRender.revealSection('driverTypesSection');
        TruckingRender.updateProgress();
      }
    });

    // Driver types -> equipment + company + notes
    document.querySelectorAll('input[name="driverTypes"]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var anyChecked = document.querySelectorAll('input[name="driverTypes"]:checked').length > 0;
        if (anyChecked) {
          TruckingRender.revealSection('equipmentSection');
          TruckingRender.revealSection('companySection');
          TruckingRender.revealSection('notesSection');
          TruckingRender.updateProgress();
        }
      });
    });

    // Inline validation on blur
    ['contactName', 'email', 'phone'].forEach(function (fieldId) {
      var input = document.getElementById(fieldId);
      input.addEventListener('blur', function () {
        var result = validateField(this);
        TruckingRender.showValidationState(this, result.valid, result.message);
      });
      input.addEventListener('input', function () {
        var wrapper = this.closest('.input-wrapper');
        if (wrapper) wrapper.classList.remove('valid', 'invalid');
      });
    });

    // Phone auto-formatting
    document.getElementById('phone').addEventListener('input', function () {
      var cursorPos = this.selectionStart;
      var oldLength = this.value.length;
      this.value = formatPhoneNumber(this.value);
      var adjustment = this.value.length - oldLength;
      this.setSelectionRange(cursorPos + adjustment, cursorPos + adjustment);
    });

    // Form submit
    document.getElementById('carrierStaffingForm').addEventListener('submit', handleSubmit);

    // Bridge listener for Velo responses
    TruckingBridge.listen({
      staffingRequestResult: handleStaffingResult
    });

    // External links
    document.querySelectorAll('a[href^="http"]').forEach(function (link) {
      if (!link.href.includes(window.location.hostname)) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      }
    });

    // Track internal links
    document.querySelectorAll('a[href^="https://www.lastmiledr.app"]').forEach(function (link) {
      if (!link.hasAttribute('target')) {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
      }
      link.addEventListener('click', function () {
        if (typeof gtag !== 'undefined') {
          gtag('event', 'click', { 'event_category': 'internal_link', 'event_label': this.href });
        }
      });
    });

    // Lazy load Inter font
    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(function () {
        var fontLink = document.createElement('link');
        fontLink.rel = 'stylesheet';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap';
        document.head.appendChild(fontLink);
      });
    }

    // Reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.style.setProperty('--reveal-duration', '0.01ms');
    }

    // Notify Wix ready
    TruckingBridge.notifyReady();
  }

  // Expose scrollToForm globally for onclick handlers
  function scrollToForm() {
    document.getElementById('leadform').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return {
    init: init,
    scrollToForm: scrollToForm
  };
})();

// Expose globals for onclick handlers in HTML
function scrollToForm() { TruckingLogic.scrollToForm(); }
