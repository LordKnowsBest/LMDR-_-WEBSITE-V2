/* =========================================
   ADMIN COMMISSIONS — Render Module
   Depends on: CommissionsConfig
   All DOM rendering / display functions
   ========================================= */
var CommissionsRender = (function () {
  'use strict';

  function formatCurrency(amount) {
    return '$' + (Number(amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatPercent(rate) {
    return (Number(rate) * 100).toFixed(1) + '%';
  }

  function statusBadge(status) {
    var cls = status === 'pending' ? 'badge-pending' : status === 'approved' ? 'badge-approved' : 'badge-paid';
    return '<span class="px-2 py-1 rounded-full text-xs font-medium ' + cls + '">' + status + '</span>';
  }

  function rankIcon(rank) {
    if (rank === 1) return '<span class="text-yellow-400">&#x1F947;</span>';
    if (rank === 2) return '<span class="text-slate-300">&#x1F948;</span>';
    if (rank === 3) return '<span class="text-amber-600">&#x1F949;</span>';
    return rank;
  }

  function showToast(message, type) {
    var container = document.getElementById('toastContainer');
    var toast = document.createElement('div');
    var bg = (type || 'success') === 'success' ? 'bg-green-600' : 'bg-red-600';
    toast.className = 'toast ' + bg + ' text-white px-4 py-3 rounded-lg text-sm shadow-lg flex items-center gap-2';
    toast.innerHTML = '<span class="material-symbols-outlined text-lg">' + (type === 'success' ? 'check_circle' : 'error') + '</span>' + message;
    container.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 4000);
  }

  function renderSummary(data) {
    if (!data) return;
    document.getElementById('totalEarned').textContent = formatCurrency(data.total_earned);
    document.getElementById('earnedCount').textContent = data.count_approved + data.count_paid;
    document.getElementById('totalPending').textContent = formatCurrency(data.total_pending);
    document.getElementById('pendingCount').textContent = data.count_pending;
    document.getElementById('totalPaid').textContent = formatCurrency(data.total_paid);
    document.getElementById('paidCount').textContent = data.count_paid;
  }

  function renderLeaderboard(data) {
    var leaderboard = data.leaderboard || data || [];
    var tbody = document.getElementById('leaderboardBody');
    if (!leaderboard.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-slate-500">No data for this period</td></tr>';
      return;
    }
    tbody.innerHTML = leaderboard.map(function (entry) {
      return '<tr class="border-b border-slate-700/50 hover:bg-slate-750/50">' +
        '<td class="px-4 py-3 font-bold">' + rankIcon(entry.rank) + '</td>' +
        '<td class="px-4 py-3 font-medium">' + (entry.name || 'Unknown') + '</td>' +
        '<td class="px-4 py-3 text-right">' + entry.deals + '</td>' +
        '<td class="px-4 py-3 text-right">' + formatCurrency(entry.revenue) + '</td>' +
        '<td class="px-4 py-3 text-right font-semibold text-green-400">' + formatCurrency(entry.commission) + '</td>' +
        '<td class="px-4 py-3 text-right">' + formatCurrency(entry.avg_deal_size) + '</td>' +
      '</tr>';
    }).join('');
    return leaderboard;
  }

  function renderCommissions(data, selectedCommissions, updateBulkCb) {
    var commissions = data.commissions || data || [];
    var tbody = document.getElementById('commissionsBody');
    selectedCommissions.clear();
    updateBulkCb();

    if (!commissions.length) {
      tbody.innerHTML = '<tr><td colspan="10" class="text-center py-8 text-slate-500">No commissions found</td></tr>';
      return commissions;
    }

    tbody.innerHTML = commissions.map(function (c) {
      return '<tr class="border-b border-slate-700/50 hover:bg-slate-750/50 cursor-pointer" data-id="' + c._id + '">' +
        '<td class="px-4 py-3"><input type="checkbox" class="comm-check rounded bg-slate-700 border-slate-600" data-id="' + c._id + '"' + (c.status !== 'pending' ? ' disabled' : '') + ' /></td>' +
        '<td class="px-4 py-3">' + formatDate(c.created_date) + '</td>' +
        '<td class="px-4 py-3">' + (c.rep_name || c.sales_rep_id || '-') + '</td>' +
        '<td class="px-4 py-3">' + (c.carrier_name || c.carrier_dot || '-') + '</td>' +
        '<td class="px-4 py-3">' + (c.event_type || '').replace(/_/g, ' ') + '</td>' +
        '<td class="px-4 py-3 text-right">' + formatCurrency(c.deal_value) + '</td>' +
        '<td class="px-4 py-3 text-right">' + formatPercent(c.commission_rate) + '</td>' +
        '<td class="px-4 py-3 text-right font-semibold">' + formatCurrency(c.commission_amount) + '</td>' +
        '<td class="px-4 py-3 text-center">' + statusBadge(c.status) + '</td>' +
        '<td class="px-4 py-3 text-center">' +
          '<button class="text-slate-400 hover:text-white" onclick="event.stopPropagation(); CommissionsLogic.viewCommission(\'' + c._id + '\')">' +
            '<span class="material-symbols-outlined text-lg">visibility</span>' +
          '</button>' +
        '</td>' +
      '</tr>';
    }).join('');

    document.querySelectorAll('.comm-check').forEach(function (cb) {
      cb.addEventListener('change', function (e) {
        e.stopPropagation();
        var id = e.target.dataset.id;
        if (e.target.checked) selectedCommissions.add(id);
        else selectedCommissions.delete(id);
        updateBulkCb();
      });
    });

    return commissions;
  }

  function renderRules(data) {
    var rules = data.rules || data || [];
    var tbody = document.getElementById('rulesBody');
    if (!rules.length) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8 text-slate-500">No rules configured</td></tr>';
      return rules;
    }
    tbody.innerHTML = rules.map(function (r) {
      return '<tr class="border-b border-slate-700/50 hover:bg-slate-750/50">' +
        '<td class="px-4 py-3 font-medium">' + (r.rule_name || '-') + '</td>' +
        '<td class="px-4 py-3">' + (r.event_type || '').replace(/_/g, ' ') + '</td>' +
        '<td class="px-4 py-3 text-right">' + formatPercent(r.base_rate) + '</td>' +
        '<td class="px-4 py-3 text-center">' + (r.priority || '-') + '</td>' +
        '<td class="px-4 py-3 text-center">' + statusBadge(r.status || 'active') + '</td>' +
        '<td class="px-4 py-3 text-center">' +
          '<button class="text-slate-400 hover:text-white" onclick="CommissionsLogic.editRule(\'' + r._id + '\')">' +
            '<span class="material-symbols-outlined text-lg">edit</span>' +
          '</button>' +
        '</td>' +
      '</tr>';
    }).join('');
    return rules;
  }

  function renderReps(data) {
    var reps = data.reps || data || [];
    var tbody = document.getElementById('repsBody');

    // Populate dropdowns
    var filterRep = document.getElementById('filterRep');
    filterRep.innerHTML = '<option value="all">All Reps</option>' +
      reps.map(function (r) { return '<option value="' + r._id + '">' + r.name + '</option>'; }).join('');
    var formRep = document.getElementById('formRepId');
    formRep.innerHTML = '<option value="">Select rep...</option>' +
      reps.map(function (r) { return '<option value="' + r._id + '">' + r.name + '</option>'; }).join('');

    if (!reps.length) {
      tbody.innerHTML = '<tr><td colspan="8" class="text-center py-8 text-slate-500">No sales reps found</td></tr>';
      return reps;
    }
    tbody.innerHTML = reps.map(function (r) {
      return '<tr class="border-b border-slate-700/50 hover:bg-slate-750/50">' +
        '<td class="px-4 py-3 font-medium">' + (r.name || '-') + '</td>' +
        '<td class="px-4 py-3">' + (r.email || '-') + '</td>' +
        '<td class="px-4 py-3">' + (r.role || '-') + '</td>' +
        '<td class="px-4 py-3 text-center">' + statusBadge(r.status || 'active') + '</td>' +
        '<td class="px-4 py-3 text-right">' + (r.total_deals || 0) + '</td>' +
        '<td class="px-4 py-3 text-right">' + formatCurrency(r.total_revenue) + '</td>' +
        '<td class="px-4 py-3 text-right font-semibold text-green-400">' + formatCurrency(r.total_commission) + '</td>' +
        '<td class="px-4 py-3 text-center">' +
          '<button class="text-slate-400 hover:text-white" onclick="CommissionsLogic.editRep(\'' + r._id + '\')">' +
            '<span class="material-symbols-outlined text-lg">edit</span>' +
          '</button>' +
        '</td>' +
      '</tr>';
    }).join('');
    return reps;
  }

  function showCommissionDetail(commission) {
    if (!commission) return;
    var holdDate = new Date(commission.hold_until);
    var now = new Date();
    var holdExpired = now >= holdDate;
    var daysRemaining = holdExpired ? 0 : Math.ceil((holdDate - now) / (1000 * 60 * 60 * 24));

    document.getElementById('commissionDetailContent').innerHTML =
      '<div class="space-y-4">' +
        '<div class="grid grid-cols-2 gap-4">' +
          '<div><div class="text-xs text-slate-400">Sales Rep</div><div class="font-medium">' + (commission.rep_name || commission.sales_rep_id || '-') + '</div></div>' +
          '<div><div class="text-xs text-slate-400">Carrier</div><div class="font-medium">' + (commission.carrier_name || commission.carrier_dot || '-') + '</div></div>' +
          '<div><div class="text-xs text-slate-400">Event Type</div><div class="font-medium">' + (commission.event_type || '').replace(/_/g, ' ') + '</div></div>' +
          '<div><div class="text-xs text-slate-400">Deal Value</div><div class="font-medium">' + formatCurrency(commission.deal_value) + '</div></div>' +
          '<div><div class="text-xs text-slate-400">Rate</div><div class="font-medium">' + formatPercent(commission.commission_rate) + '</div></div>' +
          '<div><div class="text-xs text-slate-400">Commission</div><div class="font-bold text-green-400">' + formatCurrency(commission.commission_amount) + '</div></div>' +
        '</div>' +
        '<div class="border-t border-slate-700 pt-4">' +
          '<div class="text-xs text-slate-400 mb-2">Timeline</div>' +
          '<div class="space-y-2">' +
            '<div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-blue-500"></div><span class="text-sm">Created: ' + formatDate(commission.created_date) + '</span></div>' +
            (commission.approved_date ? '<div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-green-500"></div><span class="text-sm">Approved: ' + formatDate(commission.approved_date) + ' by ' + (commission.approved_by || 'N/A') + '</span></div>' : '') +
            (commission.paid_date ? '<div class="flex items-center gap-2"><div class="w-3 h-3 rounded-full bg-blue-400"></div><span class="text-sm">Paid: ' + formatDate(commission.paid_date) + ' (Ref: ' + (commission.payout_reference || 'N/A') + ')</span></div>' : '') +
          '</div>' +
        '</div>' +
        (commission.status === 'pending'
          ? '<div class="border-t border-slate-700 pt-4">' +
              '<div class="flex items-center gap-2 ' + (holdExpired ? 'text-green-400' : 'text-yellow-400') + '">' +
                '<span class="material-symbols-outlined">' + (holdExpired ? 'check_circle' : 'hourglass_top') + '</span>' +
                '<span class="text-sm">' + (holdExpired ? 'Hold period complete - eligible for approval' : daysRemaining + ' days remaining in hold period') + '</span>' +
              '</div>' +
              (holdExpired ? '<div class="mt-3 flex gap-2"><button onclick="CommissionsLogic.approveFromDetail(\'' + commission._id + '\')" class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">Approve</button></div>' : '') +
            '</div>'
          : '') +
        (commission.notes ? '<div class="border-t border-slate-700 pt-4"><div class="text-xs text-slate-400 mb-1">Notes</div><div class="text-sm">' + commission.notes + '</div></div>' : '') +
      '</div>';

    document.getElementById('commissionDetailModal').classList.remove('hidden');
  }

  function renderPayoutReport(data) {
    var container = document.getElementById('payoutReportContent');
    if (!data || !data.report || !data.report.length) {
      container.innerHTML = '<div class="text-center py-8 text-slate-500">No approved commissions pending payout</div>';
      document.getElementById('payoutModal').classList.remove('hidden');
      return data;
    }

    var totalPayout = formatCurrency(data.total_payout);
    container.innerHTML =
      '<div class="mb-4 text-lg font-bold">Total Payout: <span class="text-green-400">' + totalPayout + '</span></div>' +
      data.report.map(function (rep) {
        return '<div class="bg-slate-750 rounded-lg p-4 mb-3 border border-slate-600">' +
          '<div class="flex justify-between items-center mb-2">' +
            '<div class="font-semibold">' + rep.name + ' <span class="text-sm text-slate-400">(' + rep.payment_method + ')</span></div>' +
            '<div class="text-green-400 font-bold">' + formatCurrency(rep.total_owed) + '</div>' +
          '</div>' +
          '<div class="text-xs text-slate-500">' + rep.commission_count + ' commission(s) | ' + rep.email + '</div>' +
        '</div>';
      }).join('');
    document.getElementById('payoutModal').classList.remove('hidden');
    return data;
  }

  return {
    formatCurrency: formatCurrency,
    formatDate: formatDate,
    formatPercent: formatPercent,
    statusBadge: statusBadge,
    showToast: showToast,
    renderSummary: renderSummary,
    renderLeaderboard: renderLeaderboard,
    renderCommissions: renderCommissions,
    renderRules: renderRules,
    renderReps: renderReps,
    showCommissionDetail: showCommissionDetail,
    renderPayoutReport: renderPayoutReport
  };
})();
