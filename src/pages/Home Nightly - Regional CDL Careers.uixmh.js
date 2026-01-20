/**
 * Home Nightly - Regional CDL Careers Landing Page
 *
 * Dedicated page for Regional truck drivers seeking home-nightly or
 * home-weekly positions. Emphasizes work-life balance, family time,
 * and predictable schedules.
 *
 * Element IDs:
 * - #regionalJobsRepeater - Regional job listings
 * - #homeTimeStats - Home time statistics display
 * - #workLifeRepeater - Work-life balance benefits
 * - #routesRepeater - Sample regional routes
 * - #applyRegionalBtn - CTA button
 */

import wixData from 'wix-data';
import wixLocation from 'wix-location';
import { getJobsByOperationType, getTopJobOpportunities, getRecentHires } from 'backend/publicStatsService';

// Page state
let regionalJobs = [];
let isLoading = false;

$w.onReady(function () {
    initializePage();
});

/**
 * Initialize all page components
 */
async function initializePage() {
    try {
        showLoadingState(true);

        // Load all data in parallel
        await Promise.all([
            loadRegionalJobs(),
            loadHomeTimeStats(),
            loadWorkLifeBalance(),
            loadRegionalRoutes()
        ]);

        // Set up event handlers
        setupEventHandlers();

        showLoadingState(false);
    } catch (error) {
        console.error('Regional page initialization error:', error);
        showLoadingState(false);
    }
}

/**
 * Load Regional-specific job opportunities
 * Fetches jobs filtered by operation_type = 'Regional'
 */
async function loadRegionalJobs() {
    try {
        const jobs = await getJobsByOperationType('Regional', 8);
        regionalJobs = jobs;

        if ($w('#regionalJobsRepeater')) {
            if (jobs.length > 0) {
                $w('#regionalJobsRepeater').data = jobs;
                $w('#regionalJobsRepeater').onItemReady(($item, itemData) => {
                    renderRegionalJobItem($item, itemData);
                });
            } else {
                // Show fallback content if no Regional jobs available
                $w('#regionalJobsRepeater').collapse();
            }
        }

        // Update stats display
        updateRegionalStats(jobs);

    } catch (error) {
        console.error('Error loading Regional jobs:', error);
        regionalJobs = [];
    }
}

/**
 * Render individual Regional job item in repeater
 */
function renderRegionalJobItem($item, jobData) {
    // Carrier name and location
    if ($item('#carrierName')) {
        $item('#carrierName').text = jobData.carrierName || 'Regional Carrier';
    }
    if ($item('#jobLocation')) {
        $item('#jobLocation').text = jobData.location || 'Regional';
    }

    // Pay information
    if ($item('#payRange')) {
        $item('#payRange').text = jobData.payRange || 'Competitive CPM';
    }

    // Home time - emphasize this for regional jobs
    if ($item('#homeTime')) {
        const homeTimeText = formatHomeTime(jobData.homeTime);
        $item('#homeTime').text = homeTimeText;
    }
    if ($item('#homeTimeHighlight')) {
        $item('#homeTimeHighlight').text = getHomeTimeHighlight(jobData.homeTime);
    }

    // Benefits focused on family/balance
    if ($item('#benefits')) {
        $item('#benefits').text = jobData.benefits || 'Full benefits + Home time';
    }

    // Route radius info
    if ($item('#routeRadius')) {
        $item('#routeRadius').text = getRouteRadius(jobData.location);
    }

    // Apply button
    if ($item('#jobApplyBtn')) {
        $item('#jobApplyBtn').onClick(() => {
            navigateToApplication(jobData._id);
        });
    }
}

/**
 * Load home time statistics
 * Displays metrics about home frequency for regional drivers
 */
