// ============================================================================
// ROS-VIEW-SOCIAL-SETTINGS — Social Platform Credential Management
// Allows recruiters to configure API credentials for Facebook, Instagram, LinkedIn
// ============================================================================

(function () {
    'use strict';

    const VIEW_ID = 'social-settings';
    const MESSAGES = ['socialCredentialsSaved', 'socialConnectionTested', 'socialCredentialStatusLoaded'];

    // ── State ──
    let credentialStatus = { facebook: 'unconfigured', instagram: 'unconfigured', linkedin: 'unconfigured' };
    let expanded = { facebook: false, instagram: false, linkedin: false };
    let saving = { facebook: false, instagram: false, linkedin: false };

    // ── Platform Config ──
    const PLATFORMS = [
        {
            id: 'facebook',
            name: 'Facebook / Meta',
            icon: 'public',
            iconColor: 'text-blue-500',
            fields: [
                { key: 'appId',      label: 'Meta App ID',         type: 'text',     placeholder: 'e.g. 1234567890123456' },
                { key: 'appSecret',  label: 'Meta App Secret',     type: 'password', placeholder: 'App secret from Meta dashboard' },
                { key: 'pageId',     label: 'Facebook Page ID',    type: 'text',     placeholder: 'e.g. 108xxxxxxxxxxxxxx' },
                { key: 'pageToken',  label: 'Page Access Token',   type: 'password', placeholder: 'Long-lived page token' }
            ]
        },
        {
            id: 'instagram',
            name: 'Instagram',
            icon: 'photo_camera',
            iconColor: 'text-pink-400',
            fields: [
                { key: 'igUserId', label: 'Instagram Business Account ID', type: 'text', placeholder: 'e.g. 17841xxxxxxxxxx' }
            ],
            note: 'Instagram uses your Meta App ID, App Secret, and Page Token from the Facebook section above.'
        },
        {
            id: 'linkedin',
            name: 'LinkedIn',
            icon: 'business_center',
            iconColor: 'text-sky-500',
            fields: [
                { key: 'clientId',     label: 'Client ID',        type: 'text',     placeholder: 'LinkedIn app client ID' },
                { key: 'clientSecret', label: 'Client Secret',    type: 'password', placeholder: 'LinkedIn app client secret' },
                { key: 'accessToken',  label: 'Access Token',     type: 'password', placeholder: 'OAuth 2.0 access token' },
                { key: 'orgUrn',       label: 'Organization URN', type: 'text',     placeholder: 'urn:li:organization:xxxxxxx' }
            ]
        }
    ];

    // ── Render ──
    function render() {
        return `
      <!-- Header -->
      <div class="flex items-center gap-3">
        <button onclick="ROS.views.showView('social')" class="w-8 h-8 neu-s rounded-lg flex items-center justify-center">
          <span class="material-symbols-outlined text-tan text-[16px]">arrow_back</span>
        </button>
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-lmdr-blue to-lmdr-deep flex items-center justify-center">
          <span class="material-symbols-outlined text-white text-[16px]">lock</span>
        </div>
        <div>
          <h2 class="text-lg font-bold text-lmdr-dark leading-tight">Account Credentials</h2>
          <p class="text-[10px] text-tan leading-tight">Connect your social platforms to start posting</p>
        </div>
      </div>

      <!-- Platform Sections -->
      <div class="mt-5 space-y-4">
        ${PLATFORMS.map(p => renderPlatformCard(p)).join('')}
      </div>`;
    }

    function renderPlatformCard(platform) {
        const status = credentialStatus[platform.id] || 'unconfigured';
        const isExpanded = expanded[platform.id];
        const isSaving = saving[platform.id];

        return `
      <div class="neu rounded-2xl p-4">
        <!-- Platform Header -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 neu-s rounded-xl flex items-center justify-center">
              <span class="material-symbols-outlined ${platform.iconColor} text-[20px]">${platform.icon}</span>
            </div>
            <div>
              <p class="text-[13px] font-bold text-lmdr-dark">${platform.name}</p>
              ${renderStatusChip(status)}
            </div>
          </div>
          <button
            onclick="ROS.views._socialSettings.toggleExpand('${platform.id}')"
            class="px-3 py-1.5 rounded-lg neu-x text-[11px] font-bold text-lmdr-blue flex items-center gap-1">
            <span class="material-symbols-outlined text-[13px]">${isExpanded ? 'expand_less' : 'settings'}</span>
            ${isExpanded ? 'Collapse' : 'Configure'}
          </button>
        </div>

        <!-- Collapsible Fields -->
        ${isExpanded ? renderFields(platform, isSaving) : ''}
      </div>`;
    }

    function renderStatusChip(status) {
        if (status === 'connected') {
            return `<span class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-0.5">
              <span class="material-symbols-outlined text-[11px]">check_circle</span>Connected
            </span>`;
        }
        if (status === 'expired') {
            return `<span class="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full mt-0.5">
              <span class="material-symbols-outlined text-[11px]">warning</span>Token expired
            </span>`;
        }
        return `<span class="inline-flex items-center gap-1 text-[10px] font-bold text-tan bg-tan/10 px-2 py-0.5 rounded-full mt-0.5">
            <span class="material-symbols-outlined text-[11px]">radio_button_unchecked</span>Not configured
          </span>`;
    }

    function renderFields(platform, isSaving) {
        const fieldRows = platform.fields.map(f => `
        <div>
          <label class="text-[10px] font-bold text-tan uppercase tracking-wider mb-1 block">${escapeHtml(f.label)}</label>
          <input
            id="ss-${platform.id}-${f.key}"
            type="${f.type}"
            placeholder="${escapeHtml(f.placeholder)}"
            class="w-full px-3 py-2 rounded-xl neu-in bg-transparent border-none text-[12px] text-lmdr-dark placeholder-tan/40 focus:ring-0 outline-none"/>
        </div>`).join('');

        const noteHtml = platform.note
            ? `<p class="text-[10px] text-tan/80 bg-tan/5 rounded-lg px-3 py-2 border border-tan/20 flex items-start gap-1.5">
                 <span class="material-symbols-outlined text-[13px] mt-0.5 shrink-0">info</span>
                 ${escapeHtml(platform.note)}
               </p>`
            : '';

        return `
        <div class="mt-4 space-y-3">
          ${noteHtml}
          ${fieldRows}
          <div class="flex gap-2 pt-1">
            <button
              onclick="ROS.views._socialSettings.saveCredentials('${platform.id}')"
              ${isSaving ? 'disabled' : ''}
              class="flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-lmdr-blue to-lmdr-deep text-white text-[11px] font-bold flex items-center justify-center gap-1.5 ${isSaving ? 'opacity-60 cursor-not-allowed' : ''}">
              <span class="material-symbols-outlined text-[13px]">${isSaving ? 'hourglass_empty' : 'save'}</span>
              ${isSaving ? 'Saving\u2026' : 'Save'}
            </button>
            <button
              onclick="ROS.views._socialSettings.testConnection('${platform.id}')"
              class="px-3 py-2 rounded-xl neu-x text-[11px] font-bold text-lmdr-dark flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[13px]">wifi_tethering</span>Test
            </button>
          </div>
        </div>`;
    }

    // ── Lifecycle ──
    function onMount() {
        ROS.bridge.sendToVelo('getSocialCredentialStatus', {});
    }

    function onUnmount() {
        expanded = { facebook: false, instagram: false, linkedin: false };
        saving  = { facebook: false, instagram: false, linkedin: false };
    }

    function onMessage(type, payload) {
        switch (type) {
            case 'socialCredentialStatusLoaded':
                if (payload && payload.status) {
                    credentialStatus = Object.assign(credentialStatus, payload.status);
                }
                refreshContent();
                break;

            case 'socialCredentialsSaved': {
                const platform = payload && payload.platform;
                if (platform) {
                    saving[platform] = false;
                    if (payload.status) credentialStatus[platform] = payload.status;
                }
                const saved = payload && payload.success;
                showToast(
                    saved ? 'Credentials saved successfully!' : 'Save failed: ' + escapeHtml((payload && payload.error) || 'Unknown error'),
                    !saved
                );
                refreshContent();
                break;
            }

            case 'socialConnectionTested': {
                const platform = payload && payload.platform;
                const label = platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : 'Platform';
                if (payload && payload.success) {
                    if (platform) credentialStatus[platform] = 'connected';
                    showToast('\u2713 ' + label + ' connected!', false);
                } else {
                    showToast('Connection failed: ' + escapeHtml((payload && payload.error) || 'Unknown error'), true);
                }
                refreshContent();
                break;
            }
        }
    }

    // ── Helpers ──
    function refreshContent() {
        const stage = document.getElementById('ros-stage');
        if (stage) stage.innerHTML = render(); // All user data sanitized via escapeHtml before injection
    }

    function escapeHtml(s) {
        if (!s) return '';
        const d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    function showToast(msg, isError) {
        const t = document.createElement('div');
        t.className = 'fixed top-16 right-4 z-[9999] px-4 py-2.5 rounded-xl neu-s text-[12px] font-bold text-lmdr-dark flex items-center gap-2';
        t.style.animation = 'fadeUp .3s ease';
        const iconName  = isError ? 'error' : 'check_circle';
        const iconColor = isError ? 'text-red-500' : 'text-emerald-500';
        // Toast content uses escapeHtml(msg) — no raw user input interpolated directly
        t.innerHTML = `<span class="material-symbols-outlined ${iconColor} text-[16px]">${iconName}</span>${escapeHtml(msg)}`;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 3500);
    }

    // ── Public API ──
    ROS.views._socialSettings = {
        toggleExpand(platform) {
            expanded[platform] = !expanded[platform];
            refreshContent();
        },

        saveCredentials(platform) {
            const config = PLATFORMS.find(p => p.id === platform);
            if (!config) return;

            const credentials = {};
            config.fields.forEach(f => {
                const el = document.getElementById('ss-' + platform + '-' + f.key);
                if (el) credentials[f.key] = el.value.trim();
            });

            // Instagram also shares Meta App ID / App Secret / Page Token from Facebook inputs
            if (platform === 'instagram') {
                const appIdEl     = document.getElementById('ss-facebook-appId');
                const appSecretEl = document.getElementById('ss-facebook-appSecret');
                const pageTokenEl = document.getElementById('ss-facebook-pageToken');
                if (appIdEl)     credentials.appId     = appIdEl.value.trim();
                if (appSecretEl) credentials.appSecret = appSecretEl.value.trim();
                if (pageTokenEl) credentials.pageToken = pageTokenEl.value.trim();
            }

            saving[platform] = true;
            refreshContent();
            ROS.bridge.sendToVelo('saveSocialCredentials', { platform, credentials });
        },

        testConnection(platform) {
            ROS.bridge.sendToVelo('testSocialConnection', { platform });
        }
    };

    // ── Register ──
    ROS.views.registerView(VIEW_ID, { render, onMount, onUnmount, onMessage, messages: MESSAGES });
})();
