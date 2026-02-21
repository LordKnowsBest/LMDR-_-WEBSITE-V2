// ============================================================================
// ROAD UTILITIES PAGE - Driver Operating System
// Handles communication between DRIVER_ROAD_UTILITIES.html and Velo backend
// ============================================================================

import { searchParking, getParkingDetails, reportParkingAvailability } from 'backend/parkingService';
import { searchFuelPrices, linkFuelCard, getDriverFuelCards, calculateFuelSavings } from 'backend/fuelService';
import {
    searchWeighStations,
    getStationStatus,
    reportStationStatus,
    getDriverBypassServices,
    saveDriverBypassServices
} from 'backend/weighStationService';
import {
    getLocationReviews,
    submitReview,
    submitConditionReport,
    voteReview
} from 'backend/restStopService';
import {
    getAlertsAtLocation,
    getRouteWeather,
    subscribeToAlerts
} from 'backend/weatherAlertService';
import {
    getRouteConditions,
    getTruckRestrictions,
    reportCondition,
    verifyConditionReport,
    getChainRequirements // Moved from weather service
} from 'backend/roadConditionService';
import { logFeatureInteraction } from 'backend/featureAdoptionService';
import wixUsers from 'wix-users';
import wixLocation from 'wix-location';

// ============================================================================
// CONFIGURATION
// ============================================================================

// Road Utilities HTML component is #html4
const POSSIBLE_HTML_IDS = ['#html4', '#html1', '#html2', '#html3', '#html5', '#html6'];

let HTML_COMPONENT = null; // Will be set during initialization

const MESSAGE_REGISTRY = {
    inbound: [
        'searchParking',
        'getParkingDetails',
        'reportParking',
        'searchFuel',
        'linkFuelCard',
        'getDriverFuelCards',
        'calculateSavings',
        // Phase 3: Weigh Stations
        'searchWeighStations',
        'getStationStatus',
        'reportStationStatus',
        'getDriverBypassServices',
        'saveDriverBypassServices',
        'tabSwitch',
        'tabChanged',            // Legacy alias for tabSwitch
        // Phase 4: Rest Stop Ratings
        'getReviews',
        'submitReview',
        'reportCondition',
        'verifyConditionReport',
        'voteReview',
        // Phase 5: Weather
        'getWeather',
        'subscribeAlerts',
        // Phase 6: Road Conditions
        'getRoadConditions',
        'getTruckRestrictions',
        'reportRoadCondition',
        'ping',
        'ready'
    ],
    outbound: [
        'parkingResults',
        'parkingDetails',
        'reportResult',
        'fuelResults',
        'fuelCardsLoaded',
        'fuelCardLinked',
        'savingsResult',
        // Phase 3: Weigh Stations
        'weighStationResults',
        'stationStatusResult',
        'bypassServicesLoaded',
        'bypassServicesSaved',
        'error',
        'pong',
        // Phase 4: Rest Stop Ratings
        'reviewsLoaded',
        'reviewSubmitted',
        'conditionReported',
        'voteRegistered',
        // Phase 5: Weather
        'weatherResults',
        'weatherSubscriptionSaved',
        // Phase 6: Road Conditions
        'conditionsResults',
        'restrictionResults',
        'roadConditionReported',
        'init'
    ]
};

// Default location (Memphis, TN - central US trucking hub)
const DEFAULT_LOCATION = {
    lat: 35.1495,
    lng: -90.0490
};

// ============================================================================
// PAGE INITIALIZATION
// ============================================================================

$w.onReady(function () {
    console.log('[RoadUtilities] Page ready, initializing...');

    // Find the HTML component by trying multiple possible IDs
    HTML_COMPONENT = findHtmlComponent();

    if (!HTML_COMPONENT) {
        console.error('[RoadUtilities] HTML component not found. Tried:', POSSIBLE_HTML_IDS.join(', '));
        console.error('[RoadUtilities] Please check the HTML component ID in the Wix editor and update POSSIBLE_HTML_IDS');
        return;
    }

    // Set up message listener from HTML component
    HTML_COMPONENT.onMessage((event) => {
        handleHtmlMessage(event.data);
    });

    // Send initial configuration to HTML component once it's ready
    setTimeout(() => {
        sendInitialConfig();
    }, 500);

    // Track page view
    const userId = wixUsers.currentUser.loggedIn ? wixUsers.currentUser.id : 'anonymous';
    logFeatureInteraction('road_utilities', userId, 'view', {
        metadata: { source: wixLocation.query?.source || 'direct' }
    }).catch(err => console.warn('[RoadUtilities] Analytics error:', err));

    console.log('[RoadUtilities] Initialization complete');
});

