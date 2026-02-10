/* eslint-disable */
/**
 * B2B Analytics Bridge Tests
 *
 * Tests the Velo page code that wires B2B_ANALYTICS.html to
 * b2bAnalyticsService and b2bPipelineService.
 * Source: src/pages/B2B_ANALYTICS.ab55b.js
 *
 * Actions tested (7): getDashboardKPIs, getStageConversions, getSourcePerformance,
 *   getCPA, getCompetitorIntel, saveSnapshot, addCompetitorIntel
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

const PAGE_FILE = path.resolve(__dirname, '..', '..', 'pages', 'B2B_ANALYTICS.ab55b.js');
const sourceCode = fs.readFileSync(PAGE_FILE, 'utf8');

// =============================================================================
// MOCKS
// =============================================================================

function createMockComponent() {
    return { onMessage: jest.fn(), postMessage: jest.fn() };
}

const mockBackend = {
    getDashboardKPIs: jest.fn().mockResolvedValue({ revenue: 100000, deals: 5 }),
    getStageConversions: jest.fn().mockResolvedValue({ stages: [] }),
    getSourcePerformance: jest.fn().mockResolvedValue({ sources: [] }),
    getCostPerAcquisition: jest.fn().mockResolvedValue({ cpa: 500 }),
    getCompetitorIntel: jest.fn().mockResolvedValue({ intel: [] }),
    saveSnapshot: jest.fn().mockResolvedValue({ success: true }),
    addCompetitorIntel: jest.fn().mockResolvedValue({ success: true })
};

// =============================================================================
// REPLICATED CORE LOGIC
// =============================================================================

function safeSend(component, data) {
    try { component.postMessage(data); } catch (err) { /* swallow */ }
}

