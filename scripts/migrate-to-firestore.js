#!/usr/bin/env node
// =============================================================================
// LMDR: Airtable → Firestore Generic Migration Script
// =============================================================================
// Migrates all Airtable tables to Firestore collections.
// Each camelCase key → Firestore collection named after that key.
// Records are stored as Firestore documents with the Airtable record ID as
// the document ID (prefixed with 'at_' to avoid leading numeric chars).
//
// HOW TO RUN:
//   npm install airtable @google-cloud/firestore
//   export AIRTABLE_API_KEY=...
//   export AIRTABLE_BASE_ID=app9N1YCJ3gdhExA0
//   export GOOGLE_CLOUD_PROJECT=your-gcp-project
//   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
//
//   # Migrate all tables (resumable — skips already-migrated collections)
//   node migrate-to-firestore.js --all
//
//   # Migrate a single table
//   node migrate-to-firestore.js --table=carriers
//
//   # Preview without writing
//   node migrate-to-firestore.js --all --dry-run
//
//   # Resume after interruption (reads migration-progress.json)
//   node migrate-to-firestore.js --all --resume
//
// SAFETY:
//   - Never modifies Airtable data (read-only)
//   - Uses batch writes (500/batch — Firestore max)
//   - Writes progress to migration-progress.json after each collection
//   - --dry-run flag previews without writing
// =============================================================================

'use strict';

const Airtable  = require('airtable');
const { Firestore } = require('@google-cloud/firestore');
const fs        = require('fs');
const path      = require('path');

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const CONFIG = {
  AIRTABLE_API_KEY: process.env.AIRTABLE_API_KEY,
  AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID || 'app9N1YCJ3gdhExA0',
  GCP_PROJECT:      process.env.GOOGLE_CLOUD_PROJECT,
  PROGRESS_FILE:    path.join(__dirname, 'migration-progress.json'),
  // Firestore batch size limit
  BATCH_SIZE:       400,
  // Delay between Airtable pages (ms) — stay under 5 req/s limit
  PAGE_DELAY_MS:    250,
};

// ─────────────────────────────────────────────────────────────────────────────
// AIRTABLE TABLE NAMES — camelCase key → Airtable table name
// Inlined from src/backend/configData.js (avoids ESM/CJS interop)
// ─────────────────────────────────────────────────────────────────────────────

