# Bridge Inventory — DriverOS Convergence

**Track:** `driver_os_convergence_20260302`
**Last Updated:** 2026-03-02 (Wave 1 audit complete)

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| wired | Fully wired: view sends, page code handles, backend returns data |
| stub | Case exists in page code but returns hardcoded/empty data |
| missing | No handler in page code for this action |
| partial | Handler exists but incomplete (e.g., missing error handling) |
| type-key | Uses `type` protocol instead of `action` — needs migration |
| legacy | Wired on OLD page code (AI-MATCHING), needs porting to DRIVER_OS |

---

## Current Bridge Files (Pre-Convergence Audit)

| # | Bridge File | Actual Protocol | Outbound Actions | Inbound Actions | Backed By Page Code |
|---|-------------|----------------|-----------------|-----------------|---------------------|
| 1 | `js/ai-matching-bridge.js` | type-key wrapped (`{type:'carrierMatching',action,data}`) | 24 | 26 | `AI - MATCHING.rof4w.js` (facade) |
| 2 | `js/driver-dashboard-bridge.js` | **type-key** | 20 | 10 | Unknown (no page code found) |
| 3 | `js/driver-my-career-bridge.js` | **type-key** | 4 | 3 | Unknown |
| 4 | `js/document-upload-bridge.js` | **type-key** | 3 | 4 | Unknown |
| 5 | `js/surveys-bridge.js` | **action-key** | 3 | 4 | Unknown |
| 6 | `js/road-utilities-bridge.js` | **type-key** | 17 | generic | Unknown |
| 7 | `js/driver-announcements-bridge.js` | **type-key** | 4 | none (outbound only) | Unknown |
| 8 | `js/driver-policies-bridge.js` | **type-key** | 4 | none (outbound only) | Unknown |
| 9 | `js/retention-bridge.js` | **type-key** | 2 | 1 | Unknown |
| 10 | `js/ai-matching-agent.js` | **action-key** | 2 | 5 | `AI - MATCHING.rof4w.js` |
| 11 | `js/ai-matching-contract.js` | N/A (registry) | N/A | N/A | N/A |

**Total existing bridge actions: ~88 outbound + ~53 inbound**
**Protocol breakdown: 7 type-key, 2 action-key, 1 hybrid, 1 registry**

---

## Existing Page Code Status

| Page Code | Lines | Protocol | Actions | Import Pattern | Status |
|-----------|-------|----------|---------|----------------|--------|
| `AI - MATCHING.rof4w.js` | ~1770 | action-key | 24 in, 26 out | Single facade (`aiMatchingFacade.jsw`) | Gold standard |
| `DRIVER_OS.nd0gp.js` | 10 | N/A | 0 | None | Empty stub — target |
| `TRUCK DRIVERS.gsx0g.js` | 326 | type-key | 5 in | Direct imports (5 services) | Legacy, needs migration |
| `Driver Jobs (Item).s0js1.js` | 665 | N/A | 0 in | 2 imports | One-way push only |
| `Driver Opportunities.lb0uy.js` | 10 | N/A | 0 | None | Empty stub |

---

## Backend Method Name Mismatches (Facade Must Alias)

