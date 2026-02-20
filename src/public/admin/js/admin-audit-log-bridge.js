/* =========================================
   ADMIN AUDIT LOG — Bridge Module
   Depends on: AuditLogConfig
   Handles all postMessage communication with Wix page code
   ========================================= */
var AuditLogBridge = (function () {
  'use strict';

  function send(message) {
    window.parent.postMessage(message, '*');
  }

  function getAuditLog(filters, page, pageSize, sortField, sortDirection) {
    send({
      action: 'getAuditLog',
      filters: filters,
      page: page,
      pageSize: pageSize,
      sortField: sortField,
      sortDirection: sortDirection
    });
  }

  function getStats() {
    send({ action: 'getStats' });
  }

  function getEntryDetail(entryId) {
    send({ action: 'getEntryDetail', entryId: entryId });
  }

  function exportAuditLog(filters) {
    send({ action: 'exportAuditLog', filters: filters });
  }

  function getReportTemplates() {
    send({ action: 'getReportTemplates' });
  }

  function generateComplianceReport(options) {
    send({ action: 'generateComplianceReport', options: options });
  }

  function listComplianceReports(options) {
    send({ action: 'listComplianceReports', options: options });
  }

  function getScheduledReports() {
    send({ action: 'getScheduledReports' });
  }

  function downloadReport(reportId) {
    send({ action: 'downloadReport', reportId: reportId });
  }

  function deleteScheduledReport(scheduleId) {
    send({ action: 'deleteScheduledReport', scheduleId: scheduleId });
  }

  function listen(handler) {
    window.addEventListener('message', function (event) {
      var data = event.data;
      if (AuditLogConfig.isValidMessage(data)) {
        handler(data);
      }
    });
  }

  return {
    send: send,
    listen: listen,
    getAuditLog: getAuditLog,
    getStats: getStats,
    getEntryDetail: getEntryDetail,
    exportAuditLog: exportAuditLog,
    getReportTemplates: getReportTemplates,
    generateComplianceReport: generateComplianceReport,
    listComplianceReports: listComplianceReports,
    getScheduledReports: getScheduledReports,
    downloadReport: downloadReport,
    deleteScheduledReport: deleteScheduledReport
  };
})();
