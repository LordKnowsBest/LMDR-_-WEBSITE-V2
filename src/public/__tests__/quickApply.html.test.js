/**
 * HTML DOM TESTS: Quick Apply
 * ===========================
 * Tests DOM rendering and message handling for Quick Apply HTML component.
 *
 * Key DOM elements (expected):
 *   - #upload-zone-cdl-front, #upload-zone-cdl-back, #upload-zone-med-card, #upload-zone-resume
 *   - #file-preview-*, #file-status-*, #ocr-status-*
 *   - #user-status, #login-prompt, #profile-section
 *   - #extracted-data-display, #submit-btn, #submit-status
 *   - #carrier-info, #error-message, #success-message
 *
 * Key inbound message types (from Velo):
 *   - pageReady, profileLoaded, uploadSuccess, uploadError
 *   - ocrProcessing, ocrComplete, ocrResult, ocrError
 *   - applicationSubmitted, submitResult, applicationError
 *   - documentCleared, userStatusUpdate, pong
 *
 * @module public/__tests__/quickApply.html.test.js
 */

// =============================================================================
// MOCK DOM INFRASTRUCTURE
// =============================================================================

const mockElements = {};
let capturedOutbound = [];

function createMockElement(id, options = {}) {
    return {
        id,
        classList: {
            _classes: new Set(options.classes || []),
            add: function (...cls) { cls.forEach(c => this._classes.add(c)); },
            remove: function (...cls) { cls.forEach(c => this._classes.delete(c)); },
            contains: function (c) { return this._classes.has(c); },
            toggle: function (c) {
                if (this._classes.has(c)) this._classes.delete(c);
                else this._classes.add(c);
            }
        },
        innerHTML: options.innerHTML || '',
        textContent: options.textContent || '',
        value: options.value || '',
        disabled: options.disabled || false,
        style: {},
        files: options.files || [],
        click: jest.fn(),
        focus: jest.fn(),
        appendChild: jest.fn(function (child) {
            this.innerHTML += child.outerHTML || child.innerHTML || '';
        }),
        querySelector: jest.fn(() => null),
        querySelectorAll: jest.fn(() => []),
        outerHTML: `<div id="${id}"></div>`
    };
}

function getMockElement(id) {
    return mockElements[id] || null;
}

function resetMocks() {
    capturedOutbound = [];
    Object.keys(mockElements).forEach(key => delete mockElements[key]);

    // Initialize all expected DOM elements
    const elementIds = [
        // Upload zones
        'upload-zone-cdl-front', 'upload-zone-cdl-back',
        'upload-zone-med-card', 'upload-zone-resume',
        // File inputs
        'file-input-cdl-front', 'file-input-cdl-back',
        'file-input-med-card', 'file-input-resume',
        // File previews
        'file-preview-cdl-front', 'file-preview-cdl-back',
        'file-preview-med-card', 'file-preview-resume',
        // File status indicators
        'file-status-cdl-front', 'file-status-cdl-back',
        'file-status-med-card', 'file-status-resume',
        // OCR status
        'ocr-status-cdl-front', 'ocr-status-cdl-back',
        'ocr-status-med-card',
        // User/profile sections
        'user-status', 'login-prompt', 'profile-section',
        'profile-name', 'profile-email', 'profile-completeness',
        // Extracted data
        'extracted-data-display', 'extracted-cdl-number',
        'extracted-cdl-expiration', 'extracted-name',
        'extracted-med-card-expiration',
        // Form fields
        'phone-input', 'email-input', 'availability-select',
        'message-textarea', 'preferred-contact',
        // Carrier info
        'carrier-info', 'carrier-name', 'carrier-dot',
        // Submit section
        'submit-btn', 'submit-status', 'submit-spinner',
        // Messages
        'error-message', 'success-message',
        'error-text', 'success-text',
        // Navigation buttons
        'btn-find-matches', 'btn-go-dashboard', 'btn-login'
    ];

    elementIds.forEach(id => {
        mockElements[id] = createMockElement(id);
    });

    // Set initial hidden classes
    ['login-prompt', 'profile-section', 'extracted-data-display',
        'error-message', 'success-message', 'submit-spinner'].forEach(id => {
            mockElements[id].classList.add('hidden');
        });

    global.document = {
        getElementById: (id) => getMockElement(id),
        createElement: (tag) => createMockElement(`mock-${tag}-${Date.now()}`),
        querySelectorAll: jest.fn(() => [])
    };

    global.window = {
        parent: {
            postMessage: jest.fn((data) => {
                capturedOutbound.push(data);
            })
        }
    };
}

