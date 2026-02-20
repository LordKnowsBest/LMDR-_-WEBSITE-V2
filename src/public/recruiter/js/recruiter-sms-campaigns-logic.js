/* recruiter-sms-campaigns-logic.js — UI logic */
var SmsCampaignsLogic = (function () {
    'use strict';
    var campaigns = [];

    function renderCampaigns(data) {
        campaigns = data;
        var tbody = document.getElementById('campaignTableBody');
        if (!data.length) { tbody.innerHTML = '<tr><td colspan="7" class="text-center py-12 text-slate-500"><i class="fas fa-sms text-3xl mb-3 block opacity-30"></i><p class="text-sm">No SMS campaigns yet.</p></td></tr>'; return; }
        var colors = { draft: 'bg-slate-700 text-slate-300', sent: 'bg-green-500/20 text-green-400', sending: 'bg-blue-500/20 text-blue-400', scheduled: 'bg-yellow-500/20 text-yellow-400', paused: 'bg-orange-500/20 text-orange-400' };
        tbody.innerHTML = data.map(function (c) {
            return '<tr class="border-b border-slate-700/30 hover:bg-slate-800/30 cursor-pointer">' +
                '<td class="px-4 py-3"><p class="text-sm font-medium text-white">' + c.campaign_name + '</p><p class="text-xs text-slate-400">' + (c.segments_per_message || 1) + ' segment(s)</p></td>' +
                '<td class="px-4 py-3"><span class="status-badge ' + (colors[c.status] || 'bg-slate-700 text-slate-300') + '">' + c.status + '</span></td>' +
                '<td class="px-4 py-3 text-right text-sm text-slate-300">' + (c.audience_count || 0).toLocaleString() + '</td>' +
                '<td class="px-4 py-3 text-right text-sm text-green-400">' + (c.sent_count ? Math.round((c.sent_count / c.audience_count) * 100) + '%' : '—') + '</td>' +
                '<td class="px-4 py-3 text-right text-sm text-blue-400">—</td>' +
                '<td class="px-4 py-3 text-right text-sm text-yellow-400">$' + (c.estimated_cost || 0).toFixed(2) + '</td>' +
                '<td class="px-4 py-3 text-right">' + (c.status === 'draft' ? '<button onclick="SmsCampaignsBridge.postToVelo(\'SEND_SMS_CAMPAIGN\',{campaignId:\'' + c._id + '\'})" class="px-3 py-1 rounded text-xs bg-green-600 text-white hover:bg-green-700">Send</button>' : '') + '</td></tr>';
        }).join('');
        document.getElementById('statSent').textContent = data.reduce(function (s, c) { return s + (c.sent_count || 0); }, 0).toLocaleString();
    }

    function closeModal() { document.getElementById('campaignModal').classList.add('hidden'); }

    function toggleAB() { document.getElementById('abSection').classList.toggle('hidden', !document.getElementById('abEnabled').checked); }

    function updatePreview() {
        var body = document.getElementById('campBody').value || 'Your message will appear here...';
        document.getElementById('smsPreview').textContent = body;
        var len = body.length;
        var counter = document.getElementById('charCount');
        counter.textContent = len + '/160';
        counter.className = 'text-xs char-counter ' + (len > 160 ? 'text-red-400' : len > 120 ? 'text-yellow-400' : 'text-slate-400');
    }

    function saveCampaign(action) {
        var schedEl = document.querySelector('input[name="sched"]:checked');
        var sched = (schedEl && schedEl.value) || 'immediate';
        var abOn = document.getElementById('abEnabled').checked;
        var split = parseInt(document.getElementById('abSplit').value) || 50;
        var data = { carrierDot: SmsCampaignsBridge.getCarrierDot(), campaignName: document.getElementById('campName').value, messageBody: document.getElementById('campBody').value, messageBodyB: abOn ? document.getElementById('campBodyB').value : '', abTestEnabled: abOn, abSplitPercent: split, audienceFilter: { cdlClass: document.getElementById('campCdlClass').value, state: document.getElementById('campState').value }, scheduleType: sched, scheduledTime: sched === 'scheduled' ? document.getElementById('schedTime').value : null };
        SmsCampaignsBridge.postToVelo(action === 'send' ? 'SEND_SMS_CAMPAIGN_NEW' : 'CREATE_SMS_CAMPAIGN', data);
    }

    function showToast(msg, type) {
        type = type || 'info';
        var colors = { success: 'bg-green-600', error: 'bg-red-600', info: 'bg-blue-600' };
        var t = document.createElement('div');
        t.className = 'fixed bottom-4 right-4 ' + (colors[type] || colors.info) + ' text-white px-4 py-2.5 rounded-lg text-sm font-medium shadow-lg z-50';
        t.textContent = msg; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 3000);
    }

    function exposeGlobals() {
        window.closeModal = closeModal;
        window.toggleAB = toggleAB;
        window.updatePreview = updatePreview;
        window.saveCampaign = saveCampaign;
    }

    function init() {
        exposeGlobals();
        document.getElementById('newCampaignBtn').addEventListener('click', function () { document.getElementById('campaignModal').classList.remove('hidden'); });
        document.querySelectorAll('input[name="sched"]').forEach(function (r) { r.addEventListener('change', function () { document.getElementById('schedTime').classList.toggle('hidden', r.value !== 'scheduled'); }); });
        document.getElementById('abSplit').addEventListener('input', function () { var v = this.value; document.getElementById('abSplitLabel').textContent = v + '/' + (100 - v); });
        SmsCampaignsBridge.init();
    }

    return { init: init, renderCampaigns: renderCampaigns, closeModal: closeModal, showToast: showToast };
})();
