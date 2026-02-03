// src/pages/PetFriendly_Bridge_Reference.js
// COPY THIS CODE INTO THE VELO PAGE CODE FOR "Pet-Friendly Stops"

import { searchLocations, getLocationById, submitLocation } from 'backend/petFriendlyService';
import wixUsers from 'wix-users';

$w.onReady(function () {
    const htmlComponent = $w('#html1'); 

    htmlComponent.onMessage(async (event) => {
        const { type, data } = event.data;

        try {
            switch (type) {
                case 'searchPetFriendly':
                    // TODO: Implement actual geo-search if lat/lng available, 
                    // else use filter search. For now, filter search.
                    const results = await searchLocations({
                        location_type: data.type,
                        amenities: data.amenities
                        // location string parsing would happen here or backend to get lat/lng
                    });
                    htmlComponent.postMessage({ type: 'searchResults', data: results.items });
                    break;

                case 'getLocationDetail':
                    const detail = await getLocationById(data.id);
                    htmlComponent.postMessage({ type: 'locationDetail', data: detail });
                    break;

                case 'submitLocation':
                    await submitLocation(data);
                    break;
            }
        } catch (error) {
            console.error('Pet Friendly Bridge Error:', error);
        }
    });
});
