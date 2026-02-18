import wixLocation from 'wix-location';
import {
  getAllRules,
  getRule,
  createRule,
  updateRule,
  toggleRule,
  deleteRule,
  getRuleStats,
  getNotificationLogs,
  testRule,
  previewNotification
} from 'backend/notificationRulesService.jsw';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

$w.onReady(async function() {
  const components = getHtmlComponents();
  if (!components.length) {
    console.warn('ADMIN_NOTIFICATION_RULES: No HTML component found');
    return;
  }

  for (const component of components) {
    component.onMessage(async (event) => {
      await routeMessage(component, event?.data);
    });
    safeSend(component, { action: 'init' });
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
    } catch (error) {}
  }
  return found;
}

async function routeMessage(component, message) {
  if (!message?.action) return;

  const action = message.action;
  if (action === 'navigateTo') {
    const destination = message.payload?.destination || message.destination;
    if (destination) wixLocation.to(`/${destination}`);
    return;
  }

  try {
    switch (action) {
      case 'getAllRules': {
        const triggerEvent = message.payload?.triggerEvent || message.triggerEvent || null;
        const rules = await getAllRules(triggerEvent);
        safeSend(component, { action: 'rulesLoaded', payload: rules });
        break;
      }
      case 'getRule': {
        const ruleId = message.payload?.ruleId || message.ruleId;
        const rule = await getRule(ruleId);
        safeSend(component, { action: 'ruleLoaded', payload: rule });
        break;
      }
      case 'createRule': {
        const ruleData = message.payload?.ruleData || message.ruleData || {};
        const result = await createRule(ruleData);
        emitWriteResult(component, result, 'Rule created');
        break;
      }
      case 'updateRule': {
        const ruleId = message.payload?.ruleId || message.ruleId;
        const updates = message.payload?.updates || message.updates || {};
        const result = await updateRule(ruleId, updates);
        emitWriteResult(component, result, 'Rule updated');
        break;
      }
      case 'toggleRule': {
        const ruleId = message.payload?.ruleId || message.ruleId;
        const isActive = Boolean(message.payload?.isActive ?? message.isActive);
        const result = await toggleRule(ruleId, isActive);
        emitWriteResult(component, result, `Rule ${isActive ? 'enabled' : 'disabled'}`);
        break;
      }
      case 'deleteRule': {
        const ruleId = message.payload?.ruleId || message.ruleId;
        const result = await deleteRule(ruleId);
        emitWriteResult(component, result, 'Rule deleted');
        break;
      }
      case 'getRuleStats': {
        const ruleId = message.payload?.ruleId || message.ruleId;
        const dateRange = message.payload?.dateRange || message.dateRange || {};
        const stats = await getRuleStats(ruleId, dateRange);
        safeSend(component, { action: 'ruleStatsLoaded', payload: stats });
        break;
      }
      case 'getNotificationLogs': {
        const ruleId = message.payload?.ruleId || message.ruleId;
        const dateRange = message.payload?.dateRange || message.dateRange || {};
        const logs = await getNotificationLogs(ruleId, dateRange);
        safeSend(component, { action: 'notificationLogsLoaded', payload: logs });
        break;
      }
      case 'testRule': {
        const ruleId = message.payload?.ruleId || message.ruleId;
        const sampleData = message.payload?.sampleData || message.sampleData || {};
        const result = await testRule(ruleId, sampleData);
        safeSend(component, { action: 'ruleTestResult', payload: result });
        break;
      }
      case 'previewNotification': {
        const ruleId = message.payload?.ruleId || message.ruleId;
        const channel = message.payload?.channel || message.channel;
        const sampleData = message.payload?.sampleData || message.sampleData || {};
        const preview = await previewNotification(ruleId, channel, sampleData);
        safeSend(component, { action: 'notificationPreviewLoaded', payload: preview });
        break;
      }
      default:
        console.warn('ADMIN_NOTIFICATION_RULES: Unknown action:', action);
    }
  } catch (error) {
    safeSend(component, {
      action: 'actionError',
      message: error.message || 'Unexpected error'
    });
  }
}

function emitWriteResult(component, result, successMessage) {
  if (result?.success || result?._id || result?.record) {
    safeSend(component, { action: 'actionSuccess', message: successMessage });
    return;
  }
  safeSend(component, {
    action: 'actionError',
    message: result?.error || 'Operation failed'
  });
}

function safeSend(component, data) {
  try {
    if (component && typeof component.postMessage === 'function') {
      component.postMessage(data);
    }
  } catch (error) {}
}
