/**
 * dos-view-documents.js
 * DriverOS Document Management view.
 * CDL, medical card, MVR uploads with status tracking.
 */
(function () {
  'use strict';
  window.DOS = window.DOS || {};
  DOS.viewModules = DOS.viewModules || {};

  var DOC_TYPES = [
    { key: 'cdl', label: 'CDL License', icon: 'badge' },
    { key: 'medical_card', label: 'Medical Card (DOT)', icon: 'health_and_safety' },
    { key: 'mvr', label: 'Motor Vehicle Record', icon: 'description' },
    { key: 'drug_test', label: 'Drug Test Results', icon: 'science' },
    { key: 'employment_history', label: 'Employment History', icon: 'work_history' },
    { key: 'training_cert', label: 'Training Certificate', icon: 'school' },
    { key: 'twic', label: 'TWIC Card', icon: 'credit_card' },
    { key: 'hazmat', label: 'Hazmat Endorsement', icon: 'warning' }
  ];

  var STATUS_MAP = {
    verified: { label: 'Verified', chipClass: 'dos-chip-green', icon: 'check_circle' },
    pending: { label: 'Pending Review', chipClass: 'dos-chip-amber', icon: 'hourglass_top' },
    expired: { label: 'Expired', chipClass: 'dos-chip-red', icon: 'error' },
    rejected: { label: 'Rejected', chipClass: 'dos-chip-red', icon: 'cancel' },
    missing: { label: 'Not Uploaded', chipClass: 'dos-chip-gray', icon: 'upload_file' }
  };

  var state = { documents: [], loading: true, uploading: false };

  function iconEl(name) {
    var s = document.createElement('span');
    s.className = 'material-symbols-outlined';
    s.textContent = name;
    return s;
  }

  function skeleton() {
    var wrap = document.createElement('div');
    for (var i = 0; i < 5; i++) {
      var sk = document.createElement('div');
      sk.className = 'dos-card';
      sk.style.height = '72px';
      sk.style.marginBottom = '12px';
      sk.style.background = 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)';
      sk.style.backgroundSize = '200% 100%';
      sk.style.animation = 'dosShimmer 1.5s infinite';
      wrap.appendChild(sk);
    }
    return wrap;
  }

  function getDocStatus(docType, docs) {
    for (var i = 0; i < docs.length; i++) {
      var d = docs[i];
      var dType = d.documentType || d.document_type || d.type;
      if (dType === docType) {
        return d.status || 'pending';
      }
    }
    return 'missing';
  }

  function getDocData(docType, docs) {
    for (var i = 0; i < docs.length; i++) {
      var d = docs[i];
      var dType = d.documentType || d.document_type || d.type;
      if (dType === docType) return d;
    }
    return null;
  }

  function buildSummaryCard(docs) {
    var card = document.createElement('div');
    card.className = 'dos-card';
    card.style.marginBottom = '16px';

    var title = document.createElement('h3');
    title.className = 'dos-text-subheading';
    title.textContent = 'Document Status';
    title.style.marginBottom = '10px';
    card.appendChild(title);

    var verified = 0;
    var pending = 0;
    var missing = 0;
    var expired = 0;

    DOC_TYPES.forEach(function (dt) {
      var s = getDocStatus(dt.key, docs);
      if (s === 'verified') verified++;
      else if (s === 'pending') pending++;
      else if (s === 'expired') expired++;
      else missing++;
    });

    // Progress bar
    var total = DOC_TYPES.length;
    var pct = Math.round((verified / total) * 100);
    var barBg = document.createElement('div');
    barBg.style.height = '8px';
    barBg.style.borderRadius = '4px';
    barBg.style.background = '#f1f5f9';
    barBg.style.overflow = 'hidden';
    barBg.style.marginBottom = '12px';

    var barFill = document.createElement('div');
    barFill.style.height = '100%';
    barFill.style.borderRadius = '4px';
    barFill.style.width = pct + '%';
    barFill.style.background = pct === 100 ? '#22c55e' : '#2563eb';
    barFill.style.transition = 'width 0.5s ease';
    barBg.appendChild(barFill);
    card.appendChild(barBg);

    // Stats row
    var statsRow = document.createElement('div');
    statsRow.style.display = 'flex';
    statsRow.style.justifyContent = 'space-between';

    var pairs = [
      { label: 'Verified', val: verified, color: '#22c55e' },
      { label: 'Pending', val: pending, color: '#f59e0b' },
      { label: 'Missing', val: missing, color: '#94a3b8' },
      { label: 'Expired', val: expired, color: '#ef4444' }
    ];

    pairs.forEach(function (p) {
      var item = document.createElement('div');
      item.style.textAlign = 'center';
      var num = document.createElement('p');
      num.style.fontSize = '18px';
      num.style.fontWeight = '800';
      num.style.color = p.color;
      num.textContent = String(p.val);
      item.appendChild(num);
      var lab = document.createElement('p');
      lab.className = 'dos-text-small';
      lab.textContent = p.label;
      item.appendChild(lab);
      statsRow.appendChild(item);
    });
    card.appendChild(statsRow);

    return card;
  }

  function buildDocRow(docTypeDef, docs, self) {
    var docStatus = getDocStatus(docTypeDef.key, docs);
    var docData = getDocData(docTypeDef.key, docs);
    var statusInfo = STATUS_MAP[docStatus] || STATUS_MAP.missing;

    var card = document.createElement('div');
    card.className = 'dos-card-interactive';
    card.style.marginBottom = '10px';
    card.style.display = 'flex';
    card.style.alignItems = 'center';
    card.style.gap = '12px';

    // Icon
    var iconWrap = document.createElement('div');
    iconWrap.style.width = '44px';
    iconWrap.style.height = '44px';
    iconWrap.style.borderRadius = '10px';
    iconWrap.style.display = 'flex';
    iconWrap.style.alignItems = 'center';
    iconWrap.style.justifyContent = 'center';
    iconWrap.style.flexShrink = '0';
    iconWrap.style.background = docStatus === 'verified' ? '#dcfce7' : docStatus === 'expired' ? '#fee2e2' : docStatus === 'pending' ? '#fef3c7' : '#f1f5f9';
    var ic = iconEl(docTypeDef.icon);
    ic.style.fontSize = '22px';
    ic.style.color = docStatus === 'verified' ? '#166534' : docStatus === 'expired' ? '#991b1b' : docStatus === 'pending' ? '#92400e' : '#64748b';
    iconWrap.appendChild(ic);
    card.appendChild(iconWrap);

    // Text
    var textWrap = document.createElement('div');
    textWrap.style.flex = '1';
    textWrap.style.minWidth = '0';

    var nameEl = document.createElement('p');
    nameEl.className = 'dos-text-body';
    nameEl.style.fontWeight = '600';
    nameEl.textContent = docTypeDef.label;
    textWrap.appendChild(nameEl);

    var statusRow = document.createElement('div');
    statusRow.style.display = 'flex';
    statusRow.style.alignItems = 'center';
    statusRow.style.gap = '4px';
    statusRow.style.marginTop = '2px';

    var statusIcon = iconEl(statusInfo.icon);
    statusIcon.style.fontSize = '14px';
    statusIcon.style.color = docStatus === 'verified' ? '#22c55e' : docStatus === 'expired' || docStatus === 'rejected' ? '#ef4444' : docStatus === 'pending' ? '#f59e0b' : '#94a3b8';
    statusRow.appendChild(statusIcon);

    var statusLabel = document.createElement('span');
    statusLabel.className = 'dos-text-small';
    statusLabel.textContent = statusInfo.label;
    statusRow.appendChild(statusLabel);

    if (docData && docData.expirationDate) {
      var expDate = new Date(docData.expirationDate);
      var now = new Date();
      var daysLeft = Math.ceil((expDate - now) / 86400000);
      if (daysLeft > 0 && daysLeft <= 30) {
        var expWarn = document.createElement('span');
        expWarn.className = 'dos-text-small';
        expWarn.style.color = '#f59e0b';
        expWarn.textContent = ' - Expires in ' + daysLeft + 'd';
        statusRow.appendChild(expWarn);
      }
    }

    textWrap.appendChild(statusRow);
    card.appendChild(textWrap);

    // Upload / Action button
    var actionBtn = document.createElement('button');
    actionBtn.className = 'dos-touch-target';
    actionBtn.style.background = 'none';
    actionBtn.style.border = 'none';
    actionBtn.style.cursor = 'pointer';
    actionBtn.style.padding = '8px';

    if (docStatus === 'missing' || docStatus === 'expired' || docStatus === 'rejected') {
      var uploadIcon = iconEl('upload');
      uploadIcon.style.fontSize = '24px';
      uploadIcon.style.color = '#2563eb';
      actionBtn.appendChild(uploadIcon);
      actionBtn.setAttribute('aria-label', 'Upload ' + docTypeDef.label);
      var uploadHandler = function () { self._triggerUpload(docTypeDef.key); };
      actionBtn.addEventListener('click', uploadHandler);
      self._listeners.push({ el: actionBtn, type: 'click', fn: uploadHandler });
    } else {
      var chevron = iconEl('chevron_right');
      chevron.style.fontSize = '24px';
      chevron.style.color = '#94a3b8';
      actionBtn.appendChild(chevron);
    }
    card.appendChild(actionBtn);

    return card;
  }

  DOS.viewModules['documents'] = {
    _listeners: [],
    _content: null,
    _fileInput: null,
    _uploadDocType: null,

    mount: function (root) {
      var self = this;
      while (root.firstChild) root.removeChild(root.firstChild);

      var container = document.createElement('div');
      container.className = 'dos-container';
      container.style.paddingTop = '16px';
      container.style.paddingBottom = '100px';

      // Header
      var header = document.createElement('div');
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';
      header.style.marginBottom = '16px';

      var heading = document.createElement('h1');
      heading.className = 'dos-text-heading';
      heading.textContent = 'Documents';
      header.appendChild(heading);

      var uploadAllBtn = document.createElement('button');
      uploadAllBtn.className = 'dos-btn-secondary dos-touch-target';
      uploadAllBtn.style.padding = '8px 16px';
      uploadAllBtn.style.fontSize = '14px';
      var upIcon = iconEl('add');
      upIcon.style.fontSize = '18px';
      upIcon.style.verticalAlign = 'middle';
      uploadAllBtn.appendChild(upIcon);
      var upText = document.createTextNode(' Upload');
      uploadAllBtn.appendChild(upText);
      var uploadAllHandler = function () { self._triggerUpload(null); };
      uploadAllBtn.addEventListener('click', uploadAllHandler);
      self._listeners.push({ el: uploadAllBtn, type: 'click', fn: uploadAllHandler });
      header.appendChild(uploadAllBtn);

      container.appendChild(header);

      // Hidden file input
      var fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.pdf,.jpg,.jpeg,.png';
      fileInput.style.display = 'none';
      var fileHandler = function (e) { self._handleFileSelect(e); };
      fileInput.addEventListener('change', fileHandler);
      self._listeners.push({ el: fileInput, type: 'change', fn: fileHandler });
      container.appendChild(fileInput);
      self._fileInput = fileInput;

      // Content
      self._content = document.createElement('div');
      container.appendChild(self._content);
      root.appendChild(container);

      // Load documents
      state.loading = true;
      self._content.appendChild(skeleton());
      DOS.bridge.send('requestDocumentList', {});
    },

    unmount: function () {
      this._listeners.forEach(function (l) { l.el.removeEventListener(l.type, l.fn); });
      this._listeners = [];
      this._content = null;
      this._fileInput = null;
    },

    _triggerUpload: function (docType) {
      this._uploadDocType = docType;
      if (this._fileInput) this._fileInput.click();
    },

    _handleFileSelect: function (event) {
      var self = this;
      var file = event.target.files && event.target.files[0];
      if (!file) return;

      state.uploading = true;

      // Show uploading indicator
      if (this._content) {
        var uploadingBanner = document.createElement('div');
        uploadingBanner.className = 'dos-card';
        uploadingBanner.id = 'upload-banner';
        uploadingBanner.style.borderLeft = '4px solid #2563eb';
        uploadingBanner.style.marginBottom = '12px';

        var bannerRow = document.createElement('div');
        bannerRow.style.display = 'flex';
        bannerRow.style.alignItems = 'center';
        bannerRow.style.gap = '10px';
        var spinner = iconEl('sync');
        spinner.style.fontSize = '20px';
        spinner.style.color = '#2563eb';
        spinner.style.animation = 'spin 1s linear infinite';
        bannerRow.appendChild(spinner);
        var bannerText = document.createElement('p');
        bannerText.className = 'dos-text-body';
        bannerText.textContent = 'Uploading ' + file.name + '...';
        bannerRow.appendChild(bannerText);
        uploadingBanner.appendChild(bannerRow);

        // Insert at top of content
        if (this._content.firstChild) {
          this._content.insertBefore(uploadingBanner, this._content.firstChild);
        } else {
          this._content.appendChild(uploadingBanner);
        }

        // Inject spin keyframe if needed
        if (!document.getElementById('dos-spin-style')) {
          var style = document.createElement('style');
          style.id = 'dos-spin-style';
          style.textContent = '@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}';
          document.head.appendChild(style);
        }
      }

      // Read file as base64
      var reader = new FileReader();
      reader.onload = function () {
        DOS.bridge.send('uploadDocument', {
          documentType: self._uploadDocType,
          fileData: {
            name: file.name,
            type: file.type,
            size: file.size,
            base64: reader.result
          }
        });
      };
      reader.readAsDataURL(file);

      // Reset file input so same file can be re-selected
      if (this._fileInput) this._fileInput.value = '';
    },

    _render: function () {
      var self = this;
      if (!this._content) return;
      while (this._content.firstChild) this._content.removeChild(this._content.firstChild);

      // Summary card
      this._content.appendChild(buildSummaryCard(state.documents));

      // Required docs header
      var reqLabel = document.createElement('p');
      reqLabel.className = 'dos-text-small';
      reqLabel.style.fontWeight = '600';
      reqLabel.style.marginBottom = '10px';
      reqLabel.style.textTransform = 'uppercase';
      reqLabel.style.letterSpacing = '0.5px';
      reqLabel.textContent = 'All Documents';
      this._content.appendChild(reqLabel);

      // Document rows
      DOC_TYPES.forEach(function (dt) {
        self._content.appendChild(buildDocRow(dt, state.documents, self));
      });
    },

    onMessage: function (action, payload) {
      if (action === 'documentList') {
        state.loading = false;
        state.documents = payload.documents || [];
        this._render();
      } else if (action === 'uploadResult') {
        state.uploading = false;
        // Remove upload banner
        var banner = document.getElementById('upload-banner');
        if (banner && banner.parentNode) banner.parentNode.removeChild(banner);

        if (payload.success) {
          // Refresh document list
          DOS.bridge.send('requestDocumentList', {});
        }
      } else if (action === 'verificationUpdate') {
        // Update status of a specific document
        var docId = payload.documentId;
        var newStatus = payload.status;
        for (var i = 0; i < state.documents.length; i++) {
          var docIdField = state.documents[i]._id || state.documents[i].id;
          if (docIdField === docId) {
            state.documents[i].status = newStatus;
            break;
          }
        }
        this._render();
      } else if (action === 'ocrResult') {
        // OCR data extracted — could auto-fill profile fields
        // For now just log; the bridge handles routing to career view if needed
      }
    },

    getSnapshot: function () {
      var verified = 0;
      state.documents.forEach(function (d) {
        if (d.status === 'verified') verified++;
      });
      return { totalDocs: state.documents.length, verifiedDocs: verified, uploading: state.uploading };
    }
  };
})();
