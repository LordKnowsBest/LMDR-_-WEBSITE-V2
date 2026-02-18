/**
 * Ticket System Configuration & Constants
 */
const TICKET_CONFIG = {
    ENDPOINTS: {
        GET_TICKETS: 'getTicketsList',
        CREATE_TICKET: 'createTicket',
        UPDATE_TICKET: 'updateTicket',
        ASSIGN_TICKET: 'assignTicket',
        GET_TICKET: 'getTicket'
    },
    STATUS_MAP: {
        'open': { label: 'Open', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
        'pending': { label: 'Pending', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
        'resolved': { label: 'Resolved', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
        'closed': { label: 'Closed', color: 'bg-slate-500/10 text-slate-500 border-slate-500/20' }
    },
    PRIORITY_MAP: {
        'urgent': { label: 'Urgent', color: 'text-rose-500 bg-rose-500/10', icon: 'error' },
        'high': { label: 'High', color: 'text-orange-500 bg-orange-500/10', icon: 'priority_high' },
        'medium': { label: 'Medium', color: 'text-amber-500 bg-amber-500/10', icon: 'remove' },
        'low': { label: 'Low', color: 'text-emerald-500 bg-emerald-500/10', icon: 'keyboard_arrow_down' }
    },
    CATEGORY_LABELS: {
        'general': 'General',
        'billing': 'Billing',
        'technical': 'Technical',
        'carrier': 'Carrier Issue'
    },
    PAGINATION: {
        DEFAULT_SIZE: 15
    }
};

let TICKET_STATE = {
    tickets: [],
    totalCount: 0,
    currentPage: 1,
    pageSize: 15,
    filters: {
        status: 'all',
        priority: 'all',
        category: 'all',
        search: '',
        queue: 'all'
    },
    sort: { field: 'created_at', direction: 'desc' },
    loading: false,
    currentUserId: null
};
