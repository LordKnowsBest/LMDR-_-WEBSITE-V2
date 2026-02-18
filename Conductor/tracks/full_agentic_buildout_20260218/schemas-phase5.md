# Airtable Collection Schemas — Phase 5

**Track:** full_agentic_buildout_20260218
**Phase:** 5 — Cross-Role, External API, Financial, Lifecycle
**Date:** 2026-02-18
**Base ID:** `app9N1YCJ3gdhExA0`
**Platform:** LMDR / VelocityMatch — Wix Velo + Airtable CDL truck driver recruiting

---

## Overview

Phase 5 adds ~32 new Airtable collections supporting cross-role intelligence, the external API gateway, financial tracking for drivers, and the full driver/carrier lifecycle disposition system. All tables follow the `v2_Table Name` naming convention and all config keys are camelCase.

---

## Cross-Role Collections

---

### carrierRetentionScores → v2_Carrier Retention Scores

**Phase:** 5 | **Service:** carrierRetentionService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| carrier_dot | Single Line Text | Yes | DOT number of the carrier being scored |
| score | Number | Yes | Composite retention score (0–100) |
| score_tier | SingleSelect | Yes | `excellent` / `good` / `at_risk` / `critical` |
| active_drivers | Number | No | Count of currently active drivers on record |
| avg_tenure_days | Number | No | Average driver tenure in days across the fleet |
| turnover_rate_30d | Number | No | 30-day trailing turnover rate (percent) |
| flagged_risk_factors | MultiSelect | No | `low_pay` / `poor_communication` / `safety_issues` / `scheduling` / `culture` |
| last_scored_at | DateTime | Yes | Timestamp when score was last calculated |
| notes | Long Text | No | Free-text notes from retention analysis |

**configData.js:** `carrierRetentionScores: { airtable: 'v2_Carrier Retention Scores', wix: 'CarrierRetentionScores' }`

---

### matchExplanationCache → v2_Match Explanation Cache

**Phase:** 5 | **Service:** matchExplanationService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| driver_id | Single Line Text | Yes | Wix member ID of the driver |
| carrier_dot | Single Line Text | Yes | DOT number of the carrier |
| overall_score | Number | Yes | Match score at time of explanation generation (0–100) |
| explanation_text | Long Text | Yes | Human-readable "Why You Matched" narrative |
| top_factors | Long Text | No | JSON array of top 3 scoring factors with weights |
| gap_factors | Long Text | No | JSON array of missing requirements or weak signals |
| model_version | Single Line Text | No | Version tag of the scoring model that produced the result |
| generated_at | DateTime | Yes | When this explanation was generated |
| ttl_expires_at | DateTime | No | When this cache entry should be considered stale |
| driver_viewed | Checkbox | No | Whether the driver has viewed this explanation |

**configData.js:** `matchExplanationCache: { airtable: 'v2_Match Explanation Cache', wix: 'MatchExplanationCache' }`

---

### systemHealthSnapshots → v2_System Health Snapshots

**Phase:** 5 | **Service:** observabilityService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| snapshot_id | Single Line Text | Yes | Unique identifier (e.g. `snap_<timestamp>`) |
| captured_at | DateTime | Yes | When this snapshot was taken |
| overall_status | SingleSelect | Yes | `operational` / `degraded` / `outage` |
| database_status | SingleSelect | Yes | `operational` / `degraded` / `outage` |
| ai_status | SingleSelect | Yes | `operational` / `degraded` / `outage` |
| enrichment_status | SingleSelect | Yes | `operational` / `degraded` / `outage` |
| fmcsa_status | SingleSelect | Yes | `operational` / `degraded` / `outage` |
| active_anomalies | Number | No | Count of unresolved anomaly alerts at snapshot time |
| p95_latency_ms | Number | No | 95th-percentile response latency across all tools |
| error_rate_pct | Number | No | Rolling error rate percentage across all tool calls |
| triggered_by | SingleSelect | No | `cron` / `anomaly_alert` / `manual` |

**configData.js:** `systemHealthSnapshots: { airtable: 'v2_System Health Snapshots', wix: 'SystemHealthSnapshots' }`

---

### recruiterHealthMetrics → v2_Recruiter Health Metrics

**Phase:** 5 | **Service:** recruiterHealthService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| carrier_dot | Single Line Text | Yes | DOT number of the carrier whose recruiter context is being assessed |
| recorded_at | DateTime | Yes | Timestamp of this health check |
| overall_status | SingleSelect | Yes | `operational` / `degraded` / `outage` |
| database_latency_ms | Number | No | Airtable query latency observed during health check |
| ai_latency_ms | Number | No | AI router latency observed during health check |
| enrichment_queue_depth | Number | No | Number of carriers awaiting enrichment at time of check |
| fmcsa_api_ok | Checkbox | No | Whether the FMCSA external API was reachable |
| open_pipeline_count | Number | No | Candidates in active pipeline stages for this carrier |
| cache_hit_rate_pct | Number | No | Percentage of requests served from cache in the last 5 minutes |
| alert_summary | Long Text | No | JSON summary of any active alerts affecting this carrier context |

