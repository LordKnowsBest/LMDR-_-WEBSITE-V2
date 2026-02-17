// ============================================================================
// ROS-VOICE — VelocityMatch Recruiter OS Voice Integration
// Wraps VoiceAgent for the Recruiter surface with campaign support
// ============================================================================

(function () {
  'use strict';

  let voiceReady = false;
  let currentCallId = null;

  ROS.voice = { init, startCall, endCall, isReady, getCurrentCallId };

  function init() {
    if (!window.VoiceAgent) {
      console.warn('[ROS Voice] VoiceAgent not loaded — voice features disabled');
      return;
    }

    window.VoiceAgent.init({
      containerId: 'ros-root',
      branding: {
        name: 'VelocityMatch',
        logo: 'VM',
        primaryColor: '#2563eb',
        secondaryColor: '#1e40af'
      }
    });

    // Request voice config from page code
    if (ROS.bridge && ROS.bridge.send) {
      ROS.bridge.send('getVoiceConfig', {});
    }

    // Listen for voice events
    window.VoiceAgent.on('callStart', (data) => {
      currentCallId = data?.callId || null;
      console.log('[ROS Voice] Call started:', currentCallId);
    });

    window.VoiceAgent.on('callEnd', (data) => {
      console.log('[ROS Voice] Call ended:', currentCallId);
      currentCallId = null;
    });

    window.VoiceAgent.on('transcript', (data) => {
      // Could display live transcript in chat thread
      if (ROS.chat && data?.text) {
        console.log('[ROS Voice] Transcript:', data.text);
      }
    });

    window.VoiceAgent.on('error', (data) => {
      console.error('[ROS Voice] Error:', data);
      if (ROS.chat) {
        ROS.chat.flashMsg('Voice error: ' + (data?.message || 'Connection failed'));
      }
    });

    voiceReady = true;
  }

  function startCall(assistantId, metadata) {
    if (!window.VoiceAgent) {
      console.warn('[ROS Voice] VoiceAgent not available');
      return;
    }
    window.VoiceAgent.startCall(assistantId, metadata);
  }

  function endCall() {
    if (!window.VoiceAgent) return;
    window.VoiceAgent.endCall();
    currentCallId = null;
  }

  function isReady() {
    return voiceReady;
  }

  function getCurrentCallId() {
    return currentCallId;
  }

  // Listen for voiceReady from page code
  window.addEventListener('message', (event) => {
    if (!event.data || event.source !== window.parent) return;
    if (event.data.action === 'voiceReady' && event.data.payload) {
      console.log('[ROS Voice] Config received from page code');
      // VoiceAgent handles SDK configuration internally
    }
  });

})();
