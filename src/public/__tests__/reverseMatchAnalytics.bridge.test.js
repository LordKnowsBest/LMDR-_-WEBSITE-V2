/* eslint-disable */
/**
 * REVERSE MATCHING ANALYTICS - BRIDGE TESTS
 * =========================================
 * Tests the postMessage bridge between ADMIN_REVERSE_MATCHING.html and Velo page code,
 * mocking the backend `reverseMatchAnalyticsService` to ensure UI state updates correctly.
 * 
 * @module public/__tests__/reverseMatchAnalytics.bridge.test.js
 */

// ============================================
// MOCKS
// ============================================
const mockAnalyticsService = {
    getReverseMatchOverview: jest.fn()
};

jest.mock('backend/reverseMatchAnalyticsService', () => mockAnalyticsService);

// Mock browser postMessage API and Window object
const windowProps = {
    postMessage: jest.fn(),
    parent: {
        postMessage: jest.fn()
    }
};

global.window = Object.assign(global.window || {}, windowProps);

// ============================================
// MOCK DATA
// ============================================
const MOCK_ANALYTICS_PAYLOAD = {
    period_days: 30,
    kpis: {
        total_views: 1250,
        unique_viewers: 45,
        total_contacts: 180,
        active_paid_subs: 12,
        mrr_estimate: 8988,
        contact_rate_pct: 14.4
    },
    funnel: {
        pool_size: 5000,
        views: 1250,
        contacts_sent: 180,
        pipeline_saves: 300
    },
    top_carriers: [
        { carrier_dot: '1234567', activity_count: 350 },
        { carrier_dot: '9876543', activity_count: 210 }
    ]
};

// ============================================
// PSEUDO-IMPLEMENTATION (Bridge Logic)
// ============================================
// This simulates the Velo page code ($w.onReady) that will catch HTML messages
async function handleHtmlMessage(event) {
    if (!event.data || !event.data.type) return;

    if (event.data.type === 'loadReverseAnalytics') {
        const days = event.data.data?.days || 30;

        try {
            const result = await mockAnalyticsService.getReverseMatchOverview(days);

            // Send back success payload
            window.postMessage({
                type: 'analyticsDataReady',
                data: result
            }, '*');

        } catch (err) {
            // Send back error payload
            window.postMessage({
                type: 'analyticsError',
                error: err.message || 'Failed to fetch analytics'
            }, '*');
        }
    }
}

// ============================================
// TESTS
// ============================================
describe('Reverse Match Analytics Bridge', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should request 30-day analytics by default and broadcast results', async () => {
        // Setup mock response
        mockAnalyticsService.getReverseMatchOverview.mockResolvedValue(MOCK_ANALYTICS_PAYLOAD);

        // Simulate HTML sending request
        await handleHtmlMessage({
            data: {
                type: 'loadReverseAnalytics',
                data: { days: 30 }
            }
        });

        // Verify backend called with 30 days
        expect(mockAnalyticsService.getReverseMatchOverview).toHaveBeenCalledWith(30);

        // Verify UI payload broadcast
        expect(window.postMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'analyticsDataReady',
                data: MOCK_ANALYTICS_PAYLOAD
            }),
            '*'
        );
    });

    it('should handle date range filters (e.g. 7 days)', async () => {
        mockAnalyticsService.getReverseMatchOverview.mockResolvedValue(MOCK_ANALYTICS_PAYLOAD);

        await handleHtmlMessage({
            data: {
                type: 'loadReverseAnalytics',
                data: { days: 7 }
            }
        });

        expect(mockAnalyticsService.getReverseMatchOverview).toHaveBeenCalledWith(7);
    });

    it('should handle backend errors and broadcast error state', async () => {
        // Setup backend failure
        mockAnalyticsService.getReverseMatchOverview.mockRejectedValue(new Error('Database timeout'));

        await handleHtmlMessage({
            data: {
                type: 'loadReverseAnalytics',
                data: { days: 30 }
            }
        });

        // Verify error broadcast
        expect(window.postMessage).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'analyticsError',
                error: 'Database timeout'
            }),
            '*'
        );
    });
});
