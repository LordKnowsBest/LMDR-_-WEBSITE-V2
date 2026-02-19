import {
  listApiPartners,
  getPartnerPortalSnapshot,
  setApiPartnerTier,
  setApiPartnerStatus,
  setPartnerApiEnvironment,
  getPartnerUsageDashboard,
  getApiPartnerHistory,
  getApiRevenueReport
} from 'backend/apiPortalService';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

$w.onReady(async function () {
  const component = findHtmlComponent();
  if (!component) {
    console.warn('ADMIN_API_PARTNERS: No HTML component found');
    return;
  }

  component.onMessage(async (event) => {
    await routeMessage(component, event?.data);
  });

  safeSend(component, { action: 'init' });
});

function findHtmlComponent() {
  for (const id of HTML_COMPONENT_IDS) {
    try {
      const el = $w(id);
      if (el && typeof el.onMessage === 'function') return el;
    } catch (error) {
      // Element not on this page variant.
    }
  }
  return null;
}

async function routeMessage(component, message) {
  if (!message?.action) return;

  try {
    switch (message.action) {
      case 'listPartners':
        await handleListPartners(component, message.limit);
        break;
      case 'getPartnerDetail':
        await handleGetPartnerDetail(component, message.partnerId, message.periodKey);
        break;
      case 'setPartnerTier':
        await handleSetPartnerTier(component, message.partnerId, message.tier);
        break;
      case 'setPartnerStatus':
        await handleSetPartnerStatus(component, message.partnerId, message.status);
        break;
      case 'setPartnerEnvironment':
        await handleSetPartnerEnvironment(component, message.partnerId, message.environment);
        break;
      case 'getPartnerUsage':
        await handleGetPartnerUsage(component, message.partnerId, message.periodKey);
        break;
      case 'getPartnerHistory':
        await handleGetPartnerHistory(component, message.partnerId, message.limit);
        break;
      case 'getRevenueReport':
        await handleGetRevenueReport(component, message.partnerId, message.months);
        break;
      default:
        console.warn('ADMIN_API_PARTNERS: Unknown action', message.action);
    }
  } catch (error) {
    safeSend(component, { action: 'actionError', message: error.message || 'Unexpected error' });
  }
}

async function handleListPartners(component, limit) {
  const result = await listApiPartners(limit || 100);
  safeSend(component, { action: 'partnersLoaded', payload: result });
}

async function handleGetPartnerDetail(component, partnerId, periodKey) {
  const result = await getPartnerPortalSnapshot(partnerId, periodKey || null);
  safeSend(component, { action: 'partnerDetailLoaded', payload: result });
}

async function handleSetPartnerTier(component, partnerId, tier) {
  const result = await setApiPartnerTier(partnerId, tier);
  safeSend(component, { action: 'partnerTierUpdated', payload: result });
}

async function handleSetPartnerStatus(component, partnerId, status) {
  const result = await setApiPartnerStatus(partnerId, status);
  safeSend(component, { action: 'partnerStatusUpdated', payload: result });
}

async function handleSetPartnerEnvironment(component, partnerId, environment) {
  const result = await setPartnerApiEnvironment(partnerId, environment);
  safeSend(component, { action: 'partnerEnvironmentUpdated', payload: result });
}

async function handleGetPartnerUsage(component, partnerId, periodKey) {
  const result = await getPartnerUsageDashboard(partnerId, periodKey || null);
  safeSend(component, { action: 'partnerUsageLoaded', payload: result });
}

async function handleGetPartnerHistory(component, partnerId, limit = 50) {
  const result = await getApiPartnerHistory(partnerId, limit || 50);
  safeSend(component, { action: 'partnerHistoryLoaded', payload: result });
}

async function handleGetRevenueReport(component, partnerId, months = 12) {
  const targetPartner = String(partnerId || '').trim() || null;
  const result = await getApiRevenueReport(targetPartner, months || 12);
  safeSend(component, { action: 'revenueReportLoaded', payload: result });
}

function safeSend(component, payload) {
  try {
    if (component && typeof component.postMessage === 'function') {
      component.postMessage(payload);
    }
  } catch (error) {
    console.error('ADMIN_API_PARTNERS: postMessage failed', error);
  }
}
