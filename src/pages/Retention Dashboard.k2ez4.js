import { getCarrierRetentionDashboard } from 'backend/retentionService.jsw';
import wixUsers from 'wix-users';

/**
 * RETENTION COMMAND CENTER v3.0 - Velo Page Code
 * 
 * ARCHITECTURE NOTE:
 * This page code is now a "thin client". 
 * All complex logic (ROI, Silence Signal detection, Risk Scoring) 
 * has been moved to the secure backend service: 'backend/retentionService.jsw'.
 */

$w.onReady(async function () {
    const htmlComponent = $w('#retentionDashboard');

    async function loadRetentionIntelligence() {
        try {
            console.log("🚀 Loading Retention Command Center...");

            // Get current user's carrier context (mocking '12345' if not set)
            // In production, you would fetch the user's linked DOT number
            const carrierDot = '12345';

            // CALL BACKEND SERVICE
            // This returns the fully processed "Prevention Engine" data
            const dashboardData = await getCarrierRetentionDashboard(carrierDot);

            if (dashboardData.success) {
                // Add Visualization Data (Survival Curve)
                // This visualization data could also be moved to backend if dynamic
                dashboardData.survivalCohort = [100, 98, 85, 82, 78, 75, 68]; // Matching the "Day 14" insight

                // SEND TO HTML COMPONENT
                htmlComponent.postMessage({
                    type: 'updateRetentionDashboard',
                    data: dashboardData
                });
                console.log("✅ Dashboard Data Sent to HTML Component");
            }
        } catch (error) {
            console.error('❌ Retention Dashboard Data Error:', error);
        }
    }

    // Initialize
    loadRetentionIntelligence();

    // Listen for refresh requests
    htmlComponent.onMessage((event) => {
        if (event.data.type === 'retentionDashboardReady' || event.data.type === 'refresh') {
            loadRetentionIntelligence();
        }
    });
});
