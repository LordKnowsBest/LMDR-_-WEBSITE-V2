/**
 * BRIDGE TESTS: Recruiter Driver Search Page
 * ==========================================
 * Tests the postMessage bridge between Recruiter Driver Search page code and HTML.
 *
 * Inbound Actions (HTML → Velo):
 *   - searchDrivers: Search for matching drivers with filters
 *   - viewDriverProfile: View full driver profile (uses quota)
 *   - saveDriver: Save driver to pipeline
 *   - contactDriver: Send message to driver
 *   - getQuotaStatus: Get subscription/quota information
 *   - driverSearchReady: Component initialization signal
 *   - sidebarReady: Sidebar component ready
 *   - getWeightPreferences: Get matching weight preferences
 *   - saveWeightPreferences: Save matching weight preferences
 *   - openSettingsSidebar: Trigger settings panel open
 *
 * @module public/__tests__/recruiterDriverSearch.bridge.test.js
 */

// =============================================================================
// MOCK SETUP
// =============================================================================

const mockWixLocation = {
    query: { openSettings: null },
    to: jest.fn()
};

const mockWixUsers = {
    currentUser: {
        loggedIn: false,
        id: null
    },
    promptLogin: jest.fn()
};

// Mock backend services
const mockDriverMatching = {
    findMatchingDrivers: jest.fn(),
    getDriverProfile: jest.fn()
};

const mockDriverOutreach = {
    saveDriverToPipeline: jest.fn(),
    sendMessageToDriver: jest.fn()
};

const mockSubscriptionService = {
    getUsageStats: jest.fn(),
    getSubscription: jest.fn()
};

const mockCarrierPreferences = {
    getWeightPreferences: jest.fn(),
    saveWeightPreferences: jest.fn()
};

const mockRecruiterService = {
    getCarrierIdentity: jest.fn()
};

// Mock component
let capturedMessages = [];
const mockComponent = {
    postMessage: jest.fn((data) => {
        capturedMessages.push(data);
    }),
    rendered: true,
    onMessage: jest.fn()
};

let currentCarrierDot = null;

function resetMocks() {
    capturedMessages = [];
    mockComponent.postMessage.mockClear();
    currentCarrierDot = null;

    mockDriverMatching.findMatchingDrivers.mockReset();
    mockDriverMatching.getDriverProfile.mockReset();
    mockDriverOutreach.saveDriverToPipeline.mockReset();
    mockDriverOutreach.sendMessageToDriver.mockReset();
    mockSubscriptionService.getUsageStats.mockReset();
    mockSubscriptionService.getSubscription.mockReset();
    mockCarrierPreferences.getWeightPreferences.mockReset();
    mockCarrierPreferences.saveWeightPreferences.mockReset();
    mockRecruiterService.getCarrierIdentity.mockReset();

    mockWixUsers.currentUser.loggedIn = true;
    mockWixUsers.currentUser.id = 'test-user-id';
}

// =============================================================================
// MESSAGE HANDLERS (mimic page code behavior)
// =============================================================================

async function handleSearchDrivers(data) {
    if (!currentCarrierDot) {
        return {
            type: 'searchDriversResult',
            data: { success: false, error: 'No carrier assigned. Please contact support.' }
        };
    }

    const filters = {
        cdl_types: data.cdlClasses,
        endorsements: data.endorsements,
        zip_code: data.zip,
        radius_miles: data.radius,
        min_experience: data.minExperience,
        availability: data.availability
    };

    // Remove null/undefined filters
    Object.keys(filters).forEach(key => {
        if (filters[key] === null || filters[key] === undefined) {
            delete filters[key];
        }
    });

    const options = {
        page: Math.floor((data.offset || 0) / (data.limit || 20)),
        pageSize: data.limit || 20,
        usePreferences: true,
        includeMutualMatches: true
    };

    const result = await mockDriverMatching.findMatchingDrivers(currentCarrierDot, filters, options);

    if (result.success) {
        const drivers = result.matches.map(match => ({
            id: match.driver._id,
            name: `${match.driver.first_name || ''} ${match.driver.last_name || ''}`.trim() || 'Driver',
            location: match.driver.city && match.driver.state
                ? `${match.driver.city}, ${match.driver.state}`
                : match.driver.zip_code || 'Unknown',
            experienceYears: match.driver.years_experience || 0,
            matchScore: Math.round(match.score),
            cdlClass: match.driver.cdl_class || 'A',
            endorsements: match.driver.endorsements || [],
            rationale: match.rationale.join(' ') || 'Good match based on your criteria.',
            isMutualMatch: match.isMutualMatch || false,
            availability: match.driver.availability || 'unknown'
        }));

        const usage = await mockSubscriptionService.getUsageStats(currentCarrierDot);
        const subscription = await mockSubscriptionService.getSubscription(currentCarrierDot);

        return {
            type: 'searchDriversResult',
            data: {
                success: true,
                drivers,
                total: result.pagination.totalCount,
                quotaStatus: {
                    tier: subscription.plan_type || 'free',
                    used: usage.used || 0,
                    limit: usage.quota || 0,
                    remaining: usage.remaining || 0
                }
            }
        };
    } else {
        return {
            type: 'searchDriversResult',
            data: { success: false, error: result.error }
        };
    }
}

