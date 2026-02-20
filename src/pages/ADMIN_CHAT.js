import wixLocation from 'wix-location';
import {
    getChatQueue,
    getAgentActiveChats,
    assignChatToAgent,
    sendChatMessage,
    getChatMessagesSince,
    endChatSession,
    convertChatToTicket,
    getCannedResponses,
    getChatHistory,
    updateCannedResponse,
    getChatMetrics,
    getAgentChatStats
} from 'backend/chatSupportService.jsw';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

$w.onReady(async function () {
    const components = getHtmlComponents();

    if (!components.length) {
        console.warn('ADMIN_CHAT: No HTML component found');
        return;
    }

    for (const component of components) {
        component.onMessage(async (event) => {
            await routeMessage(component, event?.data);
        });

        // Send init signal
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
            // skip
        }
    }
    return found;
}

/**
 * Route incoming messages
 */
async function routeMessage(component, message) {
    if (!message?.action) return;

    const { action } = message;

    if (action === 'navigateTo') {
        if (message.destination) wixLocation.to(`/${message.destination}`);
        return;
    }

    try {
        switch (action) {
            case 'getChatQueue':
                await handleGetChatQueue(component);
                break;

            case 'getAgentActiveChats':
                await handleGetAgentActiveChats(component, message.agentId);
                break;

            case 'assignChat':
                await handleAssignChat(component, message.sessionId, message.agentId);
                break;

            case 'sendChatMessage':
                await handleSendChatMessage(component, message.sessionId, message.content, message.senderType);
                break;

            case 'getMessages':
                await handleGetMessages(component, message.sessionId, message.lastTimestamp);
                break;

            case 'endChat':
                await handleEndChat(component, message.sessionId, message.rating);
                break;

            case 'convertToTicket':
                await handleConvertToTicket(component, message.sessionId);
                break;

            case 'getCannedResponses':
                await handleGetCannedResponses(component, message.category);
                break;
            case 'getChatHistory':
                await handleGetChatHistory(component, message.sessionId);
                break;
            case 'updateCannedResponse':
                await handleUpdateCannedResponse(component, message.responseId, message.updates || {});
                break;
            case 'getChatMetrics':
                await handleGetChatMetrics(component, message.dateRange || {});
                break;
            case 'getAgentChatStats':
                await handleGetAgentChatStats(component, message.agentId, message.dateRange || {});
                break;

            default:
                console.warn('ADMIN_CHAT: Unknown action:', action);
        }
    } catch (error) {
        console.error('ADMIN_CHAT: Error handling action', action, error);
        safeSend(component, {
            action: 'actionError',
            message: error.message || 'An unexpected error occurred'
        });
    }
}

// ============================================
// MESSAGE HANDLERS
// ============================================

async function handleGetChatQueue(component) {
    const result = await getChatQueue();
    safeSend(component, { action: 'chatQueueLoaded', payload: result.items });
}

async function handleGetAgentActiveChats(component, agentId) {
    const result = await getAgentActiveChats(agentId);
    safeSend(component, { action: 'activeChatsLoaded', payload: result.items });
}

async function handleAssignChat(component, sessionId, agentId) {
    const result = await assignChatToAgent(sessionId, agentId);
    if (result.success) {
        safeSend(component, { action: 'actionSuccess', message: 'Chat assigned successfully' });
    } else {
        safeSend(component, { action: 'actionError', message: result.error });
    }
}

async function handleSendChatMessage(component, sessionId, content, senderType) {
    const result = await sendChatMessage(sessionId, content, senderType || 'agent');
    if (result.success) {
        safeSend(component, { action: 'messageSent', payload: result.record });
    } else {
        safeSend(component, { action: 'actionError', message: result.error });
    }
}

async function handleGetMessages(component, sessionId, lastTimestamp) {
    const result = await getChatMessagesSince(sessionId, lastTimestamp);
    safeSend(component, { action: 'messagesLoaded', payload: result.items });
}

async function handleEndChat(component, sessionId, rating) {
    const result = await endChatSession(sessionId, rating);
    if (result.success) {
        safeSend(component, { action: 'actionSuccess', message: 'Chat session ended' });
    } else {
        safeSend(component, { action: 'actionError', message: result.error });
    }
}

async function handleConvertToTicket(component, sessionId) {
    const result = await convertChatToTicket(sessionId);
    if (result.success) {
        safeSend(component, { action: 'actionSuccess', message: `Converted to Ticket ${result.record.ticket_number}` });
    } else {
        safeSend(component, { action: 'actionError', message: result.error });
    }
}

async function handleGetCannedResponses(component, category) {
    const result = await getCannedResponses(category);
    safeSend(component, { action: 'cannedResponsesLoaded', payload: result.items });
}

async function handleGetChatHistory(component, sessionId) {
    const result = await getChatHistory(sessionId);
    safeSend(component, { action: 'chatHistoryLoaded', payload: result });
}

async function handleUpdateCannedResponse(component, responseId, updates) {
    const result = await updateCannedResponse(responseId, updates);
    if (result.success) {
        safeSend(component, { action: 'cannedResponseUpdated', payload: result.record });
    } else {
        safeSend(component, { action: 'actionError', message: result.error });
    }
}

async function handleGetChatMetrics(component, dateRange) {
    const result = await getChatMetrics(dateRange);
    safeSend(component, { action: 'chatMetricsLoaded', payload: result });
}

async function handleGetAgentChatStats(component, agentId, dateRange) {
    const result = await getAgentChatStats(agentId, dateRange);
    safeSend(component, { action: 'agentChatStatsLoaded', payload: result });
}

// ============================================
// UTILITY
// ============================================

function safeSend(component, data) {
    try {
        if (component && typeof component.postMessage === 'function') {
            component.postMessage(data);
        }
    } catch (error) {
        console.error('ADMIN_CHAT: Failed to postMessage:', error);
    }
}
