/**
 * ROAD UTILITIES Bridge Tests
 * ============================
 * Tests for src/pages/Road Utilities.xzvqe.js
 * Verifies message routing, backend calls, error handling, and safety checks.
 * Uses TYPE key protocol (not action).
 *
 * 25 actions grouped by phase:
 *   Utility (2): ping, ready
 *   Phase 1 - Parking (3): searchParking, getParkingDetails, reportParking
 *   Phase 2 - Fuel (4): searchFuel, linkFuelCard, getDriverFuelCards, calculateSavings
 *   Phase 3 - Weigh Stations (5): searchWeighStations, getStationStatus, reportStationStatus,
 *             getDriverBypassServices, saveDriverBypassServices
 *   Phase 4 - Rest Stops (4): getReviews, submitReview, reportCondition, voteReview
 *   Phase 5 - Weather (1): getWeather
 *   Phase 6 - Road Conditions (4): getRoadConditions, getTruckRestrictions,
 *             reportRoadCondition, verifyConditionReport
 *   Misc (2): tabSwitch, tabChanged
 *
 * @see src/pages/Road Utilities.xzvqe.js
 * @see src/public/driver/DRIVER_ROAD_UTILITIES.html
 */

/* eslint-env jest */

const fs = require('fs');
const path = require('path');

// =============================================================================
// CONFIGURATION
// =============================================================================

const PAGE_FILE = path.resolve(__dirname, '..', '..', 'pages', 'Road Utilities.xzvqe.js');
const sourceCode = fs.readFileSync(PAGE_FILE, 'utf8');

const EXPECTED_IMPORTS = [
    "from 'backend/parkingService'",
    "from 'backend/fuelService'",
    "from 'backend/weighStationService'",
    "from 'backend/restStopService'",
    "from 'backend/weatherAlertService'",
    "from 'backend/roadConditionService'",
    "from 'backend/featureAdoptionService'",
];

const ALL_ACTIONS = [
    'ping', 'ready',
    'searchParking', 'getParkingDetails', 'reportParking',
    'searchFuel', 'linkFuelCard', 'getDriverFuelCards', 'calculateSavings',
    'searchWeighStations', 'getStationStatus', 'reportStationStatus',
    'getDriverBypassServices', 'saveDriverBypassServices',
    'getReviews', 'submitReview', 'reportCondition', 'voteReview',
    'getWeather',
    'getRoadConditions', 'getTruckRestrictions', 'reportRoadCondition', 'verifyConditionReport',
    'tabSwitch', 'tabChanged',
];

// =============================================================================
// MOCKS
// =============================================================================

function createMockComponent() {
    return { onMessage: jest.fn(), postMessage: jest.fn() };
}

const mockWixUsers = {
    currentUser: { loggedIn: true, id: 'user-123' }
};

const mockWixUsersLoggedOut = {
    currentUser: { loggedIn: false, id: null }
};

const mockParkingService = {
    searchParking: jest.fn().mockResolvedValue({ success: true, items: [{ name: 'Pilot #412', lat: 35.15, lng: -90.05 }], fromCache: false }),
    getParkingDetails: jest.fn().mockResolvedValue({ success: true, item: { name: 'Pilot #412', available_spaces: 45 } }),
    reportParkingAvailability: jest.fn().mockResolvedValue({ success: true, reportId: 'rpt-1' }),
};

const mockFuelService = {
    searchFuelPrices: jest.fn().mockResolvedValue({ success: true, items: [{ station_id: 'S1', diesel_price: 3.45, discount_applied: 0.04, accepted_cards: ['comdata'] }], fromCache: false }),
    linkFuelCard: jest.fn().mockResolvedValue({ success: true, card: { card_type: 'comdata', card_last4: '1234' } }),
    getDriverFuelCards: jest.fn().mockResolvedValue({ success: true, cards: [{ card_type: 'comdata' }] }),
    calculateFuelSavings: jest.fn().mockResolvedValue({ success: true, totalSavings: 42.50, perGallon: 0.04 }),
};

const mockWeighStationService = {
    searchWeighStations: jest.fn().mockResolvedValue({ success: true, items: [{ station_id: 'WS1', name: 'I-40 Scale' }], fromCache: false }),
    getStationStatus: jest.fn().mockResolvedValue({ success: true, station: { station_id: 'WS1', status: 'open' } }),
    reportStationStatus: jest.fn().mockResolvedValue({ success: true, reportId: 'ws-rpt-1' }),
    getDriverBypassServices: jest.fn().mockResolvedValue({ success: true, services: { prepass: true, drivewyze: false } }),
    saveDriverBypassServices: jest.fn().mockResolvedValue({ success: true }),
};

const mockRestStopService = {
    getLocationReviews: jest.fn().mockResolvedValue({ success: true, reviews: [{ _id: 'rev1', overall_rating: 4.5, review_text: 'Clean' }], stats: { avgRating: 4.2 } }),
    submitReview: jest.fn().mockResolvedValue({ success: true, review: { _id: 'rev2' } }),
    submitConditionReport: jest.fn().mockResolvedValue({ success: true }),
    voteReview: jest.fn().mockResolvedValue({ success: true, helpful_votes: 5 }),
};

const mockWeatherService = {
    getAlertsAtLocation: jest.fn().mockResolvedValue({ success: true, alerts: [{ type: 'winter_storm', severity: 'moderate' }] }),
    getRouteWeather: jest.fn().mockResolvedValue({ success: true, alerts: [{ type: 'fog', severity: 'minor' }] }),
};

const mockRoadConditionService = {
    getChainRequirements: jest.fn().mockResolvedValue({ success: true, requirements: [{ pass: 'Donner', state: 'CA' }] }),
    getRouteConditions: jest.fn().mockResolvedValue({ success: true, conditions: [{ type: 'construction', highway: 'I-5' }], summary: { total: 1 } }),
    getTruckRestrictions: jest.fn().mockResolvedValue({ success: true, restrictions: [{ highway: 'US-6', restriction_type: 'height' }] }),
    reportCondition: jest.fn().mockResolvedValue({ success: true, reportId: 'rc-1' }),
    verifyConditionReport: jest.fn().mockResolvedValue({ success: true }),
};

