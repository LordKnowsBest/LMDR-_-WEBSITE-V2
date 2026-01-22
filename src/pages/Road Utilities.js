// ============================================================================
// ROAD UTILITIES PAGE - Driver Operating System
// Handles communication between DRIVER_ROAD_UTILITIES.html and Velo backend
// ============================================================================

import { searchParking, getParkingDetails, reportParkingAvailability } from 'backend/parkingService';
import { searchFuelPrices, linkFuelCard, getDriverFuelCards, calculateFuelSavings } from 'backend/fuelService';
import { logFeatureInteraction } from 'backend/featureAdoptionService';
import wixUsers from 'wix-users';
import wixLocation from 'wix-location';

// ... existing code ...

const MESSAGE_REGISTRY = {
    inbound: [
        'searchParking',
        'getParkingDetails',
        'reportParking',
        'searchFuel',
        'linkFuelCard',
        'getDriverFuelCards',
        'calculateSavings',
        'tabSwitch',
        'ping'
    ],
    outbound: [
        'parkingResults',
        'parkingDetails',
        'reportResult',
        'fuelResults',
        'fuelCardsLoaded',
        'fuelCardLinked',
        'savingsResult',
        'error',
        'pong'
    ]
};

// ... existing code ...

async function handleHtmlMessage(msg) {
    if (!msg || !msg.type) return;

    const action = msg.type;
    console.log(`📥 [HTML→Velo] ${action}`, msg.data);

    try {
        switch (action) {
            case 'ping':
                sendToHtml('pong', { timestamp: Date.now() });
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

            case 'calculateSavings':
                await handleCalculateFuelSavings(msg.data);
                break;

            case 'getDriverFuelCards':
                await handleGetDriverFuelCards();
                break;

            case 'tabSwitch':
                console.log(`Tab switched to: ${msg.tab}`);
                break;

            default:
                console.warn('⚠️ Unhandled action:', action);
        }
    } catch (error) {
        console.error('❌ Error handling message:', error);
        sendToHtml('error', { message: error.message });
    }
}

// ... existing code ...

// ============================================================================
// FUEL ACTION HANDLERS
// ============================================================================

async function handleSearchFuelPrices(data) {
    const lat = data.lat || 35.1495;
    const lng = data.lng || -90.0490;
    const radius = data.radius || 50;
    const fuelCardType = data.fuelCardType || 'none';

    // Track analytics
    logFeatureInteraction('fuel_optimizer', wixUsers.currentUser.id || 'anonymous', 'search', {
        metadata: { query: data.query, radius, fuelCardType }
    });

    const result = await searchFuelPrices(lat, lng, radius, { fuelType: 'diesel', cardType: fuelCardType });

    if (result.success) {
        // Map results to include savings based on card type
        const items = result.items.map(station => ({
            ...station,
            savings: fuelCardType !== 'none' ? (station.retail_price - station.diesel_price) : 0,
            accepts_card: fuelCardType !== 'none' && station.accepted_cards?.includes(fuelCardType),
            card_type: fuelCardType !== 'none' ? fuelCardType.toUpperCase() : null
        }));
        sendToHtml('fuelResults', items);
    } else {
        sendToHtml('error', { message: result.error });
    }
}

async function handleLinkFuelCard(data) {
    if (!wixUsers.currentUser.loggedIn) {
        sendToHtml('error', { message: 'You must be logged in to link a fuel card' });
        return;
    }

    const cardInfo = {
        card_type: data.cardType,
        card_last4: data.cardLast4,
        nickname: data.nickname
    };

    const result = await linkFuelCard(wixUsers.currentUser.id, cardInfo);
    sendToHtml('fuelCardLinked', result);
}

async function handleGetDriverFuelCards() {
    if (!wixUsers.currentUser.loggedIn) {
        sendToHtml('fuelCardsLoaded', []);
        return;
    }

    const result = await getDriverFuelCards(wixUsers.currentUser.id);
    if (result.success) {
        sendToHtml('fuelCardsLoaded', result.cards);
    } else {
        sendToHtml('fuelCardsLoaded', []);
    }
}

async function handleCalculateFuelSavings(data) {
    const result = await calculateFuelSavings(wixUsers.currentUser.id || 'anonymous', data.tripDetails);
    sendToHtml('savingsResult', result);
}



async function handleSearchParking(data) {

    let lat = data.lat;

    let lng = data.lng;



    // 1. If coordinates not provided, try to use browser geolocation if requested

    if (!lat || !lng) {

        // Fallback to Memphis if no location

        lat = 35.1495;

        lng = -90.0490;

    }



    const radius = data.radius || 25;

    const filters = data.filters || {};



    // Track analytics

    logFeatureInteraction('parking_finder', wixUsers.currentUser.id || 'anonymous', 'search', {

        metadata: { query: data.query, radius, filters }

    });



    const result = await searchParking(lat, lng, radius, filters);

    

    if (result.success) {

        sendToHtml('parkingResults', { items: result.items });

    } else {

        sendToHtml('error', { message: result.error });

    }

}

async function handleGetParkingDetails(data) {
    if (!data.locationId) return;
    
    const result = await getParkingDetails(data.locationId);
    if (result.success) {
        sendToHtml('parkingDetails', { item: result.item });
    } else {
        sendToHtml('error', { message: result.error });
    }
}

async function handleReportParking(data) {
    if (!wixUsers.currentUser.loggedIn) {
        sendToHtml('error', { message: 'You must be logged in to report status' });
        return;
    }

    const report = {
        driver_id: wixUsers.currentUser.id,
        spaces_available: data.spacesAvailable,
        notes: data.notes
    };

    const result = await reportParkingAvailability(data.locationId, report);
    sendToHtml('reportResult', result);
}
