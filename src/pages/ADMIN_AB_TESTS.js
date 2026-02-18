import wixLocation from 'wix-location';
import {
  getAllTests,
  getTest,
  createTest,
  updateTest,
  startTest,
  pauseTest,
  endTest,
  getTestResults
} from 'backend/experimentService.jsw';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

$w.onReady(async function() {
  const components = getHtmlComponents();
  if (!components.length) {
    console.warn('ADMIN_AB_TESTS: No HTML component found');
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
      case 'getAllTests': {
        const status = message.payload?.status || message.status || null;
        const tests = await getAllTests(status);
        safeSend(component, { action: 'testsLoaded', payload: tests });
        break;
      }
      case 'getTest': {
        const testKey = message.payload?.testKey || message.testKey;
        const test = await getTest(testKey);
        safeSend(component, { action: 'testLoaded', payload: test });
        break;
      }
      case 'createTest': {
        const testData = message.payload?.testData || message.testData || {};
        const result = await createTest(testData);
        emitWriteResult(component, result, 'Test created');
        break;
      }
      case 'updateTest': {
        const testKey = message.payload?.testKey || message.testKey;
        const updates = message.payload?.updates || message.updates || {};
        const result = await updateTest(testKey, updates);
        emitWriteResult(component, result, 'Test updated');
        break;
      }
      case 'startTest': {
        const testKey = message.payload?.testKey || message.testKey;
        const result = await startTest(testKey);
        emitWriteResult(component, result, 'Test started');
        break;
      }
      case 'pauseTest': {
        const testKey = message.payload?.testKey || message.testKey;
        const result = await pauseTest(testKey);
        emitWriteResult(component, result, 'Test paused');
        break;
      }
      case 'endTest': {
        const testKey = message.payload?.testKey || message.testKey;
        const winnerId = message.payload?.winnerId || message.winnerId || null;
        const result = await endTest(testKey, winnerId);
        emitWriteResult(component, result, 'Test ended');
        break;
      }
      case 'getTestResults': {
        const testKey = message.payload?.testKey || message.testKey;
        const results = await getTestResults(testKey);
        safeSend(component, { action: 'testResultsLoaded', payload: results });
        break;
      }
      default:
        console.warn('ADMIN_AB_TESTS: Unknown action:', action);
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
