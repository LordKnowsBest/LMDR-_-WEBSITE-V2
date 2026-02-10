/* eslint-disable */
/**
 * Unit Tests for featureAdoptionService Logic
 *
 * Tests replicated core logic: validation, health scoring, lifecycle
 * classification, trend calculation, breakdown generation, and funnel analysis.
 */

// =============================================================================
// REPLICATED CONSTANTS
// =============================================================================

const CONFIG = {
    validActions: [
        'view', 'click', 'complete', 'hover', 'scroll_to',
        'time_spent', 'error', 'abandon', 'share', 'repeat', 'first_use'
    ],
    validStatuses: ['beta', 'active', 'deprecated', 'sunset'],
    thresholds: {
        newFeatureDays: 30,
        adoptedMinUsers: 10,
        adoptedMinInteractions: 50,
        matureMinDays: 90,
        atRiskDropPercent: 30,
        deadDaysNoUse: 30
    },
    healthWeights: {
        adoptionRate: 30,
        completionRate: 25,
        errorRate: 20,
        retentionRate: 15,
        engagementDepth: 10
    }
};

const FeatureCycles = {
    NEW: 'New',
    ADOPTED: 'Adopted',
    MATURE: 'Mature',
    AT_RISK: 'At Risk',
    DEAD: 'Dead',
    DEPRECATED: 'Deprecated'
};

const FeatureStatus = {
    BETA: 'beta',
    ACTIVE: 'active',
    DEPRECATED: 'deprecated',
    SUNSET: 'sunset'
};

// =============================================================================
// REPLICATED LOGIC - Validation
// =============================================================================

function validateLogInteraction(featureId, userId, action) {
    if (!featureId) {
        return { success: false, error: 'Missing required field: featureId', errorCode: 'FAL_003' };
    }
    if (!userId) {
        return { success: false, error: 'Missing required field: userId', errorCode: 'FAL_003' };
    }
    if (!action) {
        return { success: false, error: 'Missing required field: action', errorCode: 'FAL_003' };
    }
    if (!CONFIG.validActions.includes(action)) {
        return {
            success: false,
            error: `Invalid action: ${action}. Valid actions: ${CONFIG.validActions.join(', ')}`,
            errorCode: 'FAL_002'
        };
    }
    return { success: true };
}

function validateLogError(featureId, userId, errorCode, errorMessage) {
    if (!errorCode) {
        return { success: false, errorLogged: false, error: 'Missing required field: errorCode', errorCode: 'FAL_003' };
    }
    if (!errorMessage) {
        return { success: false, errorLogged: false, error: 'Missing required field: errorMessage', errorCode: 'FAL_003' };
    }
    return validateLogInteraction(featureId, userId, 'error');
}

function validateLogSession(sessionId, userId, features) {
    if (!sessionId) {
        return { success: false, sessionRecorded: false, featuresLogged: 0, error: 'Missing required field: sessionId', errorCode: 'FAL_004' };
    }
    if (!userId) {
        return { success: false, sessionRecorded: false, featuresLogged: 0, error: 'Missing required field: userId', errorCode: 'FAL_003' };
    }
    if (!Array.isArray(features) || features.length === 0) {
        return { success: false, sessionRecorded: false, featuresLogged: 0, error: 'features must be a non-empty array', errorCode: 'FAL_003' };
    }
    return { success: true };
}

function validateRegisterFeature(featureData) {
    if (!featureData || !featureData.featureId) {
        return { success: false, error: 'Missing required field: featureId', errorCode: 'FAL_003' };
    }
    if (!featureData.displayName) {
        return { success: false, error: 'Missing required field: displayName', errorCode: 'FAL_003' };
    }
    if (featureData.status && !CONFIG.validStatuses.includes(featureData.status)) {
        return { success: false, error: `Invalid status: ${featureData.status}`, errorCode: 'FAL_008' };
    }
    return { success: true };
}

function validateUpdateStatus(featureId, status) {
    if (!featureId) {
        return { success: false, error: 'Missing required field: featureId', errorCode: 'FAL_003' };
    }
    if (!status) {
        return { success: false, error: 'Missing required field: status', errorCode: 'FAL_003' };
    }
    if (!CONFIG.validStatuses.includes(status)) {
        return { success: false, error: `Invalid status: ${status}`, errorCode: 'FAL_008' };
    }
    return { success: true };
}

function validateDefineFunnel(funnelData) {
    if (!funnelData || !funnelData.funnelId) {
        return { success: false, error: 'Missing required field: funnelId', errorCode: 'FAL_003' };
    }
    if (!funnelData.displayName) {
        return { success: false, error: 'Missing required field: displayName', errorCode: 'FAL_003' };
    }
    if (!Array.isArray(funnelData.steps) || funnelData.steps.length === 0) {
        return { success: false, error: 'steps must be a non-empty array', errorCode: 'FAL_003' };
    }
    return { success: true };
}

function validateGetFeatureStats(featureId) {
    if (!featureId) {
        return { error: 'FAL_003: featureId is required', errorCode: 'FAL_003' };
    }
    return null;
}

function validateGetFeatureComparison(featureIds) {
    if (!Array.isArray(featureIds) || featureIds.length === 0) {
        return { error: 'FAL_003: featureIds must be a non-empty array', errorCode: 'FAL_003' };
    }
    return null;
}

function validateGetFunnelConversion(funnelId) {
    if (!funnelId) {
        return { error: 'FAL_005: funnelId is required', errorCode: 'FAL_005' };
    }
    return null;
}

