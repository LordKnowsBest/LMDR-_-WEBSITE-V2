// ============================================================================
// ROS-VIEW-LIFECYCLE — Lifecycle Monitor (Coming Soon)
// ============================================================================

(function () {
  'use strict';

  const VIEW_ID = 'lifecycle';

  const MOCK_TIMELINE = [
    { type: 'APPLICATION_SUBMITTED', title: 'Application Submitted', desc: 'Applied for Regional OTR position. Match Score: 92%', date: '45d ago', icon: 'file_signature', color: 'lmdr-blue' },
    { type: 'INTERVIEW_COMPLETED', title: 'Interview Completed', desc: 'Phone interview with Sarah Miller. "Strong candidate, verify MVR."', date: '42d ago', icon: 'phone', color: 'purple-500' },
    { type: 'HIRED_ACTIVE', title: 'Hired & Active', desc: 'Offer accepted. Start date confirmed.', date: '40d ago', icon: 'handshake', color: 'emerald-500' },
    { type: 'DAY_7_SURVEY', title: 'Pulse Survey Response', desc: 'Score: 3/5. "Pay was lower than expected for first week."', date: '32d ago', icon: 'chat', color: 'amber-500', alert: true },
    { type: '30_DAY_MILESTONE', title: '30 Day Milestone', desc: 'Retention bonus accrued ($500).', date: '5d ago', icon: 'military_tech', color: 'yellow-500' }
  ];

  function render() {
    return `
      <div class="h-full flex flex-col overflow-hidden" style="animation:fadeIn 0.6s ease">
        
        <!-- Header -->
        <header class="flex-none px-6 py-4 border-b border-black/5 flex justify-between items-center z-20">
          <div>
            <h1 class="font-bold text-lmdr-dark text-[22px] leading-tight flex items-center gap-3">
              Driver Lifecycle Monitor
            </h1>
            <p class="text-[12px] font-bold text-emerald-600 uppercase tracking-wider mt-1 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              John Doe (Active)
            </p>
          </div>
          <div class="flex items-center gap-3">
            <button onclick="ROS.views.lifecycle.openLogModal()" class="neu-btn px-4 py-2 text-[12px] font-bold text-lmdr-blue flex items-center gap-2">
              <span class="material-symbols-outlined text-[16px]">draw</span> Log Event
            </button>
            <button onclick="ROS.views.lifecycle.openTermModal()" class="neu-btn-red px-4 py-2 text-[12px] font-bold text-red-500 flex items-center gap-2">
              <span class="material-symbols-outlined text-[16px]">person_cancel</span> Terminate
            </button>
          </div>
        </header>

        <!-- Main Layout -->
        <div class="flex-1 flex overflow-hidden">
          
          <!-- Timeline Area -->
          <div class="flex-1 overflow-y-auto thin-scroll p-6 relative">
            
            <!-- Risk Alert -->
            <div class="neu-s rounded-2xl p-5 mb-8 flex gap-4 relative overflow-hidden group border border-amber-500/20">
              <div class="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/10 rounded-full ring-4 ring-amber-500/5 transition-transform group-hover:scale-110"></div>
              <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-none shadow-lg shadow-amber-500/20">
                <span class="material-symbols-outlined text-white">warning</span>
              </div>
              <div class="relative z-10 w-full">
                <h3 class="font-bold text-lmdr-dark text-[14px]">Retention Risk Detected</h3>
                <p class="text-[12px] text-tan mt-1">Driver reported "Low Pay" in Day 7 survey. Immediate follow-up recommended.</p>
                <div class="mt-3">
                  <button class="text-[11px] font-bold text-amber-600 hover:text-amber-700 underline">View Survey Response</button>
                </div>
              </div>
            </div>

            <!-- Timeline -->
            <div class="space-y-4 pl-4 relative" id="lifecycle-timeline">
              <div class="absolute left-9 top-4 bottom-8 w-[2px] bg-black/5 dark:bg-white/5 timeline-line"></div>
              ${MOCK_TIMELINE.map(renderTimelineItem).join('')}
            </div>
            
          </div>

          <!-- Right Sidebar -->
          <aside class="w-[320px] border-l border-black/5 flex-none p-6 overflow-y-auto thin-scroll">
            <div class="mb-8">
              <h3 class="text-[11px] font-bold text-tan uppercase tracking-widest mb-4">Driver Stats</h3>
              <div class="space-y-4">
                <div class="neu-x rounded-xl p-4 text-center">
                  <div class="text-[28px] font-black text-lmdr-dark line-height-none">45</div>
                  <div class="text-[11px] font-bold text-tan uppercase tracking-wide mt-1">Days Tenure</div>
                </div>
                <div class="neu-x rounded-xl p-4 text-center">
                  <div class="text-[28px] font-black text-emerald-600 line-height-none">92%</div>
                  <div class="text-[11px] font-bold text-tan uppercase tracking-wide mt-1">Satisfaction Score</div>
                </div>
                <div class="neu-x rounded-xl p-4 text-center">
                  <div class="text-[28px] font-black text-lmdr-blue line-height-none">3</div>
                  <div class="text-[11px] font-bold text-tan uppercase tracking-wide mt-1">Positive Events</div>
                </div>
              </div>
            </div>

            <div>
              <h3 class="text-[11px] font-bold text-tan uppercase tracking-widest mb-4">Disposition</h3>
              <div class="neu-x rounded-xl p-4 text-center">
                <p class="text-[11px] font-medium text-tan italic">No previous terminations.</p>
              </div>
            </div>
          </aside>

        </div>

        <!-- Modals will be appended to document.body on mount for proper z-index if needed, or kept inline -->

      </div>

      <!-- Log Event Modal -->
      <div id="lifecycle-log-modal" class="fixed inset-0 bg-black/50 z-[100] hidden flex items-center justify-center backdrop-blur-sm opacity-0 transition-opacity">
        <div class="neu rounded-2xl w-full max-w-md overflow-hidden transform scale-95 transition-transform" id="lifecycle-log-content">
          <div class="p-5 border-b border-black/5 flex items-center justify-between">
            <h3 class="font-bold text-[16px] text-lmdr-dark">Log Lifecycle Event</h3>
            <button onclick="ROS.views.lifecycle.closeLogModal()" class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5 text-tan transition">
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          <div class="p-6 space-y-5">
            <div>
              <label class="block text-[11px] font-bold text-tan uppercase tracking-wider mb-2">Event Type</label>
              <select class="w-full neu-inset rounded-xl px-4 py-3 text-[13px] font-medium text-lmdr-dark focus:outline-none focus:ring-2 focus:ring-lmdr-blue/50">
                <option value="INCIDENT">Incident / Issue</option>
                <option value="RECOGNITION">Recognition / Award</option>
                <option value="TRAINING">Training Completed</option>
                <option value="NOTE">General Note</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-bold text-tan uppercase tracking-wider mb-2">Description</label>
              <textarea rows="4" class="w-full neu-inset rounded-xl px-4 py-3 text-[13px] font-medium text-lmdr-dark focus:outline-none focus:ring-2 focus:ring-lmdr-blue/50 resize-none" placeholder="Enter details..."></textarea>
            </div>
          </div>
          <div class="p-5 border-t border-black/5 flex justify-end gap-3">
            <button onclick="ROS.views.lifecycle.closeLogModal()" class="px-5 py-2.5 text-[12px] font-bold text-tan hover:text-lmdr-dark transition">Cancel</button>
            <button onclick="ROS.views.lifecycle.closeLogModal()" class="bg-gradient-to-r from-lmdr-blue to-lmdr-deep text-white px-6 py-2.5 rounded-xl text-[12px] font-bold shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform">Save Log</button>
          </div>
        </div>
      </div>

      <!-- Terminate Modal -->
      <div id="lifecycle-term-modal" class="fixed inset-0 bg-black/60 z-[100] hidden flex items-center justify-center backdrop-blur-sm opacity-0 transition-opacity">
        <div class="neu rounded-2xl w-full max-w-lg overflow-hidden transform scale-95 transition-transform border border-red-500/20" id="lifecycle-term-content">
          <div class="p-6 border-b border-black/5 bg-red-500/5 relative overflow-hidden">
            <div class="absolute -right-4 -top-4 w-24 h-24 bg-red-500/10 rounded-full"></div>
            <h3 class="font-bold text-[18px] text-red-600 flex items-center gap-2 relative z-10">
              <span class="material-symbols-outlined">warning</span> Terminate Driver
            </h3>
            <p class="text-[12px] font-medium text-red-600/70 mt-1 relative z-10">This action ends the driver's employment record.</p>
          </div>
          <div class="p-6 space-y-5">
            <div>
              <label class="block text-[11px] font-bold text-tan uppercase tracking-wider mb-2">Primary Reason</label>
              <div class="grid grid-cols-2 gap-3">
                <button class="neu-inset rounded-xl p-4 text-left border border-transparent hover:border-lmdr-blue/30 focus:border-lmdr-blue focus:ring-1 focus:ring-lmdr-blue transition group">
                  <div class="text-[13px] font-bold text-lmdr-dark group-hover:text-lmdr-blue">Operations</div>
                  <div class="text-[10px] text-tan mt-1">No freight, equipment</div>
                </button>
                <button class="neu-inset rounded-xl p-4 text-left border border-transparent hover:border-lmdr-blue/30 focus:border-lmdr-blue focus:ring-1 focus:ring-lmdr-blue transition group">
                  <div class="text-[13px] font-bold text-lmdr-dark group-hover:text-lmdr-blue">Compensation</div>
                  <div class="text-[10px] text-tan mt-1">Pay rate, miles</div>
                </button>
                <button class="neu-inset rounded-xl p-4 text-left border border-transparent hover:border-lmdr-blue/30 focus:border-lmdr-blue focus:ring-1 focus:ring-lmdr-blue transition group">
                  <div class="text-[13px] font-bold text-lmdr-dark group-hover:text-lmdr-blue">Personal</div>
                  <div class="text-[10px] text-tan mt-1">Home time, health</div>
                </button>
                <button class="neu-inset rounded-xl p-4 text-left border border-transparent hover:border-red-500/30 focus:border-red-500 focus:ring-1 focus:ring-red-500 transition group">
                  <div class="text-[13px] font-bold text-lmdr-dark group-focus:text-red-500">Compliance</div>
                  <div class="text-[10px] text-tan mt-1">Safety, violations</div>
                </button>
              </div>
            </div>
            <div>
              <label class="block text-[11px] font-bold text-tan uppercase tracking-wider mb-2">Recruiter Notes</label>
              <textarea rows="2" class="w-full neu-inset rounded-xl px-4 py-3 text-[13px] font-medium text-lmdr-dark focus:outline-none focus:ring-2 focus:ring-lmdr-blue/50 resize-none" placeholder="Required for compliance..."></textarea>
            </div>
            <div class="flex items-center gap-3">
              <input type="checkbox" id="term-rehire" class="w-4 h-4 rounded text-lmdr-blue focus:ring-lmdr-blue bg-black/5 border-transparent">
              <label for="term-rehire" class="text-[13px] font-bold text-lmdr-dark">Eligible for Rehire?</label>
            </div>
          </div>
          <div class="p-5 border-t border-black/5 flex justify-end gap-3">
            <button onclick="ROS.views.lifecycle.closeTermModal()" class="px-5 py-2.5 text-[12px] font-bold text-tan hover:text-lmdr-dark transition">Cancel</button>
            <button onclick="ROS.views.lifecycle.closeTermModal()" class="bg-red-500 text-white px-6 py-2.5 rounded-xl text-[12px] font-bold shadow-lg shadow-red-500/20 hover:bg-red-600 transition">Confirm Termination</button>
          </div>
        </div>
      </div>
    `;
  }

  function renderTimelineItem(item) {
    const isAlert = item.alert ? 'border border-amber-500/30' : '';
    const alertLabel = item.alert ? '<div class="mt-3 inline-block px-2 py-1 rounded bg-amber-500/10 text-amber-600 text-[10px] font-bold uppercase tracking-wider"><span class="material-symbols-outlined text-[12px] align-middle mr-1">warning</span>Risk Flag</div>' : '';

    return `
      <div class="relative pl-10 pb-6 group">
        <div class="absolute left-0 top-0 w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-neu flex items-center justify-center z-10 transition-transform group-hover:scale-110">
          <span class="material-symbols-outlined text-[18px] text-${item.color}">${item.icon}</span>
        </div>
        <div class="neu-x rounded-xl p-5 ml-4 ${isAlert} hover:shadow-neu transition-shadow">
          <div class="flex justify-between items-start mb-2">
            <h4 class="font-bold text-[14px] text-lmdr-dark">${item.title}</h4>
            <span class="text-[10px] font-bold text-tan uppercase tracking-wide">${item.date}</span>
          </div>
          <p class="text-[12px] text-tan leading-relaxed">${item.desc}</p>
          ${alertLabel}
        </div>
      </div>
    `;
  }

  function openLogModal() {
    const modal = document.getElementById('lifecycle-log-modal');
    const content = document.getElementById('lifecycle-log-content');
    if (!modal) return;
    modal.classList.remove('hidden');
    // flush layout
    void modal.offsetWidth;
    modal.classList.remove('opacity-0');
    content.classList.remove('scale-95');
  }

  function closeLogModal() {
    const modal = document.getElementById('lifecycle-log-modal');
    const content = document.getElementById('lifecycle-log-content');
    if (!modal) return;
    modal.classList.add('opacity-0');
    content.classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
  }

  function openTermModal() {
    const modal = document.getElementById('lifecycle-term-modal');
    const content = document.getElementById('lifecycle-term-content');
    if (!modal) return;
    modal.classList.remove('hidden');
    void modal.offsetWidth;
    modal.classList.remove('opacity-0');
    content.classList.remove('scale-95');
  }

  function closeTermModal() {
    const modal = document.getElementById('lifecycle-term-modal');
    const content = document.getElementById('lifecycle-term-content');
    if (!modal) return;
    modal.classList.add('opacity-0');
    content.classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 300);
  }

  function onMount() {
    ROS.bridge.sendToVelo('getTimelineEvents', { driverId: 'mock-123' });
  }

  function onUnmount() {
    // Clean up modals if they were moved
  }

  function onMessage(type, data) {
    // Process backend messages when available
  }

  const lifecycleHandlers = {
    openLogModal,
    closeLogModal,
    openTermModal,
    closeTermModal
  };

  ROS.views.lifecycle = lifecycleHandlers;

  ROS.views.registerView(VIEW_ID, {
    render,
    onMount,
    onUnmount,
    onMessage,
    messages: ['timelineLoaded']
  });
})();
