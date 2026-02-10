/* eslint-disable */
/**
 * BRIDGE TESTS: Recruiter Console Page
 * =====================================
 * Tests the postMessage bridge between Recruiter Console page code and HTML.
 *
 * This is the largest page in the system with 51 inbound actions covering:
 *   - Core Dashboard (19 actions): carrier management, pipeline, messaging
 *   - Driver Search (10 actions): search, view, save, contact drivers
 *   - Saved Search (5 actions): CRUD for saved searches
 *   - Call Outcome (4 actions): logging and analytics
 *   - Intervention (6 actions): templates and sending
 *   - Pipeline Automation (6 actions): rule management
 *   - System Health (1 action): health check
 *
 * @module public/__tests__/recruiterConsole.bridge.test.js
 */

// =============================================================================
// MOCK SETUP
// =============================================================================

const mockWixLocation = {
    to: jest.fn()
};

const mockWixUsers = {
    currentUser: {
        loggedIn: false,
        id: null
    }
};

// Mock backend services
const mockRecruiterService = {
    getOrCreateRecruiterProfile: jest.fn(),
    addCarrier: jest.fn(),
    removeCarrier: jest.fn(),
    getRecruiterCarriers: jest.fn(),
    validateCarrierDOT: jest.fn(),
    getPipelineCandidates: jest.fn(),
    updateCandidateStatus: jest.fn(),
    getPipelineStats: jest.fn(),
    getCandidateDetails: jest.fn(),
    addRecruiterNotes: jest.fn(),
    updateRecruiterProfile: jest.fn()
};

const mockInterviewScheduler = {
    requestAvailability: jest.fn(),
    confirmTimeSlot: jest.fn()
};

const mockMessaging = {
    sendMessage: jest.fn(),
    getConversation: jest.fn(),
    markAsRead: jest.fn(),
    getNewMessages: jest.fn(),
    getUnreadCountForUser: jest.fn()
};

const mockDriverMatching = {
    findMatchingDrivers: jest.fn(),
    getDriverProfile: jest.fn()
};

const mockDriverOutreach = {
    saveToRecruiterPipeline: jest.fn(),
    sendMessageToDriver: jest.fn(),
    getQuotaStatus: jest.fn()
};

const mockSavedSearchService = {
    createSavedSearch: jest.fn(),
    updateSavedSearch: jest.fn(),
    deleteSavedSearch: jest.fn(),
    getSavedSearches: jest.fn(),
    executeSavedSearch: jest.fn()
};

const mockCallOutcomeService = {
    logCallOutcome: jest.fn(),
    getCarrierOutcomes: jest.fn(),
    getOutcomeAnalytics: jest.fn(),
    getDriverOutcomes: jest.fn()
};

const mockInterventionService = {
    getTemplates: jest.fn(),
    getAllTemplates: jest.fn(),
    createTemplate: jest.fn(),
    updateTemplate: jest.fn(),
    deleteTemplate: jest.fn(),
    sendIntervention: jest.fn(),
    logInterventionOutcome: jest.fn(),
    getDriverInterventions: jest.fn()
};

const mockPipelineAutomationService = {
    getAutomationRules: jest.fn(),
    createAutomationRule: jest.fn(),
    updateAutomationRule: jest.fn(),
    deleteAutomationRule: jest.fn(),
    toggleRuleStatus: jest.fn(),
    getAutomationLog: jest.fn()
};

const mockHealthService = {
    getRecruiterHealthStatus: jest.fn()
};

const mockFeatureAdoption = {
    logFeatureInteraction: jest.fn()
};

// Mock component
let capturedMessages = [];
const mockComponent = {
    postMessage: jest.fn((data) => {
        capturedMessages.push(data);
    }),
    rendered: true,
    onMessage: jest.fn()
};

function resetMocks() {
    capturedMessages = [];
    mockComponent.postMessage.mockClear();

    // Reset all service mocks
    Object.values(mockRecruiterService).forEach(fn => fn.mockReset());
    Object.values(mockInterviewScheduler).forEach(fn => fn.mockReset());
    Object.values(mockMessaging).forEach(fn => fn.mockReset());
    Object.values(mockDriverMatching).forEach(fn => fn.mockReset());
    Object.values(mockDriverOutreach).forEach(fn => fn.mockReset());
    Object.values(mockSavedSearchService).forEach(fn => fn.mockReset());
    Object.values(mockCallOutcomeService).forEach(fn => fn.mockReset());
    Object.values(mockInterventionService).forEach(fn => fn.mockReset());
    Object.values(mockPipelineAutomationService).forEach(fn => fn.mockReset());
    mockHealthService.getRecruiterHealthStatus.mockReset();
    mockFeatureAdoption.logFeatureInteraction.mockReset();
    mockWixLocation.to.mockClear();

    mockWixUsers.currentUser.loggedIn = false;
    mockWixUsers.currentUser.id = null;
}

// =============================================================================
// MESSAGE REGISTRY (from page code)
// =============================================================================

const MESSAGE_REGISTRY = {
    inbound: [
        'recruiterDashboardReady',
        'validateCarrier',
        'addCarrier',
        'removeCarrier',
        'switchCarrier',
        'getCarriers',
        'getPipeline',
        'updateCandidateStatus',
        'getStats',
        'getCandidateDetails',
        'addNotes',
        'sendMessage',
        'getConversation',
        'getNewMessages',
        'getUnreadCount',
        'markAsRead',
        'requestAvailability',
        'confirmTimeSlot',
        'ping',
        'driverSearchReady',
        'searchDrivers',
        'viewDriverProfile',
        'saveDriver',
        'contactDriver',
        'getQuotaStatus',
        'getWeightPreferences',
        'saveWeightPreferences',
        'navigateTo',
        'logFeatureInteraction',
        'saveSearch',
        'loadSavedSearches',
        'runSavedSearch',
        'deleteSavedSearch',
        'updateSavedSearch',
        'logCallOutcome',
        'getCallAnalytics',
        'getRecentCalls',
        'getDriverCallHistory',
        'getInterventionTemplates',
        'sendIntervention',
        'saveTemplate',
        'deleteTemplate',
        'logInterventionOutcome',
        'getDriverInterventions',
        'getAutomationRules',
        'createAutomationRule',
        'updateAutomationRule',
        'deleteAutomationRule',
        'toggleRuleStatus',
        'getAutomationLog',
        'getSystemHealth'
    ],
    outbound: [
        'recruiterReady',
        'carrierValidated',
        'carrierAdded',
        'carrierRemoved',
        'carrierSwitched',
        'carriersLoaded',
        'pipelineLoaded',
        'statusUpdated',
        'statsLoaded',
        'candidateDetails',
        'notesAdded',
        'conversationData',
        'messageSent',
        'newMessagesData',
        'unreadCountData',
        'error',
        'pong',
        'driverSearchInit',
        'searchDriversResult',
        'viewDriverProfileResult',
        'saveDriverResult',
        'contactDriverResult',
        'getQuotaStatusResult',
        'getWeightPreferencesResult',
        'saveWeightPreferencesResult',
        'recruiterProfile',
        'saveSearchResult',
        'savedSearchesLoaded',
        'savedSearchExecuted',
        'savedSearchDeleted',
        'savedSearchUpdated',
        'callOutcomeLogged',
        'callAnalyticsLoaded',
        'recentCallsLoaded',
        'driverCallHistoryLoaded',
        'interventionTemplatesLoaded',
        'interventionSent',
        'templateSaved',
        'templateDeleted',
        'interventionOutcomeLogged',
        'driverInterventionsLoaded',
        'automationRulesLoaded',
        'automationRuleCreated',
        'automationRuleUpdated',
        'automationRuleDeleted',
        'automationRuleToggled',
        'automationLogLoaded',
        'systemHealthUpdate'
    ]
};

