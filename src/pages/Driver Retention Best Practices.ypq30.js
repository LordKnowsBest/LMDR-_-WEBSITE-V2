// ========== FILE 3: Driver Retention Best Practices.ypq30.js ==========
/**
 * Driver Retention Best Practices Page
 * Educational content for carriers on improving driver retention rates
 *
 * @see docs/PAGE_DATA_IMPLEMENTATION_GUIDE.md
 */

import { getBestPracticesGuide, getFAQs } from 'backend/contentService';
import { submitCarrierStaffingRequest } from 'backend/carrierLeadsService';
import wixLocation from 'wix-location';

$w.onReady(async function () {
  console.log('[VELO] ✅ Page onReady fired');

  // Setup form handler for embedded HTML component
  setupCarrierFormHandler();

  await Promise.all([
    loadGuideContent(),
    loadRetentionStats(),
    loadActionableSteps(),
    loadDownloadableResources(),
    loadRelatedGuides()
  ]);
});

/**
 * Setup handler for carrier staffing form in HTML component
 * Tries common HTML component IDs since the form may be embedded in different components
 */
function setupCarrierFormHandler() {
  // Try common HTML component IDs - the form might be in any of these
  const possibleIds = ['#html1', '#html2', '#html3', '#html4', '#html5', '#carrierFormHtml', '#guideContent'];

  console.log('[VELO] 🔍 Looking for HTML components to attach form handler...');

  possibleIds.forEach(htmlId => {
    try {
      const htmlComponent = $w(htmlId);
      if (htmlComponent && htmlComponent.onMessage) {
        console.log(`[VELO] ✅ Found HTML component: ${htmlId}`);

        // Listen for form ready signal
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

              // Redirect to checkout
              if (result.success && result.leadId) {
                console.log('[VELO] 🔀 Redirecting to checkout...');
                setTimeout(() => {
                  wixLocation.to(`/checkout?id=${result.leadId}`);
                }, 1500);
              }

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
 * Load main guide content sections
 * Element: #guideContent
 */
async function loadGuideContent() {
  try {
    const guide = await getBestPracticesGuide('driver-retention');

    if (!guide) {
      showDefaultGuideContent();
      return;
    }

    // Set header content
    const headerElements = {
      '#guideTitle': guide.title,
      '#guideSubtitle': guide.subtitle,
      '#guideIntro': guide.introduction,
      '#lastUpdated': guide.lastUpdated ? `Last updated: ${formatDate(guide.lastUpdated)}` : '',
      '#readTime': guide.readTime ? `${guide.readTime} min read` : ''
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

    // Load content sections into HTML component
    try {
      const contentHtml = $w('#guideContent');
      if (contentHtml && contentHtml.postMessage && guide.sections) {

        // Send guide content
        contentHtml.postMessage({
          type: 'guideContent',
          data: {
            sections: guide.sections.map(section => ({
              title: section.title,
              content: section.content,
              tips: section.tips || [],
              iconUrl: section.iconUrl
            }))
          }
        });


      }
    } catch (e) {
      // HTML component may not exist
    }

  } catch (err) {
    console.error('Failed to load guide content:', err);
    showDefaultGuideContent();
  }
}

/**
 * Show default guide content when no collection data exists
 */
function showDefaultGuideContent() {
  const defaults = {
    '#guideTitle': 'Driver Retention Best Practices',
    '#guideSubtitle': 'Proven Strategies to Keep Your Best Drivers',
    '#guideIntro': 'Driver turnover costs the trucking industry billions annually. Learn evidence-based strategies that top-performing carriers use to retain their drivers and build a stable, experienced fleet.'
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
 * Load industry retention statistics
 * Element: #retentionStats
 */
async function loadRetentionStats() {
  try {
    const guide = await getBestPracticesGuide('driver-retention');

    if (!guide || !guide.industryStats) {
      showDefaultRetentionStats();
      return;
    }

    const stats = guide.industryStats;
    const statElements = {
      '#statIndustryTurnover': `${stats.industryTurnover || 91}%`,
      '#statTurnoverCost': stats.turnoverCost ? `$${formatNumber(stats.turnoverCost)}` : '$12,000',
      '#statTopCarrierRetention': `${stats.topCarrierRetention || 85}%`,
      '#statDriverPriority1': stats.driverPriority1 || 'Home Time',
      '#statDriverPriority2': stats.driverPriority2 || 'Competitive Pay',
      '#statDriverPriority3': stats.driverPriority3 || 'Respect'
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

    // Send stats to HTML component for visualization
    try {
      const statsHtml = $w('#retentionStats');
      if (statsHtml && statsHtml.postMessage) {
        statsHtml.postMessage({
          type: 'retentionStats',
          data: stats
        });
      }
    } catch (e) {
      // HTML component may not exist
    }

  } catch (err) {
    console.error('Failed to load retention stats:', err);
    showDefaultRetentionStats();
  }
}

/**
 * Show default retention statistics
 */
function showDefaultRetentionStats() {
  const defaults = {
    '#statIndustryTurnover': '91%',
    '#statTurnoverCost': '$12,000',
    '#statTopCarrierRetention': '85%',
    '#statDriverPriority1': 'Home Time',
    '#statDriverPriority2': 'Competitive Pay',
    '#statDriverPriority3': 'Respect'
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
 * Load actionable steps checklist
 * Element: #stepsRepeater
 */
async function loadActionableSteps() {
  try {
    const guide = await getBestPracticesGuide('driver-retention');

    if (!guide || !guide.actionableSteps || guide.actionableSteps.length === 0) {
      showDefaultActionableSteps();
      return;
    }

    const repeater = $w('#stepsRepeater');
    if (repeater && repeater.data !== undefined) {
      repeater.data = guide.actionableSteps.map((step, index) => ({
        _id: step._id || `step-${index}`,
        stepNumber: index + 1,
        title: step.title,
        description: step.description,
        impact: step.impact,
        difficulty: step.difficulty,
        timeframe: step.timeframe,
        tips: step.tips || []
      }));

      repeater.onItemReady(($item, itemData) => {
        try {
          if ($item('#stepNumber')) $item('#stepNumber').text = String(itemData.stepNumber);
          if ($item('#stepTitle')) $item('#stepTitle').text = itemData.title;
          if ($item('#stepDescription')) $item('#stepDescription').text = itemData.description;
          if ($item('#stepImpact')) $item('#stepImpact').text = `Impact: ${itemData.impact}`;
          if ($item('#stepDifficulty')) $item('#stepDifficulty').text = `Difficulty: ${itemData.difficulty}`;
          if ($item('#stepTimeframe')) $item('#stepTimeframe').text = itemData.timeframe;
        } catch (e) {
          // Element may not exist
        }
      });
    }

  } catch (err) {
    console.error('Failed to load actionable steps:', err);
    showDefaultActionableSteps();
  }
}

/**
 * Show default actionable steps
 */
function showDefaultActionableSteps() {
  const defaultSteps = [
    { title: 'Improve Home Time Policies', description: 'Implement consistent, predictable home time schedules.', impact: 'High', difficulty: 'Medium' },
    { title: 'Competitive Pay Analysis', description: 'Conduct quarterly market pay analysis and adjust rates.', impact: 'High', difficulty: 'Medium' },
    { title: 'Driver Recognition Program', description: 'Create formal recognition for safety, tenure, and performance.', impact: 'Medium', difficulty: 'Low' },
    { title: 'Equipment Quality Standards', description: 'Maintain fleet age under 3 years and ensure reliable equipment.', impact: 'High', difficulty: 'High' },
    { title: 'Open Communication Channels', description: 'Establish regular driver feedback sessions and act on input.', impact: 'Medium', difficulty: 'Low' }
  ];

  try {
    const repeater = $w('#stepsRepeater');
    if (repeater && repeater.data !== undefined) {
      repeater.data = defaultSteps.map((step, i) => ({
        _id: `step-${i}`,
        stepNumber: i + 1,
        ...step
      }));
    }
  } catch (e) {
    // Repeater may not exist
  }
}

/**
 * Load downloadable resources (PDFs, templates)
 * Element: #resourcesRepeater
 */
async function loadDownloadableResources() {
  try {
    const guide = await getBestPracticesGuide('driver-retention');

    if (!guide || !guide.resources || guide.resources.length === 0) {
      try {
        const section = $w('#resourcesSection');
        if (section && section.collapse) section.collapse();
      } catch (e) {
        // Section may not exist
      }
      return;
    }

    const repeater = $w('#resourcesRepeater');
    if (repeater && repeater.data !== undefined) {
      repeater.data = guide.resources.map((resource, index) => ({
        _id: resource._id || `resource-${index}`,
        title: resource.title,
        description: resource.description,
        fileType: resource.fileType || 'PDF',
        fileSize: resource.fileSize,
        downloadUrl: resource.downloadUrl,
        iconUrl: resource.iconUrl
      }));

      repeater.onItemReady(($item, itemData) => {
        try {
          if ($item('#resourceTitle')) $item('#resourceTitle').text = itemData.title;
          if ($item('#resourceDescription')) $item('#resourceDescription').text = itemData.description;
          if ($item('#resourceType')) $item('#resourceType').text = itemData.fileType;
          if ($item('#resourceSize')) $item('#resourceSize').text = itemData.fileSize;
          if ($item('#resourceIcon') && itemData.iconUrl) {
            $item('#resourceIcon').src = itemData.iconUrl;
          }

          const downloadBtn = $item('#resourceDownloadBtn');
          if (downloadBtn && itemData.downloadUrl) {
            downloadBtn.link = itemData.downloadUrl;
            downloadBtn.target = '_blank';
          }
        } catch (e) {
          // Element may not exist
        }
      });
    }

  } catch (err) {
    console.error('Failed to load downloadable resources:', err);
    try {
      const section = $w('#resourcesSection');
      if (section && section.collapse) section.collapse();
    } catch (e) {
      // Section may not exist
    }
  }
}

/**
 * Load related best practices guides
 * Element: #relatedGuidesRepeater
 */
async function loadRelatedGuides() {
  try {
    // Get FAQs for this topic and related guides
    const [faqs, guide] = await Promise.all([
      getFAQs('driver-retention'),
      getBestPracticesGuide('driver-retention')
    ]);

    // Load FAQs into accordion if available
    if (faqs && faqs.length > 0) {
      try {
        const faqHtml = $w('#faqAccordionHtml');
        if (faqHtml && faqHtml.postMessage) {
          faqHtml.postMessage({
            type: 'faqData',
            data: faqs.map(faq => ({
              question: faq.question,
              answer: faq.answer
            }))
          });
        }
      } catch (e) {
        // FAQ component may not exist
      }
    }

    // Load related guides
    const relatedGuides = (guide && guide.relatedGuides) || [];

    if (relatedGuides.length === 0) {
      try {
        const section = $w('#relatedGuidesSection');
        if (section && section.collapse) section.collapse();
      } catch (e) {
        // Section may not exist
      }
      return;
    }

    const repeater = $w('#relatedGuidesRepeater');
    if (repeater && repeater.data !== undefined) {
      repeater.data = relatedGuides.slice(0, 3).map(related => ({
        _id: related._id || related.slug,
        title: related.title,
        excerpt: related.excerpt || related.description,
        thumbnailUrl: related.thumbnailUrl,
        url: related.url || `/best-practices/${related.slug}`
      }));

      repeater.onItemReady(($item, itemData) => {
        try {
          if ($item('#relatedTitle')) $item('#relatedTitle').text = itemData.title;
          if ($item('#relatedExcerpt')) $item('#relatedExcerpt').text = itemData.excerpt;
          if ($item('#relatedThumbnail') && itemData.thumbnailUrl) {
            $item('#relatedThumbnail').src = itemData.thumbnailUrl;
          }

          const guideLink = $item('#relatedLink');
          if (guideLink) {
            guideLink.onClick(() => {
              import('wix-location').then(wixLocation => {
                wixLocation.to(itemData.url);
              });
            });
          }
        } catch (e) {
          // Element may not exist
        }
      });
    }

  } catch (err) {
    console.error('Failed to load related guides:', err);
    try {
      const section = $w('#relatedGuidesSection');
      if (section && section.collapse) section.collapse();
    } catch (e) {
      // Section may not exist
    }
  }
}

/**
 * Format date for display
 * @param {Date|string} date
 * @returns {string}
 */
function formatDate(date) {
  try {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (e) {
    return '';
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
