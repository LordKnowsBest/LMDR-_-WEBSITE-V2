// ai-matching-modals.js — Interest modal, application modal, login prompt
// Depends on: ai-matching-helpers.js, ai-matching-bridge.js, ai-matching-renderers.js

function showInterestModal(carrierData) {
  if (!carrierData) return;
  if (typeof FeatureTracker !== 'undefined') FeatureTracker.view('matching_carrier_interest', { carrierName: carrierData.name, dotNumber: carrierData.dotNumber });

  // Populate modal with carrier data
  document.getElementById('modalCarrierName').textContent = carrierData.name;
  document.getElementById('modalCarrierFullName').textContent = carrierData.name;
  document.getElementById('modalCarrierDOT').textContent = carrierData.dotNumber;

  // Handle phone
  const phoneRow = document.getElementById('modalPhoneRow');
  const phoneLink = document.getElementById('modalCarrierPhone');
  if (carrierData.phone) {
    phoneRow.style.display = 'flex';
    phoneLink.href = `tel:${carrierData.phone}`;
    phoneLink.textContent = carrierData.phone;
  } else {
    phoneRow.style.display = 'none';
  }

  // Handle email
  const emailRow = document.getElementById('modalEmailRow');
  const emailLink = document.getElementById('modalCarrierEmail');
  if (carrierData.email) {
    emailRow.style.display = 'flex';
    emailLink.href = `mailto:${carrierData.email}`;
    emailLink.textContent = carrierData.email;
  } else {
    emailRow.style.display = 'none';
  }

  // Show modal
  interestModal.style.display = 'flex';
}

function hideInterestModal() {
  interestModal.style.display = 'none';
  pendingInterestCarrier = null;
}