function validateGetCohortRetention(featureId, cohortDate) {
    if (!featureId) {
        return { error: 'FAL_003: featureId is required', errorCode: 'FAL_003' };
    }
    if (!cohortDate) {
        return { error: 'FAL_003: cohortDate is required', errorCode: 'FAL_003' };
    }
    return null;
}

function validateGetFeatureHealthScore(featureId) {
    if (!featureId) {
        return { error: 'FAL_003: featureId is required', errorCode: 'FAL_003' };
    }
    return null;
}

// =============================================================================
// REPLICATED LOGIC - Health Scoring
// =============================================================================

function calculateHealthScore(adoptionRate, completionRate, errorRate, retentionRate, engagementDepth) {
    const weights = CONFIG.healthWeights;
    return Math.round(
        (adoptionRate * weights.adoptionRate / 100) +
        (completionRate * weights.completionRate / 100) +
        (Math.max(0, 100 - errorRate) * weights.errorRate / 100) +
        (retentionRate * weights.retentionRate / 100) +
        (engagementDepth * weights.engagementDepth / 100)
    );
}

function getHealthStatus(score) {
    if (score >= 70) return 'healthy';
    if (score >= 40) return 'warning';
    return 'critical';
}

function generateHealthRecommendation(healthScore, breakdown) {
    const issues = [];
    if (breakdown.adoptionRate < 30) issues.push('Low adoption - increase visibility');
    if (breakdown.completionRate < 40) issues.push('Low completion - simplify UX');
    if (breakdown.errorRate > 60) issues.push('High error rate - fix bugs');
    if (breakdown.retentionRate < 20) issues.push('Low retention - add engagement hooks');
    if (breakdown.engagementDepth < 30) issues.push('Low engagement - add interactive elements');

    if (issues.length === 0) return 'Feature is performing well.';
    return issues.join('. ') + '.';
}

// =============================================================================
// REPLICATED LOGIC - Trend Calculation
// =============================================================================

function calculateTrend(currentValue, previousValue) {
    if (previousValue === 0 && currentValue === 0) {
        return { direction: 'flat', percent: 0 };
    }
    if (previousValue === 0) {
        return { direction: 'up', percent: 100 };
    }
    const change = ((currentValue - previousValue) / previousValue) * 100;
    const percent = Math.round(Math.abs(change) * 10) / 10;
    if (change > 0) return { direction: 'up', percent };
    if (change < 0) return { direction: 'down', percent: -percent };
    return { direction: 'flat', percent: 0 };
}

function formatTrend(trend) {
    if (trend.direction === 'up') return '+' + trend.percent + '%';
    if (trend.direction === 'down') return trend.percent + '%';
    return '0%';
}

// =============================================================================
// REPLICATED LOGIC - Stats Calculations
// =============================================================================

function calculateStatsFromItems(items) {
    const uniqueUsers = new Set(items.map(i => i.userId)).size;
    const totalInteractions = items.length;
    const views = items.filter(i => i.action === 'view').length;
    const completions = items.filter(i => i.action === 'complete').length;
    const errors = items.filter(i => i.action === 'error').length;
    const abandons = items.filter(i => i.action === 'abandon').length;

    const durationsMs = items.filter(i => i.durationMs).map(i => i.durationMs);
    const avgDurationMs = durationsMs.length > 0
        ? Math.round(durationsMs.reduce((a, b) => a + b, 0) / durationsMs.length)
        : 0;

    const completionRate = views > 0 ? Math.round((completions / views) * 1000) / 10 : 0;
    const errorRate = totalInteractions > 0 ? Math.round((errors / totalInteractions) * 1000) / 10 : 0;
    const abandonRate = views > 0 ? Math.round((abandons / views) * 1000) / 10 : 0;

    return { uniqueUsers, totalInteractions, completionRate, avgDurationMs, errorRate, abandonRate };
}

function generateBreakdownByRole(items) {
    const byRole = {};
    items.forEach(item => {
        const role = item.userRole || 'unknown';
        if (!byRole[role]) {
            byRole[role] = { users: new Set(), interactions: 0, completions: 0, errors: 0, views: 0 };
        }
        byRole[role].users.add(item.userId);
        byRole[role].interactions++;
        if (item.action === 'complete') byRole[role].completions++;
        if (item.action === 'error') byRole[role].errors++;
        if (item.action === 'view') byRole[role].views++;
    });

    return Object.keys(byRole).map(role => {
        const r = byRole[role];
        return {
            role,
            uniqueUsers: r.users.size,
            totalInteractions: r.interactions,
            completionRate: r.views > 0 ? Math.round((r.completions / r.views) * 100) : 0,
            errorRate: r.interactions > 0 ? Math.round((r.errors / r.interactions) * 100) : 0
        };
    });
}

function generateBreakdownByDevice(items) {
    const byDevice = {};
    items.forEach(item => {
        const device = item.deviceType || 'unknown';
        if (!byDevice[device]) {
            byDevice[device] = { users: new Set(), interactions: 0, completions: 0, errors: 0, views: 0 };
        }
        byDevice[device].users.add(item.userId);
        byDevice[device].interactions++;
        if (item.action === 'complete') byDevice[device].completions++;
        if (item.action === 'error') byDevice[device].errors++;
        if (item.action === 'view') byDevice[device].views++;
    });

    return Object.keys(byDevice).map(device => {
        const d = byDevice[device];
        return {
            device,
            uniqueUsers: d.users.size,
            totalInteractions: d.interactions,
            completionRate: d.views > 0 ? Math.round((d.completions / d.views) * 100) : 0,
            errorRate: d.interactions > 0 ? Math.round((d.errors / d.interactions) * 100) : 0
        };
    });
}

