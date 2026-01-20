/**
 * Rapid Response - Job Description Page
 * Urgent/time-sensitive job opportunities with fast apply flow
 *
 * Focus: Countdown timers, urgency messaging, quick apply for logged-in users
 *
 * Element IDs:
 * - #urgencyBanner - Top banner with urgency messaging
 * - #countdownTimer - Countdown to application deadline
 * - #jobDetailsSection - Main job details container
 * - #quickApplyBtn - One-click apply button for members
 * - #similarJobsRepeater - Related urgent opportunities
 * - #rapidResponseHtml - HTML component with urgency countdown
 *
 * @see docs/PAGE_DATA_IMPLEMENTATION_GUIDE.md
 */

import wixData from 'wix-data';
import wixLocation from 'wix-location';
import wixWindow from 'wix-window';
import wixUsers from 'wix-users';
import { getPremiumOpportunities, getTopJobOpportunities } from 'backend/publicStatsService';

// Page state
let currentJob = null;
let countdownInterval = null;

$w.onReady(async function () {
  console.log('Rapid Response Job Page initialized');

  // Get job ID from URL parameters
  const jobId = wixLocation.query.id || wixLocation.query.jobId;

  await Promise.all([
    loadUrgencyBanner(),
    loadJobDetails(jobId),
    loadUrgentJobs(),
    loadQuickApplyCta()
  ]);

  // Start countdown timer
  initCountdownTimer();
});

// ============================================================================
// URGENCY BANNER
// ============================================================================

/**
 * Load and display urgency banner with slots remaining
 * Element: #urgencyBanner
 */
async function loadUrgencyBanner() {
  try {
    const banner = $w('#urgencyBanner');
    if (!banner) return;

    // Get current urgent opportunities count
    const urgentJobs = await getPremiumOpportunities(10);
    const slotsRemaining = urgentJobs.length > 0 ? Math.min(urgentJobs.length, 5) : 3;

    // Update banner elements
    const bannerElements = {
      '#slotsRemainingText': `Only ${slotsRemaining} positions remaining!`,
      '#urgencyMessage': 'These positions fill quickly - Apply now before they are gone!'
    };

    Object.entries(bannerElements).forEach(([selector, value]) => {
      try {
        const element = $w(selector);
        if (element && element.text !== undefined) {
          element.text = value;
        }
      } catch (e) {
        // Element may not exist
      }
    });

    banner.show();

  } catch (err) {
    console.error('Failed to load urgency banner:', err);
  }
}

// ============================================================================
// COUNTDOWN TIMER
// ============================================================================

/**
 * Initialize countdown timer for application deadline
 * Element: #countdownTimer, #rapidResponseHtml
 */
function initCountdownTimer() {
  try {
    // Set deadline to end of day (or configurable deadline)
    const now = new Date();
    const deadline = new Date(now);
    deadline.setHours(23, 59, 59, 999);

    // If current job has a validThrough date, use that instead
    if (currentJob && currentJob.validThrough) {
      try {
        const jobDeadline = new Date(currentJob.validThrough);
        if (!isNaN(jobDeadline.getTime()) && jobDeadline > now) {
          deadline.setTime(jobDeadline.getTime());
        }
      } catch (e) {
        // Use default deadline
      }
    }

    // Update timer immediately
    updateCountdown(deadline);

    // Update every second
    countdownInterval = setInterval(() => {
      updateCountdown(deadline);
    }, 1000);

    // Send countdown data to HTML component
    sendCountdownToHtml(deadline);

  } catch (err) {
    console.error('Failed to initialize countdown timer:', err);
  }
}

/**
 * Update countdown display
 */