function compressImageForUpload(file) {
  return new Promise(function (resolve, reject) {
    if (!file) { resolve(null); return; }

    // Skip compression for non-images (PDFs)
    if (file.type === 'application/pdf') {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    // Compression settings for upload (more aggressive than OCR)
    var maxWidth = 800, maxHeight = 1000, quality = 0.6;

    var img = new Image();
    var canvas = document.createElement('canvas');
    var ctx = canvas.getContext('2d');

    img.onload = function () {
      var w = img.width, h = img.height;

      // Scale down if needed
      if (w > maxWidth) { h = Math.round(h * (maxWidth / w)); w = maxWidth; }
      if (h > maxHeight) { w = Math.round(w * (maxHeight / h)); h = maxHeight; }

      canvas.width = w;
      canvas.height = h;

      // White background for transparency
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);

      var compressed = canvas.toDataURL('image/jpeg', quality);
      var origKB = Math.round(file.size / 1024);
      var compKB = Math.round((compressed.length * 3) / 4 / 1024);
      console.log('📦 Upload compression: ' + origKB + 'KB → ' + compKB + 'KB (' + Math.round((1 - compKB / origKB) * 100) + '% reduction)');
      resolve(compressed);
    };

    img.onerror = function () { reject(new Error('Failed to load image for compression')); };

    var reader = new FileReader();
    reader.onload = function (e) { img.src = e.target.result; };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Convert file to base64 (delegates to OCRHandler or fallback)
function fileToBase64(file) {
  if (window.OCRHandler && window.OCRHandler.isInitialized()) {
    return window.OCRHandler.fileToBase64(file);
  }
  // Fallback if OCRHandler not loaded
  return new Promise((resolve, reject) => {
    if (!file) { resolve(null); return; }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Handle file input change - delegates to OCRHandler
function handleFileChange(inputId) {
  if (window.OCRHandler && window.OCRHandler.isInitialized()) {
    window.OCRHandler.handleFileChange(inputId);
  }
}

// Handle OCR result - delegates to OCRHandler
function handleOCRResult(data) {
  if (window.OCRHandler && window.OCRHandler.isInitialized()) {
    window.OCRHandler.handleOCRResult(data);
  }
}

// Remove uploaded file - delegates to OCRHandler
function removeFile(inputId) {
  if (window.OCRHandler && window.OCRHandler.isInitialized()) {
    window.OCRHandler.removeFile(inputId);
  } else {
    // Fallback
    const input = document.getElementById(inputId);
    const box = document.getElementById(inputId + 'Box');
    const nameEl = document.getElementById(inputId + 'Name');
    if (input) input.value = '';
    uploadedFiles[inputId] = null;
    if (box) box.classList.remove('has-file');
    if (nameEl) nameEl.textContent = '';
  }
}

// Reset all file uploads - delegates to OCRHandler
function resetFileUploads() {
  if (window.OCRHandler && window.OCRHandler.isInitialized()) {
    window.OCRHandler.resetFileUploads();
  } else {
    ['cdlFront', 'cdlBack', 'medCard'].forEach(id => removeFile(id));
  }
}

function showApplicationModal(carrierData) {
  if (!carrierData) return;

  currentApplicationCarrier = carrierData;

  // Populate carrier info in form
  document.getElementById('appModalCarrierName').textContent = carrierData.name;
  document.getElementById('appFormCarrierName').textContent = carrierData.name;
  document.getElementById('appFormCarrierDOT').textContent = carrierData.dotNumber;

  // Reset form state
  applicationForm.reset();
  resetFileUploads();

  // Auto-populate from Profile (Phase 4H)
  if (driverProfile) {
    console.log('📑 Auto-populating application from profile');

    // CDL Details
    if (driverProfile.cdl_number) document.getElementById('cdlNumber').value = driverProfile.cdl_number;
    if (driverProfile.cdl_expiration) document.getElementById('cdlExpiration').value = driverProfile.cdl_expiration;
    if (driverProfile.med_card_expiration) document.getElementById('medCardExpiration').value = driverProfile.med_card_expiration;

    // Contact
    if (driverProfile.phone) document.getElementById('appPhone').value = driverProfile.phone;
    if (driverProfile.email) document.getElementById('appEmail').value = driverProfile.email;

    // Documents - Show "Attached" status if URLs exist
    checkPreFilledDocs();
  }

  applicationFormContent.style.display = 'block';
  applicationFormLoading.classList.remove('show');
  applicationFormSuccess.classList.remove('show');

  // Clear any error states
  document.querySelectorAll('.form-group input.error, .form-group select.error').forEach(el => {
    el.classList.remove('error');
  });
  document.querySelectorAll('.error-message').forEach(el => {
    el.classList.remove('show');
  });
  document.querySelectorAll('.file-upload-box').forEach(el => {
    el.classList.remove('error');
  });

  // Reset accordion to initial state and check for pre-filled completions
  if (typeof resetAccordion === 'function') {
    resetAccordion();
    // Check completion states after a delay to account for pre-filled data
    setTimeout(() => {
      if (typeof checkAllSections === 'function') {
        checkAllSections();
      }
    }, 300);
  }

  // Show modal
  applicationModal.style.display = 'flex';
}

function hideApplicationModal() {
  applicationModal.style.display = 'none';
  currentApplicationCarrier = null;
}

function showLoginPrompt() {
  if (!loginPromptOverlay) return;
  // Reset to default state
  if (loginPromptContent) loginPromptContent.style.display = 'block';
  if (loginPromptLoading) loginPromptLoading.classList.remove('show');
  loginPromptOverlay.classList.add('show');
}

function hideLoginPrompt() {
  if (!loginPromptOverlay) return;
  loginPromptOverlay.classList.remove('show');
}

function triggerLoginForApplication(mode) {
  // Switch to loading state
  if (loginPromptContent) loginPromptContent.style.display = 'none';
  if (loginPromptLoading) loginPromptLoading.classList.add('show');

  const loadingText = document.getElementById('loginPromptLoadingText');
  if (loadingText) loadingText.textContent = mode === 'login' ? 'Waiting for log-in...' : 'Waiting for sign-up...';

  // Send to Velo to trigger Wix auth
  sendToWix('loginForApplication', { mode: mode });
}

function validateApplicationForm() {
  let isValid = true;
  const phone = document.getElementById('appPhone');
  const email = document.getElementById('appEmail');
  const phoneError = document.getElementById('phoneError');
  const emailError = document.getElementById('emailError');
  const cdlError = document.getElementById('cdlError');
  const medCardError = document.getElementById('medCardError');

  // Reset errors
  phone.classList.remove('error');
  email.classList.remove('error');
  phoneError.classList.remove('show');
  emailError.classList.remove('show');
  cdlError.classList.remove('show');
  medCardError.classList.remove('show');
  document.querySelectorAll('.file-upload-box').forEach(el => el.classList.remove('error'));

  // Reset DOB and name field errors
  const appDOB = document.getElementById('appDOB');
  const dobErrorEl = document.getElementById('dobError');
  const appFirstName = document.getElementById('appFirstName');
  const firstNameError = document.getElementById('firstNameError');
  const appLastName = document.getElementById('appLastName');
  const lastNameError = document.getElementById('lastNameError');
  if (appDOB) appDOB.classList.remove('error');
  if (dobErrorEl) dobErrorEl.classList.remove('show');
  if (appFirstName) appFirstName.classList.remove('error');
  if (firstNameError) firstNameError.classList.remove('show');
  if (appLastName) appLastName.classList.remove('error');
  if (lastNameError) lastNameError.classList.remove('show');

  // CDL validation (both front and back required)
  const hasCdlFront = uploadedFiles.cdlFront || (driverProfile && driverProfile.cdl_front_image);
  const hasCdlBack = uploadedFiles.cdlBack || (driverProfile && driverProfile.cdl_back_image);

  if (!hasCdlFront || !hasCdlBack) {
    if (!hasCdlFront) document.getElementById('cdlFrontBox').classList.add('error');
    if (!hasCdlBack) document.getElementById('cdlBackBox').classList.add('error');
    cdlError.classList.add('show');
    isValid = false;
  }

  // Medical card validation
  const hasMedCard = uploadedFiles.medCard || (driverProfile && driverProfile.med_card_image);
  if (!hasMedCard) {
    document.getElementById('medCardBox').classList.add('error');
    medCardError.classList.add('show');
    isValid = false;
  }

  // First name validation
  const firstName = document.getElementById('appFirstName');
  const firstNameErr = document.getElementById('firstNameError');
  if (!firstName.value.trim()) {
    firstName.classList.add('error');
    firstNameErr.classList.add('show');
    isValid = false;
  } else {
    firstName.classList.remove('error');
    firstNameErr.classList.remove('show');
  }

  // Last name validation
  const lastName = document.getElementById('appLastName');
  const lastNameErr = document.getElementById('lastNameError');
  if (!lastName.value.trim()) {
    lastName.classList.add('error');
    lastNameErr.classList.add('show');
    isValid = false;
  } else {
    lastName.classList.remove('error');
    lastNameErr.classList.remove('show');
  }

  // Date of Birth validation (required for driver profiles)
  const dob = document.getElementById('appDOB');
  const dobError = document.getElementById('dobError');
  if (!dob.value) {
    dob.classList.add('error');
    dobError.classList.add('show');
    isValid = false;
    console.log('❌ DOB validation failed - field is empty');
  } else {
    dob.classList.remove('error');
    dobError.classList.remove('show');
    console.log('✅ DOB validation passed:', dob.value);
  }

  // CDL number validation
  const cdlNumber = document.getElementById('cdlNumber');
  const cdlNumberError = document.getElementById('cdlNumberError');
  if (!cdlNumber.value.trim()) {
    cdlNumber.classList.add('error');
    cdlNumberError.classList.add('show');
    isValid = false;
  } else {
    cdlNumber.classList.remove('error');
    cdlNumberError.classList.remove('show');
  }

  // CDL expiration validation
  const cdlExpiration = document.getElementById('cdlExpiration');
  const cdlExpirationError = document.getElementById('cdlExpirationError');
  if (!cdlExpiration.value) {
    cdlExpiration.classList.add('error');
    cdlExpirationError.classList.add('show');
    isValid = false;
  } else {
    cdlExpiration.classList.remove('error');
    cdlExpirationError.classList.remove('show');
  }

  // Medical card expiration validation
  const medCardExpiration = document.getElementById('medCardExpiration');
  const medCardExpirationError = document.getElementById('medCardExpirationError');
  if (!medCardExpiration.value) {
    medCardExpiration.classList.add('error');
    medCardExpirationError.classList.add('show');
    isValid = false;
  } else {
    medCardExpiration.classList.remove('error');
    medCardExpirationError.classList.remove('show');
  }

  // Phone validation
  const phoneValue = phone.value.trim();
  if (!phoneValue || phoneValue.length < 10) {
    phone.classList.add('error');
    phoneError.classList.add('show');
    isValid = false;
  }

  // Email validation
  const emailValue = email.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailValue || !emailRegex.test(emailValue)) {
    email.classList.add('error');
    emailError.classList.add('show');
    isValid = false;
  }

  // Companies count validation
  const companiesCount = document.getElementById('appCompaniesCount');
  const companiesCountError = document.getElementById('companiesCountError');
  if (!companiesCount.value) {
    companiesCount.classList.add('error');
    companiesCountError.classList.add('show');
    isValid = false;
  } else {
    companiesCount.classList.remove('error');
    companiesCountError.classList.remove('show');
  }

  // Employer 1 validation (required when companies >= 1)
  const companiesCountVal = parseInt(companiesCount.value) || 0;
  if (companiesCountVal >= 1) {
    const employer1Name = document.getElementById('appEmployer1Name');
    const employer1NameError = document.getElementById('employer1NameError');
    const employer1Duration = document.getElementById('appEmployer1Duration');
    const employer1DurationError = document.getElementById('employer1DurationError');

    if (!employer1Name.value.trim()) {
      employer1Name.classList.add('error');
      employer1NameError.classList.add('show');
      isValid = false;
    } else {
      employer1Name.classList.remove('error');
      employer1NameError.classList.remove('show');
    }

    if (!employer1Duration.value) {
      employer1Duration.classList.add('error');
      employer1DurationError.classList.add('show');
      isValid = false;
    } else {
      employer1Duration.classList.remove('error');
      employer1DurationError.classList.remove('show');
    }
  }

  return isValid;
}

async function submitApplication() {
  if (!validateApplicationForm()) return;
  if (!currentApplicationCarrier) return;
  if (typeof FeatureTracker !== 'undefined') FeatureTracker.click('matching_submit_application', { carrierName: currentApplicationCarrier.name, dotNumber: currentApplicationCarrier.dotNumber });

  // LOGIN GATE: If not logged in, prompt sign-up instead of submitting
  if (!userStatus.loggedIn) {
    console.log('🔒 User not logged in - showing login prompt');
    pendingApplicationData = { carrierData: currentApplicationCarrier };
    showLoginPrompt();
    return;
  }

  // Show loading state
  applicationFormContent.style.display = 'none';
  applicationFormLoading.classList.add('show');

  // Get loading text element
  const loadingText = document.getElementById('applicationLoadingText');
  if (loadingText) loadingText.textContent = 'Submitting your application...';

  // Show OCR processing message after 2 seconds (documents are uploaded first, then OCR runs)
  appOcrTimeout = setTimeout(() => {
    if (loadingText) loadingText.textContent = 'Gemini AI is extracting your document data...';
  }, 2000);

  // Show profile update message after 5 seconds
  appProfileTimeout = setTimeout(() => {
    if (loadingText) loadingText.textContent = 'Updating your driver profile...';
  }, 5000);

  try {
    // Compress and convert files to base64 (prevents 413 Payload Too Large errors)
    const [cdlFrontData, cdlBackData, medCardData] = await Promise.all([
      compressImageForUpload(uploadedFiles.cdlFront),
      compressImageForUpload(uploadedFiles.cdlBack),
      compressImageForUpload(uploadedFiles.medCard)
    ]);

    // Collect multi-select values
    const getCheckedValues = (name) => {
      return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(el => el.value);
    };

    // Get form data with all fields matching seeded driver schema
    const formData = {
      // Carrier info
      carrierDOT: currentApplicationCarrier.dotNumber,
      carrierName: currentApplicationCarrier.name,
      matchScore: currentApplicationCarrier.matchScore || 0,

      // Driver identity (NEW - from OCR or manual)
      firstName: document.getElementById('appFirstName').value.trim(),
      lastName: document.getElementById('appLastName').value.trim(),
      dob: document.getElementById('appDOB')?.value || null, // Date of Birth from OCR

      // Contact info
      phone: document.getElementById('appPhone').value.trim(),
      email: document.getElementById('appEmail').value.trim(),
      preferredContact: document.querySelector('input[name="preferredContact"]:checked')?.value || 'phone',

      // Location (NEW)
      city: document.getElementById('appCity').value.trim(),
      state: document.getElementById('appState').value,
      homeZip: document.getElementById('appZip').value.trim(),

      // CDL info
      cdlNumber: document.getElementById('cdlNumber').value.trim(),
      cdlExpiration: document.getElementById('cdlExpiration').value,
      cdlClass: document.querySelector('input[name="cdlClass"]:checked')?.value || '', // NEW
      endorsements: getCheckedValues('endorsements'), // NEW - array
      cdlRestrictions: window.extractedRestrictions || 'NONE', // From OCR - "NONE" = no restrictions (favorable)
      medCardExpiration: document.getElementById('medCardExpiration').value,

      // Experience (NEW)
      yearsExperience: parseInt(document.getElementById('appYearsExperience').value) || 0,
      equipmentExperience: getCheckedValues('equipmentExperience'), // NEW - array
      mvrStatus: document.getElementById('appMvrStatus').value, // NEW

      // Safety Record (NEW) - Use camelCase to match page code expectations
      accidentsLast3Years: parseInt(document.getElementById('appAccidents').value) || 0,
      violationsLast3Years: parseInt(document.getElementById('appViolations').value) || 0,

      // Work History (NEW) - Use camelCase to match page code expectations
      companiesLast3Years: parseInt(document.getElementById('appCompaniesCount').value) || 0,
      employer1Name: document.getElementById('appEmployer1Name').value.trim(),
      employer1Duration: document.getElementById('appEmployer1Duration').value,
      employer2Name: document.getElementById('appEmployer2Name').value.trim(),
      employer2Duration: document.getElementById('appEmployer2Duration').value,
      employer3Name: document.getElementById('appEmployer3Name').value.trim(),
      employer3Duration: document.getElementById('appEmployer3Duration').value,

      // Preferences (NEW)
      preferredRoutes: getCheckedValues('preferredRoutes'), // NEW - array
      homeTimePreference: document.getElementById('appHomeTime').value, // NEW
      availability: document.getElementById('appAvailability').value,

      // Message
      message: document.getElementById('appMessage').value.trim(),

      // Documents
      documents: {
        cdlFront: uploadedFiles.cdlFront ? { data: cdlFrontData, name: uploadedFiles.cdlFront.name, type: uploadedFiles.cdlFront.type } : null,
        cdlBack: uploadedFiles.cdlBack ? { data: cdlBackData, name: uploadedFiles.cdlBack.name, type: uploadedFiles.cdlBack.type } : null,
        medCard: uploadedFiles.medCard ? { data: medCardData, name: uploadedFiles.medCard.name, type: uploadedFiles.medCard.type } : null
      },
      existingProfileDocs: {
        cdl_front_image: driverProfile?.cdl_front_image,
        cdl_back_image: driverProfile?.cdl_back_image,
        med_card_image: driverProfile?.med_card_image,
        resume_file: driverProfile?.resume_file
      }
    };

    // DEBUG: Log all collected form data
    console.log('=== APPLICATION FORM DATA DEBUG ===');
    console.log('firstName:', formData.firstName);
    console.log('lastName:', formData.lastName);
    console.log('dob:', formData.dob);
    console.log('dob element exists:', !!document.getElementById('appDOB'));
    console.log('dob element value:', document.getElementById('appDOB')?.value);
    console.log('city:', formData.city);
    console.log('state:', formData.state);
    console.log('homeZip:', formData.homeZip);
    console.log('cdlClass:', formData.cdlClass);
    console.log('endorsements:', formData.endorsements);
    console.log('cdlRestrictions:', formData.cdlRestrictions);
    console.log('yearsExperience:', formData.yearsExperience);
    console.log('equipmentExperience:', formData.equipmentExperience);
    console.log('mvrStatus:', formData.mvrStatus);
    console.log('accidentsLast3Years:', formData.accidentsLast3Years);
    console.log('violationsLast3Years:', formData.violationsLast3Years);
    console.log('companiesLast3Years:', formData.companiesLast3Years);
    console.log('employer1Name:', formData.employer1Name);
    console.log('employer1Duration:', formData.employer1Duration);
    console.log('employer2Name:', formData.employer2Name);
    console.log('employer2Duration:', formData.employer2Duration);
    console.log('employer3Name:', formData.employer3Name);
    console.log('employer3Duration:', formData.employer3Duration);
    console.log('preferredRoutes:', formData.preferredRoutes);
    console.log('homeTimePreference:', formData.homeTimePreference);
    console.log('=== END DEBUG ===');

    console.log('Submitting application with documents');
    sendToWix('submitApplication', formData);
  } catch (error) {
    // Clear OCR animation timeouts
    if (appOcrTimeout) clearTimeout(appOcrTimeout);
    if (appProfileTimeout) clearTimeout(appProfileTimeout);

    console.error('Error processing files:', error);
    applicationFormLoading.classList.remove('show');
    applicationFormContent.style.display = 'block';
    showToast('Error processing files. Please try again.');
  }
}

function checkPreFilledDocs() {
  if (!driverProfile) return;

  const docs = [
    { id: 'cdlFront', url: driverProfile.cdl_front_image },
    { id: 'cdlBack', url: driverProfile.cdl_back_image },
    { id: 'medCard', url: driverProfile.med_card_image }
  ];

  docs.forEach(doc => {
    if (doc.url) {
      const box = document.getElementById(doc.id + 'Box');
      const nameEl = document.getElementById(doc.id + 'Name');
      if (box && nameEl) {
        box.classList.add('has-file');
        box.style.borderColor = 'var(--color-success)';
        nameEl.innerHTML = `<i class="fa-solid fa-check-circle" style="color: var(--color-success)"></i> Attached from Profile`;
      }
    }
  });
}

function handleApplicationSubmitted(data) {
  // Clear OCR animation timeouts
  if (appOcrTimeout) clearTimeout(appOcrTimeout);
  if (appProfileTimeout) clearTimeout(appProfileTimeout);

  // Hide loading
  applicationFormLoading.classList.remove('show');

  if (data.success) {
    // Show success state
    applicationFormSuccess.classList.add('show');

    // Update the card to show "Applied" status
    updateCardToApplied(data.carrierDOT);
  } else if (data.isDuplicate) {
    // Handle duplicate submission - show friendly message and update card
    console.log('⚠️ Duplicate application detected:', data.existingStatus);

    // Still update the card since they already applied
    updateCardToApplied(currentApplicationCarrier?.dot);

    // Show success state with modified message
    applicationFormSuccess.classList.add('show');
    const successTitle = applicationFormSuccess.querySelector('h3');
    const successMsg = applicationFormSuccess.querySelector('p');
    if (successTitle) successTitle.textContent = 'Already Applied!';
    if (successMsg) successMsg.textContent = `You've already applied to this carrier. Your application is currently "${formatStatus(data.existingStatus)}". Check your dashboard to track progress.`;
  } else {
    // Show form again with error
    applicationFormContent.style.display = 'block';
    showToast('Error submitting application: ' + (data.error || 'Unknown error'));
  }
}

function updateCardToApplied(carrierDOT) {
  if (!carrierDOT) return;

  const dotStr = String(carrierDOT);
  appliedCarrierDOTs.add(dotStr);
  const card = document.querySelector(`.match-card[data-dot="${dotStr}"]`);
  if (card) {
    // Add the tag
    const tagsContainer = card.querySelector('.match-tags');
    if (tagsContainer && !tagsContainer.querySelector('.match-tag.applied')) {
      tagsContainer.insertAdjacentHTML('afterbegin',
        '<span class="match-tag applied" style="background: #10b98115; color: #10b981; border: 1px solid #10b98130; font-weight: 800;"><i class="fa-solid fa-check-circle"></i> Applied</span>');
    }
    // Update the button
    const btn = card.querySelector('.interested-btn');
    if (btn) {
      btn.classList.add('applied');
      btn.disabled = true;
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Application Sent';
    }
  }
}