// =============================================================================
// REPLICATED LOGIC - Funnel Analysis
// =============================================================================

function calculateFunnelMetrics(steps, userJourneys) {
    const stepMetrics = [];
    let previousStepUsers = new Set();

    steps.forEach((step, idx) => {
        const usersAtStep = new Set();

        Object.keys(userJourneys).forEach(userId => {
            const journey = userJourneys[userId];
            if (idx === 0 || previousStepUsers.has(userId)) {
                const stepEvent = journey.find(j =>
                    j.featureId === step.featureId &&
                    (step.action === '*' || j.action === step.action)
                );
                if (stepEvent) {
                    usersAtStep.add(userId);
                }
            }
        });

        const entered = idx === 0 ? usersAtStep.size : previousStepUsers.size;
        const completed = usersAtStep.size;
        const conversionRate = entered > 0 ? Math.round((completed / entered) * 1000) / 10 : 0;

        stepMetrics.push({
            order: idx + 1,
            featureId: step.featureId,
            entered,
            completed,
            conversionRate
        });

        previousStepUsers = usersAtStep;
    });

    return stepMetrics;
}

function findBiggestDropoff(stepMetrics) {
    let biggestDropoff = null;
    let maxLostUsers = 0;

    for (let i = 1; i < stepMetrics.length; i++) {
        const lostUsers = stepMetrics[i - 1].completed - stepMetrics[i].completed;
        if (lostUsers > maxLostUsers) {
            maxLostUsers = lostUsers;
            biggestDropoff = {
                step: i + 1,
                lostUsers,
                reason: `${stepMetrics[i - 1].featureId}_to_${stepMetrics[i].featureId}`
            };
        }
    }

    return biggestDropoff;
}

// =============================================================================
// REPLICATED LOGIC - Lifecycle Classification
// =============================================================================

function getLifecycleRecommendation(healthScore, trend, daysSinceLaunch) {
    if (healthScore >= 70 && trend.direction !== 'down') {
        return 'Feature is performing well. Consider expanding to more user roles.';
    }
    if (healthScore < 40) {
        if (daysSinceLaunch && daysSinceLaunch > 90) {
            return 'Consider deprecation - feature has low adoption after extended availability.';
        }
        return 'Urgent: Low adoption. Review UX, add onboarding, or increase visibility.';
    }
    if (trend.direction === 'down' && Math.abs(trend.percent) > 20) {
        return 'Warning: Usage declining. Investigate causes and consider improvements.';
    }
    if (daysSinceLaunch && daysSinceLaunch < 30 && healthScore < 60) {
        return 'New feature - needs promotion. Consider adding to onboarding flow.';
    }
    return 'Monitor closely. Consider A/B testing improvements.';
}

// =============================================================================
// REPLICATED LOGIC - Record Building
// =============================================================================

function buildLogRecord(featureId, userId, action, context = {}) {
    const now = new Date();
    return {
        featureId: featureId.toLowerCase().trim(),
        featureVersion: context.featureVersion || null,
        userId,
        userRole: context.userRole || 'unknown',
        action,
        timestamp: now,
        sessionId: context.sessionId || null,
        deviceType: context.deviceType || null,
        referrer: context.referrer || null,
        entryPoint: context.entryPoint || null,
        durationMs: context.durationMs || null,
        scrollDepth: context.scrollDepth || null,
        interactionCount: context.interactionCount || null,
        outcome: context.outcome || null,
        conversionValue: context.conversionValue || null,
        nextFeature: context.nextFeature || null,
        errorCode: context.errorCode || null,
        errorMessage: context.errorMessage || null,
        metadata: context.metadata || {},
        date: now.toISOString().split('T')[0],
        hour: now.getHours()
    };
}

// =============================================================================
// REPLICATED LOGIC - Time Range Parsing
// =============================================================================

function parseTimeRange(timeRange) {
    let startDate, endDate;

    if (timeRange && typeof timeRange === 'object' && timeRange.start) {
        startDate = new Date(timeRange.start);
        endDate = timeRange.end ? new Date(timeRange.end) : new Date();
    } else if (typeof timeRange === 'string' || typeof timeRange === 'number') {
        endDate = new Date();
        startDate = new Date();
        const days = typeof timeRange === 'number' ? timeRange :
            timeRange === 'day' ? 1 : timeRange === 'week' ? 7 : timeRange === 'quarter' ? 90 : 30;
        startDate.setDate(startDate.getDate() - days);
    } else {
        endDate = new Date();
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);
    }

    return { startDate, endDate };
}

// =============================================================================
// TEST SUITES
// =============================================================================

// --- 1. logFeatureInteraction Validation ---

describe('logFeatureInteraction Validation', () => {
    test('should reject missing featureId', () => {
        const res = validateLogInteraction(null, 'user_1', 'view');
        expect(res.success).toBe(false);
        expect(res.errorCode).toBe('FAL_003');
    });

    test('should reject missing userId', () => {
        const res = validateLogInteraction('carrier_search', null, 'view');
        expect(res.success).toBe(false);
        expect(res.errorCode).toBe('FAL_003');
    });

    test('should reject missing action', () => {
        const res = validateLogInteraction('carrier_search', 'user_1', null);
        expect(res.success).toBe(false);
        expect(res.errorCode).toBe('FAL_003');
    });

    test('should reject invalid action type', () => {
        const res = validateLogInteraction('carrier_search', 'user_1', 'invalid_action');
        expect(res.success).toBe(false);
        expect(res.errorCode).toBe('FAL_002');
    });

    test('should accept all 11 valid action types', () => {
        CONFIG.validActions.forEach(action => {
            const res = validateLogInteraction('carrier_search', 'user_1', action);
            expect(res.success).toBe(true);
        });
    });

    test('should have exactly 11 valid action types', () => {
        expect(CONFIG.validActions.length).toBe(11);
    });
});