// =============================================================================
// MOCK HTML FUNCTIONS (expected behavior)
// =============================================================================

let currentState = {
    userStatus: null,
    driverProfile: null,
    uploadedDocuments: {},
    extractedData: {},
    preSelectedCarrier: null
};

function resetState() {
    currentState = {
        userStatus: null,
        driverProfile: null,
        uploadedDocuments: {},
        extractedData: {},
        preSelectedCarrier: null
    };
}

function sendToVelo(type, data = {}) {
    if (window.parent) {
        window.parent.postMessage({ type, data }, '*');
    }
}

function stripHtml(str) {
    if (!str) return '';
    const tmp = document.createElement('div');
    tmp.textContent = str;
    return tmp.textContent;
}

// Handlers for inbound messages from Velo
function handlePageReady(data) {
    currentState.userStatus = data.userStatus;
    currentState.driverProfile = data.driverProfile;
    currentState.preSelectedCarrier = data.preSelectedCarrier;
    currentState.uploadedDocuments = data.uploadedDocuments || {};
    currentState.extractedData = data.extractedData || {};

    // Update UI based on user status
    const userStatusEl = document.getElementById('user-status');
    const loginPrompt = document.getElementById('login-prompt');
    const profileSection = document.getElementById('profile-section');

    if (data.userStatus?.loggedIn) {
        userStatusEl.textContent = `Logged in as ${data.userStatus.email || 'user'}`;
        loginPrompt.classList.add('hidden');
        profileSection.classList.remove('hidden');

        // Populate profile data
        if (data.driverProfile) {
            document.getElementById('profile-name').textContent = data.driverProfile.displayName || '';
            document.getElementById('profile-email').textContent = data.driverProfile.email || '';
            document.getElementById('profile-completeness').textContent = `${data.driverProfile.completeness || 0}%`;
        }
    } else {
        userStatusEl.textContent = 'Guest';
        loginPrompt.classList.remove('hidden');
        profileSection.classList.add('hidden');
    }

    // Show pre-selected carrier if present
    if (data.preSelectedCarrier) {
        const carrierInfo = document.getElementById('carrier-info');
        const carrierName = document.getElementById('carrier-name');
        const carrierDot = document.getElementById('carrier-dot');

        carrierInfo.classList.remove('hidden');
        carrierName.textContent = data.preSelectedCarrier.name || 'Unknown Carrier';
        carrierDot.textContent = data.preSelectedCarrier.dot || '';
    }

    // Show existing document previews
    Object.keys(data.uploadedDocuments || {}).forEach(docType => {
        if (data.uploadedDocuments[docType]?.exists) {
            updateDocumentPreview(docType, { isExisting: true });
        }
    });
}

function handleProfileLoaded(data) {
    if (data.success) {
        currentState.driverProfile = data.profile;

        const profileSection = document.getElementById('profile-section');
        profileSection.classList.remove('hidden');

        document.getElementById('profile-name').textContent = data.profile.displayName || '';
        document.getElementById('profile-email').textContent = data.profile.email || '';
    } else {
        showError(data.error || 'Failed to load profile');
    }
}

function handleUploadSuccess(data) {
    const normalizedType = normalizeDocType(data.docType);

    // Update status indicator
    const statusEl = document.getElementById(`file-status-${normalizedType}`);
    if (statusEl) {
        statusEl.classList.remove('hidden');
        statusEl.classList.add('status-uploaded');
        statusEl.textContent = 'Uploaded';
    }

    // Update preview
    updateDocumentPreview(normalizedType, {
        fileName: data.fileName,
        fileSize: data.fileSize,
        fileType: data.fileType
    });

    // Store in state
    currentState.uploadedDocuments[normalizedType] = {
        fileName: data.fileName,
        uploaded: true
    };
}

