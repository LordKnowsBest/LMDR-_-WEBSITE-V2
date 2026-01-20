// ========== FILE 2: AI vs Traditional Recruiting Methods.z4qqg.js ==========
/**
 * AI vs Traditional Recruiting Methods Page
 * Comparison content for carrier education on modern recruitment approaches
 *
 * @see docs/PAGE_DATA_IMPLEMENTATION_GUIDE.md
 */

import { getIndustryComparison } from 'backend/contentService';
import { getCarrierPlatformStats } from 'backend/publicStatsService';
import { submitCarrierStaffingRequest } from 'backend/carrierLeadsService';

$w.onReady(async function () {
  console.log('[VELO] ✅ AI vs Traditional page onReady fired');

  // Setup form handler for embedded HTML component
  setupCarrierFormHandler();

  await Promise.all([
    loadComparisonData(),
    loadMetricsComparison(),
    loadCaseStudies(),
    loadPlatformStats()
  ]);

  // Initialize comparison chart animation after data loads
  initComparisonChart();
});

/**
 * Setup handler for carrier staffing form in HTML component
 * Tries common HTML component IDs since the form may be embedded in different components
 */
function setupCarrierFormHandler() {
  // Try common HTML component IDs - the form might be in any of these
  const possibleIds = ['#html1', '#html2', '#html3', '#html4', '#html5', '#carrierFormHtml', '#comparisonTableHtml'];

  console.log('[VELO] 🔍 Looking for HTML components to attach form handler...');

  possibleIds.forEach(htmlId => {
    try {
      const htmlComponent = $w(htmlId);
      if (htmlComponent && htmlComponent.onMessage) {
        console.log(`[VELO] ✅ Found HTML component: ${htmlId}`);

        // Listen for form ready signal and submissions
        htmlComponent.onMessage(async (event) => {
          if (!event.data || typeof event.data !== 'object') return;

          console.log(`[VELO] 📥 Message from ${htmlId}:`, event.data.type);

          // Handle form ready notification
          if (event.data.type === 'staffingFormReady') {
            console.log(`[VELO] ✅ Form in ${htmlId} is ready`);
          }

          // Handle form submission
          if (event.data.type === 'submitCarrierStaffingRequest') {
            console.log('[VELO] ─────────────────────────────────────');
            console.log('[VELO] 🚀 PROCESSING FORM SUBMISSION');
            console.log('[VELO] ─────────────────────────────────────');
            console.log('[VELO] 📋 Received data:', JSON.stringify(event.data.data, null, 2));

            try {
              console.log('[VELO] 📤 Calling submitCarrierStaffingRequest backend...');
              const result = await submitCarrierStaffingRequest(event.data.data);

              console.log('[VELO] ✅ Backend response:', result);

              // Send success back to HTML
              htmlComponent.postMessage({
                type: 'staffingRequestResult',
                success: true,
                leadId: result?.leadId || result?._id || 'unknown'
              });
              console.log('[VELO] 📤 Sent success response to form');

            } catch (error) {
              console.error('[VELO] ❌ Backend error:', error.message);
              console.error('[VELO] Full error:', error);

              // Send error back to HTML
              htmlComponent.postMessage({
                type: 'staffingRequestResult',
                success: false,
                error: error.message || 'Unknown error occurred'
              });
              console.log('[VELO] 📤 Sent error response to form');
            }
          }
        });
      }
    } catch (e) {
      // Component doesn't exist - this is expected for most IDs
      console.log(`[VELO] ℹ️ ${htmlId} not found (this is OK)`);
    }
  });
}

/**
 * Load side-by-side comparison data
 * Element: #comparisonTableHtml (HTML component)
 */
async function loadComparisonData() {
  try {
    const comparison = await getIndustryComparison('ai-vs-traditional');

    if (!comparison) {
      showDefaultComparison();
      return;
    }

    // Set page header content
    const headerElements = {
      '#comparisonTitle': comparison.title,
      '#comparisonSubtitle': comparison.subtitle,
      '#comparisonIntro': comparison.introduction
    };

    Object.entries(headerElements).forEach(([selector, value]) => {
      try {
        const element = $w(selector);
        if (element && element.text !== undefined && value) {
          element.text = value;
        }
      } catch (e) {
        // Element may not exist
      }
    });

    // Send comparison data to HTML table
    const htmlTable = $w('#comparisonTableHtml');
    if (htmlTable && htmlTable.postMessage && comparison.comparisonPoints) {
      htmlTable.postMessage({
        type: 'comparisonData',
        data: {
          headers: ['Factor', 'Traditional Recruiting', 'AI-Powered (LMDR)'],
          rows: comparison.comparisonPoints.map(point => ({
            factor: point.factor,
            traditional: point.traditional,
            aiPowered: point.aiPowered,
            advantage: point.advantage || 'ai'
          }))
        }
      });
    }

  } catch (err) {
    console.error('Failed to load comparison data:', err);
    showDefaultComparison();
  }
}

