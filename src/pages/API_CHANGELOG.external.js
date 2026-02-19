import { getApiChangelog } from 'backend/apiPortalService';

const HTML_COMPONENT_IDS = ['#html1', '#html2', '#html3', '#html4', '#html5', '#htmlEmbed1'];

$w.onReady(async function () {
  const component = findHtmlComponent();
  if (!component) return;

  component.onMessage(async (event) => {
    const action = event?.data?.action;
    if (action === 'getApiChangelog') {
      const result = await getApiChangelog(event?.data?.limit || 50);
      safeSend(component, { action: 'apiChangelogLoaded', payload: result });
    }
  });

  safeSend(component, { action: 'init' });
});

function findHtmlComponent() {
  for (const id of HTML_COMPONENT_IDS) {
    try {
      const el = $w(id);
      if (el && typeof el.onMessage === 'function') return el;
    } catch (_error) {
      // Optional component not present.
    }
  }
  return null;
}

function safeSend(component, payload) {
  try {
    if (component && typeof component.postMessage === 'function') {
      component.postMessage(payload);
    }
  } catch (_error) {
    // Ignore postMessage failures in fallback pages.
  }
}