async function handleViewProfile(data) {
    if (!currentCarrierDot) {
        return {
            type: 'viewDriverProfileResult',
            data: { success: false, error: 'No carrier assigned.' }
        };
    }

    const result = await mockDriverMatching.getDriverProfile(currentCarrierDot, data.driverId, {
        matchScore: data.matchScore
    });

    if (result.success) {
        const driver = result.driver;
        const profile = {
            id: driver._id,
            name: `${driver.first_name || ''} ${driver.last_name || ''}`.trim() || 'Driver',
            location: driver.city && driver.state
                ? `${driver.city}, ${driver.state}`
                : driver.zip_code || 'Unknown',
            phone: driver.phone || null,
            email: driver.email || null,
            experienceYears: driver.years_experience || 0,
            cdlClass: driver.cdl_class || 'A',
            endorsements: driver.endorsements || [],
            equipment: driver.equipment_experience || [],
            availability: driver.availability || 'unknown'
        };

        return {
            type: 'viewDriverProfileResult',
            data: {
                success: true,
                driver: profile,
                quotaUsed: result.quotaUsed,
                quotaStatus: {
                    used: result.quota.used,
                    limit: result.quota.total,
                    remaining: result.quota.remaining
                }
            }
        };
    } else {
        const isQuotaExceeded = result.error &&
            (result.error.includes('quota') || result.error.includes('exhausted'));

        return {
            type: 'viewDriverProfileResult',
            data: {
                success: false,
                error: result.error,
                quotaExceeded: isQuotaExceeded
            }
        };
    }
}

async function handleSaveDriver(data) {
    if (!currentCarrierDot) {
        return {
            type: 'saveDriverResult',
            data: { success: false, error: 'No carrier assigned.' }
        };
    }

    const result = await mockDriverOutreach.saveDriverToPipeline(
        currentCarrierDot,
        data.driverId,
        data.notes || ''
    );

    return {
        type: 'saveDriverResult',
        data: {
            success: result.success,
            error: result.error,
            alreadySaved: result.errorCode === 'DUPLICATE_SAVE'
        }
    };
}

async function handleContactDriver(data) {
    if (!currentCarrierDot) {
        return {
            type: 'contactDriverResult',
            data: { success: false, error: 'No carrier assigned.' }
        };
    }

    const result = await mockDriverOutreach.sendMessageToDriver(
        currentCarrierDot,
        data.driverId,
        data.message
    );

    return {
        type: 'contactDriverResult',
        data: {
            success: result.success,
            error: result.error,
            requiresSubscription: result.errorCode === 'SUBSCRIPTION_REQUIRED'
        }
    };
}