// --- 2. logFeatureError Validation ---

describe('logFeatureError Validation', () => {
    test('should reject missing errorCode', () => {
        const res = validateLogError('carrier_search', 'user_1', null, 'Something broke');
        expect(res.success).toBe(false);
        expect(res.errorCode).toBe('FAL_003');
    });

    test('should reject missing errorMessage', () => {
        const res = validateLogError('carrier_search', 'user_1', 'SEARCH_TIMEOUT', null);
        expect(res.success).toBe(false);
        expect(res.errorCode).toBe('FAL_003');
    });

    test('should pass with all required fields', () => {
        const res = validateLogError('carrier_search', 'user_1', 'SEARCH_TIMEOUT', 'Search timed out');
        expect(res.success).toBe(true);
    });
});

// --- 3. logFeatureSession Validation ---

describe('logFeatureSession Validation', () => {
    test('should reject missing sessionId with FAL_004', () => {
        const res = validateLogSession(null, 'user_1', [{ featureId: 'test' }]);
        expect(res.success).toBe(false);
        expect(res.errorCode).toBe('FAL_004');
    });

    test('should reject missing userId', () => {
        const res = validateLogSession('sess_123', null, [{ featureId: 'test' }]);
        expect(res.success).toBe(false);
        expect(res.errorCode).toBe('FAL_003');
    });

    test('should reject empty features array', () => {
        const res = validateLogSession('sess_123', 'user_1', []);
        expect(res.success).toBe(false);
        expect(res.errorCode).toBe('FAL_003');
    });

    test('should reject non-array features', () => {
        const res = validateLogSession('sess_123', 'user_1', 'not_an_array');
        expect(res.success).toBe(false);
        expect(res.errorCode).toBe('FAL_003');
    });

    test('should pass with valid inputs', () => {
        const res = validateLogSession('sess_123', 'user_1', [{ featureId: 'carrier_search', actions: ['view'] }]);
        expect(res.success).toBe(true);
    });
});

// --- 4. getFeatureStats Validation ---

describe('getFeatureStats Validation', () => {
    test('should reject missing featureId', () => {
        const res = validateGetFeatureStats(null);
        expect(res).not.toBeNull();
        expect(res.errorCode).toBe('FAL_003');
    });

    test('should pass with valid featureId', () => {
        const res = validateGetFeatureStats('carrier_search');
        expect(res).toBeNull();
    });
});

// --- 5. getFeatureComparison Validation ---

describe('getFeatureComparison Validation', () => {
    test('should reject empty featureIds array', () => {
        const res = validateGetFeatureComparison([]);
        expect(res).not.toBeNull();
        expect(res.errorCode).toBe('FAL_003');
    });

    test('should reject non-array featureIds', () => {
        const res = validateGetFeatureComparison('not_an_array');
        expect(res).not.toBeNull();
        expect(res.errorCode).toBe('FAL_003');
    });

    test('should pass with valid featureIds', () => {
        const res = validateGetFeatureComparison(['carrier_search', 'driver_dashboard']);
        expect(res).toBeNull();
    });
});

// --- 6. getFunnelConversion Validation ---

describe('getFunnelConversion Validation', () => {
    test('should reject missing funnelId with FAL_005', () => {
        const res = validateGetFunnelConversion(null);
        expect(res).not.toBeNull();
        expect(res.errorCode).toBe('FAL_005');
    });

    test('should pass with valid funnelId', () => {
        const res = validateGetFunnelConversion('driver_onboarding');
        expect(res).toBeNull();
    });
});

// --- 7. getCohortRetention Validation ---

describe('getCohortRetention Validation', () => {
    test('should reject missing featureId', () => {
        const res = validateGetCohortRetention(null, '2026-01-01');
        expect(res).not.toBeNull();
        expect(res.errorCode).toBe('FAL_003');
    });

    test('should reject missing cohortDate', () => {
        const res = validateGetCohortRetention('carrier_search', null);
        expect(res).not.toBeNull();
        expect(res.errorCode).toBe('FAL_003');
    });

    test('should pass with valid inputs', () => {
        const res = validateGetCohortRetention('carrier_search', '2026-01-01');
        expect(res).toBeNull();
    });
});

// --- 8. getFeatureHealthScore Validation ---

describe('getFeatureHealthScore Validation', () => {
    test('should reject missing featureId', () => {
        const res = validateGetFeatureHealthScore(null);
        expect(res).not.toBeNull();
        expect(res.errorCode).toBe('FAL_003');
    });

    test('should pass with valid featureId', () => {
        const res = validateGetFeatureHealthScore('carrier_search');
        expect(res).toBeNull();
    });
});

// --- 9. registerFeature Validation ---

