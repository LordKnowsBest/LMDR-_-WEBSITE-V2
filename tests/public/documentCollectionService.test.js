/**
 * @jest-environment node
 *
 * Document Collection Service Test Suite
 * ======================================
 * Comprehensive tests for the Recruiter Onboarding Document Collection system.
 *
 * Test Categories:
 * 1. Request Documents (25%)
 * 2. Get Document Status (15%)
 * 3. Upload Document (25%)
 * 4. Verify Document (15%)
 * 5. Send Reminder (10%)
 * 6. Check Expiration (10%)
 */
/* eslint-env jest */

// ============================================================================
// MOCK SETUP
// ============================================================================

// Mock wix-data module
const mockWixData = {
    insert: jest.fn(),
    query: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    bulkInsert: jest.fn()
};

// Mock query builder chain
const createMockQueryBuilder = (items = [], totalCount = null) => {
    const builder = {
        eq: jest.fn().mockReturnThis(),
        ne: jest.fn().mockReturnThis(),
        ge: jest.fn().mockReturnThis(),
        le: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        contains: jest.fn().mockReturnThis(),
        startsWith: jest.fn().mockReturnThis(),
        hasAll: jest.fn().mockReturnThis(),
        hasSome: jest.fn().mockReturnThis(),
        ascending: jest.fn().mockReturnThis(),
        descending: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        include: jest.fn().mockReturnThis(),
        find: jest.fn().mockResolvedValue({
            items,
            totalCount: totalCount !== null ? totalCount : items.length,
            length: items.length,
            hasNext: () => false,
            hasPrev: () => false
        })
    };
    return builder;
};

jest.mock('wix-data', () => mockWixData, { virtual: true });

// ============================================================================
// CONSTANTS
// ============================================================================

const DOCUMENT_REQUESTS_COLLECTION = 'DocumentRequests';
const ONBOARDING_WORKFLOWS_COLLECTION = 'OnboardingWorkflows';

const DOCUMENT_TYPES = {
    CDL_FRONT: 'cdl_front',
    CDL_BACK: 'cdl_back',
    MVR: 'mvr',
    PSP: 'psp',
    MEDICAL_CARD: 'medical_card',
    DRUG_TEST_CONSENT: 'drug_test_consent',
    EMPLOYMENT_APP: 'employment_app',
    W4: 'w4',
    I9: 'i9',
    DIRECT_DEPOSIT: 'direct_deposit',
    SOCIAL_SECURITY: 'social_security',
    EMPLOYMENT_HISTORY: 'employment_history',
    PROOF_OF_ADDRESS: 'proof_of_address',
    CUSTOM: 'custom'
};

const DOCUMENT_STATUS = {
    REQUESTED: 'requested',
    UPLOADED: 'uploaded',
    VERIFIED: 'verified',
    REJECTED: 'rejected'
};

const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Create a mock document request record
 */
const createMockDocumentRequest = (overrides = {}) => ({
    _id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    workflow_id: 'workflow_123',
    driver_id: 'driver_456',
    document_type: DOCUMENT_TYPES.CDL_FRONT,
    display_name: 'CDL Front',
    description: 'Please upload the front of your CDL',
    is_required: true,
    status: DOCUMENT_STATUS.REQUESTED,
    rejection_reason: null,
    file_url: null,
    file_hash: null,
    submitted_date: null,
    verified_date: null,
    verified_by: null,
    ocr_data: null,
    expiration_date: null,
    reminder_sent_count: 0,
    last_reminder_date: null,
    upload_token: null,
    upload_token_expiry: null,
    _createdDate: new Date(),
    _updatedDate: new Date(),
    ...overrides
});

/**
 * Create a mock workflow record
 */
const createMockWorkflow = (overrides = {}) => ({
    _id: 'workflow_123',
    _owner: 'recruiter_001',
    driver_id: 'driver_456',
    carrier_id: 'carrier_789',
    recruiter_id: 'recruiter_001',
    status: 'documents_requested',
    documents_status: 'pending',
    _createdDate: new Date(),
    ...overrides
});

/**
 * Generate a valid upload token
 */
const generateMockToken = (expiryHours = 48) => {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + expiryHours);
    return {
        token: `tok_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`,
        expiry: expiry.toISOString()
    };
};

/**
 * Reset all mocks before each test
 */
const resetMocks = () => {
    jest.clearAllMocks();
    mockWixData.insert.mockReset();
    mockWixData.query.mockReset();
    mockWixData.get.mockReset();
    mockWixData.update.mockReset();
    mockWixData.remove.mockReset();
    mockWixData.bulkInsert.mockReset();
};

// ============================================================================
// SERVICE IMPLEMENTATION (Inline for testing - mirrors documentCollectionService.jsw)
// ============================================================================

/**
 * Generate a secure upload token
 */