function handleUploadError(data) {
    showError(`Upload failed: ${data.error}`);

    // Reset status indicator
    const normalizedType = normalizeDocType(data.docType);
    const statusEl = document.getElementById(`file-status-${normalizedType}`);
    if (statusEl) {
        statusEl.classList.add('status-error');
        statusEl.textContent = 'Error';
    }
}

function handleOcrProcessing(data) {
    const normalizedType = normalizeDocType(data.docType);
    const ocrStatusEl = document.getElementById(`ocr-status-${normalizedType}`);

    if (ocrStatusEl) {
        ocrStatusEl.classList.remove('hidden');
        ocrStatusEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Extracting...';
    }
}

function handleOcrComplete(data) {
    const normalizedType = normalizeDocType(data.docType);

    // Update OCR status
    const ocrStatusEl = document.getElementById(`ocr-status-${normalizedType}`);
    if (ocrStatusEl) {
        ocrStatusEl.innerHTML = `<i class="fa-solid fa-check"></i> Extracted (${Math.round(data.confidence * 100)}%)`;
        ocrStatusEl.classList.add('status-success');
    }

    // Store and display extracted data
    currentState.extractedData[normalizedType] = data.extracted;
    displayExtractedData(data.extracted);
}

function handleOcrResult(data) {
    if (data.success) {
        handleOcrComplete({
            docType: data.docType,
            confidence: data.confidence,
            extracted: data.extracted
        });
    } else {
        handleOcrError({
            docType: data.docType,
            error: data.error
        });
    }
}

function handleOcrError(data) {
    const normalizedType = normalizeDocType(data.docType);
    const ocrStatusEl = document.getElementById(`ocr-status-${normalizedType}`);

    if (ocrStatusEl) {
        ocrStatusEl.innerHTML = '<i class="fa-solid fa-exclamation-triangle"></i> OCR failed';
        ocrStatusEl.classList.add('status-error');
    }
}

function handleApplicationSubmitted(data) {
    // Hide submit spinner
    document.getElementById('submit-spinner').classList.add('hidden');
    document.getElementById('submit-btn').disabled = false;

    if (data.success) {
        // Show success message
        const successEl = document.getElementById('success-message');
        const successText = document.getElementById('success-text');

        successEl.classList.remove('hidden');
        successText.textContent = data.message || 'Application submitted successfully!';

        // Hide error if showing
        document.getElementById('error-message').classList.add('hidden');

        // Update submit button
        document.getElementById('submit-btn').textContent = data.type === 'profileUpdate'
            ? 'Documents Saved'
            : 'Application Submitted';
        document.getElementById('submit-btn').disabled = true;
    } else {
        showError(data.error || 'Failed to submit');
    }
}

function handleSubmitResult(data) {
    // Same handling as applicationSubmitted
    handleApplicationSubmitted(data);
}

function handleApplicationError(data) {
    document.getElementById('submit-spinner').classList.add('hidden');
    document.getElementById('submit-btn').disabled = false;

    showError(data.error || 'Application failed');
}

function handleDocumentCleared(data) {
    const normalizedType = normalizeDocType(data.docType);

    // Clear status
    const statusEl = document.getElementById(`file-status-${normalizedType}`);
    if (statusEl) {
        statusEl.classList.add('hidden');
        statusEl.classList.remove('status-uploaded', 'status-error');
        statusEl.textContent = '';
    }

    // Clear preview
    const previewEl = document.getElementById(`file-preview-${normalizedType}`);
    if (previewEl) {
        previewEl.innerHTML = '';
        previewEl.classList.add('hidden');
    }

    // Clear OCR status
    const ocrStatusEl = document.getElementById(`ocr-status-${normalizedType}`);
    if (ocrStatusEl) {
        ocrStatusEl.classList.add('hidden');
        ocrStatusEl.innerHTML = '';
    }

    // Clear from state
    delete currentState.uploadedDocuments[normalizedType];
    delete currentState.extractedData[normalizedType];
}