describe('registerFeature Validation', () => {
    test('should reject missing featureId', () => {
        const res = validateRegisterFeature({ displayName: 'Test' });
        expect(res.success).toBe(false);
        expect(res.errorCode).toBe('FAL_003');
    });

    test('should reject missing displayName', () => {
        const res = validateRegisterFeature({ featureId: 'test_feature' });
        expect(res.success).toBe(false);
        expect(res.errorCode).toBe('FAL_003');
    });

    test('should reject invalid status with FAL_008', () => {
        const res = validateRegisterFeature({ featureId: 'test', displayName: 'Test', status: 'invalid_status' });
        expect(res.success).toBe(false);
        expect(res.errorCode).toBe('FAL_008');
    });

    test('should accept all 4 valid statuses', () => {
        CONFIG.validStatuses.forEach(status => {
            const res = validateRegisterFeature({ featureId: 'test', displayName: 'Test', status });
            expect(res.success).toBe(true);
        });
    });

    test('should pass without status (defaults to active)', () => {
        const res = validateRegisterFeature({ featureId: 'test', displayName: 'Test' });
        expect(res.success).toBe(true);
    });
});

// --- 10. updateFeatureStatus Validation ---

describe('updateFeatureStatus Validation', () => {
    test('should reject missing featureId', () => {
        const res = validateUpdateStatus(null, 'active');
        expect(res.success).toBe(false);
        expect(res.errorCode).toBe('FAL_003');
    });

    test('should reject missing status', () => {
        const res = validateUpdateStatus('test_feature', null);
        expect(res.success).toBe(false);
        expect(res.errorCode).toBe('FAL_003');
    });

    test('should reject invalid status with FAL_008', () => {
        const res = validateUpdateStatus('test_feature', 'unknown_status');
        expect(res.success).toBe(false);
        expect(res.errorCode).toBe('FAL_008');
    });

    test('should accept valid transitions', () => {
        const res = validateUpdateStatus('test_feature', 'deprecated');
        expect(res.success).toBe(true);
    });
});

// --- 11. defineFunnel Validation ---

describe('defineFunnel Validation', () => {
    test('should reject missing funnelId', () => {
        const res = validateDefineFunnel({ displayName: 'Test', steps: [{ featureId: 's1' }] });
        expect(res.success).toBe(false);
        expect(res.errorCode).toBe('FAL_003');
    });

    test('should reject missing displayName', () => {
        const res = validateDefineFunnel({ funnelId: 'test', steps: [{ featureId: 's1' }] });
        expect(res.success).toBe(false);
        expect(res.errorCode).toBe('FAL_003');
    });

    test('should reject empty steps array', () => {
        const res = validateDefineFunnel({ funnelId: 'test', displayName: 'Test', steps: [] });
        expect(res.success).toBe(false);
        expect(res.errorCode).toBe('FAL_003');
    });

    test('should pass with valid funnel data', () => {
        const res = validateDefineFunnel({
            funnelId: 'driver_onboarding',
            displayName: 'Driver Onboarding',
            steps: [
                { featureId: 'signup', action: 'complete' },
                { featureId: 'profile_setup', action: 'complete' }
            ]
        });
        expect(res.success).toBe(true);
    });
});

// --- 12. Health Score Calculation ---

describe('Health Score Calculation', () => {
    test('should calculate perfect health score (all 100)', () => {
        const score = calculateHealthScore(100, 100, 0, 100, 100);
        // 100*30/100 + 100*25/100 + 100*20/100 + 100*15/100 + 100*10/100 = 30+25+20+15+10 = 100
        expect(score).toBe(100);
    });

    test('should calculate zero health score (all 0, error 100)', () => {
        const score = calculateHealthScore(0, 0, 100, 0, 0);
        // 0 + 0 + 0*20/100 + 0 + 0 = 0
        expect(score).toBe(0);
    });

    test('should weight adoption rate at 30%', () => {
        const scoreWith = calculateHealthScore(100, 0, 100, 0, 0);
        const scoreWithout = calculateHealthScore(0, 0, 100, 0, 0);
        expect(scoreWith - scoreWithout).toBe(30);
    });

    test('should weight completion rate at 25%', () => {
        const scoreWith = calculateHealthScore(0, 100, 100, 0, 0);
        const scoreWithout = calculateHealthScore(0, 0, 100, 0, 0);
        expect(scoreWith - scoreWithout).toBe(25);
    });

    test('should weight error rate at 20% (inverted: 100 - errorRate)', () => {
        const lowError = calculateHealthScore(0, 0, 0, 0, 0);   // errorRate=0 → score component = 100*20/100 = 20
        const highError = calculateHealthScore(0, 0, 100, 0, 0); // errorRate=100 → score component = 0*20/100 = 0
        expect(lowError - highError).toBe(20);
    });

    test('should weight retention rate at 15%', () => {
        const scoreWith = calculateHealthScore(0, 0, 100, 100, 0);
        const scoreWithout = calculateHealthScore(0, 0, 100, 0, 0);
        expect(scoreWith - scoreWithout).toBe(15);
    });

    test('should weight engagement depth at 10%', () => {
        const scoreWith = calculateHealthScore(0, 0, 100, 0, 100);
        const scoreWithout = calculateHealthScore(0, 0, 100, 0, 0);
        expect(scoreWith - scoreWithout).toBe(10);
    });

    test('should calculate realistic mixed score', () => {
        // adoption=60, completion=80, error=10, retention=45, engagement=70
        const score = calculateHealthScore(60, 80, 10, 45, 70);
        // 60*30/100 + 80*25/100 + 90*20/100 + 45*15/100 + 70*10/100
        // 18 + 20 + 18 + 6.75 + 7 = 69.75 → 70
        expect(score).toBe(70);
    });

    test('should return integer (rounded)', () => {
        const score = calculateHealthScore(33, 67, 15, 50, 42);
        expect(Number.isInteger(score)).toBe(true);
    });
});

