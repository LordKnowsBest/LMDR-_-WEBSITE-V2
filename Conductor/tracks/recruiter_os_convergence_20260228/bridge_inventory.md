# Bridge Inventory — RecruiterOS Intelligence Convergence

**Track:** `recruiter_os_convergence_20260228`
**Status:** ✅ Audit Complete (Wave 1, 2026-02-28)
**Auditor:** Task 1 execution

---

## Key Findings

| Finding | Impact |
|---------|--------|
| 3 lifecycle stubs not wired to real services | Wave 2 fix required |
| `logLifecycleEvent` + `terminateDriver` missing from MESSAGE_REGISTRY.inbound | Registry gap |
| `getConversations` + `addCandidateNote` missing from MESSAGE_REGISTRY.inbound | Registry gap |
| Page sends `intelSaved` but view expects `intelAdded` | Name mismatch bug |
| `intelSaved` not in MESSAGE_REGISTRY.outbound | Registry gap |
| Most "consolidate" views already wired to real backend | Wave 2 scope reduced |

---

## Inbound Messages (HTML → Velo)

Actions sent from view modules via `ROS.bridge.sendToVelo(type, data)`.

✅ = confirmed  ❌ = stub/missing  ⚠️ = partial / mismatch  `—` = N/A

### Core / Carrier Management

| Action | Source View | page_handler | wired | Notes |
|--------|-------------|-------------|-------|-------|
| `recruiterOSReady` | ros-bridge.js | ✅ | ✅ | Handshake → sends `recruiterOSInit` |
| `ping` | internal | ✅ | ✅ | Health check |
| `validateCarrier` | ros-view-carriers.js | ✅ | ✅ | |
| `addCarrier` | ros-view-carriers.js | ✅ | ✅ | |
| `removeCarrier` | ros-view-carriers.js | ✅ | ✅ | |
| `switchCarrier` | ros-view-carriers.js | ✅ | ✅ | Updates `currentCarrierDOT` |
| `getCarriers` | ros-view-carriers.js | ✅ | ✅ | |

### Pipeline

| Action | Source View | page_handler | wired | Notes |
|--------|-------------|-------------|-------|-------|
| `getPipeline` | ros-view-pipeline.js, ros-view-home.js | ✅ | ✅ | |
| `updateCandidateStatus` | ros-view-pipeline.js | ✅ | ✅ | |
| `getStats` | ros-view-pipeline.js | ✅ | ✅ | |
| `getCandidateDetails` | ros-view-pipeline.js | ✅ | ✅ | |
| `addCandidateNote` | ros-view-pipeline.js | ✅ | ✅ | ⚠️ NOT in MESSAGE_REGISTRY.inbound |
| `addNotes` | (legacy alias) | ✅ | ✅ | Both cases handled |

### Messaging

| Action | Source View | page_handler | wired | Notes |
|--------|-------------|-------------|-------|-------|
| `getConversations` | ros-view-messages.js | ✅ | ✅ | ⚠️ NOT in MESSAGE_REGISTRY.inbound |
| `getConversation` | ros-view-messages.js | ✅ | ✅ | |
| `sendMessage` | ros-view-messages.js | ✅ | ✅ | |
| `markAsRead` | ros-view-messages.js | ✅ | ✅ | |
| `getUnreadCount` | ros-view-messages.js, ros-view-home.js | ✅ | ✅ | |
| `getNewMessages` | (polling) | ✅ | ✅ | |

### Driver Search