| Plan Expected | Actual Method | Service | Facade Wrapper |
|---------------|--------------|---------|----------------|
| `findMatches` | `findMatchingDrivers` | driverMatching.jsw | `dosFindMatches → findMatchingDrivers` |
| `getCarrierDetail` | not exported | driverMatching.jsw | stub needed or use enrichCarrier |
| `applyToJob` | `submitApplication` | driverCockpitService.jsw | `dosApplyToJob → submitApplication` |
| `getMessages` | `getDriverNotifications` | driverCockpitService.jsw | `dosGetMessages → getDriverNotifications` |
| `getDocuments` | part of `getOrCreateDriverProfile` | driverProfiles.jsw | extract from profile response |
| `addLifecycleEvent` | not exported | driverLifecycleService.jsw | stub needed |
| `getPlayerState` | `getDriverProgression` | gamificationService.jsw | `dosGetPlayerState → getDriverProgression` |
| `getLeaderboard` | not exported | gamificationService.jsw | stub needed |
| `getPlayerBadges` | `getBadges` | badgeService.jsw | `dosGetPlayerBadges → getBadges` |
| `getStreakState` | `getStreakStatus` | streakService.jsw | `dosGetStreakState → getStreakStatus` |
| `recordActivity` | `recordDailyLogin` | streakService.jsw | `dosRecordActivity → recordDailyLogin` |
| `getRetentionRisk` | `calculateRiskScore` / `getCarrierRetentionDashboard` | retentionService.jsw | use appropriate method |
| `semanticSearch` | `searchDriversSemantic` / `searchCarriersSemantic` | semanticSearchService.jsw | use carrier variant |
| `getProgress` | `getAchievementProgress` | achievementService.jsw | `dosGetProgress → getAchievementProgress` |

---

## Target: Unified Action Registry (DRIVER_OS.nd0gp.js)

Contract source: `src/public/driver/os/js/driver-os-contract.js`
**Total registered: 124 inbound + 92 outbound = 216 actions**

### Lifecycle (19 actions)

| Action (Inbound) | Response (Outbound) | Source View | Status |
|---|---|---|---|
| `ping` | `pong` | shell | missing |
| `carrierMatchingReady` | `pageReady` | matching | legacy |
| `dashboardReady` | `pageReady` | dashboard | missing |
| `driverMyCareerReady` | `pageReady` | career | missing |
| `documentUploadReady` | `pageReady` | documents | missing |
| `surveysReady` | `pageReady` | surveys | missing |
| `roadUtilitiesReady` | `pageReady` | road | missing |
| `announcementsReady` | `pageReady` | announcements | missing |
| `policiesReady` | `pageReady` | policies | missing |
| `retentionReady` | `pageReady` | retention | missing |
| `gamificationReady` | `pageReady` | gamification | missing |
| `badgesReady` | `pageReady` | badges | missing |
| `challengesReady` | `pageReady` | challenges | missing |
| `forumsReady` | `pageReady` | forums | missing |
| `healthReady` | `pageReady` | health | missing |
| `petFriendlyReady` | `pageReady` | pet-friendly | missing |
| `mentorsReady` | `pageReady` | mentors | missing |
| `mentorProfileReady` | `pageReady` | mentor-profile | missing |
| `viewChanged` | N/A | all views | missing |

### Discovery & Matching (10 actions)

| Action (Inbound) | Response (Outbound) | Backend Service | Status |
|---|---|---|---|
| `findMatches` | `matchResults` | `driverMatching.findMatchingDrivers()` | legacy |
| `pollSearchJob` | `searchJobStatus` | `aiMatchingFacade.getAsyncCarrierSearchStatusForPage()` | legacy |
| `getCarrierDetail` | `enrichmentUpdate` | `aiEnrichment.enrichCarrier()` | legacy |
| `logInterest` | `interestLogged` | `aiMatchingFacade.logCarrierInterestForPage()` | legacy |
| `retryEnrichment` | `enrichmentComplete` | `aiMatchingFacade.startCarrierEnrichmentJobForPage()` | legacy |
| `getMatchExplanation` | `matchExplanation` | `matchExplanationService.getMatchExplanationForDriver()` | legacy |
| `getMutualInterest` | `mutualInterestData` | `aiMatchingFacade.getDriverMutualInterestsForPage()` | legacy |
| `getDriverApplications` | `driverApplications` | `aiMatchingFacade.getDriverApplicationsForPage()` | legacy |
| `submitApplication` | `applicationSubmitted` | `aiMatchingFacade.submitDriverApplicationForPage()` | legacy |
| `loginForApplication` | `loginSuccess`/`loginCancelled` | `wixUsers.promptLogin()` | legacy |

### Jobs (5 actions)

