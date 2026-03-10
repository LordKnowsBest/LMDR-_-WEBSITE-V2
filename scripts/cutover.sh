#!/bin/bash
# Usage: bash scripts/cutover.sh matching_engine [wix|dual|gcp]
set -euo pipefail

SERVICE=${1:?Usage: cutover.sh <service_name> [wix|dual|gcp]}
TARGET=${2:-gcp}
PROJECT="ldmr-velocitymatch"

echo "Cutting over $SERVICE to $TARGET..."

CURRENT=$(gcloud secrets versions access latest \
  --secret=lmdr-feature-flags \
  --project=$PROJECT 2>/dev/null || echo '{}')

# Use node to update JSON (cross-platform)
UPDATED=$(node -e "
  const flags = JSON.parse(process.argv[1]);
  flags['$SERVICE'] = '$TARGET';
  console.log(JSON.stringify(flags, null, 2));
" "$CURRENT")

echo "$UPDATED" | gcloud secrets versions add lmdr-feature-flags \
  --data-file=- \
  --project=$PROJECT

echo "Done. $SERVICE set to '$TARGET'. Takes effect within 60s (flag TTL)."
echo ""
echo "Current flags:"
echo "$UPDATED"
