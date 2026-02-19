#!/bin/bash
# =============================================================================
# LMDR GCP Migration — Script 03: Cloud Run Adaptor Deployment
# Phase 1.3 | Run AFTER 02_secret_manager.sh
# =============================================================================
# Deploys the official Wix `velo-external-db` prebuilt container to Cloud Run.
# This is the adaptor that bridges your Wix site to Cloud SQL / BigQuery.
#
# HOW TO RUN (in Cloud Shell):
#   bash 03_cloud_run_deploy.sh
# =============================================================================

set -euo pipefail

# ─────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────
PROJECT_ID="lmdr-prod-db"
REGION="us-central1"
SA_NAME="wix-bridge-sa"
SA_EMAIL="$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"

# Official Wix prebuilt container image
CONTAINER_IMAGE="gcr.io/wix-velo-api/velo-external-db"

# We deploy two separate Cloud Run services:
# One for Postgres (operational data), one for BigQuery (analytics)
POSTGRES_SERVICE_NAME="lmdr-velo-postgres"
BIGQUERY_SERVICE_NAME="lmdr-velo-bigquery"

echo "============================================"
echo " LMDR: Cloud Run Adaptor Deployment"
echo "============================================"
echo ""

# ─────────────────────────────────────────────
# STEP 1: Grant Cloud Run Service Account access to secrets
# ─────────────────────────────────────────────
echo "→ [1/4] Granting Secret Manager access to Cloud Run service account ..."
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/secretmanager.secretAccessor"
echo "✓ Secret Manager access granted."
echo ""

# ─────────────────────────────────────────────
# STEP 2: Deploy Cloud Run — Postgres Adaptor
# ─────────────────────────────────────────────
echo "→ [2/4] Deploying Postgres Cloud Run adaptor: $POSTGRES_SERVICE_NAME ..."
echo "   (This takes 2-3 minutes)"

gcloud run deploy "$POSTGRES_SERVICE_NAME" \
  --image="$CONTAINER_IMAGE" \
  --platform=managed \
  --region="$REGION" \
  --service-account="$SA_EMAIL" \
  --allow-unauthenticated \
  --min-instances=0 \
  --max-instances=10 \
  --memory=512Mi \
  --cpu=1 \
  --timeout=30s \
  --add-cloudsql-instances="$PROJECT_ID:$REGION:lmdr-postgres" \
  --set-env-vars="NAME=postgres,CLOUD_VENDOR=gcp" \
  --set-secrets="\
SECRET_KEY=SECRET_KEY:latest,\
PERMISSIONS=PERMISSIONS:latest,\
USER=USER:latest,\
PASSWORD=PASSWORD:latest,\
DB=DB:latest,\
CLOUD_SQL_CONNECTION_NAME=CLOUD_SQL_CONNECTION_NAME:latest" \
  --project="$PROJECT_ID"

# Capture the Postgres service URL
POSTGRES_URL=$(gcloud run services describe "$POSTGRES_SERVICE_NAME" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --format="value(status.url)")

echo "✓ Postgres adaptor deployed."
echo "   URL: $POSTGRES_URL"
echo ""

# ─────────────────────────────────────────────
# STEP 3: Deploy Cloud Run — BigQuery Adaptor
# ─────────────────────────────────────────────
echo "→ [3/4] Deploying BigQuery Cloud Run adaptor: $BIGQUERY_SERVICE_NAME ..."

gcloud run deploy "$BIGQUERY_SERVICE_NAME" \
  --image="$CONTAINER_IMAGE" \
  --platform=managed \
  --region="$REGION" \
  --service-account="$SA_EMAIL" \
  --allow-unauthenticated \
  --min-instances=0 \
  --max-instances=5 \
  --memory=512Mi \
  --cpu=1 \
  --timeout=60s \
  --set-env-vars="NAME=bigquery,CLOUD_VENDOR=gcp" \
  --set-secrets="\
SECRET_KEY=SECRET_KEY:latest,\
PERMISSIONS=PERMISSIONS:latest,\
DATABASE_ID=DATABASE_ID:latest,\
PROJECT_ID_BQ=PROJECT_ID_BQ:latest" \
  --project="$PROJECT_ID"

# Capture the BigQuery service URL
BIGQUERY_URL=$(gcloud run services describe "$BIGQUERY_SERVICE_NAME" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --format="value(status.url)")

echo "✓ BigQuery adaptor deployed."
echo "   URL: $BIGQUERY_URL"
echo ""

# ─────────────────────────────────────────────
# STEP 4: Verify deployments
# ─────────────────────────────────────────────
echo "→ [4/4] Verifying deployments ..."
gcloud run services list \
  --platform=managed \
  --region="$REGION" \
  --project="$PROJECT_ID"
echo ""

# ─────────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────────
echo "============================================"
echo " PHASE 1.3 COMPLETE ✓"
echo "============================================"
echo ""
echo "📋 Cloud Run Adaptor URLs (needed for Wix CMS registration):"
echo ""
echo "   POSTGRES Adaptor:  $POSTGRES_URL"
echo "   BIGQUERY Adaptor:  $BIGQUERY_URL"
echo ""
echo "→ NEXT STEP: Run 04_test_adaptors.sh to verify both services"
echo ""
echo "→ THEN: Register external databases in Wix Editor:"
echo "   Code Sidebar → External Databases → Add external database"
echo "   - Choose: Google Cloud"
echo "   - Namespace: gcp_core  →  URL: $POSTGRES_URL"
echo "   - Namespace: gcp_analytics  →  URL: $BIGQUERY_URL"
echo "   - Secret Key: (value saved from Script 02)"