| Action (Inbound) | Response (Outbound) | Backend Service | Status |
|---|---|---|---|
| `searchJobs` | `jobsLoaded` | `driverCockpitService.searchJobs()` | missing |
| `getJobDetails` | `jobDetailLoaded` | `driverCockpitService.getJobDetails()` | missing |
| `applyToJob` | `applicationSubmitted` | `driverCockpitService.submitApplication()` | missing |
| `saveJob` | `jobSaved` | `driverCockpitService.saveJob()` | missing |
| `getSavedJobs` | `savedJobsLoaded` | `driverCockpitService.getSavedJobs()` | missing |

### Dashboard (10 actions)

| Action (Inbound) | Response (Outbound) | Backend Service | Status |
|---|---|---|---|
| `refreshDashboard` | `dashboardData` | `driverCockpitService.getDashboardSummary()` | missing |
| `withdrawApplication` | `withdrawSuccess` | TBD | missing |
| `sendMessage` | `messageSent` | TBD | missing |
| `getConversation` | `conversationData` | TBD | missing |
| `getNewMessages` | `newMessagesData` | TBD | missing |
| `getUnreadCount` | `unreadCountData` | TBD | missing |
| `markAsRead` | N/A | TBD | missing |
| `setDiscoverability` | `discoverabilityUpdated` | `driverProfiles.setDiscoverability()` | missing |
| `proposeTimeSlots` | N/A | TBD | missing |
| `confirmTimeSlot` | N/A | TBD | missing |

### Profile & Career (8 actions)

| Action (Inbound) | Response (Outbound) | Backend Service | Status |
|---|---|---|---|
| `getDriverProfile` | `driverProfileLoaded` | `driverProfiles.getOrCreateDriverProfile()` | legacy |
| `updateProfile` | `profileSaved` | `driverProfileService.updateDriverProfile()` | missing |
| `getProfileStrength` | `profileStrengthLoaded` | `driverProfileService.getProfileStrength()` | missing |
| `getDriverScorecard` | `scorecardLoaded` | `driverScorecardService.getDriverScorecard()` | missing |
| `getCareerTimeline` | `careerTimelineData` | `driverLifecycleService.getDriverTimeline()` | missing |
| `getActiveSurveys` | `activeSurveysData` | TBD | missing |
| `submitResignation` | `resignationResult` | TBD | missing |
| `getWhoViewedMe` | `whoViewedMeLoaded` | `driverInsightsService.getWhoViewedMe()` | missing |

### Documents (4 actions)

| Action (Inbound) | Response (Outbound) | Backend Service | Status |
|---|---|---|---|
| `requestDocumentList` | `documentList` | `driverProfiles.getOrCreateDriverProfile()` | missing |
| `uploadDocument` | `uploadResult` | `driverProfiles.updateDriverDocuments()` | missing |
| `saveProfileDocs` | `profileSaved` | `aiMatchingFacade.saveDriverDocumentsForPage()` | legacy |
| `extractDocumentOCR` | `ocrResult` | `aiMatchingFacade.extractDocumentForAutoFillForPage()` | legacy |

### Gamification (7 actions)

| Action (Inbound) | Response (Outbound) | Backend Service | Status |
|---|---|---|---|
| `getGamificationState` | `gamificationStateLoaded` | `gamificationService.getDriverProgression()` | missing |
| `getBadges` | `badgesLoaded` | `badgeService.getBadges()` | missing |
| `getChallenges` | `challengesLoaded` | `achievementService.getAchievements()` | missing |
| `getLeaderboard` | `leaderboardLoaded` | stub needed | missing |
| `getStreakState` | `streakStateLoaded` | `streakService.getStreakStatus()` | missing |
| `recordActivity` | `activityRecorded` | `streakService.recordDailyLogin()` | missing |
| `getAchievements` | `achievementsLoaded` | `achievementService.getAchievements()` | missing |

### Community (9 actions)

