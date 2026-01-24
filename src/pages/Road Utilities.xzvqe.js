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
        timestamp: Date.now()
    });

    // Pre-load driver's fuel cards if logged in
    if (isLoggedIn) {
        handleGetDriverFuelCards();
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

            case 'tabSwitch':
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
