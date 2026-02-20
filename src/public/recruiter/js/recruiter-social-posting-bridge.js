/* recruiter-social-posting-bridge.js — PostMessage bridge */
var SocialPostingBridge = (function () {
    'use strict';

    var carrierDot = '';

    function postToVelo(type, data) {
        window.parent.postMessage({ type: type, data: data }, '*');
    }

    function loadAll() {
        postToVelo('GET_SOCIAL_POSTS', { carrierDot: carrierDot });
        postToVelo('GET_JOB_POSTINGS', { carrierDot: carrierDot });
        postToVelo('GET_SOCIAL_ACCOUNTS', { carrierDot: carrierDot });
    }

    function init() {
        window.addEventListener('message', function (e) {
            var msg = e.data || {};
            var type = msg.type;
            var data = msg.data;

            if (type === 'INIT') {
                carrierDot = (data && data.carrierDot) || '';
                loadAll();
            }
            if (type === 'SOCIAL_POSTS_LOADED') SocialPostingLogic.renderPosts((data && data.posts) || []);
            if (type === 'JOB_POSTINGS_LOADED') SocialPostingLogic.populateJobSelect((data && data.jobs) || []);
            if (type === 'SOCIAL_ACCOUNTS_LOADED') SocialPostingLogic.updateAccountStatus((data && data.accounts) || []);
            if (type === 'SOCIAL_POST_CREATED') {
                SocialPostingLogic.closeModal('postModal');
                loadAll();
                SocialPostingLogic.showToast('Post published!', 'success');
            }
            if (type === 'AI_CONTENT_GENERATED') {
                document.getElementById('postContent').value = (data && data.content) || '';
                SocialPostingLogic.updatePreview();
            }
            if (type === 'ERROR') SocialPostingLogic.showToast((data && data.message) || 'Error', 'error');
        });
    }

    function getCarrierDot() { return carrierDot; }

    return {
        init: init,
        postToVelo: postToVelo,
        loadAll: loadAll,
        getCarrierDot: getCarrierDot
    };
})();