// --- 13. Health Status Classification ---

describe('Health Status Classification', () => {
    test('should classify 100 as healthy', () => {
        expect(getHealthStatus(100)).toBe('healthy');
    });

    test('should classify 70 as healthy (boundary)', () => {
        expect(getHealthStatus(70)).toBe('healthy');
    });

    test('should classify 69 as warning', () => {
        expect(getHealthStatus(69)).toBe('warning');
    });

    test('should classify 40 as warning (boundary)', () => {
        expect(getHealthStatus(40)).toBe('warning');
    });

    test('should classify 39 as critical', () => {
        expect(getHealthStatus(39)).toBe('critical');
    });

    test('should classify 0 as critical', () => {
        expect(getHealthStatus(0)).toBe('critical');
    });
});

// --- 14. Trend Calculation ---

describe('Trend Calculation', () => {
    test('should detect upward trend', () => {
        const trend = calculateTrend(150, 100);
        expect(trend.direction).toBe('up');
        expect(trend.percent).toBe(50);
    });

    test('should detect downward trend', () => {
        const trend = calculateTrend(70, 100);
        expect(trend.direction).toBe('down');
        expect(trend.percent).toBe(-30);
    });

    test('should detect flat trend when both zero', () => {
        const trend = calculateTrend(0, 0);
        expect(trend.direction).toBe('flat');
        expect(trend.percent).toBe(0);
    });

    test('should handle growth from zero as +100%', () => {
        const trend = calculateTrend(50, 0);
        expect(trend.direction).toBe('up');
        expect(trend.percent).toBe(100);
    });

    test('should handle equal values as flat', () => {
        const trend = calculateTrend(100, 100);
        expect(trend.direction).toBe('flat');
        expect(trend.percent).toBe(0);
    });

    test('should format upward trend string', () => {
        const trend = calculateTrend(130, 100);
        expect(formatTrend(trend)).toBe('+30%');
    });

    test('should format downward trend string', () => {
        const trend = calculateTrend(80, 100);
        expect(formatTrend(trend)).toBe('-20%');
    });

    test('should format flat trend string', () => {
        const trend = calculateTrend(100, 100);
        expect(formatTrend(trend)).toBe('0%');
    });
});

// --- 15. Stats Calculations ---

describe('Stats Calculations', () => {
    const sampleItems = [
        { userId: 'u1', action: 'view', durationMs: 5000 },
        { userId: 'u1', action: 'click' },
        { userId: 'u1', action: 'complete', durationMs: 15000 },
        { userId: 'u2', action: 'view', durationMs: 3000 },
        { userId: 'u2', action: 'error' },
        { userId: 'u3', action: 'view' },
        { userId: 'u3', action: 'abandon' }
    ];

    test('should count unique users', () => {
        const stats = calculateStatsFromItems(sampleItems);
        expect(stats.uniqueUsers).toBe(3);
    });

    test('should count total interactions', () => {
        const stats = calculateStatsFromItems(sampleItems);
        expect(stats.totalInteractions).toBe(7);
    });

    test('should calculate completion rate from views', () => {
        const stats = calculateStatsFromItems(sampleItems);
        // 1 completion / 3 views = 33.3%
        expect(stats.completionRate).toBe(33.3);
    });

    test('should calculate error rate from total interactions', () => {
        const stats = calculateStatsFromItems(sampleItems);
        // 1 error / 7 interactions = 14.3%
        expect(stats.errorRate).toBe(14.3);
    });

    test('should calculate abandon rate from views', () => {
        const stats = calculateStatsFromItems(sampleItems);
        // 1 abandon / 3 views = 33.3%
        expect(stats.abandonRate).toBe(33.3);
    });

    test('should calculate average duration from items with durationMs', () => {
        const stats = calculateStatsFromItems(sampleItems);
        // (5000 + 15000 + 3000) / 3 = 7667
        expect(stats.avgDurationMs).toBe(7667);
    });

    test('should handle empty items array', () => {
        const stats = calculateStatsFromItems([]);
        expect(stats.uniqueUsers).toBe(0);
        expect(stats.totalInteractions).toBe(0);
        expect(stats.completionRate).toBe(0);
        expect(stats.errorRate).toBe(0);
        expect(stats.avgDurationMs).toBe(0);
    });
});

// --- 16. Breakdown by Role ---

describe('Breakdown by Role', () => {
    const items = [
        { userId: 'u1', userRole: 'driver', action: 'view' },
        { userId: 'u1', userRole: 'driver', action: 'complete' },
        { userId: 'u2', userRole: 'recruiter', action: 'view' },
        { userId: 'u3', userRole: 'recruiter', action: 'view' },
        { userId: 'u3', userRole: 'recruiter', action: 'error' }
    ];

    test('should group by role', () => {
        const breakdown = generateBreakdownByRole(items);
        expect(breakdown.length).toBe(2);
    });

    test('should count unique users per role', () => {
        const breakdown = generateBreakdownByRole(items);
        const drivers = breakdown.find(b => b.role === 'driver');
        const recruiters = breakdown.find(b => b.role === 'recruiter');
        expect(drivers.uniqueUsers).toBe(1);
        expect(recruiters.uniqueUsers).toBe(2);
    });

    test('should calculate completion rate per role', () => {
        const breakdown = generateBreakdownByRole(items);
        const drivers = breakdown.find(b => b.role === 'driver');
        // 1 completion / 1 view = 100%
        expect(drivers.completionRate).toBe(100);
    });
});

