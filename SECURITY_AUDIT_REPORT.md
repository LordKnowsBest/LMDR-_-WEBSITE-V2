# Security Audit Report: Permissions & CORS Policy

## 1. Executive Summary

This audit examined the access control configuration (`src/backend/permissions.json`) and Cross-Origin Resource Sharing (CORS) settings (`src/backend/apiGateway.jsw`) of the LMDR platform.

**Critical Findings:**
*   **Global Permissions Wildcard:** The `permissions.json` file contains a global wildcard that grants `Anonymous` access to **all** backend web methods. This exposes sensitive administrative and internal functions to the public internet.
*   **Permissive CORS Policy:** The API Gateway is configured with `Access-Control-Allow-Origin: *`, allowing any website to make requests to the API.

## 2. CORS Policy Audit (`src/backend/apiGateway.jsw`)

| Setting | Current Value | Status | Recommendation |
| :--- | :--- | :--- | :--- |
| **Access-Control-Allow-Origin** | `*` | 🔴 **High Risk** | Restrict to known domains (e.g., `https://www.lastmiledr.app`) or implement dynamic origin checking. |
| **Access-Control-Allow-Methods** | `GET,POST,DELETE,OPTIONS` | 🟢 Acceptable | Keep as is, unless `PUT`/`PATCH` are needed. |
| **Access-Control-Allow-Headers** | `Authorization, Content-Type` | 🟡 Medium Risk | Add `x-lmdr-bypass-rate-limit` if used by client. Ensure sensitive headers are not inadvertently allowed. |
| **Access-Control-Max-Age** | *Missing* (Defaults to 5s) | ⚪ Low Risk | Add explicit caching (e.g., `86400` for 24h) to reduce preflight requests, or keep low for security agility. |

## 3. Permissions Audit (`src/backend/permissions.json`)

**Current State:**
```json
{
  "web-methods": {
    "*": {
      "*": {
        "siteOwner": { "invoke": true },
        "siteMember": { "invoke": true },
        "anonymous": { "invoke": true }
      }
    }
  }
}
```
**Impact:** Every exported function in `src/backend/*.jsw` is publicly callable by anyone.

### Detailed Web Method Analysis & Recommendations

The following table categorizes all identified web modules and recommends a "Least Privilege" access level.

**Legend:**
*   🔴 **High Sensitivity (ADMIN)**: Financial, administrative, setup, or data-seeding functions. Must be restricted to Site Owner/Admin.
*   🟡 **Medium Sensitivity (MEMBER)**: User-specific data, messaging, compliance. Restricted to logged-in Site Members.
*   🟢 **Low Sensitivity (ANY/PUBLIC)**: Public statistics, weather alerts, content. Safe for Anonymous access.

