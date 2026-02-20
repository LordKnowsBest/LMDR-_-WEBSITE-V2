/* recruiter-sms-campaigns-bridge.js — PostMessage bridge */
var SmsCampaignsBridge = (function () {
    'use strict';
    var carrierDot = '';
    function postToVelo(type, data) { window.parent.postMessage({ type: type, data: data }, '*'); }
    function loadCampaigns() { postToVelo('GET_SMS_CAMPAIGNS', { carrierDot: carrierDot }); }
    function init() {
        window.addEventListener('message', function (e) {
            var msg = e.data || {};
            if (msg.type === 'INIT') { carrierDot = (msg.data && msg.data.carrierDot) || ''; loadCampaigns(); }
            if (msg.type === 'SMS_CAMPAIGNS_LOADED') SmsCampaignsLogic.renderCampaigns((msg.data && msg.data.campaigns) || []);
            if (msg.type === 'SMS_CAMPAIGN_CREATED') { SmsCampaignsLogic.closeModal(); loadCampaigns(); SmsCampaignsLogic.showToast('Campaign created!', 'success'); }
            if (msg.type === 'ERROR') SmsCampaignsLogic.showToast((msg.data && msg.data.message) || 'Error', 'error');
        });
    }
    function getCarrierDot() { return carrierDot; }
    return { init: init, postToVelo: postToVelo, getCarrierDot: getCarrierDot };
})();
