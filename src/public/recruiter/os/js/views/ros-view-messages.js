// ============================================================================
// ROS-VIEW-MESSAGES — Messaging Center
// Extracted from RecruiterDashboard.html
// ============================================================================

(function() {
  'use strict';

  const VIEW_ID = 'messages';
  const MESSAGES = [
    'conversationData', 'messageSent', 'newMessagesData', 'unreadCountData', 'error'
  ];

  let conversations = [];
  let activeConversation = null;
  let unreadCount = 0;

  function render() {
    return `
      <div class="flex items-center gap-3">
        <button onclick="ROS.views.showView('home')" class="w-8 h-8 neu-s rounded-lg flex items-center justify-center">
          <span class="material-symbols-outlined text-tan text-[16px]">arrow_back</span>
        </button>
        <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
          <span class="material-symbols-outlined text-white text-[16px]">chat</span>
        </div>
        <h2 class="text-lg font-bold text-lmdr-dark">Messaging Center</h2>
        <div class="ml-auto flex gap-1.5">
          <button class="px-3 py-1.5 text-[10px] font-bold rounded-full neu-ins text-lmdr-blue" onclick="ROS.views._messages.filterAll()">All</button>
          <button class="px-3 py-1.5 text-[10px] font-bold rounded-full neu-x text-tan" onclick="ROS.views._messages.filterType('sms')">SMS</button>
          <button class="px-3 py-1.5 text-[10px] font-bold rounded-full neu-x text-tan" onclick="ROS.views._messages.filterType('email')">Email</button>
          <button class="px-3 py-1.5 text-[10px] font-bold rounded-full neu-x text-tan" onclick="ROS.views._messages.filterType('in-app')">In-App</button>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-3 gap-4 mt-4">
        <div class="neu-s p-4 rounded-xl text-center">
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Unread</p>
          <h3 class="text-[22px] font-black text-lmdr-blue mt-1" id="msg-unread">${unreadCount}</h3>
        </div>
        <div class="neu-s p-4 rounded-xl text-center">
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Avg Response</p>
          <h3 class="text-[22px] font-black text-sg mt-1" id="msg-response">--</h3>
        </div>
        <div class="neu-s p-4 rounded-xl text-center">
          <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Sent Today</p>
          <h3 class="text-[22px] font-black text-lmdr-dark mt-1" id="msg-sent">--</h3>
        </div>
      </div>

      <!-- Conversation List -->
      <div class="neu rounded-2xl p-4 mt-4 flex-1">
        <div class="flex flex-col gap-2" id="msg-list">
          <div class="text-center py-8 text-tan text-[13px]">
            <span class="material-symbols-outlined text-[36px] text-tan/30 block mb-2">chat</span>
            Loading messages...
          </div>
        </div>
      </div>

      <!-- Compose Bar -->
      <div class="flex gap-2 mt-4" id="msg-compose" style="display:none">
        <input id="msg-input" class="flex-1 px-4 py-3 neu-in rounded-xl text-sm text-lmdr-dark placeholder-tan/50 outline-none font-medium"
               placeholder="Type a message..."
               onkeydown="if(event.key==='Enter')ROS.views._messages.sendReply()"/>
        <button onclick="ROS.views._messages.sendReply()" class="px-5 py-3 rounded-xl bg-gradient-to-br from-lmdr-blue to-lmdr-deep text-white text-sm font-bold shadow-lg">
          <span class="material-symbols-outlined text-[18px]">send</span>
        </button>
      </div>`;
  }

  function onMount() {
    ROS.bridge.sendToVelo('getNewMessages', {});
    ROS.bridge.sendToVelo('getUnreadCount', {});
    // Poll for new messages
    pollInterval = setInterval(() => {
      ROS.bridge.sendToVelo('getNewMessages', {});
    }, 15000);
  }

  let pollInterval;
  function onUnmount() {
    if (pollInterval) clearInterval(pollInterval);
    activeConversation = null;
  }

  function onMessage(type, data) {
    switch (type) {
      case 'newMessagesData':
        if (data && data.conversations) {
          conversations = data.conversations;
          renderConversations();
        }
        break;

      case 'unreadCountData':
        if (data && typeof data.count === 'number') {
          unreadCount = data.count;
          const el = document.getElementById('msg-unread');
          if (el) el.textContent = unreadCount;
        }
        break;

      case 'conversationData':
        if (data) {
          activeConversation = data;
          renderConversationDetail(data);
        }
        break;

      case 'messageSent':
        if (data && data.success) {
          showToast('Message sent');
          const input = document.getElementById('msg-input');
          if (input) input.value = '';
          // Refresh conversation
          if (activeConversation) {
            ROS.bridge.sendToVelo('getConversation', { conversationId: activeConversation.id || activeConversation._id });
          }
        }
        break;
    }
  }

  function renderConversations() {
    const list = document.getElementById('msg-list');
    if (!list) return;

    if (conversations.length === 0) {
      list.innerHTML = '<div class="text-center py-8 text-tan text-[13px]">No messages yet</div>';
      return;
    }

    list.innerHTML = conversations.map(c => {
      const name = c.driverName || c.name || 'Unknown';
      const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
      const preview = c.lastMessage || c.preview || '';
      const time = c.timestamp ? formatTime(c.timestamp) : '';
      const unread = c.unread || 0;
      const type = c.channel || c.type || 'in-app';
      const typeBadge = {
        'sms': 'bg-blue-100 text-blue-700',
        'email': 'bg-amber-100 text-amber-700',
        'in-app': 'bg-emerald-100 text-emerald-700'
      }[type] || 'bg-slate-100 text-slate-600';

      const colors = ['from-lmdr-yb to-amber-500', 'from-emerald-400 to-teal-600', 'from-lmdr-blue to-lmdr-deep', 'from-violet-400 to-purple-600'];
      const ci = name.charCodeAt(0) % colors.length;
      const tc = ci === 0 ? 'text-lmdr-dark' : 'text-white';
      const borderColor = unread > 0 ? 'border-l-4 border-lmdr-blue' : '';
      const id = c._id || c.id || '';

      return `
        <div class="flex items-center gap-3 p-3 neu-x rounded-xl cursor-pointer hover:shadow-neu transition-shadow ${borderColor}"
             onclick="ROS.views._messages.openConversation('${id}')">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br ${colors[ci]} flex items-center justify-center font-black ${tc} text-sm">${initials}</div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-[12px] font-bold text-lmdr-dark">${escapeHtml(name)}</span>
              <span class="px-1.5 py-0.5 rounded text-[8px] font-bold ${typeBadge}">${type.toUpperCase()}</span>
            </div>
            <p class="text-[11px] text-tan truncate mt-0.5">${escapeHtml(preview)}</p>
          </div>
          <div class="text-right shrink-0">
            <div class="text-[10px] text-tan font-medium">${time}</div>
            ${unread > 0 ? `<div class="w-5 h-5 rounded-full bg-lmdr-blue text-white text-[9px] font-bold flex items-center justify-center mt-1">${unread}</div>` : ''}
          </div>
        </div>`;
    }).join('');
  }

  function renderConversationDetail(data) {
    const compose = document.getElementById('msg-compose');
    if (compose) compose.style.display = 'flex';
  }

  function formatTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'now';
    if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
    return d.toLocaleDateString();
  }

  function showToast(msg) {
    const t = document.createElement('div');
    t.className = 'fixed top-16 right-4 z-[9999] px-4 py-2.5 rounded-xl neu-s text-[12px] font-bold text-lmdr-dark';
    t.style.animation = 'fadeUp .3s ease';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  function escapeHtml(s) { if (!s) return ''; const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

  // Public API
  ROS.views._messages = {
    openConversation: function(id) {
      ROS.bridge.sendToVelo('getConversation', { conversationId: id });
      ROS.bridge.sendToVelo('markAsRead', { conversationId: id });
    },
    sendReply: function() {
      const input = document.getElementById('msg-input');
      if (!input || !input.value.trim()) return;
      const convId = activeConversation ? (activeConversation.id || activeConversation._id) : null;
      ROS.bridge.sendToVelo('sendMessage', {
        conversationId: convId,
        message: input.value.trim()
      });
    },
    filterAll: function() { renderConversations(); },
    filterType: function(type) {
      const filtered = conversations.filter(c => (c.channel || c.type || 'in-app') === type);
      const list = document.getElementById('msg-list');
      if (list) {
        const temp = conversations;
        conversations = filtered;
        renderConversations();
        conversations = temp;
      }
    }
  };

  ROS.views.registerView(VIEW_ID, { render, onMount, onUnmount, onMessage, messages: MESSAGES });
})();