**configData.js:** `recruiterHealthMetrics: { airtable: 'v2_Recruiter Health Metrics', wix: 'RecruiterHealthMetrics' }`

---

## External API Collections

---

### apiKeys → v2_API Keys

**Phase:** 5 | **Service:** apiKeyService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| key_id | Single Line Text | Yes | Unique key identifier (e.g. `key_<timestamp>`) |
| partner_id | Single Line Text | Yes | Foreign key to `v2_API Partners` |
| key_hash | Single Line Text | Yes | bcrypt/SHA-256 hash of the raw key — never store plaintext |
| key_prefix | Single Line Text | Yes | First 8 chars of the key for display (e.g. `lmdr_abc`) |
| environment | SingleSelect | Yes | `live` / `sandbox` |
| status | SingleSelect | Yes | `active` / `revoked` / `expired` |
| scopes | MultiSelect | No | `read:matches` / `write:webhooks` / `read:drivers` / `admin` |
| last_used_at | DateTime | No | Most recent authenticated API call timestamp |
| expires_at | DateTime | No | Hard expiry date for time-limited keys |
| created_at | DateTime | Yes | Key creation timestamp |
| revoked_at | DateTime | No | Timestamp when key was revoked (null if still active) |

**configData.js:** `apiKeys: { airtable: 'v2_API Keys', wix: 'ApiKeys' }`

---

### apiUsageLogs → v2_API Usage Logs

**Phase:** 5 | **Service:** apiGatewayService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| log_id | Single Line Text | Yes | Unique log entry identifier |
| partner_id | Single Line Text | Yes | Foreign key to `v2_API Partners` |
| key_id | Single Line Text | Yes | Foreign key to `v2_API Keys` |
| endpoint | Single Line Text | Yes | API endpoint path (e.g. `/v1/matches/search`) |
| http_method | SingleSelect | Yes | `GET` / `POST` / `PUT` / `DELETE` |
| status_code | Number | Yes | HTTP response status code returned |
| latency_ms | Number | No | Time from request receipt to response sent (ms) |
| request_size_bytes | Number | No | Payload size of the incoming request |
| response_size_bytes | Number | No | Payload size of the outgoing response |
| error_message | Single Line Text | No | Error message if status_code >= 400 |
| logged_at | DateTime | Yes | Timestamp of the API call |

**configData.js:** `apiUsageLogs: { airtable: 'v2_API Usage Logs', wix: 'ApiUsageLogs' }`

---

### apiRateLimits → v2_API Rate Limits

**Phase:** 5 | **Service:** apiGatewayService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| partner_id | Single Line Text | Yes | Foreign key to `v2_API Partners` |
| tier | SingleSelect | Yes | `starter` / `growth` / `enterprise` / `custom` |
| requests_per_minute | Number | Yes | Allowed requests per minute for this configuration |
| requests_per_day | Number | Yes | Allowed requests per day for this configuration |
| burst_allowance | Number | No | Short-burst multiplier (e.g. 2x for 10s) |
| current_minute_count | Number | No | Rolling count of requests in the current minute window |
| current_day_count | Number | No | Rolling count of requests in the current day window |
| last_reset_at | DateTime | No | When the minute counter was last reset |
| throttle_active | Checkbox | No | Whether rate limiting is currently active for this partner |
| override_reason | Single Line Text | No | Reason for any custom rate limit override |

**configData.js:** `apiRateLimits: { airtable: 'v2_API Rate Limits', wix: 'ApiRateLimits' }`

---

### externalMatchRequests → v2_External Match Requests

**Phase:** 5 | **Service:** externalMatchService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| request_id | Single Line Text | Yes | Unique identifier for this match request |
| partner_id | Single Line Text | Yes | Foreign key to `v2_API Partners` |
| request_payload | Long Text | Yes | JSON of the incoming match criteria (zip, endorsements, etc.) |
| match_count | Number | No | Number of matches returned |
| response_payload | Long Text | No | JSON of the match results returned to the partner |
| status | SingleSelect | Yes | `pending` / `completed` / `failed` / `rate_limited` |
| latency_ms | Number | No | Total processing time for the match request |
| error_message | Single Line Text | No | Error detail if status is `failed` |
| requested_at | DateTime | Yes | Timestamp when the request was received |
| completed_at | DateTime | No | Timestamp when the response was sent |

**configData.js:** `externalMatchRequests: { airtable: 'v2_External Match Requests', wix: 'ExternalMatchRequests' }`

---

### externalDocVerifications → v2_External Doc Verifications

