/**
 * B2B Outreach Bridge Tests
 *
 * Tests the Velo page code that wires B2B_OUTREACH.html to b2bBridgeService.
 * Source: src/pages/B2B_OUTREACH.y9tsi.js
 *
 * UNIQUE PATTERN: Uses unified bridge (handleB2BAction) with MESSAGE_REGISTRY
 * validation. All recognized actions are routed through the bridge.
 *
 * Actions tested: getSequences, getSequence, saveSequence, addStep,
 *   getThrottleStatus, generateEmailContent, generateSmsContent,
 *   generateCallScript, saveDraft, approveDraft, getPendingDrafts
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

const PAGE_FILE = path.resolve(__dirname, '..', '..', 'pages', 'B2B_OUTREACH.y9tsi.js');
const sourceCode = fs.readFileSync(PAGE_FILE, 'utf8');

// =============================================================================
// MOCKS
// =============================================================================

function createMockComponent() {
    return { onMessage: jest.fn(), postMessage: jest.fn() };
}

const mockHandleB2BAction = jest.fn();

// =============================================================================
// REPLICATED CORE LOGIC
// =============================================================================

const MESSAGE_REGISTRY = {
    inbound: [
        'getSequences', 'getSequence', 'saveSequence', 'addStep',
        'getThrottleStatus',
        'generateEmailContent', 'generateSmsContent', 'generateCallScript',
        'saveDraft', 'approveDraft', 'getPendingDrafts'
    ],
    outbound: [
        'init', 'sequencesLoaded', 'sequenceLoaded', 'sequenceSaved', 'stepAdded',
        'throttleStatus', 'throttleLoaded',
        'emailContentGenerated', 'smsContentGenerated', 'callScriptGenerated',
        'draftSaved', 'draftApproved', 'draftsLoaded',
        'actionSuccess', 'actionError'
    ]
};

let htmlComponent = null;

function safeSend(message) {
    try {
        if (htmlComponent && htmlComponent.postMessage) {
            htmlComponent.postMessage(message);
        }
    } catch (e) { /* swallow */ }
}

async function routeMessage(message, handleB2BAction = mockHandleB2BAction) {
    const { action, ...params } = message;

    if (!MESSAGE_REGISTRY.inbound.includes(action)) {
        return;
    }

    try {
        const response = await handleB2BAction(action, params);
        safeSend(response);

        // Special handling for throttle status rename
        if (action === 'getThrottleStatus' && response.action === 'throttleLoaded') {
            safeSend({ action: 'throttleStatus', payload: response.payload });
        }
    } catch (error) {
        safeSend({ action: 'actionError', message: error.message || 'Action failed' });
    }
}

// =============================================================================
// TESTS
// =============================================================================

