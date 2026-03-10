#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# setup-iam.sh
#
# Creates 10 least-privilege service accounts for all LMDR Cloud Run surfaces
# and performs an IAM audit confirming none hold roles/owner or roles/editor.
#
# Safe to re-run — every gcloud command is idempotent.
#
# Usage:
#   chmod +x scripts/gcp/setup-iam.sh
#   ./scripts/gcp/setup-iam.sh
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

PROJECT="ldmr-velocitymatch"

echo "==> [iam] Project: ${PROJECT}"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

create_sa() {
  local NAME="$1"
  local DISPLAY="$2"
  local DESC="$3"
  local EMAIL="${NAME}@${PROJECT}.iam.gserviceaccount.com"

  echo "  SA: ${NAME}"
  gcloud iam service-accounts create "${NAME}" \
    --project="${PROJECT}" \
    --display-name="${DISPLAY}" \
    --description="${DESC}" \
    2>/dev/null || echo "     (already exists — skipping creation)"
}

bind_role() {
  local SA_NAME="$1"
  local ROLE="$2"
  local EMAIL="${SA_NAME}@${PROJECT}.iam.gserviceaccount.com"

  gcloud projects add-iam-policy-binding "${PROJECT}" \
    --member="serviceAccount:${EMAIL}" \
    --role="${ROLE}" \
    --condition=None \
    --quiet
}

# Common roles granted to every LMDR service account
grant_common_roles() {
  local SA_NAME="$1"
  bind_role "${SA_NAME}" "roles/cloudsql.client"
  bind_role "${SA_NAME}" "roles/secretmanager.secretAccessor"
  bind_role "${SA_NAME}" "roles/logging.logWriter"
}

# ─────────────────────────────────────────────────────────────────────────────
# 1. lmdr-api-sa — Core Cloud Run API
# ─────────────────────────────────────────────────────────────────────────────
echo "==> Creating service accounts..."
echo ""

create_sa "lmdr-api-sa" \
  "LMDR API Service Account" \
  "Core Cloud Run API — Cloud SQL + Secrets + Logging"
grant_common_roles "lmdr-api-sa"

# ─────────────────────────────────────────────────────────────────────────────
# 2. lmdr-matching-sa — Driver/carrier matching service
# ─────────────────────────────────────────────────────────────────────────────
create_sa "lmdr-matching-sa" \
  "LMDR Matching Service Account" \
  "Driver-carrier matching microservice"
grant_common_roles "lmdr-matching-sa"

# ─────────────────────────────────────────────────────────────────────────────
# 3. lmdr-driver-sa — Driver portal backend
# ─────────────────────────────────────────────────────────────────────────────
create_sa "lmdr-driver-sa" \
  "LMDR Driver Service Account" \
  "Driver portal backend — includes document upload to GCS"
grant_common_roles "lmdr-driver-sa"
bind_role "lmdr-driver-sa" "roles/storage.objectAdmin"

# ─────────────────────────────────────────────────────────────────────────────
# 4. lmdr-carrier-sa — Carrier portal backend
# ─────────────────────────────────────────────────────────────────────────────
create_sa "lmdr-carrier-sa" \
  "LMDR Carrier Service Account" \
  "Carrier portal backend — includes asset upload to GCS"
grant_common_roles "lmdr-carrier-sa"
bind_role "lmdr-carrier-sa" "roles/storage.objectAdmin"

# ─────────────────────────────────────────────────────────────────────────────
# 5. lmdr-compliance-sa — Compliance and document validation
# ─────────────────────────────────────────────────────────────────────────────
create_sa "lmdr-compliance-sa" \
  "LMDR Compliance Service Account" \
  "Compliance checks — reads GCS docs, subscribes to Pub/Sub alerts"
grant_common_roles "lmdr-compliance-sa"
bind_role "lmdr-compliance-sa" "roles/storage.objectViewer"
bind_role "lmdr-compliance-sa" "roles/pubsub.subscriber"

# ─────────────────────────────────────────────────────────────────────────────
# 6. lmdr-notifications-sa — Notification/messaging service
# ─────────────────────────────────────────────────────────────────────────────
create_sa "lmdr-notifications-sa" \
  "LMDR Notifications Service Account" \
  "Push notifications and email triggers via Pub/Sub"
grant_common_roles "lmdr-notifications-sa"
bind_role "lmdr-notifications-sa" "roles/pubsub.publisher"
bind_role "lmdr-notifications-sa" "roles/pubsub.subscriber"