async function loadHomeTimeStats() {
    const stats = {
        homeNightly: {
            value: '65%',
            label: 'Home Nightly Positions',
            description: 'Over half of our regional jobs get you home every night'
        },
        homeWeekly: {
            value: '92%',
            label: 'Home Weekly Guaranteed',
            description: 'Nearly all regional positions guarantee weekly home time'
        },
        avgMilesFromHome: {
            value: '250',
            label: 'Avg Miles From Home',
            description: 'Regional routes keep you close to your family'
        },
        predictableSchedule: {
            value: '87%',
            label: 'Predictable Schedules',
            description: 'Know your routes and when you\'ll be home'
        }
    };

    // Update individual stat elements if they exist
    if ($w('#homeTimeStats')) {
        // If it's a container, update child elements
        updateStatElement('#homeNightlyValue', stats.homeNightly.value);
        updateStatElement('#homeNightlyLabel', stats.homeNightly.label);
        updateStatElement('#homeWeeklyValue', stats.homeWeekly.value);
        updateStatElement('#homeWeeklyLabel', stats.homeWeekly.label);
        updateStatElement('#avgMilesValue', stats.avgMilesFromHome.value + ' mi');
        updateStatElement('#avgMilesLabel', stats.avgMilesFromHome.label);
        updateStatElement('#predictableValue', stats.predictableSchedule.value);
        updateStatElement('#predictableLabel', stats.predictableSchedule.label);
    }

    // If there's a stats repeater instead
    if ($w('#homeTimeStatsRepeater')) {
        const statsArray = Object.values(stats).map((stat, index) => ({
            _id: `stat_${index}`,
            ...stat
        }));

        $w('#homeTimeStatsRepeater').data = statsArray;
        $w('#homeTimeStatsRepeater').onItemReady(($item, itemData) => {
            if ($item('#statValue')) $item('#statValue').text = itemData.value;
            if ($item('#statLabel')) $item('#statLabel').text = itemData.label;
            if ($item('#statDescription')) $item('#statDescription').text = itemData.description;
        });
    }
}

/**
 * Load work-life balance benefits
 * Highlights family-focused advantages of regional driving
 */
async function loadWorkLifeBalance() {
    const benefits = [
        {
            _id: 'home_nightly',
            title: 'Home Every Night',
            description: 'Sleep in your own bed. Be there for dinner. Tuck your kids in. Regional routes make it possible.',
            icon: 'home',
            highlight: 'Most Popular'
        },
        {
            _id: 'weekends_off',
            title: 'Weekends Off',
            description: 'Many regional positions offer Saturday and Sunday off. Attend games, events, and family gatherings.',
            icon: 'calendar',
            highlight: 'Family Time'
        },
        {
            _id: 'predictable',
            title: 'Predictable Schedule',
            description: 'Know your routes and schedule in advance. Plan your life around work, not the other way around.',
            icon: 'clock',
            highlight: 'Plan Ahead'
        },
        {
            _id: 'benefits',
            title: 'Full Benefits Package',
            description: 'Health, dental, vision, 401k with match. Take care of your family with comprehensive coverage.',
            icon: 'health',
            highlight: 'Family Coverage'
        },
        {
            _id: 'no_slip_seat',
            title: 'Dedicated Equipment',
            description: 'Your truck, your space. No slip-seating means you personalize your cab and keep it how you like it.',
            icon: 'truck',
            highlight: 'Your Truck'
        },
        {
            _id: 'local_knowledge',
            title: 'Know Your Routes',
            description: 'Drive the same lanes and build relationships with customers. Less stress, more efficiency.',
            icon: 'route',
            highlight: 'Familiar Roads'
        }
    ];

    if ($w('#workLifeRepeater')) {
        $w('#workLifeRepeater').data = benefits;
        $w('#workLifeRepeater').onItemReady(($item, itemData) => {
            if ($item('#benefitTitle')) $item('#benefitTitle').text = itemData.title;
            if ($item('#benefitDescription')) $item('#benefitDescription').text = itemData.description;
            if ($item('#benefitHighlight')) $item('#benefitHighlight').text = itemData.highlight;
        });
    }
}

/**
 * Load sample regional routes
 * Shows example route descriptions for driver context
 */
