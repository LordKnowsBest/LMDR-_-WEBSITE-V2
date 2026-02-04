/**
 * Last Mile Delivery Driver Staffing Page
 * Landing page targeting Amazon, FedEx, UPS style delivery drivers
 * Emphasizes flexibility, local routes, and part-time opportunities
 *
 * @see docs/PAGE_DATA_IMPLEMENTATION_GUIDE.md
 */

import wixData from 'wix-data';
import wixLocation from 'wix-location';
import { getJobsByOperationType, getTopJobOpportunities, getPublicStats, getPartnerLogos } from 'backend/publicStatsService';
import { submitCarrierStaffingRequest } from 'backend/carrierLeadsService';

$w.onReady(async function () {
  // Initialize the carrier staffing form HTML component first
  initCarrierStaffingForm();

  await Promise.all([
    loadLastMileJobs(),
    loadLastMilePartners(),
    loadScheduleFlexibility(),
    loadEarningsCalculator(),
    loadPublicStats(),
    loadLocalBenefits()
  ]);

  setupEventHandlers();
});

/**
 * Load Last Mile delivery job opportunities
 * Element: #lastMileJobsRepeater
 * Filters for local delivery and last mile operations
 */
async function loadLastMileJobs() {
  try {
    // Query for Last Mile operation type first
    let jobs = await getJobsByOperationType('Last Mile', 8);

    // If not enough Last Mile jobs, also get Local operations
    if (jobs.length < 4) {
      const localJobs = await getJobsByOperationType('Local', 6);
      jobs = [...jobs, ...localJobs].slice(0, 8);
    }

    // If still no jobs, get top opportunities as fallback
    if (jobs.length === 0) {
      jobs = await getTopJobOpportunities(6);
    }

    const repeater = $w('#lastMileJobsRepeater');
    if (repeater.rendered && repeater.data !== undefined) {
      repeater.data = jobs.map(job => ({
        _id: job._id,
        carrierName: job.carrierName,
        payRange: job.payRange || 'Competitive pay',
        location: job.location || 'Multiple locations',
        homeTime: job.homeTime || 'Home Daily',
        benefits: job.benefits || 'Full benefits available',
        fleetSize: job.fleetSize ? `${job.fleetSize} trucks` : '',
        operationType: job.operationType || 'Last Mile'
      }));

      repeater.onItemReady(($item, itemData) => {
        try {
          if ($item('#jobCarrierName').rendered) $item('#jobCarrierName').text = itemData.carrierName;
          if ($item('#jobPayRange').rendered) $item('#jobPayRange').text = itemData.payRange;
          if ($item('#jobLocation').rendered) $item('#jobLocation').text = itemData.location;
          if ($item('#jobHomeTime').rendered) $item('#jobHomeTime').text = itemData.homeTime;
          if ($item('#jobBenefits').rendered) $item('#jobBenefits').text = itemData.benefits;
          if ($item('#jobFleetSize').rendered) $item('#jobFleetSize').text = itemData.fleetSize;
          if ($item('#jobOperationType').rendered) $item('#jobOperationType').text = itemData.operationType;

          // Apply button
          try {
            const applyBtn = $item('#jobApplyBtn');
            if (applyBtn.rendered) {
              applyBtn.onClick(() => {
                wixLocation.to(`/driver-jobs/${itemData._id}`);
              });
            }
          } catch (e) {
            // Element may not exist
          }
        } catch (e) {
          // Element may not exist
        }
      });
    }

  } catch (err) {
    console.error('Failed to load Last Mile jobs:', err);
    hideJobsSection();
  }
}

/**
 * Load delivery partner logos/names
 * Element: #partnersRepeater
 * Shows Amazon DSP, FedEx Ground, UPS etc style partners
 */
async function loadLastMilePartners() {
  try {
    // First try to get logos from our carriers
    const partners = await getPartnerLogos(12);

    // If we have partners with logos, use them
    if (partners.length > 0) {
      const repeater = $w('#partnersRepeater');
      if (repeater.rendered && repeater.data !== undefined) {
        repeater.data = partners.map(p => ({
          _id: p._id,
          name: p.name,
          logoUrl: p.logoUrl
        }));

        repeater.onItemReady(($item, itemData) => {
          try {
            if ($item('#partnerLogo').rendered && itemData.logoUrl) {
              $item('#partnerLogo').src = itemData.logoUrl;
              $item('#partnerLogo').alt = itemData.name;
            }
            if ($item('#partnerName').rendered) {
              $item('#partnerName').text = itemData.name;
            }
          } catch (e) {
            // Element may not exist
          }
        });
      }
    } else {
      // Show default partner types for last mile
      showDefaultPartners();
    }

  } catch (err) {
    console.error('Failed to load partners:', err);
    showDefaultPartners();
  }
}

/**
 * Show default partner categories when no logos available
 */
