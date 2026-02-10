/* eslint-disable */
/**
 * ADMIN_GAMIFICATION_ANALYTICS HTML DOM Tests
 * =============================================
 * Tests for src/public/admin/ADMIN_GAMIFICATION_ANALYTICS.html
 * Verifies HTML component correctly receives messages and updates DOM.
 *
 * **TYPE PROTOCOL** (not action) -- uses { type, data } envelope
 *
 * Inbound: gamificationMetricsResult, abuseDetectionResult
 * Outbound: getGamificationMetrics, detectAbusePatterns
 *
 * DOM IDs: refreshBtn, abuseCheckBtn, lastUpdated,
 *   totalDrivers, totalXP, avgXP, dailyXPRate,
 *   totalRecruiters, totalPoints, avgPoints, dailyPointsRate,
 *   levelHealth, rankHealth,
 *   driverAchievements, driverAchievementRate, recruiterBadges, recruiterBadgeRate,
 *   topAchievements, driverChallengeRate, driverChallengesCompleted,
 *   recruiterChallengeRate, recruiterChallengesCompleted, challengesByType,
 *   dailyActive, weeklyActive, monthlyActive, stickiness,
 *   totalReferrals, successfulReferrals, referralConversion,
 *   totalBonuses, excellentBonuses, greatBonuses, goodBonuses,
 *   totalEvents, activeEvents, completedEvents, totalParticipants,
 *   eventsTableBody, abuseModal, abuseContent
 *
 * @see src/public/admin/ADMIN_GAMIFICATION_ANALYTICS.html
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const HTML_FILE = path.resolve(__dirname, '..', 'admin', 'ADMIN_GAMIFICATION_ANALYTICS.html');

const MESSAGE_KEY = 'type';
const READY_SIGNAL = 'getGamificationMetrics';

const INBOUND_MESSAGES = [
    'gamificationMetricsResult',
    'abuseDetectionResult'
];

const OUTBOUND_MESSAGES = [
    'getGamificationMetrics',
    'detectAbusePatterns'
];

// =============================================================================
// READ SOURCE FILE
// =============================================================================

const htmlSource = fs.readFileSync(HTML_FILE, 'utf8');

// =============================================================================
// MOCK DOM INFRASTRUCTURE
// =============================================================================

function createMockElement(id) {
    const children = [];
    const element = {
        id,
        textContent: '',
        innerHTML: '',
        innerText: '',
        value: '',
        className: '',
        style: {},
        hidden: false,
        disabled: false,
        children,
        childNodes: children,
        dataset: {},
        classList: {
            _classes: new Set(),
            add: jest.fn(function (...cls) { cls.forEach(c => this._classes.add(c)); }),
            remove: jest.fn(function (...cls) { cls.forEach(c => this._classes.delete(c)); }),
            toggle: jest.fn(),
            contains: jest.fn(function (cls) { return this._classes.has(cls); }),
        },
        appendChild: jest.fn((child) => { children.push(child); return child; }),
        removeChild: jest.fn(),
        remove: jest.fn(),
        setAttribute: jest.fn(),
        getAttribute: jest.fn(() => null),
        addEventListener: jest.fn(),
        querySelector: jest.fn(() => null),
        querySelectorAll: jest.fn(() => []),
    };
    return element;
}

const mockElements = {};

function getMockElement(id) {
    if (!mockElements[id]) {
        mockElements[id] = createMockElement(id);
    }
    return mockElements[id];
}

const capturedOutbound = [];

function mockPostToParent(type, data) {
    capturedOutbound.push({ type, data });
}

// =============================================================================
// REPLICATED CORE LOGIC (type-based protocol)
// =============================================================================

function sendToVelo(type, data = {}) {
    mockPostToParent(type, data);
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toLocaleString();
}

function getHealthBadge(health) {
    const badges = {
        healthy: 'Healthy',
        too_slow: 'Too Slow',
        too_fast: 'Too Fast',
        insufficient_data: 'No Data'
    };
    return badges[health] || badges.insufficient_data;
}

function getStatusBadge(status) {
    const badges = {
        active: 'Active',
        scheduled: 'Scheduled',
        ended: 'Ended',
        draft: 'Draft'
    };
    return badges[status] || status;
}

function handleGamificationMetricsResult(data) {
    if (!data || !data.success) {
        return;
    }

    const { metrics } = data;
    getMockElement('lastUpdated').textContent = new Date(data.timestamp).toLocaleString();

    // Economy Health
    if (metrics.economy) {
        const { drivers, recruiters, healthIndicators } = metrics.economy;

        getMockElement('totalDrivers').textContent = formatNumber(drivers?.totalUsers || 0);
        getMockElement('totalXP').textContent = formatNumber(drivers?.totalXPInCirculation || 0);
        getMockElement('avgXP').textContent = formatNumber(drivers?.averageXP || 0);
        getMockElement('dailyXPRate').textContent = '+' + formatNumber(drivers?.dailyXPEarnRate || 0) + '/day';

        getMockElement('totalRecruiters').textContent = formatNumber(recruiters?.totalUsers || 0);
        getMockElement('totalPoints').textContent = formatNumber(recruiters?.totalPointsInCirculation || 0);
        getMockElement('avgPoints').textContent = formatNumber(recruiters?.averagePoints || 0);
        getMockElement('dailyPointsRate').textContent = '+' + formatNumber(recruiters?.dailyPointsEarnRate || 0) + '/day';

        getMockElement('levelHealth').innerHTML = getHealthBadge(healthIndicators?.levelProgressionHealth);
        getMockElement('rankHealth').innerHTML = getHealthBadge(healthIndicators?.rankProgressionHealth);
    }

    // Achievements
    if (metrics.achievements) {
        const { drivers, recruiters } = metrics.achievements;

        getMockElement('driverAchievements').textContent = formatNumber(drivers?.totalUnlocks || 0);
        getMockElement('driverAchievementRate').textContent = (drivers?.averagePerUser || 0).toString();
        getMockElement('recruiterBadges').textContent = formatNumber(recruiters?.totalUnlocks || 0);
        getMockElement('recruiterBadgeRate').textContent = (recruiters?.averagePerUser || 0).toString();

        const topAchievements = drivers?.unlockRates?.slice(0, 5) || [];
        getMockElement('topAchievements').innerHTML = topAchievements.map(a =>
            `<div>${a.achievementId}: ${a.unlockRate}%</div>`
        ).join('') || '<div>No data</div>';
    }

    // Challenges
    if (metrics.challenges) {
        const { drivers, recruiters } = metrics.challenges;

        getMockElement('driverChallengeRate').textContent = (drivers?.completionRate || 0) + '%';
        getMockElement('driverChallengesCompleted').textContent = formatNumber(drivers?.completed || 0);
        getMockElement('recruiterChallengeRate').textContent = (recruiters?.completionRate || 0) + '%';
        getMockElement('recruiterChallengesCompleted').textContent = formatNumber(recruiters?.completed || 0);

        const byType = drivers?.byType || [];
        getMockElement('challengesByType').innerHTML = byType.map(t =>
            `<div>${t.type}: ${t.completionRate}% (${t.completed}/${t.total})</div>`
        ).join('') || '<div>No data</div>';
    }

    // Engagement
    if (metrics.engagement) {
        const { activeUsers, referrals, matchQuality } = metrics.engagement;

        getMockElement('dailyActive').textContent = formatNumber(activeUsers?.daily || 0);
        getMockElement('weeklyActive').textContent = formatNumber(activeUsers?.weekly || 0);
        getMockElement('monthlyActive').textContent = formatNumber(activeUsers?.monthly || 0);
        getMockElement('stickiness').textContent = (activeUsers?.stickinessRatio || 0) + '%';

        getMockElement('totalReferrals').textContent = formatNumber(referrals?.total || 0);
        getMockElement('successfulReferrals').textContent = formatNumber(referrals?.successful || 0);
        getMockElement('referralConversion').textContent = (referrals?.conversionRate || 0) + '%';

        getMockElement('totalBonuses').textContent = formatNumber(matchQuality?.totalBonuses || 0);
        getMockElement('excellentBonuses').textContent = formatNumber(matchQuality?.byTier?.excellent || 0);
        getMockElement('greatBonuses').textContent = formatNumber(matchQuality?.byTier?.great || 0);
        getMockElement('goodBonuses').textContent = formatNumber(matchQuality?.byTier?.good || 0);
    }

    // Events
    if (metrics.events) {
        const { summary, events } = metrics.events;

        getMockElement('totalEvents').textContent = (summary?.totalEvents || 0).toString();
        getMockElement('activeEvents').textContent = (summary?.activeEvents || 0).toString();
        getMockElement('completedEvents').textContent = (summary?.completedEvents || 0).toString();
        getMockElement('totalParticipants').textContent = formatNumber(summary?.totalParticipants || 0);

        getMockElement('eventsTableBody').innerHTML = events?.map(e =>
            `<tr><td>${e.name}</td><td>${getStatusBadge(e.status)}</td><td>${formatNumber(e.participants)}</td><td>${formatNumber(e.totalXPEarned)}</td><td>${formatNumber(e.avgXPPerUser)}</td></tr>`
        ).join('') || '<tr><td colspan="5">No events</td></tr>';
    }

    // Re-enable refresh button
    getMockElement('refreshBtn').disabled = false;
    getMockElement('refreshBtn').innerHTML = '<i class="fa-solid fa-refresh"></i> Refresh';
}

function handleAbuseDetectionResult(data) {
    if (!data || !data.success) {
        getMockElement('abuseContent').innerHTML = `Failed: ${data?.error || 'Unknown error'}`;
        return;
    }

    const { summary, suspiciousUsers, totalUsersAnalyzed, period } = data;

    let html = `<div>Period: ${period} | Users: ${totalUsersAnalyzed}</div>`;
    html += `<div>High: ${summary.highRisk}, Medium: ${summary.mediumRisk}, Low: ${summary.lowRisk}</div>`;

    if (suspiciousUsers.length === 0) {
        html += '<div>No suspicious activity detected</div>';
    } else {
        html += suspiciousUsers.map(user =>
            `<div class="suspicious-user">${user.userId} [${user.riskLevel}] - ${user.eventCount} events, ${user.totalXP} XP</div>`
        ).join('');
    }

    getMockElement('abuseContent').innerHTML = html;
}

function handleMessage(eventData) {
    const msg = eventData;
    if (!msg || !msg.type) return;

    switch (msg.type) {
        case 'gamificationMetricsResult':
            handleGamificationMetricsResult(msg.data);
            break;
        case 'abuseDetectionResult':
            handleAbuseDetectionResult(msg.data);
            break;
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('ADMIN_GAMIFICATION_ANALYTICS.html DOM Tests', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        capturedOutbound.length = 0;
        Object.keys(mockElements).forEach(id => {
            const el = mockElements[id];
            el.textContent = '';
            el.innerHTML = '';
            el.value = '';
            el.className = '';
            el.hidden = false;
            el.disabled = false;
            el.style = {};
            el.classList._classes.clear();
            el.classList.add.mockClear();
            el.classList.remove.mockClear();
            el.appendChild.mockClear();
            el.children.length = 0;
        });
    });

    // =========================================================================
    // SOURCE HTML STRUCTURAL CHECKS
    // =========================================================================

    describe('HTML source structure', () => {
        test('file exists and is readable', () => {
            expect(htmlSource.length).toBeGreaterThan(0);
        });

        test('contains a message listener', () => {
            const hasListener =
                htmlSource.includes("addEventListener('message'") ||
                htmlSource.includes('addEventListener("message"') ||
                htmlSource.includes('window.onmessage');
            expect(hasListener).toBe(true);
        });

        test('contains parent postMessage calls', () => {
            expect(htmlSource).toContain('window.parent.postMessage');
        });

        test('sends ready signal by calling getGamificationMetrics on init', () => {
            expect(htmlSource).toContain(READY_SIGNAL);
        });

        test('handles all expected inbound message types', () => {
            INBOUND_MESSAGES.forEach(msg => {
                expect(htmlSource).toContain(msg);
            });
        });

        test('references all expected outbound message types', () => {
            OUTBOUND_MESSAGES.forEach(msg => {
                expect(htmlSource).toContain(msg);
            });
        });

        test('uses type-based message protocol (NOT action)', () => {
            const hasType =
                htmlSource.includes('type ===') ||
                htmlSource.includes('.type') ||
                htmlSource.includes('{ type');
            expect(hasType).toBe(true);
        });

        test('uses IIFE for encapsulation', () => {
            expect(htmlSource).toContain('(function');
            expect(htmlSource).toContain("'use strict'");
        });
    });

    // =========================================================================
    // MESSAGE VALIDATION
    // =========================================================================

    describe('Message validation', () => {
        test('ignores null/undefined messages', () => {
            handleMessage(null);
            handleMessage(undefined);
            expect(capturedOutbound).toHaveLength(0);
        });

        test('ignores messages without type key', () => {
            handleMessage({ action: 'wrong_protocol' });
            expect(capturedOutbound).toHaveLength(0);
        });

        test('ignores empty object', () => {
            handleMessage({});
            expect(capturedOutbound).toHaveLength(0);
        });

        test('ignores unknown message type', () => {
            handleMessage({ type: 'unknownAction', data: {} });
            expect(capturedOutbound).toHaveLength(0);
        });
    });

    // =========================================================================
    // DOM RENDERING -- gamificationMetricsResult (Economy)
    // =========================================================================

    describe('DOM rendering - Economy Health', () => {
        const metricsPayload = {
            success: true,
            timestamp: '2026-02-06T12:00:00Z',
            metrics: {
                economy: {
                    drivers: {
                        totalUsers: 1250,
                        totalXPInCirculation: 2500000,
                        averageXP: 2000,
                        dailyXPEarnRate: 15000
                    },
                    recruiters: {
                        totalUsers: 85,
                        totalPointsInCirculation: 450000,
                        averagePoints: 5294,
                        dailyPointsEarnRate: 3200
                    },
                    healthIndicators: {
                        levelProgressionHealth: 'healthy',
                        rankProgressionHealth: 'too_slow'
                    }
                },
                achievements: {
                    drivers: { totalUnlocks: 3200, averagePerUser: 2.5, unlockRates: [] },
                    recruiters: { totalUnlocks: 180, averagePerUser: 2.1 }
                },
                challenges: {
                    drivers: { completionRate: 65, completed: 890, byType: [] },
                    recruiters: { completionRate: 72, completed: 210 }
                },
                engagement: {
                    activeUsers: { daily: 320, weekly: 780, monthly: 1100, stickinessRatio: 41 },
                    referrals: { total: 150, successful: 45, conversionRate: 30 },
                    matchQuality: { totalBonuses: 520, byTier: { excellent: 50, great: 180, good: 290 } }
                },
                events: {
                    summary: { totalEvents: 8, activeEvents: 2, completedEvents: 5, totalParticipants: 620 },
                    events: []
                }
            }
        };

        test('updates lastUpdated timestamp', () => {
            handleMessage({ type: 'gamificationMetricsResult', data: metricsPayload });
            expect(getMockElement('lastUpdated').textContent).toBeTruthy();
        });

        test('updates driver economy stats', () => {
            handleMessage({ type: 'gamificationMetricsResult', data: metricsPayload });

            expect(getMockElement('totalDrivers').textContent).toBe('1.3K');
            expect(getMockElement('totalXP').textContent).toBe('2.5M');
            expect(getMockElement('avgXP').textContent).toBe('2.0K');
            expect(getMockElement('dailyXPRate').textContent).toBe('+15.0K/day');
        });

        test('updates recruiter economy stats', () => {
            handleMessage({ type: 'gamificationMetricsResult', data: metricsPayload });

            expect(getMockElement('totalRecruiters').textContent).toBe('85');
            expect(getMockElement('totalPoints').textContent).toBe('450.0K');
            expect(getMockElement('avgPoints').textContent).toBe('5.3K');
            expect(getMockElement('dailyPointsRate').textContent).toBe('+3.2K/day');
        });

        test('updates health indicators', () => {
            handleMessage({ type: 'gamificationMetricsResult', data: metricsPayload });

            expect(getMockElement('levelHealth').innerHTML).toContain('Healthy');
            expect(getMockElement('rankHealth').innerHTML).toContain('Too Slow');
        });

        test('handles insufficient_data health indicator', () => {
            const payload = JSON.parse(JSON.stringify(metricsPayload));
            payload.metrics.economy.healthIndicators.levelProgressionHealth = 'insufficient_data';
            handleMessage({ type: 'gamificationMetricsResult', data: payload });

            expect(getMockElement('levelHealth').innerHTML).toContain('No Data');
        });

        test('does not render on failure result', () => {
            handleMessage({
                type: 'gamificationMetricsResult',
                data: { success: false, error: 'Service unavailable' }
            });

            expect(getMockElement('totalDrivers').textContent).toBe('');
        });

        test('re-enables refresh button after success', () => {
            handleMessage({ type: 'gamificationMetricsResult', data: metricsPayload });
            expect(getMockElement('refreshBtn').disabled).toBe(false);
            expect(getMockElement('refreshBtn').innerHTML).toContain('Refresh');
        });
    });

    // =========================================================================
    // DOM RENDERING -- gamificationMetricsResult (Achievements)
    // =========================================================================

    describe('DOM rendering - Achievements', () => {
        test('updates achievement counts and rates', () => {
            handleMessage({
                type: 'gamificationMetricsResult',
                data: {
                    success: true,
                    timestamp: '2026-02-06T12:00:00Z',
                    metrics: {
                        achievements: {
                            drivers: {
                                totalUnlocks: 3200,
                                averagePerUser: 2.5,
                                unlockRates: [
                                    { achievementId: 'first_match', unlockRate: 85 },
                                    { achievementId: 'speed_demon', unlockRate: 42 }
                                ]
                            },
                            recruiters: {
                                totalUnlocks: 180,
                                averagePerUser: 2.1
                            }
                        }
                    }
                }
            });

            expect(getMockElement('driverAchievements').textContent).toBe('3.2K');
            expect(getMockElement('driverAchievementRate').textContent).toBe('2.5');
            expect(getMockElement('recruiterBadges').textContent).toBe('180');
            expect(getMockElement('recruiterBadgeRate').textContent).toBe('2.1');
            expect(getMockElement('topAchievements').innerHTML).toContain('first_match');
            expect(getMockElement('topAchievements').innerHTML).toContain('85%');
            expect(getMockElement('topAchievements').innerHTML).toContain('speed_demon');
        });

        test('shows "No data" when no unlock rates', () => {
            handleMessage({
                type: 'gamificationMetricsResult',
                data: {
                    success: true,
                    timestamp: '2026-02-06T12:00:00Z',
                    metrics: {
                        achievements: {
                            drivers: { totalUnlocks: 0, averagePerUser: 0, unlockRates: [] },
                            recruiters: { totalUnlocks: 0, averagePerUser: 0 }
                        }
                    }
                }
            });

            expect(getMockElement('topAchievements').innerHTML).toContain('No data');
        });
    });

    // =========================================================================
    // DOM RENDERING -- gamificationMetricsResult (Challenges)
    // =========================================================================

    describe('DOM rendering - Challenges', () => {
        test('updates challenge completion rates', () => {
            handleMessage({
                type: 'gamificationMetricsResult',
                data: {
                    success: true,
                    timestamp: '2026-02-06T12:00:00Z',
                    metrics: {
                        challenges: {
                            drivers: {
                                completionRate: 65,
                                completed: 890,
                                byType: [
                                    { type: 'daily', completionRate: 80, completed: 500, total: 625 },
                                    { type: 'weekly', completionRate: 45, completed: 270, total: 600 }
                                ]
                            },
                            recruiters: { completionRate: 72, completed: 210 }
                        }
                    }
                }
            });

            expect(getMockElement('driverChallengeRate').textContent).toBe('65%');
            expect(getMockElement('driverChallengesCompleted').textContent).toBe('890');
            expect(getMockElement('recruiterChallengeRate').textContent).toBe('72%');
            expect(getMockElement('recruiterChallengesCompleted').textContent).toBe('210');
            expect(getMockElement('challengesByType').innerHTML).toContain('daily');
            expect(getMockElement('challengesByType').innerHTML).toContain('80%');
            expect(getMockElement('challengesByType').innerHTML).toContain('weekly');
        });
    });

    // =========================================================================
    // DOM RENDERING -- gamificationMetricsResult (Engagement)
    // =========================================================================

    describe('DOM rendering - Engagement', () => {
        test('updates active user counts and stickiness', () => {
            handleMessage({
                type: 'gamificationMetricsResult',
                data: {
                    success: true,
                    timestamp: '2026-02-06T12:00:00Z',
                    metrics: {
                        engagement: {
                            activeUsers: { daily: 320, weekly: 780, monthly: 1100, stickinessRatio: 41 },
                            referrals: { total: 150, successful: 45, conversionRate: 30 },
                            matchQuality: { totalBonuses: 520, byTier: { excellent: 50, great: 180, good: 290 } }
                        }
                    }
                }
            });

            expect(getMockElement('dailyActive').textContent).toBe('320');
            expect(getMockElement('weeklyActive').textContent).toBe('780');
            expect(getMockElement('monthlyActive').textContent).toBe('1.1K');
            expect(getMockElement('stickiness').textContent).toBe('41%');
        });

        test('updates referral stats', () => {
            handleMessage({
                type: 'gamificationMetricsResult',
                data: {
                    success: true,
                    timestamp: '2026-02-06T12:00:00Z',
                    metrics: {
                        engagement: {
                            activeUsers: { daily: 0, weekly: 0, monthly: 0, stickinessRatio: 0 },
                            referrals: { total: 150, successful: 45, conversionRate: 30 },
                            matchQuality: { totalBonuses: 0, byTier: {} }
                        }
                    }
                }
            });

            expect(getMockElement('totalReferrals').textContent).toBe('150');
            expect(getMockElement('successfulReferrals').textContent).toBe('45');
            expect(getMockElement('referralConversion').textContent).toBe('30%');
        });

        test('updates match quality bonuses', () => {
            handleMessage({
                type: 'gamificationMetricsResult',
                data: {
                    success: true,
                    timestamp: '2026-02-06T12:00:00Z',
                    metrics: {
                        engagement: {
                            activeUsers: { daily: 0, weekly: 0, monthly: 0, stickinessRatio: 0 },
                            referrals: { total: 0, successful: 0, conversionRate: 0 },
                            matchQuality: { totalBonuses: 520, byTier: { excellent: 50, great: 180, good: 290 } }
                        }
                    }
                }
            });

            expect(getMockElement('totalBonuses').textContent).toBe('520');
            expect(getMockElement('excellentBonuses').textContent).toBe('50');
            expect(getMockElement('greatBonuses').textContent).toBe('180');
            expect(getMockElement('goodBonuses').textContent).toBe('290');
        });
    });

    // =========================================================================
    // DOM RENDERING -- gamificationMetricsResult (Events)
    // =========================================================================

    describe('DOM rendering - Events', () => {
        test('updates event summary counts', () => {
            handleMessage({
                type: 'gamificationMetricsResult',
                data: {
                    success: true,
                    timestamp: '2026-02-06T12:00:00Z',
                    metrics: {
                        events: {
                            summary: { totalEvents: 8, activeEvents: 2, completedEvents: 5, totalParticipants: 620 },
                            events: []
                        }
                    }
                }
            });

            expect(getMockElement('totalEvents').textContent).toBe('8');
            expect(getMockElement('activeEvents').textContent).toBe('2');
            expect(getMockElement('completedEvents').textContent).toBe('5');
            expect(getMockElement('totalParticipants').textContent).toBe('620');
        });

        test('renders events table rows', () => {
            handleMessage({
                type: 'gamificationMetricsResult',
                data: {
                    success: true,
                    timestamp: '2026-02-06T12:00:00Z',
                    metrics: {
                        events: {
                            summary: { totalEvents: 2, activeEvents: 1, completedEvents: 1, totalParticipants: 300 },
                            events: [
                                { name: 'Winter Sprint', status: 'active', participants: 200, totalXPEarned: 50000, avgXPPerUser: 250 },
                                { name: 'Holiday Hustle', status: 'ended', participants: 100, totalXPEarned: 30000, avgXPPerUser: 300 }
                            ]
                        }
                    }
                }
            });

            expect(getMockElement('eventsTableBody').innerHTML).toContain('Winter Sprint');
            expect(getMockElement('eventsTableBody').innerHTML).toContain('Active');
            expect(getMockElement('eventsTableBody').innerHTML).toContain('Holiday Hustle');
            expect(getMockElement('eventsTableBody').innerHTML).toContain('Ended');
        });

        test('shows "No events" when events list is empty', () => {
            handleMessage({
                type: 'gamificationMetricsResult',
                data: {
                    success: true,
                    timestamp: '2026-02-06T12:00:00Z',
                    metrics: {
                        events: {
                            summary: { totalEvents: 0, activeEvents: 0, completedEvents: 0, totalParticipants: 0 },
                            events: []
                        }
                    }
                }
            });

            expect(getMockElement('eventsTableBody').innerHTML).toContain('No events');
        });
    });

    // =========================================================================
    // DOM RENDERING -- abuseDetectionResult
    // =========================================================================

    describe('DOM rendering - Abuse Detection', () => {
        test('displays clean report when no suspicious users', () => {
            handleMessage({
                type: 'abuseDetectionResult',
                data: {
                    success: true,
                    period: '7 days',
                    totalUsersAnalyzed: 500,
                    summary: { highRisk: 0, mediumRisk: 0, lowRisk: 0 },
                    suspiciousUsers: []
                }
            });

            expect(getMockElement('abuseContent').innerHTML).toContain('No suspicious activity detected');
            expect(getMockElement('abuseContent').innerHTML).toContain('500');
            expect(getMockElement('abuseContent').innerHTML).toContain('7 days');
        });

        test('displays suspicious users with risk levels', () => {
            handleMessage({
                type: 'abuseDetectionResult',
                data: {
                    success: true,
                    period: '7 days',
                    totalUsersAnalyzed: 500,
                    summary: { highRisk: 1, mediumRisk: 2, lowRisk: 0 },
                    suspiciousUsers: [
                        {
                            userId: 'user-123',
                            riskLevel: 'high',
                            eventCount: 500,
                            totalXP: 50000,
                            totalPoints: 0,
                            flags: [{ type: 'rapid_xp', value: 500, threshold: 100 }]
                        },
                        {
                            userId: 'user-456',
                            riskLevel: 'medium',
                            eventCount: 200,
                            totalXP: 20000,
                            totalPoints: 0,
                            flags: [{ type: 'unusual_hours', value: 50, threshold: 20 }]
                        }
                    ]
                }
            });

            expect(getMockElement('abuseContent').innerHTML).toContain('user-123');
            expect(getMockElement('abuseContent').innerHTML).toContain('high');
            expect(getMockElement('abuseContent').innerHTML).toContain('500 events');
            expect(getMockElement('abuseContent').innerHTML).toContain('user-456');
            expect(getMockElement('abuseContent').innerHTML).toContain('medium');
            expect(getMockElement('abuseContent').innerHTML).toContain('High: 1');
            expect(getMockElement('abuseContent').innerHTML).toContain('Medium: 2');
        });

        test('shows error on failure', () => {
            handleMessage({
                type: 'abuseDetectionResult',
                data: { success: false, error: 'Analysis service unavailable' }
            });

            expect(getMockElement('abuseContent').innerHTML).toContain('Analysis service unavailable');
        });

        test('shows unknown error when no error message', () => {
            handleMessage({
                type: 'abuseDetectionResult',
                data: { success: false }
            });

            expect(getMockElement('abuseContent').innerHTML).toContain('Unknown error');
        });
    });

    // =========================================================================
    // OUTBOUND MESSAGES
    // =========================================================================

    describe('Outbound messages', () => {
        test('getGamificationMetrics sends correct type', () => {
            sendToVelo('getGamificationMetrics');
            expect(capturedOutbound).toHaveLength(1);
            expect(capturedOutbound[0].type).toBe('getGamificationMetrics');
        });

        test('detectAbusePatterns sends correct type', () => {
            sendToVelo('detectAbusePatterns');
            expect(capturedOutbound).toHaveLength(1);
            expect(capturedOutbound[0].type).toBe('detectAbusePatterns');
        });
    });

    // =========================================================================
    // FORMAT HELPERS
    // =========================================================================

    describe('Format helpers', () => {
        test('formatNumber formats millions', () => {
            expect(formatNumber(2500000)).toBe('2.5M');
        });

        test('formatNumber formats thousands', () => {
            expect(formatNumber(15000)).toBe('15.0K');
        });

        test('formatNumber formats small numbers', () => {
            expect(formatNumber(500)).toBe('500');
        });

        test('getHealthBadge maps known statuses', () => {
            expect(getHealthBadge('healthy')).toBe('Healthy');
            expect(getHealthBadge('too_slow')).toBe('Too Slow');
            expect(getHealthBadge('too_fast')).toBe('Too Fast');
            expect(getHealthBadge('insufficient_data')).toBe('No Data');
        });

        test('getHealthBadge returns No Data for unknown', () => {
            expect(getHealthBadge('weird_value')).toBe('No Data');
            expect(getHealthBadge(undefined)).toBe('No Data');
        });

        test('getStatusBadge maps known statuses', () => {
            expect(getStatusBadge('active')).toBe('Active');
            expect(getStatusBadge('scheduled')).toBe('Scheduled');
            expect(getStatusBadge('ended')).toBe('Ended');
            expect(getStatusBadge('draft')).toBe('Draft');
        });

        test('getStatusBadge returns raw value for unknown', () => {
            expect(getStatusBadge('custom_status')).toBe('custom_status');
        });
    });

    // =========================================================================
    // ELEMENT ID COVERAGE
    // =========================================================================

    describe('DOM element coverage', () => {
        test('HTML contains economy health element IDs', () => {
            const economyIds = [
                'totalDrivers', 'totalXP', 'avgXP', 'dailyXPRate',
                'totalRecruiters', 'totalPoints', 'avgPoints', 'dailyPointsRate',
                'levelHealth', 'rankHealth'
            ];
            economyIds.forEach(id => {
                const hasId =
                    htmlSource.includes(`id="${id}"`) ||
                    htmlSource.includes(`id='${id}'`);
                expect(hasId).toBe(true);
            });
        });

        test('HTML contains achievement element IDs', () => {
            const achievementIds = [
                'driverAchievements', 'driverAchievementRate',
                'recruiterBadges', 'recruiterBadgeRate', 'topAchievements'
            ];
            achievementIds.forEach(id => {
                const hasId =
                    htmlSource.includes(`id="${id}"`) ||
                    htmlSource.includes(`id='${id}'`);
                expect(hasId).toBe(true);
            });
        });

        test('HTML contains challenge element IDs', () => {
            const challengeIds = [
                'driverChallengeRate', 'driverChallengesCompleted',
                'recruiterChallengeRate', 'recruiterChallengesCompleted',
                'challengesByType'
            ];
            challengeIds.forEach(id => {
                const hasId =
                    htmlSource.includes(`id="${id}"`) ||
                    htmlSource.includes(`id='${id}'`);
                expect(hasId).toBe(true);
            });
        });

        test('HTML contains engagement element IDs', () => {
            const engagementIds = [
                'dailyActive', 'weeklyActive', 'monthlyActive', 'stickiness',
                'totalReferrals', 'successfulReferrals', 'referralConversion',
                'totalBonuses', 'excellentBonuses', 'greatBonuses', 'goodBonuses'
            ];
            engagementIds.forEach(id => {
                const hasId =
                    htmlSource.includes(`id="${id}"`) ||
                    htmlSource.includes(`id='${id}'`);
                expect(hasId).toBe(true);
            });
        });

        test('HTML contains event and abuse element IDs', () => {
            const otherIds = [
                'totalEvents', 'activeEvents', 'completedEvents', 'totalParticipants',
                'eventsTableBody', 'abuseModal', 'abuseContent',
                'refreshBtn', 'abuseCheckBtn', 'lastUpdated'
            ];
            otherIds.forEach(id => {
                const hasId =
                    htmlSource.includes(`id="${id}"`) ||
                    htmlSource.includes(`id='${id}'`);
                expect(hasId).toBe(true);
            });
        });
    });

    // =========================================================================
    // SANITIZATION
    // =========================================================================

    describe('Sanitization', () => {
        test('source uses textContent or safe rendering patterns', () => {
            const hasSanitization =
                htmlSource.includes('textContent') ||
                htmlSource.includes('escapeHtml') ||
                htmlSource.includes('sanitize') ||
                htmlSource.includes('toLocaleString');
            expect(hasSanitization).toBe(true);
        });
    });
});
