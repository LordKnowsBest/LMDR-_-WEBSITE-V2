/**
 * OCR Handler Module - Fully Configurable
 *
 * Handles document OCR with client-side image compression to avoid
 * Wix's 1MB HTTP payload limit (413 errors).
 *
 * Key features:
 * - Fully configurable element IDs and callbacks
 * - Compresses images to configurable max dimensions before OCR
 * - Maintains original file for storage (full resolution)
 * - Sends compressed version for OCR extraction
 * - Auto-fills form fields from OCR results
 * - Reusable across multiple pages
 *
 * Usage:
 *   <script src="js/ocr-handler.js"></script>
 *   <script>
 *     window.OCRHandler.init({
 *       sendMessage: sendToWix,
 *       fileStorage: uploadedFiles,
 *       documents: {
 *         cdlFront: {
 *           type: 'CDL_FRONT',
 *           input: 'cdlFront',
 *           box: 'cdlFrontBox',
 *           nameDisplay: 'cdlFrontName'
 *         },
 *         // ... more document types
 *       },
 *       formFields: {
 *         cdlNumber: 'cdlNumber',
 *         cdlExpiration: 'cdlExpiration',
 *         medCardExpiration: 'medCardExpiration'
 *       },
 *       onExtracted: (docType, data) => { console.log('Extracted:', data); },
 *       onError: (docType, error) => { console.error('OCR failed:', error); }
 *     });
 *   </script>
 */