function showDefaultPartners() {
  const defaultPartners = [
    { name: 'Amazon DSP Partners', category: 'E-commerce Delivery' },
    { name: 'FedEx Ground Contractors', category: 'Package Delivery' },
    { name: 'UPS Freight Partners', category: 'Parcel Services' },
    { name: 'DHL Delivery Partners', category: 'Express Shipping' },
    { name: 'Local Courier Services', category: 'Same-Day Delivery' },
    { name: 'Grocery Delivery', category: 'Food & Essentials' }
  ];

  try {
    const repeater = $w('#partnersRepeater');
    if (repeater.rendered && repeater.data !== undefined) {
      repeater.data = defaultPartners.map((p, i) => ({
        _id: `default-${i}`,
        name: p.name,
        category: p.category
      }));

      repeater.onItemReady(($item, itemData) => {
        try {
          if ($item('#partnerName').rendered) $item('#partnerName').text = itemData.name;
          if ($item('#partnerCategory').rendered) $item('#partnerCategory').text = itemData.category;
        } catch (e) {
          // Element may not exist
        }
      });
    }
  } catch (e) {
    // Repeater may not exist
  }
}

/**
 * Load schedule flexibility options
 * Element: #scheduleOptions
 * Emphasizes flexible shifts and part-time opportunities
 */
async function loadScheduleFlexibility() {
  const scheduleOptions = [
    {
      title: 'Morning Routes',
      hours: '5:00 AM - 2:00 PM',
      description: 'Start early, finish with afternoon free',
      icon: 'sunrise'
    },
    {
      title: 'Afternoon Shifts',
      hours: '10:00 AM - 7:00 PM',
      description: 'Perfect for night owls',
      icon: 'sun'
    },
    {
      title: 'Weekend Routes',
      hours: 'Sat-Sun flexible',
      description: 'Part-time opportunity for extra income',
      icon: 'calendar'
    },
    {
      title: 'Full-Time Schedule',
      hours: '40+ hours/week',
      description: 'Benefits eligible with consistent routes',
      icon: 'briefcase'
    }
  ];

  try {
    const repeater = $w('#scheduleOptions');
    if (repeater.rendered && repeater.data !== undefined) {
      repeater.data = scheduleOptions.map((opt, i) => ({
        _id: `schedule-${i}`,
        ...opt
      }));

      repeater.onItemReady(($item, itemData) => {
        try {
          if ($item('#scheduleTitle').rendered) $item('#scheduleTitle').text = itemData.title;
          if ($item('#scheduleHours').rendered) $item('#scheduleHours').text = itemData.hours;
          if ($item('#scheduleDescription').rendered) $item('#scheduleDescription').text = itemData.description;
        } catch (e) {
          // Element may not exist
        }
      });
    }
  } catch (err) {
    console.error('Failed to load schedule options:', err);
  }
}

/**
 * Load earnings calculator HTML component
 * Element: #earningsCalculatorHtml
 * Interactive pay calculator for delivery drivers
 */
async function loadEarningsCalculator() {
  try {
    const htmlComponent = $w('#earningsCalculatorHtml');
    if (htmlComponent.rendered && htmlComponent.postMessage) {
      // Send calculator configuration
      htmlComponent.postMessage({
        type: 'calculatorConfig',
        data: {
          basePayPerStop: 1.75,
          basePayPerPackage: 0.25,
          hourlyRateRange: { min: 18, max: 28 },
          avgStopsPerDay: 150,
          avgPackagesPerDay: 250,
          tipEstimate: 15,
          fuelReimbursement: true
        }
      });

      // Listen for calculator results
      htmlComponent.onMessage((event) => {
        if (event.data.type === 'calculateEarnings') {
          const results = calculateDeliveryEarnings(event.data.inputs);
          htmlComponent.postMessage({
            type: 'earningsResults',
            data: results
          });
        }
      });
    }
  } catch (err) {
    console.error('Failed to initialize earnings calculator:', err);
  }
}

/**
 * Calculate delivery driver earnings
 */
function calculateDeliveryEarnings(inputs) {
  const { hoursPerWeek, stopsPerDay, daysPerWeek } = inputs;
  const hourlyRate = 22; // Average hourly rate
  const stopBonus = 0.50; // Bonus per stop over 100

  const baseWeekly = hoursPerWeek * hourlyRate;
  const stopsBonus = stopsPerDay > 100 ? (stopsPerDay - 100) * stopBonus * daysPerWeek : 0;
  const weeklyTotal = baseWeekly + stopsBonus;

  return {
    weekly: Math.round(weeklyTotal),
    monthly: Math.round(weeklyTotal * 4.33),
    yearly: Math.round(weeklyTotal * 52),
    bonusPotential: Math.round(stopsBonus)
  };
}

/**
 * Load public platform stats
 */
async function loadPublicStats() {
  try {
    const stats = await getPublicStats();

    const statElements = {
      '#statOpenPositions': stats.openPositions ? stats.openPositions.toLocaleString() : '500+',
      '#statActiveCarriers': stats.activeCarriers ? stats.activeCarriers.toLocaleString() : '200+',
      '#statDriversPlaced': stats.driversPlaced ? stats.driversPlaced.toLocaleString() : '1,000+'
    };

    Object.entries(statElements).forEach(([selector, value]) => {
      try {
        const element = $w(selector);
        if (element && element.text !== undefined) {
          element.text = value;
        }
      } catch (e) {
        // Element may not exist
      }
    });

  } catch (err) {
    console.error('Failed to load public stats:', err);
  }
}

