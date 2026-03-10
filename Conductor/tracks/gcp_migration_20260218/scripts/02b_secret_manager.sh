#!/bin/bash
# =============================================================================
# LMDR GCP Migration — Script 02b: Secret Manager Setup
# Modified — values pre-filled from 01b output, Windows-compatible
# =============================================================================

set -euo pipefail

# ─────────────────────────────────────────────
# CONFIGURATION — Pre-filled from Script 01b
# ─────────────────────────────────────────────
PROJECT_ID="ldmr-velocitymatch"
SQL_CONNECTION_NAME="ldmr-velocitymatch:us-central1:lmdr-postgres"
SQL_DB_NAME="lmdr"
SQL_DB_USER="lmdr_user"
SQL_DB_PASSWORD="cht7nLOGcOxpNm2ruPhO6ScqKBeqsF4o"
SECRET_KEY="$(openssl rand -hex 32)"

echo "============================================"
echo " LMDR: Secret Manager Setup (02b)"
echo " Project: $PROJECT_ID"
echo "============================================"
echo ""

# ─────────────────────────────────────────────
# Helper: create or update a secret
# ─────────────────────────────────────────────
create_secret() {
  local NAME=$1
  local VALUE=$2
  echo "→ Creating secret: $NAME ..."
  echo -n "$VALUE" | gcloud secrets create "$NAME" \
    --data-file=- \
    --project="$PROJECT_ID" \
    --replication-policy="automatic" \
    2>/dev/null || {
      echo "   Secret exists — adding new version..."
      echo -n "$VALUE" | gcloud secrets versions add "$NAME" \
        --data-file=- \
        --project="$PROJECT_ID"
    }
  echo "✓ $NAME stored."
}

# ─────────────────────────────────────────────
# CORE SECRETS
# ─────────────────────────────────────────────
echo "--- Core Secrets ---"
create_secret "SECRET_KEY" "$SECRET_KEY"

# ─────────────────────────────────────────────
# CLOUD SQL SECRETS
# ─────────────────────────────────────────────
echo ""
echo "--- Cloud SQL (Postgres) Secrets ---"
create_secret "DB_USER"               "$SQL_DB_USER"
create_secret "DB_PASSWORD"           "$SQL_DB_PASSWORD"
create_secret "DB_NAME"               "$SQL_DB_NAME"
create_secret "CLOUD_SQL_CONNECTION"  "$SQL_CONNECTION_NAME"

# ─────────────────────────────────────────────
# BIGQUERY SECRETS
# ─────────────────────────────────────────────
echo ""
echo "--- BigQuery Secrets ---"
create_secret "BQ_DATASET"    "lmdr_analytics"
create_secret "BQ_PROJECT_ID" "$PROJECT_ID"

# ─────────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────────
echo ""
echo "============================================"
echo " PHASE 1.2 COMPLETE ✓"
echo "============================================"
echo ""
echo "📋 Save this SECRET_KEY — needed for Cloud Run auth:"
echo "   SECRET_KEY: $SECRET_KEY"
echo ""
echo "🔍 Verify at:"
echo "   https://console.cloud.google.com/security/secret-manager?project=$PROJECT_ID"
echo ""
echo "→ NEXT STEP: Run 03_cloud_run_deploy.sh"
