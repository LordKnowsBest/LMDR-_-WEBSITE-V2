/**
 * dos-view-forums.js
 * DriverOS Forums view — category filter, thread list, thread detail with replies.
 * Extracted from DRIVER_FORUMS.html (588 lines).
 */
(function () {
  'use strict';
  window.DOS = window.DOS || {};
  DOS.viewModules = DOS.viewModules || {};

  var state = {
    subview: 'list',        // 'list' | 'detail'
    categories: [],
    threads: [],
    selectedThread: null,
    replies: [],
    activeCategory: 'all'
  };
  var els = {};

  function h(tag, cls, text) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (text !== undefined) el.textContent = text;
    return el;
  }

  function icon(name, cls) {
    var sp = h('span', 'material-symbols-outlined' + (cls ? ' ' + cls : ''));
    sp.textContent = name;
    return sp;
  }

  function clearEl(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  function timeAgo(dateStr) {
    if (!dateStr) return '';
    var secs = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (secs < 60) return 'Just now';
    if (secs < 3600) return Math.floor(secs / 60) + 'm ago';
    if (secs < 86400) return Math.floor(secs / 3600) + 'h ago';
    if (secs < 2592000) return Math.floor(secs / 86400) + 'd ago';
    return Math.floor(secs / 2592000) + 'mo ago';
  }

  function buildUI(root) {
    clearEl(root);

    if (!document.getElementById('dos-forums-style')) {
      var style = document.createElement('style');
      style.id = 'dos-forums-style';
      style.textContent =
        '@keyframes dosShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}' +
        '.dos-thread-card{padding:14px 0;border-bottom:1px solid #e2e8f0;cursor:pointer;-webkit-tap-highlight-color:transparent}' +
        '.dos-thread-card:active{background:#f8fafc}' +
        '.dos-thread-card:last-child{border-bottom:none}' +
        '.dos-reply-card{padding:14px;background:#f8fafc;border-radius:12px;margin-bottom:8px}';
      document.head.appendChild(style);
    }

    var container = h('div', 'dos-container');
    container.style.paddingTop = '12px';
    container.style.paddingBottom = '80px';

    // Header row (with back button for detail)
    var headerRow = h('div', '');
    headerRow.style.cssText = 'display:flex;align-items:center;gap:12px;margin-bottom:12px';
    headerRow.id = 'for-header';

    var backBtn = h('button', 'dos-btn-ghost');
    backBtn.id = 'for-back';
    backBtn.style.cssText = 'display:none;padding:8px;min-width:40px;min-height:40px;border-radius:10px';
    backBtn.appendChild(icon('arrow_back', ''));
    headerRow.appendChild(backBtn);

    var titleEl = h('div', 'dos-text-heading', 'Forums');
    titleEl.id = 'for-title';
    titleEl.style.flex = '1';
    headerRow.appendChild(titleEl);

    // New thread button
    var newBtn = h('button', 'dos-btn-secondary');
    newBtn.id = 'for-new-btn';
    newBtn.style.cssText = 'padding:8px 16px;font-size:13px;display:flex;align-items:center;gap:4px;min-height:40px';
    newBtn.appendChild(icon('add', ''));
    newBtn.appendChild(document.createTextNode('New'));
    headerRow.appendChild(newBtn);

    container.appendChild(headerRow);

    // Category filter pills
    var filterRow = h('div', 'dos-scroll-row');
    filterRow.id = 'for-filters';
    filterRow.style.marginBottom = '16px';
    container.appendChild(filterRow);

    // Skeleton
    var skel = h('div', '');
    skel.id = 'for-skeleton';
    for (var i = 0; i < 4; i++) {
      var sk = h('div', 'dos-card');
      sk.style.cssText = 'height:80px;margin-bottom:12px;background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);background-size:200% 100%;animation:dosShimmer 1.5s infinite';
      skel.appendChild(sk);
    }
    container.appendChild(skel);

    // Thread list
    var listCard = h('div', 'dos-card');
    listCard.id = 'for-list';
    listCard.style.display = 'none';
    container.appendChild(listCard);

    // Thread detail
    var detail = h('div', '');
    detail.id = 'for-detail';
    detail.style.display = 'none';
    container.appendChild(detail);

    // Empty state
    var empty = h('div', 'dos-empty');
    empty.id = 'for-empty';
    empty.style.display = 'none';
    empty.appendChild(icon('forum', ''));
    empty.appendChild(h('div', 'dos-text-body', 'No threads yet. Start a discussion!'));
    container.appendChild(empty);

    // New thread form (overlay)
    var form = h('div', '');
    form.id = 'for-form';
    form.style.cssText = 'display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,.5);z-index:50;padding:16px;display:none;align-items:flex-end;justify-content:center';

    var formCard = h('div', 'dos-card');
    formCard.style.cssText = 'width:100%;max-width:480px;max-height:80vh;overflow-y:auto;border-radius:16px 16px 0 0;padding:20px';

    var formTitle = h('div', 'dos-text-subheading', 'New Thread');
    formTitle.style.marginBottom = '12px';
    formCard.appendChild(formTitle);

    var titleInput = h('input', 'dos-input');
    titleInput.id = 'for-input-title';
    titleInput.placeholder = 'Thread title';
    titleInput.type = 'text';
    titleInput.style.marginBottom = '10px';
    formCard.appendChild(titleInput);

    var contentInput = h('textarea', 'dos-textarea');
    contentInput.id = 'for-input-content';
    contentInput.placeholder = 'Share your thoughts...';
    contentInput.rows = 4;
    contentInput.style.marginBottom = '12px';
    formCard.appendChild(contentInput);

    var formBtns = h('div', '');
    formBtns.style.cssText = 'display:flex;gap:8px;justify-content:flex-end';
    var cancelBtn = h('button', 'dos-btn-ghost', 'Cancel');
    cancelBtn.id = 'for-form-cancel';
    cancelBtn.style.cssText = 'padding:10px 20px;font-size:14px';
    var postBtn = h('button', 'dos-btn-primary', 'Post');
    postBtn.id = 'for-form-post';
    postBtn.style.cssText = 'padding:10px 20px;font-size:14px';
    formBtns.appendChild(cancelBtn);
    formBtns.appendChild(postBtn);
    formCard.appendChild(formBtns);
    form.appendChild(formCard);
    container.appendChild(form);

    root.appendChild(container);

    els = {
      skeleton: skel, list: listCard, detail: detail, empty: empty,
      filters: filterRow, backBtn: backBtn, title: titleEl, newBtn: newBtn,
      form: form, inputTitle: titleInput, inputContent: contentInput,
      cancelBtn: cancelBtn, postBtn: postBtn
    };
  }

  function buildFilters() {
    clearEl(els.filters);
    var cats = ['all'].concat(state.categories.map(function (c) { return c.title || c.name || c._id; }));
    cats.forEach(function (cat) {
      var pill = h('button', 'dos-chip ' + (cat === state.activeCategory ? 'dos-chip-blue' : 'dos-chip-gray'));
      pill.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
      pill.setAttribute('data-cat', cat);
      pill.style.cssText = 'cursor:pointer;min-height:40px;flex-shrink:0;-webkit-tap-highlight-color:transparent';
      els.filters.appendChild(pill);
    });
  }

  function renderThreadList() {
    clearEl(els.list);
    els.detail.style.display = 'none';
    els.list.style.display = '';
    els.filters.style.display = '';
    els.backBtn.style.display = 'none';
    els.newBtn.style.display = '';
    els.title.textContent = 'Forums';

    var threads = state.threads;
    if (state.activeCategory !== 'all') {
      threads = threads.filter(function (t) {
        var catName = '';
        if (t.categoryId) {
          var cat = state.categories.find(function (c) { return c._id === t.categoryId; });
          catName = cat ? (cat.title || cat.name) : '';
        }
        return catName === state.activeCategory || t.category === state.activeCategory;
      });
    }

    if (threads.length === 0) {
      els.list.style.display = 'none';
      els.empty.style.display = '';
      return;
    }
    els.empty.style.display = 'none';

    threads.forEach(function (thread) {
      var row = h('div', 'dos-thread-card');
      row.setAttribute('data-thread-id', thread._id);

      var top = h('div', '');
      top.style.cssText = 'display:flex;align-items:flex-start;justify-content:space-between;gap:8px';

      var left = h('div', '');
      left.style.cssText = 'flex:1;min-width:0';

      if (thread.isPinned) {
        var pin = h('span', 'dos-chip dos-chip-amber');
        pin.style.cssText = 'font-size:10px;padding:1px 6px;min-height:auto;margin-bottom:4px;display:inline-flex';
        pin.appendChild(icon('push_pin', ''));
        pin.lastChild.style.fontSize = '12px';
        pin.appendChild(document.createTextNode(' Pinned'));
        left.appendChild(pin);
      }

      var titleText = h('div', 'dos-text-body', thread.title || 'Untitled');
      titleText.style.cssText = 'font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
      left.appendChild(titleText);

      var meta = h('div', 'dos-text-small');
      meta.style.cssText = 'margin-top:4px;display:flex;align-items:center;gap:8px';
      meta.appendChild(document.createTextNode(thread.authorName || 'Driver'));
      meta.appendChild(document.createTextNode(' · '));
      meta.appendChild(document.createTextNode(timeAgo(thread.lastActivityAt || thread.createdAt)));
      left.appendChild(meta);

      top.appendChild(left);

      // Reply count
      var right = h('div', '');
      right.style.cssText = 'display:flex;align-items:center;gap:4px;color:#64748b;font-weight:700;font-size:14px;flex-shrink:0';
      right.appendChild(icon('chat_bubble_outline', ''));
      right.lastChild.style.fontSize = '18px';
      right.appendChild(document.createTextNode(thread.replyCount || 0));
      top.appendChild(right);

      row.appendChild(top);
      els.list.appendChild(row);
    });
  }

  function renderThreadDetail() {
    var thread = state.selectedThread;
    if (!thread) return;

    els.list.style.display = 'none';
    els.empty.style.display = 'none';
    els.filters.style.display = 'none';
    els.detail.style.display = '';
    els.backBtn.style.display = '';
    els.newBtn.style.display = 'none';
    els.title.textContent = thread.title || 'Thread';

    clearEl(els.detail);

    // Original post
    var opCard = h('div', 'dos-card');
    opCard.style.marginBottom = '12px';
    var opAuthor = h('div', 'dos-text-small');
    opAuthor.style.cssText = 'font-weight:700;color:#0f172a;margin-bottom:8px';
    opAuthor.textContent = thread.authorName || 'Driver';
    opCard.appendChild(opAuthor);
    var opBody = h('div', 'dos-text-body', thread.content || thread.contentPreview || '');
    opCard.appendChild(opBody);
    var opMeta = h('div', 'dos-text-small');
    opMeta.style.marginTop = '8px';
    opMeta.textContent = timeAgo(thread.createdAt);
    opCard.appendChild(opMeta);
    els.detail.appendChild(opCard);

    // Replies header
    var repliesHeader = h('div', 'dos-text-subheading', 'Replies (' + (state.replies.length) + ')');
    repliesHeader.style.cssText = 'margin:16px 0 8px';
    els.detail.appendChild(repliesHeader);

    // Replies
    if (state.replies.length === 0) {
      var noReplies = h('div', 'dos-text-small', 'No replies yet. Be the first!');
      noReplies.style.cssText = 'text-align:center;padding:24px 0;color:#94a3b8';
      els.detail.appendChild(noReplies);
    } else {
      state.replies.forEach(function (reply) {
        var rc = h('div', 'dos-reply-card');
        var rAuthor = h('div', 'dos-text-small');
        rAuthor.style.cssText = 'font-weight:700;color:#0f172a;margin-bottom:4px';
        rAuthor.textContent = reply.authorName || 'Driver';
        rc.appendChild(rAuthor);
        var rBody = h('div', 'dos-text-body', reply.content || '');
        rBody.style.fontSize = '14px';
        rc.appendChild(rBody);
        var rMeta = h('div', 'dos-text-small');
        rMeta.style.marginTop = '6px';
        rMeta.textContent = timeAgo(reply.createdAt);
        rc.appendChild(rMeta);
        els.detail.appendChild(rc);
      });
    }

    // Reply input
    var replySection = h('div', '');
    replySection.style.cssText = 'margin-top:16px;display:flex;gap:8px;align-items:flex-end';
    var replyInput = h('textarea', 'dos-textarea');
    replyInput.id = 'for-reply-input';
    replyInput.placeholder = 'Write a reply...';
    replyInput.rows = 2;
    replyInput.style.cssText = 'flex:1;min-height:48px';
    replySection.appendChild(replyInput);
    var sendBtn = h('button', 'dos-btn-primary');
    sendBtn.id = 'for-reply-send';
    sendBtn.style.cssText = 'padding:12px;min-width:48px;min-height:48px;display:flex;align-items:center;justify-content:center';
    sendBtn.appendChild(icon('send', ''));
    replySection.appendChild(sendBtn);
    els.detail.appendChild(replySection);
  }

  function bindEvents(self) {
    // Filter clicks
    var filterFn = function (e) {
      var btn = e.target.closest('button[data-cat]');
      if (!btn) return;
      state.activeCategory = btn.getAttribute('data-cat');
      var all = els.filters.querySelectorAll('button');
      for (var j = 0; j < all.length; j++) {
        all[j].className = 'dos-chip ' + (all[j].getAttribute('data-cat') === state.activeCategory ? 'dos-chip-blue' : 'dos-chip-gray');
        all[j].style.cssText = 'cursor:pointer;min-height:40px;flex-shrink:0;-webkit-tap-highlight-color:transparent';
      }
      renderThreadList();
    };
    els.filters.addEventListener('click', filterFn);
    self._listeners.push({ el: els.filters, type: 'click', fn: filterFn });

    // Thread clicks
    var threadFn = function (e) {
      var card = e.target.closest('.dos-thread-card');
      if (!card) return;
      var tid = card.getAttribute('data-thread-id');
      var thread = state.threads.find(function (t) { return t._id === tid; });
      if (thread) {
        state.selectedThread = thread;
        state.subview = 'detail';
        DOS.bridge.send('getThreadReplies', { threadId: tid });
        // Show detail immediately with thread content, replies load via onMessage
        state.replies = [];
        renderThreadDetail();
      }
    };
    els.list.addEventListener('click', threadFn);
    self._listeners.push({ el: els.list, type: 'click', fn: threadFn });

    // Back button
    var backFn = function () {
      state.subview = 'list';
      state.selectedThread = null;
      state.replies = [];
      renderThreadList();
    };
    els.backBtn.addEventListener('click', backFn);
    self._listeners.push({ el: els.backBtn, type: 'click', fn: backFn });

    // New thread button
    var newFn = function () { els.form.style.display = 'flex'; };
    els.newBtn.addEventListener('click', newFn);
    self._listeners.push({ el: els.newBtn, type: 'click', fn: newFn });

    // Cancel form
    var cancelFn = function () { els.form.style.display = 'none'; };
    els.cancelBtn.addEventListener('click', cancelFn);
    self._listeners.push({ el: els.cancelBtn, type: 'click', fn: cancelFn });

    // Post new thread
    var postFn = function () {
      var title = els.inputTitle.value.trim();
      var content = els.inputContent.value.trim();
      if (!title || !content) return;
      DOS.bridge.send('createThread', { title: title, content: content, categoryId: state.activeCategory !== 'all' ? state.activeCategory : '' });
      els.inputTitle.value = '';
      els.inputContent.value = '';
      els.form.style.display = 'none';
    };
    els.postBtn.addEventListener('click', postFn);
    self._listeners.push({ el: els.postBtn, type: 'click', fn: postFn });

    // Reply (delegated on detail)
    var replyFn = function (e) {
      var sendBtnEl = e.target.closest('#for-reply-send');
      if (!sendBtnEl) return;
      var input = document.getElementById('for-reply-input');
      if (!input) return;
      var content = input.value.trim();
      if (!content || !state.selectedThread) return;
      DOS.bridge.send('replyToThread', { threadId: state.selectedThread._id, content: content });
      // Optimistic add
      state.replies.push({ content: content, authorName: 'You', createdAt: new Date().toISOString() });
      input.value = '';
      renderThreadDetail();
    };
    els.detail.addEventListener('click', replyFn);
    self._listeners.push({ el: els.detail, type: 'click', fn: replyFn });
  }

  DOS.viewModules['forums'] = {
    _listeners: [],

    mount: function (root) {
      buildUI(root);
      bindEvents(this);
      DOS.bridge.send('getForumThreads', {});
    },

    unmount: function () {
      this._listeners.forEach(function (l) { l.el.removeEventListener(l.type, l.fn); });
      this._listeners = [];
      els = {};
      state.subview = 'list';
      state.selectedThread = null;
      state.replies = [];
    },

    onMessage: function (action, payload) {
      if (action === 'forumThreadsLoaded' || action === 'threadsData') {
        var d = payload || {};
        state.threads = d.threads || d.items || [];
        state.categories = d.categories || [];
        if (els.skeleton) els.skeleton.style.display = 'none';
        buildFilters();
        renderThreadList();
      } else if (action === 'threadRepliesLoaded' || action === 'threadDetailData') {
        var d2 = payload || {};
        state.replies = d2.replies || d2.posts || [];
        if (state.subview === 'detail') renderThreadDetail();
      } else if (action === 'threadCreated') {
        var newThread = payload || {};
        state.threads.unshift(newThread);
        renderThreadList();
      }
    },

    getSnapshot: function () {
      return { subview: state.subview, threadCount: state.threads.length, category: state.activeCategory };
    }
  };
})();