**Phase:** 5 | **Service:** externalDocService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| verification_id | Single Line Text | Yes | Unique identifier for this verification transaction |
| driver_id | Single Line Text | Yes | Wix member ID of the driver whose document is being verified |
| partner_id | Single Line Text | No | External partner that initiated the verification |
| document_type | SingleSelect | Yes | `CDL` / `medical_cert` / `hazmat` / `twic` / `passport` / `other` |
| provider | Single Line Text | Yes | Name of the external verification provider (e.g. `Checkr`) |
| provider_reference_id | Single Line Text | No | The provider's own transaction or report ID |
| status | SingleSelect | Yes | `pending` / `verified` / `failed` / `expired` |
| result_summary | Long Text | No | Human-readable summary or JSON detail from the provider response |
| verified_at | DateTime | No | When the provider confirmed verification |
| expires_at | DateTime | No | When this verification result expires |
| requested_at | DateTime | Yes | When the verification was initiated |

**configData.js:** `externalDocVerifications: { airtable: 'v2_External Doc Verifications', wix: 'ExternalDocVerifications' }`

---

### externalEngagementMetrics → v2_External Engagement Metrics

**Phase:** 5 | **Service:** externalEngagementApi.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| metric_id | Single Line Text | Yes | Unique identifier for this metric record |
| partner_id | Single Line Text | Yes | Partner that generated or consumed this engagement event |
| event_type | SingleSelect | Yes | `email_open` / `sms_click` / `push_delivered` / `push_opened` / `call_connected` |
| subject_type | SingleSelect | Yes | `driver` / `carrier` / `recruiter` |
| subject_id | Single Line Text | Yes | ID of the driver, carrier, or recruiter |
| channel | SingleSelect | Yes | `email` / `sms` / `push` / `voice` |
| campaign_id | Single Line Text | No | Associated campaign identifier if applicable |
| event_value | Number | No | Numeric signal (e.g. open rate, click-through rate as decimal) |
| recorded_at | DateTime | Yes | Timestamp of the engagement event |

**configData.js:** `externalEngagementMetrics: { airtable: 'v2_External Engagement Metrics', wix: 'ExternalEngagementMetrics' }`

---

### webhookSubscriptions → v2_Webhook Subscriptions

**Phase:** 5 | **Service:** apiPortalService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| subscription_id | Single Line Text | Yes | Unique subscription identifier |
| partner_id | Single Line Text | Yes | Foreign key to `v2_API Partners` |
| target_url | URL | Yes | HTTPS endpoint where event payloads are delivered |
| secret | Single Line Text | Yes | HMAC signing secret (stored hashed) |
| events | MultiSelect | Yes | Event types subscribed to: `match.created` / `driver.hired` / `carrier.verified` / `application.status_changed` / `payment.processed` |
| status | SingleSelect | Yes | `active` / `paused` / `disabled` |
| failure_count | Number | No | Consecutive delivery failures since last success |
| last_success_at | DateTime | No | Timestamp of the most recent successful delivery |
| created_at | DateTime | Yes | When this subscription was registered |

**configData.js:** `webhookSubscriptions: { airtable: 'v2_Webhook Subscriptions', wix: 'WebhookSubscriptions' }`

---

### webhookDeliveryLog → v2_Webhook Delivery Log

**Phase:** 5 | **Service:** apiPortalService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| delivery_id | Single Line Text | Yes | Unique delivery attempt identifier |
| subscription_id | Single Line Text | Yes | Foreign key to `v2_Webhook Subscriptions` |
| event_type | Single Line Text | Yes | The event type dispatched (e.g. `match.created`) |
| payload_summary | Long Text | No | First 500 chars of the JSON payload for debugging |
| http_status | Number | No | HTTP status code returned by the partner endpoint |
| attempt_number | Number | Yes | Which retry attempt this is (1 = first try) |
| success | Checkbox | Yes | Whether the delivery was accepted (2xx response) |
| error_detail | Long Text | No | Error body or network error message on failure |
| attempted_at | DateTime | Yes | Timestamp of this delivery attempt |
| next_retry_at | DateTime | No | Scheduled timestamp for the next retry (null if none) |

**configData.js:** `webhookDeliveryLog: { airtable: 'v2_Webhook Delivery Log', wix: 'WebhookDeliveryLog' }`

---

### apiPartners → ⚠️ ALREADY EXISTS IN configData.js → v2_API Partners

**Phase:** 5 | **Service:** apiPortalService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| partner_id | Single Line Text | Yes | Unique partner identifier (e.g. `ptn_<timestamp>`) |
| company_name | Single Line Text | Yes | Legal name of the partner organization |
| contact_name | Single Line Text | No | Primary contact person |
| contact_email | Single Line Text | Yes | Primary contact email for billing and alerts |
| tier | SingleSelect | Yes | `starter` / `growth` / `enterprise` / `custom` |
| status | SingleSelect | Yes | `active` / `suspended` / `pending_review` / `terminated` |
| ip_whitelist | Long Text | No | JSON array of allowed IP addresses or CIDR ranges |
| webhook_url | URL | No | Default webhook endpoint (can be overridden per subscription) |
| stripe_customer_id | Single Line Text | No | Stripe customer ID for billing |
| monthly_spend | Number | No | Current month API spend in USD cents |
| created_at | DateTime | Yes | Partner account creation timestamp |