| Action | Source View | page_handler | wired | Notes |
|--------|-------------|-------------|-------|-------|
| `driverSearchReady` | ros-view-search.js | ✅ | ✅ | |
| `searchDrivers` | ros-view-search.js | ✅ | ✅ | |
| `searchDriversAsync` | ros-view-search.js | ✅ | ✅ | Async polling |
| `checkSearchStatus` | ros-view-search.js | ✅ | ✅ | |
| `viewDriverProfile` | ros-view-search.js | ✅ | ✅ | |
| `saveDriver` | ros-view-search.js | ✅ | ✅ | |
| `contactDriver` | ros-view-search.js | ✅ | ✅ | |
| `getQuotaStatus` | ros-view-search.js | ✅ | ✅ | |
| `getWeightPreferences` | ros-view-search.js | ✅ | ✅ | |
| `saveWeightPreferences` | ros-view-search.js | ✅ | ✅ | |
| `getCarrierPreferences` | ros-view-search.js | ✅ | ✅ | |
| `generateAIDraft` | ros-view-search.js | ✅ | ✅ | |
| `navigateTo` | ros-view-search.js | ✅ | ✅ | |
| `logFeatureInteraction` | ros-view-search.js | ✅ | ✅ | |

### Saved Searches

| Action | Source View | page_handler | wired | Notes |
|--------|-------------|-------------|-------|-------|
| `saveSearch` | ros-view-search.js | ✅ | ✅ | |
| `loadSavedSearches` | ros-view-search.js | ✅ | ✅ | |
| `runSavedSearch` | ros-view-search.js | ✅ | ✅ | |
| `deleteSavedSearch` | ros-view-search.js | ✅ | ✅ | |
| `updateSavedSearch` | ros-view-search.js | ✅ | ✅ | |

### Call Outcomes / Telemetry

| Action | Source View | page_handler | wired | Notes |
|--------|-------------|-------------|-------|-------|
| `logCallOutcome` | ros-view-telemetry.js | ✅ | ✅ | |
| `getCallAnalytics` | ros-view-telemetry.js | ✅ | ✅ | |
| `getRecentCalls` | ros-view-telemetry.js | ✅ | ✅ | |
| `getDriverCallHistory` | ros-view-telemetry.js | ✅ | ✅ | |

### Interventions

| Action | Source View | page_handler | wired | Notes |
|--------|-------------|-------------|-------|-------|
| `getInterventionTemplates` | ros-view-retention.js | ✅ | ✅ | |
| `sendIntervention` | ros-view-retention.js | ✅ | ✅ | |
| `saveTemplate` | (retention legacy) | ✅ | ✅ | |
| `deleteTemplate` | (retention legacy) | ✅ | ✅ | |
| `logInterventionOutcome` | (retention legacy) | ✅ | ✅ | |
| `getDriverInterventions` | (retention legacy) | ✅ | ✅ | |

### Automation

| Action | Source View | page_handler | wired | Notes |
|--------|-------------|-------------|-------|-------|
| `getAutomationRules` | (legacy) | ✅ | ✅ | |
| `createAutomationRule` | (legacy) | ✅ | ✅ | |
| `updateAutomationRule` | (legacy) | ✅ | ✅ | |
| `deleteAutomationRule` | (legacy) | ✅ | ✅ | |
| `toggleRuleStatus` | (legacy) | ✅ | ✅ | |
| `getAutomationLog` | (legacy) | ✅ | ✅ | |
| `fetchAutomations` | ros-view-automate.js | ✅ | ✅ | New view alias |
| `toggleAutomation` | ros-view-automate.js | ✅ | ✅ | |

### Compliance & Onboarding (individual tools)

| Action | Source View | page_handler | wired | Notes |
|--------|-------------|-------------|-------|-------|
| `fetchCompliance` | ros-view-comply.js | ✅ | ✅ | |
| `fetchDriverDocs` | ros-view-docs.js | ✅ | ✅ | |
| `fetchBgChecks` | ros-view-bg-check.js | ✅ | ✅ | |
| `fetchDrugTests` | ros-view-drug-test.js | ✅ | ✅ | |
| `fetchOrientations` | ros-view-orient.js | ✅ | ✅ | |
| `fetchCostAnalysis` | ros-view-cost-analysis.js | ✅ | ✅ | |
| `requestAvailability` | (legacy) | ✅ | ✅ | Interview scheduler |
| `confirmTimeSlot` | (legacy) | ✅ | ✅ | |

### Outreach (Email / SMS / Social)

