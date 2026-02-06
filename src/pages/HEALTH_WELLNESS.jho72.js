import { 
    getResourcesByCategory, 
    getApprovedTips, 
    getTelemedicinePartners, 
    getResourceBySlug, 
    markResourceHelpful, 
    submitTip 
} from 'backend/healthService';

$w.onReady(function () {
    initHealthHub();
});

function initHealthHub() {
    const possibleIds = ['#html1', '#html2', '#html3', '#html4', '#html5', '#healthHub'];
    
    possibleIds.forEach(id => {
        try {
            const htmlComp = $w(id);
            if (htmlComp && htmlComp.onMessage) {
                console.log('[VELO] Health Hub Bridge active on', id);
                attachHandlers(htmlComp);
            }
        } catch (e) { /* skip */ }
    });
}

function attachHandlers(htmlComp) {
    htmlComp.onMessage(async (event) => {
        const msg = event.data;
        if (!msg || !msg.type) return;

        console.log('[VELO] Health Hub message:', msg.type);

        try {
            switch (msg.type) {
                case 'ready':
                    // Initial load handled by separate messages in HTML
                    break;

                case 'getResources':
                    const resources = await getResourcesByCategory(msg.data.category);
                    htmlComp.postMessage({ type: 'resourcesData', data: resources.items });
                    break;

                case 'getTips':
                    const tips = await getApprovedTips(msg.data.category);
                    htmlComp.postMessage({ type: 'tipsData', data: tips });
                    break;

                case 'getPartners':
                    const partners = await getTelemedicinePartners();
                    htmlComp.postMessage({ type: 'partnersData', data: partners });
                    break;

                case 'getResourceDetail':
                    const resource = await getResourceBySlug(msg.data.slug);
                    htmlComp.postMessage({ type: 'resourceDetail', data: resource });
                    break;

                case 'markHelpful':
                    await markResourceHelpful(msg.data.id);
                    // No return data needed for now, optimistic UI
                    break;

                case 'submitTip':
                    const result = await submitTip(msg.data);
                    if (result.success) {
                        // Optionally notify user
                    }
                    break;

                default:
                    console.warn('[VELO] Unknown health hub message:', msg.type);
            }
        } catch (err) {
            console.error('[VELO] Health hub handler error:', err);
        }
    });
}