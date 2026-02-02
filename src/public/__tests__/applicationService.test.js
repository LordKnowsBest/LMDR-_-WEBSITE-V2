
import { getDriverApplications } from '../../backend/applicationService.jsw';
import * as dataAccess from '../../backend/dataAccess';
import wixUsersBackend from 'wix-users-backend';

// Mock dependencies
jest.mock('../../backend/dataAccess');
jest.mock('wix-users-backend', () => ({
    currentUser: {
        loggedIn: true,
        id: 'user123'
    }
}));

// Mock config
jest.mock('../../backend/config', () => ({
    usesAirtable: false,
    getWixCollectionName: (name) => name,
    STATUS: { APPLIED: 'applied', WITHDRAWN: 'withdrawn' }
}));

// Mock other dependencies using the ALIAS paths found in the source file
jest.mock('wix-media-backend', () => ({
    mediaManager: { upload: jest.fn() }
}), { virtual: true });
jest.mock('wix-data', () => ({}), { virtual: true });

// Mocking exact import strings used in applicationService.jsw
jest.mock('backend/emailService.jsw', () => ({ sendApplicationConfirmation: jest.fn() }), { virtual: true });
jest.mock('backend/airtableClient', () => ({}), { virtual: true });
jest.mock('backend/lifecycleService', () => ({ logEvent: jest.fn() }), { virtual: true });
jest.mock('backend/achievementService', () => ({ checkApplicationAchievements: jest.fn() }), { virtual: true });
jest.mock('backend/gamificationService', () => ({ awardDriverXP: jest.fn() }), { virtual: true });
jest.mock('backend/referralService', () => ({ trackReferralConversion: jest.fn() }), { virtual: true });

describe('applicationService', () => {
    describe('getDriverApplications', () => {
        const driverId = 'driver123';
        const mockApps = [
            {
                _id: 'app1',
                driver_id: driverId,
                carrier_name: 'Carrier A',
                action: 'applied',
                status: 'applied',
                action_timestamp: '2023-01-01T10:00:00Z',
                status_history: JSON.stringify([{ status: 'applied', timestamp: '2023-01-01T10:00:00Z' }])
            },
            {
                _id: 'app2',
                driver_id: driverId,
                carrier_name: 'Carrier B',
                action: 'applied',
                status: 'viewed',
                action_timestamp: '2023-01-02T10:00:00Z',
                status_history: JSON.stringify([
                    { status: 'applied', timestamp: '2023-01-02T10:00:00Z' },
                    { status: 'viewed', timestamp: '2023-01-03T10:00:00Z' }
                ])
            }
        ];

        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should return applications for authorized user', async () => {
            // Setup Auth: currentUser.id === driverId
            wixUsersBackend.currentUser.id = driverId;
            wixUsersBackend.currentUser.loggedIn = true;

            dataAccess.queryRecords.mockResolvedValue({
                success: true,
                items: mockApps
            });

            const result = await getDriverApplications(driverId);

            expect(result.success).toBe(true);
            expect(result.applications).toHaveLength(2);
            expect(result.applications[0].carrier_name).toBe('Carrier B'); // Sorted by date desc
            expect(result.applications[0].status_history).toHaveLength(2);
        });
    });
});
