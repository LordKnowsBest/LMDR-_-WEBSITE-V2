// src/pages/HealthWellness_Bridge_Reference.js
// COPY THIS CODE INTO THE VELO PAGE CODE FOR "Health & Wellness"

import { getResourcesByCategory, getResourceBySlug, getApprovedTips, submitTip, markResourceHelpful } from 'backend/healthService';
import wixUsers from 'wix-users';

$w.onReady(function () {
    const htmlComponent = $w('#html1'); 

    htmlComponent.onMessage(async (event) => {
        const { type, data } = event.data;

        try {
            switch (type) {
                case 'ready':
                    // Initial load handled by specific calls
                    break;

                case 'getResources':
                    const resources = await getResourcesByCategory(data.category);
                    htmlComponent.postMessage({ type: 'resourcesData', data: resources.items });
                    break;

                case 'getTips':
                    const tips = await getApprovedTips(data.category);
                    htmlComponent.postMessage({ type: 'tipsData', data: tips });
                    break;

                case 'getResourceDetail':
                    const resource = await getResourceBySlug(data.slug);
                    htmlComponent.postMessage({ type: 'resourceDetail', data: resource });
                    break;

                case 'submitTip':
                    await submitTip(data);
                    // Refresh tips list? Or wait for approval.
                    // Ideally show a "Thanks for submitting" toast in UI
                    break;

                case 'markHelpful':
                    await markResourceHelpful(data.id);
                    break;
            }
        } catch (error) {
            console.error('Health Bridge Error:', error);
        }
    });
});