(function(global) {
  'use strict';

  // ============================================================================
  // DEFAULT CONFIGURATION
  // ============================================================================

  const DEFAULT_CONFIG = {
    // Image compression settings
    compression: {
      maxWidth: 1200,         // Max width for OCR (maintains aspect ratio)
      maxHeight: 1600,        // Max height for OCR
      quality: 0.85,          // JPEG compression quality (0-1)
      format: 'image/jpeg'    // Output format
    },
    // File validation
    validation: {
      maxFileSizeMB: 5,
      supportedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    },
    // Timing
    timing: {
      ocrTimeoutMs: 30000,    // 30 second timeout
      successDisplayMs: 2500  // How long to show success message
    },
    // UI text
    ui: {
      processingHtml: '<i class="fa-solid fa-spinner fa-spin"></i> AI extracting data...',
      successHtml: '<i class="fa-solid fa-check-circle" style="color: var(--color-success);"></i> Data extracted!',
      fileTooLargeMsg: 'File too large. Maximum size is {maxSize}MB.',
      unsupportedTypeMsg: 'Unsupported file type. Please upload a JPG, PNG, or PDF.'
    },
    // CSS classes
    cssClasses: {
      hasFile: 'has-file',
      processing: 'ocr-processing',
      success: 'ocr-success',
      error: 'error',
      autoFilled: 'auto-filled'
    }
  };

  // ============================================================================
  // MODULE STATE
  // ============================================================================

  let _config = null;
  let _sendMessage = null;
  let _fileStorage = null;
  let _ocrTimeouts = {};
  let _initialized = false;

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Initialize the OCR handler with configuration
   * @param {Object} options - Configuration options
   * @param {Function} options.sendMessage - Function to send messages (e.g., sendToWix)
   * @param {Object} options.fileStorage - Object to store uploaded files
   * @param {Object} options.documents - Document type configurations
   * @param {Object} [options.formFields] - Form field ID mappings for auto-fill
   * @param {Function} [options.onExtracted] - Callback when data is extracted (docType, extractedData)
   * @param {Function} [options.onError] - Callback when OCR fails (docType, error)
   * @param {Function} [options.onFileSelected] - Callback when file is selected (inputId, file)
   * @param {Object} [options.compression] - Override compression settings
   * @param {Object} [options.validation] - Override validation settings
   * @param {Object} [options.timing] - Override timing settings
   * @param {Object} [options.ui] - Override UI text
   * @param {Object} [options.cssClasses] - Override CSS class names
   */
  function init(options) {
    if (!options) {
      console.error('OCRHandler: init() requires configuration options');
      return false;
    }

    if (!options.sendMessage || typeof options.sendMessage !== 'function') {
      console.error('OCRHandler: sendMessage function is required');
      return false;
    }

    if (!options.fileStorage || typeof options.fileStorage !== 'object') {
      console.error('OCRHandler: fileStorage object is required');
      return false;
    }

    if (!options.documents || typeof options.documents !== 'object') {
      console.error('OCRHandler: documents configuration is required');
      return false;
    }

    // Merge with defaults
    _config = {
      compression: { ...DEFAULT_CONFIG.compression, ...(options.compression || {}) },
      validation: { ...DEFAULT_CONFIG.validation, ...(options.validation || {}) },
      timing: { ...DEFAULT_CONFIG.timing, ...(options.timing || {}) },
      ui: { ...DEFAULT_CONFIG.ui, ...(options.ui || {}) },
      cssClasses: { ...DEFAULT_CONFIG.cssClasses, ...(options.cssClasses || {}) },
      documents: options.documents,
      formFields: options.formFields || {},
      onExtracted: options.onExtracted || null,
      onError: options.onError || null,
      onFileSelected: options.onFileSelected || null
    };

    _sendMessage = options.sendMessage;
    _fileStorage = options.fileStorage;
    _initialized = true;

    console.log('📄 OCR Handler initialized (max ' + _config.compression.maxWidth + 'px, ' + Object.keys(_config.documents).length + ' document types)');
    return true;
  }

  /**
   * Check if handler is initialized
   */
  function isInitialized() {
    return _initialized;
  }

  // ============================================================================
  // IMAGE COMPRESSION
  // ============================================================================

  /**
   * Compress an image file to reduce payload size for OCR
   * @param {File} file - The image file to compress
   * @returns {Promise<string>} - Compressed image as base64 data URL
   */
  function compressImageForOCR(file) {
    return new Promise(function(resolve, reject) {
      if (!_config) {
        reject(new Error('OCRHandler not initialized'));
        return;
      }

      // For PDFs, we can't compress client-side - send as-is but warn if large
      if (file.type === 'application/pdf') {
        if (file.size > 1024 * 1024) {
          console.warn('⚠️ PDF file is large (' + Math.round(file.size/1024) + 'KB), OCR may fail. Consider using images.');
        }
        var reader = new FileReader();
        reader.onload = function() { resolve(reader.result); };
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      var img = new Image();
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');
      var compression = _config.compression;

      img.onload = function() {
        // Calculate new dimensions maintaining aspect ratio
        var width = img.width;
        var height = img.height;

        if (width > compression.maxWidth) {
          height = Math.round(height * (compression.maxWidth / width));
          width = compression.maxWidth;
        }

        if (height > compression.maxHeight) {
          width = Math.round(width * (compression.maxHeight / height));
          height = compression.maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw with white background (for transparency)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to configured format
        var compressedDataUrl = canvas.toDataURL(compression.format, compression.quality);

        // Log compression stats
        var originalSizeKB = Math.round(file.size / 1024);
        var compressedSizeKB = Math.round((compressedDataUrl.length * 3) / 4 / 1024);
        var reduction = Math.round((1 - compressedSizeKB/originalSizeKB) * 100);
        console.log('🗜️ Image compressed: ' + originalSizeKB + 'KB → ' + compressedSizeKB + 'KB (' + reduction + '% reduction)');

        resolve(compressedDataUrl);
      };

      img.onerror = function() {
        reject(new Error('Failed to load image for compression'));
      };

      // Load image from file
      var reader = new FileReader();
      reader.onload = function(e) {
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Convert file to base64 (original, uncompressed)
   * Used for storing full-resolution files
   * @param {File} file - File to convert
   * @returns {Promise<string>} - Base64 data URL
   */
  function fileToBase64(file) {
    return new Promise(function(resolve, reject) {
      if (!file) {
        resolve(null);
        return;
      }
      var reader = new FileReader();
      reader.onload = function() { resolve(reader.result); };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  /**
   * Get document config by input ID
   */
  function getDocConfigByInputId(inputId) {
    if (!_config || !_config.documents) return null;
    return _config.documents[inputId] || null;
  }

  /**
   * Get input ID by document type
   */
  function getInputIdByDocType(docType) {
    if (!_config || !_config.documents) return null;
    for (var inputId in _config.documents) {
      if (_config.documents[inputId].type === docType) {
        return inputId;
      }
    }
    return null;
  }

  /**
   * Get DOM element safely
   */
  function getElement(id) {
    return id ? document.getElementById(id) : null;
  }

  /**
   * Truncate filename for display
   */
  function truncateFilename(name, maxLength) {
    maxLength = maxLength || 20;
    if (!name || name.length <= maxLength) return name || '';
    return name.substring(0, maxLength - 3) + '...';
  }

  /**
   * Visual feedback for auto-filled fields
   */
  function flashField(field) {
    if (!field) return;
    field.style.transition = 'background-color 0.3s ease';
    field.style.backgroundColor = '#10b98130'; // Green tint
    setTimeout(function() {
      field.style.backgroundColor = '';
    }, 1500);
  }

  // ============================================================================
  // FILE HANDLING
  // ============================================================================

  /**
   * Handle file input change - validates, stores, and triggers OCR
   * @param {string} inputId - The input element ID (must match a key in documents config)
   */
  function handleFileChange(inputId) {
    if (!_initialized) {
      console.error('OCRHandler: Not initialized. Call init() first.');
      return;
    }

    var docConfig = getDocConfigByInputId(inputId);
    if (!docConfig) {
      console.warn('OCRHandler: Unknown document type for input:', inputId);
      return;
    }

    var input = getElement(docConfig.input || inputId);
    var box = getElement(docConfig.box);
    var nameEl = getElement(docConfig.nameDisplay);

    if (!input || !input.files || !input.files[0]) return;

    var file = input.files[0];
    var validation = _config.validation;
    var classes = _config.cssClasses;
    var ui = _config.ui;

    // Validate file size
    if (file.size > validation.maxFileSizeMB * 1024 * 1024) {
      alert(ui.fileTooLargeMsg.replace('{maxSize}', validation.maxFileSizeMB));
      input.value = '';
      return;
    }

    // Validate file type
    var isValidType = validation.supportedTypes.indexOf(file.type) !== -1 || file.type.indexOf('image/') === 0;
    if (!isValidType) {
      alert(ui.unsupportedTypeMsg);
      input.value = '';
      return;
    }

    // Store original file
    if (_fileStorage) {
      _fileStorage[inputId] = file;
    }

    // Update UI
    if (box) {
      box.classList.add(classes.hasFile);
      box.classList.remove(classes.error, classes.success);
    }

    if (nameEl) {
      nameEl.textContent = truncateFilename(file.name);
    }

    // Callback for file selected
    if (_config.onFileSelected) {
      _config.onFileSelected(inputId, file);
    }

    // Trigger OCR if document type is configured
    if (docConfig.type) {
      triggerOCR(inputId, file, docConfig, box, nameEl);
    }
  }

  /**
   * Trigger OCR extraction for a document
   */
  function triggerOCR(inputId, file, docConfig, box, nameEl) {
    var classes = _config.cssClasses;
    var ui = _config.ui;
    var timing = _config.timing;

    // Clear any existing timeout for this input
    if (_ocrTimeouts[inputId]) {
      clearTimeout(_ocrTimeouts[inputId]);
    }

    // Show OCR loading state
    if (box) box.classList.add(classes.processing);
    if (nameEl) nameEl.innerHTML = ui.processingHtml;

    compressImageForOCR(file)
      .then(function(compressedBase64) {
        // Send compressed version for OCR
        _sendMessage('extractDocumentOCR', {
          base64Data: compressedBase64,
          docType: docConfig.type,
          inputId: inputId
        });

        // Set timeout to restore filename if no response
        _ocrTimeouts[inputId] = setTimeout(function() {
          if (box) box.classList.remove(classes.processing);
          if (nameEl) nameEl.textContent = truncateFilename(file.name);
          console.warn('⚠️ OCR timeout for ' + inputId);
          if (_config.onError) {
            _config.onError(docConfig.type, 'OCR request timed out');
          }
        }, timing.ocrTimeoutMs);
      })
      .catch(function(error) {
        console.error('Error preparing file for OCR:', error);
        if (box) box.classList.remove(classes.processing);
        if (nameEl) nameEl.textContent = truncateFilename(file.name);
        if (_config.onError) {
          _config.onError(docConfig.type, error.message);
        }
      });
  }

  // ============================================================================
  // OCR RESULT HANDLING
  // ============================================================================

  /**
   * Handle OCR result from backend and auto-fill form fields
   * @param {Object} data - OCR result data from backend
   */
  function handleOCRResult(data) {
    if (!_initialized) {
      console.error('OCRHandler: Not initialized');
      return;
    }

    console.log('🤖 OCR Result received:', data);

    var inputId = getInputIdByDocType(data.docType);
    if (!inputId) {
      console.warn('OCRHandler: Unknown document type:', data.docType);
      return;
    }

    var docConfig = getDocConfigByInputId(inputId);
    if (!docConfig) return;

    // Clear timeout
    if (_ocrTimeouts[inputId]) {
      clearTimeout(_ocrTimeouts[inputId]);
      delete _ocrTimeouts[inputId];
    }

    var box = getElement(docConfig.box);
    var nameEl = getElement(docConfig.nameDisplay);
    var file = _fileStorage ? _fileStorage[inputId] : null;
    var classes = _config.cssClasses;

    // Remove loading state
    if (box) box.classList.remove(classes.processing);

    if (data.success && data.extracted) {
      handleOCRSuccess(data, inputId, docConfig, box, nameEl, file);
    } else {
      handleOCRFailure(data, inputId, docConfig, nameEl, file);
    }
  }

  /**
   * Handle successful OCR extraction
   */
  function handleOCRSuccess(data, inputId, docConfig, box, nameEl, file) {
    var classes = _config.cssClasses;
    var ui = _config.ui;
    var timing = _config.timing;

    // Show success state
    if (box) box.classList.add(classes.success);
    if (nameEl) nameEl.innerHTML = ui.successHtml;

    var extracted = data.extracted;

    // Auto-fill form fields based on document type
    autoFillFormFields(data.docType, extracted);

    // Log confidence level
    if (data.confidence) {
      console.log('📊 OCR Confidence: ' + data.confidence + ' (' + (data.consensusMethod || 'single_pass') + ')');
    }

    // Call onExtracted callback with all extracted data
    if (_config.onExtracted) {
      _config.onExtracted(data.docType, extracted, data);
    }

    // Reset filename display after delay
    setTimeout(function() {
      if (nameEl && file) {
        nameEl.textContent = truncateFilename(file.name);
      }
    }, timing.successDisplayMs);
  }

  /**
   * Handle failed OCR extraction
   */
  function handleOCRFailure(data, inputId, docConfig, nameEl, file) {
    // Just show the filename
    if (nameEl && file) {
      nameEl.textContent = truncateFilename(file.name);
    }

    var errorMsg = data.error || data.userMessage || 'Unknown error';
    console.warn('⚠️ OCR extraction failed:', errorMsg);

    // Call onError callback
    if (_config.onError) {
      _config.onError(data.docType, errorMsg, data);
    }
  }

  /**
   * Auto-fill form fields based on extracted data
   */
  function autoFillFormFields(docType, extracted) {
    if (!_config.formFields || !extracted) return;

    var fields = _config.formFields;
    var classes = _config.cssClasses;

    // CDL document fields
    if (docType === 'CDL_FRONT' || docType === 'CDL_BACK') {
      if (extracted.licenseNumber && fields.cdlNumber) {
        var field = getElement(fields.cdlNumber);
        if (field && !field.value) {
          field.value = extracted.licenseNumber;
          field.classList.add(classes.autoFilled);
          flashField(field);
        }
      }

      if (extracted.expirationDate && fields.cdlExpiration) {
        var field = getElement(fields.cdlExpiration);
        if (field && !field.value) {
          field.value = extracted.expirationDate;
          field.classList.add(classes.autoFilled);
          flashField(field);
        }
      }

      if (extracted.state && fields.cdlState) {
        var field = getElement(fields.cdlState);
        if (field && !field.value) {
          field.value = extracted.state;
          field.classList.add(classes.autoFilled);
          flashField(field);
        }
      }

      if (extracted.cdlClass && fields.cdlClass) {
        var field = getElement(fields.cdlClass);
        if (field && !field.value) {
          field.value = extracted.cdlClass;
          field.classList.add(classes.autoFilled);
          flashField(field);
        }
      }

      if (extracted.fullName && fields.driverName) {
        var field = getElement(fields.driverName);
        if (field && !field.value) {
          field.value = extracted.fullName;
          field.classList.add(classes.autoFilled);
          flashField(field);
        }
      }

      if (extracted.dob && fields.driverDOB) {
        var field = getElement(fields.driverDOB);
        if (field && !field.value) {
          field.value = extracted.dob;
          field.classList.add(classes.autoFilled);
          flashField(field);
        }
      }

      console.log('✅ CDL data auto-filled:', {
        licenseNumber: extracted.licenseNumber,
        expiration: extracted.expirationDate,
        state: extracted.state,
        'class': extracted.cdlClass
      });
    }

    // Med Card fields
    if (docType === 'MED_CARD') {
      if (extracted.certificateExpirationDate && fields.medCardExpiration) {
        var field = getElement(fields.medCardExpiration);
        if (field && !field.value) {
          field.value = extracted.certificateExpirationDate;
          field.classList.add(classes.autoFilled);
          flashField(field);
        }
      }

      if (extracted.examinerName && fields.examinerName) {
        var field = getElement(fields.examinerName);
        if (field && !field.value) {
          field.value = extracted.examinerName;
          field.classList.add(classes.autoFilled);
          flashField(field);
        }
      }

      if (extracted.registryNumber && fields.registryNumber) {
        var field = getElement(fields.registryNumber);
        if (field && !field.value) {
          field.value = extracted.registryNumber;
          field.classList.add(classes.autoFilled);
          flashField(field);
        }
      }

      console.log('✅ Med Card data auto-filled:', {
        expiration: extracted.certificateExpirationDate
      });
    }
  }

  // ============================================================================
  // FILE REMOVAL
  // ============================================================================

  /**
   * Remove an uploaded file
   * @param {string} inputId - The input element ID
   */
  function removeFile(inputId) {
    if (!_initialized) return;

    var docConfig = getDocConfigByInputId(inputId);
    if (!docConfig) return;

    var input = getElement(docConfig.input || inputId);
    var box = getElement(docConfig.box);
    var nameEl = getElement(docConfig.nameDisplay);
    var classes = _config.cssClasses;

    if (input) input.value = '';
    if (_fileStorage) _fileStorage[inputId] = null;
    if (box) box.classList.remove(classes.hasFile, classes.success, classes.processing);
    if (nameEl) nameEl.textContent = '';

    // Clear any pending timeout
    if (_ocrTimeouts[inputId]) {
      clearTimeout(_ocrTimeouts[inputId]);
      delete _ocrTimeouts[inputId];
    }
  }

  /**
   * Reset all file uploads
   */
  function resetFileUploads() {
    if (!_initialized || !_config.documents) return;
    Object.keys(_config.documents).forEach(function(inputId) {
      removeFile(inputId);
    });
  }

  /**
   * Clear all OCR timeouts
   */
  function clearOCRTimeouts() {
    Object.keys(_ocrTimeouts).forEach(function(key) {
      clearTimeout(_ocrTimeouts[key]);
      delete _ocrTimeouts[key];
    });
  }

  // ============================================================================
  // SETUP FILE INPUT LISTENERS
  // ============================================================================

  /**
   * Set up event listeners for all configured file inputs
   */
  function setupFileInputListeners() {
    if (!_initialized || !_config.documents) {
      console.error('OCRHandler: Cannot setup listeners - not initialized');
      return;
    }

    var count = 0;
    Object.keys(_config.documents).forEach(function(inputId) {
      var docConfig = _config.documents[inputId];
      var input = getElement(docConfig.input || inputId);
      if (input) {
        input.addEventListener('change', function() {
          handleFileChange(inputId);
        });
        count++;
      }
    });
    console.log('📎 File input listeners attached (' + count + ' inputs)');
  }

  // ============================================================================
  // CONFIGURATION ACCESS
  // ============================================================================

  /**
   * Get current configuration (read-only copy)
   */
  function getConfig() {
    return _config ? JSON.parse(JSON.stringify(_config)) : null;
  }

  /**
   * Update configuration (partial update)
   */
  function updateConfig(updates) {
    if (!_initialized) return false;
    if (updates.compression) {
      _config.compression = { ..._config.compression, ...updates.compression };
    }
    if (updates.validation) {
      _config.validation = { ..._config.validation, ...updates.validation };
    }
    if (updates.timing) {
      _config.timing = { ..._config.timing, ...updates.timing };
    }
    if (updates.ui) {
      _config.ui = { ..._config.ui, ...updates.ui };
    }
    if (updates.formFields) {
      _config.formFields = { ..._config.formFields, ...updates.formFields };
    }
    if (updates.onExtracted) _config.onExtracted = updates.onExtracted;
    if (updates.onError) _config.onError = updates.onError;
    if (updates.onFileSelected) _config.onFileSelected = updates.onFileSelected;
    return true;
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  global.OCRHandler = {
    // Initialization
    init: init,
    isInitialized: isInitialized,

    // Core functions
    handleFileChange: handleFileChange,
    handleOCRResult: handleOCRResult,
    removeFile: removeFile,
    resetFileUploads: resetFileUploads,
    clearOCRTimeouts: clearOCRTimeouts,
    setupFileInputListeners: setupFileInputListeners,

    // Utilities
    fileToBase64: fileToBase64,
    compressImageForOCR: compressImageForOCR,

    // Configuration
    getConfig: getConfig,
    updateConfig: updateConfig,

    // Constants
    DEFAULT_CONFIG: DEFAULT_CONFIG
  };

})(window);
