import {
  getPartnerPortalSnapshot,
  listPartnerApiKeys,
  createPartnerApiKey,
  revokePartnerApiKey,
  rotatePartnerApiKey,
  setPartnerApiEnvironment,
  sendPartnerWebhookTest,
  createPartnerApiCheckout,
  createPartnerBillingPortal,
  getPartnerBillingHistory
} from 'backend/apiPortalService';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

$w.onReady(async function () {
  const component = findHtmlComponent();
  if (!component) {
    console.warn('API_PORTAL_DASHBOARD: No HTML component found');
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
      // Optional component not present.
    }
  }
  return null;
}

async function routeMessage(component, message) {
  if (!message?.action) return;

  try {
    switch (message.action) {
      case 'getSnapshot':
        await handleGetSnapshot(component, message.partnerId, message.periodKey);
        break;
      case 'listKeys':
        await handleListKeys(component, message.partnerId);
        break;
      case 'createKey':
        await handleCreateKey(component, message.partnerId, message.options);
        break;
      case 'revokeKey':
        await handleRevokeKey(component, message.partnerId, message.keyId);
        break;
      case 'rotateKey':
        await handleRotateKey(component, message.partnerId, message.keyId, message.options);
        break;
      case 'setEnvironment':
        await handleSetEnvironment(component, message.partnerId, message.environment);
        break;
      case 'sendWebhookTest':
        await handleSendWebhookTest(component, message.partnerId, message.webhookUrl);
        break;
      case 'createCheckout':
        await handleCreateCheckout(component, message.partnerId, message.tier, message.planType);
        break;
      case 'createBillingPortal':
        await handleCreateBillingPortal(component, message.partnerId);
        break;
      case 'getBillingHistory':
        await handleGetBillingHistory(component, message.partnerId, message.limit);
        break;
      default:
        console.warn('API_PORTAL_DASHBOARD: Unknown action', message.action);
    }
  } catch (error) {
    safeSend(component, { action: 'actionError', message: error.message || 'Unexpected error' });
  }
}

async function handleGetSnapshot(component, partnerId, periodKey) {
  const result = await getPartnerPortalSnapshot(partnerId, periodKey || null);
  safeSend(component, { action: 'snapshotLoaded', payload: result });
}

async function handleListKeys(component, partnerId) {
  const result = await listPartnerApiKeys(partnerId);
  safeSend(component, { action: 'keysLoaded', payload: result });
}

async function handleCreateKey(component, partnerId, options = {}) {
  const result = await createPartnerApiKey(partnerId, options || {});
  safeSend(component, { action: 'keyCreated', payload: result });
}

async function handleRevokeKey(component, partnerId, keyId) {
  const result = await revokePartnerApiKey(partnerId, keyId);
  safeSend(component, { action: 'keyRevoked', payload: result });
}

async function handleRotateKey(component, partnerId, keyId, options = {}) {
  const result = await rotatePartnerApiKey(partnerId, keyId, options || {});
  safeSend(component, { action: 'keyRotated', payload: result });
}

async function handleSetEnvironment(component, partnerId, environment) {
  const result = await setPartnerApiEnvironment(partnerId, environment);
  safeSend(component, { action: 'environmentSet', payload: result });
}

async function handleSendWebhookTest(component, partnerId, webhookUrl) {
  const result = await sendPartnerWebhookTest(partnerId, webhookUrl || null);
  safeSend(component, { action: 'webhookTestResult', payload: result });
}

async function handleCreateCheckout(component, partnerId, tier, planType) {
  const result = await createPartnerApiCheckout(partnerId, tier || 'starter', planType || 'monthly');
  safeSend(component, { action: 'checkoutCreated', payload: result });
}

async function handleCreateBillingPortal(component, partnerId) {
  const result = await createPartnerBillingPortal(partnerId);
  safeSend(component, { action: 'billingPortalCreated', payload: result });
}

async function handleGetBillingHistory(component, partnerId, limit = 50) {
  const result = await getPartnerBillingHistory(partnerId, limit || 50);
  safeSend(component, { action: 'billingHistoryLoaded', payload: result });
}

function safeSend(component, payload) {
  try {
    if (component && typeof component.postMessage === 'function') {
      component.postMessage(payload);
    }
  } catch (error) {
    console.error('API_PORTAL_DASHBOARD: postMessage failed', error);
  }
}
