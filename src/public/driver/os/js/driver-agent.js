/**
 * driver-agent.js
 * ═══════════════════════════════════════════════════════════════════
 * Agent chat overlay for DriverOS.
 * Floating FAB + bottom-sheet chat panel with bridge integration.
 *
 * Depends on: driver-os-config.js, driver-os-bridge.js
 * Provides:  DOS.agent
 * ═══════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  window.DOS = window.DOS || {};

  /* ── Private State ─────────────────────────────────────────────── */

  var _panel = null;
  var _fab = null;
  var _messageList = null;
  var _input = null;
  var _typingIndicator = null;
  var _voiceActive = false;
  var _voiceBtn = null;
  var _built = false;

  /* ── Helpers ────────────────────────────────────────────────────── */

  function el(tag, className, textContent) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (textContent !== undefined) node.textContent = textContent;
    return node;
  }

  function icon(name, size) {
    var span = el('span', 'material-symbols-outlined');
    span.textContent = name;
    if (size) span.style.fontSize = size + 'px';
    return span;
  }

  function scrollToBottom() {
    if (_messageList) {
      _messageList.scrollTop = _messageList.scrollHeight;
    }
  }

  /* ── Build Context Payload ─────────────────────────────────────── */

  function buildContext() {
    return {
      currentView: (DOS.views && DOS.views.current) || null,
      viewSnapshot: (DOS.views && typeof DOS.views.getViewSnapshot === 'function')
        ? DOS.views.getViewSnapshot()
        : {},
      marketCondition: (DOS.market && DOS.market.condition) || null
    };
  }

  /* ── Message Rendering ─────────────────────────────────────────── */

  function appendMessage(text, role) {
    if (!_messageList) return;

    var isDriver = role === 'driver';
    var bubble = el('div');
    bubble.style.cssText = [
      'max-width:80%',
      'padding:10px 14px',
      'border-radius:12px',
      'font-size:14px',
      'line-height:1.45',
      'word-wrap:break-word',
      isDriver ? 'align-self:flex-end' : 'align-self:flex-start',
      isDriver ? 'background:#fef3c7' : 'background:#f1f5f9',
      isDriver ? 'color:#92400e' : 'color:#1e293b'
    ].join(';');
    bubble.textContent = text;

    _messageList.appendChild(bubble);
    hideTyping();
    scrollToBottom();
  }

  /* ── Typing Indicator ──────────────────────────────────────────── */

  function showTyping() {
    if (!_typingIndicator || !_messageList) return;
    _typingIndicator.style.display = 'flex';
    _messageList.appendChild(_typingIndicator);
    scrollToBottom();
  }

  function hideTyping() {
    if (!_typingIndicator) return;
    _typingIndicator.style.display = 'none';
    if (_typingIndicator.parentNode) {
      _typingIndicator.parentNode.removeChild(_typingIndicator);
    }
  }

  function buildTypingIndicator() {
    var wrap = el('div');
    wrap.style.cssText =
      'display:none;align-self:flex-start;gap:4px;padding:10px 14px;' +
      'background:#f1f5f9;border-radius:12px;align-items:center';
    for (var i = 0; i < 3; i++) {
      var dot = el('span');
      dot.style.cssText =
        'width:6px;height:6px;border-radius:50%;background:#94a3b8;' +
        'animation:dos-agent-dot 1.2s ease-in-out infinite';
      dot.style.animationDelay = (i * 0.2) + 's';
      wrap.appendChild(dot);
    }
    return wrap;
  }

  function injectKeyframes() {
    if (document.getElementById('dos-agent-keyframes')) return;
    var style = document.createElement('style');
    style.id = 'dos-agent-keyframes';
    style.textContent =
      '@keyframes dos-agent-dot{0%,80%,100%{opacity:.3;transform:scale(.8)}' +
      '40%{opacity:1;transform:scale(1.1)}}' +
      '@keyframes dos-agent-pulse{0%,100%{box-shadow:0 0 0 0 rgba(37,99,235,0.4)}' +
      '50%{box-shadow:0 0 0 8px rgba(37,99,235,0)}}';
    document.head.appendChild(style);
  }

  /* ── Send Message ──────────────────────────────────────────────── */

  function sendMessage() {
    if (!_input) return;
    var text = _input.value.trim();
    if (!text) return;

    _input.value = '';
    appendMessage(text, 'driver');
    showTyping();

    if (DOS.bridge && typeof DOS.bridge.send === 'function') {
      DOS.bridge.send('agentMessage', {
        text: text,
        context: buildContext()
      });
    }
  }

  /* ── Voice Toggle (stub) ───────────────────────────────────────── */

  function toggleVoice() {
    _voiceActive = !_voiceActive;
    if (!_voiceBtn) return;

    var ic = _voiceBtn.querySelector('.material-symbols-outlined');
    if (ic) ic.textContent = _voiceActive ? 'mic_off' : 'mic';

    if (_voiceActive) {
      _voiceBtn.style.animation = 'dos-agent-pulse 1.5s infinite';
    } else {
      _voiceBtn.style.animation = 'none';
    }
  }

  /* ── Build DOM ─────────────────────────────────────────────────── */

  function build() {
    if (_built) return;
    _built = true;

    injectKeyframes();

    // ── FAB ──
    _fab = el('button', 'dos-agent-fab');
    _fab.setAttribute('aria-label', 'Open LMDR Agent');
    _fab.appendChild(icon('smart_toy', 26));
    _fab.addEventListener('click', function () { agent.toggle(); });

    // ── Panel ──
    _panel = el('div', 'dos-agent-panel');

    // Drag handle
    var handleWrap = el('div');
    handleWrap.style.cssText = 'display:flex;justify-content:center;padding:8px 0 4px';
    handleWrap.appendChild(el('div', 'dos-agent-panel-handle'));
    _panel.appendChild(handleWrap);

    // Header
    var header = el('div');
    header.style.cssText =
      'display:flex;align-items:center;justify-content:space-between;' +
      'padding:0 16px 12px;border-bottom:1px solid #e2e8f0;flex-shrink:0';

    var title = el('span', '', 'LMDR Agent');
    title.style.cssText = 'font-weight:700;font-size:16px;color:#0f172a';

    var closeBtn = el('button');
    closeBtn.style.cssText =
      'width:48px;height:48px;display:flex;align-items:center;justify-content:center;' +
      'border:none;background:none;cursor:pointer;-webkit-tap-highlight-color:transparent';
    closeBtn.setAttribute('aria-label', 'Close agent');
    closeBtn.appendChild(icon('close', 22));
    closeBtn.addEventListener('click', function () { agent.close(); });

    header.appendChild(title);
    header.appendChild(closeBtn);
    _panel.appendChild(header);

    // Message list
    _messageList = el('div');
    _messageList.style.cssText =
      'flex:1;overflow-y:auto;padding:12px 16px;display:flex;' +
      'flex-direction:column;gap:8px;-webkit-overflow-scrolling:touch';
    _panel.appendChild(_messageList);

    // Typing indicator (cached)
    _typingIndicator = buildTypingIndicator();

    // Input bar
    var inputBar = el('div');
    inputBar.style.cssText =
      'display:flex;align-items:center;gap:8px;padding:10px 12px;' +
      'border-top:1px solid #e2e8f0;flex-shrink:0';

    _input = el('input', 'dos-input');
    _input.type = 'text';
    _input.placeholder = 'Ask anything...';
    _input.style.cssText = 'flex:1;font-size:16px;min-width:0';
    _input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') sendMessage();
    });

    var sendBtn = el('button', 'dos-btn-primary');
    sendBtn.style.cssText =
      'width:48px;height:48px;display:flex;align-items:center;justify-content:center;' +
      'flex-shrink:0;border-radius:12px;padding:0';
    sendBtn.setAttribute('aria-label', 'Send message');
    sendBtn.appendChild(icon('send', 22));
    sendBtn.addEventListener('click', sendMessage);

    _voiceBtn = el('button', 'dos-btn-ghost');
    _voiceBtn.style.cssText =
      'width:48px;height:48px;display:flex;align-items:center;justify-content:center;' +
      'flex-shrink:0;border-radius:12px;padding:0';
    _voiceBtn.setAttribute('aria-label', 'Toggle voice');
    _voiceBtn.appendChild(icon('mic', 22));
    _voiceBtn.addEventListener('click', toggleVoice);

    inputBar.appendChild(_input);
    inputBar.appendChild(sendBtn);
    inputBar.appendChild(_voiceBtn);
    _panel.appendChild(inputBar);

    // Append to body
    document.body.appendChild(_fab);
    document.body.appendChild(_panel);
  }

  /* ── Bridge Listeners ──────────────────────────────────────────── */

  function bindBridge() {
    if (!DOS.bridge || typeof DOS.bridge.on !== 'function') return;

    DOS.bridge.on('agentResponse', function (payload) {
      var text = (payload && payload.text) || (typeof payload === 'string' ? payload : '');
      if (text) appendMessage(text, 'agent');
    });

    DOS.bridge.on('agentTyping', function () {
      showTyping();
    });
  }

  /* ── Public API ────────────────────────────────────────────────── */

  var agent = {
    init: function () {
      build();
      bindBridge();
    },

    toggle: function () {
      if (!_panel) build();
      if (_panel.classList.contains('open')) {
        this.close();
      } else {
        this.open();
      }
    },

    open: function () {
      if (!_panel) build();
      _panel.classList.add('open');
      _fab.style.display = 'none';
      if (_input) {
        setTimeout(function () { _input.focus(); }, 350);
      }
    },

    close: function () {
      if (!_panel) return;
      _panel.classList.remove('open');
      _fab.style.display = '';
    },

    isOpen: function () {
      return _panel ? _panel.classList.contains('open') : false;
    }
  };

  DOS.agent = agent;
})();
