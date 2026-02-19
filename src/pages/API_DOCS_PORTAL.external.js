import {
  getApiDocumentationCatalog,
  runApiSandboxRequest,
  getApiHealthStatus,
  getApiChangelog
} from 'backend/apiPortalService';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

$w.onReady(async function () {
  const component = findHtmlComponent();
  if (!component) {
    console.warn('API_DOCS_PORTAL: No HTML component found');
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
    } catch (_error) {
      // Optional component may not exist.
    }
  }
  return null;
}

async function routeMessage(component, message) {
  if (!message?.action) return;

  try {
    switch (message.action) {
      case 'getDocsCatalog':
        await handleGetDocsCatalog(component);
        break;
      case 'trySandbox':
        await handleTrySandbox(component, message.endpointKey, message.payload || {});
        break;
      case 'getApiStatus':
        await handleGetApiStatus(component, message.windowHours || 24);
        break;
      case 'getApiChangelog':
        await handleGetApiChangelog(component, message.limit || 20);
        break;
      default:
        console.warn('API_DOCS_PORTAL: Unknown action', message.action);
    }
  } catch (error) {
    safeSend(component, { action: 'actionError', message: error.message || 'Unexpected error' });
  }
}

async function handleGetDocsCatalog(component) {
  const result = await getApiDocumentationCatalog();
  safeSend(component, { action: 'docsCatalogLoaded', payload: result });
}

async function handleTrySandbox(component, endpointKey, payload) {
  const result = await runApiSandboxRequest(endpointKey, payload || {});
  safeSend(component, { action: 'sandboxResultLoaded', payload: result });
}

async function handleGetApiStatus(component, windowHours) {
  const result = await getApiHealthStatus(windowHours || 24);
  safeSend(component, { action: 'apiStatusLoaded', payload: result });
}

async function handleGetApiChangelog(component, limit) {
  const result = await getApiChangelog(limit || 20);
  safeSend(component, { action: 'apiChangelogLoaded', payload: result });
}

function safeSend(component, payload) {
  try {
    if (component && typeof component.postMessage === 'function') {
      component.postMessage(payload);
    }
  } catch (error) {
    console.error('API_DOCS_PORTAL: postMessage failed', error);
  }
}
