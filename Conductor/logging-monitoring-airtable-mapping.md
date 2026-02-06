# Logging and Monitoring -> Airtable Mapping

This report lists logging/monitoring and feature-adoption related services, plus the Airtable tables they are intended to populate.
Source of truth for table names: backend/configData.js

## Services and Mappings

### Schema Enforcement Note
The Airtable client now enforces strict schema for the following tables:
- AIUsageLog
- AdminAuditLog
- SystemLogs
- SystemErrors
- SystemTraces
- SystemMetrics
Unmapped fields in these tables will throw an error instead of being Title Cased.

### Feature Adoption Logging
Service: backend/featureAdoptionService.jsw
Client entrypoint: public/js/feature-tracker.js (posts logFeatureInteraction messages)
Collections:
- featureAdoptionLogs -> v2_Feature Adoption Logs
- featureRegistry -> v2_Feature Registry
- featureFunnels -> v2_Feature Funnels
- featureMetricsDaily -> v2_Feature Metrics Daily

### System Observability / Tracing
Service: backend/observabilityService.jsw
Collections:
- systemLogs -> v2_System Logs
- systemTraces -> v2_System Traces
- systemErrors -> v2_System Errors
- systemMetrics -> v2_System Metrics

### AI Usage Logging
Service: backend/aiRouterService.jsw
Intended collection:
- aiUsageLog -> v2_AI Usage Log
Note: logUsage currently writes directly to Wix collection AIUsageLog, not Airtable.

### Admin Audit Logging
Service: backend/admin_audit_service.jsw
Intended collection:
- auditLog -> v2_Audit Log
Note: service uses collection key adminAuditLog, which is not in configData, so it routes to Wix AdminAuditLog instead of Airtable.

### Recruiter Telemetry / Call Outcomes
Service: backend/callOutcomeService.jsw
Collections:
- callOutcomes -> v2_Call Outcomes
- callFeedback -> v2_Call Feedback

### Recruiter Analytics
Service: backend/recruiterAnalyticsService.jsw
Collections:
- sourceAttribution -> v2_Source Attribution
- recruitingSpend -> v2_Recruiting Spend
- funnelEvents -> v2_Funnel Events
- competitorIntel -> v2_Competitor Intel
- hiringForecasts -> v2_Hiring Forecasts

### B2B Analytics
Service: backend/b2bAnalyticsService.jsw
Collections:
- b2bAnalyticsSnapshots -> v2_B2B Analytics Snapshots
- b2bLeadAttribution -> v2_B2B Lead Attribution
- b2bSpend -> v2_B2B Spend
- b2bCompetitorIntel -> v2_B2B Competitor Intel
- b2bOpportunities -> v2_B2B Opportunities
- b2bActivities -> v2_B2B Activities
- b2bAccounts -> v2_B2B Accounts
- b2bEmails -> v2_B2B Emails
- b2bTextMessages -> v2_B2B Text Messages
- b2bCalls -> v2_B2B Calls

### Gamification Analytics (Monitoring)
Service: backend/gamificationAnalyticsService.jsw
Collections:
- driverProgression -> v2_Driver Progression
- recruiterProgression -> v2_Recruiter Progression
- driverAchievements -> v2_Driver Achievements
- recruiterBadges -> v2_Recruiter Badges
- driverChallenges -> v2_Driver Challenges
- recruiterChallenges -> v2_Recruiter Challenges
- gamificationEvents -> v2_Gamification Events
- driverReferrals -> v2_Driver Referrals
- matchQualityBonuses -> v2_Match Quality Bonuses
- seasonalEvents -> v2_Seasonal Events
- eventParticipants -> v2_Event Participants

## Quick Mapping Table

| Service | Collection Key | Airtable Table |
| --- | --- | --- |
| featureAdoptionService.jsw | featureAdoptionLogs | v2_Feature Adoption Logs |
| featureAdoptionService.jsw | featureRegistry | v2_Feature Registry |
| featureAdoptionService.jsw | featureFunnels | v2_Feature Funnels |
| featureAdoptionService.jsw | featureMetricsDaily | v2_Feature Metrics Daily |
| observabilityService.jsw | systemLogs | v2_System Logs |
| observabilityService.jsw | systemTraces | v2_System Traces |
| observabilityService.jsw | systemErrors | v2_System Errors |
| observabilityService.jsw | systemMetrics | v2_System Metrics |
| aiRouterService.jsw | aiUsageLog | v2_AI Usage Log |
| admin_audit_service.jsw | auditLog | v2_Audit Log |
| callOutcomeService.jsw | callOutcomes | v2_Call Outcomes |
| callOutcomeService.jsw | callFeedback | v2_Call Feedback |
| recruiterAnalyticsService.jsw | sourceAttribution | v2_Source Attribution |
| recruiterAnalyticsService.jsw | recruitingSpend | v2_Recruiting Spend |
| recruiterAnalyticsService.jsw | funnelEvents | v2_Funnel Events |
| recruiterAnalyticsService.jsw | competitorIntel | v2_Competitor Intel |
| recruiterAnalyticsService.jsw | hiringForecasts | v2_Hiring Forecasts |
| b2bAnalyticsService.jsw | b2bAnalyticsSnapshots | v2_B2B Analytics Snapshots |
| b2bAnalyticsService.jsw | b2bLeadAttribution | v2_B2B Lead Attribution |
| b2bAnalyticsService.jsw | b2bSpend | v2_B2B Spend |
| b2bAnalyticsService.jsw | b2bCompetitorIntel | v2_B2B Competitor Intel |
| b2bAnalyticsService.jsw | b2bOpportunities | v2_B2B Opportunities |
| b2bAnalyticsService.jsw | b2bActivities | v2_B2B Activities |
| b2bAnalyticsService.jsw | b2bAccounts | v2_B2B Accounts |
| b2bAnalyticsService.jsw | b2bEmails | v2_B2B Emails |
| b2bAnalyticsService.jsw | b2bTextMessages | v2_B2B Text Messages |
| b2bAnalyticsService.jsw | b2bCalls | v2_B2B Calls |
| gamificationAnalyticsService.jsw | driverProgression | v2_Driver Progression |
| gamificationAnalyticsService.jsw | recruiterProgression | v2_Recruiter Progression |
| gamificationAnalyticsService.jsw | driverAchievements | v2_Driver Achievements |
| gamificationAnalyticsService.jsw | recruiterBadges | v2_Recruiter Badges |
| gamificationAnalyticsService.jsw | driverChallenges | v2_Driver Challenges |
| gamificationAnalyticsService.jsw | recruiterChallenges | v2_Recruiter Challenges |
| gamificationAnalyticsService.jsw | gamificationEvents | v2_Gamification Events |
| gamificationAnalyticsService.jsw | driverReferrals | v2_Driver Referrals |
| gamificationAnalyticsService.jsw | matchQualityBonuses | v2_Match Quality Bonuses |
| gamificationAnalyticsService.jsw | seasonalEvents | v2_Seasonal Events |
| gamificationAnalyticsService.jsw | eventParticipants | v2_Event Participants |