// ============================================================================
// MESSAGE HANDLING
// ============================================================================

/**
 * Find HTML component by trying multiple possible IDs
 * @returns {Object|null} The HTML component or null if not found
 */
function findHtmlComponent() {
    for (const htmlId of POSSIBLE_HTML_IDS) {
        try {
            const component = $w(htmlId);
            if (component && component.onMessage) {
                console.log(`[RoadUtilities] Found HTML component: ${htmlId}`);
                return component;
            }
        } catch (e) {
            // Component doesn't exist, try next
        }
    }
    return null;
}

/**
 * Send message to HTML component
 * @param {string} type - Message type from MESSAGE_REGISTRY.outbound
 * @param {Object} data - Payload data
 */
function sendToHtml(type, data) {
    if (!HTML_COMPONENT) {
        console.error('[RoadUtilities] Cannot send message, HTML component not found');
        return;
    }

    console.log(`[Velo->HTML] ${type}`, data);
    HTML_COMPONENT.postMessage({ type, data });
}

/**
 * Send initial configuration to HTML component
 */
function sendInitialConfig() {
    const isLoggedIn = wixUsers.currentUser.loggedIn;
    const userId = isLoggedIn ? wixUsers.currentUser.id : null;

    sendToHtml('init', {
        isLoggedIn,
        userId,
        defaultLocation: DEFAULT_LOCATION,
        timestamp: Date.now(),
        // Default to Dashboard tab unless deep linked
        initialTab: 'dashboard'
    });

    // Pre-load data for Dashboard Summary
    if (isLoggedIn) {
        handleGetDriverFuelCards();
        handleGetDriverBypassServices();
    }
}

/**
 * Main message router - handles all inbound messages from HTML
 * @param {Object} msg - Message object with type and data
 */
async function handleHtmlMessage(msg) {
    if (!msg || !msg.type) return;

    const action = msg.type;
    console.log(`[HTML->Velo] ${action}`, msg.data);

    try {
        switch (action) {
            case 'ping':
                sendToHtml('pong', { timestamp: Date.now() });
                break;

            case 'ready':
                sendInitialConfig();
                break;

            case 'searchParking':
                await handleSearchParking(msg.data);
                break;

            case 'getParkingDetails':
                await handleGetParkingDetails(msg.data);
                break;

            case 'reportParking':
                await handleReportParking(msg.data);
                break;

            case 'searchFuel':
                await handleSearchFuelPrices(msg.data);
                break;

            case 'linkFuelCard':
                await handleLinkFuelCard(msg.data);
                break;

            case 'getDriverFuelCards':
                await handleGetDriverFuelCards();
                break;

            case 'calculateSavings':
                await handleCalculateFuelSavings(msg.data);
                break;

            // Phase 3: Weigh Station Handlers
            case 'searchWeighStations':
                await handleSearchWeighStations(msg.data);
                break;

            case 'getStationStatus':
                await handleGetStationStatus(msg.data);
                break;

            case 'reportStationStatus':
                await handleReportStationStatus(msg.data);
                break;

            case 'getDriverBypassServices':
                await handleGetDriverBypassServices();
                break;

            case 'saveDriverBypassServices':
                await handleSaveDriverBypassServices(msg.data);
                break;

            // Phase 4: Rest Stop Ratings Handlers
            case 'getReviews':
                await handleGetLocationReviews(msg.data);
                break;

            case 'submitReview':
                await handleSubmitReview(msg.data);
                break;

            case 'reportCondition':
                await handleReportCondition(msg.data);
                break;

            case 'voteReview':
                await handleVoteReview(msg.data);
                break;

            // Phase 5: Weather Handlers
            case 'getWeather':
                await handleGetWeather(msg.data);
                break;
            case 'subscribeAlerts':
                await handleSubscribeAlerts(msg.data);
                break;

            // Phase 6: Road Conditions
            case 'getRoadConditions':
                await handleGetRoadConditions(msg.data);
                break;

            case 'getTruckRestrictions':
                await handleGetTruckRestrictions(msg.data);
                break;

            case 'reportRoadCondition':
                await handleReportRoadCondition(msg.data);
                break;

            case 'verifyConditionReport':
                await handleVerifyConditionReport(msg.data);
                break;

            case 'tabSwitch':
            case 'tabChanged':
                handleTabSwitch(msg.data);
                break;

            default:
                console.warn('[RoadUtilities] Unhandled action:', action);
        }
    } catch (error) {
        console.error('[RoadUtilities] Error handling message:', error);
        sendToHtml('error', {
            message: error.message || 'An unexpected error occurred',
            action: action
        });
    }
}

