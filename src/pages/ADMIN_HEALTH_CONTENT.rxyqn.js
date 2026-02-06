import { 
    getAllResources, 
    getPendingTips, 
    moderateTip, 
    saveResource, 
    deleteResource 
} from 'backend/healthService';

$w.onReady(function () {
    initAdminHealth();
});

function initAdminHealth() {
    const possibleIds = ['#html1', '#html2', '#html3', '#html4', '#html5', '#adminHealth'];
    
    possibleIds.forEach(id => {
        try {
            const htmlComp = $w(id);
            if (htmlComp && htmlComp.onMessage) {
                console.log('[VELO] Admin Health Bridge active on', id);
                attachHandlers(htmlComp);
            }
        } catch (e) { /* skip */ }
    });
}

function attachHandlers(htmlComp) {
    htmlComp.onMessage(async (event) => {
        const msg = event.data;
        if (!msg || !msg.type) return;

        console.log('[VELO] Admin Health message:', msg.type);

        try {
            switch (msg.type) {
                case 'ready':
                    // Just confirm link
                    break;

                case 'getResources':
                    const resources = await getAllResources();
                    htmlComp.postMessage({ type: 'resourcesList', data: resources });
                    break;

                case 'getPendingTips':
                    const tips = await getPendingTips();
                    htmlComp.postMessage({ type: 'tipsList', data: tips });
                    break;

                case 'moderateTip':
                    await moderateTip(msg.data.id, msg.data.action);
                    // Refresh list
                    const freshTips = await getPendingTips();
                    htmlComp.postMessage({ type: 'tipsList', data: freshTips });
                    break;

                case 'saveResource':
                    await saveResource(msg.data);
                    // Refresh resources
                    const freshResources = await getAllResources();
                    htmlComp.postMessage({ type: 'resourcesList', data: freshResources });
                    break;

                case 'deleteResource':
                    await deleteResource(msg.data.id);
                    // Refresh resources
                    const remainingResources = await getAllResources();
                    htmlComp.postMessage({ type: 'resourcesList', data: remainingResources });
                    break;

                default:
                    console.warn('[VELO] Unknown admin health message:', msg.type);
            }
        } catch (err) {
            console.error('[VELO] Admin health handler error:', err);
        }
    });
}