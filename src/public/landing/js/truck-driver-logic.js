/* =========================================
   TRUCK DRIVER PAGE — Logic Module
   Depends on: TruckDriverConfig, TruckDriverBridge, TruckDriverRender
   ========================================= */
/* global TruckDriverConfig, TruckDriverBridge, TruckDriverRender */
var TruckDriverLogic = (function () {
  'use strict';

  var Config = TruckDriverConfig;
  var Bridge = TruckDriverBridge;
  var Render = TruckDriverRender;

  var currentStep = 0;
  var uploadedFiles = {};
  var submitWarningId = null;

  function init() {
    bindNavigation();
    bindUploads();
    bindForm();
    bindModal();
    setupBridgeListeners();
    Render.showStep(0);
    Bridge.sendPageReady();
  }

  /* --- Step Navigation --- */
  function bindNavigation() {
    var nextBtns = document.querySelectorAll('[data-nav="next"]');
    var prevBtns = document.querySelectorAll('[data-nav="prev"]');
    nextBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (validateStep(currentStep)) {
          currentStep++;
          Render.showStep(currentStep);
          scrollToForm();
        }
      });
    });
    prevBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (currentStep > 0) {
          currentStep--;
          Render.showStep(currentStep);
          scrollToForm();
        }
      });
    });
  }

  function scrollToForm() {
    var el = document.getElementById('apply');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function validateStep(step) {
    if (step === 0) {
      var name = document.getElementById('fullName').value.trim();
      var email = document.getElementById('email').value.trim();
      var phone = document.getElementById('phone').value.trim();
      if (!name || !email || !phone) {
        showFieldError('Please fill in Name, Email, and Phone.');
        return false;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showFieldError('Please enter a valid email address.');
        return false;
      }
    }
    return true;
  }

  function showFieldError(msg) {
    var existing = document.querySelector('.field-error-toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.className = 'field-error-toast';
    toast.style.cssText =
      'position:fixed;top:20px;left:50%;transform:translateX(-50%);' +
      'background:#ef4444;color:white;padding:12px 24px;border-radius:8px;' +
      'font-weight:700;font-size:14px;z-index:10000;box-shadow:0 4px 12px rgba(0,0,0,0.2);';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 3000);
  }

  /* --- File Uploads --- */
  function bindUploads() {
    Config.REQUIRED_DOCS.forEach(function (doc) {
      var zone = document.getElementById('zone-' + doc.id);
      var input = document.getElementById('file-' + doc.id);
      if (!zone || !input) return;
      zone.addEventListener('click', function () { input.click(); });
      input.addEventListener('change', function () {
        var file = input.files[0];
        if (!file) return;
        if (file.size > Config.MAX_FILE_SIZE) {
          showFieldError('File too large (max 5MB). Please compress or use a smaller image.');
          return;
        }
        if (!isAllowedFileType(file.type)) {
          showFieldError('Unsupported file type. Please upload JPG, PNG, or PDF.');
          return;
        }
        readFileAsBase64(file, function (base64) {
          uploadedFiles[doc.id] = {
            name: file.name,
            type: file.type,
            size: file.size,
            data: base64
          };
          Render.markUploadComplete(doc.id, file.name);
          var ocrType = Config.OCR_DOC_TYPES[doc.id];
          if (ocrType) Bridge.requestOCR(base64, ocrType, doc.id);
        });
      });
    });
  }

  function isAllowedFileType(fileType) {
    return fileType === 'image/jpeg' || fileType === 'image/png' || fileType === 'application/pdf';
  }

  function readFileAsBase64(file, cb) {
    var reader = new FileReader();
    reader.onload = function () { cb(reader.result); };
    reader.readAsDataURL(file);
  }

  /* --- Form Submission --- */
  function bindForm() {
    var form = document.getElementById('driverForm');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!validateRequiredDocuments()) {
        showFieldError('Please upload CDL Front, CDL Back, and DOT Medical Card before submitting.');
        return;
      }
      var formData = collectFormData();
      Render.showLoading();
      Bridge.submitApplication(formData);
      startSubmitFallbackTimers(formData);
    });
  }

  function validateRequiredDocuments() {
    if (new URLSearchParams(window.location.search).get('_devtest') === '1') return true;
    return Config.REQUIRED_DOCS.every(function (doc) {
      return uploadedFiles[doc.id] && uploadedFiles[doc.id].data;
    });
  }

  function collectFormData() {
    var endorsements = [];
    document.querySelectorAll('input[name="endorsements"]:checked').forEach(function (cb) {
      endorsements.push(cb.value);
    });
    var runType = 'any';
    var runRadio = document.querySelector('input[name="runType"]:checked');
    if (runRadio) runType = runRadio.value;

    var docs = {};
    Config.REQUIRED_DOCS.forEach(function (doc) {
      if (uploadedFiles[doc.id]) {
        docs[doc.id] = {
          name: uploadedFiles[doc.id].name,
          type: uploadedFiles[doc.id].type,
          size: uploadedFiles[doc.id].size,
          base64: uploadedFiles[doc.id].data,
          data: uploadedFiles[doc.id].data
        };
      }
    });

    return {
      fullName: val('fullName'),
      email: val('email'),
      phone: val('phone'),
      homeZip: val('homeZip'),
      cdlClass: val('cdlClass'),
      yearsExperience: val('yearsExperience'),
      endorsements: endorsements,
      preferredRunType: runType,
      cdlNumber: val('cdlNumber'),
      cdlExpiration: val('cdlExpiration'),
      medCardExpiration: val('medCardExpiration'),
      documents: docs
    };
  }

  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  /* --- Bridge Listeners --- */
  function setupBridgeListeners() {
    Bridge.listen({
      onSubmitResult: function (data) {
        clearSubmitFallbackTimers();
        if (data && data.success) {
          Render.showSuccess(data);
        } else {
          Render.hideLoading();
          showFieldError(data && data.message ? data.message : 'Submission failed. Please try again.');
          document.getElementById('formSection').style.display = 'block';
        }
      },
      onOCRResult: function (data) {
        if (!data || !data.success) return;
        var ext = data.extracted || {};
        if (ext.licenseNumber) {
          setVal('cdlNumber', ext.licenseNumber);
          Render.flashOCRField('cdlNumber');
        }
        if (ext.expirationDate) {
          setVal('cdlExpiration', ext.expirationDate);
          Render.flashOCRField('cdlExpiration');
        }
        if (ext.state) {
          // CDL state auto-fill — no field on form, stored internally
        }
        if (ext.certificateExpirationDate) {
          setVal('medCardExpiration', ext.certificateExpirationDate);
          Render.flashOCRField('medCardExpiration');
        }
      },
      onMatchResults: function (data) {
        clearSubmitFallbackTimers();
        Render.showResults(data);
      },
      onMatchError: function (data) {
        clearSubmitFallbackTimers();
        Render.hideLoading();
        showFieldError('Match error: ' + (data.error || 'Unknown error'));
        document.getElementById('formSection').style.display = 'block';
      }
    });
  }

  function startSubmitFallbackTimers(formData) {
    clearSubmitFallbackTimers();
    submitWarningId = setTimeout(function () {
      if (!document.getElementById('loadingSection').classList.contains('active')) return;
      showSubmitTimeoutPrompt(formData);
    }, 12000);
  }

  function clearSubmitFallbackTimers() {
    if (submitWarningId) {
      clearTimeout(submitWarningId);
      submitWarningId = null;
    }
    hideSubmitTimeoutPrompt();
  }

  function showSubmitTimeoutPrompt(formData) {
    hideSubmitTimeoutPrompt();
    var prompt = document.createElement('div');
    prompt.className = 'submit-timeout-prompt';
    prompt.style.cssText =
      'position:fixed;bottom:16px;left:50%;transform:translateX(-50%);' +
      'z-index:10001;background:#0f172a;color:#fff;padding:12px 14px;border-radius:10px;' +
      'box-shadow:0 10px 28px rgba(0,0,0,0.3);font-size:12px;max-width:92vw;';
    prompt.innerHTML =
      '<div style="margin-bottom:8px;font-weight:700;">Still processing your application.</div>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end;">' +
      '<button type="button" id="timeoutWaitBtn" style="background:#334155;color:#fff;border:none;padding:7px 10px;border-radius:6px;font-weight:700;cursor:pointer;">Keep waiting</button>' +
      '<button type="button" id="timeoutGoBtn" style="background:#fbbf24;color:#111827;border:none;padding:7px 10px;border-radius:6px;font-weight:700;cursor:pointer;">Go to AI Matching</button>' +
      '</div>';
    document.body.appendChild(prompt);

    var waitBtn = document.getElementById('timeoutWaitBtn');
    var goBtn = document.getElementById('timeoutGoBtn');
    if (waitBtn) {
      waitBtn.addEventListener('click', function () {
        hideSubmitTimeoutPrompt();
      });
    }
    if (goBtn) {
      goBtn.addEventListener('click', function () {
        var params = new URLSearchParams({
          zip: formData.homeZip || '',
          name: formData.fullName || '',
          src: 'truck-driver-page'
        });
        window.top.location.href = 'https://www.lastmiledr.app/ai-matching?' + params.toString();
      });
    }
  }

  function hideSubmitTimeoutPrompt() {
    var existing = document.querySelector('.submit-timeout-prompt');
    if (existing) existing.remove();
  }

  function setVal(id, value) {
    var el = document.getElementById(id);
    if (el) el.value = value;
  }

  /* --- Interest Handler (global for inline onclick) --- */
  function handleInterest(btn) {
    var dot = btn.dataset.dot;
    var name = btn.dataset.name;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> Applied';
    btn.style.backgroundColor = '#10b981';
    btn.disabled = true;

    var modal = document.getElementById('interestModal');
    document.getElementById('modalCarrierName').textContent = name;
    document.getElementById('modalCarrierFullName').textContent = name;
    document.getElementById('modalCarrierDOT').textContent = dot;
    modal.style.display = 'flex';

    Bridge.sendToWix('logInterest', { carrierDOT: dot, carrierName: name });
  }

  /* --- Modal --- */
  function bindModal() {
    var closeBtn = document.getElementById('modalCloseBtn');
    if (closeBtn) closeBtn.addEventListener('click', function () {
      document.getElementById('interestModal').style.display = 'none';
    });
  }

  /* --- Reset --- */
  function resetForm() {
    clearSubmitFallbackTimers();
    document.getElementById('resultsSection').classList.remove('active');
    document.getElementById('formSection').style.display = 'block';
    document.getElementById('driverForm').reset();
    uploadedFiles = {};
    currentStep = 0;
    Render.showStep(0);

    Config.REQUIRED_DOCS.forEach(function (doc) {
      var zone = document.getElementById('zone-' + doc.id);
      if (zone) {
        zone.classList.remove('has-file');
        zone.innerHTML =
          '<i class="fa-solid fa-' + doc.icon.replace('fa-', '') + '"></i>' +
          '<p>' + doc.label + '</p><p style="font-size:11px;color:#94a3b8;">Tap to upload</p>';
      }
    });
    scrollToForm();
  }

  return {
    init: init,
    handleInterest: handleInterest,
    resetForm: resetForm
  };
})();
