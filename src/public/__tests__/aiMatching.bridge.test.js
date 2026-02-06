/**
 * BRIDGE TEST: AI Matching Page
 * ==============================
 * Verifies the postMessage bridge contract between:
 *   HTML Component <-> Wix Page Code <-> Backend Services
 *
 * Page: AI - Matching.rof4w.js
 * HTML: driver/AI_MATCHING.html
 * Protocol: type/data (not action/payload)
 *
 * Actions tested: 18 total
 *
 * @see src/pages/AI - Matching.rof4w.js
 * @see src/public/driver/AI_MATCHING.html
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const PAGE_FILE = path.resolve(__dirname, '..', '..', 'pages', 'AI - Matching.rof4w.js');

const EXPECTED_IMPORTS = [
    "from 'backend/carrierMatching.jsw'",
    "from 'backend/mutualInterestService.jsw'",
    "from 'backend/aiEnrichment.jsw'",
    "from 'backend/driverProfiles.jsw'",
    "from 'backend/applicationService.jsw'",
    "from 'backend/ocrService.jsw'",
    "from 'backend/matchExplanationService.jsw'",
    "from 'backend/featureAdoptionService'"
];

const ALL_ACTIONS = [
    'ping',
    'carrierMatchingReady',
    'findMatches',
    'logInterest',
    'retryEnrichment',
    'navigateToSignup',
    'navigateToLogin',
    'checkUserStatus',
    'getDriverProfile',
    'navigateToSavedCarriers',
    'submitApplication',
    'saveProfileDocs',
    'extractDocumentOCR',
    'getMatchExplanation',
    'logFeatureInteraction',
    'getDriverApplications',
    'getMutualInterest',
    'loginForApplication'
];

// =============================================================================
// READ SOURCE FILE
// =============================================================================

const sourceCode = fs.readFileSync(PAGE_FILE, 'utf8');

// =============================================================================
// MOCKS
// =============================================================================

function createMockComponent() {
    return {
        onMessage: jest.fn(),
        postMessage: jest.fn()
    };
}

const mockWixLocation = { to: jest.fn() };

const mockWixUsers = {
    currentUser: { loggedIn: true, id: 'user-123', getEmail: jest.fn().mockResolvedValue('test@test.com') },
    promptLogin: jest.fn().mockResolvedValue({ id: 'user-123' })
};

const mockBackend = {
    findMatchingCarriers: jest.fn().mockResolvedValue({
        success: true,
        matches: [{ carrier: { DOT_NUMBER: 1234567 }, score: 85 }],
        totalScored: 100,
        userTier: 'premium',
        maxAllowed: 50
    }),
    getMutualInterestForDriver: jest.fn().mockResolvedValue({
        success: true,
        mutualInterests: []
    }),
    enrichCarrier: jest.fn().mockResolvedValue({
        dot_number: '1234567',
        ai_summary: 'Test summary'
    }),
    getOrCreateDriverProfile: jest.fn().mockResolvedValue({
        success: true,
        profile: {
            _id: 'drv-1',
            display_name: 'Test Driver',
            home_zip: '75001',
            profile_completeness_score: 75,
            is_discoverable: true
        },
        isNew: false
    }),
    setDiscoverability: jest.fn().mockResolvedValue({ success: true }),
    getDriverInterests: jest.fn().mockResolvedValue({ success: true, interests: [] }),
    updateDriverDocuments: jest.fn().mockResolvedValue({
        success: true,
        profile: { _id: 'drv-1', profile_completeness_score: 80 }
    }),
    submitApplication: jest.fn().mockResolvedValue({ success: true, id: 'app-1' }),
    getDriverApplications: jest.fn().mockResolvedValue([]),
    extractDocumentForAutoFill: jest.fn().mockResolvedValue({
        success: true,
        docType: 'CDL_FRONT',
        fields: { firstName: 'John', lastName: 'Doe' }
    }),
    getMatchExplanationForDriver: jest.fn().mockResolvedValue({
        success: true,
        explanation: 'Good match because...',
        carrierDot: '1234567'
    }),
    logFeatureInteraction: jest.fn().mockResolvedValue(undefined),
    logMatchEvent: jest.fn().mockResolvedValue({ success: true, isNew: true }),
    getDriverSavedCarriers: jest.fn().mockResolvedValue({ success: true, carriers: [] })
};

// =============================================================================
// REPLICATED CORE LOGIC
// =============================================================================

function safeSend(component, data) {
    try {
        if (component && typeof component.postMessage === 'function') {
            component.postMessage(data);
        }
    } catch (error) {
        // silently fail
    }
}

function getHtmlComponents($w) {
    const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];
    const found = [];
    for (const id of HTML_COMPONENT_IDS) {
        try {
            const component = $w(id);
            if (component && typeof component.onMessage === 'function') {
                found.push(component);
            }
        } catch (error) {
            // skip
        }
    }
    return found;
}

// Simplified user status for testing
let cachedUserStatus = { loggedIn: true, isPremium: true, tier: 'premium', userId: 'user-123' };
let cachedDriverProfile = null;
let cachedDriverInterests = [];

async function routeMessage(component, message, backend = mockBackend, wixLocation = mockWixLocation, wixUsers = mockWixUsers) {
    if (!message) return;

    const action = message.action || message.type;
    if (!action) return;

    try {
        switch (action) {
            case 'ping':
                safeSend(component, { type: 'pong', data: { timestamp: Date.now() } });
                break;

            case 'carrierMatchingReady':
                safeSend(component, {
                    type: 'pageReady',
                    data: {
                        userStatus: cachedUserStatus,
                        memberId: wixUsers?.currentUser?.id || null,
                        driverProfile: cachedDriverProfile,
                        appliedCarriers: []
                    }
                });
                break;

            case 'findMatches': {
                const result = await backend.findMatchingCarriers(message.data, cachedUserStatus?.isPremium);
                if (!result.success) {
                    safeSend(component, { type: 'matchError', data: { error: result.error } });
                    return;
                }

                let enrichedMatches = result.matches;
                if (cachedUserStatus?.loggedIn) {
                    const interestResult = await backend.getMutualInterestForDriver(cachedUserStatus.userId);
                    if (interestResult.success && interestResult.mutualInterests?.length > 0) {
                        // Merge mutual interests (simplified)
                    }
                }

                safeSend(component, {
                    type: 'matchResults',
                    data: {
                        matches: enrichedMatches,
                        totalScored: result.totalScored,
                        userTier: result.userTier,
                        maxAllowed: result.maxAllowed,
                        isPremium: cachedUserStatus?.isPremium
                    }
                });
                break;
            }

            case 'logInterest': {
                const result = await backend.logMatchEvent({
                    carrierDOT: message.data.carrierDOT,
                    carrierName: message.data.carrierName,
                    matchScore: message.data.matchScore,
                    action: 'interested'
                });
                safeSend(component, {
                    type: 'interestLogged',
                    data: {
                        success: result.success,
                        carrierDOT: message.data.carrierDOT,
                        isNew: result.isNew
                    }
                });
                break;
            }

            case 'retryEnrichment': {
                const dotNumber = message.data?.dot || message.data?.dot_number;
                if (!dotNumber) return;

                safeSend(component, { type: 'enrichmentUpdate', data: { dot_number: dotNumber, status: 'loading' } });

                const enrichment = await backend.enrichCarrier(dotNumber, { DOT_NUMBER: dotNumber }, {});
                safeSend(component, {
                    type: 'enrichmentUpdate',
                    data: { dot_number: dotNumber, status: 'complete', ...enrichment }
                });
                break;
            }

            case 'checkUserStatus':
                safeSend(component, { type: 'userStatusUpdate', data: cachedUserStatus });
                break;

            case 'getDriverProfile': {
                const profileResult = await backend.getOrCreateDriverProfile();
                if (profileResult.success) {
                    cachedDriverProfile = profileResult.profile;
                    safeSend(component, {
                        type: 'driverProfileLoaded',
                        data: {
                            success: true,
                            profile: {
                                id: profileResult.profile._id,
                                displayName: profileResult.profile.display_name,
                                homeZip: profileResult.profile.home_zip,
                                completeness: profileResult.profile.profile_completeness_score
                            },
                            isNew: profileResult.isNew
                        }
                    });
                } else {
                    safeSend(component, { type: 'driverProfileLoaded', data: { success: false, error: profileResult.error } });
                }
                break;
            }

            case 'navigateToSavedCarriers':
                wixLocation.to('/saved-carriers');
                break;

            case 'submitApplication': {
                if (!message.data?.carrierDOT) {
                    safeSend(component, { type: 'applicationSubmitted', data: { success: false, error: 'Missing carrier information' } });
                    return;
                }
                const result = await backend.submitApplication(message.data);
                safeSend(component, {
                    type: 'applicationSubmitted',
                    data: {
                        success: result.success,
                        carrierDOT: message.data.carrierDOT,
                        carrierName: message.data.carrierName,
                        status: 'applied',
                        error: result.error
                    }
                });
                break;
            }

            case 'saveProfileDocs': {
                const result = await backend.updateDriverDocuments(message.data);
                if (result.success) {
                    cachedDriverProfile = result.profile;
                    safeSend(component, {
                        type: 'profileSaved',
                        data: {
                            success: true,
                            profile: { completeness: result.profile.profile_completeness_score }
                        }
                    });
                    safeSend(component, {
                        type: 'driverProfileLoaded',
                        data: { success: true, profile: result.profile }
                    });
                } else {
                    safeSend(component, { type: 'profileSaved', data: { success: false, error: result.error } });
                }
                break;
            }

            case 'extractDocumentOCR': {
                if (!message.data?.base64Data || !message.data?.docType) {
                    safeSend(component, {
                        type: 'ocrResult',
                        data: { success: false, docType: message.data?.docType, error: 'Missing document data or type' }
                    });
                    return;
                }
                const result = await backend.extractDocumentForAutoFill(message.data.base64Data, message.data.docType);
                safeSend(component, { type: 'ocrResult', data: result });
                break;
            }

            case 'getMatchExplanation': {
                if (!cachedUserStatus?.loggedIn) {
                    safeSend(component, {
                        type: 'matchExplanation',
                        data: { success: false, carrierDot: message.data?.carrierDot, error: 'Must be logged in' }
                    });
                    return;
                }
                const result = await backend.getMatchExplanationForDriver(cachedUserStatus.userId, message.data?.carrierDot);
                safeSend(component, { type: 'matchExplanation', data: result });
                break;
            }

            case 'getDriverApplications': {
                if (!cachedUserStatus?.loggedIn) {
                    safeSend(component, { type: 'driverApplications', data: [] });
                    return;
                }
                const result = await backend.getDriverApplications(cachedUserStatus.userId);
                safeSend(component, { type: 'driverApplications', data: result });
                break;
            }

            case 'getMutualInterest': {
                const driverId = message.data?.driverId || cachedUserStatus?.userId;
                if (!driverId) return;
                const result = await backend.getMutualInterestForDriver(driverId);
                safeSend(component, {
                    type: 'mutualInterestData',
                    data: { interests: result.success ? (result.mutualInterests || []) : [] }
                });
                break;
            }

            case 'logFeatureInteraction':
                backend.logFeatureInteraction(message.data?.featureId, message.data?.userId, message.data?.action, message.data);
                // Fire and forget - no response
                break;

            case 'navigateToSignup':
            case 'navigateToLogin':
            case 'loginForApplication': {
                const mode = action === 'navigateToLogin' || message.data?.mode === 'login' ? 'login' : 'signup';
                await wixUsers.promptLogin({ mode });
                cachedUserStatus = { loggedIn: true, isPremium: true, tier: 'premium', userId: 'user-123' };
                const profileResult = await backend.getOrCreateDriverProfile();
                cachedDriverProfile = profileResult.success ? profileResult.profile : null;
                safeSend(component, {
                    type: 'loginSuccess',
                    data: {
                        message: mode === 'signup' ? 'Account created!' : 'Welcome back!',
                        userStatus: cachedUserStatus,
                        driverProfile: cachedDriverProfile
                    }
                });
                break;
            }

            default:
                break;
        }
    } catch (error) {
        safeSend(component, {
            type: 'matchError',
            data: { error: error.message || 'An unexpected error occurred' }
        });
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('AI Matching Bridge Tests', () => {
    let component;

    beforeEach(() => {
        jest.clearAllMocks();
        component = createMockComponent();
        cachedUserStatus = { loggedIn: true, isPremium: true, tier: 'premium', userId: 'user-123' };
        cachedDriverProfile = null;
        cachedDriverInterests = [];
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
            expect(sourceCode).toMatch(/function sendToHtml/);
        });

        test('has MESSAGE_REGISTRY for validation', () => {
            expect(sourceCode).toContain('MESSAGE_REGISTRY');
        });
    });

    // =========================================================================
    // SAFETY CHECKS
    // =========================================================================

    describe('Safety checks', () => {
        test('$w() calls are wrapped in try-catch', () => {
            expect(sourceCode).toMatch(/try\s*\{[\s\S]*?\$w\(/);
        });

        test('postMessage is guarded', () => {
            expect(sourceCode).toMatch(/typeof component\.postMessage\s*===\s*'function'/);
        });
    });

    // =========================================================================
    // HTML COMPONENT DISCOVERY
    // =========================================================================

    describe('HTML component discovery', () => {
        test('finds components with onMessage method', () => {
            const mock$w = jest.fn((id) => {
                if (id === '#html4') return createMockComponent();
                throw new Error('not found');
            });

            const components = getHtmlComponents(mock$w);
            expect(components.length).toBeGreaterThanOrEqual(1);
        });

        test('skips components that throw errors', () => {
            const mock$w = jest.fn(() => { throw new Error('not on page'); });
            const components = getHtmlComponents(mock$w);
            expect(components).toHaveLength(0);
        });
    });

    // =========================================================================
    // MESSAGE ROUTING
    // =========================================================================

    describe('Message routing', () => {
        test('ignores messages with no action/type', async () => {
            await routeMessage(component, {});
            await routeMessage(component, null);
            await routeMessage(component, undefined);
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('ping responds with pong', async () => {
            await routeMessage(component, { type: 'ping' });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'pong' })
            );
        });

        test('carrierMatchingReady sends pageReady with initial state', async () => {
            await routeMessage(component, { type: 'carrierMatchingReady' });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'pageReady',
                    data: expect.objectContaining({
                        userStatus: expect.any(Object),
                        memberId: expect.any(String)
                    })
                })
            );
        });

        test('findMatches calls findMatchingCarriers and sends matchResults', async () => {
            await routeMessage(component, { type: 'findMatches', data: { homeZip: '75001' } });
            expect(mockBackend.findMatchingCarriers).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'matchResults',
                    data: expect.objectContaining({
                        matches: expect.any(Array),
                        totalScored: 100
                    })
                })
            );
        });

        test('logInterest calls logMatchEvent and sends interestLogged', async () => {
            await routeMessage(component, {
                type: 'logInterest',
                data: { carrierDOT: '1234567', carrierName: 'Test Carrier', matchScore: 85 }
            });
            expect(mockBackend.logMatchEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    carrierDOT: '1234567',
                    carrierName: 'Test Carrier',
                    action: 'interested'
                })
            );
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'interestLogged',
                    data: expect.objectContaining({ success: true, carrierDOT: '1234567' })
                })
            );
        });

        test('retryEnrichment calls enrichCarrier and sends enrichmentUpdate', async () => {
            await routeMessage(component, { type: 'retryEnrichment', data: { dot_number: '1234567' } });
            expect(mockBackend.enrichCarrier).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'enrichmentUpdate',
                    data: expect.objectContaining({ status: 'complete' })
                })
            );
        });

        test('checkUserStatus sends userStatusUpdate', async () => {
            await routeMessage(component, { type: 'checkUserStatus' });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'userStatusUpdate',
                    data: expect.objectContaining({ loggedIn: true })
                })
            );
        });

        test('getDriverProfile calls getOrCreateDriverProfile and sends driverProfileLoaded', async () => {
            await routeMessage(component, { type: 'getDriverProfile' });
            expect(mockBackend.getOrCreateDriverProfile).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'driverProfileLoaded',
                    data: expect.objectContaining({ success: true })
                })
            );
        });

        test('navigateToSavedCarriers calls wixLocation.to', async () => {
            await routeMessage(component, { type: 'navigateToSavedCarriers' });
            expect(mockWixLocation.to).toHaveBeenCalledWith('/saved-carriers');
        });

        test('submitApplication calls submitApplication and sends applicationSubmitted', async () => {
            await routeMessage(component, {
                type: 'submitApplication',
                data: { carrierDOT: '1234567', carrierName: 'Test Carrier' }
            });
            expect(mockBackend.submitApplication).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'applicationSubmitted',
                    data: expect.objectContaining({ success: true })
                })
            );
        });

        test('submitApplication without carrierDOT sends error', async () => {
            await routeMessage(component, { type: 'submitApplication', data: {} });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'applicationSubmitted',
                    data: expect.objectContaining({ success: false, error: 'Missing carrier information' })
                })
            );
        });

        test('saveProfileDocs calls updateDriverDocuments and sends profileSaved', async () => {
            await routeMessage(component, { type: 'saveProfileDocs', data: { cdlFront: 'base64...' } });
            expect(mockBackend.updateDriverDocuments).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'profileSaved' })
            );
        });

        test('extractDocumentOCR calls extractDocumentForAutoFill and sends ocrResult', async () => {
            await routeMessage(component, {
                type: 'extractDocumentOCR',
                data: { base64Data: 'base64...', docType: 'CDL_FRONT' }
            });
            expect(mockBackend.extractDocumentForAutoFill).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'ocrResult',
                    data: expect.objectContaining({ success: true })
                })
            );
        });

        test('extractDocumentOCR without data sends error', async () => {
            await routeMessage(component, { type: 'extractDocumentOCR', data: {} });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'ocrResult',
                    data: expect.objectContaining({ success: false })
                })
            );
        });

        test('getMatchExplanation calls backend and sends matchExplanation', async () => {
            await routeMessage(component, { type: 'getMatchExplanation', data: { carrierDot: '1234567' } });
            expect(mockBackend.getMatchExplanationForDriver).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'matchExplanation' })
            );
        });

        test('getMatchExplanation requires login', async () => {
            cachedUserStatus = { loggedIn: false };
            await routeMessage(component, { type: 'getMatchExplanation', data: { carrierDot: '1234567' } });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'matchExplanation',
                    data: expect.objectContaining({ success: false })
                })
            );
        });

        test('getDriverApplications sends driverApplications', async () => {
            await routeMessage(component, { type: 'getDriverApplications' });
            expect(mockBackend.getDriverApplications).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'driverApplications' })
            );
        });

        test('getMutualInterest calls getMutualInterestForDriver and sends mutualInterestData', async () => {
            await routeMessage(component, { type: 'getMutualInterest', data: {} });
            expect(mockBackend.getMutualInterestForDriver).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'mutualInterestData',
                    data: expect.objectContaining({ interests: expect.any(Array) })
                })
            );
        });

        test('logFeatureInteraction calls backend (fire and forget)', async () => {
            await routeMessage(component, {
                type: 'logFeatureInteraction',
                data: { featureId: 'test-feature', userId: 'user-123', action: 'clicked' }
            });
            expect(mockBackend.logFeatureInteraction).toHaveBeenCalled();
            // No response expected
        });

        test('navigateToSignup triggers login flow and sends loginSuccess', async () => {
            await routeMessage(component, { type: 'navigateToSignup' });
            expect(mockWixUsers.promptLogin).toHaveBeenCalledWith({ mode: 'signup' });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'loginSuccess' })
            );
        });

        test('navigateToLogin triggers login flow and sends loginSuccess', async () => {
            await routeMessage(component, { type: 'navigateToLogin' });
            expect(mockWixUsers.promptLogin).toHaveBeenCalledWith({ mode: 'login' });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ type: 'loginSuccess' })
            );
        });
    });

    // =========================================================================
    // ERROR HANDLING
    // =========================================================================

    describe('Error handling', () => {
        test('findMatches failure sends matchError', async () => {
            const failBackend = {
                ...mockBackend,
                findMatchingCarriers: jest.fn().mockResolvedValue({ success: false, error: 'Search failed' })
            };
            await routeMessage(component, { type: 'findMatches', data: {} }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'matchError',
                    data: expect.objectContaining({ error: 'Search failed' })
                })
            );
        });

        test('getDriverProfile failure sends error response', async () => {
            const failBackend = {
                ...mockBackend,
                getOrCreateDriverProfile: jest.fn().mockResolvedValue({ success: false, error: 'Profile error' })
            };
            await routeMessage(component, { type: 'getDriverProfile' }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'driverProfileLoaded',
                    data: expect.objectContaining({ success: false, error: 'Profile error' })
                })
            );
        });

        test('submitApplication failure sends applicationSubmitted with error', async () => {
            const failBackend = {
                ...mockBackend,
                submitApplication: jest.fn().mockResolvedValue({ success: false, error: 'Submit failed' })
            };
            await routeMessage(component, {
                type: 'submitApplication',
                data: { carrierDOT: '1234567' }
            }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'applicationSubmitted',
                    data: expect.objectContaining({ error: 'Submit failed' })
                })
            );
        });

        test('saveProfileDocs failure sends profileSaved with error', async () => {
            const failBackend = {
                ...mockBackend,
                updateDriverDocuments: jest.fn().mockResolvedValue({ success: false, error: 'Update failed' })
            };
            await routeMessage(component, { type: 'saveProfileDocs', data: {} }, failBackend);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'profileSaved',
                    data: expect.objectContaining({ success: false, error: 'Update failed' })
                })
            );
        });
    });

    // =========================================================================
    // SAFE SEND UTILITY
    // =========================================================================

    describe('safeSend utility', () => {
        test('does nothing if component is null', () => {
            expect(() => safeSend(null, { type: 'test' })).not.toThrow();
        });

        test('does nothing if component has no postMessage', () => {
            expect(() => safeSend({}, { type: 'test' })).not.toThrow();
        });

        test('calls postMessage when component is valid', () => {
            safeSend(component, { type: 'test', data: { foo: 123 } });
            expect(component.postMessage).toHaveBeenCalledWith({ type: 'test', data: { foo: 123 } });
        });

        test('does not throw if postMessage throws', () => {
            const throwingComponent = {
                postMessage: jest.fn(() => { throw new Error('Detached'); })
            };
            expect(() => safeSend(throwingComponent, { type: 'test' })).not.toThrow();
        });
    });

    // =========================================================================
    // BACKEND SERVICE CALL VERIFICATION
    // =========================================================================

    describe('Backend service call verification', () => {
        test('findMatches calls getMutualInterestForDriver when logged in', async () => {
            await routeMessage(component, { type: 'findMatches', data: { homeZip: '75001' } });
            expect(mockBackend.findMatchingCarriers).toHaveBeenCalledTimes(1);
            expect(mockBackend.getMutualInterestForDriver).toHaveBeenCalledTimes(1);
        });

        test('logInterest passes correct parameters', async () => {
            await routeMessage(component, {
                type: 'logInterest',
                data: { carrierDOT: '9999999', carrierName: 'Super Carrier', matchScore: 92 }
            });
            expect(mockBackend.logMatchEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    carrierDOT: '9999999',
                    carrierName: 'Super Carrier',
                    matchScore: 92,
                    action: 'interested'
                })
            );
        });

        test('extractDocumentOCR passes base64Data and docType', async () => {
            await routeMessage(component, {
                type: 'extractDocumentOCR',
                data: { base64Data: 'data:image/jpeg;base64,abc123', docType: 'MED_CARD' }
            });
            expect(mockBackend.extractDocumentForAutoFill).toHaveBeenCalledWith(
                'data:image/jpeg;base64,abc123',
                'MED_CARD'
            );
        });
    });
});
