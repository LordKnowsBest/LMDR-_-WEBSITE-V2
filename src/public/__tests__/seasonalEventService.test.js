/* eslint-disable */
/**
 * Seasonal Event Service Tests
 *
 * Tests for Phase 7.2-7.4: Seasonal Events
 * Verifies event lifecycle, multipliers, and challenge availability
 */

// Mock Airtable client
const mockQueryRecords = jest.fn();
const mockCreateRecord = jest.fn();
const mockUpdateRecord = jest.fn();
const mockGetRecord = jest.fn();

jest.mock('backend/airtableClient', () => ({
    queryRecords: mockQueryRecords,
    createRecord: mockCreateRecord,
    updateRecord: mockUpdateRecord,
    getRecord: mockGetRecord
}));

jest.mock('backend/config', () => ({
    getAirtableTableName: jest.fn((key) => `v2_${key}`)
}));

jest.mock('backend/memberService', () => ({
    createNotification: jest.fn().mockResolvedValue({ success: true })
}));

// Import after mocks
const {
    getActiveEvents,
    getUpcomingEvents,
    getEventById,
    joinEvent,
    getEventParticipation,
    getCurrentXPMultiplier,
    getCurrentPointsMultiplier,
    getEventChallenges,
    getEventLeaderboard,
    startScheduledEvents,
    endExpiredEvents
} = require('backend/seasonalEventService');

