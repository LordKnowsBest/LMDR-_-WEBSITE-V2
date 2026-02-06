import { currentMember } from 'wix-members-backend';
import * as fleetService from 'backend/fleetService';
import * as equipmentService from 'backend/equipmentService';
import * as scorecardService from 'backend/driverScorecardService';
import * as capacityService from 'backend/capacityPlanningService';
import * as eldService from 'backend/eldIntegrationService';

/**
 * CARRIER FLEET DASHBOARD - UNIFIED PAGE CODE
 * This script handles the bridge between Wix and the Fleet Dashboard HTML components.
 */

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

$w.onReady(async function () {
    try {
        const member = await currentMember.getMember({ fieldsets: ['FULL'] });
        const carrierDot = member?.contactDetails?.customFields?.carrier_dot;

        if (!carrierDot) {
            console.error('[FleetDashboard] No carrier DOT found for current member');
            // Handle unauthorized or missing DOT
            return;
        }

        // Initialize all found components
        HTML_COMPONENT_IDS.forEach(id => {
            const el = $w(id);
            if (el && typeof el.onMessage === 'function') {
                el.onMessage((event) => routeMessage(el, event?.data, carrierDot));
                // Signal component that bridge is ready
                safeSend(el, { action: 'init' });
            }
        });

    } catch (error) {
        console.error('[FleetDashboard] Init failed:', error.message);
    }
});

/**
 * Route messages from HTML components to backend services
 */
async function routeMessage(component, message, carrierDot) {
    if (!message || !message.action) return;

    const { action, payload } = message;

    try {
        switch (action) {
            // --- Driver Roster ---
            case 'getDrivers':
                const drivers = await fleetService.getFleetDrivers(carrierDot, payload);
                safeSend(component, { action: 'driversLoaded', payload: drivers });
                break;
            case 'getAlerts':
                const alerts = await fleetService.getExpiringCredentials(carrierDot);
                safeSend(component, { action: 'alertsLoaded', payload: { alerts } });
                break;
            case 'addDriver':
                const newDriver = await fleetService.addFleetDriver(carrierDot, payload.driverData);
                safeSend(component, { action: 'driverAdded', payload: newDriver });
                break;

            // --- Equipment Manager ---
            case 'getEquipment':
                const equip = await equipmentService.getEquipmentList(carrierDot, payload);
                safeSend(component, { action: 'equipmentLoaded', payload: equip });
                break;
            case 'getAssetDetails':
                const asset = await equipmentService.getEquipmentDetails(payload.equipmentId);
                const history = await equipmentService.getAssignmentHistory(payload.equipmentId);
                safeSend(component, { action: 'assetDetailsLoaded', payload: { asset, history } });
                break;
            case 'assignEquipment':
                const assignment = await equipmentService.assignEquipment(payload.equipmentId, payload.driverId, payload.type);
                safeSend(component, { action: 'assignmentSuccess', payload: assignment });
                break;
            case 'unassignEquipment':
                await equipmentService.unassignEquipment(payload.equipmentId);
                safeSend(component, { action: 'assignmentSuccess' });
                break;

            // --- Scorecard ---
            case 'getScorecard':
                const scorecard = await scorecardService.getDriverScorecard(payload.driverId, payload.periodType);
                const trend = await scorecardService.getDriverTrend(payload.driverId);
                safeSend(component, { action: 'scorecardLoaded', payload: { scorecard, trend } });
                break;
            case 'getFleetSummary':
                const summary = await scorecardService.getFleetScoreboardSummary(carrierDot, payload.periodType);
                safeSend(component, { action: 'summaryLoaded', payload: { summary } });
                break;
            case 'getRankings':
                const rankings = await scorecardService.getPerformanceRankings(carrierDot, payload.category, payload.limit);
                safeSend(component, { action: 'rankingsLoaded', payload: { rankings } });
                break;

            // --- Capacity Planning ---
            case 'getCapacityOverview':
                const capOverview = await capacityService.getCapacityOverview(carrierDot, payload.period);
                safeSend(component, { action: 'overviewLoaded', payload: { overview: capOverview } });
                break;
            case 'getDailyBreakdown':
                // For simplicity, we calculate today's and fetch recent ones
                const breakdown = await capacityService.getDailyBreakdown(carrierDot, payload.startDate, payload.endDate);
                safeSend(component, { action: 'breakdownLoaded', payload: { breakdown } });
                break;
            case 'getRecommendations':
                const recs = await capacityService.generateCapacityRecommendations(carrierDot);
                safeSend(component, { action: 'recommendationsLoaded', payload: { recommendations: recs } });
                break;

            // --- ELD / Map ---
            case 'getFleetLocations':
                const locations = await eldService.getFleetLocations(carrierDot);
                safeSend(component, { action: 'locationsLoaded', payload: { locations } });
                break;

            default:
                console.warn(`[FleetDashboard] Unknown action: ${action}`);
        }
    } catch (error) {
        console.error(`[FleetDashboard] Error handling ${action}:`, error.message);
        safeSend(component, { action: 'actionError', message: error.message });
    }
}

/**
 * Send message to HTML component with safety check
 */
function safeSend(component, data) {
    try {
        if (component && typeof component.postMessage === 'function') {
            component.postMessage(data);
        }
    } catch (e) {
        // Component might be detached
    }
}
