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

  // -------------------------------------------------------------------------
  // Matching & Interests
  // -------------------------------------------------------------------------
  driverCarrierInterests: 'airtable',
  carrierDriverViews: 'airtable',
  matchEvents: 'airtable',
  carrierHiringPreferences: 'airtable',
  driverInterests: 'airtable',

  // -------------------------------------------------------------------------
  // Messaging & Notifications
  // -------------------------------------------------------------------------
  messages: 'airtable',
  memberNotifications: 'wix', // KEEP IN WIX: Requires Wix auth context
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

  // -------------------------------------------------------------------------
  // Additional Tables (Extended from original plan)
  // -------------------------------------------------------------------------
  interviews: 'airtable',
  carrierStaffingRequests: 'airtable',
  checkoutAbandonment: 'airtable',
  abandonmentEmailLog: 'airtable',
  auditLog: 'airtable',
  aiUsageLog: 'airtable',
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
  // Driver Community & Forums
  // -------------------------------------------------------------------------
  forumCategories: 'airtable',
  forumThreads: 'airtable',
  forumPosts: 'airtable',
  forumReports: 'airtable',
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
  driverLocations: 'airtable'
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
  if (['adminUsers', 'memberNotifications'].includes(collectionName)) {
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

  // Matching & Interests
  driverCarrierInterests: 'DriverCarrierInterests',
  carrierDriverViews: 'CarrierDriverViews',
  matchEvents: 'MatchEvents',
  carrierHiringPreferences: 'CarrierHiringPreferences',
  driverInterests: 'DriverInterests',

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

  // Additional Tables
  interviews: 'Interviews',
  carrierStaffingRequests: 'carrierStaffingRequests',
  checkoutAbandonment: 'CheckoutAbandonment',
  abandonmentEmailLog: 'AbandonmentEmailLog',
  auditLog: 'AuditLog',
  aiUsageLog: 'AIUsageLog',
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
  petFriendlyLocations: 'PetFriendlyLocations',
  petFriendlyReviews: 'PetFriendlyReviews',

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
  driverLocations: 'DriverLocations'
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

  // Matching & Interests
  driverCarrierInterests: 'v2_Driver Carrier Interests',
  carrierDriverViews: 'v2_Carrier Driver Views',
  matchEvents: 'v2_Match Events',
  carrierHiringPreferences: 'v2_Carrier Hiring Preferences',
  driverInterests: 'v2_Driver Interests',

  // Messaging & Notifications
  messages: 'v2_Messages',
  memberNotifications: 'v2_Member Notifications',
  memberActivity: 'v2_Member Activity',
  carrierAnnouncements: 'v2_Carrier Announcements',
  announcementReadReceipts: 'v2_Announcement Read Receipts',
  announcementComments: 'v2_Announcement Comments',
  carrierNotificationSettings: 'v2_Carrier Notification Settings',
  driverNotificationPreferences: 'v2_Driver Notification Preferences',

  // Enrichment & Cache
  carrierEnrichments: 'v2_Carrier Enrichments',
  carrierSafetyData: 'v2_Carrier Safety Data',

  // Billing & Subscriptions
  carrierSubscriptions: 'v2_Carrier Subscriptions',
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

  // Additional Tables
  interviews: 'v2_Interviews',
  carrierStaffingRequests: 'v2_Carrier Staffing Requests',
  checkoutAbandonment: 'v2_Checkout Abandonment',
  abandonmentEmailLog: 'v2_Abandonment Email Log',
  auditLog: 'v2_Audit Log',
  aiUsageLog: 'v2_AI Usage Log',
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
  driverLocations: 'v2_Driver Locations'
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