# ─────────────────────────────────────────────────────────────────────────────
# 7. lmdr-billing-sa — Billing and invoicing service
# ─────────────────────────────────────────────────────────────────────────────
create_sa "lmdr-billing-sa" \
  "LMDR Billing Service Account" \
  "Monthly invoice generation and subscription management"
grant_common_roles "lmdr-billing-sa"

# ─────────────────────────────────────────────────────────────────────────────
# 8. lmdr-ai-sa — AI enrichment and embedding service
# ─────────────────────────────────────────────────────────────────────────────
create_sa "lmdr-ai-sa" \
  "LMDR AI Service Account" \
  "AI enrichment, embeddings, Vertex AI — GCS model artifacts"
grant_common_roles "lmdr-ai-sa"
bind_role "lmdr-ai-sa" "roles/storage.objectAdmin"
bind_role "lmdr-ai-sa" "roles/aiplatform.user"

# ─────────────────────────────────────────────────────────────────────────────
# 9. lmdr-analytics-sa — Analytics and BigQuery read
# ─────────────────────────────────────────────────────────────────────────────
create_sa "lmdr-analytics-sa" \
  "LMDR Analytics Service Account" \
  "BigQuery analytics reads for dashboards and reports"
grant_common_roles "lmdr-analytics-sa"
bind_role "lmdr-analytics-sa" "roles/bigquery.dataViewer"

# ─────────────────────────────────────────────────────────────────────────────
# 10. lmdr-frontend-sa — Next.js frontend SSR service
# ─────────────────────────────────────────────────────────────────────────────
create_sa "lmdr-frontend-sa" \
  "LMDR Frontend Service Account" \
  "Next.js SSR frontend — accesses secrets and Cloud SQL"
grant_common_roles "lmdr-frontend-sa"

# ─────────────────────────────────────────────────────────────────────────────
# IAM Audit — verify none of these SAs hold roles/owner or roles/editor
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "==> IAM audit: checking for overly-broad roles (owner / editor)..."

LMDR_SAS=(
  "lmdr-api-sa"
  "lmdr-matching-sa"
  "lmdr-driver-sa"
  "lmdr-carrier-sa"
  "lmdr-compliance-sa"
  "lmdr-notifications-sa"
  "lmdr-billing-sa"
  "lmdr-ai-sa"
  "lmdr-analytics-sa"
  "lmdr-frontend-sa"
)

AUDIT_FAILED=0

# Pull the full project IAM policy once (cheaper than one gcloud call per SA)
IAM_POLICY=$(gcloud projects get-iam-policy "${PROJECT}" --format=json)

for SA_NAME in "${LMDR_SAS[@]}"; do
  SA_EMAIL="${SA_NAME}@${PROJECT}.iam.gserviceaccount.com"

  for FORBIDDEN_ROLE in "roles/owner" "roles/editor"; do
    MATCH=$(echo "${IAM_POLICY}" | \
      python3 -c "
import json, sys
policy = json.load(sys.stdin)
member = 'serviceAccount:${SA_EMAIL}'
role   = '${FORBIDDEN_ROLE}'
for binding in policy.get('bindings', []):
    if binding.get('role') == role and member in binding.get('members', []):
        print('FOUND')
        break
" 2>/dev/null || echo "")

    if [[ "${MATCH}" == "FOUND" ]]; then
      echo "  [FAIL] ${SA_EMAIL} has forbidden role ${FORBIDDEN_ROLE}"
      AUDIT_FAILED=1
    fi
  done
done

if [[ "${AUDIT_FAILED}" -eq 0 ]]; then
  echo "  [PASS] No LMDR service account holds roles/owner or roles/editor."
else
  echo ""
  echo "  [ERROR] Audit failed — revoke the listed roles before deploying."
  exit 1
fi

# ─────────────────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "==> Done. All 10 LMDR service accounts created and audited."
echo ""
echo "     SA                    Roles"
echo "     ─────────────────────────────────────────────────────────────────────"
echo "     lmdr-api-sa           cloudsql.client, secretAccessor, logging.logWriter"
echo "     lmdr-matching-sa      cloudsql.client, secretAccessor, logging.logWriter"
echo "     lmdr-driver-sa        (common) + storage.objectAdmin"
echo "     lmdr-carrier-sa       (common) + storage.objectAdmin"
echo "     lmdr-compliance-sa    (common) + storage.objectViewer, pubsub.subscriber"
echo "     lmdr-notifications-sa (common) + pubsub.publisher, pubsub.subscriber"
echo "     lmdr-billing-sa       (common)"
echo "     lmdr-ai-sa            (common) + storage.objectAdmin, aiplatform.user"
echo "     lmdr-analytics-sa     (common) + bigquery.dataViewer"
echo "     lmdr-frontend-sa      (common)"
