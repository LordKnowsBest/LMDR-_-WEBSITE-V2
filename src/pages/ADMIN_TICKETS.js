import wixLocation from 'wix-location';
import { currentMember } from 'wix-members';
import {
    getTicketsList,
    createTicket,
    updateTicket,
    assignTicket,
    changeTicketStatus,
    addTicketComment,
    escalateTicket,
    getTicketMetrics,
    getSLACompliance,
    getAgentPerformance
} from 'backend/supportTicketService.jsw';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

$w.onReady(async function () {
    const components = getHtmlComponents();

    if (!components.length) {
        console.warn('ADMIN_TICKETS: No HTML component found');
        return;
    }

    // Get current user info to pass to the HTML component
    let currentUser = null;
    try {
        const member = await currentMember.getMember();
        if (member) {
            currentUser = {
                userId: member._id,
                email: member.loginEmail,
                name: member.contactDetails?.firstName || 'Admin'
            };
        }
    } catch (e) {
        console.warn('ADMIN_TICKETS: Failed to get member info', e);
    }

    for (const component of components) {
        component.onMessage(async (event) => {
            await routeMessage(component, event?.data);
        });

        // Send init signal with current user info
        safeSend(component, { action: 'init', payload: currentUser });
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
            case 'getTicketsList':
                await handleGetTicketsList(component, message.filters, message.pagination, message.sort);
                break;

            case 'createTicket':
                await handleCreateTicket(component, message.ticketData);
                break;

            case 'assignTicket':
                await handleAssignTicket(component, message.ticketId, message.agentId);
                break;

            case 'changeTicketStatus':
                await handleChangeTicketStatus(component, message.ticketId, message.status, message.reason);
                break;
            case 'updateTicket':
                await handleUpdateTicket(component, message.ticketId, message.updates || {});
                break;
            case 'addTicketComment':
                await handleAddTicketComment(component, message.ticketId, message.content, Boolean(message.isInternal));
                break;
            case 'escalateTicket':
                await handleEscalateTicket(component, message.ticketId, message.reason || '');
                break;
            case 'getTicketMetrics':
                await handleGetTicketMetrics(component, message.dateRange || {});
                break;
            case 'getSLACompliance':
                await handleGetSLACompliance(component, message.dateRange || {});
                break;
            case 'getAgentPerformance':
                await handleGetAgentPerformance(component, message.agentId, message.dateRange || {});
                break;

            default:
                console.warn('ADMIN_TICKETS: Unknown action:', action);
        }
    } catch (error) {
        console.error('ADMIN_TICKETS: Error handling action', action, error);
        safeSend(component, {
            action: 'actionError',
            message: error.message || 'An unexpected error occurred'
        });
    }
}

// ============================================
// MESSAGE HANDLERS
// ============================================

async function handleGetTicketsList(component, filters, pagination, sort) {
    const result = await getTicketsList({ filters, pagination, sort });
    safeSend(component, { action: 'ticketsLoaded', payload: result });
}

async function handleCreateTicket(component, ticketData) {
    const result = await createTicket(ticketData);
    if (result.success) {
        safeSend(component, { action: 'ticketCreated', payload: result.record });
    } else {
        safeSend(component, { action: 'actionError', message: result.error });
    }
}

async function handleAssignTicket(component, ticketId, agentId) {
    const result = await assignTicket(ticketId, agentId);
    if (result.success) {
        safeSend(component, { action: 'actionSuccess', message: 'Ticket assigned successfully' });
    } else {
        safeSend(component, { action: 'actionError', message: result.error });
    }
}

async function handleChangeTicketStatus(component, ticketId, status, reason) {
    const result = await changeTicketStatus(ticketId, status, reason);
    if (result.success) {
        safeSend(component, { action: 'actionSuccess', message: `Status updated to ${status}` });
    } else {
        safeSend(component, { action: 'actionError', message: result.error });
    }
}

async function handleUpdateTicket(component, ticketId, updates) {
    const result = await updateTicket(ticketId, updates);
    if (result.success) {
        safeSend(component, { action: 'ticketUpdated', payload: result.record });
    } else {
        safeSend(component, { action: 'actionError', message: result.error });
    }
}

async function handleAddTicketComment(component, ticketId, content, isInternal) {
    const result = await addTicketComment(ticketId, content, isInternal);
    if (result.success) {
        safeSend(component, { action: 'ticketCommentAdded', payload: result.record });
    } else {
        safeSend(component, { action: 'actionError', message: result.error });
    }
}

async function handleEscalateTicket(component, ticketId, reason) {
    const result = await escalateTicket(ticketId, reason);
    if (result.success) {
        safeSend(component, { action: 'ticketEscalated', payload: result.record || { ticketId } });
    } else {
        safeSend(component, { action: 'actionError', message: result.error });
    }
}

async function handleGetTicketMetrics(component, dateRange) {
    const result = await getTicketMetrics(dateRange);
    safeSend(component, { action: 'ticketMetricsLoaded', payload: result });
}

async function handleGetSLACompliance(component, dateRange) {
    const result = await getSLACompliance(dateRange);
    safeSend(component, { action: 'slaComplianceLoaded', payload: result });
}

async function handleGetAgentPerformance(component, agentId, dateRange) {
    const result = await getAgentPerformance(agentId, dateRange);
    safeSend(component, { action: 'agentPerformanceLoaded', payload: result });
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
        console.error('ADMIN_TICKETS: Failed to postMessage:', error);
    }
}
