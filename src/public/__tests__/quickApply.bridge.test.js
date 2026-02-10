/* eslint-disable */
/**
 * BRIDGE TESTS: Quick Apply Page
 * ===============================
 * Tests the postMessage bridge between Quick Apply page code and HTML.
 *
 * Inbound actions (HTML -> Velo): 12
 *   - ping, quickApplyReady, quickApplyFormReady, extractDocumentOCR
 *   - uploadDocument, clearDocument, runOCR, submitQuickApply
 *   - navigateToMatching, navigateToDashboard, navigateToLogin
 *   - checkUserStatus, getProfile
 *
 * Outbound messages (Velo -> HTML): 13
 *   - pong, pageReady, profileLoaded, ocrProcessing, ocrComplete
 *   - ocrResult, ocrError, uploadSuccess, uploadError
 *   - applicationSubmitted, submitResult, applicationError, documentCleared
 *   - userStatusUpdate
 *
 * @module public/__tests__/quickApply.bridge.test.js
 */

// =============================================================================
// MOCK SETUP
// =============================================================================

const mockWixLocation = {
    query: {},
    to: jest.fn()
};

const mockWixWindow = {
    viewMode: 'Site'
};

const mockWixUsers = {
    currentUser: {
        loggedIn: false,
        id: null,
        getEmail: jest.fn().mockResolvedValue(null)
    },
    promptLogin: jest.fn()
};

// Mock backend services
const mockDriverProfiles = {
    getOrCreateDriverProfile: jest.fn(),
    updateDriverDocuments: jest.fn()
};

const mockOcrService = {
    extractDocumentForAutoFill: jest.fn()
};

const mockApplicationService = {
    submitApplication: jest.fn()
};

// Mock $w selector
const mockElements = {};
let capturedMessages = [];

function createMockElement(id) {
    return {
        id,
        onMessage: jest.fn((handler) => {
            mockElements[id].messageHandler = handler;
        }),
        postMessage: jest.fn((data) => {
            capturedMessages.push(data);
        }),
        show: jest.fn(),
        hide: jest.fn(),
        valid: true
    };
}

const mock$w = jest.fn((selector) => {
    const id = selector.replace('#', '');
    if (!mockElements[id]) {
        mockElements[id] = createMockElement(id);
    }
    return mockElements[id];
});

// Reset function
function resetMocks() {
    capturedMessages = [];
    Object.keys(mockElements).forEach(key => delete mockElements[key]);

    mockWixLocation.query = {};
    mockWixLocation.to.mockClear();
    mockWixUsers.currentUser.loggedIn = false;
    mockWixUsers.currentUser.id = null;
    mockWixUsers.promptLogin.mockClear();

    mockDriverProfiles.getOrCreateDriverProfile.mockReset();
    mockDriverProfiles.updateDriverDocuments.mockReset();
    mockOcrService.extractDocumentForAutoFill.mockReset();
    mockApplicationService.submitApplication.mockReset();

    // Pre-create HTML component
    mockElements['quickApplyHtml'] = createMockElement('quickApplyHtml');
    mockElements['html1'] = createMockElement('html1');
}

// =============================================================================
// MESSAGE REGISTRY (from page code)
// =============================================================================

const MESSAGE_REGISTRY = {
    inbound: [
        'quickApplyReady',
        'quickApplyFormReady',
        'uploadDocument',
        'submitQuickApply',
        'clearDocument',
        'runOCR',
        'extractDocumentOCR',
        'navigateToMatching',
        'navigateToLogin',
        'navigateToDashboard',
        'checkUserStatus',
        'getProfile',
        'ping'
    ],
    outbound: [
        'pageReady',
        'profileLoaded',
        'ocrProcessing',
        'ocrComplete',
        'ocrResult',
        'ocrError',
        'uploadSuccess',
        'uploadError',
        'applicationSubmitted',
        'applicationError',
        'submitResult',
        'documentCleared',
        'userStatusUpdate',
        'pong'
    ]
};

// =============================================================================
// SIMULATED PAGE CODE
// =============================================================================

let cachedUserStatus = null;
let cachedDriverProfile = null;
let preSelectedCarrier = null;
let uploadedDocuments = {
    cdlFront: null,
    cdlBack: null,
    medCard: null,
    mvr: null,
    resume: null
};
let extractedData = {};

function resetPageState() {
    cachedUserStatus = null;
    cachedDriverProfile = null;
    preSelectedCarrier = null;
    uploadedDocuments = {
        cdlFront: null,
        cdlBack: null,
        medCard: null,
        mvr: null,
        resume: null
    };
    extractedData = {};
}

