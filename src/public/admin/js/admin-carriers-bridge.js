/* =========================================
   ADMIN CARRIERS — Bridge Module
   Depends on: AdminCarriersConfig
   Handles all postMessage communication with Wix page code
   ========================================= */
var AdminCarriersBridge = (function () {
  'use strict';

  function send(message) {
    window.parent.postMessage(message, '*');
  }

  function getCarriers(filters, page, pageSize, sortField, sortDirection) {
    send({
      action: 'getCarriers',
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

  function getCarrierDetail(carrierId) {
    send({ action: 'getCarrierDetail', carrierId: carrierId });
  }

  function updateStatus(carrierId, status, reason) {
    send({ action: 'updateStatus', carrierId: carrierId, status: status, reason: reason });
  }

  function flagCarrier(carrierId, reason) {
    send({ action: 'flagCarrier', carrierId: carrierId, reason: reason });
  }

  function unflagCarrier(carrierId) {
    send({ action: 'unflagCarrier', carrierId: carrierId });
  }

  function refreshEnrichment(carrierId) {
    send({ action: 'refreshEnrichment', carrierId: carrierId });
  }

  function exportCarriers(filters) {
    send({ action: 'exportCarriers', filters: filters });
  }

  function viewFMCSA(dotNumber) {
    send({ action: 'viewFMCSA', dotNumber: dotNumber });
  }

  function openAddCarrierModal() {
    send({ action: 'openAddCarrierModal' });
  }

  function bulkActivate(carrierIds) {
    send({ action: 'bulkActivate', carrierIds: carrierIds });
  }

  function bulkFlag(carrierIds) {
    send({ action: 'bulkFlag', carrierIds: carrierIds });
  }

  function listen(handler) {
    window.addEventListener('message', function (event) {
      var data = event.data;
      if (AdminCarriersConfig.isValidMessage(data)) {
        handler(data);
      }
    });
  }

  return {
    send: send,
    listen: listen,
    getCarriers: getCarriers,
    getStats: getStats,
    getCarrierDetail: getCarrierDetail,
    updateStatus: updateStatus,
    flagCarrier: flagCarrier,
    unflagCarrier: unflagCarrier,
    refreshEnrichment: refreshEnrichment,
    exportCarriers: exportCarriers,
    viewFMCSA: viewFMCSA,
    openAddCarrierModal: openAddCarrierModal,
    bulkActivate: bulkActivate,
    bulkFlag: bulkFlag
  };
})();
