/* =========================================
   ADMIN EMAIL TEMPLATES — Logic Module
   Depends on: EmailTemplatesConfig, EmailTemplatesRender, LMDRBridge
   State management, event handlers, message routing
   ========================================= */
var EmailTemplatesLogic = (function () {
  'use strict';

  var allTemplates = [];
  var editingTemplate = null;
  var quill = null;
  var previewSize = 'desktop';

  function init() {
    initQuill();
    setupMessageHandlers();
    refreshTemplates();
  }

  function initQuill() {
    quill = new Quill('#quillEditor', {
      theme: 'snow',
      placeholder: 'Write your email content here...',
      modules: {
        toolbar: EmailTemplatesConfig.QUILL_TOOLBAR
      }
    });

    quill.on('text-change', function () {
      EmailTemplatesRender.updatePreview(quill);
    });
  }

  function setupMessageHandlers() {
    LMDRBridge.on('actionSuccess', function (msg) {
      EmailTemplatesRender.showToast(msg, 'success');
      refreshTemplates();
    });
    LMDRBridge.on('actionError', function (msg) {
      EmailTemplatesRender.showToast(msg, 'error');
    });
    LMDRBridge.on('templatesLoaded', function (templates) {
      allTemplates = templates;
      EmailTemplatesRender.renderTemplates(templates);
    });
  }

  function refreshTemplates() {
    LMDRBridge.send('getAllTemplates');
  }

  function openCreateModal() {
    editingTemplate = null;
    document.getElementById('modalTitle').textContent = 'Create Email Template';
    document.getElementById('formKey').value = '';
    document.getElementById('formKey').disabled = false;
    document.getElementById('formName').value = '';
    document.getElementById('formCategory').value = 'transactional';
    document.getElementById('formActive').checked = false;
    document.getElementById('formSubject').value = '';
    document.getElementById('formPreheader').value = '';
    document.getElementById('versionInfo').textContent = 'New Template';
    quill.setContents([]);

    document.getElementById('editorModal').classList.remove('hidden');
    EmailTemplatesRender.updatePreview(quill);
  }

  function editTemplate(key) {
    var template = null;
    for (var i = 0; i < allTemplates.length; i++) {
      if (allTemplates[i].templateKey === key) { template = allTemplates[i]; break; }
    }
    if (!template) return;

    editingTemplate = template;
    document.getElementById('modalTitle').textContent = 'Edit Template';
    document.getElementById('formKey').value = template.templateKey;
    document.getElementById('formKey').disabled = true;
    document.getElementById('formName').value = template.name || '';
    document.getElementById('formCategory').value = template.category || 'transactional';
    document.getElementById('formActive').checked = !!template.isActive;
    document.getElementById('formSubject').value = template.subject || '';
    document.getElementById('formPreheader').value = template.preheader || '';
    document.getElementById('versionInfo').textContent = 'Version ' + (template.version || 1) + ' \u2022 Last updated ' + EmailTemplatesRender.formatDate(template.updatedAt);

    quill.root.innerHTML = template.htmlContent || '';

    document.getElementById('editorModal').classList.remove('hidden');
    EmailTemplatesRender.updatePreview(quill);
  }

  function previewTemplateInModal(key) {
    editTemplate(key);
  }

  function insertVariable(varName) {
    var selection = quill.getSelection();
    if (selection) {
      quill.insertText(selection.index, '{{' + varName + '}}');
    } else {
      quill.insertText(quill.getLength() - 1, '{{' + varName + '}}');
    }
  }

  function setPreviewSize(size) {
    previewSize = size;
    var container = document.getElementById('emailPreview');
    var desktopBtn = document.getElementById('prevDesktopBtn');
    var mobileBtn = document.getElementById('prevMobileBtn');

    if (size === 'desktop') {
      container.className = 'preview-desktop shadow-lg overflow-y-auto';
      desktopBtn.className = 'p-1.5 rounded-md bg-blue-600 text-white';
      mobileBtn.className = 'p-1.5 rounded-md text-slate-400 hover:text-white';
    } else {
      container.className = 'preview-mobile shadow-lg overflow-y-auto';
      desktopBtn.className = 'p-1.5 rounded-md text-slate-400 hover:text-white';
      mobileBtn.className = 'p-1.5 rounded-md bg-blue-600 text-white';
    }
  }

  function togglePreview() {
    var panel = document.getElementById('previewPanel');
    if (panel.classList.contains('hidden')) {
      panel.classList.remove('hidden');
      panel.classList.add('flex');
    } else {
      panel.classList.add('hidden');
      panel.classList.remove('flex');
    }
  }

  function confirmCloseModal() {
    if (confirm('Close editor? Unsaved changes will be lost.')) {
      document.getElementById('editorModal').classList.add('hidden');
    }
  }

  function saveTemplate() {
    var data = {
      templateKey: document.getElementById('formKey').value,
      name: document.getElementById('formName').value,
      category: document.getElementById('formCategory').value,
      isActive: document.getElementById('formActive').checked,
      subject: document.getElementById('formSubject').value,
      preheader: document.getElementById('formPreheader').value,
      htmlContent: quill.root.innerHTML
    };

    if (editingTemplate) {
      LMDRBridge.send('updateTemplate', { templateKey: data.templateKey, updates: data });
    } else {
      LMDRBridge.send('createTemplate', { templateData: data });
    }

    document.getElementById('editorModal').classList.add('hidden');
  }

  function sendTestEmail() {
    var email = document.getElementById('testEmailInput').value;
    if (!email) {
      alert('Please enter a test recipient email');
      return;
    }
    var key = document.getElementById('formKey').value;
    LMDRBridge.send('sendTestEmail', { templateKey: key, recipientEmail: email });
  }

  function filterTemplates() {
    var search = document.getElementById('templateSearch').value.toLowerCase();
    var category = document.getElementById('filterCategory').value;

    var filtered = [];
    for (var i = 0; i < allTemplates.length; i++) {
      var t = allTemplates[i];
      var matchesSearch = t.templateKey.toLowerCase().indexOf(search) !== -1 || t.name.toLowerCase().indexOf(search) !== -1;
      var matchesCategory = category === 'all' || t.category === category;
      if (matchesSearch && matchesCategory) filtered.push(t);
    }

    EmailTemplatesRender.renderTemplates(filtered);
  }

  function navigateBack() {
    LMDRBridge.navigateTo('admin-dashboard');
  }

  return {
    init: init,
    openCreateModal: openCreateModal,
    editTemplate: editTemplate,
    previewTemplateInModal: previewTemplateInModal,
    insertVariable: insertVariable,
    setPreviewSize: setPreviewSize,
    togglePreview: togglePreview,
    confirmCloseModal: confirmCloseModal,
    saveTemplate: saveTemplate,
    sendTestEmail: sendTestEmail,
    filterTemplates: filterTemplates,
    navigateBack: navigateBack
  };
})();
