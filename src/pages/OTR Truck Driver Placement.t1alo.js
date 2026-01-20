/**
 * OTR Truck Driver Placement Landing Page
 *
 * Dedicated page for Over-The-Road (OTR) truck drivers seeking long-haul
 * opportunities. Highlights high-mileage positions, adventure lifestyle,
 * and top-paying OTR carriers.
 *
 * Element IDs:
 * - #otrJobsRepeater - OTR job listings
 * - #otrBenefitsRepeater - Benefits of OTR driving
 * - #equipmentRepeater - Equipment/truck showcase
 * - #otrTestimonialsRepeater - Driver testimonials
 * - #otrStatsText - Statistics display
 * - #applyNowButton - CTA button
 */

import wixData from 'wix-data';
import wixLocation from 'wix-location';
import { getJobsByOperationType, getTopJobOpportunities, getRecentHires } from 'backend/publicStatsService';

// Page state
let otrJobs = [];
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
            loadOtrJobs(),
            loadOtrBenefits(),
            loadEquipmentShowcase(),
            loadOtrTestimonials()
        ]);

        // Set up event handlers
        setupEventHandlers();

        showLoadingState(false);
    } catch (error) {
        console.error('OTR page initialization error:', error);
        showLoadingState(false);
    }
}

/**
 * Load OTR-specific job opportunities
 * Fetches jobs filtered by operation_type = 'OTR'
 */
async function loadOtrJobs() {
    try {
        const jobs = await getJobsByOperationType('OTR', 8);
        otrJobs = jobs;

        if ($w('#otrJobsRepeater')) {
            if (jobs.length > 0) {
                $w('#otrJobsRepeater').data = jobs;
                $w('#otrJobsRepeater').onItemReady(($item, itemData) => {
                    renderOtrJobItem($item, itemData);
                });
            } else {
                // Show fallback content if no OTR jobs available
                $w('#otrJobsRepeater').collapse();
            }
        }

        // Update stats if element exists
        updateOtrStats(jobs);

    } catch (error) {
        console.error('Error loading OTR jobs:', error);
        otrJobs = [];
    }
}

/**
 * Render individual OTR job item in repeater
 */
function renderOtrJobItem($item, jobData) {
    // Carrier name and location
    if ($item('#carrierName')) {
        $item('#carrierName').text = jobData.carrierName || 'Top OTR Carrier';
    }
    if ($item('#jobLocation')) {
        $item('#jobLocation').text = jobData.location || 'Nationwide';
    }

    // Pay information - emphasize high miles potential
    if ($item('#payRange')) {
        $item('#payRange').text = jobData.payRange || 'Competitive CPM';
    }
    if ($item('#milesInfo')) {
        const avgMiles = calculateAverageMiles(jobData.fleetSize);
        $item('#milesInfo').text = `${avgMiles}+ avg weekly miles`;
    }

    // Home time and benefits
    if ($item('#homeTime')) {
        $item('#homeTime').text = jobData.homeTime || '2-3 weeks out';
    }
    if ($item('#benefits')) {
        $item('#benefits').text = jobData.benefits || 'Full benefits + 401k';
    }

    // Equipment age indicator
    if ($item('#truckAge')) {
        const ageText = jobData.truckAge ? `${jobData.truckAge} yr avg truck age` : 'Modern equipment';
        $item('#truckAge').text = ageText;
    }

    // Apply button
    if ($item('#jobApplyBtn')) {
        $item('#jobApplyBtn').onClick(() => {
            navigateToApplication(jobData._id);
        });
    }
}

/**
 * Load OTR lifestyle benefits content
 * Highlights the advantages of OTR driving
 */