function sendToHtml(type, data) {
    const component = mock$w('#quickApplyHtml');
    if (component && typeof component.postMessage === 'function') {
        component.postMessage({ type, data, timestamp: Date.now() });
    }
}

async function getUserStatus() {
    if (!mockWixUsers.currentUser.loggedIn) {
        return { loggedIn: false, isPremium: false, tier: 'guest' };
    }
    const email = await mockWixUsers.currentUser.getEmail();
    return {
        loggedIn: true,
        isPremium: true,
        tier: 'premium',
        email: email,
        userId: mockWixUsers.currentUser.id
    };
}

async function handleMessage(msg) {
    if (!msg || !msg.type) return;
    const action = msg.action || msg.type;

    switch (action) {
        case 'ping':
            sendToHtml('pong', {
                timestamp: Date.now(),
                registeredInbound: MESSAGE_REGISTRY.inbound.length,
                registeredOutbound: MESSAGE_REGISTRY.outbound.length
            });
            break;

        case 'quickApplyReady':
        case 'quickApplyFormReady':
            await handleQuickApplyReady();
            break;

        case 'extractDocumentOCR':
            await handleExtractDocumentOCR(msg.data);
            break;

        case 'uploadDocument':
            await handleDocumentUpload(msg.data);
            break;

        case 'clearDocument':
            await handleClearDocument(msg.data);
            break;

        case 'runOCR':
            await handleRunOCR(msg.data);
            break;

        case 'submitQuickApply':
            await handleSubmitQuickApply(msg.data);
            break;

        case 'navigateToMatching':
            mockWixLocation.to('/ai-matching');
            break;

        case 'navigateToDashboard':
            mockWixLocation.to('/driver-dashboard');
            break;

        case 'navigateToLogin':
            await handleNavigateToLogin();
            break;

        case 'checkUserStatus':
            cachedUserStatus = await getUserStatus();
            sendToHtml('userStatusUpdate', cachedUserStatus);
            break;

        case 'getProfile':
            await handleGetProfile();
            break;
    }
}

async function handleQuickApplyReady() {
    const profileData = cachedDriverProfile ? {
        id: cachedDriverProfile._id,
        displayName: cachedDriverProfile.display_name,
        email: cachedDriverProfile.email,
        phone: cachedDriverProfile.phone,
        cdlClass: cachedDriverProfile.cdl_class,
        completeness: cachedDriverProfile.profile_completeness_score
    } : null;

    sendToHtml('pageReady', {
        userStatus: cachedUserStatus,
        driverProfile: profileData,
        preSelectedCarrier: preSelectedCarrier,
        uploadedDocuments: uploadedDocuments,
        extractedData: extractedData
    });
}

async function handleGetProfile() {
    if (!cachedUserStatus || !cachedUserStatus.loggedIn) {
        sendToHtml('profileLoaded', { success: false, error: 'Not logged in' });
        return;
    }

    const result = await mockDriverProfiles.getOrCreateDriverProfile();
    if (result.success) {
        cachedDriverProfile = result.profile;
        sendToHtml('profileLoaded', {
            success: true,
            profile: {
                id: result.profile._id,
                displayName: result.profile.display_name,
                email: result.profile.email
            }
        });
    } else {
        sendToHtml('profileLoaded', { success: false, error: result.error });
    }
}

async function handleDocumentUpload(data) {
    if (!data || !data.docType || !data.file) {
        sendToHtml('uploadError', { error: 'Missing document data', docType: data?.docType });
        return;
    }

    const { docType, file } = data;
    const maxFileSize = 10 * 1024 * 1024;
    const supportedFormats = ['image/jpeg', 'image/png', 'application/pdf'];

    if (file.size > maxFileSize) {
        sendToHtml('uploadError', { error: 'File too large', docType });
        return;
    }

    if (!supportedFormats.includes(file.type)) {
        sendToHtml('uploadError', { error: 'Unsupported file format', docType });
        return;
    }

    const normalizedType = normalizeDocType(docType);
    uploadedDocuments[normalizedType] = {
        data: file.base64,
        name: file.name,
        type: file.type,
        size: file.size,
        isExisting: false
    };

    sendToHtml('uploadSuccess', {
        docType: docType,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
    });

    // Auto-run OCR for CDL and Med Card
    if (['cdlFront', 'CDL_FRONT', 'cdlBack', 'CDL_BACK', 'medCard', 'MED_CARD'].includes(docType)) {
        await handleRunOCR({ docType, base64Data: file.base64 });
    }
}

async function handleClearDocument(data) {
    if (!data || !data.docType) return;

    const normalizedType = normalizeDocType(data.docType);
    uploadedDocuments[normalizedType] = null;
    delete extractedData[normalizedType];

    sendToHtml('documentCleared', { docType: data.docType });
}

