/* =========================================
   ADMIN INVOICING — Logic Module
   Depends on: InvoicingConfig, InvoicingBridge, InvoicingRender
   State management, event handlers, initialization
   ========================================= */
var InvoicingLogic = (function () {
  'use strict';

  // --- State ---
  var invoices = [];
  var currentFilter = '';
  var currentPage = 1;
  var totalPages = 1;
  var editingInvoiceId = null;
  var lineItemCounter = 0;

  // --- Data Requests ---
  function requestInvoiceData() {
    InvoicingBridge.getInvoices({ status: currentFilter }, currentPage);
    InvoicingBridge.getInvoiceStats();
  }

  function refreshList() {
    InvoicingBridge.getInvoices({ status: currentFilter }, currentPage);
    InvoicingBridge.getInvoiceStats();
  }

  // --- Tab Filtering ---
  function filterByStatus(status) {
    currentFilter = status;
    currentPage = 1;
    document.querySelectorAll('.tab-btn').forEach(function (btn) {
      var isActive = btn.dataset.status === status;
      btn.classList.toggle('bg-lmdr-blue', isActive);
      btn.classList.toggle('text-white', isActive);
      btn.classList.toggle('text-slate-400', !isActive);
    });
    refreshList();
  }

  function changePage(delta) {
    currentPage += delta;
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;
    refreshList();
  }

  // --- Invoice Actions ---
  function viewInvoiceDetail(id) {
    InvoicingBridge.getInvoiceDetail(id);
  }

  function sendInvoiceAction(id) {
    InvoicingBridge.sendInvoice(id);
  }

  function viewPDF(id) {
    InvoicingBridge.generatePDF(id);
  }

  // --- Create / Edit Form ---
  function showCreateForm() {
    editingInvoiceId = null;
    document.getElementById('formTitle').textContent = 'New Invoice';
    document.getElementById('formCarrierDot').value = '';
    document.getElementById('formInvoiceDate').value = new Date().toISOString().split('T')[0];
    var dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    document.getElementById('formDueDate').value = dueDate.toISOString().split('T')[0];
    document.getElementById('discountType').value = 'fixed';
    document.getElementById('discountValue').value = '0';
    document.getElementById('formNotes').value = '';
    document.getElementById('lineItemsBody').innerHTML = '';
    lineItemCounter = 0;
    addLineItem();
    recalculateTotals();
    document.getElementById('invoiceFormPanel').classList.remove('hidden');
  }

  function hideCreateForm() {
    document.getElementById('invoiceFormPanel').classList.add('hidden');
  }

  function hideDetailView() {
    document.getElementById('invoiceDetailPanel').classList.add('hidden');
  }

  // --- Line Items Editor ---
  function addLineItem(desc, qty, price) {
    var d = desc || '';
    var q = qty || 1;
    var p = price || 0;
    var id = lineItemCounter++;
    var tbody = document.getElementById('lineItemsBody');
    var tr = document.createElement('tr');
    tr.className = 'line-item-row border-b border-slate-700/30';
    tr.dataset.id = id;
    tr.innerHTML =
      '<td class="py-2 px-2"><input type="text" value="' + d + '" placeholder="Description" class="desc-input w-full bg-transparent border-0 text-sm outline-none" oninput="InvoicingLogic.recalculateTotals()" /></td>' +
      '<td class="py-2 px-2"><input type="number" value="' + q + '" min="1" step="1" class="qty-input w-full bg-transparent border-0 text-sm text-center outline-none" oninput="InvoicingLogic.recalculateTotals()" /></td>' +
      '<td class="py-2 px-2"><input type="number" value="' + p + '" min="0" step="0.01" class="price-input w-full bg-transparent border-0 text-sm text-right outline-none" oninput="InvoicingLogic.recalculateTotals()" /></td>' +
      '<td class="py-2 px-2 text-right text-sm line-total">$0.00</td>' +
      '<td class="py-2 px-1"><button onclick="InvoicingLogic.removeLineItem(this)" class="p-1 hover:bg-red-900/30 rounded transition"><span class="material-symbols-outlined text-[16px] text-red-400">close</span></button></td>';
    tbody.appendChild(tr);
    recalculateTotals();
  }

  function removeLineItem(btn) {
    var row = btn.closest('.line-item-row');
    if (document.querySelectorAll('.line-item-row').length > 1) {
      row.remove();
      recalculateTotals();
    }
  }

  function recalculateTotals() {
    var rows = document.querySelectorAll('.line-item-row');
    var subtotal = 0;
    rows.forEach(function (row) {
      var qty = parseFloat(row.querySelector('.qty-input').value) || 0;
      var price = parseFloat(row.querySelector('.price-input').value) || 0;
      var lineTotal = qty * price;
      row.querySelector('.line-total').textContent = InvoicingRender.formatCurrency(lineTotal);
      subtotal += lineTotal;
    });
    var discType = document.getElementById('discountType').value;
    var discVal = parseFloat(document.getElementById('discountValue').value) || 0;
    var discountAmount = discType === 'percentage' ? subtotal * (discVal / 100) : discVal;
    var total = subtotal - discountAmount;
    document.getElementById('subtotal').textContent = InvoicingRender.formatCurrency(subtotal);
    document.getElementById('discountDisplay').textContent = '-' + InvoicingRender.formatCurrency(discountAmount);
    document.getElementById('total').textContent = InvoicingRender.formatCurrency(total);
  }

  function getLineItems() {
    var items = [];
    document.querySelectorAll('.line-item-row').forEach(function (row) {
      var desc = row.querySelector('.desc-input').value.trim();
      var qty = parseFloat(row.querySelector('.qty-input').value) || 0;
      var price = parseFloat(row.querySelector('.price-input').value) || 0;
      if (desc && qty > 0) {
        items.push({ description: desc, quantity: qty, unit_price: price });
      }
    });
    return items;
  }

  function saveDraft() {
    var lineItems = getLineItems();
    if (!document.getElementById('formCarrierDot').value.trim()) {
      InvoicingRender.showToast('Carrier DOT is required', 'error');
      return;
    }
    if (lineItems.length === 0) {
      InvoicingRender.showToast('At least one line item is required', 'error');
      return;
    }
    InvoicingBridge.createInvoice({
      carrier_dot: document.getElementById('formCarrierDot').value.trim(),
      line_items: lineItems,
      due_date: document.getElementById('formDueDate').value,
      discount_type: document.getElementById('discountType').value,
      discount_value: parseFloat(document.getElementById('discountValue').value) || 0,
      notes: document.getElementById('formNotes').value.trim()
    });
  }

  function saveAndSend() {
    saveDraft();
  }

  // --- Payment Modal ---
  function showPaymentModal(id) {
    document.getElementById('paymentInvoiceId').value = id;
    document.getElementById('paymentMethod').value = 'check';
    document.getElementById('paymentReference').value = '';
    document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('paymentModal').classList.remove('hidden');
  }

  function hidePaymentModal() {
    document.getElementById('paymentModal').classList.add('hidden');
  }

  function confirmPayment() {
    var id = document.getElementById('paymentInvoiceId').value;
    InvoicingBridge.recordPayment(id, {
      payment_method: document.getElementById('paymentMethod').value,
      payment_reference: document.getElementById('paymentReference').value.trim(),
      payment_date: document.getElementById('paymentDate').value
    });
  }

  // --- Void Modal ---
  function showVoidModal(id) {
    document.getElementById('voidInvoiceId').value = id;
    document.getElementById('voidReason').value = '';
    document.getElementById('voidModal').classList.remove('hidden');
  }

  function hideVoidModal() {
    document.getElementById('voidModal').classList.add('hidden');
  }

  function confirmVoid() {
    var id = document.getElementById('voidInvoiceId').value;
    var reason = document.getElementById('voidReason').value.trim();
    if (!reason) {
      InvoicingRender.showToast('Void reason is required', 'error');
      return;
    }
    InvoicingBridge.voidInvoice(id, reason);
  }

  // --- PDF Preview ---
  function hidePDFPreview() {
    document.getElementById('pdfPreviewModal').classList.add('hidden');
  }

  // --- Message Listener ---
  function setupMessageListener() {
    InvoicingBridge.listen({
      init: function () { requestInvoiceData(); },
      invoicesLoaded: function (msg) {
        var result = InvoicingRender.renderInvoiceList(msg.payload, viewInvoiceDetail);
        invoices = result.invoices;
        totalPages = result.totalPages;
        currentPage = result.currentPage;
      },
      invoiceDetailLoaded: function (msg) { InvoicingRender.renderInvoiceDetail(msg.payload); },
      invoiceCreated: function () { InvoicingRender.showToast('Invoice created', 'success'); hideCreateForm(); refreshList(); },
      invoiceSent: function () { InvoicingRender.showToast('Invoice sent', 'success'); refreshList(); },
      paymentRecorded: function () { InvoicingRender.showToast('Payment recorded', 'success'); hidePaymentModal(); refreshList(); },
      invoiceVoided: function () { InvoicingRender.showToast('Invoice voided', 'success'); hideVoidModal(); refreshList(); },
      invoiceStatsLoaded: function (msg) { InvoicingRender.renderStats(msg.payload); },
      pdfReady: function (msg) { InvoicingRender.showPDFPreview(msg.payload); },
      actionError: function (msg) { InvoicingRender.showToast(msg.message || 'An error occurred', 'error'); }
    });
  }

  // --- Init ---
  function init() {
    setupMessageListener();
    filterByStatus('');
  }

  function exposeGlobals() {
    window.InvoicingLogic = {
      filterByStatus: filterByStatus,
      changePage: changePage,
      viewInvoiceDetail: viewInvoiceDetail,
      sendInvoiceAction: sendInvoiceAction,
      viewPDF: viewPDF,
      showCreateForm: showCreateForm,
      hideCreateForm: hideCreateForm,
      hideDetailView: hideDetailView,
      addLineItem: addLineItem,
      removeLineItem: removeLineItem,
      recalculateTotals: recalculateTotals,
      saveDraft: saveDraft,
      saveAndSend: saveAndSend,
      showPaymentModal: showPaymentModal,
      hidePaymentModal: hidePaymentModal,
      confirmPayment: confirmPayment,
      showVoidModal: showVoidModal,
      hideVoidModal: hideVoidModal,
      confirmVoid: confirmVoid,
      hidePDFPreview: hidePDFPreview
    };
  }

  return {
    init: init,
    exposeGlobals: exposeGlobals,
    filterByStatus: filterByStatus,
    changePage: changePage,
    viewInvoiceDetail: viewInvoiceDetail,
    sendInvoiceAction: sendInvoiceAction,
    viewPDF: viewPDF,
    showCreateForm: showCreateForm,
    hideCreateForm: hideCreateForm,
    hideDetailView: hideDetailView,
    addLineItem: addLineItem,
    removeLineItem: removeLineItem,
    recalculateTotals: recalculateTotals,
    saveDraft: saveDraft,
    saveAndSend: saveAndSend,
    showPaymentModal: showPaymentModal,
    hidePaymentModal: hidePaymentModal,
    confirmPayment: confirmPayment,
    showVoidModal: showVoidModal,
    hideVoidModal: hideVoidModal,
    confirmVoid: confirmVoid,
    hidePDFPreview: hidePDFPreview
  };
})();
