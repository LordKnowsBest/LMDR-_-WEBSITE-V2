import { 
    searchLocations, 
    getNearbyLocations, 
    getLocationById, 
    submitLocation, 
    submitReview 
} from 'backend/petFriendlyService';

$w.onReady(function () {
    initPetFriendly();
});

function initPetFriendly() {
    const possibleIds = ['#html1', '#html2', '#html3', '#html4', '#html5', '#petFriendly'];
    
    possibleIds.forEach(id => {
        try {
            const htmlComp = $w(id);
            if (htmlComp && htmlComp.onMessage) {
                console.log('[VELO] Pet Friendly Bridge active on', id);
                attachHandlers(htmlComp);
            }
        } catch (e) { /* skip */ }
    });
}

function attachHandlers(htmlComp) {
    htmlComp.onMessage(async (event) => {
        const msg = event.data;
        if (!msg || !msg.type) return;

        console.log('[VELO] Pet Friendly message:', msg.type);

        try {
            switch (msg.type) {
                case 'ready':
                    // Initial load if needed
                    break;

                case 'searchPetFriendly':
                    await handleSearch(htmlComp, msg.data);
                    break;

                case 'getLocationDetail':
                    const location = await getLocationById(msg.data.id);
                    htmlComp.postMessage({ type: 'locationDetail', data: location });
                    break;

                case 'submitLocation':
                    const newLoc = await submitLocation(msg.data);
                    htmlComp.postMessage({ type: 'locationSubmitted', data: newLoc });
                    break;

                case 'submitReview':
                    const review = await submitReview(msg.data.locationId, msg.data.reviewData);
                    htmlComp.postMessage({ type: 'reviewSubmitted', data: review });
                    break;

                default:
                    console.warn('[VELO] Unknown pet friendly message:', msg.type);
            }
        } catch (err) {
            console.error('[VELO] Pet friendly handler error:', err);
            htmlComp.postMessage({ type: 'error', data: { message: err.message } });
        }
    });
}

async function handleSearch(htmlComp, filters) {
    try {
        let results;
        
        // If we have a text location, we might need geocoding.
        // For MVP, if coordinates aren't passed, we search all or by other filters.
        // If the HTML component can provide lat/lng (e.g. from browser or Google Places), use nearby.
        
        if (filters.lat && filters.lng) {
            results = await getNearbyLocations(filters.lat, filters.lng, filters.radius);
        } else {
            // Fallback to basic search
            const res = await searchLocations({
                location_type: filters.type,
                amenities: filters.amenities
            });
            results = res.items;
        }

        htmlComp.postMessage({ type: 'searchResults', data: results });
    } catch (error) {
        console.error('handleSearch error:', error);
        throw error;
    }
}