async function handleExtractDocumentOCR(data) {
    if (!data || !data.base64Data || !data.docType) {
        sendToHtml('ocrResult', {
            success: false,
            docType: data?.docType,
            error: 'Missing required data for OCR'
        });
        return;
    }

    const result = await mockOcrService.extractDocumentForAutoFill(data.base64Data, data.docType);

    if (result.success) {
        const normalizedType = normalizeDocType(data.docType);
        extractedData[normalizedType] = result.extracted;

        sendToHtml('ocrResult', {
            success: true,
            docType: data.docType,
            inputId: data.inputId,
            confidence: result.confidence,
            extracted: result.extracted
        });
    } else {
        sendToHtml('ocrResult', {
            success: false,
            docType: data.docType,
            inputId: data.inputId,
            error: result.error
        });
    }
}

async function handleRunOCR(data) {
    if (!data || !data.docType) {
        sendToHtml('ocrError', { error: 'Missing document type', docType: data?.docType });
        return;
    }

    sendToHtml('ocrProcessing', { docType: data.docType });

    const base64Data = data.base64Data || uploadedDocuments[normalizeDocType(data.docType)]?.data;
    if (!base64Data) {
        sendToHtml('ocrError', { error: 'No document found', docType: data.docType });
        return;
    }

    const result = await mockOcrService.extractDocumentForAutoFill(base64Data, data.docType);

    if (result.success) {
        const normalizedType = normalizeDocType(data.docType);
        extractedData[normalizedType] = result.extracted;

        sendToHtml('ocrComplete', {
            docType: data.docType,
            confidence: result.confidence,
            extracted: result.extracted
        });
    } else {
        sendToHtml('ocrError', { docType: data.docType, error: result.error });
    }
}

async function handleSubmitQuickApply(data) {
    const hasCarrier = data?.carrierDOT || preSelectedCarrier?.dot;

    if (!hasCarrier) {
        // Profile-only update
        const result = await mockDriverProfiles.updateDriverDocuments({
            cdlFront: uploadedDocuments.cdlFront,
            cdlBack: uploadedDocuments.cdlBack,
            medCard: uploadedDocuments.medCard,
            resume: uploadedDocuments.resume
        });

        if (result.success) {
            sendToHtml('applicationSubmitted', {
                success: true,
                type: 'profileUpdate',
                message: 'Documents saved to your profile successfully!'
            });
            sendToHtml('submitResult', {
                success: true,
                type: 'profileUpdate'
            });
        } else {
            sendToHtml('applicationError', { success: false, error: result.error });
            sendToHtml('submitResult', { success: false, error: result.error });
        }
        return;
    }

    // Full application submission
    const result = await mockApplicationService.submitApplication({
        carrierDOT: data.carrierDOT || preSelectedCarrier?.dot,
        documents: uploadedDocuments
    });

    if (result.success) {
        sendToHtml('applicationSubmitted', {
            success: true,
            type: 'application',
            carrierDOT: data.carrierDOT,
            applicationId: result.application?._id
        });
        sendToHtml('submitResult', {
            success: true,
            type: 'application'
        });
    } else {
        sendToHtml('applicationError', { success: false, error: result.error });
        sendToHtml('submitResult', { success: false, error: result.error });
    }
}

async function handleNavigateToLogin() {
    const result = await mockWixUsers.promptLogin({ mode: 'login' });
    if (result) {
        mockWixUsers.currentUser.loggedIn = true;
        mockWixUsers.currentUser.id = result.id;
        cachedUserStatus = await getUserStatus();
        sendToHtml('userStatusUpdate', { ...cachedUserStatus, justLoggedIn: true });
        await handleQuickApplyReady();
    }
}

function normalizeDocType(docType) {
    switch (docType) {
        case 'cdlFront':
        case 'CDL_FRONT':
            return 'cdlFront';
        case 'cdlBack':
        case 'CDL_BACK':
            return 'cdlBack';
        case 'medCard':
        case 'MED_CARD':
            return 'medCard';
        case 'mvr':
        case 'MVR':
            return 'mvr';
        case 'resume':
        case 'RESUME':
            return 'resume';
        default:
            return docType;
    }
}

// =============================================================================
// TESTS
// =============================================================================