// ============================================================================
// PARKING ACTION HANDLERS
// ============================================================================

/**
 * Handle parking search request
 * @param {Object} data - Search parameters (lat, lng, radius, filters, query)
 */
async function handleSearchParking(data) {
    let lat = parseFloat(data.lat);
    let lng = parseFloat(data.lng);

    // Use default location if coordinates not provided or invalid
    if (isNaN(lat) || isNaN(lng)) {
        lat = DEFAULT_LOCATION.lat;
        lng = DEFAULT_LOCATION.lng;
    }

    const radius = parseInt(data.radius, 10) || 25;
    const filters = data.filters || {};

    // Track analytics
    const userId = wixUsers.currentUser.loggedIn ? wixUsers.currentUser.id : 'anonymous';
    logFeatureInteraction('parking_finder', userId, 'click', {
        metadata: { query: data.query, radius, filters }
    }).catch(err => console.warn('[RoadUtilities] Analytics error:', err));

    const result = await searchParking(lat, lng, radius, filters);

    if (result.success) {
        sendToHtml('parkingResults', {
            items: result.items,
            fromCache: result.fromCache || false,
            searchCenter: { lat, lng },
            radius
        });
    } else {
        sendToHtml('error', { message: result.error || 'Failed to search parking' });
    }
}

/**
 * Handle request for parking location details
 * @param {Object} data - Contains locationId
 */
async function handleGetParkingDetails(data) {
    if (!data.locationId) {
        sendToHtml('error', { message: 'Location ID is required' });
        return;
    }

    const result = await getParkingDetails(data.locationId);

    if (result.success) {
        sendToHtml('parkingDetails', { item: result.item });
    } else {
        sendToHtml('error', { message: result.error || 'Failed to get parking details' });
    }
}

/**
 * Handle parking availability report from driver
 * @param {Object} data - Report data (locationId, spacesAvailable, notes)
 */
async function handleReportParking(data) {
    if (!wixUsers.currentUser.loggedIn) {
        sendToHtml('error', { message: 'You must be logged in to report parking status' });
        return;
    }

    if (!data.locationId) {
        sendToHtml('error', { message: 'Location ID is required' });
        return;
    }

    const report = {
        driver_id: wixUsers.currentUser.id,
        spaces_available: parseInt(data.spacesAvailable, 10) || 0,
        notes: data.notes || ''
    };

    // Track analytics
    logFeatureInteraction('parking_finder', wixUsers.currentUser.id, 'report', {
        metadata: { locationId: data.locationId, spacesAvailable: report.spaces_available }
    }).catch(err => console.warn('[RoadUtilities] Analytics error:', err));

    const result = await reportParkingAvailability(data.locationId, report);

    sendToHtml('reportResult', {
        success: result.success,
        message: result.success ? 'Thank you for your report!' : result.error,
        reportId: result.reportId
    });
}

// ============================================================================
// FUEL ACTION HANDLERS
// ============================================================================

/**
 * Handle fuel price search request
 * @param {Object} data - Search parameters (lat, lng, radius, fuelCardType, query)
 */
