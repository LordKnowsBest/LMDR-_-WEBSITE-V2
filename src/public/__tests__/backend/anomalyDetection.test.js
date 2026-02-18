
import { runAnomalyDetection, calculateBaseline } from 'backend/observabilityService';
import * as dataAccess from 'backend/dataAccess';

// Mock dataAccess
jest.mock('backend/dataAccess', () => ({
    queryRecords: jest.fn(),
    insertRecord: jest.fn(),
    updateRecord: jest.fn(),
    getRecord: jest.fn()
}));

// Mock wix-members-backend
jest.mock('wix-members-backend', () => ({
    currentMember: {
        getMember: jest.fn().mockResolvedValue({ 
            _id: 'admin-1', 
            loginEmail: 'admin@test.com',
            contactDetails: {
                customFields: {
                    role: 'super_admin'
                }
            }
        })
    }
}));

describe('Anomaly Detection Engine', () => {

    const mockRules = [
        { _id: 'rule-1', name: 'Error Spike', type: 'error_spike', metric: 'errors', threshold: 2, windowMinutes: 15, enabled: true, cooldownMinutes: 0 },
        { _id: 'rule-2', name: 'Latency Drift', type: 'latency_drift', metric: 'latency', threshold: 3, windowMinutes: 60, enabled: true, cooldownMinutes: 0 }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        
        dataAccess.queryRecords.mockImplementation((collection, options) => {
            if (collection === 'anomalyRules') {
                return Promise.resolve({ success: true, items: mockRules });
            }
            if (collection === 'anomalyAlerts') {
                return Promise.resolve({ success: true, items: [] }); // No recent alerts (cooldown)
            }
            if (collection === 'systemErrors') {
                // Return some mock errors for window check
                return Promise.resolve({ success: true, items: new Array(10).fill({}) });
            }
            if (collection === 'systemTraces') {
                // Determine if this is a baseline calculation or a window check
                // calculateBaseline usually queries a larger range (14 days)
                // window check queries a small range (15-60 min)
                
                // For simplicity, we'll check the limit or filters in the mock
                if (options && options.limit === 2000) {
                    // Baseline query
                    return Promise.resolve({ success: true, items: new Array(10).fill({ duration: 1000 }) }); // 1s baseline
                }
                // Window query
                return Promise.resolve({ success: true, items: new Array(5).fill({ duration: 5000 }) }); // 5s latency
            }
            return Promise.resolve({ success: true, items: [] });
        });
    });

    test('should detect error spike when threshold exceeded', async () => {
        // Mock baseline: mean = 1, stdDev = 1
        // Threshold = 2. Expected = 1 + (2 * 1) = 3.
        // Actual = 10 (from mockErrors above).
        // Triggered!
        
        // We need to mock calculateBaseline response or internal calls
        // calculateBaseline calls dataAccess.queryRecords for errors or traces
        
        const result = await runAnomalyDetection();
        
        expect(result.success).toBe(true);
        // Should have inserted an anomaly alert
        expect(dataAccess.insertRecord).toHaveBeenCalledWith(
            'anomalyAlerts',
            expect.objectContaining({ type: 'error_spike' }),
            expect.any(Object)
        );
    });

    test('should detect latency drift when threshold exceeded', async () => {
        // Baseline latency mean = 1000ms
        // Threshold = 3x. Expected = 3000ms.
        // Actual = 5000ms (from mockTraces above).
        // Triggered!
        
        const result = await runAnomalyDetection();
        
        expect(dataAccess.insertRecord).toHaveBeenCalledWith(
            'anomalyAlerts',
            expect.objectContaining({ type: 'latency_drift' }),
            expect.any(Object)
        );
    });

    test('should not detect anomaly when below threshold', async () => {
        dataAccess.queryRecords.mockImplementation((collection) => {
            if (collection === 'anomalyRules') return Promise.resolve({ success: true, items: mockRules });
            if (collection === 'anomalyAlerts') return Promise.resolve({ success: true, items: [] });
            if (collection === 'systemErrors') return Promise.resolve({ success: true, items: [] }); // 0 errors
            if (collection === 'systemTraces') return Promise.resolve({ success: true, items: new Array(5).fill({ duration: 500 }) }); // 500ms latency
            return Promise.resolve({ success: true, items: [] });
        });

        const result = await runAnomalyDetection();
        
        // Should NOT have inserted any alerts (only updateRecord for auto-resolve might be called)
        const insertCalls = dataAccess.insertRecord.mock.calls.filter(call => call[0] === 'anomalyAlerts');
        expect(insertCalls.length).toBe(0);
    });

});
