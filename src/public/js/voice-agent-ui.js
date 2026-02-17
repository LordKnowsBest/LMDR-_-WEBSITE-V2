/**
 * VoiceAgent — Reusable Voice Orb + Transcript Panel
 * Integrates VAPI Web SDK for browser-based voice calls
 *
 * Usage:
 *   VoiceAgent.init({ containerId: 'app-root', publicKey: '...', assistantId: '...' });
 *   VoiceAgent.startCall();
 *   VoiceAgent.on('transcript', (data) => console.log(data));
 */
(function() {
  'use strict';

  const STATE = {
    IDLE: 'idle',
    CONNECTING: 'connecting',
    ACTIVE: 'active',
    ENDING: 'ending'
  };

  let state = STATE.IDLE;
  let vapiInstance = null;
  let config = {};
  let listeners = {};
  let transcriptEntries = [];
  let orbEl = null;
  let panelEl = null;

  window.VoiceAgent = { init, startCall, endCall, getState, on, off, destroy };

  function init(cfg) {
    config = {
      containerId: cfg.containerId || 'app-root',
      assistantId: cfg.assistantId || null,
      publicKey: cfg.publicKey || null,
      branding: cfg.branding || { name: 'VelocityMatch', logo: 'VM', color: '#2563eb' },
      position: cfg.position || 'bottom-right',
      onTranscript: cfg.onTranscript || null,
      onCallEnd: cfg.onCallEnd || null,
      ...cfg
    };

    createOrbUI();
    createTranscriptPanel();
    loadVapiSDK();
  }

  function createOrbUI() {
    const container = document.getElementById(config.containerId) || document.body;

    orbEl = document.createElement('button');
    orbEl.id = 'voice-orb';
    orbEl.className = 'voice-orb voice-orb--idle';
    orbEl.setAttribute('aria-label', 'Start voice call');
    orbEl.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
        <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
        <line x1="12" y1="19" x2="12" y2="23"/>
        <line x1="8" y1="23" x2="16" y2="23"/>
      </svg>
      <span class="voice-orb__pulse"></span>
    `;

    orbEl.addEventListener('click', handleOrbClick);
    container.appendChild(orbEl);
  }

  function createTranscriptPanel() {
    const container = document.getElementById(config.containerId) || document.body;

    panelEl = document.createElement('div');
    panelEl.id = 'voice-transcript-panel';
    panelEl.className = 'voice-panel voice-panel--hidden';
    panelEl.innerHTML = `
      <div class="voice-panel__header">
        <div class="voice-panel__header-left">
          <span class="voice-panel__brand">${config.branding.logo}</span>
          <span class="voice-panel__title">Voice Call</span>
        </div>
        <div class="voice-panel__header-right">
          <span id="voice-duration" class="voice-panel__duration">00:00</span>
          <button id="voice-panel-close" class="voice-panel__close" aria-label="Close transcript">&times;</button>
        </div>
      </div>
      <div id="voice-transcript-list" class="voice-panel__transcript"></div>
      <div class="voice-panel__footer">
        <div id="voice-status" class="voice-panel__status">Ready</div>
        <button id="voice-end-btn" class="voice-panel__end-btn" style="display:none;">End Call</button>
      </div>
    `;

    container.appendChild(panelEl);

    panelEl.querySelector('#voice-panel-close').addEventListener('click', togglePanel);
    panelEl.querySelector('#voice-end-btn').addEventListener('click', endCall);
  }

  function loadVapiSDK() {
    if (window.Vapi) return;

    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/gh/VapiAI/html-script-tag@latest/dist/assets/index.js';
    script.async = true;
    script.onload = () => {
      console.log('[VoiceAgent] VAPI SDK loaded');
      emit('sdkReady');
    };
    script.onerror = () => {
      console.error('[VoiceAgent] Failed to load VAPI SDK');
      emit('error', { message: 'Failed to load voice SDK' });
    };
    document.head.appendChild(script);
  }

  function handleOrbClick() {
    if (state === STATE.IDLE) {
      startCall();
    } else if (state === STATE.ACTIVE) {
      togglePanel();
    } else if (state === STATE.CONNECTING) {
      // Do nothing while connecting
    }
  }

  async function startCall() {
    if (state !== STATE.IDLE) return;
    if (!config.publicKey) {
      emit('error', { message: 'Voice not configured — missing public key' });
      return;
    }

    setState(STATE.CONNECTING);

    try {
      if (!window.Vapi) {
        throw new Error('VAPI SDK not loaded yet');
      }

      vapiInstance = new window.Vapi(config.publicKey);

      vapiInstance.on('call-start', () => {
        setState(STATE.ACTIVE);
        showPanel();
        startDurationTimer();
        emit('callStart');
      });

      vapiInstance.on('call-end', () => {
        setState(STATE.IDLE);
        stopDurationTimer();
        emit('callEnd', { transcript: transcriptEntries });
        if (config.onCallEnd) config.onCallEnd(transcriptEntries);
      });

      vapiInstance.on('message', (msg) => {
        if (msg.type === 'transcript') {
          const entry = {
            role: msg.role,
            text: msg.transcript,
            timestamp: Date.now(),
            isFinal: msg.transcriptType === 'final'
          };

          if (entry.isFinal) {
            transcriptEntries.push(entry);
            appendTranscriptEntry(entry);
            emit('transcript', entry);
            if (config.onTranscript) config.onTranscript(entry);
          }
        }

        if (msg.type === 'function-call-result' || msg.type === 'tool-call-result') {
          emit('toolResult', msg);
        }
      });

      vapiInstance.on('error', (err) => {
        console.error('[VoiceAgent] VAPI error:', err);
        setState(STATE.IDLE);
        stopDurationTimer();
        emit('error', err);
      });

      // Start the call
      if (config.assistantId) {
        await vapiInstance.start(config.assistantId);
      } else {
        await vapiInstance.start({
          model: {
            provider: 'anthropic',
            model: 'claude-sonnet-4-20250514',
            messages: [{
              role: 'system',
              content: 'You are a helpful assistant for truck drivers and recruiters.'
            }]
          },
          voice: { provider: '11labs', voiceId: 'paula' }
        });
      }
    } catch (error) {
      console.error('[VoiceAgent] Start call failed:', error);
      setState(STATE.IDLE);
      emit('error', { message: error.message });
    }
  }

  function endCall() {
    if (state !== STATE.ACTIVE && state !== STATE.CONNECTING) return;
    setState(STATE.ENDING);

    if (vapiInstance) {
      vapiInstance.stop();
    }

    setTimeout(() => {
      if (state === STATE.ENDING) setState(STATE.IDLE);
    }, 5000);
  }

  function setState(newState) {
    state = newState;
    if (orbEl) {
      orbEl.className = `voice-orb voice-orb--${newState}`;
      orbEl.setAttribute('aria-label',
        newState === STATE.IDLE ? 'Start voice call' :
        newState === STATE.CONNECTING ? 'Connecting...' :
        newState === STATE.ACTIVE ? 'Voice call active' : 'Ending call'
      );
    }

    const endBtn = document.getElementById('voice-end-btn');
    if (endBtn) endBtn.style.display = newState === STATE.ACTIVE ? 'block' : 'none';

    const statusEl = document.getElementById('voice-status');
    if (statusEl) {
      statusEl.textContent =
        newState === STATE.IDLE ? 'Ready' :
        newState === STATE.CONNECTING ? 'Connecting...' :
        newState === STATE.ACTIVE ? 'Listening...' : 'Ending...';
    }
  }

  function showPanel() {
    if (panelEl) panelEl.classList.remove('voice-panel--hidden');
  }

  function togglePanel() {
    if (panelEl) panelEl.classList.toggle('voice-panel--hidden');
  }

  function appendTranscriptEntry(entry) {
    const list = document.getElementById('voice-transcript-list');
    if (!list) return;

    const div = document.createElement('div');
    div.className = `voice-transcript-entry voice-transcript-entry--${entry.role}`;
    div.innerHTML = `
      <span class="voice-transcript-entry__role">${entry.role === 'user' ? 'You' : 'AI'}</span>
      <span class="voice-transcript-entry__text">${escapeHtml(entry.text)}</span>
    `;
    list.appendChild(div);
    list.scrollTop = list.scrollHeight;
  }

  // Duration timer
  let durationInterval = null;
  let durationSeconds = 0;

  function startDurationTimer() {
    durationSeconds = 0;
    const el = document.getElementById('voice-duration');
    durationInterval = setInterval(() => {
      durationSeconds++;
      if (el) {
        const m = Math.floor(durationSeconds / 60).toString().padStart(2, '0');
        const s = (durationSeconds % 60).toString().padStart(2, '0');
        el.textContent = `${m}:${s}`;
      }
    }, 1000);
  }

  function stopDurationTimer() {
    if (durationInterval) {
      clearInterval(durationInterval);
      durationInterval = null;
    }
  }

  // Event system
  function on(event, callback) {
    if (!listeners[event]) listeners[event] = [];
    listeners[event].push(callback);
  }

  function off(event, callback) {
    if (!listeners[event]) return;
    listeners[event] = listeners[event].filter(cb => cb !== callback);
  }

  function emit(event, data) {
    (listeners[event] || []).forEach(cb => {
      try { cb(data); } catch (e) { console.error(`[VoiceAgent] Event handler error [${event}]:`, e); }
    });
  }

  function getState() { return state; }

  function destroy() {
    endCall();
    stopDurationTimer();
    if (orbEl) orbEl.remove();
    if (panelEl) panelEl.remove();
    listeners = {};
    transcriptEntries = [];
    vapiInstance = null;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
