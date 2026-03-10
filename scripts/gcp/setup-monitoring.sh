#!/usr/bin/env bash
# ============================================================
# setup-monitoring.sh — LMDR GCP Observability Bootstrap
# Phase 4 Service 6: Cloud Monitoring, Logging, Uptime Checks
# Project: ldmr-velocitymatch
# ============================================================
set -euo pipefail

PROJECT_ID="ldmr-velocitymatch"
REGION="us-central1"
ALERT_EMAIL="ops@lastmiledr.app"
API_HOST="lmdr-api-140035137711.us-central1.run.app"
LOG_BUCKET="lmdr-logs"
LOG_SINK="lmdr-logs-sink"
LOG_RETENTION_DAYS=90

echo "============================================================"
echo "  LMDR GCP Monitoring Setup"
echo "  Project: ${PROJECT_ID}"
echo "  Region:  ${REGION}"
echo "============================================================"
echo ""

# Ensure gcloud is targeting the correct project
gcloud config set project "${PROJECT_ID}"

# ────────────────────────────────────────────────────────────
# 1. Email notification channel
# ────────────────────────────────────────────────────────────
echo "[1/6] Creating email notification channel for ${ALERT_EMAIL} ..."

CHANNEL_ID=$(
  gcloud alpha monitoring channels list \
    --project="${PROJECT_ID}" \
    --filter="type=email AND labels.email_address=${ALERT_EMAIL}" \
    --format="value(name)" \
    2>/dev/null | head -n1
)

if [[ -n "${CHANNEL_ID}" ]]; then
  echo "      Notification channel already exists: ${CHANNEL_ID}"
else
  CHANNEL_ID=$(
    gcloud alpha monitoring channels create \
      --project="${PROJECT_ID}" \
      --display-name="LMDR Ops Alerts" \
      --type=email \
      --channel-labels="email_address=${ALERT_EMAIL}" \
      --format="value(name)" \
      2>/dev/null
  )
  echo "      Created notification channel: ${CHANNEL_ID}"
fi

# ────────────────────────────────────────────────────────────
# 2. Alerting policy: High Error Rate (5xx > 1% over 5 min)
# ────────────────────────────────────────────────────────────
echo "[2/6] Creating alerting policy: High Error Rate (>1% 5xx) ..."

POLICY_ERROR_NAME="lmdr-high-error-rate"

EXISTING_ERROR=$(
  gcloud alpha monitoring policies list \
    --project="${PROJECT_ID}" \
    --filter="displayName=${POLICY_ERROR_NAME}" \
    --format="value(name)" \
    2>/dev/null | head -n1
)

if [[ -n "${EXISTING_ERROR}" ]]; then
  echo "      Policy '${POLICY_ERROR_NAME}' already exists: ${EXISTING_ERROR}"
else
  gcloud alpha monitoring policies create \
    --project="${PROJECT_ID}" \
    --policy='{
      "displayName": "'"${POLICY_ERROR_NAME}"'",
      "documentation": {
        "content": "Cloud Run 5xx error rate has exceeded 1% over a 5-minute window. Investigate recent deployments and application logs.",
        "mimeType": "text/markdown"
      },
      "conditions": [
        {
          "displayName": "5xx error rate > 1%",
          "conditionThreshold": {
            "filter": "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_count\" AND metric.labels.response_code_class=\"5xx\"",
            "aggregations": [
              {
                "alignmentPeriod": "300s",
                "perSeriesAligner": "ALIGN_RATE",
                "crossSeriesReducer": "REDUCE_SUM",
                "groupByFields": ["resource.labels.service_name"]
              }
            ],
            "comparison": "COMPARISON_GT",
            "thresholdValue": 0.01,
            "duration": "300s",
            "trigger": { "count": 1 }
          }
        }
      ],
      "alertStrategy": {
        "notificationRateLimit": { "period": "300s" }
      },
      "combiner": "OR",
      "enabled": true,
      "notificationChannels": ["'"${CHANNEL_ID}"'"]
    }' \
    2>/dev/null || echo "      Warning: could not create '${POLICY_ERROR_NAME}' (may already exist)"
  echo "      Created policy: ${POLICY_ERROR_NAME}"
fi

# ────────────────────────────────────────────────────────────
# 3. Alerting policy: High Latency (p95 > 2000ms over 5 min)
# ────────────────────────────────────────────────────────────
echo "[3/6] Creating alerting policy: High Latency (p95 > 2s) ..."

POLICY_LATENCY_NAME="lmdr-high-latency-p95"