async function loadOtrBenefits() {
    const benefits = [
        {
            _id: 'miles',
            title: 'Maximum Miles',
            description: 'OTR drivers average 2,500-3,500 miles per week with consistent freight.',
            icon: 'road',
            stat: '3,000+',
            statLabel: 'Weekly Miles'
        },
        {
            _id: 'pay',
            title: 'Top Pay Rates',
            description: 'Long-haul routes offer premium CPM rates plus mileage bonuses.',
            icon: 'dollar',
            stat: '$0.65+',
            statLabel: 'Per Mile'
        },
        {
            _id: 'adventure',
            title: 'See the Country',
            description: 'Travel coast to coast and experience America from behind the wheel.',
            icon: 'map',
            stat: '48',
            statLabel: 'States'
        },
        {
            _id: 'equipment',
            title: 'Late Model Equipment',
            description: 'Drive modern trucks with the latest safety and comfort features.',
            icon: 'truck',
            stat: '2-3',
            statLabel: 'Year Avg Age'
        },
        {
            _id: 'independence',
            title: 'Independence',
            description: 'Enjoy the freedom of the open road with minimal micromanagement.',
            icon: 'freedom',
            stat: '24/7',
            statLabel: 'Dispatch Support'
        },
        {
            _id: 'bonuses',
            title: 'Performance Bonuses',
            description: 'Earn extra with safety bonuses, fuel efficiency bonuses, and sign-on offers.',
            icon: 'bonus',
            stat: '$5K+',
            statLabel: 'Sign-On Available'
        }
    ];

    if ($w('#otrBenefitsRepeater')) {
        $w('#otrBenefitsRepeater').data = benefits;
        $w('#otrBenefitsRepeater').onItemReady(($item, itemData) => {
            if ($item('#benefitTitle')) $item('#benefitTitle').text = itemData.title;
            if ($item('#benefitDescription')) $item('#benefitDescription').text = itemData.description;
            if ($item('#benefitStat')) $item('#benefitStat').text = itemData.stat;
            if ($item('#benefitStatLabel')) $item('#benefitStatLabel').text = itemData.statLabel;
        });
    }
}

/**
 * Load equipment showcase - types of trucks OTR drivers operate
 */
async function loadEquipmentShowcase() {
    const equipment = [
        {
            _id: 'sleeper',
            name: 'Sleeper Cab',
            description: 'Spacious sleeper berths for comfortable rest on long hauls. Full-size beds, climate control, and storage.',
            features: ['APU/Idle Management', 'Inverter', 'Fridge', 'TV Ready']
        },
        {
            _id: 'automatic',
            name: 'Automatic Transmission',
            description: 'Modern automatic transmissions reduce fatigue on long trips and are easier on new drivers.',
            features: ['Fuel Efficient', 'Less Fatigue', 'Smooth Shifting']
        },
        {
            _id: 'safety',
            name: 'Advanced Safety',
            description: 'Lane departure warning, collision mitigation, and adaptive cruise control for safer miles.',
            features: ['Lane Assist', 'Auto Braking', 'Radar Cruise']
        },
        {
            _id: 'brands',
            name: 'Premium Brands',
            description: 'Freightliner Cascadia, Peterbilt 579, Kenworth T680, and Volvo VNL fleets available.',
            features: ['Freightliner', 'Peterbilt', 'Kenworth', 'Volvo']
        }
    ];

    if ($w('#equipmentRepeater')) {
        $w('#equipmentRepeater').data = equipment;
        $w('#equipmentRepeater').onItemReady(($item, itemData) => {
            if ($item('#equipmentName')) $item('#equipmentName').text = itemData.name;
            if ($item('#equipmentDescription')) $item('#equipmentDescription').text = itemData.description;
            if ($item('#equipmentFeatures')) {
                $item('#equipmentFeatures').text = itemData.features.join(' | ');
            }
        });
    }
}

/**
 * Load OTR driver testimonials - road warrior stories
 */
