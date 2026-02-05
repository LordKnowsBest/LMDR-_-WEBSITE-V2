/**
 * CDL Class A Driver Recruitment Page
 * Landing page targeting Class A CDL holders with professional credentials
 * Emphasizes endorsements, experience requirements, and premium pay rates
 *
 * @see docs/PAGE_DATA_IMPLEMENTATION_GUIDE.md
 */

import wixData from 'wix-data';
import wixLocation from 'wix-location';
import { getJobsByOperationType, getTopJobOpportunities, getPublicStats, getJobsByEndorsement } from 'backend/publicStatsService';

$w.onReady(async function () {
  await Promise.all([
    loadClassAJobs(),
    loadClassARequirements(),
    loadClassAPayRanges(),
    loadTrainingPrograms(),
    loadEndorsementJobs(),
    loadPlatformStats()
  ]);

  setupEventHandlers();
});

/**
 * Load Class A CDL job opportunities
 * Element: #classAJobsRepeater
 * Focus on OTR, Regional positions requiring Class A
 */
async function loadClassAJobs() {
  try {
    // Get OTR jobs (primary Class A market)
    const otrJobs = await getJobsByOperationType('OTR', 4);
    const regionalJobs = await getJobsByOperationType('Regional', 4);

    // Combine and sort by pay
    let jobs = [...otrJobs, ...regionalJobs]
      .sort((a, b) => {
        const payA = parseFloat(a.payRange?.replace(/[^0-9.]/g, '') || 0);
        const payB = parseFloat(b.payRange?.replace(/[^0-9.]/g, '') || 0);
        return payB - payA;
      })
      .slice(0, 8);

    // Fallback to top opportunities
    if (jobs.length === 0) {
      jobs = await getTopJobOpportunities(8);
    }

    const repeater = $w('#classAJobsRepeater');
    if (repeater.rendered && repeater.data !== undefined) {
      repeater.data = jobs.map(job => ({
        _id: job._id,
        carrierName: job.carrierName,
        payRange: job.payRange || 'Top CPM rates',
        location: job.location || 'Nationwide',
        operationType: job.operationType || 'OTR',
        homeTime: job.homeTime || 'Varies by route',
        benefits: job.benefits || 'Full benefits package',
        fleetSize: job.fleetSize ? `Fleet: ${job.fleetSize}+ trucks` : '',
        truckAge: job.truckAge ? `Avg truck age: ${job.truckAge} yrs` : ''
      }));

      repeater.onItemReady(($item, itemData) => {
        try {
          if ($item('#jobCarrierName').rendered) $item('#jobCarrierName').text = itemData.carrierName;
          if ($item('#jobPayRange').rendered) $item('#jobPayRange').text = itemData.payRange;
          if ($item('#jobLocation').rendered) $item('#jobLocation').text = itemData.location;
          if ($item('#jobOperationType').rendered) $item('#jobOperationType').text = itemData.operationType;
          if ($item('#jobHomeTime').rendered) $item('#jobHomeTime').text = itemData.homeTime;
          if ($item('#jobBenefits').rendered) $item('#jobBenefits').text = itemData.benefits;
          if ($item('#jobFleetSize').rendered) $item('#jobFleetSize').text = itemData.fleetSize;
          if ($item('#jobTruckAge').rendered) $item('#jobTruckAge').text = itemData.truckAge;

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
    console.error('Failed to load Class A jobs:', err);
    hideJobsSection();
  }
}

/**
 * Load Class A requirements checklist
 * Element: #requirementsChecklist
 * Displays endorsements and experience requirements
 */
async function loadClassARequirements() {
  const requirements = [
    {
      category: 'CDL Requirements',
      items: [
        { requirement: 'Valid Class A CDL', required: true, description: 'Must be current and in good standing' },
        { requirement: 'Clean MVR', required: true, description: 'No major violations in past 3 years' },
        { requirement: 'DOT Medical Card', required: true, description: 'Current DOT physical certification' },
        { requirement: 'Drug & Alcohol Clearinghouse', required: true, description: 'Must pass pre-employment screening' }
      ]
    },
    {
      category: 'Endorsements (Higher Pay)',
      items: [
        { requirement: 'Hazmat (H)', required: false, description: '+$0.05-0.10/mi premium' },
        { requirement: 'Tanker (N)', required: false, description: '+$0.03-0.08/mi premium' },
        { requirement: 'Doubles/Triples (T)', required: false, description: 'Required for some carriers' },
        { requirement: 'TWIC Card', required: false, description: 'Required for port access' }
      ]
    },
    {
      category: 'Experience Levels',
      items: [
        { requirement: 'Entry Level (0-6 months)', required: false, description: 'Training programs available' },
        { requirement: '6-12 months experience', required: false, description: 'Standard hiring requirement' },
        { requirement: '1-2 years experience', required: false, description: 'Premium routes available' },
        { requirement: '3+ years experience', required: false, description: 'Top pay tiers unlocked' }
      ]
    }
  ];

  try {
    const repeater = $w('#requirementsChecklist');
    if (repeater.rendered && repeater.data !== undefined) {
      // Flatten for repeater
      const flatItems = [];
      requirements.forEach((cat, catIndex) => {
        cat.items.forEach((item, itemIndex) => {
          flatItems.push({
            _id: `req-${catIndex}-${itemIndex}`,
            category: cat.category,
            showCategory: itemIndex === 0,
            ...item
          });
        });
      });

      repeater.data = flatItems;

      repeater.onItemReady(($item, itemData) => {
        try {
          if (itemData.showCategory && $item('#reqCategory')) {
            $item('#reqCategory').text = itemData.category;
            $item('#reqCategory').show();
          } else if ($item('#reqCategory').rendered) {
            $item('#reqCategory').hide();
          }
          if ($item('#reqName').rendered) $item('#reqName').text = itemData.requirement;
          if ($item('#reqDescription').rendered) $item('#reqDescription').text = itemData.description;
          if ($item('#reqIcon').rendered) {
            $item('#reqIcon').text = itemData.required ? 'Required' : 'Optional';
          }
        } catch (e) {
          // Element may not exist
        }
      });
    }
  } catch (err) {
    console.error('Failed to load requirements:', err);
  }
}

/**
 * Load Class A pay ranges by experience level
 * Element: #payRangeChart (HTML component for chart visualization)
 */
async function loadClassAPayRanges() {
  const payRanges = [
    {
      experienceLevel: 'New CDL Graduate',
      experienceYears: '0-6 months',
      cpmRange: { min: 0.45, max: 0.55 },
      weeklyRange: { min: 900, max: 1200 },
      annualRange: { min: 45000, max: 60000 },
      notes: 'Training programs available, may require teaming initially'
    },
    {
      experienceLevel: 'Entry Level',
      experienceYears: '6-12 months',
      cpmRange: { min: 0.50, max: 0.62 },
      weeklyRange: { min: 1100, max: 1400 },
      annualRange: { min: 55000, max: 72000 },
      notes: 'Solo driving, most carriers actively recruiting'
    },
    {
      experienceLevel: 'Experienced',
      experienceYears: '1-2 years',
      cpmRange: { min: 0.55, max: 0.70 },
      weeklyRange: { min: 1300, max: 1700 },
      annualRange: { min: 65000, max: 85000 },
      notes: 'Dedicated routes, premium freight options'
    },
    {
      experienceLevel: 'Senior Driver',
      experienceYears: '3-5 years',
      cpmRange: { min: 0.60, max: 0.80 },
      weeklyRange: { min: 1500, max: 2000 },
      annualRange: { min: 75000, max: 100000 },
      notes: 'Specialized freight, team lead opportunities'
    },
    {
      experienceLevel: 'Veteran/Specialized',
      experienceYears: '5+ years',
      cpmRange: { min: 0.70, max: 0.95 },
      weeklyRange: { min: 1800, max: 2500 },
      annualRange: { min: 90000, max: 130000 },
      notes: 'Hazmat, oversized, owner-operator opportunities'
    }
  ];

  try {
    // Send data to HTML chart component
    const htmlChart = $w('#payRangeChart');
    if (htmlChart.rendered && htmlChart.postMessage) {
      htmlChart.postMessage({
        type: 'payRangeData',
        data: payRanges
      });
    }

    // Also populate text-based repeater if exists
    const repeater = $w('#payRangeRepeater');
    if (repeater.rendered && repeater.data !== undefined) {
      repeater.data = payRanges.map((range, i) => ({
        _id: `pay-${i}`,
        level: range.experienceLevel,
        years: range.experienceYears,
        cpm: `$${range.cpmRange.min.toFixed(2)} - $${range.cpmRange.max.toFixed(2)}/mi`,
        weekly: `$${range.weeklyRange.min.toLocaleString()} - $${range.weeklyRange.max.toLocaleString()}/wk`,
        annual: `$${range.annualRange.min.toLocaleString()} - $${range.annualRange.max.toLocaleString()}/yr`,
        notes: range.notes
      }));

      repeater.onItemReady(($item, itemData) => {
        try {
          if ($item('#payLevel').rendered) $item('#payLevel').text = itemData.level;
          if ($item('#payYears').rendered) $item('#payYears').text = itemData.years;
          if ($item('#payCpm').rendered) $item('#payCpm').text = itemData.cpm;
          if ($item('#payWeekly').rendered) $item('#payWeekly').text = itemData.weekly;
          if ($item('#payAnnual').rendered) $item('#payAnnual').text = itemData.annual;
          if ($item('#payNotes').rendered) $item('#payNotes').text = itemData.notes;
        } catch (e) {
          // Element may not exist
        }
      });
    }
  } catch (err) {
    console.error('Failed to load pay ranges:', err);
  }
}

/**
 * Load CDL training programs
 * Element: #trainingRepeater
 * Shows CDL training partner information
 */
async function loadTrainingPrograms() {
  const trainingPrograms = [
    {
      name: 'Company-Sponsored CDL Training',
      duration: '3-6 weeks',
      cost: 'Free with employment contract',
      description: 'Get your CDL with no upfront cost when you commit to 12-18 months',
      features: ['No out-of-pocket expense', 'Paid training', 'Job guaranteed upon completion']
    },
    {
      name: 'Private CDL Schools',
      duration: '3-8 weeks',
      cost: '$3,000 - $8,000',
      description: 'Independent training with more carrier options after graduation',
      features: ['More flexibility', 'Choose any carrier', 'Financial aid available']
    },
    {
      name: 'Community College Programs',
      duration: '8-16 weeks',
      cost: '$1,500 - $5,000',
      description: 'Comprehensive training with additional certifications',
      features: ['FAFSA eligible', 'Extra certifications', 'Career services included']
    },
    {
      name: 'Apprenticeship Programs',
      duration: '6-12 months',
      cost: 'Paid while learning',
      description: 'Earn while you learn with structured on-the-job training',
      features: ['Earn from day one', 'Mentorship', 'Pathway to senior roles']
    }
  ];

  try {
    const repeater = $w('#trainingRepeater');
    if (repeater.rendered && repeater.data !== undefined) {
      repeater.data = trainingPrograms.map((program, i) => ({
        _id: `training-${i}`,
        ...program,
        featuresText: program.features.join(' | ')
      }));

      repeater.onItemReady(($item, itemData) => {
        try {
          if ($item('#trainingName').rendered) $item('#trainingName').text = itemData.name;
          if ($item('#trainingDuration').rendered) $item('#trainingDuration').text = itemData.duration;
          if ($item('#trainingCost').rendered) $item('#trainingCost').text = itemData.cost;
          if ($item('#trainingDescription').rendered) $item('#trainingDescription').text = itemData.description;
          if ($item('#trainingFeatures').rendered) $item('#trainingFeatures').text = itemData.featuresText;

          // Learn more button
          try {
            const learnBtn = $item('#trainingLearnMore');
            if (learnBtn.rendered) {
              learnBtn.onClick(() => {
                wixLocation.to('/cdl-training-programs');
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
    console.error('Failed to load training programs:', err);
  }
}

/**
 * Load jobs requiring specific endorsements
 * Element: #endorsementJobsRepeater
 */
async function loadEndorsementJobs() {
  try {
    const [hazmatJobs, tankerJobs] = await Promise.all([
      getJobsByEndorsement('Hazmat', 3),
      getJobsByEndorsement('Tanker', 3)
    ]);

    const endorsementJobs = [
      ...hazmatJobs.map(j => ({ ...j, endorsement: 'Hazmat' })),
      ...tankerJobs.map(j => ({ ...j, endorsement: 'Tanker' }))
    ];

    const repeater = $w('#endorsementJobsRepeater');
    if (repeater.rendered && repeater.data !== undefined && endorsementJobs.length > 0) {
      repeater.data = endorsementJobs.map(job => ({
        _id: job._id,
        carrierName: job.carrierName,
        payRange: job.payRange,
        endorsement: job.endorsement,
        location: job.location
      }));

      repeater.onItemReady(($item, itemData) => {
        try {
          if ($item('#endJobCarrier').rendered) $item('#endJobCarrier').text = itemData.carrierName;
          if ($item('#endJobPay').rendered) $item('#endJobPay').text = itemData.payRange;
          if ($item('#endJobEndorsement').rendered) $item('#endJobEndorsement').text = itemData.endorsement;
          if ($item('#endJobLocation').rendered) $item('#endJobLocation').text = itemData.location;
        } catch (e) {
          // Element may not exist
        }
      });
    }
  } catch (err) {
    console.error('Failed to load endorsement jobs:', err);
  }
}

/**
 * Load platform statistics
 */
async function loadPlatformStats() {
  try {
    const stats = await getPublicStats();

    const statElements = {
      '#statOpenPositions': stats.openPositions ? stats.openPositions.toLocaleString() : '1,000+',
      '#statActiveCarriers': stats.activeCarriers ? stats.activeCarriers.toLocaleString() : '300+',
      '#statAvgMatchScore': stats.avgMatchScore ? `${stats.avgMatchScore}%` : '87%',
      '#statDriversPlaced': stats.driversPlaced ? stats.driversPlaced.toLocaleString() : '2,500+'
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
    console.error('Failed to load platform stats:', err);
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
        wixLocation.to('/driver-opportunities?cdl=classA');
      });
    }
  } catch (e) {
    // Element may not exist
  }

  // Training info button
  try {
    const trainingBtn = $w('#trainingInfoBtn');
    if (trainingBtn.rendered) {
      trainingBtn.onClick(() => {
        wixLocation.to('/cdl-training-programs');
      });
    }
  } catch (e) {
    // Element may not exist
  }

  // Upload CDL button
  try {
    const uploadBtn = $w('#uploadCdlBtn');
    if (uploadBtn.rendered) {
      uploadBtn.onClick(() => {
        wixLocation.to('/quick-apply-upload');
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
