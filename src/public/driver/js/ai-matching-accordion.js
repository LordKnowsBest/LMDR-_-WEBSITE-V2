(function (global) {
  'use strict';

  // =========================================================================
  // ACCORDION SYSTEM - Collapsible Form Sections with Completion Tracking
  // =========================================================================

  const ACCORDION_CONFIG = {
    totalSections: 6,
    sectionLabels: ['Documents', 'Personal', 'CDL Info', 'Safety', 'History', 'Preferences'],
    // Required fields per section for completion detection
    sectionRequirements: {
      1: { files: ['cdlFront', 'cdlBack', 'medCard'] },
      2: { fields: ['appFirstName', 'appLastName', 'appDOB'] },
      3: { fields: ['cdlNumber', 'cdlExpiration', 'medCardExpiration', 'appCity', 'appState', 'appZip'], radio: ['cdlClass'] },
      4: { fields: ['appYearsExperience'] },
      5: { fields: ['appCompaniesCount'] },
      6: { checkboxGroups: ['equipmentExperience', 'preferredRoutes'], fields: ['appPhone', 'appEmail'] }
    }
  };

  let _currentSection = 1;
  let _sectionCompletion = { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false };

  // Toggle accordion section expand/collapse
  function toggleAccordion(sectionNum) {
    const section = document.getElementById('accordionSection' + sectionNum);
    if (!section) return;

    const wasExpanded = section.classList.contains('expanded');

    // Collapse all sections first
    for (let i = 1; i <= ACCORDION_CONFIG.totalSections; i++) {
      const sec = document.getElementById('accordionSection' + i);
      if (sec) sec.classList.remove('expanded');
    }

    // If it was collapsed, expand it
    if (!wasExpanded) {
      section.classList.add('expanded');
      _currentSection = sectionNum;
      updateProgressIndicator();

      // Scroll section into view within modal container
      setTimeout(() => {
        scrollSectionIntoView(section);
      }, 100);
    }
  }

  // Smart scroll that works within modal containers
  function scrollSectionIntoView(section) {
    const modalForm = section.closest('.modal-form');
    if (modalForm) {
      // Scroll within modal
      const sectionTop = section.offsetTop - modalForm.offsetTop;
      modalForm.scrollTo({ top: sectionTop - 10, behavior: 'smooth' });
    } else {
      // Fallback to regular scroll
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Advance to next section (called by "Continue" buttons)
  function advanceToSection(nextSectionNum) {
    const currentSection = nextSectionNum - 1;

    // Mark current section as complete if requirements are met
    if (currentSection >= 1 && currentSection <= ACCORDION_CONFIG.totalSections) {
      checkSectionCompletion(currentSection);
    }

    // Collapse current section
    const current = document.getElementById('accordionSection' + currentSection);
    if (current) current.classList.remove('expanded');

    // Expand next section
    if (nextSectionNum <= ACCORDION_CONFIG.totalSections) {
      const next = document.getElementById('accordionSection' + nextSectionNum);
      if (next) {
        next.classList.add('expanded');
        _currentSection = nextSectionNum;
        updateProgressIndicator();

        // Scroll next section into view within modal
        setTimeout(() => {
          scrollSectionIntoView(next);
        }, 100);
      }
    }
  }

  // Check if a section's required fields are filled
  function checkSectionCompletion(sectionNum) {
    const requirements = ACCORDION_CONFIG.sectionRequirements[sectionNum];
    if (!requirements) return false;

    let isComplete = true;

    // Check file uploads
    if (requirements.files) {
      for (const fileId of requirements.files) {
        const box = document.getElementById(fileId + 'Box');
        if (!box || !box.classList.contains('has-file')) {
          isComplete = false;
          break;
        }
      }
    }

    // Check regular fields
    if (isComplete && requirements.fields) {
      for (const fieldId of requirements.fields) {
        const field = document.getElementById(fieldId);
        if (!field || !field.value || field.value.trim() === '') {
          isComplete = false;
          break;
        }
      }
    }

    // Check radio groups
    if (isComplete && requirements.radio) {
      for (const radioName of requirements.radio) {
        const checked = document.querySelector('input[name="' + radioName + '"]:checked');
        if (!checked) {
          isComplete = false;
          break;
        }
      }
    }

    // Check checkbox groups (at least one selected)
    if (isComplete && requirements.checkboxGroups) {
      for (const groupName of requirements.checkboxGroups) {
        const checked = document.querySelector('input[name="' + groupName + '"]:checked');
        if (!checked) {
          isComplete = false;
          break;
        }
      }
    }

    // Update completion state
    _sectionCompletion[sectionNum] = isComplete;
    updateSectionStatus(sectionNum, isComplete);
    updateProgressIndicator();

    return isComplete;
  }

  // Update the visual status of a section header
  function updateSectionStatus(sectionNum, isComplete) {
    const section = document.getElementById('accordionSection' + sectionNum);
    if (!section) return;

    const statusEl = section.querySelector('.accordion-status');

    if (isComplete) {
      section.classList.add('complete');
      if (statusEl) statusEl.textContent = 'Complete';
    } else {
      section.classList.remove('complete');
      if (statusEl) statusEl.textContent = '';
    }
  }

  // Update the top progress indicator
  function updateProgressIndicator() {
    const progressSteps = document.querySelectorAll('.accordion-progress-step');

    progressSteps.forEach((step, index) => {
      const sectionNum = index + 1;
      step.classList.remove('active', 'complete');

      if (_sectionCompletion[sectionNum]) {
        step.classList.add('complete');
      } else if (sectionNum === _currentSection) {
        step.classList.add('active');
      }
    });
  }

  // Check all sections for completion (called periodically)
  function checkAllSections() {
    for (let i = 1; i <= ACCORDION_CONFIG.totalSections; i++) {
      checkSectionCompletion(i);
    }
  }

  // Setup change listeners for real-time completion detection
  function setupCompletionListeners() {
    // Listen to all inputs and selects in the form
    const form = document.getElementById('applicationForm');
    if (!form) return;

    form.addEventListener('input', debounce(function (e) {
      // Find which section this input belongs to
      const section = e.target.closest('.accordion-section');
      if (section) {
        const sectionNum = parseInt(section.dataset.section);
        if (sectionNum) {
          checkSectionCompletion(sectionNum);
        }
      }
    }, 300));

    form.addEventListener('change', function (e) {
      const section = e.target.closest('.accordion-section');
      if (section) {
        const sectionNum = parseInt(section.dataset.section);
        if (sectionNum) {
          checkSectionCompletion(sectionNum);
        }
      }
    });

    // Watch for file upload changes via MutationObserver on file boxes
    const fileBoxes = ['cdlFrontBox', 'cdlBackBox', 'medCardBox'];
    fileBoxes.forEach(boxId => {
      const box = document.getElementById(boxId);
      if (box) {
        const observer = new MutationObserver(() => {
          checkSectionCompletion(1);
        });
        observer.observe(box, { attributes: true, attributeFilter: ['class'] });
      }
    });
  }

  // Debounce helper
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Reset accordion to initial state (for when modal reopens)
  function resetAccordion() {
    _currentSection = 1;
    _sectionCompletion = { 1: false, 2: false, 3: false, 4: false, 5: false, 6: false };

    // Collapse all and expand section 1
    for (let i = 1; i <= ACCORDION_CONFIG.totalSections; i++) {
      const section = document.getElementById('accordionSection' + i);
      if (section) {
        section.classList.remove('expanded', 'complete');
        const statusEl = section.querySelector('.accordion-status');
        if (statusEl) statusEl.textContent = '';
      }
    }

    const firstSection = document.getElementById('accordionSection1');
    if (firstSection) firstSection.classList.add('expanded');

    updateProgressIndicator();
  }

  // Initialize accordion system
  function initAccordion() {
    console.log('[Accordion] Initializing mobile-first accordion system');

    setupCompletionListeners();
    updateProgressIndicator();

    // Check initial completion state after a short delay (for pre-filled data)
    setTimeout(checkAllSections, 500);

    console.log('[Accordion] Accordion system ready');
  }

  // Expose functions globally
  global.toggleAccordion = toggleAccordion;
  global.advanceToSection = advanceToSection;
  global.resetAccordion = resetAccordion;
  global.checkAllSections = checkAllSections;

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAccordion);
  } else {
    initAccordion();
  }

})(window);
