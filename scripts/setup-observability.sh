#!/bin/bash
# Setup observability for LMDR microservices
set -euo pipefail

PROJECT="ldmr-velocitymatch"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== LMDR Observability Setup ==="
echo ""

# 1. Create alert policies
echo "Creating alert policies..."
gcloud alpha monitoring policies create \
  --policy-from-file="$SCRIPT_DIR/alerts/error-rate-policy.json" \
  --project=$PROJECT 2>&1 || echo "  (may already exist)"

gcloud alpha monitoring policies create \
  --policy-from-file="$SCRIPT_DIR/alerts/latency-policy.json" \
  --project=$PROJECT 2>&1 || echo "  (may already exist)"

echo ""

# 2. Verify Cloud Logging for each service
echo "Verifying Cloud Logging ingestion..."
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

for SVC in "${SERVICES[@]}"; do
  COUNT=$(gcloud logging read \
    "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"$SVC\"" \
    --project=$PROJECT \
    --limit=1 \
    --format="value(timestamp)" 2>/dev/null | wc -l)

  if [ "$COUNT" -gt 0 ]; then
    echo "  $SVC: Logs found"
  else
    echo "  $SVC: No logs yet (service may not be deployed)"
  fi
done

echo ""
echo "Observability setup complete."
echo ""
echo "Next steps:"
echo "  1. Add notification channels (email/Slack) to alert policies in GCP Console"
echo "  2. Create dashboards in GCP Console > Monitoring > Dashboards"
echo "  3. Verify structured logs appear in Cloud Logging Explorer"
