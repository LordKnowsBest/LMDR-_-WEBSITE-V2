/* =========================================
   ADMIN PROMPTS — Logic Module
   Depends on: AdminPromptsConfig, AdminPromptsBridge, AdminPromptsRender
   Business logic, state, event handlers
   ========================================= */
var AdminPromptsLogic = (function () {
  'use strict';

  var state = {
    prompts: [],
    categories: [],
    selectedPrompt: null,
    isEditing: false
  };

  var searchTimeout;

  function init() {
    initTheme();
    setupBridgeListeners();
    AdminPromptsBridge.sendToVelo({ action: 'getCategories' });
    AdminPromptsBridge.sendToVelo({ action: 'getPrompts' });
  }

  function setupBridgeListeners() {
    AdminPromptsBridge.listen({
      init: function () { AdminPromptsBridge.sendToVelo({ action: 'getPrompts' }); },
      categoriesLoaded: function (data) {
        state.categories = data.payload;
        AdminPromptsRender.renderCategoryFilters(state.categories);
      },
      promptsLoaded: function (data) {
        state.prompts = data.payload.items;
        state.categories = data.payload.categories;
        AdminPromptsRender.renderCategoryFilters(state.categories);
        AdminPromptsRender.renderPrompts(state.prompts, state.categories);
      },
      promptLoaded: function (data) {
        state.selectedPrompt = data.payload.prompt;
        AdminPromptsRender.renderVersions(data.payload.versions);
      },
      promptCreated: function () {
        AdminPromptsRender.showToast('Prompt saved successfully', 'success');
        closeModal();
        AdminPromptsBridge.sendToVelo({ action: 'getPrompts' });
      },
      promptUpdated: function () {
        AdminPromptsRender.showToast('Prompt saved successfully', 'success');
        closeModal();
        AdminPromptsBridge.sendToVelo({ action: 'getPrompts' });
      },
      promptRestored: function () {
        AdminPromptsRender.showToast('Prompt saved successfully', 'success');
        closeModal();
        AdminPromptsBridge.sendToVelo({ action: 'getPrompts' });
      },
      promptRolledBack: function () {
        AdminPromptsRender.showToast('Prompt rolled back successfully', 'success');
        closeVersionModal();
        AdminPromptsBridge.sendToVelo({ action: 'getPrompts' });
      },
      promptDeleted: function () {
        AdminPromptsRender.showToast('Prompt deactivated', 'success');
        AdminPromptsBridge.sendToVelo({ action: 'getPrompts' });
      },
      seedComplete: function (data) {
        AdminPromptsRender.showToast('Seeded ' + data.payload.created + ' prompts (' + data.payload.skipped + ' skipped)', 'success');
        AdminPromptsBridge.sendToVelo({ action: 'getPrompts' });
      },
      actionError: function (data) {
        AdminPromptsRender.showToast(data.message || 'An error occurred', 'error');
      }
    });
  }

  // Theme
  function initTheme() {
    var saved = localStorage.getItem(AdminPromptsConfig.THEME_KEY);
    applyTheme(saved || 'dark');
  }

  function applyTheme(theme) {
    var html = document.documentElement;
    var body = document.body;
    if (theme === 'dark') {
      html.classList.add('dark');
      html.classList.remove('light');
      body.classList.add('bg-background-dark', 'text-white');
      body.classList.remove('bg-background-light', 'text-slate-800');
      document.getElementById('themeIconSun').classList.remove('hidden');
      document.getElementById('themeIconMoon').classList.add('hidden');
    } else {
      html.classList.remove('dark');
      html.classList.add('light');
      body.classList.remove('bg-background-dark', 'text-white');
      body.classList.add('bg-background-light', 'text-slate-800');
      document.getElementById('themeIconSun').classList.add('hidden');
      document.getElementById('themeIconMoon').classList.remove('hidden');
    }
  }

  function toggleTheme() {
    var current = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    var newTheme = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem(AdminPromptsConfig.THEME_KEY, newTheme);
    applyTheme(newTheme);
  }

  // Modal functions
  function openCreateModal() {
    state.isEditing = false;
    document.getElementById('modalTitle').textContent = 'Create Prompt';
    document.getElementById('editingPromptId').value = '';
    document.getElementById('promptIdInput').disabled = false;
    document.getElementById('changeNoteWrapper').classList.add('hidden');
    document.getElementById('promptForm').reset();
    document.getElementById('promptModal').classList.remove('hidden');
  }

  function openEditModal(promptId) {
    var prompt = state.prompts.find(function (p) { return p.promptId === promptId; });
    if (!prompt) return;

    state.isEditing = true;
    state.selectedPrompt = prompt;

    document.getElementById('modalTitle').textContent = 'Edit Prompt';
    document.getElementById('editingPromptId').value = promptId;
    document.getElementById('promptIdInput').value = prompt.promptId;
    document.getElementById('promptIdInput').disabled = true;
    document.getElementById('promptNameInput').value = prompt.name;
    document.getElementById('promptCategoryInput').value = prompt.category;
    document.getElementById('promptProviderInput').value = prompt.provider;
    document.getElementById('promptModelInput').value = prompt.model;
    document.getElementById('promptDescInput').value = prompt.description || '';
    document.getElementById('systemPromptInput').value = prompt.systemPrompt;
    document.getElementById('userPromptInput').value = prompt.userPromptTemplate || '';
    document.getElementById('promptVarsInput').value = (prompt.variables || []).join(', ');
    document.getElementById('changeNoteWrapper').classList.remove('hidden');
    document.getElementById('changeNoteInput').value = '';

    document.getElementById('promptModal').classList.remove('hidden');
  }

  function closeModal() {
    document.getElementById('promptModal').classList.add('hidden');
  }

  function savePrompt() {
    var promptData = {
      promptId: document.getElementById('promptIdInput').value.trim(),
      name: document.getElementById('promptNameInput').value.trim(),
      category: document.getElementById('promptCategoryInput').value,
      provider: document.getElementById('promptProviderInput').value,
      model: document.getElementById('promptModelInput').value.trim(),
      description: document.getElementById('promptDescInput').value.trim(),
      systemPrompt: document.getElementById('systemPromptInput').value.trim(),
      userPromptTemplate: document.getElementById('userPromptInput').value.trim(),
      variables: document.getElementById('promptVarsInput').value.split(',').map(function (v) { return v.trim(); }).filter(Boolean)
    };

    if (!promptData.promptId || !promptData.name || !promptData.systemPrompt) {
      AdminPromptsRender.showToast('Please fill in required fields', 'error');
      return;
    }

    if (state.isEditing) {
      var changeNote = document.getElementById('changeNoteInput').value.trim();
      AdminPromptsBridge.sendToVelo({
        action: 'updatePrompt',
        promptId: document.getElementById('editingPromptId').value,
        updates: promptData,
        changeNote: changeNote
      });
    } else {
      AdminPromptsBridge.sendToVelo({ action: 'createPrompt', promptData: promptData });
    }
  }

  // Version history
  function viewVersions(promptId) {
    AdminPromptsBridge.sendToVelo({ action: 'getPrompt', promptId: promptId });
    document.getElementById('versionModal').classList.remove('hidden');
  }

  function closeVersionModal() {
    document.getElementById('versionModal').classList.add('hidden');
  }

  function rollbackTo(promptId, version) {
    if (confirm('Rollback to version ' + version + '?')) {
      AdminPromptsBridge.sendToVelo({ action: 'rollbackPrompt', promptId: promptId, version: version });
      closeVersionModal();
    }
  }

  // Actions
  function filterPrompts() {
    AdminPromptsRender.renderPrompts(state.prompts, state.categories);
  }

  function debounceSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(filterPrompts, 300);
  }

  function deletePrompt(promptId) {
    if (confirm('Deactivate this prompt?')) {
      AdminPromptsBridge.sendToVelo({ action: 'deletePrompt', promptId: promptId });
    }
  }

  function restorePrompt(promptId) {
    AdminPromptsBridge.sendToVelo({ action: 'restorePrompt', promptId: promptId });
  }

  function seedDefaults() {
    if (confirm('Seed default prompts? (Existing prompts will not be overwritten)')) {
      AdminPromptsBridge.sendToVelo({ action: 'seedDefaults' });
    }
  }

  // Expose globals for onclick handlers
  function exposeGlobals() {
    window.toggleTheme = toggleTheme;
    window.openCreateModal = openCreateModal;
    window.closeModal = closeModal;
    window.savePrompt = savePrompt;
    window.closeVersionModal = closeVersionModal;
    window.filterPrompts = filterPrompts;
    window.debounceSearch = debounceSearch;
    window.seedDefaults = seedDefaults;
  }

  return {
    init: init,
    openEditModal: openEditModal,
    viewVersions: viewVersions,
    rollbackTo: rollbackTo,
    deletePrompt: deletePrompt,
    restorePrompt: restorePrompt,
    exposeGlobals: exposeGlobals
  };
})();