**configData.js:** `apiPartners: { airtable: 'v2_API Partners', wix: 'ApiPartners' }`

---

### apiSandboxData → v2_API Sandbox Data

**Phase:** 5 | **Service:** apiGatewayService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| sandbox_record_id | Single Line Text | Yes | Unique identifier for this sandbox fixture |
| partner_id | Single Line Text | Yes | Partner the sandbox data belongs to |
| data_type | SingleSelect | Yes | `driver` / `carrier` / `match` / `application` / `webhook_event` |
| fixture_name | Single Line Text | Yes | Human-readable name for this fixture (e.g. `mock_driver_OTR_experienced`) |
| payload | Long Text | Yes | JSON body of the synthetic test record |
| is_default | Checkbox | No | Whether this is the default fixture returned for this data type |
| created_at | DateTime | Yes | When this sandbox fixture was created |
| updated_at | DateTime | No | When the fixture was last modified |

**configData.js:** `apiSandboxData: { airtable: 'v2_API Sandbox Data', wix: 'ApiSandboxData' }`

---

## Financial Collections

---

### perDiemRates → v2_Per Diem Rates

**Phase:** 5 | **Service:** taxHelperService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| rate_id | Single Line Text | Yes | Unique identifier for this rate record |
| effective_date | Date | Yes | Date this rate became effective |
| irs_rate_usd | Number | Yes | IRS-published per diem rate in USD (e.g. `69` for $69/day) |
| high_cost_rate_usd | Number | No | Per diem rate for designated high-cost localities |
| locality | Single Line Text | No | Specific locality name if this is a locale-specific rate |
| source_url | URL | No | Link to the IRS publication or Federal Register notice |
| notes | Long Text | No | Context or caveats about this rate (e.g. partial-day rules) |

**configData.js:** `perDiemRates: { airtable: 'v2_Per Diem Rates', wix: 'PerDiemRates' }`

---

### taxDeductionCategories → v2_Tax Deduction Categories

**Phase:** 5 | **Service:** taxHelperService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| category_id | Single Line Text | Yes | Unique category identifier |
| name | Single Line Text | Yes | Category name (e.g. `Fuel`, `Tolls`, `Lodging`, `Meals`, `Maintenance`) |
| schedule_c_line | Single Line Text | No | IRS Schedule C line this deduction maps to |
| deductible_pct | Number | Yes | Percentage of expense that is tax-deductible (0–100) |
| requires_receipt | Checkbox | No | Whether documentation is required for this category |
| notes | Long Text | No | IRS guidance or caveats for this category |
| active | Checkbox | Yes | Whether this category is currently available to drivers |

**configData.js:** `taxDeductionCategories: { airtable: 'v2_Tax Deduction Categories', wix: 'TaxDeductionCategories' }`

---

### fuelCardTransactions → v2_Fuel Card Transactions

**Phase:** 5 | **Service:** fuelCardService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| transaction_id | Single Line Text | Yes | Provider transaction ID |
| driver_id | Single Line Text | Yes | Wix member ID of the driver |
| card_id | Single Line Text | Yes | Foreign key to `v2_Fuel Cards` |
| merchant_name | Single Line Text | No | Name of the fueling location |
| merchant_state | Single Line Text | No | Two-letter state code (for IFTA) |
| gallons | Number | No | Gallons of fuel purchased |
| price_per_gallon | Number | No | Price per gallon in USD |
| total_amount_usd | Number | Yes | Total transaction amount in USD |
| fuel_type | SingleSelect | No | `diesel` / `def` / `gasoline` / `other` |
| transaction_date | Date | Yes | Date the purchase was made |
| posted_at | DateTime | No | When the transaction posted to the card |

**configData.js:** `fuelCardTransactions: { airtable: 'v2_Fuel Card Transactions', wix: 'FuelCardTransactions' }`

---

### tollTransactions → v2_Toll Transactions

**Phase:** 5 | **Service:** tollService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| transaction_id | Single Line Text | Yes | Toll authority transaction ID |
| driver_id | Single Line Text | Yes | Wix member ID of the driver |
| transponder_id | Single Line Text | No | EZPass / PrePass transponder ID |
| toll_authority | Single Line Text | No | Name of the toll authority (e.g. `Pennsylvania Turnpike`) |
| plaza_name | Single Line Text | No | Specific toll plaza or gantry name |
| state | Single Line Text | No | Two-letter state code where toll was collected |
| amount_usd | Number | Yes | Amount charged in USD |
| vehicle_class | SingleSelect | No | `2-axle` / `3-axle` / `4-axle` / `5-axle` / `6-axle+` |
| transaction_date | Date | Yes | Date the toll was collected |
| deductible | Checkbox | No | Whether this toll qualifies as a tax deduction |