async function routeMessage(component, msg, backend = mockBackend) {
    switch (msg.action) {
        case 'getDashboardKPIs': {
            try {
                const kpis = await backend.getDashboardKPIs({ days: msg.days || 30 });
                safeSend(component, { action: 'kpisLoaded', payload: kpis });
            } catch (error) {
                safeSend(component, { action: 'actionError', message: 'Failed to load KPIs.' });
            }
            break;
        }
        case 'getStageConversions': {
            try {
                const conversions = await backend.getStageConversions();
                safeSend(component, { action: 'conversionsLoaded', payload: conversions });
            } catch (error) {
                safeSend(component, { action: 'actionError', message: 'Failed to load conversions.' });
            }
            break;
        }
        case 'getSourcePerformance': {
            try {
                const sources = await backend.getSourcePerformance();
                safeSend(component, { action: 'sourcesLoaded', payload: sources });
            } catch (error) {
                safeSend(component, { action: 'actionError', message: 'Failed to load sources.' });
            }
            break;
        }
        case 'getCPA': {
            try {
                const cpa = await backend.getCostPerAcquisition(msg.days || 90);
                safeSend(component, { action: 'cpaLoaded', payload: cpa });
            } catch (error) {
                safeSend(component, { action: 'actionError', message: 'Failed to load CPA data.' });
            }
            break;
        }
        case 'getCompetitorIntel': {
            try {
                const intel = await backend.getCompetitorIntel();
                safeSend(component, { action: 'intelLoaded', payload: intel });
            } catch (error) {
                safeSend(component, { action: 'actionError', message: 'Failed to load competitor intel.' });
            }
            break;
        }
        case 'saveSnapshot': {
            try {
                await backend.saveSnapshot({ days: msg.days || 30 });
                safeSend(component, { action: 'snapshotSaved' });
            } catch (error) {
                safeSend(component, { action: 'actionError', message: 'Failed to save snapshot.' });
            }
            break;
        }
        case 'addCompetitorIntel': {
            try {
                await backend.addCompetitorIntel(msg.intel || {});
                safeSend(component, { action: 'actionSuccess', message: 'Intel added.' });
                const intel = await backend.getCompetitorIntel();
                safeSend(component, { action: 'intelLoaded', payload: intel });
            } catch (error) {
                safeSend(component, { action: 'actionError', message: 'Failed to add intel.' });
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

describe('B2B Analytics Bridge Tests', () => {
    let component;

    beforeEach(() => {
        component = createMockComponent();
        jest.clearAllMocks();
    });

    describe('Source file structure', () => {
        it('should exist and be readable', () => {
            expect(sourceCode.length).toBeGreaterThan(0);
        });

        it('should import from b2bAnalyticsService and b2bPipelineService', () => {
            expect(sourceCode).toMatch(/b2bAnalyticsService/);
            expect(sourceCode).toMatch(/b2bPipelineService/);
        });

        it('should handle all 7 actions', () => {
            ['getDashboardKPIs', 'getStageConversions', 'getSourcePerformance',
             'getCPA', 'getCompetitorIntel', 'saveSnapshot', 'addCompetitorIntel'
            ].forEach(action => {
                expect(sourceCode).toContain(`'${action}'`);
            });
        });
    });

    describe('getDashboardKPIs', () => {
        it('should send kpisLoaded', async () => {
            const data = { revenue: 200000, deals: 10 };
            mockBackend.getDashboardKPIs.mockResolvedValueOnce(data);
            await routeMessage(component, { action: 'getDashboardKPIs' });
            expect(mockBackend.getDashboardKPIs).toHaveBeenCalledWith({ days: 30 });
            expect(component.postMessage).toHaveBeenCalledWith({ action: 'kpisLoaded', payload: data });
        });

        it('should pass custom days', async () => {
            await routeMessage(component, { action: 'getDashboardKPIs', days: 7 });
            expect(mockBackend.getDashboardKPIs).toHaveBeenCalledWith({ days: 7 });
        });

        it('should send actionError on failure', async () => {
            mockBackend.getDashboardKPIs.mockRejectedValueOnce(new Error('fail'));
            await routeMessage(component, { action: 'getDashboardKPIs' });
            expect(component.postMessage).toHaveBeenCalledWith(expect.objectContaining({ action: 'actionError' }));
        });
    });

    describe('getStageConversions', () => {
        it('should send conversionsLoaded', async () => {
            const data = { stages: [{ from: 'discovery', to: 'proposal', rate: 0.4 }] };
            mockBackend.getStageConversions.mockResolvedValueOnce(data);
            await routeMessage(component, { action: 'getStageConversions' });
            expect(component.postMessage).toHaveBeenCalledWith({ action: 'conversionsLoaded', payload: data });
        });

        it('should send actionError on failure', async () => {
            mockBackend.getStageConversions.mockRejectedValueOnce(new Error('fail'));
            await routeMessage(component, { action: 'getStageConversions' });
            expect(component.postMessage).toHaveBeenCalledWith(expect.objectContaining({ action: 'actionError' }));
        });
    });

    describe('getSourcePerformance', () => {
        it('should send sourcesLoaded', async () => {
            const data = { sources: [{ name: 'organic', leads: 20 }] };
            mockBackend.getSourcePerformance.mockResolvedValueOnce(data);
            await routeMessage(component, { action: 'getSourcePerformance' });
            expect(component.postMessage).toHaveBeenCalledWith({ action: 'sourcesLoaded', payload: data });
        });

        it('should send actionError on failure', async () => {
            mockBackend.getSourcePerformance.mockRejectedValueOnce(new Error('fail'));
            await routeMessage(component, { action: 'getSourcePerformance' });
            expect(component.postMessage).toHaveBeenCalledWith(expect.objectContaining({ action: 'actionError' }));
        });
    });

    describe('getCPA', () => {
        it('should send cpaLoaded with default 90 days', async () => {
            await routeMessage(component, { action: 'getCPA' });
            expect(mockBackend.getCostPerAcquisition).toHaveBeenCalledWith(90);
        });

        it('should pass custom days', async () => {
            await routeMessage(component, { action: 'getCPA', days: 30 });
            expect(mockBackend.getCostPerAcquisition).toHaveBeenCalledWith(30);
        });

        it('should send actionError on failure', async () => {
            mockBackend.getCostPerAcquisition.mockRejectedValueOnce(new Error('fail'));
            await routeMessage(component, { action: 'getCPA' });
            expect(component.postMessage).toHaveBeenCalledWith(expect.objectContaining({ action: 'actionError' }));
        });
    });

    describe('getCompetitorIntel', () => {
        it('should send intelLoaded', async () => {
            const data = { intel: [{ name: 'Competitor A' }] };
            mockBackend.getCompetitorIntel.mockResolvedValueOnce(data);
            await routeMessage(component, { action: 'getCompetitorIntel' });
            expect(component.postMessage).toHaveBeenCalledWith({ action: 'intelLoaded', payload: data });
        });

        it('should send actionError on failure', async () => {
            mockBackend.getCompetitorIntel.mockRejectedValueOnce(new Error('fail'));
            await routeMessage(component, { action: 'getCompetitorIntel' });
            expect(component.postMessage).toHaveBeenCalledWith(expect.objectContaining({ action: 'actionError' }));
        });
    });

    describe('saveSnapshot', () => {
        it('should send snapshotSaved', async () => {
            await routeMessage(component, { action: 'saveSnapshot' });
            expect(mockBackend.saveSnapshot).toHaveBeenCalledWith({ days: 30 });
            expect(component.postMessage).toHaveBeenCalledWith({ action: 'snapshotSaved' });
        });

        it('should send actionError on failure', async () => {
            mockBackend.saveSnapshot.mockRejectedValueOnce(new Error('fail'));
            await routeMessage(component, { action: 'saveSnapshot' });
            expect(component.postMessage).toHaveBeenCalledWith(expect.objectContaining({ action: 'actionError' }));
        });
    });

    describe('addCompetitorIntel', () => {
        it('should send actionSuccess then refresh intelLoaded', async () => {
            await routeMessage(component, { action: 'addCompetitorIntel', intel: { name: 'New Intel' } });

            expect(mockBackend.addCompetitorIntel).toHaveBeenCalledWith({ name: 'New Intel' });
            expect(component.postMessage).toHaveBeenCalledWith({ action: 'actionSuccess', message: 'Intel added.' });
            expect(mockBackend.getCompetitorIntel).toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith(expect.objectContaining({ action: 'intelLoaded' }));
        });

        it('should default intel to empty object', async () => {
            await routeMessage(component, { action: 'addCompetitorIntel' });
            expect(mockBackend.addCompetitorIntel).toHaveBeenCalledWith({});
        });

        it('should send actionError on failure', async () => {
            mockBackend.addCompetitorIntel.mockRejectedValueOnce(new Error('fail'));
            await routeMessage(component, { action: 'addCompetitorIntel' });
            expect(component.postMessage).toHaveBeenCalledWith(expect.objectContaining({ action: 'actionError' }));
        });
    });
});
