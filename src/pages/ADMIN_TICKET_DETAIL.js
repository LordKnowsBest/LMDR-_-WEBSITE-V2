import wixLocation from 'wix-location';
import {
    getTicket,
    updateTicket,
    assignTicket,
    changeTicketStatus,
    addTicketComment,
    escalateTicket
} from 'backend/supportTicketService.jsw';
import { getAdminList } from 'backend/admin_audit_service.jsw';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

$w.onReady(async function () {
    const components = getHtmlComponents();
    const query = wixLocation.query;
    const ticketId = query.id;

    if (!ticketId) {
        console.error('ADMIN_TICKET_DETAIL: No ticket ID provided');
        return;
    }

    if (!components.length) {
        console.warn('ADMIN_TICKET_DETAIL: No HTML component found');
        return;
    }

    // Fetch initial data
    const [ticketData, admins] = await Promise.all([
        getTicket(ticketId),
        getAdminList()
    ]);

    for (const component of components) {
        component.onMessage(async (event) => {
            await routeMessage(component, event?.data);
        });

        // Send data to HTML
        safeSend(component, { 
            action: 'init', 
            payload: { 
                ...ticketData,
                admins: admins.map(a => ({ email: a, id: a })) // Simplified for now
            } 
        });
    }
});

function getHtmlComponents() {
    const found = [];
    for (const id of HTML_COMPONENT_IDS) {
        try {
            const component = $w(id);
            if (component && typeof component.onMessage === 'function') found.push(component);
        } catch (error) {}
    }
    return found;
}

async function routeMessage(component, message) {
    if (!message?.action) return;
    const { action } = message;

    try {
        switch (action) {
            case 'refresh':
                const data = await getTicket(message.ticketId);
                safeSend(component, { action: 'ticketLoaded', payload: data });
                break;
            case 'assignTicket':
                await assignTicket(message.ticketId, message.agentId);
                safeSend(component, { action: 'actionSuccess', message: 'Agent assigned' });
                break;
            case 'updateStatus':
                await changeTicketStatus(message.ticketId, message.status);
                safeSend(component, { action: 'actionSuccess', message: 'Status updated' });
                break;
            case 'addComment':
                await addTicketComment(message.ticketId, message.content, message.isInternal);
                safeSend(component, { action: 'actionSuccess', message: 'Message sent' });
                const updated = await getTicket(message.ticketId);
                safeSend(component, { action: 'ticketLoaded', payload: updated });
                break;
            case 'escalateTicket':
                await escalateTicket(message.ticketId, message.reason);
                safeSend(component, { action: 'actionSuccess', message: 'Ticket escalated' });
                break;
        }
    } catch (error) {
        safeSend(component, { action: 'actionError', message: error.message });
    }
}

function safeSend(component, data) {
    try {
        if (component && typeof component.postMessage === 'function') {
            component.postMessage(data);
        }
    } catch (error) {}
}
