
import { getMutualInterestForDriver } from '../../backend/mutualInterestService';
import * as dataAccess from '../../backend/dataAccess';
import { currentUser } from 'wix-users-backend';

// Mock dependencies
jest.mock('wix-users-backend', () => ({
    currentUser: {
        loggedIn: true,
        id: 'driver123'
    }
}));

jest.mock('../../backend/dataAccess', () => ({
    queryRecords: jest.fn()
}));

jest.mock('../../backend/observabilityService', () => ({
    log: jest.fn()
}));

describe('mutualInterestService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        currentUser.loggedIn = true;
        currentUser.id = 'driver123';
    });

    describe('getMutualInterestForDriver', () => {
        it('should return error if user not logged in', async () => {
            currentUser.loggedIn = false;
            const result = await getMutualInterestForDriver('driver123');
            expect(result.success).toBe(false);
            expect(result.error).toBe('User not logged in.');
        });

        // NOTE: Authorization logic currently allows if currentUser matches driverId
        // or if we rely on backend checks. My impl checks currentUser.id === driverId.
        it('should return empty list if driver has no expressed interests', async () => {
            // Mock getDriverExpressedInterests returning empty
            dataAccess.queryRecords.mockResolvedValueOnce({ success: true, items: [] });

            const result = await getMutualInterestForDriver('driver123');
            expect(result.success).toBe(true);
            expect(result.mutualInterests).toEqual([]);
        });

        it('should return mutual matches correctly', async () => {
            // 1. Mock Driver Interests
            dataAccess.queryRecords.mockResolvedValueOnce({
                success: true,
                items: [
                    { driver_id: 'driver123', carrier_dot: '123456', carrier_name: 'Carrier A', created_date: '2025-01-01', status: 'interested' },
                    { driver_id: 'driver123', carrier_dot: '789012', carrier_name: 'Carrier B', created_date: '2025-01-02', status: 'interested' }
                ]
            });

            // 2. Mock Carrier Activity (Two calls map)
            // Call for Carrier A (Views)
            dataAccess.queryRecords.mockResolvedValueOnce({
                success: true,
                items: [{ _createdDate: '2025-01-05' }] // Viewed
            });
            // Call for Carrier A (Outreach) - None
            dataAccess.queryRecords.mockResolvedValueOnce({
                success: true,
                items: []
            });

            // Call for Carrier B (Views) - None
            dataAccess.queryRecords.mockResolvedValueOnce({
                success: true,
                items: []
            });
            // Call for Carrier B (Outreach) - Contacted
            dataAccess.queryRecords.mockResolvedValueOnce({
                success: true,
                items: [{ status: 'interview_requested', updated_date: '2025-01-10' }]
            });

            const result = await getMutualInterestForDriver('driver123');

            expect(result.success).toBe(true);
            expect(result.mutualInterests).toHaveLength(2);

            // Verify Carrier B (Stronger) comes first
            expect(result.mutualInterests[0].carrierDot).toBe('789012');
            expect(result.mutualInterests[0].mutualStrength).toBe('strong');
            expect(result.mutualInterests[0].signals).toContain('contacted');

            // Verify Carrier A (Weaker)
            expect(result.mutualInterests[1].carrierDot).toBe('123456');
            expect(result.mutualInterests[1].mutualStrength).toBe('weak');
            expect(result.mutualInterests[1].signals).toContain('viewed');
        });

        it('should handle API errors gracefully', async () => {
            dataAccess.queryRecords.mockRejectedValue(new Error('DB connection failed'));
            const result = await getMutualInterestForDriver('driver123');
            expect(result.success).toBe(false);
            expect(result.error).toBe('Failed to retrieve mutual interests.');
        });
    });
});
