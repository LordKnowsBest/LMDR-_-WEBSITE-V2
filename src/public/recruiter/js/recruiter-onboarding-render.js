/* =========================================
   RECRUITER ONBOARDING DASHBOARD — Render Module
   Depends on: OnboardingConfig
   DOM rendering and UI updates
   ========================================= */
var OnboardingRender = (function () {
  'use strict';

  var Config = OnboardingConfig;

  // ============================================
  // STATS
  // ============================================
  function updateStats(workflows) {
    var active = workflows.filter(function (w) {
      return ['cancelled', 'ready_to_start'].indexOf(w.status) === -1;
    });
    var pendingDocs = workflows.filter(function (w) {
      return w.documentsStatus === 'pending' || w.documentsStatus === 'partial';
    });
    var awaitingResults = workflows.filter(function (w) {
      return w.backgroundStatus === 'ordered' || w.backgroundStatus === 'processing' ||
        w.drugTestStatus === 'scheduled';
    });
    var ready = workflows.filter(function (w) { return w.status === 'ready_to_start'; });

    document.getElementById('statActive').textContent = active.length;
    document.getElementById('statPendingDocs').textContent = pendingDocs.length;
    document.getElementById('statAwaitingResults').textContent = awaitingResults.length;
    document.getElementById('statReady').textContent = ready.length;
  }

  // ============================================
  // WORKFLOW LIST
  // ============================================
  function renderWorkflows(filteredWorkflows) {
    var container = document.getElementById('workflowList');
    var emptyState = document.getElementById('emptyState');

    if (filteredWorkflows.length === 0) {
      container.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    container.innerHTML = filteredWorkflows.map(function (w) { return renderWorkflowCard(w); }).join('');
  }

  function renderWorkflowCard(workflow) {
    var statusLabel = Config.formatStatus(workflow.status);
    var progress = Config.calculateProgress(workflow);
    var daysInProcess = Config.calculateDays(workflow.createdDate);

    var html = '';
    html += '<div class="workflow-card bg-white rounded-xl border border-slate-200 overflow-hidden" id="workflow-' + workflow.id + '">';

    // Card Header
    html += '<div class="p-4 sm:p-6 cursor-pointer" onclick="OnboardingLogic.toggleWorkflow(\'' + workflow.id + '\')">';
    html += '<div class="flex items-start justify-between gap-4">';
    html += '<div class="flex items-center gap-4 min-w-0">';
    html += '<div class="w-12 h-12 rounded-xl bg-lmdr-dark flex items-center justify-center flex-shrink-0">';
    html += '<span class="text-lmdr-yellow font-bold text-lg">' + Config.getInitials(workflow.driverName) + '</span>';
    html += '</div>';
    html += '<div class="min-w-0">';
    html += '<h3 class="font-bold text-lg text-lmdr-dark truncate">' + workflow.driverName + '</h3>';
    html += '<p class="text-sm text-slate-500">' + workflow.carrierName + '</p>';
    html += '</div></div>';
    html += '<div class="flex items-center gap-3">';
    html += '<span class="px-3 py-1 rounded-full text-xs font-bold status-' + workflow.status + '">' + statusLabel + '</span>';
    html += '<i class="fas fa-chevron-down expand-icon text-slate-400"></i>';
    html += '</div></div>';

    // Summary Row
    html += '<div class="mt-4 flex flex-wrap items-center gap-4 text-sm">';
    html += '<div class="flex items-center gap-2"><span class="font-semibold text-slate-600">Docs:</span>';
    html += '<span class="px-2 py-0.5 rounded text-xs font-bold substatus-' + workflow.documentsStatus + '">';
    html += Config.formatSubstatus(workflow.documentsStatus) + ' ' + (workflow.documentsProgress || '') + '</span></div>';
    html += '<div class="flex items-center gap-2"><span class="font-semibold text-slate-600">BG:</span>';
    html += '<span class="px-2 py-0.5 rounded text-xs font-bold substatus-' + workflow.backgroundStatus + '">';
    html += Config.formatSubstatus(workflow.backgroundStatus) + '</span></div>';
    html += '<div class="flex items-center gap-2"><span class="font-semibold text-slate-600">Drug:</span>';
    html += '<span class="px-2 py-0.5 rounded text-xs font-bold substatus-' + workflow.drugTestStatus + '">';
    html += Config.formatSubstatus(workflow.drugTestStatus) + '</span></div>';
    html += '<div class="ml-auto flex items-center gap-2 text-slate-400">';
    html += '<i class="fas fa-clock"></i><span>Day ' + daysInProcess + '</span></div>';
    html += '</div></div>';

    // Expandable Details
    html += '<div class="workflow-details border-t border-slate-100">';
    html += '<div class="p-4 sm:p-6 bg-slate-50 space-y-6">';

    // Progress Bar
    html += '<div><div class="flex items-center justify-between mb-2">';
    html += '<span class="text-sm font-semibold text-slate-600">Overall Progress</span>';
    html += '<span class="text-sm font-bold text-lmdr-blue">' + progress + '%</span></div>';
    html += '<div class="h-2 bg-slate-200 rounded-full overflow-hidden">';
    html += '<div class="h-full bg-gradient-to-r from-lmdr-blue to-blue-400 rounded-full transition-all" style="width: ' + progress + '%"></div>';
    html += '</div></div>';

    // Documents Section
    html += renderDocumentsSection(workflow);

    // Background Check Section
    if (workflow.backgroundCheck) {
      html += renderBackgroundSection(workflow.backgroundCheck);
    }

    // Drug Test Section
    if (workflow.drugTest) {
      html += renderDrugTestSection(workflow.drugTest);
    }

    // Compliance Issues
    if (workflow.complianceIssues && workflow.complianceIssues.length > 0) {
      html += renderComplianceIssues(workflow.complianceIssues);
    }

    // Actions
    html += renderWorkflowActions(workflow);

    html += '</div></div></div>';
    return html;
  }

  function renderDocumentsSection(workflow) {
    var html = '<div class="bg-white rounded-lg border border-slate-200 p-4">';
    html += '<div class="flex items-center justify-between mb-4">';
    html += '<h4 class="font-bold text-slate-700"><i class="fas fa-file-alt mr-2 text-lmdr-blue"></i> Documents</h4>';
    html += '<button onclick="event.stopPropagation(); OnboardingLogic.showReminderModal(\'' + workflow.id + '\')" ';
    html += 'class="text-xs text-lmdr-blue hover:underline font-medium">';
    html += '<i class="fas fa-bell mr-1"></i> Send Reminder</button></div>';
    html += '<div class="space-y-2">';
    (workflow.documents || []).forEach(function (doc) {
      html += renderDocumentRow(workflow.id, doc);
    });
    html += '</div></div>';
    return html;
  }

  function renderDocumentRow(workflowId, doc) {
    var statusConfig = Config.getDocStatusConfig(doc.status);
    var showActions = doc.status === 'submitted';

    var html = '<div class="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50';
    if (doc.status === 'rejected') html += ' border-l-4 border-l-red-400';
    html += '">';
    html += '<div class="flex items-center gap-3">';
    html += '<i class="' + statusConfig.icon + ' ' + statusConfig.iconColor + '"></i>';
    html += '<div><p class="font-medium text-sm text-slate-700">' + doc.displayName + '</p>';
    if (doc.status === 'rejected' && doc.rejectionReason) {
      html += '<p class="text-xs text-red-500">' + doc.rejectionReason + '</p>';
    }
    html += '</div></div>';
    html += '<div class="flex items-center gap-2">';
    html += '<span class="px-2 py-0.5 rounded text-xs font-bold substatus-' + doc.status + '">';
    html += Config.formatSubstatus(doc.status) + '</span>';
    if (showActions) {
      html += '<button onclick="event.stopPropagation(); OnboardingLogic.openDocModal(\'' + workflowId + '\', \'' + doc.id + '\')" ';
      html += 'class="px-3 py-1 rounded bg-lmdr-blue text-white text-xs font-bold hover:bg-blue-700 transition">Review</button>';
    }
    html += '</div></div>';
    return html;
  }

  function renderBackgroundSection(bg) {
    var html = '<div class="bg-white rounded-lg border border-slate-200 p-4">';
    html += '<h4 class="font-bold text-slate-700 mb-3"><i class="fas fa-shield-alt mr-2 text-purple-600"></i> Background Check</h4>';
    html += '<div class="grid sm:grid-cols-2 gap-4 text-sm">';
    html += '<div><span class="text-slate-500">Provider:</span>';
    html += '<span class="font-medium ml-2">' + (bg.provider || 'N/A') + '</span></div>';
    html += '<div><span class="text-slate-500">Status:</span>';
    html += '<span class="ml-2 px-2 py-0.5 rounded text-xs font-bold substatus-' + bg.status + '">';
    html += Config.formatSubstatus(bg.status) + '</span></div>';
    if (bg.orderedDate) {
      html += '<div><span class="text-slate-500">Ordered:</span>';
      html += '<span class="font-medium ml-2">' + Config.formatDate(bg.orderedDate) + '</span></div>';
    }
    if (bg.estimatedCompletion) {
      html += '<div><span class="text-slate-500">ETA:</span>';
      html += '<span class="font-medium ml-2">' + Config.formatDate(bg.estimatedCompletion) + '</span></div>';
    }
    html += '</div></div>';
    return html;
  }

  function renderDrugTestSection(dt) {
    var html = '<div class="bg-white rounded-lg border border-slate-200 p-4">';
    html += '<h4 class="font-bold text-slate-700 mb-3"><i class="fas fa-vial mr-2 text-green-600"></i> Drug Test</h4>';
    html += '<div class="grid sm:grid-cols-2 gap-4 text-sm">';
    html += '<div><span class="text-slate-500">Status:</span>';
    html += '<span class="ml-2 px-2 py-0.5 rounded text-xs font-bold substatus-' + dt.status + '">';
    html += Config.formatSubstatus(dt.status) + '</span></div>';
    if (dt.appointmentDate) {
      html += '<div><span class="text-slate-500">Appointment:</span>';
      html += '<span class="font-medium ml-2">' + Config.formatDate(dt.appointmentDate) + '</span></div>';
    }
    if (dt.collectionSite) {
      html += '<div class="sm:col-span-2"><span class="text-slate-500">Location:</span>';
      html += '<span class="font-medium ml-2">' + (dt.collectionSite.name || 'N/A') + '</span></div>';
    }
    html += '</div></div>';
    return html;
  }

  function renderComplianceIssues(issues) {
    var html = '<div class="bg-red-50 rounded-lg border border-red-200 p-4">';
    html += '<h4 class="font-bold text-red-700 mb-3"><i class="fas fa-exclamation-triangle mr-2"></i> Compliance Issues</h4>';
    html += '<ul class="space-y-2 text-sm text-red-700">';
    issues.forEach(function (issue) {
      html += '<li class="flex items-center gap-2"><i class="fas fa-times-circle"></i><span>' + issue + '</span></li>';
    });
    html += '</ul></div>';
    return html;
  }

  function renderWorkflowActions(workflow) {
    var html = '<div class="flex flex-wrap gap-3 pt-2">';
    html += '<button onclick="event.stopPropagation(); OnboardingLogic.contactDriver(\'' + workflow.id + '\')" ';
    html += 'class="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-100 transition">';
    html += '<i class="fas fa-comment-alt mr-2"></i> Contact Driver</button>';

    if (workflow.status !== 'on_hold') {
      html += '<button onclick="event.stopPropagation(); OnboardingLogic.putOnHold(\'' + workflow.id + '\')" ';
      html += 'class="px-4 py-2 rounded-lg border border-amber-200 text-amber-600 text-sm font-medium hover:bg-amber-50 transition">';
      html += '<i class="fas fa-pause mr-2"></i> Put On Hold</button>';
    } else {
      html += '<button onclick="event.stopPropagation(); OnboardingLogic.resumeWorkflow(\'' + workflow.id + '\')" ';
      html += 'class="px-4 py-2 rounded-lg border border-green-200 text-green-600 text-sm font-medium hover:bg-green-50 transition">';
      html += '<i class="fas fa-play mr-2"></i> Resume</button>';
    }

    html += '<button onclick="event.stopPropagation(); OnboardingLogic.cancelWorkflow(\'' + workflow.id + '\')" ';
    html += 'class="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition">';
    html += '<i class="fas fa-times mr-2"></i> Cancel</button>';

    if (workflow.status === 'ready_to_start') {
      html += '<button onclick="event.stopPropagation(); OnboardingLogic.markStarted(\'' + workflow.id + '\')" ';
      html += 'class="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition ml-auto">';
      html += '<i class="fas fa-check mr-2"></i> Mark Started</button>';
    }

    html += '</div>';
    return html;
  }

  // ============================================
  // DOCUMENT MODAL
  // ============================================
  function showDocumentInModal(data) {
    var displayName = data.displayName;
    var fileUrl = data.fileUrl;
    var fileName = data.fileName;
    var submittedDate = data.submittedDate;
    var ocrData = data.ocrData;

    document.getElementById('docModalTitle').textContent = displayName;
    document.getElementById('docFileName').textContent = fileName || 'document.pdf';
    document.getElementById('docSubmittedDate').textContent = 'Submitted ' + Config.formatDate(submittedDate);
    document.getElementById('docDownloadLink').href = fileUrl || '#';

    // Preview
    var previewContainer = document.getElementById('docPreviewContainer');
    if (fileUrl && (fileUrl.indexOf('.jpg') !== -1 || fileUrl.indexOf('.jpeg') !== -1 || fileUrl.indexOf('.png') !== -1)) {
      previewContainer.innerHTML = '<img src="' + fileUrl + '" alt="Document" class="max-w-full max-h-full object-contain">';
    } else {
      previewContainer.innerHTML = '<i class="fas fa-file-pdf text-6xl text-red-400"></i>';
    }

    // OCR Data
    if (ocrData && Object.keys(ocrData).length > 0) {
      document.getElementById('ocrDataSection').classList.remove('hidden');
      var ocrHtml = '';
      var keys = Object.keys(ocrData);
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        ocrHtml += '<div><span class="text-xs text-slate-500">' + Config.formatOcrKey(key) + '</span>';
        ocrHtml += '<p class="font-semibold text-sm text-slate-700">' + ocrData[key] + '</p></div>';
      }
      document.getElementById('ocrDataGrid').innerHTML = ocrHtml;
    }
  }

  // ============================================
  // CARRIER FILTER POPULATION
  // ============================================
  function populateCarrierFilter(carriers) {
    var carrierSelect = document.getElementById('filterCarrier');
    carrierSelect.innerHTML = '<option value="">All Carriers</option>';
    carriers.forEach(function (c) {
      carrierSelect.innerHTML += '<option value="' + c.id + '">' + c.name + '</option>';
    });
  }

  // ============================================
  // LOADING STATE
  // ============================================
  function showLoading() {
    document.getElementById('workflowList').innerHTML =
      '<div class="text-center py-12 text-slate-400">' +
      '<i class="fas fa-spinner animate-spin text-3xl mb-4"></i>' +
      '<p>Refreshing...</p></div>';
  }

  // ============================================
  // TOAST
  // ============================================
  function showToast(message, type) {
    if (!type) type = 'info';
    var bgClass = type === 'success' ? 'bg-green-600 text-white' :
      type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-800 text-white';
    var iconClass = type === 'success' ? 'fa-check-circle' :
      type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle';

    var toast = document.createElement('div');
    toast.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-xl shadow-lg z-[100] animate-fade-in ' + bgClass;
    toast.innerHTML = '<div class="flex items-center gap-2">' +
      '<i class="fas ' + iconClass + '"></i>' +
      '<span class="font-medium">' + message + '</span></div>';
    document.body.appendChild(toast);

    setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(function () { toast.remove(); }, 300);
    }, 3000);
  }

  return {
    updateStats: updateStats,
    renderWorkflows: renderWorkflows,
    showDocumentInModal: showDocumentInModal,
    populateCarrierFilter: populateCarrierFilter,
    showLoading: showLoading,
    showToast: showToast
  };
})();