EXISTING_LATENCY=$(
  gcloud alpha monitoring policies list \
    --project="${PROJECT_ID}" \
    --filter="displayName=${POLICY_LATENCY_NAME}" \
    --format="value(name)" \
    2>/dev/null | head -n1
)

if [[ -n "${EXISTING_LATENCY}" ]]; then
  echo "      Policy '${POLICY_LATENCY_NAME}' already exists: ${EXISTING_LATENCY}"
else
  gcloud alpha monitoring policies create \
    --project="${PROJECT_ID}" \
    --policy='{
      "displayName": "'"${POLICY_LATENCY_NAME}"'",
      "documentation": {
        "content": "Cloud Run p95 request latency has exceeded 2000ms over a 5-minute window. Check for slow queries, upstream dependencies, or cold-start spikes.",
        "mimeType": "text/markdown"
      },
      "conditions": [
        {
          "displayName": "p95 latency > 2000ms",
          "conditionThreshold": {
            "filter": "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_latencies\"",
            "aggregations": [
              {
                "alignmentPeriod": "300s",
                "perSeriesAligner": "ALIGN_PERCENTILE_95",
                "crossSeriesReducer": "REDUCE_MAX",
                "groupByFields": ["resource.labels.service_name"]
              }
            ],
            "comparison": "COMPARISON_GT",
            "thresholdValue": 2000,
            "duration": "300s",
            "trigger": { "count": 1 }
          }
        }
      ],
      "alertStrategy": {
        "notificationRateLimit": { "period": "300s" }
      },
      "combiner": "OR",
      "enabled": true,
      "notificationChannels": ["'"${CHANNEL_ID}"'"]
    }' \
    2>/dev/null || echo "      Warning: could not create '${POLICY_LATENCY_NAME}' (may already exist)"
  echo "      Created policy: ${POLICY_LATENCY_NAME}"
fi

# ────────────────────────────────────────────────────────────
# 4. Alerting policy: Cloud SQL connections > 80
# ────────────────────────────────────────────────────────────
echo "[4/6] Creating alerting policy: Cloud SQL connections > 80 ..."

POLICY_SQL_NAME="lmdr-cloudsql-connections-high"

EXISTING_SQL=$(
  gcloud alpha monitoring policies list \
    --project="${PROJECT_ID}" \
    --filter="displayName=${POLICY_SQL_NAME}" \
    --format="value(name)" \
    2>/dev/null | head -n1
)

if [[ -n "${EXISTING_SQL}" ]]; then
  echo "      Policy '${POLICY_SQL_NAME}' already exists: ${EXISTING_SQL}"
else
  gcloud alpha monitoring policies create \
    --project="${PROJECT_ID}" \
    --policy='{
      "displayName": "'"${POLICY_SQL_NAME}"'",
      "documentation": {
        "content": "Cloud SQL active connections have exceeded 80. This may indicate a connection pool leak or unexpected traffic spike. Review pg_stat_activity and Cloud Run concurrency settings.",
        "mimeType": "text/markdown"
      },
      "conditions": [
        {
          "displayName": "Cloud SQL connections > 80",
          "conditionThreshold": {
            "filter": "resource.type=\"cloudsql_database\" AND metric.type=\"cloudsql.googleapis.com/database/network/connections\"",
            "aggregations": [
              {
                "alignmentPeriod": "300s",
                "perSeriesAligner": "ALIGN_MEAN",
                "crossSeriesReducer": "REDUCE_MAX",
                "groupByFields": ["resource.labels.database_id"]
              }
            ],
            "comparison": "COMPARISON_GT",
            "thresholdValue": 80,
            "duration": "300s",
            "trigger": { "count": 1 }
          }
        }
      ],
      "alertStrategy": {
        "notificationRateLimit": { "period": "600s" }
      },
      "combiner": "OR",
      "enabled": true,
      "notificationChannels": ["'"${CHANNEL_ID}"'"]
    }' \
    2>/dev/null || echo "      Warning: could not create '${POLICY_SQL_NAME}' (may already exist)"
  echo "      Created policy: ${POLICY_SQL_NAME}"
fi

# ────────────────────────────────────────────────────────────
# 5. Cloud Logging bucket with 90-day retention
# ────────────────────────────────────────────────────────────
echo "[5/6] Creating Cloud Logging bucket '${LOG_BUCKET}' (${LOG_RETENTION_DAYS}-day retention) ..."

