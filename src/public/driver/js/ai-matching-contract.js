// ai-matching-contract.js
// Browser-safe contract registry for the AI matching HTML component bridge.

(function (root, factory) {
  const contract = factory();

  if (typeof module === 'object' && module.exports) {
    module.exports = contract;
  }

  root.AIMatchingContract = contract;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const DEBUG_MESSAGES = true;

  const ENVELOPES = {
    htmlToPageType: 'carrierMatching',
  };

  const MESSAGE_REGISTRY = {
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
      'mutualInterestData',
      'matchExplanation',
      'pong',
      'agentResponse',
      'agentTyping',
      'agentToolResult',
      'voiceReady',
      'searchJobStarted',
      'searchJobStatus',
      'driverApplications',
      'ocrResult',
      'agentApprovalRequired',
      'profileSaved'
    ],
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
      'saveProfileDocs',
      'extractDocumentOCR',
      'logFeatureInteraction',
      'getMutualInterest',
      'loginForApplication',
      'getMatchExplanation',
      'agentMessage',
      'resolveApprovalGate',
      'startVoiceCall',
      'endVoiceCall',
      'getVoiceConfig',
      'pollSearchJob',
      'getDriverApplications',
      'ping'
    ]
  };

  function isKnownInboundMessage(type) {
    return MESSAGE_REGISTRY.inbound.includes(type);
  }

  function isKnownOutboundMessage(type) {
    return MESSAGE_REGISTRY.outbound.includes(type);
  }

  function isObjectPayload(value) {
    return value === undefined || value === null || typeof value === 'object';
  }

  function validatePageToHtmlMessage(msg) {
    if (!msg || typeof msg !== 'object') return false;
    if (typeof msg.type !== 'string' || msg.type.length === 0) return false;
    if (!isObjectPayload(msg.data)) return false;
    return true;
  }

  function validateHtmlToPageMessage(msg) {
    if (!msg || typeof msg !== 'object') return false;
    if (msg.type !== ENVELOPES.htmlToPageType) return false;
    if (typeof msg.action !== 'string' || msg.action.length === 0) return false;
    if (!isObjectPayload(msg.data)) return false;
    return true;
  }

  function buildHtmlToPageEnvelope(action, data) {
    return {
      type: ENVELOPES.htmlToPageType,
      action: action,
      data: data
    };
  }

  function logMessageFlow(direction, type, data, directionLabels) {
    if (!DEBUG_MESSAGES) return;

    const labels = directionLabels || {
      inbound: 'Velo->HTML',
      outbound: 'HTML->Velo'
    };

    const arrow = direction === 'in' ? 'IN' : 'OUT';
    const label = direction === 'in' ? labels.inbound : labels.outbound;
    console.log(`[${arrow}] [${label}] ${type}`, data ? Object.keys(data) : '(no data)');
  }

  return {
    DEBUG_MESSAGES: DEBUG_MESSAGES,
    ENVELOPES: ENVELOPES,
    MESSAGE_REGISTRY: MESSAGE_REGISTRY,
    buildHtmlToPageEnvelope: buildHtmlToPageEnvelope,
    isKnownInboundMessage: isKnownInboundMessage,
    isKnownOutboundMessage: isKnownOutboundMessage,
    isObjectPayload: isObjectPayload,
    logMessageFlow: logMessageFlow,
    validateHtmlToPageMessage: validateHtmlToPageMessage,
    validatePageToHtmlMessage: validatePageToHtmlMessage
  };
}));