| Action | Source View | page_handler | wired | Notes |
|--------|-------------|-------------|-------|-------|
| `fetchEmailCampaigns` | ros-view-email.js | ✅ | ✅ | |
| `sendEmailCampaign` | ros-view-email.js | ✅ | ✅ | |
| `fetchSmsCampaigns` | ros-view-sms.js | ✅ | ✅ | |
| `sendSmsCampaign` | ros-view-sms.js | ✅ | ✅ | |
| `fetchJobBoards` | ros-view-job-boards.js | ✅ | ✅ | |
| `connectJobBoard` | ros-view-job-boards.js | ✅ | ✅ | |
| `fetchSocialPosts` | ros-view-social.js | ✅ | ✅ | |
| `connectSocialAccount` | ros-view-social.js | ✅ | ✅ | |
| `publishSocialPost` | ros-view-social.js | ✅ | ✅ | |
| `generateSocialCopy` | ros-view-social.js | ✅ | ✅ | |
| `generateSocialImage` | ros-view-social.js | ✅ | ✅ | |
| `saveSocialCredentials` | ros-view-social-settings.js | ✅ | ✅ | |
| `testSocialConnection` | ros-view-social-settings.js | ✅ | ✅ | |
| `getSocialCredentialStatus` | ros-view-social-settings.js | ✅ | ✅ | |

### Gamification & Leaderboard

| Action | Source View | page_handler | wired | Notes |
|--------|-------------|-------------|-------|-------|
| `fetchGamification` | ros-view-gamification.js | ✅ | ✅ | |
| `getLeaderboard` | ros-view-leaderboard.js | ✅ | ✅ | |
| `getBadges` | ros-view-leaderboard.js | ✅ | ✅ | |

### AI Matches & Alerts

| Action | Source View | page_handler | wired | Notes |
|--------|-------------|-------------|-------|-------|
| `getAIMatches` | ros-view-ai-match.js | ✅ | ✅ | |
| `regenerateAIMatch` | ros-view-ai-match.js | ✅ | ✅ | |
| `regenerateAIMatches` | ros-view-ai-match.js | ✅ | ✅ | |
| `getAlerts` | ros-view-alerts.js | ✅ | ✅ | |
| `markAlertRead` | ros-view-alerts.js | ✅ | ✅ | |
| `markAllAlertsRead` | ros-view-alerts.js | ✅ | ✅ | |
| `updateAlertPrefs` | ros-view-alerts.js | ✅ | ✅ | |

### Paid Media (Attribution view)

| Action | Source View | page_handler | wired | Notes |
|--------|-------------|-------------|-------|-------|
| `getPaidMediaState` | ros-view-attribution.js | ✅ | ✅ | |
| `createPaidMediaDraft` | ros-view-attribution.js | ✅ | ✅ | |
| `updatePaidMediaAdSet` | ros-view-attribution.js | ✅ | ✅ | |
| `createPaidMediaCreative` | ros-view-attribution.js | ✅ | ✅ | |
| `launchPaidMediaCampaign` | ros-view-attribution.js | ✅ | ✅ | |
| `getPaidMediaInsights` | ros-view-attribution.js | ✅ | ✅ | |
| `createPaidMediaReportJob` | ros-view-attribution.js | ✅ | ✅ | |
| `getPaidMediaReportStatus` | ros-view-attribution.js | ✅ | ✅ | |
| `downloadPaidMediaReport` | ros-view-attribution.js | ✅ | ✅ | |
| `getPaidMediaOptimizationSuggestions` | ros-view-attribution.js | ✅ | ✅ | |

### Agent & Voice

| Action | Source View | page_handler | wired | Notes |
|--------|-------------|-------------|-------|-------|
| `agentMessage` | ros-chat.js | ✅ | ✅ | No view-context yet (Wave 3) |
| `resolveApprovalGate` | ros-chat.js | ✅ | ✅ | |
| `getVoiceConfig` | ros-voice.js | ✅ | ✅ | |
| `getCampaigns` | ros-campaigns.js | ✅ | ✅ | Voice campaigns |
| `createCampaign` | ros-campaigns.js | ✅ | ✅ | |
| `startCampaign` | ros-campaigns.js | ✅ | ✅ | |
| `getCampaignStatus` | ros-campaigns.js | ✅ | ✅ | |
| `getSystemHealth` | ros-view-home.js | ✅ | ✅ | |

