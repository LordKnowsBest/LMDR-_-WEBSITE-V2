#!/bin/bash
# =============================================================================
# LMDR GCP Migration — Script 01: Project, IAM, & Database Infrastructure
# Phase 1.1 | Run in Google Cloud Shell or locally with gcloud CLI installed
# =============================================================================
# HOW TO RUN:
#   1. Go to https://console.cloud.google.com
#   2. Click the >_ (Cloud Shell) button in the top-right toolbar
#   3. Upload this file or paste its contents
#   4. Run: bash 01_gcp_project_iam.sh
#
# PREREQUISITES:
#   - A Google account with billing enabled
#   - A GCP Billing Account ID (find at: https://console.cloud.google.com/billing)
# =============================================================================

set -euo pipefail  # Exit on error, unset var, or pipe failure

# ─────────────────────────────────────────────
# CONFIGURATION — Edit these before running
# ─────────────────────────────────────────────
PROJECT_ID="lmdr-prod-db"
PROJECT_NAME="LMDR Production Database"
BILLING_ACCOUNT_ID="XXXXXX-XXXXXX-XXXXXX"   # <-- Replace with your Billing Account ID
REGION="us-central1"
ZONE="us-central1-a"

# Cloud SQL
SQL_INSTANCE_NAME="lmdr-postgres"
SQL_TIER="db-custom-1-3840"           # 1 vCPU, 3.75GB RAM
SQL_VERSION="POSTGRES_13"             # Wix adaptor supports Postgres 12 & 13
SQL_DB_NAME="lmdr"
SQL_DB_USER="lmdr_user"
SQL_DB_PASSWORD="$(openssl rand -base64 24)"  # Auto-generated secure password

# BigQuery
BQ_DATASET="lmdr_analytics"

# Service Account
SA_NAME="wix-bridge-sa"
SA_DISPLAY_NAME="Wix External DB Bridge Service Account"

# Budget Alert
BUDGET_AMOUNT="100"   # USD per month

echo "============================================"
echo " LMDR GCP Infrastructure Setup"
echo "============================================"
echo ""

# ─────────────────────────────────────────────
# STEP 1: Create & Configure GCP Project
# ─────────────────────────────────────────────
echo "→ [1/8] Creating GCP Project: $PROJECT_ID ..."
gcloud projects create "$PROJECT_ID" \
  --name="$PROJECT_NAME" \
  --set-as-default

echo "→ Linking billing account ..."
gcloud billing projects link "$PROJECT_ID" \
  --billing-account="$BILLING_ACCOUNT_ID"

gcloud config set project "$PROJECT_ID"
gcloud config set compute/region "$REGION"
gcloud config set compute/zone "$ZONE"

echo "✓ Project created and billing linked."
echo ""

# ─────────────────────────────────────────────
# STEP 2: Enable Required APIs
# ─────────────────────────────────────────────
echo "→ [2/8] Enabling GCP APIs ..."
gcloud services enable \
  sqladmin.googleapis.com \
  bigquery.googleapis.com \
  bigquerystorage.googleapis.com \
  secretmanager.googleapis.com \
  run.googleapis.com \
  iam.googleapis.com \
  cloudbilling.googleapis.com \
  billingbudgets.googleapis.com \
  cloudresourcemanager.googleapis.com \
  --project="$PROJECT_ID"

echo "✓ APIs enabled."
echo ""

# ─────────────────────────────────────────────
# STEP 3: Create Cloud SQL (Postgres 13) Instance
# ─────────────────────────────────────────────
echo "→ [3/8] Creating Cloud SQL Postgres instance: $SQL_INSTANCE_NAME ..."
echo "   (This takes 3-5 minutes)"

gcloud sql instances create "$SQL_INSTANCE_NAME" \
  --database-version="$SQL_VERSION" \
  --tier="$SQL_TIER" \
  --region="$REGION" \
  --storage-type=SSD \
  --storage-size=10GB \
  --storage-auto-increase \
  --backup \
  --backup-start-time="02:00" \
  --availability-type=zonal \
  --no-assign-ip \
  --network=default \
  --project="$PROJECT_ID"

echo "→ Creating database and user ..."
gcloud sql databases create "$SQL_DB_NAME" \
  --instance="$SQL_INSTANCE_NAME" \
  --project="$PROJECT_ID"