const mockFeatureAdoption = {
    logFeatureInteraction: jest.fn().mockResolvedValue({}),
};

// =============================================================================
// REPLICATED CORE LOGIC
// =============================================================================

function sendToHtml(component, type, data) {
    try {
        if (component && typeof component.postMessage === 'function') {
            component.postMessage({ type, data });
        }
    } catch (e) {
        // silently fail
    }
}

function findHtmlComponent($w) {
    const POSSIBLE_HTML_IDS = ['#html4', '#html1', '#html2', '#html3', '#html5', '#html6'];
    for (const htmlId of POSSIBLE_HTML_IDS) {
        try {
            const comp = $w(htmlId);
            if (comp && comp.onMessage) return comp;
        } catch (e) {
            // skip
        }
    }
    return null;
}

const DEFAULT_LOCATION = { lat: 35.1495, lng: -90.0490 };

async function routeMessage(component, msg, services = {}, wixUsers = mockWixUsers) {
    const parking = services.parking || mockParkingService;
    const fuel = services.fuel || mockFuelService;
    const weighStation = services.weighStation || mockWeighStationService;
    const restStop = services.restStop || mockRestStopService;
    const weather = services.weather || mockWeatherService;
    const roadCondition = services.roadCondition || mockRoadConditionService;

    if (!msg || !msg.type) return;

    const action = msg.type;
    const data = msg.data || {};

    try {
        switch (action) {
            case 'ping':
                sendToHtml(component, 'pong', { timestamp: Date.now() });
                break;

            case 'ready':
                // Sends init config - simplified for test
                sendToHtml(component, 'init', {
                    isLoggedIn: wixUsers.currentUser.loggedIn,
                    userId: wixUsers.currentUser.loggedIn ? wixUsers.currentUser.id : null,
                    defaultLocation: DEFAULT_LOCATION,
                    timestamp: Date.now(),
                    initialTab: 'dashboard'
                });
                break;

            // Phase 1: Parking
            case 'searchParking': {
                const lat = parseFloat(data.lat) || DEFAULT_LOCATION.lat;
                const lng = parseFloat(data.lng) || DEFAULT_LOCATION.lng;
                const radius = parseInt(data.radius, 10) || 25;
                const filters = data.filters || {};
                const result = await parking.searchParking(lat, lng, radius, filters);
                if (result.success) {
                    sendToHtml(component, 'parkingResults', {
                        items: result.items,
                        fromCache: result.fromCache || false,
                        searchCenter: { lat, lng },
                        radius
                    });
                } else {
                    sendToHtml(component, 'error', { message: result.error || 'Failed to search parking' });
                }
                break;
            }

            case 'getParkingDetails': {
                if (!data.locationId) {
                    sendToHtml(component, 'error', { message: 'Location ID is required' });
                    return;
                }
                const result = await parking.getParkingDetails(data.locationId);
                if (result.success) {
                    sendToHtml(component, 'parkingDetails', { item: result.item });
                } else {
                    sendToHtml(component, 'error', { message: result.error || 'Failed to get parking details' });
                }
                break;
            }

            case 'reportParking': {
                if (!wixUsers.currentUser.loggedIn) {
                    sendToHtml(component, 'error', { message: 'You must be logged in to report parking status' });
                    return;
                }
                if (!data.locationId) {
                    sendToHtml(component, 'error', { message: 'Location ID is required' });
                    return;
                }
                const report = {
                    driver_id: wixUsers.currentUser.id,
                    spaces_available: parseInt(data.spacesAvailable, 10) || 0,
                    notes: data.notes || ''
                };
                const result = await parking.reportParkingAvailability(data.locationId, report);
                sendToHtml(component, 'reportResult', {
                    success: result.success,
                    message: result.success ? 'Thank you for your report!' : result.error,
                    reportId: result.reportId
                });
                break;
            }

            // Phase 2: Fuel
            case 'searchFuel': {
                const lat = parseFloat(data.lat) || DEFAULT_LOCATION.lat;
                const lng = parseFloat(data.lng) || DEFAULT_LOCATION.lng;
                const radius = parseInt(data.radius, 10) || 50;
                const fuelCardType = data.fuelCardType || 'none';
                const result = await fuel.searchFuelPrices(lat, lng, radius, {
                    fuelType: 'diesel',
                    cardType: fuelCardType
                });
                if (result.success) {
                    const items = result.items.map(station => ({
                        ...station,
                        savings: station.discount_applied || station.savings_per_gallon || 0,
                        accepts_card: fuelCardType !== 'none' && station.accepted_cards?.includes(fuelCardType),
                        card_type: fuelCardType !== 'none' ? fuelCardType.toUpperCase() : null
                    }));
                    sendToHtml(component, 'fuelResults', {
                        items,
                        fromCache: result.fromCache || false,
                        searchCenter: { lat, lng },
                        radius
                    });
                } else {
                    sendToHtml(component, 'error', { message: result.error || 'Failed to search fuel prices' });
                }
                break;
            }

            case 'linkFuelCard': {
                if (!wixUsers.currentUser.loggedIn) {
                    sendToHtml(component, 'error', { message: 'You must be logged in to link a fuel card' });
                    return;
                }
                if (!data.cardType) {
                    sendToHtml(component, 'error', { message: 'Card type is required' });
                    return;
                }
                const cardInfo = {
                    card_type: data.cardType,
                    card_last4: data.cardLast4 || '',
                    nickname: data.nickname || data.cardType.toUpperCase()
                };
                const result = await fuel.linkFuelCard(wixUsers.currentUser.id, cardInfo);
                sendToHtml(component, 'fuelCardLinked', {
                    success: result.success,
                    message: result.success ? 'Fuel card linked successfully!' : result.error,
                    card: result.card
                });
                break;
            }

            case 'getDriverFuelCards': {
                if (!wixUsers.currentUser.loggedIn) {
                    sendToHtml(component, 'fuelCardsLoaded', { cards: [] });
                    return;
                }
                const result = await fuel.getDriverFuelCards(wixUsers.currentUser.id);
                if (result.success) {
                    sendToHtml(component, 'fuelCardsLoaded', { cards: result.cards || [] });
                } else {
                    sendToHtml(component, 'fuelCardsLoaded', { cards: [] });
                }
                break;
            }

            case 'calculateSavings': {
                const userId = wixUsers.currentUser.loggedIn ? wixUsers.currentUser.id : 'anonymous';
                const tripDetails = {
                    gallons: data.gallons || 150,
                    currentPrice: data.currentPrice,
                    cardType: data.cardType,
                    stateAverage: data.stateAverage
                };
                const result = await fuel.calculateFuelSavings(userId, tripDetails);
                sendToHtml(component, 'savingsResult', { success: result.success, ...result });
                break;
            }

            // Phase 3: Weigh Stations
            case 'searchWeighStations': {
                const lat = parseFloat(data.lat) || DEFAULT_LOCATION.lat;
                const lng = parseFloat(data.lng) || DEFAULT_LOCATION.lng;
                const radius = parseInt(data.radius, 10) || 100;
                const result = await weighStation.searchWeighStations(lat, lng, radius, {
                    state: data.state || null,
                    bypassServices: data.bypassServices || {}
                });
                if (result.success) {
                    sendToHtml(component, 'weighStationResults', {
                        items: result.items,
                        fromCache: result.fromCache || false,
                        searchCenter: { lat, lng },
                        radius
                    });
                } else {
                    sendToHtml(component, 'error', { message: result.error || 'Failed to search weigh stations' });
                }
                break;
            }

            case 'getStationStatus': {
                if (!data.stationId) {
                    sendToHtml(component, 'error', { message: 'Station ID is required' });
                    return;
                }
                const result = await weighStation.getStationStatus(data.stationId);
                if (result.success) {
                    sendToHtml(component, 'stationStatusResult', { station: result.station });
                } else {
                    sendToHtml(component, 'error', { message: result.error || 'Failed to get station status' });
                }
                break;
            }

            case 'reportStationStatus': {
                if (!wixUsers.currentUser.loggedIn) {
                    sendToHtml(component, 'stationStatusResult', {
                        success: false,
                        message: 'You must be logged in to report station status'
                    });
                    return;
                }
                if (!data.stationId) {
                    sendToHtml(component, 'stationStatusResult', {
                        success: false,
                        message: 'Station ID is required'
                    });
                    return;
                }
                if (!data.reportType) {
                    sendToHtml(component, 'stationStatusResult', {
                        success: false,
                        message: 'Report type (open/closed) is required'
                    });
                    return;
                }
                const report = {
                    driver_id: wixUsers.currentUser.id,
                    report_type: data.reportType,
                    wait_minutes: data.waitMinutes || null,
                    notes: data.details?.join(', ') || ''
                };
                const result = await weighStation.reportStationStatus(data.stationId, report);
                sendToHtml(component, 'stationStatusResult', {
                    success: result.success,
                    message: result.success ? 'Thanks for your report!' : result.error,
                    reportId: result.reportId
                });
                break;
            }

            case 'getDriverBypassServices': {
                if (!wixUsers.currentUser.loggedIn) {
                    sendToHtml(component, 'bypassServicesLoaded', { services: { prepass: false, drivewyze: false } });
                    return;
                }
                const result = await weighStation.getDriverBypassServices(wixUsers.currentUser.id);
                if (result.success) {
                    sendToHtml(component, 'bypassServicesLoaded', { services: result.services || { prepass: false, drivewyze: false } });
                } else {
                    sendToHtml(component, 'bypassServicesLoaded', { services: { prepass: false, drivewyze: false } });
                }
                break;
            }

            case 'saveDriverBypassServices': {
                if (!wixUsers.currentUser.loggedIn) {
                    sendToHtml(component, 'bypassServicesSaved', {
                        success: false,
                        message: 'You must be logged in to save preferences'
                    });
                    return;
                }
                const svcData = { prepass: Boolean(data.prepass), drivewyze: Boolean(data.drivewyze) };
                const result = await weighStation.saveDriverBypassServices(wixUsers.currentUser.id, svcData);
                sendToHtml(component, 'bypassServicesSaved', {
                    success: result.success,
                    message: result.success ? 'Preferences saved' : result.error
                });
                break;
            }

            // Phase 4: Rest Stops
            case 'getReviews': {
                if (!data.locationId) {
                    sendToHtml(component, 'error', { message: 'Location ID is required' });
                    return;
                }
                const locationId = data.locationId === 'all' ? null : data.locationId;
                const result = await restStop.getLocationReviews(locationId, data.options);
                if (result.success) {
                    sendToHtml(component, 'reviewsLoaded', {
                        locationId: data.locationId,
                        reviews: result.reviews,
                        stats: result.stats
                    });
                } else {
                    sendToHtml(component, 'reviewsLoaded', { locationId: data.locationId, reviews: [], stats: null });
                }
                break;
            }

            case 'submitReview': {
                if (!wixUsers.currentUser.loggedIn) {
                    sendToHtml(component, 'reviewSubmitted', { success: false, message: 'Must be logged in' });
                    return;
                }
                const result = await restStop.submitReview(data.locationId, data.reviewData);
                sendToHtml(component, 'reviewSubmitted', {
                    success: result.success,
                    message: result.success ? 'Review submitted successfully' : result.error,
                    review: result.review
                });
                break;
            }

            case 'reportCondition': {
                if (!wixUsers.currentUser.loggedIn) {
                    sendToHtml(component, 'conditionReported', { success: false, message: 'Must be logged in' });
                    return;
                }
                const result = await restStop.submitConditionReport(data.locationId, data.reportData);
                sendToHtml(component, 'conditionReported', {
                    success: result.success,
                    message: result.success ? 'Report submitted' : result.error
                });
                break;
            }

            case 'voteReview': {
                if (!wixUsers.currentUser.loggedIn) return;
                const result = await restStop.voteReview(data.reviewId, data.isHelpful);
                if (result.success) {
                    sendToHtml(component, 'voteRegistered', { reviewId: data.reviewId, helpful_votes: result.helpful_votes });
                }
                break;
            }

            // Phase 5: Weather
            case 'getWeather': {
                const chainLawsResult = await roadCondition.getChainRequirements(data.routePoints || []);
                let alerts = [];
                if (data.routePoints && data.routePoints.length > 0) {
                    const weatherResult = await weather.getRouteWeather(data.routePoints);
                    if (weatherResult.success) alerts = weatherResult.alerts;
                } else {
                    const alertResult = await weather.getAlertsAtLocation(39.31, -120.33);
                    if (alertResult.success) alerts = alertResult.alerts;
                }
                sendToHtml(component, 'weatherResults', {
                    alerts,
                    chainLaws: chainLawsResult.success ? chainLawsResult.requirements : []
                });
                break;
            }

            // Phase 6: Road Conditions
            case 'getRoadConditions': {
                const result = await roadCondition.getRouteConditions(data.routePoints);
                if (result.success) {
                    sendToHtml(component, 'conditionsResults', {
                        conditions: result.conditions,
                        summary: result.summary,
                        restrictions: []
                    });
                } else {
                    sendToHtml(component, 'conditionsResults', { conditions: [], summary: null });
                }
                break;
            }

            case 'getTruckRestrictions': {
                const result = await roadCondition.getTruckRestrictions(data.routePoints, data.truckSpecs);
                if (result.success) {
                    sendToHtml(component, 'restrictionResults', { restrictions: result.restrictions || [] });
                } else {
                    sendToHtml(component, 'restrictionResults', { restrictions: [] });
                }
                break;
            }

            case 'reportRoadCondition': {
                const report = data.report || {};
                if (wixUsers.currentUser.loggedIn) {
                    report.driverId = wixUsers.currentUser.id;
                } else {
                    report.driverId = 'anonymous';
                }
                const result = await roadCondition.reportCondition(report);
                sendToHtml(component, 'roadConditionReported', {
                    success: result.success,
                    reportId: result.reportId
                });
                break;
            }

            case 'verifyConditionReport': {
                if (!wixUsers.currentUser.loggedIn) return;
                await roadCondition.verifyConditionReport(data.reportId, wixUsers.currentUser.id);
                // Silent - no response sent
                break;
            }

            case 'tabSwitch':
            case 'tabChanged':
                // Analytics only - no response
                break;

            default:
                break;
        }
    } catch (error) {
        sendToHtml(component, 'error', {
            message: error.message || 'An unexpected error occurred',
            action: action
        });
    }
}

