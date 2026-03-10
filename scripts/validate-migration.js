#!/usr/bin/env node
// =============================================================================
// LMDR: Phase 5 Migration Validation Script
// =============================================================================
// Validates the Airtable → Cloud SQL migration by checking:
//   1. JSONB table row counts (airtable_* tables)
//   2. Typed table row counts (carriers, driver_profiles, etc.)
//   3. id_mapping table population
//   4. Data integrity spot-checks (carrier dot_number cross-reference)
//   5. Orphaned record detection (typed rows missing from id_mapping)
//
// HOW TO RUN:
//   node scripts/validate-migration.js
//
// EXIT CODES:
//   0 = all checks pass
//   1 = one or more checks failed
// =============================================================================

'use strict';

const { Pool } = require('pg');

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────────────────────

const CONFIG = {
  PG_HOST:     process.env.PG_HOST     || '127.0.0.1',
  PG_PORT:     process.env.PG_PORT     || 5432,
  PG_DATABASE: process.env.PG_DATABASE || 'lmdr',
  PG_USER:     process.env.PG_USER     || 'lmdr_user',
  PG_PASSWORD: process.env.PG_PASSWORD || 'cht7nLOGcOxpNm2ruPhO6ScqKBeqsF4o',
};

// ─────────────────────────────────────────────────────────────────────────────
// TABLE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

// JSONB tables created by migrate-to-cloudsql.js (airtable_<snake_case>)
// This list mirrors the AIRTABLE_TABLE_NAMES keys from that script,
// converted to their Postgres table names via toSnakeCase().
function toSnakeCase(str) {
  return str.replace(/([A-Z])/g, '_$1').toLowerCase();
}

