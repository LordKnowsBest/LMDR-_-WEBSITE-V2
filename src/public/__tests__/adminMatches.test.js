/* eslint-disable */
/**
 * ADMIN_MATCHES Page Code Tests
 *
 * Tests for src/pages/ADMIN_MATCHES.gqhdo.js
 *
 * Covers:
 *   - HTML component discovery (mock $w with onMessage/postMessage)
 *   - Message routing (each action dispatches to correct handler)
 *   - Error handling (backend failures send actionError back)
 *   - Safety checks (no bare $w calls - all wrapped in try-catch)
 *   - Backend service mock verification
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// SOURCE FILE REFERENCE
// =============================================================================

const PAGE_CODE_PATH = path.resolve(
    __dirname, '..', '..', 'pages', 'ADMIN_MATCHES.gqhdo.js'
);

// =============================================================================
// MOCKS - Backend Services
// =============================================================================

const MOCK_STATS = { totalMatches: 500, activeDrivers: 120, avgScore: 78.5 };
const MOCK_ACTION_LIST = [{ id: 'a1', label: 'Review', count: 15 }, { id: 'a2', label: 'Follow-up', count: 8 }];
const MOCK_MATCHES = { items: [{ id: 'm1', score: 92, carrier: 'ABC Freight' }], total: 1, page: 1, pageSize: 50 };
const MOCK_INTERESTS = { items: [{ id: 'i1', status: 'pending', driverName: 'John' }], total: 1, page: 1, pageSize: 50 };
const MOCK_TRENDS = { labels: ['Mon', 'Tue'], data: [10, 15] };
const MOCK_TOP_MATCHES = [{ id: 'm1', score: 98, carrier: 'Top Carrier' }];
const MOCK_MATCH_DETAIL = { id: 'm1', score: 92, carrier: 'ABC Freight', driver: 'Jane', factors: [] };
const MOCK_CSV = 'id,carrier,score\nm1,ABC Freight,92';

const mockBackend = {
    getMatchesList: jest.fn().mockResolvedValue(MOCK_MATCHES),
    getMatchDetail: jest.fn().mockResolvedValue(MOCK_MATCH_DETAIL),
    getInterestsList: jest.fn().mockResolvedValue(MOCK_INTERESTS),
    getMatchStats: jest.fn().mockResolvedValue(MOCK_STATS),
    getMatchTrends: jest.fn().mockResolvedValue(MOCK_TRENDS),
    getTopMatches: jest.fn().mockResolvedValue(MOCK_TOP_MATCHES),
    exportMatchesCSV: jest.fn().mockResolvedValue(MOCK_CSV),
    getActionList: jest.fn().mockResolvedValue(MOCK_ACTION_LIST)
};

// =============================================================================
// MOCK - HTML Component
// =============================================================================

function createMockComponent() {
    return {
        onMessage: jest.fn(),
        postMessage: jest.fn(),
        rendered: true
    };
}

// =============================================================================
// REPLICATED LOGIC (mirrors the actual page code for testability)
// =============================================================================

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

/**
 * Replicates findHtmlComponent from the page code.
 * Uses try-catch per CLAUDE.md UI Safety Pattern.
 */
function findHtmlComponent($w) {
    for (const id of HTML_COMPONENT_IDS) {
        try {
            const el = $w(id);
            if (el && typeof el.onMessage === 'function') {
                return el;
            }
        } catch (_err) {
            // Element does not exist
        }
    }
    return null;
}

/**
 * Replicates safeSend from the page code.
 */
function safeSend(component, data) {
    try {
        if (component && typeof component.postMessage === 'function') {
            component.postMessage(data);
        }
    } catch (err) {
        // postMessage failed
    }
}

/**
 * Replicates handleMessage from the page code.
 */
