/* =========================================
   DRIVER DOCUMENT UPLOAD — Logic Module
   Depends on: DocUploadConfig, DocUploadBridge, DocUploadRender
   Business logic, state, events
   ========================================= */
var DocUploadLogic = (function () {
  'use strict';

  // ── State ──
  var state = {
    documents: [],
    currentDocumentType: null,
    selectedFile: null,
    workflowId: null,
    uploadToken: null,
    driverName: '',
    recruiterName: '',
    recruiterEmail: '',
    carrierName: ''
  };

  // ── Message Handlers ──
  function handleInit(data) {
    state.workflowId = data.workflowId;
    state.uploadToken = data.uploadToken;
    state.driverName = data.driverName || 'Driver';
    state.recruiterName = data.recruiterName || '';
    state.recruiterEmail = data.recruiterEmail || '';
    state.carrierName = data.carrierName || '';

    DocUploadRender.updateWelcome(state.driverName, state.carrierName);
    DocUploadRender.updateRecruiterContact(state.recruiterName, state.recruiterEmail);

    DocUploadBridge.requestDocumentList(state.workflowId);
  }

  function handleDocumentList(data) {
    state.documents = data.documents || [];
    DocUploadRender.renderDocuments(state.documents);
    DocUploadRender.updateProgress(state.documents);
  }

  function handleUploadResult(data) {
    var documentType = data.documentType;
    var success = data.success;
    var error = data.error;
    var documentId = data.documentId;

    document.getElementById('uploadProgress').classList.add('hidden');

    if (success) {
      var doc = state.documents.find(function (d) { return d.documentType === documentType; });
      if (doc) {
        doc.status = 'uploaded';
        doc.documentId = documentId;
      }
      DocUploadRender.renderDocuments(state.documents);
      DocUploadRender.updateProgress(state.documents);
      closeUploadModal();
      DocUploadRender.showToast('Document uploaded successfully!', 'success');
    } else {
      DocUploadRender.showToast(error || 'Upload failed. Please try again.', 'error');
      document.getElementById('uploadBtn').disabled = false;
    }
  }

  function handleVerificationUpdate(data) {
    var doc = state.documents.find(function (d) { return d.documentType === data.documentType; });
    if (doc) {
      doc.status = data.status;
      doc.rejectionReason = data.rejectionReason;
      DocUploadRender.renderDocuments(state.documents);
      DocUploadRender.updateProgress(state.documents);
    }
  }

  // ── Upload Modal ──
  function openUploadModal(documentType, displayName, description) {
    state.currentDocumentType = documentType;
    state.selectedFile = null;

    document.getElementById('modalTitle').textContent = 'Upload ' + displayName;
    document.getElementById('modalDescription').textContent = description || 'Select or drag a file to upload.';

    document.getElementById('dropZone').classList.remove('hidden');
    document.getElementById('filePreviewContainer').classList.add('hidden');
    document.getElementById('uploadProgress').classList.add('hidden');
    document.getElementById('uploadBtn').disabled = true;
    document.getElementById('fileInput').value = '';

    document.getElementById('uploadModal').classList.remove('hidden');
    document.getElementById('uploadModal').classList.add('flex');

    if (typeof gsap !== 'undefined') {
      var modalContent = document.getElementById('uploadModal').querySelector('.relative');
      gsap.fromTo(modalContent,
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' }
      );
    }
  }

  function closeUploadModal() {
    document.getElementById('uploadModal').classList.add('hidden');
    document.getElementById('uploadModal').classList.remove('flex');
    state.currentDocumentType = null;
    state.selectedFile = null;
  }

  // ── File Handling ──
  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('dropZone').classList.add('dragover');
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('dropZone').classList.remove('dragover');
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    document.getElementById('dropZone').classList.remove('dragover');
    var files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }

  function handleFileSelect(e) {
    var files = e.target.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  }

  function processFile(file) {
    if (!DocUploadConfig.VALID_FILE_TYPES.includes(file.type)) {
      DocUploadRender.showToast('Invalid file type. Please upload PDF, JPG, or PNG.', 'error');
      return;
    }
    if (file.size > DocUploadConfig.MAX_FILE_SIZE) {
      DocUploadRender.showToast('File too large. Maximum size is 10MB.', 'error');
      return;
    }

    state.selectedFile = file;

    document.getElementById('dropZone').classList.add('hidden');
    document.getElementById('filePreviewContainer').classList.remove('hidden');
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileSize').textContent = DocUploadRender.formatFileSize(file.size);

    var previewEl = document.getElementById('filePreview');
    if (file.type.startsWith('image/')) {
      var reader = new FileReader();
      reader.onload = function (e) {
        previewEl.innerHTML = '<img src="' + e.target.result + '" alt="Preview">';
      };
      reader.readAsDataURL(file);
    } else {
      previewEl.innerHTML = '<i class="fas fa-file-pdf pdf-icon"></i>';
    }

    document.getElementById('uploadBtn').disabled = false;
  }

  function clearFileSelection() {
    state.selectedFile = null;
    document.getElementById('dropZone').classList.remove('hidden');
    document.getElementById('filePreviewContainer').classList.add('hidden');
    document.getElementById('uploadBtn').disabled = true;
    document.getElementById('fileInput').value = '';
  }

  function uploadFile() {
    if (!state.selectedFile || !state.currentDocumentType) return;

    var btn = document.getElementById('uploadBtn');
    btn.disabled = true;

    document.getElementById('filePreviewContainer').classList.add('hidden');
    document.getElementById('uploadProgress').classList.remove('hidden');

    var reader = new FileReader();
    reader.onload = function (e) {
      var base64Data = e.target.result.split(',')[1];

      DocUploadBridge.uploadDocument({
        workflowId: state.workflowId,
        documentType: state.currentDocumentType,
        token: state.uploadToken,
        fileName: state.selectedFile.name,
        fileType: state.selectedFile.type,
        fileSize: state.selectedFile.size,
        fileData: base64Data
      });

      simulateProgress();
    };
    reader.onerror = function () {
      DocUploadRender.showToast('Error reading file. Please try again.', 'error');
      btn.disabled = false;
      document.getElementById('uploadProgress').classList.add('hidden');
      document.getElementById('filePreviewContainer').classList.remove('hidden');
    };
    reader.readAsDataURL(state.selectedFile);
  }

  function simulateProgress() {
    var progress = 0;
    var interval = setInterval(function () {
      progress += Math.random() * 15;
      if (progress >= 90) {
        progress = 90;
        clearInterval(interval);
      }
      document.getElementById('uploadProgressFill').style.width = progress + '%';
      document.getElementById('uploadPercent').textContent = Math.round(progress) + '%';
    }, 200);
  }

  // ── Init ──
  function init() {
    // Set up bridge listeners
    DocUploadBridge.listen({
      initDocumentUpload: handleInit,
      documentList: handleDocumentList,
      uploadResult: handleUploadResult,
      verificationUpdate: handleVerificationUpdate
    });

    // Signal ready
    DocUploadBridge.signalReady();

    // Standalone mode for testing
    if (window.parent === window) {
      console.log('[DOCS] Running in standalone mode - loading test data');
      setTimeout(function () {
        handleInit({
          workflowId: 'test-workflow-123',
          uploadToken: 'test-token-abc',
          driverName: 'John Smith',
          recruiterName: 'Sarah Johnson',
          recruiterEmail: 'sarah@abctransport.com',
          carrierName: 'ABC Transport'
        });
        handleDocumentList({
          documents: [
            { documentType: 'cdl_front', displayName: 'CDL - Front', description: 'Clear photo of the front of your CDL', isRequired: true, status: 'verified', submittedDate: '2026-01-18' },
            { documentType: 'cdl_back', displayName: 'CDL - Back', description: 'Clear photo of the back of your CDL', isRequired: true, status: 'verified', submittedDate: '2026-01-18' },
            { documentType: 'mvr', displayName: 'Motor Vehicle Record (MVR)', description: 'Request from your state DMV (past 3 years)', isRequired: true, status: 'requested' },
            { documentType: 'medical_card', displayName: 'DOT Medical Card', description: 'Current, unexpired DOT medical certificate', isRequired: true, status: 'uploaded', submittedDate: '2026-01-20' },
            { documentType: 'psp', displayName: 'PSP Report', description: 'Pre-Employment Screening Program report from FMCSA', isRequired: true, status: 'rejected', submittedDate: '2026-01-19', rejectionReason: 'Document is expired. Please upload a current PSP report.' },
            { documentType: 'employment_history', displayName: 'Employment History', description: '10-year employment history (optional)', isRequired: false, status: 'requested' }
          ]
        });
      }, 500);
    }
  }

  // ── Expose globals for onclick handlers ──
  function exposeGlobals() {
    window.showHelpModal = DocUploadRender.showHelpModal;
    window.closeHelpModal = DocUploadRender.closeHelpModal;
    window.closeUploadModal = closeUploadModal;
    window.handleDrop = handleDrop;
    window.handleDragOver = handleDragOver;
    window.handleDragLeave = handleDragLeave;
    window.handleFileSelect = handleFileSelect;
    window.clearFileSelection = clearFileSelection;
    window.uploadFile = uploadFile;
  }

  exposeGlobals();

  return {
    init: init,
    openUploadModal: openUploadModal,
    closeUploadModal: closeUploadModal,
    handleDrop: handleDrop,
    handleDragOver: handleDragOver,
    handleDragLeave: handleDragLeave,
    handleFileSelect: handleFileSelect,
    clearFileSelection: clearFileSelection,
    uploadFile: uploadFile
  };
})();