// =============================================================================
// SIMULATED PAGE CODE (simplified handlers)
// =============================================================================

let cachedRecruiterProfile = null;
let cachedCarriers = [];
let currentCarrierDOT = null;

function resetPageState() {
    cachedRecruiterProfile = null;
    cachedCarriers = [];
    currentCarrierDOT = null;
}

function sendToHtml(type, data) {
    mockComponent.postMessage({ type, data, timestamp: Date.now() });
}

async function handleMessage(msg) {
    if (!msg || !msg.type) return;
    const action = msg.action || msg.type;

    switch (action) {
        case 'ping':
            sendToHtml('pong', {
                timestamp: Date.now(),
                registeredInbound: MESSAGE_REGISTRY.inbound.length,
                registeredOutbound: MESSAGE_REGISTRY.outbound.length
            });
            break;

        case 'recruiterDashboardReady':
            await handleDashboardReady();
            break;

        case 'validateCarrier':
            await handleValidateCarrier(msg.data);
            break;

        case 'addCarrier':
            await handleAddCarrier(msg.data);
            break;

        case 'removeCarrier':
            await handleRemoveCarrier(msg.data);
            break;

        case 'switchCarrier':
            await handleSwitchCarrier(msg.data);
            break;

        case 'getCarriers':
            await handleGetCarriers();
            break;

        case 'getPipeline':
            await handleGetPipeline(msg.data);
            break;

        case 'updateCandidateStatus':
            await handleUpdateStatus(msg.data);
            break;

        case 'getStats':
            await handleGetStats();
            break;

        case 'getCandidateDetails':
            await handleGetDetails(msg.data);
            break;

        case 'addNotes':
            await handleAddNotes(msg.data);
            break;

        case 'sendMessage':
            await handleSendMessage(msg.data);
            break;

        case 'getConversation':
            await handleGetConversation(msg.data);
            break;

        case 'markAsRead':
            await handleMarkAsRead(msg.data);
            break;

        case 'getNewMessages':
            await handleGetNewMessages(msg.data);
            break;

        case 'getUnreadCount':
            await handleGetUnreadCount();
            break;

        case 'requestAvailability':
            await handleRequestAvailability(msg.data);
            break;

        case 'confirmTimeSlot':
            await handleConfirmTimeSlot(msg.data);
            break;

        // Driver Search
        case 'driverSearchReady':
            await handleDriverSearchReady();
            break;

        case 'searchDrivers':
            await handleSearchDrivers(msg.data);
            break;

        case 'viewDriverProfile':
            await handleViewDriverProfile(msg.data);
            break;

        case 'saveDriver':
            await handleSaveDriver(msg.data);
            break;

        case 'contactDriver':
            await handleContactDriver(msg.data);
            break;

        case 'getQuotaStatus':
            await handleGetQuotaStatus();
            break;

        case 'getWeightPreferences':
            handleGetWeightPreferences();
            break;

        case 'saveWeightPreferences':
            await handleSaveWeightPreferences(msg.data);
            break;

        case 'navigateTo':
            handleNavigateTo(msg.data);
            break;

        case 'logFeatureInteraction':
            mockFeatureAdoption.logFeatureInteraction(msg.data);
            break;

        // Saved Search
        case 'saveSearch':
            await handleSaveSearch(msg.data);
            break;

        case 'loadSavedSearches':
            await handleLoadSavedSearches();
            break;

        case 'runSavedSearch':
            await handleRunSavedSearch(msg.data);
            break;

        case 'deleteSavedSearch':
            await handleDeleteSavedSearch(msg.data);
            break;

        case 'updateSavedSearch':
            await handleUpdateSavedSearch(msg.data);
            break;

        // Call Outcomes
        case 'logCallOutcome':
            await handleLogCallOutcome(msg.data);
            break;

        case 'getCallAnalytics':
            await handleGetCallAnalytics(msg.data);
            break;

        case 'getRecentCalls':
            await handleGetRecentCalls(msg.data);
            break;

        case 'getDriverCallHistory':
            await handleGetDriverCallHistory(msg.data);
            break;

        // Interventions
        case 'getInterventionTemplates':
            await handleGetInterventionTemplates(msg.data);
            break;

        case 'sendIntervention':
            await handleSendIntervention(msg.data);
            break;

        case 'saveTemplate':
            await handleSaveTemplate(msg.data);
            break;

        case 'deleteTemplate':
            await handleDeleteTemplate(msg.data);
            break;

        case 'logInterventionOutcome':
            await handleLogInterventionOutcome(msg.data);
            break;

        case 'getDriverInterventions':
            await handleGetDriverInterventions(msg.data);
            break;

        // Pipeline Automation
        case 'getAutomationRules':
            await handleGetAutomationRules();
            break;

        case 'createAutomationRule':
            await handleCreateAutomationRule(msg.data);
            break;

        case 'updateAutomationRule':
            await handleUpdateAutomationRule(msg.data);
            break;

        case 'deleteAutomationRule':
            await handleDeleteAutomationRule(msg.data);
            break;

        case 'toggleRuleStatus':
            await handleToggleRuleStatus(msg.data);
            break;

        case 'getAutomationLog':
            await handleGetAutomationLog();
            break;

        // System Health
        case 'getSystemHealth':
            await handleGetSystemHealth(msg.data);
            break;
    }
}

