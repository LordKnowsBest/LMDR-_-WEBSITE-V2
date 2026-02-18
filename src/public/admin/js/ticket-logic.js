/**
 * Ticket UI Controller
 */
const TicketUI = {
    init() {
        TicketBridge.init();
        this.updateTabs();
    },

    refresh() {
        TICKET_STATE.loading = true;
        this.showSkeleton();
        
        // Prepare filters: if queue is 'mine', add assigned_to filter
        const filters = { ...TICKET_STATE.filters };
        if (filters.queue === 'mine' && TICKET_STATE.currentUserId) {
            filters.assigned_to = TICKET_STATE.currentUserId;
        } else if (filters.queue === 'unassigned') {
            filters.assigned_to = null;
        } else if (filters.queue === 'urgent') {
            filters.priority = 'urgent';
        }

        TicketBridge.getTickets(
            filters,
            { page: TICKET_STATE.currentPage, pageSize: TICKET_STATE.pageSize },
            TICKET_STATE.sort
        );
    },

    handleTicketsLoaded(payload) {
        TICKET_STATE.loading = false;
        TICKET_STATE.tickets = payload.items || [];
        TICKET_STATE.totalCount = payload.totalCount || 0;
        
        TicketRender.renderTable(TICKET_STATE.tickets);
        TicketRender.updatePagination(TICKET_STATE.totalCount, TICKET_STATE.currentPage, TICKET_STATE.pageSize);
    },

    setQueue(queue) {
        TICKET_STATE.filters.queue = queue;
        TICKET_STATE.currentPage = 1;
        this.updateTabs();
        this.refresh();
    },

    updateTabs() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            const isActive = btn.dataset.queue === TICKET_STATE.filters.queue;
            btn.classList.toggle('bg-white', isActive);
            btn.classList.toggle('dark:bg-slate-700', isActive);
            btn.classList.toggle('shadow-sm', isActive);
            btn.classList.toggle('text-lmdr-blue', isActive && btn.dataset.queue !== 'urgent');
            btn.classList.toggle('text-slate-600', !isActive && btn.dataset.queue !== 'urgent');
            btn.classList.toggle('dark:text-slate-400', !isActive && btn.dataset.queue !== 'urgent');
        });
    },

    toggleFilters() {
        const panel = document.getElementById('filterPanel');
        panel.classList.toggle('hidden');
    },

    applyFilter(key, value) {
        TICKET_STATE.filters[key] = value;
        TICKET_STATE.currentPage = 1;
        this.refresh();
    },

    resetFilters() {
        TICKET_STATE.filters = {
            status: 'all',
            priority: 'all',
            category: 'all',
            search: '',
            queue: TICKET_STATE.filters.queue
        };
        document.getElementById('ticketSearch').value = '';
        this.refresh();
    },

    debouncedSearch() {
        clearTimeout(this.searchTimer);
        this.searchTimer = setTimeout(() => {
            const val = document.getElementById('ticketSearch').value;
            TICKET_STATE.filters.search = val;
            TICKET_STATE.currentPage = 1;
            this.refresh();
        }, 400);
    },

    nextPage() {
        TICKET_STATE.currentPage++;
        this.refresh();
    },

    prevPage() {
        if (TICKET_STATE.currentPage > 1) {
            TICKET_STATE.currentPage--;
            this.refresh();
        }
    },

    assignToMe(ticketId) {
        TicketBridge.assignToMe(ticketId);
    },

    openCreateModal() {
        document.getElementById('createModal').classList.remove('hidden');
    },

    closeCreateModal() {
        document.getElementById('createModal').classList.add('hidden');
    },

    handleCreate(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const data = {
            subject: formData.get('subject'),
            priority: formData.get('priority'),
            category: formData.get('category'),
            description: formData.get('description')
        };
        
        TicketBridge.createTicket(data);
    },

    handleActionSuccess(msg) {
        // In a real implementation, we might show a nice toast. 
        // For now, console log and reload suffice.
        console.log('Action Success:', msg);
    },

    handleActionError(msg) {
        alert('Error: ' + msg);
    },

    showSkeleton() {
        const body = document.getElementById('ticketTableBody');
        body.innerHTML = Array(5).fill(0).map(() => `
            <tr class="animate-pulse">
                <td class="px-4 py-6"><div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div></td>
                <td class="px-4 py-6"><div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div></td>
                <td class="px-4 py-6"><div class="h-8 bg-slate-200 dark:bg-slate-800 rounded-full w-16"></div></td>
                <td class="px-4 py-6"><div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-12"></div></td>
                <td class="px-4 py-6"><div class="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20"></div></td>
                <td class="px-4 py-6 text-right"><div class="h-8 bg-slate-200 dark:bg-slate-800 rounded w-8 ml-auto"></div></td>
            </tr>
        `).join('');
    }
};
