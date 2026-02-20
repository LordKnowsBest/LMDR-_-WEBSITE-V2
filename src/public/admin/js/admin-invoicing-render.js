/* =========================================
   ADMIN INVOICING — Render Module
   Depends on: InvoicingConfig
   All DOM rendering / display functions
   ========================================= */
var InvoicingRender = (function () {
  'use strict';

  function formatCurrency(amount) {
    return '$' + Number(amount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function showToast(message, type) {
    var container = document.getElementById('toastContainer');
    var toast = document.createElement('div');
    var colors = { success: 'bg-green-600', error: 'bg-red-600', info: 'bg-blue-600' };
    var t = type || 'info';
    toast.className = 'toast px-4 py-3 rounded-lg text-sm font-medium ' + (colors[t] || colors.info) + ' shadow-lg';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 4000);
  }

  function parseLineItems(inv) {
    if (typeof inv.line_items === 'string') {
      try { return JSON.parse(inv.line_items || '[]'); } catch (e) { return []; }
    }
    return inv.line_items || [];
  }

  function renderInvoiceList(data, onRowClick) {
    var loading = document.getElementById('invoiceListLoading');
    var table = document.getElementById('invoiceTable');
    var empty = document.getElementById('emptyState');
    var tbody = document.getElementById('invoiceTableBody');
    var pag = document.getElementById('pagination');

    loading.classList.add('hidden');
    var invoices = data.invoices || [];

    if (invoices.length === 0) {
      table.classList.add('hidden');
      pag.classList.add('hidden');
      empty.classList.remove('hidden');
      return { invoices: invoices, totalPages: 1, currentPage: 1 };
    }

    empty.classList.add('hidden');
    table.classList.remove('hidden');
    tbody.innerHTML = '';

    invoices.forEach(function (inv) {
      var tr = document.createElement('tr');
      tr.className = 'border-b border-slate-700/30 hover:bg-slate-800/50 cursor-pointer transition';
      tr.onclick = function () { onRowClick(inv._id); };
      tr.innerHTML =
        '<td class="py-3 px-3 font-mono text-xs">' + (inv.invoice_number || '-') + '</td>' +
        '<td class="py-3 px-3 text-slate-300">' + (inv.carrier_dot || '-') + '</td>' +
        '<td class="py-3 px-3 text-right font-medium">' + formatCurrency(inv.total) + '</td>' +
        '<td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full text-xs font-medium status-' + inv.status + '">' + inv.status + '</span></td>' +
        '<td class="py-3 px-3 text-slate-400 text-xs">' + (inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '-') + '</td>' +
        '<td class="py-3 px-3 text-slate-400 text-xs">' + (inv.sent_date ? new Date(inv.sent_date).toLocaleDateString() : '-') + '</td>' +
        '<td class="py-3 px-3 text-right" onclick="event.stopPropagation()">' +
          '<div class="flex items-center justify-end gap-1">' +
            (inv.status === 'draft' ? '<button onclick="InvoicingLogic.sendInvoiceAction(\'' + inv._id + '\')" class="touch-target p-1.5 hover:bg-blue-900/50 rounded-lg transition" title="Send"><span class="material-symbols-outlined text-[18px] text-blue-400">send</span></button>' : '') +
            (inv.status === 'sent' || inv.status === 'overdue' ? '<button onclick="InvoicingLogic.showPaymentModal(\'' + inv._id + '\')" class="touch-target p-1.5 hover:bg-green-900/50 rounded-lg transition" title="Record Payment"><span class="material-symbols-outlined text-[18px] text-green-400">payments</span></button>' : '') +
            (inv.status !== 'void' && inv.status !== 'paid' ? '<button onclick="InvoicingLogic.showVoidModal(\'' + inv._id + '\')" class="touch-target p-1.5 hover:bg-red-900/50 rounded-lg transition" title="Void"><span class="material-symbols-outlined text-[18px] text-red-400">block</span></button>' : '') +
            '<button onclick="InvoicingLogic.viewPDF(\'' + inv._id + '\')" class="touch-target p-1.5 hover:bg-slate-700 rounded-lg transition" title="Preview PDF"><span class="material-symbols-outlined text-[18px] text-slate-400">picture_as_pdf</span></button>' +
          '</div>' +
        '</td>';
      tbody.appendChild(tr);
    });

    // Pagination
    var totalCount = data.totalCount || 0;
    var pageSize = data.pageSize || 20;
    var totalPages = Math.ceil(totalCount / pageSize) || 1;
    var currentPage = data.page || 1;
    if (totalCount > pageSize) {
      pag.classList.remove('hidden');
      document.getElementById('pageInfo').textContent = 'Page ' + currentPage + ' of ' + totalPages + ' (' + totalCount + ' invoices)';
      document.getElementById('btnPrev').disabled = currentPage <= 1;
      document.getElementById('btnNext').disabled = currentPage >= totalPages;
    } else {
      pag.classList.add('hidden');
    }

    return { invoices: invoices, totalPages: totalPages, currentPage: currentPage };
  }

  function renderStats(data) {
    if (!data || !data.stats) return;
    document.getElementById('statOutstanding').textContent = formatCurrency(data.totalOutstanding || 0);
    document.getElementById('statOverdueCount').textContent = data.stats.overdue ? data.stats.overdue.count : 0;

    var countMap = { All: 0, Draft: 0, Sent: 0, Paid: 0, Overdue: 0, Void: 0 };
    var statusKeys = Object.keys(data.stats);
    for (var i = 0; i < statusKeys.length; i++) {
      var status = statusKeys[i];
      var info = data.stats[status];
      var cap = status.charAt(0).toUpperCase() + status.slice(1);
      countMap[cap] = info.count;
      countMap.All += info.count;
    }
    document.getElementById('countAll').textContent = countMap.All || '';
    document.getElementById('countDraft').textContent = countMap.Draft || '';
    document.getElementById('countSent').textContent = countMap.Sent || '';
    document.getElementById('countPaid').textContent = countMap.Paid || '';
    document.getElementById('countOverdue').textContent = countMap.Overdue || '';
    document.getElementById('countVoid').textContent = countMap.Void || '';
  }

  function renderInvoiceDetail(data) {
    if (!data || !data.invoice) return;
    var inv = data.invoice;
    var lineItems = parseLineItems(inv);
    var dc = document.getElementById('detailContent');
    document.getElementById('detailTitle').textContent = inv.invoice_number || 'Invoice Detail';

    var statusCls = InvoicingConfig.STATUS_COLORS[inv.status] || 'bg-slate-700 text-slate-300';

    dc.innerHTML =
      '<div class="space-y-6">' +
        '<div class="flex items-center justify-between">' +
          '<span class="px-3 py-1 rounded-full text-sm font-medium ' + statusCls + '">' + inv.status + '</span>' +
          '<div class="flex gap-2">' +
            (inv.status === 'draft' ? '<button onclick="InvoicingLogic.sendInvoiceAction(\'' + inv._id + '\')" class="px-3 py-1.5 text-xs bg-blue-600 rounded-lg hover:bg-blue-700 transition">Send</button>' : '') +
            (inv.status === 'sent' || inv.status === 'overdue' ? '<button onclick="InvoicingLogic.showPaymentModal(\'' + inv._id + '\')" class="px-3 py-1.5 text-xs bg-green-600 rounded-lg hover:bg-green-700 transition">Record Payment</button>' : '') +
            (inv.status !== 'void' && inv.status !== 'paid' ? '<button onclick="InvoicingLogic.showVoidModal(\'' + inv._id + '\')" class="px-3 py-1.5 text-xs bg-red-600 rounded-lg hover:bg-red-700 transition">Void</button>' : '') +
            '<button onclick="InvoicingLogic.viewPDF(\'' + inv._id + '\')" class="px-3 py-1.5 text-xs bg-slate-700 rounded-lg hover:bg-slate-600 transition">Preview PDF</button>' +
          '</div>' +
        '</div>' +
        '<div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">' +
          '<div class="flex justify-between items-start">' +
            '<div>' +
              '<div class="flex items-center gap-2 mb-1">' +
                '<div class="w-6 h-6 rounded bg-lmdr-blue flex items-center justify-center text-[10px] font-bold">VM</div>' +
                '<span class="font-bold">VelocityMatch</span>' +
              '</div>' +
              '<p class="text-xs text-slate-400">Last Mile Driver Recruiting</p>' +
            '</div>' +
            '<div class="text-right">' +
              '<p class="font-mono font-bold">' + inv.invoice_number + '</p>' +
              '<p class="text-xs text-slate-400 mt-1">Date: ' + (inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString() : '-') + '</p>' +
              '<p class="text-xs text-slate-400">Due: ' + (inv.due_date ? new Date(inv.due_date).toLocaleDateString() : '-') + '</p>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div>' +
          '<p class="text-xs text-slate-400 uppercase mb-1">Bill To</p>' +
          '<p class="font-medium">Carrier DOT: ' + inv.carrier_dot + '</p>' +
        '</div>' +
        '<div class="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">' +
          '<table class="w-full text-sm">' +
            '<thead><tr class="text-xs text-slate-400 uppercase border-b border-slate-700/50">' +
              '<th class="py-2 px-3 text-left">Description</th>' +
              '<th class="py-2 px-3 text-center">Qty</th>' +
              '<th class="py-2 px-3 text-right">Price</th>' +
              '<th class="py-2 px-3 text-right">Total</th>' +
            '</tr></thead>' +
            '<tbody>' + lineItems.map(function (li) {
              return '<tr class="border-b border-slate-700/30">' +
                '<td class="py-2 px-3">' + li.description + '</td>' +
                '<td class="py-2 px-3 text-center">' + li.quantity + '</td>' +
                '<td class="py-2 px-3 text-right">' + formatCurrency(li.unit_price) + '</td>' +
                '<td class="py-2 px-3 text-right">' + formatCurrency(li.quantity * li.unit_price) + '</td>' +
              '</tr>';
            }).join('') + '</tbody>' +
          '</table>' +
        '</div>' +
        '<div class="space-y-2 text-sm">' +
          '<div class="flex justify-between"><span class="text-slate-400">Subtotal</span><span>' + formatCurrency(inv.subtotal) + '</span></div>' +
          '<div class="flex justify-between"><span class="text-slate-400">Discount</span><span class="text-red-400">-' + formatCurrency(inv.discount_amount || 0) + '</span></div>' +
          '<div class="flex justify-between text-lg font-bold border-t border-slate-700/50 pt-2"><span>Total</span><span>' + formatCurrency(inv.total) + '</span></div>' +
        '</div>' +
        (inv.notes ? '<div class="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50"><p class="text-xs text-slate-400 uppercase mb-1">Notes</p><p class="text-sm">' + inv.notes + '</p></div>' : '') +
        '<div>' +
          '<p class="text-xs text-slate-400 uppercase mb-3">Timeline</p>' +
          '<div class="space-y-3">' +
            '<div class="flex items-center gap-3"><div class="w-2 h-2 rounded-full bg-green-400"></div><span class="text-xs text-slate-300">Created</span><span class="text-xs text-slate-500 ml-auto">' + (inv.created_date ? new Date(inv.created_date).toLocaleString() : '-') + '</span></div>' +
            (inv.sent_date ? '<div class="flex items-center gap-3"><div class="w-2 h-2 rounded-full bg-blue-400"></div><span class="text-xs text-slate-300">Sent</span><span class="text-xs text-slate-500 ml-auto">' + new Date(inv.sent_date).toLocaleString() + '</span></div>' : '') +
            (inv.paid_date ? '<div class="flex items-center gap-3"><div class="w-2 h-2 rounded-full bg-green-400"></div><span class="text-xs text-slate-300">Paid (' + (inv.payment_method || 'N/A') + ')</span><span class="text-xs text-slate-500 ml-auto">' + new Date(inv.paid_date).toLocaleString() + '</span></div>' : '') +
            (inv.void_date ? '<div class="flex items-center gap-3"><div class="w-2 h-2 rounded-full bg-red-400"></div><span class="text-xs text-slate-300">Voided: ' + (inv.void_reason || '-') + '</span><span class="text-xs text-slate-500 ml-auto">' + new Date(inv.void_date).toLocaleString() + '</span></div>' : '') +
          '</div>' +
        '</div>' +
      '</div>';

    document.getElementById('invoiceDetailPanel').classList.remove('hidden');
  }

  function showPDFPreview(data) {
    if (!data || !data.html) return;
    document.getElementById('pdfPreviewContent').innerHTML = data.html;
    document.getElementById('pdfPreviewModal').classList.remove('hidden');
  }

  return {
    formatCurrency: formatCurrency,
    showToast: showToast,
    renderInvoiceList: renderInvoiceList,
    renderStats: renderStats,
    renderInvoiceDetail: renderInvoiceDetail,
    showPDFPreview: showPDFPreview
  };
})();