// Core Dashboard Handlers
async function handleDashboardReady() {
    if (!mockWixUsers.currentUser.loggedIn) {
        mockWixLocation.to('/account/my-account');
        return;
    }

    const result = await mockRecruiterService.getOrCreateRecruiterProfile();
    if (!result.success) {
        sendToHtml('error', { message: result.error });
        return;
    }

    cachedRecruiterProfile = result.profile;
    cachedCarriers = result.carriers || [];
    if (cachedCarriers.length > 0) {
        currentCarrierDOT = result.defaultCarrierDOT || cachedCarriers[0].carrier_dot;
    }

    sendToHtml('recruiterReady', {
        recruiterProfile: result.profile,
        carriers: cachedCarriers,
        currentCarrierDOT
    });
}

async function handleValidateCarrier(data) {
    const result = await mockRecruiterService.validateCarrierDOT(data.carrierDOT);
    sendToHtml('carrierValidated', result);
}

async function handleAddCarrier(data) {
    const result = await mockRecruiterService.addCarrier(data.carrierDOT);
    if (result.success) {
        cachedCarriers.unshift({ carrier_dot: data.carrierDOT });
        if (!currentCarrierDOT) currentCarrierDOT = data.carrierDOT;
    }
    sendToHtml('carrierAdded', { ...result, carriers: cachedCarriers, currentCarrierDOT });
}

async function handleRemoveCarrier(data) {
    const result = await mockRecruiterService.removeCarrier(data.carrierDOT);
    if (result.success) {
        cachedCarriers = cachedCarriers.filter(c => c.carrier_dot !== data.carrierDOT);
        if (currentCarrierDOT === data.carrierDOT) {
            currentCarrierDOT = cachedCarriers.length > 0 ? cachedCarriers[0].carrier_dot : null;
        }
    }
    sendToHtml('carrierRemoved', { ...result, carriers: cachedCarriers, currentCarrierDOT });
}

async function handleSwitchCarrier(data) {
    currentCarrierDOT = data.carrierDOT;
    sendToHtml('carrierSwitched', { success: true, currentCarrierDOT });
}

async function handleGetCarriers() {
    const result = await mockRecruiterService.getRecruiterCarriers();
    if (result.success) cachedCarriers = result.carriers;
    sendToHtml('carriersLoaded', { ...result, currentCarrierDOT });
}

async function handleGetPipeline(data) {
    if (!currentCarrierDOT) {
        sendToHtml('pipelineLoaded', { success: true, candidates: [], noCarrier: true });
        return;
    }
    const result = await mockRecruiterService.getPipelineCandidates(currentCarrierDOT, data?.filters || {});
    sendToHtml('pipelineLoaded', result);
}

async function handleUpdateStatus(data) {
    const result = await mockRecruiterService.updateCandidateStatus(data.interestId, data.newStatus);
    sendToHtml('statusUpdated', result);
}

async function handleGetStats() {
    if (!currentCarrierDOT) {
        sendToHtml('statsLoaded', { success: true, stats: {} });
        return;
    }
    const result = await mockRecruiterService.getPipelineStats(currentCarrierDOT);
    sendToHtml('statsLoaded', result);
}

async function handleGetDetails(data) {
    const result = await mockRecruiterService.getCandidateDetails(data.interestId);
    sendToHtml('candidateDetails', result);
}

async function handleAddNotes(data) {
    const result = await mockRecruiterService.addRecruiterNotes(data.interestId, data.notes);
    sendToHtml('notesAdded', result);
}

async function handleSendMessage(data) {
    const result = await mockMessaging.sendMessage(data.applicationId, data.content, data.receiverId);
    if (result.success) {
        sendToHtml('messageSent', { success: true, message: result.message });
    } else {
        sendToHtml('error', { message: result.error });
    }
}

async function handleGetConversation(data) {
    const result = await mockMessaging.getConversation(data.applicationId);
    if (result.success) {
        sendToHtml('conversationData', { applicationId: data.applicationId, messages: result.messages });
    } else {
        sendToHtml('error', { message: result.error });
    }
}

async function handleMarkAsRead(data) {
    await mockMessaging.markAsRead(data.applicationId);
}

async function handleGetNewMessages(data) {
    const result = await mockMessaging.getNewMessages(data.applicationId, data.sinceTimestamp);
    sendToHtml('newMessagesData', { messages: result.messages || [], applicationId: data.applicationId });
}

async function handleGetUnreadCount() {
    const result = await mockMessaging.getUnreadCountForUser();
    sendToHtml('unreadCountData', { count: result.count || 0, byApplication: result.byApplication || {} });
}

async function handleRequestAvailability(data) {
    const result = await mockInterviewScheduler.requestAvailability(data.applicationId);
    if (!result.success) sendToHtml('error', { message: result.error });
}

async function handleConfirmTimeSlot(data) {
    const result = await mockInterviewScheduler.confirmTimeSlot(data.applicationId, data.slotIndex);
    if (!result.success) sendToHtml('error', { message: result.error });
}

// Driver Search Handlers
async function handleDriverSearchReady() {
    if (!mockWixUsers.currentUser.loggedIn) {
        sendToHtml('error', { message: 'Not authenticated' });
        return;
    }

    const quotaStatus = currentCarrierDOT
        ? await mockDriverOutreach.getQuotaStatus(currentCarrierDOT)
        : { tier: 'free', used: 0, limit: 5, remaining: 5 };

    sendToHtml('driverSearchInit', {
        success: true,
        carriers: cachedCarriers,
        currentCarrierDOT,
        quotaStatus,
        recruiterProfile: cachedRecruiterProfile
    });
}

async function handleSearchDrivers(data) {
    if (!currentCarrierDOT) {
        sendToHtml('searchDriversResult', { success: false, error: 'No carrier selected' });
        return;
    }
    const result = await mockDriverMatching.findMatchingDrivers(currentCarrierDOT, data);
    const quotaStatus = await mockDriverOutreach.getQuotaStatus(currentCarrierDOT);
    sendToHtml('searchDriversResult', { ...result, quotaStatus });
}

