/* =========================================
   DRIVER RETENTION — Bridge Module
   No dependencies
   Handles form submission via postMessage to Wix page code
   ========================================= */
var RetentionBridge = (function () {
  'use strict';

  var submissionTimeout = null;
  var SUBMISSION_TIMEOUT_MS = 15000;

  function sendToWix(type, data) {
    console.log('[FORM] >> ' + type, data || '');
    window.parent.postMessage({ type: type, data: data }, '*');
  }

  function signalReady() {
    console.log('[FORM] Carrier Staffing Form Loaded');
    sendToWix('staffingFormReady');
    console.log('[FORM] Waiting for Velo page to handle submissions...');
  }

  function submitForm(formData) {
    var btn = document.getElementById('submitBtn');
    var successMsg = document.getElementById('formSuccess');
    var errorMsg = document.getElementById('formError');

    console.log('[FORM] FORM SUBMISSION STARTED');

    // Loading State
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';
    btn.disabled = true;
    successMsg.classList.add('hidden');
    errorMsg.classList.add('hidden');

    sendToWix('submitCarrierStaffingRequest', formData);

    // Set timeout
    submissionTimeout = setTimeout(function () {
      console.error('[FORM] TIMEOUT: No response from Velo after ' + (SUBMISSION_TIMEOUT_MS / 1000) + ' seconds');
      errorMsg.innerHTML = '<i class="fa-solid fa-circle-exclamation mr-2"></i><span class="font-bold">Timeout:</span> No response from server. Check console for details.';
      errorMsg.classList.remove('hidden');
      btn.innerHTML = 'Try Again';
      btn.disabled = false;
    }, SUBMISSION_TIMEOUT_MS);
  }

  function listen() {
    window.addEventListener('message', function (event) {
      var btn = document.getElementById('submitBtn');
      var successMsg = document.getElementById('formSuccess');
      var errorMsg = document.getElementById('formError');

      if (event.data && typeof event.data === 'object') {
        console.log('[FORM] << Received:', event.data.type || 'unknown');
      }

      if (event.data && event.data.type === 'staffingRequestResult') {
        if (submissionTimeout) {
          clearTimeout(submissionTimeout);
          submissionTimeout = null;
        }

        if (event.data.success) {
          console.log('[FORM] Submission successful, Lead ID:', event.data.leadId || 'n/a');
          successMsg.classList.remove('hidden');
          btn.innerHTML = 'Sent Successfully!';
          document.getElementById('carrierStaffingForm').reset();
        } else {
          console.error('[FORM] Submission failed:', event.data.error || 'Unknown error');
          errorMsg.classList.remove('hidden');
          btn.innerHTML = 'Try Again';
          btn.disabled = false;
        }
      }
    });
  }

  return {
    signalReady: signalReady,
    submitForm: submitForm,
    listen: listen
  };
})();
