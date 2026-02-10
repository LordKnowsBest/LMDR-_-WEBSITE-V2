// Checkout.kbyzk.js
// Page Code for the Checkout Page

import wixLocation from 'wix-location';
import { createPlacementDepositCheckout, getPublishableKey } from 'backend/stripeService';
import { getLeadDetails } from 'backend/carrierLeadsService'; // Need to ensure this exists or create it

$w.onReady(async function () {
    console.log('Checkout Page Loaded');

    // 1. Get query parameters
    const query = wixLocation.query;
    const leadId = query.id;

    if (!leadId) {
        console.error('No lead ID provided');
        $w('#errorMessage').text = "Invalid checkout link. Please contact support.";
        $w('#errorMessage').show();
        return;
    }

    // 2. Fetch Lead Details
    try {
        const lead = await getLeadDetails(leadId);
        if (!lead) {
            throw new Error('Lead not found');
        }

        // 3. Initialize Checkout
        // We need to create a session if one doesn't exist, or retrieve the key
        // For simplicity, we'll re-create the session or use the one we have
        // But for this UI, we just need the Publishable Key and Session ID

        // We'll call a backend function to get the config for the frontend
        const checkoutConfig = await getCheckoutConfig(lead);

        // 4. Initialize HTML Component
        const htmlComponent = $w('#checkoutHtml'); // Ensure this ID matches your Velo setup

        htmlComponent.onMessage((event) => {
            if (event.data.type === 'checkoutReady') {
                htmlComponent.postMessage({
                    type: 'initCheckout',
                    data: {
                        publishableKey: checkoutConfig.publishableKey,
                        sessionId: checkoutConfig.sessionId,
                        driverCount: lead.driversNeeded,
                        formattedAmount: checkoutConfig.formattedAmount
                    }
                });
            }
        });

    } catch (error) {
        console.error('Checkout Initialization Error', error);
        $w('#errorMessage').text = "Unable to load checkout. Please try again.";
        $w('#errorMessage').show();
    }
});

// Helper to get checkout configuration (Move to backend if needed for security, 
// but stripeService.createPlacementDepositCheckout already handles the secret logic)
async function getCheckoutConfig(lead) {
    // 1. Get Publishable Key
    const keyResult = await getPublishableKey();
    if (!keyResult.success) throw new Error('Failed to load payment system');

    // 2. Create or Get Session
    // We assume we create a new session for this view to ensure it's fresh
    // Ideally we check if one exists in CarrierPayments, but for now we create a new one
    // to guarantee it works. Redirect flow is handled by Stripe.

    // We need to map lead data to checkout params
    const driverCount = parseInt(lead.driversNeeded) || 1;

    const sessionResult = await createPlacementDepositCheckout(
        lead.companyName, // Using Company Name as ID surrogate if DOT is missing, but ideally DOT
        lead.email,
        driverCount,
        wixLocation.baseUrl + '/payment-success',
        wixLocation.url, // Cancel URL is this page
        {
            leadId: lead._id,
            companyName: lead.companyName,
            contactName: lead.contactName,
            phone: lead.phone
        }
    );

    if (!sessionResult.success) {
        throw new Error(sessionResult.error);
    }

    return {
        publishableKey: keyResult.publishableKey,
        sessionId: sessionResult.sessionId,
        formattedAmount: `$${(driverCount * 100).toFixed(2)}` // derived knowledge of $100/driver
    };
}