const AIRTABLE_TABLE_NAMES = {
  // Core
  carriers:                   'Carriers',
  carrierAccounts:            'v2_Carriers',
  driverProfiles:             'v2_Driver Profiles',
  driverJobs:                 'v2_Driver Jobs',
  legacyDriverLeads:          'Legacy Driver Leads',
  driverApplications:         'Applications',
  fbCampaignDrivers:          'CDL DRIVERS NJ FB CAMPAIGN',
  scoredDrivers:              'Scored Drivers',
  quickAppJotform:            'Quick APP- JOTFORM',
  // Matching
  driverCarrierInterests:     'v2_Driver Carrier Interests',
  carrierDriverViews:         'v2_Carrier Driver Views',
  matchEvents:                'v2_Match Events',
  carrierHiringPreferences:   'v2_Carrier Hiring Preferences',
  driverJobPreferences:       'v2_Driver Job Preferences',
  // Messaging
  messages:                   'v2_Messages',
  memberNotifications:        'v2_Member Notifications',
  memberActivity:             'v2_Member Activity',
  // Announcements
  carrierAnnouncements:       'v2_Carrier Announcements',
  announcementReadReceipts:   'v2_Announcement Read Receipts',
  announcementComments:       'v2_Announcement Comments',
  // Notifications
  carrierNotificationSettings:    'v2_Carrier Notification Settings',
  driverNotificationPreferences:  'v2_Driver Notification Preferences',
  // Policy
  policyDocuments:            'v2_Policy Documents',
  policyAcknowledgments:      'v2_Policy Acknowledgments',
  // Carrier Data
  carrierEnrichments:         'v2_Carrier Enrichments',
  carrierSafetyData:          'v2_FMCSA Safety Data',
  carrierSubscriptions:       'v2_Subscriptions',
  profileViews:               'v2_Profile Views',
  billingHistory:             'v2_Billing History',
  stripeEvents:               'v2_Stripe Events',
  // Onboarding
  partnerOnboarding:          'v2_Partner Onboarding',
  carrierOnboarding:          'v2_Carrier Onboarding',
  recruiterCarriers:          'v2_Recruiter Carriers',
  // Content
  blogPosts:                  'v2_Blog Posts',
  blogCategories:             'v2_Blog Categories',
  faqs:                       'v2_FAQs',
  complianceGuides:           'v2_Compliance Guides',
  bestPracticesGuides:        'v2_Best Practices Guides',
  pricingTiers:               'v2_Pricing Tiers',
  serviceFeatures:            'v2_Service Features',
  caseStudies:                'v2_Case Studies',
  industryComparisons:        'v2_Industry Comparisons',
  carrierReviews:             'v2_Carrier Reviews',
  carrierTestimonials:        'v2_Carrier Testimonials',
  driverTestimonials:         'v2_Driver Testimonials',
  // Admin
  adminUsers:                 'v2_Admin Users',
  jobPostings:                'v2_Job Postings',
  teamMembers:                'v2_Team Members',
  companyMilestones:          'v2_Company Milestones',
  platformSettings:           'v2_Platform Settings',
  complianceReports:          'v2_Compliance Reports',
  scheduledReports:           'v2_Scheduled Reports',
  interviews:                 'v2_Interviews',
  carrierStaffingRequests:    'v2_Carrier Staffing Requests',
  checkoutAbandonment:        'v2_Checkout Abandonment',
  abandonmentEmailLog:        'v2_Abandonment Email Log',
  auditLog:                   'v2_Audit Log',
  aiUsageLog:                 'v2_AI Usage Log',
  aiRouterConfig:             'v2_AI Router Config',
  promptLibrary:              'v2_Prompt Library',
  systemLogs:                 'v2_System Logs',
  // Safety & Compliance
  csaScoreHistory:            'v2_CSA Score History',
  carrierDocuments:           'v2_Carrier Documents',
  carrierDriverOutreach:      'v2_Carrier Driver Outreach',
  complianceAlerts:           'v2_Compliance Alerts',
  complianceEvents:           'v2_Compliance Events',
  documentRequests:           'v2_Document Requests',
  // Analytics
  featureAdoptionLogs:        'v2_Feature Adoption Logs',
  featureFunnels:             'v2_Feature Funnels',
  featureMetricsDaily:        'v2_Feature Metrics Daily',
  featureRegistry:            'v2_Feature Registry',
  // Fuel & Road
  fuelCards:                  'v2_Fuel Cards',
  fuelPrices:                 'v2_Fuel Prices',
  restStopReviews:            'v2_Rest Stop Reviews',
  restStopConditionReports:   'v2_Rest Stop Condition Reports',
  weatherAlerts:              'v2_Weather Alerts',
  driverWeatherSubscriptions: 'v2_Driver Weather Subscriptions',
  roadConditions:             'v2_Road Conditions',
  truckRestrictions:          'v2_Truck Restrictions',
  driverConditionReports:     'v2_Driver Condition Reports',
  incidentReports:            'v2_Incident Reports',
  // Operations
  onboardingWorkflows:        'v2_Onboarding Workflows',
  parkingLocations:           'v2_Parking Locations',
  parkingReports:             'v2_Parking Reports',
  qualificationFiles:         'v2_Qualification Files',
  recruiterProfiles:          'v2_Recruiter Profiles',
  roadUtilityCache:           'v2_Road Utility Cache',
  systemAlerts:               'v2_System Alerts',
  systemErrors:               'v2_System Errors',
  systemMetrics:              'v2_System Metrics',
  systemTraces:               'v2_System Traces',
  // API Partners
  apiPartners:                'v2_API Partners',
  apiSubscriptions:           'v2_API Subscriptions',
  apiUsage:                   'v2_API Usage',
  apiRequestLog:              'v2_API Request Log',
  apiProducts:                'v2_API Products',
  apiAlertSubscriptions:      'v2_API Alert Subscriptions',
  apiWebhookDeliveries:       'v2_API Webhook Deliveries',
  // Meta Ads
  metaIntegrations:           'v2_Meta Integrations',
  metaAdAccounts:             'v2_Meta Ad Accounts',
  metaCampaignMirror:         'v2_Meta Campaign Mirror',
  metaAdSetMirror:            'v2_Meta Ad Set Mirror',
  metaAdMirror:               'v2_Meta Ad Mirror',
  metaCreativeMirror:         'v2_Meta Creative Mirror',
  metaInsightsDaily:          'v2_Meta Insights Daily',
  metaInsightsIntraday:       'v2_Meta Insights Intraday',
  metaAsyncReportJobs:        'v2_Meta Async Report Jobs',
  metaOptimizationActions:    'v2_Meta Optimization Actions',
  metaGovernancePolicies:     'v2_Meta Governance Policies',
  metaMutationAudit:          'v2_Meta Mutation Audit',
  metaErrorEvents:            'v2_Meta Error Events',
  metaRateLimitEvents:        'v2_Meta Rate Limit Events',
  metaAttributionLinks:       'v2_Meta Attribution Links',
  // Gamification
  driverProgression:          'v2_Driver Progression',
  driverAchievements:         'v2_Driver Achievements',
  driverChallenges:           'v2_Driver Challenges',
  recruiterProgression:       'v2_Recruiter Progression',
  recruiterBadges:            'v2_Recruiter Badges',
  recruiterChallenges:        'v2_Recruiter Challenges',
  leaderboardSnapshots:       'v2_Leaderboard Snapshots',
  achievementDefinitions:     'v2_Achievement Definitions',
  badgeDefinitions:           'v2_Badge Definitions',
  challengeDefinitions:       'v2_Challenge Definitions',
  gamificationEvents:         'v2_Gamification Events',
  seasonalEvents:             'v2_Seasonal Events',
  eventParticipants:          'v2_Event Participants',
  eventLeaderboard:           'v2_Event Leaderboard',
  // Referrals & Retention
  driverReferrals:            'v2_Driver Referrals',
  matchQualityBonuses:        'v2_Match Quality Bonuses',
  driverPerformance:          'v2_Driver Performance',
  retentionRiskLogs:          'v2_Retention Risk Logs',
  lifecycleEvents:            'v2_Lifecycle Events',
  terminationLogs:            'v2_Termination Logs',
  // Surveys
  surveyDefinitions:          'v2_Survey Definitions',
  surveyResponses:            'v2_Survey Responses',
  // Attribution
  matchNotificationLog:       'v2_Match Notification Log',
  sourceAttribution:          'v2_Source Attribution',
  recruitingSpend:            'v2_Recruiting Spend',
  funnelEvents:               'v2_Funnel Events',
  competitorIntel:            'v2_Competitor Intel',
  hiringForecasts:            'v2_Hiring Forecasts',
  savedSearches:              'v2_Saved Searches',
  savedSearchAlerts:          'v2_Saved Search Alerts',
  // Call Outcomes
  callOutcomes:               'v2_Call Outcomes',
  callFeedback:               'v2_Call Feedback',
  // Pipeline
  interventionTemplates:      'v2_Intervention Templates',
  interventionLog:            'v2_Intervention Log',
  pipelineAutomationRules:    'v2_Pipeline Automation Rules',
  automationLog:              'v2_Automation Log',
  // Community & Forums
  forumCategories:            'v2_Forum Categories',
  forumThreads:               'v2_Forum Threads',
  forumPosts:                 'v2_Forum Posts',
  forumReports:               'v2_Forum Reports',
  mentorProfiles:             'v2_Mentor Profiles',
  mentorMatches:              'v2_Mentor Matches',
  healthResources:            'v2_Health Resources',
  healthTips:                 'v2_Health Tips',
  petFriendlyLocations:       'v2_Pet Friendly Locations',
  petFriendlyReviews:         'v2_Pet Friendly Reviews',
  // B2B
  b2bAccounts:                'v2_B2B Accounts',
  b2bContacts:                'v2_B2B Contacts',
  b2bMatchSignals:            'v2_B2B Match Signals',
  b2bOpportunities:           'v2_B2B Opportunities',
  b2bActivities:              'v2_B2B Activities',
  b2bAutomationRules:         'v2_B2B Automation Rules',
  b2bSequences:               'v2_B2B Sequences',
  b2bSequenceSteps:           'v2_B2B Sequence Steps',
  b2bCalls:                   'v2_B2B Calls',
  b2bEmails:                  'v2_B2B Emails',
  b2bTextMessages:            'v2_B2B Text Messages',
  b2bLeadCaptureEvents:       'v2_B2B Lead Capture Events',
  b2bLeadSources:             'v2_B2B Lead Sources',
  b2bAnalyticsSnapshots:      'v2_B2B Analytics Snapshots',
  b2bAccountResearch:         'v2_B2B Account Research',
  b2bLeadAttribution:         'v2_B2B Lead Attribution',
  b2bSpend:                   'v2_B2B Spend',
  b2bCompetitorIntel:         'v2_B2B Competitor Intel',
  b2bCallCampaigns:           'v2_B2B Call Campaigns',
  b2bPlaybooks:               'v2_B2B Playbooks',
  b2bValueProps:              'v2_B2B Value Props',
  // Fleet
  fleetDrivers:               'v2_Fleet Drivers',
  equipmentAssets:            'v2_Equipment Assets',
  equipmentAssignments:       'v2_Equipment Assignments',
  driverScores:               'v2_Driver Scores',
  capacityPlans:              'v2_Capacity Plans',
  eldConnections:             'v2_ELD Connections',
  driverLocations:            'v2_Driver Locations',
  // Admin Platform Config
  aiProviderCosts:            'v2_AI Provider Costs',
  costOptimizerConfig:        'v2_Cost Optimizer Config',
  anomalyAlerts:              'v2_Anomaly Alerts',
  anomalyRules:               'v2_Anomaly Rules',
  baselineMetrics:            'v2_Baseline Metrics',
  featureFlags:               'v2_Feature Flags',
  flagEvaluationLogs:         'v2_Flag Evaluation Logs',
  emailTemplates:             'v2_Email Templates',
  emailSendLogs:              'v2_Email Send Logs',
  notificationRules:          'v2_Notification Rules',
  notificationQueue:          'v2_Notification Queue',
  notificationLogs:           'v2_Notification Logs',
  userThrottleState:          'v2_User Throttle State',
  abTests:                    'v2_AB Tests',
  abTestAssignments:          'v2_AB Test Assignments',
  abTestEvents:               'v2_AB Test Events',
  // Business Ops
  revenueMetrics:             'v2_Revenue Metrics',
  billingAdjustments:         'v2_Billing Adjustments',
  invoices:                   'v2_Invoices',
  commissions:                'v2_Commissions',
  salesReps:                  'v2_Sales Reps',
  commissionRules:            'v2_Commission Rules',
  // Support
  supportTickets:             'v2_Support Tickets',
  ticketComments:             'v2_Ticket Comments',
  ticketTags:                 'v2_Ticket Tags',
  knowledgeArticles:          'v2_Knowledge Articles',
  articleCategories:          'v2_Article Categories',
  articleVersions:            'v2_Article Versions',
  npsResponses:               'v2_NPS Responses',
  surveyConfig:               'v2_Survey Config',
  npsTrends:                  'v2_NPS Trends',
  chatSessions:               'v2_Chat Sessions',
  chatMessages:               'v2_Chat Messages',
  cannedResponses:            'v2_Canned Responses',
  // Search Jobs
  searchJobs:                 'v2_Search Jobs',
  // Agent & Voice
  agentConversations:         'v2_Agent Conversations',
  agentTurns:                 'v2_Agent Turns',
  voiceCallLogs:              'v2_Voice Call Logs',
  voiceAssistants:            'v2_Voice Assistants',
  voiceCampaigns:             'v2_Voice Campaigns',
  voiceCampaignContacts:      'v2_Voice Campaign Contacts',
  agentRuns:                  'v2_Agent Runs',
  agentSteps:                 'v2_Agent Steps',
  approvalGates:              'v2_Approval Gates',
  runOutcomes:                'v2_Run Outcomes',
  agentMailTenants:           'v2_AgentMail Tenants',
  agentMailInboxes:           'v2_AgentMail Inboxes',
  agentMailThreads:           'v2_AgentMail Threads',
  agentMailMessages:          'v2_AgentMail Messages',
  agentMailDrafts:            'v2_AgentMail Drafts',
  agentMailWebhookEvents:     'v2_AgentMail Webhook Events',
  communicationIdentities:    'v2_Communication Identities',
  communicationMemories:      'v2_Communication Memories',
  communicationLinks:         'v2_Communication Links',
  // Compendium
  compendiumEntries:          'v2_Compendium Entries',
  // Autopilot
  autopilotCampaigns:         'v2_Autopilot Campaigns',
  autopilotSteps:             'v2_Autopilot Steps',
  // Self-Healing
  remediationPlans:           'v2_Remediation Plans',
  incidentLog:                'v2_Incident Log',
  // Agent Evals
  agentEvaluations:           'v2_Agent Evaluations',
  // Outreach Campaigns
  emailCampaigns:             'v2_Email Campaigns',
  emailSequences:             'v2_Email Sequences',
  emailSequenceEnrollments:   'v2_Email Sequence Enrollments',
  emailMessages:              'v2_Email Messages',
  smsCampaigns:               'v2_SMS Campaigns',
  smsMessages:                'v2_SMS Messages',
  smsOptOuts:                 'v2_SMS Opt Outs',
  jobBoardCredentials:        'v2_Job Board Credentials',
  jobApplications:            'v2_Job Applications',
  socialPosts:                'v2_Social Posts',
  socialAccounts:             'v2_Social Accounts',
  socialPostQueue:            'v2_Social Post Queue',
  socialAuditLog:             'v2_Social Audit Log',
  socialCredentials:          'v2_Social Credentials',
  // Pipeline Execution
  pipelineEvents:             'v2_Pipeline Events',
  voiceAgentTemplates:        'v2_Voice Agent Templates',
  // Phase 1: Driver Expansion
  driverSavedJobs:            'v2_Driver Saved Jobs',
  driverMessages:             'v2_Driver Messages',
  driverConversations:        'v2_Driver Conversations',
  driverActivityFeed:         'v2_Driver Activity Feed',
  parkingFavorites:           'v2_Parking Favorites',
  weighStationStatus:         'v2_Weigh Station Status',
  roadHazardReports:          'v2_Road Hazard Reports',
  weatherAlertSubs:           'v2_Weather Alert Subscriptions',
  forumReplies:               'v2_Forum Replies',
  mentorshipConnections:      'v2_Mentorship Connections',
  hosRecords:                 'v2_HOS Records',
  hosViolations:              'v2_HOS Violations',
  eldLogs:                    'v2_ELD Logs',
  trainingCourses:            'v2_Training Courses',
  trainingEnrollments:        'v2_Training Enrollments',
  trainingProgress:           'v2_Training Progress',
  driverExpenses:             'v2_Driver Expenses',
  driverSettlements:          'v2_Driver Settlements',
  driverTaxSummary:           'v2_Driver Tax Summary',
  driverLifecycleEvents:      'v2_Driver Lifecycle Events',
  driverSurveys:              'v2_Driver Surveys',
  driverSurveyResponses:      'v2_Driver Survey Responses',
  driverQuickResponses:       'v2_Driver Quick Responses',
  reverseAlerts:              'v2_Reverse Alerts',
  driverNotifications:        'v2_Driver Notifications',
  driverMatches:              'v2_Driver Matches',
  // Phase 2: Recruiter Surface
  backgroundChecks:           'v2_Background Checks',
  drugTests:                  'v2_Drug Tests',
  orientationSlots:           'v2_Orientation Slots',
  eSignRequests:              'v2_E-Sign Requests',
  outreachTemplates:          'v2_Outreach Templates',
  retentionWatchlist:         'v2_Retention Watchlist',
  retentionInterventions:     'v2_Retention Interventions',
  matchSubscriptions:         'v2_Match Subscriptions',
  matchSubscriptionAlerts:    'v2_Match Subscription Alerts',
  recruiterScorecards:        'v2_Recruiter Scorecards',
  // Phase 3: Carrier & B2B
  driverRecognitions:         'v2_Driver Recognitions',
  feedbackRequests:           'v2_Feedback Requests',
  b2bTasks:                   'v2_B2B Tasks',
  // Phase 5: Cross-Role Intelligence
  marketIntelligence:         'v2_Market Intelligence',
  driverMatchFeedback:        'v2_Driver Match Feedback',
  driverSurveyRequests:       'v2_Driver Survey Requests',
  settlementDisputes:         'v2_Settlement Disputes',
  taxReferenceData:           'v2_Tax Reference Data',
  exitSurveys:                'v2_Exit Surveys',
  // Retention Outcomes
  retentionOutcomes:          'v2_Retention Outcomes',
  // Market Signals
  marketSignals:              'v2_Market Signals',
  // RAG + Intent Layer
  ragDocuments:               'v2_RAG Documents',
  ragRetrievalLog:            'v2_RAG Retrieval Log',
  ragAnalytics:               'v2_RAG Analytics',
  intentClassificationLog:    'v2_Intent Classification Log',
};