**configData.js:** `tollTransactions: { airtable: 'v2_Toll Transactions', wix: 'TollTransactions' }`

---

### insurancePolicies → v2_Insurance Policies

**Phase:** 5 | **Service:** taxHelperService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| policy_id | Single Line Text | Yes | Internal policy identifier |
| driver_id | Single Line Text | Yes | Wix member ID of the insured driver |
| policy_type | SingleSelect | Yes | `health` / `occupational_accident` / `disability` / `life` / `cargo` |
| provider_name | Single Line Text | Yes | Insurance provider name |
| policy_number | Single Line Text | No | Policy number from the provider |
| monthly_premium_usd | Number | Yes | Monthly premium in USD |
| coverage_start | Date | Yes | Policy effective start date |
| coverage_end | Date | No | Policy expiry date (null if open-ended) |
| status | SingleSelect | Yes | `active` / `lapsed` / `cancelled` |
| deductible_usd | Number | No | Annual deductible amount in USD |

**configData.js:** `insurancePolicies: { airtable: 'v2_Insurance Policies', wix: 'InsurancePolicies' }`

---

### loanPrograms → v2_Loan Programs

**Phase:** 5 | **Service:** taxHelperService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| program_id | Single Line Text | Yes | Unique identifier for this loan program |
| program_name | Single Line Text | Yes | Name of the loan or financing program |
| provider | Single Line Text | Yes | Lender or financing institution name |
| program_type | SingleSelect | Yes | `truck_purchase` / `lease` / `repair` / `working_capital` / `other` |
| min_amount_usd | Number | No | Minimum loan amount in USD |
| max_amount_usd | Number | No | Maximum loan amount in USD |
| apr_range | Single Line Text | No | Advertised APR range (e.g. `6.5%–12%`) |
| term_months | Number | No | Loan term in months |
| eligibility_notes | Long Text | No | CDL experience requirements, credit score minimums, etc. |
| apply_url | URL | No | Link to the application or more information |
| active | Checkbox | Yes | Whether this program is currently featured |

**configData.js:** `loanPrograms: { airtable: 'v2_Loan Programs', wix: 'LoanPrograms' }`

---

### financialGoals → v2_Financial Goals

**Phase:** 5 | **Service:** taxHelperService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| goal_id | Single Line Text | Yes | Unique goal identifier |
| driver_id | Single Line Text | Yes | Wix member ID of the driver |
| goal_type | SingleSelect | Yes | `emergency_fund` / `truck_down_payment` / `debt_payoff` / `retirement` / `custom` |
| goal_name | Single Line Text | Yes | Driver-provided label for the goal |
| target_amount_usd | Number | Yes | Dollar amount the driver is aiming to save or pay off |
| current_amount_usd | Number | No | Progress toward the goal in USD |
| target_date | Date | No | Driver's self-set deadline |
| status | SingleSelect | Yes | `active` / `achieved` / `abandoned` |
| created_at | DateTime | Yes | When the goal was set |

**configData.js:** `financialGoals: { airtable: 'v2_Financial Goals', wix: 'FinancialGoals' }`

---

### budgetTracking → v2_Budget Tracking

**Phase:** 5 | **Service:** taxHelperService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| budget_id | Single Line Text | Yes | Unique budget record identifier |
| driver_id | Single Line Text | Yes | Wix member ID of the driver |
| period | Single Line Text | Yes | ISO month string (e.g. `2026-02`) |
| category | SingleSelect | Yes | `fuel` / `food` / `lodging` / `tolls` / `maintenance` / `insurance` / `other` |
| budgeted_usd | Number | Yes | Planned spending in USD for this category and period |
| actual_usd | Number | No | Actual spending recorded in USD |
| variance_usd | Number | No | Actual minus budgeted (negative = over budget) |
| notes | Long Text | No | Driver notes about this budget period |

**configData.js:** `budgetTracking: { airtable: 'v2_Budget Tracking', wix: 'BudgetTracking' }`

---

### payStubArchive → v2_Pay Stub Archive

**Phase:** 5 | **Service:** settlementService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| stub_id | Single Line Text | Yes | Unique pay stub identifier |
| driver_id | Single Line Text | Yes | Wix member ID of the driver |
| carrier_dot | Single Line Text | Yes | DOT number of the paying carrier |
| pay_period_start | Date | Yes | First day of the pay period |
| pay_period_end | Date | Yes | Last day of the pay period |
| gross_pay_usd | Number | Yes | Total gross earnings before deductions |
| deductions_usd | Number | No | Total deductions (fuel advance, escrow, etc.) |
| net_pay_usd | Number | Yes | Take-home pay after deductions |
| miles_driven | Number | No | Total miles driven during this pay period |
| loads_completed | Number | No | Number of loads delivered in this pay period |
| stub_url | URL | No | Link to the PDF pay stub document |
| issued_at | DateTime | Yes | When this pay stub was issued |

