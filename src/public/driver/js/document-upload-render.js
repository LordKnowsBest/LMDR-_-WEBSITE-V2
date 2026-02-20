/* =========================================
   DRIVER DOCUMENT UPLOAD — Render Module
   Depends on: DocUploadConfig
   DOM rendering functions
   ========================================= */
var DocUploadRender = (function () {
  'use strict';

  function getStatusConfig(status) {
    return DocUploadConfig.STATUS_CONFIGS[status] || DocUploadConfig.STATUS_CONFIGS.requested;
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    var date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  function renderDocumentCard(doc) {
    var statusConfig = getStatusConfig(doc.status);
    var isActionable = doc.status === 'requested' || doc.status === 'rejected';

    return '<div class="doc-card bg-white rounded-2xl shadow-lg p-6 border border-slate-200 ' +
      (doc.status === 'rejected' ? 'border-l-4 border-l-red-500' : '') + '">' +
      '<div class="flex items-start justify-between gap-4">' +
        '<div class="flex items-start gap-4 flex-1 min-w-0">' +
          '<div class="w-12 h-12 rounded-xl ' + statusConfig.iconBg + ' flex items-center justify-center flex-shrink-0">' +
            '<i class="' + statusConfig.icon + ' text-xl ' + statusConfig.iconColor + '"></i>' +
          '</div>' +
          '<div class="min-w-0 flex-1">' +
            '<div class="flex items-center gap-2 flex-wrap">' +
              '<h3 class="font-bold text-lg text-lmdr-dark">' + doc.displayName + '</h3>' +
              (doc.isRequired
                ? '<span class="text-xs text-red-500 font-medium">Required</span>'
                : '<span class="text-xs text-slate-400">Optional</span>') +
            '</div>' +
            '<p class="text-sm text-slate-500 mt-1">' + (doc.description || '') + '</p>' +
            (doc.status === 'rejected' && doc.rejectionReason
              ? '<div class="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">' +
                  '<p class="text-sm text-red-700">' +
                    '<i class="fas fa-exclamation-triangle mr-1"></i>' +
                    '<strong>Rejected:</strong> ' + doc.rejectionReason +
                  '</p>' +
                '</div>'
              : '') +
            (doc.submittedDate
              ? '<p class="text-xs text-slate-400 mt-2">' +
                  '<i class="fas fa-clock mr-1"></i> Submitted ' + formatDate(doc.submittedDate) +
                '</p>'
              : '') +
          '</div>' +
        '</div>' +
        '<div class="flex flex-col items-end gap-3">' +
          '<span class="px-3 py-1 rounded-full text-xs font-bold ' + statusConfig.pillClass + '">' +
            statusConfig.label +
          '</span>' +
          (isActionable
            ? '<button onclick="DocUploadLogic.openUploadModal(\'' + doc.documentType + '\', \'' + doc.displayName + '\', \'' + (doc.description || '') + '\')" ' +
                'class="px-4 py-2 rounded-lg bg-lmdr-blue text-white text-sm font-semibold hover:bg-blue-700 transition">' +
                '<i class="fas fa-upload mr-1"></i> ' + (doc.status === 'rejected' ? 'Re-upload' : 'Upload') +
              '</button>'
            : '') +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderDocuments(documents) {
    var container = document.getElementById('documentList');

    if (documents.length === 0) {
      container.innerHTML = '<div class="text-center py-12 text-slate-400">' +
        '<i class="fas fa-inbox text-3xl mb-4"></i>' +
        '<p>No documents required at this time.</p>' +
      '</div>';
      return;
    }

    container.innerHTML = documents.map(function (doc) { return renderDocumentCard(doc); }).join('');

    if (typeof gsap !== 'undefined') {
      gsap.fromTo('.doc-card',
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.1, ease: 'power2.out' }
      );
    }
  }

  function updateProgress(documents) {
    var required = documents.filter(function (d) { return d.isRequired; });
    var verified = required.filter(function (d) { return d.status === 'verified'; });
    var percent = required.length > 0 ? Math.round((verified.length / required.length) * 100) : 0;

    document.getElementById('progressText').textContent = verified.length + ' of ' + required.length + ' Complete';

    if (typeof gsap !== 'undefined') {
      gsap.to(document.getElementById('progressFill'), { width: percent + '%', duration: 0.5, ease: 'power2.out' });
    } else {
      document.getElementById('progressFill').style.width = percent + '%';
    }
  }

  function updateWelcome(driverName, carrierName) {
    document.getElementById('welcomeText').textContent =
      'Welcome, ' + driverName + '! Upload your documents for ' + (carrierName || 'your carrier') + '.';
  }

  function updateRecruiterContact(recruiterName, recruiterEmail) {
    if (recruiterName && recruiterEmail) {
      document.getElementById('recruiterContact').innerHTML =
        '<i class="fas fa-headset"></i>' +
        '<span>Questions? Contact ' + recruiterName + ' at ' +
          '<a href="mailto:' + recruiterEmail + '" class="text-lmdr-blue hover:underline">' + recruiterEmail + '</a>' +
        '</span>';
    }
  }

  function showToast(message, type) {
    type = type || 'info';
    var toast = document.createElement('div');
    var bgClass = type === 'success' ? 'bg-green-600 text-white' :
                  type === 'error' ? 'bg-red-600 text-white' :
                  'bg-slate-800 text-white';
    toast.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-lg z-[100] animate-fade-in ' + bgClass;
    var iconClass = type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';
    toast.innerHTML = '<div class="flex items-center gap-2">' +
      '<i class="fas ' + iconClass + '"></i>' +
      '<span class="font-medium">' + message + '</span>' +
    '</div>';
    document.body.appendChild(toast);

    setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(function () { toast.remove(); }, 300);
    }, 3000);
  }

  function showHelpModal(type) {
    var content = DocUploadConfig.HELP_CONTENT[type];
    if (!content) return;

    document.getElementById('helpContent').innerHTML =
      '<h3 class="text-xl font-bold text-lmdr-dark mb-4">' +
        '<i class="fas fa-question-circle text-lmdr-blue mr-2"></i>' +
        content.title +
      '</h3>' +
      content.content;

    document.getElementById('helpModal').classList.remove('hidden');
    document.getElementById('helpModal').classList.add('flex');

    if (typeof gsap !== 'undefined') {
      var modalContent = document.getElementById('helpModal').querySelector('.relative');
      gsap.fromTo(modalContent,
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' }
      );
    }
  }

  function closeHelpModal() {
    document.getElementById('helpModal').classList.add('hidden');
    document.getElementById('helpModal').classList.remove('flex');
  }

  return {
    renderDocuments: renderDocuments,
    updateProgress: updateProgress,
    updateWelcome: updateWelcome,
    updateRecruiterContact: updateRecruiterContact,
    showToast: showToast,
    showHelpModal: showHelpModal,
    closeHelpModal: closeHelpModal,
    formatFileSize: formatFileSize
  };
})();