/**
 * Show default comparison when no collection data exists
 */
function showDefaultComparison() {
  const defaults = {
    '#comparisonTitle': 'AI vs Traditional Recruiting Methods',
    '#comparisonSubtitle': 'Why Modern Carriers Choose AI-Powered Driver Matching',
    '#comparisonIntro': 'Compare traditional driver recruitment methods with AI-powered matching to understand how technology transforms hiring outcomes.'
  };

  Object.entries(defaults).forEach(([selector, value]) => {
    try {
      const element = $w(selector);
      if (element && element.text !== undefined) {
        element.text = value;
      }
    } catch (e) {
      // Element may not exist
    }
  });

  // Default comparison data
  const defaultData = {
    headers: ['Factor', 'Traditional Recruiting', 'AI-Powered (LMDR)'],
    rows: [
      { factor: 'Time to Hire', traditional: '2-4 weeks', aiPowered: '48 hours', advantage: 'ai' },
      { factor: 'Cost per Hire', traditional: '$5,000-$8,000', aiPowered: '$299-$599', advantage: 'ai' },
      { factor: 'Match Accuracy', traditional: '40-50%', aiPowered: '85%+', advantage: 'ai' },
      { factor: 'Retention Rate', traditional: '60-70%', aiPowered: '85%+', advantage: 'ai' },
      { factor: 'Screening Process', traditional: 'Manual review', aiPowered: 'AI-verified profiles', advantage: 'ai' }
    ]
  };

  try {
    const htmlTable = $w('#comparisonTableHtml');
    if (htmlTable && htmlTable.postMessage) {
      htmlTable.postMessage({ type: 'comparisonData', data: defaultData });
    }
  } catch (e) {
    // HTML component may not exist
  }
}

/**
 * Load metrics comparison (time, cost, quality)
 * Element: #metricsRepeater
 */
async function loadMetricsComparison() {
  try {
    const comparison = await getIndustryComparison('ai-vs-traditional');

    if (!comparison || !comparison.metrics || comparison.metrics.length === 0) {
      showDefaultMetrics();
      return;
    }

    const repeater = $w('#metricsRepeater');
    if (repeater && repeater.data !== undefined) {
      repeater.data = comparison.metrics.map((metric, index) => ({
        _id: metric._id || `metric-${index}`,
        label: metric.label,
        traditionalValue: metric.traditionalValue,
        aiValue: metric.aiValue,
        improvement: metric.improvement,
        iconUrl: metric.iconUrl,
        description: metric.description
      }));

      repeater.onItemReady(($item, itemData) => {
        try {
          if ($item('#metricLabel')) $item('#metricLabel').text = itemData.label;
          if ($item('#traditionalValue')) $item('#traditionalValue').text = itemData.traditionalValue;
          if ($item('#aiValue')) $item('#aiValue').text = itemData.aiValue;
          if ($item('#improvementBadge')) $item('#improvementBadge').text = itemData.improvement;
          if ($item('#metricDescription')) $item('#metricDescription').text = itemData.description;
          if ($item('#metricIcon') && itemData.iconUrl) {
            $item('#metricIcon').src = itemData.iconUrl;
          }
        } catch (e) {
          // Element may not exist
        }
      });
    }

  } catch (err) {
    console.error('Failed to load metrics comparison:', err);
    showDefaultMetrics();
  }
}

/**
 * Show default metrics when no data available
 */
function showDefaultMetrics() {
  const defaultMetrics = [
    { label: 'Time to Hire', traditionalValue: '21 days', aiValue: '2 days', improvement: '90% faster' },
    { label: 'Cost per Hire', traditionalValue: '$6,500', aiValue: '$399', improvement: '94% savings' },
    { label: 'First-Year Retention', traditionalValue: '65%', aiValue: '87%', improvement: '+22 points' }
  ];

  try {
    const repeater = $w('#metricsRepeater');
    if (repeater && repeater.data !== undefined) {
      repeater.data = defaultMetrics.map((m, i) => ({ _id: `metric-${i}`, ...m }));
    }
  } catch (e) {
    // Repeater may not exist
  }
}