async function handleSearchFuelPrices(data) {
    const lat = parseFloat(data.lat) || DEFAULT_LOCATION.lat;
    const lng = parseFloat(data.lng) || DEFAULT_LOCATION.lng;
    const radius = parseInt(data.radius, 10) || 50;
    const fuelCardType = data.fuelCardType || 'none';

    // Track analytics
    const userId = wixUsers.currentUser.loggedIn ? wixUsers.currentUser.id : 'anonymous';
    logFeatureInteraction('fuel_optimizer', userId, 'click', {
        metadata: { query: data.query, radius, fuelCardType }
    }).catch(err => console.warn('[RoadUtilities] Analytics error:', err));

    const result = await searchFuelPrices(lat, lng, radius, {
        fuelType: 'diesel',
        cardType: fuelCardType
    });

    console.log('[RoadUtilities] Fuel search result:', {
        success: result.success,
        itemCount: result.items?.length || 0,
        fromCache: result.fromCache
    });

    if (result.success) {
        // Map results to include savings based on card type
        // Use discount_applied from fuelService (already calculated)
        const items = result.items.map(station => ({
            ...station,
            savings: station.discount_applied || station.savings_per_gallon || 0,
            accepts_card: fuelCardType !== 'none' && station.accepted_cards?.includes(fuelCardType),
            card_type: fuelCardType !== 'none' ? fuelCardType.toUpperCase() : null
        }));

        sendToHtml('fuelResults', {
            items,
            fromCache: result.fromCache || false,
            searchCenter: { lat, lng },
            radius
        });
    } else {
        sendToHtml('error', { message: result.error || 'Failed to search fuel prices' });
    }
}

/**
 * Handle fuel card linking request
 * @param {Object} data - Card info (cardType, cardLast4, nickname)
 */
async function handleLinkFuelCard(data) {
    if (!wixUsers.currentUser.loggedIn) {
        sendToHtml('error', { message: 'You must be logged in to link a fuel card' });
        return;
    }

    if (!data.cardType) {
        sendToHtml('error', { message: 'Card type is required' });
        return;
    }

    const cardInfo = {
        card_type: data.cardType,
        card_last4: data.cardLast4 || '',
        nickname: data.nickname || data.cardType.toUpperCase()
    };

    // Track analytics
    logFeatureInteraction('fuel_optimizer', wixUsers.currentUser.id, 'link_card', {
        metadata: { cardType: data.cardType }
    }).catch(err => console.warn('[RoadUtilities] Analytics error:', err));

    const result = await linkFuelCard(wixUsers.currentUser.id, cardInfo);

    sendToHtml('fuelCardLinked', {
        success: result.success,
        message: result.success ? 'Fuel card linked successfully!' : result.error,
        card: result.card
    });

    // Refresh the card list
    if (result.success) {
        await handleGetDriverFuelCards();
    }
}

/**
 * Handle request for driver's linked fuel cards
 */
async function handleGetDriverFuelCards() {
    if (!wixUsers.currentUser.loggedIn) {
        sendToHtml('fuelCardsLoaded', { cards: [] });
        return;
    }

    const result = await getDriverFuelCards(wixUsers.currentUser.id);

    if (result.success) {
        sendToHtml('fuelCardsLoaded', { cards: result.cards || [] });
    } else {
        sendToHtml('fuelCardsLoaded', { cards: [] });
    }
}

/**
 * Handle fuel savings calculation request
 * @param {Object} data - Trip details for calculation
 */
async function handleCalculateFuelSavings(data) {
    const userId = wixUsers.currentUser.loggedIn ? wixUsers.currentUser.id : 'anonymous';

    // Track analytics
    logFeatureInteraction('fuel_optimizer', userId, 'calculate', {
        metadata: { gallons: data.gallons, cardType: data.cardType }
    }).catch(err => console.warn('[RoadUtilities] Analytics error:', err));

    const tripDetails = {
        gallons: data.gallons || 150,
        currentPrice: data.currentPrice,
        cardType: data.cardType,
        stateAverage: data.stateAverage
    };

    const result = await calculateFuelSavings(userId, tripDetails);

    sendToHtml('savingsResult', {
        success: result.success,
        ...result
    });
}

// ============================================================================
// UTILITY HANDLERS
// ============================================================================

/**
 * Handle tab switch event for analytics
 * @param {Object} data - Tab switch data (tab name)
 */
function handleTabSwitch(data) {
    const tabName = data.tab || data;
    console.log(`[RoadUtilities] Tab switched to: ${tabName}`);

    // Track analytics
    const userId = wixUsers.currentUser.loggedIn ? wixUsers.currentUser.id : 'anonymous';
    logFeatureInteraction('road_utilities', userId, 'tab_switch', {
        metadata: { tab: tabName }
    }).catch(err => console.warn('[RoadUtilities] Analytics error:', err));
}

