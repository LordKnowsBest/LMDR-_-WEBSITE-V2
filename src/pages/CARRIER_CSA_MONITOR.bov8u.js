import wixLocation from 'wix-location';
import { getCarrierIdentity } from 'backend/recruiter_service';
import { getCompliancePageData, handleComplianceMessage } from 'backend/complianceBridge';

const PAGE_TYPE = 'csaMonitor';
const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

$w.onReady(async function () {
  const identity = await getCarrierIdentity();
  if (!identity?.success || identity.needsOnboarding || !identity.dotNumber) {
    wixLocation.to('/carrier-welcome');
    return;
  }

  const carrierDot = String(identity.dotNumber);
  const components = getHtmlComponents();

  if (!components.length) {
    console.warn('No HTML component found for CSA Monitor page');
    return;
  }

  for (const component of components) {
    component.onMessage(async (event) => {
      await routeMessage(component, carrierDot, event?.data);
    });

    const initialData = await getCompliancePageData(PAGE_TYPE, carrierDot);
    if (initialData) {
      component.postMessage(initialData);
    }

    component.postMessage({
      type: 'carrierContext',
      data: {
        carrierDot,
        companyName: identity.companyName || ''
      }
    });
  }
});

function getHtmlComponents() {
  const found = [];
  for (const id of HTML_COMPONENT_IDS) {
    try {
      const component = $w(id);
      if (component && typeof component.onMessage === 'function') {
        found.push(component);
      }
    } catch (error) {
      // Ignore missing IDs.
    }
  }
  return found;
}

async function routeMessage(component, carrierDot, message) {
  if (!message?.type) return;

  if (message.type === 'navigateTo') {
    const page = message?.data?.page;
    if (page) {
      wixLocation.to(`/${page}`);
    }
    return;
  }

  try {
    const response = await handleComplianceMessage(PAGE_TYPE, carrierDot, message);
    if (response && typeof component.postMessage === 'function') {
      component.postMessage(response);
    }
  } catch (error) {
    console.error('CSA Monitor bridge error:', error);
    component.postMessage({
      type: 'error',
      data: { error: error.message || 'Unknown error' }
    });
  }
}
