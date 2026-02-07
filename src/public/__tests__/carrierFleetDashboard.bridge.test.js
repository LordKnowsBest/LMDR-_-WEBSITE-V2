/**
 * CARRIER_FLEET_DASHBOARD Bridge Tests
 *
 * Tests for src/pages/CARRIER_FLEET_DASHBOARD.unified.js
 * Verifies message routing, backend calls, error handling, and safety checks.
 * Uses ACTION key protocol (not type).
 *
 * Actions tested: 14 total
 *   - Driver Roster (3): getDrivers, getAlerts, addDriver
 *   - Equipment (4): getEquipment, getAssetDetails, assignEquipment, unassignEquipment
 *   - Scorecard (3): getScorecard, getFleetSummary, getRankings
 *   - Capacity (3): getCapacityOverview, getDailyBreakdown, getRecommendations
 *   - ELD (1): getFleetLocations
 *
 * @see src/pages/CARRIER_FLEET_DASHBOARD.unified.js
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const PAGE_FILE = path.resolve(__dirname, '..', '..', 'pages', 'CARRIER_FLEET_DASHBOARD.unified.js');
const sourceCode = fs.readFileSync(PAGE_FILE, 'utf8');

const EXPECTED_IMPORTS = [
    "from 'backend/fleetService'",
    "from 'backend/equipmentService'",
    "from 'backend/driverScorecardService'",
    "from 'backend/capacityPlanningService'",
    "from 'backend/eldIntegrationService'"
];

const ALL_ACTIONS = [
    'getDrivers',
    'getAlerts',
    'addDriver',
    'getEquipment',
    'getAssetDetails',
    'assignEquipment',
    'unassignEquipment',
    'getScorecard',
    'getFleetSummary',
    'getRankings',
    'getCapacityOverview',
    'getDailyBreakdown',
    'getRecommendations',
    'getFleetLocations'
];

// =============================================================================
// MOCKS
// =============================================================================

function createMockComponent() {
    return { onMessage: jest.fn(), postMessage: jest.fn() };
}

const CARRIER_DOT = '1234567';

const mockFleetService = {
    getFleetDrivers: jest.fn().mockResolvedValue({ drivers: [{ _id: 'd1', name: 'John Doe' }], total: 1 }),
    getExpiringCredentials: jest.fn().mockResolvedValue([{ driverId: 'd1', credential: 'CDL', expiresIn: 30 }]),
    addFleetDriver: jest.fn().mockResolvedValue({ _id: 'd2', name: 'Jane Smith' })
};

const mockEquipmentService = {
    getEquipmentList: jest.fn().mockResolvedValue({ equipment: [{ _id: 'eq1', type: 'tractor' }], total: 1 }),
    getEquipmentDetails: jest.fn().mockResolvedValue({ _id: 'eq1', type: 'tractor', vin: '1HGBH41JXMN109186' }),
    getAssignmentHistory: jest.fn().mockResolvedValue([{ driverId: 'd1', assignedDate: '2026-01-01' }]),
    assignEquipment: jest.fn().mockResolvedValue({ success: true, assignmentId: 'asgn1' }),
    unassignEquipment: jest.fn().mockResolvedValue({ success: true })
};

const mockScorecardService = {
    getDriverScorecard: jest.fn().mockResolvedValue({ driverId: 'd1', overallScore: 88, safety: 92, efficiency: 85 }),
    getDriverTrend: jest.fn().mockResolvedValue([{ period: '2026-01', score: 85 }, { period: '2026-02', score: 88 }]),
    getFleetScoreboardSummary: jest.fn().mockResolvedValue({ avgScore: 82, topPerformers: 5, totalDrivers: 20 }),
    getPerformanceRankings: jest.fn().mockResolvedValue([{ driverId: 'd1', rank: 1, score: 95 }])
};

const mockCapacityService = {
    getCapacityOverview: jest.fn().mockResolvedValue({ utilization: 0.78, availableDrivers: 5, totalDrivers: 20 }),
    getDailyBreakdown: jest.fn().mockResolvedValue([{ date: '2026-02-01', utilization: 0.80 }]),
    generateCapacityRecommendations: jest.fn().mockResolvedValue([{ type: 'hire', message: 'Consider hiring 2 more drivers' }])
};

const mockEldService = {
    getFleetLocations: jest.fn().mockResolvedValue([{ driverId: 'd1', lat: 32.7767, lng: -96.7970, status: 'driving' }])
};

// =============================================================================
// REPLICATED CORE LOGIC
// =============================================================================

function safeSend(component, data) {
    try {
        if (component && typeof component.postMessage === 'function') {
            component.postMessage(data);
        }
    } catch (e) {
        // Component might be detached
    }
}

function getHtmlComponents($w) {
    const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];
    const found = [];
    for (const id of HTML_COMPONENT_IDS) {
        try {
            const el = $w(id);
            if (el && typeof el.onMessage === 'function') {
                found.push(el);
            }
        } catch (error) {
            // skip
        }
    }
    return found;
}

async function routeMessage(component, message, carrierDot = CARRIER_DOT, services = {}) {
    const fleet = services.fleet || mockFleetService;
    const equipment = services.equipment || mockEquipmentService;
    const scorecard = services.scorecard || mockScorecardService;
    const capacity = services.capacity || mockCapacityService;
    const eld = services.eld || mockEldService;

    if (!message || !message.action) return;

    const { action, payload } = message;

    try {
        switch (action) {
            // --- Driver Roster ---
            case 'getDrivers': {
                const drivers = await fleet.getFleetDrivers(carrierDot, payload);
                safeSend(component, { action: 'driversLoaded', payload: drivers });
                break;
            }
            case 'getAlerts': {
                const alerts = await fleet.getExpiringCredentials(carrierDot);
                safeSend(component, { action: 'alertsLoaded', payload: { alerts } });
                break;
            }
            case 'addDriver': {
                const newDriver = await fleet.addFleetDriver(carrierDot, payload.driverData);
                safeSend(component, { action: 'driverAdded', payload: newDriver });
                break;
            }

            // --- Equipment Manager ---
            case 'getEquipment': {
                const equip = await equipment.getEquipmentList(carrierDot, payload);
                safeSend(component, { action: 'equipmentLoaded', payload: equip });
                break;
            }
            case 'getAssetDetails': {
                const asset = await equipment.getEquipmentDetails(payload.equipmentId);
                const history = await equipment.getAssignmentHistory(payload.equipmentId);
                safeSend(component, { action: 'assetDetailsLoaded', payload: { asset, history } });
                break;
            }
            case 'assignEquipment': {
                const assignment = await equipment.assignEquipment(payload.equipmentId, payload.driverId, payload.type);
                safeSend(component, { action: 'assignmentSuccess', payload: assignment });
                break;
            }
            case 'unassignEquipment': {
                await equipment.unassignEquipment(payload.equipmentId);
                safeSend(component, { action: 'assignmentSuccess' });
                break;
            }

            // --- Scorecard ---
            case 'getScorecard': {
                const sc = await scorecard.getDriverScorecard(payload.driverId, payload.periodType);
                const trend = await scorecard.getDriverTrend(payload.driverId);
                safeSend(component, { action: 'scorecardLoaded', payload: { scorecard: sc, trend } });
                break;
            }
            case 'getFleetSummary': {
                const summary = await scorecard.getFleetScoreboardSummary(carrierDot, payload.periodType);
                safeSend(component, { action: 'summaryLoaded', payload: { summary } });
                break;
            }
            case 'getRankings': {
                const rankings = await scorecard.getPerformanceRankings(carrierDot, payload.category, payload.limit);
                safeSend(component, { action: 'rankingsLoaded', payload: { rankings } });
                break;
            }

            // --- Capacity Planning ---
            case 'getCapacityOverview': {
                const capOverview = await capacity.getCapacityOverview(carrierDot, payload.period);
                safeSend(component, { action: 'overviewLoaded', payload: { overview: capOverview } });
                break;
            }
            case 'getDailyBreakdown': {
                const breakdown = await capacity.getDailyBreakdown(carrierDot, payload.startDate, payload.endDate);
                safeSend(component, { action: 'breakdownLoaded', payload: { breakdown } });
                break;
            }
            case 'getRecommendations': {
                const recs = await capacity.generateCapacityRecommendations(carrierDot);
                safeSend(component, { action: 'recommendationsLoaded', payload: { recommendations: recs } });
                break;
            }

            // --- ELD / Map ---
            case 'getFleetLocations': {
                const locations = await eld.getFleetLocations(carrierDot);
                safeSend(component, { action: 'locationsLoaded', payload: { locations } });
                break;
            }

            default:
                console.warn(`[FleetDashboard] Unknown action: ${action}`);
        }
    } catch (error) {
        console.error(`[FleetDashboard] Error handling ${action}:`, error.message);
        safeSend(component, { action: 'actionError', message: error.message });
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('CARRIER_FLEET_DASHBOARD Bridge', () => {
    let component;

    beforeEach(() => {
        jest.clearAllMocks();
        component = createMockComponent();
    });

    // =========================================================================
    // SOURCE FILE STRUCTURAL CHECKS
    // =========================================================================

    describe('Source file structure', () => {
        test('file exists and is readable', () => {
            expect(sourceCode.length).toBeGreaterThan(0);
        });

        test('defines $w.onReady', () => {
            expect(sourceCode).toMatch(/\$w\.onReady/);
        });

        test('defines HTML_COMPONENT_IDS with all six IDs', () => {
            expect(sourceCode).toContain('#html1');
            expect(sourceCode).toContain('#html2');
            expect(sourceCode).toContain('#html3');
            expect(sourceCode).toContain('#html4');
            expect(sourceCode).toContain('#html5');
            expect(sourceCode).toContain('#htmlEmbed1');
        });

        EXPECTED_IMPORTS.forEach(importPath => {
            test(`imports ${importPath}`, () => {
                expect(sourceCode).toContain(importPath);
            });
        });

        test('uses action key protocol (not type)', () => {
            expect(sourceCode).toContain('message.action');
            // The switch cases use the action variable destructured from message
            expect(sourceCode).toMatch(/const\s*\{\s*action\s*,\s*payload\s*\}\s*=\s*message/);
        });

        test('defines safeSend helper', () => {
            expect(sourceCode).toMatch(/function safeSend/);
        });

        test('defines routeMessage function', () => {
            expect(sourceCode).toMatch(/function routeMessage/);
        });

        test('sends init action on component discovery', () => {
            expect(sourceCode).toContain("action: 'init'");
        });

        ALL_ACTIONS.forEach(action => {
            test(`handles '${action}' action in switch`, () => {
                expect(sourceCode).toContain(`case '${action}'`);
            });
        });
    });

    // =========================================================================
    // SAFETY CHECKS
    // =========================================================================

    describe('Safety checks', () => {
        test('component discovery checks typeof onMessage', () => {
            expect(sourceCode).toContain("typeof el.onMessage === 'function'");
        });

        test('safeSend wraps postMessage in try-catch', () => {
            const safeSendMatch = sourceCode.match(/function safeSend[\s\S]*?^\}/m);
            expect(safeSendMatch).not.toBeNull();
            expect(safeSendMatch[0]).toContain('try');
            expect(safeSendMatch[0]).toContain('catch');
            expect(safeSendMatch[0]).toContain('postMessage');
        });

        test('safeSend checks component and postMessage exist', () => {
            expect(sourceCode).toContain("typeof component.postMessage === 'function'");
        });

        test('routeMessage early returns on null/missing action', () => {
            expect(sourceCode).toContain('if (!message || !message.action) return');
        });
    });

    // =========================================================================
    // HTML COMPONENT DISCOVERY
    // =========================================================================

    describe('HTML component discovery', () => {
        test('finds components with onMessage method', () => {
            const mock$w = jest.fn((id) => {
                if (id === '#html1') return createMockComponent();
                throw new Error('not found');
            });
            const components = getHtmlComponents(mock$w);
            expect(components).toHaveLength(1);
        });

        test('skips components that throw', () => {
            const mock$w = jest.fn(() => { throw new Error('skip'); });
            const components = getHtmlComponents(mock$w);
            expect(components).toHaveLength(0);
        });

        test('tries all six IDs', () => {
            const mock$w = jest.fn(() => { throw new Error('skip'); });
            getHtmlComponents(mock$w);
            expect(mock$w).toHaveBeenCalledTimes(6);
        });

        test('finds multiple components', () => {
            const mock$w = jest.fn(() => createMockComponent());
            const components = getHtmlComponents(mock$w);
            expect(components).toHaveLength(6);
        });

        test('skips components without onMessage', () => {
            const mock$w = jest.fn((id) => {
                if (id === '#html1') return { postMessage: jest.fn() }; // no onMessage
                if (id === '#html2') return createMockComponent();
                throw new Error('not found');
            });
            const components = getHtmlComponents(mock$w);
            expect(components).toHaveLength(1);
        });
    });

    // =========================================================================
    // MESSAGE ROUTING - Driver Roster
    // =========================================================================

    describe('Message routing - Driver Roster', () => {
        test('getDrivers calls fleetService.getFleetDrivers and sends driversLoaded', async () => {
            const filterPayload = { status: 'active', page: 1 };
            await routeMessage(component, { action: 'getDrivers', payload: filterPayload });

            expect(mockFleetService.getFleetDrivers).toHaveBeenCalledWith(CARRIER_DOT, filterPayload);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'driversLoaded',
                    payload: expect.objectContaining({ drivers: expect.any(Array) })
                })
            );
        });

        test('getAlerts calls fleetService.getExpiringCredentials and sends alertsLoaded', async () => {
            await routeMessage(component, { action: 'getAlerts' });

            expect(mockFleetService.getExpiringCredentials).toHaveBeenCalledWith(CARRIER_DOT);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'alertsLoaded',
                    payload: expect.objectContaining({
                        alerts: expect.any(Array)
                    })
                })
            );
        });

        test('addDriver calls fleetService.addFleetDriver and sends driverAdded', async () => {
            const driverData = { name: 'Jane Smith', cdl_class: 'A' };
            await routeMessage(component, { action: 'addDriver', payload: { driverData } });

            expect(mockFleetService.addFleetDriver).toHaveBeenCalledWith(CARRIER_DOT, driverData);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'driverAdded',
                    payload: expect.objectContaining({ _id: 'd2' })
                })
            );
        });
    });

    // =========================================================================
    // MESSAGE ROUTING - Equipment
    // =========================================================================

    describe('Message routing - Equipment', () => {
        test('getEquipment calls equipmentService.getEquipmentList and sends equipmentLoaded', async () => {
            const filters = { type: 'tractor' };
            await routeMessage(component, { action: 'getEquipment', payload: filters });

            expect(mockEquipmentService.getEquipmentList).toHaveBeenCalledWith(CARRIER_DOT, filters);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'equipmentLoaded',
                    payload: expect.objectContaining({ equipment: expect.any(Array) })
                })
            );
        });

        test('getAssetDetails calls getEquipmentDetails + getAssignmentHistory and sends assetDetailsLoaded', async () => {
            await routeMessage(component, { action: 'getAssetDetails', payload: { equipmentId: 'eq1' } });

            expect(mockEquipmentService.getEquipmentDetails).toHaveBeenCalledWith('eq1');
            expect(mockEquipmentService.getAssignmentHistory).toHaveBeenCalledWith('eq1');
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'assetDetailsLoaded',
                    payload: expect.objectContaining({
                        asset: expect.objectContaining({ _id: 'eq1' }),
                        history: expect.any(Array)
                    })
                })
            );
        });

        test('assignEquipment calls equipmentService.assignEquipment and sends assignmentSuccess', async () => {
            await routeMessage(component, {
                action: 'assignEquipment',
                payload: { equipmentId: 'eq1', driverId: 'd1', type: 'primary' }
            });

            expect(mockEquipmentService.assignEquipment).toHaveBeenCalledWith('eq1', 'd1', 'primary');
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'assignmentSuccess',
                    payload: expect.objectContaining({ success: true, assignmentId: 'asgn1' })
                })
            );
        });

        test('unassignEquipment calls equipmentService.unassignEquipment and sends assignmentSuccess without payload', async () => {
            await routeMessage(component, {
                action: 'unassignEquipment',
                payload: { equipmentId: 'eq1' }
            });

            expect(mockEquipmentService.unassignEquipment).toHaveBeenCalledWith('eq1');
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'assignmentSuccess' })
            );
            // unassignEquipment sends no payload
            const sentMsg = component.postMessage.mock.calls[0][0];
            expect(sentMsg.payload).toBeUndefined();
        });
    });

    // =========================================================================
    // MESSAGE ROUTING - Scorecard
    // =========================================================================

    describe('Message routing - Scorecard', () => {
        test('getScorecard calls getDriverScorecard + getDriverTrend and sends scorecardLoaded', async () => {
            await routeMessage(component, {
                action: 'getScorecard',
                payload: { driverId: 'd1', periodType: 'monthly' }
            });

            expect(mockScorecardService.getDriverScorecard).toHaveBeenCalledWith('d1', 'monthly');
            expect(mockScorecardService.getDriverTrend).toHaveBeenCalledWith('d1');
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'scorecardLoaded',
                    payload: expect.objectContaining({
                        scorecard: expect.objectContaining({ overallScore: 88 }),
                        trend: expect.any(Array)
                    })
                })
            );
        });

        test('getFleetSummary calls getFleetScoreboardSummary and sends summaryLoaded', async () => {
            await routeMessage(component, {
                action: 'getFleetSummary',
                payload: { periodType: 'weekly' }
            });

            expect(mockScorecardService.getFleetScoreboardSummary).toHaveBeenCalledWith(CARRIER_DOT, 'weekly');
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'summaryLoaded',
                    payload: expect.objectContaining({
                        summary: expect.objectContaining({ avgScore: 82 })
                    })
                })
            );
        });

        test('getRankings calls getPerformanceRankings and sends rankingsLoaded', async () => {
            await routeMessage(component, {
                action: 'getRankings',
                payload: { category: 'safety', limit: 10 }
            });

            expect(mockScorecardService.getPerformanceRankings).toHaveBeenCalledWith(CARRIER_DOT, 'safety', 10);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'rankingsLoaded',
                    payload: expect.objectContaining({
                        rankings: expect.any(Array)
                    })
                })
            );
        });
    });

    // =========================================================================
    // MESSAGE ROUTING - Capacity Planning
    // =========================================================================

    describe('Message routing - Capacity Planning', () => {
        test('getCapacityOverview calls getCapacityOverview and sends overviewLoaded', async () => {
            await routeMessage(component, {
                action: 'getCapacityOverview',
                payload: { period: 'weekly' }
            });

            expect(mockCapacityService.getCapacityOverview).toHaveBeenCalledWith(CARRIER_DOT, 'weekly');
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'overviewLoaded',
                    payload: expect.objectContaining({
                        overview: expect.objectContaining({ utilization: 0.78 })
                    })
                })
            );
        });

        test('getDailyBreakdown calls getDailyBreakdown and sends breakdownLoaded', async () => {
            await routeMessage(component, {
                action: 'getDailyBreakdown',
                payload: { startDate: '2026-02-01', endDate: '2026-02-07' }
            });

            expect(mockCapacityService.getDailyBreakdown).toHaveBeenCalledWith(CARRIER_DOT, '2026-02-01', '2026-02-07');
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'breakdownLoaded',
                    payload: expect.objectContaining({
                        breakdown: expect.any(Array)
                    })
                })
            );
        });

        test('getRecommendations calls generateCapacityRecommendations and sends recommendationsLoaded', async () => {
            await routeMessage(component, { action: 'getRecommendations', payload: {} });

            expect(mockCapacityService.generateCapacityRecommendations).toHaveBeenCalledWith(CARRIER_DOT);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'recommendationsLoaded',
                    payload: expect.objectContaining({
                        recommendations: expect.any(Array)
                    })
                })
            );
        });
    });

    // =========================================================================
    // MESSAGE ROUTING - ELD / Map
    // =========================================================================

    describe('Message routing - ELD / Map', () => {
        test('getFleetLocations calls eldService.getFleetLocations and sends locationsLoaded', async () => {
            await routeMessage(component, { action: 'getFleetLocations', payload: {} });

            expect(mockEldService.getFleetLocations).toHaveBeenCalledWith(CARRIER_DOT);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'locationsLoaded',
                    payload: expect.objectContaining({
                        locations: expect.any(Array)
                    })
                })
            );
        });
    });

    // =========================================================================
    // MESSAGE ROUTING - Edge Cases
    // =========================================================================

    describe('Message routing - Edge cases', () => {
        test('ignores messages with no action', async () => {
            await routeMessage(component, {});
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('ignores null message', async () => {
            await routeMessage(component, null);
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('ignores undefined message', async () => {
            await routeMessage(component, undefined);
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('unknown action does not crash and does not send a response', async () => {
            await routeMessage(component, { action: 'unknownAction', payload: {} });
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('message with action but no payload does not crash for getDrivers', async () => {
            await routeMessage(component, { action: 'getDrivers' });
            expect(mockFleetService.getFleetDrivers).toHaveBeenCalledWith(CARRIER_DOT, undefined);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'driversLoaded' })
            );
        });
    });

    // =========================================================================
    // ERROR HANDLING
    // =========================================================================

    describe('Error handling', () => {
        test('getDrivers failure sends actionError', async () => {
            const failFleet = { ...mockFleetService, getFleetDrivers: jest.fn().mockRejectedValue(new Error('Fleet DB error')) };
            await routeMessage(component, { action: 'getDrivers', payload: {} }, CARRIER_DOT, { fleet: failFleet });

            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'actionError',
                    message: 'Fleet DB error'
                })
            );
        });

        test('getAlerts failure sends actionError', async () => {
            const failFleet = { ...mockFleetService, getExpiringCredentials: jest.fn().mockRejectedValue(new Error('Alerts failed')) };
            await routeMessage(component, { action: 'getAlerts', payload: {} }, CARRIER_DOT, { fleet: failFleet });

            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'actionError',
                    message: 'Alerts failed'
                })
            );
        });

        test('addDriver failure sends actionError', async () => {
            const failFleet = { ...mockFleetService, addFleetDriver: jest.fn().mockRejectedValue(new Error('Add driver failed')) };
            await routeMessage(component, { action: 'addDriver', payload: { driverData: { name: 'Test' } } }, CARRIER_DOT, { fleet: failFleet });

            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'actionError',
                    message: 'Add driver failed'
                })
            );
        });

        test('getEquipment failure sends actionError', async () => {
            const failEquip = { ...mockEquipmentService, getEquipmentList: jest.fn().mockRejectedValue(new Error('Equipment error')) };
            await routeMessage(component, { action: 'getEquipment', payload: {} }, CARRIER_DOT, { equipment: failEquip });

            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'actionError',
                    message: 'Equipment error'
                })
            );
        });

        test('getAssetDetails failure sends actionError', async () => {
            const failEquip = { ...mockEquipmentService, getEquipmentDetails: jest.fn().mockRejectedValue(new Error('Asset not found')) };
            await routeMessage(component, { action: 'getAssetDetails', payload: { equipmentId: 'eq99' } }, CARRIER_DOT, { equipment: failEquip });

            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'actionError',
                    message: 'Asset not found'
                })
            );
        });

        test('assignEquipment failure sends actionError', async () => {
            const failEquip = { ...mockEquipmentService, assignEquipment: jest.fn().mockRejectedValue(new Error('Assignment conflict')) };
            await routeMessage(component, {
                action: 'assignEquipment',
                payload: { equipmentId: 'eq1', driverId: 'd1', type: 'primary' }
            }, CARRIER_DOT, { equipment: failEquip });

            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'actionError',
                    message: 'Assignment conflict'
                })
            );
        });

        test('unassignEquipment failure sends actionError', async () => {
            const failEquip = { ...mockEquipmentService, unassignEquipment: jest.fn().mockRejectedValue(new Error('Unassign error')) };
            await routeMessage(component, { action: 'unassignEquipment', payload: { equipmentId: 'eq1' } }, CARRIER_DOT, { equipment: failEquip });

            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'actionError',
                    message: 'Unassign error'
                })
            );
        });

        test('getScorecard failure sends actionError', async () => {
            const failScorecard = { ...mockScorecardService, getDriverScorecard: jest.fn().mockRejectedValue(new Error('Scorecard error')) };
            await routeMessage(component, {
                action: 'getScorecard',
                payload: { driverId: 'd1', periodType: 'monthly' }
            }, CARRIER_DOT, { scorecard: failScorecard });

            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'actionError',
                    message: 'Scorecard error'
                })
            );
        });

        test('getFleetSummary failure sends actionError', async () => {
            const failScorecard = { ...mockScorecardService, getFleetScoreboardSummary: jest.fn().mockRejectedValue(new Error('Summary error')) };
            await routeMessage(component, {
                action: 'getFleetSummary',
                payload: { periodType: 'weekly' }
            }, CARRIER_DOT, { scorecard: failScorecard });

            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'actionError',
                    message: 'Summary error'
                })
            );
        });

        test('getCapacityOverview failure sends actionError', async () => {
            const failCapacity = { ...mockCapacityService, getCapacityOverview: jest.fn().mockRejectedValue(new Error('Capacity error')) };
            await routeMessage(component, {
                action: 'getCapacityOverview',
                payload: { period: 'weekly' }
            }, CARRIER_DOT, { capacity: failCapacity });

            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'actionError',
                    message: 'Capacity error'
                })
            );
        });

        test('getFleetLocations failure sends actionError', async () => {
            const failEld = { ...mockEldService, getFleetLocations: jest.fn().mockRejectedValue(new Error('ELD offline')) };
            await routeMessage(component, { action: 'getFleetLocations', payload: {} }, CARRIER_DOT, { eld: failEld });

            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'actionError',
                    message: 'ELD offline'
                })
            );
        });

        test('getRecommendations failure sends actionError', async () => {
            const failCapacity = { ...mockCapacityService, generateCapacityRecommendations: jest.fn().mockRejectedValue(new Error('Recommendation error')) };
            await routeMessage(component, { action: 'getRecommendations', payload: {} }, CARRIER_DOT, { capacity: failCapacity });

            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'actionError',
                    message: 'Recommendation error'
                })
            );
        });

        test('getRankings failure sends actionError', async () => {
            const failScorecard = { ...mockScorecardService, getPerformanceRankings: jest.fn().mockRejectedValue(new Error('Rankings error')) };
            await routeMessage(component, {
                action: 'getRankings',
                payload: { category: 'safety', limit: 10 }
            }, CARRIER_DOT, { scorecard: failScorecard });

            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'actionError',
                    message: 'Rankings error'
                })
            );
        });

        test('getDailyBreakdown failure sends actionError', async () => {
            const failCapacity = { ...mockCapacityService, getDailyBreakdown: jest.fn().mockRejectedValue(new Error('Breakdown error')) };
            await routeMessage(component, {
                action: 'getDailyBreakdown',
                payload: { startDate: '2026-02-01', endDate: '2026-02-07' }
            }, CARRIER_DOT, { capacity: failCapacity });

            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    action: 'actionError',
                    message: 'Breakdown error'
                })
            );
        });
    });

    // =========================================================================
    // SAFE SEND UTILITY
    // =========================================================================

    describe('safeSend utility', () => {
        test('does nothing if component is null', () => {
            expect(() => safeSend(null, { action: 'test' })).not.toThrow();
        });

        test('does nothing if component has no postMessage method', () => {
            expect(() => safeSend({}, { action: 'test' })).not.toThrow();
        });

        test('calls postMessage when component is valid', () => {
            const data = { action: 'driversLoaded', payload: { drivers: [] } };
            safeSend(component, data);
            expect(component.postMessage).toHaveBeenCalledWith(data);
        });

        test('does not throw if postMessage throws', () => {
            const throwingComponent = {
                postMessage: jest.fn(() => { throw new Error('Detached'); })
            };
            expect(() => safeSend(throwingComponent, { action: 'test' })).not.toThrow();
        });

        test('does nothing if component is undefined', () => {
            expect(() => safeSend(undefined, { action: 'test' })).not.toThrow();
        });
    });

    // =========================================================================
    // CARRIER DOT PASSING
    // =========================================================================

    describe('carrierDot is passed correctly to services', () => {
        test('getDrivers passes carrierDot to fleetService', async () => {
            const customDot = '9999999';
            await routeMessage(component, { action: 'getDrivers', payload: {} }, customDot);
            expect(mockFleetService.getFleetDrivers).toHaveBeenCalledWith(customDot, {});
        });

        test('getAlerts passes carrierDot to fleetService', async () => {
            const customDot = '8888888';
            await routeMessage(component, { action: 'getAlerts', payload: {} }, customDot);
            expect(mockFleetService.getExpiringCredentials).toHaveBeenCalledWith(customDot);
        });

        test('addDriver passes carrierDot to fleetService', async () => {
            const customDot = '7777777';
            await routeMessage(component, { action: 'addDriver', payload: { driverData: { name: 'Test' } } }, customDot);
            expect(mockFleetService.addFleetDriver).toHaveBeenCalledWith(customDot, { name: 'Test' });
        });

        test('getEquipment passes carrierDot to equipmentService', async () => {
            const customDot = '6666666';
            await routeMessage(component, { action: 'getEquipment', payload: {} }, customDot);
            expect(mockEquipmentService.getEquipmentList).toHaveBeenCalledWith(customDot, {});
        });

        test('getFleetSummary passes carrierDot to scorecardService', async () => {
            const customDot = '5555555';
            await routeMessage(component, { action: 'getFleetSummary', payload: { periodType: 'daily' } }, customDot);
            expect(mockScorecardService.getFleetScoreboardSummary).toHaveBeenCalledWith(customDot, 'daily');
        });

        test('getRankings passes carrierDot to scorecardService', async () => {
            const customDot = '4444444';
            await routeMessage(component, { action: 'getRankings', payload: { category: 'efficiency', limit: 5 } }, customDot);
            expect(mockScorecardService.getPerformanceRankings).toHaveBeenCalledWith(customDot, 'efficiency', 5);
        });

        test('getCapacityOverview passes carrierDot to capacityService', async () => {
            const customDot = '3333333';
            await routeMessage(component, { action: 'getCapacityOverview', payload: { period: 'monthly' } }, customDot);
            expect(mockCapacityService.getCapacityOverview).toHaveBeenCalledWith(customDot, 'monthly');
        });

        test('getDailyBreakdown passes carrierDot to capacityService', async () => {
            const customDot = '2222222';
            await routeMessage(component, {
                action: 'getDailyBreakdown',
                payload: { startDate: '2026-01-01', endDate: '2026-01-31' }
            }, customDot);
            expect(mockCapacityService.getDailyBreakdown).toHaveBeenCalledWith(customDot, '2026-01-01', '2026-01-31');
        });

        test('getRecommendations passes carrierDot to capacityService', async () => {
            const customDot = '1111111';
            await routeMessage(component, { action: 'getRecommendations', payload: {} }, customDot);
            expect(mockCapacityService.generateCapacityRecommendations).toHaveBeenCalledWith(customDot);
        });

        test('getFleetLocations passes carrierDot to eldService', async () => {
            const customDot = '0000000';
            await routeMessage(component, { action: 'getFleetLocations', payload: {} }, customDot);
            expect(mockEldService.getFleetLocations).toHaveBeenCalledWith(customDot);
        });
    });
});
