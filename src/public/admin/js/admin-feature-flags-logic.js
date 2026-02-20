/* =========================================
   ADMIN FEATURE FLAGS — Logic Module
   Depends on: FeatureFlagsConfig, FeatureFlagsRender, LMDRBridge
   State management, event handlers, message routing
   ========================================= */
var FeatureFlagsLogic = (function () {
  'use strict';

  var allFlags = [];
  var editingFlag = null;

  function init() {
    setupMessageHandlers();
    refreshFlags();
  }

  function setupMessageHandlers() {
    LMDRBridge.on('actionSuccess', function (msg) {
      FeatureFlagsRender.showToast(msg, 'success');
      refreshFlags();
    });
    LMDRBridge.on('actionError', function (msg) {
      FeatureFlagsRender.showToast(msg, 'error');
    });
    LMDRBridge.on('flagsLoaded', function (flags) {
      allFlags = flags;
      FeatureFlagsRender.renderFlags(flags);
    });
  }

  function refreshFlags() {
    LMDRBridge.send('getAllFlags');
  }

  function openCreateModal() {
    editingFlag = null;
    document.getElementById('modalTitle').textContent = 'Create Feature Flag';
    document.getElementById('flagForm').reset();
    document.getElementById('formKey').disabled = false;
    document.getElementById('flagId').value = '';
    document.getElementById('rolloutValue').textContent = '0%';
    document.getElementById('rulesList').innerHTML =
      '<p class="text-center py-4 text-xs text-slate-500 italic border border-dashed border-border-dark rounded-lg">No custom targeting rules defined</p>';
    document.getElementById('flagModal').classList.remove('hidden');
  }

  function editFlag(key) {
    var flag = null;
    for (var i = 0; i < allFlags.length; i++) {
      if (allFlags[i].key === key) { flag = allFlags[i]; break; }
    }
    if (!flag) return;

    editingFlag = flag;
    document.getElementById('modalTitle').textContent = 'Edit Feature Flag';
    document.getElementById('formKey').value = flag.key;
    document.getElementById('formKey').disabled = true;
    document.getElementById('formName').value = flag.name || '';
    document.getElementById('formDescription').value = flag.description || '';
    document.getElementById('formCategory').value = flag.category || 'ui';
    document.getElementById('formEnv').value = flag.environment || 'production';
    document.getElementById('formEnabled').checked = !!flag.enabled;
    document.getElementById('formRollout').value = flag.rolloutPercentage || 0;
    updateRolloutValue(flag.rolloutPercentage || 0);

    var defaultValRadios = document.getElementsByName('defaultValue');
    defaultValRadios[0].checked = flag.defaultValue !== false;
    defaultValRadios[1].checked = flag.defaultValue === false;

    renderRulesInForm(flag.targetRules || []);
    document.getElementById('flagModal').classList.remove('hidden');
  }

  function closeModal() {
    document.getElementById('flagModal').classList.add('hidden');
  }

  function updateRolloutValue(val) {
    document.getElementById('rolloutValue').textContent = val + '%';
  }

  function renderRulesInForm(rules) {
    var container = document.getElementById('rulesList');
    if (rules.length === 0) {
      container.innerHTML =
        '<p class="text-center py-4 text-xs text-slate-500 italic border border-dashed border-border-dark rounded-lg">No custom targeting rules defined</p>';
      return;
    }

    container.innerHTML = '';
    for (var i = 0; i < rules.length; i++) {
      var rule = rules[i];
      var ruleEl = addRule();
      ruleEl.querySelector('.rule-name').value = rule.name || '';
      ruleEl.querySelector('.rule-rollout').value = rule.percentage != null ? rule.percentage : 100;

      var condContainer = ruleEl.querySelector('.conditions-list');
      condContainer.innerHTML = '';
      var conditions = rule.conditions || [];
      for (var j = 0; j < conditions.length; j++) {
        var cond = conditions[j];
        var condEl = addCondition(ruleEl.querySelector('button[onclick*="addCondition"]'));
        condEl.querySelector('.cond-attr').value = cond.attribute || '';
        condEl.querySelector('.cond-op').value = cond.operator || 'equals';
        condEl.querySelector('.cond-val').value = cond.value || '';
      }
    }
  }

  function addRule() {
    var container = document.getElementById('rulesList');
    var placeholder = container.querySelector('p');
    if (placeholder) placeholder.remove();

    var template = document.getElementById('ruleTemplate');
    var clone = template.content.cloneNode(true);
    var ruleItem = clone.querySelector('.rule-item');
    container.appendChild(clone);
    return ruleItem;
  }

  function addCondition(btn) {
    var container = btn.previousElementSibling;
    var template = document.getElementById('conditionTemplate');
    var clone = template.content.cloneNode(true);
    var condItem = clone.querySelector('.condition-item');
    container.appendChild(clone);
    return condItem;
  }

  function saveFlag(e) {
    e.preventDefault();

    var flagData = {
      key: document.getElementById('formKey').value,
      name: document.getElementById('formName').value,
      description: document.getElementById('formDescription').value,
      category: document.getElementById('formCategory').value,
      environment: document.getElementById('formEnv').value,
      enabled: document.getElementById('formEnabled').checked,
      rolloutPercentage: parseInt(document.getElementById('formRollout').value),
      defaultValue: document.querySelector('input[name="defaultValue"]:checked').value === 'true',
      targetRules: collectRules()
    };

    if (editingFlag) {
      LMDRBridge.send('updateFlag', { flagKey: flagData.key, updates: flagData });
    } else {
      LMDRBridge.send('createFlag', { flagData: flagData });
    }

    closeModal();
  }

  function collectRules() {
    var rules = [];
    var ruleItems = document.querySelectorAll('.rule-item');
    ruleItems.forEach(function (item) {
      var conditions = [];
      item.querySelectorAll('.condition-item').forEach(function (c) {
        conditions.push({
          attribute: c.querySelector('.cond-attr').value,
          operator: c.querySelector('.cond-op').value,
          value: c.querySelector('.cond-val').value
        });
      });

      rules.push({
        id: 'rule_' + Math.random().toString(36).substr(2, 9),
        name: item.querySelector('.rule-name').value,
        percentage: parseInt(item.querySelector('.rule-rollout').value),
        enabled: true,
        conditions: conditions
      });
    });
    return rules;
  }

  function toggleFlag(key, enabled) {
    LMDRBridge.send('toggleFlag', { flagKey: key, enabled: enabled });
  }

  function confirmDelete(key) {
    if (confirm('Are you sure you want to delete flag \'' + key + '\'? This cannot be undone.')) {
      LMDRBridge.send('deleteFlag', { flagKey: key });
    }
  }

  function filterFlags() {
    var search = document.getElementById('flagSearch').value.toLowerCase();
    var category = document.getElementById('filterCategory').value;
    var env = document.getElementById('filterEnv').value;

    var filtered = [];
    for (var i = 0; i < allFlags.length; i++) {
      var f = allFlags[i];
      var matchesSearch = f.key.toLowerCase().indexOf(search) !== -1 || (f.name && f.name.toLowerCase().indexOf(search) !== -1);
      var matchesCategory = category === 'all' || f.category === category;
      var matchesEnv = env === 'all' || f.environment === env;
      if (matchesSearch && matchesCategory && matchesEnv) filtered.push(f);
    }

    FeatureFlagsRender.renderFlags(filtered);
  }

  function navigateBack() {
    LMDRBridge.navigateTo('admin-dashboard');
  }

  return {
    init: init,
    openCreateModal: openCreateModal,
    editFlag: editFlag,
    closeModal: closeModal,
    updateRolloutValue: updateRolloutValue,
    addRule: addRule,
    addCondition: addCondition,
    saveFlag: saveFlag,
    toggleFlag: toggleFlag,
    confirmDelete: confirmDelete,
    filterFlags: filterFlags,
    navigateBack: navigateBack
  };
})();
