import { isKnownOutboundMessage } from 'public/js/ai-matching-contract';

export function sendToHtmlBridge(type, data, options = {}) {
  const {
    component,
    logMessageFlow,
    fallbackRegistry = []
  } = options;

  if (!(isKnownOutboundMessage(type) || fallbackRegistry.includes(type))) {
    console.warn(`UNREGISTERED OUTBOUND MESSAGE: "${type}"`);
  }

  if (typeof logMessageFlow === 'function') {
    logMessageFlow('out', type, data);
  }

  if (!component || typeof component.postMessage !== 'function') {
    return false;
  }

  component.postMessage({ type, data, timestamp: Date.now() });
  return true;
}
