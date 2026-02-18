/**
 * Ticket DOM Rendering Engine
 */
const TicketRender = {
    renderTable(tickets) {
        const body = document.getElementById('ticketTableBody');
        if (!tickets || tickets.length === 0) {
            body.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-12 text-center text-slate-500">
                        <div class="flex flex-col items-center gap-2">
                            <span class="material-symbols-outlined text-4xl opacity-20">inbox</span>
                            <p class="text-sm font-medium">No tickets found matching your criteria.</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        body.innerHTML = tickets.map(ticket => this.renderRow(ticket)).join('');
    },

    renderRow(ticket) {
        const status = TICKET_CONFIG.STATUS_MAP[ticket.status] || TICKET_CONFIG.STATUS_MAP.open;
        const priority = TICKET_CONFIG.PRIORITY_MAP[ticket.priority] || TICKET_CONFIG.PRIORITY_MAP.medium;
        const createdAt = new Date(ticket.created_at).toLocaleDateString();
        
        // SLA Logic
        const slaStatus = this.getSLAStatus(ticket);
        const slaLabel = this.getSLALabel(ticket);

        return `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800/50 transition-colors group">
                <td class="px-4 py-4 ${slaStatus.border} transition-all">
                    <div class="flex flex-col">
                        <span class="text-xs font-bold text-slate-400 mb-0.5 tracking-tight">${ticket.ticket_number}</span>
                        <a href="ADMIN_TICKET_DETAIL.html?id=${ticket._id}" class="text-sm font-semibold hover:text-lmdr-blue hover:underline decoration-2 underline-offset-4 transition-all">
                            ${ticket.subject}
                        </a>
                        <span class="text-[10px] text-slate-400 mt-1">${TICKET_CONFIG.CATEGORY_LABELS[ticket.category] || 'General'}</span>
                    </div>
                </td>
                <td class="px-4 py-4">
                    <div class="flex flex-col">
                        <span class="text-sm font-medium truncate max-w-[150px]">${ticket.user_email}</span>
                        <span class="text-[10px] text-slate-400 uppercase tracking-wider">${ticket.user_role}</span>
                    </div>
                </td>
                <td class="px-4 py-4">
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${status.color}">
                        ${status.label}
                    </span>
                </td>
                <td class="px-4 py-4">
                    <div class="flex items-center gap-1.5 ${priority.color.split(' ')[0]}">
                        <span class="material-symbols-outlined text-[16px]">${priority.icon}</span>
                        <span class="text-[10px] font-bold uppercase tracking-wider">${priority.label}</span>
                    </div>
                </td>
                <td class="px-4 py-4">
                    <div class="flex flex-col">
                        <span class="text-[11px] font-bold ${slaStatus.text}">${slaLabel}</span>
                        <span class="text-[10px] text-slate-400">${createdAt}</span>
                    </div>
                </td>
                <td class="px-4 py-4 text-right">
                    <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="TicketUI.assignToMe('${ticket._id}')" class="p-2 hover:bg-lmdr-blue hover:text-white rounded-lg transition-all" title="Assign to Me">
                            <span class="material-symbols-outlined text-[18px]">person_add</span>
                        </button>
                        <a href="ADMIN_TICKET_DETAIL.html?id=${ticket._id}" class="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-all" title="View Detail">
                            <span class="material-symbols-outlined text-[18px]">visibility</span>
                        </a>
                    </div>
                </td>
            </tr>
        `;
    },

    getSLAStatus(ticket) {
        if (ticket.status === 'resolved' || ticket.status === 'closed') return { border: 'sla-healthy', text: 'text-emerald-500' };
        
        const now = new Date();
        const due = new Date(ticket.resolution_due);
        const hoursLeft = (due - now) / (1000 * 60 * 60);

        if (hoursLeft < 0) return { border: 'sla-critical', text: 'text-rose-500' };
        if (hoursLeft < 4) return { border: 'sla-warning', text: 'text-amber-500' };
        return { border: 'sla-healthy', text: 'text-emerald-500' };
    },

    getSLALabel(ticket) {
        if (ticket.status === 'resolved' || ticket.status === 'closed') return 'Completed';
        
        const now = new Date();
        const due = new Date(ticket.resolution_due);
        const hoursLeft = (due - now) / (1000 * 60 * 60);

        if (hoursLeft < 0) return `Overdue by ${Math.abs(Math.floor(hoursLeft))}h`;
        if (hoursLeft < 24) return `Due in ${Math.floor(hoursLeft)}h`;
        return `Due in ${Math.floor(hoursLeft / 24)}d`;
    },

    updatePagination(totalCount, page, size) {
        const info = document.getElementById('paginationInfo');
        const start = (page - 1) * size + 1;
        const end = Math.min(page * size, totalCount);
        
        info.textContent = `Showing ${totalCount > 0 ? start : 0}-${end} of ${totalCount} tickets`;
        
        document.getElementById('prevBtn').disabled = page <= 1;
        document.getElementById('nextBtn').disabled = end >= totalCount;
    }
};
