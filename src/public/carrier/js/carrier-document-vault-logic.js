var DocumentVaultLogic = (function () {
  'use strict';

  var documents = [];
  var allDocuments = [];
  var dataReceived = false;
  var DATA_TIMEOUT_MS = 5000;
  var dropZone, fileInput, fileNameDisplay;

  function sendToVelo(action, payload) {
    window.parent.postMessage({ type: action, action: action, data: payload || {} }, '*');
  }

  function renderGrid() {
    var grid = document.getElementById('documentGrid');
    grid.innerHTML = '';
    if (documents.length === 0) {
      grid.innerHTML = '<div class="col-span-full text-center py-10 text-slate-400">No documents found. Upload one to get started.</div>';
      return;
    }
    documents.forEach(function (doc) {
      var card = document.createElement('div');
      card.className = 'bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition group cursor-pointer relative';
      var icon = 'fa-file';
      if (doc.mime_type && doc.mime_type.includes('pdf')) icon = 'fa-file-pdf text-red-500';
      else if (doc.mime_type && doc.mime_type.includes('image')) icon = 'fa-file-image text-blue-500';
      var statusBadge = '';
      if (doc.is_expired) statusBadge = '<span class="absolute top-2 right-2 bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">EXPIRED</span>';
      else if (doc.days_until_expiry <= 30) statusBadge = '<span class="absolute top-2 right-2 bg-yellow-100 text-yellow-700 text-[10px] font-bold px-2 py-0.5 rounded-full">EXPIRING</span>';
      card.innerHTML = statusBadge + '<div class="flex items-center justify-center h-24 bg-slate-50 rounded-lg mb-3"><i class="fa-solid ' + icon + ' text-4xl"></i></div><h4 class="font-semibold text-sm text-slate-800 truncate" title="' + (doc.title || '') + '">' + (doc.title || doc.file_name) + '</h4><p class="text-xs text-slate-500">' + doc.document_type + ' &bull; v' + doc.version + '</p>' + (doc.expiration_date ? '<p class="text-xs text-slate-400 mt-1">Exp: ' + new Date(doc.expiration_date).toLocaleDateString() + '</p>' : '');
      grid.appendChild(card);
    });
  }

  function updateAlerts() {
    var expiring = documents.filter(function (d) { return !d.is_expired && d.days_until_expiry <= 30; });
    if (expiring.length > 0) {
      document.getElementById('expiringAlert').classList.remove('hidden');
      document.getElementById('expiringCount').textContent = expiring.length;
    } else {
      document.getElementById('expiringAlert').classList.add('hidden');
    }
  }

  function openUploadModal() { document.getElementById('uploadModal').classList.remove('hidden'); }
  function closeUploadModal() { document.getElementById('uploadModal').classList.add('hidden'); }

  function handleFileSelect(file) {
    if (!file) return;
    fileNameDisplay.textContent = file.name;
    fileNameDisplay.classList.remove('hidden');
  }

  function filterCategory(category, e) {
    if (e) e.preventDefault();
    document.querySelectorAll('aside nav a').forEach(function (a) {
      a.classList.remove('bg-blue-50', 'text-lmdr-blue');
      a.classList.add('text-slate-600');
    });
    if (e && e.currentTarget) {
      e.currentTarget.classList.add('bg-blue-50', 'text-lmdr-blue');
      e.currentTarget.classList.remove('text-slate-600');
    }
    var label = document.getElementById('currentViewLabel');
    if (category === 'all') {
      documents = allDocuments;
      if (label) label.textContent = 'All Documents';
    } else {
      documents = allDocuments.filter(function (d) { return d.document_category === category; });
      var names = { driver: 'Driver Files', vehicle: 'Vehicle Files', company: 'Company Files' };
      if (label) label.textContent = names[category] || category;
    }
    renderGrid();
  }

  function showEmptyState() {
    if (dataReceived) return;
    allDocuments = [];
    documents = [];
    document.getElementById('documentGrid').innerHTML = '<div class="col-span-full flex flex-col items-center justify-center py-20 text-slate-400"><i class="fa-solid fa-vault text-4xl mb-4 text-slate-300"></i><p class="font-medium text-slate-500">No documents available yet</p><p class="text-sm mt-1">Data will appear once your compliance profile is configured</p></div>';
  }

  function init() {
    dropZone = document.getElementById('dropZone');
    fileInput = document.getElementById('fileInput');
    fileNameDisplay = document.getElementById('fileName');

    window.addEventListener('message', function (event) {
      var msg = event.data;
      if (!msg || !msg.type) return;
      if (msg.type === 'setDocuments') {
        dataReceived = true;
        allDocuments = msg.data.documents || [];
        documents = allDocuments;
        renderGrid();
        updateAlerts();
      }
    });

    dropZone.addEventListener('click', function () { fileInput.click(); });
    dropZone.addEventListener('dragover', function (e) { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', function () { dropZone.classList.remove('dragover'); });
    dropZone.addEventListener('drop', function (e) { e.preventDefault(); dropZone.classList.remove('dragover'); handleFileSelect(e.dataTransfer.files[0]); });
    fileInput.addEventListener('change', function (e) { handleFileSelect(e.target.files[0]); });

    document.getElementById('uploadForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var formData = new FormData(e.target);
      var data = Object.fromEntries(formData.entries());
      var file = fileInput.files[0];
      if (file) { data.file_name = file.name; data.mime_type = file.type; data.file_size = file.size; data.title = file.name; }
      sendToVelo('uploadDocument', data);
      closeUploadModal();
    });

    sendToVelo('getDocuments');
    setTimeout(showEmptyState, DATA_TIMEOUT_MS);
    window.parent.postMessage({ type: 'vaultReady', action: 'vaultReady' }, '*');
  }

  function exposeGlobals() {
    window.openUploadModal = openUploadModal;
    window.closeUploadModal = closeUploadModal;
    window.filterCategory = filterCategory;
  }

  return { init: init, exposeGlobals: exposeGlobals };
})();
