// ============================================================================
// ROS-VIEW-LIFECYCLE — Driver Lifecycle Monitor
// Per-driver timeline: application → hire → milestones → termination
// ============================================================================

(function () {
    'use strict';

    const VIEW_ID = 'lifecycle';
    const MESSAGES = ['timelineLoaded', 'lifecycleEventLogged', 'driverTerminated'];

    // ── State ──
    let timeline = [];
    let driverCtx = null; // { driverId, driverName, status, tenureDays }
    let logModalOpen = false;
    let termModalOpen = false;
    let saving = false;

    // ── Helpers ──
    function escapeHtml(s) {
        if (!s) return '';
        const d = document.createElement('div');
        d.textContent = String(s);
        return d.innerHTML;
    }

    function showToast(msg, isError) {
        const t = document.createElement('div');
        t.className = 'fixed top-16 right-4 z-[9999] px-4 py-2.5 rounded-xl neu-s text-[12px] font-bold text-lmdr-dark flex items-center gap-2';
        t.style.animation = 'fadeUp .3s ease';
        const span = document.createElement('span');
        span.className = 'material-symbols-outlined text-[16px] ' + (isError ? 'text-red-500' : 'text-emerald-500');
        span.textContent = isError ? 'error' : 'check_circle';
        const text = document.createTextNode(msg);
        t.appendChild(span);
        t.appendChild(text);
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 3000);
    }

    function refreshContent() {
        const stage = document.getElementById('ros-stage');
        if (stage) stage.innerHTML = render(); // All user-supplied strings sanitized via escapeHtml before interpolation
    }

    // ── Render ──
    function render() {
        const driver = driverCtx || {};
        const name = driver.driverName || 'No Driver Selected';
        const status = driver.status || 'Unknown';
        const tenureDays = driver.tenureDays || 0;

        return `
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button onclick="ROS.views.showView('home')" class="w-8 h-8 neu-s rounded-lg flex items-center justify-center">
            <span class="material-symbols-outlined text-tan text-[16px]">arrow_back</span>
          </button>
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <span class="material-symbols-outlined text-white text-[16px]">timeline</span>
          </div>
          <div>
            <h2 class="text-lg font-bold text-lmdr-dark leading-tight">Driver Lifecycle</h2>
            <p class="text-[10px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
              ${escapeHtml(name)} &middot; ${escapeHtml(status)}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="ROS.views._lifecycle.openLogModal()" class="px-3 py-2 rounded-xl neu-x text-[11px] font-bold text-lmdr-blue flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[13px]">draw</span>Log Event
          </button>
          <button onclick="ROS.views._lifecycle.openTermModal()" class="px-3 py-2 rounded-xl neu-x text-[11px] font-bold text-red-500 flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[13px]">person_cancel</span>Terminate
          </button>
        </div>
      </div>

      <div class="flex gap-4 mt-4">

        <!-- Timeline -->
        <div class="flex-1 min-w-0">
          ${timeline.length ? renderTimeline() : renderEmptyTimeline()}
        </div>

        <!-- Driver Stats Sidebar -->
        <div class="w-40 flex-none space-y-3">
          <div class="neu-s rounded-xl p-3 text-center">
            <h3 class="text-[22px] font-black text-lmdr-dark">${tenureDays}</h3>
            <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Days Tenure</p>
          </div>
          <div class="neu-s rounded-xl p-3 text-center">
            <h3 class="text-[22px] font-black text-sg">${driver.satisfactionScore ? escapeHtml(String(driver.satisfactionScore)) + '%' : '--'}</h3>
            <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Satisfaction</p>
          </div>
          <div class="neu-s rounded-xl p-3 text-center">
            <h3 class="text-[22px] font-black text-lmdr-blue">${timeline.filter(e => e.positive).length}</h3>
            <p class="text-[9px] font-bold uppercase tracking-widest text-tan">Positive Events</p>
          </div>
        </div>
      </div>

      ${logModalOpen ? renderLogModal() : ''}
      ${termModalOpen ? renderTermModal() : ''}`;
    }

    function renderTimeline() {
        return `
      <div class="space-y-3 relative pl-4">
        <div class="absolute left-9 top-4 bottom-4 w-[2px] bg-tan/10 rounded-full"></div>
        ${timeline.map(renderTimelineItem).join('')}
      </div>`;
    }

    function renderEmptyTimeline() {
        return `
      <div class="neu-in rounded-xl p-10 text-center">
        <span class="material-symbols-outlined text-tan/30 text-[36px]">timeline</span>
        <p class="text-[12px] text-tan mt-2">No lifecycle events yet.</p>
        <p class="text-[10px] text-tan/60 mt-1">Events appear here as the driver progresses.</p>
      </div>`;
    }

    function renderTimelineItem(item) {
        const isAlert = item.alert || item.risk_flag;
        const iconColor = item.color ? 'text-' + item.color : 'text-lmdr-blue';
        const alertBadge = isAlert
            ? '<div class="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[9px] font-bold uppercase tracking-wide"><span class="material-symbols-outlined text-[11px]">warning</span>Risk Flag</div>'
            : '';
        return `
      <div class="relative pl-10 pb-4 group">
        <div class="absolute left-0 top-0 w-9 h-9 rounded-xl neu-s flex items-center justify-center z-10 group-hover:scale-110 transition-transform">
          <span class="material-symbols-outlined ${iconColor} text-[16px]">${escapeHtml(item.icon || 'circle')}</span>
        </div>
        <div class="neu-x rounded-xl p-4 ml-3 ${isAlert ? 'border border-amber-400/30' : ''}">
          <div class="flex items-start justify-between gap-2">
            <h4 class="text-[13px] font-bold text-lmdr-dark leading-tight">${escapeHtml(item.title || '')}</h4>
            <span class="text-[9px] font-bold text-tan uppercase tracking-wide flex-none">${escapeHtml(item.date || '')}</span>
          </div>
          <p class="text-[11px] text-tan mt-1 leading-relaxed">${escapeHtml(item.desc || item.description || '')}</p>
          ${alertBadge}
        </div>
      </div>`;
    }

    function renderLogModal() {
        return `
      <div class="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center backdrop-blur-sm" onclick="if(event.target===this)ROS.views._lifecycle.closeLogModal()">
        <div class="neu rounded-2xl w-full max-w-md mx-4 overflow-hidden">
          <div class="p-5 border-b border-tan/15 flex items-center justify-between">
            <h3 class="font-bold text-[15px] text-lmdr-dark">Log Lifecycle Event</h3>
            <button onclick="ROS.views._lifecycle.closeLogModal()" class="w-8 h-8 neu-x rounded-lg flex items-center justify-center text-tan">
              <span class="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
          <div class="p-5 space-y-4">
            <div>
              <label class="text-[10px] font-bold text-tan uppercase tracking-wider mb-1.5 block">Event Type</label>
              <select id="lc-event-type" class="w-full neu-in rounded-xl px-3 py-2.5 text-[12px] font-medium text-lmdr-dark bg-transparent border-none focus:ring-0 outline-none">
                <option value="INCIDENT">Incident / Issue</option>
                <option value="RECOGNITION">Recognition / Award</option>
                <option value="TRAINING">Training Completed</option>
                <option value="NOTE">General Note</option>
              </select>
            </div>
            <div>
              <label class="text-[10px] font-bold text-tan uppercase tracking-wider mb-1.5 block">Description</label>
              <textarea id="lc-event-desc" rows="4" class="w-full neu-in rounded-xl px-3 py-2.5 text-[12px] text-lmdr-dark bg-transparent border-none placeholder-tan/50 focus:ring-0 outline-none resize-none" placeholder="Enter details..."></textarea>
            </div>
          </div>
          <div class="p-4 border-t border-tan/15 flex justify-end gap-2">
            <button onclick="ROS.views._lifecycle.closeLogModal()" class="px-4 py-2 text-[11px] font-bold text-tan neu-x rounded-xl">Cancel</button>
            <button onclick="ROS.views._lifecycle.saveLogEvent()" ${saving ? 'disabled' : ''}
              class="px-4 py-2 rounded-xl bg-gradient-to-r from-lmdr-blue to-lmdr-deep text-white text-[11px] font-bold ${saving ? 'opacity-60' : ''}">
              ${saving ? 'Saving\u2026' : 'Save Log'}
            </button>
          </div>
        </div>
      </div>`;
    }

    function renderTermModal() {
        const reasons = ['Operations', 'Compensation', 'Personal', 'Compliance'];
        const reasonCards = reasons.map(r => `
          <label class="neu-x rounded-xl p-3 flex items-center gap-2 cursor-pointer">
            <input type="radio" name="term-reason" value="${r}" class="text-red-500 focus:ring-red-500">
            <p class="text-[12px] font-bold text-lmdr-dark">${r}</p>
          </label>`).join('');

        return `
      <div class="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center backdrop-blur-sm" onclick="if(event.target===this)ROS.views._lifecycle.closeTermModal()">
        <div class="neu rounded-2xl w-full max-w-lg mx-4 overflow-hidden border border-red-500/20">
          <div class="p-5 border-b border-tan/15 bg-red-500/5">
            <h3 class="font-bold text-[16px] text-red-600 flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px]">warning</span>Terminate Driver
            </h3>
            <p class="text-[11px] text-red-500/70 mt-1">This ends the driver's active employment record.</p>
          </div>
          <div class="p-5 space-y-4">
            <div>
              <label class="text-[10px] font-bold text-tan uppercase tracking-wider mb-2 block">Primary Reason</label>
              <div class="grid grid-cols-2 gap-2">${reasonCards}</div>
            </div>
            <div>
              <label class="text-[10px] font-bold text-tan uppercase tracking-wider mb-1.5 block">Recruiter Notes (required)</label>
              <textarea id="lc-term-notes" rows="2" class="w-full neu-in rounded-xl px-3 py-2.5 text-[12px] text-lmdr-dark bg-transparent border-none placeholder-tan/50 focus:ring-0 outline-none resize-none" placeholder="Required for compliance..."></textarea>
            </div>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" id="lc-term-rehire" class="w-4 h-4 rounded text-lmdr-blue focus:ring-lmdr-blue">
              <span class="text-[12px] font-bold text-lmdr-dark">Eligible for Rehire?</span>
            </label>
          </div>
          <div class="p-4 border-t border-tan/15 flex justify-end gap-2">
            <button onclick="ROS.views._lifecycle.closeTermModal()" class="px-4 py-2 text-[11px] font-bold text-tan neu-x rounded-xl">Cancel</button>
            <button onclick="ROS.views._lifecycle.confirmTermination()" ${saving ? 'disabled' : ''}
              class="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[11px] font-bold ${saving ? 'opacity-60' : ''}">
              ${saving ? 'Processing\u2026' : 'Confirm Termination'}
            </button>
          </div>
        </div>
      </div>`;
    }

    // ── Lifecycle Hooks ──
    function onMount() {
        const ctx = (ROS.state && ROS.state.lifecycleContext) || null;
        driverCtx = ctx;
        ROS.bridge.sendToVelo('getTimelineEvents', { driverId: ctx ? ctx.driverId : null });
    }

    function onUnmount() {
        timeline = [];
        driverCtx = null;
        logModalOpen = false;
        termModalOpen = false;
        saving = false;
    }

    function onMessage(type, data) {
        switch (type) {
            case 'timelineLoaded':
                timeline = (data && data.events) || [];
                refreshContent();
                break;
            case 'lifecycleEventLogged':
                saving = false;
                logModalOpen = false;
                if (data && data.success) {
                    showToast('Event logged successfully!');
                    ROS.bridge.sendToVelo('getTimelineEvents', { driverId: driverCtx ? driverCtx.driverId : null });
                } else {
                    showToast('Failed to save event', true);
                    refreshContent();
                }
                break;
            case 'driverTerminated':
                saving = false;
                termModalOpen = false;
                if (data && data.success) {
                    showToast('Driver terminated. Record updated.');
                    if (driverCtx) driverCtx.status = 'Terminated';
                    ROS.bridge.sendToVelo('getTimelineEvents', { driverId: driverCtx ? driverCtx.driverId : null });
                } else {
                    showToast('Termination failed: ' + ((data && data.error) || 'Unknown error'), true);
                    refreshContent();
                }
                break;
        }
    }

    // ── Public API ──
    ROS.views._lifecycle = {
        openLogModal:  function() { logModalOpen = true;  saving = false; refreshContent(); },
        closeLogModal: function() { logModalOpen = false; refreshContent(); },
        openTermModal:  function() { termModalOpen = true;  saving = false; refreshContent(); },
        closeTermModal: function() { termModalOpen = false; refreshContent(); },

        saveLogEvent: function() {
            const typeEl = document.getElementById('lc-event-type');
            const descEl = document.getElementById('lc-event-desc');
            const desc = descEl ? descEl.value.trim() : '';
            if (!desc) { showToast('Please enter a description.'); return; }
            saving = true;
            refreshContent();
            ROS.bridge.sendToVelo('logLifecycleEvent', {
                driverId:    driverCtx ? driverCtx.driverId : null,
                eventType:   typeEl ? typeEl.value : 'NOTE',
                description: desc
            });
        },

        confirmTermination: function() {
            const reasonEl = document.querySelector('input[name="term-reason"]:checked');
            const notesEl  = document.getElementById('lc-term-notes');
            const rehireEl = document.getElementById('lc-term-rehire');
            const reason = reasonEl ? reasonEl.value : null;
            const notes  = notesEl  ? notesEl.value.trim() : '';
            const rehire = rehireEl ? rehireEl.checked : false;
            if (!reason) { showToast('Please select a reason.'); return; }
            if (!notes)  { showToast('Recruiter notes are required.'); return; }
            saving = true;
            refreshContent();
            ROS.bridge.sendToVelo('terminateDriver', {
                driverId:       driverCtx ? driverCtx.driverId : null,
                driverName:     driverCtx ? driverCtx.driverName : '',
                reason,
                notes,
                eligibleRehire: rehire
            });
        }
    };

    // Alias so existing onclick="ROS.views.lifecycle.*" still works
    ROS.views.lifecycle = ROS.views._lifecycle;

    // ── Register ──
    ROS.views.registerView(VIEW_ID, { render, onMount, onUnmount, onMessage, messages: MESSAGES });
})();