**configData.js:** `payStubArchive: { airtable: 'v2_Pay Stub Archive', wix: 'PayStubArchive' }`

---

### financialAlerts → v2_Financial Alerts

**Phase:** 5 | **Service:** taxHelperService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| alert_id | Single Line Text | Yes | Unique alert identifier |
| driver_id | Single Line Text | Yes | Wix member ID of the driver receiving the alert |
| alert_type | SingleSelect | Yes | `budget_exceeded` / `tax_deadline` / `document_expiring` / `goal_milestone` / `large_expense` |
| severity | SingleSelect | Yes | `info` / `warning` / `critical` |
| title | Single Line Text | Yes | Short alert headline |
| message | Long Text | Yes | Full alert message with context and recommended action |
| acknowledged | Checkbox | No | Whether the driver has seen and dismissed this alert |
| created_at | DateTime | Yes | When the alert was generated |
| expires_at | DateTime | No | When the alert should auto-dismiss (null = manual only) |

**configData.js:** `financialAlerts: { airtable: 'v2_Financial Alerts', wix: 'FinancialAlerts' }`

---

## Lifecycle Collections

---

### lifecycleStages → v2_Lifecycle Stages

**Phase:** 5 | **Service:** driverLifecycleService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| stage_id | Single Line Text | Yes | Unique stage identifier |
| driver_id | Single Line Text | Yes | Wix member ID of the driver |
| stage | SingleSelect | Yes | `prospect` / `applicant` / `interviewing` / `offer_extended` / `onboarding` / `active` / `inactive` / `churned` / `rehire` |
| carrier_dot | Single Line Text | No | DOT of the associated carrier, if applicable |
| entered_at | DateTime | Yes | When the driver entered this stage |
| exited_at | DateTime | No | When the driver left this stage (null if current) |
| duration_days | Number | No | Days spent in this stage (calculated on exit) |
| trigger | SingleSelect | No | `application_submitted` / `interview_scheduled` / `offer_sent` / `hired` / `doc_complete` / `no_contact` / `resigned` / `terminated` |
| entered_by | Single Line Text | No | Recruiter or system that triggered the stage entry |

**configData.js:** `lifecycleStages: { airtable: 'v2_Lifecycle Stages', wix: 'LifecycleStages' }`

---

### dispositionReasons → v2_Disposition Reasons

**Phase:** 5 | **Service:** driverLifecycleService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| reason_id | Single Line Text | Yes | Unique identifier for this disposition reason |
| code | Single Line Text | Yes | Short machine-readable code (e.g. `NQ_MVR`, `WITHDREW`, `ACCEPTED_OTHER`) |
| label | Single Line Text | Yes | Human-readable label shown in the UI |
| category | SingleSelect | Yes | `not_qualified` / `withdrew` / `no_contact` / `placed` / `rejected` / `other` |
| stage_applicability | MultiSelect | No | Which lifecycle stages this reason can be applied at |
| requires_notes | Checkbox | No | Whether recruiter must add a note when selecting this reason |
| active | Checkbox | Yes | Whether this reason is currently available for selection |
| sort_order | Number | No | Display order in the dropdown |

**configData.js:** `dispositionReasons: { airtable: 'v2_Disposition Reasons', wix: 'DispositionReasons' }`

---

### surveyTemplates → v2_Survey Templates

**Phase:** 5 | **Service:** driverLifecycleService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| template_id | Single Line Text | Yes | Unique template identifier |
| name | Single Line Text | Yes | Internal name (e.g. `Exit Survey — OTR Driver`) |
| survey_type | SingleSelect | Yes | `exit` / `nps` / `onboarding_feedback` / `retention_check` / `custom` |
| trigger_stage | SingleSelect | No | Which lifecycle stage triggers automatic dispatch |
| questions | Long Text | Yes | JSON array of question objects with type, text, and options |
| intro_text | Long Text | No | Introductory text shown to respondent before questions |
| outro_text | Long Text | No | Closing message shown after submission |
| active | Checkbox | Yes | Whether this template is available for use |
| created_at | DateTime | Yes | When the template was created |

**configData.js:** `surveyTemplates: { airtable: 'v2_Survey Templates', wix: 'SurveyTemplates' }`

---

### algorithmTransparencyLog → v2_Algorithm Transparency Log

**Phase:** 5 | **Service:** driverLifecycleService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| log_id | Single Line Text | Yes | Unique log entry identifier |
| subject_type | SingleSelect | Yes | `driver` / `carrier` / `match` |
| subject_id | Single Line Text | Yes | ID of the entity the decision concerns |
| decision_type | SingleSelect | Yes | `match_score` / `retention_risk` / `disposition_suggestion` / `algorithm_feedback` |
| input_summary | Long Text | No | Key input signals that drove the decision (JSON) |
| output_summary | Long Text | No | Decision output and confidence level (JSON) |
| model_version | Single Line Text | No | Algorithm or model version that produced this output |
| submitted_by | Single Line Text | No | User ID of person who submitted feedback (if type is feedback) |
| feedback_rating | SingleSelect | No | `accurate` / `somewhat_accurate` / `inaccurate` — used for model calibration |
| notes | Long Text | No | Free-text context or correction notes |
| created_at | DateTime | Yes | Timestamp of this log entry |