async function handleViewDriverProfile(data) {
    if (!currentCarrierDOT) {
        sendToHtml('viewDriverProfileResult', { success: false, error: 'No carrier selected' });
        return;
    }
    const result = await mockDriverMatching.getDriverProfile(currentCarrierDOT, data.driverId);
    const quotaStatus = await mockDriverOutreach.getQuotaStatus(currentCarrierDOT);
    sendToHtml('viewDriverProfileResult', { ...result, quotaStatus });
}

async function handleSaveDriver(data) {
    if (!currentCarrierDOT) {
        sendToHtml('saveDriverResult', { success: false, error: 'No carrier selected' });
        return;
    }
    const result = await mockDriverOutreach.saveToRecruiterPipeline(currentCarrierDOT, data.driverId);
    sendToHtml('saveDriverResult', result);
}

async function handleContactDriver(data) {
    if (!currentCarrierDOT) {
        sendToHtml('contactDriverResult', { success: false, error: 'No carrier selected' });
        return;
    }
    const result = await mockDriverOutreach.sendMessageToDriver(currentCarrierDOT, data.driverId, data.message);
    sendToHtml('contactDriverResult', result);
}

async function handleGetQuotaStatus() {
    if (!currentCarrierDOT) {
        sendToHtml('getQuotaStatusResult', { tier: 'free', used: 0, limit: 5, remaining: 5 });
        return;
    }
    const result = await mockDriverOutreach.getQuotaStatus(currentCarrierDOT);
    sendToHtml('getQuotaStatusResult', result);
}

function handleGetWeightPreferences() {
    const preferences = cachedRecruiterProfile?.weight_preferences || {
        weight_qualifications: 25,
        weight_experience: 20,
        weight_location: 20,
        weight_availability: 15,
        weight_salary_fit: 10,
        weight_engagement: 10
    };
    sendToHtml('getWeightPreferencesResult', { success: true, preferences });
}

async function handleSaveWeightPreferences(data) {
    const result = await mockRecruiterService.updateRecruiterProfile({ weight_preferences: data });
    if (result.success && result.profile) cachedRecruiterProfile = result.profile;
    sendToHtml('saveWeightPreferencesResult', result);
}

function handleNavigateTo(data) {
    if (!data || !data.page) return;
    const pageRoutes = {
        'dashboard': '/recruiter-console',
        'driver-search': '/recruiter-driver-search',
        'settings': '/account/my-account'
    };
    mockWixLocation.to(pageRoutes[data.page] || data.page);
}

// Saved Search Handlers
async function handleSaveSearch(data) {
    if (!currentCarrierDOT) {
        sendToHtml('saveSearchResult', { success: false, error: 'No carrier selected' });
        return;
    }
    const result = await mockSavedSearchService.createSavedSearch(currentCarrierDOT, data);
    sendToHtml('saveSearchResult', result);
}

async function handleLoadSavedSearches() {
    if (!currentCarrierDOT) {
        sendToHtml('savedSearchesLoaded', { success: true, searches: [] });
        return;
    }
    const result = await mockSavedSearchService.getSavedSearches(currentCarrierDOT);
    sendToHtml('savedSearchesLoaded', result);
}

async function handleRunSavedSearch(data) {
    const result = await mockSavedSearchService.executeSavedSearch(data.searchId);
    sendToHtml('savedSearchExecuted', result);
}

async function handleDeleteSavedSearch(data) {
    const result = await mockSavedSearchService.deleteSavedSearch(data.searchId);
    sendToHtml('savedSearchDeleted', { ...result, searchId: data.searchId });
}

async function handleUpdateSavedSearch(data) {
    const result = await mockSavedSearchService.updateSavedSearch(data.searchId, data);
    sendToHtml('savedSearchUpdated', result);
}

// Call Outcome Handlers
async function handleLogCallOutcome(data) {
    if (!currentCarrierDOT) {
        sendToHtml('callOutcomeLogged', { success: false, error: 'No carrier selected' });
        return;
    }
    const result = await mockCallOutcomeService.logCallOutcome(currentCarrierDOT, data);
    sendToHtml('callOutcomeLogged', result);
}

async function handleGetCallAnalytics(data) {
    if (!currentCarrierDOT) {
        sendToHtml('callAnalyticsLoaded', { success: true, analytics: {} });
        return;
    }
    const result = await mockCallOutcomeService.getOutcomeAnalytics(currentCarrierDOT, data);
    sendToHtml('callAnalyticsLoaded', result);
}

async function handleGetRecentCalls(data) {
    if (!currentCarrierDOT) {
        sendToHtml('recentCallsLoaded', { success: true, outcomes: [] });
        return;
    }
    const result = await mockCallOutcomeService.getCarrierOutcomes(currentCarrierDOT, data);
    sendToHtml('recentCallsLoaded', result);
}

async function handleGetDriverCallHistory(data) {
    const result = await mockCallOutcomeService.getDriverOutcomes(data.driverId);
    sendToHtml('driverCallHistoryLoaded', result);
}

// Intervention Handlers
async function handleGetInterventionTemplates(data) {
    if (!currentCarrierDOT) {
        sendToHtml('interventionTemplatesLoaded', { success: true, templatesByRiskType: {} });
        return;
    }
    const result = data?.riskType
        ? await mockInterventionService.getTemplates(currentCarrierDOT, data.riskType)
        : await mockInterventionService.getAllTemplates(currentCarrierDOT);
    sendToHtml('interventionTemplatesLoaded', result);
}

async function handleSendIntervention(data) {
    const result = await mockInterventionService.sendIntervention(data.templateId, data.driverId);
    sendToHtml('interventionSent', result);
}

async function handleSaveTemplate(data) {
    if (!currentCarrierDOT) {
        sendToHtml('templateSaved', { success: false, error: 'No carrier selected' });
        return;
    }
    const result = data.templateId
        ? await mockInterventionService.updateTemplate(data.templateId, data)
        : await mockInterventionService.createTemplate(currentCarrierDOT, data);
    sendToHtml('templateSaved', result);
}

async function handleDeleteTemplate(data) {
    const result = await mockInterventionService.deleteTemplate(data.templateId);
    sendToHtml('templateDeleted', { ...result, templateId: data.templateId });
}

async function handleLogInterventionOutcome(data) {
    const result = await mockInterventionService.logInterventionOutcome(data.interventionId, data.outcome);
    sendToHtml('interventionOutcomeLogged', result);
}