async function handleGetQuotaStatus() {
    if (!currentCarrierDot) {
        return {
            type: 'getQuotaStatusResult',
            data: {
                success: true,
                tier: 'free',
                used: 0,
                limit: 0,
                remaining: 0,
                resetDate: null,
                canSearch: false
            }
        };
    }

    const usage = await mockSubscriptionService.getUsageStats(currentCarrierDot);
    const subscription = await mockSubscriptionService.getSubscription(currentCarrierDot);

    return {
        type: 'getQuotaStatusResult',
        data: {
            success: true,
            tier: subscription.plan_type || 'free',
            used: usage.used || 0,
            limit: usage.quota === -1 ? 'Unlimited' : (usage.quota || 0),
            remaining: usage.remaining === -1 ? 'Unlimited' : (usage.remaining || 0),
            resetDate: usage.resetDate || null,
            daysUntilReset: usage.daysUntilReset || 0,
            canSearch: subscription.plan_type !== 'free' && subscription.is_active
        }
    };
}

async function handleGetWeightPreferences() {
    if (!currentCarrierDot) {
        return null;
    }

    const result = await mockCarrierPreferences.getWeightPreferences(currentCarrierDot);

    if (result.success) {
        return {
            type: 'loadWeightPreferences',
            data: {
                success: true,
                weights: {
                    qualifications: result.weights.weight_qualifications,
                    experience: result.weights.weight_experience,
                    location: result.weights.weight_location,
                    availability: result.weights.weight_availability,
                    salaryFit: result.weights.weight_salaryFit,
                    engagement: result.weights.weight_engagement
                },
                isDefault: result.isDefault
            }
        };
    }

    return null;
}

async function handleSaveWeightPreferences(data) {
    if (!currentCarrierDot) {
        return {
            type: 'savePreferencesResult',
            data: { success: false, error: 'No carrier assigned' }
        };
    }

    const weights = {
        weight_qualifications: data.weight_qualifications,
        weight_experience: data.weight_experience,
        weight_location: data.weight_location,
        weight_availability: data.weight_availability,
        weight_salaryFit: data.weight_salaryFit,
        weight_engagement: data.weight_engagement
    };

    const result = await mockCarrierPreferences.saveWeightPreferences(currentCarrierDot, weights);

    return {
        type: 'savePreferencesResult',
        data: {
            success: result.success,
            error: result.error,
            weights: result.weights
        }
    };
}

