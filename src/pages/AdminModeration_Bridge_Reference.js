// src/pages/AdminModeration_Bridge_Reference.js
// COPY THIS CODE INTO THE VELO PAGE CODE FOR "Moderation Queue"

import { getModQueue, moderatePost } from 'backend/moderationService';
import wixUsers from 'wix-users';

$w.onReady(function () {
    const htmlComponent = $w('#html1'); // Ensure your HTML component ID matches

    // Handle messages from HTML
    htmlComponent.onMessage(async (event) => {
        const { type, payload } = event.data;

        try {
            switch (type) {
                case 'ready':
                case 'getQueue':
                    const queue = await getModQueue({ status: payload?.status || 'pending' });
                    htmlComponent.postMessage({ type: 'queueData', payload: { items: queue.records || queue } });
                    break;

                case 'moderateReport':
                    await moderatePost(payload.reportId, payload.action, payload.notes);
                    htmlComponent.postMessage({ type: 'actionSuccess', payload: { reportId: payload.reportId } });
                    break;
            }
        } catch (error) {
            console.error('Moderation Bridge Error:', error);
            htmlComponent.postMessage({ type: 'error', payload: error.message });
        }
    });
});
