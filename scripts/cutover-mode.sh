#!/bin/bash
# =============================================================================
# LMDR: Set GCP Migration Mode
# =============================================================================
# Usage:
#   bash scripts/cutover-mode.sh off       # All traffic to Airtable (default)
#   bash scripts/cutover-mode.sh dual      # Read from Cloud Run, write both
#   bash scripts/cutover-mode.sh cloudrun  # All traffic to Cloud Run
#
# This updates the Wix secret 'GCP_MIGRATION_MODE' which dataAccess.jsw
# reads every 60 seconds. No redeployment needed.
# =============================================================================
set -euo pipefail

MODE=${1:?Usage: cutover-mode.sh <off|dual|cloudrun>}

if [[ "$MODE" != "off" && "$MODE" != "dual" && "$MODE" != "cloudrun" ]]; then
  echo "ERROR: Mode must be 'off', 'dual', or 'cloudrun'"
  exit 1
fi

echo "============================================"
echo " LMDR: GCP Migration Mode Cutover"
echo " Target mode: $MODE"
echo "============================================"
echo ""

# Safety check for cloudrun mode
if [[ "$MODE" == "cloudrun" ]]; then
  echo "WARNING: 'cloudrun' mode will stop ALL writes to Airtable."
  echo "         Make sure Cloud SQL has up-to-date data!"
  echo ""
  read -p "Are you sure? (type YES to confirm): " confirm
  if [[ "$confirm" != "YES" ]]; then
    echo "Aborted."
    exit 0
  fi
fi

# The Wix secret is just a plain string value
echo -n "$MODE" | gcloud secrets versions add lmdr-gcp-migration-mode \
  --data-file=- \
  --project=ldmr-velocitymatch 2>/dev/null || {
  # Secret doesn't exist — create it
  echo "Creating secret lmdr-gcp-migration-mode..."
  echo -n "$MODE" | gcloud secrets create lmdr-gcp-migration-mode \
    --data-file=- \
    --project=ldmr-velocitymatch
}

echo ""
echo "Done. GCP_MIGRATION_MODE set to '$MODE'."
echo "Takes effect within 60 seconds (cached in Wix backend)."
echo ""
echo "To verify, check dataAccess.jsw logs for routing decisions."
echo ""
echo "Rollback: bash scripts/cutover-mode.sh off"
