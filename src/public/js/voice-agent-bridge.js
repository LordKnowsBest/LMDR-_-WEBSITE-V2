/**
 * VoiceAgentBridge — Connects VoiceAgent events to Wix page code via postMessage
 *
 * Usage:
 *   VoiceAgentBridge.init(); // After VoiceAgent.init()
 */
(function() {
  'use strict';

  window.VoiceAgentBridge = { init };

  function init() {
    if (!window.VoiceAgent) {
      console.warn('[VoiceAgentBridge] VoiceAgent not loaded');
      return;
    }

    // Forward voice events to Wix page code via postMessage
    VoiceAgent.on('callStart', () => {
      window.parent.postMessage({
        action: 'voiceCallStarted',
        payload: { timestamp: Date.now() }
      }, '*');
    });

    VoiceAgent.on('callEnd', (data) => {
      window.parent.postMessage({
        action: 'voiceCallEnded',
        payload: {
          transcript: data?.transcript || [],
          duration: data?.duration || 0,
          timestamp: Date.now()
        }
      }, '*');
    });

    VoiceAgent.on('transcript', (entry) => {
      window.parent.postMessage({
        action: 'voiceTranscript',
        payload: entry
      }, '*');
    });

    VoiceAgent.on('toolResult', (result) => {
      window.parent.postMessage({
        action: 'voiceToolResult',
        payload: result
      }, '*');
    });

    VoiceAgent.on('error', (err) => {
      window.parent.postMessage({
        action: 'voiceError',
        payload: { message: err?.message || 'Voice error' }
      }, '*');
    });

    // Listen for messages from Wix page code
    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (!msg || !msg.action) return;

      switch (msg.action) {
        case 'voiceReady': {
          // Page code sending voice configuration
          if (msg.payload?.publicKey) {
            VoiceAgent.init({
              ...VoiceAgent.getState(),
              publicKey: msg.payload.publicKey,
              assistantId: msg.payload.assistantId
            });
          }
          break;
        }
        case 'startVoiceCall': {
          VoiceAgent.startCall();
          break;
        }
        case 'endVoiceCall': {
          VoiceAgent.endCall();
          break;
        }
      }
    });

    console.log('[VoiceAgentBridge] Initialized');
  }
})();
