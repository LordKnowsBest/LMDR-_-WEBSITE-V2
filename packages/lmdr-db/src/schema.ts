/** Convert camelCase to snake_case */
export function toSnakeCase(str: string): string {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

/** Postgres table name for a collection key: airtable_<snake_case> */
export function pgTableName(collectionKey: string): string {
  return `airtable_${toSnakeCase(collectionKey)}`;
}

export const KNOWN_COLLECTIONS = new Set([
  'carriers', 'carrierAccounts', 'clientCarriers', 'driverProfiles',
  'driverJobs', 'legacyDriverLeads', 'driverApplications', 'fbCampaignDrivers',
  'scoredDrivers', 'quickAppJotform', 'driverCarrierInterests', 'carrierDriverViews',
  'matchEvents', 'carrierHiringPreferences', 'driverJobPreferences',
  'messages', 'memberNotifications', 'memberActivity',
  'carrierAnnouncements', 'announcementReadReceipts', 'announcementComments',
  'carrierNotificationSettings', 'driverNotificationPreferences',
  'policyDocuments', 'policyAcknowledgments',
  'carrierEnrichments', 'carrierSafetyData', 'carrierSubscriptions',
  'profileViews', 'billingHistory', 'stripeEvents',
  'partnerOnboarding', 'carrierOnboarding', 'recruiterCarriers',
  'blogPosts', 'blogCategories', 'faqs', 'complianceGuides',
  'bestPracticesGuides', 'pricingTiers', 'serviceFeatures',
  'caseStudies', 'industryComparisons', 'carrierReviews',
  'carrierTestimonials', 'driverTestimonials', 'adminUsers',
  'jobPostings', 'teamMembers', 'companyMilestones', 'platformSettings',
  'complianceReports', 'scheduledReports', 'interviews',
  'carrierStaffingRequests', 'checkoutAbandonment', 'abandonmentEmailLog',
  'auditLog', 'aiUsageLog', 'aiRouterConfig', 'promptLibrary', 'systemLogs',
  'csaScoreHistory', 'carrierDocuments', 'carrierDriverOutreach',
  'complianceAlerts', 'complianceEvents', 'documentRequests',
  'featureAdoptionLogs', 'featureFunnels', 'featureMetricsDaily', 'featureRegistry',
  'fuelCards', 'fuelPrices', 'restStopReviews', 'restStopConditionReports',
  'weatherAlerts', 'driverWeatherSubscriptions', 'roadConditions',
  'truckRestrictions', 'driverConditionReports', 'incidentReports',
  'onboardingWorkflows', 'parkingLocations', 'parkingReports',
  'qualificationFiles', 'recruiterProfiles', 'roadUtilityCache',
  'systemAlerts', 'systemErrors', 'systemMetrics', 'systemTraces',
  'apiPartners', 'apiSubscriptions', 'apiUsage', 'apiRequestLog',
  'apiProducts', 'apiAlertSubscriptions', 'apiWebhookDeliveries',
  'driverProgression', 'driverAchievements', 'driverChallenges',
  'recruiterProgression', 'recruiterBadges', 'recruiterChallenges',
  'leaderboardSnapshots', 'achievementDefinitions', 'badgeDefinitions',
  'challengeDefinitions', 'gamificationEvents', 'seasonalEvents',
  'eventParticipants', 'eventLeaderboard', 'driverReferrals',
  'matchQualityBonuses', 'driverPerformance', 'retentionRiskLogs',
  'lifecycleEvents', 'terminationLogs', 'surveyDefinitions', 'surveyResponses',
  'matchNotificationLog', 'sourceAttribution', 'recruitingSpend',
  'funnelEvents', 'competitorIntel', 'hiringForecasts',
  'savedSearches', 'savedSearchAlerts', 'callOutcomes', 'callFeedback',
  'interventionTemplates', 'interventionLog', 'pipelineAutomationRules', 'automationLog',
  'forumCategories', 'forumThreads', 'forumPosts', 'forumReports',
  'mentorProfiles', 'mentorMatches', 'healthResources', 'healthTips',
  'petFriendlyLocations', 'petFriendlyReviews',
  'b2bAccounts', 'b2bContacts', 'b2bMatchSignals', 'b2bOpportunities',
  'b2bActivities', 'b2bAutomationRules', 'b2bSequences', 'b2bSequenceSteps',
  'b2bCalls', 'b2bEmails', 'b2bTextMessages', 'b2bLeadCaptureEvents',
  'b2bLeadSources', 'b2bAnalyticsSnapshots', 'b2bAccountResearch',
  'b2bLeadAttribution', 'b2bSpend', 'b2bCompetitorIntel',
  'b2bCallCampaigns', 'b2bPlaybooks', 'b2bValueProps',
  'fleetDrivers', 'equipmentAssets', 'equipmentAssignments',
  'driverScores', 'capacityPlans', 'eldConnections', 'driverLocations',
  'searchJobs', 'agentConversations', 'agentTurns',
  'voiceCallLogs', 'voiceAssistants', 'voiceCampaigns', 'voiceCampaignContacts',
  'agentRuns', 'agentSteps', 'approvalGates', 'runOutcomes',
  'voiceAgentTemplates', 'marketSignals', 'ragEmbeddings',
]);

export function getTableName(collectionKey: string, { strict = true } = {}): string {
  if (strict && !KNOWN_COLLECTIONS.has(collectionKey)) {
    throw new Error(`Unknown collection: "${collectionKey}". Add it to KNOWN_COLLECTIONS in schema.ts`);
  }
  return pgTableName(collectionKey);
}