gcloud logging buckets create "${LOG_BUCKET}" \
  --project="${PROJECT_ID}" \
  --location="${REGION}" \
  --retention-days="${LOG_RETENTION_DAYS}" \
  --description="LMDR Cloud Run application logs — ${LOG_RETENTION_DAYS}-day retention" \
  2>/dev/null || echo "      Log bucket '${LOG_BUCKET}' already exists — skipping"

# Create (or update) the log sink routing Cloud Run logs to the bucket
SINK_DEST="logging.googleapis.com/projects/${PROJECT_ID}/locations/${REGION}/buckets/${LOG_BUCKET}"

EXISTING_SINK=$(
  gcloud logging sinks list \
    --project="${PROJECT_ID}" \
    --filter="name=${LOG_SINK}" \
    --format="value(name)" \
    2>/dev/null | head -n1
)

if [[ -n "${EXISTING_SINK}" ]]; then
  echo "      Log sink '${LOG_SINK}' already exists — updating destination ..."
  gcloud logging sinks update "${LOG_SINK}" \
    --project="${PROJECT_ID}" \
    --log-filter='resource.type="cloud_run_revision" AND resource.labels.service_name=~"lmdr-"' \
    --destination="${SINK_DEST}" \
    2>/dev/null || echo "      Warning: could not update sink '${LOG_SINK}'"
else
  gcloud logging sinks create "${LOG_SINK}" \
    "${SINK_DEST}" \
    --project="${PROJECT_ID}" \
    --log-filter='resource.type="cloud_run_revision" AND resource.labels.service_name=~"lmdr-"' \
    --description="Route lmdr-* Cloud Run logs to ${LOG_BUCKET} bucket" \
    2>/dev/null || echo "      Warning: could not create sink '${LOG_SINK}'"
  echo "      Created log sink: ${LOG_SINK} -> ${LOG_BUCKET}"
fi

# Grant the sink's writer identity permission to write to the bucket
SINK_SA=$(
  gcloud logging sinks describe "${LOG_SINK}" \
    --project="${PROJECT_ID}" \
    --format="value(writerIdentity)" \
    2>/dev/null
)

if [[ -n "${SINK_SA}" ]]; then
  echo "      Granting logBucketWriter to sink service account: ${SINK_SA} ..."
  gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
    --member="${SINK_SA}" \
    --role="roles/logging.bucketWriter" \
    --condition=None \
    2>/dev/null || echo "      Warning: IAM binding may already exist — skipping"
fi

# ────────────────────────────────────────────────────────────
# 6. Uptime check for lmdr-api /health endpoint
# ────────────────────────────────────────────────────────────
echo "[6/6] Creating uptime check for ${API_HOST}/health ..."

EXISTING_UPTIME=$(
  gcloud monitoring uptime list-configs \
    --project="${PROJECT_ID}" \
    --filter="displayName=lmdr-api-health" \
    --format="value(name)" \
    2>/dev/null | head -n1
)

if [[ -n "${EXISTING_UPTIME}" ]]; then
  echo "      Uptime check 'lmdr-api-health' already exists: ${EXISTING_UPTIME}"
else
  gcloud monitoring uptime create \
    --project="${PROJECT_ID}" \
    --display-name="lmdr-api-health" \
    --resource-type=uptime-url \
    --hostname="${API_HOST}" \
    --path="/health" \
    --port=443 \
    --use-ssl \
    --check-interval=60 \
    --timeout=10 \
    --regions="usa","europe","asia-pacific" \
    2>/dev/null || echo "      Warning: could not create uptime check (may already exist)"
  echo "      Created uptime check: ${API_HOST}/health"
fi

# ────────────────────────────────────────────────────────────
# Summary
# ────────────────────────────────────────────────────────────
echo ""
echo "============================================================"
echo "  Setup complete. Review in Cloud Console:"
echo ""
echo "  Alerting policies:"
echo "  https://console.cloud.google.com/monitoring/alerting?project=${PROJECT_ID}"
echo ""
echo "  Notification channels:"
echo "  https://console.cloud.google.com/monitoring/alerting/notifications?project=${PROJECT_ID}"
echo ""
echo "  Uptime checks:"
echo "  https://console.cloud.google.com/monitoring/uptime?project=${PROJECT_ID}"
echo ""
echo "  Log bucket (${LOG_BUCKET}):"
echo "  https://console.cloud.google.com/logs/storage?project=${PROJECT_ID}"
echo ""
echo "  Log sink (${LOG_SINK}):"
echo "  https://console.cloud.google.com/logs/router?project=${PROJECT_ID}"
echo "============================================================"
