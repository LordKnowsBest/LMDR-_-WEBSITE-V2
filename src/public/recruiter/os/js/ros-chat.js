// ============================================================================
// ROS-CHAT — AI Chat Thread (push layout, 400px)
// Intent detection, future Claude API drop-in ready
// ============================================================================

(function() {
  'use strict';

  let threadOpen = false;

  ROS.chat = { send, handleSend, flashMsg, openThread, closeThread, detectIntent };

  /**
   * Handle send from the command bar input
   */
  function handleSend() {
    const input = document.getElementById('chatInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    send(text);
  }

  /**
   * Send a chat message — shows in thread, detects intent, routes to view
   */
  function send(text) {
    openThread();
    const msgs = document.getElementById('chatMsgs');
    if (!msgs) return;

    // User bubble
    const userDiv = document.createElement('div');
    userDiv.className = 'flex gap-2.5 justify-end';
    userDiv.style.animation = 'msgIn .3s ease';
    userDiv.innerHTML = `
      <div class="p-3 rounded-2xl rounded-tr-sm bg-gradient-to-br from-lmdr-blue to-lmdr-deep text-[12px] text-white leading-relaxed max-w-[85%]">${escapeHtml(text)}</div>
      <div class="w-6 h-6 rounded-lg bg-gradient-to-br from-lmdr-yb to-lmdr-yellow flex items-center justify-center shrink-0 mt-0.5">
        <span class="material-symbols-outlined text-lmdr-dark text-[12px]">person</span>
      </div>`;
    msgs.appendChild(userDiv);
    msgs.scrollTop = msgs.scrollHeight;

    // Typing indicator
    setTimeout(() => {
      const tp = document.createElement('div');
      tp.className = 'flex gap-2.5';
      tp.id = 'ros-tp';
      tp.style.animation = 'msgIn .3s ease';
      tp.innerHTML = `
        <div class="w-6 h-6 rounded-lg bg-gradient-to-br from-lmdr-blue to-lmdr-deep flex items-center justify-center shrink-0 mt-0.5">
          <span class="material-symbols-outlined text-white text-[12px]">smart_toy</span>
        </div>
        <div class="p-3 rounded-2xl rounded-tl-sm neu-ins">
          <div class="flex gap-1">
            <span class="td w-1.5 h-1.5 rounded-full bg-tan"></span>
            <span class="td w-1.5 h-1.5 rounded-full bg-tan"></span>
            <span class="td w-1.5 h-1.5 rounded-full bg-tan"></span>
          </div>
        </div>`;
      msgs.appendChild(tp);
      msgs.scrollTop = msgs.scrollHeight;

      // Response
      setTimeout(() => {
        tp.remove();
        const intent = detectIntent(text);
        const responseText = intent ? intent.msg : getFallbackResponse(text);

        const aiDiv = document.createElement('div');
        aiDiv.className = 'flex gap-2.5';
        aiDiv.style.animation = 'msgIn .3s ease';
        aiDiv.innerHTML = `
          <div class="w-6 h-6 rounded-lg bg-gradient-to-br from-lmdr-blue to-lmdr-deep flex items-center justify-center shrink-0 mt-0.5">
            <span class="material-symbols-outlined text-white text-[12px]">smart_toy</span>
          </div>
          <div class="p-3 rounded-2xl rounded-tl-sm neu-ins text-[12px] text-lmdr-dark/80 leading-relaxed max-w-[90%]">${responseText}</div>`;
        msgs.appendChild(aiDiv);
        msgs.scrollTop = msgs.scrollHeight;

        // Route to view if intent matched
        if (intent) {
          setTimeout(() => ROS.views.showView(intent.view), 400);
        }
      }, 1000);
    }, 300);
  }

  /**
   * Flash message — for tool clicks that show a quick notification
   */
  function flashMsg(text) {
    openThread();
    setTimeout(() => {
      const msgs = document.getElementById('chatMsgs');
      if (!msgs) return;
      const div = document.createElement('div');
      div.className = 'flex gap-2.5';
      div.style.animation = 'msgIn .3s ease';
      div.innerHTML = `
        <div class="w-6 h-6 rounded-lg bg-gradient-to-br from-lmdr-blue to-lmdr-deep flex items-center justify-center shrink-0 mt-0.5">
          <span class="material-symbols-outlined text-white text-[12px]">smart_toy</span>
        </div>
        <div class="p-3 rounded-2xl rounded-tl-sm neu-ins text-[12px] text-lmdr-dark/80 flex items-center gap-2">
          <span class="material-symbols-outlined text-lmdr-blue text-[14px]" style="animation:pulse 1.5s infinite">info</span>${escapeHtml(text)}
        </div>`;
      msgs.appendChild(div);
      msgs.scrollTop = msgs.scrollHeight;
    }, 100);
  }

  /**
   * Intent detection — keyword matching against INTENT_MAP with NLU fallback.
   * When NLU_ENABLED, sends message to agentService via postMessage bridge
   * and falls back to keyword matching for instant local routing.
   */
  function detectIntent(text) {
    // Always try keyword matching first for instant view routing
    const lower = text.toLowerCase();
    for (const rule of ROS.INTENT_MAP) {
      if (rule.keys.some(k => lower.includes(k))) return rule;
    }

    // If NLU enabled and no keyword match, route to agent for intelligent response
    if (ROS.config.features.NLU_ENABLED) {
      sendToAgent(text);
      return null; // No immediate view routing — agent response arrives async
    }

    return null;
  }

  /**
   * Send a message to the agent orchestration layer via postMessage bridge
   */
  function sendToAgent(text) {
    if (window.parent) {
      window.parent.postMessage({
        type: 'recruiterOS',
        action: 'agentMessage',
        data: { text, context: { surface: 'recruiter' } }
      }, '*');
    }
  }

  // Listen for agent responses from page code
  window.addEventListener('message', function (event) {
    if (!event.data || event.source !== window.parent) return;

    if (event.data.action === 'agentResponse' && event.data.payload) {
      const payload = event.data.payload;
      const text = payload.error || payload.response || payload.content || 'I couldn\'t process that request.';
      // Remove typing indicator and show agent response
      const tp = document.getElementById('ros-tp');
      if (tp) tp.remove();
      const msgs = document.getElementById('chatMsgs');
      if (!msgs) return;
      const aiDiv = document.createElement('div');
      aiDiv.className = 'flex gap-2.5';
      aiDiv.style.animation = 'msgIn .3s ease';
      aiDiv.innerHTML = `
        <div class="w-6 h-6 rounded-lg bg-gradient-to-br from-lmdr-blue to-lmdr-deep flex items-center justify-center shrink-0 mt-0.5">
          <span class="material-symbols-outlined text-white text-[12px]">smart_toy</span>
        </div>
        <div class="p-3 rounded-2xl rounded-tl-sm neu-ins text-[12px] text-lmdr-dark/80 leading-relaxed max-w-[90%]">${text}</div>`;
      msgs.appendChild(aiDiv);
      msgs.scrollTop = msgs.scrollHeight;
    }

    if (event.data.action === 'agentApprovalRequired' && event.data.payload) {
      onApprovalRequired(event.data.payload);
    }
  });

  function onApprovalRequired(payload) {
    const tp = document.getElementById('ros-tp');
    if (tp) tp.remove();

    const { toolName, toolDescription, args, riskLevel } = payload;
    const msgs = document.getElementById('chatMsgs');
    if (!msgs) return;

    const argsSummary = Object.entries(args || {})
      .map(([k, v]) => `<span class="text-lmdr-dark/50">${k}:</span> ${String(v).substring(0, 60)}`)
      .join('<br>');

    const cardDiv = document.createElement('div');
    cardDiv.className = 'flex gap-2.5';
    cardDiv.style.animation = 'msgIn .3s ease';
    cardDiv.innerHTML = `
      <div class="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 mt-0.5">
        <span class="material-symbols-outlined text-white text-[12px]">shield</span>
      </div>
      <div class="p-3 rounded-2xl rounded-tl-sm border-2 border-amber-400/50 bg-amber-50/80 text-[12px] text-lmdr-dark/80 leading-relaxed max-w-[90%] w-full">
        <div class="font-semibold text-amber-700 mb-1.5">Approval Required</div>
        <div class="mb-1 font-medium">${escapeHtml(toolDescription || toolName)}</div>
        <div class="text-[11px] mb-2 opacity-70">${argsSummary}</div>
        <div class="text-[10px] text-amber-600 mb-2">Risk: ${escapeHtml(riskLevel)} &middot; Tool: ${escapeHtml(toolName)}</div>
        <div style="display:flex;gap:8px;">
          <button data-gate-decision="rejected"
            style="padding:4px 12px;border-radius:8px;background:#fee2e2;color:#dc2626;font-size:11px;font-weight:500;border:none;cursor:pointer;">Reject</button>
          <button data-gate-decision="approved"
            style="padding:4px 12px;border-radius:8px;background:#dcfce7;color:#16a34a;font-size:11px;font-weight:500;border:none;cursor:pointer;">Approve</button>
        </div>
      </div>`;

    cardDiv.querySelectorAll('button[data-gate-decision]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var decision = this.getAttribute('data-gate-decision');
        cardDiv.querySelectorAll('button').forEach(function(b) { b.disabled = true; b.style.opacity = '0.5'; });
        window.parent.postMessage({
          type: 'recruiterOS',
          action: 'resolveApprovalGate',
          data: { approvalContext: payload, decision: decision, decidedBy: 'user' }
        }, '*');
      });
    });

    msgs.appendChild(cardDiv);
    msgs.scrollTop = msgs.scrollHeight;
  }

  function getFallbackResponse(text) {
    const l = text.toLowerCase();
    if (l.includes('hello') || l.includes('hey') || l.includes('hi')) {
      return 'Hey! Ready to crush it today. What would you like to work on?';
    }
    if (l.includes('help')) {
      return 'I can search drivers, manage your pipeline, run analytics, check on onboarding, pull competitor intel, and more. Just tell me what you need or click a chip below.';
    }
    return 'Thinking on that... Try asking about specific tools like "show matches", "open pipeline", or "run analytics" and I\'ll load them right into your workspace.';
  }

  function openThread() {
    if (threadOpen) return;
    const thread = document.getElementById('chatThread');
    if (thread) thread.classList.add('open');
    threadOpen = true;
    // Push layout on desktop only
    if (window.innerWidth > 768) {
      ROS.shell.pushChatLayout(true);
    }
  }

  function closeThread() {
    const thread = document.getElementById('chatThread');
    if (thread) thread.classList.remove('open');
    threadOpen = false;
    ROS.shell.pushChatLayout(false);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

})();
