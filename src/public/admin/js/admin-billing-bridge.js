/* =========================================
   ADMIN BILLING MANAGEMENT — Bridge Module
   Depends on: BillingConfig
   Handles all postMessage communication with Wix page code
   ========================================= */
var BillingBridge = (function () {
  'use strict';

  function sendToVelo(data) {
    window.parent.postMessage(data, '*');
  }

  function searchCustomer(query) { sendToVelo({ action: 'searchCustomer', query: query }); }
  function getBillingDetails(carrierDot) { sendToVelo({ action: 'getBillingDetails', carrierDot: carrierDot }); }
  function getPendingApprovals() { sendToVelo({ action: 'getPendingApprovals' }); }
  function changePlan(carrierDot, newPlan, immediate) { sendToVelo({ action: 'changePlan', carrierDot: carrierDot, newPlan: newPlan, immediate: immediate }); }
  function applyCredit(carrierDot, amount, reason) { sendToVelo({ action: 'applyCredit', carrierDot: carrierDot, amount: amount, reason: reason }); }
  function pauseSubscription(carrierDot, days, reason) { sendToVelo({ action: 'pauseSubscription', carrierDot: carrierDot, days: days, reason: reason }); }
  function cancelSubscription(carrierDot, immediate, reason) { sendToVelo({ action: 'cancelSubscription', carrierDot: carrierDot, immediate: immediate, reason: reason }); }
  function processRefund(carrierDot, invoiceId, amount, reason) { sendToVelo({ action: 'processRefund', carrierDot: carrierDot, invoiceId: invoiceId, amount: amount, reason: reason }); }
  function approveAdjustment(adjustmentId) { sendToVelo({ action: 'approveAdjustment', adjustmentId: adjustmentId }); }
  function rejectAdjustment(adjustmentId, notes) { sendToVelo({ action: 'rejectAdjustment', adjustmentId: adjustmentId, notes: notes }); }

  function listen(handlers) {
    window.addEventListener('message', function (event) {
      var msg = event.data;
      if (!msg || !msg.action) return;
      if (handlers[msg.action]) handlers[msg.action](msg);
    });
  }

  return {
    sendToVelo: sendToVelo,
    searchCustomer: searchCustomer,
    getBillingDetails: getBillingDetails,
    getPendingApprovals: getPendingApprovals,
    changePlan: changePlan,
    applyCredit: applyCredit,
    pauseSubscription: pauseSubscription,
    cancelSubscription: cancelSubscription,
    processRefund: processRefund,
    approveAdjustment: approveAdjustment,
    rejectAdjustment: rejectAdjustment,
    listen: listen
  };
})();