// ─────────────────────────────────────────────────────────────────────────────
// CLIENTS
// ─────────────────────────────────────────────────────────────────────────────

const base = new Airtable({ apiKey: CONFIG.AIRTABLE_API_KEY }).base(CONFIG.AIRTABLE_BASE_ID);
const firestore = new Firestore({ projectId: CONFIG.GCP_PROJECT });

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS TRACKING
// ─────────────────────────────────────────────────────────────────────────────

function loadProgress() {
  try {
    if (fs.existsSync(CONFIG.PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG.PROGRESS_FILE, 'utf8'));
    }
  } catch {}
  return { completed: [], errors: {} };
}

function saveProgress(progress) {
  fs.writeFileSync(CONFIG.PROGRESS_FILE, JSON.stringify(progress, null, 2));
}

// ─────────────────────────────────────────────────────────────────────────────
// AIRTABLE: Fetch all records from a table (paginated)
// ─────────────────────────────────────────────────────────────────────────────

async function fetchAllRecords(airtableTableName) {
  const records = [];
  await base(airtableTableName).select({ pageSize: 100 }).eachPage(
    (pageRecords, fetchNextPage) => {
      records.push(...pageRecords);
      process.stdout.write(`\r   Fetched ${records.length} records...`);
      fetchNextPage();
    }
  );
  process.stdout.write('\n');
  return records;
}

