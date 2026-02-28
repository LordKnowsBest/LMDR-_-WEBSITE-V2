// ============================================================================
// ROS-VIEW-SOCIAL — Social Media Posting (Facebook, LinkedIn, Instagram)
// Ported from: Recruiter_Social_Posting.html
// ============================================================================

(function () {
    'use strict';

    const VIEW_ID = 'social';
    const MESSAGES = ['socialPostsLoaded', 'socialPostPublished', 'socialAccountConnected', 'socialCopyGenerated', 'socialImageGenerated'];

    // ── Platform Format Catalog ──
    const SOCIAL_FORMATS = {
        facebook: [
            { label: 'Feed Square',   ratio: '1:1',    px: '1080×1080', apiRatio: '1:1'  },
            { label: 'Feed Portrait', ratio: '4:5',    px: '1080×1350', apiRatio: '4:5'  },
            { label: 'Story / Reel',  ratio: '9:16',   px: '1080×1920', apiRatio: '9:16' },
            { label: 'Ad / Link',     ratio: '1.91:1', px: '1200×628',  apiRatio: '16:9' }
        ],
        instagram: [
            { label: 'Feed Square',   ratio: '1:1',    px: '1080×1080', apiRatio: '1:1'  },
            { label: 'Feed Portrait', ratio: '4:5',    px: '1080×1350', apiRatio: '4:5'  },
            { label: 'Story / Reel',  ratio: '9:16',   px: '1080×1920', apiRatio: '9:16' }
        ],
        linkedin: [
            { label: 'Feed Post',     ratio: '1:1',    px: '1200×1200', apiRatio: '1:1'  },
            { label: 'Link Preview',  ratio: '1.91:1', px: '1200×627',  apiRatio: '16:9' }
        ]
    };

    const STYLE_OPTIONS = [
        { id: 'professional photo', label: 'Professional Photo', icon: 'photo_camera' },
        { id: 'bold graphic',       label: 'Bold Graphic',       icon: 'palette' },
        { id: 'illustrated',        label: 'Illustrated',        icon: 'brush' },
        { id: 'minimal',            label: 'Minimal',            icon: 'crop_square' }
    ];

    // ── State ──
    let posts = [];
    let accounts = { facebook: false, linkedin: false, instagram: false };
    let stats = { published: 0, impressions: 0, engagement: 0, accounts: 0 };
    let activeTab = 'posts';
    let showComposer = false;
    let composerTab = 'copy'; // 'copy' | 'image'
    let imageState = {
        selectedFormat: null,  // apiRatio string e.g. '1:1'
        prompt: '',
        style: 'professional photo',
        generating: false,
        base64: null,
        mimeType: null,
        mediaUrl: null
    };

    // ── Helpers ──
    function getSelectedPlatforms() {
        const platforms = [];
        if (document.getElementById('social-fb')?.checked) platforms.push('facebook');
        if (document.getElementById('social-li')?.checked) platforms.push('linkedin');
        if (document.getElementById('social-ig')?.checked) platforms.push('instagram');
        return platforms.length ? platforms : ['facebook'];
    }

    function getFormatIntersection(platforms) {
        if (!platforms.length) return SOCIAL_FORMATS.facebook;
        const sets = platforms.map(p => new Set((SOCIAL_FORMATS[p] || []).map(f => f.apiRatio)));
        const common = (SOCIAL_FORMATS[platforms[0]] || []).filter(f =>
            sets.every(s => s.has(f.apiRatio))
        );
        // Deduplicate by apiRatio
        const seen = new Set();
        return common.filter(f => { if (seen.has(f.apiRatio)) return false; seen.add(f.apiRatio); return true; });
    }

    function escapeHtml(s) {
        if (!s) return '';
        const d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    function showToast(msg, isError = false) {
        const t = document.createElement('div');
        t.className = 'fixed top-16 right-4 z-[9999] px-4 py-2.5 rounded-xl neu-s text-[12px] font-bold text-lmdr-dark flex items-center gap-2';
        t.style.animation = 'fadeUp .3s ease';
        const icon = isError ? 'error' : 'check_circle';
        const color = isError ? 'text-red-500' : 'text-emerald-500';
        t.innerHTML = `<span class="material-symbols-outlined ${color} text-[16px]">${icon}</span>${msg}`;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 3000);
    }

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
        <button onclick="ROS.views._social.openSettings('${id}')" class="px-2 py-1 rounded-lg text-[10px] font-bold ${connected ? 'neu-ins text-emerald-500' : 'neu-x text-purple-400'}">
          ${connected ? '✓ Active' : 'Connect'}
        </button>
      </div>`;
    }

    function renderComposer() {
        return `
      <div class="mt-4 neu rounded-2xl p-5">
        <!-- Composer Header -->
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-[14px] font-bold text-lmdr-dark flex items-center gap-2">
            <span class="material-symbols-outlined text-purple-400 text-[16px]">share</span>Create Social Post
          </h3>
          <button onclick="ROS.views._social.toggleComposer()" class="text-tan hover:text-lmdr-dark">
            <span class="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        <!-- Platform Checkboxes (shared between tabs) -->
        <div class="mb-3">
          <label class="text-[10px] font-bold text-tan uppercase tracking-wider mb-1.5 block">Platforms</label>
          <div class="flex gap-2">
            <label class="flex items-center gap-1.5 neu-x rounded-lg px-3 py-1.5 cursor-pointer">
              <input type="checkbox" id="social-fb" checked class="rounded" onchange="ROS.views._social.onPlatformChange()">
              <span class="material-symbols-outlined text-blue-500 text-[14px]">public</span>
              <span class="text-[10px] font-bold text-lmdr-dark">FB</span>
            </label>
            <label class="flex items-center gap-1.5 neu-x rounded-lg px-3 py-1.5 cursor-pointer">
              <input type="checkbox" id="social-li" class="rounded" onchange="ROS.views._social.onPlatformChange()">
              <span class="material-symbols-outlined text-sky-500 text-[14px]">business_center</span>
              <span class="text-[10px] font-bold text-lmdr-dark">LI</span>
            </label>
            <label class="flex items-center gap-1.5 neu-x rounded-lg px-3 py-1.5 cursor-pointer">
              <input type="checkbox" id="social-ig" class="rounded" onchange="ROS.views._social.onPlatformChange()">
              <span class="material-symbols-outlined text-pink-400 text-[14px]">photo_camera</span>
              <span class="text-[10px] font-bold text-lmdr-dark">IG</span>
            </label>
          </div>
        </div>

        <!-- Composer Tab Strip -->
        <div class="flex gap-1 mb-4 p-1 neu-ins rounded-xl">
          <button onclick="ROS.views._social.switchComposerTab('copy')"
            class="flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5
              ${composerTab === 'copy' ? 'neu-x text-lmdr-dark' : 'text-tan'}">
            <span class="material-symbols-outlined text-[13px]">text_fields</span>Copy
          </button>
          <button onclick="ROS.views._social.switchComposerTab('image')"
            class="flex-1 py-1.5 rounded-lg text-[11px] font-bold transition-all flex items-center justify-center gap-1.5
              ${composerTab === 'image' ? 'neu-x text-lmdr-dark' : 'text-tan'}">
            <span class="material-symbols-outlined text-[13px]">image</span>Image
          </button>
        </div>

        ${composerTab === 'copy' ? renderCopyTab() : renderImageTab()}
      </div>`;
    }

    function renderCopyTab() {
        return `
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-3">
          <textarea id="social-content" rows="5" placeholder="What do you want to share with CDL drivers?"
            class="w-full px-3 py-2.5 rounded-xl neu-in bg-transparent border-none text-[12px] text-lmdr-dark placeholder-tan/50 focus:ring-0 outline-none resize-none"></textarea>
          <button id="social-gen-btn" onclick="ROS.views._social.generateAI()" class="w-full px-3 py-2 rounded-xl border border-purple-500/30 text-purple-400 text-[11px] font-bold hover:bg-purple-500/5 transition-all">
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
            <div id="social-preview-text" class="text-[11px] text-lmdr-dark leading-relaxed">Your post content will appear here...</div>
          </div>
        </div>
      </div>`;
    }

    function renderImageTab() {
        const platforms = getSelectedPlatforms();
        const formats = getFormatIntersection(platforms);
        const hasImage = !!imageState.base64;

        return `
      <div class="grid grid-cols-2 gap-4">
        <!-- Left: Controls -->
        <div class="space-y-4">

          <!-- Format Picker -->
          <div>
            <label class="text-[10px] font-bold text-tan uppercase tracking-wider mb-2 block">Format</label>
            <div class="grid grid-cols-2 gap-2">
              ${formats.map(f => {
                  const active = imageState.selectedFormat === f.apiRatio;
                  return `
                <button onclick="ROS.views._social.selectFormat('${f.apiRatio}')"
                  class="p-2.5 rounded-xl text-left transition-all ${active ? 'neu-ins border border-purple-400/40' : 'neu-x hover:border-purple-400/20 border border-transparent'}">
                  <div class="flex items-center gap-1.5 mb-1">
                    ${renderRatioThumb(f.apiRatio, active)}
                    <span class="text-[10px] font-bold ${active ? 'text-purple-500' : 'text-lmdr-dark'}">${f.label}</span>
                  </div>
                  <p class="text-[9px] text-tan">${f.px} · ${f.ratio}</p>
                </button>`;
              }).join('')}
            </div>
          </div>

          <!-- Prompt -->
          <div>
            <label class="text-[10px] font-bold text-tan uppercase tracking-wider mb-1.5 block">Describe the Image</label>
            <textarea id="image-prompt" rows="3" placeholder="e.g. A professional CDL truck driver with a big rig at sunrise, American highway, cinematic lighting"
              class="w-full px-3 py-2.5 rounded-xl neu-in bg-transparent border-none text-[12px] text-lmdr-dark placeholder-tan/50 focus:ring-0 outline-none resize-none"
              oninput="ROS.views._social.onPromptInput(this.value)">${escapeHtml(imageState.prompt)}</textarea>
          </div>

          <!-- Style Selector -->
          <div>
            <label class="text-[10px] font-bold text-tan uppercase tracking-wider mb-1.5 block">Style</label>
            <div class="grid grid-cols-2 gap-1.5">
              ${STYLE_OPTIONS.map(s => {
                  const active = imageState.style === s.id;
                  return `
                <button onclick="ROS.views._social.selectStyle('${s.id}')"
                  class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all ${active ? 'neu-ins text-purple-500 border border-purple-400/40' : 'neu-x text-tan border border-transparent'}">
                  <span class="material-symbols-outlined text-[13px]">${s.icon}</span>${s.label}
                </button>`;
              }).join('')}
            </div>
          </div>

          <!-- Generate Button -->
          <button id="image-gen-btn" onclick="ROS.views._social.generateImage()"
            class="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white text-[12px] font-bold flex items-center justify-center gap-2 ${imageState.generating ? 'opacity-70 cursor-not-allowed' : ''}">
            ${imageState.generating
                ? `<span class="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>Generating...`
                : `<span class="material-symbols-outlined text-[14px]">image</span>Generate Image`
            }
          </button>
        </div>

        <!-- Right: Preview -->
        <div>
          <p class="text-[10px] font-bold text-tan uppercase tracking-wider mb-2">Preview</p>
          <div class="neu-in rounded-xl p-3 min-h-[200px] flex flex-col items-center justify-center">
            ${hasImage ? renderImagePreview() : renderImagePlaceholder()}
          </div>
          ${hasImage ? `
          <div class="flex gap-2 mt-2">
            <button onclick="ROS.views._social.downloadImage()" class="flex-1 px-3 py-2 rounded-xl neu-x text-[11px] font-bold text-lmdr-dark flex items-center justify-center gap-1">
              <span class="material-symbols-outlined text-[13px]">download</span>Download PNG
            </button>
            <button onclick="ROS.views._social.generateImage()" class="px-3 py-2 rounded-xl border border-purple-400/30 text-purple-400 text-[11px] font-bold flex items-center gap-1">
              <span class="material-symbols-outlined text-[13px]">refresh</span>Retry
            </button>
          </div>` : ''}
        </div>
      </div>`;
    }

    function renderRatioThumb(apiRatio, active) {
        // Small visual ratio indicator
        const dims = {
            '1:1':  'w-[14px] h-[14px]',
            '4:5':  'w-[11px] h-[14px]',
            '9:16': 'w-[8px]  h-[14px]',
            '16:9': 'w-[14px] h-[8px]'
        };
        const cls = dims[apiRatio] || 'w-[14px] h-[14px]';
        const bg = active ? 'bg-purple-400/60' : 'bg-tan/40';
        return `<div class="rounded-sm border ${active ? 'border-purple-400' : 'border-tan/50'} ${cls} ${bg} flex-shrink-0"></div>`;
    }

    function renderImagePreview() {
        const src = imageState.mediaUrl
            ? imageState.mediaUrl
            : `data:${imageState.mimeType};base64,${imageState.base64}`;
        return `<img id="social-gen-image" src="${src}" alt="Generated" class="max-w-full max-h-[260px] rounded-xl object-contain" style="max-height:260px"/>`;
    }

    function renderImagePlaceholder() {
        return `
      <div class="text-center">
        <span class="material-symbols-outlined text-tan/30 text-[40px]">image</span>
        <p class="text-[11px] text-tan mt-2">Your generated image will appear here</p>
        <p class="text-[9px] text-tan/60 mt-1">Select a format, describe the image, then click Generate</p>
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
        composerTab = 'copy';
        imageState = { selectedFormat: null, prompt: '', style: 'professional photo', generating: false, base64: null, mimeType: null, mediaUrl: null };
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
            case 'socialCopyGenerated': {
                if (payload.success) {
                    const ta = document.getElementById('social-content');
                    if (ta) ta.value = payload.copy || '';
                    const preview = document.getElementById('social-preview-text');
                    if (preview) preview.textContent = payload.copy || '';
                } else {
                    showToast('Copy generation failed: ' + (payload.error || 'Unknown error'), true);
                }
                const genBtn = document.getElementById('social-gen-btn');
                if (genBtn) genBtn.innerHTML = '<span class="material-symbols-outlined text-[13px] align-middle mr-1">auto_awesome</span>Generate AI Content';
                break;
            }
            case 'socialImageGenerated': {
                imageState.generating = false;
                if (payload.success) {
                    imageState.base64 = payload.base64 || null;
                    imageState.mimeType = payload.mimeType || 'image/png';
                    imageState.mediaUrl = payload.mediaUrl || null;
                    refreshContent();
                    showToast('Image generated!');
                } else {
                    refreshContent();
                    showToast('Image generation failed: ' + (payload.error || 'Unknown error'), true);
                }
                break;
            }
        }
    }

    function refreshContent() {
        const stage = document.getElementById('ros-stage');
        if (stage) stage.innerHTML = render();
    }

    // ── Public API ──
    ROS.views._social = {
        switchTab(tab) { activeTab = tab; refreshContent(); },

        toggleComposer() {
            showComposer = !showComposer;
            if (!showComposer) {
                composerTab = 'copy';
                imageState = { selectedFormat: null, prompt: '', style: 'professional photo', generating: false, base64: null, mimeType: null, mediaUrl: null };
            }
            refreshContent();
        },

        switchComposerTab(tab) {
            composerTab = tab;
            refreshContent();
        },

        onPlatformChange() {
            // Re-render image tab format picker when platforms change
            if (composerTab === 'image') refreshContent();
        },

        connectAccount(platform) { ROS.bridge.sendToVelo('connectSocialAccount', { platform }); },
        openSettings(platform) { ROS.views.showView('social-settings'); },

        publishPost() {
            const content = document.getElementById('social-content')?.value;
            if (!content) { showToast('Please write post content.'); return; }
            const platforms = getSelectedPlatforms();
            ROS.bridge.sendToVelo('publishSocialPost', { content, platforms });
        },

        generateAI() {
            const content = document.getElementById('social-content')?.value || '';
            const platforms = getSelectedPlatforms();
            const platform = platforms[0] || 'facebook';
            const profile = ROS.config?.profile || {};
            const btn = document.getElementById('social-gen-btn');
            if (btn) btn.innerHTML = '<span class="material-symbols-outlined text-[13px] align-middle mr-1 animate-spin">progress_activity</span>Generating...';
            ROS.bridge.sendToVelo('generateSocialCopy', {
                brief: content,
                platform,
                companyName: profile.company_name || profile.agency_name || '',
                jobTitle: 'CDL-A Driver'
            });
        },

        selectFormat(apiRatio) {
            imageState.selectedFormat = apiRatio;
            refreshContent();
        },

        selectStyle(styleId) {
            imageState.style = styleId;
            refreshContent();
        },

        onPromptInput(value) {
            imageState.prompt = value;
        },

        generateImage() {
            const promptEl = document.getElementById('image-prompt');
            const prompt = promptEl?.value || imageState.prompt;
            if (!prompt.trim()) { showToast('Please describe the image you want to generate.'); return; }
            if (!imageState.selectedFormat) { showToast('Please select a format first.'); return; }
            imageState.prompt = prompt;
            imageState.generating = true;
            imageState.base64 = null;
            imageState.mediaUrl = null;
            refreshContent();
            const platforms = getSelectedPlatforms();
            ROS.bridge.sendToVelo('generateSocialImage', {
                prompt,
                platform: platforms[0] || 'facebook',
                aspectRatio: imageState.selectedFormat,
                style: imageState.style
            });
        },

        downloadImage() {
            if (!imageState.base64 && !imageState.mediaUrl) return;
            const a = document.createElement('a');
            if (imageState.mediaUrl) {
                a.href = imageState.mediaUrl;
            } else {
                a.href = `data:${imageState.mimeType || 'image/png'};base64,${imageState.base64}`;
            }
            a.download = `social-image-${imageState.selectedFormat?.replace(':', 'x') || '1x1'}.png`;
            a.click();
        }
    };

    // ── Register ──
    ROS.views.registerView(VIEW_ID, { render, onMount, onUnmount, onMessage, messages: MESSAGES });
})();