// ============================================================================
// WEIGH STATION ACTION HANDLERS (Phase 3)
// ============================================================================

/**
 * Handle weigh station search request
 * @param {Object} data - Search parameters (lat, lng, radius, state, bypassServices)
 */
async function handleSearchWeighStations(data) {
    const lat = parseFloat(data.lat) || DEFAULT_LOCATION.lat;
    const lng = parseFloat(data.lng) || DEFAULT_LOCATION.lng;
    const radius = parseInt(data.radius, 10) || 100;

    // Track analytics
    const userId = wixUsers.currentUser.loggedIn ? wixUsers.currentUser.id : 'anonymous';
    logFeatureInteraction('weigh_station_finder', userId, 'click', {
        metadata: {
            state: data.state,
            radius,
            bypassServices: data.bypassServices
        }
    }).catch(err => console.warn('[RoadUtilities] Analytics error:', err));

    const result = await searchWeighStations(lat, lng, radius, {
        state: data.state || null,
        bypassServices: data.bypassServices || {}
    });

    console.log('[RoadUtilities] Weigh station search result:', {
        success: result.success,
        itemCount: result.items?.length || 0,
        fromCache: result.fromCache
    });

    if (result.success) {
        sendToHtml('weighStationResults', {
            items: result.items,
            fromCache: result.fromCache || false,
            searchCenter: { lat, lng },
            radius
        });
    } else {
        sendToHtml('error', { message: result.error || 'Failed to search weigh stations' });
    }
}

/**
 * Handle request for specific station status
 * @param {Object} data - Contains stationId
 */
async function handleGetStationStatus(data) {
    if (!data.stationId) {
        sendToHtml('error', { message: 'Station ID is required' });
        return;
    }

    const result = await getStationStatus(data.stationId);

    if (result.success) {
        sendToHtml('stationStatusResult', { station: result.station });
    } else {
        sendToHtml('error', { message: result.error || 'Failed to get station status' });
    }
}

/**
 * Handle station status report from driver
 * @param {Object} data - Report data (stationId, reportType, waitMinutes, details)
 */
async function handleReportStationStatus(data) {
    if (!wixUsers.currentUser.loggedIn) {
        sendToHtml('stationStatusResult', {
            success: false,
            message: 'You must be logged in to report station status'
        });
        return;
    }

    if (!data.stationId) {
        sendToHtml('stationStatusResult', {
            success: false,
            message: 'Station ID is required'
        });
        return;
    }

    if (!data.reportType) {
        sendToHtml('stationStatusResult', {
            success: false,
            message: 'Report type (open/closed) is required'
        });
        return;
    }

    const report = {
        driver_id: wixUsers.currentUser.id,
        report_type: data.reportType,
        wait_minutes: data.waitMinutes || null,
        notes: data.details?.join(', ') || ''
    };

    // Track analytics
    logFeatureInteraction('weigh_station_finder', wixUsers.currentUser.id, 'report', {
        metadata: {
            stationId: data.stationId,
            reportType: data.reportType,
            waitMinutes: data.waitMinutes
        }
    }).catch(err => console.warn('[RoadUtilities] Analytics error:', err));

    const result = await reportStationStatus(data.stationId, report);

    sendToHtml('stationStatusResult', {
        success: result.success,
        message: result.success ? 'Thanks for your report!' : result.error,
        reportId: result.reportId
    });
}

/**
 * Handle request for driver's bypass service preferences
 */
async function handleGetDriverBypassServices() {
    if (!wixUsers.currentUser.loggedIn) {
        sendToHtml('bypassServicesLoaded', { services: { prepass: false, drivewyze: false } });
        return;
    }

    const result = await getDriverBypassServices(wixUsers.currentUser.id);

    if (result.success) {
        sendToHtml('bypassServicesLoaded', { services: result.services || { prepass: false, drivewyze: false } });
    } else {
        sendToHtml('bypassServicesLoaded', { services: { prepass: false, drivewyze: false } });
    }
}

/**
 * Handle saving driver's bypass service preferences
 * @param {Object} data - Contains prepass and drivewyze boolean flags
 */
