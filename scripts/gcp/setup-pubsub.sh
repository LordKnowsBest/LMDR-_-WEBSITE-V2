#!/usr/bin/env bash
# ============================================================
# setup-pubsub.sh — LMDR GCP Pub/Sub Bootstrap
# Phase 4 Service 3b: Cloud Pub/Sub Topics + Dead-Letter Queues
# Project: ldmr-velocitymatch
# ============================================================
set -euo pipefail

PROJECT_ID="ldmr-velocitymatch"
REGION="us-central1"

# Topics to create (without project prefix — gcloud adds it)
TOPICS=(
  "lmdr-notifications"    # Email/SMS/push notification events
  "lmdr-compliance-events" # Compliance check results, document validation
  "lmdr-job-events"       # Job posted, updated, closed events
  "lmdr-driver-events"    # Driver status changes, profile updates
  "lmdr-file-uploaded"    # Cloud Storage upload completion triggers
)

TOPICS_CREATED=0
SUBS_CREATED=0

echo "============================================================"
echo "  LMDR GCP Pub/Sub Setup"
echo "  Project: ${PROJECT_ID}"
echo "  Region:  ${REGION}"
echo "  Topics:  ${#TOPICS[@]}"
echo "============================================================"
echo ""

# ── Ensure correct project context ──────────────────────────
echo "[0/3] Setting active project..."
gcloud config set project "${PROJECT_ID}"
echo ""

# ── Enable Pub/Sub API ───────────────────────────────────────
echo "[1/3] Enabling Pub/Sub API..."
gcloud services enable pubsub.googleapis.com --project="${PROJECT_ID}"
echo "      pubsub.googleapis.com enabled"
echo ""

# ── Create topics and subscriptions ─────────────────────────
echo "[2/3] Creating topics, DLQs, and subscriptions..."
echo ""

for TOPIC in "${TOPICS[@]}"; do
  DLQ_TOPIC="${TOPIC}-dlq"
  MAIN_SUB="${TOPIC}-sub"
  DLQ_SUB="${TOPIC}-dlq-sub"
  DLQ_TOPIC_FQN="projects/${PROJECT_ID}/topics/${DLQ_TOPIC}"

  echo "  ── ${TOPIC} ──"

  # 1. Main topic
  if gcloud pubsub topics describe "${TOPIC}" \
       --project="${PROJECT_ID}" &>/dev/null; then
    echo "     [skip] topic '${TOPIC}' already exists"
  else
    gcloud pubsub topics create "${TOPIC}" \
      --project="${PROJECT_ID}"
    echo "     [+] topic '${TOPIC}' created"
    (( TOPICS_CREATED++ )) || true
  fi

  # 2. Dead-letter topic
  if gcloud pubsub topics describe "${DLQ_TOPIC}" \
       --project="${PROJECT_ID}" &>/dev/null; then
    echo "     [skip] topic '${DLQ_TOPIC}' already exists"
  else
    gcloud pubsub topics create "${DLQ_TOPIC}" \
      --project="${PROJECT_ID}"
    echo "     [+] topic '${DLQ_TOPIC}' created"
    (( TOPICS_CREATED++ )) || true
  fi

  # 3. Main subscription (with dead-letter policy)
  if gcloud pubsub subscriptions describe "${MAIN_SUB}" \
       --project="${PROJECT_ID}" &>/dev/null; then
    echo "     [skip] subscription '${MAIN_SUB}' already exists"
  else
    gcloud pubsub subscriptions create "${MAIN_SUB}" \
      --project="${PROJECT_ID}" \
      --topic="${TOPIC}" \
      --dead-letter-topic="${DLQ_TOPIC_FQN}" \
      --max-delivery-attempts=5 \
      --ack-deadline=60 \
      --message-retention-duration=7d
    echo "     [+] subscription '${MAIN_SUB}' created (dlq=${DLQ_TOPIC}, max-attempts=5, ack=60s, retention=7d)"
    (( SUBS_CREATED++ )) || true
  fi

  # 4. DLQ subscription (for manual inspection)
  if gcloud pubsub subscriptions describe "${DLQ_SUB}" \
       --project="${PROJECT_ID}" &>/dev/null; then
    echo "     [skip] subscription '${DLQ_SUB}' already exists"
  else
    gcloud pubsub subscriptions create "${DLQ_SUB}" \
      --project="${PROJECT_ID}" \
      --topic="${DLQ_TOPIC}" \
      --ack-deadline=600 \
      --message-retention-duration=14d
    echo "     [+] subscription '${DLQ_SUB}' created (ack=600s, retention=14d)"
    (( SUBS_CREATED++ )) || true
  fi

  echo ""
done

# ── Grant Pub/Sub SA rights to use DLQ topics ───────────────
# Cloud Pub/Sub service account needs publisher rights on DLQ topics
# so the dead-letter forwarding actually works.
echo "[2b] Granting Pub/Sub SA dead-letter publisher rights..."
PUBSUB_SA="service-$(gcloud projects describe "${PROJECT_ID}" \
  --format='value(projectNumber)')@gcp-sa-pubsub.iam.gserviceaccount.com"

for TOPIC in "${TOPICS[@]}"; do
  DLQ_TOPIC="${TOPIC}-dlq"
  gcloud pubsub topics add-iam-policy-binding "${DLQ_TOPIC}" \
    --project="${PROJECT_ID}" \
    --member="serviceAccount:${PUBSUB_SA}" \
    --role="roles/pubsub.publisher" \
    2>/dev/null \
    && echo "     [+] publisher binding set on '${DLQ_TOPIC}'" \
    || echo "     [skip] binding already present on '${DLQ_TOPIC}'"

  MAIN_SUB="${TOPIC}-sub"
  gcloud pubsub subscriptions add-iam-policy-binding "${MAIN_SUB}" \
    --project="${PROJECT_ID}" \
    --member="serviceAccount:${PUBSUB_SA}" \
    --role="roles/pubsub.subscriber" \
    2>/dev/null \
    && echo "     [+] subscriber binding set on '${MAIN_SUB}'" \
    || echo "     [skip] binding already present on '${MAIN_SUB}'"
done
echo ""

# ── Summary ──────────────────────────────────────────────────
echo "[3/3] Summary"
echo "      Topics created this run:        ${TOPICS_CREATED}"
echo "      Subscriptions created this run: ${SUBS_CREATED}"
echo ""
echo "  All topics in project ${PROJECT_ID}:"
gcloud pubsub topics list \
  --project="${PROJECT_ID}" \
  --format="table(name)"

echo ""
echo "============================================================"
echo "  Pub/Sub setup complete."
echo "============================================================"
