/**
 * CDL Driver Recruitment Pricing Page
 * B2B pricing page for carriers showing tier comparison, ROI calculator, and FAQs
 *
 * Focus: Clear tier comparison, value proposition, FAQ accordion
 *
 * Element IDs:
 * - #pricingRepeater - Pricing tier cards
 * - #roiCalculatorHtml - HTML component for ROI calculator
 * - #comparisonTableHtml - HTML component for vs traditional recruiting
 * - #faqAccordionHtml - HTML component for FAQ accordion
 * - #pricingWidgetHtml - HTML component for pricing widget with staffing form
 *
 * @see docs/PAGE_DATA_IMPLEMENTATION_GUIDE.md
 */

import wixWindow from 'wix-window';
import wixData from 'wix-data';
import wixLocation from 'wix-location';
import wixUsers from 'wix-users';
import { getPricingTiers, getFAQs } from 'backend/contentService';
import { getCarrierPlatformStats } from 'backend/publicStatsService';
import { submitCarrierStaffingRequest } from 'backend/carrierLeadsService';
import {
  startCheckout,
  startPlacementCheckout,
  openBillingPortal,
  getFullSubscriptionStatus,
  getAllPlanInfo,
  getStripePublishableKey
} from 'backend/subscriptionService';

$w.onReady(async function () {
  console.log('CDL Driver Recruitment Pricing page initialized');

  // Initialize HTML component handlers (non-blocking)
  initPricingWidgetForm();
  initSubscriptionHandlers();

  await Promise.all([
    loadPricingTiers(),
    loadRoiCalculator(),
    loadComparisonTable(),
    loadPricingFaqs(),
    loadPlatformStats()
  ]);
});

// ============================================================================
// PRICING TIERS
// ============================================================================

/**
 * Load pricing tiers from backend
 * Element: #pricingRepeater
 */
async function loadPricingTiers() {
  try {
    const result = await getPricingTiers('carrier');

    if (!result.success || result.tiers.length === 0) {
      // Show default pricing if no data
      showDefaultPricing();
      return;
    }

    const repeater = $w('#pricingRepeater');
    if (!repeater || repeater.data === undefined) {
      // Repeater not found - update static elements
      updateStaticPricingElements(result.tiers);
      return;
    }

    repeater.data = result.tiers.map((tier, index) => ({
      _id: `tier-${index}`,
      name: tier.name,
      price: tier.price,
      priceSubtext: tier.priceSubtext,
      description: tier.description,
      features: tier.features || [],
      ctaText: tier.ctaText || 'Get Started',
      ctaLink: tier.ctaLink || '/carrier-welcome',
      isPopular: tier.isPopular,
      badgeText: tier.badgeText
    }));

    repeater.onItemReady(($item, itemData) => {
      try {
        // Basic tier info
        if ($item('#tierName')) $item('#tierName').text = itemData.name;
        if ($item('#tierPrice')) $item('#tierPrice').text = itemData.price;
        if ($item('#tierSubtext')) $item('#tierSubtext').text = itemData.priceSubtext || '';
        if ($item('#tierDescription')) $item('#tierDescription').text = itemData.description || '';

        // Popular badge
        if (itemData.isPopular) {
          try {
            const badge = $item('#popularBadge');
            if (badge) {
              if (itemData.badgeText) {
                badge.text = itemData.badgeText;
              }
              badge.show();
            }
          } catch (e) {
            // Element may not exist
          }

          // Highlight popular tier container
          try {
            const tierContainer = $item('#tierContainer');
            if (tierContainer && tierContainer.style) {
              tierContainer.style.borderColor = '#4A90D9';
              tierContainer.style.borderWidth = '3px';
            }
          } catch (e) {
            // Element may not exist
          }
        } else {
          try {
            const badge = $item('#popularBadge');
            if (badge && badge.hide) badge.hide();
          } catch (e) {
            // Element may not exist
          }
        }

        // CTA button
        try {
          const ctaBtn = $item('#tierCtaBtn');
          if (ctaBtn) {
            ctaBtn.label = itemData.ctaText;
            ctaBtn.onClick(() => {
              // Track pricing CTA click
              trackPricingClick(itemData.name);
              wixLocation.to(itemData.ctaLink);
            });
          }
        } catch (e) {
          // Element may not exist
        }

        // Features list repeater
        try {
          const featuresRepeater = $item('#tierFeaturesRepeater');
          if (featuresRepeater && itemData.features.length > 0) {
            featuresRepeater.data = itemData.features.map((feature, i) => ({
              _id: `feature-${i}`,
              text: feature
            }));

            featuresRepeater.onItemReady(($featureItem, featureData) => {
              try {
                if ($featureItem('#featureText')) {
                  $featureItem('#featureText').text = featureData.text;
                }
                // Show checkmark icon
                if ($featureItem('#featureIcon')) {
                  $featureItem('#featureIcon').show();
                }
              } catch (e) {
                // Element may not exist
              }
            });
          }
        } catch (e) {
          // Features repeater may not exist - try text list
          try {
            const featuresList = $item('#tierFeaturesList');
            if (featuresList) {
              featuresList.text = itemData.features.join('\n');
            }
          } catch (e2) {
            // Element may not exist
          }
        }

      } catch (e) {
        console.error('Error in onItemReady:', e);
      }
    });

  } catch (err) {
    console.error('Failed to load pricing tiers:', err);
    showDefaultPricing();
  }
}

