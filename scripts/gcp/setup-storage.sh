#!/usr/bin/env bash
# setup-storage.sh — Provision Cloud Storage buckets for LMDR
# Project: ldmr-velocitymatch  Region: us-central1
# Idempotent: safe to re-run at any time.
set -euo pipefail

PROJECT="ldmr-velocitymatch"
REGION="us-central1"

echo "=== LMDR Cloud Storage Setup ==="
echo "Project: ${PROJECT}"
echo "Region:  ${REGION}"
echo ""

# ─── Helper ─────────────────────────────────────────────────────────────────
create_bucket_if_missing() {
  local bucket="$1"
  if gsutil ls -b "gs://${bucket}" &>/dev/null; then
    echo "[OK] Bucket gs://${bucket} already exists — skipping create."
  else
    echo "[+] Creating bucket gs://${bucket} ..."
    gsutil mb -p "${PROJECT}" -l "${REGION}" -b on "gs://${bucket}"
    echo "[OK] Created gs://${bucket}"
  fi
}

# ─── 1. Create buckets ───────────────────────────────────────────────────────
echo "--- Creating buckets ---"

create_bucket_if_missing "lmdr-driver-documents"
create_bucket_if_missing "lmdr-carrier-assets"
create_bucket_if_missing "lmdr-static-assets"
create_bucket_if_missing "lmdr-ai-training-data"

# ─── 2. Uniform bucket-level access (private buckets) ───────────────────────
echo ""
echo "--- Configuring uniform bucket-level access ---"
for bucket in lmdr-driver-documents lmdr-carrier-assets lmdr-ai-training-data; do
  gsutil uniformbucketlevelaccess set on "gs://${bucket}"
  echo "[OK] Uniform bucket-level access enabled on gs://${bucket}"
done

# Enforce uniform access on static-assets too (public via IAM, not per-object ACLs)
gsutil uniformbucketlevelaccess set on "gs://lmdr-static-assets"
echo "[OK] Uniform bucket-level access enabled on gs://lmdr-static-assets"

# ─── 3. Public access for lmdr-static-assets ────────────────────────────────
echo ""
echo "--- Configuring public read on lmdr-static-assets ---"
gsutil iam ch allUsers:objectViewer "gs://lmdr-static-assets"
echo "[OK] allUsers:objectViewer granted on gs://lmdr-static-assets"

# ─── 4. Retention policies (7 years = 220752000 seconds) ────────────────────
echo ""
echo "--- Setting retention policies ---"
SEVEN_YEARS_SECONDS=220752000
for bucket in lmdr-driver-documents lmdr-carrier-assets; do
  gsutil retention set "${SEVEN_YEARS_SECONDS}s" "gs://${bucket}"
  echo "[OK] 7-year retention set on gs://${bucket}"
done

# ─── 5. CORS configuration ───────────────────────────────────────────────────
echo ""
echo "--- Applying CORS configuration ---"

# Write CORS JSON to a temp file
CORS_FILE="$(mktemp /tmp/lmdr-cors-XXXXXX.json)"
cat > "${CORS_FILE}" <<'CORS_EOF'
[
  {
    "origin": [
      "https://www.lastmiledr.app",
      "https://lmdr-frontend-140035137711.us-central1.run.app",
      "http://localhost:3000"
    ],
    "method": ["GET", "PUT", "POST", "HEAD"],
    "responseHeader": ["Content-Type", "x-goog-resumable"],
    "maxAgeSeconds": 3600
  }
]
CORS_EOF

for bucket in lmdr-driver-documents lmdr-carrier-assets lmdr-static-assets; do
  gsutil cors set "${CORS_FILE}" "gs://${bucket}"
  echo "[OK] CORS configured on gs://${bucket}"
done

rm -f "${CORS_FILE}"

# ─── 6. Lifecycle rules (delete tmp/ objects after 1 day) ───────────────────
echo ""
echo "--- Setting lifecycle rules (tmp/ cleanup after 1 day) ---"

LIFECYCLE_FILE="$(mktemp /tmp/lmdr-lifecycle-XXXXXX.json)"
cat > "${LIFECYCLE_FILE}" <<'LC_EOF'
{
  "rule": [
    {
      "action": { "type": "Delete" },
      "condition": {
        "age": 1,
        "matchesPrefix": ["tmp/"]
      }
    }
  ]
}
LC_EOF

for bucket in lmdr-driver-documents lmdr-carrier-assets; do
  gsutil lifecycle set "${LIFECYCLE_FILE}" "gs://${bucket}"
  echo "[OK] Lifecycle rule (delete tmp/ after 1 day) set on gs://${bucket}"
done

rm -f "${LIFECYCLE_FILE}"

# ─── 7. Summary ──────────────────────────────────────────────────────────────
echo ""
echo "=== Setup complete ==="
echo ""
echo "Buckets provisioned:"
echo "  gs://lmdr-driver-documents   — private, 7yr retention, CORS, tmp/ lifecycle"
echo "  gs://lmdr-carrier-assets     — private, 7yr retention, CORS, tmp/ lifecycle"
echo "  gs://lmdr-static-assets      — PUBLIC (allUsers objectViewer), CORS"
echo "  gs://lmdr-ai-training-data   — private"