async function loadRegionalRoutes() {
    const routes = [
        {
            _id: 'northeast',
            region: 'Northeast',
            description: 'NY, NJ, PA, CT, MA regional routes',
            homeBase: 'New Jersey Hub',
            avgMiles: '1,800-2,200/week',
            homeTime: 'Home Daily',
            highlights: ['Major metro delivery', 'Port runs available', 'Touch freight options']
        },
        {
            _id: 'southeast',
            region: 'Southeast',
            description: 'FL, GA, NC, SC, TN regional runs',
            homeBase: 'Atlanta Hub',
            avgMiles: '2,000-2,400/week',
            homeTime: 'Home 2-3x/week',
            highlights: ['Drop and hook', 'No touch freight', 'Dedicated lanes']
        },
        {
            _id: 'midwest',
            region: 'Midwest',
            description: 'IL, IN, OH, MI, WI regional routes',
            homeBase: 'Chicago Hub',
            avgMiles: '1,500-2,000/week',
            homeTime: 'Home Nightly',
            highlights: ['Manufacturing deliveries', 'Consistent freight', 'Day cab options']
        },
        {
            _id: 'texas',
            region: 'Texas Triangle',
            description: 'Dallas, Houston, San Antonio corridor',
            homeBase: 'DFW Hub',
            avgMiles: '1,800-2,200/week',
            homeTime: 'Home Daily',
            highlights: ['Growing market', 'New equipment', 'High volume']
        },
        {
            _id: 'southwest',
            region: 'Southwest',
            description: 'AZ, NV, CA regional runs',
            homeBase: 'Phoenix Hub',
            avgMiles: '2,000-2,500/week',
            homeTime: 'Home Weekly',
            highlights: ['Intermodal options', 'Dry van freight', 'Reefer available']
        },
        {
            _id: 'pacific_nw',
            region: 'Pacific Northwest',
            description: 'WA, OR, ID regional routes',
            homeBase: 'Seattle Hub',
            avgMiles: '1,600-2,000/week',
            homeTime: 'Home 2-3x/week',
            highlights: ['Scenic routes', 'Tech industry freight', 'Growing demand']
        }
    ];

    if ($w('#routesRepeater')) {
        $w('#routesRepeater').data = routes;
        $w('#routesRepeater').onItemReady(($item, itemData) => {
            if ($item('#routeRegion')) $item('#routeRegion').text = itemData.region;
            if ($item('#routeDescription')) $item('#routeDescription').text = itemData.description;
            if ($item('#routeHomeBase')) $item('#routeHomeBase').text = itemData.homeBase;
            if ($item('#routeAvgMiles')) $item('#routeAvgMiles').text = itemData.avgMiles;
            if ($item('#routeHomeTime')) $item('#routeHomeTime').text = itemData.homeTime;
            if ($item('#routeHighlights')) {
                $item('#routeHighlights').text = itemData.highlights.join(' | ');
            }

            // Route selection handler
            if ($item('#selectRouteBtn')) {
                $item('#selectRouteBtn').onClick(() => {
                    filterJobsByRegion(itemData.region);
                });
            }
        });
    }
}

/**
 * Update Regional statistics display
 */
function updateRegionalStats(jobs) {
    if ($w('#regionalStatsText')) {
        const homeNightlyCount = jobs.filter(j =>
            j.homeTime && j.homeTime.toLowerCase().includes('daily') ||
            j.homeTime && j.homeTime.toLowerCase().includes('nightly')
        ).length;

        $w('#regionalStatsText').text = `${jobs.length} Regional positions | ${homeNightlyCount} Home Nightly`;
    }

    if ($w('#totalRegionalJobs')) {
        $w('#totalRegionalJobs').text = jobs.length.toString();
    }
}

/**
 * Update individual stat element
 */
function updateStatElement(selector, value) {
    try {
        if ($w(selector)) {
            $w(selector).text = value;
        }
    } catch (e) {
        // Element may not exist, skip
    }
}

/**
 * Set up page event handlers
 */
