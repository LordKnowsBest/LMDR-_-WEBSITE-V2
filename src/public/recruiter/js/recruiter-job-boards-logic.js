/* recruiter-job-boards-logic.js — UI logic and rendering */
var JobBoardsLogic = (function () {
    'use strict';

    var jobs = [], apps = [], connectingBoard = '';

    function switchTab(tab, el) {
        document.querySelectorAll('[data-tab]').forEach(function (t) { t.classList.remove('tab-active'); t.classList.add('tab-inactive'); });
        el.classList.add('tab-active'); el.classList.remove('tab-inactive');
        document.querySelectorAll('[id^="tab-"]').forEach(function (p) { p.classList.add('hidden'); });
        document.getElementById('tab-' + tab).classList.remove('hidden');
    }

    function renderJobs(data) {
        jobs = data;
        var tbody = document.getElementById('jobTableBody');
        if (!data.length) { tbody.innerHTML = '<tr><td colspan="7" class="text-center py-12 text-slate-500"><i class="fas fa-briefcase text-3xl mb-3 block opacity-30"></i><p class="text-sm">No job postings yet.</p></td></tr>'; return; }
        tbody.innerHTML = data.map(function (j) {
            var syn = j.syndication || {};
            var liveBoards = Object.keys(syn).filter(function (b) { return syn[b] && syn[b].status === 'live'; });
            var boardBadges = liveBoards.map(function (b) { return '<span class="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">' + b + '</span>'; }).join(' ');
            return '<tr class="border-b border-slate-700/30 hover:bg-slate-800/30 cursor-pointer">' +
                '<td class="px-4 py-3"><p class="text-sm font-medium text-white">' + j.title + '</p><p class="text-xs text-slate-400">' + j.route_type + ' · CDL-' + j.cdl_class_required + '</p></td>' +
                '<td class="px-4 py-3 text-sm text-slate-300">' + j.location + '</td>' +
                '<td class="px-4 py-3"><div class="flex gap-1">' + (boardBadges || '<span class="text-xs text-slate-500">None</span>') + '</div></td>' +
                '<td class="px-4 py-3 text-right text-sm text-slate-300">' + (j.view_count || 0).toLocaleString() + '</td>' +
                '<td class="px-4 py-3 text-right text-sm text-yellow-400">' + (j.application_count || 0).toLocaleString() + '</td>' +
                '<td class="px-4 py-3 text-right text-xs text-slate-400">' + (j.expires_at ? new Date(j.expires_at).toLocaleDateString() : '—') + '</td>' +
                '<td class="px-4 py-3 text-right"><button onclick="JobBoardsBridge.postToVelo(\'SYNDICATE_JOB\',{jobId:\'' + j._id + '\',boards:[\'indeed\',\'ziprecruiter\',\'cdljobs\']})" class="px-3 py-1 rounded text-xs bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30">Syndicate</button></td></tr>';
        }).join('');
        document.getElementById('statActive').textContent = data.filter(function (j) { return j.status === 'active'; }).length;
        document.getElementById('statViews').textContent = data.reduce(function (s, j) { return s + (j.view_count || 0); }, 0).toLocaleString();
        document.getElementById('statApps').textContent = data.reduce(function (s, j) { return s + (j.application_count || 0); }, 0).toLocaleString();
    }

    function renderApps(data) {
        apps = data;
        var tbody = document.getElementById('appTableBody');
        if (!data.length) { tbody.innerHTML = '<tr><td colspan="6" class="text-center py-12 text-slate-500"><i class="fas fa-users text-3xl mb-3 block opacity-30"></i><p class="text-sm">No applications yet.</p></td></tr>'; return; }
        tbody.innerHTML = data.map(function (a) {
            return '<tr class="border-b border-slate-700/30 hover:bg-slate-800/30">' +
                '<td class="px-4 py-3"><p class="text-sm font-medium text-white">' + (a.applicant_name || 'Unknown') + '</p><p class="text-xs text-slate-400">' + (a.applicant_email || '') + '</p></td>' +
                '<td class="px-4 py-3 text-sm text-slate-300">' + (a.job_title || a.job_id) + '</td>' +
                '<td class="px-4 py-3"><span class="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">' + a.source_board + '</span></td>' +
                '<td class="px-4 py-3"><span class="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-300">' + a.status + '</span></td>' +
                '<td class="px-4 py-3 text-right text-xs text-slate-400">' + (a.applied_at ? new Date(a.applied_at).toLocaleDateString() : '—') + '</td>' +
                '<td class="px-4 py-3 text-right"><button class="px-3 py-1 rounded text-xs bg-slate-700 text-slate-300 hover:bg-slate-600">Review</button></td></tr>';
        }).join('');
    }

    function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
    function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

    function connectBoard(board) {
        connectingBoard = board;
        var names = { indeed: 'Indeed', ziprecruiter: 'ZipRecruiter', cdljobs: 'CDLjobs.com' };
        document.getElementById('connectModalTitle').textContent = 'Connect ' + names[board];
        document.getElementById('boardApiKey').value = '';
        document.getElementById('boardPublisherId').value = '';
        openModal('connectModal');
    }

    function saveConnection() {
        JobBoardsBridge.postToVelo('CONNECT_JOB_BOARD', { carrierDot: JobBoardsBridge.getCarrierDot(), board: connectingBoard, credentials: { apiKey: document.getElementById('boardApiKey').value, publisherId: document.getElementById('boardPublisherId').value } });
    }

    function saveJob() {
        var boards = [];
        if (document.getElementById('boardIndeed').checked) boards.push('indeed');
        if (document.getElementById('boardZip').checked) boards.push('ziprecruiter');
        if (document.getElementById('boardCdl').checked) boards.push('cdljobs');
        var data = { carrierDot: JobBoardsBridge.getCarrierDot(), title: document.getElementById('jobTitle').value, location: document.getElementById('jobLocation').value, description: document.getElementById('jobDesc').value, routeType: document.getElementById('jobRouteType').value, cdlClassRequired: document.getElementById('jobCdlClass').value, payRate: document.getElementById('jobPayRate').value, boards: boards };
        JobBoardsBridge.postToVelo('CREATE_JOB_POSTING', data);
    }

    function showToast(msg, type) {
        type = type || 'info';
        var colors = { success: 'bg-green-600', error: 'bg-red-600', info: 'bg-blue-600' };
        var t = document.createElement('div');
        t.className = 'fixed bottom-4 right-4 ' + (colors[type] || colors.info) + ' text-white px-4 py-2.5 rounded-lg text-sm font-medium shadow-lg z-50';
        t.textContent = msg; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 3000);
    }

    function exposeGlobals() {
        window.switchTab = switchTab;
        window.connectBoard = connectBoard;
        window.saveConnection = saveConnection;
        window.saveJob = saveJob;
        window.closeModal = closeModal;
    }

    function init() {
        exposeGlobals();
        document.getElementById('newJobBtn').addEventListener('click', function () { openModal('jobModal'); });
        JobBoardsBridge.init();
    }

    return { init: init, renderJobs: renderJobs, renderApps: renderApps, closeModal: closeModal, showToast: showToast };
})();