const AIRTABLE_COLLECTION_KEYS = [
  'carriers', 'carrierAccounts', 'clientCarriers', 'driverProfiles',
  'driverJobs', 'legacyDriverLeads', 'driverApplications',
  'fbCampaignDrivers', 'scoredDrivers', 'quickAppJotform',
  'driverCarrierInterests', 'carrierDriverViews', 'matchEvents',
  'carrierHiringPreferences', 'driverJobPreferences', 'messages',
  'memberNotifications', 'memberActivity', 'carrierAnnouncements',
  'announcementReadReceipts', 'announcementComments',
  'carrierNotificationSettings', 'driverNotificationPreferences',
  'policyDocuments', 'policyAcknowledgments', 'carrierEnrichments',
  'carrierSafetyData', 'carrierSubscriptions', 'profileViews',
  'billingHistory', 'stripeEvents', 'partnerOnboarding',
  'carrierOnboarding', 'recruiterCarriers', 'blogPosts',
  'blogCategories', 'faqs', 'complianceGuides', 'bestPracticesGuides',
  'pricingTiers', 'serviceFeatures', 'caseStudies',
  'industryComparisons', 'carrierReviews', 'carrierTestimonials',
  'driverTestimonials', 'adminUsers', 'jobPostings', 'teamMembers',
  'companyMilestones', 'platformSettings', 'complianceReports',
  'scheduledReports', 'interviews', 'carrierStaffingRequests',
  'checkoutAbandonment', 'abandonmentEmailLog', 'auditLog',
  'aiUsageLog', 'aiRouterConfig', 'promptLibrary', 'systemLogs',
  'csaScoreHistory', 'carrierDocuments', 'carrierDriverOutreach',
  'complianceAlerts', 'complianceEvents', 'documentRequests',
  'featureAdoptionLogs', 'featureFunnels', 'featureMetricsDaily',
  'featureRegistry', 'fuelCards', 'fuelPrices', 'restStopReviews',
  'restStopConditionReports', 'weatherAlerts',
  'driverWeatherSubscriptions', 'roadConditions', 'truckRestrictions',
  'driverConditionReports', 'incidentReports', 'onboardingWorkflows',
  'parkingLocations', 'parkingReports', 'qualificationFiles',
  'recruiterProfiles', 'roadUtilityCache', 'systemAlerts',
  'systemErrors', 'systemMetrics', 'systemTraces', 'apiPartners',
  'apiSubscriptions', 'apiUsage', 'apiRequestLog', 'apiProducts',
  'apiAlertSubscriptions', 'apiWebhookDeliveries', 'metaIntegrations',
  'metaAdAccounts', 'metaCampaignMirror', 'metaAdSetMirror',
  'metaAdMirror', 'metaCreativeMirror', 'metaInsightsDaily',
  'metaInsightsIntraday', 'metaAsyncReportJobs',
  'metaOptimizationActions', 'metaGovernancePolicies',
  'metaMutationAudit', 'metaErrorEvents', 'metaRateLimitEvents',
  'metaAttributionLinks', 'driverProgression', 'driverAchievements',
  'driverChallenges', 'recruiterProgression', 'recruiterBadges',
  'recruiterChallenges', 'leaderboardSnapshots',
  'achievementDefinitions', 'badgeDefinitions', 'challengeDefinitions',
  'gamificationEvents', 'seasonalEvents', 'eventParticipants',
  'eventLeaderboard', 'driverReferrals', 'matchQualityBonuses',
  'driverPerformance', 'retentionRiskLogs', 'lifecycleEvents',
  'terminationLogs', 'surveyDefinitions', 'surveyResponses',
  'matchNotificationLog', 'sourceAttribution', 'recruitingSpend',
  'funnelEvents', 'competitorIntel', 'hiringForecasts',
  'savedSearches', 'savedSearchAlerts', 'callOutcomes', 'callFeedback',
  'interventionTemplates', 'interventionLog',
  'pipelineAutomationRules', 'automationLog', 'forumCategories',
  'forumThreads', 'forumPosts', 'forumReports', 'mentorProfiles',
  'mentorMatches', 'healthResources', 'healthTips',
  'petFriendlyLocations', 'petFriendlyReviews', 'b2bAccounts',
  'b2bContacts', 'b2bMatchSignals', 'b2bOpportunities',
  'b2bActivities', 'b2bAutomationRules', 'b2bSequences',
  'b2bSequenceSteps', 'b2bCalls', 'b2bEmails', 'b2bTextMessages',
  'b2bLeadCaptureEvents', 'b2bLeadSources', 'b2bAnalyticsSnapshots',
  'b2bAccountResearch', 'b2bLeadAttribution', 'b2bSpend',
  'b2bCompetitorIntel', 'b2bCallCampaigns', 'b2bPlaybooks',
  'b2bValueProps', 'fleetDrivers', 'equipmentAssets',
  'equipmentAssignments', 'driverScores', 'capacityPlans',
  'eldConnections', 'driverLocations', 'aiProviderCosts',
  'costOptimizerConfig', 'anomalyAlerts', 'anomalyRules',
  'baselineMetrics', 'featureFlags', 'flagEvaluationLogs',
  'emailTemplates', 'emailSendLogs', 'notificationRules',
  'notificationQueue', 'notificationLogs', 'userThrottleState',
  'abTests', 'abTestAssignments', 'abTestEvents', 'revenueMetrics',
  'billingAdjustments', 'invoices', 'commissions', 'salesReps',
  'commissionRules', 'supportTickets', 'ticketComments', 'ticketTags',
  'knowledgeArticles', 'articleCategories', 'articleVersions',
  'npsResponses', 'surveyConfig', 'npsTrends', 'chatSessions',
  'chatMessages', 'cannedResponses', 'searchJobs',
  'agentConversations', 'agentTurns', 'voiceCallLogs',
  'voiceAssistants', 'voiceCampaigns', 'voiceCampaignContacts',
  'agentRuns', 'agentSteps', 'approvalGates', 'runOutcomes',
  'agentMailTenants', 'agentMailInboxes', 'agentMailThreads',
  'agentMailMessages', 'agentMailDrafts', 'agentMailWebhookEvents',
  'communicationIdentities', 'communicationMemories',
  'communicationLinks', 'compendiumEntries', 'autopilotCampaigns',
  'autopilotSteps', 'remediationPlans', 'incidentLog',
  'agentEvaluations', 'emailCampaigns', 'emailSequences',
  'emailSequenceEnrollments', 'emailMessages', 'smsCampaigns',
  'smsMessages', 'smsOptOuts', 'jobBoardCredentials',
  'jobApplications', 'socialPosts', 'socialAccounts',
  'socialPostQueue', 'socialAuditLog', 'socialCredentials',
  'pipelineEvents', 'voiceAgentTemplates', 'driverSavedJobs',
  'driverMessages', 'driverConversations', 'driverActivityFeed',
  'parkingFavorites', 'weighStationStatus', 'roadHazardReports',
  'weatherAlertSubs', 'forumReplies', 'mentorshipConnections',
  'hosRecords', 'hosViolations', 'eldLogs', 'trainingCourses',
  'trainingEnrollments', 'trainingProgress', 'driverExpenses',
  'driverSettlements', 'driverTaxSummary', 'driverLifecycleEvents',
  'driverSurveys', 'driverSurveyResponses', 'driverQuickResponses',
  'reverseAlerts', 'driverNotifications', 'driverMatches',
  'backgroundChecks', 'drugTests', 'orientationSlots',
  'eSignRequests', 'outreachTemplates', 'retentionWatchlist',
  'retentionInterventions', 'matchSubscriptions',
  'matchSubscriptionAlerts', 'recruiterScorecards',
  'driverRecognitions', 'feedbackRequests', 'b2bTasks',
  'marketIntelligence', 'driverMatchFeedback', 'driverSurveyRequests',
  'settlementDisputes', 'taxReferenceData', 'exitSurveys',
  'retentionOutcomes', 'marketSignals', 'ragDocuments',
  'ragRetrievalLog', 'ragAnalytics', 'intentClassificationLog',
];

