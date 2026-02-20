/* =========================================
   ADMIN COMMISSIONS — Bridge Module
   Depends on: CommissionsConfig
   Handles all postMessage communication with Wix page code
   ========================================= */
var CommissionsBridge = (function () {
  'use strict';

  function sendToVelo(msg) {
    window.parent.postMessage(msg, '*');
  }

  function getSummary(period) { sendToVelo({ action: 'getSummary', period: period }); }
  function getLeaderboard(period) { sendToVelo({ action: 'getLeaderboard', period: period }); }
  function getCommissions(filters) { sendToVelo({ action: 'getCommissions', filters: filters }); }
  function getRules() { sendToVelo({ action: 'getRules' }); }
  function getReps() { sendToVelo({ action: 'getReps' }); }
  function getCommissionDetail(id) { sendToVelo({ action: 'getCommissionDetail', commissionId: id }); }
  function approveCommission(id) { sendToVelo({ action: 'approveCommission', commissionId: id }); }
  function bulkApprove(ids) { sendToVelo({ action: 'bulkApprove', commissionIds: ids }); }
  function recordCommission(data) { sendToVelo({ action: 'recordCommission', commissionData: data }); }
  function saveRule(rule) { sendToVelo({ action: 'saveRule', rule: rule }); }
  function saveRep(rep) { sendToVelo({ action: 'saveRep', rep: rep }); }
  function generatePayout(period) { sendToVelo({ action: 'generatePayout', period: period }); }
  function markPaid(ids, ref) { sendToVelo({ action: 'markPaid', commissionIds: ids, payoutReference: ref }); }
  function exportCSV(report) { sendToVelo({ action: 'exportCSV', report: report }); }

  function listen(handlers) {
    window.addEventListener('message', function (event) {
      var msg = event.data;
      if (!msg || !msg.action) return;
      if (handlers[msg.action]) handlers[msg.action](msg);
    });
  }

  return {
    sendToVelo: sendToVelo,
    getSummary: getSummary,
    getLeaderboard: getLeaderboard,
    getCommissions: getCommissions,
    getRules: getRules,
    getReps: getReps,
    getCommissionDetail: getCommissionDetail,
    approveCommission: approveCommission,
    bulkApprove: bulkApprove,
    recordCommission: recordCommission,
    saveRule: saveRule,
    saveRep: saveRep,
    generatePayout: generatePayout,
    markPaid: markPaid,
    exportCSV: exportCSV,
    listen: listen
  };
})();
