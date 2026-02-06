/**
 * B2B Pipeline Bridge Tests
 *
 * Tests the Velo page code that wires B2B_PIPELINE.html to b2bPipelineService.
 * Source: src/pages/B2B_PIPELINE.qsh6m.js
 *
 * Actions tested: getPipeline, getForecast, viewAccount
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// SOURCE FILE REFERENCE
// =============================================================================

const PAGE_FILE = path.resolve(__dirname, '..', '..', 'pages', 'B2B_PIPELINE.qsh6m.js');
const sourceCode = fs.readFileSync(PAGE_FILE, 'utf8');

// =============================================================================
// MOCKS
// =============================================================================

function createMockComponent() {
    return { onMessage: jest.fn(), postMessage: jest.fn() };
}

const mockWixLocation = { to: jest.fn() };

const mockBackend = {
    getPipelineView: jest.fn().mockResolvedValue({ stages: [], totalValue: 0, dealCount: 0 }),
    getForecast: jest.fn().mockResolvedValue({ projected: 0, confidence: 0.5 })
};

// =============================================================================
// REPLICATED CORE LOGIC
// =============================================================================

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

function findHtmlComponent($w) {
    for (const id of HTML_COMPONENT_IDS) {
        try {
            const el = $w(id);
            if (el && typeof el.onMessage === 'function') return el;
        } catch (e) { /* skip */ }
    }
    return null;
}

function safeSend(component, data) {
    try { component.postMessage(data); } catch (err) { /* swallow */ }
}

async function routeMessage(component, msg, backend = mockBackend, wixLocation = mockWixLocation) {
    switch (msg.action) {
        case 'getPipeline': {
            try {
                const filters = {};
                if (msg.ownerId) filters.owner_id = msg.ownerId;
                const pipeline = await backend.getPipelineView(filters);
                safeSend(component, { action: 'pipelineLoaded', payload: pipeline });
            } catch (error) {
                safeSend(component, { action: 'actionError', message: 'Failed to load pipeline.' });
            }
            break;
        }
        case 'getForecast': {
            try {
                const options = {};
                if (msg.ownerId) options.owner_id = msg.ownerId;
                const forecast = await backend.getForecast(options);
                safeSend(component, { action: 'forecastLoaded', payload: forecast });
            } catch (error) {
                safeSend(component, { action: 'actionError', message: 'Failed to load forecast.' });
            }
            break;
        }
        case 'viewAccount': {
            if (!msg.accountId) return;
            wixLocation.to(`/b2b-account-detail?accountId=${msg.accountId}`);
            break;
        }
        default:
            break;
    }
}

// =============================================================================
// TESTS
// =============================================================================

describe('B2B Pipeline Bridge Tests', () => {
    let component;

    beforeEach(() => {
        component = createMockComponent();
        jest.clearAllMocks();
    });

    // --- Source Structure ---
    describe('Source file structure', () => {
        it('should exist and be readable', () => {
            expect(sourceCode).toBeDefined();
            expect(sourceCode.length).toBeGreaterThan(0);
        });

        it('should import from b2bPipelineService', () => {
            expect(sourceCode).toMatch(/from\s+['"]backend\/b2bPipelineService['"]/);
        });

        it('should import wixLocationFrontend', () => {
            expect(sourceCode).toMatch(/wix-location-frontend/);
        });

        it('should have HTML component IDs array', () => {
            expect(sourceCode).toContain('HTML_COMPONENT_IDS');
        });

        it('should define safeSend', () => {
            expect(sourceCode).toContain('safeSend');
        });

        it('should handle getPipeline, getForecast, viewAccount', () => {
            expect(sourceCode).toContain("'getPipeline'");
            expect(sourceCode).toContain("'getForecast'");
            expect(sourceCode).toContain("'viewAccount'");
        });
    });

    // --- Component Discovery ---
    describe('Component discovery', () => {
        it('should find a component with onMessage', () => {
            const mock$w = jest.fn(() => createMockComponent());
            const result = findHtmlComponent(mock$w);
            expect(result).not.toBeNull();
        });

        it('should return null if no components exist', () => {
            const mock$w = jest.fn(() => { throw new Error('not found'); });
            const result = findHtmlComponent(mock$w);
            expect(result).toBeNull();
        });
    });

    // --- getPipeline ---
    describe('getPipeline', () => {
        it('should call getPipelineView and send pipelineLoaded', async () => {
            const data = { stages: [{ name: 'discovery', count: 3 }], totalValue: 50000, dealCount: 5 };
            mockBackend.getPipelineView.mockResolvedValueOnce(data);

            await routeMessage(component, { action: 'getPipeline' });

            expect(mockBackend.getPipelineView).toHaveBeenCalledWith({});
            expect(component.postMessage).toHaveBeenCalledWith({ action: 'pipelineLoaded', payload: data });
        });

        it('should pass ownerId filter when provided', async () => {
            await routeMessage(component, { action: 'getPipeline', ownerId: 'rep_001' });
            expect(mockBackend.getPipelineView).toHaveBeenCalledWith({ owner_id: 'rep_001' });
        });

        it('should send actionError on failure', async () => {
            mockBackend.getPipelineView.mockRejectedValueOnce(new Error('DB error'));

            await routeMessage(component, { action: 'getPipeline' });

            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'actionError' })
            );
        });
    });

    // --- getForecast ---
    describe('getForecast', () => {
        it('should call getForecast and send forecastLoaded', async () => {
            const data = { projected: 120000, confidence: 0.75 };
            mockBackend.getForecast.mockResolvedValueOnce(data);

            await routeMessage(component, { action: 'getForecast' });

            expect(mockBackend.getForecast).toHaveBeenCalledWith({});
            expect(component.postMessage).toHaveBeenCalledWith({ action: 'forecastLoaded', payload: data });
        });

        it('should pass ownerId when provided', async () => {
            await routeMessage(component, { action: 'getForecast', ownerId: 'rep_002' });
            expect(mockBackend.getForecast).toHaveBeenCalledWith({ owner_id: 'rep_002' });
        });

        it('should send actionError on failure', async () => {
            mockBackend.getForecast.mockRejectedValueOnce(new Error('fail'));

            await routeMessage(component, { action: 'getForecast' });

            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'actionError' })
            );
        });
    });

    // --- viewAccount ---
    describe('viewAccount', () => {
        it('should navigate to account detail page', async () => {
            await routeMessage(component, { action: 'viewAccount', accountId: 'acc-123' });
            expect(mockWixLocation.to).toHaveBeenCalledWith('/b2b-account-detail?accountId=acc-123');
        });

        it('should not navigate if no accountId', async () => {
            await routeMessage(component, { action: 'viewAccount' });
            expect(mockWixLocation.to).not.toHaveBeenCalled();
        });
    });

    // --- safeSend ---
    describe('safeSend', () => {
        it('should call postMessage on component', () => {
            safeSend(component, { action: 'test' });
            expect(component.postMessage).toHaveBeenCalledWith({ action: 'test' });
        });

        it('should not throw if postMessage throws', () => {
            component.postMessage.mockImplementation(() => { throw new Error('detached'); });
            expect(() => safeSend(component, { action: 'test' })).not.toThrow();
        });
    });

    // --- Unknown action ---
    describe('Unknown action', () => {
        it('should not send any message for unknown action', async () => {
            await routeMessage(component, { action: 'unknownAction' });
            expect(component.postMessage).not.toHaveBeenCalled();
        });
    });
});