// Typed tables from 05_sql_schema.sql
const TYPED_TABLES = [
  'carriers',
  'driver_profiles',
  'driver_applications',
  'carrier_subscriptions',
  'messages',
  'matching_scores',
  'faqs',
  'blog_posts',
  'compliance_guides',
];

// Mapping from typed table name to id_mapping collection_name
// (matches the collectionName used in saveIdMapping() in 07_backfill)
const TYPED_TABLE_COLLECTION_MAP = {
  carriers:               'carriers',
  driver_profiles:        'driver_profiles',
  driver_applications:    'driver_applications',
  carrier_subscriptions:  'carrier_subscriptions',
  messages:               'messages',
  matching_scores:        'matching_scores',
  faqs:                   'faqs',
  blog_posts:             'blog_posts',
  compliance_guides:      'compliance_guides',
};

// JSONB table counterparts for typed tables (for cross-reference checks)
// The JSONB migration skips carriers/carrierAccounts/driverProfiles/faqs by default,
// but the typed tables have airtable_id columns we can use.
const TYPED_TO_JSONB_MAP = {
  carriers:            'airtable_carriers',
  driver_profiles:     'airtable_driver_profiles',
  faqs:                'airtable_faqs',
};

// ─────────────────────────────────────────────────────────────────────────────
// REPORT STATE
// ─────────────────────────────────────────────────────────────────────────────

const results = {
  checks: [],
  passed: 0,
  failed: 0,
  warned: 0,
};

function pass(name, detail) {
  results.checks.push({ status: 'PASS', name, detail });
  results.passed++;
}

function fail(name, detail) {
  results.checks.push({ status: 'FAIL', name, detail });
  results.failed++;
}

function warn(name, detail) {
  results.checks.push({ status: 'WARN', name, detail });
  results.warned++;
}

function printLine(char, len) {
  console.log(char.repeat(len));
}

// ─────────────────────────────────────────────────────────────────────────────
// CHECK 1: JSONB table row counts
// ─────────────────────────────────────────────────────────────────────────────

