// ============================================================================
// ROS-VIEW-SOCIAL — Social Media Posting (Facebook, LinkedIn, Instagram)
// Ported from: Recruiter_Social_Posting.html
// ============================================================================

(function () {
    'use strict';

    const VIEW_ID = 'social';
    const MESSAGES = ['socialPostsLoaded', 'socialPostPublished', 'socialAccountConnected'];

    // ── State ──
    let posts = [];
    let accounts = { facebook: false, linkedin: false, instagram: false };
    let stats = { published: 0, impressions: 0, engagement: 0, accounts: 0 };
    let activeTab = 'posts';
    let showComposer = false;

    // ── Render ──
    function render() {
        return `
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button onclick="ROS.views.showView('home')" class="w-8 h-8 neu-s rounded-lg flex items-center justify-center">
            <span class="material-symbols-outlined text-tan text-[16px]">arrow_back</span>
          </button>
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center">
            <span class="material-symbols-outlined text-white text-[16px]">share</span>
          </div>
          <h2 class="text-lg font-bold text-lmdr-dark">Social Posting</h2>
        </div>
        <button onclick="ROS.views._social.toggleComposer()" class="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white text-[12px] font-bold">
          <span class="material-symbols-outlined text-[14px] align-middle mr-1">add</span>Create Post
        </button>
      </div>

      <!-- Stats Strip -->
      <div class="grid grid-cols-4 gap-3 mt-4">
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-purple-400 text-[18px]">article</span>
          <h3 class="text-[20px] font-black text-lmdr-dark mt-0.5">${stats.published}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Published</p>
        </div>
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-blue-400 text-[18px]">visibility</span>
          <h3 class="text-[20px] font-black text-lmdr-dark mt-0.5">${stats.impressions.toLocaleString()}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Impressions</p>
        </div>
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-emerald-500 text-[18px]">favorite</span>
          <h3 class="text-[20px] font-black text-lmdr-dark mt-0.5">${stats.engagement.toLocaleString()}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Engagements</p>
        </div>
        <div class="neu-s p-3 rounded-xl text-center">
          <span class="material-symbols-outlined text-amber-400 text-[18px]">link</span>
          <h3 class="text-[20px] font-black text-lmdr-dark mt-0.5">${stats.accounts}</h3>
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Connected</p>
        </div>
      </div>

      <!-- Connected Accounts -->
      <div class="mt-4">
        <h3 class="text-[12px] font-bold text-lmdr-dark mb-2">Connected Accounts</h3>
        <div class="grid grid-cols-3 gap-3">
          ${renderAccount('facebook', 'Facebook Page', 'public', 'text-blue-500')}
          ${renderAccount('linkedin', 'LinkedIn', 'business_center', 'text-sky-500')}
          ${renderAccount('instagram', 'Instagram', 'photo_camera', 'text-pink-400')}
        </div>
      </div>

      ${showComposer ? renderComposer() : ''}

      <!-- Tabs -->
      <div class="flex gap-4 mt-5 border-b border-tan/20 pb-0">
        <button onclick="ROS.views._social.switchTab('posts')" class="pb-2 text-[12px] font-bold ${activeTab === 'posts' ? 'text-lmdr-blue border-b-2 border-lmdr-blue' : 'text-tan'}">
          <span class="material-symbols-outlined text-[14px] align-middle mr-1">article</span>Posts
        </button>
        <button onclick="ROS.views._social.switchTab('scheduled')" class="pb-2 text-[12px] font-bold ${activeTab === 'scheduled' ? 'text-lmdr-blue border-b-2 border-lmdr-blue' : 'text-tan'}">
          <span class="material-symbols-outlined text-[14px] align-middle mr-1">schedule</span>Scheduled
        </button>
        <button onclick="ROS.views._social.switchTab('analytics')" class="pb-2 text-[12px] font-bold ${activeTab === 'analytics' ? 'text-lmdr-blue border-b-2 border-lmdr-blue' : 'text-tan'}">
          <span class="material-symbols-outlined text-[14px] align-middle mr-1">monitoring</span>Analytics
        </button>
      </div>

      <!-- Content -->
      <div class="mt-4">
        ${activeTab === 'posts' ? renderPosts() : activeTab === 'scheduled' ? renderScheduled() : renderAnalytics()}
      </div>`;
    }

    // ── Render Helpers ──
    function renderAccount(id, name, icon, colorClass) {
        const connected = accounts[id];
        return `
      <div class="neu-x rounded-xl p-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined ${colorClass} text-[18px]">${icon}</span>
          <div>
            <p class="text-[12px] font-bold text-lmdr-dark">${name}</p>
            <p class="text-[9px] text-tan">${connected ? 'Connected' : 'Not connected'}</p>
          </div>
        </div>
        <button onclick="ROS.views._social.connectAccount('${id}')" class="px-2 py-1 rounded-lg text-[10px] font-bold ${connected ? 'neu-ins text-emerald-500' : 'neu-x text-purple-400'}">
          ${connected ? '✓ Active' : 'Connect'}
        </button>
      </div>`;
    }

    function renderComposer() {
        return `
      <div class="mt-4 neu rounded-2xl p-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-[14px] font-bold text-lmdr-dark flex items-center gap-2">
            <span class="material-symbols-outlined text-purple-400 text-[16px]">share</span>Create Social Post
          </h3>
          <button onclick="ROS.views._social.toggleComposer()" class="text-tan hover:text-lmdr-dark">
            <span class="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-3">
            <div>
              <label class="text-[10px] font-bold text-tan uppercase tracking-wider mb-1 block">Platforms</label>
              <div class="flex gap-2">
                <label class="flex items-center gap-1.5 neu-x rounded-lg px-3 py-1.5 cursor-pointer">
                  <input type="checkbox" id="social-fb" checked class="rounded">
                  <span class="material-symbols-outlined text-blue-500 text-[14px]">public</span>
                  <span class="text-[10px] font-bold text-lmdr-dark">FB</span>
                </label>
                <label class="flex items-center gap-1.5 neu-x rounded-lg px-3 py-1.5 cursor-pointer">
                  <input type="checkbox" id="social-li" class="rounded">
                  <span class="material-symbols-outlined text-sky-500 text-[14px]">business_center</span>
                  <span class="text-[10px] font-bold text-lmdr-dark">LI</span>
                </label>
                <label class="flex items-center gap-1.5 neu-x rounded-lg px-3 py-1.5 cursor-pointer">
                  <input type="checkbox" id="social-ig" class="rounded">
                  <span class="material-symbols-outlined text-pink-400 text-[14px]">photo_camera</span>
                  <span class="text-[10px] font-bold text-lmdr-dark">IG</span>
                </label>
              </div>
            </div>
            <textarea id="social-content" rows="4" placeholder="What do you want to share with CDL drivers?"
              class="w-full px-3 py-2.5 rounded-xl neu-in bg-transparent border-none text-[12px] text-lmdr-dark placeholder-tan/50 focus:ring-0 outline-none resize-none"></textarea>
            <button onclick="ROS.views._social.generateAI()" class="w-full px-3 py-2 rounded-xl border border-purple-500/30 text-purple-400 text-[11px] font-bold hover:bg-purple-500/5 transition-all">
              <span class="material-symbols-outlined text-[13px] align-middle mr-1">auto_awesome</span>Generate AI Content
            </button>
            <div class="flex gap-2">
              <button onclick="ROS.views._social.publishPost()" class="flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white text-[11px] font-bold">
                <span class="material-symbols-outlined text-[13px] align-middle mr-1">send</span>Publish Now
              </button>
              <button onclick="ROS.views._social.toggleComposer()" class="px-3 py-2 rounded-xl neu-x text-[11px] font-bold text-tan">Cancel</button>
            </div>
          </div>
          <!-- Preview -->
          <div>
            <p class="text-[10px] font-bold text-tan uppercase tracking-wider mb-2">Preview</p>
            <div class="neu-in rounded-xl p-4">
              <div class="flex items-center gap-2 mb-3">
                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-lmdr-blue to-lmdr-deep flex items-center justify-center">
                  <span class="text-[10px] font-bold text-white">VM</span>
                </div>
                <div>
                  <p class="text-[11px] font-bold text-lmdr-dark">VelocityMatch Recruiting</p>
                  <p class="text-[9px] text-tan">Just now · Public</p>
                </div>
              </div>
              <div id="social-preview-text" class="text-[11px] text-lmdr-dark">Your post content will appear here...</div>
            </div>
          </div>
        </div>
      </div>`;
    }

    function renderPosts() {
        if (!posts.length) {
            return `<div class="neu-in rounded-xl p-8 text-center">
        <span class="material-symbols-outlined text-tan/30 text-[32px]">share</span>
        <p class="text-[12px] text-tan mt-2">No social posts yet. Create one to start engaging on social media.</p>
      </div>`;
        }
        return `<div class="space-y-2">
      ${posts.filter(p => p.status !== 'scheduled').map(p => renderPostCard(p)).join('')}
    </div>`;
    }

    function renderScheduled() {
        const scheduled = posts.filter(p => p.status === 'scheduled');
        if (!scheduled.length) {
            return `<div class="neu-in rounded-xl p-8 text-center">
        <span class="material-symbols-outlined text-tan/30 text-[32px]">schedule</span>
        <p class="text-[12px] text-tan mt-2">No scheduled posts.</p>
      </div>`;
        }
        return `<div class="space-y-2">${scheduled.map(p => renderPostCard(p)).join('')}</div>`;
    }

    function renderPostCard(p) {
        const platforms = (p.platforms || []).map(pl => {
            const icons = { facebook: 'public', linkedin: 'business_center', instagram: 'photo_camera' };
            const colors = { facebook: 'text-blue-500', linkedin: 'text-sky-500', instagram: 'text-pink-400' };
            return `<span class="material-symbols-outlined ${colors[pl] || 'text-tan'} text-[12px]">${icons[pl] || 'share'}</span>`;
        }).join('');
        return `
      <div class="neu-x rounded-xl p-3 flex items-center justify-between">
        <div class="flex-1">
          <p class="text-[12px] font-bold text-lmdr-dark">${escapeHtml((p.content || '').substring(0, 60))}...</p>
          <div class="flex items-center gap-2 mt-1">${platforms}<span class="text-[9px] text-tan">· ${p.date || 'Today'}</span></div>
        </div>
        <div class="flex items-center gap-3">
          <div class="text-right">
            <p class="text-[10px] font-bold text-lmdr-dark">${(p.impressions || 0).toLocaleString()} views</p>
            <p class="text-[9px] text-tan">${p.engagements || 0} engagements</p>
          </div>
        </div>
      </div>`;
    }

    function renderAnalytics() {
        return `<div class="neu rounded-2xl p-5">
      <h3 class="text-[14px] font-bold text-lmdr-dark mb-3">Social Performance</h3>
      <div class="grid grid-cols-3 gap-3">
        <div class="neu-ins rounded-xl p-3 text-center">
          <span class="material-symbols-outlined text-blue-500 text-[20px]">public</span>
          <p class="text-[11px] font-bold text-lmdr-dark mt-1">Facebook</p>
          <p class="text-[9px] text-tan">Best for job ads</p>
        </div>
        <div class="neu-ins rounded-xl p-3 text-center">
          <span class="material-symbols-outlined text-sky-500 text-[20px]">business_center</span>
          <p class="text-[11px] font-bold text-lmdr-dark mt-1">LinkedIn</p>
          <p class="text-[9px] text-tan">Best for company brand</p>
        </div>
        <div class="neu-ins rounded-xl p-3 text-center">
          <span class="material-symbols-outlined text-pink-400 text-[20px]">photo_camera</span>
          <p class="text-[11px] font-bold text-lmdr-dark mt-1">Instagram</p>
          <p class="text-[9px] text-tan">Best for culture posts</p>
        </div>
      </div>
    </div>`;
    }

    // ── Lifecycle ──
    function onMount() {
        ROS.bridge.sendToVelo('fetchSocialPosts', {});
    }

    function onUnmount() {
        posts = [];
        showComposer = false;
    }

    function onMessage(type, payload) {
        switch (type) {
            case 'socialPostsLoaded':
                posts = payload.posts || [];
                accounts = payload.accounts || accounts;
                stats = payload.stats || stats;
                refreshContent();
                break;
            case 'socialPostPublished':
                showToast('Post published!');
                showComposer = false;
                ROS.bridge.sendToVelo('fetchSocialPosts', {});
                break;
            case 'socialAccountConnected':
                accounts[payload.platform] = true;
                showToast(payload.platform + ' connected!');
                refreshContent();
                break;
        }
    }

    function refreshContent() {
        const stage = document.getElementById('ros-stage');
        if (stage) stage.innerHTML = render();
    }

    function escapeHtml(s) {
        if (!s) return '';
        const d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    function showToast(msg) {
        const t = document.createElement('div');
        t.className = 'fixed top-16 right-4 z-[9999] px-4 py-2.5 rounded-xl neu-s text-[12px] font-bold text-lmdr-dark flex items-center gap-2';
        t.style.animation = 'fadeUp .3s ease';
        t.innerHTML = `<span class="material-symbols-outlined text-emerald-500 text-[16px]">check_circle</span>${msg}`;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 3000);
    }

    // ── Public API ──
    ROS.views._social = {
        switchTab(tab) { activeTab = tab; refreshContent(); },
        toggleComposer() { showComposer = !showComposer; refreshContent(); },
        connectAccount(platform) { ROS.bridge.sendToVelo('connectSocialAccount', { platform }); },
        publishPost() {
            const content = document.getElementById('social-content')?.value;
            if (!content) { showToast('Please write post content.'); return; }
            const platforms = [];
            if (document.getElementById('social-fb')?.checked) platforms.push('facebook');
            if (document.getElementById('social-li')?.checked) platforms.push('linkedin');
            if (document.getElementById('social-ig')?.checked) platforms.push('instagram');
            ROS.bridge.sendToVelo('publishSocialPost', { content, platforms });
        },
        generateAI() { showToast('AI content generation — coming soon'); }
    };

    // ── Register ──
    ROS.views.registerView(VIEW_ID, { render, onMount, onUnmount, onMessage, messages: MESSAGES });
})();
