/* =========================================
   Admin Notification Rules — Logic Module
   Depends on: LMDRBridge (CDN)
   ========================================= */
var NotificationRulesLogic = (function () {
  'use strict';

  var rules = [];
  var editingRule = null;

  function init() {
    LMDRBridge.on('rulesLoaded', function (payload) {
      rules = payload || [];
      renderRules();
    });
    LMDRBridge.on('ruleTestResult', function (payload) {
      alert('Would dispatch: ' + (payload.wouldDispatch ? 'Yes' : 'No') + '\nChannels: ' + payload.channels.length);
    });
    LMDRBridge.on('actionSuccess', function (message) {
      alert(message);
      refreshRules();
    });
    LMDRBridge.on('actionError', function (message) { alert(message || 'Error'); });
    refreshRules();
  }

  function refreshRules() {
    LMDRBridge.send('getAllRules');
  }

  function renderRules() {
    var container = document.getElementById('rulesContainer');
    var search = document.getElementById('searchInput').value.toLowerCase();
    var eventFilter = document.getElementById('eventFilter').value;
    var filtered = rules.filter(function (rule) {
      var matchesSearch = (rule.name || '').toLowerCase().indexOf(search) !== -1 || (rule.triggerEvent || '').toLowerCase().indexOf(search) !== -1;
      var matchesEvent = eventFilter === 'all' || rule.triggerEvent === eventFilter;
      return matchesSearch && matchesEvent;
    });

    if (!filtered.length) {
      container.innerHTML = '<div class="text-sm text-slate-400 py-8 text-center border border-dashed border-slate-800 rounded">No rules found.</div>';
      return;
    }

    container.innerHTML = filtered.map(function (rule) {
      return '<div class="border border-slate-800 rounded p-4 bg-slate-900">' +
        '<div class="flex items-center justify-between">' +
        '<div>' +
        '<div class="font-semibold">' + esc(rule.name || 'Untitled') + '</div>' +
        '<div class="text-xs text-slate-400">' + esc(rule.triggerEvent || '') + '</div>' +
        '</div>' +
        '<div class="flex items-center gap-2">' +
        '<span class="text-xs px-2 py-1 rounded ' + (rule.isActive ? 'bg-emerald-900 text-emerald-300' : 'bg-slate-800 text-slate-300') + '">' + (rule.isActive ? 'ACTIVE' : 'INACTIVE') + '</span>' +
        '<button onclick="toggleRule(\'' + esc(rule._id) + '\', ' + !rule.isActive + ')" class="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700">' + (rule.isActive ? 'Disable' : 'Enable') + '</button>' +
        '<button onclick="editRule(\'' + esc(rule._id) + '\')" class="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700">Edit</button>' +
        '<button onclick="testRule(\'' + esc(rule._id) + '\')" class="text-xs px-2 py-1 rounded bg-indigo-700 hover:bg-indigo-600">Test</button>' +
        '<button onclick="removeRule(\'' + esc(rule._id) + '\')" class="text-xs px-2 py-1 rounded bg-rose-800 hover:bg-rose-700">Delete</button>' +
        '</div></div></div>';
    }).join('');
  }

  function openCreate() {
    editingRule = null;
    document.getElementById('modalTitle').textContent = 'Create Rule';
    document.getElementById('ruleName').value = '';
    document.getElementById('ruleEvent').value = '';
    document.getElementById('ruleDescription').value = '';
    document.getElementById('ruleActive').checked = true;
    document.getElementById('throttleEnabled').checked = false;
    document.getElementById('maxPerHour').value = 5;
    document.getElementById('maxPerDay').value = 20;
    document.getElementById('inAppTemplate').value = '';
    document.getElementById('emailTemplateKey').value = '';
    document.getElementById('ruleModal').classList.remove('hidden');
  }

  function editRule(ruleId) {
    var rule = null;
    for (var i = 0; i < rules.length; i++) { if (rules[i]._id === ruleId) { rule = rules[i]; break; } }
    if (!rule) return;
    editingRule = rule;
    document.getElementById('modalTitle').textContent = 'Edit Rule';
    document.getElementById('ruleName').value = rule.name || '';
    document.getElementById('ruleEvent').value = rule.triggerEvent || '';
    document.getElementById('ruleDescription').value = rule.description || '';
    document.getElementById('ruleActive').checked = !!rule.isActive;
    document.getElementById('throttleEnabled').checked = !!(rule.throttling && rule.throttling.enabled);
    document.getElementById('maxPerHour').value = (rule.throttling && rule.throttling.maxPerHour) || 5;
    document.getElementById('maxPerDay').value = (rule.throttling && rule.throttling.maxPerDay) || 20;
    var inApp = null; var email = null;
    var channels = rule.channels || [];
    for (var j = 0; j < channels.length; j++) {
      if (channels[j].type === 'in_app') inApp = channels[j];
      if (channels[j].type === 'email') email = channels[j];
    }
    document.getElementById('inAppTemplate').value = (inApp && inApp.template) || '';
    document.getElementById('emailTemplateKey').value = (email && email.templateKey) || '';
    document.getElementById('ruleModal').classList.remove('hidden');
  }

  function closeModal() {
    document.getElementById('ruleModal').classList.add('hidden');
  }

  function buildChannels() {
    var inAppTemplate = document.getElementById('inAppTemplate').value.trim();
    var emailTemplateKey = document.getElementById('emailTemplateKey').value.trim();
    var channels = [];
    if (inAppTemplate) { channels.push({ type: 'in_app', enabled: true, template: inAppTemplate }); }
    if (emailTemplateKey) { channels.push({ type: 'email', enabled: true, templateKey: emailTemplateKey }); }
    return channels;
  }

  function saveRule() {
    var ruleData = {
      name: document.getElementById('ruleName').value.trim(),
      triggerEvent: document.getElementById('ruleEvent').value.trim(),
      description: document.getElementById('ruleDescription').value.trim(),
      isActive: document.getElementById('ruleActive').checked,
      priority: 'medium',
      conditions: [],
      channels: buildChannels(),
      throttling: {
        enabled: document.getElementById('throttleEnabled').checked,
        maxPerHour: Number(document.getElementById('maxPerHour').value || 5),
        maxPerDay: Number(document.getElementById('maxPerDay').value || 20),
        cooldownMinutes: 30,
        groupSimilar: false
      },
      scheduling: {
        delayMinutes: 0,
        respectQuietHours: true,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        quietHoursTimezone: 'user',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6]
      }
    };

    if (!ruleData.name || !ruleData.triggerEvent) {
      alert('Name and trigger event are required.');
      return;
    }

    if (editingRule) {
      LMDRBridge.send('updateRule', { ruleId: editingRule._id, updates: ruleData });
    } else {
      LMDRBridge.send('createRule', { ruleData: ruleData });
    }
    closeModal();
  }

  function toggleRule(ruleId, isActive) {
    LMDRBridge.send('toggleRule', { ruleId: ruleId, isActive: isActive });
  }

  function removeRule(ruleId) {
    if (!confirm('Delete this rule?')) return;
    LMDRBridge.send('deleteRule', { ruleId: ruleId });
  }

  function testRule(ruleId) {
    LMDRBridge.send('testRule', {
      ruleId: ruleId,
      sampleData: {
        userId: 'test-user',
        user: { firstName: 'Alex' },
        carrier: { name: 'Acme Logistics' },
        match: { score: 92 }
      }
    });
  }

  function esc(s) { if (!s) return ''; var d = document.createElement('div'); d.textContent = String(s); return d.innerHTML; }

  function exposeGlobals() {
    window.refreshRules = refreshRules;
    window.renderRules = renderRules;
    window.openCreate = openCreate;
    window.editRule = editRule;
    window.closeModal = closeModal;
    window.saveRule = saveRule;
    window.toggleRule = toggleRule;
    window.removeRule = removeRule;
    window.testRule = testRule;
  }

  return { init: init, exposeGlobals: exposeGlobals };
})();