async function handleGetDriverInterventions(data) {
    const result = await mockInterventionService.getDriverInterventions(data.driverId);
    sendToHtml('driverInterventionsLoaded', result);
}

// Pipeline Automation Handlers
async function handleGetAutomationRules() {
    if (!currentCarrierDOT) {
        sendToHtml('automationRulesLoaded', { success: true, rules: [] });
        return;
    }
    const result = await mockPipelineAutomationService.getAutomationRules(currentCarrierDOT);
    sendToHtml('automationRulesLoaded', result);
}

async function handleCreateAutomationRule(data) {
    if (!currentCarrierDOT) {
        sendToHtml('automationRuleCreated', { success: false, error: 'No carrier selected' });
        return;
    }
    const result = await mockPipelineAutomationService.createAutomationRule(currentCarrierDOT, data);
    sendToHtml('automationRuleCreated', result);
}

async function handleUpdateAutomationRule(data) {
    const result = await mockPipelineAutomationService.updateAutomationRule(data.ruleId, data);
    sendToHtml('automationRuleUpdated', result);
}

async function handleDeleteAutomationRule(data) {
    const result = await mockPipelineAutomationService.deleteAutomationRule(data.ruleId);
    sendToHtml('automationRuleDeleted', { ...result, ruleId: data.ruleId });
}

async function handleToggleRuleStatus(data) {
    const result = await mockPipelineAutomationService.toggleRuleStatus(data.ruleId, data.isActive);
    sendToHtml('automationRuleToggled', { ...result, ruleId: data.ruleId });
}

async function handleGetAutomationLog() {
    if (!currentCarrierDOT) return;
    const result = await mockPipelineAutomationService.getAutomationLog(currentCarrierDOT);
    sendToHtml('automationLogLoaded', result);
}

// System Health Handler
async function handleGetSystemHealth(data) {
    const carrierDot = data?.carrierDot || currentCarrierDOT;
    const result = await mockHealthService.getRecruiterHealthStatus(carrierDot);
    sendToHtml('systemHealthUpdate', result);
}

// =============================================================================
// TESTS
// =============================================================================

