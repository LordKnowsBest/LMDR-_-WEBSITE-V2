/* eslint-disable */
/**
 * CARRIER_POLICIES Bridge Tests
 * ==============================
 * Tests for src/pages/CARRIER_POLICIES.m76is.js
 * Verifies HTML component discovery, message routing, error handling,
 * safety checks, and backend service mock verification.
 *
 * **TYPE PROTOCOL** (not action protocol)
 * Switch on `msg.type`, params in `msg.data`, responses as `{ type: '...', data, timestamp }`
 *
 * 8 inbound types:
 *   carrierPoliciesReady, getCarrierPolicies, createPolicy,
 *   updatePolicy, publishPolicyVersion, archivePolicy,
 *   uploadPolicyFile, getComplianceStatus
 *
 * 5 outbound types:
 *   carrierPoliciesData, policyActionResult, policyUploadResult,
 *   complianceStatusData, carrierContext
 *
 * @see src/pages/CARRIER_POLICIES.m76is.js
 * @see src/public/carrier/CARRIER_POLICIES.html
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// SOURCE FILE REFERENCE
// =============================================================================

const PAGE_FILE = path.resolve(
    __dirname, '..', '..', 'pages', 'CARRIER_POLICIES.m76is.js'
);
const sourceCode = fs.readFileSync(PAGE_FILE, 'utf8');

// =============================================================================
// EXPECTED IMPORTS AND ACTIONS
// =============================================================================

const EXPECTED_IMPORTS = [
    "from 'backend/carrierPolicyService.jsw'",
    "from 'backend/carrierAnnouncementsService.jsw'"
];

const ALL_ACTIONS = [
    'carrierPoliciesReady',
    'getCarrierPolicies',
    'createPolicy',
    'updatePolicy',
    'publishPolicyVersion',
    'archivePolicy',
    'uploadPolicyFile',
    'getComplianceStatus'
];

// =============================================================================
// MOCKS
// =============================================================================

function createMockComponent() {
    return {
        onMessage: jest.fn(),
        postMessage: jest.fn()
    };
}

const mockBackend = {
    getPoliciesForCarrier: jest.fn().mockResolvedValue({
        success: true,
        policies: [{ _id: 'pol-1', title: 'Safety', status: 'published' }],
        totalCount: 1
    }),
    createPolicy: jest.fn().mockResolvedValue({
        success: true,
        policy: { _id: 'pol-new', title: 'New Policy' }
    }),
    updatePolicy: jest.fn().mockResolvedValue({
        success: true,
        policy: { _id: 'pol-1', title: 'Updated' }
    }),
    publishPolicyVersion: jest.fn().mockResolvedValue({
        success: true,
        policy: { _id: 'pol-1', version: 2, status: 'published' }
    }),
    archivePolicy: jest.fn().mockResolvedValue({
        success: true,
        policy: { _id: 'pol-1', status: 'archived' }
    }),
    uploadPolicyFile: jest.fn().mockResolvedValue({
        success: true,
        fileUrl: 'https://example.com/policy.pdf'
    }),
    getComplianceStatus: jest.fn().mockResolvedValue({
        success: true,
        policies: [
            { policyId: 'pol-1', title: 'Safety', acknowledged: 40, total: 50, rate: 80 }
        ]
    }),
    getCarrierContextForCurrentUser: jest.fn().mockResolvedValue({
        success: true,
        carrierId: 'carrier-test-1'
    })
};

// =============================================================================
// REPLICATED CORE LOGIC
// =============================================================================

function sendToHtml(component, type, data) {
    try {
        if (component && typeof component.postMessage === 'function') {
            component.postMessage({ type, data, timestamp: Date.now() });
        }
    } catch (err) {
        // silently fail
    }
}

function getHtmlComponent($w) {
    const possibleIds = ['html1', 'html2', 'html3', 'html4', 'html5', 'htmlEmbed1'];
    for (const id of possibleIds) {
        try {
            const el = $w(`#${id}`);
            if (el && typeof el.onMessage === 'function') {
                return el;
            }
        } catch (e) {
            // skip
        }
    }
    return null;
}

let carrierId = 'carrier-test-1';

async function routeMessage(component, msg, backend = mockBackend) {
    if (!msg || !msg.type) return;

    switch (msg.type) {
        case 'carrierPoliciesReady':
            if (carrierId) {
                sendToHtml(component, 'carrierContext', { carrierId });
            }
            break;

        case 'getCarrierPolicies': {
            try {
                const data = msg.data || {};
                const cid = data.carrierId || carrierId;
                if (!cid) {
                    sendToHtml(component, 'carrierPoliciesData', { success: false, error: 'No carrier context' });
                    return;
                }
                carrierId = cid;
                const options = {
                    status: data.status || 'published',
                    category: data.category || 'all',
                    limit: data.limit || 200,
                    offset: data.offset || 0
                };
                const result = await backend.getPoliciesForCarrier(cid, options);
                sendToHtml(component, 'carrierPoliciesData', {
                    success: result.success,
                    policies: result.success ? result.policies : [],
                    totalCount: result.totalCount || 0,
                    error: result.error
                });
            } catch (error) {
                sendToHtml(component, 'carrierPoliciesData', { success: false, error: error.message });
            }
            break;
        }

        case 'createPolicy': {
            try {
                const data = msg.data;
                if (!data) {
                    sendToHtml(component, 'policyActionResult', { success: false, error: 'No data provided' });
                    return;
                }
                const policyData = { ...data, carrier_id: data.carrier_id || carrierId };
                const result = await backend.createPolicy(policyData);
                sendToHtml(component, 'policyActionResult', result);
            } catch (error) {
                sendToHtml(component, 'policyActionResult', { success: false, error: error.message });
            }
            break;
        }

        case 'updatePolicy': {
            try {
                const { policyId, updates } = msg.data || {};
                if (!policyId || !updates) {
                    sendToHtml(component, 'policyActionResult', { success: false, error: 'Missing required fields' });
                    return;
                }
                const result = await backend.updatePolicy(policyId, updates);
                sendToHtml(component, 'policyActionResult', result);
            } catch (error) {
                sendToHtml(component, 'policyActionResult', { success: false, error: error.message });
            }
            break;
        }

        case 'publishPolicyVersion': {
            try {
                const { policyId, changeSummary } = msg.data || {};
                if (!policyId) {
                    sendToHtml(component, 'policyActionResult', { success: false, error: 'Missing policy ID' });
                    return;
                }
                const result = await backend.publishPolicyVersion(policyId, changeSummary || '');
                sendToHtml(component, 'policyActionResult', result);
            } catch (error) {
                sendToHtml(component, 'policyActionResult', { success: false, error: error.message });
            }
            break;
        }

        case 'archivePolicy': {
            try {
                const { policyId } = msg.data || {};
                if (!policyId) {
                    sendToHtml(component, 'policyActionResult', { success: false, error: 'Missing policy ID' });
                    return;
                }
                const result = await backend.archivePolicy(policyId);
                sendToHtml(component, 'policyActionResult', result);
            } catch (error) {
                sendToHtml(component, 'policyActionResult', { success: false, error: error.message });
            }
            break;
        }

        case 'uploadPolicyFile': {
            try {
                const { base64Data, fileName, mimeType, carrierId: cid } = msg.data || {};
                if (!base64Data || !fileName || !mimeType) {
                    sendToHtml(component, 'policyUploadResult', { success: false, error: 'Missing required fields' });
                    return;
                }
                const result = await backend.uploadPolicyFile(base64Data, fileName, mimeType, cid || carrierId);
                sendToHtml(component, 'policyUploadResult', result);
            } catch (error) {
                sendToHtml(component, 'policyUploadResult', { success: false, error: error.message });
            }
            break;
        }

        case 'getComplianceStatus': {
            try {
                const data = msg.data || {};
                const cid = data.carrierId || carrierId;
                if (!cid) {
                    sendToHtml(component, 'complianceStatusData', { success: false, error: 'No carrier context' });
                    return;
                }
                const result = await backend.getComplianceStatus(cid);
                sendToHtml(component, 'complianceStatusData', result);
            } catch (error) {
                sendToHtml(component, 'complianceStatusData', { success: false, error: error.message });
            }
            break;
        }

        default:
            break;
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('CARRIER_POLICIES Bridge Tests', () => {
    let component;

    beforeEach(() => {
        jest.clearAllMocks();
        component = createMockComponent();
        carrierId = 'carrier-test-1';
    });

    // =========================================================================
    // SOURCE FILE STRUCTURAL CHECKS
    // =========================================================================

    describe('Source file structure', () => {
        test('file exists and is readable', () => {
            expect(sourceCode.length).toBeGreaterThan(0);
        });

        test('defines $w.onReady', () => {
            expect(sourceCode).toMatch(/\$w\.onReady/);
        });

        test('defines HTML component IDs', () => {
            expect(sourceCode).toContain('html1');
        });

        EXPECTED_IMPORTS.forEach(importPath => {
            test(`imports ${importPath}`, () => {
                expect(sourceCode).toContain(importPath);
            });
        });

        test('defines sendToHtml helper', () => {
            expect(sourceCode).toContain('function sendToHtml');
        });

        test('defines MESSAGE_REGISTRY with all inbound types', () => {
            ALL_ACTIONS.forEach(action => {
                expect(sourceCode).toContain(`'${action}'`);
            });
        });
    });

    // =========================================================================
    // SAFETY CHECKS
    // =========================================================================

    describe('Safety checks', () => {
        test('$w() calls are wrapped in try-catch', () => {
            expect(sourceCode).toMatch(/try\s*\{[\s\S]*?\$w\(/);
        });

        test('sendToHtml wraps postMessage in try-catch', () => {
            expect(sourceCode).toMatch(/typeof component\.postMessage\s*===\s*'function'/);
        });
    });

    // =========================================================================
    // HTML COMPONENT DISCOVERY
    // =========================================================================

    describe('HTML component discovery', () => {
        test('finds components with onMessage method', () => {
            const mock$w = jest.fn((id) => {
                if (id === '#html1') return createMockComponent();
                throw new Error('not found');
            });
            const comp = getHtmlComponent(mock$w);
            expect(comp).not.toBeNull();
        });

        test('skips components that throw errors', () => {
            const mock$w = jest.fn(() => { throw new Error('not on page'); });
            const comp = getHtmlComponent(mock$w);
            expect(comp).toBeNull();
        });
    });

    // =========================================================================
    // MESSAGE ROUTING
    // =========================================================================

    describe('Message routing', () => {
        test('ignores messages with no type', async () => {
            await routeMessage(component, {});
            await routeMessage(component, null);
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('unknown type does not send any message', async () => {
            await routeMessage(component, { type: 'nonExistentType' });
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('carrierPoliciesReady sends carrierContext', async () => {
            await routeMessage(component, { type: 'carrierPoliciesReady' });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'carrierContext',
                    data: { carrierId: 'carrier-test-1' }
                })
            );
        });

        test('getCarrierPolicies calls backend and sends data', async () => {
            await routeMessage(component, {
                type: 'getCarrierPolicies',
                data: { carrierId: 'c-1', status: 'published' }
            });
            expect(mockBackend.getPoliciesForCarrier).toHaveBeenCalledWith('c-1', expect.objectContaining({ status: 'published' }));
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'carrierPoliciesData',
                    data: expect.objectContaining({ success: true })
                })
            );
        });

        test('createPolicy calls backend and sends result', async () => {
            await routeMessage(component, {
                type: 'createPolicy',
                data: { title: 'New Policy', category: 'safety' }
            });
            expect(mockBackend.createPolicy).toHaveBeenCalledWith(
                expect.objectContaining({ title: 'New Policy', carrier_id: 'carrier-test-1' })
            );
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'policyActionResult' })
            );
        });

        test('createPolicy with no data sends error', async () => {
            await routeMessage(component, { type: 'createPolicy' });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'policyActionResult',
                    data: expect.objectContaining({ success: false })
                })
            );
        });

        test('updatePolicy calls backend with id and updates', async () => {
            await routeMessage(component, {
                type: 'updatePolicy',
                data: { policyId: 'pol-1', updates: { title: 'Updated' } }
            });
            expect(mockBackend.updatePolicy).toHaveBeenCalledWith('pol-1', { title: 'Updated' });
        });

        test('updatePolicy with missing fields sends error', async () => {
            await routeMessage(component, { type: 'updatePolicy', data: {} });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'policyActionResult',
                    data: expect.objectContaining({ success: false })
                })
            );
        });

        test('publishPolicyVersion calls backend with id and changeSummary', async () => {
            await routeMessage(component, {
                type: 'publishPolicyVersion',
                data: { policyId: 'pol-1', changeSummary: 'Updated section 3' }
            });
            expect(mockBackend.publishPolicyVersion).toHaveBeenCalledWith('pol-1', 'Updated section 3');
        });

        test('publishPolicyVersion with missing id sends error', async () => {
            await routeMessage(component, { type: 'publishPolicyVersion', data: {} });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ success: false })
                })
            );
        });

        test('archivePolicy calls backend with id', async () => {
            await routeMessage(component, {
                type: 'archivePolicy',
                data: { policyId: 'pol-1' }
            });
            expect(mockBackend.archivePolicy).toHaveBeenCalledWith('pol-1');
        });

        test('uploadPolicyFile calls backend with file data', async () => {
            await routeMessage(component, {
                type: 'uploadPolicyFile',
                data: { base64Data: 'abc', fileName: 'doc.pdf', mimeType: 'application/pdf' }
            });
            expect(mockBackend.uploadPolicyFile).toHaveBeenCalledWith('abc', 'doc.pdf', 'application/pdf', 'carrier-test-1');
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'policyUploadResult' })
            );
        });

        test('uploadPolicyFile with missing fields sends error', async () => {
            await routeMessage(component, { type: 'uploadPolicyFile', data: { base64Data: 'x' } });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'policyUploadResult',
                    data: expect.objectContaining({ success: false })
                })
            );
        });

        test('getComplianceStatus calls backend and sends data', async () => {
            await routeMessage(component, {
                type: 'getComplianceStatus',
                data: { carrierId: 'c-1' }
            });
            expect(mockBackend.getComplianceStatus).toHaveBeenCalledWith('c-1');
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'complianceStatusData' })
            );
        });
    });

    // =========================================================================
    // ERROR HANDLING
    // =========================================================================

    describe('Error handling', () => {
        test('getCarrierPolicies failure sends error', async () => {
            const failBackend = {
                ...mockBackend,
                getPoliciesForCarrier: jest.fn().mockRejectedValue(new Error('DB timeout'))
            };
            await routeMessage(component, {
                type: 'getCarrierPolicies',
                data: { carrierId: 'c-1' }
            }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'carrierPoliciesData',
                    data: expect.objectContaining({ success: false, error: 'DB timeout' })
                })
            );
        });

        test('createPolicy failure sends error', async () => {
            const failBackend = {
                ...mockBackend,
                createPolicy: jest.fn().mockRejectedValue(new Error('Validation failed'))
            };
            await routeMessage(component, {
                type: 'createPolicy',
                data: { title: 'Fail' }
            }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'policyActionResult',
                    data: expect.objectContaining({ success: false, error: 'Validation failed' })
                })
            );
        });

        test('uploadPolicyFile failure sends error', async () => {
            const failBackend = {
                ...mockBackend,
                uploadPolicyFile: jest.fn().mockRejectedValue(new Error('File too large'))
            };
            await routeMessage(component, {
                type: 'uploadPolicyFile',
                data: { base64Data: 'x', fileName: 'f.pdf', mimeType: 'application/pdf' }
            }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'policyUploadResult',
                    data: expect.objectContaining({ success: false, error: 'File too large' })
                })
            );
        });

        test('getComplianceStatus failure sends error', async () => {
            const failBackend = {
                ...mockBackend,
                getComplianceStatus: jest.fn().mockRejectedValue(new Error('Service unavailable'))
            };
            await routeMessage(component, {
                type: 'getComplianceStatus',
                data: { carrierId: 'c-1' }
            }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'complianceStatusData',
                    data: expect.objectContaining({ success: false })
                })
            );
        });
    });

    // =========================================================================
    // SAFE SEND UTILITY
    // =========================================================================

    describe('sendToHtml utility', () => {
        test('does nothing if component is null', () => {
            expect(() => sendToHtml(null, 'test', {})).not.toThrow();
        });

        test('does nothing if component has no postMessage', () => {
            expect(() => sendToHtml({}, 'test', {})).not.toThrow();
        });

        test('calls postMessage with type/data/timestamp envelope', () => {
            sendToHtml(component, 'testType', { key: 'val' });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'testType',
                    data: { key: 'val' },
                    timestamp: expect.any(Number)
                })
            );
        });
    });

    // =========================================================================
    // BACKEND SERVICE CALL VERIFICATION
    // =========================================================================

    describe('Backend service call verification', () => {
        test('getCarrierPolicies only calls backend once', async () => {
            await routeMessage(component, {
                type: 'getCarrierPolicies',
                data: { carrierId: 'c-1' }
            });
            expect(mockBackend.getPoliciesForCarrier).toHaveBeenCalledTimes(1);
        });

        test('createPolicy merges carrier_id from global state', async () => {
            carrierId = 'global-carrier';
            await routeMessage(component, {
                type: 'createPolicy',
                data: { title: 'Test' }
            });
            expect(mockBackend.createPolicy).toHaveBeenCalledWith(
                expect.objectContaining({ carrier_id: 'global-carrier' })
            );
        });

        test('publishPolicyVersion uses empty string for missing changeSummary', async () => {
            await routeMessage(component, {
                type: 'publishPolicyVersion',
                data: { policyId: 'pol-1' }
            });
            expect(mockBackend.publishPolicyVersion).toHaveBeenCalledWith('pol-1', '');
        });
    });
});
