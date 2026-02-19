-- =============================================================================
-- LMDR GCP Migration — Script 06: BigQuery Schema (Analytics / Logs)
-- Phase 6.3 | Run in BigQuery Console or via bq CLI
-- =============================================================================
-- HOW TO RUN:
--   Option A (BigQuery Console):
--     1. Go to https://console.cloud.google.com/bigquery
--     2. Select project lmdr-prod-db, dataset lmdr_analytics
--     3. Paste and run each CREATE TABLE statement
--
--   Option B (bq CLI in Cloud Shell):
--     bq query --use_legacy_sql=false < 06_bigquery_schema.sql
--
-- NOTE: BigQuery tables do NOT need _owner/_createdDate columns
--       because they are read-only in Wix (analytics only).
-- =============================================================================

-- ─────────────────────────────────────────────
-- TABLE: system_logs
-- Migrated from: Airtable v2_SystemLogs (via observabilityService.jsw)
-- BigQuery namespace: gcp_analytics/system_logs
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `lmdr-prod-db.lmdr_analytics.system_logs` (
  log_id        STRING        NOT NULL,
  timestamp     TIMESTAMP     NOT NULL,
  level         STRING,               -- INFO | WARN | ERROR | DEBUG
  service       STRING,               -- service name (e.g. 'carrierMatching')
  message       TEXT,
  data          JSON,                 -- structured context data
  trace_id      STRING,               -- distributed trace ID
  duration_ms   INT64,
  is_error      BOOL          DEFAULT FALSE
)
PARTITION BY DATE(timestamp)
CLUSTER BY service, level
OPTIONS (
  description = "LMDR system logs from observabilityService - partitioned by date"
);

-- ─────────────────────────────────────────────
-- TABLE: system_traces
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `lmdr-prod-db.lmdr_analytics.system_traces` (
  trace_id        STRING        NOT NULL,
  span_id         STRING,
  parent_span_id  STRING,
  operation       STRING,
  service         STRING,
  started_at      TIMESTAMP     NOT NULL,
  ended_at        TIMESTAMP,
  duration_ms     INT64,
  status          STRING,               -- success | error | timeout
  metadata        JSON
)
PARTITION BY DATE(started_at)
CLUSTER BY service, operation;

-- ─────────────────────────────────────────────
-- TABLE: ai_usage_log
-- Migrated from: Airtable v2_AIUsageLogs (via aiRouterService.jsw)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `lmdr-prod-db.lmdr_analytics.ai_usage_log` (
  log_id          STRING        NOT NULL,
  timestamp       TIMESTAMP     NOT NULL,
  provider        STRING,               -- anthropic | perplexity | gemini | openai | groq
  model           STRING,               -- claude-3-sonnet | gpt-4o | etc.
  function_name   STRING,               -- which backend function called AI
  input_tokens    INT64,
  output_tokens   INT64,
  cost_usd        FLOAT64,
  latency_ms      INT64,
  success         BOOL,
  carrier_dot     STRING,               -- if enrichment related
  driver_id       STRING                -- if driver related
)
PARTITION BY DATE(timestamp)
CLUSTER BY provider, function_name
OPTIONS (
  description = "AI provider usage, costs, and latency — for cost optimizer"
);

-- ─────────────────────────────────────────────
-- TABLE: audit_log
-- Migrated from: Airtable v2_AuditLog (via admin_audit_service.jsw)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `lmdr-prod-db.lmdr_analytics.audit_log` (
  audit_id        STRING        NOT NULL,
  timestamp       TIMESTAMP     NOT NULL,
  actor_id        STRING,               -- Wix member ID of who performed action
  actor_role      STRING,               -- admin | recruiter | driver
  action          STRING,               -- e.g. DELETE_DRIVER, APPROVE_CARRIER
  resource_type   STRING,               -- carrier | driver | subscription
  resource_id     STRING,
  before_state    JSON,
  after_state     JSON,
  ip_address      STRING,
  success         BOOL
)
PARTITION BY DATE(timestamp)
CLUSTER BY actor_role, action;

-- ─────────────────────────────────────────────
-- TABLE: match_events
-- New table — tracks every match score calculation
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `lmdr-prod-db.lmdr_analytics.match_events` (
  event_id        STRING        NOT NULL,
  timestamp       TIMESTAMP     NOT NULL,
  driver_id       STRING,
  carrier_dot     STRING,
  overall_score   FLOAT64,
  cdl_match       FLOAT64,
  experience_match FLOAT64,
  location_match  FLOAT64,
  pay_match       FLOAT64,
  match_type      STRING,               -- ai_matching | reverse_matching | manual
  resulted_in_application BOOL DEFAULT FALSE,
  resulted_in_hire        BOOL DEFAULT FALSE
)
PARTITION BY DATE(timestamp)
CLUSTER BY match_type;

-- ─────────────────────────────────────────────
-- TABLE: ai_provider_costs (for Cost Optimizer)
-- From: v2_AI Provider Costs (admin_utility_expansion)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS `lmdr-prod-db.lmdr_analytics.ai_provider_costs` (
  snapshot_id     STRING        NOT NULL,
  date            DATE          NOT NULL,
  provider        STRING,
  model           STRING,
  total_calls     INT64,
  total_input_tokens   INT64,
  total_output_tokens  INT64,
  total_cost_usd  FLOAT64,
  avg_latency_ms  FLOAT64,
  error_rate      FLOAT64,
  quality_score   FLOAT64
)
PARTITION BY date
CLUSTER BY provider;

-- ─────────────────────────────────────────────
-- VERIFICATION
-- ─────────────────────────────────────────────
SELECT
  table_name,
  row_count,
  size_bytes
FROM `lmdr-prod-db.lmdr_analytics.INFORMATION_SCHEMA.TABLE_STORAGE`
ORDER BY table_name;