describe('Recruiter Console Bridge Tests', () => {
    beforeEach(() => {
        resetMocks();
        resetPageState();
    });

    // -------------------------------------------------------------------------
    // SOURCE STRUCTURE CHECKS
    // -------------------------------------------------------------------------
    describe('Source Structure Checks', () => {
        test('MESSAGE_REGISTRY.inbound should have 51 expected actions', () => {
            expect(MESSAGE_REGISTRY.inbound.length).toBe(51);
        });

        test('MESSAGE_REGISTRY.outbound should have all expected messages', () => {
            expect(MESSAGE_REGISTRY.outbound).toContain('recruiterReady');
            expect(MESSAGE_REGISTRY.outbound).toContain('pipelineLoaded');
            expect(MESSAGE_REGISTRY.outbound).toContain('searchDriversResult');
            expect(MESSAGE_REGISTRY.outbound).toContain('callOutcomeLogged');
            expect(MESSAGE_REGISTRY.outbound).toContain('interventionSent');
            expect(MESSAGE_REGISTRY.outbound).toContain('automationRulesLoaded');
            expect(MESSAGE_REGISTRY.outbound).toContain('systemHealthUpdate');
        });
    });

    // -------------------------------------------------------------------------
    // HEALTH CHECK
    // -------------------------------------------------------------------------
    describe('Health Check (ping/pong)', () => {
        test('should respond to ping with pong', async () => {
            await handleMessage({ type: 'ping' });

            expect(capturedMessages).toHaveLength(1);
            expect(capturedMessages[0].type).toBe('pong');
            expect(capturedMessages[0].data.registeredInbound).toBe(51);
        });
    });

    // -------------------------------------------------------------------------
    // CORE DASHBOARD
    // -------------------------------------------------------------------------
    describe('Core Dashboard Actions', () => {
        test('should redirect to login if not authenticated on dashboardReady', async () => {
            await handleMessage({ type: 'recruiterDashboardReady' });

            expect(mockWixLocation.to).toHaveBeenCalledWith('/account/my-account');
        });

        test('should send recruiterReady with profile and carriers when authenticated', async () => {
            mockWixUsers.currentUser.loggedIn = true;
            mockRecruiterService.getOrCreateRecruiterProfile.mockResolvedValue({
                success: true,
                profile: { _id: 'rec123', display_name: 'Test Recruiter' },
                carriers: [{ carrier_dot: '1234567', carrier_name: 'Test Carrier' }],
                defaultCarrierDOT: '1234567'
            });

            await handleMessage({ type: 'recruiterDashboardReady' });

            expect(capturedMessages[0].type).toBe('recruiterReady');
            expect(capturedMessages[0].data.recruiterProfile.display_name).toBe('Test Recruiter');
            expect(capturedMessages[0].data.carriers).toHaveLength(1);
            expect(capturedMessages[0].data.currentCarrierDOT).toBe('1234567');
        });

        test('should validate carrier DOT', async () => {
            mockRecruiterService.validateCarrierDOT.mockResolvedValue({
                success: true,
                valid: true,
                carrier: { legal_name: 'Swift' }
            });

            await handleMessage({ type: 'validateCarrier', data: { carrierDOT: '1234567' } });

            expect(capturedMessages[0].type).toBe('carrierValidated');
            expect(capturedMessages[0].data.valid).toBe(true);
        });

        test('should add carrier and set as current if first', async () => {
            mockRecruiterService.addCarrier.mockResolvedValue({ success: true });

            await handleMessage({ type: 'addCarrier', data: { carrierDOT: '9999999' } });

            expect(capturedMessages[0].type).toBe('carrierAdded');
            expect(currentCarrierDOT).toBe('9999999');
        });

        test('should remove carrier and switch current if removed', async () => {
            cachedCarriers = [{ carrier_dot: '111' }, { carrier_dot: '222' }];
            currentCarrierDOT = '111';
            mockRecruiterService.removeCarrier.mockResolvedValue({ success: true });

            await handleMessage({ type: 'removeCarrier', data: { carrierDOT: '111' } });

            expect(capturedMessages[0].type).toBe('carrierRemoved');
            expect(currentCarrierDOT).toBe('222');
        });

        test('should switch carrier', async () => {
            cachedCarriers = [{ carrier_dot: '111' }, { carrier_dot: '222' }];
            currentCarrierDOT = '111';

            await handleMessage({ type: 'switchCarrier', data: { carrierDOT: '222' } });

            expect(capturedMessages[0].type).toBe('carrierSwitched');
            expect(currentCarrierDOT).toBe('222');
        });

        test('should load pipeline for current carrier', async () => {
            currentCarrierDOT = '1234567';
            mockRecruiterService.getPipelineCandidates.mockResolvedValue({
                success: true,
                candidates: [{ _id: 'cand1', display_name: 'Driver 1' }]
            });

            await handleMessage({ type: 'getPipeline' });

            expect(capturedMessages[0].type).toBe('pipelineLoaded');
            expect(capturedMessages[0].data.candidates).toHaveLength(1);
        });

        test('should return empty pipeline if no carrier selected', async () => {
            await handleMessage({ type: 'getPipeline' });

            expect(capturedMessages[0].type).toBe('pipelineLoaded');
            expect(capturedMessages[0].data.noCarrier).toBe(true);
        });

        test('should update candidate status', async () => {
            mockRecruiterService.updateCandidateStatus.mockResolvedValue({ success: true });

            await handleMessage({
                type: 'updateCandidateStatus',
                data: { interestId: 'int123', newStatus: 'contacted' }
            });

            expect(capturedMessages[0].type).toBe('statusUpdated');
        });

        test('should load stats for carrier', async () => {
            currentCarrierDOT = '1234567';
            mockRecruiterService.getPipelineStats.mockResolvedValue({
                success: true,
                stats: { total: 50, contacted: 20 }
            });

            await handleMessage({ type: 'getStats' });

            expect(capturedMessages[0].type).toBe('statsLoaded');
            expect(capturedMessages[0].data.stats.total).toBe(50);
        });

        test('should get candidate details', async () => {
            mockRecruiterService.getCandidateDetails.mockResolvedValue({
                success: true,
                candidate: { _id: 'cand1', display_name: 'John Doe' }
            });

            await handleMessage({ type: 'getCandidateDetails', data: { interestId: 'int123' } });

            expect(capturedMessages[0].type).toBe('candidateDetails');
        });

        test('should add notes to candidate', async () => {
            mockRecruiterService.addRecruiterNotes.mockResolvedValue({ success: true });

            await handleMessage({
                type: 'addNotes',
                data: { interestId: 'int123', notes: 'Good candidate' }
            });

            expect(capturedMessages[0].type).toBe('notesAdded');
        });
    });

    // -------------------------------------------------------------------------
    // MESSAGING
    // -------------------------------------------------------------------------
    describe('Messaging Actions', () => {
        test('should send message and return success', async () => {
            mockMessaging.sendMessage.mockResolvedValue({
                success: true,
                message: { _id: 'msg123' }
            });

            await handleMessage({
                type: 'sendMessage',
                data: { applicationId: 'app123', content: 'Hello!', receiverId: 'driver456' }
            });

            expect(capturedMessages[0].type).toBe('messageSent');
        });

        test('should get conversation', async () => {
            mockMessaging.getConversation.mockResolvedValue({
                success: true,
                messages: [{ content: 'Hi there' }]
            });

            await handleMessage({ type: 'getConversation', data: { applicationId: 'app123' } });

            expect(capturedMessages[0].type).toBe('conversationData');
            expect(capturedMessages[0].data.messages).toHaveLength(1);
        });

        test('should get new messages for polling', async () => {
            mockMessaging.getNewMessages.mockResolvedValue({
                messages: [{ content: 'New message' }],
                hasNew: true
            });

            await handleMessage({
                type: 'getNewMessages',
                data: { applicationId: 'app123', sinceTimestamp: Date.now() }
            });

            expect(capturedMessages[0].type).toBe('newMessagesData');
        });

        test('should get unread count', async () => {
            mockMessaging.getUnreadCountForUser.mockResolvedValue({
                count: 5,
                byApplication: { app123: 3, app456: 2 }
            });

            await handleMessage({ type: 'getUnreadCount' });

            expect(capturedMessages[0].type).toBe('unreadCountData');
            expect(capturedMessages[0].data.count).toBe(5);
        });
    });

    // -------------------------------------------------------------------------
    // DRIVER SEARCH
    // -------------------------------------------------------------------------
    describe('Driver Search Actions', () => {
        test('should initialize driver search with quota', async () => {
            mockWixUsers.currentUser.loggedIn = true;
            currentCarrierDOT = '1234567';
            mockDriverOutreach.getQuotaStatus.mockResolvedValue({
                tier: 'pro',
                used: 10,
                limit: 50,
                remaining: 40
            });

            await handleMessage({ type: 'driverSearchReady' });

            expect(capturedMessages[0].type).toBe('driverSearchInit');
            expect(capturedMessages[0].data.quotaStatus.tier).toBe('pro');
        });

        test('should search drivers', async () => {
            currentCarrierDOT = '1234567';
            mockDriverMatching.findMatchingDrivers.mockResolvedValue({
                success: true,
                drivers: [{ _id: 'driver1', match_score: 85 }],
                total: 1
            });
            mockDriverOutreach.getQuotaStatus.mockResolvedValue({ tier: 'pro' });

            await handleMessage({
                type: 'searchDrivers',
                data: { cdlClass: 'A', minExperience: 2 }
            });

            expect(capturedMessages[0].type).toBe('searchDriversResult');
            expect(capturedMessages[0].data.drivers).toHaveLength(1);
        });

        test('should view driver profile', async () => {
            currentCarrierDOT = '1234567';
            mockDriverMatching.getDriverProfile.mockResolvedValue({
                success: true,
                driver: { _id: 'driver1', display_name: 'Test Driver' }
            });
            mockDriverOutreach.getQuotaStatus.mockResolvedValue({ tier: 'pro' });

            await handleMessage({
                type: 'viewDriverProfile',
                data: { driverId: 'driver1' }
            });

            expect(capturedMessages[0].type).toBe('viewDriverProfileResult');
            expect(capturedMessages[0].data.driver.display_name).toBe('Test Driver');
        });

        test('should save driver to pipeline', async () => {
            currentCarrierDOT = '1234567';
            mockDriverOutreach.saveToRecruiterPipeline.mockResolvedValue({
                success: true,
                interestId: 'int123'
            });

            await handleMessage({
                type: 'saveDriver',
                data: { driverId: 'driver1', matchScore: 85 }
            });

            expect(capturedMessages[0].type).toBe('saveDriverResult');
            expect(capturedMessages[0].data.success).toBe(true);
        });

        test('should contact driver', async () => {
            currentCarrierDOT = '1234567';
            mockDriverOutreach.sendMessageToDriver.mockResolvedValue({
                success: true,
                messageId: 'msg123'
            });

            await handleMessage({
                type: 'contactDriver',
                data: { driverId: 'driver1', message: 'We have a great opportunity!' }
            });

            expect(capturedMessages[0].type).toBe('contactDriverResult');
        });

        test('should get and save weight preferences', async () => {
            cachedRecruiterProfile = { weight_preferences: { weight_qualifications: 30 } };

            await handleMessage({ type: 'getWeightPreferences' });

            expect(capturedMessages[0].type).toBe('getWeightPreferencesResult');
            expect(capturedMessages[0].data.preferences.weight_qualifications).toBe(30);

            mockRecruiterService.updateRecruiterProfile.mockResolvedValue({ success: true });
            await handleMessage({
                type: 'saveWeightPreferences',
                data: { weight_qualifications: 35 }
            });

            expect(capturedMessages[1].type).toBe('saveWeightPreferencesResult');
        });
    });

    // -------------------------------------------------------------------------
    // SAVED SEARCHES
    // -------------------------------------------------------------------------
    describe('Saved Search Actions', () => {
        beforeEach(() => {
            currentCarrierDOT = '1234567';
        });

        test('should create saved search', async () => {
            mockSavedSearchService.createSavedSearch.mockResolvedValue({
                success: true,
                search: { _id: 'search1' }
            });

            await handleMessage({
                type: 'saveSearch',
                data: { name: 'Class A Texas', filters: { cdlClass: 'A', state: 'TX' } }
            });

            expect(capturedMessages[0].type).toBe('saveSearchResult');
        });

        test('should load saved searches', async () => {
            mockSavedSearchService.getSavedSearches.mockResolvedValue({
                success: true,
                searches: [{ _id: 'search1', name: 'Test Search' }]
            });

            await handleMessage({ type: 'loadSavedSearches' });

            expect(capturedMessages[0].type).toBe('savedSearchesLoaded');
        });

        test('should execute saved search', async () => {
            mockSavedSearchService.executeSavedSearch.mockResolvedValue({
                success: true,
                drivers: [{ _id: 'driver1' }]
            });

            await handleMessage({ type: 'runSavedSearch', data: { searchId: 'search1' } });

            expect(capturedMessages[0].type).toBe('savedSearchExecuted');
        });

        test('should delete saved search', async () => {
            mockSavedSearchService.deleteSavedSearch.mockResolvedValue({ success: true });

            await handleMessage({ type: 'deleteSavedSearch', data: { searchId: 'search1' } });

            expect(capturedMessages[0].type).toBe('savedSearchDeleted');
            expect(capturedMessages[0].data.searchId).toBe('search1');
        });
    });

    // -------------------------------------------------------------------------
    // CALL OUTCOMES
    // -------------------------------------------------------------------------
    describe('Call Outcome Actions', () => {
        beforeEach(() => {
            currentCarrierDOT = '1234567';
        });

        test('should log call outcome', async () => {
            mockCallOutcomeService.logCallOutcome.mockResolvedValue({
                success: true,
                outcomeId: 'outcome1'
            });

            await handleMessage({
                type: 'logCallOutcome',
                data: { driverId: 'driver1', outcome: 'interested', notes: 'Will call back' }
            });

            expect(capturedMessages[0].type).toBe('callOutcomeLogged');
        });

        test('should get call analytics', async () => {
            mockCallOutcomeService.getOutcomeAnalytics.mockResolvedValue({
                success: true,
                analytics: { totalCalls: 100, successRate: 0.35 }
            });

            await handleMessage({ type: 'getCallAnalytics' });

            expect(capturedMessages[0].type).toBe('callAnalyticsLoaded');
        });

        test('should get recent calls', async () => {
            mockCallOutcomeService.getCarrierOutcomes.mockResolvedValue({
                success: true,
                outcomes: [{ _id: 'call1' }]
            });

            await handleMessage({ type: 'getRecentCalls' });

            expect(capturedMessages[0].type).toBe('recentCallsLoaded');
        });

        test('should get driver call history', async () => {
            mockCallOutcomeService.getDriverOutcomes.mockResolvedValue({
                success: true,
                outcomes: [{ _id: 'call1', outcome: 'interested' }]
            });

            await handleMessage({ type: 'getDriverCallHistory', data: { driverId: 'driver1' } });

            expect(capturedMessages[0].type).toBe('driverCallHistoryLoaded');
        });
    });

    // -------------------------------------------------------------------------
    // INTERVENTIONS
    // -------------------------------------------------------------------------
    describe('Intervention Actions', () => {
        beforeEach(() => {
            currentCarrierDOT = '1234567';
        });

        test('should get intervention templates', async () => {
            mockInterventionService.getAllTemplates.mockResolvedValue({
                success: true,
                templatesByRiskType: { high_risk: [{ _id: 'tpl1' }] }
            });

            await handleMessage({ type: 'getInterventionTemplates' });

            expect(capturedMessages[0].type).toBe('interventionTemplatesLoaded');
        });

        test('should send intervention', async () => {
            mockInterventionService.sendIntervention.mockResolvedValue({
                success: true,
                interventionId: 'int1'
            });

            await handleMessage({
                type: 'sendIntervention',
                data: { templateId: 'tpl1', driverId: 'driver1' }
            });

            expect(capturedMessages[0].type).toBe('interventionSent');
        });

        test('should create new template', async () => {
            mockInterventionService.createTemplate.mockResolvedValue({
                success: true,
                template: { _id: 'tpl1' }
            });

            await handleMessage({
                type: 'saveTemplate',
                data: { name: 'New Template', riskType: 'high_risk' }
            });

            expect(capturedMessages[0].type).toBe('templateSaved');
        });

        test('should update existing template', async () => {
            mockInterventionService.updateTemplate.mockResolvedValue({ success: true });

            await handleMessage({
                type: 'saveTemplate',
                data: { templateId: 'tpl1', name: 'Updated Template' }
            });

            expect(mockInterventionService.updateTemplate).toHaveBeenCalled();
        });

        test('should delete template', async () => {
            mockInterventionService.deleteTemplate.mockResolvedValue({ success: true });

            await handleMessage({ type: 'deleteTemplate', data: { templateId: 'tpl1' } });

            expect(capturedMessages[0].type).toBe('templateDeleted');
        });

        test('should log intervention outcome', async () => {
            mockInterventionService.logInterventionOutcome.mockResolvedValue({ success: true });

            await handleMessage({
                type: 'logInterventionOutcome',
                data: { interventionId: 'int1', outcome: 'positive_response' }
            });

            expect(capturedMessages[0].type).toBe('interventionOutcomeLogged');
        });

        test('should get driver interventions', async () => {
            mockInterventionService.getDriverInterventions.mockResolvedValue({
                success: true,
                interventions: [{ _id: 'int1' }]
            });

            await handleMessage({
                type: 'getDriverInterventions',
                data: { driverId: 'driver1' }
            });

            expect(capturedMessages[0].type).toBe('driverInterventionsLoaded');
        });
    });

    // -------------------------------------------------------------------------
    // PIPELINE AUTOMATION
    // -------------------------------------------------------------------------
    describe('Pipeline Automation Actions', () => {
        beforeEach(() => {
            currentCarrierDOT = '1234567';
        });

        test('should get automation rules', async () => {
            mockPipelineAutomationService.getAutomationRules.mockResolvedValue({
                success: true,
                rules: [{ _id: 'rule1', name: 'Auto follow-up' }]
            });

            await handleMessage({ type: 'getAutomationRules' });

            expect(capturedMessages[0].type).toBe('automationRulesLoaded');
        });

        test('should create automation rule', async () => {
            mockPipelineAutomationService.createAutomationRule.mockResolvedValue({
                success: true,
                rule: { _id: 'rule1' }
            });

            await handleMessage({
                type: 'createAutomationRule',
                data: { name: 'New Rule', trigger: 'status_change' }
            });

            expect(capturedMessages[0].type).toBe('automationRuleCreated');
        });

        test('should update automation rule', async () => {
            mockPipelineAutomationService.updateAutomationRule.mockResolvedValue({ success: true });

            await handleMessage({
                type: 'updateAutomationRule',
                data: { ruleId: 'rule1', name: 'Updated Rule' }
            });

            expect(capturedMessages[0].type).toBe('automationRuleUpdated');
        });

        test('should delete automation rule', async () => {
            mockPipelineAutomationService.deleteAutomationRule.mockResolvedValue({ success: true });

            await handleMessage({ type: 'deleteAutomationRule', data: { ruleId: 'rule1' } });

            expect(capturedMessages[0].type).toBe('automationRuleDeleted');
        });

        test('should toggle rule status', async () => {
            mockPipelineAutomationService.toggleRuleStatus.mockResolvedValue({ success: true });

            await handleMessage({
                type: 'toggleRuleStatus',
                data: { ruleId: 'rule1', isActive: false }
            });

            expect(capturedMessages[0].type).toBe('automationRuleToggled');
        });

        test('should get automation log', async () => {
            mockPipelineAutomationService.getAutomationLog.mockResolvedValue({
                success: true,
                log: [{ timestamp: Date.now(), action: 'rule_executed' }]
            });

            await handleMessage({ type: 'getAutomationLog' });

            expect(capturedMessages[0].type).toBe('automationLogLoaded');
        });
    });

    // -------------------------------------------------------------------------
    // SYSTEM HEALTH
    // -------------------------------------------------------------------------
    describe('System Health Actions', () => {
        test('should get system health status', async () => {
            mockHealthService.getRecruiterHealthStatus.mockResolvedValue({
                status: 'operational',
                services: { database: 'healthy', ai: 'healthy' }
            });

            await handleMessage({ type: 'getSystemHealth' });

            expect(capturedMessages[0].type).toBe('systemHealthUpdate');
            expect(capturedMessages[0].data.status).toBe('operational');
        });
    });

    // -------------------------------------------------------------------------
    // NAVIGATION
    // -------------------------------------------------------------------------
    describe('Navigation Actions', () => {
        test('should navigate to specified page', () => {
            handleNavigateTo({ page: 'driver-search' });

            expect(mockWixLocation.to).toHaveBeenCalledWith('/recruiter-driver-search');
        });

        test('should use custom route if not in map', () => {
            handleNavigateTo({ page: '/custom-page' });

            expect(mockWixLocation.to).toHaveBeenCalledWith('/custom-page');
        });
    });

    // -------------------------------------------------------------------------
    // FEATURE TRACKING
    // -------------------------------------------------------------------------
    describe('Feature Tracking', () => {
        test('should log feature interaction', async () => {
            await handleMessage({
                type: 'logFeatureInteraction',
                data: { featureId: 'driver_search', action: 'click' }
            });

            expect(mockFeatureAdoption.logFeatureInteraction).toHaveBeenCalledWith(
                expect.objectContaining({ featureId: 'driver_search' })
            );
        });
    });

    // -------------------------------------------------------------------------
    // ERROR HANDLING
    // -------------------------------------------------------------------------
    describe('Error Handling', () => {
        test('should handle null message gracefully', async () => {
            await expect(handleMessage(null)).resolves.not.toThrow();
        });

        test('should handle message without type', async () => {
            await expect(handleMessage({ data: {} })).resolves.not.toThrow();
        });

        test('should handle service errors', async () => {
            currentCarrierDOT = '1234567';
            mockRecruiterService.getPipelineCandidates.mockRejectedValue(new Error('Service error'));

            await expect(handleMessage({ type: 'getPipeline' })).rejects.toThrow('Service error');
        });
    });

    // -------------------------------------------------------------------------
    // NO CARRIER SELECTED GUARDS
    // -------------------------------------------------------------------------
    describe('No Carrier Selected Guards', () => {
        test('searchDrivers should return error if no carrier', async () => {
            await handleMessage({ type: 'searchDrivers', data: {} });

            expect(capturedMessages[0].type).toBe('searchDriversResult');
            expect(capturedMessages[0].data.success).toBe(false);
            expect(capturedMessages[0].data.error).toContain('No carrier');
        });

        test('saveDriver should return error if no carrier', async () => {
            await handleMessage({ type: 'saveDriver', data: { driverId: 'd1' } });

            expect(capturedMessages[0].data.error).toContain('No carrier');
        });

        test('logCallOutcome should return error if no carrier', async () => {
            await handleMessage({ type: 'logCallOutcome', data: {} });

            expect(capturedMessages[0].data.error).toContain('No carrier');
        });
    });
});
