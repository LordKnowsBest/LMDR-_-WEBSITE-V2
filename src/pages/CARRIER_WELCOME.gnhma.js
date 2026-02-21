/**
 * Carrier Welcome Page
 * Onboarding page for new carriers - personalized welcome, setup wizard, quick wins
 *
 * Supports two entry paths:
 * 1. Post-checkout: /carrier-welcome?plan=enterprise (or pro)
 * 2. Post-intake: /carrier-welcome?dot=1234567
 *
 * Broadcasts carrier context to all HTML components via PostMessage.
 */

import wixLocation from 'wix-location';
import { currentMember } from 'wix-members-frontend';
import { getCarrierByDOT } from 'backend/recruiter_service';
import { getCarrierOnboardingStatus } from 'backend/carrierStatusService';

$w.onReady(async function () {
  console.log('Carrier Welcome page initialized');

  const dotNumber = wixLocation.query.dot || null;
  const plan = wixLocation.query.plan || null;

  // Try to get logged-in member info
  let member = null;
  try {
    member = await currentMember.getMember();
  } catch (e) {
    console.log('No logged-in member');
  }

  // Build carrier context from available data
  const carrierContext = {
    plan: plan || 'pro',
    dotNumber: dotNumber || null,
    memberName: member?.contactDetails?.firstName || null,
    memberEmail: member?.loginEmail || null,
    companyName: null,
    city: null,
    state: null,
    fleetSize: null
  };

  let onboardingStatus = null;

  // If we have a DOT number, load carrier details
  if (dotNumber) {
    try {
      const [carrier, statusRes] = await Promise.all([
        getCarrierByDOT(dotNumber),
        getCarrierOnboardingStatus(dotNumber)
      ]);

      if (carrier) {
        carrierContext.companyName = carrier.legal_name || null;
        carrierContext.city = carrier.city || null;
        carrierContext.state = carrier.state || null;
        carrierContext.fleetSize = carrier.fleet_size || null;
      }

      if (statusRes.success) {
        onboardingStatus = statusRes.status;
      }
    } catch (e) {
      console.error('Failed to load carrier data or status:', e);
    }
  }

  // Update native Wix elements if they exist
  updateWelcomeElements(carrierContext);

  // Broadcast to all HTML components and set up handlers
  broadcastToHtmlComponents(carrierContext, onboardingStatus);
});

/**
 * Update native Wix elements on the page
 */
function updateWelcomeElements(ctx) {
  try {
    const title = $w('#welcomeTitle');
    if (title.rendered) {
      if (ctx.companyName) {
        title.text = `Welcome, ${ctx.companyName}!`;
      } else if (ctx.memberName) {
        title.text = `Welcome, ${ctx.memberName}!`;
      } else {
        title.text = 'Welcome to VelocityMatch!';
      }
    }
  } catch (e) { /* Element may not exist */ }

  try {
    const subtitle = $w('#welcomeSubtitle');
    if (subtitle.rendered) {
      const planLabel = ctx.plan === 'enterprise' ? 'Enterprise' : 'Pro';
      subtitle.text = `Your ${planLabel} subscription is active. Let's set up your account.`;
    }
  } catch (e) { /* Element may not exist */ }

  try {
    const location = $w('#carrierLocation');
    if (location.rendered && ctx.city && ctx.state) {
      location.text = `${ctx.city}, ${ctx.state}`;
    }
  } catch (e) { /* Element may not exist */ }

  try {
    const fleetSize = $w('#fleetSizeDisplay');
    if (fleetSize.rendered && ctx.fleetSize) {
      fleetSize.text = `${ctx.fleetSize} trucks`;
    }
  } catch (e) { /* Element may not exist */ }
}

/**
 * Broadcast carrier context to all HTML components and handle messages
 */
function broadcastToHtmlComponents(carrierContext, onboardingStatus) {
  const possibleIds = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlComponent', '#onboardingChecklist', '#quickWinsHtml'];
  const htmlComponents = [];

  for (const id of possibleIds) {
    try {
      const component = $w(id);
      if (component.rendered && typeof component.onMessage === 'function') {
        htmlComponents.push({ id, component });
        console.log(`Carrier welcome handler attached to ${id}`);
      }
    } catch (e) {
      // Component doesn't exist
    }
  }

  if (htmlComponents.length === 0) {
    console.log('No HTML components found on carrier welcome page');
    return;
  }

  const payload = {
    type: 'carrierWelcomeData',
    data: carrierContext
  };

  const statusPayload = onboardingStatus ? {
    type: 'loadStatus',
    data: { status: onboardingStatus }
  } : null;

  for (const { id, component } of htmlComponents) {
    // Handle messages from HTML
    component.onMessage(async (event) => {
      const msg = event.data;
      if (!msg || !msg.type) return;

      console.log(`Carrier welcome [${id}] received:`, msg.type);

      // Navigation messages
      if (msg.type === 'navigateToIntake') {
        const intakeUrl = carrierContext.dotNumber
          ? `/trucking-companies?dot=${carrierContext.dotNumber}`
          : '/trucking-companies';
        wixLocation.to(intakeUrl);
      }

      if (msg.type === 'navigateToPreferences') {
        wixLocation.to('/recruiter-console?tab=settings');
      }

      if (msg.type === 'navigateToDashboard' || msg.type === 'viewMatchesClicked') {
        wixLocation.to('/recruiter-console');
      }

      if (msg.type === 'navigateToDriverSearch') {
        wixLocation.to('/recruiter-driver-search');
      }

      if (msg.type === 'getCarrierWelcomeData') {
        component.postMessage(payload);
        if (statusPayload) component.postMessage(statusPayload);
      }

      // Legacy navigation handler
      if (msg.type === 'navigateOnboarding') {
        const step = msg.data?.step;
        switch (step) {
          case 'profile':
            wixLocation.to('/recruiter-console?tab=profile');
            break;
          case 'branding':
            wixLocation.to('/recruiter-console?tab=branding');
            break;
          case 'jobs':
            wixLocation.to('/recruiter-console?tab=jobs');
            break;
          case 'payment':
            wixLocation.to('/checkout');
            break;
          case 'intake':
            wixLocation.to('/trucking-companies');
            break;
          case 'preferences':
            wixLocation.to('/recruiter-console?tab=settings');
            break;
          default:
            wixLocation.to('/recruiter-console');
        }
      }
    });

    // Send initial data
    setTimeout(() => {
      component.postMessage(payload);
      if (statusPayload) component.postMessage(statusPayload);
    }, 500);
  }
}
