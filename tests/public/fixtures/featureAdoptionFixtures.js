/**
 * Feature Adoption Service Test Fixtures
 * =======================================
 * Centralized test data for the Feature Adoption Log system tests.
 *
 * @module featureAdoptionFixtures
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Valid action types for feature interactions
 */
const VALID_ACTIONS = ['view', 'click', 'complete', 'hover', 'scroll_to', 'time_spent', 'error', 'abandon', 'share', 'repeat', 'first_use'];

/**
 * Valid user roles
 */
const VALID_ROLES = ['driver', 'carrier', 'recruiter', 'admin', 'anonymous'];

/**
 * Valid feature statuses
 */
const VALID_STATUSES = ['beta', 'active', 'deprecated', 'sunset'];

/**
 * Valid expected usage patterns
 */
const VALID_USAGE_PATTERNS = ['daily', 'weekly', 'onboarding-only', 'event-driven'];

/**
 * Feature lifecycle categories
 */
const FEATURE_CYCLES = {
    NEW: 'New',
    ADOPTED: 'Adopted',
    MATURE: 'Mature',
    AT_RISK: 'At Risk',
    DEAD: 'Dead'
};

/**
 * Error codes for the Feature Adoption system
 */
const ERROR_CODES = {
    FAL_001: 'Feature not found in registry',
    FAL_002: 'Invalid action type',
    FAL_003: 'Missing required field',
    FAL_004: 'Session ID not initialized',
    FAL_005: 'Funnel not found',
    FAL_006: 'Invalid time range',
    FAL_007: 'Aggregation failed',
    FAL_008: 'Status transition invalid'
};

// ============================================================================
// FEATURE REGISTRY FIXTURES
// ============================================================================

/**
 * Sample features for the FeatureRegistry collection
 */
const SAMPLE_FEATURES = [
    {
        _id: 'feat_carrier_search',
        featureId: 'carrier_search',
        displayName: 'Carrier Search & Matching',
        description: 'AI-powered search to find carriers matching driver preferences',
        category: 'matching',
        launchDate: new Date('2025-06-15'),
        status: 'active',
        expectedUsagePattern: 'daily',
        targetRoles: ['driver', 'recruiter'],
        owner: 'matching-team',
        successMetric: 'completion_rate > 40%',
        retirementThreshold: 30,
        relatedFeatures: ['driver_profile', 'carrier_detail'],
        documentationUrl: 'https://docs.lmdr.com/carrier-search'
    },
    {
        _id: 'feat_driver_application',
        featureId: 'driver_application',
        displayName: 'Driver Application Form',
        description: 'Multi-step application form for drivers applying to carriers',
        category: 'onboarding',
        launchDate: new Date('2025-04-01'),
        status: 'active',
        expectedUsagePattern: 'event-driven',
        targetRoles: ['driver'],
        owner: 'onboarding-team',
        successMetric: 'daily_submissions > 50',
        retirementThreshold: 14,
        relatedFeatures: ['carrier_search', 'carrier_detail'],
        documentationUrl: 'https://docs.lmdr.com/driver-application'
    },
    {
        _id: 'feat_interview_scheduler',
        featureId: 'interview_scheduler',
        displayName: 'Interview Scheduler',
        description: 'Schedule and manage driver interviews',
        category: 'communication',
        launchDate: new Date('2025-08-01'),
        status: 'active',
        expectedUsagePattern: 'weekly',
        targetRoles: ['recruiter', 'carrier'],
        owner: 'communication-team',
        successMetric: 'interviews_scheduled > 20/week',
        retirementThreshold: 21,
        relatedFeatures: ['messaging', 'driver_profile'],
        documentationUrl: 'https://docs.lmdr.com/interview-scheduler'
    },
    {
        _id: 'feat_legacy_job_board',
        featureId: 'legacy_job_board',
        displayName: 'Legacy Job Board',
        description: 'Old job board - being phased out',
        category: 'matching',
        launchDate: new Date('2024-01-01'),
        status: 'deprecated',
        expectedUsagePattern: 'daily',
        targetRoles: ['driver'],
        owner: 'legacy-team',
        successMetric: 'N/A - deprecated',
        retirementThreshold: 7,
        relatedFeatures: [],
        documentationUrl: null
    },
    {
        _id: 'feat_ai_chat',
        featureId: 'ai_chat_support',
        displayName: 'AI Chat Support',
        description: 'AI-powered chat assistant for driver support',
        category: 'communication',
        launchDate: new Date('2026-01-10'),
        status: 'beta',
        expectedUsagePattern: 'daily',
        targetRoles: ['driver', 'recruiter'],
        owner: 'ai-team',
        successMetric: 'daily_active_users > 50',
        retirementThreshold: 30,
        relatedFeatures: ['messaging'],
        documentationUrl: 'https://docs.lmdr.com/ai-chat'
    }
];

