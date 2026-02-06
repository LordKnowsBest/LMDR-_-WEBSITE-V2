/**
 * Home Page
 * Showcases platform credibility, live stats, and drives conversions
 * Includes carrier staffing form with PostMessage bridge
 *
 * @see docs/PAGE_DATA_IMPLEMENTATION_GUIDE.md
 */

import { getPublicStats, getFeaturedCarriers, getRecentHires } from 'backend/publicStatsService';
import { submitCarrierStaffingRequest } from 'backend/carrierLeadsService';
import wixLocation from 'wix-location';

$w.onReady(async function () {
  // Initialize carrier staffing form handler
  initCarrierStaffingForm();

  // Load platform data
  await Promise.all([
    loadPlatformStats(),
    loadFeaturedCarriers(),
    loadRecentPlacements()
  ]);
});

/**
 * Initialize carrier staffing form PostMessage handler
 * Scans multiple HTML component IDs since Wix assigns them dynamically
 */
function initCarrierStaffingForm() {
  const possibleIds = ['#html1', '#html2', '#html3', '#html4', '#html5'];

  possibleIds.forEach(id => {
    try {
      const htmlComponent = $w(id);
      if (htmlComponent && htmlComponent.onMessage) {
        console.log('[VELO] Attached carrier staffing handler to', id);

        htmlComponent.onMessage(async (event) => {
          const msg = event.data;
          if (!msg || !msg.type) return;

          console.log('[VELO] Received message:', msg.type);

          if (msg.type === 'staffingFormReady') {
            console.log('[VELO] Staffing form is ready');
          }

          if (msg.type === 'submitCarrierStaffingRequest') {
            console.log('[VELO] Processing carrier staffing request:', msg.data);

            try {
              const result = await submitCarrierStaffingRequest(msg.data);
              console.log('[VELO] Submission result:', result);

              htmlComponent.postMessage({
                type: 'staffingRequestResult',
                data: result
              });

              // Redirect to checkout
              if (result.success && result.leadId) {
                console.log('[VELO] 🔀 Redirecting to checkout...');
                setTimeout(() => {
                  wixLocation.to(`/checkout?id=${result.leadId}`);
                }, 1500);
              }
            } catch (error) {
              console.error('[VELO] Submission error:', error);
              htmlComponent.postMessage({
                type: 'staffingRequestResult',
                data: { success: false, error: error.message || 'Submission failed' }
              });
            }
          }
        });
      }
    } catch (e) {
      // Component may not exist on page - skip silently
    }
  });
}

/**
 * Load and display platform stats in hero section
 * Elements: #statDriversPlaced, #statActiveCarriers, #statAvgMatchScore, #statJobsAvailable
 */
async function loadPlatformStats() {
  try {
    const stats = await getPublicStats();

    // Update hero counters if elements exist
    const statElements = {
      '#statDriversPlaced': (stats.driversPlaced || 0).toLocaleString(),
      '#statActiveCarriers': (stats.activeCarriers || 0).toLocaleString(),
      '#statAvgMatchScore': `${stats.avgMatchScore || 0}%`,
      '#statJobsAvailable': (stats.openPositions || 0).toLocaleString()
    };

    Object.entries(statElements).forEach(([selector, value]) => {
      try {
        const element = $w(selector);
        if (element && element.text !== undefined) {
          element.text = value;
        }
      } catch (e) {
        // Element may not exist on page - skip silently
      }
    });

    // If there's an HTML stats component, send data to it
    try {
      const htmlStats = $w('#homeStatsHtml');
      if (htmlStats.rendered && htmlStats.postMessage) {
        htmlStats.postMessage({ type: 'platformStats', stats });
      }
    } catch (e) {
      // HTML component may not exist
    }

  } catch (err) {
    console.error('Failed to load platform stats:', err);
  }
}

/**
 * Load featured carriers for carousel/repeater
 * Element: #featuredCarriersRepeater
 */
async function loadFeaturedCarriers() {
  try {
    const carriers = await getFeaturedCarriers(8);

    const repeater = $w('#featuredCarriersRepeater');
    if (repeater.rendered && repeater.data !== undefined) {
      repeater.data = carriers;

      repeater.onItemReady(($item, itemData) => {
        try {
          if ($item('#carrierName').rendered) $item('#carrierName').text = itemData.name;
          if ($item('#carrierLocation').rendered) $item('#carrierLocation').text = itemData.location;
          if ($item('#carrierTagline').rendered) $item('#carrierTagline').text = itemData.tagline;
          if ($item('#carrierLogo').rendered && itemData.logo) {
            $item('#carrierLogo').src = itemData.logo;
          }
        } catch (e) {
          // Element may not exist
        }
      });
    }

    // If there's an HTML carousel component
    try {
      const htmlCarousel = $w('#featuredCarriersHtml');
      if (htmlCarousel.rendered && htmlCarousel.postMessage) {
        htmlCarousel.postMessage({ type: 'carriers', data: carriers });
      }
    } catch (e) {
      // HTML component may not exist
    }

  } catch (err) {
    console.error('Failed to load featured carriers:', err);
  }
}

/**
 * Load recent placements/hires for social proof
 * Element: #recentHiresRepeater
 */
async function loadRecentPlacements() {
  try {
    const hires = await getRecentHires(5);

    const repeater = $w('#recentHiresRepeater');
    if (repeater.rendered && repeater.data !== undefined) {
      repeater.data = hires.map((h, i) => ({
        _id: `hire-${i}`,
        ...h
      }));

      repeater.onItemReady(($item, itemData) => {
        try {
          if ($item('#hireLocation').rendered) $item('#hireLocation').text = itemData.location;
          if ($item('#hireDaysAgo').rendered) {
            $item('#hireDaysAgo').text = itemData.daysAgo === 0
              ? 'Today'
              : itemData.daysAgo === 1
                ? '1 day ago'
                : `${itemData.daysAgo} days ago`;
          }
          if ($item('#hireType').rendered) $item('#hireType').text = itemData.operationType;
        } catch (e) {
          // Element may not exist
        }
      });
    }

    // If there's an HTML ticker component
    try {
      const htmlTicker = $w('#recentHiresHtml');
      if (htmlTicker.rendered && htmlTicker.postMessage) {
        htmlTicker.postMessage({ type: 'recentHires', hires });
      }
    } catch (e) {
      // HTML component may not exist
    }

  } catch (err) {
    console.error('Failed to load recent placements:', err);
  }
}
