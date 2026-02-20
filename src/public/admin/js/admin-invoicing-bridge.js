/* =========================================
   ADMIN INVOICING — Bridge Module
   Depends on: InvoicingConfig
   Handles all postMessage communication with Wix page code
   ========================================= */
var InvoicingBridge = (function () {
  'use strict';

  function sendToVelo(data) {
    window.parent.postMessage(data, '*');
  }

  function getInvoices(filters, page) { sendToVelo({ action: 'getInvoices', filters: filters, page: page }); }
  function getInvoiceStats() { sendToVelo({ action: 'getInvoiceStats' }); }
  function getInvoiceDetail(invoiceId) { sendToVelo({ action: 'getInvoiceDetail', invoiceId: invoiceId }); }
  function createInvoice(invoiceData) { sendToVelo({ action: 'createInvoice', invoiceData: invoiceData }); }
  function sendInvoice(invoiceId) { sendToVelo({ action: 'sendInvoice', invoiceId: invoiceId }); }
  function recordPayment(invoiceId, paymentDetails) { sendToVelo({ action: 'recordPayment', invoiceId: invoiceId, paymentDetails: paymentDetails }); }
  function voidInvoice(invoiceId, reason) { sendToVelo({ action: 'voidInvoice', invoiceId: invoiceId, reason: reason }); }
  function generatePDF(invoiceId) { sendToVelo({ action: 'generatePDF', invoiceId: invoiceId }); }

  function listen(handlers) {
    window.addEventListener('message', function (event) {
      var msg = event.data;
      if (!msg || !msg.action) return;
      if (handlers[msg.action]) handlers[msg.action](msg);
    });
  }

  return {
    sendToVelo: sendToVelo,
    getInvoices: getInvoices,
    getInvoiceStats: getInvoiceStats,
    getInvoiceDetail: getInvoiceDetail,
    createInvoice: createInvoice,
    sendInvoice: sendInvoice,
    recordPayment: recordPayment,
    voidInvoice: voidInvoice,
    generatePDF: generatePDF,
    listen: listen
  };
})();
