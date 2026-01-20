// ========== FILE 1: DOT Compliance in Driver Hiring.ydkkc.js ==========
/**
 * DOT Compliance in Driver Hiring Page
 * Educational content about DOT compliance requirements for carrier hiring practices
 *
 * @see docs/PAGE_DATA_IMPLEMENTATION_GUIDE.md
 */

import { getComplianceGuide, getComplianceGuides, getFAQs } from 'backend/contentService';

$w.onReady(async function () {
  await Promise.all([
    loadComplianceOverview(),
    loadRegulationsSummary(),
    loadChecklistDownload(),
    loadComplianceFaqs(),
    loadRelatedGuides()
  ]);
});

/**
 * Load hero and intro content for compliance overview
 * Element: #complianceContent
 */
async function loadComplianceOverview() {
  try {
    const guide = await getComplianceGuide('dot-driver-hiring');

    if (!guide) {
      showDefaultComplianceContent();
      return;
    }

    // Set hero content
    const contentElements = {
      '#complianceTitle': guide.title,
      '#complianceSubtitle': guide.subtitle,
      '#complianceIntro': guide.introduction,
      '#lastUpdated': guide.lastUpdated ? `Last updated: ${formatDate(guide.lastUpdated)}` : ''
    };

    Object.entries(contentElements).forEach(([selector, value]) => {
      try {
        const element = $w(selector);
        if (element && element.text !== undefined && value) {
          element.text = value;
        }
      } catch (e) {
        // Element may not exist
      }
    });

    // Set main content HTML if available
    try {
      const contentHtml = $w('#complianceContent');
      if (contentHtml && contentHtml.postMessage && guide.contentHtml) {
        contentHtml.postMessage({
          type: 'complianceContent',
          data: guide.contentHtml
        });
      }
    } catch (e) {
      // HTML component may not exist
    }

  } catch (err) {
    console.error('Failed to load compliance overview:', err);
    showDefaultComplianceContent();
  }
}

/**
 * Show default content when no collection data exists
 */
function showDefaultComplianceContent() {
  const defaults = {
    '#complianceTitle': 'DOT Compliance in Driver Hiring',
    '#complianceSubtitle': 'Essential Requirements for Compliant CDL Driver Recruitment',
    '#complianceIntro': 'Understanding DOT regulations is critical for every carrier. This guide covers the essential compliance requirements for hiring qualified CDL drivers.'
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
 * Load key regulations accordion
 * Element: #regulationsAccordion (HTML component)
 */
async function loadRegulationsSummary() {
  try {
    const guide = await getComplianceGuide('dot-driver-hiring');

    if (!guide || !guide.regulations || guide.regulations.length === 0) {
      // Show default regulations
      showDefaultRegulations();
      return;
    }

    const htmlAccordion = $w('#regulationsAccordion');
    if (htmlAccordion && htmlAccordion.postMessage) {
      htmlAccordion.postMessage({
        type: 'regulationsData',
        data: guide.regulations.map(reg => ({
          title: reg.title,
          code: reg.code,
          description: reg.description,
          requirements: reg.requirements || [],
          penalties: reg.penalties
        }))
      });
    }

  } catch (err) {
    console.error('Failed to load regulations summary:', err);
    showDefaultRegulations();
  }
}

/**
 * Show default regulations when no data available
 */
function showDefaultRegulations() {
  const defaultRegs = [
    { title: 'Driver Qualification Files (391)', code: '49 CFR 391', description: 'Requirements for driver qualification records including medical certificates, driving records, and employment history.' },
    { title: 'Drug and Alcohol Testing (382)', code: '49 CFR 382', description: 'Pre-employment, random, post-accident, and reasonable suspicion testing requirements.' },
    { title: 'Hours of Service (395)', code: '49 CFR 395', description: 'Driving time limits, required breaks, and electronic logging device (ELD) compliance.' },
    { title: 'CDL Requirements (383)', code: '49 CFR 383', description: 'Commercial driver license classifications, endorsements, and disqualifications.' }
  ];

  try {
    const htmlAccordion = $w('#regulationsAccordion');
    if (htmlAccordion && htmlAccordion.postMessage) {
      htmlAccordion.postMessage({
        type: 'regulationsData',
        data: defaultRegs
      });
    }
  } catch (e) {
    // HTML component may not exist
  }
}

/**
 * Setup PDF download CTA
 * Element: #downloadBtn
 */
async function loadChecklistDownload() {
  try {
    const guide = await getComplianceGuide('dot-driver-hiring');

    const downloadBtn = $w('#downloadBtn');
    if (downloadBtn) {
      if (guide && guide.checklistPdfUrl) {
        downloadBtn.link = guide.checklistPdfUrl;
        downloadBtn.target = '_blank';
        if (guide.checklistLabel) {
          downloadBtn.label = guide.checklistLabel;
        }
      } else {
        // Default download behavior
        downloadBtn.label = 'Download Compliance Checklist';
        downloadBtn.onClick(() => {
          console.log('Checklist download requested - PDF not configured');
        });
      }
    }

  } catch (err) {
    console.error('Failed to setup checklist download:', err);
  }
}

/**
 * Load FAQ accordion
 * Element: #faqAccordionHtml (HTML component)
 */
async function loadComplianceFaqs() {
  try {
    const faqs = await getFAQs('dot-compliance');

    if (!faqs || faqs.length === 0) {
      // Hide FAQ section if no data
      try {
        const section = $w('#faqSection');
        if (section && section.collapse) section.collapse();
      } catch (e) {
        // Section may not exist
      }
      return;
    }

    const htmlFaq = $w('#faqAccordionHtml');
    if (htmlFaq && htmlFaq.postMessage) {
      htmlFaq.postMessage({
        type: 'faqData',
        data: faqs.map(faq => ({
          question: faq.question,
          answer: faq.answer
        }))
      });
    }

  } catch (err) {
    console.error('Failed to load compliance FAQs:', err);
    try {
      const section = $w('#faqSection');
      if (section && section.collapse) section.collapse();
    } catch (e) {
      // Section may not exist
    }
  }
}

/**
 * Load related compliance guides
 * Element: #relatedGuidesRepeater
 */
async function loadRelatedGuides() {
  try {
    const guides = await getComplianceGuides();

    // Filter out current guide and limit to 3
    const relatedGuides = (guides || [])
      .filter(g => g.slug !== 'dot-driver-hiring')
      .slice(0, 3);

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
      repeater.data = relatedGuides.map(guide => ({
        _id: guide._id || guide.slug,
        title: guide.title,
        excerpt: guide.excerpt || guide.description,
        thumbnailUrl: guide.thumbnailUrl,
        url: guide.url || `/compliance/${guide.slug}`
      }));

      repeater.onItemReady(($item, itemData) => {
        try {
          if ($item('#guideTitle')) $item('#guideTitle').text = itemData.title;
          if ($item('#guideExcerpt')) $item('#guideExcerpt').text = itemData.excerpt;
          if ($item('#guideThumbnail') && itemData.thumbnailUrl) {
            $item('#guideThumbnail').src = itemData.thumbnailUrl;
          }

          const guideLink = $item('#guideLink');
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
