import {
    getFeatureLifecycleReport,
    getFeatureStats,
    getFeatureHealthScore,
    getAtRiskFeatures,
    getFunnels,
    getFunnelConversion,
    registerFeature,
    updateFeatureStatus
} from 'backend/featureAdoptionService';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

function safeSend(component, data) {
    try {
        component.postMessage(data);
    } catch (err) {
        console.error('ADMIN_FEATURE_ADOPTION: safeSend failed:', err);
    }
}

$w.onReady(function () {
    const component = findHtmlComponent();
    if (!component) {
        console.warn('ADMIN_FEATURE_ADOPTION: No HTML component found');
        return;
    }

    component.onMessage(async (event) => {
        const msg = event && event.data;
        if (!msg || !msg.type) return;
        await routeMessage(component, msg);
    });
});

function findHtmlComponent() {
    for (const id of HTML_COMPONENT_IDS) {
        try {
            const el = $w(id);
            if (el && typeof el.onMessage === 'function') {
                return el;
            }
        } catch (e) {
            // Element not found, try next
        }
    }
    return null;
}

async function routeMessage(component, msg) {
    switch (msg.type) {
        case 'featureAdoptionReady':
            // HTML has initialized; no action needed, HTML triggers its own refreshAll
            break;

        case 'getFeatureLifecycleReport':
            await handleGetFeatureLifecycleReport(component);
            break;

        case 'getFeatureStats':
            await handleGetFeatureStats(component, msg.data);
            break;

        case 'getFeatureHealthScore':
            await handleGetFeatureHealthScore(component, msg.data);
            break;

        case 'getAtRiskFeatures':
            await handleGetAtRiskFeatures(component);
            break;

        case 'getFunnelsList':
            await handleGetFunnelsList(component);
            break;

        case 'getFunnelConversion':
            await handleGetFunnelConversion(component, msg.data);
            break;

        case 'registerFeature':
            await handleRegisterFeature(component, msg.data);
            break;

        case 'updateFeatureStatus':
            await handleUpdateFeatureStatus(component, msg.data);
            break;

        default:
            console.warn('ADMIN_FEATURE_ADOPTION: Unknown message type:', msg.type);
    }
}

// ---------------------------------------------------------------------------
// getFeatureLifecycleReport
// ---------------------------------------------------------------------------
async function handleGetFeatureLifecycleReport(component) {
    try {
        const result = await getFeatureLifecycleReport();
        safeSend(component, { type: 'featureLifecycleReportResult', data: result });
    } catch (err) {
        console.error('ADMIN_FEATURE_ADOPTION: getFeatureLifecycleReport failed:', err);
        safeSend(component, { type: 'featureLifecycleReportResult', data: { error: err.message } });
    }
}

// ---------------------------------------------------------------------------
// getFeatureStats
// ---------------------------------------------------------------------------
async function handleGetFeatureStats(component, data) {
    try {
        const { featureId, timeRange } = data || {};
        const result = await getFeatureStats(featureId, timeRange);
        safeSend(component, { type: 'featureStatsResult', data: result });
    } catch (err) {
        console.error('ADMIN_FEATURE_ADOPTION: getFeatureStats failed:', err);
        safeSend(component, { type: 'featureStatsResult', data: { error: err.message } });
    }
}

// ---------------------------------------------------------------------------
// getFeatureHealthScore
// ---------------------------------------------------------------------------
async function handleGetFeatureHealthScore(component, data) {
    try {
        const { featureId } = data || {};
        const result = await getFeatureHealthScore(featureId);
        safeSend(component, { type: 'featureHealthScoreResult', data: result });
    } catch (err) {
        console.error('ADMIN_FEATURE_ADOPTION: getFeatureHealthScore failed:', err);
        safeSend(component, { type: 'featureHealthScoreResult', data: { error: err.message } });
    }
}

// ---------------------------------------------------------------------------
// getAtRiskFeatures
// ---------------------------------------------------------------------------
async function handleGetAtRiskFeatures(component) {
    try {
        const result = await getAtRiskFeatures();
        safeSend(component, { type: 'atRiskFeaturesResult', data: result });
    } catch (err) {
        console.error('ADMIN_FEATURE_ADOPTION: getAtRiskFeatures failed:', err);
        safeSend(component, { type: 'atRiskFeaturesResult', data: { error: err.message } });
    }
}

// ---------------------------------------------------------------------------
// getFunnelsList (HTML says "getFunnelsList", backend fn is "getFunnels")
// ---------------------------------------------------------------------------
async function handleGetFunnelsList(component) {
    try {
        const result = await getFunnels();
        safeSend(component, { type: 'funnelsListResult', data: result });
    } catch (err) {
        console.error('ADMIN_FEATURE_ADOPTION: getFunnels failed:', err);
        safeSend(component, { type: 'funnelsListResult', data: { error: err.message } });
    }
}

// ---------------------------------------------------------------------------
// getFunnelConversion
// ---------------------------------------------------------------------------
async function handleGetFunnelConversion(component, data) {
    try {
        const { funnelId, timeRange } = data || {};
        const result = await getFunnelConversion(funnelId, timeRange);
        safeSend(component, { type: 'funnelConversionResult', data: result });
    } catch (err) {
        console.error('ADMIN_FEATURE_ADOPTION: getFunnelConversion failed:', err);
        safeSend(component, { type: 'funnelConversionResult', data: { error: err.message } });
    }
}

// ---------------------------------------------------------------------------
// registerFeature
// ---------------------------------------------------------------------------
async function handleRegisterFeature(component, data) {
    try {
        const { featureData } = data || {};
        const result = await registerFeature(featureData);
        safeSend(component, { type: 'registerFeatureResult', data: result });
    } catch (err) {
        console.error('ADMIN_FEATURE_ADOPTION: registerFeature failed:', err);
        safeSend(component, { type: 'registerFeatureResult', data: { success: false, error: err.message } });
    }
}

// ---------------------------------------------------------------------------
// updateFeatureStatus
// ---------------------------------------------------------------------------
async function handleUpdateFeatureStatus(component, data) {
    try {
        const { featureId, status, reason } = data || {};
        const result = await updateFeatureStatus(featureId, status, reason);
        safeSend(component, { type: 'updateFeatureStatusResult', data: result });
    } catch (err) {
        console.error('ADMIN_FEATURE_ADOPTION: updateFeatureStatus failed:', err);
        safeSend(component, { type: 'updateFeatureStatusResult', data: { success: false, error: err.message } });
    }
}
