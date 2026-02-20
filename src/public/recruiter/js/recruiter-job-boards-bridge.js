/* recruiter-job-boards-bridge.js — PostMessage bridge */
var JobBoardsBridge = (function () {
    'use strict';

    var carrierDot = '';

    function postToVelo(type, data) { window.parent.postMessage({ type: type, data: data }, '*'); }

    function loadAll() {
        postToVelo('GET_JOB_POSTINGS', { carrierDot: carrierDot });
        postToVelo('GET_JOB_APPLICATIONS', { carrierDot: carrierDot });
    }

    function init() {
        window.addEventListener('message', function (e) {
            var msg = e.data || {};
            var type = msg.type;
            var data = msg.data;

            if (type === 'INIT') { carrierDot = (data && data.carrierDot) || ''; loadAll(); }
            if (type === 'JOB_POSTINGS_LOADED') JobBoardsLogic.renderJobs((data && data.jobs) || []);
            if (type === 'JOB_APPLICATIONS_LOADED') JobBoardsLogic.renderApps((data && data.applications) || []);
            if (type === 'JOB_CREATED') { JobBoardsLogic.closeModal('jobModal'); loadAll(); JobBoardsLogic.showToast('Job posted!', 'success'); }
            if (type === 'BOARD_CONNECTED') { JobBoardsLogic.closeModal('connectModal'); JobBoardsLogic.showToast('Board connected!', 'success'); }
            if (type === 'ERROR') JobBoardsLogic.showToast((data && data.message) || 'Error', 'error');
        });
    }

    function getCarrierDot() { return carrierDot; }

    return { init: init, postToVelo: postToVelo, loadAll: loadAll, getCarrierDot: getCarrierDot };
})();
