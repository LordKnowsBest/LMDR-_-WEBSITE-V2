#!/bin/bash
# Usage: bash scripts/cutover-all.sh [wix|dual|gcp]
set -euo pipefail

TARGET=${1:-dual}

SERVICES=(
  matching_engine
  driver_service
  carrier_service
  compliance_service
  notifications_service
  billing_service
  ai_service
  analytics_service
)

echo "Setting ALL services to '$TARGET'..."

for SVC in "${SERVICES[@]}"; do
  bash scripts/cutover.sh "$SVC" "$TARGET"
done

echo ""
echo "All services set to '$TARGET'."
