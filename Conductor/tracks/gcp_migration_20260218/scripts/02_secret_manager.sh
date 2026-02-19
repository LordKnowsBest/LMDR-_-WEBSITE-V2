#!/bin/bash
# =============================================================================
# LMDR GCP Migration — Script 02: Secret Manager Setup
# Phase 1.2 | Run AFTER 01_gcp_project_iam.sh
# =============================================================================
# HOW TO RUN (in Cloud Shell):
#   bash 02_secret_manager.sh
# =============================================================================

set -euo pipefail

# ─────────────────────────────────────────────
# CONFIGURATION — Copy values from Script 01 output
# ─────────────────────────────────────────────
PROJECT_ID="lmdr-prod-db"

# From Script 01 output:
SQL_CONNECTION_NAME="lmdr-prod-db:us-central1:lmdr-postgres"  # <-- Replace with actual
SQL_DB_NAME="lmdr"
SQL_DB_USER="lmdr_user"
SQL_DB_PASSWORD="REPLACE_WITH_PASSWORD_FROM_SCRIPT_01"          # <-- Replace with actual

# Generate a strong SECRET_KEY for Wix ↔ Cloud Run authentication
SECRET_KEY="$(openssl rand -hex 32)"

echo "============================================"
echo " LMDR: Secret Manager Setup"
echo "============================================"
echo ""
echo "→ Using project: $PROJECT_ID"
echo ""

# ─────────────────────────────────────────────
# Helper function to create a secret
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
      # Secret already exists — add a new version
      echo "   Secret exists, adding new version..."
      echo -n "$VALUE" | gcloud secrets versions add "$NAME" \
        --data-file=- \
        --project="$PROJECT_ID"
    }
  echo "✓ $NAME created."
}

# ─────────────────────────────────────────────
# CORE SECRETS (required by all Wix adaptors)
# ─────────────────────────────────────────────
echo "--- Core Secrets (All Databases) ---"

create_secret "SECRET_KEY" "$SECRET_KEY"

# PERMISSIONS secret — defines who can read/write each table
# Adjust role arrays ('Admin', 'Member', 'Visitor') per your requirements
cat > /tmp/permissions.json << 'EOF'
{
  "collectionPermissions": [
    {
      "id": "carriers",
      "read": ["Admin", "Member"],
      "write": ["Admin"]
    },
    {
      "id": "driver_profiles",
      "read": ["Admin", "Member"],
      "write": ["Admin", "Member"]
    },
    {
      "id": "driver_jobs",
      "read": ["Admin", "Member", "Visitor"],
      "write": ["Admin"]
    },
    {
      "id": "driver_applications",
      "read": ["Admin", "Member"],
      "write": ["Admin", "Member"]
    },
    {
      "id": "messages",
      "read": ["Admin", "Member"],
      "write": ["Admin", "Member"]
    },
    {
      "id": "carrier_subscriptions",
      "read": ["Admin"],
      "write": ["Admin"]
    },
    {
      "id": "matching_scores",
      "read": ["Admin", "Member"],
      "write": ["Admin"]
    },
    {
      "id": "faqs",
      "read": ["Admin", "Member", "Visitor"],
      "write": ["Admin"]
    },
    {
      "id": "blog_posts",
      "read": ["Admin", "Member", "Visitor"],
      "write": ["Admin"]
    },
    {
      "id": "compliance_guides",
      "read": ["Admin", "Member", "Visitor"],
      "write": ["Admin"]
    }
  ]
}
EOF

gcloud secrets create "PERMISSIONS" \
  --data-file="/tmp/permissions.json" \
  --project="$PROJECT_ID" \
  --replication-policy="automatic" \
  2>/dev/null || \
gcloud secrets versions add "PERMISSIONS" \
  --data-file="/tmp/permissions.json" \
  --project="$PROJECT_ID"
echo "✓ PERMISSIONS secret created."
rm /tmp/permissions.json

echo ""

# ─────────────────────────────────────────────
# POSTGRES-SPECIFIC SECRETS
# ─────────────────────────────────────────────
echo "--- Cloud SQL (Postgres) Secrets ---"

create_secret "USER"                     "$SQL_DB_USER"
create_secret "PASSWORD"                 "$SQL_DB_PASSWORD"
create_secret "DB"                       "$SQL_DB_NAME"
create_secret "CLOUD_SQL_CONNECTION_NAME" "$SQL_CONNECTION_NAME"

echo ""

# ─────────────────────────────────────────────
# BIGQUERY-SPECIFIC SECRETS
# ─────────────────────────────────────────────
echo "--- BigQuery Secrets ---"

create_secret "DATABASE_ID"   "lmdr_analytics"
create_secret "PROJECT_ID_BQ" "$PROJECT_ID"

echo ""

# ─────────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────────
echo "============================================"
echo " PHASE 1.2 COMPLETE ✓"
echo "============================================"
echo ""
echo "📋 IMPORTANT — Save these values:"
echo "   SECRET_KEY: $SECRET_KEY"
echo "   (You'll need SECRET_KEY when registering the external collection in Wix)"
echo ""
echo "🔍 Verify secrets in console:"
echo "   https://console.cloud.google.com/security/secret-manager?project=$PROJECT_ID"
echo ""
echo "→ NEXT STEP: Run 03_cloud_run_deploy.sh"
