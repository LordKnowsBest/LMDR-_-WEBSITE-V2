#!/bin/bash
# Check health of all Cloud Run services
set -euo pipefail

PROJECT="ldmr-velocitymatch"
REGION="us-central1"

SERVICES=(
  lmdr-matching-engine
  lmdr-driver-service
  lmdr-carrier-service
  lmdr-compliance-service
  lmdr-notifications-service
  lmdr-billing-service
  lmdr-ai-service
  lmdr-analytics-service
)

echo "Checking health of all services..."
echo ""

for SVC in "${SERVICES[@]}"; do
  URL=$(gcloud run services describe "$SVC" \
    --project=$PROJECT \
    --region=$REGION \
    --format='value(status.url)' 2>/dev/null || echo "NOT_DEPLOYED")

  if [ "$URL" = "NOT_DEPLOYED" ]; then
    echo "  $SVC: NOT DEPLOYED"
    continue
  fi

  STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    --max-time 5 \
    -H "Authorization: Bearer $(gcloud auth print-identity-token)" \
    "$URL/health" 2>/dev/null || echo "TIMEOUT")

  if [ "$STATUS" = "200" ]; then
    echo "  $SVC: HEALTHY ($URL)"
  else
    echo "  $SVC: $STATUS ($URL)"
  fi
done
