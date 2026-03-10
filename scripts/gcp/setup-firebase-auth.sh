#!/usr/bin/env bash
# =============================================================================
# setup-firebase-auth.sh
# Phase 4 Service 1a — Firebase Auth setup for LMDR GCP project
# =============================================================================
set -euo pipefail

PROJECT_ID="ldmr-velocitymatch"
SA_NAME="lmdr-auth-provisioner"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
SA_DISPLAY_NAME="LMDR Auth Provisioner"

echo "=== Phase 4 Service 1a: Firebase Auth Setup ==="
echo "Project: ${PROJECT_ID}"
echo ""

# ---------------------------------------------------------------------------
# 1. Ensure gcloud is targeting the correct project
# ---------------------------------------------------------------------------
echo "[1/4] Setting active GCP project..."
gcloud config set project "${PROJECT_ID}"

# ---------------------------------------------------------------------------
# 2. Enable required APIs
# ---------------------------------------------------------------------------
echo "[2/4] Enabling required GCP APIs..."
gcloud services enable \
  identitytoolkit.googleapis.com \
  cloudfunctions.googleapis.com \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  logging.googleapis.com \
  2>/dev/null || echo "  (APIs already enabled or partially enabled — continuing)"

# ---------------------------------------------------------------------------
# 3. Create the service account (idempotent)
# ---------------------------------------------------------------------------
echo "[3/4] Creating service account: ${SA_NAME}..."

gcloud iam service-accounts create "${SA_NAME}" \
  --display-name="${SA_DISPLAY_NAME}" \
  --project="${PROJECT_ID}" \
  2>/dev/null || echo "  Service account '${SA_NAME}' already exists — skipping creation."

# Grant roles/run.invoker
echo "  Granting roles/run.invoker to ${SA_EMAIL}..."
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/run.invoker" \
  --condition=None \
  2>/dev/null || echo "  roles/run.invoker binding already exists."

# Grant roles/logging.logWriter
echo "  Granting roles/logging.logWriter to ${SA_EMAIL}..."
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/logging.logWriter" \
  --condition=None \
  2>/dev/null || echo "  roles/logging.logWriter binding already exists."

echo "  Service account setup complete."

# ---------------------------------------------------------------------------
# 4. Firebase Console manual steps
# ---------------------------------------------------------------------------
echo ""
echo "[4/4] Manual steps required in Firebase Console:"
echo "------------------------------------------------------"
echo "  Firebase Console URL:"
echo "  https://console.firebase.google.com/project/${PROJECT_ID}/authentication/providers"
echo ""
echo "  Step A — Enable Email/Password sign-in:"
echo "    1. Open the URL above."
echo "    2. Click 'Email/Password' in the provider list."
echo "    3. Toggle 'Enable' ON."
echo "    4. Click 'Save'."
echo ""
echo "  Step B — Enable Google OAuth sign-in:"
echo "    1. Click 'Google' in the provider list."
echo "    2. Toggle 'Enable' ON."
echo "    3. Set 'Project support email' to your admin email."
echo "    4. Click 'Save'."
echo ""
echo "  Step C — Deploy the blocking auth trigger (after files are in place):"
echo "    firebase deploy --only functions:authProvisioner"
echo ""
echo "=== Setup script complete ==="