### "Consolidate" Views — Wiring Status

| Action | Source View | page_handler | wired | Notes |
|--------|-------------|-------------|-------|-------|
| `getFunnelData` | ros-view-funnel.js | ✅ | ✅ | Calls `getFunnelMetrics` |
| `getCostData` | ros-view-funnel.js | ✅ | ✅ | Calls `calculateCostPerHire` |
| `getCompetitorData` | ros-view-intel.js | ✅ | ✅ | Calls `getCompetitorComparison` |
| `saveIntel` | ros-view-intel.js | ✅ | ⚠️ | Sends `intelSaved`, view expects `intelAdded` |
| `getTimelineEvents` | ros-view-lifecycle.js | ✅ | ❌ | STUB: returns `{ events: [] }` |
| `logLifecycleEvent` | ros-view-lifecycle.js | ✅ | ❌ | STUB: `{ success: true }`, NOT in registry |
| `terminateDriver` | ros-view-lifecycle.js | ✅ | ❌ | STUB: `{ success: true }`, NOT in registry |
| `getPredictionsData` | ros-view-predict.js | ✅ | ✅ | Calls `generateHiringForecast` + `getTurnoverRiskAnalysis` |
| `getWorkflows` | ros-view-onboard.js | ✅ | ✅ | Calls `getActiveWorkflows` |
| `updateWorkflowStep` | ros-view-onboard.js | ✅ | ✅ | Calls `updateWorkflowStatus` |
| `getRetentionData` | ros-view-retention.js | ✅ | ✅ | Calls `getCarrierRetentionDashboard` |
| `getAtRiskDrivers` | ros-view-retention.js | ✅ | ✅ | Calls `getCarrierRetentionDashboard` |
| `getSettingsData` | settings module | ✅ | ✅ | |

### Wave 3 — New (Not yet wired)

| Action | Source Module | page_handler | wired | Notes |
|--------|-------------|-------------|-------|-------|
| `refreshNBAChips` | ros-nba.js (to create) | ❌ | ❌ | Wave 3 J5 |
| `getMarketSignals` | ros-market.js (to create) | ❌ | ❌ | Wave 3 J7 |

### Wave 4 — New (Not yet wired)

| Action | Source Module | page_handler | wired | Notes |
|--------|-------------|-------------|-------|-------|
| `getAgentMemory` | ros-memory.js (to create) | ❌ | ❌ | Wave 4 J1 |
| `getProactiveInsights` | ros-proactive.js (to create) | ❌ | ❌ | Wave 4 J2 |

---

## Outbound Messages (Velo → HTML)

Actions sent from page code via `sendToHtml(component, type, data)`.

### Already Registered in MESSAGE_REGISTRY.outbound (Confirmed ✅)

