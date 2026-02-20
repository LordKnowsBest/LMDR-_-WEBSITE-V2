/* =========================================
   RECRUITER PIPELINE — Logic Module
   Depends on: PipelineConfig, PipelineBridge, PipelineRender
   ========================================= */
var PipelineLogic = (function () {
  'use strict';

  /* --- Sidebar --- */
  function toggleSidebar() {
    var sidebar = document.getElementById('sidebar');
    var icon = document.getElementById('toggleIcon');

    sidebar.classList.toggle('w-64');
    sidebar.classList.toggle('w-20');
    sidebar.classList.toggle('collapsed');

    if (sidebar.classList.contains('collapsed')) {
      icon.classList.remove('fa-chevron-left');
      icon.classList.add('fa-chevron-right');
      document.getElementById('sidebarChatContainer').classList.remove('chat-open');
    } else {
      icon.classList.remove('fa-chevron-right');
      icon.classList.add('fa-chevron-left');
    }
  }

  function toggleSidebarChat() {
    var sidebar = document.getElementById('sidebar');
    var container = document.getElementById('sidebarChatContainer');
    var chevron = document.getElementById('sidebarChatChevron');

    if (sidebar.classList.contains('collapsed')) {
      toggleSidebar();
      setTimeout(function () {
        container.classList.add('chat-open');
        chevron.classList.replace('fa-chevron-up', 'fa-chevron-down');
      }, 300);
    } else {
      container.classList.toggle('chat-open');
      if (container.classList.contains('chat-open')) {
        chevron.classList.replace('fa-chevron-up', 'fa-chevron-down');
      } else {
        chevron.classList.replace('fa-chevron-down', 'fa-chevron-up');
      }
    }
  }

  function updateSidebarUser(profile) {
    if (!profile) return;
    var name = profile.firstName || profile.name || 'Recruiter';
    var company = profile.company || '--';
    var initials = name.split(' ').map(function (n) { return n[0]; }).join('').toUpperCase().slice(0, 2);

    var nameEl = document.getElementById('sidebar-user-name');
    var companyEl = document.getElementById('sidebar-user-company');
    var initialsEl = document.getElementById('sidebar-user-initials');

    if (nameEl) nameEl.textContent = name;
    if (companyEl) companyEl.textContent = company;
    if (initialsEl) initialsEl.textContent = initials || '--';
  }

  /* --- Automation --- */
  function loadAutomationRules() {
    PipelineBridge.sendMessage('getAutomationRules', {});
    PipelineBridge.sendMessage('getAutomationLog', {});
  }

  function openAutomationRuleEditor(rule) {
    if (rule === undefined) rule = null;
    document.getElementById('automationModalTitle').textContent = rule ? 'Edit Rule' : 'Create Automation Rule';
    document.getElementById('editRuleId').value = rule ? rule._id : '';
    document.getElementById('ruleName').value = rule ? rule.rule_name : '';
    document.getElementById('ruleTriggerEvent').value = rule ? rule.trigger_event : 'status_change';
    document.getElementById('ruleFromStage').value = rule ? rule.from_stage : '';
    document.getElementById('ruleToStage').value = rule ? rule.to_stage : '';
    document.getElementById('ruleAutoNote').value = rule ? rule.auto_note : '';
    document.getElementById('ruleNotifyRecruiter').checked = rule ? rule.notify_recruiter : true;
    document.getElementById('automationRuleModal').classList.remove('hidden');
    document.getElementById('automationRuleModal').classList.add('flex');
  }

  function closeAutomationRuleEditor() {
    document.getElementById('automationRuleModal').classList.add('hidden');
    document.getElementById('automationRuleModal').classList.remove('flex');
  }

  function submitAutomationRule() {
    var ruleId = document.getElementById('editRuleId').value;
    var ruleData = {
      ruleName: document.getElementById('ruleName').value,
      triggerEvent: document.getElementById('ruleTriggerEvent').value,
      fromStage: document.getElementById('ruleFromStage').value,
      toStage: document.getElementById('ruleToStage').value,
      autoNote: document.getElementById('ruleAutoNote').value,
      notifyRecruiter: document.getElementById('ruleNotifyRecruiter').checked
    };

    if (ruleId) {
      ruleData.ruleId = ruleId;
      PipelineBridge.sendMessage('updateAutomationRule', ruleData);
    } else {
      PipelineBridge.sendMessage('createAutomationRule', ruleData);
    }
  }

  function deleteAutomationRuleItem(ruleId) {
    if (confirm('Delete this automation rule?')) {
      PipelineBridge.sendMessage('deleteAutomationRule', { ruleId: ruleId });
    }
  }

  function toggleAutomationRule(ruleId, isActive) {
    PipelineBridge.sendMessage('toggleRuleStatus', { ruleId: ruleId, isActive: isActive });
  }

  /* --- Init --- */
  function init() {
    // Sidebar navigation
    document.querySelectorAll('.sidebar-link[data-page]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var sidebar = document.getElementById('sidebar');
        if (sidebar.classList.contains('collapsed')) {
          toggleSidebar();
        }
        var page = link.getAttribute('data-page');
        if (page) {
          window.parent.postMessage({ type: 'navigateTo', data: { page: page } }, '*');
        }
      });
    });

    // Listen for messages
    PipelineBridge.listen({
      recruiterProfile: function (data) {
        if (data) updateSidebarUser(data);
      },
      automationRulesLoaded: function (data) {
        if (data && data.success) PipelineRender.renderAutomationRules(data.rules || []);
      },
      automationRuleCreated: function (data) {
        if (data && data.success) {
          PipelineRender.showToast('Rule created!', 'success');
          closeAutomationRuleEditor();
          loadAutomationRules();
        } else {
          PipelineRender.showToast((data && data.error) || 'Failed to create rule', 'error');
        }
      },
      automationRuleUpdated: function (data) {
        if (data && data.success) {
          PipelineRender.showToast('Rule updated', 'success');
          closeAutomationRuleEditor();
          loadAutomationRules();
        }
      },
      automationRuleDeleted: function (data) {
        if (data && data.success) {
          PipelineRender.showToast('Rule deleted', 'success');
          loadAutomationRules();
        }
      },
      automationRuleToggled: function (data) {
        if (data && data.success) {
          PipelineRender.showToast(data.isActive ? 'Rule enabled' : 'Rule disabled', 'success');
          loadAutomationRules();
        }
      },
      automationLogLoaded: function (data) {
        if (data && data.success) PipelineRender.renderAutomationLog(data.log || []);
      }
    });

    // Notify ready
    PipelineBridge.notifyReady();
  }

  function exposeGlobals() {
    window.toggleSidebar = toggleSidebar;
    window.toggleSidebarChat = toggleSidebarChat;
  }

  return {
    init: init,
    exposeGlobals: exposeGlobals,
    openAutomationRuleEditor: openAutomationRuleEditor,
    closeAutomationRuleEditor: closeAutomationRuleEditor,
    submitAutomationRule: submitAutomationRule,
    deleteAutomationRuleItem: deleteAutomationRuleItem,
    toggleAutomationRule: toggleAutomationRule
  };
})();
