/**
 * Carrier Solutions Page
 * Showcase carrier services, pricing tiers, and success stories for B2B conversion
 *
 * @see docs/PAGE_DATA_IMPLEMENTATION_GUIDE.md
 */

import wixLocation from 'wix-location';
import { getCarrierPlatformStats } from 'backend/publicStatsService';
import { getPricingTiers, getServiceFeatures, getCaseStudies, getFAQs } from 'backend/contentService';

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
 */
async function loadPricingTiers() {
  try {
    const result = await getPricingTiers('carrier');

    if (!result.success || result.tiers.length === 0) {
      showDefaultPricing();
      return;
    }

    const repeater = $w('#pricingRepeater');
    if (repeater.rendered && repeater.data !== undefined) {
      repeater.data = result.tiers;

      repeater.onItemReady(($item, itemData) => {
        try {
          if ($item('#tierName').rendered) $item('#tierName').text = itemData.name;
          if ($item('#tierPrice').rendered) $item('#tierPrice').text = itemData.price;
          if ($item('#tierSubtext').rendered) $item('#tierSubtext').text = itemData.priceSubtext;
          if ($item('#tierDescription').rendered) $item('#tierDescription').text = itemData.description;

          // Popular badge
          if (itemData.isPopular && itemData.badgeText) {
            try {
              const badge = $item('#popularBadge');
              if (badge.rendered) {
                badge.text = itemData.badgeText;
                badge.show();
              }
            } catch (e) { }
          }

          // CTA button
          try {
            const ctaBtn = $item('#tierCtaBtn');
            if (ctaBtn.rendered) {
              ctaBtn.label = itemData.ctaText;
              ctaBtn.onClick(() => {
                wixLocation.to(itemData.ctaLink);
              });
            }
          } catch (e) { }

          // Features list
          try {
            const featuresRepeater = $item('#tierFeaturesRepeater');
            if (featuresRepeater.rendered && itemData.features.length > 0) {
              featuresRepeater.data = itemData.features.map((f, i) => ({
                _id: `feature-${i}`,
                text: f
              }));
            }
          } catch (e) { }
        } catch (e) { }
      });
    }

  } catch (err) {
    console.error('Failed to load pricing tiers:', err);
    showDefaultPricing();
  }
}

/**
 * Show default pricing when no collection data exists
 */
function showDefaultPricing() {
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
      if (element && element.text !== undefined) element.text = value;
    } catch (e) { }
  });
}

/**
 * Load service features for comparison matrix
 * Element: #featureMatrixHtml (HTML component)
 */
async function loadServiceFeatures() {
  try {
    const result = await getServiceFeatures();

    if (!result.success || result.features.length === 0) {
      try {
        const section = $w('#featureMatrixSection');
        if (section.rendered && section.collapse) section.collapse();
      } catch (e) { }
      return;
    }

    // Group by category
    const grouped = result.features.reduce((acc, feature) => {
      if (!acc[feature.category]) acc[feature.category] = [];
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
      if (htmlMatrix.rendered && htmlMatrix.postMessage) {
        htmlMatrix.postMessage({
          type: 'featureMatrix',
          data: grouped
        });
      }
    } catch (e) { }

  } catch (err) {
    console.error('Failed to load service features:', err);
  }
}

/**
 * Load case studies / success stories
 * Element: #caseStudiesRepeater
 */
async function loadCaseStudies() {
  try {
    const result = await getCaseStudies('carrier', 3);

    if (!result.success || result.caseStudies.length === 0) {
      try {
        const section = $w('#caseStudiesSection');
        if (section.rendered && section.collapse) section.collapse();
      } catch (e) { }
      return;
    }

    const repeater = $w('#caseStudiesRepeater');
    if (repeater.rendered && repeater.data !== undefined) {
      repeater.data = result.caseStudies;

      repeater.onItemReady(($item, itemData) => {
        try {
          if ($item('#csTitle').rendered) $item('#csTitle').text = itemData.title;
          if ($item('#csCompany').rendered) $item('#csCompany').text = itemData.companyName;
          if ($item('#csLogo').rendered && itemData.logoUrl) $item('#csLogo').src = itemData.logoUrl;
          if ($item('#csChallenge').rendered) $item('#csChallenge').text = itemData.challenge;
          if ($item('#csResult').rendered) $item('#csResult').text = itemData.result;
          if ($item('#csMetricValue').rendered) $item('#csMetricValue').text = itemData.keyMetricValue;
          if ($item('#csMetricLabel').rendered) $item('#csMetricLabel').text = itemData.keyMetric;
          if ($item('#csQuote').rendered) $item('#csQuote').text = `"${itemData.testimonialQuote}"`;
          if ($item('#csAuthor').rendered) $item('#csAuthor').text = `— ${itemData.testimonialAuthor}, ${itemData.testimonialTitle}`;

          if (itemData.fullStudyUrl) {
            try {
              const readMoreBtn = $item('#csReadMore');
              if (readMoreBtn.rendered) readMoreBtn.onClick(() => { wixLocation.to(itemData.fullStudyUrl); });
            } catch (e) { }
          }
        } catch (e) { }
      });
    }

  } catch (err) {
    console.error('Failed to load case studies:', err);
    try {
      const section = $w('#caseStudiesSection');
      if (section.rendered && section.collapse) section.collapse();
    } catch (e) { }
  }
}

/**
 * Load FAQs for accordion
 * Element: #faqAccordionHtml (HTML component)
 */
async function loadFAQs() {
  try {
    const result = await getFAQs('carrier-solutions');

    if (!result.success || result.faqs.length === 0) {
      try {
        const section = $w('#faqSection');
        if (section.rendered && section.collapse) section.collapse();
      } catch (e) { }
      return;
    }

    // Send to HTML accordion component
    try {
      const htmlFaq = $w('#faqAccordionHtml');
      if (htmlFaq.rendered && htmlFaq.postMessage) {
        htmlFaq.postMessage({
          type: 'faqData',
          data: result.faqs
        });
      }
    } catch (e) { }

  } catch (err) {
    console.error('Failed to load FAQs:', err);
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
        if (element && element.text !== undefined) element.text = value;
      } catch (e) { }
    });

  } catch (err) {
    console.error('Failed to load platform stats:', err);
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
