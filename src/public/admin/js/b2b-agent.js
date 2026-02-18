// ============================================================================
// B2B-AGENT — VelocityMatch B2B Agent Chat Overlay
// Floating chat FAB + sliding panel for carrier/B2B conversational management
// ============================================================================

(function () {
  'use strict';

  let panelOpen = false;
  let messages = [];

  function init() {
    if (document.getElementById('vm-b2b-agent-fab')) return;

    // FAB button
    const fab = document.createElement('button');
    fab.id = 'vm-b2b-agent-fab';
    fab.innerHTML = `<span style="font-size:22px;font-weight:700;font-family:Inter,sans-serif;letter-spacing:-0.5px">VM</span>`;
    Object.assign(fab.style, {
      position: 'fixed', bottom: '90px', right: '24px', width: '48px', height: '48px',
      borderRadius: '50%', border: 'none', cursor: 'pointer', zIndex: '9998',
      background: 'linear-gradient(135deg, #2563eb, #1e40af)',
      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 4px 16px rgba(37,99,235,0.4)', transition: 'transform 0.2s'
    });
    fab.addEventListener('mouseenter', () => { fab.style.transform = 'scale(1.1)'; });
    fab.addEventListener('mouseleave', () => { fab.style.transform = 'scale(1)'; });
    fab.addEventListener('click', togglePanel);
    document.body.appendChild(fab);

    // Panel
    const panel = document.createElement('div');
    panel.id = 'vm-b2b-agent-panel';
    Object.assign(panel.style, {
      position: 'fixed', top: '0', right: '-380px', width: '360px', height: '100%',
      background: '#0f172a', borderLeft: '1px solid #1e293b', zIndex: '9999',
      display: 'flex', flexDirection: 'column', transition: 'right 0.3s ease',
      fontFamily: 'Inter, sans-serif'
    });
    panel.innerHTML = `
      <div style="padding:16px 20px;border-bottom:1px solid #1e293b;display:flex;align-items:center;justify-content:space-between">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:32px;height:32px;border-radius:10px;background:linear-gradient(135deg,#2563eb,#1e40af);display:flex;align-items:center;justify-content:center">
            <span style="font-size:12px;font-weight:700;color:#fff">VM</span>
          </div>
          <div>
            <div style="font-size:14px;font-weight:600;color:#f8fafc">B2B Assistant</div>
            <div style="font-size:11px;color:#94a3b8">VelocityMatch AI</div>
          </div>
        </div>
        <button id="vm-b2b-agent-close" style="background:none;border:none;cursor:pointer;color:#94a3b8;font-size:20px">&times;</button>
      </div>
      <div id="vm-b2b-agent-messages" style="flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px"></div>
      <div style="padding:12px 16px;border-top:1px solid #1e293b;display:flex;gap:8px">
        <input id="vm-b2b-agent-input" type="text" placeholder="Ask about accounts, signals, pipeline..."
          style="flex:1;background:#1e293b;border:1px solid #334155;border-radius:10px;padding:10px 14px;color:#f8fafc;font-size:13px;outline:none" />
        <button id="vm-b2b-agent-send"
          style="background:linear-gradient(135deg,#2563eb,#1e40af);border:none;border-radius:10px;width:40px;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px">&#10148;</button>
      </div>`;
    document.body.appendChild(panel);

    document.getElementById('vm-b2b-agent-close').addEventListener('click', togglePanel);
    document.getElementById('vm-b2b-agent-send').addEventListener('click', sendMessage);
    document.getElementById('vm-b2b-agent-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') sendMessage();
    });

    addBotMessage('Hi! I can help you manage carrier accounts, review buy signals, explore pipeline opportunities, and plan next-best actions. What would you like to know?');

    // Init voice if available
    if (window.VoiceAgent) {
      window.VoiceAgent.init({
        containerId: 'vm-b2b-agent-panel',
        branding: { name: 'VelocityMatch', logo: 'VM', primaryColor: '#2563eb' }
      });
    }
  }

  function togglePanel() {
    panelOpen = !panelOpen;
    const panel = document.getElementById('vm-b2b-agent-panel');
    if (panel) {
      panel.style.right = panelOpen ? '0' : '-380px';
    }
  }

  function sendMessage() {
    const input = document.getElementById('vm-b2b-agent-input');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    addUserMessage(text);
    showTyping();

    window.parent.postMessage({ action: 'agentMessage', payload: { text } }, '*');
  }

  function addUserMessage(text) {
    const container = document.getElementById('vm-b2b-agent-messages');
    if (!container) return;
    const div = document.createElement('div');
    div.style.cssText = 'display:flex;justify-content:flex-end';
    div.innerHTML = `<div style="background:linear-gradient(135deg,#2563eb,#1e40af);color:#fff;padding:10px 14px;border-radius:14px 14px 4px 14px;font-size:13px;max-width:85%;line-height:1.5">${escapeHtml(text)}</div>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    messages.push({ role: 'user', text });
  }

  function addBotMessage(text) {
    removeTyping();
    const container = document.getElementById('vm-b2b-agent-messages');
    if (!container) return;
    const div = document.createElement('div');
    div.style.cssText = 'display:flex;gap:8px';
    div.innerHTML = `
      <div style="width:24px;height:24px;border-radius:8px;background:linear-gradient(135deg,#2563eb,#1e40af);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px">
        <span style="font-size:9px;font-weight:700;color:#fff">VM</span>
      </div>
      <div style="background:#1e293b;color:#e2e8f0;padding:10px 14px;border-radius:14px 14px 14px 4px;font-size:13px;max-width:85%;line-height:1.5">${text}</div>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    messages.push({ role: 'assistant', text });
  }

  function showTyping() {
    removeTyping();
    const container = document.getElementById('vm-b2b-agent-messages');
    if (!container) return;
    const div = document.createElement('div');
    div.id = 'vm-b2b-typing';
    div.style.cssText = 'display:flex;gap:8px';
    div.innerHTML = `
      <div style="width:24px;height:24px;border-radius:8px;background:linear-gradient(135deg,#2563eb,#1e40af);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px">
        <span style="font-size:9px;font-weight:700;color:#fff">VM</span>
      </div>
      <div style="background:#1e293b;padding:12px 16px;border-radius:14px 14px 14px 4px;display:flex;gap:4px">
        <span style="width:6px;height:6px;border-radius:50%;background:#64748b;animation:vmB2bPulse 1.4s ease-in-out infinite"></span>
        <span style="width:6px;height:6px;border-radius:50%;background:#64748b;animation:vmB2bPulse 1.4s ease-in-out 0.2s infinite"></span>
        <span style="width:6px;height:6px;border-radius:50%;background:#64748b;animation:vmB2bPulse 1.4s ease-in-out 0.4s infinite"></span>
      </div>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function removeTyping() {
    const el = document.getElementById('vm-b2b-typing');
    if (el) el.remove();
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // Listen for responses from page code
  window.addEventListener('message', (event) => {
    if (!event.data || event.source !== window.parent) return;
    const { action, payload } = event.data;

    if (action === 'agentResponse' && payload) {
      const text = payload.error || payload.response || payload.content || 'Done.';
      addBotMessage(text);
    }

    if (action === 'agentApprovalRequired' && payload) {
      onApprovalRequired(payload);
    }
  });

  function onApprovalRequired(payload) {
    removeTyping();
    const { toolName, toolDescription, args, riskLevel } = payload;
    const container = document.getElementById('vm-b2b-agent-messages');
    if (!container) return;

    const argsSummary = Object.entries(args || {})
      .map(([k, v]) => `<span style="color:#64748b">${k}:</span> ${String(v).substring(0, 60)}`)
      .join('<br>');

    const cardDiv = document.createElement('div');
    cardDiv.style.cssText = 'display:flex;gap:8px';
    cardDiv.innerHTML = `
      <div style="width:24px;height:24px;border-radius:8px;background:linear-gradient(135deg,#2563eb,#1e40af);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px">
        <span style="font-size:9px;font-weight:700;color:#fff">VM</span>
      </div>
      <div style="border:2px solid rgba(96,165,250,0.4);background:rgba(239,246,255,0.05);padding:12px 14px;border-radius:14px 14px 14px 4px;font-size:12px;max-width:85%;line-height:1.5;color:#e2e8f0;">
        <div style="font-weight:600;color:#60a5fa;margin-bottom:6px;">Approval Required</div>
        <div style="margin-bottom:4px;font-weight:500;">${escapeHtml(toolDescription || toolName)}</div>
        <div style="font-size:11px;margin-bottom:8px;opacity:0.7;line-height:1.6;">${argsSummary}</div>
        <div style="font-size:10px;color:#93c5fd;margin-bottom:8px;">Risk: ${escapeHtml(riskLevel)} &middot; Tool: ${escapeHtml(toolName)}</div>
        <div style="display:flex;gap:8px;">
          <button data-gate-decision="rejected"
            style="padding:5px 12px;border-radius:8px;background:#7f1d1d;color:#fca5a5;font-size:11px;font-weight:500;border:none;cursor:pointer;">Reject</button>
          <button data-gate-decision="approved"
            style="padding:5px 12px;border-radius:8px;background:#14532d;color:#86efac;font-size:11px;font-weight:500;border:none;cursor:pointer;">Approve</button>
        </div>
      </div>`;

    cardDiv.querySelectorAll('button[data-gate-decision]').forEach(btn => {
      btn.addEventListener('click', function() {
        const decision = this.getAttribute('data-gate-decision');
        cardDiv.querySelectorAll('button').forEach(b => { b.disabled = true; b.style.opacity = '0.5'; });
        showTyping();
        window.parent.postMessage({
          action: 'resolveApprovalGate',
          payload: { approvalContext: payload, decision, decidedBy: 'user' }
        }, '*');
      });
    });

    container.appendChild(cardDiv);
    container.scrollTop = container.scrollHeight;
  }

  // Inject typing animation
  const style = document.createElement('style');
  style.textContent = `@keyframes vmB2bPulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}`;
  document.head.appendChild(style);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
