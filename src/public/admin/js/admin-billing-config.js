/* =========================================
   ADMIN BILLING MANAGEMENT — Config Module
   No dependencies
   ========================================= */
var BillingConfig = (function () {
  'use strict';

  var MODAL_MAP = {
    changePlan: 'changePlanModal',
    applyCredit: 'applyCreditModal',
    pause: 'pauseModal',
    cancel: 'cancelModal',
    refund: 'refundModal'
  };

  var ALL_MODAL_IDS = ['changePlanModal', 'applyCreditModal', 'pauseModal', 'cancelModal', 'refundModal'];

  return {
    MODAL_MAP: MODAL_MAP,
    ALL_MODAL_IDS: ALL_MODAL_IDS
  };
})();
