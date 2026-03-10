#!/bin/bash
# =============================================================================
# LMDR GCP Migration — Script 01b: Infrastructure on Existing Project
# Modified from 01_gcp_project_iam.sh — skips project creation & billing link
# (already done on ldmr-velocitymatch with billing 010822-6834A6-CE0B50)
# =============================================================================

set -euo pipefail

# ─────────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────────
PROJECT_ID="ldmr-velocitymatch"
BILLING_ACCOUNT_ID="010822-6834A6-CE0B50"
REGION="us-central1"
ZONE="us-central1-a"

# Cloud SQL
SQL_INSTANCE_NAME="lmdr-postgres"
SQL_TIER="db-custom-1-3840"
SQL_VERSION="POSTGRES_13"
SQL_DB_NAME="lmdr"
SQL_DB_USER="lmdr_user"
SQL_DB_PASSWORD="$(openssl rand -base64 24)"

# BigQuery
BQ_DATASET="lmdr_analytics"

# Service Account
SA_NAME="wix-bridge-sa"
SA_DISPLAY_NAME="LMDR External DB Bridge Service Account"

# Budget Alert
BUDGET_AMOUNT="100"

echo "============================================"
echo " LMDR GCP Infrastructure Setup (01b)"
echo " Project: $PROJECT_ID"
echo "============================================"
echo ""

# ─────────────────────────────────────────────
# STEP 1: Set active project & region
# ─────────────────────────────────────────────
echo "→ [1/7] Setting active project & region ..."
gcloud config set project "$PROJECT_ID"
gcloud config set compute/region "$REGION"
gcloud config set compute/zone "$ZONE"
echo "✓ Project set to $PROJECT_ID"
echo ""

# ─────────────────────────────────────────────
# STEP 2: Enable any missing APIs
# ─────────────────────────────────────────────
echo "→ [2/7] Ensuring all required APIs are enabled ..."
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
echo "→ [3/7] Creating Cloud SQL Postgres instance: $SQL_INSTANCE_NAME ..."
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
  --project="$PROJECT_ID"

echo "→ Creating database and user ..."
gcloud sql databases create "$SQL_DB_NAME" \
  --instance="$SQL_INSTANCE_NAME" \
  --project="$PROJECT_ID"

gcloud sql users create "$SQL_DB_USER" \
  --instance="$SQL_INSTANCE_NAME" \
  --password="$SQL_DB_PASSWORD" \
  --project="$PROJECT_ID"

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
echo "→ [4/7] Creating BigQuery dataset: $BQ_DATASET ..."
bq --location="US" mk \
  --dataset \
  --description="LMDR Analytics Data Lake" \
  "$PROJECT_ID:$BQ_DATASET"
echo "✓ BigQuery dataset created."
echo ""

# ─────────────────────────────────────────────
# STEP 5: Create Service Account
# ─────────────────────────────────────────────
echo "→ [5/7] Creating Service Account: $SA_NAME ..."
gcloud iam service-accounts create "$SA_NAME" \
  --display-name="$SA_DISPLAY_NAME" \
  --project="$PROJECT_ID"

SA_EMAIL="$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"
echo "   Service Account Email: $SA_EMAIL"
echo ""

# ─────────────────────────────────────────────
# STEP 6: Grant IAM Roles
# ─────────────────────────────────────────────
echo "→ [6/7] Granting IAM roles ..."

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/cloudsql.editor"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/bigquery.admin"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:$SA_EMAIL" \
  --role="roles/run.invoker"

echo "✓ IAM roles granted to $SA_EMAIL"
echo ""

# ─────────────────────────────────────────────
# STEP 7: Download Service Account Key
# ─────────────────────────────────────────────
echo "→ [7/7] Downloading service account key ..."
mkdir -p ./keys
gcloud iam service-accounts keys create "./keys/$SA_NAME-key.json" \
  --iam-account="$SA_EMAIL" \
  --project="$PROJECT_ID"

echo "✓ Key saved to ./keys/$SA_NAME-key.json"
echo "   ⚠️  KEEP THIS FILE SECURE — DO NOT COMMIT TO GIT"
echo ""

# ─────────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────────
echo "============================================"
echo " PHASE 1 COMPLETE ✓"
echo "============================================"
echo ""
echo "📋 Save these values for script 02:"
echo "   PROJECT_ID:           $PROJECT_ID"
echo "   SQL_CONNECTION_NAME:  $SQL_CONNECTION_NAME"
echo "   SQL_DB_NAME:          $SQL_DB_NAME"
echo "   SQL_DB_USER:          $SQL_DB_USER"
echo "   SQL_DB_PASSWORD:      $SQL_DB_PASSWORD  ← SAVE THIS"
echo "   SA_EMAIL:             $SA_EMAIL"
echo "   BQ_DATASET:           $BQ_DATASET"
echo ""
echo "→ NEXT STEP: Run 02_secret_manager.sh"