// =============================================================================
// TEST SUITES
// =============================================================================

describe('Road Utilities Bridge Tests', () => {
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

        test('defines POSSIBLE_HTML_IDS with html4 as primary', () => {
            expect(sourceCode).toContain('#html4');
            expect(sourceCode).toContain('#html1');
        });

        EXPECTED_IMPORTS.forEach(importPath => {
            test(`imports ${importPath}`, () => {
                expect(sourceCode).toContain(importPath);
            });
        });

        test('uses type key protocol (not action)', () => {
            expect(sourceCode).toContain('msg.type');
            expect(sourceCode).toContain("case 'ping'");
            expect(sourceCode).toContain("case 'ready'");
        });

        test('defines sendToHtml helper', () => {
            expect(sourceCode).toMatch(/function sendToHtml/);
        });

        test('defines findHtmlComponent function', () => {
            expect(sourceCode).toMatch(/function findHtmlComponent/);
        });

        test('defines MESSAGE_REGISTRY with inbound and outbound', () => {
            expect(sourceCode).toContain('MESSAGE_REGISTRY');
            expect(sourceCode).toContain('inbound');
            expect(sourceCode).toContain('outbound');
        });

        ALL_ACTIONS.forEach(action => {
            test(`handles '${action}' in switch`, () => {
                expect(sourceCode).toContain(`case '${action}'`);
            });
        });
    });

    // =========================================================================
    // SAFETY CHECKS
    // =========================================================================

    describe('Safety checks', () => {
        test('findHtmlComponent uses try-catch for each ID', () => {
            expect(sourceCode).toMatch(/try\s*\{[\s\S]*?\$w\(htmlId\)/);
        });

        test('sendToHtml checks component exists before postMessage', () => {
            expect(sourceCode).toMatch(/if\s*\(\s*!HTML_COMPONENT\s*\)/);
        });

        test('handleHtmlMessage early returns on missing type', () => {
            expect(sourceCode).toContain('if (!msg || !msg.type) return');
        });
    });

    // =========================================================================
    // HTML COMPONENT DISCOVERY
    // =========================================================================

    describe('HTML component discovery', () => {
        test('finds component with onMessage method', () => {
            const mock$w = jest.fn((id) => {
                if (id === '#html4') return createMockComponent();
                throw new Error('not found');
            });
            const comp = findHtmlComponent(mock$w);
            expect(comp).not.toBeNull();
        });

        test('skips components that throw', () => {
            const mock$w = jest.fn(() => { throw new Error('skip'); });
            const comp = findHtmlComponent(mock$w);
            expect(comp).toBeNull();
        });

        test('tries all possible IDs', () => {
            const mock$w = jest.fn(() => { throw new Error('skip'); });
            findHtmlComponent(mock$w);
            expect(mock$w).toHaveBeenCalledTimes(6);
        });

        test('returns first component found', () => {
            const mock$w = jest.fn((id) => {
                if (id === '#html4' || id === '#html1') return createMockComponent();
                throw new Error('not found');
            });
            const comp = findHtmlComponent(mock$w);
            expect(comp).not.toBeNull();
            // html4 is first in the list, should be returned
            expect(mock$w).toHaveBeenCalledWith('#html4');
        });
    });

    // =========================================================================
    // MESSAGE ROUTING - Utility
    // =========================================================================

    describe('Message routing - Utility', () => {
        test('ping sends pong with timestamp', async () => {
            await routeMessage(component, { type: 'ping' });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'pong',
                    data: expect.objectContaining({ timestamp: expect.any(Number) })
                })
            );
        });

        test('ready sends init with config', async () => {
            await routeMessage(component, { type: 'ready' });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'init',
                    data: expect.objectContaining({
                        isLoggedIn: true,
                        userId: 'user-123',
                        defaultLocation: DEFAULT_LOCATION,
                        initialTab: 'dashboard'
                    })
                })
            );
        });
    });

    // =========================================================================
    // MESSAGE ROUTING - Phase 1: Parking
    // =========================================================================

    describe('Message routing - Parking', () => {
        test('searchParking calls parkingService and sends parkingResults', async () => {
            await routeMessage(component, { type: 'searchParking', data: { lat: 35.15, lng: -90.05, radius: 25 } });
            expect(mockParkingService.searchParking).toHaveBeenCalledWith(35.15, -90.05, 25, {});
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'parkingResults',
                    data: expect.objectContaining({ items: expect.any(Array) })
                })
            );
        });

        test('searchParking uses default location when coords missing', async () => {
            await routeMessage(component, { type: 'searchParking', data: {} });
            expect(mockParkingService.searchParking).toHaveBeenCalledWith(
                DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lng, 25, {}
            );
        });

        test('getParkingDetails calls parkingService and sends parkingDetails', async () => {
            await routeMessage(component, { type: 'getParkingDetails', data: { locationId: 'loc-1' } });
            expect(mockParkingService.getParkingDetails).toHaveBeenCalledWith('loc-1');
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'parkingDetails',
                    data: expect.objectContaining({ item: expect.any(Object) })
                })
            );
        });

        test('getParkingDetails sends error when locationId missing', async () => {
            await routeMessage(component, { type: 'getParkingDetails', data: {} });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'error',
                    data: expect.objectContaining({ message: 'Location ID is required' })
                })
            );
        });

        test('reportParking calls reportParkingAvailability and sends reportResult', async () => {
            await routeMessage(component, { type: 'reportParking', data: { locationId: 'loc-1', spacesAvailable: '20', notes: 'Quiet lot' } });
            expect(mockParkingService.reportParkingAvailability).toHaveBeenCalledWith('loc-1', expect.objectContaining({
                driver_id: 'user-123',
                spaces_available: 20,
                notes: 'Quiet lot'
            }));
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'reportResult',
                    data: expect.objectContaining({ success: true, reportId: 'rpt-1' })
                })
            );
        });

        test('reportParking requires login', async () => {
            await routeMessage(component, { type: 'reportParking', data: { locationId: 'loc-1' } }, {}, mockWixUsersLoggedOut);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'error',
                    data: expect.objectContaining({ message: expect.stringContaining('logged in') })
                })
            );
        });
    });

    // =========================================================================
    // MESSAGE ROUTING - Phase 2: Fuel
    // =========================================================================

    describe('Message routing - Fuel', () => {
        test('searchFuel calls searchFuelPrices and sends fuelResults', async () => {
            await routeMessage(component, { type: 'searchFuel', data: { lat: 35, lng: -90, radius: 50, fuelCardType: 'comdata' } });
            expect(mockFuelService.searchFuelPrices).toHaveBeenCalledWith(35, -90, 50, { fuelType: 'diesel', cardType: 'comdata' });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'fuelResults',
                    data: expect.objectContaining({ items: expect.any(Array) })
                })
            );
        });

        test('searchFuel maps card acceptance correctly', async () => {
            await routeMessage(component, { type: 'searchFuel', data: { fuelCardType: 'comdata' } });
            const sentData = component.postMessage.mock.calls[0][0];
            expect(sentData.data.items[0].accepts_card).toBe(true);
            expect(sentData.data.items[0].card_type).toBe('COMDATA');
        });

        test('linkFuelCard calls linkFuelCard and sends fuelCardLinked', async () => {
            await routeMessage(component, { type: 'linkFuelCard', data: { cardType: 'efs', cardLast4: '5678' } });
            expect(mockFuelService.linkFuelCard).toHaveBeenCalledWith('user-123', expect.objectContaining({
                card_type: 'efs',
                card_last4: '5678'
            }));
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'fuelCardLinked',
                    data: expect.objectContaining({ success: true })
                })
            );
        });

        test('linkFuelCard requires login', async () => {
            await routeMessage(component, { type: 'linkFuelCard', data: { cardType: 'efs' } }, {}, mockWixUsersLoggedOut);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'error',
                    data: expect.objectContaining({ message: expect.stringContaining('logged in') })
                })
            );
        });

        test('linkFuelCard requires cardType', async () => {
            await routeMessage(component, { type: 'linkFuelCard', data: {} });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'error',
                    data: expect.objectContaining({ message: 'Card type is required' })
                })
            );
        });

        test('getDriverFuelCards sends cards when logged in', async () => {
            await routeMessage(component, { type: 'getDriverFuelCards' });
            expect(mockFuelService.getDriverFuelCards).toHaveBeenCalledWith('user-123');
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'fuelCardsLoaded',
                    data: expect.objectContaining({ cards: expect.any(Array) })
                })
            );
        });

        test('getDriverFuelCards sends empty array when logged out', async () => {
            await routeMessage(component, { type: 'getDriverFuelCards' }, {}, mockWixUsersLoggedOut);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'fuelCardsLoaded',
                    data: { cards: [] }
                })
            );
        });

        test('calculateSavings calls calculateFuelSavings and sends savingsResult', async () => {
            await routeMessage(component, { type: 'calculateSavings', data: { gallons: 200, cardType: 'comdata' } });
            expect(mockFuelService.calculateFuelSavings).toHaveBeenCalledWith('user-123', expect.objectContaining({ gallons: 200 }));
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'savingsResult',
                    data: expect.objectContaining({ success: true, totalSavings: 42.50 })
                })
            );
        });
    });

    // =========================================================================
    // MESSAGE ROUTING - Phase 3: Weigh Stations
    // =========================================================================

    describe('Message routing - Weigh Stations', () => {
        test('searchWeighStations calls service and sends weighStationResults', async () => {
            await routeMessage(component, { type: 'searchWeighStations', data: { lat: 35, lng: -90, radius: 100, state: 'TN' } });
            expect(mockWeighStationService.searchWeighStations).toHaveBeenCalledWith(35, -90, 100, expect.objectContaining({ state: 'TN' }));
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'weighStationResults',
                    data: expect.objectContaining({ items: expect.any(Array) })
                })
            );
        });

        test('getStationStatus calls service and sends stationStatusResult', async () => {
            await routeMessage(component, { type: 'getStationStatus', data: { stationId: 'WS1' } });
            expect(mockWeighStationService.getStationStatus).toHaveBeenCalledWith('WS1');
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'stationStatusResult',
                    data: expect.objectContaining({ station: expect.any(Object) })
                })
            );
        });

        test('getStationStatus sends error when stationId missing', async () => {
            await routeMessage(component, { type: 'getStationStatus', data: {} });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'error',
                    data: expect.objectContaining({ message: 'Station ID is required' })
                })
            );
        });

        test('reportStationStatus calls service and sends stationStatusResult', async () => {
            await routeMessage(component, {
                type: 'reportStationStatus',
                data: { stationId: 'WS1', reportType: 'open', waitMinutes: 10, details: ['no line'] }
            });
            expect(mockWeighStationService.reportStationStatus).toHaveBeenCalledWith('WS1', expect.objectContaining({
                driver_id: 'user-123',
                report_type: 'open',
                wait_minutes: 10
            }));
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'stationStatusResult',
                    data: expect.objectContaining({ success: true })
                })
            );
        });

        test('reportStationStatus requires login', async () => {
            await routeMessage(component, { type: 'reportStationStatus', data: { stationId: 'WS1', reportType: 'open' } }, {}, mockWixUsersLoggedOut);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'stationStatusResult',
                    data: expect.objectContaining({ success: false, message: expect.stringContaining('logged in') })
                })
            );
        });

        test('reportStationStatus requires stationId', async () => {
            await routeMessage(component, { type: 'reportStationStatus', data: { reportType: 'open' } });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'stationStatusResult',
                    data: expect.objectContaining({ success: false, message: expect.stringContaining('Station ID') })
                })
            );
        });

        test('reportStationStatus requires reportType', async () => {
            await routeMessage(component, { type: 'reportStationStatus', data: { stationId: 'WS1' } });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'stationStatusResult',
                    data: expect.objectContaining({ success: false, message: expect.stringContaining('Report type') })
                })
            );
        });

        test('getDriverBypassServices sends services when logged in', async () => {
            await routeMessage(component, { type: 'getDriverBypassServices' });
            expect(mockWeighStationService.getDriverBypassServices).toHaveBeenCalledWith('user-123');
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'bypassServicesLoaded',
                    data: expect.objectContaining({ services: { prepass: true, drivewyze: false } })
                })
            );
        });

        test('getDriverBypassServices sends defaults when logged out', async () => {
            await routeMessage(component, { type: 'getDriverBypassServices' }, {}, mockWixUsersLoggedOut);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'bypassServicesLoaded',
                    data: { services: { prepass: false, drivewyze: false } }
                })
            );
        });

        test('saveDriverBypassServices calls service and sends bypassServicesSaved', async () => {
            await routeMessage(component, { type: 'saveDriverBypassServices', data: { prepass: true, drivewyze: true } });
            expect(mockWeighStationService.saveDriverBypassServices).toHaveBeenCalledWith('user-123', { prepass: true, drivewyze: true });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'bypassServicesSaved',
                    data: expect.objectContaining({ success: true })
                })
            );
        });

        test('saveDriverBypassServices requires login', async () => {
            await routeMessage(component, { type: 'saveDriverBypassServices', data: { prepass: true } }, {}, mockWixUsersLoggedOut);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'bypassServicesSaved',
                    data: expect.objectContaining({ success: false })
                })
            );
        });
    });

    // =========================================================================
    // MESSAGE ROUTING - Phase 4: Rest Stops
    // =========================================================================

    describe('Message routing - Rest Stops', () => {
        test('getReviews calls getLocationReviews and sends reviewsLoaded', async () => {
            await routeMessage(component, { type: 'getReviews', data: { locationId: 'loc-1', options: { sort: 'rating' } } });
            expect(mockRestStopService.getLocationReviews).toHaveBeenCalledWith('loc-1', { sort: 'rating' });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'reviewsLoaded',
                    data: expect.objectContaining({ reviews: expect.any(Array), stats: expect.any(Object) })
                })
            );
        });

        test('getReviews with locationId "all" passes null to service', async () => {
            await routeMessage(component, { type: 'getReviews', data: { locationId: 'all' } });
            expect(mockRestStopService.getLocationReviews).toHaveBeenCalledWith(null, undefined);
        });

        test('getReviews sends error when locationId missing', async () => {
            await routeMessage(component, { type: 'getReviews', data: {} });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'error',
                    data: expect.objectContaining({ message: 'Location ID is required' })
                })
            );
        });

        test('submitReview calls submitReview and sends reviewSubmitted', async () => {
            await routeMessage(component, {
                type: 'submitReview',
                data: { locationId: 'loc-1', reviewData: { rating: 4, review_text: 'Great stop' } }
            });
            expect(mockRestStopService.submitReview).toHaveBeenCalledWith('loc-1', { rating: 4, review_text: 'Great stop' });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'reviewSubmitted',
                    data: expect.objectContaining({ success: true })
                })
            );
        });

        test('submitReview requires login', async () => {
            await routeMessage(component, { type: 'submitReview', data: { locationId: 'loc-1', reviewData: {} } }, {}, mockWixUsersLoggedOut);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'reviewSubmitted',
                    data: expect.objectContaining({ success: false, message: 'Must be logged in' })
                })
            );
        });

        test('reportCondition calls submitConditionReport and sends conditionReported', async () => {
            await routeMessage(component, {
                type: 'reportCondition',
                data: { locationId: 'loc-1', reportData: { reportType: 'cleanliness' } }
            });
            expect(mockRestStopService.submitConditionReport).toHaveBeenCalledWith('loc-1', { reportType: 'cleanliness' });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'conditionReported',
                    data: expect.objectContaining({ success: true })
                })
            );
        });

        test('reportCondition requires login', async () => {
            await routeMessage(component, { type: 'reportCondition', data: {} }, {}, mockWixUsersLoggedOut);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'conditionReported',
                    data: expect.objectContaining({ success: false })
                })
            );
        });

        test('voteReview calls voteReview and sends voteRegistered', async () => {
            await routeMessage(component, { type: 'voteReview', data: { reviewId: 'rev1', isHelpful: true } });
            expect(mockRestStopService.voteReview).toHaveBeenCalledWith('rev1', true);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'voteRegistered',
                    data: expect.objectContaining({ reviewId: 'rev1', helpful_votes: 5 })
                })
            );
        });

        test('voteReview does nothing when logged out', async () => {
            await routeMessage(component, { type: 'voteReview', data: { reviewId: 'rev1', isHelpful: true } }, {}, mockWixUsersLoggedOut);
            expect(component.postMessage).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // MESSAGE ROUTING - Phase 5: Weather
    // =========================================================================

    describe('Message routing - Weather', () => {
        test('getWeather with routePoints calls getRouteWeather and sends weatherResults', async () => {
            const routePoints = [{ lat: 39.31, lng: -120.33 }, { lat: 39.5, lng: -120.5 }];
            await routeMessage(component, { type: 'getWeather', data: { routePoints } });
            expect(mockRoadConditionService.getChainRequirements).toHaveBeenCalledWith(routePoints);
            expect(mockWeatherService.getRouteWeather).toHaveBeenCalledWith(routePoints);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'weatherResults',
                    data: expect.objectContaining({
                        alerts: expect.any(Array),
                        chainLaws: expect.any(Array)
                    })
                })
            );
        });

        test('getWeather without routePoints calls getAlertsAtLocation (Donner Pass default)', async () => {
            await routeMessage(component, { type: 'getWeather', data: {} });
            expect(mockWeatherService.getAlertsAtLocation).toHaveBeenCalledWith(39.31, -120.33);
            expect(mockWeatherService.getRouteWeather).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // MESSAGE ROUTING - Phase 6: Road Conditions
    // =========================================================================

    describe('Message routing - Road Conditions', () => {
        test('getRoadConditions calls getRouteConditions and sends conditionsResults', async () => {
            const routePoints = [{ lat: 35, lng: -90 }];
            await routeMessage(component, { type: 'getRoadConditions', data: { routePoints } });
            expect(mockRoadConditionService.getRouteConditions).toHaveBeenCalledWith(routePoints);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'conditionsResults',
                    data: expect.objectContaining({
                        conditions: expect.any(Array),
                        summary: expect.any(Object)
                    })
                })
            );
        });

        test('getTruckRestrictions calls getTruckRestrictions and sends restrictionResults', async () => {
            const routePoints = [{ lat: 39.6, lng: -105.9 }];
            const truckSpecs = { height: 13.5, weight: 80, hazmat: false };
            await routeMessage(component, { type: 'getTruckRestrictions', data: { routePoints, truckSpecs } });
            expect(mockRoadConditionService.getTruckRestrictions).toHaveBeenCalledWith(routePoints, truckSpecs);
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'restrictionResults',
                    data: expect.objectContaining({ restrictions: expect.any(Array) })
                })
            );
        });

        test('reportRoadCondition calls reportCondition and sends roadConditionReported', async () => {
            const report = { type: 'construction', highway: 'I-40' };
            await routeMessage(component, { type: 'reportRoadCondition', data: { report } });
            expect(mockRoadConditionService.reportCondition).toHaveBeenCalledWith(expect.objectContaining({
                type: 'construction',
                highway: 'I-40',
                driverId: 'user-123'
            }));
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'roadConditionReported',
                    data: expect.objectContaining({ success: true, reportId: 'rc-1' })
                })
            );
        });

        test('reportRoadCondition sets anonymous driverId when logged out', async () => {
            const report = { type: 'accident', highway: 'I-10' };
            await routeMessage(component, { type: 'reportRoadCondition', data: { report } }, {}, mockWixUsersLoggedOut);
            expect(mockRoadConditionService.reportCondition).toHaveBeenCalledWith(expect.objectContaining({
                driverId: 'anonymous'
            }));
        });

        test('verifyConditionReport calls service silently', async () => {
            await routeMessage(component, { type: 'verifyConditionReport', data: { reportId: 'rc-1' } });
            expect(mockRoadConditionService.verifyConditionReport).toHaveBeenCalledWith('rc-1', 'user-123');
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('verifyConditionReport does nothing when logged out', async () => {
            await routeMessage(component, { type: 'verifyConditionReport', data: { reportId: 'rc-1' } }, {}, mockWixUsersLoggedOut);
            expect(mockRoadConditionService.verifyConditionReport).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // MESSAGE ROUTING - Edge Cases
    // =========================================================================

    describe('Message routing - Edge cases', () => {
        test('ignores messages with no type', async () => {
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

        test('unknown type does not crash', async () => {
            await routeMessage(component, { type: 'unknownAction', data: {} });
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('tabSwitch does not send response', async () => {
            await routeMessage(component, { type: 'tabSwitch', data: { tab: 'fuel' } });
            expect(component.postMessage).not.toHaveBeenCalled();
        });

        test('tabChanged (alias) does not send response', async () => {
            await routeMessage(component, { type: 'tabChanged', data: { tab: 'parking' } });
            expect(component.postMessage).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // ERROR HANDLING
    // =========================================================================

    describe('Error handling', () => {
        test('searchParking failure sends error', async () => {
            const failParking = { ...mockParkingService, searchParking: jest.fn().mockRejectedValue(new Error('Parking DB error')) };
            await routeMessage(component, { type: 'searchParking', data: {} }, { parking: failParking });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'error',
                    data: expect.objectContaining({ message: 'Parking DB error' })
                })
            );
        });

        test('searchFuel failure sends error', async () => {
            const failFuel = { ...mockFuelService, searchFuelPrices: jest.fn().mockRejectedValue(new Error('Fuel API down')) };
            await routeMessage(component, { type: 'searchFuel', data: {} }, { fuel: failFuel });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'error',
                    data: expect.objectContaining({ message: 'Fuel API down' })
                })
            );
        });

        test('searchWeighStations failure sends error', async () => {
            const failWS = { ...mockWeighStationService, searchWeighStations: jest.fn().mockRejectedValue(new Error('WS error')) };
            await routeMessage(component, { type: 'searchWeighStations', data: {} }, { weighStation: failWS });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'error',
                    data: expect.objectContaining({ message: 'WS error' })
                })
            );
        });

        test('getRoadConditions failure sends error', async () => {
            const failRC = { ...mockRoadConditionService, getRouteConditions: jest.fn().mockRejectedValue(new Error('Condition error')) };
            await routeMessage(component, { type: 'getRoadConditions', data: { routePoints: [] } }, { roadCondition: failRC });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'error',
                    data: expect.objectContaining({ message: 'Condition error' })
                })
            );
        });

        test('getWeather failure sends error', async () => {
            const failRC = { ...mockRoadConditionService, getChainRequirements: jest.fn().mockRejectedValue(new Error('Weather service down')) };
            await routeMessage(component, { type: 'getWeather', data: {} }, { roadCondition: failRC });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'error',
                    data: expect.objectContaining({ message: 'Weather service down' })
                })
            );
        });

        test('submitReview failure sends error', async () => {
            const failRS = { ...mockRestStopService, submitReview: jest.fn().mockRejectedValue(new Error('Review error')) };
            await routeMessage(component, { type: 'submitReview', data: { locationId: 'loc-1', reviewData: {} } }, { restStop: failRS });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'error',
                    data: expect.objectContaining({ message: 'Review error' })
                })
            );
        });

        test('getTruckRestrictions failure sends error', async () => {
            const failRC = { ...mockRoadConditionService, getTruckRestrictions: jest.fn().mockRejectedValue(new Error('Restriction error')) };
            await routeMessage(component, { type: 'getTruckRestrictions', data: { routePoints: [], truckSpecs: {} } }, { roadCondition: failRC });
            expect(component.postMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    type: 'error',
                    data: expect.objectContaining({ message: 'Restriction error' })
                })
            );
        });
    });

    // =========================================================================
    // SAFE SEND UTILITY
    // =========================================================================

    describe('sendToHtml utility', () => {
        test('does nothing if component is null', () => {
            expect(() => sendToHtml(null, 'test', {})).not.toThrow();
        });

        test('does nothing if component has no postMessage', () => {
            expect(() => sendToHtml({}, 'test', {})).not.toThrow();
        });

        test('calls postMessage with type/data envelope', () => {
            sendToHtml(component, 'parkingResults', { items: [] });
            expect(component.postMessage).toHaveBeenCalledWith({ type: 'parkingResults', data: { items: [] } });
        });

        test('does not throw if postMessage throws', () => {
            const throwingComponent = {
                postMessage: jest.fn(() => { throw new Error('Detached'); })
            };
            expect(() => sendToHtml(throwingComponent, 'test', {})).not.toThrow();
        });
    });

    // =========================================================================
    // BACKEND SERVICE CALL VERIFICATION
    // =========================================================================

    describe('Backend service call verification', () => {
        test('searchParking only calls searchParking once', async () => {
            await routeMessage(component, { type: 'searchParking', data: { lat: 35, lng: -90 } });
            expect(mockParkingService.searchParking).toHaveBeenCalledTimes(1);
        });

        test('getWeather calls both getChainRequirements and weather service', async () => {
            await routeMessage(component, { type: 'getWeather', data: { routePoints: [{ lat: 39, lng: -120 }] } });
            expect(mockRoadConditionService.getChainRequirements).toHaveBeenCalledTimes(1);
            expect(mockWeatherService.getRouteWeather).toHaveBeenCalledTimes(1);
        });

        test('calculateSavings passes trip details through correctly', async () => {
            await routeMessage(component, {
                type: 'calculateSavings',
                data: { gallons: 300, currentPrice: 3.50, cardType: 'comdata', stateAverage: 3.60 }
            });
            expect(mockFuelService.calculateFuelSavings).toHaveBeenCalledWith('user-123', {
                gallons: 300,
                currentPrice: 3.50,
                cardType: 'comdata',
                stateAverage: 3.60
            });
        });
    });
});