gcloud sql users create "$SQL_DB_USER" \
  --instance="$SQL_INSTANCE_NAME" \
  --password="$SQL_DB_PASSWORD" \
  --project="$PROJECT_ID"

# Capture the Cloud SQL connection name (needed for Secret Manager later)
SQL_CONNECTION_NAME=$(gcloud sql instances describe "$SQL_INSTANCE_NAME" \
  --project="$PROJECT_ID" \
  --format="value(connectionName)")

echo "✓ Cloud SQL instance created."
echo "   Connection Name: $SQL_CONNECTION_NAME"
echo "   DB Password (SAVE THIS NOW): $SQL_DB_PASSWORD"
echo ""

# ─────────────────────────────────────────────
# STEP 4: Create BigQuery Dataset
# ─────────────────────────────────────────────
echo "→ [4/8] Creating BigQuery dataset: $BQ_DATASET ..."
bq --location="$REGION" mk \
  --dataset \
  --description="LMDR Analytics Data Lake - System Logs, AI Usage, Match Events" \
  "$PROJECT_ID:$BQ_DATASET"

echo "✓ BigQuery dataset created."
echo ""

# ─────────────────────────────────────────────
# STEP 5: Create Service Account
# ─────────────────────────────────────────────
echo "→ [5/8] Creating Service Account: $SA_NAME ..."
gcloud iam service-accounts create "$SA_NAME" \
  --display-name="$SA_DISPLAY_NAME" \
  --project="$PROJECT_ID"

SA_EMAIL="$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"
echo "   Service Account Email: $SA_EMAIL"

# ─────────────────────────────────────────────
# STEP 6: Grant IAM Roles to Service Account
# ─────────────────────────────────────────────
echo "→ [6/8] Granting IAM roles ..."

# Secret Manager access (required for Cloud Run adaptor)
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/secretmanager.secretAccessor"

# Cloud SQL access
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/cloudsql.editor"

# BigQuery access
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/bigquery.admin"

# Cloud Run invoker (for service-to-service calls)
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/run.invoker"

echo "✓ IAM roles granted to $SA_EMAIL"
echo ""

# ─────────────────────────────────────────────
# STEP 7: Download Service Account Key (for local backfill scripts)
# ─────────────────────────────────────────────
echo "→ [7/8] Downloading service account key ..."
mkdir -p ./keys
gcloud iam service-accounts keys create "./keys/$SA_NAME-key.json" \
  --iam-account="$SA_EMAIL" \
  --project="$PROJECT_ID"

echo "✓ Key saved to ./keys/$SA_NAME-key.json"
echo "   ⚠️  KEEP THIS FILE SECURE — DO NOT COMMIT TO GIT"
echo ""

# ─────────────────────────────────────────────
# STEP 8: Create Billing Budget Alert ($100/mo)
# ─────────────────────────────────────────────
echo "→ [8/8] Creating billing budget alert ($${BUDGET_AMOUNT}/month) ..."
# Note: Billing budgets require the Billing Budgets API and billing admin role
# This uses gcloud alpha (may require: gcloud components install alpha)
gcloud beta billing budgets create \
  --billing-account="$BILLING_ACCOUNT_ID" \
  --display-name="LMDR GCP Budget Alert" \
  --budget-amount="${BUDGET_AMOUNT}USD" \
  --threshold-rule=percent=0.8 \
  --threshold-rule=percent=1.0 \
  --project="$PROJECT_ID" \
  2>/dev/null || echo "   ⚠️  Budget alert creation requires Billing Admin role."
echo "   If the above failed, set budget manually at:"
echo "   https://console.cloud.google.com/billing/budgets"
echo ""

# ─────────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────────
echo "============================================"
echo " PHASE 1.1 COMPLETE ✓"
echo "============================================"
echo ""
echo "📋 Variables for next script (02_secret_manager.sh):"
echo "   PROJECT_ID:           $PROJECT_ID"
echo "   SQL_CONNECTION_NAME:  $SQL_CONNECTION_NAME"
echo "   SQL_DB_NAME:          $SQL_DB_NAME"
echo "   SQL_DB_USER:          $SQL_DB_USER"
echo "   SQL_DB_PASSWORD:      $SQL_DB_PASSWORD  ← SAVE THIS"
echo "   SA_EMAIL:             $SA_EMAIL"
echo "   BQ_DATASET:           $BQ_DATASET"
echo ""
echo "→ NEXT STEP: Run 02_secret_manager.sh"