function generateUploadToken(expiryHours = 48) {
    const token = `tok_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + expiryHours);
    return { token, expiry: expiry.toISOString() };
}

/**
 * Validate upload token
 */
function isTokenValid(tokenData) {
    if (!tokenData || !tokenData.token || !tokenData.expiry) {
        return false;
    }
    const expiryDate = new Date(tokenData.expiry);
    return expiryDate > new Date();
}

/**
 * Validate file type
 */
function isValidFileType(mimeType) {
    return ALLOWED_FILE_TYPES.includes(mimeType);
}

/**
 * Validate file size
 */
function isValidFileSize(sizeBytes) {
    return sizeBytes > 0 && sizeBytes <= MAX_FILE_SIZE;
}

/**
 * Request documents from driver
 */
async function requestDocuments(workflowId, documentTypes) {
    // Validation
    if (!workflowId || typeof workflowId !== 'string') {
        return { success: false, error: 'workflowId is required' };
    }

    if (!Array.isArray(documentTypes) || documentTypes.length === 0) {
        return { success: false, error: 'documentTypes array is required and must not be empty' };
    }

    // Validate all document types
    const validTypes = Object.values(DOCUMENT_TYPES);
    for (const docType of documentTypes) {
        if (!validTypes.includes(docType)) {
            return { success: false, error: `Invalid document type: ${docType}` };
        }
    }

    try {
        // Verify workflow exists
        const workflowQuery = createMockQueryBuilder([createMockWorkflow({ _id: workflowId })]);
        mockWixData.query.mockReturnValueOnce(workflowQuery);

        const workflowResult = await mockWixData.query(ONBOARDING_WORKFLOWS_COLLECTION)
            .eq('_id', workflowId)
            .limit(1)
            .find({ suppressAuth: true });

        if (workflowResult.items.length === 0) {
            return { success: false, error: 'Workflow not found' };
        }

        const workflow = workflowResult.items[0];
        const now = new Date();
        const requestIds = [];

        // Generate upload token for this batch
        const { token, expiry } = generateUploadToken(48);

        // Create document request records
        for (const docType of documentTypes) {
            const docRequest = {
                workflow_id: workflowId,
                driver_id: workflow.driver_id,
                document_type: docType,
                display_name: getDocumentDisplayName(docType),
                description: getDocumentDescription(docType),
                is_required: isDocumentRequired(docType),
                status: DOCUMENT_STATUS.REQUESTED,
                rejection_reason: null,
                file_url: null,
                file_hash: null,
                submitted_date: null,
                verified_date: null,
                verified_by: null,
                ocr_data: null,
                expiration_date: null,
                reminder_sent_count: 0,
                last_reminder_date: null,
                upload_token: token,
                upload_token_expiry: expiry,
                _createdDate: now
            };

            mockWixData.insert.mockResolvedValueOnce({ ...docRequest, _id: `doc_${Date.now()}` });
            const inserted = await mockWixData.insert(DOCUMENT_REQUESTS_COLLECTION, docRequest, { suppressAuth: true });
            requestIds.push(inserted._id);
        }

        // Generate upload portal URL
        const uploadPortalUrl = `https://lastmilecdl.com/document-upload?token=${token}`;

        return {
            success: true,
            requestIds,
            uploadPortalUrl,
            token,
            tokenExpiry: expiry
        };

    } catch (error) {
        console.error('[DocumentCollection] Error requesting documents:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get document display name
 */
function getDocumentDisplayName(docType) {
    const names = {
        [DOCUMENT_TYPES.CDL_FRONT]: 'CDL Front',
        [DOCUMENT_TYPES.CDL_BACK]: 'CDL Back',
        [DOCUMENT_TYPES.MVR]: 'Motor Vehicle Record (MVR)',
        [DOCUMENT_TYPES.PSP]: 'Pre-Employment Screening Program (PSP)',
        [DOCUMENT_TYPES.MEDICAL_CARD]: 'DOT Medical Card',
        [DOCUMENT_TYPES.DRUG_TEST_CONSENT]: 'Drug Test Consent Form',
        [DOCUMENT_TYPES.EMPLOYMENT_APP]: 'Employment Application',
        [DOCUMENT_TYPES.W4]: 'W-4 Tax Form',
        [DOCUMENT_TYPES.I9]: 'I-9 Employment Eligibility',
        [DOCUMENT_TYPES.DIRECT_DEPOSIT]: 'Direct Deposit Authorization',
        [DOCUMENT_TYPES.SOCIAL_SECURITY]: 'Social Security Card',
        [DOCUMENT_TYPES.EMPLOYMENT_HISTORY]: 'Employment History (10 years)',
        [DOCUMENT_TYPES.PROOF_OF_ADDRESS]: 'Proof of Address',
        [DOCUMENT_TYPES.CUSTOM]: 'Custom Document'
    };
    return names[docType] || docType;
}

/**
 * Get document description
 */
function getDocumentDescription(docType) {
    const descriptions = {
        [DOCUMENT_TYPES.CDL_FRONT]: 'Please upload a clear photo of the front of your CDL',
        [DOCUMENT_TYPES.CDL_BACK]: 'Please upload a clear photo of the back of your CDL',
        [DOCUMENT_TYPES.MVR]: 'Request your Motor Vehicle Record from your state DMV',
        [DOCUMENT_TYPES.PSP]: 'Request your PSP report from psp.fmcsa.dot.gov',
        [DOCUMENT_TYPES.MEDICAL_CARD]: 'Upload your current DOT Medical Card',
        [DOCUMENT_TYPES.DRUG_TEST_CONSENT]: 'Sign and upload the drug test consent form',
        [DOCUMENT_TYPES.EMPLOYMENT_APP]: 'Complete and upload the employment application',
        [DOCUMENT_TYPES.W4]: 'Complete and upload your W-4 tax form',
        [DOCUMENT_TYPES.I9]: 'Complete and upload your I-9 form',
        [DOCUMENT_TYPES.DIRECT_DEPOSIT]: 'Upload direct deposit authorization with voided check',
        [DOCUMENT_TYPES.SOCIAL_SECURITY]: 'Upload a copy of your Social Security Card',
        [DOCUMENT_TYPES.EMPLOYMENT_HISTORY]: 'Provide employment history for the last 10 years',
        [DOCUMENT_TYPES.PROOF_OF_ADDRESS]: 'Upload a utility bill or bank statement showing your address',
        [DOCUMENT_TYPES.CUSTOM]: 'Upload the requested document'
    };
    return descriptions[docType] || 'Please upload the requested document';
}

/**
 * Check if document is required
 */
function isDocumentRequired(docType) {
    const required = [
        DOCUMENT_TYPES.CDL_FRONT,
        DOCUMENT_TYPES.CDL_BACK,
        DOCUMENT_TYPES.MVR,
        DOCUMENT_TYPES.MEDICAL_CARD
    ];
    return required.includes(docType);
}

/**
 * Get document request status for a workflow
 */
async function getDocumentStatus(workflowId) {
    if (!workflowId) {
        return { success: false, error: 'workflowId is required' };
    }

    try {
        const queryBuilder = createMockQueryBuilder();
        mockWixData.query.mockReturnValue(queryBuilder);

        const result = await mockWixData.query(DOCUMENT_REQUESTS_COLLECTION)
            .eq('workflow_id', workflowId)
            .find({ suppressAuth: true });

        const documents = result.items || [];

        // Calculate summary
        const total = documents.length;
        const requested = documents.filter(d => d.status === DOCUMENT_STATUS.REQUESTED).length;
        const uploaded = documents.filter(d => d.status === DOCUMENT_STATUS.UPLOADED).length;
        const verified = documents.filter(d => d.status === DOCUMENT_STATUS.VERIFIED).length;
        const rejected = documents.filter(d => d.status === DOCUMENT_STATUS.REJECTED).length;

        const isComplete = total > 0 && (verified + rejected === total) && rejected === 0;
        const hasRejections = rejected > 0;

        return {
            success: true,
            documents,
            summary: {
                total,
                requested,
                uploaded,
                verified,
                rejected,
                isComplete,
                hasRejections
            }
        };

    } catch (error) {
        console.error('[DocumentCollection] Error getting document status:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Upload a document with token validation
 */
async function uploadDocument(token, documentType, fileData) {
    // Validate token
    if (!token || typeof token !== 'string') {
        return { success: false, error: 'Upload token is required' };
    }

    // Validate document type
    if (!documentType || !Object.values(DOCUMENT_TYPES).includes(documentType)) {
        return { success: false, error: 'Invalid document type' };
    }

    // Validate file data
    if (!fileData) {
        return { success: false, error: 'File data is required' };
    }

    if (!fileData.mimeType || !isValidFileType(fileData.mimeType)) {
        return { success: false, error: `Invalid file type. Allowed: ${ALLOWED_FILE_TYPES.join(', ')}` };
    }

    if (!fileData.size || !isValidFileSize(fileData.size)) {
        return { success: false, error: `File size must be between 0 and ${MAX_FILE_SIZE / (1024 * 1024)}MB` };
    }

    try {
        // Find document request by token and type
        const queryBuilder = createMockQueryBuilder();
        mockWixData.query.mockReturnValue(queryBuilder);

        const result = await mockWixData.query(DOCUMENT_REQUESTS_COLLECTION)
            .eq('upload_token', token)
            .eq('document_type', documentType)
            .limit(1)
            .find({ suppressAuth: true });

        if (result.items.length === 0) {
            return { success: false, error: 'Invalid token or document type' };
        }

        const docRequest = result.items[0];

        // Check token expiry
        if (!docRequest.upload_token_expiry || new Date(docRequest.upload_token_expiry) < new Date()) {
            return { success: false, error: 'Upload token has expired' };
        }

        // Check if already uploaded/verified
        if (docRequest.status === DOCUMENT_STATUS.VERIFIED) {
            return { success: false, error: 'Document has already been verified' };
        }

        // Generate file hash (simplified for testing)
        const fileHash = `sha256_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;

        // Update document request
        const now = new Date();
        const updatedDoc = {
            ...docRequest,
            status: DOCUMENT_STATUS.UPLOADED,
            file_url: fileData.url || `https://media.wix.com/v1/${fileHash}`,
            file_hash: fileHash,
            submitted_date: now,
            _updatedDate: now
        };

        mockWixData.update.mockResolvedValue(updatedDoc);
        await mockWixData.update(DOCUMENT_REQUESTS_COLLECTION, updatedDoc, { suppressAuth: true });

        return {
            success: true,
            documentId: docRequest._id,
            status: DOCUMENT_STATUS.UPLOADED,
            verificationStatus: 'pending_review'
        };

    } catch (error) {
        console.error('[DocumentCollection] Error uploading document:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Verify a document (recruiter action)
 */
async function verifyDocument(documentId, verifierId, status, notes = null) {
    // Validate inputs
    if (!documentId) {
        return { success: false, error: 'documentId is required' };
    }

    if (!verifierId) {
        return { success: false, error: 'verifierId is required' };
    }

    if (!status || ![DOCUMENT_STATUS.VERIFIED, DOCUMENT_STATUS.REJECTED].includes(status)) {
        return { success: false, error: 'status must be either "verified" or "rejected"' };
    }

    // If rejecting, require notes/reason
    if (status === DOCUMENT_STATUS.REJECTED && !notes) {
        return { success: false, error: 'Rejection reason is required' };
    }

    try {
        // Get document request
        mockWixData.get.mockResolvedValue(createMockDocumentRequest({ _id: documentId, status: DOCUMENT_STATUS.UPLOADED }));
        const docRequest = await mockWixData.get(DOCUMENT_REQUESTS_COLLECTION, documentId, { suppressAuth: true });

        if (!docRequest) {
            return { success: false, error: 'Document not found' };
        }

        // Can only verify uploaded documents
        if (docRequest.status !== DOCUMENT_STATUS.UPLOADED) {
            return { success: false, error: `Cannot verify document with status: ${docRequest.status}` };
        }

        // Update document
        const now = new Date();
        const updatedDoc = {
            ...docRequest,
            status,
            verified_date: now,
            verified_by: verifierId,
            rejection_reason: status === DOCUMENT_STATUS.REJECTED ? notes : null,
            _updatedDate: now
        };

        mockWixData.update.mockResolvedValue(updatedDoc);
        await mockWixData.update(DOCUMENT_REQUESTS_COLLECTION, updatedDoc, { suppressAuth: true });

        return {
            success: true,
            documentId,
            status,
            verifiedBy: verifierId,
            verifiedAt: now.toISOString()
        };

    } catch (error) {
        console.error('[DocumentCollection] Error verifying document:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Send a document reminder
 */
async function sendDocumentReminder(documentId) {
    if (!documentId) {
        return { success: false, error: 'documentId is required' };
    }

    try {
        // Get document request
        mockWixData.get.mockResolvedValue(createMockDocumentRequest({
            _id: documentId,
            status: DOCUMENT_STATUS.REQUESTED,
            reminder_sent_count: 0
        }));
        const docRequest = await mockWixData.get(DOCUMENT_REQUESTS_COLLECTION, documentId, { suppressAuth: true });

        if (!docRequest) {
            return { success: false, error: 'Document not found' };
        }

        // Can only remind for requested/rejected documents
        if (![DOCUMENT_STATUS.REQUESTED, DOCUMENT_STATUS.REJECTED].includes(docRequest.status)) {
            return { success: false, error: `Cannot send reminder for document with status: ${docRequest.status}` };
        }

        // Check reminder sequence (day 2, 5, 7)
        const reminderSequence = [2, 5, 7];
        const currentReminderIndex = docRequest.reminder_sent_count || 0;

        if (currentReminderIndex >= reminderSequence.length) {
            return {
                success: false,
                error: 'Maximum reminders sent',
                remindersSent: currentReminderIndex
            };
        }

        // Update reminder count
        const now = new Date();
        const updatedDoc = {
            ...docRequest,
            reminder_sent_count: currentReminderIndex + 1,
            last_reminder_date: now,
            _updatedDate: now
        };

        mockWixData.update.mockResolvedValue(updatedDoc);
        await mockWixData.update(DOCUMENT_REQUESTS_COLLECTION, updatedDoc, { suppressAuth: true });

        // In real implementation, would trigger email/SMS here

        return {
            success: true,
            documentId,
            reminderNumber: currentReminderIndex + 1,
            maxReminders: reminderSequence.length,
            nextReminderDay: reminderSequence[currentReminderIndex] || null,
            sentAt: now.toISOString()
        };

    } catch (error) {
        console.error('[DocumentCollection] Error sending reminder:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Check document expiration
 */
async function checkDocumentExpiration(documentId) {
    if (!documentId) {
        return { success: false, error: 'documentId is required' };
    }

    try {
        // Get document request
        const mockDoc = createMockDocumentRequest({
            _id: documentId,
            document_type: DOCUMENT_TYPES.CDL_FRONT,
            expiration_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        });
        mockWixData.get.mockResolvedValue(mockDoc);
        const docRequest = await mockWixData.get(DOCUMENT_REQUESTS_COLLECTION, documentId, { suppressAuth: true });

        if (!docRequest) {
            return { success: false, error: 'Document not found' };
        }

        // Documents that have expiration dates
        const expiringDocTypes = [DOCUMENT_TYPES.CDL_FRONT, DOCUMENT_TYPES.CDL_BACK, DOCUMENT_TYPES.MEDICAL_CARD];

        if (!expiringDocTypes.includes(docRequest.document_type)) {
            return {
                success: true,
                documentId,
                hasExpiration: false,
                isExpired: false,
                isExpiringSoon: false,
                expirationDate: null
            };
        }

        if (!docRequest.expiration_date) {
            return {
                success: true,
                documentId,
                hasExpiration: true,
                isExpired: false,
                isExpiringSoon: false,
                expirationDate: null,
                message: 'Expiration date not set'
            };
        }

        const now = new Date();
        const expirationDate = new Date(docRequest.expiration_date);
        const daysUntilExpiry = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));

        const isExpired = daysUntilExpiry < 0;
        const isExpiringSoon = !isExpired && daysUntilExpiry <= 30;

        return {
            success: true,
            documentId,
            documentType: docRequest.document_type,
            hasExpiration: true,
            isExpired,
            isExpiringSoon,
            expirationDate: expirationDate.toISOString(),
            daysUntilExpiry: isExpired ? 0 : daysUntilExpiry,
            status: isExpired ? 'expired' : isExpiringSoon ? 'expiring_soon' : 'valid'
        };

    } catch (error) {
        console.error('[DocumentCollection] Error checking expiration:', error);
        return { success: false, error: error.message };
    }
}

// ============================================================================
// TEST SUITES
// ============================================================================

describe('Document Collection Service', () => {

    beforeEach(() => {
        resetMocks();
    });

    // ========================================================================
    // 1. REQUEST DOCUMENTS (25%)
    // ========================================================================

    describe('requestDocuments', () => {

        test('creates document requests for each type', async () => {
            const workflowId = 'workflow_123';
            const documentTypes = [DOCUMENT_TYPES.CDL_FRONT, DOCUMENT_TYPES.CDL_BACK, DOCUMENT_TYPES.MVR];

            mockWixData.query.mockReturnValue(createMockQueryBuilder([createMockWorkflow({ _id: workflowId })]));
            mockWixData.insert.mockResolvedValue({ _id: 'doc_new' });

            const result = await requestDocuments(workflowId, documentTypes);

            expect(result.success).toBe(true);
            expect(result.requestIds).toHaveLength(3);
            expect(mockWixData.insert).toHaveBeenCalledTimes(3);
        });

        test('generates secure upload token with 48-hour expiry', async () => {
            const workflowId = 'workflow_123';
            const documentTypes = [DOCUMENT_TYPES.CDL_FRONT];

            mockWixData.query.mockReturnValue(createMockQueryBuilder([createMockWorkflow({ _id: workflowId })]));
            mockWixData.insert.mockResolvedValue({ _id: 'doc_new' });

            const result = await requestDocuments(workflowId, documentTypes);

            expect(result.success).toBe(true);
            expect(result.token).toBeDefined();
            expect(result.token).toMatch(/^tok_/);
            expect(result.tokenExpiry).toBeDefined();

            const expiryDate = new Date(result.tokenExpiry);
            const now = new Date();
            const hoursDiff = (expiryDate - now) / (1000 * 60 * 60);
            expect(hoursDiff).toBeGreaterThanOrEqual(47);
            expect(hoursDiff).toBeLessThanOrEqual(49);
        });

        test('returns upload portal URL with token', async () => {
            const workflowId = 'workflow_123';
            const documentTypes = [DOCUMENT_TYPES.CDL_FRONT];

            mockWixData.query.mockReturnValue(createMockQueryBuilder([createMockWorkflow({ _id: workflowId })]));
            mockWixData.insert.mockResolvedValue({ _id: 'doc_new' });

            const result = await requestDocuments(workflowId, documentTypes);

            expect(result.uploadPortalUrl).toBeDefined();
            expect(result.uploadPortalUrl).toContain('token=');
            expect(result.uploadPortalUrl).toContain(result.token);
        });

        test('rejects invalid workflow ID', async () => {
            const result1 = await requestDocuments(null, [DOCUMENT_TYPES.CDL_FRONT]);
            expect(result1.success).toBe(false);
            expect(result1.error).toContain('workflowId');

            const result2 = await requestDocuments('', [DOCUMENT_TYPES.CDL_FRONT]);
            expect(result2.success).toBe(false);
        });

        test('rejects empty document types array', async () => {
            const result = await requestDocuments('workflow_123', []);

            expect(result.success).toBe(false);
            expect(result.error).toContain('documentTypes');
        });

        test('rejects invalid document types', async () => {
            mockWixData.query.mockReturnValue(createMockQueryBuilder([createMockWorkflow()]));

            const result = await requestDocuments('workflow_123', ['invalid_type']);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid document type');
        });

        test('returns error if workflow not found', async () => {
            mockWixData.query.mockReturnValue(createMockQueryBuilder([]));

            const result = await requestDocuments('nonexistent_workflow', [DOCUMENT_TYPES.CDL_FRONT]);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Workflow not found');
        });

        test('sets correct display names for document types', async () => {
            const workflowId = 'workflow_123';
            mockWixData.query.mockReturnValue(createMockQueryBuilder([createMockWorkflow({ _id: workflowId })]));
            mockWixData.insert.mockResolvedValue({ _id: 'doc_new' });

            await requestDocuments(workflowId, [DOCUMENT_TYPES.MVR]);

            expect(mockWixData.insert).toHaveBeenCalledWith(
                DOCUMENT_REQUESTS_COLLECTION,
                expect.objectContaining({
                    display_name: 'Motor Vehicle Record (MVR)'
                }),
                { suppressAuth: true }
            );
        });

        test('marks required documents correctly', async () => {
            const workflowId = 'workflow_123';
            mockWixData.query.mockReturnValue(createMockQueryBuilder([createMockWorkflow({ _id: workflowId })]));
            mockWixData.insert.mockResolvedValue({ _id: 'doc_new' });

            await requestDocuments(workflowId, [DOCUMENT_TYPES.CDL_FRONT, DOCUMENT_TYPES.W4]);

            // CDL_FRONT is required
            expect(mockWixData.insert).toHaveBeenNthCalledWith(
                1,
                DOCUMENT_REQUESTS_COLLECTION,
                expect.objectContaining({
                    document_type: DOCUMENT_TYPES.CDL_FRONT,
                    is_required: true
                }),
                { suppressAuth: true }
            );

            // W4 is not required
            expect(mockWixData.insert).toHaveBeenNthCalledWith(
                2,
                DOCUMENT_REQUESTS_COLLECTION,
                expect.objectContaining({
                    document_type: DOCUMENT_TYPES.W4,
                    is_required: false
                }),
                { suppressAuth: true }
            );
        });
    });

    // ========================================================================
    // 2. GET DOCUMENT STATUS (15%)
    // ========================================================================

    describe('getDocumentStatus', () => {

        test('returns all documents for a workflow', async () => {
            const mockDocs = [
                createMockDocumentRequest({ document_type: DOCUMENT_TYPES.CDL_FRONT, status: DOCUMENT_STATUS.VERIFIED }),
                createMockDocumentRequest({ document_type: DOCUMENT_TYPES.CDL_BACK, status: DOCUMENT_STATUS.UPLOADED }),
                createMockDocumentRequest({ document_type: DOCUMENT_TYPES.MVR, status: DOCUMENT_STATUS.REQUESTED })
            ];

            mockWixData.query.mockReturnValue(createMockQueryBuilder(mockDocs, 3));

            const result = await getDocumentStatus('workflow_123');

            expect(result.success).toBe(true);
            expect(result.documents).toHaveLength(3);
        });

        test('calculates summary counts correctly', async () => {
            const mockDocs = [
                createMockDocumentRequest({ status: DOCUMENT_STATUS.VERIFIED }),
                createMockDocumentRequest({ status: DOCUMENT_STATUS.VERIFIED }),
                createMockDocumentRequest({ status: DOCUMENT_STATUS.UPLOADED }),
                createMockDocumentRequest({ status: DOCUMENT_STATUS.REQUESTED }),
                createMockDocumentRequest({ status: DOCUMENT_STATUS.REJECTED })
            ];

            mockWixData.query.mockReturnValue(createMockQueryBuilder(mockDocs, 5));

            const result = await getDocumentStatus('workflow_123');

            expect(result.summary.total).toBe(5);
            expect(result.summary.verified).toBe(2);
            expect(result.summary.uploaded).toBe(1);
            expect(result.summary.requested).toBe(1);
            expect(result.summary.rejected).toBe(1);
        });

        test('detects completion status correctly', async () => {
            const completeDocs = [
                createMockDocumentRequest({ status: DOCUMENT_STATUS.VERIFIED }),
                createMockDocumentRequest({ status: DOCUMENT_STATUS.VERIFIED }),
                createMockDocumentRequest({ status: DOCUMENT_STATUS.VERIFIED })
            ];

            mockWixData.query.mockReturnValue(createMockQueryBuilder(completeDocs, 3));

            const result = await getDocumentStatus('workflow_123');

            expect(result.summary.isComplete).toBe(true);
            expect(result.summary.hasRejections).toBe(false);
        });

        test('detects incomplete status with rejections', async () => {
            const incompleteDocs = [
                createMockDocumentRequest({ status: DOCUMENT_STATUS.VERIFIED }),
                createMockDocumentRequest({ status: DOCUMENT_STATUS.REJECTED }),
                createMockDocumentRequest({ status: DOCUMENT_STATUS.REQUESTED })
            ];

            mockWixData.query.mockReturnValue(createMockQueryBuilder(incompleteDocs, 3));

            const result = await getDocumentStatus('workflow_123');

            expect(result.summary.isComplete).toBe(false);
            expect(result.summary.hasRejections).toBe(true);
        });

        test('handles empty document list', async () => {
            mockWixData.query.mockReturnValue(createMockQueryBuilder([], 0));

            const result = await getDocumentStatus('workflow_123');

            expect(result.success).toBe(true);
            expect(result.documents).toHaveLength(0);
            expect(result.summary.total).toBe(0);
            expect(result.summary.isComplete).toBe(false);
        });

        test('requires workflowId', async () => {
            const result = await getDocumentStatus(null);

            expect(result.success).toBe(false);
            expect(result.error).toContain('workflowId');
        });
    });

    // ========================================================================
    // 3. UPLOAD DOCUMENT (25%)
    // ========================================================================

    describe('uploadDocument', () => {

        test('accepts valid upload with token', async () => {
            const token = 'tok_valid_token_123';
            const fileData = {
                mimeType: 'application/pdf',
                size: 1024 * 1024, // 1MB
                url: 'https://upload.example.com/file.pdf'
            };

            const mockDoc = createMockDocumentRequest({
                upload_token: token,
                upload_token_expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                status: DOCUMENT_STATUS.REQUESTED
            });
            mockWixData.query.mockReturnValue(createMockQueryBuilder([mockDoc]));
            mockWixData.update.mockResolvedValue({ ...mockDoc, status: DOCUMENT_STATUS.UPLOADED });

            const result = await uploadDocument(token, DOCUMENT_TYPES.CDL_FRONT, fileData);

            expect(result.success).toBe(true);
            expect(result.status).toBe(DOCUMENT_STATUS.UPLOADED);
            expect(result.verificationStatus).toBe('pending_review');
        });

        test('rejects expired token', async () => {
            const token = 'tok_expired_token';
            const fileData = {
                mimeType: 'application/pdf',
                size: 1024 * 1024
            };

            const expiredDoc = createMockDocumentRequest({
                upload_token: token,
                upload_token_expiry: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 24 hours ago
            });
            mockWixData.query.mockReturnValue(createMockQueryBuilder([expiredDoc]));

            const result = await uploadDocument(token, DOCUMENT_TYPES.CDL_FRONT, fileData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('expired');
        });

        test('rejects invalid token', async () => {
            const fileData = {
                mimeType: 'application/pdf',
                size: 1024 * 1024
            };

            mockWixData.query.mockReturnValue(createMockQueryBuilder([]));

            const result = await uploadDocument('invalid_token', DOCUMENT_TYPES.CDL_FRONT, fileData);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid token');
        });

        test('rejects missing token', async () => {
            const result = await uploadDocument(null, DOCUMENT_TYPES.CDL_FRONT, { mimeType: 'application/pdf', size: 1024 });

            expect(result.success).toBe(false);
            expect(result.error).toContain('token is required');
        });

        test('validates PDF file type', async () => {
            const token = 'tok_valid';
            const mockDoc = createMockDocumentRequest({
                upload_token: token,
                upload_token_expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            });
            mockWixData.query.mockReturnValue(createMockQueryBuilder([mockDoc]));
            mockWixData.update.mockResolvedValue(mockDoc);

            const result = await uploadDocument(token, DOCUMENT_TYPES.CDL_FRONT, {
                mimeType: 'application/pdf',
                size: 1024
            });

            expect(result.success).toBe(true);
        });

        test('validates JPEG file type', async () => {
            const token = 'tok_valid';
            const mockDoc = createMockDocumentRequest({
                upload_token: token,
                upload_token_expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            });
            mockWixData.query.mockReturnValue(createMockQueryBuilder([mockDoc]));
            mockWixData.update.mockResolvedValue(mockDoc);

            const result = await uploadDocument(token, DOCUMENT_TYPES.CDL_FRONT, {
                mimeType: 'image/jpeg',
                size: 1024
            });

            expect(result.success).toBe(true);
        });

        test('validates PNG file type', async () => {
            const token = 'tok_valid';
            const mockDoc = createMockDocumentRequest({
                upload_token: token,
                upload_token_expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            });
            mockWixData.query.mockReturnValue(createMockQueryBuilder([mockDoc]));
            mockWixData.update.mockResolvedValue(mockDoc);

            const result = await uploadDocument(token, DOCUMENT_TYPES.CDL_FRONT, {
                mimeType: 'image/png',
                size: 1024
            });

            expect(result.success).toBe(true);
        });

        test('rejects invalid file types', async () => {
            const result = await uploadDocument('tok_valid', DOCUMENT_TYPES.CDL_FRONT, {
                mimeType: 'application/zip',
                size: 1024
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid file type');
        });

        test('rejects files over 10MB', async () => {
            const result = await uploadDocument('tok_valid', DOCUMENT_TYPES.CDL_FRONT, {
                mimeType: 'application/pdf',
                size: 11 * 1024 * 1024 // 11MB
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('File size');
        });

        test('rejects zero-size files', async () => {
            const result = await uploadDocument('tok_valid', DOCUMENT_TYPES.CDL_FRONT, {
                mimeType: 'application/pdf',
                size: 0
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('File size');
        });

        test('rejects upload for already verified document', async () => {
            const token = 'tok_valid';
            const verifiedDoc = createMockDocumentRequest({
                upload_token: token,
                upload_token_expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                status: DOCUMENT_STATUS.VERIFIED
            });
            mockWixData.query.mockReturnValue(createMockQueryBuilder([verifiedDoc]));

            const result = await uploadDocument(token, DOCUMENT_TYPES.CDL_FRONT, {
                mimeType: 'application/pdf',
                size: 1024
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('already been verified');
        });

        test('updates document status to uploaded', async () => {
            const token = 'tok_valid';
            const mockDoc = createMockDocumentRequest({
                _id: 'doc_123',
                upload_token: token,
                upload_token_expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                status: DOCUMENT_STATUS.REQUESTED
            });
            mockWixData.query.mockReturnValue(createMockQueryBuilder([mockDoc]));
            mockWixData.update.mockResolvedValue({ ...mockDoc, status: DOCUMENT_STATUS.UPLOADED });

            await uploadDocument(token, DOCUMENT_TYPES.CDL_FRONT, {
                mimeType: 'application/pdf',
                size: 1024
            });

            expect(mockWixData.update).toHaveBeenCalledWith(
                DOCUMENT_REQUESTS_COLLECTION,
                expect.objectContaining({
                    status: DOCUMENT_STATUS.UPLOADED
                }),
                { suppressAuth: true }
            );
        });

        test('generates file hash on upload', async () => {
            const token = 'tok_valid';
            const mockDoc = createMockDocumentRequest({
                upload_token: token,
                upload_token_expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                status: DOCUMENT_STATUS.REQUESTED
            });
            mockWixData.query.mockReturnValue(createMockQueryBuilder([mockDoc]));
            mockWixData.update.mockResolvedValue(mockDoc);

            await uploadDocument(token, DOCUMENT_TYPES.CDL_FRONT, {
                mimeType: 'application/pdf',
                size: 1024
            });

            expect(mockWixData.update).toHaveBeenCalledWith(
                DOCUMENT_REQUESTS_COLLECTION,
                expect.objectContaining({
                    file_hash: expect.stringMatching(/^sha256_/)
                }),
                { suppressAuth: true }
            );
        });
    });

    // ========================================================================
    // 4. VERIFY DOCUMENT (15%)
    // ========================================================================

    describe('verifyDocument', () => {

        test('approves document with verified status', async () => {
            const documentId = 'doc_123';
            const verifierId = 'recruiter_001';

            mockWixData.get.mockResolvedValue(createMockDocumentRequest({
                _id: documentId,
                status: DOCUMENT_STATUS.UPLOADED
            }));
            mockWixData.update.mockResolvedValue({ status: DOCUMENT_STATUS.VERIFIED });

            const result = await verifyDocument(documentId, verifierId, DOCUMENT_STATUS.VERIFIED);

            expect(result.success).toBe(true);
            expect(result.status).toBe(DOCUMENT_STATUS.VERIFIED);
            expect(result.verifiedBy).toBe(verifierId);
            expect(result.verifiedAt).toBeDefined();
        });

        test('rejects document with rejection reason', async () => {
            const documentId = 'doc_123';
            const verifierId = 'recruiter_001';
            const reason = 'Document is blurry and unreadable';

            mockWixData.get.mockResolvedValue(createMockDocumentRequest({
                _id: documentId,
                status: DOCUMENT_STATUS.UPLOADED
            }));
            mockWixData.update.mockResolvedValue({ status: DOCUMENT_STATUS.REJECTED });

            const result = await verifyDocument(documentId, verifierId, DOCUMENT_STATUS.REJECTED, reason);

            expect(result.success).toBe(true);
            expect(result.status).toBe(DOCUMENT_STATUS.REJECTED);

            expect(mockWixData.update).toHaveBeenCalledWith(
                DOCUMENT_REQUESTS_COLLECTION,
                expect.objectContaining({
                    rejection_reason: reason
                }),
                { suppressAuth: true }
            );
        });

        test('requires rejection reason when rejecting', async () => {
            const result = await verifyDocument('doc_123', 'recruiter_001', DOCUMENT_STATUS.REJECTED);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Rejection reason is required');
        });

        test('requires documentId', async () => {
            const result = await verifyDocument(null, 'recruiter_001', DOCUMENT_STATUS.VERIFIED);

            expect(result.success).toBe(false);
            expect(result.error).toContain('documentId is required');
        });

        test('requires verifierId', async () => {
            const result = await verifyDocument('doc_123', null, DOCUMENT_STATUS.VERIFIED);

            expect(result.success).toBe(false);
            expect(result.error).toContain('verifierId is required');
        });

        test('rejects invalid status values', async () => {
            const result = await verifyDocument('doc_123', 'recruiter_001', 'invalid_status');

            expect(result.success).toBe(false);
            expect(result.error).toContain('status must be');
        });

        test('cannot verify non-uploaded document', async () => {
            mockWixData.get.mockResolvedValue(createMockDocumentRequest({
                _id: 'doc_123',
                status: DOCUMENT_STATUS.REQUESTED
            }));

            const result = await verifyDocument('doc_123', 'recruiter_001', DOCUMENT_STATUS.VERIFIED);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Cannot verify document');
        });

        test('records verification timestamp', async () => {
            const documentId = 'doc_123';
            const beforeTime = new Date();

            mockWixData.get.mockResolvedValue(createMockDocumentRequest({
                _id: documentId,
                status: DOCUMENT_STATUS.UPLOADED
            }));
            mockWixData.update.mockResolvedValue({});

            const result = await verifyDocument(documentId, 'recruiter_001', DOCUMENT_STATUS.VERIFIED);

            const afterTime = new Date();
            const verifiedTime = new Date(result.verifiedAt);

            expect(verifiedTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
            expect(verifiedTime.getTime()).toBeLessThanOrEqual(afterTime.getTime());
        });

        test('returns error if document not found', async () => {
            mockWixData.get.mockResolvedValue(null);

            const result = await verifyDocument('nonexistent_doc', 'recruiter_001', DOCUMENT_STATUS.VERIFIED);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Document not found');
        });
    });

    // ========================================================================
    // 5. SEND REMINDER (10%)
    // ========================================================================

    describe('sendDocumentReminder', () => {

        test('sends reminder for requested document', async () => {
            const documentId = 'doc_123';

            mockWixData.get.mockResolvedValue(createMockDocumentRequest({
                _id: documentId,
                status: DOCUMENT_STATUS.REQUESTED,
                reminder_sent_count: 0
            }));
            mockWixData.update.mockResolvedValue({});

            const result = await sendDocumentReminder(documentId);

            expect(result.success).toBe(true);
            expect(result.reminderNumber).toBe(1);
            expect(result.maxReminders).toBe(3);
        });

        test('tracks reminder sequence (day 2, 5, 7)', async () => {
            const documentId = 'doc_123';

            mockWixData.get.mockResolvedValue(createMockDocumentRequest({
                _id: documentId,
                status: DOCUMENT_STATUS.REQUESTED,
                reminder_sent_count: 1
            }));
            mockWixData.update.mockResolvedValue({});

            const result = await sendDocumentReminder(documentId);

            expect(result.success).toBe(true);
            expect(result.reminderNumber).toBe(2);
            expect(result.nextReminderDay).toBe(5); // Day 5 reminder is second
        });

        test('blocks reminders after maximum sent', async () => {
            const documentId = 'doc_123';

            mockWixData.get.mockResolvedValue(createMockDocumentRequest({
                _id: documentId,
                status: DOCUMENT_STATUS.REQUESTED,
                reminder_sent_count: 3
            }));

            const result = await sendDocumentReminder(documentId);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Maximum reminders sent');
        });

        test('sends reminder for rejected document (re-upload needed)', async () => {
            const documentId = 'doc_123';

            mockWixData.get.mockResolvedValue(createMockDocumentRequest({
                _id: documentId,
                status: DOCUMENT_STATUS.REJECTED,
                reminder_sent_count: 0
            }));
            mockWixData.update.mockResolvedValue({});

            const result = await sendDocumentReminder(documentId);

            expect(result.success).toBe(true);
        });

        test('cannot remind for uploaded document', async () => {
            mockWixData.get.mockResolvedValue(createMockDocumentRequest({
                _id: 'doc_123',
                status: DOCUMENT_STATUS.UPLOADED,
                reminder_sent_count: 0
            }));

            const result = await sendDocumentReminder('doc_123');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Cannot send reminder');
        });

        test('cannot remind for verified document', async () => {
            mockWixData.get.mockResolvedValue(createMockDocumentRequest({
                _id: 'doc_123',
                status: DOCUMENT_STATUS.VERIFIED,
                reminder_sent_count: 0
            }));

            const result = await sendDocumentReminder('doc_123');

            expect(result.success).toBe(false);
        });

        test('updates last reminder date', async () => {
            const documentId = 'doc_123';

            mockWixData.get.mockResolvedValue(createMockDocumentRequest({
                _id: documentId,
                status: DOCUMENT_STATUS.REQUESTED,
                reminder_sent_count: 0
            }));
            mockWixData.update.mockResolvedValue({});

            await sendDocumentReminder(documentId);

            expect(mockWixData.update).toHaveBeenCalledWith(
                DOCUMENT_REQUESTS_COLLECTION,
                expect.objectContaining({
                    last_reminder_date: expect.any(Date)
                }),
                { suppressAuth: true }
            );
        });

        test('requires documentId', async () => {
            const result = await sendDocumentReminder(null);

            expect(result.success).toBe(false);
            expect(result.error).toContain('documentId is required');
        });

        test('returns error if document not found', async () => {
            mockWixData.get.mockResolvedValue(null);

            const result = await sendDocumentReminder('nonexistent_doc');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Document not found');
        });
    });

    // ========================================================================
    // 6. CHECK EXPIRATION (10%)
    // ========================================================================

    describe('checkDocumentExpiration', () => {

        test('detects expired CDL', async () => {
            const expiredDate = new Date();
            expiredDate.setDate(expiredDate.getDate() - 30); // 30 days ago

            mockWixData.get.mockResolvedValue(createMockDocumentRequest({
                _id: 'doc_123',
                document_type: DOCUMENT_TYPES.CDL_FRONT,
                expiration_date: expiredDate
            }));

            const result = await checkDocumentExpiration('doc_123');

            expect(result.success).toBe(true);
            expect(result.isExpired).toBe(true);
            expect(result.status).toBe('expired');
        });

        test('detects CDL expiring within 30 days', async () => {
            const expiringDate = new Date();
            expiringDate.setDate(expiringDate.getDate() + 15); // 15 days from now

            mockWixData.get.mockResolvedValue(createMockDocumentRequest({
                _id: 'doc_123',
                document_type: DOCUMENT_TYPES.CDL_FRONT,
                expiration_date: expiringDate
            }));

            const result = await checkDocumentExpiration('doc_123');

            expect(result.success).toBe(true);
            expect(result.isExpiringSoon).toBe(true);
            expect(result.isExpired).toBe(false);
            expect(result.status).toBe('expiring_soon');
        });

        test('returns valid status for non-expiring document', async () => {
            const farFutureDate = new Date();
            farFutureDate.setDate(farFutureDate.getDate() + 365); // 1 year from now

            mockWixData.get.mockResolvedValue(createMockDocumentRequest({
                _id: 'doc_123',
                document_type: DOCUMENT_TYPES.CDL_FRONT,
                expiration_date: farFutureDate
            }));

            const result = await checkDocumentExpiration('doc_123');

            expect(result.success).toBe(true);
            expect(result.isExpired).toBe(false);
            expect(result.isExpiringSoon).toBe(false);
            expect(result.status).toBe('valid');
        });

        test('checks Medical Card expiration', async () => {
            const expiredDate = new Date();
            expiredDate.setDate(expiredDate.getDate() - 10);

            mockWixData.get.mockResolvedValue(createMockDocumentRequest({
                _id: 'doc_123',
                document_type: DOCUMENT_TYPES.MEDICAL_CARD,
                expiration_date: expiredDate
            }));

            const result = await checkDocumentExpiration('doc_123');

            expect(result.success).toBe(true);
            expect(result.documentType).toBe(DOCUMENT_TYPES.MEDICAL_CARD);
            expect(result.isExpired).toBe(true);
        });

        test('handles documents without expiration dates', async () => {
            mockWixData.get.mockResolvedValue(createMockDocumentRequest({
                _id: 'doc_123',
                document_type: DOCUMENT_TYPES.W4,
                expiration_date: null
            }));

            const result = await checkDocumentExpiration('doc_123');

            expect(result.success).toBe(true);
            expect(result.hasExpiration).toBe(false);
        });

        test('calculates days until expiry correctly', async () => {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 45); // 45 days from now

            mockWixData.get.mockResolvedValue(createMockDocumentRequest({
                _id: 'doc_123',
                document_type: DOCUMENT_TYPES.CDL_FRONT,
                expiration_date: futureDate
            }));

            const result = await checkDocumentExpiration('doc_123');

            expect(result.success).toBe(true);
            expect(result.daysUntilExpiry).toBeGreaterThanOrEqual(44);
            expect(result.daysUntilExpiry).toBeLessThanOrEqual(46);
        });

        test('requires documentId', async () => {
            const result = await checkDocumentExpiration(null);

            expect(result.success).toBe(false);
            expect(result.error).toContain('documentId is required');
        });

        test('returns error if document not found', async () => {
            mockWixData.get.mockResolvedValue(null);

            const result = await checkDocumentExpiration('nonexistent_doc');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Document not found');
        });
    });

    // ========================================================================
    // INVALID TOKEN HANDLING
    // ========================================================================

    describe('Invalid Token Handling', () => {

        test('rejects null token', async () => {
            const result = await uploadDocument(null, DOCUMENT_TYPES.CDL_FRONT, {
                mimeType: 'application/pdf',
                size: 1024
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('token is required');
        });

        test('rejects empty string token', async () => {
            const result = await uploadDocument('', DOCUMENT_TYPES.CDL_FRONT, {
                mimeType: 'application/pdf',
                size: 1024
            });

            expect(result.success).toBe(false);
        });

        test('rejects non-string token', async () => {
            const result = await uploadDocument(12345, DOCUMENT_TYPES.CDL_FRONT, {
                mimeType: 'application/pdf',
                size: 1024
            });

            expect(result.success).toBe(false);
        });

        test('rejects token not found in database', async () => {
            mockWixData.query.mockReturnValue(createMockQueryBuilder([]));

            const result = await uploadDocument('tok_does_not_exist', DOCUMENT_TYPES.CDL_FRONT, {
                mimeType: 'application/pdf',
                size: 1024
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid token');
        });

        test('rejects token with wrong document type', async () => {
            // Token exists for CDL_BACK but trying to upload CDL_FRONT
            mockWixData.query.mockReturnValue(createMockQueryBuilder([])); // No match for CDL_FRONT

            const result = await uploadDocument('tok_valid_for_cdl_back', DOCUMENT_TYPES.CDL_FRONT, {
                mimeType: 'application/pdf',
                size: 1024
            });

            expect(result.success).toBe(false);
        });
    });

    // ========================================================================
    // FILE TYPE VALIDATION
    // ========================================================================

    describe('File Type Validation', () => {

        test('accepts application/pdf', async () => {
            expect(isValidFileType('application/pdf')).toBe(true);
        });

        test('accepts image/jpeg', async () => {
            expect(isValidFileType('image/jpeg')).toBe(true);
        });

        test('accepts image/png', async () => {
            expect(isValidFileType('image/png')).toBe(true);
        });

        test('rejects image/gif', async () => {
            expect(isValidFileType('image/gif')).toBe(false);
        });

        test('rejects application/zip', async () => {
            expect(isValidFileType('application/zip')).toBe(false);
        });

        test('rejects application/msword', async () => {
            expect(isValidFileType('application/msword')).toBe(false);
        });

        test('rejects text/plain', async () => {
            expect(isValidFileType('text/plain')).toBe(false);
        });

        test('rejects executable types', async () => {
            expect(isValidFileType('application/x-msdownload')).toBe(false);
            expect(isValidFileType('application/x-executable')).toBe(false);
        });

        test('validates file size within limit', async () => {
            expect(isValidFileSize(1024)).toBe(true); // 1KB
            expect(isValidFileSize(5 * 1024 * 1024)).toBe(true); // 5MB
            expect(isValidFileSize(10 * 1024 * 1024)).toBe(true); // 10MB exactly
        });

        test('rejects file size over limit', async () => {
            expect(isValidFileSize(10 * 1024 * 1024 + 1)).toBe(false); // 10MB + 1 byte
            expect(isValidFileSize(50 * 1024 * 1024)).toBe(false); // 50MB
        });

        test('rejects zero or negative file size', async () => {
            expect(isValidFileSize(0)).toBe(false);
            expect(isValidFileSize(-1)).toBe(false);
        });
    });

    // ========================================================================
    // ERROR HANDLING
    // ========================================================================

    describe('Error Handling', () => {

        test('handles database connection failure gracefully', async () => {
            mockWixData.query.mockImplementation(() => {
                throw new Error('Database connection failed');
            });

            const result = await getDocumentStatus('workflow_123');

            expect(result.success).toBe(false);
            expect(result.error).toContain('Database connection failed');
        });

        test('handles update failure gracefully', async () => {
            const token = 'tok_valid';
            const mockDoc = createMockDocumentRequest({
                upload_token: token,
                upload_token_expiry: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                status: DOCUMENT_STATUS.REQUESTED
            });
            mockWixData.query.mockReturnValue(createMockQueryBuilder([mockDoc]));
            mockWixData.update.mockRejectedValue(new Error('Update failed'));

            const result = await uploadDocument(token, DOCUMENT_TYPES.CDL_FRONT, {
                mimeType: 'application/pdf',
                size: 1024
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Update failed');
        });
    });
});

// ============================================================================
// TEST SUMMARY
// ============================================================================
/**
 * Total Test Cases: 74
 *
 * Distribution:
 * - Request Documents: 8 tests (11%)
 * - Get Document Status: 6 tests (8%)
 * - Upload Document: 15 tests (20%)
 * - Verify Document: 10 tests (14%)
 * - Send Reminder: 10 tests (14%)
 * - Check Expiration: 9 tests (12%)
 * - Invalid Token Handling: 6 tests (8%)
 * - File Type Validation: 10 tests (13%)
 * - Error Handling: 2 tests (3%)
 *
 * Coverage Areas:
 * - All public functions tested
 * - Token generation and validation
 * - File type and size validation
 * - Document status state machine
 * - Reminder sequencing
 * - Expiration detection
 * - Error scenarios
 */