function setupEventHandlers() {
    // Main CTA button
    if ($w('#applyRegionalBtn')) {
        $w('#applyRegionalBtn').onClick(() => {
            wixLocation.to('/apply-for-cdl-driving-jobs?type=Regional');
        });
    }

    // Alternative CTA buttons
    if ($w('#applyNowButton')) {
        $w('#applyNowButton').onClick(() => {
            wixLocation.to('/apply-for-cdl-driving-jobs?type=Regional');
        });
    }

    // Filter buttons
    if ($w('#filterHomeNightly')) {
        $w('#filterHomeNightly').onClick(() => filterByHomeTime('daily'));
    }

    if ($w('#filterHomeWeekly')) {
        $w('#filterHomeWeekly').onClick(() => filterByHomeTime('weekly'));
    }

    if ($w('#filterWeekendsOff')) {
        $w('#filterWeekendsOff').onClick(() => filterByHomeTime('weekends'));
    }
}

/**
 * Navigate to job application with carrier ID
 */
function navigateToApplication(carrierId) {
    wixLocation.to(`/apply-for-cdl-driving-jobs?carrier=${carrierId}&type=Regional`);
}

/**
 * Filter jobs by home time preference
 */
function filterByHomeTime(preference) {
    let filtered = regionalJobs;

    switch (preference) {
        case 'daily':
            filtered = regionalJobs.filter(j =>
                j.homeTime && (j.homeTime.toLowerCase().includes('daily') ||
                j.homeTime.toLowerCase().includes('nightly'))
            );
            break;
        case 'weekly':
            filtered = regionalJobs.filter(j =>
                j.homeTime && j.homeTime.toLowerCase().includes('weekly')
            );
            break;
        case 'weekends':
            filtered = regionalJobs.filter(j =>
                j.homeTime && j.homeTime.toLowerCase().includes('weekend')
            );
            break;
    }

    if ($w('#regionalJobsRepeater')) {
        $w('#regionalJobsRepeater').data = filtered.length > 0 ? filtered : regionalJobs;
    }
}

/**
 * Filter jobs by region
 */
function filterJobsByRegion(region) {
    // Map region names to state filters
    const regionStates = {
        'Northeast': ['NY', 'NJ', 'PA', 'CT', 'MA'],
        'Southeast': ['FL', 'GA', 'NC', 'SC', 'TN'],
        'Midwest': ['IL', 'IN', 'OH', 'MI', 'WI'],
        'Texas Triangle': ['TX'],
        'Southwest': ['AZ', 'NV', 'CA'],
        'Pacific Northwest': ['WA', 'OR', 'ID']
    };

    const states = regionStates[region] || [];

    const filtered = regionalJobs.filter(job => {
        const jobState = extractState(job.location);
        return states.includes(jobState);
    });

    if ($w('#regionalJobsRepeater')) {
        $w('#regionalJobsRepeater').data = filtered.length > 0 ? filtered : regionalJobs;
    }
}

/**
 * Show/hide loading state
 */
function showLoadingState(loading) {
    isLoading = loading;

    if ($w('#loadingIndicator')) {
        loading ? $w('#loadingIndicator').show() : $w('#loadingIndicator').hide();
    }
}

// Utility functions

function formatHomeTime(homeTime) {
    if (!homeTime) return 'Home Weekly';

    const lower = homeTime.toLowerCase();
    if (lower.includes('daily') || lower.includes('nightly')) {
        return 'Home Every Night';
    } else if (lower.includes('2-3') || lower.includes('multiple')) {
        return 'Home 2-3x Per Week';
    } else if (lower.includes('weekly')) {
        return 'Home Every Weekend';
    }
    return homeTime;
}

function getHomeTimeHighlight(homeTime) {
    if (!homeTime) return 'Weekly Home Time';

    const lower = homeTime.toLowerCase();
    if (lower.includes('daily') || lower.includes('nightly')) {
        return 'Sleep in your own bed!';
    } else if (lower.includes('2-3')) {
        return 'Multiple nights home';
    }
    return 'Guaranteed home time';
}

function getRouteRadius(location) {
    // Estimate based on location
    if (!location) return '200-300 mile radius';
    return '150-300 mile radius';
}

function extractState(location) {
    if (!location) return '';
    const parts = location.split(',');
    if (parts.length >= 2) {
        return parts[1].trim().toUpperCase().substring(0, 2);
    }
    return '';
}
