// ============================================================================
// ROS-VIEW-HOME — Welcome / Empty State
// ============================================================================

(function () {
  'use strict';

  const VIEW_ID = 'home';
  const BRAND = ROS.config.brand;

  function render() {
    return `
      <div class="h-full overflow-y-auto px-2 pb-12" style="animation:fadeIn 0.6s ease">
        
        <!-- Welcome Header -->
        <div class="mb-8 mt-2">
          <h1 class="text-[28px] font-black text-lmdr-dark tracking-tight">Good morning, Recruiter!</h1>
          <p class="text-[13px] text-tan mt-1 font-medium">Here's what's happening in your portfolio today.</p>
        </div>

        <!-- Quick Stats -->
        <div class="grid grid-cols-3 gap-6 mb-8">
          <div class="neu-s rounded-2xl p-6 relative overflow-hidden group">
            <div class="absolute -right-4 -top-4 w-24 h-24 bg-lmdr-blue/5 rounded-full ring-4 ring-white/20 transition-transform group-hover:scale-110"></div>
            <p class="text-[10px] uppercase font-bold tracking-widest text-tan relative z-10">Total Pipeline</p>
            <h2 class="text-[36px] font-black text-lmdr-dark mt-2 tracking-tighter relative z-10" id="home-stat-pipeline">--</h2>
            <div class="flex items-center gap-1.5 mt-2 relative z-10">
              <span class="material-symbols-outlined text-[14px] text-sg">trending_up</span>
              <span class="text-[11px] font-bold text-sg">Candidates</span>
            </div>
          </div>
          
          <div class="neu-s rounded-2xl p-6 relative overflow-hidden group">
            <div class="absolute -right-4 -top-4 w-24 h-24 bg-red-500/5 rounded-full ring-4 ring-white/20 transition-transform group-hover:scale-110"></div>
            <p class="text-[10px] uppercase font-bold tracking-widest text-tan relative z-10">Unread Messages</p>
            <h2 class="text-[36px] font-black text-lmdr-blue mt-2 tracking-tighter relative z-10" id="home-stat-messages">--</h2>
            <div class="flex items-center gap-1.5 mt-2 relative z-10">
              <span class="material-symbols-outlined text-[14px] text-lmdr-blue">chat</span>
              <span class="text-[11px] font-bold text-tan">Requires attention</span>
            </div>
          </div>

          <div class="neu-s rounded-2xl p-6 relative overflow-hidden group">
            <div class="absolute -right-4 -top-4 w-24 h-24 bg-amber-500/5 rounded-full ring-4 ring-white/20 transition-transform group-hover:scale-110"></div>
            <p class="text-[10px] uppercase font-bold tracking-widest text-tan relative z-10">New Matches</p>
            <h2 class="text-[36px] font-black text-amber-500 mt-2 tracking-tighter relative z-10" id="home-stat-matches">--</h2>
            <div class="flex items-center gap-1.5 mt-2 relative z-10">
              <span class="material-symbols-outlined text-[14px] text-amber-500">person_add</span>
              <span class="text-[11px] font-bold text-tan">Sourced by AI Engine</span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-[1fr_300px] gap-8">
          <!-- Quick Actions -->
          <div>
            <h3 class="text-[14px] font-bold text-lmdr-dark mb-4 px-1">Quick Actions</h3>
            <div class="grid grid-cols-2 gap-4">
              <div onclick="ROS.views.showView('search')" class="neu-x rounded-xl p-5 cursor-pointer hover:shadow-neu transition-all active:scale-[0.98] group flex items-start gap-4">
                <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-lmdr-blue to-lmdr-deep flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform"><span class="material-symbols-outlined text-white text-[18px]">person_search</span></div>
                <div>
                  <div class="text-[13px] font-bold text-lmdr-dark">Find Drivers</div>
                  <div class="text-[11px] text-tan mt-0.5">Search via AI Match Engine</div>
                </div>
              </div>

              <div onclick="ROS.views.showView('pipeline')" class="neu-x rounded-xl p-5 cursor-pointer hover:shadow-neu transition-all active:scale-[0.98] group flex items-start gap-4">
                <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform"><span class="material-symbols-outlined text-white text-[18px]">view_kanban</span></div>
                <div>
                  <div class="text-[13px] font-bold text-lmdr-dark">View Pipeline</div>
                  <div class="text-[11px] text-tan mt-0.5">Manage candidate stages</div>
                </div>
              </div>

              <div onclick="ROS.views.showView('funnel')" class="neu-x rounded-xl p-5 cursor-pointer hover:shadow-neu transition-all active:scale-[0.98] group flex items-start gap-4">
                <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform"><span class="material-symbols-outlined text-white text-[18px]">insights</span></div>
                <div>
                  <div class="text-[13px] font-bold text-lmdr-dark">Analytics Dash</div>
                  <div class="text-[11px] text-tan mt-0.5">Conversion & Funnel Metrics</div>
                </div>
              </div>

              <div onclick="ROS.views.showView('messages')" class="neu-x rounded-xl p-5 cursor-pointer hover:shadow-neu transition-all active:scale-[0.98] group flex items-start gap-4">
                <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform"><span class="material-symbols-outlined text-white text-[18px]">chat</span></div>
                <div>
                  <div class="text-[13px] font-bold text-lmdr-dark">Messaging Box</div>
                  <div class="text-[11px] text-tan mt-0.5">Inbox & Driver Comms</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Activity Feed -->
          <div>
            <h3 class="text-[14px] font-bold text-lmdr-dark mb-4 px-1">Recent Activity</h3>
            <div class="neu rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden" id="home-activity-feed">
              <div class="flex gap-3 relative z-10">
                <div class="flex-none mt-1"><div class="w-2 h-2 rounded-full bg-lmdr-blue"></div></div>
                <div>
                  <p class="text-[12px] font-bold text-lmdr-dark">New Driver Application</p>
                  <p class="text-[10px] text-tan mt-0.5">Michael T. applied for Regional OTR.</p>
                  <span class="text-[9px] text-tan/50 mt-1 block">10 mins ago</span>
                </div>
              </div>
              <div class="flex gap-3 relative z-10">
                <div class="flex-none mt-1"><div class="w-2 h-2 rounded-full bg-amber-500"></div></div>
                <div>
                  <p class="text-[12px] font-bold text-lmdr-dark">AI Match Sent</p>
                  <p class="text-[10px] text-tan mt-0.5">Engaged 3 candidates via Reverse Match.</p>
                  <span class="text-[9px] text-tan/50 mt-1 block">2 hours ago</span>
                </div>
              </div>
              <div class="flex gap-3 relative z-10">
                <div class="flex-none mt-1"><div class="w-2 h-2 rounded-full bg-emerald-500"></div></div>
                <div>
                  <p class="text-[12px] font-bold text-lmdr-dark">Interview Scheduled</p>
                  <p class="text-[10px] text-tan mt-0.5">Sarah J. confirmed for tomorrow 10am.</p>
                  <span class="text-[9px] text-tan/50 mt-1 block">Yesterday</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>`;
  }

  function onMount() {
    ROS.bridge.sendToVelo('getPipeline', {});
    ROS.bridge.sendToVelo('getUnreadCount', {});
    // Mock new matches for visual parity until real dashboard API exists
    setTimeout(() => {
      document.getElementById('home-stat-matches').textContent = '24';
    }, 800);
  }

  function onUnmount() { }

  function onMessage(type, data) {
    if (type === 'pipelineLoaded') {
      const el = document.getElementById('home-stat-pipeline');
      if (el && data && data.stages) {
        let total = 0;
        data.stages.forEach(s => {
          total += (s.candidates ? s.candidates.length : 0);
        });
        el.textContent = total;
      }
    }

    if (type === 'unreadCountData') {
      const el = document.getElementById('home-stat-messages');
      if (el && data && typeof data.count === 'number') {
        el.textContent = data.count;
      }
    }
  }

  ROS.views.registerView(VIEW_ID, {
    render,
    onMount,
    onUnmount,
    onMessage,
    messages: ['pipelineLoaded', 'unreadCountData']
  });

})();
