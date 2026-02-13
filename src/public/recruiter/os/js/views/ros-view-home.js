// ============================================================================
// ROS-VIEW-HOME — Welcome / Empty State
// ============================================================================

(function() {
  'use strict';

  const VIEW_ID = 'home';
  const BRAND = ROS.config.brand;

  function render() {
    return `
      <div class="flex flex-col items-center justify-center h-full text-center" style="animation:fadeIn 1s ease">
        <div class="mb-6 opacity-[0.04]">
          <span class="text-[120px] font-black tracking-[20px] text-lmdr-dark">${BRAND.logo}</span>
        </div>
        <h1 class="text-[22px] font-bold text-lmdr-dark/60 -mt-12">What are we building today?</h1>
        <p class="text-[13px] text-tan mt-2 max-w-md mx-auto leading-relaxed">
          Open a tool from the left, type a command below, or press
          <span class="font-bold text-lmdr-dark/50">\u2318K</span> to search anything.
        </p>
        <div class="mt-10 opacity-30">
          <span class="material-symbols-outlined text-[28px] text-tan" style="animation:float 3s ease-in-out infinite">keyboard_arrow_down</span>
        </div>
      </div>`;
  }

  function onMount() {
    // No-op for home view
  }

  function onUnmount() {
    // No-op for home view
  }

  function onMessage() {
    // Home view doesn't process messages
  }

  ROS.views.registerView(VIEW_ID, {
    render,
    onMount,
    onUnmount,
    onMessage,
    messages: []
  });

})();