/**
 * Update static pricing elements when no repeater exists
 */
function updateStaticPricingElements(tiers) {
  const tierMapping = {
    0: { price: '#basicPrice', subtext: '#basicSubtext', name: '#basicName', cta: '#basicCtaBtn' },
    1: { price: '#proPrice', subtext: '#proSubtext', name: '#proName', cta: '#proCtaBtn' },
    2: { price: '#enterprisePrice', subtext: '#enterpriseSubtext', name: '#enterpriseName', cta: '#enterpriseCtaBtn' }
  };

  tiers.forEach((tier, index) => {
    const mapping = tierMapping[index];
    if (!mapping) return;

    Object.entries(mapping).forEach(([key, selector]) => {
      try {
        const element = $w(selector);
        if (element) {
          if (key === 'price') element.text = tier.price;
          if (key === 'subtext') element.text = tier.priceSubtext || '';
          if (key === 'name') element.text = tier.name;
          if (key === 'cta' && element.onClick) {
            element.label = tier.ctaText || 'Get Started';
            element.onClick(() => {
              trackPricingClick(tier.name);
              wixLocation.to(tier.ctaLink || '/carrier-welcome');
            });
          }
        }
      } catch (e) {
        // Element may not exist
      }
    });
  });
}

/**
 * Show default pricing when no backend data available
 */
function showDefaultPricing() {
  const defaults = [
    {
      name: 'Basic',
      price: '$299',
      priceSubtext: 'per hire',
      ctaLink: '/carrier-welcome'
    },
    {
      name: 'Pro',
      price: '$199',
      priceSubtext: 'per hire (5+ hires)',
      ctaLink: '/carrier-welcome'
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      priceSubtext: 'volume pricing',
      ctaLink: '/contact'
    }
  ];

  updateStaticPricingElements(defaults);
}

/**
 * Track pricing CTA clicks for analytics
 */
function trackPricingClick(tierName) {
  try {
    // Log to console for debugging
    console.log(`Pricing CTA clicked: ${tierName}`);

    // Track in Wix analytics if available
    if (typeof wixWindow !== 'undefined' && wixWindow.trackEvent) {
      wixWindow.trackEvent('PricingClick', {
        tier: tierName,
        page: 'CDL Driver Recruitment Pricing'
      });
    }
  } catch (e) {
    // Analytics tracking failed - non-critical
  }
}

// ============================================================================
// ROI CALCULATOR
// ============================================================================

/**
 * Load ROI calculator HTML component
 * Element: #roiCalculatorHtml
 */
