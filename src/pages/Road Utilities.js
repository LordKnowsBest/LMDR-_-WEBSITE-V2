// ============================================================================
// ROAD UTILITIES PAGE - Driver Operating System
// Handles communication between DRIVER_ROAD_UTILITIES.html and Velo backend
// ============================================================================

import { searchParking, getParkingDetails, reportParkingAvailability } from 'backend/parkingService';

import { logFeatureInteraction } from 'backend/featureAdoptionService';

import wixUsers from 'wix-users';

import wixLocation from 'wix-location';



// ... existing code ...



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