describe('B2B Outreach Bridge Tests', () => {
    beforeEach(() => {
        htmlComponent = createMockComponent();
        jest.clearAllMocks();
    });

    afterEach(() => {
        htmlComponent = null;
    });

    describe('Source file structure', () => {
        it('should exist and be readable', () => {
            expect(sourceCode.length).toBeGreaterThan(0);
        });

        it('should import handleB2BAction from b2bBridgeService', () => {
            expect(sourceCode).toMatch(/handleB2BAction.*b2bBridgeService/s);
        });

        it('should define MESSAGE_REGISTRY', () => {
            expect(sourceCode).toContain('MESSAGE_REGISTRY');
        });

        it('should have all inbound actions in registry', () => {
            MESSAGE_REGISTRY.inbound.forEach(action => {
                expect(sourceCode).toContain(`'${action}'`);
            });
        });

        it('should check MESSAGE_REGISTRY before routing', () => {
            expect(sourceCode).toContain('MESSAGE_REGISTRY.inbound.includes');
        });
    });

    describe('Sequence management', () => {
        it('should route getSequences through bridge', async () => {
            mockHandleB2BAction.mockResolvedValueOnce({ action: 'sequencesLoaded', payload: [] });
            await routeMessage({ action: 'getSequences', status: 'active' });
            expect(mockHandleB2BAction).toHaveBeenCalledWith('getSequences', { status: 'active' });
            expect(htmlComponent.postMessage).toHaveBeenCalledWith({ action: 'sequencesLoaded', payload: [] });
        });

        it('should route getSequence through bridge', async () => {
            const seq = { _id: 'seq-1', name: 'Test', steps: [] };
            mockHandleB2BAction.mockResolvedValueOnce({ action: 'sequenceLoaded', payload: seq });
            await routeMessage({ action: 'getSequence', sequenceId: 'seq-1' });
            expect(mockHandleB2BAction).toHaveBeenCalledWith('getSequence', { sequenceId: 'seq-1' });
        });

        it('should route saveSequence through bridge', async () => {
            mockHandleB2BAction.mockResolvedValueOnce({ action: 'sequenceSaved', payload: { _id: 'seq-new' } });
            await routeMessage({ action: 'saveSequence', name: 'New Seq', steps: [] });
            expect(mockHandleB2BAction).toHaveBeenCalledWith('saveSequence', { name: 'New Seq', steps: [] });
        });

        it('should route addStep through bridge', async () => {
            mockHandleB2BAction.mockResolvedValueOnce({ action: 'stepAdded', payload: { success: true } });
            await routeMessage({ action: 'addStep', sequenceId: 'seq-1', channel: 'email' });
            expect(mockHandleB2BAction).toHaveBeenCalledWith('addStep', { sequenceId: 'seq-1', channel: 'email' });
        });
    });

    describe('Throttle status', () => {
        it('should route getThrottleStatus and send dual messages', async () => {
            const payload = { allowed: true, remaining: 50 };
            mockHandleB2BAction.mockResolvedValueOnce({ action: 'throttleLoaded', payload });
            await routeMessage({ action: 'getThrottleStatus' });

            // Should send both the bridge response and the renamed action
            expect(htmlComponent.postMessage).toHaveBeenCalledWith({ action: 'throttleLoaded', payload });
            expect(htmlComponent.postMessage).toHaveBeenCalledWith({ action: 'throttleStatus', payload });
        });

        it('should not send throttleStatus if response action differs', async () => {
            mockHandleB2BAction.mockResolvedValueOnce({ action: 'someOther', payload: {} });
            await routeMessage({ action: 'getThrottleStatus' });
            expect(htmlComponent.postMessage).not.toHaveBeenCalledWith(
                expect.objectContaining({ action: 'throttleStatus' })
            );
        });
    });

    describe('AI content generation', () => {
        it('should route generateEmailContent', async () => {
            mockHandleB2BAction.mockResolvedValueOnce({ action: 'emailContentGenerated', payload: { content: 'Hi' } });
            await routeMessage({ action: 'generateEmailContent', accountId: 'acc-1' });
            expect(mockHandleB2BAction).toHaveBeenCalledWith('generateEmailContent', { accountId: 'acc-1' });
        });

        it('should route generateSmsContent', async () => {
            mockHandleB2BAction.mockResolvedValueOnce({ action: 'smsContentGenerated', payload: {} });
            await routeMessage({ action: 'generateSmsContent' });
            expect(mockHandleB2BAction).toHaveBeenCalledWith('generateSmsContent', {});
        });

        it('should route generateCallScript', async () => {
            mockHandleB2BAction.mockResolvedValueOnce({ action: 'callScriptGenerated', payload: {} });
            await routeMessage({ action: 'generateCallScript' });
            expect(mockHandleB2BAction).toHaveBeenCalledWith('generateCallScript', {});
        });
    });

    describe('Draft management', () => {
        it('should route saveDraft', async () => {
            mockHandleB2BAction.mockResolvedValueOnce({ action: 'draftSaved' });
            await routeMessage({ action: 'saveDraft', content: 'draft text' });
            expect(mockHandleB2BAction).toHaveBeenCalledWith('saveDraft', { content: 'draft text' });
        });

        it('should route approveDraft', async () => {
            mockHandleB2BAction.mockResolvedValueOnce({ action: 'draftApproved' });
            await routeMessage({ action: 'approveDraft', draftId: 'd-1' });
            expect(mockHandleB2BAction).toHaveBeenCalledWith('approveDraft', { draftId: 'd-1' });
        });

        it('should route getPendingDrafts', async () => {
            mockHandleB2BAction.mockResolvedValueOnce({ action: 'draftsLoaded', payload: [] });
            await routeMessage({ action: 'getPendingDrafts' });
            expect(mockHandleB2BAction).toHaveBeenCalledWith('getPendingDrafts', {});
        });
    });

    describe('Error handling', () => {
        it('should send actionError when bridge throws', async () => {
            mockHandleB2BAction.mockRejectedValueOnce(new Error('Bridge failed'));
            await routeMessage({ action: 'getSequences' });
            expect(htmlComponent.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Bridge failed'
            });
        });

        it('should use fallback message if error has no message', async () => {
            mockHandleB2BAction.mockRejectedValueOnce(new Error());
            await routeMessage({ action: 'getSequences' });
            expect(htmlComponent.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Action failed'
            });
        });
    });

    describe('Unknown actions', () => {
        it('should not route unknown actions', async () => {
            await routeMessage({ action: 'unknownAction' });
            expect(mockHandleB2BAction).not.toHaveBeenCalled();
        });

        it('should not route actions not in MESSAGE_REGISTRY', async () => {
            await routeMessage({ action: 'deleteSequence' });
            expect(mockHandleB2BAction).not.toHaveBeenCalled();
        });
    });

    describe('safeSend', () => {
        it('should not throw if component is null', () => {
            htmlComponent = null;
            expect(() => safeSend({ action: 'test' })).not.toThrow();
        });

        it('should not throw if postMessage throws', () => {
            htmlComponent.postMessage.mockImplementation(() => { throw new Error('detached'); });
            expect(() => safeSend({ action: 'test' })).not.toThrow();
        });
    });
});