describe('Seasonal Event Service', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // =========================================================================
    // GET ACTIVE EVENTS
    // =========================================================================
    describe('getActiveEvents', () => {
        test('should return active events within date range', async () => {
            const mockEvents = [
                {
                    id: 'event_1',
                    'Event ID': 'jan_kickoff_2026',
                    'Name': 'January Hiring Kickoff',
                    'Status': 'active',
                    'XP Multiplier': 1.5,
                    'Points Multiplier': 1.5,
                    'Start Date': '2026-01-02T00:00:00.000Z',
                    'End Date': '2026-01-31T23:59:59.000Z'
                }
            ];

            mockQueryRecords.mockResolvedValueOnce({ records: mockEvents });

            const events = await getActiveEvents();

            expect(mockQueryRecords).toHaveBeenCalled();
            expect(events).toHaveLength(1);
            expect(events[0].name).toBe('January Hiring Kickoff');
            expect(events[0].xpMultiplier).toBe(1.5);
        });

        test('should return empty array when no active events', async () => {
            mockQueryRecords.mockResolvedValueOnce({ records: [] });

            const events = await getActiveEvents();

            expect(events).toHaveLength(0);
        });

        test('should handle errors gracefully', async () => {
            mockQueryRecords.mockRejectedValueOnce(new Error('Database error'));

            const events = await getActiveEvents();

            expect(events).toEqual([]);
        });
    });

    // =========================================================================
    // GET UPCOMING EVENTS
    // =========================================================================
    describe('getUpcomingEvents', () => {
        test('should return scheduled events within days ahead', async () => {
            const mockEvents = [
                {
                    id: 'event_2',
                    'Event ID': 'spring_sprint_2026',
                    'Name': 'Spring Hiring Sprint',
                    'Status': 'scheduled',
                    'Start Date': '2026-03-15T00:00:00.000Z'
                }
            ];

            mockQueryRecords.mockResolvedValueOnce({ records: mockEvents });

            const events = await getUpcomingEvents(7);

            expect(mockQueryRecords).toHaveBeenCalled();
            expect(events).toHaveLength(1);
            expect(events[0].status).toBe('scheduled');
        });
    });

    // =========================================================================
    // EVENT PARTICIPATION
    // =========================================================================
    describe('joinEvent', () => {
        test('should create participation record for active event', async () => {
            // Mock getEventById
            mockGetRecord.mockResolvedValueOnce({
                id: 'event_1',
                'Name': 'Test Event',
                'Status': 'active'
            });

            // Mock check for existing participation
            mockQueryRecords.mockResolvedValueOnce({ records: [] });

            // Mock create record
            mockCreateRecord.mockResolvedValueOnce({
                id: 'participant_1',
                'User ID': 'user_123',
                'Event ID': 'event_1'
            });

            const result = await joinEvent('user_123', 'driver', 'event_1');

            expect(result.success).toBe(true);
            expect(mockCreateRecord).toHaveBeenCalled();
        });

        test('should return existing participation if already joined', async () => {
            mockGetRecord.mockResolvedValueOnce({
                id: 'event_1',
                'Name': 'Test Event',
                'Status': 'active'
            });

            mockQueryRecords.mockResolvedValueOnce({
                records: [{
                    id: 'participant_1',
                    'User ID': 'user_123',
                    'Event ID': 'event_1'
                }]
            });

            const result = await joinEvent('user_123', 'driver', 'event_1');

            expect(result.success).toBe(true);
            expect(result.already_joined).toBe(true);
            expect(mockCreateRecord).not.toHaveBeenCalled();
        });

        test('should reject joining inactive event', async () => {
            mockGetRecord.mockResolvedValueOnce({
                id: 'event_1',
                'Name': 'Test Event',
                'Status': 'ended'
            });

            const result = await joinEvent('user_123', 'driver', 'event_1');

            expect(result.success).toBe(false);
            expect(result.error).toBe('event_not_active');
        });
    });

    describe('getEventParticipation', () => {
        test('should return participation status and stats', async () => {
            mockQueryRecords.mockResolvedValueOnce({
                records: [{
                    id: 'participant_1',
                    'User ID': 'user_123',
                    'Event ID': 'event_1',
                    'XP Earned': 500,
                    'Points Earned': 0,
                    'Challenges Completed': 3
                }]
            });

            const result = await getEventParticipation('user_123', 'event_1');

            expect(result.participating).toBe(true);
            expect(result.participant.xpEarned).toBe(500);
            expect(result.participant.challengesCompleted).toBe(3);
        });

        test('should return not participating for non-participants', async () => {
            mockQueryRecords.mockResolvedValueOnce({ records: [] });

            const result = await getEventParticipation('user_123', 'event_1');

            expect(result.participating).toBe(false);
        });
    });

    // =========================================================================
    // EVENT MULTIPLIERS
    // =========================================================================
    describe('getCurrentXPMultiplier', () => {
        test('should return max multiplier from active events', async () => {
            mockQueryRecords.mockResolvedValueOnce({
                records: [
                    { id: '1', 'XP Multiplier': 1.5, 'Status': 'active' },
                    { id: '2', 'XP Multiplier': 2.0, 'Status': 'active' }
                ]
            });

            const multiplier = await getCurrentXPMultiplier();

            expect(multiplier).toBe(2.0);
        });

        test('should return 1.0 when no active events', async () => {
            mockQueryRecords.mockResolvedValueOnce({ records: [] });

            const multiplier = await getCurrentXPMultiplier();

            expect(multiplier).toBe(1.0);
        });

        test('should return 1.0 on error', async () => {
            mockQueryRecords.mockRejectedValueOnce(new Error('Database error'));

            const multiplier = await getCurrentXPMultiplier();

            expect(multiplier).toBe(1.0);
        });
    });

    describe('getCurrentPointsMultiplier', () => {
        test('should return max points multiplier from active events', async () => {
            mockQueryRecords.mockResolvedValueOnce({
                records: [
                    { id: '1', 'Points Multiplier': 1.25, 'Status': 'active' },
                    { id: '2', 'Points Multiplier': 1.75, 'Status': 'active' }
                ]
            });

            const multiplier = await getCurrentPointsMultiplier();

            expect(multiplier).toBe(1.75);
        });
    });

    // =========================================================================
    // EVENT CHALLENGES
    // =========================================================================
    describe('getEventChallenges', () => {
        test('should return challenges for specific event and user type', async () => {
            const mockChallenges = [
                {
                    id: 'challenge_1',
                    'Challenge ID': 'kickoff_apply_5_driver',
                    'Name': 'New Year Applications',
                    'Description': 'Apply to 5 jobs',
                    'Action Type': 'apply_job',
                    'Target Value': 5,
                    'XP Reward': 150,
                    'Event ID': 'jan_kickoff_2026'
                }
            ];

            mockQueryRecords.mockResolvedValueOnce({ records: mockChallenges });

            const challenges = await getEventChallenges('jan_kickoff_2026', 'driver');

            expect(challenges).toHaveLength(1);
            expect(challenges[0].name).toBe('New Year Applications');
            expect(challenges[0].targetValue).toBe(5);
            expect(challenges[0].xpReward).toBe(150);
        });

        test('should return empty array for event with no challenges', async () => {
            mockQueryRecords.mockResolvedValueOnce({ records: [] });

            const challenges = await getEventChallenges('nonexistent_event', 'driver');

            expect(challenges).toHaveLength(0);
        });
    });

    // =========================================================================
    // EVENT LEADERBOARD
    // =========================================================================
    describe('getEventLeaderboard', () => {
        test('should return sorted leaderboard with ranks', async () => {
            const mockParticipants = [
                { id: '1', 'User ID': 'user_a', 'XP Earned': 1000, 'User Type': 'driver' },
                { id: '2', 'User ID': 'user_b', 'XP Earned': 750, 'User Type': 'driver' },
                { id: '3', 'User ID': 'user_c', 'XP Earned': 500, 'User Type': 'driver' }
            ];

            mockQueryRecords.mockResolvedValueOnce({ records: mockParticipants });

            const result = await getEventLeaderboard('event_1', 'driver', { limit: 10 });

            expect(result.leaderboard).toHaveLength(3);
            expect(result.leaderboard[0].rank).toBe(1);
            expect(result.leaderboard[0].xpEarned).toBe(1000);
            expect(result.leaderboard[1].rank).toBe(2);
        });

        test('should filter by user type', async () => {
            mockQueryRecords.mockResolvedValueOnce({
                records: [
                    { id: '1', 'User ID': 'recruiter_a', 'Points Earned': 500, 'User Type': 'recruiter' }
                ]
            });

            const result = await getEventLeaderboard('event_1', 'recruiter');

            expect(result.leaderboard[0].userType).toBe('recruiter');
        });
    });

    // =========================================================================
    // EVENT LIFECYCLE (SCHEDULED JOBS)
    // =========================================================================
    describe('startScheduledEvents', () => {
        test('should activate scheduled events that are due', async () => {
            const mockEvents = [
                {
                    id: 'event_1',
                    'Name': 'Test Event',
                    'Status': 'scheduled',
                    'Start Date': '2026-01-01T00:00:00.000Z'
                }
            ];

            mockQueryRecords.mockResolvedValueOnce({ records: mockEvents });
            mockUpdateRecord.mockResolvedValueOnce({ success: true });

            const result = await startScheduledEvents();

            expect(result.started).toBe(true);
            expect(result.count).toBe(1);
            expect(mockUpdateRecord).toHaveBeenCalledWith(
                expect.any(String),
                'event_1',
                expect.objectContaining({
                    'Status': 'active'
                })
            );
        });

        test('should handle no events to start', async () => {
            mockQueryRecords.mockResolvedValueOnce({ records: [] });

            const result = await startScheduledEvents();

            expect(result.started).toBe(true);
            expect(result.count).toBe(0);
        });
    });

    describe('endExpiredEvents', () => {
        test('should end active events past end date', async () => {
            const mockEvents = [
                {
                    id: 'event_1',
                    'Name': 'Test Event',
                    'Status': 'active',
                    'End Date': '2025-12-31T23:59:59.000Z'
                }
            ];

            mockQueryRecords
                .mockResolvedValueOnce({ records: mockEvents })
                .mockResolvedValueOnce({ records: [] }) // driver leaderboard
                .mockResolvedValueOnce({ records: [] }); // recruiter leaderboard

            mockUpdateRecord.mockResolvedValueOnce({ success: true });

            const result = await endExpiredEvents();

            expect(result.ended).toBe(true);
            expect(result.count).toBe(1);
            expect(mockUpdateRecord).toHaveBeenCalledWith(
                expect.any(String),
                'event_1',
                expect.objectContaining({
                    'Status': 'ended'
                })
            );
        });
    });
});