**configData.js:** `algorithmTransparencyLog: { airtable: 'v2_Algorithm Transparency Log', wix: 'AlgorithmTransparencyLog' }`

---

### driverMilestones → v2_Driver Milestones

**Phase:** 5 | **Service:** driverLifecycleService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| milestone_id | Single Line Text | Yes | Unique milestone record identifier |
| driver_id | Single Line Text | Yes | Wix member ID of the driver |
| milestone_type | SingleSelect | Yes | `first_application` / `first_hire` / `one_year_tenure` / `safety_streak` / `miles_threshold` / `loads_threshold` / `profile_complete` / `custom` |
| milestone_label | Single Line Text | Yes | Display label for this milestone |
| achieved_at | DateTime | Yes | When the driver hit this milestone |
| carrier_dot | Single Line Text | No | Associated carrier DOT if milestone is carrier-specific |
| metric_value | Number | No | The numeric value that triggered the milestone (e.g. 100000 miles) |
| rewarded | Checkbox | No | Whether a gamification reward was issued for this milestone |

**configData.js:** `driverMilestones: { airtable: 'v2_Driver Milestones', wix: 'DriverMilestones' }`

---

### driverGoals → v2_Driver Goals

**Phase:** 5 | **Service:** careerPathService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| goal_id | Single Line Text | Yes | Unique goal record identifier |
| driver_id | Single Line Text | Yes | Wix member ID of the driver |
| goal_category | SingleSelect | Yes | `career` / `financial` / `health` / `compliance` / `community` |
| title | Single Line Text | Yes | Short goal title (e.g. `Get Hazmat Endorsement`) |
| description | Long Text | No | Driver's own description of the goal |
| target_date | Date | No | Driver's self-set deadline for achieving this goal |
| status | SingleSelect | Yes | `active` / `achieved` / `paused` / `abandoned` |
| progress_pct | Number | No | Agent-estimated progress as a percentage (0–100) |
| next_step | Long Text | No | Agent-suggested immediate next action |
| created_at | DateTime | Yes | When the goal was created |

**configData.js:** `driverGoals: { airtable: 'v2_Driver Goals', wix: 'DriverGoals' }`

---

### careerPathSuggestions → v2_Career Path Suggestions

**Phase:** 5 | **Service:** careerPathService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| suggestion_id | Single Line Text | Yes | Unique suggestion identifier |
| driver_id | Single Line Text | Yes | Wix member ID of the driver |
| suggested_path | SingleSelect | Yes | `owner_operator` / `dedicated_fleet` / `regional_OTR` / `hazmat_specialist` / `tanker` / `flatbed` / `trainer` / `fleet_manager` |
| rationale | Long Text | Yes | Agent-generated explanation of why this path fits the driver's profile |
| estimated_earnings_range | Single Line Text | No | Approximate annual income range for this path |
| skill_gaps | MultiSelect | No | Endorsements or certifications required: `hazmat` / `tanker` / `doubles_triples` / `X_endorsement` |
| estimated_timeline | Single Line Text | No | Rough timeframe to be qualified (e.g. `6–12 months`) |
| score | Number | No | Path fit score (0–100) used for ranking suggestions |
| created_at | DateTime | Yes | When this suggestion was generated |
| dismissed | Checkbox | No | Whether the driver dismissed this suggestion |

**configData.js:** `careerPathSuggestions: { airtable: 'v2_Career Path Suggestions', wix: 'CareerPathSuggestions' }`

---

### industryBenchmarks → v2_Industry Benchmarks

**Phase:** 5 | **Service:** careerPathService.jsw

| Field Name | Type | Required | Description |
|------------|------|----------|-------------|
| benchmark_id | Single Line Text | Yes | Unique benchmark record identifier |
| category | SingleSelect | Yes | `pay` / `turnover` / `tenure` / `safety_score` / `fill_time` / `cph` |
| segment | Single Line Text | Yes | The market segment this benchmark applies to (e.g. `OTR Dry Van National`) |
| region | Single Line Text | No | Geographic scope (e.g. `Southeast`, `National`, `Midwest`) |
| p25_value | Number | No | 25th percentile value |
| median_value | Number | Yes | Median (50th percentile) value |
| p75_value | Number | No | 75th percentile value |
| unit | Single Line Text | Yes | Unit of measure (e.g. `USD/mile`, `days`, `%`) |
| data_source | Single Line Text | No | Source of benchmark data (e.g. `ATRI`, `FMCSA`, `Internal`) |
| effective_date | Date | Yes | Date this benchmark data was published or effective |

