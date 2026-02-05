/**
 * B2B_OUTREACH Page Code
 * Bridges B2B_OUTREACH.html with b2bSequenceService.
 *
 * HTML sends (action key): getSequences, getSequence, getThrottleStatus, saveSequence
 * HTML expects: sequencesLoaded, sequenceLoaded, throttleStatus, sequenceSaved,
 *   actionSuccess, actionError
 */

import {
    listSequences,
    getSequence,
    createSequence,
    updateSequence,
    addStep,
    checkThrottleLimits,
    isQuietHours
} from 'backend/b2bSequenceService';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

function safeSend(component, data) {
    try {
        component.postMessage(data);
    } catch (err) {
        console.error('B2B_OUTREACH: safeSend failed:', err);
    }
}

$w.onReady(function () {
    const component = findHtmlComponent();
    if (!component) {
        console.warn('B2B_OUTREACH: No HTML component found');
        return;
    }

    component.onMessage(async (event) => {
        const msg = event && event.data;
        if (!msg || !msg.action) return;
        await routeMessage(component, msg);
    });

    safeSend(component, { action: 'init' });
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
    switch (msg.action) {
        case 'getSequences':
            await handleGetSequences(component, msg);
            break;
        case 'getSequence':
            await handleGetSequence(component, msg);
            break;
        case 'getThrottleStatus':
            await handleGetThrottleStatus(component);
            break;
        case 'saveSequence':
            await handleSaveSequence(component, msg);
            break;
        default:
            console.warn('B2B_OUTREACH: Unknown action:', msg.action);
    }
}

async function handleGetSequences(component, msg) {
    try {
        const filters = {};
        if (msg.status) filters.status = msg.status;
        const sequences = await listSequences(filters);
        safeSend(component, { action: 'sequencesLoaded', payload: sequences });
    } catch (error) {
        console.error('B2B_OUTREACH: getSequences error:', error);
        safeSend(component, { action: 'actionError', message: 'Failed to load sequences.' });
    }
}

async function handleGetSequence(component, msg) {
    try {
        if (!msg.sequenceId) {
            safeSend(component, { action: 'actionError', message: 'Sequence ID required.' });
            return;
        }
        const result = await getSequence(msg.sequenceId);
        safeSend(component, { action: 'sequenceLoaded', payload: result });
    } catch (error) {
        console.error('B2B_OUTREACH: getSequence error:', error);
        safeSend(component, { action: 'actionError', message: 'Failed to load sequence.' });
    }
}

async function handleGetThrottleStatus(component) {
    try {
        const [email, sms, call] = await Promise.all([
            checkThrottleLimits('email'),
            checkThrottleLimits('sms'),
            checkThrottleLimits('call')
        ]);
        const quietHours = isQuietHours();

        safeSend(component, {
            action: 'throttleStatus',
            payload: { email, sms, call, quietHours }
        });
    } catch (error) {
        console.error('B2B_OUTREACH: getThrottleStatus error:', error);
        // Non-critical, don't send error to HTML
    }
}

async function handleSaveSequence(component, msg) {
    try {
        const { sequenceId, name, channels, steps } = msg;
        if (!name) {
            safeSend(component, { action: 'actionError', message: 'Sequence name required.' });
            return;
        }

        const channelMix = (channels || []).join(',');
        let savedId;

        if (sequenceId) {
            await updateSequence(sequenceId, { name, channel_mix: channelMix });
            savedId = sequenceId;
        } else {
            const created = await createSequence({ name, channel_mix: channelMix });
            savedId = created._id || created.id;
        }

        // Save steps
        if (Array.isArray(steps)) {
            for (const step of steps) {
                await addStep({
                    sequence_id: savedId,
                    step_type: step.step_type || 'email',
                    subject: step.subject || '',
                    template: step.template || '',
                    delay_hours: step.delay_hours || 24,
                    step_order: step.step_order || 1
                });
            }
        }

        safeSend(component, { action: 'sequenceSaved' });
    } catch (error) {
        console.error('B2B_OUTREACH: saveSequence error:', error);
        safeSend(component, { action: 'actionError', message: 'Failed to save sequence.' });
    }
}