async function handleMessage(component, message, backend = mockBackend) {
    if (!message || !message.action) return;

    const { action } = message;

    try {
        switch (action) {
            case 'getStats': {
                const stats = await backend.getMatchStats();
                safeSend(component, { action: 'statsLoaded', payload: stats });
                break;
            }

            case 'getActionList': {
                const actions = await backend.getActionList();
                safeSend(component, { action: 'actionListLoaded', payload: actions });
                break;
            }

            case 'getMatches': {
                const { filters = {}, page = 1, pageSize = 50 } = message;
                const result = await backend.getMatchesList({
                    filters: {
                        carrierName: filters.carrierName || undefined,
                        minScore: filters.minScore || undefined,
                        action: filters.action || undefined
                    },
                    page,
                    pageSize
                });
                safeSend(component, { action: 'matchesLoaded', payload: result });
                break;
            }

            case 'getInterests': {
                const { filters = {}, page = 1, pageSize = 50 } = message;
                const result = await backend.getInterestsList({
                    filters: {
                        status: filters.status || undefined,
                        dateFrom: filters.dateFrom || undefined,
                        dateTo: filters.dateTo || undefined
                    },
                    page,
                    pageSize
                });
                safeSend(component, { action: 'interestsLoaded', payload: result });
                break;
            }

            case 'getTrends': {
                const period = message.period || 'week';
                const trends = await backend.getMatchTrends(period);
                safeSend(component, { action: 'trendsLoaded', payload: trends });
                break;
            }

            case 'getTopMatches': {
                const limit = message.limit || 10;
                const topMatches = await backend.getTopMatches(limit);
                safeSend(component, { action: 'topMatchesLoaded', payload: topMatches });
                break;
            }

            case 'getMatchDetail': {
                const { matchId } = message;
                if (!matchId) {
                    safeSend(component, {
                        action: 'actionError',
                        message: 'Match ID is required'
                    });
                    return;
                }
                const detail = await backend.getMatchDetail(matchId);
                safeSend(component, { action: 'matchDetailLoaded', payload: detail });
                break;
            }

            case 'exportMatches': {
                const { filters = {} } = message;
                const csv = await backend.exportMatchesCSV({
                    minScore: filters.minScore || undefined,
                    dateFrom: filters.dateFrom || undefined,
                    dateTo: filters.dateTo || undefined
                });
                safeSend(component, { action: 'exportReady', payload: csv });
                break;
            }

            default:
                break;
        }
    } catch (error) {
        safeSend(component, {
            action: 'actionError',
            message: error.message || 'An unexpected error occurred'
        });
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('ADMIN_MATCHES Page Code', () => {
    let component;

    beforeEach(() => {
        jest.clearAllMocks();
        component = createMockComponent();
    });

    // =========================================================================
    // SAFETY CHECKS (source file analysis)
    // =========================================================================

    describe('Safety checks - source file analysis', () => {
        let sourceCode;

        beforeAll(() => {
            sourceCode = fs.readFileSync(PAGE_CODE_PATH, 'utf8');
        });

        test('should not have bare $w calls outside of try-catch or safety checks', () => {
            const lines = sourceCode.split('\n');
            const bareCallPattern = /\$w\(['"]#\w+['"]\)\.\w+\s*[=(]/;
            const unsafeLines = [];
            let inTryCatch = false;
            let inOnReady = false;

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.includes('try {')) inTryCatch = true;
                if (line.includes('$w.onReady')) inOnReady = true;
                if (inTryCatch && line === '}') inTryCatch = false;

                if (bareCallPattern.test(line) && !inTryCatch && !inOnReady) {
                    unsafeLines.push({ line: i + 1, content: line });
                }
            }

            expect(unsafeLines).toEqual([]);
        });

        test('findHtmlComponent should use try-catch for each $w probe', () => {
            const fnMatch = sourceCode.match(
                /function findHtmlComponent\(\)[\s\S]*?^}/m
            );
            expect(fnMatch).not.toBeNull();
            expect(fnMatch[0]).toContain('try {');
            expect(fnMatch[0]).toContain('catch');
        });

        test('safeSend should guard with try-catch and typeof check', () => {
            const fnMatch = sourceCode.match(
                /function safeSend[\s\S]*?^}/m
            );
            expect(fnMatch).not.toBeNull();
            expect(fnMatch[0]).toContain('try {');
            expect(fnMatch[0]).toContain("typeof component.postMessage === 'function'");
        });

        test('should import all required backend functions', () => {
            expect(sourceCode).toContain("from 'backend/admin_match_service'");
            expect(sourceCode).toContain('getMatchesList');
            expect(sourceCode).toContain('getMatchDetail');
            expect(sourceCode).toContain('getInterestsList');
            expect(sourceCode).toContain('getMatchStats');
            expect(sourceCode).toContain('getMatchTrends');
            expect(sourceCode).toContain('getTopMatches');
            expect(sourceCode).toContain('exportMatchesCSV');
            expect(sourceCode).toContain('getActionList');
        });

        test('$w.onReady should send init postMessage after finding component', () => {
            // Verify the onReady handler sends init to the HTML component
            expect(sourceCode).toContain("htmlComponent.postMessage({ action: 'init' })");
        });
    });

    // =========================================================================
    // HTML COMPONENT DISCOVERY
    // =========================================================================

    describe('HTML component discovery', () => {
        test('should return first component with onMessage function', () => {
            const mock$w = jest.fn((id) => {
                if (id === '#html1') throw new Error('not found');
                if (id === '#html2') return { onMessage: jest.fn(), postMessage: jest.fn() };
                return {};
            });

            const result = findHtmlComponent(mock$w);
            expect(result).not.toBeNull();
            expect(typeof result.onMessage).toBe('function');
            expect(mock$w).toHaveBeenCalledWith('#html1');
            expect(mock$w).toHaveBeenCalledWith('#html2');
        });

        test('should return null if no HTML components exist', () => {
            const mock$w = jest.fn(() => { throw new Error('not found'); });
            const result = findHtmlComponent(mock$w);
            expect(result).toBeNull();
        });

        test('should skip components without onMessage method', () => {
            const mock$w = jest.fn((id) => {
                if (id === '#html1') return { rendered: true }; // no onMessage
                if (id === '#html2') return null;
                if (id === '#html3') return { onMessage: jest.fn(), postMessage: jest.fn() };
                return {};
            });

            const result = findHtmlComponent(mock$w);
            expect(result).not.toBeNull();
            expect(mock$w).toHaveBeenCalledWith('#html1');
            expect(mock$w).toHaveBeenCalledWith('#html2');
            expect(mock$w).toHaveBeenCalledWith('#html3');
        });

        test('should probe all known component IDs', () => {
            const mock$w = jest.fn(() => ({}));
            findHtmlComponent(mock$w);
            expect(mock$w).toHaveBeenCalledWith('#html1');
            expect(mock$w).toHaveBeenCalledWith('#html2');
            expect(mock$w).toHaveBeenCalledWith('#html3');
            expect(mock$w).toHaveBeenCalledWith('#html4');
            expect(mock$w).toHaveBeenCalledWith('#html5');
            expect(mock$w).toHaveBeenCalledWith('#htmlEmbed1');
        });
    });

    // =========================================================================
    // MESSAGE ROUTING
    // =========================================================================

    describe('Message routing - handleMessage', () => {
        test('should ignore null message', async () => {
            await handleMessage(component, null);
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('should ignore message without action', async () => {
            await handleMessage(component, { data: 'something' });
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('should ignore undefined message', async () => {
            await handleMessage(component, undefined);
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        // --- getStats ---
        test('action "getStats" should call getMatchStats and respond with statsLoaded', async () => {
            await handleMessage(component, { action: 'getStats' });

            expect(mockBackend.getMatchStats).toHaveBeenCalledTimes(1);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'statsLoaded',
                payload: MOCK_STATS
            });
        });

        // --- getActionList ---
        test('action "getActionList" should call getActionList and respond with actionListLoaded', async () => {
            await handleMessage(component, { action: 'getActionList' });

            expect(mockBackend.getActionList).toHaveBeenCalledTimes(1);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionListLoaded',
                payload: MOCK_ACTION_LIST
            });
        });

        // --- getMatches ---
        test('action "getMatches" should call getMatchesList with filters, page, pageSize', async () => {
            await handleMessage(component, {
                action: 'getMatches',
                filters: { carrierName: 'ABC', minScore: 80, action: 'Review' },
                page: 2,
                pageSize: 25
            });

            expect(mockBackend.getMatchesList).toHaveBeenCalledWith({
                filters: { carrierName: 'ABC', minScore: 80, action: 'Review' },
                page: 2,
                pageSize: 25
            });
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'matchesLoaded',
                payload: MOCK_MATCHES
            });
        });

        test('action "getMatches" should default to empty filters, page 1, pageSize 50', async () => {
            await handleMessage(component, { action: 'getMatches' });

            expect(mockBackend.getMatchesList).toHaveBeenCalledWith({
                filters: {
                    carrierName: undefined,
                    minScore: undefined,
                    action: undefined
                },
                page: 1,
                pageSize: 50
            });
        });

        // --- getInterests ---
        test('action "getInterests" should call getInterestsList with filters', async () => {
            await handleMessage(component, {
                action: 'getInterests',
                filters: { status: 'pending', dateFrom: '2026-01-01', dateTo: '2026-01-31' },
                page: 3,
                pageSize: 20
            });

            expect(mockBackend.getInterestsList).toHaveBeenCalledWith({
                filters: { status: 'pending', dateFrom: '2026-01-01', dateTo: '2026-01-31' },
                page: 3,
                pageSize: 20
            });
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'interestsLoaded',
                payload: MOCK_INTERESTS
            });
        });

        test('action "getInterests" should default to empty filters, page 1, pageSize 50', async () => {
            await handleMessage(component, { action: 'getInterests' });

            expect(mockBackend.getInterestsList).toHaveBeenCalledWith({
                filters: {
                    status: undefined,
                    dateFrom: undefined,
                    dateTo: undefined
                },
                page: 1,
                pageSize: 50
            });
        });

        // --- getTrends ---
        test('action "getTrends" should call getMatchTrends with period', async () => {
            await handleMessage(component, { action: 'getTrends', period: 'month' });

            expect(mockBackend.getMatchTrends).toHaveBeenCalledWith('month');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'trendsLoaded',
                payload: MOCK_TRENDS
            });
        });

        test('action "getTrends" should default to "week" period', async () => {
            await handleMessage(component, { action: 'getTrends' });

            expect(mockBackend.getMatchTrends).toHaveBeenCalledWith('week');
        });

        // --- getTopMatches ---
        test('action "getTopMatches" should call getTopMatches with limit', async () => {
            await handleMessage(component, { action: 'getTopMatches', limit: 5 });

            expect(mockBackend.getTopMatches).toHaveBeenCalledWith(5);
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'topMatchesLoaded',
                payload: MOCK_TOP_MATCHES
            });
        });

        test('action "getTopMatches" should default to limit 10', async () => {
            await handleMessage(component, { action: 'getTopMatches' });

            expect(mockBackend.getTopMatches).toHaveBeenCalledWith(10);
        });

        // --- getMatchDetail ---
        test('action "getMatchDetail" should call getMatchDetail with matchId', async () => {
            await handleMessage(component, { action: 'getMatchDetail', matchId: 'm1' });

            expect(mockBackend.getMatchDetail).toHaveBeenCalledWith('m1');
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'matchDetailLoaded',
                payload: MOCK_MATCH_DETAIL
            });
        });

        test('action "getMatchDetail" without matchId should send actionError', async () => {
            await handleMessage(component, { action: 'getMatchDetail' });

            expect(mockBackend.getMatchDetail).not.toHaveBeenCalled();
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Match ID is required'
            });
        });

        // --- exportMatches ---
        test('action "exportMatches" should call exportMatchesCSV with filters', async () => {
            await handleMessage(component, {
                action: 'exportMatches',
                filters: { minScore: 70, dateFrom: '2026-01-01', dateTo: '2026-02-01' }
            });

            expect(mockBackend.exportMatchesCSV).toHaveBeenCalledWith({
                minScore: 70,
                dateFrom: '2026-01-01',
                dateTo: '2026-02-01'
            });
            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'exportReady',
                payload: MOCK_CSV
            });
        });

        test('action "exportMatches" should default to empty filters', async () => {
            await handleMessage(component, { action: 'exportMatches' });

            expect(mockBackend.exportMatchesCSV).toHaveBeenCalledWith({
                minScore: undefined,
                dateFrom: undefined,
                dateTo: undefined
            });
        });

        // --- unknown action ---
        test('unknown action should not post any response', async () => {
            await handleMessage(component, { action: 'unknownAction' });

            expect(component.postMessage).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // ERROR HANDLING
    // =========================================================================

    describe('Error handling', () => {
        test('backend failure on getStats should send actionError', async () => {
            const failingBackend = {
                ...mockBackend,
                getMatchStats: jest.fn().mockRejectedValue(new Error('Stats service down'))
            };

            await handleMessage(component, { action: 'getStats' }, failingBackend);

            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Stats service down'
            });
        });

        test('backend failure on getActionList should send actionError', async () => {
            const failingBackend = {
                ...mockBackend,
                getActionList: jest.fn().mockRejectedValue(new Error('Action list unavailable'))
            };

            await handleMessage(component, { action: 'getActionList' }, failingBackend);

            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Action list unavailable'
            });
        });

        test('backend failure on getMatches should send actionError', async () => {
            const failingBackend = {
                ...mockBackend,
                getMatchesList: jest.fn().mockRejectedValue(new Error('Query failed'))
            };

            await handleMessage(component, { action: 'getMatches' }, failingBackend);

            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Query failed'
            });
        });

        test('backend failure on getInterests should send actionError', async () => {
            const failingBackend = {
                ...mockBackend,
                getInterestsList: jest.fn().mockRejectedValue(new Error('Interest lookup failed'))
            };

            await handleMessage(component, { action: 'getInterests' }, failingBackend);

            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Interest lookup failed'
            });
        });

        test('backend failure on getTrends should send actionError', async () => {
            const failingBackend = {
                ...mockBackend,
                getMatchTrends: jest.fn().mockRejectedValue(new Error('Trends unavailable'))
            };

            await handleMessage(component, { action: 'getTrends' }, failingBackend);

            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Trends unavailable'
            });
        });

        test('backend failure on getTopMatches should send actionError', async () => {
            const failingBackend = {
                ...mockBackend,
                getTopMatches: jest.fn().mockRejectedValue(new Error('Top matches failed'))
            };

            await handleMessage(component, { action: 'getTopMatches' }, failingBackend);

            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Top matches failed'
            });
        });

        test('backend failure on getMatchDetail should send actionError', async () => {
            const failingBackend = {
                ...mockBackend,
                getMatchDetail: jest.fn().mockRejectedValue(new Error('Match not found'))
            };

            await handleMessage(component, { action: 'getMatchDetail', matchId: 'bad-id' }, failingBackend);

            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Match not found'
            });
        });

        test('backend failure on exportMatches should send actionError', async () => {
            const failingBackend = {
                ...mockBackend,
                exportMatchesCSV: jest.fn().mockRejectedValue(new Error('Export generation failed'))
            };

            await handleMessage(component, { action: 'exportMatches' }, failingBackend);

            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'Export generation failed'
            });
        });

        test('error without message property should use fallback text', async () => {
            const failingBackend = {
                ...mockBackend,
                getMatchStats: jest.fn().mockRejectedValue({ code: 500 })
            };

            await handleMessage(component, { action: 'getStats' }, failingBackend);

            expect(component.postMessage).toHaveBeenCalledWith({
                action: 'actionError',
                message: 'An unexpected error occurred'
            });
        });
    });

    // =========================================================================
    // SAFE SEND (safeSend)
    // =========================================================================

    describe('safeSend safety', () => {
        test('should not throw when component is null', () => {
            expect(() => safeSend(null, { action: 'test' })).not.toThrow();
        });

        test('should not throw when component.postMessage is not a function', () => {
            expect(() => safeSend({ postMessage: 'not-a-fn' }, { action: 'test' })).not.toThrow();
        });

        test('should call postMessage when component is valid', () => {
            const data = { action: 'statsLoaded', payload: MOCK_STATS };
            safeSend(component, data);
            expect(component.postMessage).toHaveBeenCalledWith(data);
        });

        test('should not throw when postMessage itself throws', () => {
            const badComponent = {
                postMessage: jest.fn(() => { throw new Error('iframe disconnected'); })
            };
            expect(() => safeSend(badComponent, { action: 'test' })).not.toThrow();
        });

        test('should not throw when component is undefined', () => {
            expect(() => safeSend(undefined, { action: 'test' })).not.toThrow();
        });
    });

    // =========================================================================
    // BACKEND SERVICE MOCK VERIFICATION
    // =========================================================================

    describe('Backend service call verification', () => {
        test('each action calls only its corresponding backend service', async () => {
            // getStats
            await handleMessage(component, { action: 'getStats' });
            expect(mockBackend.getMatchStats).toHaveBeenCalledTimes(1);
            expect(mockBackend.getMatchesList).not.toHaveBeenCalled();
            expect(mockBackend.getMatchDetail).not.toHaveBeenCalled();
            expect(mockBackend.exportMatchesCSV).not.toHaveBeenCalled();

            jest.clearAllMocks();

            // getActionList
            await handleMessage(component, { action: 'getActionList' });
            expect(mockBackend.getActionList).toHaveBeenCalledTimes(1);
            expect(mockBackend.getMatchStats).not.toHaveBeenCalled();

            jest.clearAllMocks();

            // getMatches
            await handleMessage(component, { action: 'getMatches' });
            expect(mockBackend.getMatchesList).toHaveBeenCalledTimes(1);
            expect(mockBackend.getMatchStats).not.toHaveBeenCalled();

            jest.clearAllMocks();

            // getInterests
            await handleMessage(component, { action: 'getInterests' });
            expect(mockBackend.getInterestsList).toHaveBeenCalledTimes(1);
            expect(mockBackend.getMatchesList).not.toHaveBeenCalled();

            jest.clearAllMocks();

            // getTrends
            await handleMessage(component, { action: 'getTrends' });
            expect(mockBackend.getMatchTrends).toHaveBeenCalledTimes(1);
            expect(mockBackend.getMatchStats).not.toHaveBeenCalled();

            jest.clearAllMocks();

            // getTopMatches
            await handleMessage(component, { action: 'getTopMatches' });
            expect(mockBackend.getTopMatches).toHaveBeenCalledTimes(1);
            expect(mockBackend.getMatchesList).not.toHaveBeenCalled();

            jest.clearAllMocks();

            // getMatchDetail
            await handleMessage(component, { action: 'getMatchDetail', matchId: 'm1' });
            expect(mockBackend.getMatchDetail).toHaveBeenCalledTimes(1);
            expect(mockBackend.getMatchesList).not.toHaveBeenCalled();

            jest.clearAllMocks();

            // exportMatches
            await handleMessage(component, { action: 'exportMatches' });
            expect(mockBackend.exportMatchesCSV).toHaveBeenCalledTimes(1);
            expect(mockBackend.getMatchesList).not.toHaveBeenCalled();
        });

        test('getMatches passes filter fields through correctly', async () => {
            await handleMessage(component, {
                action: 'getMatches',
                filters: { carrierName: 'Swift', minScore: 90, action: 'Hire' },
                page: 5,
                pageSize: 10
            });

            expect(mockBackend.getMatchesList).toHaveBeenCalledWith({
                filters: { carrierName: 'Swift', minScore: 90, action: 'Hire' },
                page: 5,
                pageSize: 10
            });
        });

        test('getInterests passes filter fields through correctly', async () => {
            await handleMessage(component, {
                action: 'getInterests',
                filters: { status: 'accepted', dateFrom: '2026-01-01', dateTo: '2026-02-01' },
                page: 2,
                pageSize: 25
            });

            expect(mockBackend.getInterestsList).toHaveBeenCalledWith({
                filters: { status: 'accepted', dateFrom: '2026-01-01', dateTo: '2026-02-01' },
                page: 2,
                pageSize: 25
            });
        });

        test('exportMatches passes filter fields through correctly', async () => {
            await handleMessage(component, {
                action: 'exportMatches',
                filters: { minScore: 85, dateFrom: '2026-01-15', dateTo: '2026-02-04' }
            });

            expect(mockBackend.exportMatchesCSV).toHaveBeenCalledWith({
                minScore: 85,
                dateFrom: '2026-01-15',
                dateTo: '2026-02-04'
            });
        });

        test('getMatchDetail does not call backend when matchId is missing', async () => {
            await handleMessage(component, { action: 'getMatchDetail' });

            expect(mockBackend.getMatchDetail).not.toHaveBeenCalled();
        });
    });
});