async function checkJsonbTables(client) {
  console.log('\n[1/6] JSONB Table Row Counts (airtable_* tables)');
  printLine('-', 60);

  let found = 0;
  let empty = 0;
  let missing = 0;
  const tableCounts = {};

  for (const key of AIRTABLE_COLLECTION_KEYS) {
    const tableName = `airtable_${toSnakeCase(key)}`;
    try {
      const r = await client.query(`SELECT COUNT(*) AS cnt FROM "${tableName}"`);
      const count = parseInt(r.rows[0].cnt, 10);
      tableCounts[tableName] = count;
      if (count > 0) {
        found++;
      } else {
        empty++;
      }
      console.log(`   ${tableName.padEnd(50)} ${String(count).padStart(8)} rows`);
    } catch (err) {
      // Table does not exist
      tableCounts[tableName] = -1;
      missing++;
      console.log(`   ${tableName.padEnd(50)}  MISSING`);
    }
  }

  const total = AIRTABLE_COLLECTION_KEYS.length;
  console.log(`\n   Summary: ${found} with data, ${empty} empty, ${missing} missing (of ${total} expected)`);

  if (found > 0) {
    pass('JSONB tables exist', `${found}/${total} tables have data`);
  } else {
    fail('JSONB tables exist', `No JSONB tables have data (${missing} missing, ${empty} empty)`);
  }

  if (missing > total * 0.5) {
    fail('JSONB table coverage', `${missing}/${total} tables missing — migration may not have run`);
  } else if (missing > 0) {
    warn('JSONB table coverage', `${missing}/${total} tables missing — some Airtable tables may have been empty`);
  } else {
    pass('JSONB table coverage', 'All expected JSONB tables exist');
  }

  return tableCounts;
}

// ─────────────────────────────────────────────────────────────────────────────
// CHECK 2: Typed table row counts
// ─────────────────────────────────────────────────────────────────────────────

async function checkTypedTables(client) {
  console.log('\n[2/6] Typed Table Row Counts');
  printLine('-', 60);

  const typedCounts = {};
  let allExist = true;

  for (const table of TYPED_TABLES) {
    try {
      const r = await client.query(`SELECT COUNT(*) AS cnt FROM "${table}"`);
      const count = parseInt(r.rows[0].cnt, 10);
      typedCounts[table] = count;
      console.log(`   ${table.padEnd(30)} ${String(count).padStart(8)} rows`);
    } catch (err) {
      typedCounts[table] = -1;
      allExist = false;
      console.log(`   ${table.padEnd(30)}  MISSING`);
    }
  }

  if (allExist) {
    pass('Typed tables exist', `All ${TYPED_TABLES.length} typed tables found`);
  } else {
    const missingList = TYPED_TABLES.filter(t => typedCounts[t] === -1);
    fail('Typed tables exist', `Missing: ${missingList.join(', ')}`);
  }

  // Check that at least carriers and driver_profiles have data
  const coreWithData = ['carriers', 'driver_profiles'].filter(t => typedCounts[t] > 0);
  if (coreWithData.length === 2) {
    pass('Core typed tables populated', `carriers=${typedCounts.carriers}, driver_profiles=${typedCounts.driver_profiles}`);
  } else {
    fail('Core typed tables populated', `carriers=${typedCounts.carriers ?? 'MISSING'}, driver_profiles=${typedCounts.driver_profiles ?? 'MISSING'}`);
  }

  return typedCounts;
}

// ─────────────────────────────────────────────────────────────────────────────
// CHECK 3: id_mapping table
// ─────────────────────────────────────────────────────────────────────────────

