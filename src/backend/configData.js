/**
 * Feature Flag Configuration for Data Source Migration
 *
 * IMPORTANT: This is a plain .js file (NOT .jsw) so that exports remain
 * synchronous when called from other backend modules. Wix Velo's web-module
 * system wraps .jsw exports as Promises, which caused NON_STRING_TABLE_NAME
 * errors when config helpers were imported from config.jsw.
 *
 * All backend files should import from 'backend/configData' (this file).
 * config.jsw is kept as a thin re-export for any frontend/page callers.
 *
 * To migrate a collection to Airtable:
 * 1. Change the value from 'wix' to 'airtable'
 * 2. Ensure the Airtable table exists with matching schema
 * 3. Test thoroughly before deploying
 *
 * To rollback: Simply change the value back to 'wix'
 */

// =============================================================================
// DATA SOURCE CONFIGURATION
// =============================================================================

/**
 * Central configuration object mapping each collection to its data source.
 * Values: 'wix' | 'airtable'
 */
export const DATA_SOURCE = {
  // -------------------------------------------------------------------------
  // Core Business Data
  // -------------------------------------------------------------------------
  carriers: 'airtable',           // FMCSA reference data — Carriers (Master), ~25k records
  carrierAccounts: 'airtable',    // Active platform carrier accounts — v2_Carriers (has Owner)
  driverProfiles: 'airtable',
  driverJobs: 'airtable',
  legacyDriverLeads: 'airtable',
  driverApplications: 'airtable',
  fbCampaignDrivers: 'airtable',
  scoredDrivers: 'airtable',

  // -------------------------------------------------------------------------
  // Matching & Interests
  // -------------------------------------------------------------------------
  driverCarrierInterests: 'airtable',
  carrierDriverViews: 'airtable',
  matchEvents: 'airtable',
  carrierHiringPreferences: 'airtable',
  driverJobPreferences: 'airtable',

  // -------------------------------------------------------------------------
  // Messaging & Notifications
  // -------------------------------------------------------------------------
  messages: 'airtable',
  memberNotifications: 'airtable',
  memberBadges: 'wix',        // KEEP IN WIX: Wix system collection
  memberPrivateData: 'wix',   // KEEP IN WIX: Wix system collection
  memberActivity: 'airtable',

  // -------------------------------------------------------------------------
  // Carrier Communication Hub
  // -------------------------------------------------------------------------
  carrierAnnouncements: 'airtable',
  announcementReadReceipts: 'airtable',
  announcementComments: 'airtable',
  carrierNotificationSettings: 'airtable',
  driverNotificationPreferences: 'airtable',
  policyDocuments: 'airtable',
  policyAcknowledgments: 'airtable',

  // -------------------------------------------------------------------------
  // Enrichment & Cache
  // -------------------------------------------------------------------------
  carrierEnrichments: 'airtable',
  carrierSafetyData: 'airtable',

  // -------------------------------------------------------------------------
  // Billing & Subscriptions
  // -------------------------------------------------------------------------
  carrierSubscriptions: 'airtable',
  profileViews: 'airtable',
  billingHistory: 'airtable',
  stripeEvents: 'airtable',

  // -------------------------------------------------------------------------
  // Onboarding & Admin
  // -------------------------------------------------------------------------
  partnerOnboarding: 'airtable',
  carrierOnboarding: 'airtable',
  recruiterCarriers: 'airtable',

  // -------------------------------------------------------------------------
  // Content & CMS
  // -------------------------------------------------------------------------
  blogPosts: 'airtable',
  blogCategories: 'airtable',
  faqs: 'airtable',
  complianceGuides: 'airtable',
  bestPracticesGuides: 'airtable',
  pricingTiers: 'airtable',
  serviceFeatures: 'airtable',
  caseStudies: 'airtable',
  industryComparisons: 'airtable',

  // -------------------------------------------------------------------------
  // Reviews & Testimonials
  // -------------------------------------------------------------------------
  carrierReviews: 'airtable',
  carrierTestimonials: 'airtable',
  driverTestimonials: 'airtable',

  // -------------------------------------------------------------------------
  // Admin
  // -------------------------------------------------------------------------
  adminUsers: 'wix', // KEEP IN WIX: Wix Members integration for authentication
  jobPostings: 'airtable',
  teamMembers: 'airtable',
  companyMilestones: 'airtable',
  platformSettings: 'airtable',
  complianceReports: 'airtable',
  scheduledReports: 'airtable',

  // -------------------------------------------------------------------------
  // Additional Tables (Extended from original plan)
  // -------------------------------------------------------------------------
  interviews: 'airtable',
  carrierStaffingRequests: 'airtable',
  checkoutAbandonment: 'airtable',
  abandonmentEmailLog: 'airtable',
  auditLog: 'airtable',
  aiUsageLog: 'airtable',
  aiRouterConfig: 'airtable',
  promptLibrary: 'airtable',
  systemLogs: 'airtable',
  csaScoreHistory: 'airtable',
  carrierDocuments: 'airtable',
  carrierDriverOutreach: 'airtable',
  complianceAlerts: 'airtable',
  complianceEvents: 'airtable',
  documentRequests: 'airtable',
  featureAdoptionLogs: 'airtable', // Switched to Airtable for visibility
  featureFunnels: 'airtable',
  featureMetricsDaily: 'airtable',
  featureRegistry: 'airtable',
  fuelCards: 'airtable',
  fuelPrices: 'airtable',
  restStopReviews: 'airtable',
  restStopConditionReports: 'airtable',
  weatherAlerts: 'airtable',
  driverWeatherSubscriptions: 'airtable',
  roadConditions: 'airtable',
  truckRestrictions: 'airtable',
  driverConditionReports: 'airtable',
  incidentReports: 'airtable',
  onboardingWorkflows: 'airtable',
  parkingLocations: 'airtable',
  parkingReports: 'airtable',
  qualificationFiles: 'airtable',
  recruiterProfiles: 'airtable',
  roadUtilityCache: 'airtable',
  systemAlerts: 'airtable',
  systemErrors: 'airtable',
  systemMetrics: 'airtable', // Switched to Airtable for visibility
  systemTraces: 'airtable', // Switched to Airtable for visibility
  apiPartners: 'airtable',
  apiSubscriptions: 'airtable',
  apiUsage: 'airtable',
  apiRequestLog: 'airtable',
  apiProducts: 'airtable',
  apiAlertSubscriptions: 'airtable',
  apiWebhookDeliveries: 'airtable',
  metaIntegrations: 'airtable',
  metaAdAccounts: 'airtable',
  metaCampaignMirror: 'airtable',
  metaAdSetMirror: 'airtable',
  metaAdMirror: 'airtable',
  metaCreativeMirror: 'airtable',
  metaInsightsDaily: 'airtable',
  metaInsightsIntraday: 'airtable',
  metaAsyncReportJobs: 'airtable',
  metaOptimizationActions: 'airtable',
  metaGovernancePolicies: 'airtable',
  metaMutationAudit: 'airtable',
  metaErrorEvents: 'airtable',
  metaRateLimitEvents: 'airtable',
  metaAttributionLinks: 'airtable',

  // -------------------------------------------------------------------------
  // Gamification System (Airtable-only, no Wix fallback)
  // -------------------------------------------------------------------------
  driverProgression: 'airtable',
  driverAchievements: 'airtable',
  driverChallenges: 'airtable',
  recruiterProgression: 'airtable',
  recruiterBadges: 'airtable',
  recruiterChallenges: 'airtable',
  leaderboardSnapshots: 'airtable',
  achievementDefinitions: 'airtable',
  badgeDefinitions: 'airtable',
  challengeDefinitions: 'airtable',
  gamificationEvents: 'airtable',
  seasonalEvents: 'airtable',
  eventParticipants: 'airtable',
  eventLeaderboard: 'airtable',
  // Referral System
  driverReferrals: 'airtable',
  matchQualityBonuses: 'airtable',

  // Retention Dashboard
  driverPerformance: 'airtable',
  retentionRiskLogs: 'airtable',

  // -------------------------------------------------------------------------
  // Driver Lifecycle & Disposition
  // -------------------------------------------------------------------------
  lifecycleEvents: 'airtable',
  terminationLogs: 'airtable',
  surveyDefinitions: 'airtable',
  surveyResponses: 'airtable',

  // Match Notifications (Airtable-only)
  matchNotificationLog: 'airtable',

  // -------------------------------------------------------------------------
  // Recruiter Utility Expansion
  // -------------------------------------------------------------------------
  savedSearches: 'airtable',
  savedSearchAlerts: 'airtable',
  callOutcomes: 'airtable',
  callFeedback: 'airtable',
  interventionTemplates: 'airtable',
  interventionLog: 'airtable',
  pipelineAutomationRules: 'airtable',
  automationLog: 'airtable',

  // -------------------------------------------------------------------------
  // Recruiter Analytics
  // -------------------------------------------------------------------------
  sourceAttribution: 'airtable',
  recruitingSpend: 'airtable',
  funnelEvents: 'airtable',
  competitorIntel: 'airtable',
  hiringForecasts: 'airtable',

  // -------------------------------------------------------------------------
  // Driver Community & Forums
  // -------------------------------------------------------------------------
  forumCategories: 'airtable',
  forumThreads: 'airtable',
  forumPosts: 'airtable',
  forumReports: 'airtable',
  healthResources: 'airtable',
  healthTips: 'airtable',
  petFriendlyLocations: 'airtable',
  petFriendlyReviews: 'airtable',

  // -------------------------------------------------------------------------
  // B2B Business Development Suite
  // -------------------------------------------------------------------------
  b2bAccounts: 'airtable',
  b2bContacts: 'airtable',
  b2bMatchSignals: 'airtable',
  b2bOpportunities: 'airtable',
  b2bActivities: 'airtable',
  b2bAutomationRules: 'airtable',
  b2bSequences: 'airtable',
  b2bSequenceSteps: 'airtable',
  b2bCalls: 'airtable',
  b2bEmails: 'airtable',
  b2bTextMessages: 'airtable',
  b2bLeadCaptureEvents: 'airtable',
  b2bLeadSources: 'airtable',
  b2bAnalyticsSnapshots: 'airtable',
  b2bAccountResearch: 'airtable',
  b2bLeadAttribution: 'airtable',
  b2bSpend: 'airtable',
  b2bCompetitorIntel: 'airtable',
  b2bCallCampaigns: 'airtable',
  b2bPlaybooks: 'airtable',
  b2bValueProps: 'airtable',

  // -------------------------------------------------------------------------
  // Carrier Fleet Dashboard
  // -------------------------------------------------------------------------
  fleetDrivers: 'airtable',
  equipmentAssets: 'airtable',
  equipmentAssignments: 'airtable',
  driverScores: 'airtable',
  capacityPlans: 'airtable',
  eldConnections: 'airtable',
  driverLocations: 'airtable',

  // -------------------------------------------------------------------------
  // Admin Platform Configuration
  // -------------------------------------------------------------------------
  aiProviderCosts: 'airtable',
  costOptimizerConfig: 'airtable',
  anomalyAlerts: 'airtable',
  anomalyRules: 'airtable',
  baselineMetrics: 'airtable',
  featureFlags: 'airtable',
  flagEvaluationLogs: 'airtable',
  emailTemplates: 'airtable',
  emailSendLogs: 'airtable',
  notificationRules: 'airtable',
  notificationQueue: 'airtable',
  notificationLogs: 'airtable',
  userThrottleState: 'airtable',
  abTests: 'airtable',
  abTestAssignments: 'airtable',
  abTestEvents: 'airtable',

  // -------------------------------------------------------------------------
  // Admin Business Operations (Revenue, Billing, Invoicing, Commissions)
  // -------------------------------------------------------------------------
  revenueMetrics: 'airtable',
  billingAdjustments: 'airtable',
  invoices: 'airtable',
  commissions: 'airtable',
  salesReps: 'airtable',
  commissionRules: 'airtable',

  // -------------------------------------------------------------------------
  // Support & Operations (Tickets, KB, NPS, Chat)
  // -------------------------------------------------------------------------
  supportTickets: 'airtable',
  ticketComments: 'airtable',
  ticketTags: 'airtable',
  knowledgeArticles: 'airtable',
  articleCategories: 'airtable',
  articleVersions: 'airtable',
  npsResponses: 'airtable',
  surveyConfig: 'airtable',
  npsTrends: 'airtable',
  chatSessions: 'airtable',
  chatMessages: 'airtable',
  cannedResponses: 'airtable',

  // -------------------------------------------------------------------------
  // Agent & Voice Platform
  // -------------------------------------------------------------------------
  agentConversations: 'airtable',
  agentTurns: 'airtable',
  voiceCallLogs: 'airtable',
  voiceAssistants: 'airtable',
  voiceCampaigns: 'airtable',
  voiceCampaignContacts: 'airtable',
  agentRuns: 'airtable',
  agentSteps: 'airtable',
  approvalGates: 'airtable',
  runOutcomes: 'airtable',

  // -------------------------------------------------------------------------
  // Knowledge Compendium
  // -------------------------------------------------------------------------
  compendiumEntries: 'airtable',

  // -------------------------------------------------------------------------
  // Recruiter Autopilot
  // -------------------------------------------------------------------------
  autopilotCampaigns: 'airtable',
  autopilotSteps: 'airtable',

  // -------------------------------------------------------------------------
  // Self-Healing Pipeline
  // -------------------------------------------------------------------------
  remediationPlans: 'airtable',
  incidentLog: 'airtable',

  // -------------------------------------------------------------------------
  // Recruiter Outreach — Multi-Channel Campaign Management
  // -------------------------------------------------------------------------
  // Phase 1: Email Drip Campaigns
  emailCampaigns: 'airtable',
  emailSequences: 'airtable',
  emailSequenceEnrollments: 'airtable',
  emailMessages: 'airtable',
  // Phase 2: SMS Campaign Manager
  smsCampaigns: 'airtable',
  smsMessages: 'airtable',
  smsOptOuts: 'airtable',
  // Phase 3: Job Board Distribution
  jobBoardCredentials: 'airtable',
  jobApplications: 'airtable',
  // Phase 4: Social Posting
  socialPosts: 'airtable',
  socialAccounts: 'airtable',
  socialPostQueue: 'airtable',
  socialAuditLog: 'airtable',

  // -------------------------------------------------------------------------
  // Agent Evaluations
  // -------------------------------------------------------------------------
  agentEvaluations: 'airtable',

  // -------------------------------------------------------------------------
  // Pipeline Execution Agent
  // -------------------------------------------------------------------------
  pipelineEvents: 'airtable',
  voiceAgentTemplates: 'airtable',

  // -------------------------------------------------------------------------
  // Phase 1 Driver Expansion
  // -------------------------------------------------------------------------
  driverSavedJobs: 'airtable',
  driverMessages: 'airtable',
  driverConversations: 'airtable',
  driverActivityFeed: 'airtable',
  parkingFavorites: 'airtable',
  weighStationStatus: 'airtable',
  roadHazardReports: 'airtable',
  weatherAlertSubs: 'airtable',
  forumReplies: 'airtable',
  mentorshipConnections: 'airtable',
  mentorProfiles: 'airtable',
  hosRecords: 'airtable',
  hosViolations: 'airtable',
  eldLogs: 'airtable',
  trainingCourses: 'airtable',
  trainingEnrollments: 'airtable',
  trainingProgress: 'airtable',
  driverExpenses: 'airtable',
  driverSettlements: 'airtable',
  driverTaxSummary: 'airtable',
  driverLifecycleEvents: 'airtable',
  driverSurveys: 'airtable',
  driverSurveyResponses: 'airtable',
  driverQuickResponses: 'airtable',
  reverseAlerts: 'airtable',
  driverNotifications: 'airtable',
  driverMatches: 'airtable',

  // ── Phase 2: Recruiter Surface Expansion ──
  backgroundChecks: 'airtable',
  drugTests: 'airtable',
  orientationSlots: 'airtable',
  eSignRequests: 'airtable',
  outreachTemplates: 'airtable',
  retentionWatchlist: 'airtable',
  retentionInterventions: 'airtable',
  matchSubscriptions: 'airtable',
  matchSubscriptionAlerts: 'airtable',
  recruiterScorecards: 'airtable',

  // ── Phase 3: Carrier & B2B Surface Expansion ──
  driverRecognitions: 'airtable',
  feedbackRequests: 'airtable',
  b2bTasks: 'airtable',

  // ── Phase 5: Cross-Role Intelligence & External APIs ──
  marketIntelligence: 'airtable',
  driverMatchFeedback: 'airtable',
  driverSurveyRequests: 'airtable',
  settlementDisputes: 'airtable',
  taxReferenceData: 'airtable',
  exitSurveys: 'airtable'
};