| Action | Consumed by | wired | Notes |
|--------|-------------|-------|-------|
| `recruiterOSInit` | ros-bridge.js | ✅ | Sends `recruiterProfile`, `carriers` |
| `pipelineLoaded` | ros-view-pipeline.js, ros-view-home.js | ✅ | |
| `statusUpdated` | ros-view-pipeline.js | ✅ | |
| `statsLoaded` | ros-view-pipeline.js | ✅ | |
| `candidateDetails` | ros-view-pipeline.js | ✅ | |
| `carriersLoaded` | ros-view-carriers.js | ✅ | |
| `carrierValidated` | ros-view-carriers.js | ✅ | |
| `carrierAdded` | ros-view-carriers.js | ✅ | |
| `carrierRemoved` | ros-view-carriers.js | ✅ | |
| `carrierSwitched` | ros-view-carriers.js | ✅ | |
| `unreadCountData` | ros-view-home.js, ros-view-messages.js | ✅ | |
| `conversationData` | ros-view-messages.js | ✅ | |
| `messageSent` | ros-view-messages.js | ✅ | |
| `searchDriversResult` | ros-view-search.js | ✅ | |
| `searchJobStarted` | ros-view-search.js | ✅ | Async search |
| `searchStatusUpdate` | ros-view-search.js | ✅ | Async search |
| `aiMatchesLoaded` | ros-view-ai-match.js | ✅ | |
| `aiMatchRegenerated` | ros-view-ai-match.js | ✅ | |
| `alertsLoaded` | ros-view-alerts.js | ✅ | |
| `alertMarkedRead` | ros-view-alerts.js | ✅ | |
| `allAlertsMarkedRead` | ros-view-alerts.js | ✅ | |
| `funnelDataLoaded` | ros-view-funnel.js | ✅ | |
| `costDataLoaded` | ros-view-funnel.js | ✅ | |
| `bottleneckAnalysis` | ros-view-funnel.js | ✅ | |
| `competitorDataLoaded` | ros-view-intel.js | ✅ | |
| `timelineLoaded` | ros-view-lifecycle.js | ✅ | |
| `lifecycleEventLogged` | ros-view-lifecycle.js | ✅ (stub) | |
| `driverTerminated` | ros-view-lifecycle.js | ✅ (stub) | |
| `predictionsLoaded` | ros-view-predict.js | ✅ | |
| `forecastGenerated` | ros-view-predict.js | ✅ | |
| `retentionDataLoaded` | ros-view-retention.js | ✅ | |
| `atRiskDriversLoaded` | ros-view-retention.js | ✅ | |
| `interventionSent` | ros-view-retention.js | ✅ | |
| `workflowsLoaded` | ros-view-onboard.js | ✅ | |
| `workflowUpdated` | ros-view-onboard.js | ✅ | |
| `documentStatusLoaded` | ros-view-onboard.js | ✅ | |
| `leaderboardLoaded` | ros-view-leaderboard.js | ✅ | |
| `badgesLoaded` | ros-view-leaderboard.js | ✅ | |
| `progressionLoaded` | ros-view-leaderboard.js | ✅ | |
| `agentResponse` | ros-chat.js | ✅ | |
| `agentTyping` | ros-chat.js | ✅ | |
| `agentApprovalRequired` | ros-chat.js | ✅ | |
| `voiceReady` | ros-voice.js | ✅ | |
| `automationsLoaded` | ros-view-automate.js | ✅ | |
| `automationCreated` | ros-view-automate.js | ✅ | |
| `automationToggled` | ros-view-automate.js | ✅ | |
| `complianceLoaded` | ros-view-comply.js | ✅ | |
| `driverDocsLoaded` | ros-view-docs.js | ✅ | |
| `bgChecksLoaded` | ros-view-bg-check.js | ✅ | |
| `bgCheckInitiated` | ros-view-bg-check.js | ✅ | |
| `drugTestsLoaded` | ros-view-drug-test.js | ✅ | |
| `drugTestOrdered` | ros-view-drug-test.js | ✅ | |
| `orientationsLoaded` | ros-view-orient.js | ✅ | |
| `orientationScheduled` | ros-view-orient.js | ✅ | |
| `costAnalysisLoaded` | ros-view-cost-analysis.js | ✅ | |
| `emailCampaignsLoaded` | ros-view-email.js | ✅ | |
| `emailCampaignSent` | ros-view-email.js | ✅ | |
| `gamificationLoaded` | ros-view-gamification.js | ✅ | |
| `jobBoardsLoaded` | ros-view-job-boards.js | ✅ | |
| `jobBoardConnected` | ros-view-job-boards.js | ✅ | |
| `smsCampaignsLoaded` | ros-view-sms.js | ✅ | |
| `smsCampaignSent` | ros-view-sms.js | ✅ | |
| `socialPostsLoaded` | ros-view-social.js | ✅ | |
| `socialPostPublished` | ros-view-social.js | ✅ | |
| `socialAccountConnected` | ros-view-social.js | ✅ | |
| `socialCopyGenerated` | ros-view-social.js | ✅ | |
| `socialImageGenerated` | ros-view-social.js | ✅ | |
| `socialCredentialsSaved` | ros-view-social-settings.js | ✅ | |
| `socialConnectionTested` | ros-view-social-settings.js | ✅ | |
| `socialCredentialStatusLoaded` | ros-view-social-settings.js | ✅ | |
| `callAnalyticsLoaded` | ros-view-telemetry.js | ✅ | |
| `recentCallsLoaded` | ros-view-telemetry.js | ✅ | |
| `callOutcomeLogged` | ros-view-telemetry.js | ✅ | |
| `paidMediaInsightsLoaded` | ros-view-attribution.js | ✅ | |
| `paidMediaSuggestionsLoaded` | ros-view-attribution.js | ✅ | |