async function checkIdMapping(client) {
  console.log('\n[3/6] ID Mapping Table');
  printLine('-', 60);

  try {
    const totalR = await client.query('SELECT COUNT(*) AS cnt FROM id_mapping');
    const total = parseInt(totalR.rows[0].cnt, 10);
    console.log(`   Total id_mapping entries: ${total}`);

    if (total > 0) {
      pass('id_mapping populated', `${total} entries`);
    } else {
      fail('id_mapping populated', 'Table exists but has 0 entries');
    }

    // Breakdown by collection_name
    const breakdownR = await client.query(`
      SELECT collection_name, COUNT(*) AS cnt
      FROM id_mapping
      GROUP BY collection_name
      ORDER BY collection_name
    `);

    if (breakdownR.rows.length > 0) {
      console.log('\n   Breakdown by collection:');
      for (const row of breakdownR.rows) {
        console.log(`     ${row.collection_name.padEnd(30)} ${String(row.cnt).padStart(8)} entries`);
      }
    }

    return total;
  } catch (err) {
    console.log(`   id_mapping table: MISSING (${err.message})`);
    fail('id_mapping exists', 'Table does not exist');
    return 0;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CHECK 4: Data integrity spot-check
// Pick 3 random carriers from the typed table and verify their dot_number
// also exists in the JSONB table (if it was migrated there).
// ─────────────────────────────────────────────────────────────────────────────

async function checkDataIntegrity(client) {
  console.log('\n[4/6] Data Integrity Spot-Check (Carriers)');
  printLine('-', 60);

  // First check if typed carriers table has data
  let typedCount;
  try {
    const r = await client.query('SELECT COUNT(*) AS cnt FROM carriers');
    typedCount = parseInt(r.rows[0].cnt, 10);
  } catch {
    console.log('   SKIP: carriers typed table does not exist');
    warn('Data integrity spot-check', 'carriers typed table missing');
    return;
  }

  if (typedCount === 0) {
    console.log('   SKIP: carriers typed table is empty');
    warn('Data integrity spot-check', 'carriers typed table empty');
    return;
  }

  // Pick 3 random carriers from the typed table
  const sampleR = await client.query(`
    SELECT _id, airtable_id, dot_number, company_name
    FROM carriers
    WHERE airtable_id IS NOT NULL AND dot_number IS NOT NULL
    ORDER BY RANDOM()
    LIMIT 3
  `);

  if (sampleR.rows.length === 0) {
    console.log('   SKIP: No carriers with airtable_id and dot_number found');
    warn('Data integrity spot-check', 'No carriers with both airtable_id and dot_number');
    return;
  }

  let matchCount = 0;
  let checkCount = 0;

  // Check if the JSONB carrier table exists
  let jsonbExists = false;
  try {
    await client.query('SELECT 1 FROM "airtable_carriers" LIMIT 1');
    jsonbExists = true;
  } catch {
    // JSONB carriers table may not exist if --include-typed was not used
  }

  // Also check airtable_carrier_accounts (carrierAccounts maps to 'Carriers (Leads)')
  let jsonbAccountsExists = false;
  try {
    await client.query('SELECT 1 FROM "airtable_carrier_accounts" LIMIT 1');
    jsonbAccountsExists = true;
  } catch {}

  for (const carrier of sampleR.rows) {
    checkCount++;
    console.log(`\n   Sample ${checkCount}: DOT ${carrier.dot_number} — "${carrier.company_name}"`);
    console.log(`     Typed table _id:    ${carrier._id}`);
    console.log(`     Airtable record ID: ${carrier.airtable_id}`);

    let foundInJsonb = false;

    // Check JSONB carriers table
    if (jsonbExists) {
      const jsonbR = await client.query(
        `SELECT airtable_id, data->>'DOT Number' AS dot, data->>'dot_number' AS dot2
         FROM "airtable_carriers"
         WHERE airtable_id = $1`,
        [carrier.airtable_id]
      );
      if (jsonbR.rows.length > 0) {
        const dot = jsonbR.rows[0].dot || jsonbR.rows[0].dot2;
        console.log(`     Found in airtable_carriers JSONB: dot_number=${dot}`);
        foundInJsonb = true;
      }
    }

    // Also check airtable_carrier_accounts
    if (!foundInJsonb && jsonbAccountsExists) {
      const jsonbR = await client.query(
        `SELECT airtable_id, data->>'DOT Number' AS dot, data->>'dot_number' AS dot2
         FROM "airtable_carrier_accounts"
         WHERE airtable_id = $1`,
        [carrier.airtable_id]
      );
      if (jsonbR.rows.length > 0) {
        const dot = jsonbR.rows[0].dot || jsonbR.rows[0].dot2;
        console.log(`     Found in airtable_carrier_accounts JSONB: dot_number=${dot}`);
        foundInJsonb = true;
      }
    }

    // Check id_mapping
    const mappingR = await client.query(
      `SELECT gcp_uuid, collection_name FROM id_mapping WHERE airtable_id = $1`,
      [carrier.airtable_id]
    );
    if (mappingR.rows.length > 0) {
      console.log(`     Found in id_mapping: gcp_uuid=${mappingR.rows[0].gcp_uuid}, collection=${mappingR.rows[0].collection_name}`);
      // Verify the gcp_uuid matches the typed table _id
      if (mappingR.rows[0].gcp_uuid === carrier._id) {
        console.log(`     UUID match: CONFIRMED`);
      } else {
        console.log(`     UUID match: MISMATCH (mapping=${mappingR.rows[0].gcp_uuid}, typed=${carrier._id})`);
      }
    } else {
      console.log(`     id_mapping: NOT FOUND`);
    }

    if (foundInJsonb || mappingR.rows.length > 0) {
      matchCount++;
    }
  }

  if (matchCount === checkCount) {
    pass('Data integrity spot-check', `${matchCount}/${checkCount} sampled carriers verified across sources`);
  } else if (matchCount > 0) {
    warn('Data integrity spot-check', `Only ${matchCount}/${checkCount} sampled carriers found in JSONB/mapping (JSONB tables may have been skipped)`);
  } else {
    fail('Data integrity spot-check', `0/${checkCount} sampled carriers found in JSONB or id_mapping`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CHECK 5: Orphaned records (typed table rows without id_mapping entries)
// ─────────────────────────────────────────────────────────────────────────────

async function checkOrphanedRecords(client) {
  console.log('\n[5/6] Orphaned Record Detection');
  printLine('-', 60);

  let totalOrphans = 0;
  let tablesChecked = 0;

  for (const [table, collectionName] of Object.entries(TYPED_TABLE_COLLECTION_MAP)) {
    // Check if the typed table exists and has an airtable_id column
    try {
      await client.query(`SELECT 1 FROM "${table}" LIMIT 1`);
    } catch {
      console.log(`   ${table.padEnd(30)} SKIP (table missing)`);
      continue;
    }

    // Check if the table has an airtable_id column
    const colCheck = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1 AND column_name = 'airtable_id'
    `, [table]);

    if (colCheck.rows.length === 0) {
      // Table like matching_scores may not have airtable_id
      console.log(`   ${table.padEnd(30)} SKIP (no airtable_id column)`);
      continue;
    }

    tablesChecked++;

    // Count typed records that have an airtable_id but no id_mapping entry
    const orphanR = await client.query(`
      SELECT COUNT(*) AS cnt
      FROM "${table}" t
      WHERE t.airtable_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM id_mapping m
          WHERE m.airtable_id = t.airtable_id
            AND m.collection_name = $1
        )
    `, [collectionName]);

    const orphans = parseInt(orphanR.rows[0].cnt, 10);
    totalOrphans += orphans;

    // Also get total count for context
    const totalR = await client.query(
      `SELECT COUNT(*) AS cnt FROM "${table}" WHERE airtable_id IS NOT NULL`
    );
    const total = parseInt(totalR.rows[0].cnt, 10);

    if (orphans > 0) {
      console.log(`   ${table.padEnd(30)} ${orphans} orphans / ${total} total (${((orphans / Math.max(total, 1)) * 100).toFixed(1)}%)`);
    } else {
      console.log(`   ${table.padEnd(30)} 0 orphans / ${total} total`);
    }
  }

  if (tablesChecked === 0) {
    warn('Orphaned records', 'No typed tables with airtable_id found to check');
  } else if (totalOrphans === 0) {
    pass('Orphaned records', `0 orphaned records across ${tablesChecked} typed tables`);
  } else {
    fail('Orphaned records', `${totalOrphans} typed-table records have no id_mapping entry across ${tablesChecked} tables`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CHECK 6: Cross-table consistency (JSONB vs typed counts for shared tables)
// ─────────────────────────────────────────────────────────────────────────────

async function checkCrossTableConsistency(client) {
  console.log('\n[6/6] Cross-Table Consistency (JSONB vs Typed)');
  printLine('-', 60);

  // For tables that exist in BOTH typed and JSONB form, compare counts
  const crossChecks = [
    { typed: 'carriers',        jsonb: 'airtable_carriers' },
    { typed: 'driver_profiles', jsonb: 'airtable_driver_profiles' },
    { typed: 'faqs',            jsonb: 'airtable_faqs' },
  ];

  let checksRun = 0;
  let checksOk = 0;

  for (const { typed, jsonb } of crossChecks) {
    let typedCount, jsonbCount;

    try {
      const r1 = await client.query(`SELECT COUNT(*) AS cnt FROM "${typed}"`);
      typedCount = parseInt(r1.rows[0].cnt, 10);
    } catch {
      console.log(`   ${typed} vs ${jsonb}: typed table missing, skipping`);
      continue;
    }

    try {
      const r2 = await client.query(`SELECT COUNT(*) AS cnt FROM "${jsonb}"`);
      jsonbCount = parseInt(r2.rows[0].cnt, 10);
    } catch {
      console.log(`   ${typed} vs ${jsonb}: JSONB table missing (expected if --include-typed not used)`);
      continue;
    }

    checksRun++;
    const diff = Math.abs(typedCount - jsonbCount);
    const pct = typedCount > 0 ? ((diff / typedCount) * 100).toFixed(1) : '0.0';

    if (diff === 0) {
      console.log(`   ${typed.padEnd(25)} typed=${typedCount}  jsonb=${jsonbCount}  MATCH`);
      checksOk++;
    } else {
      console.log(`   ${typed.padEnd(25)} typed=${typedCount}  jsonb=${jsonbCount}  diff=${diff} (${pct}%)`);
      if (diff <= 5 || parseFloat(pct) < 5) {
        checksOk++;  // Small difference is acceptable
      }
    }
  }

  if (checksRun === 0) {
    warn('Cross-table consistency', 'No overlapping typed/JSONB tables found to compare');
  } else if (checksOk === checksRun) {
    pass('Cross-table consistency', `${checksOk}/${checksRun} cross-checks within tolerance`);
  } else {
    warn('Cross-table consistency', `${checksOk}/${checksRun} cross-checks passed — review diffs above`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SUMMARY REPORT
// ─────────────────────────────────────────────────────────────────────────────

function printSummary() {
  console.log('\n');
  printLine('=', 60);
  console.log(' PHASE 5 MIGRATION VALIDATION REPORT');
  printLine('=', 60);

  for (const check of results.checks) {
    const icon = check.status === 'PASS' ? '[PASS]'
               : check.status === 'FAIL' ? '[FAIL]'
               : '[WARN]';
    console.log(`  ${icon}  ${check.name}`);
    if (check.detail) {
      console.log(`         ${check.detail}`);
    }
  }

  printLine('-', 60);
  console.log(`  Passed: ${results.passed}   Failed: ${results.failed}   Warnings: ${results.warned}`);
  printLine('=', 60);

  if (results.failed > 0) {
    console.log('\n  RESULT: FAIL -- One or more checks did not pass.\n');
    return 1;
  } else if (results.warned > 0) {
    console.log('\n  RESULT: PASS (with warnings) -- Review warnings above.\n');
    return 0;
  } else {
    console.log('\n  RESULT: PASS -- All checks passed.\n');
    return 0;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const pool = new Pool({
    host:     CONFIG.PG_HOST,
    port:     Number(CONFIG.PG_PORT),
    database: CONFIG.PG_DATABASE,
    user:     CONFIG.PG_USER,
    password: CONFIG.PG_PASSWORD,
    ssl:      false,
  });

  console.log('='.repeat(60));
  console.log(' LMDR: Phase 5 Migration Validation');
  console.log('='.repeat(60));
  console.log(` Host:     ${CONFIG.PG_HOST}:${CONFIG.PG_PORT}`);
  console.log(` Database: ${CONFIG.PG_DATABASE}`);
  console.log(` User:     ${CONFIG.PG_USER}`);

  // Test connection
  try {
    await pool.query('SELECT 1');
    console.log(' Connection: OK');
  } catch (err) {
    console.error(`\n  FATAL: Cannot connect to Postgres — ${err.message}`);
    console.error('  Ensure Cloud SQL Auth Proxy is running on 127.0.0.1:5432\n');
    process.exit(1);
  }

  const client = await pool.connect();

  try {
    await checkJsonbTables(client);
    await checkTypedTables(client);
    await checkIdMapping(client);
    await checkDataIntegrity(client);
    await checkOrphanedRecords(client);
    await checkCrossTableConsistency(client);
  } finally {
    client.release();
    await pool.end();
  }

  const exitCode = printSummary();
  process.exit(exitCode);
}

main().catch(err => {
  console.error(`\n  FATAL: ${err.message}\n`);
  process.exit(1);
});
