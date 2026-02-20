/* =========================================
   DRIVER MY CAREER — Logic Module
   Depends on: DriverMyCareerBridge
   Config, rendering, event handling, modal logic
   ========================================= */
var DriverMyCareerLogic = (function () {
  'use strict';

  // ── State ──
  var state = {
    events: [],
    currentCarrier: null,
    driverId: null
  };

  // ── Timeline Rendering ──
  function renderTimeline(events) {
    var container = document.getElementById('timeline-container');
    if (!container) return;
    container.innerHTML = '';

    events.sort(function (a, b) {
      return new Date(b.date) - new Date(a.date);
    });

    events.forEach(function (event) {
      var dateStr = new Date(event.date).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
      });

      var html =
        '<div class="relative pl-12 pb-8 timeline-item">' +
          '<div class="absolute left-[19px] top-2 bottom-0 w-0.5 bg-gray-200 timeline-line"></div>' +
          '<div class="absolute left-0 top-0 w-10 h-10 rounded-full bg-white border-2 border-' + (event.color || 'slate') + '-500 text-' + (event.color || 'slate') + '-600 flex items-center justify-center z-10 shadow-sm">' +
            '<i class="fa-solid ' + (event.icon || 'fa-circle') + ' text-sm"></i>' +
          '</div>' +
          '<div class="ml-4">' +
            '<div class="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-1">' +
              '<h3 class="font-bold text-slate-900 text-base">' + (event.title || '') + '</h3>' +
              '<time class="text-xs font-bold text-slate-400 uppercase tracking-wide">' + dateStr + '</time>' +
            '</div>' +
            '<p class="text-sm text-slate-600 bg-white p-3 rounded-lg border border-gray-100 shadow-sm inline-block">' + (event.desc || '') + '</p>' +
          '</div>' +
        '</div>';

      container.innerHTML += html;
    });
  }

  function updateHeader(carrier) {
    var carrierEl = document.querySelector('[data-carrier-name]');
    if (carrierEl && carrier) {
      carrierEl.textContent = carrier;
    }
  }

  // ── Modal Logic ──
  function openResignationModal() {
    var modal = document.getElementById('resignModal');
    var content = document.getElementById('resignModalContent');
    if (!modal || !content) return;
    modal.classList.remove('hidden');
    setTimeout(function () {
      content.classList.remove('scale-95', 'opacity-0');
      content.classList.add('scale-100', 'opacity-100');
    }, 10);
  }

  function closeResignModal() {
    var modal = document.getElementById('resignModal');
    var content = document.getElementById('resignModalContent');
    if (!modal || !content) return;
    content.classList.remove('scale-100', 'opacity-100');
    content.classList.add('scale-95', 'opacity-0');
    setTimeout(function () {
      modal.classList.add('hidden');
    }, 200);
  }

  function submitResignation() {
    var reason = document.getElementById('resignReason').value;
    var notes = document.getElementById('resignNotes').value;
    if (!reason) {
      alert('Please select a reason.');
      return;
    }
    DriverMyCareerBridge.submitResignation(reason, notes);
    closeResignModal();
  }

  // ── Message Handler ──
  function handleMessage(event) {
    var msg = event.data;
    if (!msg || typeof msg !== 'object') return;
    var type = msg.type || msg.action;

    switch (type) {
      case 'careerTimelineData':
        state.events = msg.data?.events || [];
        state.currentCarrier = msg.data?.currentCarrier || null;
        renderTimeline(state.events);
        if (state.currentCarrier) updateHeader(state.currentCarrier);
        break;
      case 'activeSurveysData':
        if (msg.data?.surveys && msg.data.surveys.length > 0) {
          var el = document.getElementById('survey-section');
          if (el) el.classList.remove('hidden');
        }
        break;
      case 'resignationResult':
        if (msg.data?.success) {
          alert('Status updated. Your profile and matching preferences have been adjusted.');
        }
        break;
    }
  }

  // ── Expose Globals for onclick ──
  function exposeGlobals() {
    window.openResignationModal = openResignationModal;
    window.closeResignModal = closeResignModal;
    window.submitResignation = submitResignation;
  }

  // ── Init ──
  function init() {
    exposeGlobals();
    window.addEventListener('message', handleMessage);

    // Show survey section (mock behavior preserved)
    var surveySection = document.getElementById('survey-section');
    if (surveySection) surveySection.classList.remove('hidden');

    // Use mock data if no Velo bridge available, otherwise request from Velo
    DriverMyCareerBridge.ready();
  }

  return {
    init: init,
    renderTimeline: renderTimeline,
    openResignationModal: openResignationModal,
    closeResignModal: closeResignModal,
    submitResignation: submitResignation
  };
})();