| Action (Inbound) | Response (Outbound) | Backend Service | Status |
|---|---|---|---|
| `getForumThreads` | `forumThreadsLoaded` | TBD (moderationService) | missing |
| `createForumThread` | `threadCreated` | TBD | missing |
| `replyToThread` | `replyPosted` | TBD | missing |
| `upvoteThread` | N/A | TBD | missing |
| `getAnnouncements` | `announcementsLoaded` | TBD | type-key → missing |
| `markAnnouncementRead` | `announcementReadMarked` | TBD | type-key → missing |
| `addAnnouncementComment` | `commentAdded` | TBD | type-key → missing |
| `getSurveys` | `surveysLoaded` | TBD | missing |
| `submitSurvey` | `surveySubmitted` | TBD | missing |

### Road & Wellness (18 actions)

| Action (Inbound) | Response (Outbound) | Backend Service | Status |
|---|---|---|---|
| `searchParking` | `parkingResults` | road utilities backend | missing |
| `searchFuel` | `fuelResults` | road utilities backend | missing |
| `searchWeighStations` | `weighStationResults` | road utilities backend | missing |
| `getWeather` | `weatherData` | road utilities backend | missing |
| `getRoadConditions` | `roadConditionsData` | road utilities backend | missing |
| `getTruckRestrictions` | `truckRestrictionsData` | road utilities backend | missing |
| `reportStationStatus` | N/A | road utilities backend | missing |
| `linkFuelCard` | N/A | road utilities backend | missing |
| `getDriverFuelCards` | `fuelCardsLoaded` | road utilities backend | missing |
| `getDriverBypassServices` | `bypassServicesLoaded` | road utilities backend | missing |
| `saveDriverBypassServices` | N/A | road utilities backend | missing |
| `submitReview` | N/A | road utilities backend | missing |
| `getReviews` | `reviewsLoaded` | road utilities backend | missing |
| `reportCondition` | N/A | road utilities backend | missing |
| `subscribeAlerts` | N/A | road utilities backend | missing |
| `getParkingDetails` | `parkingDetailsLoaded` | road utilities backend | missing |
| `getHealthResources` | `healthResourcesLoaded` | `healthService.getResourcesByCategory()` | missing |
| `submitHealthTip` | `healthTipSubmitted` | `healthService.submitTip()` | missing |

### Pet Friendly (2 actions)

| Action (Inbound) | Response (Outbound) | Backend Service | Status |
|---|---|---|---|
| `searchPetFriendly` | `petFriendlyLocationsLoaded` | `petFriendlyService.searchLocations()` | missing |
| `submitPetReview` | `petReviewSubmitted` | `petFriendlyService.submitReview()` | missing |

### Compliance (3 actions)

| Action (Inbound) | Response (Outbound) | Backend Service | Status |
|---|---|---|---|
| `getDriverPolicies` | `driverPoliciesLoaded` | TBD | type-key → missing |
| `getPolicyContent` | `policyContentLoaded` | TBD | type-key → missing |
| `acknowledgePolicy` | `policyAcknowledged` | TBD | type-key → missing |

### Mentorship (3 actions)

| Action (Inbound) | Response (Outbound) | Backend Service | Status |
|---|---|---|---|
| `getMentors` | `mentorsLoaded` | TBD | missing |
| `getMentorProfile` | `mentorProfileLoaded` | TBD | missing |
| `requestMentorSession` | `sessionRequested` | TBD | missing |

### Retention (2 actions)

| Action (Inbound) | Response (Outbound) | Backend Service | Status |
|---|---|---|---|
| `getRetentionFramework` | `retentionFrameworkLoaded` | TBD | missing |
| `submitStaffingRequest` | `staffingRequestResult` | TBD | missing |

### Financial (2 actions)

| Action (Inbound) | Response (Outbound) | Backend Service | Status |
|---|---|---|---|
| `logExpense` | `expenseLogged` | `driverFinancialService.logExpense()` | missing |
| `getExpenseSummary` | `expenseSummaryLoaded` | `driverFinancialService.getExpenseSummary()` | missing |