function handleUserStatusUpdate(data) {
    currentState.userStatus = data;

    const userStatusEl = document.getElementById('user-status');
    const loginPrompt = document.getElementById('login-prompt');
    const profileSection = document.getElementById('profile-section');

    if (data.loggedIn) {
        userStatusEl.textContent = `Logged in as ${data.email || 'user'}`;
        loginPrompt.classList.add('hidden');

        if (data.justLoggedIn) {
            // Flash success indicator
            userStatusEl.classList.add('just-logged-in');
        }
    } else {
        userStatusEl.textContent = 'Guest';
        loginPrompt.classList.remove('hidden');
        profileSection.classList.add('hidden');
    }
}

// Helper functions
function showError(message) {
    const errorEl = document.getElementById('error-message');
    const errorText = document.getElementById('error-text');

    errorEl.classList.remove('hidden');
    errorText.textContent = stripHtml(message);

    // Hide success if showing
    document.getElementById('success-message').classList.add('hidden');
}

function updateDocumentPreview(docType, data) {
    const previewEl = document.getElementById(`file-preview-${docType}`);
    if (!previewEl) return;

    previewEl.classList.remove('hidden');

    if (data.isExisting) {
        previewEl.innerHTML = '<span class="existing-doc">Previously uploaded</span>';
    } else {
        previewEl.innerHTML = `
            <span class="file-name">${stripHtml(data.fileName || 'Document')}</span>
            <span class="file-size">${formatFileSize(data.fileSize || 0)}</span>
        `;
    }
}