| Module File | Sensitivity | Recommended Access | Notes |
| :--- | :--- | :--- | :--- |
| `abandonmentEmailService.jsw` | 🟡 Medium | MEMBER | Triggers emails, should be protected. |
| `achievementService.jsw` | 🟡 Medium | MEMBER | User achievements. |
| `adminBillingService.jsw` | 🔴 **High** | **ADMIN** | Critical billing operations. |
| `adminCommissionService.jsw` | 🔴 **High** | **ADMIN** | Financial data. |
| `adminInvoiceService.jsw` | 🔴 **High** | **ADMIN** | Financial data. |
| `adminRevenueService.jsw` | 🔴 **High** | **ADMIN** | Business metrics. |
| `admin_audit_service.jsw` | 🔴 **High** | **ADMIN** | Security logs. |
| `admin_config_service.jsw` | 🔴 **High** | **ADMIN** | System configuration. |
| `admin_content_service.jsw` | 🔴 **High** | **ADMIN** | Moderation. |
| `admin_dashboard_service.jsw` | 🔴 **High** | **ADMIN** | Admin views. |
| `admin_jobs_service.jsw` | 🔴 **High** | **ADMIN** | Background jobs. |
| `admin_match_service.jsw` | 🔴 **High** | **ADMIN** | Admin views. |
| `admin_service.jsw` | 🔴 **High** | **ADMIN** | User management. |
| `aiEnrichment.jsw` | 🟡 Medium | MEMBER | Data enrichment. |
| `aiRouterService.jsw` | 🟡 Medium | MEMBER | AI service usage. |
| `airtableClient.jsw` | 🟡 Medium | MEMBER | Database interface. |
| `announcementJobs.jsw` | 🟡 Medium | MEMBER | Background job triggers. |
| `apiAuthService.jsw` | 🔴 **High** | **ADMIN** | API Key management. |
| `apiGateway.jsw` | 🔴 **High** | **ADMIN** | Internal gateway logic (not for direct client use). |
| `apiPortalService.jsw` | 🟡 Medium | MEMBER | Partner portal access. |
| `apiProductAccessService.jsw` | 🟡 Medium | MEMBER | Authorization logic. |
| `apiWebhookJobs.jsw` | 🟡 Medium | MEMBER | Webhook processing. |
| `apiWebhookService.jsw` | 🟡 Medium | MEMBER | Webhook delivery. |
| `applicationService.jsw` | 🟡 Medium | MEMBER | Job applications. |
| `b2bAIService.jsw` | 🔴 **High** | **ADMIN** | B2B Logic. |
| `b2bAccountService.jsw` | 🔴 **High** | **ADMIN** | B2B CRM. |
| `b2bActivityService.jsw` | 🔴 **High** | **ADMIN** | B2B CRM. |
| `b2bAnalyticsService.jsw` | 🔴 **High** | **ADMIN** | B2B Analytics. |
| `b2bBridgeService.jsw` | 🔴 **High** | **ADMIN** | B2B Integration. |
| `b2bContentAIService.jsw` | 🔴 **High** | **ADMIN** | B2B Content. |
| `b2bMatchSignalService.jsw` | 🔴 **High** | **ADMIN** | B2B Logic. |
| `b2bPipelineService.jsw` | 🔴 **High** | **ADMIN** | B2B CRM. |
| `b2bResearchAgentService.jsw` | 🔴 **High** | **ADMIN** | B2B Logic. |
| `b2bSecurityService.jsw` | 🔴 **High** | **ADMIN** | B2B Security. |
| `b2bSequenceService.jsw` | 🔴 **High** | **ADMIN** | B2B Automation. |
| `badgeService.jsw` | 🟡 Medium | MEMBER | Gamification. |
| `callOutcomeService.jsw` | 🟡 Medium | MEMBER | Telephony logs. |
| `capacityPlanningService.jsw` | 🟡 Medium | MEMBER | Fleet mgmt. |
| `carrierAdminService.jsw` | 🟡 Medium | MEMBER | Carrier admin (Member level for Carrier users?). |
| `carrierAnnouncementsService.jsw`| 🟡 Medium | MEMBER | Communications. |
| `carrierLeadsService.jsw` | 🟡 Medium | MEMBER | Leads. |
| `carrierMatching.jsw` | 🟡 Medium | MEMBER | Matching logic. |
| `carrierPolicyService.jsw` | 🟡 Medium | MEMBER | Compliance. |
| `carrierPreferences.jsw` | 🟡 Medium | MEMBER | Settings. |
| `carrierStatusService.jsw` | 🟡 Medium | MEMBER | Status. |
| `challengeService.jsw` | 🟡 Medium | MEMBER | Gamification. |
| `complianceBridge.jsw` | 🟡 Medium | MEMBER | Compliance. |
| `complianceCalendarService.jsw`| 🟡 Medium | MEMBER | Compliance. |
| `complianceService.jsw` | 🟡 Medium | MEMBER | Compliance. |
| `config.jsw` | 🟡 Medium | MEMBER | Configuration reading. |
| `contentService.jsw` | 🟢 **Low** | **ANY** | Blog/Content (Safe for public?). |
| `csaMonitorService.jsw` | 🟡 Medium | MEMBER | Safety data. |
| `dataAccess.jsw` | 🔴 **High** | **ADMIN** | **CRITICAL**: Direct DB access. |
| `documentCollectionService.jsw`| 🟡 Medium | MEMBER | Documents. |
| `documentVaultService.jsw` | 🟡 Medium | MEMBER | Documents. |
| `dqFileService.jsw` | 🟡 Medium | MEMBER | Compliance. |
| `driverInsightsService.jsw` | 🟡 Medium | MEMBER | Analytics. |
| `driverMatching.jsw` | 🟡 Medium | MEMBER | Matching. |
| `driverOutreach.jsw` | 🟡 Medium | MEMBER | Communications. |
| `driverProfiles.jsw` | 🟡 Medium | MEMBER | PII. |
| `driverScorecardService.jsw` | 🟡 Medium | MEMBER | Performance. |
| `eldIntegrationService.jsw` | 🟡 Medium | MEMBER | Telematics. |
| `emailService.jsw` | 🟡 Medium | MEMBER | Email sending. |
| `emailTemplateJobs.jsw` | 🟡 Medium | MEMBER | Background jobs. |
| `emailTemplateService.jsw` | 🟡 Medium | MEMBER | Templates. |
| `equipmentService.jsw` | 🟡 Medium | MEMBER | Fleet assets. |
| `experimentJobs.jsw` | 🟡 Medium | MEMBER | A/B Testing. |
| `experimentService.jsw` | 🟡 Medium | MEMBER | A/B Testing. |
| `externalCsaApi.jsw` | 🟡 Medium | MEMBER | External API. |
| `externalDocumentApi.jsw` | 🟡 Medium | MEMBER | External API. |
| `externalEngagementApi.jsw` | 🟡 Medium | MEMBER | External API. |
| `externalFmcsaApi.jsw` | 🟡 Medium | MEMBER | External API. |
| `externalFuelApi.jsw` | 🟡 Medium | MEMBER | External API. |
| `externalIntelligenceApi.jsw`| 🟡 Medium | MEMBER | External API. |
| `externalMatchingApi.jsw` | 🟡 Medium | MEMBER | External API. |
| `externalParkingApi.jsw` | 🟡 Medium | MEMBER | External API. |
| `featureAdoptionService.jsw` | 🟡 Medium | MEMBER | Analytics. |
| `feedbackLoopService.jsw` | 🟡 Medium | MEMBER | Analytics. |
| `flagJobs.jsw` | 🟡 Medium | MEMBER | Background jobs. |
| `flagService.jsw` | 🟡 Medium | MEMBER | Feature flags. |
| `fleetJobs.jsw` | 🟡 Medium | MEMBER | Background jobs. |
| `fleetService.jsw` | 🟡 Medium | MEMBER | Fleet mgmt. |
| `fmcsaService.jsw` | 🟡 Medium | MEMBER | Safety data. |
| `forumService.jsw` | 🟡 Medium | MEMBER | Community. |
| `fuelService.jsw` | 🟡 Medium | MEMBER | Fuel mgmt. |
| `gamificationAnalyticsService.jsw`| 🟡 Medium | MEMBER | Analytics. |
| `gamificationJobs.jsw` | 🟡 Medium | MEMBER | Background jobs. |
| `gamificationService.jsw` | 🟡 Medium | MEMBER | Gamification. |
| `healthService.jsw` | 🟡 Medium | MEMBER | Health resources. |
| `incidentService.jsw` | 🟡 Medium | MEMBER | Safety incidents. |
| `interventionService.jsw` | 🟡 Medium | MEMBER | Safety. |
| `interviewScheduler.jsw` | 🟡 Medium | MEMBER | Scheduling. |
| `leaderboardJobs.jsw` | 🟡 Medium | MEMBER | Background jobs. |
| `leaderboardService.jsw` | 🟡 Medium | MEMBER | Gamification. |
| `lifecycleService.jsw` | 🟡 Medium | MEMBER | Driver lifecycle. |
| `locationService.jsw` | 🟡 Medium | MEMBER | Utilities. |
| `matchExplanationService.jsw`| 🟡 Medium | MEMBER | Matching. |
| `matchNotifications.jsw` | 🟡 Medium | MEMBER | Notifications. |
| `memberService.jsw` | 🟡 Medium | MEMBER | Account. |
| `messaging.jsw` | 🟡 Medium | MEMBER | Chat. |
| `messagingRealtime.jsw` | 🟡 Medium | MEMBER | Chat. |
| `moderationService.jsw` | 🟡 Medium | MEMBER | Content moderation. |
| `mutualInterestService.jsw` | 🟡 Medium | MEMBER | Matching. |
| `notificationDispatcher.jsw` | 🟡 Medium | MEMBER | Notifications. |
| `notificationRulesService.jsw`| 🟡 Medium | MEMBER | Settings. |
| `observabilityService.jsw` | 🟡 Medium | MEMBER | Logging. |
| `ocrService.jsw` | 🟡 Medium | MEMBER | Document processing. |
| `onboardingWorkflowService.jsw`| 🟡 Medium | MEMBER | Onboarding. |
| `parkingService.jsw` | 🟡 Medium | MEMBER | Utilities. |
| `petFriendlyService.jsw` | 🟡 Medium | MEMBER | Utilities. |
| `pipelineAutomationService.jsw`| 🟡 Medium | MEMBER | Automation. |
| `promptLibraryService.jsw` | 🟡 Medium | MEMBER | AI Prompts. |
| `publicStatsService.jsw` | 🟢 **Low** | **ANY** | Public stats. |
| `rateLimitService.jsw` | 🟡 Medium | MEMBER | Internal utility. |
| `recruiterAnalyticsService.jsw`| 🟡 Medium | MEMBER | Analytics. |
| `recruiterHealthService.jsw` | 🟡 Medium | MEMBER | Account health. |
| `recruiterStats.jsw` | 🟡 Medium | MEMBER | Analytics. |
| `recruiter_service.jsw` | 🟡 Medium | MEMBER | Recruiter profile. |
| `referralService.jsw` | 🟡 Medium | MEMBER | Referrals. |
| `reputationService.jsw` | 🟡 Medium | MEMBER | Gamification. |
| `restStopService.jsw` | 🟡 Medium | MEMBER | Utilities. |
| `retentionService.jsw` | 🟡 Medium | MEMBER | Analytics. |
| `roadConditionService.jsw` | 🟡 Medium | MEMBER | Utilities. |
| `savedSearchService.jsw` | 🟡 Medium | MEMBER | User settings. |
| `scheduler.jsw` | 🟡 Medium | MEMBER | Background jobs. |
| `seasonalEventService.jsw` | 🟡 Medium | MEMBER | Gamification. |
| `seedPetFriendly.jsw` | 🔴 **High** | **ADMIN** | Data seeding. |
| `setupCollections.jsw` | 🔴 **High** | **ADMIN** | **CRITICAL**: Setup/Nuke DB. |
| `setupOnboardingCollections.jsw`| 🔴 **High** | **ADMIN** | **CRITICAL**: Setup/Nuke DB. |
| `socialScanner.jsw` | 🟡 Medium | MEMBER | External API. |
| `streakNotifications.jsw` | 🟡 Medium | MEMBER | Notifications. |
| `streakService.jsw` | 🟡 Medium | MEMBER | Gamification. |
| `stripeService.jsw` | 🔴 **High** | **ADMIN** | **CRITICAL**: Payments. |
| `subscriptionService.jsw` | 🟡 Medium | MEMBER | Subscription reading. |
| `surveyService.jsw` | 🟡 Medium | MEMBER | Feedback. |
| `weatherAlertService.jsw` | 🟢 **Low** | **ANY** | Public alerts. |
| `weighStationService.jsw` | 🟡 Medium | MEMBER | Utilities. |

## 4. Implementation Plan

1.  **Replace Wildcard**: Remove the `*` entry in `permissions.json`.
2.  **Apply Explicit Permissions**: Use the categorized list above to generate a new `permissions.json` file.
3.  **Restrict CORS**: Update `apiGateway.jsw` to restrict origins or validate them dynamically.