async function handleSaveDriverBypassServices(data) {
    if (!wixUsers.currentUser.loggedIn) {
        sendToHtml('bypassServicesSaved', {
            success: false,
            message: 'You must be logged in to save preferences'
        });
        return;
    }

    const services = {
        prepass: Boolean(data.prepass),
        drivewyze: Boolean(data.drivewyze)
    };

    const result = await saveDriverBypassServices(wixUsers.currentUser.id, services);

    sendToHtml('bypassServicesSaved', {
        success: result.success,
        message: result.success ? 'Preferences saved' : result.error
    });
}
// ============================================================================
// REST STOP RATING HANDLERS (Phase 4)
// ============================================================================

/**
 * Handle request for location reviews
 */
async function handleGetLocationReviews(data) {
    if (!data.locationId) {
        sendToHtml('error', { message: 'Location ID is required' });
        return;
    }

    // Track analytics
    const userId = wixUsers.currentUser.loggedIn ? wixUsers.currentUser.id : 'anonymous';
    logFeatureInteraction('rest_stop_ratings', userId, 'view', {
        metadata: { locationId: data.locationId, sort: data.options?.sort }
    }).catch(err => console.warn('[RoadUtilities] Analytics error:', err));

    // 'all' = browse top-rated across all locations
    const locationId = data.locationId === 'all' ? null : data.locationId;
    const result = await getLocationReviews(locationId, data.options);

    if (result.success) {
        sendToHtml('reviewsLoaded', {
            locationId: data.locationId,
            reviews: result.reviews,
            stats: result.stats
        });
    } else {
        console.error('[RoadUtilities] Failed to get reviews:', result.error);
        sendToHtml('reviewsLoaded', { locationId: data.locationId, reviews: [], stats: null });
    }
}

/**
 * Handle review submission
 */
async function handleSubmitReview(data) {
    if (!wixUsers.currentUser.loggedIn) {
        sendToHtml('reviewSubmitted', { success: false, message: 'Must be logged in' });
        return;
    }

    const { locationId, reviewData } = data;
    if (!reviewData || !reviewData.userLocation) {
        sendToHtml('reviewSubmitted', {
            success: false,
            message: 'GPS verification required. Enable location to submit reviews.'
        });
        return;
    }

    // Track analytics
    logFeatureInteraction('rest_stop_ratings', wixUsers.currentUser.id, 'submit', {
        metadata: { locationId, rating: reviewData.rating }
    }).catch(err => console.warn('[RoadUtilities] Analytics error:', err));

    const result = await submitReview(locationId, reviewData);

    sendToHtml('reviewSubmitted', {
        success: result.success,
        message: result.success ? 'Review submitted successfully' : result.error,
        review: result.review
    });
}

/**
 * Handle condition report
 */
async function handleReportCondition(data) {
    if (!wixUsers.currentUser.loggedIn) {
        sendToHtml('conditionReported', { success: false, message: 'Must be logged in' });
        return;
    }

    const { locationId, reportData } = data;

    // Track analytics
    logFeatureInteraction('rest_stop_ratings', wixUsers.currentUser.id, 'report', {
        metadata: { locationId, type: reportData.reportType }
    }).catch(err => console.warn('[RoadUtilities] Analytics error:', err));

    const result = await submitConditionReport(locationId, reportData);

    sendToHtml('conditionReported', {
        success: result.success,
        message: result.success ? 'Report submitted' : result.error
    });
}

/**
 * Handle review upvote/downvote
 */
async function handleVoteReview(data) {
    if (!wixUsers.currentUser.loggedIn) return;

    const { reviewId, isHelpful } = data;

    // Track analytics
    logFeatureInteraction('rest_stop_ratings', wixUsers.currentUser.id, 'vote', {
        metadata: { reviewId, helpful: isHelpful }
    }).catch(err => console.warn('[RoadUtilities] Analytics error:', err));

    const result = await voteReview(reviewId, isHelpful);

    if (result.success) {
        sendToHtml('voteRegistered', { reviewId, helpful_votes: result.helpful_votes });
    }
}

// ============================================================================
// WEATHER HANDLERS (Phase 5)
// ============================================================================

/**
 * Handle weather request
 */