**configData.js:** `industryBenchmarks: { airtable: 'v2_Industry Benchmarks', wix: 'IndustryBenchmarks' }`

---

## configData.js Block — Phase 5 Additions

Add the following entries to the `DATA_SOURCE` object in `src/backend/configData.js`:

```javascript
// -------------------------------------------------------------------------
// Phase 5 — Cross-Role, External API, Financial, Lifecycle
// -------------------------------------------------------------------------

// Cross-Role
carrierRetentionScores: 'airtable',
matchExplanationCache: 'airtable',
systemHealthSnapshots: 'airtable',
recruiterHealthMetrics: 'airtable',

// External API Gateway
apiKeys: 'airtable',
apiUsageLogs: 'airtable',
apiRateLimits: 'airtable',
externalMatchRequests: 'airtable',
externalDocVerifications: 'airtable',
externalEngagementMetrics: 'airtable',
webhookSubscriptions: 'airtable',
webhookDeliveryLog: 'airtable',
apiPartners: 'airtable',         // NOTE: already exists as apiPartners — verify no duplicate
apiSandboxData: 'airtable',

// Financial
perDiemRates: 'airtable',
taxDeductionCategories: 'airtable',
fuelCardTransactions: 'airtable',
tollTransactions: 'airtable',
insurancePolicies: 'airtable',
loanPrograms: 'airtable',
financialGoals: 'airtable',
budgetTracking: 'airtable',
payStubArchive: 'airtable',
financialAlerts: 'airtable',

// Lifecycle
lifecycleStages: 'airtable',
dispositionReasons: 'airtable',
surveyTemplates: 'airtable',
algorithmTransparencyLog: 'airtable',
driverMilestones: 'airtable',
driverGoals: 'airtable',
careerPathSuggestions: 'airtable',
industryBenchmarks: 'airtable',
```

Add corresponding entries to `WIX_COLLECTION_NAMES`:

```javascript
// Phase 5 — Cross-Role
carrierRetentionScores: 'CarrierRetentionScores',
matchExplanationCache: 'MatchExplanationCache',
systemHealthSnapshots: 'SystemHealthSnapshots',
recruiterHealthMetrics: 'RecruiterHealthMetrics',

// Phase 5 — External API
apiKeys: 'ApiKeys',
apiUsageLogs: 'ApiUsageLogs',
apiRateLimits: 'ApiRateLimits',
externalMatchRequests: 'ExternalMatchRequests',
externalDocVerifications: 'ExternalDocVerifications',
externalEngagementMetrics: 'ExternalEngagementMetrics',
webhookSubscriptions: 'WebhookSubscriptions',
webhookDeliveryLog: 'WebhookDeliveryLog',
apiSandboxData: 'ApiSandboxData',

// Phase 5 — Financial
perDiemRates: 'PerDiemRates',
taxDeductionCategories: 'TaxDeductionCategories',
fuelCardTransactions: 'FuelCardTransactions',
tollTransactions: 'TollTransactions',
insurancePolicies: 'InsurancePolicies',
loanPrograms: 'LoanPrograms',
financialGoals: 'FinancialGoals',
budgetTracking: 'BudgetTracking',
payStubArchive: 'PayStubArchive',
financialAlerts: 'FinancialAlerts',

// Phase 5 — Lifecycle
lifecycleStages: 'LifecycleStages',
dispositionReasons: 'DispositionReasons',
surveyTemplates: 'SurveyTemplates',
algorithmTransparencyLog: 'AlgorithmTransparencyLog',
driverMilestones: 'DriverMilestones',
driverGoals: 'DriverGoals',
careerPathSuggestions: 'CareerPathSuggestions',
industryBenchmarks: 'IndustryBenchmarks',
```

---

## Collection Count Summary

| Category | Collections |
|----------|-------------|
| Cross-Role | 4 |
| External API | 10 |
| Financial | 10 |
| Lifecycle | 8 |
| **Total Phase 5** | **32** |

---

## Notes & Dependency Flags

- `apiPartners` already exists in `configData.js` as `apiPartners: 'airtable'` (line 157). The `v2_API Partners` table is referenced by `apiPortalService.jsw`. Verify the Airtable table name matches before adding any duplicate key.
- `surveyTemplates` is a new collection. The existing `surveyDefinitions` key (line 195 of `configData.js`) maps to a different table (`v2_Survey Definitions` used by exit flow). These are distinct — `surveyTemplates` is the agent-managed template library, `surveyDefinitions` is the legacy collection.
- `lifecycleStages` supplements the existing `lifecycleEvents` key (line 193). Events are point-in-time facts; Stages are current-state records with entry/exit timestamps.
- `fuelCardTransactions` extends the existing `fuelCards` key (line 144). `fuelCards` holds card configuration; `fuelCardTransactions` holds individual purchase records.
- All financial collections write to the `Last Mile Driver recruiting` base (`app9N1YCJ3gdhExA0`), not the VelocityMatch DataLake base, to keep driver financial data co-located with profile data.
