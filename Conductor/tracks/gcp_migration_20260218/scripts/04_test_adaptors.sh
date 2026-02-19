#!/bin/bash
# =============================================================================
# LMDR GCP Migration — Script 04: Test Adaptor Services
# Phase 1.3 Test | Run AFTER 03_cloud_run_deploy.sh
# =============================================================================
# Tests both Cloud Run adaptors by calling their /provision endpoint.
# Expected output: JSON listing all tables in your database.
#
# HOW TO RUN (in Cloud Shell):
#   bash 04_test_adaptors.sh
# =============================================================================

set -euo pipefail

# ─────────────────────────────────────────────
# CONFIGURATION — Replace with values from script 03 output
# ─────────────────────────────────────────────
PROJECT_ID="lmdr-prod-db"
REGION="us-central1"

POSTGRES_SERVICE="lmdr-velo-postgres"
BIGQUERY_SERVICE="lmdr-velo-bigquery"

# Get the SECRET_KEY from Secret Manager
echo "→ Retrieving SECRET_KEY from Secret Manager ..."
SECRET_KEY=$(gcloud secrets versions access latest \
  --secret="SECRET_KEY" \
  --project="$PROJECT_ID")

# Get Cloud Run URLs
POSTGRES_URL=$(gcloud run services describe "$POSTGRES_SERVICE" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --format="value(status.url)")

BIGQUERY_URL=$(gcloud run services describe "$BIGQUERY_SERVICE" \
  --region="$REGION" \
  --project="$PROJECT_ID" \
  --format="value(status.url)")

echo ""
echo "============================================"
echo " Testing: Postgres Adaptor"
echo " URL: $POSTGRES_URL"
echo "============================================"

POSTGRES_RESULT=$(curl -s -X POST \
  "$POSTGRES_URL/provision" \
  -H "Content-Type: application/json" \
  -d "{\"requestContext\":{\"secretKey\":\"$SECRET_KEY\"}}")

echo "$POSTGRES_RESULT" | python3 -m json.tool 2>/dev/null || echo "$POSTGRES_RESULT"
echo ""

# Check for success
if echo "$POSTGRES_RESULT" | grep -q "tables\|collections"; then
  echo "✓ Postgres adaptor is WORKING — tables found in response."
else
  echo "✗ Postgres adaptor test FAILED — check Cloud Run logs:"
  echo "  gcloud run services logs read $POSTGRES_SERVICE --region=$REGION --project=$PROJECT_ID"
fi

echo ""
echo "============================================"
echo " Testing: BigQuery Adaptor"
echo " URL: $BIGQUERY_URL"
echo "============================================"

BIGQUERY_RESULT=$(curl -s -X POST \
  "$BIGQUERY_URL/provision" \
  -H "Content-Type: application/json" \
  -d "{\"requestContext\":{\"secretKey\":\"$SECRET_KEY\"}}")

echo "$BIGQUERY_RESULT" | python3 -m json.tool 2>/dev/null || echo "$BIGQUERY_RESULT"
echo ""

if echo "$BIGQUERY_RESULT" | grep -q "tables\|collections"; then
  echo "✓ BigQuery adaptor is WORKING — datasets found in response."
else
  echo "✗ BigQuery adaptor test FAILED — check Cloud Run logs:"
  echo "  gcloud run services logs read $BIGQUERY_SERVICE --region=$REGION --project=$PROJECT_ID"
fi

echo ""
echo "============================================"
echo " TEST COMPLETE"
echo "============================================"
echo ""
echo "📋 Values needed to register in Wix Editor:"
echo "   Postgres URL:  $POSTGRES_URL"
echo "   BigQuery URL:  $BIGQUERY_URL"
echo "   Secret Key:    $SECRET_KEY"
echo ""
echo "→ NEXT STEP: Register external databases in Wix Editor"
echo "   Code Sidebar → External Databases → Add external database → Google Cloud"