async function loadOtrTestimonials() {
    const testimonials = [
        {
            _id: 'testimonial1',
            name: 'Mike T.',
            experience: '15 years OTR',
            quote: 'I\'ve driven for 3 carriers, but LMDR matched me with a company that actually delivers on their promises. Running 3,200 miles a week now.',
            location: 'Texas',
            highlight: '3,200 weekly miles'
        },
        {
            _id: 'testimonial2',
            name: 'Sarah K.',
            experience: '8 years OTR',
            quote: 'As a woman in trucking, finding the right carrier matters. LMDR helped me find a fleet with respect and the miles I need.',
            location: 'Ohio',
            highlight: 'Solo driver friendly'
        },
        {
            _id: 'testimonial3',
            name: 'James R.',
            experience: '22 years OTR',
            quote: 'After two decades on the road, I know what matters: consistent miles, fair pay, and equipment that runs. Finally found it.',
            location: 'Georgia',
            highlight: '$1,800+ weekly'
        },
        {
            _id: 'testimonial4',
            name: 'Carlos M.',
            experience: '5 years OTR',
            quote: 'Started driving after leaving the military. LMDR matched me with a carrier that values discipline and rewards hard work.',
            location: 'California',
            highlight: 'Veteran-friendly'
        }
    ];

    if ($w('#otrTestimonialsRepeater')) {
        $w('#otrTestimonialsRepeater').data = testimonials;
        $w('#otrTestimonialsRepeater').onItemReady(($item, itemData) => {
            if ($item('#testimonialName')) $item('#testimonialName').text = itemData.name;
            if ($item('#testimonialExperience')) $item('#testimonialExperience').text = itemData.experience;
            if ($item('#testimonialQuote')) $item('#testimonialQuote').text = `"${itemData.quote}"`;
            if ($item('#testimonialLocation')) $item('#testimonialLocation').text = itemData.location;
            if ($item('#testimonialHighlight')) $item('#testimonialHighlight').text = itemData.highlight;
        });
    }
}

/**
 * Update OTR statistics display
 */
function updateOtrStats(jobs) {
    if ($w('#otrStatsText')) {
        const avgPay = calculateAveragePay(jobs);
        $w('#otrStatsText').text = `${jobs.length} OTR positions | Avg ${avgPay}/mile`;
    }

    if ($w('#totalOtrJobs')) {
        $w('#totalOtrJobs').text = jobs.length.toString();
    }
}

/**
 * Set up page event handlers
 */
function setupEventHandlers() {
    // Main CTA button
    if ($w('#applyNowButton')) {
        $w('#applyNowButton').onClick(() => {
            wixLocation.to('/apply-for-cdl-driving-jobs?type=OTR');
        });
    }

    // Filter buttons if present
    if ($w('#filterHighMiles')) {
        $w('#filterHighMiles').onClick(() => filterJobsByMiles(3000));
    }

    if ($w('#filterTopPay')) {
        $w('#filterTopPay').onClick(() => filterJobsByPay(0.60));
    }
}

/**
 * Navigate to job application with carrier ID
 */
function navigateToApplication(carrierId) {
    wixLocation.to(`/apply-for-cdl-driving-jobs?carrier=${carrierId}&type=OTR`);
}

/**
 * Filter jobs by minimum weekly miles
 */
function filterJobsByMiles(minMiles) {
    const filtered = otrJobs.filter(job => {
        const avgMiles = calculateAverageMiles(job.fleetSize);
        return avgMiles >= minMiles;
    });

    if ($w('#otrJobsRepeater')) {
        $w('#otrJobsRepeater').data = filtered.length > 0 ? filtered : otrJobs;
    }
}

/**
 * Filter jobs by minimum pay rate
 */
function filterJobsByPay(minPay) {
    const filtered = otrJobs.filter(job => {
        const pay = parsePayRate(job.payRange);
        return pay >= minPay;
    });

    if ($w('#otrJobsRepeater')) {
        $w('#otrJobsRepeater').data = filtered.length > 0 ? filtered : otrJobs;
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

function calculateAverageMiles(fleetSize) {
    // Larger fleets typically offer more consistent miles
    if (fleetSize >= 500) return 3200;
    if (fleetSize >= 100) return 2800;
    return 2500;
}

function calculateAveragePay(jobs) {
    if (!jobs || jobs.length === 0) return '$0.58';

    const payRates = jobs.map(j => parsePayRate(j.payRange)).filter(p => p > 0);
    if (payRates.length === 0) return '$0.58';

    const avg = payRates.reduce((a, b) => a + b, 0) / payRates.length;
    return `$${avg.toFixed(2)}`;
}

function parsePayRate(payRange) {
    if (!payRange) return 0;
    const match = payRange.match(/\$?([\d.]+)/);
    return match ? parseFloat(match[1]) : 0;
}
