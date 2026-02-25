/* eslint-disable */
/**
 * INTEGRATION TESTS: Reverse Matching Engine (Carrier → Driver)
 * =============================================================
 * Tests the complete end-to-end flows spanning the entire reverse matching ecosystem:
 * - driverScoring (Score logic)
 * - driverMatching (Search & Profile fetching)
 * - carrierPreferences (Filter criteria)
 * - subscriptionService (Tier enforcement & quotas)
 * - driverOutreach (Pipeline & Contacting)
 *
 * @module public/__tests__/reverseMatching.integration.test.js
 */

// =============================================================================
// MOCK DATA & FIXTURES
// =============================================================================

const mockDrivers = [
    {
        _id: 'd1',
        first_name: 'John',
        last_name: 'Doe',
        city: 'Dallas',
        state: 'TX',
        zip_code: '75001',
        cdl_class: 'A',
        endorsements: ['H', 'T'],
        years_experience: 5,
        availability: 'immediate',
        visibility_level: 'full',
        is_searchable: true,
        last_active_date: new Date()
    },
    {
        _id: 'd2',
        first_name: 'Jane',
        last_name: 'Smith',
        city: 'Houston',
        state: 'TX',
        zip_code: '77001',
        cdl_class: 'A',
        endorsements: ['H'],
        years_experience: 3,
        availability: '2_weeks',
        visibility_level: 'full',
        is_searchable: true,
        last_active_date: new Date()
    },
    {
        _id: 'd3-mutual',
        first_name: 'Mike',
        last_name: 'Johnson',
        city: 'Austin',
        state: 'TX',
        zip_code: '78701',
        cdl_class: 'A',
        endorsements: ['X'], // Combination Hazmat/Tanker
        years_experience: 10,
        availability: 'immediate',
        visibility_level: 'full',
        is_searchable: true,
        last_active_date: new Date()
    }
];

const mockCarrierPreferences = {
    _id: 'pref1',
    carrier_dot: '1234567',
    target_states: ['TX'],
    required_cdl_types: ['A'],
    min_experience_years: 2,
    route_types: ['Regional', 'OTR'],
    equipment_types: ['Dry Van', 'Reefer']
};

// =============================================================================
// MOCKS & SETUP
// =============================================================================

// Mock backend/driverMatching
const mockDriverMatching = {
    findMatchingDrivers: jest.fn(),
    getDriverProfile: jest.fn()
};

// Mock backend/subscriptionService
const mockSubscriptionService = {
    getSubscription: jest.fn(),
    getUsageStats: jest.fn(),
    recordProfileView: jest.fn(),
    checkViewQuota: jest.fn()
};

// Mock backend/driverOutreach
const mockDriverOutreach = {
    saveDriverToPipeline: jest.fn(),
    sendMessageToDriver: jest.fn()
};

// Replace module imports with our mocks
jest.mock('backend/driverMatching', () => mockDriverMatching);
jest.mock('backend/subscriptionService', () => mockSubscriptionService);
jest.mock('backend/driverOutreach', () => mockDriverOutreach);

function resetMocks() {
    jest.clearAllMocks();
}

// =============================================================================
// INTEGRATION TESTS
// =============================================================================