/**
 * Create a sample feature with optional overrides
 * @param {Object} overrides - Fields to override
 * @returns {Object} Feature record
 */
function createSampleFeature(overrides = {}) {
    const base = {
        _id: `feat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        featureId: `test_feature_${Date.now()}`,
        displayName: 'Test Feature',
        description: 'A test feature for unit testing',
        category: 'testing',
        launchDate: new Date(),
        status: 'beta',
        expectedUsagePattern: 'daily',
        targetRoles: ['driver'],
        owner: 'test-team',
        successMetric: 'test_metric > 0',
        retirementThreshold: 30,
        relatedFeatures: [],
        documentationUrl: null,
        _createdDate: new Date(),
        _updatedDate: new Date()
    };
    return { ...base, ...overrides };
}

// ============================================================================
// FEATURE ADOPTION LOGS FIXTURES
// ============================================================================

/**
 * Sample interaction logs for testing
 */
const SAMPLE_INTERACTIONS = [
    {
        _id: 'log_001',
        featureId: 'carrier_search',
        featureVersion: 'v2.1',
        userId: 'user_driver_001',
        userRole: 'driver',
        action: 'view',
        timestamp: new Date('2026-01-15T10:00:00Z'),
        sessionId: 'sess_abc123',
        deviceType: 'mobile',
        referrer: '/dashboard',
        entryPoint: 'nav_menu',
        durationMs: 45000,
        scrollDepth: 75,
        interactionCount: 5,
        outcome: 'success',
        conversionValue: null,
        nextFeature: 'carrier_detail',
        metadata: { searchQuery: 'OTR Texas', resultsCount: 45 }
    },
    {
        _id: 'log_002',
        featureId: 'carrier_search',
        featureVersion: 'v2.1',
        userId: 'user_driver_001',
        userRole: 'driver',
        action: 'click',
        timestamp: new Date('2026-01-15T10:00:45Z'),
        sessionId: 'sess_abc123',
        deviceType: 'mobile',
        referrer: null,
        entryPoint: null,
        durationMs: null,
        scrollDepth: null,
        interactionCount: 1,
        outcome: null,
        conversionValue: null,
        nextFeature: 'carrier_detail',
        metadata: { element: 'result_card', carrierId: 'carrier_456' }
    },
    {
        _id: 'log_003',
        featureId: 'driver_application',
        featureVersion: 'v1.0',
        userId: 'user_driver_001',
        userRole: 'driver',
        action: 'view',
        timestamp: new Date('2026-01-15T10:05:00Z'),
        sessionId: 'sess_abc123',
        deviceType: 'mobile',
        referrer: '/carrier/456',
        entryPoint: 'apply_button',
        durationMs: null,
        scrollDepth: null,
        interactionCount: 0,
        outcome: null,
        conversionValue: null,
        nextFeature: null,
        metadata: { carrierId: 'carrier_456' }
    },
    {
        _id: 'log_004',
        featureId: 'driver_application',
        featureVersion: 'v1.0',
        userId: 'user_driver_001',
        userRole: 'driver',
        action: 'complete',
        timestamp: new Date('2026-01-15T10:15:00Z'),
        sessionId: 'sess_abc123',
        deviceType: 'mobile',
        referrer: null,
        entryPoint: null,
        durationMs: 600000,
        scrollDepth: 100,
        interactionCount: 25,
        outcome: 'success',
        conversionValue: 1,
        nextFeature: 'application_confirmation',
        metadata: { carrierId: 'carrier_456', applicationId: 'app_789' }
    },
    {
        _id: 'log_005',
        featureId: 'carrier_search',
        featureVersion: 'v2.1',
        userId: 'user_driver_002',
        userRole: 'driver',
        action: 'error',
        timestamp: new Date('2026-01-15T11:00:00Z'),
        sessionId: 'sess_def456',
        deviceType: 'desktop',
        referrer: '/dashboard',
        entryPoint: 'search_bar',
        durationMs: null,
        scrollDepth: null,
        interactionCount: 1,
        outcome: 'failure',
        conversionValue: null,
        nextFeature: null,
        errorCode: 'SEARCH_TIMEOUT',
        errorMessage: 'Search timed out after 30s',
        metadata: { searchQuery: 'regional midwest', errorStack: 'Error at search.js:45' }
    }
];

/**
 * Create a sample interaction with optional overrides
 * @param {Object} overrides - Fields to override
 * @returns {Object} Interaction record
 */
function createSampleInteraction(overrides = {}) {
    const base = {
        _id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        featureId: 'test_feature',
        featureVersion: 'v1.0',
        userId: `user_${Math.random().toString(36).substr(2, 6)}`,
        userRole: 'driver',
        action: 'view',
        timestamp: new Date(),
        sessionId: `sess_${Math.random().toString(36).substr(2, 9)}`,
        deviceType: 'desktop',
        referrer: '/dashboard',
        entryPoint: 'nav_menu',
        durationMs: null,
        scrollDepth: null,
        interactionCount: 0,
        outcome: null,
        conversionValue: null,
        nextFeature: null,
        errorCode: null,
        errorMessage: null,
        metadata: {},
        _createdDate: new Date()
    };
    return { ...base, ...overrides };
}

/**
 * Generate multiple sample interactions
 * @param {number} count - Number of interactions to generate
 * @param {Object} baseOverrides - Overrides applied to all generated interactions
 * @returns {Array} Array of interaction records
 */
function generateSampleInteractions(count, baseOverrides = {}) {
    const featureIds = ['carrier_search', 'driver_application', 'interview_scheduler', 'ai_chat_support'];
    const actions = ['view', 'click', 'complete', 'error', 'abandon'];
    const roles = ['driver', 'recruiter', 'carrier'];
    const devices = ['mobile', 'desktop', 'tablet'];

    const interactions = [];
    for (let i = 0; i < count; i++) {
        const timestamp = new Date();
        timestamp.setDate(timestamp.getDate() - Math.floor(Math.random() * 30));
        timestamp.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));

        interactions.push(createSampleInteraction({
            _id: `log_gen_${i}`,
            featureId: featureIds[i % featureIds.length],
            userId: `user_${i % 20}`,
            userRole: roles[i % roles.length],
            action: actions[i % actions.length],
            timestamp,
            deviceType: devices[i % devices.length],
            ...baseOverrides
        }));
    }
    return interactions;
}

// ============================================================================
// FEATURE FUNNELS FIXTURES
// ============================================================================

/**
 * Sample funnel definitions
 */
const SAMPLE_FUNNELS = [
    {
        _id: 'funnel_driver_application',
        funnelId: 'driver_application_flow',
        displayName: 'Driver Application Funnel',
        description: 'Tracks drivers from search to application submission',
        steps: [
            { order: 1, featureId: 'carrier_search', action: 'view', displayName: 'Search Carriers', optional: false },
            { order: 2, featureId: 'carrier_detail', action: 'view', displayName: 'View Carrier Details', optional: false },
            { order: 3, featureId: 'driver_application', action: 'view', displayName: 'Start Application', optional: false },
            { order: 4, featureId: 'driver_application', action: 'complete', displayName: 'Submit Application', optional: false }
        ],
        createdAt: new Date('2025-06-01'),
        updatedAt: new Date('2025-12-01'),
        isActive: true
    },
    {
        _id: 'funnel_recruiter_onboarding',
        funnelId: 'recruiter_onboarding',
        displayName: 'Recruiter Onboarding Flow',
        description: 'Tracks recruiters from signup to first driver contact',
        steps: [
            { order: 1, featureId: 'recruiter_signup', action: 'complete', displayName: 'Create Account', optional: false },
            { order: 2, featureId: 'company_profile', action: 'complete', displayName: 'Complete Company Profile', optional: false },
            { order: 3, featureId: 'driver_search', action: 'view', displayName: 'Search Drivers', optional: false },
            { order: 4, featureId: 'driver_outreach', action: 'complete', displayName: 'Contact First Driver', optional: false }
        ],
        createdAt: new Date('2025-08-01'),
        updatedAt: new Date('2025-11-15'),
        isActive: true
    },
    {
        _id: 'funnel_interview_booking',
        funnelId: 'interview_booking_flow',
        displayName: 'Interview Booking Funnel',
        description: 'Tracks interview scheduling from request to confirmation',
        steps: [
            { order: 1, featureId: 'interview_scheduler', action: 'view', displayName: 'Open Scheduler', optional: false },
            { order: 2, featureId: 'interview_scheduler', action: 'click', displayName: 'Select Time Slot', optional: false },
            { order: 3, featureId: 'interview_scheduler', action: 'complete', displayName: 'Confirm Booking', optional: false }
        ],
        createdAt: new Date('2025-09-01'),
        updatedAt: new Date('2025-09-01'),
        isActive: true
    }
];

/**
 * Create a sample funnel with optional overrides
 * @param {Object} overrides - Fields to override
 * @returns {Object} Funnel record
 */
function createSampleFunnel(overrides = {}) {
    const base = {
        _id: `funnel_${Date.now()}`,
        funnelId: `test_funnel_${Date.now()}`,
        displayName: 'Test Funnel',
        description: 'A test funnel for unit testing',
        steps: [
            { order: 1, featureId: 'step_one', action: 'view', displayName: 'Step One', optional: false },
            { order: 2, featureId: 'step_two', action: 'complete', displayName: 'Step Two', optional: false }
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true
    };
    return { ...base, ...overrides };
}

// ============================================================================
// FEATURE METRICS DAILY FIXTURES
// ============================================================================

/**
 * Sample daily aggregated metrics
 */
const SAMPLE_DAILY_METRICS = [
    {
        _id: 'metric_cs_20260119',
        featureId: 'carrier_search',
        date: new Date('2026-01-19T00:00:00Z'),
        uniqueUsers: 1247,
        totalInteractions: 8934,
        completionRate: 42.5,
        avgDurationMs: 34500,
        errorRate: 2.3,
        abandonRate: 15.7,
        byRole: {
            driver: { users: 890, interactions: 5200, completionRate: 45.2 },
            recruiter: { users: 234, interactions: 2800, completionRate: 38.1 },
            carrier: { users: 123, interactions: 934, completionRate: 51.0 }
        },
        byDevice: {
            mobile: { users: 678, interactions: 4500 },
            desktop: { users: 534, interactions: 4200 },
            tablet: { users: 35, interactions: 234 }
        },
        byEntryPoint: {
            nav_menu: { users: 500, interactions: 3000 },
            search_bar: { users: 400, interactions: 2500 },
            dashboard_cta: { users: 347, interactions: 3434 }
        },
        topErrors: [
            { code: 'SEARCH_TIMEOUT', count: 45 },
            { code: 'NO_RESULTS', count: 32 },
            { code: 'FILTER_ERROR', count: 12 }
        ],
        conversionValueTotal: 12450.00
    },
    {
        _id: 'metric_da_20260119',
        featureId: 'driver_application',
        date: new Date('2026-01-19T00:00:00Z'),
        uniqueUsers: 523,
        totalInteractions: 2145,
        completionRate: 38.5,
        avgDurationMs: 480000,
        errorRate: 4.1,
        abandonRate: 28.3,
        byRole: {
            driver: { users: 523, interactions: 2145, completionRate: 38.5 }
        },
        byDevice: {
            mobile: { users: 312, interactions: 1200 },
            desktop: { users: 211, interactions: 945 }
        },
        byEntryPoint: {
            apply_button: { users: 523, interactions: 2145 }
        },
        topErrors: [
            { code: 'VALIDATION_ERROR', count: 67 },
            { code: 'UPLOAD_FAILED', count: 21 }
        ],
        conversionValueTotal: 523.00
    }
];

/**
 * Create a sample daily metric record with optional overrides
 * @param {Object} overrides - Fields to override
 * @returns {Object} Daily metric record
 */
function createSampleDailyMetric(overrides = {}) {
    const base = {
        _id: `metric_${Date.now()}`,
        featureId: 'test_feature',
        date: new Date(),
        uniqueUsers: 100,
        totalInteractions: 500,
        completionRate: 40.0,
        avgDurationMs: 30000,
        errorRate: 2.0,
        abandonRate: 15.0,
        byRole: {
            driver: { users: 70, interactions: 350, completionRate: 42.0 },
            recruiter: { users: 30, interactions: 150, completionRate: 36.0 }
        },
        byDevice: {
            mobile: { users: 60, interactions: 300 },
            desktop: { users: 40, interactions: 200 }
        },
        byEntryPoint: {
            nav_menu: { users: 100, interactions: 500 }
        },
        topErrors: [],
        conversionValueTotal: 0,
        _createdDate: new Date()
    };
    return { ...base, ...overrides };
}

/**
 * Generate daily metrics for a date range
 * @param {string} featureId - Feature ID
 * @param {number} days - Number of days to generate
 * @returns {Array} Array of daily metric records
 */
function generateDailyMetrics(featureId, days) {
    const metrics = [];
    for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        // Simulate some variance in metrics
        const baseUsers = 100 + Math.floor(Math.random() * 50);
        const variance = 0.9 + Math.random() * 0.2;

        metrics.push(createSampleDailyMetric({
            _id: `metric_${featureId}_${date.toISOString().split('T')[0]}`,
            featureId,
            date,
            uniqueUsers: Math.floor(baseUsers * variance),
            totalInteractions: Math.floor(baseUsers * 5 * variance),
            completionRate: 35 + Math.random() * 20,
            errorRate: 1 + Math.random() * 4
        }));
    }
    return metrics;
}

// ============================================================================
// MOCK DATA HELPERS
// ============================================================================

/**
 * Create a mock wixData query builder chain
 * @param {Array} items - Items to return from find()
 * @param {number} totalCount - Total count (optional, defaults to items.length)
 * @returns {Object} Mock query builder
 */
function createMockQueryBuilder(items = [], totalCount = null) {
    const builder = {
        eq: jest.fn().mockReturnThis(),
        ne: jest.fn().mockReturnThis(),
        ge: jest.fn().mockReturnThis(),
        le: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        contains: jest.fn().mockReturnThis(),
        startsWith: jest.fn().mockReturnThis(),
        hasAll: jest.fn().mockReturnThis(),
        hasSome: jest.fn().mockReturnThis(),
        ascending: jest.fn().mockReturnThis(),
        descending: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        include: jest.fn().mockReturnThis(),
        between: jest.fn().mockReturnThis(),
        find: jest.fn().mockResolvedValue({
            items,
            totalCount: totalCount !== null ? totalCount : items.length,
            length: items.length,
            hasNext: () => false,
            hasPrev: () => false
        })
    };
    return builder;
}

/**
 * Create mock wixData module
 * @returns {Object} Mock wixData object with common methods
 */
function createMockWixData() {
    return {
        insert: jest.fn(),
        query: jest.fn(),
        get: jest.fn(),
        update: jest.fn(),
        remove: jest.fn(),
        aggregate: jest.fn(),
        bulkInsert: jest.fn(),
        bulkUpdate: jest.fn(),
        bulkRemove: jest.fn()
    };
}

// ============================================================================
// VALIDATION TEST DATA
// ============================================================================

/**
 * Invalid inputs for testing validation
 */
const INVALID_INPUTS = {
    featureIds: [null, undefined, '', '   ', 123, {}, [], true],
    userIds: [null, undefined, '', '   ', 123, {}, [], true],
    actions: ['invalid_action', 'VIEW', 'Click', '', null, 123],
    roles: ['superuser', 'admin_role', 'DRIVER', '', null, 123],
    statuses: ['active_status', 'BETA', '', null, 123],
    timeRanges: [
        { start: null, end: new Date() },
        { start: new Date(), end: null },
        { start: new Date('2026-01-20'), end: new Date('2026-01-10') }, // end before start
        null,
        'invalid'
    ]
};

/**
 * Valid status transitions for updateFeatureStatus
 */
const VALID_STATUS_TRANSITIONS = [
    { from: 'beta', to: 'active' },
    { from: 'active', to: 'deprecated' },
    { from: 'deprecated', to: 'sunset' },
    { from: 'deprecated', to: 'active' } // reactivation
];

/**
 * Invalid status transitions
 */
const INVALID_STATUS_TRANSITIONS = [
    { from: 'beta', to: 'sunset' }, // skips deprecated
    { from: 'sunset', to: 'active' }, // can't reactivate from sunset
    { from: 'active', to: 'beta' } // can't go back to beta
];

// ============================================================================
// PERFORMANCE TEST DATA
// ============================================================================

/**
 * Generate large dataset for performance testing
 * @param {number} count - Number of records
 * @returns {Array} Large array of interaction records
 */
function generateLargeDataset(count) {
    return generateSampleInteractions(count);
}

/**
 * Performance test thresholds (in milliseconds)
 */
const PERFORMANCE_THRESHOLDS = {
    logWriteLatency: 100,
    statsQuery7Days: 500,
    lifecycleReport: 2000,
    dailyAggregation10k: 30000
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    // Constants
    VALID_ACTIONS,
    VALID_ROLES,
    VALID_STATUSES,
    VALID_USAGE_PATTERNS,
    FEATURE_CYCLES,
    ERROR_CODES,
    PERFORMANCE_THRESHOLDS,

    // Sample Data
    SAMPLE_FEATURES,
    SAMPLE_INTERACTIONS,
    SAMPLE_FUNNELS,
    SAMPLE_DAILY_METRICS,

    // Factory Functions
    createSampleFeature,
    createSampleInteraction,
    createSampleFunnel,
    createSampleDailyMetric,

    // Generators
    generateSampleInteractions,
    generateDailyMetrics,
    generateLargeDataset,

    // Mock Helpers
    createMockQueryBuilder,
    createMockWixData,

    // Validation Test Data
    INVALID_INPUTS,
    VALID_STATUS_TRANSITIONS,
    INVALID_STATUS_TRANSITIONS
};
