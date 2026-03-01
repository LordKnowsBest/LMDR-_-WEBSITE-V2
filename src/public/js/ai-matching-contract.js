// Shared contract data for the Wix page controller.

export const DEBUG_MESSAGES = true;

export const ENVELOPES = {
  htmlToPageType: 'carrierMatching',
};

export const MESSAGE_REGISTRY = {
  inbound: [
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
    'saveProfileDocs',
    'extractDocumentOCR',
    'getMatchExplanation',
    'logFeatureInteraction',
    'getDriverApplications',
    'getMutualInterest',
    'loginForApplication',
    'agentMessage',
    'resolveApprovalGate',
    'startVoiceCall',
    'endVoiceCall',
    'getVoiceConfig',
    'pollSearchJob',
    'ping'
  ],
  outbound: [
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
    'profileSaved',
    'ocrResult',
    'matchExplanation',
    'driverApplications',
    'mutualInterestData',
    'agentResponse',
    'agentTyping',
    'agentToolResult',
    'agentApprovalRequired',
    'voiceReady',
    'searchJobStarted',
    'searchJobStatus',
    'pong'
  ]
};

export function isKnownInboundMessage(type) {
  return MESSAGE_REGISTRY.inbound.includes(type);
}

export function isKnownOutboundMessage(type) {
  return MESSAGE_REGISTRY.outbound.includes(type);
}

export function isObjectPayload(value) {
  return value === undefined || value === null || typeof value === 'object';
}

export function validateHtmlToPageMessage(msg) {
  if (!msg || typeof msg !== 'object') return false;
  if (msg.type !== ENVELOPES.htmlToPageType && typeof msg.type !== 'string') return false;
  if (typeof (msg.action || msg.type) !== 'string' || (msg.action || msg.type).length === 0) return false;
  if (!isObjectPayload(msg.data)) return false;
  return true;
}

export function validatePageToHtmlMessage(msg) {
  if (!msg || typeof msg !== 'object') return false;
  if (typeof msg.type !== 'string' || msg.type.length === 0) return false;
  if (!isObjectPayload(msg.data)) return false;
  return true;
}

export function logMessageFlow(direction, type, data) {
  if (!DEBUG_MESSAGES) return;
  const arrow = direction === 'in' ? 'IN' : 'OUT';
  const label = direction === 'in' ? 'HTML->Velo' : 'Velo->HTML';
  console.log(`[${arrow}] [${label}] ${type}`, data ? Object.keys(data) : '(no data)');
}