function updateCountdown(deadline) {
  const now = new Date();
  const diff = deadline - now;

  if (diff <= 0) {
    // Deadline passed
    clearInterval(countdownInterval);
    try {
      const timerElement = $w('#countdownTimer');
      if (timerElement && timerElement.text !== undefined) {
        timerElement.text = 'Application deadline passed';
      }
    } catch (e) {
      // Element may not exist
    }
    return;
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  try {
    const timerElement = $w('#countdownTimer');
    if (timerElement && timerElement.text !== undefined) {
      timerElement.text = timeString;
    }
  } catch (e) {
    // Element may not exist
  }

  // Update individual time elements if they exist
  const timeElements = {
    '#countdownHours': hours.toString().padStart(2, '0'),
    '#countdownMinutes': minutes.toString().padStart(2, '0'),
    '#countdownSeconds': seconds.toString().padStart(2, '0')
  };

  Object.entries(timeElements).forEach(([selector, value]) => {
    try {
      const element = $w(selector);
      if (element && element.text !== undefined) {
        element.text = value;
      }
    } catch (e) {
      // Element may not exist
    }
  });
}

/**
 * Send countdown data to HTML component
 */
function sendCountdownToHtml(deadline) {
  try {
    const htmlComponent = $w('#rapidResponseHtml');
    if (htmlComponent && typeof htmlComponent.postMessage === 'function') {
      htmlComponent.postMessage({
        type: 'countdown',
        deadline: deadline.toISOString(),
        job: currentJob
      });
    }
  } catch (e) {
    // HTML component may not exist
  }
}

// ============================================================================
// JOB DETAILS
// ============================================================================

/**
 * Load job details from URL parameter
 * Element: #jobDetailsSection
 * @param {string} jobId - Job ID from URL
 */
async function loadJobDetails(jobId) {
  try {
    if (!jobId) {
      // No job ID - show featured urgent job
      const urgentJobs = await getPremiumOpportunities(1);
      if (urgentJobs.length > 0) {
        currentJob = urgentJobs[0];
        displayJobDetails(currentJob);
      } else {
        showNoJobMessage();
      }
      return;
    }

    // Query for specific job from Carriers collection
    const result = await wixData.query('Carriers')
      .eq('_id', jobId)
      .find();

    if (result.items.length === 0) {
      // Try DriverJobs collection
      const jobsResult = await wixData.query('DriverJobs')
        .eq('_id', jobId)
        .find();

      if (jobsResult.items.length > 0) {
        currentJob = formatDriverJob(jobsResult.items[0]);
        displayJobDetails(currentJob);
      } else {
        showNoJobMessage();
      }
      return;
    }

    currentJob = formatCarrierJob(result.items[0]);
    displayJobDetails(currentJob);

  } catch (err) {
    console.error('Failed to load job details:', err);
    showNoJobMessage();
  }
}

/**
 * Format carrier data for display
 */
function formatCarrierJob(carrier) {
  return {
    _id: carrier._id,
    carrierName: carrier.legal_name || 'LMDR Partner Carrier',
    payRange: formatPayRange(carrier.pay_per_mile_min, carrier.pay_per_mile_max),
    signOnBonus: carrier.sign_on_bonus || null,
    location: `${carrier.city || ''}, ${carrier.state || ''}`.replace(/^, |, $/g, '') || 'Multiple Locations',
    operationType: carrier.operation_type || 'OTR',
    homeTime: carrier.home_time || 'Varies',
    benefits: carrier.benefits_summary || 'Full benefits package',
    fleetSize: carrier.fleet_size,
    urgencyLevel: carrier.urgency_level || 'high',
    openPositions: carrier.open_positions || 1,
    dotNumber: carrier.DOT_NUMBER,
    description: carrier.company_description || '',
    validThrough: carrier.valid_through || null,
    logoUrl: carrier.logo_url || ''
  };
}

/**
 * Format driver job data for display
 */
function formatDriverJob(job) {
  return {
    _id: job._id,
    carrierName: job.hiringLocation || job.companyBase || 'LMDR Partner',
    payRange: job.payRate || 'Competitive',
    signOnBonus: null,
    location: `${job.city || ''}, ${job.state || ''}`.replace(/^, |, $/g, '') || 'Multiple Locations',
    operationType: job.routeType || 'OTR',
    homeTime: job.homeTime || 'Varies',
    benefits: job.benefits || 'Full benefits package',
    fleetSize: null,
    urgencyLevel: 'high',
    openPositions: 1,
    description: job.description || job.jobDescription1 || '',
    validThrough: job.validThrough || null,
    logoUrl: job.companyLogo || ''
  };
}

/**
 * Display job details in the UI
 */
function displayJobDetails(job) {
  if (!job) return;

  const jobElements = {
    '#jobTitle': `Urgent: ${job.operationType} Driver - ${job.carrierName}`,
    '#carrierName': job.carrierName,
    '#payRange': job.payRange,
    '#jobLocation': job.location,
    '#operationType': job.operationType,
    '#homeTime': job.homeTime,
    '#benefitsSummary': job.benefits,
    '#openPositions': `${job.openPositions} position${job.openPositions > 1 ? 's' : ''} available`,
    '#jobDescription': job.description
  };

  Object.entries(jobElements).forEach(([selector, value]) => {
    try {
      const element = $w(selector);
      if (element) {
        if (element.text !== undefined) {
          element.text = value || '';
        } else if (element.html !== undefined) {
          element.html = value || '';
        }
      }
    } catch (e) {
      // Element may not exist
    }
  });

  // Show sign-on bonus if available
  if (job.signOnBonus) {
    try {
      const bonusBadge = $w('#signOnBonusBadge');
      if (bonusBadge) {
        bonusBadge.text = `$${job.signOnBonus.toLocaleString()} Sign-On Bonus!`;
        bonusBadge.show();
      }
    } catch (e) {
      // Element may not exist
    }
  }

  // Show company logo
  if (job.logoUrl) {
    try {
      const logo = $w('#companyLogo');
      if (logo && logo.src !== undefined) {
        logo.src = job.logoUrl;
        logo.show();
      }
    } catch (e) {
      // Element may not exist
    }
  }

  // Show job details section
  try {
    const section = $w('#jobDetailsSection');
    if (section && section.show) section.show();
  } catch (e) {
    // Section may not exist
  }

  // Send job data to HTML component
  sendJobToHtml(job);
}

/**
 * Send job data to HTML component
 */
function sendJobToHtml(job) {
  try {
    const htmlComponent = $w('#rapidResponseHtml');
    if (htmlComponent && typeof htmlComponent.postMessage === 'function') {
      htmlComponent.postMessage({
        type: 'jobDetails',
        job: job
      });
    }
  } catch (e) {
    // HTML component may not exist
  }
}

/**
 * Show message when no job is found
 */
function showNoJobMessage() {
  try {
    const section = $w('#jobDetailsSection');
    if (section && section.collapse) section.collapse();

    const noJobMessage = $w('#noJobMessage');
    if (noJobMessage && noJobMessage.show) noJobMessage.show();
  } catch (e) {
    // Elements may not exist
  }
}

// ============================================================================
// URGENT JOBS (Premium Opportunities)
// ============================================================================

/**
 * Load urgent job opportunities
 * Element: #similarJobsRepeater
 */
async function loadUrgentJobs() {
  try {
    const urgentJobs = await getPremiumOpportunities(5);

    if (urgentJobs.length === 0) {
      // Fallback to top job opportunities
      const topJobs = await getTopJobOpportunities(5);
      if (topJobs.length > 0) {
        displaySimilarJobs(topJobs);
      } else {
        hideSimilarJobsSection();
      }
      return;
    }

    displaySimilarJobs(urgentJobs);

  } catch (err) {
    console.error('Failed to load urgent jobs:', err);
    hideSimilarJobsSection();
  }
}

/**
 * Display similar/urgent jobs in repeater
 */
function displaySimilarJobs(jobs) {
  try {
    const repeater = $w('#similarJobsRepeater');
    if (!repeater || repeater.data === undefined) {
      return;
    }

    // Filter out current job if present
    const filteredJobs = jobs.filter(job =>
      !currentJob || job._id !== currentJob._id
    ).slice(0, 4);

    if (filteredJobs.length === 0) {
      hideSimilarJobsSection();
      return;
    }

    repeater.data = filteredJobs.map(job => ({
      _id: job._id,
      carrierName: job.carrierName,
      payRange: job.payRange,
      location: job.location,
      operationType: job.operationType,
      signOnBonus: job.signOnBonus,
      urgencyLevel: job.urgencyLevel || 'normal'
    }));

    repeater.onItemReady(($item, itemData) => {
      try {
        if ($item('#similarJobCarrier')) $item('#similarJobCarrier').text = itemData.carrierName;
        if ($item('#similarJobPay')) $item('#similarJobPay').text = itemData.payRange;
        if ($item('#similarJobLocation')) $item('#similarJobLocation').text = itemData.location;
        if ($item('#similarJobType')) $item('#similarJobType').text = itemData.operationType;

        // Urgency badge
        if (itemData.urgencyLevel === 'high' || itemData.signOnBonus) {
          try {
            const urgencyBadge = $item('#urgencyBadge');
            if (urgencyBadge) {
              urgencyBadge.text = itemData.signOnBonus ? 'Bonus!' : 'Urgent';
              urgencyBadge.show();
            }
          } catch (e) {
            // Element may not exist
          }
        }

        // View job button
        try {
          const viewBtn = $item('#viewJobBtn');
          if (viewBtn) {
            viewBtn.onClick(() => {
              wixLocation.to(`/rapid-response-job-description?id=${itemData._id}`);
            });
          }
        } catch (e) {
          // Element may not exist
        }

        // Quick apply button for similar jobs
        try {
          const quickApplyBtn = $item('#similarQuickApplyBtn');
          if (quickApplyBtn) {
            quickApplyBtn.onClick(() => {
              handleQuickApply(itemData._id);
            });
          }
        } catch (e) {
          // Element may not exist
        }
      } catch (e) {
        // Element may not exist
      }
    });

  } catch (err) {
    console.error('Failed to display similar jobs:', err);
    hideSimilarJobsSection();
  }
}

/**
 * Hide similar jobs section
 */
function hideSimilarJobsSection() {
  try {
    const section = $w('#similarJobsSection');
    if (section && section.collapse) section.collapse();
  } catch (e) {
    // Section may not exist
  }
}

// ============================================================================
// QUICK APPLY CTA
// ============================================================================

/**
 * Load and configure quick apply button
 * Element: #quickApplyBtn
 */
async function loadQuickApplyCta() {
  try {
    const quickApplyBtn = $w('#quickApplyBtn');
    if (!quickApplyBtn) return;

    const user = wixUsers.currentUser;
    const isLoggedIn = user.loggedIn;

    if (isLoggedIn) {
      // Show one-click apply for logged-in users
      quickApplyBtn.label = 'Quick Apply Now';
      quickApplyBtn.onClick(async () => {
        await handleQuickApply(currentJob?._id);
      });
    } else {
      // Show login/signup prompt for guests
      quickApplyBtn.label = 'Sign In to Quick Apply';
      quickApplyBtn.onClick(() => {
        // Store job ID for redirect after login
        if (currentJob?._id) {
          wixWindow.openLightbox('LoginSignup', {
            redirectUrl: `/rapid-response-job-description?id=${currentJob._id}`,
            action: 'apply'
          });
        } else {
          wixLocation.to('/apply-for-cdl-driving-jobs');
        }
      });
    }

    // Secondary apply button (full application)
    try {
      const fullApplyBtn = $w('#fullApplyBtn');
      if (fullApplyBtn) {
        fullApplyBtn.onClick(() => {
          wixLocation.to('/apply-for-cdl-driving-jobs');
        });
      }
    } catch (e) {
      // Element may not exist
    }

  } catch (err) {
    console.error('Failed to load quick apply CTA:', err);
  }
}

/**
 * Handle quick apply action
 */
async function handleQuickApply(jobId) {
  try {
    const user = wixUsers.currentUser;

    if (!user.loggedIn) {
      // Redirect to login
      wixWindow.openLightbox('LoginSignup', {
        redirectUrl: `/rapid-response-job-description?id=${jobId}`,
        action: 'apply'
      });
      return;
    }

    // Show loading state
    try {
      const quickApplyBtn = $w('#quickApplyBtn');
      if (quickApplyBtn) {
        quickApplyBtn.label = 'Applying...';
        quickApplyBtn.disable();
      }
    } catch (e) {
      // Element may not exist
    }

    // Get driver profile
    const userId = user.id;
    const profileResult = await wixData.query('DriverProfiles')
      .eq('_owner', userId)
      .find();

    if (profileResult.items.length === 0) {
      // No profile - redirect to profile creation
      wixLocation.to('/quick-apply-upload-your-cdl-resume');
      return;
    }

    const driverProfile = profileResult.items[0];

    // Create application/interest record
    const application = {
      driver_id: driverProfile._id,
      carrier_id: jobId,
      status: 'applied',
      applied_date: new Date(),
      source: 'rapid-response',
      match_score: 85 // Default for quick apply
    };

    await wixData.insert('DriverCarrierInterests', application);

    // Show success message
    try {
      const quickApplyBtn = $w('#quickApplyBtn');
      if (quickApplyBtn) {
        quickApplyBtn.label = 'Applied!';
      }

      const successMessage = $w('#applySuccessMessage');
      if (successMessage) {
        successMessage.show();
      }
    } catch (e) {
      // Element may not exist
    }

    // Show success lightbox or notification
    wixWindow.openLightbox('ApplicationSuccess', {
      jobTitle: currentJob?.carrierName || 'CDL Position',
      message: 'Your application has been submitted! The carrier will contact you soon.'
    }).catch(() => {
      // Lightbox may not exist - show inline success
    });

  } catch (err) {
    console.error('Quick apply failed:', err);

    // Reset button and show error
    try {
      const quickApplyBtn = $w('#quickApplyBtn');
      if (quickApplyBtn) {
        quickApplyBtn.label = 'Quick Apply Now';
        quickApplyBtn.enable();
      }
    } catch (e) {
      // Element may not exist
    }
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format pay range for display
 */
function formatPayRange(min, max) {
  if (max && min) {
    return `$${min.toFixed(2)}-${max.toFixed(2)}/mi`;
  } else if (max) {
    return `Up to $${max.toFixed(2)}/mi`;
  } else if (min) {
    return `From $${min.toFixed(2)}/mi`;
  }
  return 'Competitive pay';
}

// ============================================================================
// CLEANUP
// ============================================================================

// Clean up interval when navigating away
wixLocation.onChange(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }
});
