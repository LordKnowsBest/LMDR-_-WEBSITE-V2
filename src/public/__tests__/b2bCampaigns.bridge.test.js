/**
 * B2B Campaigns Bridge Tests
 *
 * Tests the Velo page code that wires B2B_CAMPAIGNS.html to
 * b2bSequenceService and b2bAnalyticsService.
 * Source: src/pages/B2B_CAMPAIGNS.rhlno.js
 *
 * Actions tested: getOutreachMetrics, getChannelPerformance, getRepPerformance
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

const PAGE_FILE = path.resolve(__dirname, '..', '..', 'pages', 'B2B_CAMPAIGNS.rhlno.js');
const sourceCode = fs.readFileSync(PAGE_FILE, 'utf8');

// =============================================================================
// MOCKS
// =============================================================================

function createMockComponent() {
    return { onMessage: jest.fn(), postMessage: jest.fn() };
}

const mockBackend = {
    getOutreachMetrics: jest.fn().mockResolvedValue({ sent: 100, opened: 60, replied: 20 }),
    getChannelPerformance: jest.fn().mockResolvedValue([{ channel: 'email', sent: 50, opened: 30 }]),
    getRepPerformance: jest.fn().mockResolvedValue([{ rep: 'Rep1', calls: 20, emails: 30 }])
};

// =============================================================================
// REPLICATED CORE LOGIC
// =============================================================================

function safeSend(component, data) {
    try { component.postMessage(data); } catch (err) { /* swallow */ }
}

async function routeMessage(component, msg, backend = mockBackend) {
    switch (msg.action) {
        case 'getOutreachMetrics': {
            try {
                const metrics = await backend.getOutreachMetrics({ days: msg.days || 30 });
                safeSend(component, { action: 'metricsLoaded', payload: metrics });
            } catch (error) {
                safeSend(component, { action: 'actionError', message: 'Failed to load metrics.' });
            }
            break;
        }
        case 'getChannelPerformance': {
            try {
                const channels = await backend.getChannelPerformance(msg.days || 30);
                safeSend(component, { action: 'channelsLoaded', payload: channels });
            } catch (error) {
                safeSend(component, { action: 'actionError', message: 'Failed to load channel data.' });
            }
            break;
        }
        case 'getRepPerformance': {
            try {
                const reps = await backend.getRepPerformance(msg.days || 30);
                safeSend(component, { action: 'repsLoaded', payload: reps });
            } catch (error) {
                safeSend(component, { action: 'actionError', message: 'Failed to load rep data.' });
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

describe('B2B Campaigns Bridge Tests', () => {
    let component;

    beforeEach(() => {
        component = createMockComponent();
        jest.clearAllMocks();
    });

    describe('Source file structure', () => {
        it('should exist and be readable', () => {
            expect(sourceCode.length).toBeGreaterThan(0);
        });

        it('should import from b2bSequenceService and b2bAnalyticsService', () => {
            expect(sourceCode).toMatch(/b2bSequenceService/);
            expect(sourceCode).toMatch(/b2bAnalyticsService/);
        });

        it('should handle all 3 actions', () => {
            expect(sourceCode).toContain("'getOutreachMetrics'");
            expect(sourceCode).toContain("'getChannelPerformance'");
            expect(sourceCode).toContain("'getRepPerformance'");
        });
    });

    describe('getOutreachMetrics', () => {
        it('should call backend and send metricsLoaded', async () => {
            const data = { sent: 200, opened: 120, replied: 40 };
            mockBackend.getOutreachMetrics.mockResolvedValueOnce(data);

            await routeMessage(component, { action: 'getOutreachMetrics' });

            expect(mockBackend.getOutreachMetrics).toHaveBeenCalledWith({ days: 30 });
            expect(component.postMessage).toHaveBeenCalledWith({ action: 'metricsLoaded', payload: data });
        });

        it('should pass custom days param', async () => {
            await routeMessage(component, { action: 'getOutreachMetrics', days: 7 });
            expect(mockBackend.getOutreachMetrics).toHaveBeenCalledWith({ days: 7 });
        });

        it('should send actionError on failure', async () => {
            mockBackend.getOutreachMetrics.mockRejectedValueOnce(new Error('fail'));
            await routeMessage(component, { action: 'getOutreachMetrics' });
            expect(component.postMessage).toHaveBeenCalledWith(expect.objectContaining({ action: 'actionError' }));
        });
    });

    describe('getChannelPerformance', () => {
        it('should call backend and send channelsLoaded', async () => {
            const data = [{ channel: 'email', sent: 100 }];
            mockBackend.getChannelPerformance.mockResolvedValueOnce(data);

            await routeMessage(component, { action: 'getChannelPerformance' });

            expect(mockBackend.getChannelPerformance).toHaveBeenCalledWith(30);
            expect(component.postMessage).toHaveBeenCalledWith({ action: 'channelsLoaded', payload: data });
        });

        it('should pass custom days', async () => {
            await routeMessage(component, { action: 'getChannelPerformance', days: 14 });
            expect(mockBackend.getChannelPerformance).toHaveBeenCalledWith(14);
        });

        it('should send actionError on failure', async () => {
            mockBackend.getChannelPerformance.mockRejectedValueOnce(new Error('fail'));
            await routeMessage(component, { action: 'getChannelPerformance' });
            expect(component.postMessage).toHaveBeenCalledWith(expect.objectContaining({ action: 'actionError' }));
        });
    });

    describe('getRepPerformance', () => {
        it('should call backend and send repsLoaded', async () => {
            const data = [{ rep: 'Alice', calls: 50 }];
            mockBackend.getRepPerformance.mockResolvedValueOnce(data);

            await routeMessage(component, { action: 'getRepPerformance' });

            expect(mockBackend.getRepPerformance).toHaveBeenCalledWith(30);
            expect(component.postMessage).toHaveBeenCalledWith({ action: 'repsLoaded', payload: data });
        });

        it('should send actionError on failure', async () => {
            mockBackend.getRepPerformance.mockRejectedValueOnce(new Error('fail'));
            await routeMessage(component, { action: 'getRepPerformance' });
            expect(component.postMessage).toHaveBeenCalledWith(expect.objectContaining({ action: 'actionError' }));
        });
    });

    describe('safeSend', () => {
        it('should not throw if postMessage throws', () => {
            component.postMessage.mockImplementation(() => { throw new Error('detached'); });
            expect(() => safeSend(component, { action: 'test' })).not.toThrow();
        });
    });
});