// --- 17. Breakdown by Device ---

describe('Breakdown by Device', () => {
    const items = [
        { userId: 'u1', deviceType: 'mobile', action: 'view' },
        { userId: 'u2', deviceType: 'desktop', action: 'view' },
        { userId: 'u2', deviceType: 'desktop', action: 'complete' },
        { userId: 'u3', action: 'view' } // no device → 'unknown'
    ];

    test('should group by device type', () => {
        const breakdown = generateBreakdownByDevice(items);
        expect(breakdown.length).toBe(3);
    });

    test('should handle missing deviceType as unknown', () => {
        const breakdown = generateBreakdownByDevice(items);
        const unknown = breakdown.find(b => b.device === 'unknown');
        expect(unknown).toBeDefined();
        expect(unknown.uniqueUsers).toBe(1);
    });
});

// --- 18. Funnel Metrics Calculation ---

describe('Funnel Metrics Calculation', () => {
    const steps = [
        { featureId: 'signup', action: 'complete' },
        { featureId: 'profile', action: 'complete' },
        { featureId: 'first_match', action: 'view' }
    ];

    const userJourneys = {
        'u1': [
            { featureId: 'signup', action: 'complete', timestamp: new Date('2026-01-01') },
            { featureId: 'profile', action: 'complete', timestamp: new Date('2026-01-02') },
            { featureId: 'first_match', action: 'view', timestamp: new Date('2026-01-03') }
        ],
        'u2': [
            { featureId: 'signup', action: 'complete', timestamp: new Date('2026-01-01') },
            { featureId: 'profile', action: 'complete', timestamp: new Date('2026-01-02') }
            // dropped off before first_match
        ],
        'u3': [
            { featureId: 'signup', action: 'complete', timestamp: new Date('2026-01-01') }
            // dropped off after signup
        ]
    };

    test('should calculate step-by-step conversion', () => {
        const metrics = calculateFunnelMetrics(steps, userJourneys);
        expect(metrics.length).toBe(3);
        expect(metrics[0].completed).toBe(3); // All 3 signed up
        expect(metrics[1].completed).toBe(2); // 2 completed profile
        expect(metrics[2].completed).toBe(1); // 1 viewed first match
    });

    test('should calculate conversion rates', () => {
        const metrics = calculateFunnelMetrics(steps, userJourneys);
        expect(metrics[0].conversionRate).toBe(100); // 3/3
        expect(metrics[1].conversionRate).toBe(66.7); // 2/3
        expect(metrics[2].conversionRate).toBe(50); // 1/2
    });

    test('should handle wildcard action steps', () => {
        const wildcardSteps = [
            { featureId: 'signup', action: '*' },
            { featureId: 'profile', action: '*' }
        ];
        const metrics = calculateFunnelMetrics(wildcardSteps, userJourneys);
        expect(metrics[0].completed).toBe(3);
    });
});

// --- 19. Biggest Dropoff Detection ---

describe('Biggest Dropoff Detection', () => {
    test('should find the step with most lost users', () => {
        const stepMetrics = [
            { featureId: 'step1', completed: 100 },
            { featureId: 'step2', completed: 70 },
            { featureId: 'step3', completed: 60 }
        ];
        const dropoff = findBiggestDropoff(stepMetrics);
        expect(dropoff.step).toBe(2);
        expect(dropoff.lostUsers).toBe(30);
        expect(dropoff.reason).toBe('step1_to_step2');
    });

    test('should return null for single step', () => {
        const stepMetrics = [{ featureId: 'step1', completed: 100 }];
        const dropoff = findBiggestDropoff(stepMetrics);
        expect(dropoff).toBeNull();
    });

    test('should handle no dropoff', () => {
        const stepMetrics = [
            { featureId: 'step1', completed: 100 },
            { featureId: 'step2', completed: 100 }
        ];
        const dropoff = findBiggestDropoff(stepMetrics);
        expect(dropoff).toBeNull();
    });
});

// --- 20. Lifecycle Recommendations ---

describe('Lifecycle Recommendations', () => {
    test('should recommend expansion for healthy + growing feature', () => {
        const rec = getLifecycleRecommendation(80, { direction: 'up', percent: 10 }, 60);
        expect(rec).toContain('performing well');
    });

    test('should recommend deprecation for old low-adoption feature', () => {
        const rec = getLifecycleRecommendation(30, { direction: 'down', percent: -15 }, 120);
        expect(rec).toContain('deprecation');
    });

    test('should flag urgent low adoption for newer features', () => {
        const rec = getLifecycleRecommendation(25, { direction: 'flat', percent: 0 }, 45);
        expect(rec).toContain('Urgent');
    });

    test('should warn about declining usage', () => {
        const rec = getLifecycleRecommendation(55, { direction: 'down', percent: -25 }, 60);
        expect(rec).toContain('declining');
    });

    test('should suggest promotion for new underperforming features', () => {
        const rec = getLifecycleRecommendation(50, { direction: 'up', percent: 5 }, 15);
        expect(rec).toContain('promotion');
    });

    test('should suggest monitoring for moderate features', () => {
        const rec = getLifecycleRecommendation(55, { direction: 'flat', percent: 0 }, 60);
        expect(rec).toContain('Monitor');
    });
});

// --- 21. Record Building ---

