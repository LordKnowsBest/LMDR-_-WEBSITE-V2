/* recruiter-social-posting-logic.js — UI logic and rendering */
var SocialPostingLogic = (function () {
    'use strict';

    var posts = [];
    var selectedPlatforms = new Set();
    var jobs = [];

    function switchTab(tab, el) {
        document.querySelectorAll('[data-tab]').forEach(function (t) { t.classList.remove('tab-active'); t.classList.add('tab-inactive'); });
        el.classList.add('tab-active'); el.classList.remove('tab-inactive');
        document.querySelectorAll('[id^="tab-"]').forEach(function (p) { p.classList.add('hidden'); });
        document.getElementById('tab-' + tab).classList.remove('hidden');
    }

    function renderPosts(data) {
        posts = data;
        var published = data.filter(function (p) { return p.status === 'published'; });
        var scheduled = data.filter(function (p) { return p.status === 'scheduled'; });
        document.getElementById('statPublished').textContent = published.length;

        var list = document.getElementById('postList');
        if (!published.length) { list.innerHTML = '<div class="glass rounded-xl p-8 text-center text-slate-500"><i class="fas fa-share-alt text-3xl mb-3 block opacity-30"></i><p class="text-sm">No published posts yet.</p></div>'; return; }
        list.innerHTML = published.map(function (p) {
            var platforms = p.platforms || [];
            var eng = p.engagement || {};
            var platformIcons = platforms.map(function (pl) { return pl === 'facebook' ? '<i class="fab fa-facebook-f text-blue-400 text-xs"></i>' : '<i class="fab fa-linkedin-in text-blue-500 text-xs"></i>'; }).join('');
            return '<div class="post-card glass rounded-xl p-4 flex items-start gap-4">' +
                '<div class="flex gap-1.5 mt-1">' + platformIcons + '</div>' +
                '<div class="flex-1 min-w-0">' +
                '<p class="text-sm text-slate-200 line-clamp-2">' + p.content + '</p>' +
                '<div class="flex items-center gap-4 mt-2 text-xs text-slate-400">' +
                '<span><i class="fas fa-thumbs-up mr-1"></i>' + (eng.likes || 0) + '</span>' +
                '<span><i class="fas fa-comment mr-1"></i>' + (eng.comments || 0) + '</span>' +
                '<span><i class="fas fa-share mr-1"></i>' + (eng.shares || 0) + '</span>' +
                '<span class="ml-auto">' + (p.published_at ? new Date(p.published_at).toLocaleDateString() : '—') + '</span>' +
                '</div></div>' +
                '<span class="status-badge bg-green-500/20 text-green-400 flex-shrink-0">published</span></div>';
        }).join('');

        var schedList = document.getElementById('scheduledList');
        if (!scheduled.length) { schedList.innerHTML = '<div class="glass rounded-xl p-8 text-center text-slate-500"><i class="fas fa-clock text-3xl mb-3 block opacity-30"></i><p class="text-sm">No scheduled posts.</p></div>'; return; }
        schedList.innerHTML = scheduled.map(function (p) {
            return '<div class="post-card glass rounded-xl p-4 flex items-start gap-4">' +
                '<div class="flex-1 min-w-0"><p class="text-sm text-slate-200 line-clamp-2">' + p.content + '</p>' +
                '<p class="text-xs text-yellow-400 mt-1"><i class="fas fa-clock mr-1"></i>Scheduled: ' + (p.scheduled_time ? new Date(p.scheduled_time).toLocaleString() : '—') + '</p></div>' +
                '<button onclick="SocialPostingBridge.postToVelo(\'CANCEL_SOCIAL_POST\',{postId:\'' + p._id + '\'})" class="px-3 py-1 rounded text-xs bg-red-600/20 text-red-400 hover:bg-red-600/30 flex-shrink-0">Cancel</button></div>';
        }).join('');
    }

    function populateJobSelect(data) {
        jobs = data;
        var sel = document.getElementById('postJobId');
        sel.innerHTML = '<option value="">No job attached</option>' + data.map(function (j) { return '<option value="' + j._id + '">' + j.title + ' — ' + j.location + '</option>'; }).join('');
    }

    function updateAccountStatus(accounts) {
        var fb = accounts.find(function (a) { return a.platform === 'facebook'; });
        var li = accounts.find(function (a) { return a.platform === 'linkedin'; });
        if (fb) { document.getElementById('fbStatus').textContent = fb.accountName || 'Connected'; document.getElementById('fbConnectBtn').textContent = 'Disconnect'; document.getElementById('fbConnectBtn').className = 'px-3 py-1.5 rounded-lg text-xs bg-red-600/20 text-red-400 hover:bg-red-600/30'; }
        if (li) { document.getElementById('liStatus').textContent = li.accountName || 'Connected'; document.getElementById('liConnectBtn').textContent = 'Disconnect'; document.getElementById('liConnectBtn').className = 'px-3 py-1.5 rounded-lg text-xs bg-red-600/20 text-red-400 hover:bg-red-600/30'; }
        document.getElementById('statAccounts').textContent = accounts.length;
    }

    function connectAccount(platform) {
        SocialPostingBridge.postToVelo('INITIATE_SOCIAL_OAUTH', { platform: platform, carrierDot: SocialPostingBridge.getCarrierDot() });
    }

    function openModal(id) { document.getElementById(id).classList.remove('hidden'); }
    function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

    function togglePlatform(platform) {
        var el = document.getElementById(platform === 'facebook' ? 'toggleFb' : 'toggleLi');
        var cls = platform === 'facebook' ? 'selected-fb' : 'selected-li';
        if (selectedPlatforms.has(platform)) { selectedPlatforms.delete(platform); el.classList.remove(cls); }
        else { selectedPlatforms.add(platform); el.classList.add(cls); }
        updatePreview();
    }

    function updatePreview() {
        var content = document.getElementById('postContent').value || '';
        document.getElementById('charCount').textContent = content.length + ' chars';
        var hasFb = selectedPlatforms.has('facebook');
        var hasLi = selectedPlatforms.has('linkedin');
        document.getElementById('previewFb').classList.toggle('hidden', !hasFb);
        document.getElementById('previewLi').classList.toggle('hidden', !hasLi);
        document.getElementById('previewEmpty').classList.toggle('hidden', hasFb || hasLi);
        if (hasFb) document.getElementById('fbPreviewText').textContent = content || 'Your Facebook post will appear here...';
        if (hasLi) document.getElementById('liPreviewText').textContent = content || 'Your LinkedIn post will appear here...';
    }

    function generateAIContent() {
        var jobId = document.getElementById('postJobId').value;
        var platform = selectedPlatforms.has('linkedin') ? 'linkedin' : 'facebook';
        if (!jobId) { showToast('Select a job first', 'error'); return; }
        SocialPostingBridge.postToVelo('GENERATE_SOCIAL_CONTENT', { jobId: jobId, platform: platform });
        showToast('Generating content...', 'info');
    }

    function savePost(action) {
        if (selectedPlatforms.size === 0) { showToast('Select at least one platform', 'error'); return; }
        var schedEl = document.querySelector('input[name="postSched"]:checked');
        var sched = (schedEl && schedEl.value) || 'immediate';
        var data = {
            carrierDot: SocialPostingBridge.getCarrierDot(),
            content: document.getElementById('postContent').value,
            platforms: Array.from(selectedPlatforms),
            linkUrl: document.getElementById('postLink').value,
            jobId: document.getElementById('postJobId').value,
            scheduleType: sched,
            scheduledTime: sched === 'scheduled' ? document.getElementById('postSchedTime').value : null
        };
        SocialPostingBridge.postToVelo(action === 'publish' ? 'PUBLISH_SOCIAL_POST' : 'CREATE_SOCIAL_POST', data);
    }

    function showToast(msg, type) {
        type = type || 'info';
        var colors = { success: 'bg-green-600', error: 'bg-red-600', info: 'bg-purple-600' };
        var t = document.createElement('div');
        t.className = 'fixed bottom-4 right-4 ' + (colors[type] || colors.info) + ' text-white px-4 py-2.5 rounded-lg text-sm font-medium shadow-lg z-50';
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(function () { t.remove(); }, 3000);
    }

    function setupListeners() {
        document.getElementById('newPostBtn').addEventListener('click', function () { openModal('postModal'); });
        document.querySelectorAll('input[name="postSched"]').forEach(function (r) {
            r.addEventListener('change', function () {
                document.getElementById('postSchedTime').classList.toggle('hidden', r.value !== 'scheduled');
            });
        });
    }

    function exposeGlobals() {
        window.switchTab = switchTab;
        window.connectAccount = connectAccount;
        window.togglePlatform = togglePlatform;
        window.updatePreview = updatePreview;
        window.generateAIContent = generateAIContent;
        window.savePost = savePost;
        window.closeModal = closeModal;
    }

    function init() {
        exposeGlobals();
        setupListeners();
        SocialPostingBridge.init();
    }

    return {
        init: init,
        renderPosts: renderPosts,
        populateJobSelect: populateJobSelect,
        updateAccountStatus: updateAccountStatus,
        updatePreview: updatePreview,
        closeModal: closeModal,
        showToast: showToast
    };
})();
