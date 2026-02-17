// ============================================================================
// AI Matching Agent — Chat overlay + voice orb for driver surface
// LMDR branding (driver surface only)
// ============================================================================

(function() {
  'use strict';

  const AGENT_CONFIG = {
    branding: { name: 'LMDR', logo: 'LM', color: '#2563eb' },
    panelWidth: 360,
    maxMessageLength: 2000,
    typingDelay: 300
  };

  let panelOpen = false;
  let conversationId = null;
  let isWaiting = false;

  window.DriverAgent = { init, toggle, send, close, onResponse };

  function init() {
    createAgentButton();
    createAgentPanel();
    initVoice();
    listenForResponses();
  }

  function createAgentButton() {
    const btn = document.createElement('button');
    btn.id = 'agent-fab';
    btn.setAttribute('aria-label', 'Open AI assistant');
    btn.innerHTML = `
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>`;
    btn.style.cssText = `
      position:fixed;bottom:90px;right:24px;z-index:9997;width:48px;height:48px;
      border-radius:50%;border:none;cursor:pointer;display:flex;align-items:center;
      justify-content:center;color:white;
      background:linear-gradient(135deg,#2563eb,#1e40af);
      box-shadow:0 4px 14px rgba(37,99,235,0.4);
      transition:all .2s ease;
    `;
    btn.addEventListener('click', toggle);
    btn.addEventListener('mouseenter', () => { btn.style.transform = 'scale(1.08)'; });
    btn.addEventListener('mouseleave', () => { btn.style.transform = 'scale(1)'; });
    document.body.appendChild(btn);
  }

  function createAgentPanel() {
    const panel = document.createElement('div');
    panel.id = 'agent-panel';
    panel.style.cssText = `
      position:fixed;top:0;right:0;width:${AGENT_CONFIG.panelWidth}px;height:100vh;
      background:#fff;box-shadow:-4px 0 20px rgba(0,0,0,0.12);z-index:9998;
      display:flex;flex-direction:column;font-family:'Inter',sans-serif;
      transform:translateX(100%);transition:transform .3s cubic-bezier(.4,0,.2,1);
    `;
    panel.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:16px;border-bottom:1px solid #e2e8f0;background:linear-gradient(135deg,#f8fafc,#f1f5f9);">
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#2563eb,#1e40af);color:white;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;">LM</div>
          <span style="font-size:14px;font-weight:600;color:#0f172a;">LMDR Assistant</span>
        </div>
        <button id="agent-close" style="width:28px;height:28px;border:none;background:#f1f5f9;border-radius:6px;font-size:16px;color:#64748b;cursor:pointer;display:flex;align-items:center;justify-content:center;" aria-label="Close">&times;</button>
      </div>
      <div id="agent-messages" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;">
        <div style="display:flex;gap:8px;align-items:flex-start;">
          <div style="width:24px;height:24px;border-radius:6px;background:linear-gradient(135deg,#2563eb,#1e40af);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M12 2a3 3 0 0 0-3 3v2H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3V5a3 3 0 0 0-3-3z"/></svg>
          </div>
          <div style="background:#f1f5f9;padding:10px 14px;border-radius:12px;border-bottom-left-radius:4px;font-size:13px;color:#334155;line-height:1.5;max-width:85%;">
            Hey! I'm your LMDR AI assistant. I can help you find carriers, check safety data, explain matches, and more. What would you like to know?
          </div>
        </div>
      </div>
      <div style="padding:12px 16px;border-top:1px solid #e2e8f0;background:#f8fafc;">
        <div style="display:flex;gap:8px;">
          <input id="agent-input" type="text" placeholder="Ask about carriers, safety, matches..."
            style="flex:1;padding:10px 14px;border:1px solid #e2e8f0;border-radius:10px;font-size:13px;font-family:inherit;outline:none;transition:border-color .15s;"
            maxlength="${AGENT_CONFIG.maxMessageLength}">
          <button id="agent-send" style="padding:10px 14px;border:none;border-radius:10px;background:linear-gradient(135deg,#2563eb,#1e40af);color:white;font-size:13px;font-weight:600;cursor:pointer;transition:all .15s;">Send</button>
        </div>
      </div>
    `;
    document.body.appendChild(panel);

    panel.querySelector('#agent-close').addEventListener('click', close);
    panel.querySelector('#agent-send').addEventListener('click', () => {
      const input = panel.querySelector('#agent-input');
      if (input.value.trim()) send(input.value.trim());
      input.value = '';
    });
    panel.querySelector('#agent-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const input = panel.querySelector('#agent-input');
        if (input.value.trim()) send(input.value.trim());
        input.value = '';
      }
    });
    panel.querySelector('#agent-input').addEventListener('focus', function() {
      this.style.borderColor = '#2563eb';
    });
    panel.querySelector('#agent-input').addEventListener('blur', function() {
      this.style.borderColor = '#e2e8f0';
    });
  }

  function toggle() {
    panelOpen ? close() : open();
  }

  function open() {
    const panel = document.getElementById('agent-panel');
    if (panel) {
      panel.style.transform = 'translateX(0)';
      panelOpen = true;
      const input = panel.querySelector('#agent-input');
      if (input) setTimeout(() => input.focus(), 300);
    }
  }

  function close() {
    const panel = document.getElementById('agent-panel');
    if (panel) {
      panel.style.transform = 'translateX(100%)';
      panelOpen = false;
    }
  }

  function send(text) {
    if (isWaiting || !text) return;
    isWaiting = true;

    appendMessage('user', text);
    showTyping();

    // Send to Wix page code via postMessage
    sendToWix('agentMessage', {
      text: text,
      context: { conversationId }
    });
  }

  function onResponse(data) {
    isWaiting = false;
    hideTyping();

    if (data.conversationId) conversationId = data.conversationId;

    if (data.error) {
      appendMessage('assistant', 'Sorry, I ran into an issue. Please try again.');
    } else {
      appendMessage('assistant', data.response || 'No response received.');
    }
  }

  function appendMessage(role, text) {
    const msgs = document.getElementById('agent-messages');
    if (!msgs) return;

    const div = document.createElement('div');
    div.style.cssText = `display:flex;gap:8px;animation:agentMsgIn .3s ease;${role === 'user' ? 'flex-direction:row-reverse;' : ''}`;

    const avatar = role === 'user'
      ? `<div style="width:24px;height:24px;border-radius:6px;background:linear-gradient(135deg,#fbbf24,#f59e0b);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">
           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0f172a" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
         </div>`
      : `<div style="width:24px;height:24px;border-radius:6px;background:linear-gradient(135deg,#2563eb,#1e40af);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">
           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M12 2a3 3 0 0 0-3 3v2H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3V5a3 3 0 0 0-3-3z"/></svg>
         </div>`;

    const bubbleStyle = role === 'user'
      ? 'background:linear-gradient(135deg,#2563eb,#1e40af);color:white;border-bottom-right-radius:4px;'
      : 'background:#f1f5f9;color:#334155;border-bottom-left-radius:4px;';

    div.innerHTML = `
      ${avatar}
      <div style="padding:10px 14px;border-radius:12px;${bubbleStyle}font-size:13px;line-height:1.5;max-width:85%;word-break:break-word;">${escapeHtml(text)}</div>
    `;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function showTyping() {
    const msgs = document.getElementById('agent-messages');
    if (!msgs || document.getElementById('agent-typing')) return;

    const div = document.createElement('div');
    div.id = 'agent-typing';
    div.style.cssText = 'display:flex;gap:8px;animation:agentMsgIn .3s ease;';
    div.innerHTML = `
      <div style="width:24px;height:24px;border-radius:6px;background:linear-gradient(135deg,#2563eb,#1e40af);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M12 2a3 3 0 0 0-3 3v2H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3V5a3 3 0 0 0-3-3z"/></svg>
      </div>
      <div style="padding:10px 14px;border-radius:12px;border-bottom-left-radius:4px;background:#f1f5f9;display:flex;gap:4px;">
        <span style="width:6px;height:6px;border-radius:50%;background:#94a3b8;animation:agentDot 1.4s infinite both;animation-delay:0s;"></span>
        <span style="width:6px;height:6px;border-radius:50%;background:#94a3b8;animation:agentDot 1.4s infinite both;animation-delay:0.2s;"></span>
        <span style="width:6px;height:6px;border-radius:50%;background:#94a3b8;animation:agentDot 1.4s infinite both;animation-delay:0.4s;"></span>
      </div>
    `;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function hideTyping() {
    const el = document.getElementById('agent-typing');
    if (el) el.remove();
  }

  function initVoice() {
    if (!window.VoiceAgent) return;
    VoiceAgent.init({
      containerId: document.body.id || undefined,
      branding: AGENT_CONFIG.branding
    });
    if (window.VoiceAgentBridge) VoiceAgentBridge.init();
  }

  function listenForResponses() {
    window.addEventListener('message', (event) => {
      const msg = event.data;
      if (!msg || !msg.action) return;

      switch (msg.action) {
        case 'agentResponse':
          onResponse(msg.payload || msg.data || {});
          break;
        case 'agentTyping':
          showTyping();
          break;
        case 'agentToolResult':
          // Could display tool results in-line
          break;
        case 'voiceReady':
          if (window.VoiceAgent && msg.payload) {
            VoiceAgent.init({
              publicKey: msg.payload.publicKey,
              assistantId: msg.payload.assistantId,
              branding: AGENT_CONFIG.branding
            });
          }
          break;
      }
    });
  }

  function sendToWix(action, data) {
    if (window.parent) {
      window.parent.postMessage({ action, data }, '*');
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // Inject animation keyframes
  const style = document.createElement('style');
  style.textContent = `
    @keyframes agentMsgIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
    @keyframes agentDot { 0%,80%,100% { transform:scale(0); } 40% { transform:scale(1); } }
    @media (max-width:768px) {
      #agent-panel { width:100vw !important; }
      #agent-fab { bottom:74px !important; right:16px !important; width:44px !important; height:44px !important; }
    }
  `;
  document.head.appendChild(style);

  // Auto-init on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