async function handleGetWeather(data) {
    // Analytics
    const userId = wixUsers.currentUser.loggedIn ? wixUsers.currentUser.id : 'anonymous';
    logFeatureInteraction('weather_alerts', userId, 'view', {
        metadata: { routePoints_count: data.routePoints ? data.routePoints.length : 0 }
    }).catch(err => console.warn('[RoadUtilities] Analytics error:', err));

    // 1. Get Chain Laws (Phase 6 logic)
    // Pass routePoints if available, otherwise it returns empty or defaults
    const chainLawsResult = await getChainRequirements(data.routePoints || []);

    // 2. Get Alerts (Use route points from frontend if available)
    let alerts = [];
    if (data.routePoints && data.routePoints.length > 0) {
        const weatherResult = await getRouteWeather(data.routePoints);
        if (weatherResult.success) alerts = weatherResult.alerts;
    } else {
        // Default: Check Donner Pass
        const alertResult = await getAlertsAtLocation(39.31, -120.33);
        if (alertResult.success) alerts = alertResult.alerts;
    }

    sendToHtml('weatherResults', {
        alerts: alerts,
        chainLaws: chainLawsResult.success ? chainLawsResult.requirements : []
    });
}

/**
 * Save driver weather alert preferences (Phase 5 completion)
 */
async function handleSubscribeAlerts(data) {
    if (!wixUsers.currentUser.loggedIn) {
        sendToHtml('weatherSubscriptionSaved', {
            success: false,
            message: 'Must be logged in to save weather alert settings'
        });
        return;
    }

    const preferences = data?.preferences || {};
    const result = await subscribeToAlerts(wixUsers.currentUser.id, preferences);

    sendToHtml('weatherSubscriptionSaved', {
        success: result.success,
        message: result.success ? 'Weather alert preferences saved' : (result.error || 'Unable to save preferences')
    });
}

// ============================================================================
// ROAD CONDITIONS HANDLERS (Phase 6)
// ============================================================================

async function handleGetRoadConditions(data) {
    const { routePoints } = data;

    // Call backend service
    const result = await getRouteConditions(routePoints); // Phase 6 MVP options

    // Analytics
    const userId = wixUsers.currentUser.loggedIn ? wixUsers.currentUser.id : 'anonymous';
    logFeatureInteraction('road_conditions', userId, 'view', {
        metadata: { routePoints_count: routePoints ? routePoints.length : 0 }
    }).catch(err => console.warn('[RoadUtilities] Analytics error:', err));

    if (result.success) {
        sendToHtml('conditionsResults', {
            conditions: result.conditions,
            summary: result.summary,
            restrictions: [] // Phase 6.1
        });
    } else {
        console.error('[RoadUtilities] Failed to get road conditions:', result.error);
        sendToHtml('conditionsResults', { conditions: [], summary: null });
    }
}

async function handleGetTruckRestrictions(data) {
    const { routePoints, truckSpecs } = data;

    // Analytics
    const userId = wixUsers.currentUser.loggedIn ? wixUsers.currentUser.id : 'anonymous';
    logFeatureInteraction('road_conditions', userId, 'filter', {
        metadata: { truckSpecs }
    }).catch(err => console.warn('[RoadUtilities] Analytics error:', err));

    const result = await getTruckRestrictions(routePoints, truckSpecs);

    if (result.success) {
        sendToHtml('restrictionResults', {
            restrictions: result.restrictions || []
        });
    } else {
        sendToHtml('restrictionResults', { restrictions: [] });
    }
}

async function handleReportRoadCondition(data) {
    if (!wixUsers.currentUser.loggedIn) {
        // Allow anonymous reporting for demo? Or restrict
        // For demo purpose, we might allow it or just flag it
    }

    const { report } = data;
    // Add user ID if logged in
    if (wixUsers.currentUser.loggedIn) {
        report.driverId = wixUsers.currentUser.id;
    } else {
        report.driverId = 'anonymous';
    }

    // Analytics
    logFeatureInteraction('road_conditions', report.driverId, 'report', {
        metadata: { type: report.type, highway: report.highway }
    }).catch(err => console.warn('[RoadUtilities] Analytics error:', err));

    const result = await reportCondition(report);
    sendToHtml('roadConditionReported', {
        success: result.success,
        reportId: result.reportId
    });
}

async function handleVerifyConditionReport(data) {
    if (!wixUsers.currentUser.loggedIn) return;
    const { reportId } = data;
    const result = await verifyConditionReport(reportId, wixUsers.currentUser.id);
    if (result.success) {
        // Optionally send confirmation back
    }
}