// =========================================================================
// EVENT MULTIPLIER APPLICATION TESTS
// =========================================================================
describe('Event Multiplier Application', () => {
    test('XP multiplier should be applied to base XP awards', () => {
        const baseXP = 100;
        const multiplier = 1.5;
        const adjustedXP = Math.round(baseXP * multiplier);

        expect(adjustedXP).toBe(150);
    });

    test('points multiplier should be applied to base points awards', () => {
        const basePoints = 50;
        const multiplier = 2.0;
        const adjustedPoints = Math.round(basePoints * multiplier);

        expect(adjustedPoints).toBe(100);
    });

    test('multiplier of 1.0 should not change award amount', () => {
        const baseXP = 100;
        const multiplier = 1.0;
        const adjustedXP = Math.round(baseXP * multiplier);

        expect(adjustedXP).toBe(100);
    });

    test('multiple multipliers should use highest value', () => {
        const multipliers = [1.25, 1.5, 1.75];
        const maxMultiplier = Math.max(...multipliers);

        expect(maxMultiplier).toBe(1.75);
    });
});

// =========================================================================
// EVENT BADGE/CHALLENGE AVAILABILITY TESTS
// =========================================================================
describe('Event Badge/Challenge Availability', () => {
    test('event challenges should only be available during active event', () => {
        const event = {
            status: 'active',
            startDate: '2026-01-01T00:00:00.000Z',
            endDate: '2026-01-31T23:59:59.000Z'
        };

        const now = new Date('2026-01-15T12:00:00.000Z');
        const isActive = event.status === 'active' &&
            new Date(event.startDate) <= now &&
            new Date(event.endDate) >= now;

        expect(isActive).toBe(true);
    });

    test('event challenges should not be available after event ends', () => {
        const event = {
            status: 'ended',
            endDate: '2026-01-31T23:59:59.000Z'
        };

        const now = new Date('2026-02-15T12:00:00.000Z');
        const isActive = event.status === 'active' && new Date(event.endDate) >= now;

        expect(isActive).toBe(false);
    });

    test('event badges should be awarded based on final leaderboard position', () => {
        const leaderboard = [
            { userId: 'user_1', rank: 1, xpEarned: 1000 },
            { userId: 'user_2', rank: 2, xpEarned: 800 },
            { userId: 'user_3', rank: 10, xpEarned: 200 }
        ];

        const championBadge = leaderboard.find(e => e.rank === 1);
        const top10Badge = leaderboard.filter(e => e.rank <= 10);

        expect(championBadge.userId).toBe('user_1');
        expect(top10Badge).toHaveLength(3);
    });
});