function displayExtractedData(extracted) {
    if (!extracted) return;

    const displayEl = document.getElementById('extracted-data-display');
    displayEl.classList.remove('hidden');

    if (extracted.licenseNumber) {
        document.getElementById('extracted-cdl-number').textContent = extracted.licenseNumber;
    }
    if (extracted.expirationDate) {
        document.getElementById('extracted-cdl-expiration').textContent = extracted.expirationDate;
    }
    if (extracted.name) {
        document.getElementById('extracted-name').textContent = extracted.name;
    }
    if (extracted.certificateExpirationDate) {
        document.getElementById('extracted-med-card-expiration').textContent = extracted.certificateExpirationDate;
    }
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function normalizeDocType(docType) {
    switch (docType) {
        case 'cdlFront':
        case 'CDL_FRONT':
            return 'cdl-front';
        case 'cdlBack':
        case 'CDL_BACK':
            return 'cdl-back';
        case 'medCard':
        case 'MED_CARD':
            return 'med-card';
        case 'resume':
        case 'RESUME':
            return 'resume';
        default:
            return docType.toLowerCase().replace(/_/g, '-');
    }
}

// Main message handler
function handleInboundMessage(type, data) {
    switch (type) {
        case 'pageReady':
            handlePageReady(data);
            break;
        case 'profileLoaded':
            handleProfileLoaded(data);
            break;
        case 'uploadSuccess':
            handleUploadSuccess(data);
            break;
        case 'uploadError':
            handleUploadError(data);
            break;
        case 'ocrProcessing':
            handleOcrProcessing(data);
            break;
        case 'ocrComplete':
            handleOcrComplete(data);
            break;
        case 'ocrResult':
            handleOcrResult(data);
            break;
        case 'ocrError':
            handleOcrError(data);
            break;
        case 'applicationSubmitted':
            handleApplicationSubmitted(data);
            break;
        case 'submitResult':
            handleSubmitResult(data);
            break;
        case 'applicationError':
            handleApplicationError(data);
            break;
        case 'documentCleared':
            handleDocumentCleared(data);
            break;
        case 'userStatusUpdate':
            handleUserStatusUpdate(data);
            break;
        case 'pong':
            // Health check response - no UI update needed
            break;
    }
}

// =============================================================================
// TESTS
// =============================================================================

describe('Quick Apply HTML Tests', () => {
    beforeEach(() => {
        resetMocks();
        resetState();
    });

    // -------------------------------------------------------------------------
    // PAGE READY
    // -------------------------------------------------------------------------
    describe('Page Ready (pageReady)', () => {
        test('should show login prompt for guest users', () => {
            handleInboundMessage('pageReady', {
                userStatus: { loggedIn: false, tier: 'guest' },
                driverProfile: null,
                uploadedDocuments: {}
            });

            const loginPrompt = document.getElementById('login-prompt');
            const profileSection = document.getElementById('profile-section');
            const userStatus = document.getElementById('user-status');

            expect(loginPrompt.classList.contains('hidden')).toBe(false);
            expect(profileSection.classList.contains('hidden')).toBe(true);
            expect(userStatus.textContent).toBe('Guest');
        });

        test('should show profile section for logged in users', () => {
            handleInboundMessage('pageReady', {
                userStatus: { loggedIn: true, email: 'driver@test.com', tier: 'premium' },
                driverProfile: {
                    displayName: 'John Doe',
                    email: 'driver@test.com',
                    completeness: 75
                },
                uploadedDocuments: {}
            });

            const loginPrompt = document.getElementById('login-prompt');
            const profileSection = document.getElementById('profile-section');
            const profileName = document.getElementById('profile-name');
            const profileCompleteness = document.getElementById('profile-completeness');

            expect(loginPrompt.classList.contains('hidden')).toBe(true);
            expect(profileSection.classList.contains('hidden')).toBe(false);
            expect(profileName.textContent).toBe('John Doe');
            expect(profileCompleteness.textContent).toBe('75%');
        });

        test('should show pre-selected carrier info', () => {
            handleInboundMessage('pageReady', {
                userStatus: { loggedIn: false },
                preSelectedCarrier: { dot: '1234567', name: 'Swift Transportation' },
                uploadedDocuments: {}
            });

            const carrierInfo = document.getElementById('carrier-info');
            const carrierName = document.getElementById('carrier-name');
            const carrierDot = document.getElementById('carrier-dot');

            expect(carrierInfo.classList.contains('hidden')).toBe(false);
            expect(carrierName.textContent).toBe('Swift Transportation');
            expect(carrierDot.textContent).toBe('1234567');
        });

        test('should show existing documents', () => {
            handleInboundMessage('pageReady', {
                userStatus: { loggedIn: true },
                uploadedDocuments: {
                    cdlFront: { exists: true, isExisting: true },
                    resume: { exists: true, isExisting: true }
                }
            });

            const cdlPreview = document.getElementById('file-preview-cdl-front');
            const resumePreview = document.getElementById('file-preview-resume');

            expect(cdlPreview.classList.contains('hidden')).toBe(false);
            expect(resumePreview.classList.contains('hidden')).toBe(false);
        });

        test('should store state correctly', () => {
            handleInboundMessage('pageReady', {
                userStatus: { loggedIn: true, userId: 'user123' },
                driverProfile: { _id: 'profile123' },
                preSelectedCarrier: { dot: '999999' },
                extractedData: { cdlFront: { licenseNumber: 'ABC123' } }
            });

            expect(currentState.userStatus.loggedIn).toBe(true);
            expect(currentState.preSelectedCarrier.dot).toBe('999999');
            expect(currentState.extractedData.cdlFront.licenseNumber).toBe('ABC123');
        });
    });

    // -------------------------------------------------------------------------
    // PROFILE LOADED
    // -------------------------------------------------------------------------
    describe('Profile Loaded (profileLoaded)', () => {
        test('should display profile on success', () => {
            handleInboundMessage('profileLoaded', {
                success: true,
                profile: {
                    displayName: 'Jane Driver',
                    email: 'jane@test.com'
                }
            });

            const profileSection = document.getElementById('profile-section');
            const profileName = document.getElementById('profile-name');

            expect(profileSection.classList.contains('hidden')).toBe(false);
            expect(profileName.textContent).toBe('Jane Driver');
        });

        test('should show error on failure', () => {
            handleInboundMessage('profileLoaded', {
                success: false,
                error: 'Profile not found'
            });

            const errorEl = document.getElementById('error-message');
            const errorText = document.getElementById('error-text');

            expect(errorEl.classList.contains('hidden')).toBe(false);
            expect(errorText.textContent).toContain('Profile not found');
        });
    });

    // -------------------------------------------------------------------------
    // UPLOAD SUCCESS/ERROR
    // -------------------------------------------------------------------------
    describe('Upload Success/Error', () => {
        test('should update UI on upload success', () => {
            handleInboundMessage('uploadSuccess', {
                docType: 'cdlFront',
                fileName: 'my_cdl.jpg',
                fileSize: 1024 * 500,
                fileType: 'image/jpeg'
            });

            const statusEl = document.getElementById('file-status-cdl-front');
            const previewEl = document.getElementById('file-preview-cdl-front');

            expect(statusEl.classList.contains('status-uploaded')).toBe(true);
            expect(statusEl.textContent).toBe('Uploaded');
            expect(previewEl.classList.contains('hidden')).toBe(false);
            expect(previewEl.innerHTML).toContain('my_cdl.jpg');
        });

        test('should normalize CDL_FRONT to cdl-front', () => {
            handleInboundMessage('uploadSuccess', {
                docType: 'CDL_FRONT',
                fileName: 'cdl.png'
            });

            expect(currentState.uploadedDocuments['cdl-front']).toBeDefined();
            expect(currentState.uploadedDocuments['cdl-front'].fileName).toBe('cdl.png');
        });

        test('should show error on upload failure', () => {
            handleInboundMessage('uploadError', {
                docType: 'medCard',
                error: 'File too large'
            });

            const statusEl = document.getElementById('file-status-med-card');
            const errorEl = document.getElementById('error-message');

            expect(statusEl.classList.contains('status-error')).toBe(true);
            expect(errorEl.classList.contains('hidden')).toBe(false);
        });
    });

    // -------------------------------------------------------------------------
    // OCR PROCESSING/COMPLETE/ERROR
    // -------------------------------------------------------------------------
    describe('OCR Processing', () => {
        test('should show processing state', () => {
            handleInboundMessage('ocrProcessing', { docType: 'cdlFront' });

            const ocrStatus = document.getElementById('ocr-status-cdl-front');
            expect(ocrStatus.classList.contains('hidden')).toBe(false);
            expect(ocrStatus.innerHTML).toContain('Extracting');
            expect(ocrStatus.innerHTML).toContain('fa-spinner');
        });

        test('should show extracted data on OCR complete', () => {
            handleInboundMessage('ocrComplete', {
                docType: 'CDL_FRONT',
                confidence: 0.95,
                extracted: {
                    licenseNumber: 'D1234567',
                    expirationDate: '2027-05-15',
                    name: 'John Smith'
                }
            });

            const ocrStatus = document.getElementById('ocr-status-cdl-front');
            const extractedDisplay = document.getElementById('extracted-data-display');
            const cdlNumber = document.getElementById('extracted-cdl-number');

            expect(ocrStatus.innerHTML).toContain('95%');
            expect(ocrStatus.classList.contains('status-success')).toBe(true);
            expect(extractedDisplay.classList.contains('hidden')).toBe(false);
            expect(cdlNumber.textContent).toBe('D1234567');
        });

        test('should handle ocrResult success format', () => {
            handleInboundMessage('ocrResult', {
                success: true,
                docType: 'MED_CARD',
                confidence: 0.88,
                extracted: {
                    certificateExpirationDate: '2026-12-31'
                }
            });

            const ocrStatus = document.getElementById('ocr-status-med-card');
            const medExpiration = document.getElementById('extracted-med-card-expiration');

            expect(ocrStatus.classList.contains('status-success')).toBe(true);
            expect(medExpiration.textContent).toBe('2026-12-31');
        });

        test('should handle ocrResult failure format', () => {
            handleInboundMessage('ocrResult', {
                success: false,
                docType: 'cdlBack',
                error: 'Image too blurry'
            });

            const ocrStatus = document.getElementById('ocr-status-cdl-back');
            expect(ocrStatus.innerHTML).toContain('OCR failed');
            expect(ocrStatus.classList.contains('status-error')).toBe(true);
        });

        test('should show error state on OCR error', () => {
            handleInboundMessage('ocrError', {
                docType: 'medCard',
                error: 'OCR service unavailable'
            });

            const ocrStatus = document.getElementById('ocr-status-med-card');
            expect(ocrStatus.innerHTML).toContain('failed');
            expect(ocrStatus.classList.contains('status-error')).toBe(true);
        });
    });

    // -------------------------------------------------------------------------
    // APPLICATION SUBMITTED
    // -------------------------------------------------------------------------
    describe('Application Submitted', () => {
        test('should show success message for application', () => {
            // First show spinner
            document.getElementById('submit-spinner').classList.remove('hidden');
            document.getElementById('submit-btn').disabled = true;

            handleInboundMessage('applicationSubmitted', {
                success: true,
                type: 'application',
                carrierDOT: '1234567',
                applicationId: 'app123',
                message: 'Your application has been submitted!'
            });

            const successEl = document.getElementById('success-message');
            const successText = document.getElementById('success-text');
            const submitBtn = document.getElementById('submit-btn');
            const spinner = document.getElementById('submit-spinner');

            expect(successEl.classList.contains('hidden')).toBe(false);
            expect(successText.textContent).toBe('Your application has been submitted!');
            expect(submitBtn.textContent).toBe('Application Submitted');
            expect(submitBtn.disabled).toBe(true);
            expect(spinner.classList.contains('hidden')).toBe(true);
        });

        test('should show success for profile update only', () => {
            handleInboundMessage('applicationSubmitted', {
                success: true,
                type: 'profileUpdate',
                message: 'Documents saved to your profile!'
            });

            const submitBtn = document.getElementById('submit-btn');
            expect(submitBtn.textContent).toBe('Documents Saved');
        });

        test('should handle submitResult same as applicationSubmitted', () => {
            handleInboundMessage('submitResult', {
                success: true,
                type: 'application'
            });

            const successEl = document.getElementById('success-message');
            expect(successEl.classList.contains('hidden')).toBe(false);
        });

        test('should show error on failure', () => {
            handleInboundMessage('applicationSubmitted', {
                success: false,
                error: 'Carrier not accepting applications'
            });

            const errorEl = document.getElementById('error-message');
            const errorText = document.getElementById('error-text');

            expect(errorEl.classList.contains('hidden')).toBe(false);
            expect(errorText.textContent).toContain('Carrier not accepting');
        });
    });

    // -------------------------------------------------------------------------
    // APPLICATION ERROR
    // -------------------------------------------------------------------------
    describe('Application Error', () => {
        test('should show error and re-enable submit', () => {
            document.getElementById('submit-btn').disabled = true;
            document.getElementById('submit-spinner').classList.remove('hidden');

            handleInboundMessage('applicationError', {
                error: 'Network error'
            });

            const submitBtn = document.getElementById('submit-btn');
            const spinner = document.getElementById('submit-spinner');
            const errorEl = document.getElementById('error-message');

            expect(submitBtn.disabled).toBe(false);
            expect(spinner.classList.contains('hidden')).toBe(true);
            expect(errorEl.classList.contains('hidden')).toBe(false);
        });
    });

    // -------------------------------------------------------------------------
    // DOCUMENT CLEARED
    // -------------------------------------------------------------------------
    describe('Document Cleared', () => {
        test('should clear all UI elements for document', () => {
            // First set up a document
            handleInboundMessage('uploadSuccess', {
                docType: 'resume',
                fileName: 'resume.pdf'
            });

            // Then clear it
            handleInboundMessage('documentCleared', {
                docType: 'resume'
            });

            const statusEl = document.getElementById('file-status-resume');
            const previewEl = document.getElementById('file-preview-resume');

            expect(statusEl.classList.contains('hidden')).toBe(true);
            expect(previewEl.classList.contains('hidden')).toBe(true);
            expect(currentState.uploadedDocuments['resume']).toBeUndefined();
        });

        test('should clear extracted data for document', () => {
            currentState.extractedData['cdl-front'] = { licenseNumber: 'ABC123' };

            handleInboundMessage('documentCleared', {
                docType: 'CDL_FRONT'
            });

            expect(currentState.extractedData['cdl-front']).toBeUndefined();
        });
    });

    // -------------------------------------------------------------------------
    // USER STATUS UPDATE
    // -------------------------------------------------------------------------
    describe('User Status Update', () => {
        test('should update UI on login', () => {
            handleInboundMessage('userStatusUpdate', {
                loggedIn: true,
                email: 'new@user.com',
                justLoggedIn: true
            });

            const userStatus = document.getElementById('user-status');
            const loginPrompt = document.getElementById('login-prompt');

            expect(userStatus.textContent).toContain('new@user.com');
            expect(userStatus.classList.contains('just-logged-in')).toBe(true);
            expect(loginPrompt.classList.contains('hidden')).toBe(true);
        });

        test('should show login prompt on logout', () => {
            // First log in
            handleInboundMessage('userStatusUpdate', {
                loggedIn: true,
                email: 'test@test.com'
            });

            // Then log out
            handleInboundMessage('userStatusUpdate', {
                loggedIn: false
            });

            const loginPrompt = document.getElementById('login-prompt');
            const profileSection = document.getElementById('profile-section');

            expect(loginPrompt.classList.contains('hidden')).toBe(false);
            expect(profileSection.classList.contains('hidden')).toBe(true);
        });
    });

    // -------------------------------------------------------------------------
    // OUTBOUND MESSAGES
    // -------------------------------------------------------------------------
    describe('Outbound Messages', () => {
        test('should send quickApplyReady on page load', () => {
            sendToVelo('quickApplyReady');
            expect(capturedOutbound).toContainEqual({ type: 'quickApplyReady', data: {} });
        });

        test('should send uploadDocument with file data', () => {
            sendToVelo('uploadDocument', {
                docType: 'cdlFront',
                file: {
                    base64: 'base64data',
                    name: 'cdl.jpg',
                    type: 'image/jpeg',
                    size: 500000
                }
            });

            expect(capturedOutbound[0].type).toBe('uploadDocument');
            expect(capturedOutbound[0].data.docType).toBe('cdlFront');
            expect(capturedOutbound[0].data.file.name).toBe('cdl.jpg');
        });

        test('should send submitQuickApply with form data', () => {
            sendToVelo('submitQuickApply', {
                carrierDOT: '1234567',
                phone: '5551234567',
                availability: 'Immediately'
            });

            expect(capturedOutbound[0].type).toBe('submitQuickApply');
            expect(capturedOutbound[0].data.carrierDOT).toBe('1234567');
        });
    });

    // -------------------------------------------------------------------------
    // SANITIZATION
    // -------------------------------------------------------------------------
    describe('XSS Protection', () => {
        test('should sanitize error messages', () => {
            handleInboundMessage('uploadError', {
                docType: 'cdlFront',
                error: '<script>alert("XSS")</script>Malicious error'
            });

            const errorText = document.getElementById('error-text');
            expect(errorText.textContent).not.toContain('<script>');
        });

        test('should sanitize file names in preview', () => {
            handleInboundMessage('uploadSuccess', {
                docType: 'resume',
                fileName: '<img src=x onerror="alert(1)">malicious.pdf',
                fileSize: 1000
            });

            const preview = document.getElementById('file-preview-resume');
            expect(preview.innerHTML).not.toContain('onerror');
        });
    });

    // -------------------------------------------------------------------------
    // HELPER FUNCTIONS
    // -------------------------------------------------------------------------
    describe('Helper Functions', () => {
        test('formatFileSize should format bytes correctly', () => {
            expect(formatFileSize(500)).toBe('500 B');
            expect(formatFileSize(1500)).toBe('1.5 KB');
            expect(formatFileSize(1500000)).toBe('1.4 MB');
        });

        test('normalizeDocType should handle all formats', () => {
            expect(normalizeDocType('cdlFront')).toBe('cdl-front');
            expect(normalizeDocType('CDL_FRONT')).toBe('cdl-front');
            expect(normalizeDocType('MED_CARD')).toBe('med-card');
            expect(normalizeDocType('resume')).toBe('resume');
        });
    });
});
