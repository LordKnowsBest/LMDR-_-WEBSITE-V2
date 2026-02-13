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
   * Intent detection — keyword matching against INTENT_MAP
   * Architecture hook: replace this function body with async Claude API call
   * when NLU_ENABLED feature flag is set
   */
  function detectIntent(text) {
    if (ROS.config.features.NLU_ENABLED) {
      // Future: return await classifyIntent(text);
    }
    const lower = text.toLowerCase();
    for (const rule of ROS.INTENT_MAP) {
      if (rule.keys.some(k => lower.includes(k))) return rule;
    }
    return null;
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
