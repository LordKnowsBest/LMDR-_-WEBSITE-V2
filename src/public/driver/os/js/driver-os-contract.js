/**
 * driver-os-contract.js
 * ═══════════════════════════════════════════════════════════════════
 * Canonical message registry for DriverOS.
 * Every postMessage between DriverOS.html ↔ DRIVER_OS page code
 * MUST be registered here. The bridge validates against this contract.
 *
 * Protocol: ALL messages use { action, payload } envelope.
 * Legacy type-key messages are translated by the bridge adapter.
 *
 * Directions:
 *   inbound  = HTML → Velo page code  (driver requests something)
 *   outbound = Velo page code → HTML  (page code responds with data)
 * ═══════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  /* ───────────────────────────────────────────────────────────────
   * INBOUND actions — HTML sends these TO Velo page code
   * ─────────────────────────────────────────────────────────────── */
  var INBOUND = {

    // ═══ Lifecycle ═══
    ping:                     { required: [], optional: ['timestamp'] },
    carrierMatchingReady:     { required: [], optional: [] },
    dashboardReady:           { required: [], optional: [] },
    driverMyCareerReady:      { required: [], optional: [] },
    documentUploadReady:      { required: [], optional: [] },
    surveysReady:             { required: [], optional: [] },
    roadUtilitiesReady:       { required: [], optional: [] },
    announcementsReady:       { required: [], optional: [] },
    policiesReady:            { required: [], optional: [] },
    retentionReady:           { required: [], optional: [] },
    gamificationReady:        { required: [], optional: [] },
    badgesReady:              { required: [], optional: [] },
    challengesReady:          { required: [], optional: [] },
    forumsReady:              { required: [], optional: [] },
    healthReady:              { required: [], optional: [] },
    petFriendlyReady:         { required: [], optional: [] },
    mentorsReady:             { required: [], optional: [] },
    mentorProfileReady:       { required: [], optional: ['mentorId'] },
    viewChanged:              { required: ['viewId'], optional: ['previousViewId'] },

    // ═══ Discovery & Matching ═══
    findMatches:              { required: [], optional: ['cdlClass', 'endorsements', 'yearsExp', 'preferredState', 'preferredLane', 'jobType', 'minPay'] },
    pollSearchJob:            { required: ['jobId'], optional: [] },
    getCarrierDetail:         { required: ['carrierDot'], optional: ['driverId'] },
    logInterest:              { required: ['carrierDOT'], optional: ['carrierName', 'memberId', 'matchScore', 'matchRank'] },
    retryEnrichment:          { required: ['dot'], optional: [] },
    getMatchExplanation:      { required: ['carrierDot'], optional: ['driverId'] },
    getMutualInterest:        { required: ['driverId'], optional: [] },
    getDriverApplications:    { required: [], optional: ['driverId'] },
    submitApplication:        { required: [], optional: ['carrierDot', 'formData'] },
    loginForApplication:      { required: ['mode'], optional: [] },

    // ═══ Jobs ═══
    searchJobs:               { required: [], optional: ['filters', 'page', 'pageSize'] },
    getJobDetails:            { required: ['jobId'], optional: [] },
    applyToJob:               { required: ['jobId'], optional: ['applicationData'] },
    saveJob:                  { required: ['jobId'], optional: [] },
    getSavedJobs:             { required: [], optional: [] },

    // ═══ Dashboard ═══
    refreshDashboard:         { required: [], optional: [] },
    withdrawApplication:      { required: ['carrierDOT'], optional: [] },
    sendMessage:              { required: ['applicationId', 'content'], optional: ['receiverId'] },
    getConversation:          { required: ['applicationId'], optional: [] },
    getNewMessages:           { required: ['applicationId'], optional: ['sinceTimestamp'] },
    getUnreadCount:           { required: [], optional: [] },
    markAsRead:               { required: ['applicationId'], optional: [] },
    setDiscoverability:       { required: ['isDiscoverable'], optional: [] },
    proposeTimeSlots:         { required: ['applicationId', 'slots'], optional: [] },
    confirmTimeSlot:          { required: ['applicationId', 'slotIndex'], optional: [] },

    // ═══ Profile & Career ═══
    getDriverProfile:         { required: [], optional: ['driverId'] },
    updateProfile:            { required: ['profileData'], optional: [] },
    getProfileStrength:       { required: [], optional: ['driverId'] },
    getDriverScorecard:       { required: [], optional: ['driverId'] },
    getCareerTimeline:        { required: [], optional: ['driverId'] },
    getActiveSurveys:         { required: [], optional: [] },
    submitResignation:        { required: ['reason'], optional: ['notes'] },
    getWhoViewedMe:           { required: [], optional: ['driverId'] },

    // ═══ Documents ═══
    requestDocumentList:      { required: [], optional: ['workflowId'] },
    uploadDocument:           { required: [], optional: ['documentType', 'fileData'] },
    saveProfileDocs:          { required: [], optional: ['documents'] },
    extractDocumentOCR:       { required: [], optional: ['fileData', 'documentType'] },

    // ═══ Gamification ═══
    getGamificationState:     { required: [], optional: ['driverId'] },
    getBadges:                { required: [], optional: ['driverId'] },
    getChallenges:            { required: [], optional: ['status'] },
    getLeaderboard:           { required: [], optional: ['period', 'limit'] },
    getStreakState:            { required: [], optional: ['driverId'] },
    recordActivity:           { required: ['activityType'], optional: ['metadata'] },
    getAchievements:          { required: [], optional: ['driverId'] },

    // ═══ Community ═══
    getForumThreads:          { required: [], optional: ['category', 'page', 'pageSize'] },
    createForumThread:        { required: ['title', 'content'], optional: ['category'] },
    replyToThread:            { required: ['threadId', 'content'], optional: [] },
    upvoteThread:             { required: ['threadId'], optional: [] },
    getAnnouncements:         { required: [], optional: ['driverId', 'carrierId', 'limit', 'offset'] },
    markAnnouncementRead:     { required: ['announcementId'], optional: ['driverId', 'deviceType', 'timeSpentSeconds'] },
    addAnnouncementComment:   { required: ['announcementId', 'commentText'], optional: ['driverId'] },
    getSurveys:               { required: [], optional: [] },
    submitSurvey:             { required: ['surveyRequestId', 'surveyType', 'responses'], optional: [] },

    // ═══ Road & Wellness ═══
    searchParking:            { required: ['lat', 'lng'], optional: ['radius'] },
    searchFuel:               { required: [], optional: ['lat', 'lng', 'radius', 'fuelType'] },
    searchWeighStations:      { required: ['lat', 'lng'], optional: ['radius', 'state', 'bypassServices'] },
    getWeather:               { required: ['routePoints'], optional: [] },
    getRoadConditions:        { required: ['routePoints'], optional: [] },
    getTruckRestrictions:     { required: ['routePoints'], optional: ['truckSpecs'] },
    reportStationStatus:      { required: [], optional: [] },
    linkFuelCard:             { required: [], optional: [] },
    getDriverFuelCards:       { required: [], optional: [] },
    getDriverBypassServices:  { required: [], optional: [] },
    saveDriverBypassServices: { required: [], optional: [] },
    submitReview:             { required: ['locationId', 'reviewData'], optional: [] },
    getReviews:               { required: ['locationId'], optional: ['options'] },
    reportCondition:          { required: ['locationId', 'reportData'], optional: [] },
    subscribeAlerts:          { required: ['preferences'], optional: [] },
    getParkingDetails:        { required: ['locationId'], optional: [] },
    getHealthResources:       { required: [], optional: ['category'] },
    submitHealthTip:          { required: ['tipData'], optional: [] },
    searchPetFriendly:        { required: [], optional: ['filters', 'lat', 'lng', 'radius'] },
    submitPetReview:          { required: ['locationId', 'reviewData'], optional: [] },

    // ═══ Compliance ═══
    getDriverPolicies:        { required: [], optional: ['driverId', 'carrierId'] },
    getPolicyContent:         { required: ['policyId'], optional: [] },
    acknowledgePolicy:        { required: ['policyId'], optional: ['driverId', 'signatureType', 'deviceInfo'] },

    // ═══ Mentorship ═══
    getMentors:               { required: [], optional: ['cdlClass', 'specialty'] },
    getMentorProfile:         { required: ['mentorId'], optional: [] },
    requestMentorSession:     { required: ['mentorId'], optional: ['topic', 'preferredTime'] },

    // ═══ Retention ═══
    getRetentionFramework:    { required: [], optional: [] },
    submitStaffingRequest:    { required: [], optional: ['formData'] },

    // ═══ Financial ═══
    logExpense:               { required: ['expenseData'], optional: [] },
    getExpenseSummary:        { required: [], optional: ['period'] },

    // ═══ Agent & Voice ═══
    agentMessage:             { required: ['text'], optional: ['context'] },
    resolveApprovalGate:      { required: ['approvalContext', 'decision'], optional: ['decidedBy'] },
    getVoiceConfig:           { required: [], optional: [] },
    startVoiceCall:           { required: [], optional: [] },
    endVoiceCall:             { required: [], optional: [] },
    getAgentMemory:           { required: [], optional: ['conversationId'] },

    // ═══ Intelligence ═══
    getMarketSignals:         { required: [], optional: [] },
    getProactiveInsights:     { required: [], optional: ['driverId', 'currentView'] },
    dismissNBAChip:           { required: ['chipId'], optional: [] },

    // ═══ Auth & Navigation ═══
    navigateToSignup:         { required: [], optional: [] },
    navigateToLogin:          { required: [], optional: [] },
    checkUserStatus:          { required: [], optional: [] },
    navigate:                 { required: ['url'], optional: [] },
    navigateToMatching:       { required: [], optional: ['carrier'] },
    navigateToProfile:        { required: [], optional: [] },
    navigateToForums:         { required: [], optional: [] },
    navigateToMentorship:     { required: [], optional: [] },
    navigateToPetFriendly:    { required: [], optional: [] },
    navigateToHealth:         { required: [], optional: [] },
    navigateToMyCareer:       { required: [], optional: [] },
    navigateToSavedCarriers:  { required: [], optional: [] },

    // ═══ Tracking ═══
    logFeatureInteraction:    { required: [], optional: ['feature', 'action', 'metadata'] }
  };


  /* ───────────────────────────────────────────────────────────────
   * OUTBOUND actions — Velo page code sends these TO HTML
   * ─────────────────────────────────────────────────────────────── */
  var OUTBOUND = {

    // ═══ Lifecycle ═══
    pong:                     { required: [], optional: ['timestamp', 'registeredInbound', 'registeredOutbound'] },
    init:                     { required: [], optional: [] },
    pageReady:                { required: ['userStatus'], optional: ['driverProfile', 'featureFlags', 'marketCondition'] },

    // ═══ Discovery & Matching ═══
    matchResults:             { required: ['results'], optional: ['totalCount', 'searchId'] },
    matchError:               { required: ['message'], optional: ['code'] },
    searchJobStarted:         { required: ['jobId'], optional: [] },
    searchJobStatus:          { required: ['status'], optional: ['results', 'progress'] },
    enrichmentUpdate:         { required: ['carrierDOT'], optional: ['data'] },
    enrichmentComplete:       { required: [], optional: [] },
    interestLogged:           { required: ['carrierDOT'], optional: [] },
    matchExplanation:         { required: [], optional: ['explanation', 'carrierDot'] },
    mutualInterestData:       { required: [], optional: ['interests'] },
    driverApplications:       { required: [], optional: ['applications'] },
    applicationSubmitted:     { required: ['success'], optional: ['error'] },

    // ═══ Jobs ═══
    jobsLoaded:               { required: ['jobs'], optional: ['totalCount'] },
    jobDetailLoaded:          { required: ['job'], optional: [] },
    jobSaved:                 { required: ['success'], optional: [] },
    savedJobsLoaded:          { required: ['jobs'], optional: [] },

    // ═══ Dashboard ═══
    dashboardData:            { required: [], optional: ['applications', 'stats', 'messages'] },
    withdrawSuccess:          { required: [], optional: [] },
    conversationData:         { required: [], optional: ['messages'] },
    messageSent:              { required: [], optional: [] },
    newMessagesData:          { required: [], optional: ['applicationId', 'messages'] },
    unreadCountData:          { required: [], optional: ['totalUnread', 'unreadByApplication'] },
    viewsData:                { required: [], optional: ['views', 'isDiscoverable'] },
    insightsData:             { required: [], optional: ['stats'] },

    // ═══ Profile & Career ═══
    driverProfileLoaded:      { required: [], optional: ['success', 'profile'] },
    profileSaved:             { required: [], optional: [] },
    profileStrengthLoaded:    { required: [], optional: ['strength', 'suggestions'] },
    scorecardLoaded:          { required: [], optional: ['scorecard'] },
    careerTimelineData:       { required: [], optional: ['events', 'currentCarrier'] },
    activeSurveysData:        { required: [], optional: ['surveys'] },
    resignationResult:        { required: ['success'], optional: ['error'] },
    whoViewedMeLoaded:        { required: [], optional: ['viewers'] },

    // ═══ Documents ═══
    documentList:             { required: [], optional: ['documents'] },
    uploadResult:             { required: [], optional: ['success', 'documentId'] },
    verificationUpdate:       { required: [], optional: ['documentId', 'status'] },
    ocrResult:                { required: [], optional: ['extractedData'] },

    // ═══ Gamification ═══
    gamificationStateLoaded:  { required: [], optional: ['xp', 'level', 'tier', 'events'] },
    badgesLoaded:             { required: [], optional: ['badges'] },
    challengesLoaded:         { required: [], optional: ['challenges'] },
    leaderboardLoaded:        { required: [], optional: ['entries'] },
    streakStateLoaded:        { required: [], optional: ['streak', 'freezes'] },
    achievementsLoaded:       { required: [], optional: ['achievements'] },
    activityRecorded:         { required: ['success'], optional: [] },

    // ═══ Community ═══
    forumThreadsLoaded:       { required: [], optional: ['threads', 'totalCount'] },
    threadCreated:            { required: ['success'], optional: ['threadId'] },
    replyPosted:              { required: ['success'], optional: [] },
    announcementsLoaded:      { required: [], optional: ['announcements'] },
    announcementReadMarked:   { required: ['success'], optional: [] },
    commentAdded:             { required: ['success'], optional: [] },
    surveysLoaded:            { required: [], optional: ['surveys'] },
    surveySubmitted:          { required: [], optional: ['xpAwarded'] },

    // ═══ Road & Wellness ═══
    parkingResults:           { required: [], optional: ['locations'] },
    fuelResults:              { required: [], optional: ['stations'] },
    weighStationResults:      { required: [], optional: ['stations'] },
    weatherData:              { required: [], optional: ['forecast'] },
    roadConditionsData:       { required: [], optional: ['conditions'] },
    truckRestrictionsData:    { required: [], optional: ['restrictions'] },
    fuelCardsLoaded:          { required: [], optional: ['cards'] },
    bypassServicesLoaded:     { required: [], optional: ['services'] },
    reviewsLoaded:            { required: [], optional: ['reviews'] },
    parkingDetailsLoaded:     { required: [], optional: ['location'] },
    healthResourcesLoaded:    { required: [], optional: ['resources'] },
    healthTipSubmitted:       { required: ['success'], optional: [] },
    petFriendlyLocationsLoaded: { required: [], optional: ['locations'] },
    petReviewSubmitted:       { required: ['success'], optional: [] },

    // ═══ Compliance ═══
    driverPoliciesLoaded:     { required: [], optional: ['policies'] },
    policyContentLoaded:      { required: [], optional: ['policy'] },
    policyAcknowledged:       { required: ['success'], optional: [] },

    // ═══ Mentorship ═══
    mentorsLoaded:            { required: [], optional: ['mentors'] },
    mentorProfileLoaded:      { required: [], optional: ['mentor'] },
    sessionRequested:         { required: ['success'], optional: [] },

    // ═══ Retention ═══
    retentionFrameworkLoaded: { required: [], optional: ['framework'] },
    staffingRequestResult:    { required: ['success'], optional: ['leadId', 'error'] },

    // ═══ Financial ═══
    expenseLogged:            { required: ['success'], optional: [] },
    expenseSummaryLoaded:     { required: [], optional: ['summary'] },

    // ═══ Agent & Voice ═══
    agentResponse:            { required: [], optional: ['response', 'conversationId', 'error'] },
    agentTyping:              { required: [], optional: [] },
    agentToolResult:          { required: [], optional: ['toolName', 'result'] },
    agentApprovalRequired:    { required: ['gateId', 'toolName'], optional: ['toolDescription', 'args', 'riskLevel', 'conversationId'] },
    voiceReady:               { required: [], optional: ['publicKey', 'assistantId'] },
    agentMemoryLoaded:        { required: [], optional: ['hasMemory', 'summaries'] },

    // ═══ Intelligence ═══
    marketSignalsLoaded:      { required: [], optional: ['condition', 'payFactor', 'signals'] },
    proactiveInsightsLoaded:  { required: [], optional: ['insights'] },
    nbaChipsLoaded:           { required: [], optional: ['chips'] },

    // ═══ Auth ═══
    userStatusUpdate:         { required: [], optional: ['loggedIn', 'memberId', 'role'] },
    loginSuccess:             { required: [], optional: ['memberId'] },
    loginCancelled:           { required: [], optional: [] },
    discoverabilityUpdated:   { required: [], optional: [] },

    // ═══ Generic ═══
    actionError:              { required: ['message'], optional: ['code', 'action'] },
    actionSuccess:            { required: ['message'], optional: ['action'] }
  };


  /* ───────────────────────────────────────────────────────────────
   * Validation
   * ─────────────────────────────────────────────────────────────── */

  /**
   * Validate a message against the contract.
   * @param {'inbound'|'outbound'} direction
   * @param {string} action
   * @param {object} payload
   * @returns {{ valid: boolean, error?: string }}
   */
  function validate(direction, action, payload) {
    var registry = direction === 'inbound' ? INBOUND : OUTBOUND;
    var schema = registry[action];

    if (!schema) {
      return { valid: false, error: 'Unknown ' + direction + ' action: ' + action };
    }

    if (!payload) payload = {};

    // Check required fields
    for (var i = 0; i < schema.required.length; i++) {
      var field = schema.required[i];
      if (payload[field] === undefined || payload[field] === null) {
        return { valid: false, error: 'Missing required field "' + field + '" for action "' + action + '"' };
      }
    }

    return { valid: true };
  }

  /**
   * Get the list of all registered action names for a direction.
   * @param {'inbound'|'outbound'} direction
   * @returns {string[]}
   */
  function getActions(direction) {
    var registry = direction === 'inbound' ? INBOUND : OUTBOUND;
    return Object.keys(registry);
  }

  /**
   * Check for duplicate action names across inbound/outbound.
   * Returns array of duplicates (actions registered in both directions).
   * Note: some actions like 'ping'/'pong' are intentionally split.
   * @returns {string[]}
   */
  function findDuplicates() {
    var inKeys = Object.keys(INBOUND);
    var outKeys = Object.keys(OUTBOUND);
    var dupes = [];
    for (var i = 0; i < inKeys.length; i++) {
      if (OUTBOUND[inKeys[i]]) {
        dupes.push(inKeys[i]);
      }
    }
    return dupes;
  }


  /* ───────────────────────────────────────────────────────────────
   * Legacy adapter — translates type-key to action-key
   * Used by driver-os-bridge.js for backward compatibility
   * ─────────────────────────────────────────────────────────────── */

  /**
   * Translate a legacy { type, data } message to { action, payload }.
   * Also handles the AI Matching envelope { type: 'carrierMatching', action, data }.
   * @param {object} msg - raw message from postMessage event
   * @returns {{ action: string, payload: object }|null}
   */
  function translateLegacy(msg) {
    if (!msg) return null;

    // Already action-key format
    if (msg.action && !msg.type) {
      return { action: msg.action, payload: msg.payload || msg.data || {} };
    }

    // AI Matching envelope: { type: 'carrierMatching', action, data }
    if (msg.type === 'carrierMatching' && msg.action) {
      return { action: msg.action, payload: msg.data || {} };
    }

    // Generic type-key: { type, data }
    if (msg.type && !msg.action) {
      return { action: msg.type, payload: msg.data || {} };
    }

    // Hybrid: has both action and type (some bridges do this)
    if (msg.action) {
      return { action: msg.action, payload: msg.payload || msg.data || {} };
    }

    return null;
  }


  /* ───────────────────────────────────────────────────────────────
   * Export as DOS.CONTRACT on the global scope
   * ─────────────────────────────────────────────────────────────── */
  window.DOS = window.DOS || {};
  window.DOS.CONTRACT = {
    inbound: INBOUND,
    outbound: OUTBOUND,
    validate: validate,
    getActions: getActions,
    findDuplicates: findDuplicates,
    translateLegacy: translateLegacy,
    VERSION: '1.0.0'
  };

})();