// ─────────────────────────────────────────────────────────────────────────────
// FIRESTORE: Write records in batches of BATCH_SIZE
// ─────────────────────────────────────────────────────────────────────────────

async function writeToFirestore(collectionKey, records, dryRun) {
  const collectionRef = firestore.collection(collectionKey);
  let written = 0;

  for (let i = 0; i < records.length; i += CONFIG.BATCH_SIZE) {
    const chunk = records.slice(i, i + CONFIG.BATCH_SIZE);

    if (!dryRun) {
      const batch = firestore.batch();
      for (const record of chunk) {
        // Use 'at_' prefix + Airtable record ID as Firestore document ID
        const docRef = collectionRef.doc(`at_${record.id}`);
        batch.set(docRef, {
          _airtableId:    record.id,
          _collectionKey: collectionKey,
          _migratedAt:    new Date().toISOString(),
          ...record.fields,
        }, { merge: true });
      }
      await batch.commit();
    }

    written += chunk.length;
    process.stdout.write(`\r   Written ${written}/${records.length} to Firestore...`);
  }
  process.stdout.write('\n');
  return written;
}

// ─────────────────────────────────────────────────────────────────────────────
// MIGRATE ONE TABLE
// ─────────────────────────────────────────────────────────────────────────────

async function migrateTable(collectionKey, airtableTableName, dryRun) {
  console.log(`\n→ [${collectionKey}] Airtable table: "${airtableTableName}"`);

  let records;
  try {
    records = await fetchAllRecords(airtableTableName);
  } catch (err) {
    // Table may not exist yet in this base
    if (err.statusCode === 422 || err.message?.includes('not found')) {
      console.log(`   SKIP — table not found in Airtable base`);
      return { skipped: true };
    }
    throw err;
  }

  console.log(`   ${records.length} records found`);
  if (records.length === 0) return { count: 0 };

  const written = await writeToFirestore(collectionKey, records, dryRun);
  console.log(`   ✓ ${dryRun ? '[DRY RUN] Would write' : 'Wrote'} ${written} documents → collection "${collectionKey}"`);
  return { count: written };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const args      = process.argv.slice(2);
  const dryRun    = args.includes('--dry-run');
  const resume    = args.includes('--resume');
  const tableArg  = args.find(a => a.startsWith('--table='));
  const runAll    = args.includes('--all');
  const targetKey = tableArg ? tableArg.split('=')[1] : null;

  if (!CONFIG.AIRTABLE_API_KEY) {
    console.error('✗ AIRTABLE_API_KEY env var is required');
    process.exit(1);
  }

  console.log('='.repeat(60));
  console.log(' LMDR: Airtable → Firestore Migration');
  console.log('='.repeat(60));
  if (dryRun) console.log(' MODE: DRY RUN (no writes)');
  console.log(` Base: ${CONFIG.AIRTABLE_BASE_ID}`);
  console.log(` Project: ${CONFIG.GCP_PROJECT || '(from ADC)'}`);

  const progress = loadProgress();
  const totalStart = Date.now();
  let migratedCount = 0;
  let skippedCount  = 0;
  let errorCount    = 0;

  // Determine which tables to process
  let tablesToProcess;
  if (targetKey) {
    if (!AIRTABLE_TABLE_NAMES[targetKey]) {
      console.error(`✗ Unknown table key: "${targetKey}"`);
      console.error(`  Valid keys: ${Object.keys(AIRTABLE_TABLE_NAMES).join(', ')}`);
      process.exit(1);
    }
    tablesToProcess = [[targetKey, AIRTABLE_TABLE_NAMES[targetKey]]];
  } else if (runAll) {
    tablesToProcess = Object.entries(AIRTABLE_TABLE_NAMES);
  } else {
    console.error('Usage:\n  node migrate-to-firestore.js --all\n  node migrate-to-firestore.js --table=<key>\n  Add --dry-run to preview\n  Add --resume to skip already-completed collections');
    process.exit(1);
  }

  console.log(`\n${tablesToProcess.length} table(s) to process\n`);

  for (const [collectionKey, airtableTableName] of tablesToProcess) {
    // Skip already-completed collections when resuming
    if (resume && progress.completed.includes(collectionKey)) {
      console.log(`→ [${collectionKey}] SKIP (already completed)`);
      skippedCount++;
      continue;
    }

    try {
      const result = await migrateTable(collectionKey, airtableTableName, dryRun);
      if (!result.skipped) {
        migratedCount += result.count || 0;
        if (!dryRun) {
          progress.completed.push(collectionKey);
          saveProgress(progress);
        }
      } else {
        skippedCount++;
      }
    } catch (err) {
      console.error(`   ✗ ERROR: ${err.message}`);
      errorCount++;
      progress.errors[collectionKey] = err.message;
      if (!dryRun) saveProgress(progress);
    }

    // Polite delay between tables to avoid Airtable rate limits
    await new Promise(r => setTimeout(r, CONFIG.PAGE_DELAY_MS));
  }

  const elapsed = ((Date.now() - totalStart) / 1000).toFixed(1);
  console.log('\n' + '='.repeat(60));
  console.log(' MIGRATION COMPLETE');
  console.log('='.repeat(60));
  console.log(` Total documents migrated : ${migratedCount}`);
  console.log(` Tables skipped           : ${skippedCount}`);
  console.log(` Tables with errors       : ${errorCount}`);
  console.log(` Time elapsed             : ${elapsed}s`);
  if (!dryRun) console.log(` Progress saved to        : ${CONFIG.PROGRESS_FILE}`);
  if (errorCount > 0) {
    console.log('\n Errors:');
    for (const [k, msg] of Object.entries(progress.errors)) {
      console.log(`   ${k}: ${msg}`);
    }
  }
}

main().catch(err => {
  console.error('✗ Fatal:', err.message);
  process.exit(1);
});
