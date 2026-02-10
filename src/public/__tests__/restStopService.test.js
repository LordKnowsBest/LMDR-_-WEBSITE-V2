/* eslint-disable */

import {
    submitReview,
    getLocationReviews,
    submitConditionReport,
    voteReview
} from '../../backend/restStopService';
import wixData from 'wix-data';
import wixUsers from 'wix-users-backend';

// Mock dependencies
jest.mock('wix-data', () => ({
    query: jest.fn(),
    get: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    remove: jest.fn()
}));

jest.mock('wix-users-backend', () => ({
    currentUser: {
        loggedIn: true,
        id: 'user123'
    }
}));

jest.mock('backend/config', () => ({
    usesAirtable: jest.fn().mockReturnValue(false),
    getAirtableTableName: jest.fn()
}));

jest.mock('backend/airtableClient', () => ({
    queryRecords: jest.fn()
}));

describe('Rest Stop Service Tests', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        wixUsers.currentUser.loggedIn = true;
        wixUsers.currentUser.id = 'user123';
    });

    // 1. Test Review Submission
    test('submitReview should require login', async () => {
        wixUsers.currentUser.loggedIn = false;
        const result = await submitReview('loc1', { overall_rating: 5, text: 'Great!' });
        expect(result.success).toBe(false);
        expect(result.error).toMatch(/logged in/);
    });

    test('submitReview should prevent duplicates within 30 days', async () => {
        // Mock existing review
        const mockQuery = {
            eq: jest.fn().mockReturnThis(),
            gt: jest.fn().mockReturnThis(),
            find: jest.fn().mockResolvedValue({ items: [{ _id: 'oldReview' }] })
        };
        wixData.query.mockReturnValue(mockQuery);

        const result = await submitReview('loc1', { overall_rating: 5 });
        expect(result.success).toBe(false);
        expect(result.error).toMatch(/already reviewed/);
    });

    test('submitReview should insert valid review', async () => {
        // Mock no existing review
        wixData.query.mockReturnValue({
            eq: jest.fn().mockReturnThis(),
            gt: jest.fn().mockReturnThis(),
            find: jest.fn().mockResolvedValue({ items: [] })
        });

        wixData.insert.mockResolvedValue({ _id: 'newReview' });

        const reviewData = { overall_rating: 5, text: 'Awesome', ratings: { clean: 5 } };
        const result = await submitReview('loc1', reviewData);

        expect(result.success).toBe(true);
        expect(wixData.insert).toHaveBeenCalledWith('RestStopReviews', expect.objectContaining({
            location_id: 'loc1',
            driver_id: 'user123',
            overall_rating: 5,
            ratings: { clean: 5 }
        }), expect.anything());
    });

    // 2. Test Get Reviews
    test('getLocationReviews should return reviews and stats', async () => {
        const mockReviews = [
            { overall_rating: 5, text: 'Good' },
            { overall_rating: 4, text: 'Nice' }
        ];

        // Mock query for listing reviews
        const listQuery = {
            eq: jest.fn().mockReturnThis(),
            descending: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            find: jest.fn().mockResolvedValue({ items: mockReviews })
        };

        // Mock query for stats (simulated separate call)
        const statsQuery = {
            eq: jest.fn().mockReturnThis(),
            find: jest.fn().mockResolvedValue({ items: mockReviews, totalCount: 2 })
        };

        wixData.query
            .mockReturnValueOnce(listQuery) // First call for list
            .mockReturnValueOnce(statsQuery); // Second call for stats

        const result = await getLocationReviews('loc1');

        expect(result.success).toBe(true);
        expect(result.reviews).toEqual(mockReviews);
        expect(result.stats.count).toBe(2);
        expect(result.stats.avg_rating).toBe("4.5");
    });

    // 3. Test Condition Reporting
    test('submitConditionReport should insert report with 24h expiration', async () => {
        const reportData = { type: 'shower_wait', details: '30 mins' };
        wixData.insert.mockResolvedValue({ _id: 'report1' });

        const result = await submitConditionReport('loc1', reportData);

        expect(result.success).toBe(true);
        expect(wixData.insert).toHaveBeenCalledWith('RestStopConditionReports', expect.objectContaining({
            location_id: 'loc1',
            report_type: 'shower_wait',
            details: '30 mins'
        }), expect.anything());

        // Check expiration is roughly 24h from now
        const callArgs = wixData.insert.mock.calls[0][1];
        const now = Date.now();
        const expiry = callArgs.expires_at.getTime();
        const diff = expiry - now;
        expect(Math.abs(diff - 24 * 60 * 60 * 1000)).toBeLessThan(10000); // Within 10s tolerance
    });

    // 4. Test Voting
    test('voteReview should increment helpful count', async () => {
        wixData.get.mockResolvedValue({ _id: 'rev1', helpful_votes: 5 });
        wixData.update.mockResolvedValue({});

        const result = await voteReview('rev1', true); // Upvote

        expect(result.success).toBe(true);
        expect(result.helpful_votes).toBe(6);
        expect(wixData.update).toHaveBeenCalledWith('RestStopReviews', expect.objectContaining({
            _id: 'rev1',
            helpful_votes: 6
        }), expect.anything());
    });

});
