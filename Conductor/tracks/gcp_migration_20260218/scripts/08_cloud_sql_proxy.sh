#!/bin/bash
# =============================================================================
# LMDR GCP Migration — Script 08: Cloud SQL Auth Proxy Setup
# Run this locally on your Windows machine BEFORE running the backfill script
# =============================================================================
# The Cloud SQL Auth Proxy allows your local Node.js backfill script to connect
# to Cloud SQL securely without exposing your instance to the public internet.
#
# HOW TO RUN:
#   1. Run this script in a PowerShell terminal (it will stay running in background)
#   2. In a SEPARATE terminal, run: node 07_backfill_airtable_to_sql.js --all
#   3. When backfill is done, stop the proxy with Ctrl+C
# =============================================================================

PROJECT_ID="lmdr-prod-db"
REGION="us-central1"
SQL_INSTANCE="lmdr-postgres"
KEY_FILE="./keys/wix-bridge-sa-key.json"

CONNECTION_NAME="$PROJECT_ID:$REGION:$SQL_INSTANCE"

echo "============================================"
echo " LMDR: Starting Cloud SQL Auth Proxy"
echo " Connection: $CONNECTION_NAME"
echo " Local Port: 5432"
echo "============================================"
echo ""

# Download the proxy if not already present (Windows-compatible URL)
if [ ! -f "./cloud-sql-proxy" ] && [ ! -f "./cloud-sql-proxy.exe" ]; then
  echo "→ Downloading Cloud SQL Auth Proxy ..."
  # Linux/Cloud Shell:
  curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.linux.amd64
  chmod +x cloud-sql-proxy
  echo "✓ Proxy downloaded."
  echo ""
  echo "   For Windows, download manually from:"
  echo "   https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.8.0/cloud-sql-proxy.x64.exe"
fi

echo "→ Starting proxy (will stay running — use Ctrl+C to stop) ..."
echo ""
echo "📋 Use these connection settings in your backfill script:"
echo "   PG_HOST=127.0.0.1"
echo "   PG_PORT=5432"
echo "   PG_DATABASE=lmdr"
echo "   PG_USER=lmdr_user"
echo "   PG_PASSWORD=<your password from script 01>"
echo ""

./cloud-sql-proxy \
  --credentials-file="$KEY_FILE" \
  "$CONNECTION_NAME"