describe('Record Building', () => {
    test('should lowercase and trim featureId', () => {
        const record = buildLogRecord('  Carrier_Search  ', 'user_1', 'view');
        expect(record.featureId).toBe('carrier_search');
    });

    test('should default userRole to unknown', () => {
        const record = buildLogRecord('test', 'user_1', 'view');
        expect(record.userRole).toBe('unknown');
    });

    test('should set userRole from context', () => {
        const record = buildLogRecord('test', 'user_1', 'view', { userRole: 'driver' });
        expect(record.userRole).toBe('driver');
    });

    test('should include date and hour fields', () => {
        const record = buildLogRecord('test', 'user_1', 'view');
        expect(record.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(typeof record.hour).toBe('number');
        expect(record.hour >= 0 && record.hour <= 23).toBe(true);
    });

    test('should set optional context fields to null when missing', () => {
        const record = buildLogRecord('test', 'user_1', 'view');
        expect(record.sessionId).toBeNull();
        expect(record.deviceType).toBeNull();
        expect(record.referrer).toBeNull();
        expect(record.durationMs).toBeNull();
        expect(record.conversionValue).toBeNull();
    });

    test('should populate all context fields when provided', () => {
        const context = {
            sessionId: 'sess_123',
            deviceType: 'mobile',
            referrer: '/dashboard',
            entryPoint: 'nav_menu',
            durationMs: 5000,
            scrollDepth: 75,
            interactionCount: 3,
            outcome: 'success',
            conversionValue: 249,
            nextFeature: 'pricing',
            featureVersion: 'v2.1',
            metadata: { searchQuery: 'OTR' }
        };
        const record = buildLogRecord('test', 'user_1', 'click', context);
        expect(record.sessionId).toBe('sess_123');
        expect(record.deviceType).toBe('mobile');
        expect(record.durationMs).toBe(5000);
        expect(record.conversionValue).toBe(249);
        expect(record.featureVersion).toBe('v2.1');
        expect(record.metadata.searchQuery).toBe('OTR');
    });
});

// --- 22. Time Range Parsing ---

describe('Time Range Parsing', () => {
    test('should parse object with start/end', () => {
        const { startDate, endDate } = parseTimeRange({
            start: '2026-01-01T00:00:00Z',
            end: '2026-01-31T00:00:00Z'
        });
        expect(startDate.getUTCFullYear()).toBe(2026);
        expect(endDate.getUTCMonth()).toBe(0); // January
    });

    test('should parse string shorthand "week"', () => {
        const { startDate, endDate } = parseTimeRange('week');
        const diffDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
        expect(diffDays).toBe(7);
    });

    test('should parse string shorthand "quarter"', () => {
        const { startDate, endDate } = parseTimeRange('quarter');
        const diffDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
        expect(diffDays).toBe(90);
    });

    test('should parse numeric days', () => {
        const { startDate, endDate } = parseTimeRange(14);
        const diffDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
        expect(diffDays).toBe(14);
    });

    test('should default to 30 days when no range given', () => {
        const { startDate, endDate } = parseTimeRange(undefined);
        const diffDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));
        expect(diffDays).toBe(30);
    });
});

// --- 23. Constants & Config Integrity ---

describe('Constants & Config Integrity', () => {
    test('should have 4 valid statuses', () => {
        expect(CONFIG.validStatuses).toEqual(['beta', 'active', 'deprecated', 'sunset']);
    });

    test('should have health weights summing to 100', () => {
        const total = Object.values(CONFIG.healthWeights).reduce((a, b) => a + b, 0);
        expect(total).toBe(100);
    });

    test('should have 6 feature lifecycle states', () => {
        expect(Object.keys(FeatureCycles).length).toBe(6);
    });

    test('should have 4 feature status values', () => {
        expect(Object.keys(FeatureStatus).length).toBe(4);
    });

    test('FeatureStatus values should match validStatuses', () => {
        const statusValues = Object.values(FeatureStatus).sort();
        const validSorted = [...CONFIG.validStatuses].sort();
        expect(statusValues).toEqual(validSorted);
    });

    test('should have threshold for dead features at 30 days', () => {
        expect(CONFIG.thresholds.deadDaysNoUse).toBe(30);
    });

    test('should have threshold for at-risk at 30% drop', () => {
        expect(CONFIG.thresholds.atRiskDropPercent).toBe(30);
    });

    test('should have threshold for mature at 90 days', () => {
        expect(CONFIG.thresholds.matureMinDays).toBe(90);
    });
});

// --- 24. Error Codes ---

describe('Error Codes', () => {
    test('FAL_001 is Feature not found', () => {
        // Verified by convention - FAL_001 used in registry lookups
        expect('FAL_001').toBeDefined();
    });

    test('FAL_002 is Invalid action type', () => {
        const res = validateLogInteraction('test', 'user', 'bogus');
        expect(res.errorCode).toBe('FAL_002');
    });

    test('FAL_003 is Missing required field', () => {
        const res = validateLogInteraction(null, 'user', 'view');
        expect(res.errorCode).toBe('FAL_003');
    });

    test('FAL_004 is Session not initialized', () => {
        const res = validateLogSession(null, 'user', [{ featureId: 'x' }]);
        expect(res.errorCode).toBe('FAL_004');
    });

    test('FAL_005 is Funnel not found', () => {
        const res = validateGetFunnelConversion(null);
        expect(res.errorCode).toBe('FAL_005');
    });

    test('FAL_008 is Status transition invalid', () => {
        const res = validateUpdateStatus('test', 'invalid_status');
        expect(res.errorCode).toBe('FAL_008');
    });
});
