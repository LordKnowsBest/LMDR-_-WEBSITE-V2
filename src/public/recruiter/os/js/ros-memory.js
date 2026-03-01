// ============================================================================
// ROS-MEMORY — Agent Conversation Memory
// Loads recent session summaries from Pinecone lmdr-memory namespace on
// chat panel open. Shows a collapsible "Previous sessions" section above
// the chat thread when memories exist.
// ============================================================================

(function () {
  'use strict';

  ROS.memory = { init, load };

  var _loaded = false;
  var _summaries = [];

  // ── Init ──────────────────────────────────────────────────────────────────
  function init() {
    // Patch bridge routing to intercept agentMemoryLoaded
    var _orig = ROS.views.routeMessage;
    ROS.views.routeMessage = function (type, data) {
      if (type === 'agentMemoryLoaded') { _applyMemory(data); return true; }
      return _orig(type, data);
    };
  }

  // ── Load — call when chat thread opens ───────────────────────────────────
  function load(userId) {
    if (_loaded) return;
    ROS.bridge.sendToVelo('getAgentMemory', { userId: userId || 'anonymous' });
  }

  // ── Apply memory data ─────────────────────────────────────────────────────
  function _applyMemory(data) {
    _loaded = true;
    _summaries = (data && data.summaries) || [];
    if (!data || !data.hasMemory || !_summaries.length) return;
    _renderInChat(_summaries);
  }

  // ── Render collapsible summary block ──────────────────────────────────────
  function _renderInChat(summaries) {
    var msgs = document.getElementById('chatMsgs');
    if (!msgs) return;

    // Avoid duplicates
    var existing = document.getElementById('ros-memory-block');
    if (existing) return;

    var block = document.createElement('div');
    block.id = 'ros-memory-block';
    Object.assign(block.style, {
      marginBottom: '12px',
      padding: '10px 12px',
      borderRadius: '10px',
      background: 'rgba(37,99,235,0.05)',
      border: '1px solid rgba(37,99,235,0.15)',
      fontSize: '11px',
      color: 'rgba(15,23,42,0.6)'
    });

    var toggle = document.createElement('button');
    toggle.style.cssText = 'display:flex;align-items:center;gap:6px;background:none;border:none;cursor:pointer;font-size:11px;font-weight:600;color:rgba(37,99,235,0.8);padding:0;width:100%;text-align:left;';

    var icon = document.createElement('span');
    icon.className = 'material-symbols-outlined';
    icon.style.fontSize = '13px';
    icon.textContent = 'history';
    toggle.appendChild(icon);

    var label = document.createTextNode('Previous sessions (' + summaries.length + ')');
    toggle.appendChild(label);

    var list = document.createElement('ul');
    list.style.cssText = 'display:none;margin:8px 0 0 0;padding:0 0 0 16px;list-style:disc;';

    summaries.forEach(function(s) {
      var li = document.createElement('li');
      li.style.marginBottom = '3px';
      li.textContent = s;
      list.appendChild(li);
    });

    toggle.addEventListener('click', function() {
      list.style.display = list.style.display === 'none' ? 'block' : 'none';
    });

    block.appendChild(toggle);
    block.appendChild(list);

    msgs.insertBefore(block, msgs.firstChild);
  }

})();
