/**
 * About Page
 * Company story, team, mission, and live platform credibility stats
 *
 * @see docs/PAGE_DATA_IMPLEMENTATION_GUIDE.md
 */

import wixData from 'wix-data';
import { getPublicStats, getPartnerLogos } from 'backend/publicStatsService';

$w.onReady(async function () {
  await Promise.all([
    loadImpactStats(),
    loadTeamMembers(),
    loadCompanyMilestones(),
    loadPartnerLogos()
  ]);
});

/**
 * Load and animate impact stats
 * Elements: #statDriversHelped, #statCarriersPartners, #statStatesServed, #statYearsInBusiness
 */
async function loadImpactStats() {
  try {
    const stats = await getPublicStats();

    // Animate counters for visual impact
    animateCounter('#statDriversHelped', stats.driversPlaced);
    animateCounter('#statCarriersPartners', stats.activeCarriers);
    animateCounter('#statStatesServed', 48); // Continental US
    animateCounter('#statYearsInBusiness', calculateYearsInBusiness());

    // Send to HTML component if exists
    try {
      const htmlStats = $w('#impactStatsHtml');
      if (htmlStats && htmlStats.postMessage) {
        htmlStats.postMessage({
          type: 'impactStats',
          data: {
            driversHelped: stats.driversPlaced,
            carriersPartners: stats.activeCarriers,
            statesServed: 48,
            yearsInBusiness: calculateYearsInBusiness()
          }
        });
      }
    } catch (e) {
      // HTML component may not exist
    }

  } catch (err) {
    console.error('Failed to load impact stats:', err);
  }
}

/**
 * Animate a counter from 0 to target value
 */
function animateCounter(selector, targetValue) {
  try {
    const element = $w(selector);
    if (!element || element.text === undefined) return;

    let current = 0;
    const increment = Math.ceil(targetValue / 50);
    const timer = setInterval(() => {
      current += increment;
      if (current >= targetValue) {
        current = targetValue;
        clearInterval(timer);
      }
      element.text = current.toLocaleString();
    }, 30);
  } catch (e) {
    // Element may not exist
  }
}

/**
 * Calculate years in business
 */
function calculateYearsInBusiness() {
  const founded = new Date('2020-01-01'); // Update with actual founding date
  const now = new Date();
  return Math.floor((now - founded) / (365.25 * 24 * 60 * 60 * 1000));
}

/**
 * Load team members
 * Element: #teamRepeater
 * Collection: TeamMembers (if exists)
 */
async function loadTeamMembers() {
  try {
    const result = await wixData.query('TeamMembers')
      .eq('is_active', true)
      .ascending('display_order')
      .find();

    if (result.items.length === 0) {
      // Hide team section if no data
      try {
        const section = $w('#teamSection');
        if (section && section.collapse) section.collapse();
      } catch (e) {
        // Section may not exist
      }
      return;
    }

    const repeater = $w('#teamRepeater');
    if (repeater && repeater.data !== undefined) {
      repeater.data = result.items.map(member => ({
        _id: member._id,
        name: member.full_name,
        title: member.job_title,
        photoUrl: member.photo_url || '/default-avatar.png',
        bio: member.short_bio,
        linkedIn: member.linkedin_url,
        expertise: member.expertise_tags
      }));

      repeater.onItemReady(($item, itemData) => {
        try {
          if ($item('#memberName')) $item('#memberName').text = itemData.name;
          if ($item('#memberTitle')) $item('#memberTitle').text = itemData.title;
          if ($item('#memberBio')) $item('#memberBio').text = itemData.bio;
          if ($item('#memberPhoto') && itemData.photoUrl) {
            $item('#memberPhoto').src = itemData.photoUrl;
          }

          // LinkedIn link
          if (itemData.linkedIn) {
            try {
              const linkedInLink = $item('#linkedInLink');
              if (linkedInLink) {
                linkedInLink.link = itemData.linkedIn;
                linkedInLink.show();
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
    // Collection may not exist yet - hide section
    console.log('TeamMembers collection not found');
    try {
      const section = $w('#teamSection');
      if (section && section.collapse) section.collapse();
    } catch (e) {
      // Section may not exist
    }
  }
}

/**
 * Load company milestones for timeline
 * Element: #timelineHtml (HTML component)
 * Collection: CompanyMilestones (if exists)
 */
async function loadCompanyMilestones() {
  try {
    const result = await wixData.query('CompanyMilestones')
      .ascending('milestone_date')
      .find();

    if (result.items.length === 0) {
      // Hide timeline section if no data
      try {
        const section = $w('#milestonesSection');
        if (section && section.collapse) section.collapse();
      } catch (e) {
        // Section may not exist
      }
      return;
    }

    // Send to HTML timeline component
    try {
      const htmlTimeline = $w('#timelineHtml');
      if (htmlTimeline && htmlTimeline.postMessage) {
        htmlTimeline.postMessage({
          type: 'milestones',
          data: result.items.map(m => ({
            date: m.milestone_date,
            title: m.title,
            description: m.description,
            icon: m.icon_name || 'fa-star'
          }))
        });
      }
    } catch (e) {
      // HTML component may not exist
    }

  } catch (err) {
    // Collection may not exist yet - hide section
    console.log('CompanyMilestones collection not found');
    try {
      const section = $w('#milestonesSection');
      if (section && section.collapse) section.collapse();
    } catch (e) {
      // Section may not exist
    }
  }
}

/**
 * Load partner/client logos for "Trusted By" section
 * Element: #partnerLogosRepeater
 */
async function loadPartnerLogos() {
  try {
    const logos = await getPartnerLogos(12);

    if (logos.length === 0) {
      // Hide partner logos section if no data
      try {
        const section = $w('#partnersSection');
        if (section && section.collapse) section.collapse();
      } catch (e) {
        // Section may not exist
      }
      return;
    }

    const repeater = $w('#partnerLogosRepeater');
    if (repeater && repeater.data !== undefined) {
      repeater.data = logos;

      repeater.onItemReady(($item, itemData) => {
        try {
          if ($item('#partnerLogo') && itemData.logoUrl) {
            $item('#partnerLogo').src = itemData.logoUrl;
            $item('#partnerLogo').alt = itemData.name;
          }
          if ($item('#partnerName')) {
            $item('#partnerName').text = itemData.name;
          }
        } catch (e) {
          // Element may not exist
        }
      });
    }

  } catch (err) {
    console.error('Failed to load partner logos:', err);
  }
}
