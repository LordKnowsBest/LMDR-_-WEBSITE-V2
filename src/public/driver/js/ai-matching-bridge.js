// ai-matching-bridge.js — PostMessage bridge + security hardening
// Depends on: ai-matching-helpers.js

const DEBUG_MESSAGES = true; // Set to false in production

// Registry of all valid messages - single source of truth
const MESSAGE_REGISTRY = {
  // Messages FROM Velo that HTML handles
  inbound: [
    'pageReady',
    'matchResults',
    'matchError',
    'enrichmentUpdate',
    'enrichmentComplete',
    'interestLogged',
    'userStatusUpdate',
    'loginSuccess',
    'loginCancelled',
    'applicationSubmitted',
    'driverProfileLoaded',
    'savedCarriersLoaded',
    'discoverabilityUpdated',
    'mutualInterestData', // Phase 1: Mutual interest response
    'matchExplanation', // Phase 3: Match explanation result
    'pong', // Health check response
    'agentResponse', // Agent orchestration response
    'agentTyping', // Agent is processing
    'agentToolResult', // Agent tool execution result
    'voiceReady', // Voice configuration ready
    'searchJobStarted', // Async Option B search kicked off — { jobId }
    'searchJobStatus', // Async search poll response — { status, error? }
  ],
  // Messages TO Velo that HTML sends
  outbound: [
    'carrierMatchingReady',
    'findMatches',
    'logInterest',
    'retryEnrichment',
    'navigateToSignup',
    'navigateToLogin',
    'checkUserStatus',
    'getDriverProfile',
    'navigateToSavedCarriers',
    'submitApplication',
    'logFeatureInteraction', // Feature adoption tracking
    'getMutualInterest', // Phase 1: Fetch mutual interests
    'loginForApplication', // Trigger Wix login from application submit
    'getMatchExplanation', // Phase 3: Request match explanation
    'agentMessage', // Send message to agent
    'startVoiceCall', // Initiate voice call
    'endVoiceCall', // End voice call
    'getVoiceConfig', // Request voice configuration
    'pollSearchJob', // Option B: poll async search job status
    'ping' // Health check
  ]
};

function isValidOrigin(event) {
  // In Wix HTML components, messages from Velo come from parent frame
  // We verify we're in an iframe and the source is our parent
  if (window.parent === window) {
    console.warn('⚠️ SECURITY: Not running in iframe context');
    return false;
  }
  if (event.source !== window.parent) {
    console.warn('⚠️ SECURITY: Message not from parent frame');
    return false;
  }
  return true;
}

// Schema validation - ensures message has required structure
function validateMessageSchema(msg) {
  if (!msg || typeof msg !== 'object') return false;
  if (typeof msg.type !== 'string' || msg.type.length === 0) return false;
  // data can be undefined, null, or object - all valid
  if (msg.data !== undefined && msg.data !== null && typeof msg.data !== 'object') return false;
  return true;
}

function validateInboundMessage(type) {
  if (!MESSAGE_REGISTRY.inbound.includes(type)) {
    console.warn(`⚠️ UNREGISTERED INBOUND MESSAGE: "${type}" - Add to MESSAGE_REGISTRY.inbound`);
    return false;
  }
  return true;
}

function logMessageFlow(direction, type, data) {
  if (!DEBUG_MESSAGES) return;
  const arrow = direction === 'in' ? '📥' : '📤';
  const label = direction === 'in' ? 'Velo→HTML' : 'HTML→Velo';
  console.log(`${arrow} [${label}] ${type}`, data ? Object.keys(data) : '(no data)');
}

function sendToWix(action, data) {
  // Validate outbound message
  if (!MESSAGE_REGISTRY.outbound.includes(action)) {
    console.warn(`⚠️ UNREGISTERED OUTBOUND MESSAGE: "${action}" - Add to MESSAGE_REGISTRY.outbound`);
  }
  logMessageFlow('out', action, data);

  if (window.parent) {
    window.parent.postMessage({
      type: 'carrierMatching',
      action: action,
      data: data
    }, '*');
  }
}

let connectionVerified = false;
function verifyConnection() {
  if (connectionVerified) return;
  sendToWix('ping', { timestamp: Date.now() });
  setTimeout(() => {
    if (!connectionVerified) {
      console.warn('⚠️ CONNECTION CHECK: No pong received from Velo within 3s');
    }
  }, 3000);
}

