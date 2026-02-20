/* =========================================
   Admin A/B Tests — Logic Module
   Depends on: LMDRBridge (CDN)
   ========================================= */
var ABTestsLogic = (function () {
  'use strict';

  var tests = [];
  var editingTest = null;

  function init() {
    LMDRBridge.on('testsLoaded', function (payload) {
      tests = payload || [];
      renderTests();
    });
    LMDRBridge.on('testResultsLoaded', function (payload) {
      var leading = payload.leadingVariant ? payload.leadingVariant.variantId + ' (' + payload.leadingVariant.liftPct + '% lift)' : 'n/a';
      alert('Participants: ' + payload.participants + '\nEvents: ' + payload.events + '\nLeading: ' + leading + '\nWinner: ' + (payload.significantWinner || 'none yet'));
    });
    LMDRBridge.on('actionSuccess', function (message) {
      alert(message);
      refreshTests();
    });
    LMDRBridge.on('actionError', function (message) { alert(message || 'Error'); });
    refreshTests();
  }

  function refreshTests() {
    var status = document.getElementById('statusFilter').value || null;
    LMDRBridge.send('getAllTests', { status: status });
  }

  function renderTests() {
    var container = document.getElementById('testsContainer');
    var search = document.getElementById('searchInput').value.toLowerCase();
    var filtered = tests.filter(function (test) {
      return (test.key || '').toLowerCase().indexOf(search) !== -1 || (test.name || '').toLowerCase().indexOf(search) !== -1;
    });

    if (!filtered.length) {
      container.innerHTML = '<div class="text-sm text-slate-400 py-8 text-center border border-dashed border-slate-800 rounded">No tests found.</div>';
      return;
    }

    container.innerHTML = filtered.map(function (test) {
      var statusActions = test.status === 'running'
        ? '<button onclick="pauseTest(\'' + esc(test.key) + '\')" class="text-xs px-2 py-1 rounded bg-amber-700 hover:bg-amber-600">Pause</button>'
        : '<button onclick="startTest(\'' + esc(test.key) + '\')" class="text-xs px-2 py-1 rounded bg-emerald-700 hover:bg-emerald-600">Start</button>';

      return '<div class="border border-slate-800 rounded p-4 bg-slate-900">' +
        '<div class="flex items-center justify-between">' +
        '<div>' +
        '<div class="font-semibold">' + esc(test.name || test.key) + '</div>' +
        '<div class="text-xs text-slate-400">' + esc(test.key || '') + '</div>' +
        '<div class="text-xs text-slate-400 mt-1">Status: <span class="text-slate-200">' + esc(test.status || 'draft') + '</span></div>' +
        '</div>' +
        '<div class="flex items-center gap-2">' +
        '<button onclick="openEdit(\'' + esc(test.key) + '\')" class="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700">Edit</button>' +
        '<button onclick="viewResults(\'' + esc(test.key) + '\')" class="text-xs px-2 py-1 rounded bg-indigo-700 hover:bg-indigo-600">Results</button>' +
        statusActions +
        '<button onclick="endTest(\'' + esc(test.key) + '\')" class="text-xs px-2 py-1 rounded bg-rose-800 hover:bg-rose-700">End</button>' +
        '</div></div></div>';
    }).join('');
  }

  function openCreate() {
    editingTest = null;
    document.getElementById('modalTitle').textContent = 'Create Test';
    document.getElementById('testKey').disabled = false;
    document.getElementById('testKey').value = '';
    document.getElementById('testName').value = '';
    document.getElementById('testDescription').value = '';
    document.getElementById('trafficAllocation').value = 100;
    document.getElementById('minSampleSize').value = 100;
    document.getElementById('primaryMetric').value = 'application_submitted';
    document.getElementById('testModal').classList.remove('hidden');
  }

  function openEdit(testKey) {
    var test = null;
    for (var i = 0; i < tests.length; i++) { if (tests[i].key === testKey) { test = tests[i]; break; } }
    if (!test) return;
    editingTest = test;
    document.getElementById('modalTitle').textContent = 'Edit Test';
    document.getElementById('testKey').disabled = true;
    document.getElementById('testKey').value = test.key || '';
    document.getElementById('testName').value = test.name || '';
    document.getElementById('testDescription').value = test.description || '';
    document.getElementById('trafficAllocation').value = test.trafficAllocation || 100;
    document.getElementById('minSampleSize').value = test.minSampleSize || 100;
    document.getElementById('primaryMetric').value = (test.primaryMetric && test.primaryMetric.name) || 'application_submitted';
    document.getElementById('testModal').classList.remove('hidden');
  }

  function closeModal() {
    document.getElementById('testModal').classList.add('hidden');
  }

  function saveTest() {
    var data = {
      key: document.getElementById('testKey').value.trim(),
      name: document.getElementById('testName').value.trim(),
      description: document.getElementById('testDescription').value.trim(),
      trafficAllocation: Number(document.getElementById('trafficAllocation').value || 100),
      minSampleSize: Number(document.getElementById('minSampleSize').value || 100),
      confidenceLevel: 95,
      primaryMetric: {
        name: document.getElementById('primaryMetric').value.trim() || 'application_submitted',
        type: 'conversion',
        goal: 'maximize'
      },
      variants: [
        { id: 'control', name: 'Control', allocation: 50, config: {} },
        { id: 'variant_a', name: 'Variant A', allocation: 50, config: {} }
      ],
      targetAudience: { conditions: [] }
    };
    if (!data.key || !data.name) {
      alert('Key and name are required.');
      return;
    }

    if (editingTest) {
      LMDRBridge.send('updateTest', {
        testKey: editingTest.key,
        updates: {
          name: data.name,
          description: data.description,
          trafficAllocation: data.trafficAllocation,
          minSampleSize: data.minSampleSize,
          primaryMetric: data.primaryMetric
        }
      });
    } else {
      LMDRBridge.send('createTest', { testData: data });
    }
    closeModal();
  }

  function startTest(testKey) { LMDRBridge.send('startTest', { testKey: testKey }); }
  function pauseTest(testKey) { LMDRBridge.send('pauseTest', { testKey: testKey }); }

  function endTest(testKey) {
    var winnerId = prompt('Winner variant id (e.g. control or variant_a):', 'control');
    LMDRBridge.send('endTest', { testKey: testKey, winnerId: winnerId || null });
  }

  function viewResults(testKey) { LMDRBridge.send('getTestResults', { testKey: testKey }); }

  function esc(s) { if (!s) return ''; var d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; }

  function exposeGlobals() {
    window.refreshTests = refreshTests;
    window.renderTests = renderTests;
    window.openCreate = openCreate;
    window.openEdit = openEdit;
    window.closeModal = closeModal;
    window.saveTest = saveTest;
    window.startTest = startTest;
    window.pauseTest = pauseTest;
    window.endTest = endTest;
    window.viewResults = viewResults;
  }

  return { init: init, exposeGlobals: exposeGlobals };
})();
