/**
 * Ticket PostMessage Bridge
 */
const TicketBridge = {
    init() {
        window.addEventListener('message', (event) => {
            const { action, payload, message } = event.data;
            if (!action) return;

            switch (action) {
                case 'init':
                    if (payload && payload.userId) TICKET_STATE.currentUserId = payload.userId;
                    TicketUI.refresh();
                    break;
                case 'ticketsLoaded':
                    TicketUI.handleTicketsLoaded(payload);
                    break;
                case 'ticketCreated':
                    TicketUI.handleActionSuccess('Ticket created successfully');
                    TicketUI.closeCreateModal();
                    TicketUI.refresh();
                    break;
                case 'actionSuccess':
                    TicketUI.handleActionSuccess(message);
                    TicketUI.refresh();
                    break;
                case 'actionError':
                    TicketUI.handleActionError(message);
                    break;
            }
        });
    },

    send(action, payload = {}) {
        window.parent.postMessage({ action, ...payload }, '*');
    },

    getTickets(filters, pagination, sort) {
        this.send('getTicketsList', { filters, pagination, sort });
    },

    createTicket(ticketData) {
        this.send('createTicket', { ticketData });
    },

    assignToMe(ticketId) {
        if (!TICKET_STATE.currentUserId) {
            console.error('No current user ID for assignment');
            return;
        }
        this.send('assignTicket', { ticketId, agentId: TICKET_STATE.currentUserId });
    }
};