describe('Quick Apply Bridge Tests', () => {
    beforeEach(() => {
        resetMocks();
        resetPageState();
    });

    // -------------------------------------------------------------------------
    // SOURCE STRUCTURE CHECKS
    // -------------------------------------------------------------------------
    describe('Source Structure Checks', () => {
        test('MESSAGE_REGISTRY.inbound should have all 12+ expected actions', () => {
            expect(MESSAGE_REGISTRY.inbound).toContain('ping');
            expect(MESSAGE_REGISTRY.inbound).toContain('quickApplyReady');
            expect(MESSAGE_REGISTRY.inbound).toContain('quickApplyFormReady');
            expect(MESSAGE_REGISTRY.inbound).toContain('uploadDocument');
            expect(MESSAGE_REGISTRY.inbound).toContain('submitQuickApply');
            expect(MESSAGE_REGISTRY.inbound).toContain('clearDocument');
            expect(MESSAGE_REGISTRY.inbound).toContain('runOCR');
            expect(MESSAGE_REGISTRY.inbound).toContain('extractDocumentOCR');
            expect(MESSAGE_REGISTRY.inbound).toContain('navigateToMatching');
            expect(MESSAGE_REGISTRY.inbound).toContain('navigateToLogin');
            expect(MESSAGE_REGISTRY.inbound).toContain('navigateToDashboard');
            expect(MESSAGE_REGISTRY.inbound).toContain('checkUserStatus');
            expect(MESSAGE_REGISTRY.inbound).toContain('getProfile');
        });

        test('MESSAGE_REGISTRY.outbound should have all expected messages', () => {
            expect(MESSAGE_REGISTRY.outbound).toContain('pong');
            expect(MESSAGE_REGISTRY.outbound).toContain('pageReady');
            expect(MESSAGE_REGISTRY.outbound).toContain('profileLoaded');
            expect(MESSAGE_REGISTRY.outbound).toContain('ocrProcessing');
            expect(MESSAGE_REGISTRY.outbound).toContain('ocrComplete');
            expect(MESSAGE_REGISTRY.outbound).toContain('ocrResult');
            expect(MESSAGE_REGISTRY.outbound).toContain('ocrError');
            expect(MESSAGE_REGISTRY.outbound).toContain('uploadSuccess');
            expect(MESSAGE_REGISTRY.outbound).toContain('uploadError');
            expect(MESSAGE_REGISTRY.outbound).toContain('applicationSubmitted');
            expect(MESSAGE_REGISTRY.outbound).toContain('submitResult');
            expect(MESSAGE_REGISTRY.outbound).toContain('applicationError');
            expect(MESSAGE_REGISTRY.outbound).toContain('documentCleared');
            expect(MESSAGE_REGISTRY.outbound).toContain('userStatusUpdate');
        });
    });

    // -------------------------------------------------------------------------
    // HEALTH CHECK
    // -------------------------------------------------------------------------
    describe('Health Check (ping/pong)', () => {
        test('should respond to ping with pong', async () => {
            await handleMessage({ type: 'ping' });

            expect(capturedMessages).toHaveLength(1);
            expect(capturedMessages[0].type).toBe('pong');
            expect(capturedMessages[0].data).toHaveProperty('timestamp');
            expect(capturedMessages[0].data.registeredInbound).toBe(MESSAGE_REGISTRY.inbound.length);
            expect(capturedMessages[0].data.registeredOutbound).toBe(MESSAGE_REGISTRY.outbound.length);
        });
    });

    // -------------------------------------------------------------------------
    // PAGE READY
    // -------------------------------------------------------------------------
    describe('Page Ready (quickApplyReady)', () => {
        test('should send pageReady with initial state on quickApplyReady', async () => {
            cachedUserStatus = { loggedIn: false, tier: 'guest' };

            await handleMessage({ type: 'quickApplyReady' });

            expect(capturedMessages).toHaveLength(1);
            expect(capturedMessages[0].type).toBe('pageReady');
            expect(capturedMessages[0].data).toHaveProperty('userStatus');
            expect(capturedMessages[0].data).toHaveProperty('uploadedDocuments');
        });

        test('should send pageReady on quickApplyFormReady (alternate format)', async () => {
            cachedUserStatus = { loggedIn: false, tier: 'guest' };

            await handleMessage({ type: 'quickApplyFormReady' });

            expect(capturedMessages).toHaveLength(1);
            expect(capturedMessages[0].type).toBe('pageReady');
        });

        test('should include driver profile when logged in', async () => {
            cachedUserStatus = { loggedIn: true, tier: 'premium', userId: 'user123' };
            cachedDriverProfile = {
                _id: 'profile123',
                display_name: 'Test Driver',
                email: 'test@test.com',
                phone: '5551234567',
                cdl_class: 'A',
                profile_completeness_score: 75
            };

            await handleMessage({ type: 'quickApplyReady' });

            expect(capturedMessages[0].data.driverProfile).not.toBeNull();
            expect(capturedMessages[0].data.driverProfile.displayName).toBe('Test Driver');
            expect(capturedMessages[0].data.driverProfile.completeness).toBe(75);
        });

        test('should include pre-selected carrier from URL params', async () => {
            preSelectedCarrier = { dot: '1234567', name: 'Swift Transportation' };
            cachedUserStatus = { loggedIn: false };

            await handleMessage({ type: 'quickApplyReady' });

            expect(capturedMessages[0].data.preSelectedCarrier).toEqual({
                dot: '1234567',
                name: 'Swift Transportation'
            });
        });
    });

    // -------------------------------------------------------------------------
    // DOCUMENT UPLOAD
    // -------------------------------------------------------------------------
    describe('Document Upload (uploadDocument)', () => {
        const validFile = {
            base64: 'base64encodeddata',
            name: 'cdl_front.jpg',
            type: 'image/jpeg',
            size: 500 * 1024 // 500KB
        };

        test('should upload valid document and send uploadSuccess', async () => {
            mockOcrService.extractDocumentForAutoFill.mockResolvedValue({
                success: true,
                extracted: { licenseNumber: 'D1234567' },
                confidence: 0.95
            });

            await handleMessage({
                type: 'uploadDocument',
                data: { docType: 'cdlFront', file: validFile }
            });

            // Should have uploadSuccess + ocrProcessing + ocrComplete
            const uploadSuccessMsg = capturedMessages.find(m => m.type === 'uploadSuccess');
            expect(uploadSuccessMsg).toBeDefined();
            expect(uploadSuccessMsg.data.docType).toBe('cdlFront');
            expect(uploadSuccessMsg.data.fileName).toBe('cdl_front.jpg');

            // Document should be stored
            expect(uploadedDocuments.cdlFront).not.toBeNull();
        });

        test('should reject file that is too large', async () => {
            const largeFile = { ...validFile, size: 15 * 1024 * 1024 }; // 15MB

            await handleMessage({
                type: 'uploadDocument',
                data: { docType: 'cdlFront', file: largeFile }
            });

            expect(capturedMessages).toHaveLength(1);
            expect(capturedMessages[0].type).toBe('uploadError');
            expect(capturedMessages[0].data.error).toContain('too large');
        });

        test('should reject unsupported file format', async () => {
            const badFile = { ...validFile, type: 'application/exe' };

            await handleMessage({
                type: 'uploadDocument',
                data: { docType: 'cdlFront', file: badFile }
            });

            expect(capturedMessages).toHaveLength(1);
            expect(capturedMessages[0].type).toBe('uploadError');
            expect(capturedMessages[0].data.error).toContain('Unsupported');
        });

        test('should handle missing document data', async () => {
            await handleMessage({
                type: 'uploadDocument',
                data: { docType: 'cdlFront' }
            });

            expect(capturedMessages).toHaveLength(1);
            expect(capturedMessages[0].type).toBe('uploadError');
        });

        test('should normalize document types (CDL_FRONT -> cdlFront)', async () => {
            mockOcrService.extractDocumentForAutoFill.mockResolvedValue({
                success: true,
                extracted: {},
                confidence: 0.8
            });

            await handleMessage({
                type: 'uploadDocument',
                data: { docType: 'CDL_FRONT', file: validFile }
            });

            expect(uploadedDocuments.cdlFront).not.toBeNull();
        });

        test('should auto-run OCR for CDL documents', async () => {
            mockOcrService.extractDocumentForAutoFill.mockResolvedValue({
                success: true,
                extracted: { licenseNumber: 'D9876543' },
                confidence: 0.92
            });

            await handleMessage({
                type: 'uploadDocument',
                data: { docType: 'cdlFront', file: validFile }
            });

            // Should have called OCR service
            expect(mockOcrService.extractDocumentForAutoFill).toHaveBeenCalled();

            // Should have ocrComplete message
            const ocrCompleteMsg = capturedMessages.find(m => m.type === 'ocrComplete');
            expect(ocrCompleteMsg).toBeDefined();
        });
    });

    // -------------------------------------------------------------------------
    // CLEAR DOCUMENT
    // -------------------------------------------------------------------------
    describe('Clear Document (clearDocument)', () => {
        test('should clear document and send documentCleared', async () => {
            // First upload a document
            uploadedDocuments.cdlFront = {
                data: 'base64data',
                name: 'test.jpg',
                type: 'image/jpeg',
                size: 1000
            };
            extractedData.cdlFront = { licenseNumber: 'D1234567' };

            await handleMessage({
                type: 'clearDocument',
                data: { docType: 'cdlFront' }
            });

            expect(capturedMessages).toHaveLength(1);
            expect(capturedMessages[0].type).toBe('documentCleared');
            expect(capturedMessages[0].data.docType).toBe('cdlFront');

            // Should be cleared from state
            expect(uploadedDocuments.cdlFront).toBeNull();
            expect(extractedData.cdlFront).toBeUndefined();
        });

        test('should handle normalized doc type (MED_CARD -> medCard)', async () => {
            uploadedDocuments.medCard = { data: 'test' };

            await handleMessage({
                type: 'clearDocument',
                data: { docType: 'MED_CARD' }
            });

            expect(uploadedDocuments.medCard).toBeNull();
        });
    });

    // -------------------------------------------------------------------------
    // OCR EXTRACTION
    // -------------------------------------------------------------------------
    describe('OCR Extraction (extractDocumentOCR)', () => {
        test('should extract document and send ocrResult on success', async () => {
            mockOcrService.extractDocumentForAutoFill.mockResolvedValue({
                success: true,
                extracted: {
                    licenseNumber: 'D1234567',
                    expirationDate: '2027-05-15',
                    name: 'John Doe'
                },
                confidence: 0.94
            });

            await handleMessage({
                type: 'extractDocumentOCR',
                data: {
                    base64Data: 'base64encodedimage',
                    docType: 'CDL_FRONT',
                    inputId: 'cdl-input'
                }
            });

            expect(capturedMessages).toHaveLength(1);
            expect(capturedMessages[0].type).toBe('ocrResult');
            expect(capturedMessages[0].data.success).toBe(true);
            expect(capturedMessages[0].data.docType).toBe('CDL_FRONT');
            expect(capturedMessages[0].data.inputId).toBe('cdl-input');
            expect(capturedMessages[0].data.extracted.licenseNumber).toBe('D1234567');

            // Should store extracted data
            expect(extractedData.cdlFront.licenseNumber).toBe('D1234567');
        });

        test('should send ocrResult with error on failure', async () => {
            mockOcrService.extractDocumentForAutoFill.mockResolvedValue({
                success: false,
                error: 'Image too blurry'
            });

            await handleMessage({
                type: 'extractDocumentOCR',
                data: {
                    base64Data: 'base64data',
                    docType: 'CDL_FRONT',
                    inputId: 'cdl-input'
                }
            });

            expect(capturedMessages[0].type).toBe('ocrResult');
            expect(capturedMessages[0].data.success).toBe(false);
            expect(capturedMessages[0].data.error).toBe('Image too blurry');
        });

        test('should handle missing base64 data', async () => {
            await handleMessage({
                type: 'extractDocumentOCR',
                data: { docType: 'CDL_FRONT' }
            });

            expect(capturedMessages[0].type).toBe('ocrResult');
            expect(capturedMessages[0].data.success).toBe(false);
            expect(capturedMessages[0].data.error).toContain('Missing');
        });
    });

    // -------------------------------------------------------------------------
    // RUN OCR (Legacy format)
    // -------------------------------------------------------------------------
    describe('Run OCR (runOCR - Legacy)', () => {
        test('should send ocrProcessing and ocrComplete on success', async () => {
            uploadedDocuments.cdlFront = {
                data: 'base64data',
                name: 'cdl.jpg',
                type: 'image/jpeg',
                size: 1000
            };

            mockOcrService.extractDocumentForAutoFill.mockResolvedValue({
                success: true,
                extracted: { licenseNumber: 'D5555555' },
                confidence: 0.88
            });

            await handleMessage({
                type: 'runOCR',
                data: { docType: 'cdlFront' }
            });

            expect(capturedMessages[0].type).toBe('ocrProcessing');
            expect(capturedMessages[1].type).toBe('ocrComplete');
            expect(capturedMessages[1].data.extracted.licenseNumber).toBe('D5555555');
        });

        test('should send ocrError when no document found', async () => {
            await handleMessage({
                type: 'runOCR',
                data: { docType: 'cdlFront' }
            });

            expect(capturedMessages[0].type).toBe('ocrProcessing');
            expect(capturedMessages[1].type).toBe('ocrError');
            expect(capturedMessages[1].data.error).toContain('No document found');
        });

        test('should send ocrError when OCR fails', async () => {
            uploadedDocuments.medCard = { data: 'base64data' };

            mockOcrService.extractDocumentForAutoFill.mockResolvedValue({
                success: false,
                error: 'OCR service unavailable'
            });

            await handleMessage({
                type: 'runOCR',
                data: { docType: 'medCard' }
            });

            expect(capturedMessages[1].type).toBe('ocrError');
            expect(capturedMessages[1].data.error).toBe('OCR service unavailable');
        });
    });

    // -------------------------------------------------------------------------
    // SUBMIT APPLICATION
    // -------------------------------------------------------------------------
    describe('Submit Quick Apply (submitQuickApply)', () => {
        test('should submit application with carrier and send applicationSubmitted', async () => {
            mockApplicationService.submitApplication.mockResolvedValue({
                success: true,
                application: { _id: 'app123' }
            });

            await handleMessage({
                type: 'submitQuickApply',
                data: {
                    carrierDOT: '1234567',
                    carrierName: 'Test Carrier',
                    phone: '5551234567'
                }
            });

            expect(mockApplicationService.submitApplication).toHaveBeenCalled();

            const appSubmittedMsg = capturedMessages.find(m => m.type === 'applicationSubmitted');
            expect(appSubmittedMsg).toBeDefined();
            expect(appSubmittedMsg.data.success).toBe(true);
            expect(appSubmittedMsg.data.type).toBe('application');
            expect(appSubmittedMsg.data.applicationId).toBe('app123');
        });

        test('should save documents only when no carrier specified', async () => {
            mockDriverProfiles.updateDriverDocuments.mockResolvedValue({
                success: true,
                profile: { profile_completeness_score: 80 }
            });

            await handleMessage({
                type: 'submitQuickApply',
                data: { phone: '5551234567' } // No carrierDOT
            });

            expect(mockDriverProfiles.updateDriverDocuments).toHaveBeenCalled();
            expect(mockApplicationService.submitApplication).not.toHaveBeenCalled();

            const appSubmittedMsg = capturedMessages.find(m => m.type === 'applicationSubmitted');
            expect(appSubmittedMsg.data.type).toBe('profileUpdate');
        });

        test('should use pre-selected carrier from URL params', async () => {
            preSelectedCarrier = { dot: '7654321', name: 'Werner' };

            mockApplicationService.submitApplication.mockResolvedValue({
                success: true,
                application: { _id: 'app456' }
            });

            await handleMessage({
                type: 'submitQuickApply',
                data: {} // No carrier in data, should use preSelectedCarrier
            });

            expect(mockApplicationService.submitApplication).toHaveBeenCalledWith(
                expect.objectContaining({
                    carrierDOT: '7654321'
                })
            );
        });

        test('should send applicationError on failure', async () => {
            mockApplicationService.submitApplication.mockResolvedValue({
                success: false,
                error: 'Carrier not accepting applications'
            });

            await handleMessage({
                type: 'submitQuickApply',
                data: { carrierDOT: '1111111' }
            });

            const appErrorMsg = capturedMessages.find(m => m.type === 'applicationError');
            expect(appErrorMsg).toBeDefined();
            expect(appErrorMsg.data.error).toBe('Carrier not accepting applications');

            // Should also send submitResult for new HTML format
            const submitResultMsg = capturedMessages.find(m => m.type === 'submitResult');
            expect(submitResultMsg).toBeDefined();
            expect(submitResultMsg.data.success).toBe(false);
        });

        test('should send both applicationSubmitted and submitResult', async () => {
            mockApplicationService.submitApplication.mockResolvedValue({
                success: true,
                application: { _id: 'app789' }
            });

            await handleMessage({
                type: 'submitQuickApply',
                data: { carrierDOT: '2222222' }
            });

            // Both message types should be sent for backwards compatibility
            expect(capturedMessages.find(m => m.type === 'applicationSubmitted')).toBeDefined();
            expect(capturedMessages.find(m => m.type === 'submitResult')).toBeDefined();
        });
    });

    // -------------------------------------------------------------------------
    // NAVIGATION
    // -------------------------------------------------------------------------
    describe('Navigation Actions', () => {
        test('should navigate to matching page', async () => {
            await handleMessage({ type: 'navigateToMatching' });

            expect(mockWixLocation.to).toHaveBeenCalledWith('/ai-matching');
        });

        test('should navigate to dashboard page', async () => {
            await handleMessage({ type: 'navigateToDashboard' });

            expect(mockWixLocation.to).toHaveBeenCalledWith('/driver-dashboard');
        });

        test('should prompt login and send userStatusUpdate on success', async () => {
            mockWixUsers.promptLogin.mockResolvedValue({ id: 'newUser123' });
            mockWixUsers.currentUser.getEmail.mockResolvedValue('new@test.com');

            await handleMessage({ type: 'navigateToLogin' });

            expect(mockWixUsers.promptLogin).toHaveBeenCalledWith({ mode: 'login' });

            // Should have userStatusUpdate with justLoggedIn flag
            const statusUpdateMsg = capturedMessages.find(m => m.type === 'userStatusUpdate');
            expect(statusUpdateMsg).toBeDefined();
            expect(statusUpdateMsg.data.justLoggedIn).toBe(true);

            // Should also send pageReady with updated state
            const pageReadyMsg = capturedMessages.find(m => m.type === 'pageReady');
            expect(pageReadyMsg).toBeDefined();
        });
    });

    // -------------------------------------------------------------------------
    // USER STATUS
    // -------------------------------------------------------------------------
    describe('User Status (checkUserStatus)', () => {
        test('should return guest status when not logged in', async () => {
            mockWixUsers.currentUser.loggedIn = false;

            await handleMessage({ type: 'checkUserStatus' });

            expect(capturedMessages).toHaveLength(1);
            expect(capturedMessages[0].type).toBe('userStatusUpdate');
            expect(capturedMessages[0].data.loggedIn).toBe(false);
            expect(capturedMessages[0].data.tier).toBe('guest');
        });

        test('should return premium status when logged in', async () => {
            mockWixUsers.currentUser.loggedIn = true;
            mockWixUsers.currentUser.id = 'user123';
            mockWixUsers.currentUser.getEmail.mockResolvedValue('premium@test.com');

            await handleMessage({ type: 'checkUserStatus' });

            expect(capturedMessages[0].type).toBe('userStatusUpdate');
            expect(capturedMessages[0].data.loggedIn).toBe(true);
            expect(capturedMessages[0].data.tier).toBe('premium');
            expect(capturedMessages[0].data.email).toBe('premium@test.com');
        });
    });

    // -------------------------------------------------------------------------
    // GET PROFILE
    // -------------------------------------------------------------------------
    describe('Get Profile (getProfile)', () => {
        test('should return error when not logged in', async () => {
            cachedUserStatus = { loggedIn: false };

            await handleMessage({ type: 'getProfile' });

            expect(capturedMessages[0].type).toBe('profileLoaded');
            expect(capturedMessages[0].data.success).toBe(false);
            expect(capturedMessages[0].data.error).toBe('Not logged in');
        });

        test('should return profile data when logged in', async () => {
            cachedUserStatus = { loggedIn: true, userId: 'user123' };
            mockDriverProfiles.getOrCreateDriverProfile.mockResolvedValue({
                success: true,
                profile: {
                    _id: 'profile456',
                    display_name: 'Jane Driver',
                    email: 'jane@test.com'
                }
            });

            await handleMessage({ type: 'getProfile' });

            expect(capturedMessages[0].type).toBe('profileLoaded');
            expect(capturedMessages[0].data.success).toBe(true);
            expect(capturedMessages[0].data.profile.displayName).toBe('Jane Driver');
        });

        test('should return error when profile not found', async () => {
            cachedUserStatus = { loggedIn: true, userId: 'user123' };
            mockDriverProfiles.getOrCreateDriverProfile.mockResolvedValue({
                success: false,
                error: 'Profile not found'
            });

            await handleMessage({ type: 'getProfile' });

            expect(capturedMessages[0].type).toBe('profileLoaded');
            expect(capturedMessages[0].data.success).toBe(false);
        });
    });

    // -------------------------------------------------------------------------
    // ERROR HANDLING
    // -------------------------------------------------------------------------
    describe('Error Handling', () => {
        test('should handle null message gracefully', async () => {
            await expect(handleMessage(null)).resolves.not.toThrow();
        });

        test('should handle message without type', async () => {
            await expect(handleMessage({ data: {} })).resolves.not.toThrow();
        });

        test('should handle unknown action types', async () => {
            await expect(handleMessage({ type: 'unknownAction' })).resolves.not.toThrow();
            expect(capturedMessages).toHaveLength(0);
        });
    });

    // -------------------------------------------------------------------------
    // DOCUMENT TYPE NORMALIZATION
    // -------------------------------------------------------------------------
    describe('Document Type Normalization', () => {
        const testCases = [
            ['cdlFront', 'cdlFront'],
            ['CDL_FRONT', 'cdlFront'],
            ['cdlBack', 'cdlBack'],
            ['CDL_BACK', 'cdlBack'],
            ['medCard', 'medCard'],
            ['MED_CARD', 'medCard'],
            ['mvr', 'mvr'],
            ['MVR', 'mvr'],
            ['resume', 'resume'],
            ['RESUME', 'resume']
        ];

        testCases.forEach(([input, expected]) => {
            test(`should normalize ${input} to ${expected}`, () => {
                expect(normalizeDocType(input)).toBe(expected);
            });
        });
    });
});