### Agent + Voice (6 actions)

| Action (Inbound) | Response (Outbound) | Backend Service | Status |
|---|---|---|---|
| `agentMessage` | `agentResponse` | `agentService.handleAgentTurn('driver')` | legacy |
| `resolveApprovalGate` | `agentResponse` | `agentService.resumeAfterApproval()` | legacy |
| `getVoiceConfig` | `voiceReady` | `voiceService.getVoiceConfig()` | legacy |
| `startVoiceCall` | N/A | client-side VAPI SDK | legacy |
| `endVoiceCall` | N/A | client-side VAPI SDK | legacy |
| `getAgentMemory` | `agentMemoryLoaded` | `agentConversationService.getRecentContext()` | missing |

### Intelligence (3 actions)

| Action (Inbound) | Response (Outbound) | Backend Service | Status |
|---|---|---|---|
| `getMarketSignals` | `marketSignalsLoaded` | `marketSignalsService.getMarketContext()` | missing |
| `getProactiveInsights` | `proactiveInsightsLoaded` | `agentService.handleAgentTurn('driver', ..., proactive)` | missing |
| `dismissNBAChip` | N/A | client-side sessionStorage | missing |

### Auth & Navigation (12 actions)

| Action (Inbound) | Response (Outbound) | Backend Service | Status |
|---|---|---|---|
| `navigateToSignup` | `loginSuccess`/`loginCancelled` | `wixUsers.promptLogin()` | legacy |
| `navigateToLogin` | `loginSuccess`/`loginCancelled` | `wixUsers.promptLogin()` | legacy |
| `checkUserStatus` | `userStatusUpdate` | local user check | legacy |
| `navigate` | N/A | `wixLocation.to()` | missing |
| `navigateToMatching` | N/A | view switch | missing |
| `navigateToProfile` | N/A | view switch | missing |
| `navigateToForums` | N/A | view switch | missing |
| `navigateToMentorship` | N/A | view switch | missing |
| `navigateToPetFriendly` | N/A | view switch | missing |
| `navigateToHealth` | N/A | view switch | missing |
| `navigateToMyCareer` | N/A | view switch | missing |
| `navigateToSavedCarriers` | N/A | view switch | missing |

### Tracking (1 action)

| Action (Inbound) | Response (Outbound) | Backend Service | Status |
|---|---|---|---|
| `logFeatureInteraction` | N/A | non-blocking analytics | legacy |

---

## Summary

| Category | Actions | Legacy | Missing | Type-Key |
|----------|---------|--------|---------|----------|
| Lifecycle | 19 | 1 | 18 | 0 |
| Discovery & Matching | 10 | 10 | 0 | 0 |
| Jobs | 5 | 0 | 5 | 0 |
| Dashboard | 10 | 0 | 10 | 0 |
| Profile & Career | 8 | 1 | 7 | 0 |
| Documents | 4 | 2 | 2 | 0 |
| Gamification | 7 | 0 | 7 | 0 |
| Community | 9 | 0 | 6 | 3 |
| Road & Wellness | 18 | 0 | 18 | 0 |
| Pet Friendly | 2 | 0 | 2 | 0 |
| Compliance | 3 | 0 | 0 | 3 |
| Mentorship | 3 | 0 | 3 | 0 |
| Retention | 2 | 0 | 2 | 0 |
| Financial | 2 | 0 | 2 | 0 |
| Agent + Voice | 6 | 5 | 1 | 0 |
| Intelligence | 3 | 0 | 3 | 0 |
| Auth & Navigation | 12 | 4 | 8 | 0 |
| Tracking | 1 | 1 | 0 | 0 |
| **Total** | **124** | **24** | **94** | **6** |

**Current wiring rate: 0% on DRIVER_OS.nd0gp.js** (24 actions exist on legacy AI-MATCHING page code, 6 need type→action migration)

**Contract coverage: 124 inbound + 92 outbound = 216 actions registered in `driver-os-contract.js`**