async function processMessage(msg) {
    if (!msg || !msg.type) return null;

    switch (msg.type) {
        case 'searchDrivers':
            return await handleSearchDrivers(msg.data || {});
        case 'viewDriverProfile':
            return await handleViewProfile(msg.data || {});
        case 'saveDriver':
            return await handleSaveDriver(msg.data || {});
        case 'contactDriver':
            return await handleContactDriver(msg.data || {});
        case 'getQuotaStatus':
            return await handleGetQuotaStatus();
        case 'driverSearchReady':
            // Returns quota status on init
            return await handleGetQuotaStatus();
        case 'getWeightPreferences':
            return await handleGetWeightPreferences();
        case 'saveWeightPreferences':
            return await handleSaveWeightPreferences(msg.data || {});
        default:
            return null;
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('RecruiterDriverSearch Bridge Tests', () => {
    beforeEach(() => {
        resetMocks();
    });

    // =========================================================================
    // DRIVER SEARCH
    // =========================================================================
    describe('searchDrivers', () => {
        beforeEach(() => {
            currentCarrierDot = 1234567;
        });

        it('should return matching drivers on successful search', async () => {
            mockDriverMatching.findMatchingDrivers.mockResolvedValue({
                success: true,
                matches: [
                    {
                        driver: {
                            _id: 'd1',
                            first_name: 'John',
                            last_name: 'Doe',
                            city: 'Dallas',
                            state: 'TX',
                            years_experience: 5,
                            cdl_class: 'A',
                            endorsements: ['H', 'T'],
                            availability: 'immediate'
                        },
                        score: 92.5,
                        rationale: ['Excellent experience', 'Has required endorsements'],
                        isMutualMatch: true
                    },
                    {
                        driver: {
                            _id: 'd2',
                            first_name: 'Jane',
                            last_name: 'Smith',
                            city: 'Houston',
                            state: 'TX',
                            years_experience: 3,
                            cdl_class: 'A',
                            endorsements: ['H'],
                            availability: '2_weeks'
                        },
                        score: 85.0,
                        rationale: ['Good location match'],
                        isMutualMatch: false
                    }
                ],
                pagination: { totalCount: 2, page: 0, pageSize: 20 }
            });

            mockSubscriptionService.getUsageStats.mockResolvedValue({
                used: 5,
                quota: 50,
                remaining: 45
            });

            mockSubscriptionService.getSubscription.mockResolvedValue({
                plan_type: 'pro',
                is_active: true
            });

            const result = await processMessage({
                type: 'searchDrivers',
                data: {
                    cdlClasses: ['A'],
                    endorsements: ['H'],
                    zip: '75001',
                    radius: 100,
                    limit: 20,
                    offset: 0
                }
            });

            expect(result.type).toBe('searchDriversResult');
            expect(result.data.success).toBe(true);
            expect(result.data.drivers.length).toBe(2);
            expect(result.data.drivers[0].name).toBe('John Doe');
            expect(result.data.drivers[0].matchScore).toBe(93);
            expect(result.data.drivers[0].isMutualMatch).toBe(true);
            expect(result.data.total).toBe(2);
            expect(result.data.quotaStatus.tier).toBe('pro');
        });

        it('should return error when no carrier assigned', async () => {
            currentCarrierDot = null;

            const result = await processMessage({
                type: 'searchDrivers',
                data: { cdlClasses: ['A'] }
            });

            expect(result.data.success).toBe(false);
            expect(result.data.error).toContain('No carrier assigned');
        });

        it('should handle search errors gracefully', async () => {
            mockDriverMatching.findMatchingDrivers.mockResolvedValue({
                success: false,
                error: 'Database connection failed'
            });

            const result = await processMessage({
                type: 'searchDrivers',
                data: { cdlClasses: ['A'] }
            });

            expect(result.data.success).toBe(false);
            expect(result.data.error).toBe('Database connection failed');
        });

        it('should handle drivers with missing name fields', async () => {
            mockDriverMatching.findMatchingDrivers.mockResolvedValue({
                success: true,
                matches: [
                    {
                        driver: { _id: 'd1', zip_code: '75001' },
                        score: 70,
                        rationale: []
                    }
                ],
                pagination: { totalCount: 1 }
            });

            mockSubscriptionService.getUsageStats.mockResolvedValue({ used: 0, quota: 10, remaining: 10 });
            mockSubscriptionService.getSubscription.mockResolvedValue({ plan_type: 'starter' });

            const result = await processMessage({
                type: 'searchDrivers',
                data: {}
            });

            expect(result.data.drivers[0].name).toBe('Driver');
            expect(result.data.drivers[0].location).toBe('75001');
        });
    });

    // =========================================================================
    // VIEW DRIVER PROFILE
    // =========================================================================
    describe('viewDriverProfile', () => {
        beforeEach(() => {
            currentCarrierDot = 1234567;
        });

        it('should return full driver profile on success', async () => {
            mockDriverMatching.getDriverProfile.mockResolvedValue({
                success: true,
                driver: {
                    _id: 'd1',
                    first_name: 'John',
                    last_name: 'Doe',
                    city: 'Dallas',
                    state: 'TX',
                    phone: '555-123-4567',
                    email: 'john@example.com',
                    years_experience: 5,
                    cdl_class: 'A',
                    endorsements: ['H', 'T'],
                    equipment_experience: ['Dry Van', 'Reefer'],
                    availability: 'immediate'
                },
                quotaUsed: true,
                quota: { used: 6, total: 50, remaining: 44 }
            });

            const result = await processMessage({
                type: 'viewDriverProfile',
                data: { driverId: 'd1', matchScore: 92 }
            });

            expect(result.type).toBe('viewDriverProfileResult');
            expect(result.data.success).toBe(true);
            expect(result.data.driver.name).toBe('John Doe');
            expect(result.data.driver.phone).toBe('555-123-4567');
            expect(result.data.driver.email).toBe('john@example.com');
            expect(result.data.quotaUsed).toBe(true);
            expect(result.data.quotaStatus.remaining).toBe(44);
        });

        it('should indicate quota exceeded on quota error', async () => {
            mockDriverMatching.getDriverProfile.mockResolvedValue({
                success: false,
                error: 'Monthly profile view quota exhausted'
            });

            const result = await processMessage({
                type: 'viewDriverProfile',
                data: { driverId: 'd1' }
            });

            expect(result.data.success).toBe(false);
            expect(result.data.quotaExceeded).toBe(true);
        });

        it('should return error when no carrier assigned', async () => {
            currentCarrierDot = null;

            const result = await processMessage({
                type: 'viewDriverProfile',
                data: { driverId: 'd1' }
            });

            expect(result.data.success).toBe(false);
            expect(result.data.error).toBe('No carrier assigned.');
        });
    });

    // =========================================================================
    // SAVE DRIVER TO PIPELINE
    // =========================================================================
    describe('saveDriver', () => {
        beforeEach(() => {
            currentCarrierDot = 1234567;
        });

        it('should save driver to pipeline successfully', async () => {
            mockDriverOutreach.saveDriverToPipeline.mockResolvedValue({
                success: true
            });

            const result = await processMessage({
                type: 'saveDriver',
                data: { driverId: 'd1', notes: 'Good candidate' }
            });

            expect(result.type).toBe('saveDriverResult');
            expect(result.data.success).toBe(true);
            expect(mockDriverOutreach.saveDriverToPipeline).toHaveBeenCalledWith(
                1234567, 'd1', 'Good candidate'
            );
        });

        it('should indicate when driver already saved', async () => {
            mockDriverOutreach.saveDriverToPipeline.mockResolvedValue({
                success: false,
                error: 'Driver already in pipeline',
                errorCode: 'DUPLICATE_SAVE'
            });

            const result = await processMessage({
                type: 'saveDriver',
                data: { driverId: 'd1' }
            });

            expect(result.data.success).toBe(false);
            expect(result.data.alreadySaved).toBe(true);
        });

        it('should return error when no carrier assigned', async () => {
            currentCarrierDot = null;

            const result = await processMessage({
                type: 'saveDriver',
                data: { driverId: 'd1' }
            });

            expect(result.data.success).toBe(false);
        });
    });

    // =========================================================================
    // CONTACT DRIVER
    // =========================================================================
    describe('contactDriver', () => {
        beforeEach(() => {
            currentCarrierDot = 1234567;
        });

        it('should send message to driver successfully', async () => {
            mockDriverOutreach.sendMessageToDriver.mockResolvedValue({
                success: true
            });

            const result = await processMessage({
                type: 'contactDriver',
                data: {
                    driverId: 'd1',
                    message: 'Hi, we have an opportunity for you!'
                }
            });

            expect(result.type).toBe('contactDriverResult');
            expect(result.data.success).toBe(true);
            expect(mockDriverOutreach.sendMessageToDriver).toHaveBeenCalledWith(
                1234567, 'd1', 'Hi, we have an opportunity for you!'
            );
        });

        it('should indicate when subscription required', async () => {
            mockDriverOutreach.sendMessageToDriver.mockResolvedValue({
                success: false,
                error: 'Subscription required to contact drivers',
                errorCode: 'SUBSCRIPTION_REQUIRED'
            });

            const result = await processMessage({
                type: 'contactDriver',
                data: { driverId: 'd1', message: 'Hello' }
            });

            expect(result.data.success).toBe(false);
            expect(result.data.requiresSubscription).toBe(true);
        });

        it('should return error when no carrier assigned', async () => {
            currentCarrierDot = null;

            const result = await processMessage({
                type: 'contactDriver',
                data: { driverId: 'd1', message: 'Hello' }
            });

            expect(result.data.success).toBe(false);
        });
    });

    // =========================================================================
    // QUOTA STATUS
    // =========================================================================
    describe('getQuotaStatus', () => {
        it('should return quota status for subscribed carrier', async () => {
            currentCarrierDot = 1234567;

            mockSubscriptionService.getUsageStats.mockResolvedValue({
                used: 10,
                quota: 100,
                remaining: 90,
                resetDate: '2026-03-01',
                daysUntilReset: 24
            });

            mockSubscriptionService.getSubscription.mockResolvedValue({
                plan_type: 'enterprise',
                is_active: true
            });

            const result = await processMessage({ type: 'getQuotaStatus' });

            expect(result.type).toBe('getQuotaStatusResult');
            expect(result.data.success).toBe(true);
            expect(result.data.tier).toBe('enterprise');
            expect(result.data.used).toBe(10);
            expect(result.data.remaining).toBe(90);
            expect(result.data.canSearch).toBe(true);
        });

        it('should return unlimited for unlimited plans', async () => {
            currentCarrierDot = 1234567;

            mockSubscriptionService.getUsageStats.mockResolvedValue({
                used: 50,
                quota: -1,
                remaining: -1
            });

            mockSubscriptionService.getSubscription.mockResolvedValue({
                plan_type: 'unlimited',
                is_active: true
            });

            const result = await processMessage({ type: 'getQuotaStatus' });

            expect(result.data.limit).toBe('Unlimited');
            expect(result.data.remaining).toBe('Unlimited');
        });

        it('should return free tier defaults when no carrier', async () => {
            currentCarrierDot = null;

            const result = await processMessage({ type: 'getQuotaStatus' });

            expect(result.data.tier).toBe('free');
            expect(result.data.used).toBe(0);
            expect(result.data.canSearch).toBe(false);
        });

        it('should return quota on driverSearchReady', async () => {
            currentCarrierDot = 1234567;

            mockSubscriptionService.getUsageStats.mockResolvedValue({
                used: 5, quota: 50, remaining: 45
            });
            mockSubscriptionService.getSubscription.mockResolvedValue({
                plan_type: 'pro', is_active: true
            });

            const result = await processMessage({ type: 'driverSearchReady' });

            expect(result.type).toBe('getQuotaStatusResult');
            expect(result.data.success).toBe(true);
        });
    });

    // =========================================================================
    // WEIGHT PREFERENCES
    // =========================================================================
    describe('Weight Preferences', () => {
        beforeEach(() => {
            currentCarrierDot = 1234567;
        });

        it('should return weight preferences on request', async () => {
            mockCarrierPreferences.getWeightPreferences.mockResolvedValue({
                success: true,
                weights: {
                    weight_qualifications: 30,
                    weight_experience: 25,
                    weight_location: 20,
                    weight_availability: 10,
                    weight_salaryFit: 10,
                    weight_engagement: 5
                },
                isDefault: false
            });

            const result = await processMessage({ type: 'getWeightPreferences' });

            expect(result.type).toBe('loadWeightPreferences');
            expect(result.data.success).toBe(true);
            expect(result.data.weights.qualifications).toBe(30);
            expect(result.data.weights.experience).toBe(25);
            expect(result.data.isDefault).toBe(false);
        });

        it('should return null when no carrier assigned', async () => {
            currentCarrierDot = null;

            const result = await processMessage({ type: 'getWeightPreferences' });

            expect(result).toBeNull();
        });

        it('should save weight preferences', async () => {
            mockCarrierPreferences.saveWeightPreferences.mockResolvedValue({
                success: true,
                weights: { weight_qualifications: 35 }
            });

            const result = await processMessage({
                type: 'saveWeightPreferences',
                data: {
                    weight_qualifications: 35,
                    weight_experience: 20,
                    weight_location: 20,
                    weight_availability: 10,
                    weight_salaryFit: 10,
                    weight_engagement: 5
                }
            });

            expect(result.type).toBe('savePreferencesResult');
            expect(result.data.success).toBe(true);
            expect(mockCarrierPreferences.saveWeightPreferences).toHaveBeenCalledWith(
                1234567,
                expect.objectContaining({ weight_qualifications: 35 })
            );
        });

        it('should return error on save when no carrier', async () => {
            currentCarrierDot = null;

            const result = await processMessage({
                type: 'saveWeightPreferences',
                data: { weight_qualifications: 30 }
            });

            expect(result.data.success).toBe(false);
            expect(result.data.error).toBe('No carrier assigned');
        });
    });

    // =========================================================================
    // EDGE CASES
    // =========================================================================
    describe('Edge Cases', () => {
        it('should handle unknown message types', async () => {
            const result = await processMessage({ type: 'unknownAction' });
            expect(result).toBeNull();
        });

        it('should handle null message', async () => {
            const result = await processMessage(null);
            expect(result).toBeNull();
        });

        it('should handle message without type', async () => {
            const result = await processMessage({ data: {} });
            expect(result).toBeNull();
        });
    });
});