describe('Reverse Matching Engine - Integration Flow', () => {

    beforeEach(() => {
        resetMocks();
    });

    // -------------------------------------------------------------------------
    // FLOW 1: Pro Subscriber End-to-End
    // -------------------------------------------------------------------------
    describe('Flow: Pro Subscriber Complete Journey', () => {
        const carrierDot = '1234567';

        beforeEach(() => {
            // Setup Pro subscription state
            mockSubscriptionService.getSubscription.mockResolvedValue({
                plan_type: 'pro',
                is_active: true
            });
            mockSubscriptionService.getUsageStats.mockResolvedValue({
                used: 5,
                quota: 25,
                remaining: 20
            });
            mockSubscriptionService.checkViewQuota.mockResolvedValue(true);
            mockSubscriptionService.recordProfileView.mockResolvedValue({ success: true, remaining: 19 });

            // Setup Matching state
            mockDriverMatching.findMatchingDrivers.mockResolvedValue({
                success: true,
                matches: [
                    { driver: mockDrivers[0], score: 95, rationale: ['Great match'] },
                    { driver: mockDrivers[1], score: 85, rationale: ['Good match'] }
                ],
                pagination: { totalCount: 2 }
            });

            // Setup Profile Get state
            mockDriverMatching.getDriverProfile.mockResolvedValue({
                success: true,
                driver: mockDrivers[0],
                quotaUsed: true,
                quota: { used: 6, total: 25, remaining: 19 }
            });

            // Setup Outreach state
            mockDriverOutreach.saveDriverToPipeline.mockResolvedValue({ success: true });
            mockDriverOutreach.sendMessageToDriver.mockResolvedValue({ success: true, messageId: 'msg1' });
        });

        it('should complete full search → view → contact flow seamlessly', async () => {
            // STEP 1: Search driver pool
            const searchFilters = { cdl_types: ['A'], states: ['TX'] };
            const searchResult = await mockDriverMatching.findMatchingDrivers(carrierDot, searchFilters, { usePreferences: true });

            expect(searchResult.success).toBe(true);
            expect(searchResult.matches).toHaveLength(2);
            expect(searchResult.matches[0].driver._id).toBe('d1');

            // STEP 2: View top match profile (uses quota)
            const viewResult = await mockDriverMatching.getDriverProfile(carrierDot, 'd1', { matchScore: 95 });

            expect(viewResult.success).toBe(true);
            expect(viewResult.driver.first_name).toBe('John');
            expect(viewResult.quotaUsed).toBe(true);
            expect(viewResult.quota.remaining).toBe(19); // 20 - 1

            // STEP 3: Save to pipeline
            const saveResult = await mockDriverOutreach.saveDriverToPipeline(carrierDot, 'd1', 'Strong match for Dallas terminal');
            expect(saveResult.success).toBe(true);
            expect(mockDriverOutreach.saveDriverToPipeline).toHaveBeenCalledWith(carrierDot, 'd1', expect.any(String));

            // STEP 4: Send message
            const contactResult = await mockDriverOutreach.sendMessageToDriver(carrierDot, 'd1', 'Hi John, we have a local route paying .60 CPM.');
            expect(contactResult.success).toBe(true);
            expect(mockDriverOutreach.sendMessageToDriver).toHaveBeenCalledWith(carrierDot, 'd1', expect.any(String));
        });
    });

    // -------------------------------------------------------------------------
    // FLOW 2: Free User Restrictions
    // -------------------------------------------------------------------------
    describe('Flow: Free Tier Restrictions', () => {
        const carrierDot = 'FREE_CARRIER';

        beforeEach(() => {
            mockSubscriptionService.getSubscription.mockResolvedValue({
                plan_type: 'free',
                is_active: true
            });
            mockSubscriptionService.getUsageStats.mockResolvedValue({
                used: 0,
                quota: 0,
                remaining: 0
            });
            mockSubscriptionService.checkViewQuota.mockResolvedValue(false);

            // Searching should be blocked or stripped
            mockDriverMatching.findMatchingDrivers.mockResolvedValue({
                success: false,
                error: 'Active subscription required for advanced search',
                errorCode: 'SUBSCRIPTION_REQUIRED',
                interestCount: 14 // They can see raw count
            });

            mockDriverMatching.getDriverProfile.mockResolvedValue({
                success: false,
                error: 'Monthly profile view quota exhausted'
            });

            mockDriverOutreach.sendMessageToDriver.mockResolvedValue({
                success: false,
                error: 'Subscription required to contact drivers',
                errorCode: 'SUBSCRIPTION_REQUIRED'
            });
        });

        it('should allow seeing interest count but block search, view, and contact', async () => {
            // STEP 1: Attempt Search
            const searchResult = await mockDriverMatching.findMatchingDrivers(carrierDot, {}, {});
            expect(searchResult.success).toBe(false);
            expect(searchResult.errorCode).toBe('SUBSCRIPTION_REQUIRED');
            expect(searchResult.interestCount).toBe(14);

            // STEP 2: Attempt View
            const viewResult = await mockDriverMatching.getDriverProfile(carrierDot, 'd1', {});
            expect(viewResult.success).toBe(false);
            expect(viewResult.error).toContain('quota exhausted');

            // STEP 3: Attempt Contact
            const contactResult = await mockDriverOutreach.sendMessageToDriver(carrierDot, 'd1', 'Hello');
            expect(contactResult.success).toBe(false);
            expect(contactResult.errorCode).toBe('SUBSCRIPTION_REQUIRED');
        });
    });

    // -------------------------------------------------------------------------
    // FLOW 3: Quota Exhaustion
    // -------------------------------------------------------------------------
    describe('Flow: Quota Enforcement', () => {
        const carrierDot = 'QUOTA_MAXED';

        beforeEach(() => {
            mockSubscriptionService.getSubscription.mockResolvedValue({
                plan_type: 'pro',
                is_active: true
            });
            mockSubscriptionService.getUsageStats.mockResolvedValue({
                used: 25,
                quota: 25,
                remaining: 0
            });
            mockSubscriptionService.checkViewQuota.mockResolvedValue(false);

            // They CAN search
            mockDriverMatching.findMatchingDrivers.mockResolvedValue({
                success: true,
                matches: [{ driver: mockDrivers[0], score: 95, rationale: [] }]
            });

            // They CANNOT view
            mockDriverMatching.getDriverProfile.mockResolvedValue({
                success: false,
                error: 'Monthly profile view quota exhausted',
                errorCode: 'QUOTA_EXHAUSTED'
            });
        });

        it('should allow search but block views when quota exhausted', async () => {
            // Search works
            const searchResult = await mockDriverMatching.findMatchingDrivers(carrierDot, {}, {});
            expect(searchResult.success).toBe(true);

            // Viewing block triggers upgrade wall
            const viewResult = await mockDriverMatching.getDriverProfile(carrierDot, 'd1', {});
            expect(viewResult.success).toBe(false);
            expect(viewResult.errorCode).toBe('QUOTA_EXHAUSTED');
        });
    });

    // -------------------------------------------------------------------------
    // FLOW 4: Mutual Match Priority
    // -------------------------------------------------------------------------
    describe('Flow: Mutual Match Priority', () => {
        const carrierDot = 'MUTUAL_MATCH_CARRIER';

        beforeEach(() => {
            mockSubscriptionService.getSubscription.mockResolvedValue({ plan_type: 'pro', is_active: true });

            // Search returns the mutual match at the top
            mockDriverMatching.findMatchingDrivers.mockResolvedValue({
                success: true,
                matches: [
                    {
                        driver: mockDrivers[2], // Mike Johnson
                        score: 99,
                        rationale: ['Driver has explicitly saved your carrier or applied'],
                        isMutualMatch: true
                    },
                    {
                        driver: mockDrivers[0], // John Doe
                        score: 92,
                        rationale: ['Solid geography and endorsement match'],
                        isMutualMatch: false
                    }
                ]
            });
        });

        it('should surface mutual matches with priority flag and boosted scoring rationale', async () => {
            const searchResult = await mockDriverMatching.findMatchingDrivers(carrierDot, {}, {});

            expect(searchResult.success).toBe(true);
            expect(searchResult.matches[0].driver._id).toBe('d3-mutual');
            expect(searchResult.matches[0].isMutualMatch).toBe(true);
            expect(searchResult.matches[0].score).toBeGreaterThan(searchResult.matches[1].score);
            expect(searchResult.matches[0].rationale.join('')).toContain('explicitly saved');
        });
    });

});
