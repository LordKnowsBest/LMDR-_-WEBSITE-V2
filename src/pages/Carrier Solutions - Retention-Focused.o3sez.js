/**
 * Carrier Solutions Page
 * Showcase carrier services, pricing tiers, and success stories for B2B conversion
 *
 * @see docs/PAGE_DATA_IMPLEMENTATION_GUIDE.md
 */

import wixData from 'wix-data';
import wixLocation from 'wix-location';
import { getCarrierPlatformStats } from 'backend/publicStatsService';

$w.onReady(async function () {
  await Promise.all([
    loadPricingTiers(),
    loadServiceFeatures(),
    loadCaseStudies(),
    loadFAQs(),
    loadPlatformStats()
  ]);
});

/**
 * Load pricing tiers for display
 * Element: #pricingRepeater
 * Collection: PricingTiers (if exists)
 */
async function loadPricingTiers() {
  try {
    const result = await wixData.query('PricingTiers')
      .eq('is_active', true)
      .eq('customer_type', 'carrier')
      .ascending('display_order')
      .find();

    if (result.items.length === 0) {
      // Show default pricing if no collection data
      showDefaultPricing();
      return;
    }

    const repeater = $w('#pricingRepeater');
    if (repeater && repeater.data !== undefined) {
      repeater.data = result.items.map(tier => ({
        _id: tier._id,
        name: tier.tier_name,
        price: tier.price_display,
        priceSubtext: tier.price_subtext,
        description: tier.description,
        features: tier.features || [],
        ctaText: tier.cta_text || 'Get Started',
        ctaLink: tier.cta_link || '/carrier-welcome',
        isPopular: tier.is_popular,
        badgeText: tier.badge_text
      }));

      repeater.onItemReady(($item, itemData) => {
        try {
          if ($item('#tierName')) $item('#tierName').text = itemData.name;
          if ($item('#tierPrice')) $item('#tierPrice').text = itemData.price;
          if ($item('#tierSubtext')) $item('#tierSubtext').text = itemData.priceSubtext;
          if ($item('#tierDescription')) $item('#tierDescription').text = itemData.description;

          // Popular badge
          if (itemData.isPopular && itemData.badgeText) {
            try {
              const badge = $item('#popularBadge');
              if (badge) {
                badge.text = itemData.badgeText;
                badge.show();
              }
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
                wixLocation.to(itemData.ctaLink);
              });
            }
          } catch (e) {
            // Element may not exist
          }

          // Features list
          try {
            const featuresRepeater = $item('#tierFeaturesRepeater');
            if (featuresRepeater && itemData.features.length > 0) {
              featuresRepeater.data = itemData.features.map((f, i) => ({
                _id: `feature-${i}`,
                text: f
              }));
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
    // Collection may not exist yet - show default pricing
    console.log('PricingTiers collection not found');
    showDefaultPricing();
  }
}

/**
 * Show default pricing when no collection data exists
 */
function showDefaultPricing() {
  // Update static elements with default values
  const defaults = {
    '#basicPrice': '$299',
    '#basicSubtext': 'per hire',
    '#proPrice': '$199',
    '#proSubtext': 'per hire (5+ hires)',
    '#enterprisePrice': 'Custom',
    '#enterpriseSubtext': 'volume pricing'
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
 * Load service features for comparison matrix
 * Element: #featureMatrixHtml (HTML component)
 * Collection: ServiceFeatures (if exists)
 */
async function loadServiceFeatures() {
  try {
    const result = await wixData.query('ServiceFeatures')
      .eq('is_active', true)
      .ascending('category_order')
      .ascending('feature_order')
      .find();

    if (result.items.length === 0) {
      // Hide feature matrix if no data
      try {
        const section = $w('#featureMatrixSection');
        if (section && section.collapse) section.collapse();
      } catch (e) {
        // Section may not exist
      }
      return;
    }

    // Group by category
    const grouped = result.items.reduce((acc, feature) => {
      if (!acc[feature.category]) {
        acc[feature.category] = [];
      }
      acc[feature.category].push({
        name: feature.feature_name,
        description: feature.description,
        basic: feature.tier_basic,
        pro: feature.tier_pro,
        enterprise: feature.tier_enterprise
      });
      return acc;
    }, {});

    // Send to HTML comparison table
    try {
      const htmlMatrix = $w('#featureMatrixHtml');
      if (htmlMatrix && htmlMatrix.postMessage) {
        htmlMatrix.postMessage({
          type: 'featureMatrix',
          data: grouped
        });
      }
    } catch (e) {
      // HTML component may not exist
    }

  } catch (err) {
    // Collection may not exist yet
    console.log('ServiceFeatures collection not found');
  }
}

/**
 * Load case studies / success stories
 * Element: #caseStudiesRepeater
 * Collection: CaseStudies (if exists)
 */
async function loadCaseStudies() {
  try {
    const result = await wixData.query('CaseStudies')
      .eq('is_published', true)
      .eq('customer_type', 'carrier')
      .descending('published_date')
      .limit(3)
      .find();

    if (result.items.length === 0) {
      // Hide case studies section if no data
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
      repeater.data = result.items.map(study => ({
        _id: study._id,
        title: study.title,
        companyName: study.company_name,
        logoUrl: study.logo_url,
        challenge: study.challenge_summary,
        result: study.result_summary,
        keyMetric: study.key_metric,
        keyMetricValue: study.key_metric_value,
        testimonialQuote: study.testimonial_quote,
        testimonialAuthor: study.testimonial_author,
        testimonialTitle: study.testimonial_title,
        fullStudyUrl: study.full_study_url
      }));

      repeater.onItemReady(($item, itemData) => {
        try {
          if ($item('#csTitle')) $item('#csTitle').text = itemData.title;
          if ($item('#csCompany')) $item('#csCompany').text = itemData.companyName;
          if ($item('#csLogo') && itemData.logoUrl) {
            $item('#csLogo').src = itemData.logoUrl;
          }
          if ($item('#csChallenge')) $item('#csChallenge').text = itemData.challenge;
          if ($item('#csResult')) $item('#csResult').text = itemData.result;
          if ($item('#csMetricValue')) $item('#csMetricValue').text = itemData.keyMetricValue;
          if ($item('#csMetricLabel')) $item('#csMetricLabel').text = itemData.keyMetric;
          if ($item('#csQuote')) $item('#csQuote').text = `"${itemData.testimonialQuote}"`;
          if ($item('#csAuthor')) {
            $item('#csAuthor').text = `— ${itemData.testimonialAuthor}, ${itemData.testimonialTitle}`;
          }

          // Full study link
          if (itemData.fullStudyUrl) {
            try {
              const readMoreBtn = $item('#csReadMore');
              if (readMoreBtn) {
                readMoreBtn.onClick(() => {
                  wixLocation.to(itemData.fullStudyUrl);
                });
              }
            } catch (e) {
              // Element may not exist
            }
          }
        } catch (e) {
          // Element may not exist
        }
      });
    }

  } catch (err) {
    // Collection may not exist yet
    console.log('CaseStudies collection not found');
    try {
      const section = $w('#caseStudiesSection');
      if (section && section.collapse) section.collapse();
    } catch (e) {
      // Section may not exist
    }
  }
}

/**
 * Load FAQs for accordion
 * Element: #faqAccordionHtml (HTML component)
 * Collection: FAQs (if exists)
 */
async function loadFAQs() {
  try {
    const result = await wixData.query('FAQs')
      .eq('category', 'carrier-solutions')
      .eq('is_active', true)
      .ascending('display_order')
      .find();

    if (result.items.length === 0) {
      // Hide FAQ section if no data
      try {
        const section = $w('#faqSection');
        if (section && section.collapse) section.collapse();
      } catch (e) {
        // Section may not exist
      }
      return;
    }

    // Send to HTML accordion component
    try {
      const htmlFaq = $w('#faqAccordionHtml');
      if (htmlFaq && htmlFaq.postMessage) {
        htmlFaq.postMessage({
          type: 'faqData',
          data: result.items.map(faq => ({
            question: faq.question,
            answer: faq.answer
          }))
        });
      }
    } catch (e) {
      // HTML component may not exist
    }

  } catch (err) {
    // Collection may not exist yet
    console.log('FAQs collection not found');
  }
}

/**
 * Load platform stats for credibility
 */
async function loadPlatformStats() {
  try {
    const stats = await getCarrierPlatformStats();

    const statElements = {
      '#statQualifiedDrivers': stats.qualifiedDrivers.toLocaleString(),
      '#statAvgTimeToHire': `${stats.avgDaysToHire} days`,
      '#statRetentionRate': `${stats.retentionRate}%`
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
