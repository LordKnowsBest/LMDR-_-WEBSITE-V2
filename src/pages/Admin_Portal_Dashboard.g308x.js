import { 
    getCarrierMatchingWeights, 
    updateCarrierMatchingWeights,
    getDriverMatchingWeights,
    updateDriverMatchingWeights,
    getSystemSettings,
    updateSystemSettings,
    getTierLimits,
    updateTierLimits,
    getUISettings,
    updateUISettings,
    toggleMaintenanceMode,
    resetSettings
} from 'backend/admin_config_service';
import { getJobsStatus, triggerJob } from 'backend/admin_jobs_service';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

/**
 * Safely send a postMessage to the HTML component
 */
function safeSend(component, data) {
    try {
        component.postMessage(data);
    } catch (err) {
        console.error('Platform Config: safeSend failed:', err);
    }
}

$w.onReady(async function () {
    const components = getHtmlComponents();

    if (!components.length) {
        console.warn('No HTML component found for Platform Config page');
        return;
    }

    for (const component of components) {
        component.onMessage(async (event) => {
            await routeMessage(component, event?.data);
        });

        // Send init to tell the HTML component to request its data
        safeSend(component, { action: 'init' });
    }
});

/**
 * Safely discover HTML components on the page.
 */
function getHtmlComponents() {
    const found = [];
    for (const id of HTML_COMPONENT_IDS) {
        try {
            const component = $w(id);
            if (component && typeof component.onMessage === 'function') {
                found.push(component);
            }
        } catch (error) {
            // Element not present on this page variant
        }
    }
    return found;
}

/**
 * Route incoming postMessage from the HTML component
 */
async function routeMessage(component, message) {
    if (!message || !message.action) return;

    const { action, payload } = message;

    try {
        switch (action) {
            case 'getCarrierWeights': {
                const weights = await getCarrierMatchingWeights();
                safeSend(component, { action: 'carrierWeightsLoaded', payload: weights });
                break;
            }

            case 'getDriverWeights': {
                const weights = await getDriverMatchingWeights();
                safeSend(component, { action: 'driverWeightsLoaded', payload: weights });
                break;
            }

            case 'getSystemSettings': {
                const settings = await getSystemSettings();
                safeSend(component, { action: 'systemSettingsLoaded', payload: settings });
                break;
            }

            case 'getTierLimits': {
                const limits = await getTierLimits();
                safeSend(component, { action: 'tierLimitsLoaded', payload: limits });
                break;
            }

            case 'getUISettings': {
                const ui = await getUISettings();
                safeSend(component, { action: 'uiSettingsLoaded', payload: ui });
                break;
            }

            case 'getJobs': {
                const jobs = await getJobsStatus();
                safeSend(component, { action: 'jobsLoaded', payload: jobs });
                break;
            }

            case 'triggerJob': {
                await triggerJob(message.jobId);
                safeSend(component, { action: 'jobTriggered' });
                break;
            }

            case 'toggleMaintenance': {
                await toggleMaintenanceMode(message.enabled);
                const settings = await getSystemSettings();
                safeSend(component, { action: 'systemSettingsLoaded', payload: settings });
                break;
            }

            case 'saveAllSettings': {
                const { carrierWeights, driverWeights, systemSettings, tierLimits, uiSettings } = payload;
                
                await Promise.all([
                    updateCarrierMatchingWeights(carrierWeights),
                    updateDriverMatchingWeights(driverWeights),
                    updateSystemSettings(systemSettings),
                    updateTierLimits(tierLimits),
                    updateUISettings(uiSettings)
                ]);

                safeSend(component, { action: 'settingsSaved' });
                break;
            }

            case 'resetSettings': {
                await Promise.all([
                    resetSettings('carrier_matching_weights'),
                    resetSettings('driver_matching_weights'),
                    resetSettings('system_settings'),
                    resetSettings('tier_limits'),
                    resetSettings('ui_settings')
                ]);

                // Reload all
                const [cWeights, dWeights, sys, tiers, ui, jobs] = await Promise.all([
                    getCarrierMatchingWeights(),
                    getDriverMatchingWeights(),
                    getSystemSettings(),
                    getTierLimits(),
                    getUISettings(),
                    getJobsStatus()
                ]);

                safeSend(component, { action: 'carrierWeightsLoaded', payload: cWeights });
                safeSend(component, { action: 'driverWeightsLoaded', payload: dWeights });
                safeSend(component, { action: 'systemSettingsLoaded', payload: sys });
                safeSend(component, { action: 'tierLimitsLoaded', payload: tiers });
                safeSend(component, { action: 'uiSettingsLoaded', payload: ui });
                safeSend(component, { action: 'jobsLoaded', payload: jobs });
                safeSend(component, { action: 'settingsSaved' });
                break;
            }

            default:
                console.warn('Platform Config: Unknown action received:', action);
                break;
        }
    } catch (error) {
        console.error('Platform Config bridge error:', error);
        safeSend(component, {
            action: 'actionError',
            message: error.message || 'An unexpected error occurred'
        });
    }
}