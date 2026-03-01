// ai-matching-bridge.js
// Depends on: ai-matching-helpers.js, ai-matching-contract.js

const CONTRACT = window.AIMatchingContract || {};
const DEBUG_MESSAGES = CONTRACT.DEBUG_MESSAGES !== undefined ? CONTRACT.DEBUG_MESSAGES : true;
const MESSAGE_REGISTRY = CONTRACT.MESSAGE_REGISTRY || { inbound: [], outbound: [] };

function isValidOrigin(event) {
  if (window.parent === window) {
    console.warn('SECURITY: Not running in iframe context');
    return false;
  }
  if (event.source !== window.parent) {
    console.warn('SECURITY: Message not from parent frame');
    return false;
  }
  return true;
}

function validateMessageSchema(msg) {
  if (typeof CONTRACT.validatePageToHtmlMessage === 'function') {
    return CONTRACT.validatePageToHtmlMessage(msg);
  }
  if (!msg || typeof msg !== 'object') return false;
  if (typeof msg.type !== 'string' || msg.type.length === 0) return false;
  if (msg.data !== undefined && msg.data !== null && typeof msg.data !== 'object') return false;
  return true;
}

function validateInboundMessage(type) {
  const isKnown = typeof CONTRACT.isKnownInboundMessage === 'function'
    ? CONTRACT.isKnownInboundMessage(type)
    : MESSAGE_REGISTRY.inbound.includes(type);

  if (!isKnown) {
    console.warn(`UNREGISTERED INBOUND MESSAGE: "${type}"`);
    return false;
  }
  return true;
}

function logMessageFlow(direction, type, data) {
  if (typeof CONTRACT.logMessageFlow === 'function') {
    CONTRACT.logMessageFlow(direction, type, data, {
      inbound: 'Velo->HTML',
      outbound: 'HTML->Velo'
    });
    return;
  }
  if (!DEBUG_MESSAGES) return;
  const arrow = direction === 'in' ? 'IN' : 'OUT';
  const label = direction === 'in' ? 'Velo->HTML' : 'HTML->Velo';
  console.log(`[${arrow}] [${label}] ${type}`, data ? Object.keys(data) : '(no data)');
}

function sendToWix(action, data) {
  const isKnown = typeof CONTRACT.isKnownOutboundMessage === 'function'
    ? CONTRACT.isKnownOutboundMessage(action)
    : MESSAGE_REGISTRY.outbound.includes(action);

  if (!isKnown) {
    console.warn(`UNREGISTERED OUTBOUND MESSAGE: "${action}"`);
  }

  logMessageFlow('out', action, data);

  if (window.parent) {
    const envelope = typeof CONTRACT.buildHtmlToPageEnvelope === 'function'
      ? CONTRACT.buildHtmlToPageEnvelope(action, data)
      : { type: 'carrierMatching', action: action, data: data };
    window.parent.postMessage(envelope, '*');
  }
}

let connectionVerified = false;

function verifyConnection() {
  if (connectionVerified) return;
  sendToWix('ping', { timestamp: Date.now() });
  setTimeout(() => {
    if (!connectionVerified) {
      console.warn('CONNECTION CHECK: No pong received from Velo within 3s');
    }
  }, 3000);
}

window.addEventListener('message', function (event) {
  if (!isValidOrigin(event)) return;

  const msg = event.data;
  if (!validateMessageSchema(msg)) return;

  const type = msg.type;
  if (!validateInboundMessage(type)) return;

  logMessageFlow('in', type, msg.data);

  if (type === 'pong') {
    connectionVerified = true;
    return;
  }

  if (type === 'searchJobStarted' && typeof window._handleSearchJobStarted === 'function') {
    window._handleSearchJobStarted(msg.data);
    return;
  }

  if (type === 'searchJobStatus' && typeof window._handleSearchJobStatus === 'function') {
    window._handleSearchJobStatus(msg.data);
  }
});