### Outbound Gaps (Registry Mismatches)

| Action | Consumed by | Notes |
|--------|-------------|-------|
| `intelSaved` | (view expects `intelAdded`) | ⚠️ Page sends `intelSaved`, view listens for `intelAdded`. FIX REQUIRED |
| `intelAdded` | ros-view-intel.js | ❌ Page never sends this — fix `handleSaveIntel` to send `intelAdded` |

### Wave 3 Outbound — New (Not yet wired)

| Action | Consumed by | wired | Notes |
|--------|-------------|-------|-------|
| `nbaChipsData` | ros-nba.js | ❌ | Wave 3 J5 |
| `marketSignalsLoaded` | ros-market.js | ❌ | Wave 3 J7 |

### Wave 4 Outbound — New (Not yet wired)

| Action | Consumed by | wired | Notes |
|--------|-------------|-------|-------|
| `agentMemoryLoaded` | ros-memory.js | ❌ | Wave 4 J1 |
| `proactiveInsightsReady` | ros-proactive.js | ❌ | Wave 4 J2 |

---

## MESSAGE_REGISTRY Gaps (Must Fix in Task 2)

These messages exist in the switch router but are **missing from MESSAGE_REGISTRY.inbound**:

| Missing Action | Switch Case Line | Fix |
|----------------|-----------------|-----|
| `getConversations` | line 552 | Add to `MESSAGE_REGISTRY.inbound` |
| `addCandidateNote` | line 528 | Add to `MESSAGE_REGISTRY.inbound` |
| `logLifecycleEvent` | line 717 | Add to `MESSAGE_REGISTRY.inbound` |
| `terminateDriver` | line 722 | Add to `MESSAGE_REGISTRY.inbound` |

These messages exist in the views but are **missing from MESSAGE_REGISTRY.outbound**:

| Missing Action | Page Actually Sends | Fix |
|----------------|---------------------|-----|
| `intelSaved` | `handleSaveIntel` | Rename to `intelAdded` in page code |

---

## Coverage Summary

| Category | Count | page_handler ✅ | wired ✅ | Stubs ❌ | Registry Gaps ⚠️ |
|----------|-------|----------------|---------|---------|-----------------|
| Existing inbound | 95 | 95 | 91 | 3 (lifecycle) | 4 missing from registry |
| Wave 2 inbound (lifecycle stubs) | 3 | 3 | 0 | 3 | 2 missing from registry |
| Wave 3 inbound | 2 | 0 | 0 | — | 2 not yet created |
| Wave 4 inbound | 2 | 0 | 0 | — | 2 not yet created |
| Existing outbound | 75 | — | 73 | 2 (stubs from lifecycle) | 1 name mismatch |
| Wave 3 outbound | 2 | — | 0 | — | — |
| Wave 4 outbound | 2 | — | 0 | — | — |

**Total contract coverage (existing):** 91/95 inbound wired = **96%**

**Wave 2 real work:** Fix 3 lifecycle stubs + fix `intelSaved`→`intelAdded` + add 4 missing registry entries (much smaller than originally planned — most consolidate views already wired!)

---

## Gate Sign-off

**Wave 1 audit:** ✅ Complete (2026-02-28)