/**
 * Load local benefits section
 * Highlights key benefits of last mile delivery
 */
async function loadLocalBenefits() {
  const benefits = [
    { title: 'Home Every Night', description: 'No overnight trips - sleep in your own bed every day' },
    { title: 'Flexible Hours', description: 'Choose shifts that work for your lifestyle' },
    { title: 'No CDL Required', description: 'Many positions only need a valid driver\'s license' },
    { title: 'Weekly Pay', description: 'Get paid every week with direct deposit' },
    { title: 'Know Your Route', description: 'Familiar neighborhoods and regular customers' },
    { title: 'Quick Start', description: 'Start working within days of applying' }
  ];

  try {
    const repeater = $w('#benefitsRepeater');
    if (repeater.rendered && repeater.data !== undefined) {
      repeater.data = benefits.map((b, i) => ({
        _id: `benefit-${i}`,
        ...b
      }));

      repeater.onItemReady(($item, itemData) => {
        try {
          if ($item('#benefitTitle').rendered) $item('#benefitTitle').text = itemData.title;
          if ($item('#benefitDescription').rendered) $item('#benefitDescription').text = itemData.description;
        } catch (e) {
          // Element may not exist
        }
      });
    }
  } catch (err) {
    console.error('Failed to load benefits:', err);
  }
}

/**
 * Setup event handlers for page interactions
 */
function setupEventHandlers() {
  // Apply Now CTA button
  try {
    const applyBtn = $w('#applyNowBtn');
    if (applyBtn.rendered) {
      applyBtn.onClick(() => {
        wixLocation.to('/quick-apply');
      });
    }
  } catch (e) {
    // Element may not exist
  }

  // Browse All Jobs button
  try {
    const browseBtn = $w('#browseJobsBtn');
    if (browseBtn.rendered) {
      browseBtn.onClick(() => {
        wixLocation.to('/driver-opportunities?type=last-mile');
      });
    }
  } catch (e) {
    // Element may not exist
  }

  // Contact form submission
  try {
    const contactForm = $w('#contactForm');
    if (contactForm.rendered) {
      contactForm.onSubmit(() => {
        if ($w('#thankYouMessage').rendered) {
          $w('#thankYouMessage').show();
        }
      });
    }
  } catch (e) {
    // Element may not exist
  }
}

/**
 * Hide jobs section if no data available
 */
function hideJobsSection() {
  try {
    const section = $w('#jobsSection');
    if (section.rendered && section.collapse) {
      section.collapse();
    }
  } catch (e) {
    // Section may not exist
  }
}

// ============================================================================
// CARRIER STAFFING FORM - PostMessage Bridge
// ============================================================================

/**
 * Initialize the carrier staffing form HTML component
 * Listens for form submissions from the embedded HTML and calls the backend service
 * Element: #carrierStaffingFormHtml (HtmlComponent containing Last Mile Delivery Driver Staffing.html)
 */
function initCarrierStaffingForm() {
  try {
    // Try to find the HTML component - it might have different IDs
    const possibleIds = ['#html4', '#carrierStaffingFormHtml', '#staffingFormHtml', '#html1', '#html2', '#htmlComponent'];
    let htmlComponent = null;

    for (const id of possibleIds) {
      try {
        const el = $w(id);
        if (el && el.onMessage) {
          htmlComponent = el;
          console.log(`[StaffingForm] Found HTML component at ${id}`);
          break;
        }
      } catch (e) {
        // Try next ID
      }
    }

    if (!htmlComponent.rendered) {
      console.log('[StaffingForm] No HTML component found - form may be standalone');
      return;
    }

    // Listen for messages from the HTML component
    htmlComponent.onMessage(async (event) => {
      const msg = event.data;

      if (!msg || !msg.type) return;

      console.log('[StaffingForm] Received message:', msg.type);

      // Handle staffing form ready notification
      if (msg.type === 'staffingFormReady') {
        console.log('[StaffingForm] Form is ready');
        return;
      }

      // Handle staffing request submission
      if (msg.type === 'submitCarrierStaffingRequest') {
        try {
          console.log('[StaffingForm] Processing submission:', msg.data);

          // Call the backend service
          const result = await submitCarrierStaffingRequest(msg.data);

          console.log('[StaffingForm] Submission result:', result);

          // Send result back to HTML component
          htmlComponent.postMessage({
            type: 'staffingRequestResult',
            data: result
          });

        } catch (error) {
          console.error('[StaffingForm] Submission error:', error);

          // Send error back to HTML component
          htmlComponent.postMessage({
            type: 'staffingRequestResult',
            data: {
              success: false,
              error: error.message || 'Submission failed. Please try again.'
            }
          });
        }
      }
    });

    console.log('[StaffingForm] Carrier staffing form bridge initialized');

  } catch (err) {
    console.error('[StaffingForm] Failed to initialize form bridge:', err);
  }
}
