/* =========================================
   ADMIN BILLING MANAGEMENT — Render Module
   Depends on: BillingConfig
   All DOM rendering / display functions
   ========================================= */
var BillingRender = (function () {
  'use strict';

  function showToast(message, type) {
    var container = document.getElementById('toastContainer');
    var colors = { success: 'bg-emerald-600', error: 'bg-red-600', info: 'bg-blue-600' };
    var icons = { success: 'check_circle', error: 'error', info: 'info' };
    var t = type || 'info';
    var toast = document.createElement('div');
    toast.className = 'toast ' + (colors[t] || colors.info) + ' px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 text-sm max-w-sm';
    toast.innerHTML = '<span class="material-symbols-outlined text-base">' + (icons[t] || icons.info) + '</span><span>' + message + '</span>';
    container.appendChild(toast);
    setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s';
      setTimeout(function () { toast.remove(); }, 300);
    }, 4000);
  }

  function renderSearchResults(payload) {
    var dropdown = document.getElementById('searchDropdown');
    var results = (payload && payload.results) ? payload.results : [];

    if (!results.length) {
      dropdown.innerHTML = '<div class="px-4 py-3 text-sm text-slate-400">No results found</div>';
      dropdown.classList.remove('hidden');
      return;
    }

    dropdown.innerHTML = results.map(function (r) {
      return '<button class="w-full text-left px-4 py-3 hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-0" ' +
        'onclick="BillingLogic.selectCustomer(\'' + r.carrier_dot + '\')">' +
        '<div class="flex items-center justify-between">' +
          '<div>' +
            '<p class="text-sm font-medium">' + (r.company_name || 'DOT ' + r.carrier_dot) + '</p>' +
            '<p class="text-xs text-slate-400">DOT: ' + r.carrier_dot + (r.email ? ' | ' + r.email : '') + '</p>' +
          '</div>' +
          (r.status ? '<span class="status-' + r.status + ' px-2 py-0.5 rounded text-xs font-medium">' + r.status + '</span>' : '') +
        '</div>' +
      '</button>';
    }).join('');

    dropdown.classList.remove('hidden');
  }

  function renderCustomerDetails(payload, currentCustomer) {
    document.getElementById('loadingSkeleton').classList.add('hidden');
    document.getElementById('customerPanel').classList.remove('hidden');

    var carrier = (payload && payload.carrier) ? payload.carrier : {};
    var sub = (payload && payload.subscription) ? payload.subscription : {};

    document.getElementById('carrierName').textContent = carrier.company_name || 'Unknown Carrier';
    document.getElementById('carrierDot').textContent = currentCustomer || '--';
    document.getElementById('carrierEmail').textContent = carrier.email || '--';
    document.getElementById('carrierPhone').textContent = carrier.phone || '--';

    // Plan badge
    var planBadge = document.getElementById('planBadge');
    var plan = (sub.plan_type || 'free').toLowerCase();
    planBadge.textContent = plan;
    planBadge.className = plan === 'enterprise'
      ? 'px-2 py-0.5 rounded text-xs font-semibold uppercase bg-purple-500/20 text-purple-400'
      : plan === 'pro'
        ? 'px-2 py-0.5 rounded text-xs font-semibold uppercase bg-blue-500/20 text-blue-400'
        : 'px-2 py-0.5 rounded text-xs font-semibold uppercase bg-slate-500/20 text-slate-400';

    // Status badge
    var statusBadge = document.getElementById('statusBadge');
    var status = (sub.status || 'none').toLowerCase();
    statusBadge.textContent = status;
    statusBadge.className = 'status-' + status + ' px-2 py-0.5 rounded text-xs font-semibold';

    // Period dates
    var start = sub.current_period_start ? new Date(sub.current_period_start).toLocaleDateString() : '--';
    var end = sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : '--';
    document.getElementById('periodDates').textContent = start + ' - ' + end;

    // Usage bar
    var used = sub.views_used_this_month || 0;
    var limit = sub.monthly_view_quota || 0;
    var pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
    document.getElementById('usageText').textContent = limit === -1 ? used + ' / Unlimited' : used + ' / ' + limit;
    var usageBar = document.getElementById('usageBar');
    usageBar.style.width = limit === -1 ? '10%' : pct + '%';
    usageBar.className = 'h-full rounded-full transition-all duration-500 ' + (pct > 80 ? 'usage-bar-red' : pct > 50 ? 'usage-bar-yellow' : 'usage-bar-green');

    // Render billing history and adjustments if included
    if (payload && payload.billingHistory) renderBillingHistory({ history: payload.billingHistory });
    if (payload && payload.adjustments) renderAdjustments({ adjustments: payload.adjustments });
  }

  function renderBillingHistory(payload) {
    var body = document.getElementById('billingHistoryBody');
    var history = (payload && payload.history) ? payload.history : [];

    if (!history.length) {
      body.innerHTML = '<tr><td colspan="5" class="px-4 py-6 text-center text-slate-500">No billing history</td></tr>';
      return;
    }

    body.innerHTML = history.map(function (h) {
      return '<tr class="border-b border-slate-700/50 hover:bg-slate-700/30">' +
        '<td class="px-4 py-2.5 text-xs">' + (h.timestamp ? new Date(h.timestamp).toLocaleDateString() : '--') + '</td>' +
        '<td class="px-4 py-2.5 text-xs capitalize">' + (h.event_type || '--') + '</td>' +
        '<td class="px-4 py-2.5 text-xs font-medium">' + (h.amount ? '$' + Number(h.amount).toFixed(2) : '--') + '</td>' +
        '<td class="px-4 py-2.5"><span class="status-' + (h.status || 'active').toLowerCase() + ' px-1.5 py-0.5 rounded text-xs">' + (h.status || 'completed') + '</span></td>' +
        '<td class="px-4 py-2.5 text-xs">' +
          (h.invoice_id ? '<button class="text-blue-400 hover:underline text-xs" onclick="window.open(\'https://dashboard.stripe.com/invoices/' + h.invoice_id + '\', \'_blank\')">View Invoice</button>' : '--') +
        '</td>' +
      '</tr>';
    }).join('');
  }

  function renderAdjustments(payload) {
    var container = document.getElementById('adjustmentsTimeline');
    var adjustments = (payload && payload.adjustments) ? payload.adjustments : [];

    if (!adjustments.length) {
      container.innerHTML = '<p class="text-sm text-slate-500 text-center py-4">No adjustments</p>';
      return;
    }

    container.innerHTML = adjustments.map(function (a) {
      var typeIcon = a.type === 'credit' ? 'add_card' : 'receipt_long';
      var typeColor = a.type === 'credit' ? 'text-emerald-400' : 'text-orange-400';
      return '<div class="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg">' +
        '<span class="material-symbols-outlined ' + typeColor + ' mt-0.5">' + typeIcon + '</span>' +
        '<div class="flex-1 min-w-0">' +
          '<div class="flex items-center gap-2 flex-wrap">' +
            '<span class="text-sm font-medium capitalize">' + (a.type || '--') + '</span>' +
            '<span class="text-sm font-bold">$' + Number(a.amount || 0).toFixed(2) + '</span>' +
            '<span class="status-' + (a.status || '').toLowerCase() + ' px-1.5 py-0.5 rounded text-xs">' + (a.status || '--') + '</span>' +
          '</div>' +
          '<p class="text-xs text-slate-400 mt-0.5">' + (a.reason || 'No reason provided') + '</p>' +
          '<p class="text-xs text-slate-500 mt-0.5">' + (a.created_date ? new Date(a.created_date).toLocaleString() : '--') + '</p>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function renderApprovals(payload) {
    var pending = (payload && payload.pending) ? payload.pending : [];

    // Update badge count
    var badge = document.getElementById('pendingCount');
    if (pending.length > 0) {
      badge.textContent = pending.length;
      badge.classList.remove('hidden');
      document.getElementById('approvalsPanel').classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }

    var body = document.getElementById('approvalsBody');
    if (!pending.length) {
      body.innerHTML = '<tr><td colspan="5" class="px-4 py-6 text-center text-slate-500">No pending approvals</td></tr>';
      return pending;
    }

    body.innerHTML = pending.map(function (p) {
      return '<tr class="border-b border-slate-700/50 hover:bg-slate-700/30">' +
        '<td class="px-4 py-2.5 text-xs font-medium">' + (p.carrier_dot || '--') + '</td>' +
        '<td class="px-4 py-2.5 text-xs capitalize">' + (p.type || '--') + '</td>' +
        '<td class="px-4 py-2.5 text-xs font-bold">$' + Number(p.amount || 0).toFixed(2) + '</td>' +
        '<td class="px-4 py-2.5 text-xs text-slate-400 max-w-[150px] truncate">' + (p.reason || '--') + '</td>' +
        '<td class="px-4 py-2.5 flex gap-1">' +
          '<button onclick="BillingLogic.handleApprove(\'' + p._id + '\')" class="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 rounded text-xs transition-colors">Approve</button>' +
          '<button onclick="BillingLogic.handleReject(\'' + p._id + '\')" class="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs transition-colors">Reject</button>' +
        '</td>' +
      '</tr>';
    }).join('');

    return pending;
  }

  return {
    showToast: showToast,
    renderSearchResults: renderSearchResults,
    renderCustomerDetails: renderCustomerDetails,
    renderBillingHistory: renderBillingHistory,
    renderAdjustments: renderAdjustments,
    renderApprovals: renderApprovals
  };
})();