async function loadRoiCalculator() {
  try {
    const htmlComponent = $w('#roiCalculatorHtml');
    if (!htmlComponent || typeof htmlComponent.postMessage !== 'function') {
      return;
    }

    // Get platform stats for realistic defaults
    let stats = {
      avgDaysToHire: 14,
      avgCostPerHire: 299,
      retentionRate: 87
    };

    try {
      const platformStats = await getCarrierPlatformStats();
      stats = {
        avgDaysToHire: platformStats.avgDaysToHire || 14,
        avgCostPerHire: platformStats.avgCostPerHire || 299,
        retentionRate: platformStats.retentionRate || 87
      };
    } catch (e) {
      // Use defaults
    }

    // Traditional recruiting costs (industry benchmarks)
    const traditionalCosts = {
      avgCostPerHire: 8234, // ATA average
      avgDaysToHire: 45,
      turnoverRate: 94 // Industry average turnover %
    };

    // Send data to HTML calculator
    htmlComponent.postMessage({
      type: 'roiCalculatorData',
      lmdr: stats,
      traditional: traditionalCosts,
      savings: {
        costSavingsPerHire: traditionalCosts.avgCostPerHire - stats.avgCostPerHire,
        timeSavingsDays: traditionalCosts.avgDaysToHire - stats.avgDaysToHire,
        retentionImprovement: stats.retentionRate - (100 - traditionalCosts.turnoverRate)
      }
    });

    // Listen for calculator inputs from HTML component
    htmlComponent.onMessage((event) => {
      if (event.data && event.data.type === 'calculateROI') {
        const { driversNeeded, currentCostPerHire } = event.data;
        const roi = calculateROI(driversNeeded, currentCostPerHire, stats);
        htmlComponent.postMessage({
          type: 'roiResult',
          ...roi
        });
      }
    });

  } catch (err) {
    console.error('Failed to load ROI calculator:', err);
  }
}

/**
 * Calculate ROI based on user inputs
 */
function calculateROI(driversNeeded, currentCostPerHire, lmdrStats) {
  const currentTotalCost = driversNeeded * currentCostPerHire;
  const lmdrTotalCost = driversNeeded * lmdrStats.avgCostPerHire;
  const totalSavings = currentTotalCost - lmdrTotalCost;
  const savingsPercentage = ((currentTotalCost - lmdrTotalCost) / currentTotalCost * 100).toFixed(0);

  // Time savings value (assuming $500/day cost of vacancy)
  const timeSavingsDays = 45 - lmdrStats.avgDaysToHire;
  const vacancyCostPerDay = 500;
  const timeSavingsValue = driversNeeded * timeSavingsDays * vacancyCostPerDay;

  // Total first-year value
  const totalFirstYearValue = totalSavings + timeSavingsValue;

  return {
    currentTotalCost,
    lmdrTotalCost,
    directSavings: totalSavings,
    savingsPercentage: parseInt(savingsPercentage),
    timeSavingsDays: timeSavingsDays * driversNeeded,
    timeSavingsValue,
    totalFirstYearValue,
    roiPercentage: Math.round((totalFirstYearValue / lmdrTotalCost) * 100)
  };
}

// ============================================================================
// COMPARISON TABLE
// ============================================================================

/**
 * Load comparison table (LMDR vs Traditional Recruiting)
 * Element: #comparisonTableHtml
 */
async function loadComparisonTable() {
  try {
    const htmlComponent = $w('#comparisonTableHtml');
    if (!htmlComponent || typeof htmlComponent.postMessage !== 'function') {
      return;
    }

    // Comparison data
    const comparisonData = {
      categories: [
        {
          name: 'Cost',
          items: [
            { metric: 'Average Cost per Hire', traditional: '$8,234', lmdr: '$299', advantage: 'lmdr' },
            { metric: 'Hidden Fees', traditional: 'Common', lmdr: 'None', advantage: 'lmdr' },
            { metric: 'Upfront Payment', traditional: 'Often Required', lmdr: 'Pay on Success', advantage: 'lmdr' }
          ]
        },
        {
          name: 'Speed',
          items: [
            { metric: 'Time to First Candidate', traditional: '7-14 days', lmdr: '24-48 hours', advantage: 'lmdr' },
            { metric: 'Average Time to Hire', traditional: '45+ days', lmdr: '7-14 days', advantage: 'lmdr' },
            { metric: 'Application Processing', traditional: 'Manual', lmdr: 'AI-Powered', advantage: 'lmdr' }
          ]
        },
        {
          name: 'Quality',
          items: [
            { metric: 'Pre-Screening', traditional: 'Basic', lmdr: 'AI + FMCSA Verified', advantage: 'lmdr' },
            { metric: 'Match Accuracy', traditional: 'Low', lmdr: '85%+', advantage: 'lmdr' },
            { metric: 'Driver Retention', traditional: 'Variable', lmdr: '87%+ at 90 days', advantage: 'lmdr' }
          ]
        },
        {
          name: 'Support',
          items: [
            { metric: 'Account Management', traditional: 'Limited', lmdr: 'Dedicated (Pro+)', advantage: 'lmdr' },
            { metric: 'Analytics Dashboard', traditional: 'Rarely', lmdr: 'Real-time', advantage: 'lmdr' },
            { metric: 'Compliance Support', traditional: 'Extra Cost', lmdr: 'Included', advantage: 'lmdr' }
          ]
        }
      ]
    };

    // Send comparison data to HTML component
    htmlComponent.postMessage({
      type: 'comparisonData',
      data: comparisonData
    });

  } catch (err) {
    console.error('Failed to load comparison table:', err);
  }
}