// =============================================================================
// FEATURE FLAGS
// =============================================================================

/**
 * Runtime feature flags.
 * All values default to false/disabled — flip to true to enable without deploy.
 *
 * Phase 1 (Runtime Foundation):
 *   runtimeEnabled            — route AI steps through external microservice
 *
 * Phase 2 (Semantic Search):
 *   semanticToolEnabled       — enable semantic embed/search tool calls
 *   semanticSearchBlendEnabled — blend semantic score into driver ranking
 */
export const FEATURE_FLAGS = {
  /** Phase 1: Route agent AI steps through external runtime microservice (ai.lastmiledr.app) */
  runtimeEnabled: false,
  /** Phase 2: Enable semantic search tool calls in agent context */
  semanticToolEnabled: false,
  /** Phase 2: Blend semantic score as a component in driver ranking (driverScoring.js) */
  semanticSearchBlendEnabled: false,
};

// =============================================================================
// SOCIAL POSTING SETTINGS
// =============================================================================

export const SOCIAL_POSTING_SETTINGS = {
  SOCIAL_POSTING_ENABLED: false,
  SOCIAL_RUNTIME: 'wix'
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get the data source for a collection
 * @param {string} collectionName - The collection name (camelCase)
 * @returns {'wix' | 'airtable'} The data source
 */
export function getDataSource(collectionName) {
  // EXCEPTION LIST: Explicitly pinned to Wix
  if (['adminUsers'].includes(collectionName)) {
    return 'wix';
  }

  // DEFAULT POLICY: Everything else goes to Airtable
  return DATA_SOURCE[collectionName] || 'airtable';
}

/**
 * Check if a collection uses Airtable
 * @param {string} collectionName - The collection name
 * @returns {boolean}
 */
export function usesAirtable(collectionName) {
  return getDataSource(collectionName) === 'airtable';
}

/**
 * Check if a collection uses Wix
 * @param {string} collectionName - The collection name
 * @returns {boolean}
 */
export function usesWix(collectionName) {
  return getDataSource(collectionName) === 'wix';
}

/**
 * Get all collections using a specific data source
 * @param {'wix' | 'airtable'} source
 * @returns {string[]} Array of collection names
 */
export function getCollectionsBySource(source) {
  return Object.entries(DATA_SOURCE)
    .filter(([_, src]) => src === source)
    .map(([name, _]) => name);
}

/**
 * Get migration status summary
 * @returns {{ wix: number, airtable: number, total: number, percentMigrated: number }}
 */
export function getMigrationStatus() {
  const collections = Object.values(DATA_SOURCE);
  const wixCount = collections.filter(s => s === 'wix').length;
  const airtableCount = collections.filter(s => s === 'airtable').length;
  return {
    wix: wixCount,
    airtable: airtableCount,
    total: collections.length,
    percentMigrated: Math.round((airtableCount / collections.length) * 100)
  };
}

// =============================================================================
// WIX COLLECTION NAMES MAPPING
// =============================================================================

/**
 * Maps camelCase config keys to actual Wix collection names.
 * Wix collection names are case-sensitive and use PascalCase.
 */
export const WIX_COLLECTION_NAMES = {
  // Core Business Data
  carriers: 'Carriers',
  carrierAccounts: 'Carriers',    // Wix fallback (same collection, different query patterns)
  driverProfiles: 'DriverProfiles',
  driverJobs: 'DriverJobs',
  legacyDriverLeads: 'LegacyDriverLeads',
  driverApplications: 'DriverApplications',
  fbCampaignDrivers: 'FBCampaignDrivers',
  scoredDrivers: 'ScoredDrivers',

  // Matching & Interests
  driverCarrierInterests: 'DriverCarrierInterests',
  carrierDriverViews: 'CarrierDriverViews',
  matchEvents: 'MatchEvents',
  carrierHiringPreferences: 'CarrierHiringPreferences',
  driverJobPreferences: 'DriverJobPreferences',

  // Messaging & Notifications
  messages: 'Messages',
  memberNotifications: 'MemberNotifications',
  memberBadges: 'Members/Badges',
  memberPrivateData: 'Members/PrivateMembersData',
  memberActivity: 'MemberActivity',
  carrierAnnouncements: 'CarrierAnnouncements',
  announcementReadReceipts: 'AnnouncementReadReceipts',
  announcementComments: 'AnnouncementComments',
  carrierNotificationSettings: 'CarrierNotificationSettings',
  driverNotificationPreferences: 'DriverNotificationPreferences',
  policyDocuments: 'PolicyDocuments',
  policyAcknowledgments: 'PolicyAcknowledgments',

  // Enrichment & Cache
  carrierEnrichments: 'CarrierEnrichments',
  carrierSafetyData: 'CarrierSafetyData',

  // Billing & Subscriptions
  carrierSubscriptions: 'CarrierSubscriptions',
  profileViews: 'ProfileViews',
  billingHistory: 'BillingHistory',
  stripeEvents: 'StripeEvents',

  // Onboarding & Admin
  partnerOnboarding: 'PartnerOnboarding',
  carrierOnboarding: 'CarrierOnboarding',
  recruiterCarriers: 'recruiterCarriers',

  // Content & CMS
  blogPosts: 'BlogPosts',
  blogCategories: 'BlogCategories',
  faqs: 'FAQs',
  complianceGuides: 'ComplianceGuides',
  bestPracticesGuides: 'BestPracticesGuides',
  pricingTiers: 'PricingTiers',
  serviceFeatures: 'ServiceFeatures',
  caseStudies: 'CaseStudies',
  industryComparisons: 'IndustryComparisons',

  // Reviews & Testimonials
  carrierReviews: 'CarrierReviews',
  carrierTestimonials: 'CarrierTestimonials',
  driverTestimonials: 'DriverTestimonials',

  // Admin
  adminUsers: 'AdminUsers',
  jobPostings: 'JobPostings',
  teamMembers: 'TeamMembers',
  companyMilestones: 'CompanyMilestones',
  platformSettings: 'PlatformSettings',
  complianceReports: 'ComplianceReports',
  scheduledReports: 'ScheduledReports',

  // Additional Tables
  interviews: 'Interviews',
  carrierStaffingRequests: 'carrierStaffingRequests',
  checkoutAbandonment: 'CheckoutAbandonment',
  abandonmentEmailLog: 'AbandonmentEmailLog',
  auditLog: 'AuditLog',
  aiUsageLog: 'AIUsageLog',
  aiRouterConfig: 'AIRouterConfig',
  promptLibrary: 'PromptLibrary',
  systemLogs: 'SystemLogs',
  csaScoreHistory: 'CSAScoreHistory',
  carrierDocuments: 'CarrierDocuments',
  carrierDriverOutreach: 'CarrierDriverOutreach',
  complianceAlerts: 'ComplianceAlerts',
  complianceEvents: 'ComplianceEvents',
  documentRequests: 'DocumentRequests',
  featureAdoptionLogs: 'FeatureAdoptionLogs',
  featureFunnels: 'FeatureFunnels',
  featureMetricsDaily: 'FeatureMetricsDaily',
  featureRegistry: 'FeatureRegistry',
  fuelCards: 'FuelCards',
  fuelPrices: 'FuelPrices',
  restStopReviews: 'RestStopReviews',
  restStopConditionReports: 'RestStopConditionReports',
  weatherAlerts: 'WeatherAlerts',
  driverWeatherSubscriptions: 'DriverWeatherSubscriptions',
  roadConditions: 'RoadConditions',
  truckRestrictions: 'TruckRestrictions',
  driverConditionReports: 'DriverConditionReports',
  incidentReports: 'IncidentReports',
  onboardingWorkflows: 'OnboardingWorkflows',
  parkingLocations: 'ParkingLocations',
  parkingReports: 'ParkingReports',
  qualificationFiles: 'QualificationFiles',
  recruiterProfiles: 'RecruiterProfiles',
  roadUtilityCache: 'RoadUtilityCache',
  systemAlerts: 'SystemAlerts',
  systemErrors: 'SystemErrors',
  systemMetrics: 'SystemMetrics',
  systemTraces: 'SystemTraces',
  apiPartners: 'ApiPartners',
  apiSubscriptions: 'ApiSubscriptions',
  apiUsage: 'ApiUsage',
  apiRequestLog: 'ApiRequestLog',
  apiProducts: 'ApiProducts',
  apiAlertSubscriptions: 'ApiAlertSubscriptions',
  apiWebhookDeliveries: 'ApiWebhookDeliveries',
  metaIntegrations: 'MetaIntegrations',
  metaAdAccounts: 'MetaAdAccounts',
  metaCampaignMirror: 'MetaCampaignMirror',
  metaAdSetMirror: 'MetaAdSetMirror',
  metaAdMirror: 'MetaAdMirror',
  metaCreativeMirror: 'MetaCreativeMirror',
  metaInsightsDaily: 'MetaInsightsDaily',
  metaInsightsIntraday: 'MetaInsightsIntraday',
  metaAsyncReportJobs: 'MetaAsyncReportJobs',
  metaOptimizationActions: 'MetaOptimizationActions',
  metaGovernancePolicies: 'MetaGovernancePolicies',
  metaMutationAudit: 'MetaMutationAudit',
  metaErrorEvents: 'MetaErrorEvents',
  metaRateLimitEvents: 'MetaRateLimitEvents',
  metaAttributionLinks: 'MetaAttributionLinks',

  // Recruiter Analytics
  sourceAttribution: 'SourceAttribution',
  recruitingSpend: 'RecruitingSpend',
  funnelEvents: 'FunnelEvents',
  competitorIntel: 'CompetitorIntel',
  hiringForecasts: 'HiringForecasts',

  // Recruiter Utility Expansion
  savedSearches: 'SavedSearches',
  savedSearchAlerts: 'SavedSearchAlerts',
  callOutcomes: 'CallOutcomes',
  callFeedback: 'CallFeedback',
  interventionTemplates: 'InterventionTemplates',
  interventionLog: 'InterventionLog',
  pipelineAutomationRules: 'PipelineAutomationRules',
  automationLog: 'AutomationLog',

  // Driver Community & Forums
  forumCategories: 'ForumCategories',
  forumThreads: 'ForumThreads',
  forumPosts: 'ForumPosts',
  forumReports: 'ForumReports',
  healthResources: 'HealthResources',
  healthTips: 'HealthTips',
  petFriendlyLocations: 'PetFriendlyLocations',
  petFriendlyReviews: 'PetFriendlyReviews',
  mentorProfiles: 'MentorProfiles',
  mentorMatches: 'MentorMatches',

  // B2B Business Development Suite
  b2bAccounts: 'B2BAccounts',
  b2bContacts: 'B2BContacts',
  b2bMatchSignals: 'B2BMatchSignals',
  b2bOpportunities: 'B2BOpportunities',
  b2bActivities: 'B2BActivities',
  b2bAutomationRules: 'B2BAutomationRules',
  b2bSequences: 'B2BSequences',
  b2bSequenceSteps: 'B2BSequenceSteps',
  b2bCalls: 'B2BCalls',
  b2bEmails: 'B2BEmails',
  b2bTextMessages: 'B2BTextMessages',
  b2bLeadCaptureEvents: 'B2BLeadCaptureEvents',
  b2bLeadSources: 'B2BLeadSources',
  b2bAnalyticsSnapshots: 'B2BAnalyticsSnapshots',
  b2bAccountResearch: 'B2BAccountResearch',
  b2bLeadAttribution: 'B2BLeadAttribution',
  b2bSpend: 'B2BSpend',
  b2bCompetitorIntel: 'B2BCompetitorIntel',
  b2bCallCampaigns: 'B2BCallCampaigns',
  b2bPlaybooks: 'B2BPlaybooks',
  b2bValueProps: 'B2BValueProps',

  // Carrier Fleet Dashboard
  fleetDrivers: 'FleetDrivers',
  equipmentAssets: 'EquipmentAssets',
  equipmentAssignments: 'EquipmentAssignments',
  driverScores: 'DriverScores',
  capacityPlans: 'CapacityPlans',
  eldConnections: 'ELDConnections',
  driverLocations: 'DriverLocations',

  // Admin Platform Configuration
  aiProviderCosts: 'AIProviderCosts',
  costOptimizerConfig: 'CostOptimizerConfig',
  anomalyAlerts: 'AnomalyAlerts',
  anomalyRules: 'AnomalyRules',
  baselineMetrics: 'BaselineMetrics',
  featureFlags: 'FeatureFlags',
  flagEvaluationLogs: 'FlagEvaluationLogs',
  emailTemplates: 'EmailTemplates',
  emailSendLogs: 'EmailSendLogs',
  notificationRules: 'NotificationRules',
  notificationQueue: 'NotificationQueue',
  notificationLogs: 'NotificationLogs',
  userThrottleState: 'UserThrottleState',
  abTests: 'ABTests',
  abTestAssignments: 'ABTestAssignments',
  abTestEvents: 'ABTestEvents',

  // Admin Business Operations
  revenueMetrics: 'RevenueMetrics',
  billingAdjustments: 'BillingAdjustments',
  invoices: 'Invoices',
  commissions: 'Commissions',
  salesReps: 'SalesReps',
  commissionRules: 'CommissionRules',

  // Support & Operations
  supportTickets: 'SupportTickets',
  ticketComments: 'TicketComments',
  ticketTags: 'TicketTags',
  knowledgeArticles: 'KnowledgeArticles',
  articleCategories: 'ArticleCategories',
  articleVersions: 'ArticleVersions',
  npsResponses: 'NPSResponses',
  surveyConfig: 'SurveyConfig',
  npsTrends: 'NPSTrends',
  chatSessions: 'ChatSessions',
  chatMessages: 'ChatMessages',
  cannedResponses: 'CannedResponses',

  // Agent & Voice Platform
  agentConversations: 'AgentConversations',
  agentTurns: 'AgentTurns',
  voiceCallLogs: 'VoiceCallLogs',
  voiceAssistants: 'VoiceAssistants',
  voiceCampaigns: 'VoiceCampaigns',
  voiceCampaignContacts: 'VoiceCampaignContacts',
  agentRuns: 'AgentRuns',
  agentSteps: 'AgentSteps',
  approvalGates: 'ApprovalGates',
  runOutcomes: 'RunOutcomes',

  // Knowledge Compendium
  compendiumEntries: 'CompendiumEntries',

  // Recruiter Autopilot
  autopilotCampaigns: 'AutopilotCampaigns',
  autopilotSteps: 'AutopilotSteps',

  // Self-Healing Pipeline
  remediationPlans: 'RemediationPlans',
  incidentLog: 'IncidentLog',

  // Agent Evaluations
  agentEvaluations: 'AgentEvaluations',

  // Pipeline Execution Agent
  pipelineEvents: 'PipelineEvents',
  voiceAgentTemplates: 'VoiceAgentTemplates',

  // Phase 1 Driver Expansion
  driverSavedJobs: 'DriverSavedJobs',
  driverMessages: 'DriverMessages',
  driverConversations: 'DriverConversations',
  driverActivityFeed: 'DriverActivityFeed',
  parkingFavorites: 'ParkingFavorites',
  weighStationStatus: 'WeighStationStatus',
  roadHazardReports: 'RoadHazardReports',
  weatherAlertSubs: 'WeatherAlertSubs',
  forumReplies: 'ForumReplies',
  mentorshipConnections: 'MentorshipConnections',
  hosRecords: 'HOSRecords',
  hosViolations: 'HOSViolations',
  eldLogs: 'ELDLogs',
  trainingCourses: 'TrainingCourses',
  trainingEnrollments: 'TrainingEnrollments',
  trainingProgress: 'TrainingProgress',
  driverExpenses: 'DriverExpenses',
  driverSettlements: 'DriverSettlements',
  driverTaxSummary: 'DriverTaxSummary',
  driverLifecycleEvents: 'DriverLifecycleEvents',
  driverSurveys: 'DriverSurveys',
  driverSurveyResponses: 'DriverSurveyResponses',
  driverQuickResponses: 'DriverQuickResponses',
  reverseAlerts: 'ReverseAlerts',
  driverNotifications: 'DriverNotifications',
  driverMatches: 'DriverMatches',

  // ── Phase 2: Recruiter Surface Expansion ──
  backgroundChecks: 'BackgroundChecks',
  drugTests: 'DrugTests',
  orientationSlots: 'OrientationSlots',
  eSignRequests: 'ESignRequests',
  outreachTemplates: 'OutreachTemplates',
  retentionWatchlist: 'RetentionWatchlist',
  retentionInterventions: 'RetentionInterventions',
  matchSubscriptions: 'MatchSubscriptions',
  matchSubscriptionAlerts: 'MatchSubscriptionAlerts',
  recruiterScorecards: 'RecruiterScorecards',

  // ── Phase 3: Carrier & B2B Surface Expansion ──
  driverRecognitions: 'DriverRecognitions',
  feedbackRequests: 'FeedbackRequests',
  b2bTasks: 'B2BTasks',

  // ── Phase 5: Cross-Role Intelligence & External APIs ──
  marketIntelligence: 'MarketIntelligence',
  driverMatchFeedback: 'DriverMatchFeedback',
  driverSurveyRequests: 'DriverSurveyRequests',
  settlementDisputes: 'SettlementDisputes',
  taxReferenceData: 'TaxReferenceData',
  exitSurveys: 'ExitSurveys'
};

// =============================================================================
// AIRTABLE TABLE NAMES MAPPING
// =============================================================================

/**
 * Maps camelCase config keys to Airtable table names.
 * All Airtable tables use 'v2_' prefix for the migration.
 */
export const AIRTABLE_TABLE_NAMES = {
  // Core Business Data
  carriers: 'Carriers',             // → TABLE_NAMES['Carriers'] → 'Carriers (Master)' (FMCSA reference)
  carrierAccounts: 'v2_Carriers',   // → TABLE_NAMES['v2_Carriers'] → 'v2_Carriers' (active platform accounts)
  driverProfiles: 'v2_Driver Profiles',
  driverJobs: 'v2_Driver Jobs',
  legacyDriverLeads: 'Legacy Driver Leads',
  driverApplications: 'Applications',
  fbCampaignDrivers: 'CDL DRIVERS NJ FB CAMPAIGN',
  scoredDrivers: 'Scored Drivers',

  // Matching & Interests
  driverCarrierInterests: 'v2_Driver Carrier Interests',
  carrierDriverViews: 'v2_Carrier Driver Views',
  matchEvents: 'v2_Match Events',
  carrierHiringPreferences: 'v2_Carrier Hiring Preferences',
  driverJobPreferences: 'v2_Driver Job Preferences',

  // Messaging & Notifications
  messages: 'v2_Messages',
  memberNotifications: 'v2_Member Notifications',
  memberActivity: 'v2_Member Activity',
  carrierAnnouncements: 'v2_Carrier Announcements',
  announcementReadReceipts: 'v2_Announcement Read Receipts',
  announcementComments: 'v2_Announcement Comments',
  carrierNotificationSettings: 'v2_Carrier Notification Settings',
  driverNotificationPreferences: 'v2_Driver Notification Preferences',
  policyDocuments: 'v2_Policy Documents',
  policyAcknowledgments: 'v2_Policy Acknowledgments',

  // Enrichment & Cache
  carrierEnrichments: 'v2_Carrier Enrichments',
  carrierSafetyData: 'v2_FMCSA Safety Data',

  // Billing & Subscriptions
  carrierSubscriptions: 'v2_Subscriptions',
  profileViews: 'v2_Profile Views',
  billingHistory: 'v2_Billing History',
  stripeEvents: 'v2_Stripe Events',

  // Onboarding & Admin
  partnerOnboarding: 'v2_Partner Onboarding',
  carrierOnboarding: 'v2_Carrier Onboarding',
  recruiterCarriers: 'v2_Recruiter Carriers',

  // Content & CMS
  blogPosts: 'v2_Blog Posts',
  blogCategories: 'v2_Blog Categories',
  faqs: 'v2_FAQs',
  complianceGuides: 'v2_Compliance Guides',
  bestPracticesGuides: 'v2_Best Practices Guides',
  pricingTiers: 'v2_Pricing Tiers',
  serviceFeatures: 'v2_Service Features',
  caseStudies: 'v2_Case Studies',
  industryComparisons: 'v2_Industry Comparisons',

  // Reviews & Testimonials
  carrierReviews: 'v2_Carrier Reviews',
  carrierTestimonials: 'v2_Carrier Testimonials',
  driverTestimonials: 'v2_Driver Testimonials',

  // Admin
  adminUsers: 'v2_Admin Users',
  jobPostings: 'v2_Job Postings',
  teamMembers: 'v2_Team Members',
  companyMilestones: 'v2_Company Milestones',
  platformSettings: 'v2_Platform Settings',
  complianceReports: 'v2_Compliance Reports',
  scheduledReports: 'v2_Scheduled Reports',

  // Additional Tables
  interviews: 'v2_Interviews',
  carrierStaffingRequests: 'v2_Carrier Staffing Requests',
  checkoutAbandonment: 'v2_Checkout Abandonment',
  abandonmentEmailLog: 'v2_Abandonment Email Log',
  auditLog: 'v2_Audit Log',
  aiUsageLog: 'v2_AI Usage Log',
  aiRouterConfig: 'v2_AI Router Config',
  promptLibrary: 'v2_Prompt Library',
  systemLogs: 'v2_System Logs',
  csaScoreHistory: 'v2_CSA Score History',
  carrierDocuments: 'v2_Carrier Documents',
  carrierDriverOutreach: 'v2_Carrier Driver Outreach',
  complianceAlerts: 'v2_Compliance Alerts',
  complianceEvents: 'v2_Compliance Events',
  documentRequests: 'v2_Document Requests',
  featureAdoptionLogs: 'v2_Feature Adoption Logs',
  featureFunnels: 'v2_Feature Funnels',
  featureMetricsDaily: 'v2_Feature Metrics Daily',
  featureRegistry: 'v2_Feature Registry',
  fuelCards: 'v2_Fuel Cards',
  fuelPrices: 'v2_Fuel Prices',
  restStopReviews: 'v2_Rest Stop Reviews',
  restStopConditionReports: 'v2_Rest Stop Condition Reports',
  weatherAlerts: 'v2_Weather Alerts',
  driverWeatherSubscriptions: 'v2_Driver Weather Subscriptions',
  roadConditions: 'v2_Road Conditions',
  truckRestrictions: 'v2_Truck Restrictions',
  driverConditionReports: 'v2_Driver Condition Reports',
  incidentReports: 'v2_Incident Reports',
  onboardingWorkflows: 'v2_Onboarding Workflows',
  parkingLocations: 'v2_Parking Locations',
  parkingReports: 'v2_Parking Reports',
  qualificationFiles: 'v2_Qualification Files',
  recruiterProfiles: 'v2_Recruiter Profiles',
  roadUtilityCache: 'v2_Road Utility Cache',
  systemAlerts: 'v2_System Alerts',
  systemErrors: 'v2_System Errors',
  systemMetrics: 'v2_System Metrics',
  systemTraces: 'v2_System Traces',
  apiPartners: 'v2_API Partners',
  apiSubscriptions: 'v2_API Subscriptions',
  apiUsage: 'v2_API Usage',
  apiRequestLog: 'v2_API Request Log',
  apiProducts: 'v2_API Products',
  apiAlertSubscriptions: 'v2_API Alert Subscriptions',
  apiWebhookDeliveries: 'v2_API Webhook Deliveries',
  metaIntegrations: 'v2_Meta Integrations',
  metaAdAccounts: 'v2_Meta Ad Accounts',
  metaCampaignMirror: 'v2_Meta Campaign Mirror',
  metaAdSetMirror: 'v2_Meta Ad Set Mirror',
  metaAdMirror: 'v2_Meta Ad Mirror',
  metaCreativeMirror: 'v2_Meta Creative Mirror',
  metaInsightsDaily: 'v2_Meta Insights Daily',
  metaInsightsIntraday: 'v2_Meta Insights Intraday',
  metaAsyncReportJobs: 'v2_Meta Async Report Jobs',
  metaOptimizationActions: 'v2_Meta Optimization Actions',
  metaGovernancePolicies: 'v2_Meta Governance Policies',
  metaMutationAudit: 'v2_Meta Mutation Audit',
  metaErrorEvents: 'v2_Meta Error Events',
  metaRateLimitEvents: 'v2_Meta Rate Limit Events',
  metaAttributionLinks: 'v2_Meta Attribution Links',

  // Gamification System (Airtable-only)
  driverProgression: 'v2_Driver Progression',
  driverAchievements: 'v2_Driver Achievements',
  driverChallenges: 'v2_Driver Challenges',
  recruiterProgression: 'v2_Recruiter Progression',
  recruiterBadges: 'v2_Recruiter Badges',
  recruiterChallenges: 'v2_Recruiter Challenges',
  leaderboardSnapshots: 'v2_Leaderboard Snapshots',
  achievementDefinitions: 'v2_Achievement Definitions',
  badgeDefinitions: 'v2_Badge Definitions',
  challengeDefinitions: 'v2_Challenge Definitions',
  gamificationEvents: 'v2_Gamification Events',
  seasonalEvents: 'v2_Seasonal Events',
  eventParticipants: 'v2_Event Participants',
  eventLeaderboard: 'v2_Event Leaderboard',
  // Referral System
  driverReferrals: 'v2_Driver Referrals',
  matchQualityBonuses: 'v2_Match Quality Bonuses',

  // Retention Dashboard
  driverPerformance: 'v2_Driver Performance',
  retentionRiskLogs: 'v2_Retention Risk Logs',

  // Driver Lifecycle & Disposition
  lifecycleEvents: 'v2_Lifecycle Events',
  terminationLogs: 'v2_Termination Logs',
  surveyDefinitions: 'v2_Survey Definitions',
  surveyResponses: 'v2_Survey Responses',

  // Match Notifications (Airtable-only)
  matchNotificationLog: 'v2_Match Notification Log',

  // Recruiter Analytics
  sourceAttribution: 'v2_Source Attribution',
  recruitingSpend: 'v2_Recruiting Spend',
  funnelEvents: 'v2_Funnel Events',
  competitorIntel: 'v2_Competitor Intel',
  hiringForecasts: 'v2_Hiring Forecasts',

  // Recruiter Utility Expansion
  savedSearches: 'v2_Saved Searches',
  savedSearchAlerts: 'v2_Saved Search Alerts',
  callOutcomes: 'v2_Call Outcomes',
  callFeedback: 'v2_Call Feedback',
  interventionTemplates: 'v2_Intervention Templates',
  interventionLog: 'v2_Intervention Log',
  pipelineAutomationRules: 'v2_Pipeline Automation Rules',
  automationLog: 'v2_Automation Log',

  // Driver Community & Forums
  forumCategories: 'v2_Forum Categories',
  forumThreads: 'v2_Forum Threads',
  forumPosts: 'v2_Forum Posts',
  forumReports: 'v2_Forum Reports',
  mentorProfiles: 'v2_Mentor Profiles',
  mentorMatches: 'v2_Mentor Matches',
  healthResources: 'v2_Health Resources',
  healthTips: 'v2_Health Tips',
  petFriendlyLocations: 'v2_Pet Friendly Locations',
  petFriendlyReviews: 'v2_Pet Friendly Reviews',

  // B2B Business Development Suite
  b2bAccounts: 'v2_B2B Accounts',
  b2bContacts: 'v2_B2B Contacts',
  b2bMatchSignals: 'v2_B2B Match Signals',
  b2bOpportunities: 'v2_B2B Opportunities',
  b2bActivities: 'v2_B2B Activities',
  b2bAutomationRules: 'v2_B2B Automation Rules',
  b2bSequences: 'v2_B2B Sequences',
  b2bSequenceSteps: 'v2_B2B Sequence Steps',
  b2bCalls: 'v2_B2B Calls',
  b2bEmails: 'v2_B2B Emails',
  b2bTextMessages: 'v2_B2B Text Messages',
  b2bLeadCaptureEvents: 'v2_B2B Lead Capture Events',
  b2bLeadSources: 'v2_B2B Lead Sources',
  b2bAnalyticsSnapshots: 'v2_B2B Analytics Snapshots',
  b2bAccountResearch: 'v2_B2B Account Research',
  b2bLeadAttribution: 'v2_B2B Lead Attribution',
  b2bSpend: 'v2_B2B Spend',
  b2bCompetitorIntel: 'v2_B2B Competitor Intel',
  b2bCallCampaigns: 'v2_B2B Call Campaigns',
  b2bPlaybooks: 'v2_B2B Playbooks',
  b2bValueProps: 'v2_B2B Value Props',

  // Carrier Fleet Dashboard
  fleetDrivers: 'v2_Fleet Drivers',
  equipmentAssets: 'v2_Equipment Assets',
  equipmentAssignments: 'v2_Equipment Assignments',
  driverScores: 'v2_Driver Scores',
  capacityPlans: 'v2_Capacity Plans',
  eldConnections: 'v2_ELD Connections',
  driverLocations: 'v2_Driver Locations',

  // Admin Platform Configuration
  aiProviderCosts: 'v2_AI Provider Costs',
  costOptimizerConfig: 'v2_Cost Optimizer Config',
  anomalyAlerts: 'v2_Anomaly Alerts',
  anomalyRules: 'v2_Anomaly Rules',
  baselineMetrics: 'v2_Baseline Metrics',
  featureFlags: 'v2_Feature Flags',
  flagEvaluationLogs: 'v2_Flag Evaluation Logs',
  emailTemplates: 'v2_Email Templates',
  emailSendLogs: 'v2_Email Send Logs',
  notificationRules: 'v2_Notification Rules',
  notificationQueue: 'v2_Notification Queue',
  notificationLogs: 'v2_Notification Logs',
  userThrottleState: 'v2_User Throttle State',
  abTests: 'v2_AB Tests',
  abTestAssignments: 'v2_AB Test Assignments',
  abTestEvents: 'v2_AB Test Events',

  // Admin Business Operations
  revenueMetrics: 'v2_Revenue Metrics',
  billingAdjustments: 'v2_Billing Adjustments',
  invoices: 'v2_Invoices',
  commissions: 'v2_Commissions',
  salesReps: 'v2_Sales Reps',
  commissionRules: 'v2_Commission Rules',

  // Support & Operations
  supportTickets: 'v2_Support Tickets',
  ticketComments: 'v2_Ticket Comments',
  ticketTags: 'v2_Ticket Tags',
  knowledgeArticles: 'v2_Knowledge Articles',
  articleCategories: 'v2_Article Categories',
  articleVersions: 'v2_Article Versions',
  npsResponses: 'v2_NPS Responses',
  surveyConfig: 'v2_Survey Config',
  npsTrends: 'v2_NPS Trends',
  chatSessions: 'v2_Chat Sessions',
  chatMessages: 'v2_Chat Messages',
  cannedResponses: 'v2_Canned Responses',

  // Agent & Voice Platform
  agentConversations: 'v2_Agent Conversations',
  agentTurns: 'v2_Agent Turns',
  voiceCallLogs: 'v2_Voice Call Logs',
  voiceAssistants: 'v2_Voice Assistants',
  voiceCampaigns: 'v2_Voice Campaigns',
  voiceCampaignContacts: 'v2_Voice Campaign Contacts',
  agentRuns: 'v2_Agent Runs',
  agentSteps: 'v2_Agent Steps',
  approvalGates: 'v2_Approval Gates',
  runOutcomes: 'v2_Run Outcomes',

  // Knowledge Compendium
  compendiumEntries: 'v2_Compendium Entries',

  // Recruiter Autopilot
  autopilotCampaigns: 'v2_Autopilot Campaigns',
  autopilotSteps: 'v2_Autopilot Steps',

  // Self-Healing Pipeline
  remediationPlans: 'v2_Remediation Plans',
  incidentLog: 'v2_Incident Log',

  // Agent Evaluations
  agentEvaluations: 'v2_Agent Evaluations',

  // Recruiter Outreach — Multi-Channel Campaign Management
  emailCampaigns: 'v2_Email Campaigns',
  emailSequences: 'v2_Email Sequences',
  emailSequenceEnrollments: 'v2_Email Sequence Enrollments',
  emailMessages: 'v2_Email Messages',
  smsCampaigns: 'v2_SMS Campaigns',
  smsMessages: 'v2_SMS Messages',
  smsOptOuts: 'v2_SMS Opt Outs',
  jobBoardCredentials: 'v2_Job Board Credentials',
  jobApplications: 'v2_Job Applications',
  socialPosts: 'v2_Social Posts',
  socialAccounts: 'v2_Social Accounts',
  socialPostQueue: 'v2_Social Post Queue',
  socialAuditLog: 'v2_Social Audit Log',

  // Pipeline Execution Agent
  pipelineEvents: 'v2_Pipeline Events',
  voiceAgentTemplates: 'v2_Voice Agent Templates',

  // Phase 1 Driver Expansion
  driverSavedJobs: 'v2_Driver Saved Jobs',
  driverMessages: 'v2_Driver Messages',
  driverConversations: 'v2_Driver Conversations',
  driverActivityFeed: 'v2_Driver Activity Feed',
  parkingFavorites: 'v2_Parking Favorites',
  weighStationStatus: 'v2_Weigh Station Status',
  roadHazardReports: 'v2_Road Hazard Reports',
  weatherAlertSubs: 'v2_Weather Alert Subscriptions',
  forumReplies: 'v2_Forum Replies',
  mentorshipConnections: 'v2_Mentorship Connections',
  hosRecords: 'v2_HOS Records',
  hosViolations: 'v2_HOS Violations',
  eldLogs: 'v2_ELD Logs',
  trainingCourses: 'v2_Training Courses',
  trainingEnrollments: 'v2_Training Enrollments',
  trainingProgress: 'v2_Training Progress',
  driverExpenses: 'v2_Driver Expenses',
  driverSettlements: 'v2_Driver Settlements',
  driverTaxSummary: 'v2_Driver Tax Summary',
  driverLifecycleEvents: 'v2_Driver Lifecycle Events',
  driverSurveys: 'v2_Driver Surveys',
  driverSurveyResponses: 'v2_Driver Survey Responses',
  driverQuickResponses: 'v2_Driver Quick Responses',
  reverseAlerts: 'v2_Reverse Alerts',
  driverNotifications: 'v2_Driver Notifications',
  driverMatches: 'v2_Driver Matches',

  // ── Phase 2: Recruiter Surface Expansion ──
  backgroundChecks: 'v2_Background Checks',
  drugTests: 'v2_Drug Tests',
  orientationSlots: 'v2_Orientation Slots',
  eSignRequests: 'v2_E-Sign Requests',
  outreachTemplates: 'v2_Outreach Templates',
  retentionWatchlist: 'v2_Retention Watchlist',
  retentionInterventions: 'v2_Retention Interventions',
  matchSubscriptions: 'v2_Match Subscriptions',
  matchSubscriptionAlerts: 'v2_Match Subscription Alerts',
  recruiterScorecards: 'v2_Recruiter Scorecards',

  // ── Phase 3: Carrier & B2B Surface Expansion ──
  driverRecognitions: 'v2_Driver Recognitions',
  feedbackRequests: 'v2_Feedback Requests',
  b2bTasks: 'v2_B2B Tasks',

  // ── Phase 5: Cross-Role Intelligence & External APIs ──
  marketIntelligence: 'v2_Market Intelligence',
  driverMatchFeedback: 'v2_Driver Match Feedback',
  driverSurveyRequests: 'v2_Driver Survey Requests',
  settlementDisputes: 'v2_Settlement Disputes',
  taxReferenceData: 'v2_Tax Reference Data',
  exitSurveys: 'v2_Exit Surveys'
};

// =============================================================================
// UTILITY FUNCTIONS FOR NAME RESOLUTION
// =============================================================================

/**
 * Get the Wix collection name for a given config key
 * @param {string} collectionName - The camelCase collection name
 * @returns {string} The Wix collection name
 */
export function getWixCollectionName(collectionName) {
  return WIX_COLLECTION_NAMES[collectionName] || collectionName;
}

/**
 * Get the Airtable table name for a given config key
 * @param {string} collectionName - The camelCase collection name
 * @returns {string} The Airtable table name with v2_ prefix
 */
export function getAirtableTableName(collectionName) {
  return AIRTABLE_TABLE_NAMES[collectionName] || `v2_${collectionName}`;
}

/**
 * Get the appropriate collection/table name based on current data source
 * @param {string} collectionName - The camelCase collection name
 * @returns {string} The collection name for the current data source
 */
export function getCollectionName(collectionName) {
  if (usesAirtable(collectionName)) {
    return getAirtableTableName(collectionName);
  }
  return getWixCollectionName(collectionName);
}
