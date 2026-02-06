/**
 * CARRIER_WEIGHT_PREFERENCES Page Code
 * Bridges CARRIER_WEIGHT_PREFERENCES.html with carrierPreferences.
 *
 * HTML uses type key pattern.
 * HTML sends: weightPreferencesReady, saveWeightPreferences
 * HTML expects: loadPreferences, savePreferencesResult
 */

import {
    getCarrierPreferences,
    saveCarrierPreferences,
    applyPreset,
    getPresetTemplates
} from 'backend/carrierPreferences';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

function safeSend(component, data) {
    try {
        component.postMessage(data);
    } catch (err) {
        console.error('CARRIER_WEIGHT_PREFERENCES: safeSend failed:', err);
    }
}

$w.onReady(function () {
    const component = findHtmlComponent();
    if (!component) {
        console.warn('CARRIER_WEIGHT_PREFERENCES: No HTML component found');
        return;
    }

    component.onMessage(async (event) => {
        const msg = event && event.data;
        if (!msg || !msg.type) return;
        await routeMessage(component, msg);
    });

    safeSend(component, { type: 'init' });
    
    // Load presets
    const presets = getPresetTemplates();
    safeSend(component, { type: 'loadPresets', data: presets });
});

function findHtmlComponent() {
    for (const id of HTML_COMPONENT_IDS) {
        try {
            const el = $w(id);
            if (el && typeof el.onMessage === 'function') {
                return el;
            }
        } catch (e) {
            // Element not present
        }
    }
    return null;
}

async function routeMessage(component, msg) {
    switch (msg.type) {
        case 'weightPreferencesReady':
            await handleLoadPreferences(component);
            break;
        case 'saveWeightPreferences':
            await handleSavePreferences(component, msg);
            break;
        case 'applyPreset':
            await handleApplyPreset(component, msg);
            break;
        default:
            console.warn('CARRIER_WEIGHT_PREFERENCES: Unknown type:', msg.type);
    }
}

async function handleLoadPreferences(component) {
    try {
        const prefs = await getCarrierPreferences();
        safeSend(component, { type: 'loadPreferences', data: prefs });
    } catch (error) {
        console.error('CARRIER_WEIGHT_PREFERENCES: loadPreferences error:', error);
        safeSend(component, { type: 'loadPreferences', data: {} });
    }
}

async function handleSavePreferences(component, msg) {
    try {
        const data = msg.data || {};
        const result = await saveCarrierPreferences(data);
        safeSend(component, {
            type: 'savePreferencesResult',
            data: { success: true, weights: result.weights }
        });
    } catch (error) {
        console.error('CARRIER_WEIGHT_PREFERENCES: savePreferences error:', error);
        safeSend(component, {
            type: 'savePreferencesResult',
            data: { success: false, error: error.message }
        });
    }
}

async function handleApplyPreset(component, msg) {
    try {
        const result = await applyPreset(msg.presetId);
        safeSend(component, {
            type: 'applyPresetResult',
            data: result
        });
    } catch (error) {
        console.error('CARRIER_WEIGHT_PREFERENCES: applyPreset error:', error);
        safeSend(component, {
            type: 'applyPresetResult',
            data: { success: false, error: error.message }
        });
    }
}