// ============================================================================
// PRICING FAQs
// ============================================================================

/**
 * Load pricing FAQs
 * Element: #faqAccordionHtml
 */
async function loadPricingFaqs() {
  try {
    const result = await getFAQs('pricing');

    let faqs = [];

    if (result.success && result.faqs.length > 0) {
      faqs = result.faqs;
    } else {
      // Default FAQs if none in database
      faqs = getDefaultPricingFaqs();
    }

    // Send to HTML accordion component
    try {
      const htmlComponent = $w('#faqAccordionHtml');
      if (htmlComponent && typeof htmlComponent.postMessage === 'function') {
        htmlComponent.postMessage({
          type: 'faqData',
          data: faqs
        });
      }
    } catch (e) {
      // HTML component may not exist
    }

    // Also try native Wix repeater
    try {
      const faqRepeater = $w('#faqRepeater');
      if (faqRepeater && faqRepeater.data !== undefined) {
        faqRepeater.data = faqs.map((faq, index) => ({
          _id: `faq-${index}`,
          question: faq.question,
          answer: faq.answer,
          isOpen: false
        }));

        faqRepeater.onItemReady(($item, itemData) => {
          try {
            if ($item('#faqQuestion')) $item('#faqQuestion').text = itemData.question;
            if ($item('#faqAnswer')) {
              $item('#faqAnswer').text = itemData.answer;
              $item('#faqAnswer').collapse();
            }

            // Toggle FAQ accordion
            const toggleBtn = $item('#faqToggleBtn') || $item('#faqQuestion');
            if (toggleBtn && toggleBtn.onClick) {
              toggleBtn.onClick(() => {
                try {
                  const answer = $item('#faqAnswer');
                  if (answer) {
                    if (answer.collapsed) {
                      answer.expand();
                    } else {
                      answer.collapse();
                    }
                  }
                } catch (e) {
                  // Toggle failed
                }
              });
            }
          } catch (e) {
            // Element may not exist
          }
        });
      }
    } catch (e) {
      // FAQ repeater may not exist
    }

  } catch (err) {
    console.error('Failed to load pricing FAQs:', err);
  }
}

/**
 * Get default pricing FAQs
 */
function getDefaultPricingFaqs() {
  return [
    {
      question: 'What is included in the per-hire fee?',
      answer: 'Our per-hire fee includes AI-powered matching, FMCSA verification, pre-screening, and placement support. There are no hidden fees or recurring charges.'
    },
    {
      question: 'When do I pay?',
      answer: 'You only pay when you successfully hire a driver through our platform. No upfront costs, no monthly fees, no risk.'
    },
    {
      question: 'What is your guarantee?',
      answer: 'We offer a 48-hour guarantee on driver placements. If a driver does not show up or leaves within the first 48 hours, we will find you a replacement at no additional cost.'
    },
    {
      question: 'How do volume discounts work?',
      answer: 'Our Pro tier offers discounted per-hire pricing for carriers hiring 5 or more drivers. Enterprise clients receive custom volume pricing based on their specific needs.'
    },
    {
      question: 'Can I try LMDR before committing?',
      answer: 'Yes! We offer a risk-free first hire at standard pricing. If you are not satisfied with our service, we will refund your fee - no questions asked.'
    },
    {
      question: 'How fast can I get candidates?',
      answer: 'Most carriers receive their first qualified candidates within 24-48 hours of posting. Our AI matching system works around the clock to find the best fits.'
    },
    {
      question: 'Do you verify driver credentials?',
      answer: 'Yes, all drivers are verified through FMCSA databases, including CDL status, medical certification, and safety history. We also perform AI-powered background analysis.'
    },
    {
      question: 'What support do I get with each tier?',
      answer: 'Basic includes email support and self-service tools. Pro adds priority matching and phone support. Enterprise includes a dedicated account manager and custom integrations.'
    }
  ];
}

