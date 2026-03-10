#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# setup-scheduler.sh
#
# Creates the Cloud Scheduler service account and schedules all 6 LMDR cron
# jobs.  Safe to re-run — every gcloud command is idempotent.
#
# Usage:
#   chmod +x scripts/gcp/setup-scheduler.sh
#   ./scripts/gcp/setup-scheduler.sh
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
PROJECT="ldmr-velocitymatch"
REGION="us-central1"
API_URL="https://lmdr-api-140035137711.us-central1.run.app"
SA_NAME="lmdr-scheduler"
SA_EMAIL="${SA_NAME}@${PROJECT}.iam.gserviceaccount.com"
SERVICE_NAME="lmdr-api"

echo "==> [scheduler] Project : ${PROJECT}"
echo "==> [scheduler] Region  : ${REGION}"
echo "==> [scheduler] API URL : ${API_URL}"
echo ""

# ── 1. Enable required APIs ───────────────────────────────────────────────────
echo "==> [1/3] Enabling Cloud Scheduler API..."
gcloud services enable cloudscheduler.googleapis.com \
  --project="${PROJECT}"

# ── 2. Service account ────────────────────────────────────────────────────────
echo ""
echo "==> [2/3] Creating service account '${SA_NAME}'..."

# Create SA (idempotent — silently succeeds if already exists)
gcloud iam service-accounts create "${SA_NAME}" \
  --project="${PROJECT}" \
  --display-name="LMDR Cloud Scheduler" \
  --description="Invokes Cloud Run job endpoints on schedule" \
  2>/dev/null || echo "     (service account already exists — skipping creation)"

# Grant roles/run.invoker on the lmdr-api service only (least privilege)
echo "     Granting roles/run.invoker on Cloud Run service '${SERVICE_NAME}'..."
gcloud run services add-iam-policy-binding "${SERVICE_NAME}" \
  --project="${PROJECT}" \
  --region="${REGION}" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.invoker"

# ── 3. Scheduled jobs ─────────────────────────────────────────────────────────
echo ""
echo "==> [3/3] Creating / updating Cloud Scheduler jobs..."

# Helper: create-or-update a scheduler job
# Usage: upsert_job <name> <schedule> <uri> <timeout>
upsert_job() {
  local JOB_NAME="$1"
  local SCHEDULE="$2"
  local URI="$3"
  local TIMEOUT="$4"

  echo "     Job: ${JOB_NAME}  schedule='${SCHEDULE}'  timeout=${TIMEOUT}"

  # Attempt create; if it already exists, update instead
  if gcloud scheduler jobs describe "${JOB_NAME}" \
       --project="${PROJECT}" \
       --location="${REGION}" \
       &>/dev/null; then

    gcloud scheduler jobs update http "${JOB_NAME}" \
      --project="${PROJECT}" \
      --location="${REGION}" \
      --schedule="${SCHEDULE}" \
      --uri="${URI}" \
      --http-method="POST" \
      --oidc-service-account-email="${SA_EMAIL}" \
      --oidc-token-audience="${API_URL}" \
      --attempt-deadline="${TIMEOUT}" \
      --time-zone="UTC" \
      --message-body="{}" \
      --headers="Content-Type=application/json"
  else
    gcloud scheduler jobs create http "${JOB_NAME}" \
      --project="${PROJECT}" \
      --location="${REGION}" \
      --schedule="${SCHEDULE}" \
      --uri="${URI}" \
      --http-method="POST" \
      --oidc-service-account-email="${SA_EMAIL}" \
      --oidc-token-audience="${API_URL}" \
      --attempt-deadline="${TIMEOUT}" \
      --time-zone="UTC" \
      --message-body="{}" \
      --headers="Content-Type=application/json"
  fi
}

# ┌─────────────────────────────────────────────────────────────────────────────
# │  Job definitions
# └─────────────────────────────────────────────────────────────────────────────
#  Name                      Schedule (UTC)      Endpoint                           Timeout
upsert_job \
  "lmdr-compliance-refresh" \
  "0 7 * * *" \
  "${API_URL}/v1/jobs/compliance-refresh" \
  "600s"

upsert_job \
  "lmdr-weekly-earnings-digest" \
  "0 11 * * 1" \
  "${API_URL}/v1/jobs/weekly-earnings-digest" \
  "300s"

upsert_job \
  "lmdr-hourly-board-refresh" \
  "0 * * * *" \
  "${API_URL}/v1/jobs/board-refresh" \
  "120s"

upsert_job \
  "lmdr-rtdb-cleanup" \
  "0 */6 * * *" \
  "${API_URL}/v1/jobs/rtdb-cleanup" \
  "120s"

upsert_job \
  "lmdr-monthly-invoices" \
  "0 6 1 * *" \
  "${API_URL}/v1/jobs/monthly-invoices" \
  "900s"

upsert_job \
  "lmdr-weekly-rag-refresh" \
  "0 9 * * 0" \
  "${API_URL}/v1/jobs/rag-refresh" \
  "600s"

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "==> Done. Current scheduler jobs:"
gcloud scheduler jobs list \
  --project="${PROJECT}" \
  --location="${REGION}"
