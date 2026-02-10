/* eslint-disable */
/**
 * B2B Research Panel Bridge Tests
 *
 * Tests the Velo page code that wires B2B_RESEARCH_PANEL.html to b2bResearchAgentService.
 * Source: src/pages/B2B_RESEARCH_PANEL.mz9zk.js
 *
 * Actions tested: generateBrief (with validation branches)
 * Special: init sends accountId from URL query params
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

const PAGE_FILE = path.resolve(__dirname, '..', '..', 'pages', 'B2B_RESEARCH_PANEL.mz9zk.js');
const sourceCode = fs.readFileSync(PAGE_FILE, 'utf8');

// =============================================================================
// MOCKS
// =============================================================================

function createMockComponent() {
    return { onMessage: jest.fn(), postMessage: jest.fn() };
}

const mockBackend = {
    generateBrief: jest.fn().mockResolvedValue({ brief: { summary: 'Test brief', sections: [] }, cached: false }),
    getBrief: jest.fn().mockResolvedValue(null)
};

// =============================================================================
// REPLICATED CORE LOGIC
// =============================================================================

function safeSend(component, data) {
    try { component.postMessage(data); } catch (err) { /* swallow */ }
}

async function routeMessage(component, msg, backend = mockBackend) {
    switch (msg.action) {
        case 'generateBrief': {
            try {
                if (!msg.accountId) {
                    safeSend(component, { action: 'actionError', message: 'No account selected.' });
                    return;
                }

                safeSend(component, { action: 'briefGenerating' });

                const result = await backend.generateBrief(msg.accountId, !!msg.forceRefresh);

                safeSend(component, {
                    action: 'briefLoaded',
                    payload: {
                        brief: result.brief || result,
                        cached: !!result.cached
                    }
                });
            } catch (error) {
                safeSend(component, { action: 'actionError', message: 'Failed to generate brief.' });
            }
            break;
        }
        default:
            break;
    }
}

// =============================================================================
// TESTS
// =============================================================================

describe('B2B Research Panel Bridge Tests', () => {
    let component;

    beforeEach(() => {
        component = createMockComponent();
        jest.clearAllMocks();
    });

    describe('Source file structure', () => {
        it('should exist and be readable', () => {
            expect(sourceCode.length).toBeGreaterThan(0);
        });

        it('should import from b2bResearchAgentService', () => {
            expect(sourceCode).toMatch(/b2bResearchAgentService/);
        });

        it('should import wixLocationFrontend for URL query', () => {
            expect(sourceCode).toMatch(/wix-location-frontend/);
        });

        it('should handle generateBrief action', () => {
            expect(sourceCode).toContain("'generateBrief'");
        });

        it('should send init with accountId from URL query', () => {
            expect(sourceCode).toMatch(/action:\s*'init'.*accountId/s);
        });
    });

    describe('generateBrief - valid accountId', () => {
        it('should send briefGenerating then briefLoaded', async () => {
            const briefData = { brief: { summary: 'Analysis', sections: ['Overview'] }, cached: false };
            mockBackend.generateBrief.mockResolvedValueOnce(briefData);

            await routeMessage(component, { action: 'generateBrief', accountId: 'acc-123' });

            expect(component.postMessage).toHaveBeenCalledWith({ action: 'briefGenerating' });
            expect(mockBackend.generateBrief).toHaveBeenCalledWith('acc-123', false);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'briefLoaded',
                payload: { brief: briefData.brief, cached: false }
            });
        });

        it('should pass forceRefresh boolean', async () => {
            await routeMessage(component, { action: 'generateBrief', accountId: 'acc-123', forceRefresh: true });
            expect(mockBackend.generateBrief).toHaveBeenCalledWith('acc-123', true);
        });

        it('should convert truthy forceRefresh to boolean', async () => {
            await routeMessage(component, { action: 'generateBrief', accountId: 'acc-123', forceRefresh: 'yes' });
            expect(mockBackend.generateBrief).toHaveBeenCalledWith('acc-123', true);
        });

        it('should handle result.brief vs flat result (backward compat)', async () => {
            // When result has no .brief property, use result directly
            const flatResult = { summary: 'Flat brief', cached: false };
            mockBackend.generateBrief.mockResolvedValueOnce(flatResult);

            await routeMessage(component, { action: 'generateBrief', accountId: 'acc-123' });

            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'briefLoaded',
                payload: { brief: flatResult, cached: false }
            });
        });

        it('should extract .brief when present', async () => {
            const wrappedResult = { brief: { summary: 'Wrapped' }, cached: true };
            mockBackend.generateBrief.mockResolvedValueOnce(wrappedResult);

            await routeMessage(component, { action: 'generateBrief', accountId: 'acc-123' });

            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'briefLoaded',
                payload: { brief: { summary: 'Wrapped' }, cached: true }
            });
        });
    });

    describe('generateBrief - missing accountId', () => {
        it('should send actionError without calling backend', async () => {
            await routeMessage(component, { action: 'generateBrief' });

            expect(mockBackend.generateBrief).not.toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'No account selected.'
            });
        });

        it('should send actionError for empty accountId', async () => {
            await routeMessage(component, { action: 'generateBrief', accountId: '' });
            expect(mockBackend.generateBrief).not.toHaveBeenCalled();
        });
    });

    describe('generateBrief - backend failure', () => {
        it('should send actionError on backend error', async () => {
            mockBackend.generateBrief.mockRejectedValueOnce(new Error('AI service down'));

            await routeMessage(component, { action: 'generateBrief', accountId: 'acc-123' });

            // Should have sent briefGenerating first
            expect(component.postMessage).toHaveBeenCalledWith({ action: 'briefGenerating' });
            // Then error
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Failed to generate brief.'
            });
        });
    });

    describe('safeSend', () => {
        it('should not throw if postMessage throws', () => {
            component.postMessage.mockImplementation(() => { throw new Error('detached'); });
            expect(() => safeSend(component, { action: 'test' })).not.toThrow();
        });
    });
});
