/* =========================================
   ADMIN INVOICING — Config Module
   No dependencies
   ========================================= */
var InvoicingConfig = (function () {
  'use strict';

  var STATUS_COLORS = {
    draft: 'bg-slate-700 text-slate-300',
    sent: 'bg-blue-900/50 text-blue-400',
    paid: 'bg-green-900/50 text-green-400',
    overdue: 'bg-red-900/50 text-red-400',
    void: 'bg-slate-800 text-slate-500'
  };

  return {
    STATUS_COLORS: STATUS_COLORS
  };
})();