// ============================================================================
// PLATFORM STATS
// ============================================================================

/**
 * Load platform stats for credibility
 */
async function loadPlatformStats() {
  try {
    const stats = await getCarrierPlatformStats();

    const statElements = {
      '#statQualifiedDrivers': stats.qualifiedDrivers.toLocaleString(),
      '#statAvgTimeToHire': `${stats.avgDaysToHire} days`,
      '#statRetentionRate': `${stats.retentionRate}%`,
      '#statAvgCostPerHire': `$${stats.avgCostPerHire}`
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

// ============================================================================
// CTA HANDLERS
// ============================================================================

// Set up global CTA buttons
$w.onReady(() => {
  // Get Started CTA
  try {
    const getStartedBtn = $w('#getStartedBtn');
    if (getStartedBtn) {
      getStartedBtn.onClick(() => {
        trackPricingClick('Get Started Hero');
        wixLocation.to('/carrier-welcome');
      });
    }
  } catch (e) {
    // Element may not exist
  }

  // Contact Sales CTA
  try {
    const contactSalesBtn = $w('#contactSalesBtn');
    if (contactSalesBtn) {
      contactSalesBtn.onClick(() => {
        trackPricingClick('Contact Sales');
        wixLocation.to('/contact');
      });
    }
  } catch (e) {
    // Element may not exist
  }

  // Schedule Demo CTA
  try {
    const scheduleDemoBtn = $w('#scheduleDemoBtn');
    if (scheduleDemoBtn) {
      scheduleDemoBtn.onClick(() => {
        trackPricingClick('Schedule Demo');
        wixLocation.to('/schedule-demo');
      });
    }
  } catch (e) {
    // Element may not exist
  }
});

// ============================================================================
// PRICING WIDGET FORM HANDLER
// ============================================================================

/**
 * Initialize the pricing widget HTML component form handler
 * Handles carrier staffing form submissions from the embedded HTML component
 * Element: #pricingWidgetHtml (or #html1 depending on Wix editor setup)
 */
function initPricingWidgetForm() {
  // Try multiple possible HTML component IDs
  const possibleIds = ['#pricingWidgetHtml', '#html1', '#html2', '#html3', '#html4', '#html5', '#htmlComponent'];
  let htmlComponent = null;

  for (const id of possibleIds) {
    try {
      const component = $w(id);
      if (component && typeof component.onMessage === 'function') {
        htmlComponent = component;
        console.log(`Pricing widget form handler attached to ${id}`);
        break;
      }
    } catch (e) {
      // Component doesn't exist, try next
    }
  }

  if (!htmlComponent) {
    console.log('No HTML component found for pricing widget form');
    return;
  }

  // Listen for messages from the HTML component
  htmlComponent.onMessage(async (event) => {
    const msg = event.data;
    if (!msg || !msg.type) return;

    console.log('Pricing widget received message:', msg.type);

    // Handle staffing form submission
    if (msg.type === 'submitCarrierStaffingRequest') {
      try {
        console.log('Processing staffing request:', msg.data);
        const result = await submitCarrierStaffingRequest(msg.data);
        console.log('Staffing request result:', result);

        // Send result back to HTML component
        htmlComponent.postMessage({
          type: 'staffingRequestResult',
          data: result
        });

        // Track successful submission
        if (result.success) {
          trackPricingClick('Staffing Form Submitted');
        }
      } catch (error) {
        console.error('Error submitting staffing request:', error);
        htmlComponent.postMessage({
          type: 'staffingRequestResult',
          data: {
            success: false,
            error: 'There was an error processing your request. Please try again.'
          }
        });
      }
    }

    // Handle ROI calculator inputs (for analytics)
    if (msg.type === 'calculateROI') {
      console.log('ROI calculation:', msg);
      // Could track ROI calculator usage here
    }

    // Handle component ready signals
    if (msg.type === 'staffingFormReady') {
      console.log('Staffing form component is ready');
    }

    if (msg.type === 'roiCalculatorReady') {
      console.log('ROI calculator component is ready');
    }

    if (msg.type === 'comparisonTableReady') {
      console.log('Comparison table component is ready');
    }
  });
}

// ============================================================================
// STRIPE SUBSCRIPTION HANDLERS
// ============================================================================

/**
 * Initialize Stripe subscription handlers for pricing page
 * Handles checkout, portal access, and subscription status requests
 * Works with Recruiter_Pricing.html component
 */
function initSubscriptionHandlers() {
  // Try multiple possible HTML component IDs
  const possibleIds = ['#pricingWidgetHtml', '#html1', '#html2', '#html3', '#html4', '#html5', '#htmlComponent', '#recruiterPricingHtml'];
  let htmlComponent = null;

  for (const id of possibleIds) {
    try {
      const component = $w(id);
      if (component && typeof component.onMessage === 'function') {
        htmlComponent = component;
        console.log(`Subscription handler attached to ${id}`);
        break;
      }
    } catch (e) {
      // Component doesn't exist, try next
    }
  }

  if (!htmlComponent) {
    console.log('No HTML component found for subscription handlers');
    return;
  }

  // Listen for subscription-related messages
  htmlComponent.onMessage(async (event) => {
    const msg = event.data;
    if (!msg || !msg.type) return;

    console.log('Subscription handler received message:', msg.type);

    // Handle pricing page data request
    if (msg.type === 'getPricingPageData') {
      try {
        const currentUser = wixUsers.currentUser;
        const isLoggedIn = currentUser.loggedIn;

        let subscriptionStatus = null;
        let carrierDot = null;
        let userEmail = null;

        if (isLoggedIn) {
          userEmail = await currentUser.getEmail();

          // Try to get carrier DOT from user's profile or linked carrier
          try {
            const userDetails = await wixData.query('Members/PrivateMembersData')
              .eq('loginEmail', userEmail)
              .find({ suppressAuth: true });

            if (userDetails.items.length > 0) {
              carrierDot = userDetails.items[0].carrierDot || userDetails.items[0].dotNumber;
            }
          } catch (e) {
            console.log('Could not fetch carrier DOT from profile');
          }

          // If we have a carrier DOT, get subscription status
          if (carrierDot) {
            subscriptionStatus = await getFullSubscriptionStatus(carrierDot);
          }
        }

        // Get plan info (must await - Wix returns Promise for all backend calls)
        const planInfo = await getAllPlanInfo();

        // Send data back to HTML component
        htmlComponent.postMessage({
          type: 'pricingPageData',
          data: {
            isLoggedIn,
            userEmail,
            carrierDot,
            currentPlan: subscriptionStatus?.planType || 'free',
            subscriptionStatus: subscriptionStatus?.status || null,
            quota: subscriptionStatus?.quota || null,
            planInfo
          }
        });

      } catch (error) {
        console.error('Error getting pricing page data:', error);
        // Get plan info with fallback (must await backend calls)
        let fallbackPlanInfo = {};
        try {
          fallbackPlanInfo = await getAllPlanInfo();
        } catch (e) {
          console.error('Failed to get plan info:', e);
        }
        htmlComponent.postMessage({
          type: 'pricingPageData',
          data: {
            isLoggedIn: false,
            currentPlan: 'free',
            planInfo: fallbackPlanInfo,
            error: 'Failed to load subscription data'
          }
        });
      }
    }

    // Handle checkout initiation
    if (msg.type === 'startCheckout') {
      try {
        const { plan, email, carrierDot, billingPeriod } = msg.data;

        if (!carrierDot) {
          htmlComponent.postMessage({
            type: 'checkoutError',
            data: { error: 'Please complete your carrier profile first' }
          });
          return;
        }

        console.log(`Starting checkout for ${plan} plan (${billingPeriod || 'monthly'}), carrier: ${carrierDot}`);

        // Start Stripe checkout session with billing period
        const result = await startCheckout(
          carrierDot,
          plan,
          email,
          `${wixLocation.baseUrl}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
          `${wixLocation.baseUrl}/subscription-canceled`,
          billingPeriod || 'monthly'
        );

        if (result.success && result.checkoutUrl) {
          // Send URL to HTML component for redirect (same approach as placement)
          htmlComponent.postMessage({
            type: 'redirectToCheckout',
            data: { checkoutUrl: result.checkoutUrl }
          });
        } else {
          htmlComponent.postMessage({
            type: 'checkoutError',
            data: { error: result.error || 'Failed to create checkout session' }
          });
        }

      } catch (error) {
        console.error('Checkout error:', error);
        htmlComponent.postMessage({
          type: 'checkoutError',
          data: { error: 'An error occurred. Please try again.' }
        });
      }
    }

    // Handle billing portal request
    if (msg.type === 'openBillingPortal') {
      try {
        const { carrierDot } = msg.data;

        if (!carrierDot) {
          htmlComponent.postMessage({
            type: 'portalError',
            data: { error: 'Carrier information not found' }
          });
          return;
        }

        console.log(`Opening billing portal for carrier: ${carrierDot}`);

        const result = await openBillingPortal(
          carrierDot,
          `${wixLocation.baseUrl}/recruiter-console`
        );

        if (result.success && result.portalUrl) {
          // Redirect to Stripe Customer Portal
          wixLocation.to(result.portalUrl);
        } else {
          htmlComponent.postMessage({
            type: 'portalError',
            data: { error: result.error || 'Failed to open billing portal' }
          });
        }

      } catch (error) {
        console.error('Billing portal error:', error);
        htmlComponent.postMessage({
          type: 'portalError',
          data: { error: 'An error occurred. Please try again.' }
        });
      }
    }

    // Handle placement deposit checkout (Full Service / VelocityMatch)
    // NOTE: This flow does NOT require login - uses form data directly
    if (msg.type === 'startPlacementCheckout') {
      try {
        const { email, carrierDot, driverCount, formData } = msg.data;

        // Use email from formData if not provided directly
        const checkoutEmail = email || formData?.email;

        if (!checkoutEmail) {
          htmlComponent.postMessage({
            type: 'checkoutResult',
            data: { success: false, error: 'Please provide your email address' }
          });
          return;
        }

        if (!driverCount || driverCount < 1) {
          htmlComponent.postMessage({
            type: 'checkoutResult',
            data: { success: false, error: 'Please select number of drivers' }
          });
          return;
        }

        // carrierDot is optional for placement - use DOT from form or placeholder
        const checkoutDot = carrierDot || formData?.dotNumber || 'PENDING';

        console.log(`Starting placement checkout for ${driverCount} drivers, email: ${checkoutEmail}, DOT: ${checkoutDot}`);

        // Start Stripe checkout session for placement deposit
        const result = await startPlacementCheckout(
          checkoutDot,
          checkoutEmail,
          driverCount,
          formData || {},
          `${wixLocation.baseUrl}/placement-success?session_id={CHECKOUT_SESSION_ID}`,
          `${wixLocation.baseUrl}/pricing`
        );

        if (result.success && result.checkoutUrl) {
          // Send URL to HTML component for redirect (more reliable than wixLocation.to for external URLs)
          htmlComponent.postMessage({
            type: 'redirectToCheckout',
            data: { checkoutUrl: result.checkoutUrl }
          });
        } else {
          htmlComponent.postMessage({
            type: 'checkoutResult',
            data: { success: false, error: result.error || 'Failed to create checkout session' }
          });
        }

      } catch (error) {
        console.error('Placement checkout error:', error);
        htmlComponent.postMessage({
          type: 'checkoutResult',
          data: { success: false, error: 'An error occurred. Please try again.' }
        });
      }
    }

    // Handle login requirement
    if (msg.type === 'requireLogin') {
      console.log('User needs to log in for subscription');
      // Redirect to login page with return URL
      wixLocation.to(`/login?returnUrl=${encodeURIComponent(wixLocation.url)}`);
    }
  });
}