/**
 * Load case studies / success stories
 * Element: #caseStudiesRepeater
 */
async function loadCaseStudies() {
  try {
    const comparison = await getIndustryComparison('ai-vs-traditional');

    if (!comparison || !comparison.caseStudies || comparison.caseStudies.length === 0) {
      try {
        const section = $w('#caseStudiesSection');
        if (section && section.collapse) section.collapse();
      } catch (e) {
        // Section may not exist
      }
      return;
    }

    const repeater = $w('#caseStudiesRepeater');
    if (repeater && repeater.data !== undefined) {
      repeater.data = comparison.caseStudies.map(study => ({
        _id: study._id || study.companyName,
        companyName: study.companyName,
        fleetSize: study.fleetSize,
        logoUrl: study.logoUrl,
        challenge: study.challenge,
        solution: study.solution,
        results: study.results,
        quote: study.testimonialQuote,
        author: study.testimonialAuthor,
        authorTitle: study.testimonialTitle
      }));

      repeater.onItemReady(($item, itemData) => {
        try {
          if ($item('#csCompany')) $item('#csCompany').text = itemData.companyName;
          if ($item('#csFleetSize')) $item('#csFleetSize').text = `Fleet: ${itemData.fleetSize} trucks`;
          if ($item('#csChallenge')) $item('#csChallenge').text = itemData.challenge;
          if ($item('#csSolution')) $item('#csSolution').text = itemData.solution;
          if ($item('#csResults')) $item('#csResults').text = itemData.results;
          if ($item('#csQuote')) $item('#csQuote').text = `"${itemData.quote}"`;
          if ($item('#csAuthor')) $item('#csAuthor').text = `- ${itemData.author}, ${itemData.authorTitle}`;
          if ($item('#csLogo') && itemData.logoUrl) {
            $item('#csLogo').src = itemData.logoUrl;
          }
        } catch (e) {
          // Element may not exist
        }
      });
    }

  } catch (err) {
    console.error('Failed to load case studies:', err);
    try {
      const section = $w('#caseStudiesSection');
      if (section && section.collapse) section.collapse();
    } catch (e) {
      // Section may not exist
    }
  }
}

/**
 * Load live LMDR platform statistics
 * Element: #platformStats
 */
async function loadPlatformStats() {
  try {
    const stats = await getCarrierPlatformStats();

    if (!stats) {
      showDefaultPlatformStats();
      return;
    }

    const statElements = {
      '#statQualifiedDrivers': formatNumber(stats.qualifiedDrivers),
      '#statAvgTimeToHire': `${stats.avgDaysToHire} days`,
      '#statRetentionRate': `${stats.retentionRate}%`,
      '#statMatchAccuracy': `${stats.matchAccuracy || 85}%`,
      '#statCarriersServed': formatNumber(stats.carriersServed),
      '#statCostSavings': stats.avgCostSavings ? `$${formatNumber(stats.avgCostSavings)}` : '$5,000+'
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
    showDefaultPlatformStats();
  }
}

/**
 * Show default platform stats
 */
function showDefaultPlatformStats() {
  const defaults = {
    '#statQualifiedDrivers': '10,000+',
    '#statAvgTimeToHire': '2 days',
    '#statRetentionRate': '85%',
    '#statMatchAccuracy': '87%',
    '#statCarriersServed': '500+',
    '#statCostSavings': '$5,000+'
  };

  Object.entries(defaults).forEach(([selector, value]) => {
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
 * Initialize animated comparison chart
 * Element: #comparisonChartHtml (HTML component)
 */
function initComparisonChart() {
  try {
    const chartHtml = $w('#comparisonChartHtml');
    if (chartHtml && chartHtml.postMessage) {
      chartHtml.postMessage({
        type: 'initChart',
        data: {
          animate: true,
          categories: ['Time to Hire', 'Cost per Hire', 'Retention Rate', 'Match Quality'],
          traditional: [21, 6500, 65, 45],
          aiPowered: [2, 399, 87, 85],
          colors: {
            traditional: '#8B9DC3',
            aiPowered: '#2E86AB'
          }
        }
      });
    }
  } catch (e) {
    // HTML component may not exist
  }
}

/**
 * Format number with commas
 * @param {number} num
 * @returns {string}
 */
function formatNumber(num) {
  try {
    return num.toLocaleString();
  } catch (e) {
    return String(num);
  }
}
