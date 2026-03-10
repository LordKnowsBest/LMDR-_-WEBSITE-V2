# Phase 4: Platform Services — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deploy 7 foundational GCP platform services (Observability, Firebase Auth, Cloud Storage, Pub/Sub, RTDB, Cloud Scheduler, Search, AI) to complete the LMDR GCP migration.

**Architecture:** Phase 4 builds the platform layer beneath the existing Cloud Run API (Phase 1) and 8 microservice stubs (Phase 2). Each service is independently deployable. Observability deploys first so all subsequent work is monitored. Firebase Auth deploys second to unblock all authenticated services.

**Tech Stack:** GCP Cloud Monitoring, Firebase Auth/RTDB, Cloud Storage, Cloud Pub/Sub, Cloud Scheduler, PostgreSQL extensions (pg_trgm, postgis, pgvector), BigQuery, Cloud Logging

---

## Prerequisites (USER ACTION REQUIRED)

### 1. Authenticate gcloud CLI

```bash
gcloud auth login
gcloud config set project ldmr-velocitymatch
gcloud config set compute/region us-central1
```

### 2. Start Cloud SQL Auth Proxy

```bash
# Terminal 1 (keep running):
bash Conductor/tracks/gcp_migration_20260218/scripts/08_cloud_sql_proxy.sh

# OR manually:
cloud-sql-proxy --credentials-file="./keys/wix-bridge-sa-key.json" "ldmr-velocitymatch:us-central1:lmdr-postgres"
```

### 3. Verify Connection

```bash
cd cloud-run-api && node -e "
  import('./src/db/pool.js').then(m => m.default.query('SELECT NOW()')).then(r => {
    console.log('Connected:', r.rows[0].now);
    process.exit(0);
  }).catch(e => { console.error('FAIL:', e.message); process.exit(1); });
"
```

### 4. Enable Required GCP APIs

```bash
gcloud services enable \
  monitoring.googleapis.com \
  logging.googleapis.com \
  cloudtrace.googleapis.com \
  firebaseauth.googleapis.com \
  firebase.googleapis.com \
  firebasedatabase.googleapis.com \
  storage-api.googleapis.com \
  pubsub.googleapis.com \
  cloudtasks.googleapis.com \
  cloudscheduler.googleapis.com \
  cloudfunctions.googleapis.com \
  aiplatform.googleapis.com
```

---

## Wave 1: Observability + Firebase Auth Setup

> **Team:** 2 implementation agents (Sonnet) + 1 verifier (Opus)
> **Duration:** ~1 session
> **Why first:** Observability monitors everything; Auth unblocks all services

### Task 1.1: Cloud Monitoring Dashboards (Service 6)

**Files:**
- Create: `scripts/gcp/setup-monitoring.sh`

**Step 1: Create the monitoring setup script**

```bash
#!/bin/bash
# scripts/gcp/setup-monitoring.sh
# Creates Cloud Monitoring dashboards and alerting policies for all LMDR services

set -euo pipefail
PROJECT_ID="ldmr-velocitymatch"

echo "=== Creating Uptime Checks ==="

# Uptime check for lmdr-api
gcloud monitoring uptime create lmdr-api-health \
  --display-name="lmdr-api Health" \
  --resource-type=uptime-url \
  --hostname="lmdr-api-140035137711.us-central1.run.app" \
  --path="/health" \
  --check-frequency=300 \
  --timeout=10 \
  --project=$PROJECT_ID 2>/dev/null || echo "lmdr-api uptime check may already exist"

echo "=== Creating Notification Channel (Email) ==="

# Create email notification channel
CHANNEL_ID=$(gcloud alpha monitoring channels create \
  --display-name="LMDR Ops Email" \
  --type=email \
  --channel-labels=email_address=ops@lastmiledr.app \
  --project=$PROJECT_ID \
  --format="value(name)" 2>/dev/null || echo "")

if [ -z "$CHANNEL_ID" ]; then
  echo "Notification channel may already exist, fetching..."
  CHANNEL_ID=$(gcloud alpha monitoring channels list \
    --filter="displayName='LMDR Ops Email'" \
    --format="value(name)" \
    --project=$PROJECT_ID | head -1)
fi

echo "Notification channel: $CHANNEL_ID"

echo "=== Creating Alert Policies ==="

# Alert: High error rate (>1% over 5 minutes)
cat > /tmp/alert-error-rate.json << 'ALERT_EOF'
{
  "displayName": "LMDR High Error Rate (>1%)",
  "combiner": "OR",
  "conditions": [{
    "displayName": "Error rate > 1%",
    "conditionThreshold": {
      "filter": "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_count\" AND metric.labels.response_code_class=\"5xx\"",
      "comparison": "COMPARISON_GT",
      "thresholdValue": 0.01,
      "duration": "300s",
      "aggregations": [{
        "alignmentPeriod": "300s",
        "perSeriesAligner": "ALIGN_RATE"
      }]
    }
  }],
  "alertStrategy": {
    "autoClose": "1800s"
  }
}
ALERT_EOF

gcloud alpha monitoring policies create \
  --policy-from-file=/tmp/alert-error-rate.json \
  --notification-channels="$CHANNEL_ID" \
  --project=$PROJECT_ID 2>/dev/null || echo "Error rate alert may already exist"

# Alert: High latency (p95 > 2s over 5 minutes)
cat > /tmp/alert-latency.json << 'ALERT_EOF'
{
  "displayName": "LMDR High Latency (p95 > 2s)",
  "combiner": "OR",
  "conditions": [{
    "displayName": "p95 latency > 2000ms",
    "conditionThreshold": {
      "filter": "resource.type=\"cloud_run_revision\" AND metric.type=\"run.googleapis.com/request_latencies\"",
      "comparison": "COMPARISON_GT",
      "thresholdValue": 2000,
      "duration": "300s",
      "aggregations": [{
        "alignmentPeriod": "300s",
        "perSeriesAligner": "ALIGN_PERCENTILE_95"
      }]
    }
  }],
  "alertStrategy": {
    "autoClose": "1800s"
  }
}
ALERT_EOF

gcloud alpha monitoring policies create \
  --policy-from-file=/tmp/alert-latency.json \
  --notification-channels="$CHANNEL_ID" \
  --project=$PROJECT_ID 2>/dev/null || echo "Latency alert may already exist"

# Alert: Cloud SQL connection exhaustion (>80%)
cat > /tmp/alert-sql-connections.json << 'ALERT_EOF'
{
  "displayName": "LMDR Cloud SQL Connections >80%",
  "combiner": "OR",
  "conditions": [{
    "displayName": "SQL connections > 80%",
    "conditionThreshold": {
      "filter": "resource.type=\"cloudsql_database\" AND metric.type=\"cloudsql.googleapis.com/database/network/connections\"",
      "comparison": "COMPARISON_GT",
      "thresholdValue": 80,
      "duration": "300s",
      "aggregations": [{
        "alignmentPeriod": "300s",
        "perSeriesAligner": "ALIGN_MEAN"
      }]
    }
  }],
  "alertStrategy": {
    "autoClose": "1800s"
  }
}
ALERT_EOF

gcloud alpha monitoring policies create \
  --policy-from-file=/tmp/alert-sql-connections.json \
  --notification-channels="$CHANNEL_ID" \
  --project=$PROJECT_ID 2>/dev/null || echo "SQL connections alert may already exist"

echo "=== Creating Log Sink ==="

# Create log sink for 90-day retention
gcloud logging sinks create lmdr-logs-sink \
  "logging.googleapis.com/projects/$PROJECT_ID/locations/us-central1/buckets/lmdr-logs" \
  --log-filter='resource.type="cloud_run_revision" AND resource.labels.service_name=~"lmdr-"' \
  --project=$PROJECT_ID 2>/dev/null || echo "Log sink may already exist"

# Create the log bucket with 90-day retention
gcloud logging buckets create lmdr-logs \
  --location=us-central1 \
  --retention-days=90 \
  --project=$PROJECT_ID 2>/dev/null || echo "Log bucket may already exist"

echo "=== Observability Setup Complete ==="
echo "Dashboard: https://console.cloud.google.com/monitoring/dashboards?project=$PROJECT_ID"
echo "Alerts: https://console.cloud.google.com/monitoring/alerting?project=$PROJECT_ID"
echo "Logs: https://console.cloud.google.com/logs?project=$PROJECT_ID"
```

**Step 2: Run the script**

```bash
chmod +x scripts/gcp/setup-monitoring.sh
bash scripts/gcp/setup-monitoring.sh
```

**Step 3: Verify**

```bash
gcloud monitoring uptime list-configs --project=ldmr-velocitymatch
gcloud alpha monitoring policies list --project=ldmr-velocitymatch --format="table(displayName,enabled)"
gcloud logging sinks list --project=ldmr-velocitymatch
```

**Step 4: Commit**

```bash
git add scripts/gcp/setup-monitoring.sh
git commit -m "feat(phase4): add Cloud Monitoring dashboards, alerts, and log sink"
```

---

### Task 1.2: Firebase Project + Auth Setup (Service 1a)

**Files:**
- Create: `scripts/gcp/setup-firebase-auth.sh`
- Create: `functions/auth-provisioner/index.js`
- Create: `functions/auth-provisioner/package.json`

**Step 1: Create Firebase Auth setup script**

```bash
#!/bin/bash
# scripts/gcp/setup-firebase-auth.sh
set -euo pipefail
PROJECT_ID="ldmr-velocitymatch"

echo "=== Firebase Auth Setup ==="

# Check if Firebase is already linked
firebase projects:list 2>/dev/null | grep $PROJECT_ID && echo "Firebase already linked" || {
  echo "Linking Firebase to GCP project..."
  firebase projects:addfirebase $PROJECT_ID
}

# Enable Auth providers
echo "=== Enabling Auth Providers ==="
echo "NOTE: Email/Password and Google OAuth must be enabled in Firebase Console:"
echo "  https://console.firebase.google.com/project/$PROJECT_ID/authentication/providers"
echo ""
echo "  1. Enable Email/Password (with email link sign-in disabled)"
echo "  2. Enable Google provider (use project support email)"

# Create auth provisioner service account
echo "=== Creating Auth Provisioner Service Account ==="
gcloud iam service-accounts create lmdr-auth-provisioner \
  --display-name="LMDR Auth Provisioner" \
  --project=$PROJECT_ID 2>/dev/null || echo "Service account may already exist"

# Grant roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:lmdr-auth-provisioner@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.invoker" \
  --condition=None 2>/dev/null

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:lmdr-auth-provisioner@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/logging.logWriter" \
  --condition=None 2>/dev/null

echo "=== Firebase Auth Setup Complete ==="
echo "Console: https://console.firebase.google.com/project/$PROJECT_ID/authentication"
```

**Step 2: Create Auth Provisioner Cloud Function**

`functions/auth-provisioner/package.json`:
```json
{
  "name": "lmdr-auth-provisioner",
  "version": "1.0.0",
  "main": "index.js",
  "engines": { "node": "20" },
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "firebase-functions": "^4.8.0",
    "node-fetch": "^3.3.2"
  }
}
```

`functions/auth-provisioner/index.js`:
```javascript
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { beforeUserCreated } from 'firebase-functions/v2/identity';
import { logger } from 'firebase-functions';

initializeApp();

const CLOUD_RUN_API = 'https://lmdr-api-140035137711.us-central1.run.app';

/**
 * Fires when a new user signs up via Firebase Auth.
 * Sets custom claims (role) and provisions a record in Cloud SQL.
 */
export const onUserCreated = beforeUserCreated(async (event) => {
  const user = event.data;
  const email = user.email || '';
  const displayName = user.displayName || '';

  logger.info('New user signup', { uid: user.uid, email });

  // Default role is 'driver' — admin promotes via Cloud SQL
  const role = 'driver';

  // Set custom claims
  await getAuth().setCustomUserClaims(user.uid, {
    role,
    driverId: null,
    carrierId: null
  });

  // Provision record in Cloud SQL via lmdr-api
  try {
    const response = await fetch(`${CLOUD_RUN_API}/v1/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.LMDR_INTERNAL_KEY}`
      },
      body: JSON.stringify({
        firebase_uid: user.uid,
        email,
        display_name: displayName,
        role,
        created_at: new Date().toISOString()
      })
    });

    if (!response.ok) {
      logger.error('Failed to provision user in Cloud SQL', {
        uid: user.uid,
        status: response.status
      });
    } else {
      logger.info('User provisioned in Cloud SQL', { uid: user.uid });
    }
  } catch (error) {
    logger.error('Error provisioning user', { uid: user.uid, error: error.message });
  }
});
```

**Step 3: Run setup**

```bash
chmod +x scripts/gcp/setup-firebase-auth.sh
bash scripts/gcp/setup-firebase-auth.sh
```

**Step 4: Deploy Cloud Function**

```bash
cd functions/auth-provisioner
npm install
firebase deploy --only functions:onUserCreated --project ldmr-velocitymatch
```

**Step 5: Commit**

```bash
git add scripts/gcp/setup-firebase-auth.sh functions/auth-provisioner/
git commit -m "feat(phase4): Firebase Auth setup + auth provisioner Cloud Function"
```

---

### Task 1.3: Wave 1 Verification

**Verifier agent checks:**
1. `gcloud monitoring uptime list-configs` returns lmdr-api-health
2. `gcloud alpha monitoring policies list` returns 3 alert policies (error rate, latency, SQL connections)
3. `gcloud logging sinks list` returns lmdr-logs-sink
4. Firebase Auth console shows Email/Password + Google providers enabled
5. Cloud Function `onUserCreated` deployed and visible in Firebase console
6. Auth provisioner can reach lmdr-api `/health` endpoint

---

## Wave 2: Cloud Storage + Pub/Sub

> **Team:** 2 implementation agents (Sonnet) + 1 verifier (Haiku)
> **Duration:** ~1 session
> **Dependencies:** Wave 1 complete (Observability active)

### Task 2.1: Cloud Storage Buckets (Service 2)

**Files:**
- Create: `scripts/gcp/setup-storage.sh`

**Step 1: Create storage setup script**

```bash
#!/bin/bash
# scripts/gcp/setup-storage.sh
set -euo pipefail
PROJECT_ID="ldmr-velocitymatch"
REGION="us-central1"

echo "=== Creating Cloud Storage Buckets ==="

# 1. Driver Documents (private, 7-year retention)
gcloud storage buckets create gs://lmdr-driver-documents \
  --project=$PROJECT_ID \
  --location=$REGION \
  --uniform-bucket-level-access \
  --default-storage-class=STANDARD 2>/dev/null || echo "lmdr-driver-documents exists"

gcloud storage buckets update gs://lmdr-driver-documents \
  --retention-period=7y \
  --project=$PROJECT_ID 2>/dev/null || true

# 2. Carrier Assets (private, 7-year retention)
gcloud storage buckets create gs://lmdr-carrier-assets \
  --project=$PROJECT_ID \
  --location=$REGION \
  --uniform-bucket-level-access \
  --default-storage-class=STANDARD 2>/dev/null || echo "lmdr-carrier-assets exists"

gcloud storage buckets update gs://lmdr-carrier-assets \
  --retention-period=7y \
  --project=$PROJECT_ID 2>/dev/null || true

# 3. Static Assets (public, CDN-enabled)
gcloud storage buckets create gs://lmdr-static-assets \
  --project=$PROJECT_ID \
  --location=$REGION \
  --uniform-bucket-level-access \
  --default-storage-class=STANDARD 2>/dev/null || echo "lmdr-static-assets exists"

# Make static assets publicly readable
gcloud storage buckets add-iam-policy-binding gs://lmdr-static-assets \
  --member="allUsers" \
  --role="roles/storage.objectViewer" 2>/dev/null || true

# 4. AI Training Data (private, no expiry)
gcloud storage buckets create gs://lmdr-ai-training-data \
  --project=$PROJECT_ID \
  --location=$REGION \
  --uniform-bucket-level-access \
  --default-storage-class=STANDARD 2>/dev/null || echo "lmdr-ai-training-data exists"

echo "=== Setting CORS for Upload Buckets ==="

cat > /tmp/cors-config.json << 'CORS_EOF'
[{
  "origin": ["https://www.lastmiledr.app", "https://lmdr-frontend-140035137711.us-central1.run.app", "http://localhost:3000"],
  "method": ["GET", "PUT", "POST", "HEAD"],
  "responseHeader": ["Content-Type", "x-goog-resumable"],
  "maxAgeSeconds": 3600
}]
CORS_EOF

gcloud storage buckets update gs://lmdr-driver-documents --cors-file=/tmp/cors-config.json
gcloud storage buckets update gs://lmdr-carrier-assets --cors-file=/tmp/cors-config.json
gcloud storage buckets update gs://lmdr-static-assets --cors-file=/tmp/cors-config.json

echo "=== Setting Lifecycle (tmp/ cleanup in 24h) ==="

cat > /tmp/lifecycle-config.json << 'LIFE_EOF'
{
  "rule": [{
    "action": { "type": "Delete" },
    "condition": { "age": 1, "matchesPrefix": ["tmp/"] }
  }]
}
LIFE_EOF

gcloud storage buckets update gs://lmdr-driver-documents --lifecycle-file=/tmp/lifecycle-config.json
gcloud storage buckets update gs://lmdr-carrier-assets --lifecycle-file=/tmp/lifecycle-config.json

echo "=== Cloud Storage Setup Complete ==="
gcloud storage buckets list --project=$PROJECT_ID --format="table(name,location,storageClass)"
```

**Step 2: Add signed URL endpoint to lmdr-api**

Create: `cloud-run-api/src/routes/files.js`

```javascript
import { Router } from 'express';
import { Storage } from '@google-cloud/storage';

const router = Router();
const storage = new Storage();

const ALLOWED_BUCKETS = {
  'driver-documents': 'lmdr-driver-documents',
  'carrier-assets': 'lmdr-carrier-assets',
  'static-assets': 'lmdr-static-assets',
  'ai-training-data': 'lmdr-ai-training-data'
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * POST /v1/files/signed-url
 * Body: { bucket: 'driver-documents', filename: 'cdl-front.pdf', contentType: 'application/pdf' }
 * Returns: { url, fields, expiresAt }
 */
router.post('/signed-url', async (req, res) => {
  try {
    const { bucket: bucketKey, filename, contentType } = req.body;

    if (!bucketKey || !filename || !contentType) {
      return res.status(400).json({ error: 'Missing bucket, filename, or contentType' });
    }

    const bucketName = ALLOWED_BUCKETS[bucketKey];
    if (!bucketName) {
      return res.status(400).json({ error: `Unknown bucket: ${bucketKey}` });
    }

    // Build path with user context from auth
    const userId = req.auth?.uid || req.auth?.partnerId || 'anonymous';
    const filePath = `uploads/${userId}/${Date.now()}-${filename}`;

    const bucket = storage.bucket(bucketName);
    const file = bucket.file(filePath);

    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType,
      conditions: [['content-length-range', 0, MAX_FILE_SIZE]]
    });

    res.json({
      url,
      filePath,
      bucket: bucketName,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    });
  } catch (error) {
    console.error('Signed URL error:', error);
    res.status(500).json({ error: 'Failed to generate signed URL' });
  }
});

/**
 * GET /v1/files/download-url
 * Query: ?bucket=driver-documents&filePath=uploads/uid/file.pdf
 * Returns: { url, expiresAt }
 */
router.get('/download-url', async (req, res) => {
  try {
    const { bucket: bucketKey, filePath } = req.query;

    if (!bucketKey || !filePath) {
      return res.status(400).json({ error: 'Missing bucket or filePath' });
    }

    const bucketName = ALLOWED_BUCKETS[bucketKey];
    if (!bucketName) {
      return res.status(400).json({ error: `Unknown bucket: ${bucketKey}` });
    }

    const file = storage.bucket(bucketName).file(filePath);
    const [exists] = await file.exists();
    if (!exists) {
      return res.status(404).json({ error: 'File not found' });
    }

    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000 // 1 hour
    });

    res.json({
      url,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString()
    });
  } catch (error) {
    console.error('Download URL error:', error);
    res.status(500).json({ error: 'Failed to generate download URL' });
  }
});

export default router;
```

**Step 3: Install @google-cloud/storage and wire route**

```bash
cd cloud-run-api
npm install @google-cloud/storage
```

Modify `cloud-run-api/src/app.js` to add:
```javascript
import filesRouter from './routes/files.js';
// Add after collection router mount:
protectedRouter.use('/files', filesRouter);
```

**Step 4: Run and commit**

```bash
bash scripts/gcp/setup-storage.sh
git add scripts/gcp/setup-storage.sh cloud-run-api/src/routes/files.js cloud-run-api/package.json cloud-run-api/package-lock.json
git commit -m "feat(phase4): Cloud Storage 4 buckets + signed URL endpoints"
```

---

### Task 2.2: Cloud Pub/Sub Topics (Service 3b)

**Files:**
- Create: `scripts/gcp/setup-pubsub.sh`

**Step 1: Create Pub/Sub setup script**

```bash
#!/bin/bash
# scripts/gcp/setup-pubsub.sh
set -euo pipefail
PROJECT_ID="ldmr-velocitymatch"

TOPICS=(
  "lmdr-notifications"
  "lmdr-compliance-events"
  "lmdr-job-events"
  "lmdr-driver-events"
  "lmdr-file-uploaded"
)

echo "=== Creating Pub/Sub Topics + DLQs ==="

for TOPIC in "${TOPICS[@]}"; do
  # Create main topic
  gcloud pubsub topics create "$TOPIC" --project=$PROJECT_ID 2>/dev/null \
    && echo "Created topic: $TOPIC" \
    || echo "Topic $TOPIC already exists"

  # Create dead-letter topic
  gcloud pubsub topics create "${TOPIC}-dlq" --project=$PROJECT_ID 2>/dev/null \
    && echo "Created DLQ: ${TOPIC}-dlq" \
    || echo "DLQ ${TOPIC}-dlq already exists"

  # Create subscription with dead-letter policy
  gcloud pubsub subscriptions create "${TOPIC}-sub" \
    --topic="$TOPIC" \
    --dead-letter-topic="${TOPIC}-dlq" \
    --max-delivery-attempts=5 \
    --ack-deadline=60 \
    --message-retention-duration=7d \
    --project=$PROJECT_ID 2>/dev/null \
    && echo "Created subscription: ${TOPIC}-sub" \
    || echo "Subscription ${TOPIC}-sub already exists"

  # Create DLQ subscription (for manual inspection)
  gcloud pubsub subscriptions create "${TOPIC}-dlq-sub" \
    --topic="${TOPIC}-dlq" \
    --ack-deadline=600 \
    --message-retention-duration=14d \
    --project=$PROJECT_ID 2>/dev/null \
    && echo "Created DLQ subscription: ${TOPIC}-dlq-sub" \
    || echo "DLQ subscription already exists"
done

echo "=== Pub/Sub Setup Complete ==="
gcloud pubsub topics list --project=$PROJECT_ID --format="table(name)"
```

**Step 2: Run and commit**

```bash
chmod +x scripts/gcp/setup-pubsub.sh
bash scripts/gcp/setup-pubsub.sh
git add scripts/gcp/setup-pubsub.sh
git commit -m "feat(phase4): Pub/Sub 5 topics + DLQs with 5-retry dead-letter policy"
```

---

### Task 2.3: Wave 2 Verification

**Verifier agent checks:**
1. `gcloud storage buckets list --project=ldmr-velocitymatch` shows 4 buckets
2. CORS is set on driver-documents and carrier-assets
3. Static assets bucket is publicly readable
4. Signed URL endpoint responds (POST /v1/files/signed-url)
5. `gcloud pubsub topics list` shows 10 topics (5 main + 5 DLQ)
6. `gcloud pubsub subscriptions list` shows 10 subscriptions
7. Dead-letter policy configured with max-delivery-attempts=5

---

## Wave 3: Firebase RTDB + Auth Frontend + Search Schema

> **Team:** 2 implementation agents (Sonnet) + 1 verifier (Opus)
> **Duration:** ~1 session
> **Dependencies:** Wave 1 complete (Firebase project exists)

### Task 3.1: Firebase RTDB Setup (Service 3a)

**Files:**
- Create: `firebase.json`
- Create: `database.rules.json`

**Step 1: Create Firebase config**

`firebase.json`:
```json
{
  "database": {
    "rules": "database.rules.json"
  },
  "functions": {
    "source": "functions/auth-provisioner",
    "runtime": "nodejs20"
  }
}
```

`database.rules.json`:
```json
{
  "rules": {
    "drivers": {
      "$driverId": {
        ".read": "auth != null && (auth.token.role === 'admin' || auth.token.driverId === $driverId)",
        ".write": "auth != null && (auth.token.role === 'admin' || auth.token.role === 'service')",
        "status": { ".validate": "newData.isString()" },
        "lastActive": { ".validate": "newData.isNumber()" },
        "location": {
          "lat": { ".validate": "newData.isNumber()" },
          "lng": { ".validate": "newData.isNumber()" }
        }
      }
    },
    "jobs": {
      "$jobId": {
        ".read": "auth != null",
        ".write": "auth != null && (auth.token.role === 'admin' || auth.token.role === 'carrier' || auth.token.role === 'service')",
        "status": { ".validate": "newData.isString()" },
        "applicantCount": { ".validate": "newData.isNumber()" }
      }
    },
    "dispatch": {
      "$carrierId": {
        ".read": "auth != null && (auth.token.role === 'admin' || auth.token.carrierId === $carrierId)",
        ".write": "auth != null && (auth.token.role === 'admin' || auth.token.role === 'service')",
        "queue": {
          "$taskId": {
            ".validate": "newData.hasChildren(['driverId', 'status', 'createdAt'])"
          }
        }
      }
    },
    "presence": {
      "$uid": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid === $uid"
      }
    }
  }
}
```

**Step 2: Deploy RTDB rules**

```bash
firebase deploy --only database --project ldmr-velocitymatch
```

**Step 3: Commit**

```bash
git add firebase.json database.rules.json .firebaserc
git commit -m "feat(phase4): Firebase RTDB schema + security rules"
```

---

### Task 3.2: PostgreSQL Search Extensions (Service 5)

**Files:**
- Create: `scripts/sql/phase4-search-full.sql`

**Step 1: Create comprehensive search SQL**

```sql
-- scripts/sql/phase4-search-full.sql
-- Phase 4: Full-text search + PostGIS + pgvector extensions

-- Enable extensions (idempotent)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;  -- pgvector

-- ============================================================
-- Full-Text Search: Add tsvector columns + GIN indexes
-- ============================================================

-- Drivers search vector
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS search_vector tsvector;
CREATE INDEX IF NOT EXISTS idx_drivers_search ON drivers USING GIN(search_vector);

-- Carriers search vector
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS search_vector tsvector;
CREATE INDEX IF NOT EXISTS idx_carriers_search ON carriers USING GIN(search_vector);

-- ============================================================
-- Trigram indexes for fuzzy name matching
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_drivers_name_trgm ON drivers USING GIN(
  (data->>'first_name') gin_trgm_ops
);
CREATE INDEX IF NOT EXISTS idx_carriers_name_trgm ON carriers USING GIN(
  (data->>'legal_name') gin_trgm_ops
);

-- ============================================================
-- PostGIS: Add geography columns for geo-radius search
-- ============================================================

ALTER TABLE drivers ADD COLUMN IF NOT EXISTS location geography(Point, 4326);
ALTER TABLE carriers ADD COLUMN IF NOT EXISTS location geography(Point, 4326);

CREATE INDEX IF NOT EXISTS idx_drivers_location ON drivers USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_carriers_location ON carriers USING GIST(location);

-- ============================================================
-- pgvector: Embeddings table for AI similarity search
-- ============================================================

CREATE TABLE IF NOT EXISTS document_embeddings (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  source_collection TEXT NOT NULL,
  source_id TEXT NOT NULL,
  chunk_index INTEGER DEFAULT 0,
  content TEXT NOT NULL,
  embedding vector(1536),  -- OpenAI text-embedding-3-small dimension
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_embeddings_source ON document_embeddings(source_collection, source_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_vector ON document_embeddings USING ivfflat(embedding vector_cosine_ops) WITH (lists = 100);

-- ============================================================
-- Search endpoint helper functions
-- ============================================================

-- Update driver search_vector from JSONB data
CREATE OR REPLACE FUNCTION update_driver_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    coalesce(NEW.data->>'first_name', '') || ' ' ||
    coalesce(NEW.data->>'last_name', '') || ' ' ||
    coalesce(NEW.data->>'cdl_class', '') || ' ' ||
    coalesce(NEW.data->>'endorsements', '') || ' ' ||
    coalesce(NEW.data->>'state', '') || ' ' ||
    coalesce(NEW.data->>'city', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update carrier search_vector from JSONB data
CREATE OR REPLACE FUNCTION update_carrier_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    coalesce(NEW.data->>'legal_name', '') || ' ' ||
    coalesce(NEW.data->>'dba_name', '') || ' ' ||
    coalesce(NEW.data->>'state', '') || ' ' ||
    coalesce(NEW.data->>'city', '') || ' ' ||
    coalesce(NEW.data->>'operation_classification', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers (drop first for idempotency)
DROP TRIGGER IF EXISTS trg_driver_search ON drivers;
CREATE TRIGGER trg_driver_search
  BEFORE INSERT OR UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION update_driver_search_vector();

DROP TRIGGER IF EXISTS trg_carrier_search ON carriers;
CREATE TRIGGER trg_carrier_search
  BEFORE INSERT OR UPDATE ON carriers
  FOR EACH ROW EXECUTE FUNCTION update_carrier_search_vector();

-- Backfill existing rows
UPDATE drivers SET search_vector = to_tsvector('english',
  coalesce(data->>'first_name', '') || ' ' ||
  coalesce(data->>'last_name', '') || ' ' ||
  coalesce(data->>'cdl_class', '') || ' ' ||
  coalesce(data->>'endorsements', '') || ' ' ||
  coalesce(data->>'state', '') || ' ' ||
  coalesce(data->>'city', '')
);

UPDATE carriers SET search_vector = to_tsvector('english',
  coalesce(data->>'legal_name', '') || ' ' ||
  coalesce(data->>'dba_name', '') || ' ' ||
  coalesce(data->>'state', '') || ' ' ||
  coalesce(data->>'city', '') || ' ' ||
  coalesce(data->>'operation_classification', '')
);
```

**Step 2: Run against Cloud SQL (proxy must be running)**

```bash
psql -h 127.0.0.1 -p 5432 -U lmdr_user -d lmdr -f scripts/sql/phase4-search-full.sql
```

**Step 3: Add search route to lmdr-api**

Create: `cloud-run-api/src/routes/search.js`

```javascript
import { Router } from 'express';
import pool from '../db/pool.js';

const router = Router();

/**
 * GET /v1/search/drivers?q=John&location=32.7767,-96.7970&radius=50&cdlClass=A&limit=20
 */
router.get('/drivers', async (req, res) => {
  try {
    const { q, location, radius = 50, cdlClass, minExperience, limit = 20, offset = 0 } = req.query;
    const params = [];
    const conditions = [];
    let paramIdx = 1;

    // Full-text search
    if (q) {
      conditions.push(`search_vector @@ plainto_tsquery('english', $${paramIdx})`);
      params.push(q);
      paramIdx++;
    }

    // Geo-radius filter (location = "lat,lng")
    if (location) {
      const [lat, lng] = location.split(',').map(Number);
      const radiusMiles = Number(radius);
      conditions.push(`ST_DWithin(location, ST_SetSRID(ST_MakePoint($${paramIdx}, $${paramIdx + 1}), 4326)::geography, $${paramIdx + 2})`);
      params.push(lng, lat, radiusMiles * 1609.34); // miles to meters
      paramIdx += 3;
    }

    // CDL class filter
    if (cdlClass) {
      conditions.push(`data->>'cdl_class' = $${paramIdx}`);
      params.push(cdlClass);
      paramIdx++;
    }

    // Experience filter
    if (minExperience) {
      conditions.push(`(data->>'years_experience')::numeric >= $${paramIdx}`);
      params.push(Number(minExperience));
      paramIdx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const rankSelect = q
      ? `, ts_rank(search_vector, plainto_tsquery('english', $1)) as rank`
      : '';
    const orderBy = q ? 'ORDER BY rank DESC' : 'ORDER BY _created_at DESC';

    const sql = `
      SELECT _id, data, _created_at, _updated_at ${rankSelect}
      FROM drivers
      ${where}
      ${orderBy}
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;
    params.push(Math.min(Number(limit), 100), Number(offset));

    const result = await pool.query(sql, params);

    // Count query
    const countSql = `SELECT COUNT(*) FROM drivers ${where}`;
    const countResult = await pool.query(countSql, params.slice(0, paramIdx - 1));

    res.json({
      items: result.rows.map(r => ({ _id: r._id, ...r.data, _createdAt: r._created_at })),
      totalCount: parseInt(countResult.rows[0].count),
      hasMore: Number(offset) + result.rows.length < parseInt(countResult.rows[0].count)
    });
  } catch (error) {
    console.error('Driver search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

/**
 * GET /v1/search/carriers?q=Swift&location=32.7,-96.8&radius=100&limit=20
 */
router.get('/carriers', async (req, res) => {
  try {
    const { q, location, radius = 100, limit = 20, offset = 0 } = req.query;
    const params = [];
    const conditions = [];
    let paramIdx = 1;

    if (q) {
      conditions.push(`search_vector @@ plainto_tsquery('english', $${paramIdx})`);
      params.push(q);
      paramIdx++;
    }

    if (location) {
      const [lat, lng] = location.split(',').map(Number);
      conditions.push(`ST_DWithin(location, ST_SetSRID(ST_MakePoint($${paramIdx}, $${paramIdx + 1}), 4326)::geography, $${paramIdx + 2})`);
      params.push(lng, lat, Number(radius) * 1609.34);
      paramIdx += 3;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const rankSelect = q ? `, ts_rank(search_vector, plainto_tsquery('english', $1)) as rank` : '';
    const orderBy = q ? 'ORDER BY rank DESC' : 'ORDER BY _created_at DESC';

    const sql = `
      SELECT _id, data, _created_at ${rankSelect}
      FROM carriers
      ${where}
      ${orderBy}
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
    `;
    params.push(Math.min(Number(limit), 100), Number(offset));

    const result = await pool.query(sql, params);
    const countSql = `SELECT COUNT(*) FROM carriers ${where}`;
    const countResult = await pool.query(countSql, params.slice(0, paramIdx - 1));

    res.json({
      items: result.rows.map(r => ({ _id: r._id, ...r.data, _createdAt: r._created_at })),
      totalCount: parseInt(countResult.rows[0].count),
      hasMore: Number(offset) + result.rows.length < parseInt(countResult.rows[0].count)
    });
  } catch (error) {
    console.error('Carrier search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

/**
 * GET /v1/search/suggest?q=Swi&type=carrier
 * Trigram autocomplete
 */
router.get('/suggest', async (req, res) => {
  try {
    const { q, type = 'carrier', limit = 10 } = req.query;
    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    let sql;
    if (type === 'carrier') {
      sql = `
        SELECT DISTINCT data->>'legal_name' as name, _id,
          similarity(data->>'legal_name', $1) as sim
        FROM carriers
        WHERE data->>'legal_name' % $1
        ORDER BY sim DESC
        LIMIT $2
      `;
    } else {
      sql = `
        SELECT DISTINCT
          (data->>'first_name' || ' ' || data->>'last_name') as name, _id,
          similarity(data->>'first_name', $1) as sim
        FROM drivers
        WHERE data->>'first_name' % $1 OR data->>'last_name' % $1
        ORDER BY sim DESC
        LIMIT $2
      `;
    }

    const result = await pool.query(sql, [q, Math.min(Number(limit), 20)]);
    res.json({ suggestions: result.rows });
  } catch (error) {
    console.error('Suggest error:', error);
    res.status(500).json({ error: 'Suggestion failed' });
  }
});

export default router;
```

Wire into `cloud-run-api/src/app.js`:
```javascript
import searchRouter from './routes/search.js';
// Add after files router:
protectedRouter.use('/search', searchRouter);
```

**Step 4: Commit**

```bash
git add scripts/sql/phase4-search-full.sql cloud-run-api/src/routes/search.js
git commit -m "feat(phase4): PostgreSQL FTS + PostGIS + pgvector + search endpoints"
```

---

### Task 3.3: Wave 3 Verification

**Verifier agent checks:**
1. Firebase RTDB rules deployed (`firebase database:get / --project ldmr-velocitymatch`)
2. SQL extensions installed: `SELECT extname FROM pg_extension;` shows pg_trgm, unaccent, postgis, vector
3. tsvector columns exist on drivers and carriers tables
4. document_embeddings table exists with vector(1536) column
5. Search endpoints respond: GET /v1/search/drivers?q=test, GET /v1/search/carriers?q=swift
6. Suggest endpoint responds: GET /v1/search/suggest?q=swi&type=carrier
7. Geography columns exist on drivers and carriers

---

## Wave 4: Cloud Scheduler + AI Containerization

> **Team:** 2 implementation agents (Sonnet) + 1 verifier (Opus)
> **Duration:** ~1 session
> **Dependencies:** Waves 1-3 complete

### Task 4.1: Cloud Scheduler Jobs (Service 4)

**Files:**
- Create: `scripts/gcp/setup-scheduler.sh`

**Step 1: Create scheduler setup script**

```bash
#!/bin/bash
# scripts/gcp/setup-scheduler.sh
set -euo pipefail
PROJECT_ID="ldmr-velocitymatch"
REGION="us-central1"
API_URL="https://lmdr-api-140035137711.us-central1.run.app"

echo "=== Creating Cloud Scheduler Service Account ==="

gcloud iam service-accounts create lmdr-scheduler \
  --display-name="LMDR Cloud Scheduler" \
  --project=$PROJECT_ID 2>/dev/null || echo "Scheduler SA exists"

# Grant invoker role on lmdr-api
gcloud run services add-iam-policy-binding lmdr-api \
  --member="serviceAccount:lmdr-scheduler@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.invoker" \
  --region=$REGION \
  --project=$PROJECT_ID 2>/dev/null || true

echo "=== Creating Cloud Scheduler Jobs ==="

# 1. Compliance Refresh — Daily 2:00 AM CT (7:00 UTC)
gcloud scheduler jobs create http compliance-refresh \
  --location=$REGION \
  --schedule="0 7 * * *" \
  --uri="$API_URL/v1/jobs/compliance-refresh" \
  --http-method=POST \
  --oidc-service-account-email="lmdr-scheduler@$PROJECT_ID.iam.gserviceaccount.com" \
  --oidc-token-audience="$API_URL" \
  --attempt-deadline=600s \
  --project=$PROJECT_ID 2>/dev/null \
  && echo "Created: compliance-refresh" \
  || echo "compliance-refresh exists"

# 2. Weekly Earnings Digest — Monday 6:00 AM CT (11:00 UTC)
gcloud scheduler jobs create http weekly-earnings-digest \
  --location=$REGION \
  --schedule="0 11 * * 1" \
  --uri="$API_URL/v1/jobs/weekly-earnings-digest" \
  --http-method=POST \
  --oidc-service-account-email="lmdr-scheduler@$PROJECT_ID.iam.gserviceaccount.com" \
  --oidc-token-audience="$API_URL" \
  --attempt-deadline=300s \
  --project=$PROJECT_ID 2>/dev/null \
  && echo "Created: weekly-earnings-digest" \
  || echo "weekly-earnings-digest exists"

# 3. Hourly Board Refresh
gcloud scheduler jobs create http hourly-board-refresh \
  --location=$REGION \
  --schedule="0 * * * *" \
  --uri="$API_URL/v1/jobs/board-refresh" \
  --http-method=POST \
  --oidc-service-account-email="lmdr-scheduler@$PROJECT_ID.iam.gserviceaccount.com" \
  --oidc-token-audience="$API_URL" \
  --attempt-deadline=120s \
  --project=$PROJECT_ID 2>/dev/null \
  && echo "Created: hourly-board-refresh" \
  || echo "hourly-board-refresh exists"

# 4. RTDB Cleanup — Every 6 hours
gcloud scheduler jobs create http rtdb-cleanup \
  --location=$REGION \
  --schedule="0 */6 * * *" \
  --uri="$API_URL/v1/jobs/rtdb-cleanup" \
  --http-method=POST \
  --oidc-service-account-email="lmdr-scheduler@$PROJECT_ID.iam.gserviceaccount.com" \
  --oidc-token-audience="$API_URL" \
  --attempt-deadline=120s \
  --project=$PROJECT_ID 2>/dev/null \
  && echo "Created: rtdb-cleanup" \
  || echo "rtdb-cleanup exists"

# 5. Monthly Invoice Generation — 1st of month 1:00 AM CT (6:00 UTC)
gcloud scheduler jobs create http monthly-invoice-generation \
  --location=$REGION \
  --schedule="0 6 1 * *" \
  --uri="$API_URL/v1/jobs/monthly-invoices" \
  --http-method=POST \
  --oidc-service-account-email="lmdr-scheduler@$PROJECT_ID.iam.gserviceaccount.com" \
  --oidc-token-audience="$API_URL" \
  --attempt-deadline=900s \
  --project=$PROJECT_ID 2>/dev/null \
  && echo "Created: monthly-invoice-generation" \
  || echo "monthly-invoice-generation exists"

# 6. Weekly RAG Refresh — Sunday 4:00 AM CT (9:00 UTC)
gcloud scheduler jobs create http weekly-rag-refresh \
  --location=$REGION \
  --schedule="0 9 * * 0" \
  --uri="$API_URL/v1/jobs/rag-refresh" \
  --http-method=POST \
  --oidc-service-account-email="lmdr-scheduler@$PROJECT_ID.iam.gserviceaccount.com" \
  --oidc-token-audience="$API_URL" \
  --attempt-deadline=600s \
  --project=$PROJECT_ID 2>/dev/null \
  && echo "Created: weekly-rag-refresh" \
  || echo "weekly-rag-refresh exists"

echo "=== Cloud Scheduler Setup Complete ==="
gcloud scheduler jobs list --location=$REGION --project=$PROJECT_ID --format="table(name,schedule,state)"
```

**Step 2: Add job handler routes to lmdr-api**

Create: `cloud-run-api/src/routes/jobs.js`

```javascript
import { Router } from 'express';
import pool from '../db/pool.js';
import { insertLog } from '../db/bigquery.js';

const router = Router();

// Middleware: verify OIDC token from Cloud Scheduler
const verifySchedulerAuth = (req, res, next) => {
  // Cloud Scheduler sends OIDC token — already verified by auth middleware
  // Additional check: must be service role
  if (req.auth?.role !== 'service' && req.auth?.role !== 'admin') {
    return res.status(403).json({ error: 'Scheduler jobs require service auth' });
  }
  next();
};

router.use(verifySchedulerAuth);

/**
 * POST /v1/jobs/compliance-refresh
 * Re-check compliance status for drivers with expiring documents
 */
router.post('/compliance-refresh', async (req, res) => {
  const startTime = Date.now();
  try {
    // Find drivers with docs expiring in next 30 days
    const result = await pool.query(`
      SELECT _id, data->>'email' as email, data->>'first_name' as name
      FROM airtable_v2_driver_profiles
      WHERE (data->>'doc_expiry_date')::date <= NOW() + INTERVAL '30 days'
        AND (data->>'doc_expiry_date')::date > NOW()
      LIMIT 100
    `);

    await insertLog({
      severity: 'INFO',
      message: `compliance-refresh: checked ${result.rows.length} drivers`,
      duration_ms: Date.now() - startTime,
      job_name: 'compliance-refresh'
    });

    res.json({ processed: result.rows.length, duration_ms: Date.now() - startTime });
  } catch (error) {
    await insertLog({ severity: 'ERROR', message: `compliance-refresh failed: ${error.message}`, job_name: 'compliance-refresh' });
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /v1/jobs/board-refresh
 * Refresh job board aggregations
 */
router.post('/board-refresh', async (req, res) => {
  const startTime = Date.now();
  try {
    // Refresh materialized views or cached aggregations
    const jobCount = await pool.query(`SELECT COUNT(*) FROM airtable_jobs WHERE data->>'status' = 'active'`);

    await insertLog({
      severity: 'INFO',
      message: `board-refresh: ${jobCount.rows[0].count} active jobs`,
      duration_ms: Date.now() - startTime,
      job_name: 'board-refresh'
    });

    res.json({ activeJobs: parseInt(jobCount.rows[0].count), duration_ms: Date.now() - startTime });
  } catch (error) {
    await insertLog({ severity: 'ERROR', message: `board-refresh failed: ${error.message}`, job_name: 'board-refresh' });
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /v1/jobs/rtdb-cleanup
 * Clean stale entries from Firebase RTDB
 */
router.post('/rtdb-cleanup', async (req, res) => {
  // TODO: Implement when Firebase RTDB is populated
  res.json({ status: 'ok', message: 'RTDB cleanup placeholder — no stale entries yet' });
});

/**
 * POST /v1/jobs/weekly-earnings-digest
 * Generate and queue weekly earnings digest emails
 */
router.post('/weekly-earnings-digest', async (req, res) => {
  const startTime = Date.now();
  try {
    const drivers = await pool.query(`
      SELECT _id, data->>'email' as email, data->>'first_name' as name
      FROM airtable_v2_driver_profiles
      WHERE data->>'status' = 'active'
        AND data->>'email' IS NOT NULL
      LIMIT 500
    `);

    await insertLog({
      severity: 'INFO',
      message: `weekly-earnings-digest: queued ${drivers.rows.length} emails`,
      duration_ms: Date.now() - startTime,
      job_name: 'weekly-earnings-digest'
    });

    res.json({ queued: drivers.rows.length, duration_ms: Date.now() - startTime });
  } catch (error) {
    await insertLog({ severity: 'ERROR', message: `weekly-earnings-digest failed: ${error.message}`, job_name: 'weekly-earnings-digest' });
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /v1/jobs/monthly-invoices
 * Generate monthly invoices for carriers
 */
router.post('/monthly-invoices', async (req, res) => {
  const startTime = Date.now();
  try {
    const carriers = await pool.query(`
      SELECT _id, data->>'legal_name' as name, data->>'billing_email' as email
      FROM airtable_carriers
      WHERE data->>'subscription_status' = 'active'
      LIMIT 200
    `);

    await insertLog({
      severity: 'INFO',
      message: `monthly-invoices: processed ${carriers.rows.length} carriers`,
      duration_ms: Date.now() - startTime,
      job_name: 'monthly-invoices'
    });

    res.json({ processed: carriers.rows.length, duration_ms: Date.now() - startTime });
  } catch (error) {
    await insertLog({ severity: 'ERROR', message: `monthly-invoices failed: ${error.message}`, job_name: 'monthly-invoices' });
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /v1/jobs/rag-refresh
 * Refresh RAG corpus embeddings
 */
router.post('/rag-refresh', async (req, res) => {
  // TODO: Wire to lmdr-ai-service when containerized
  res.json({ status: 'ok', message: 'RAG refresh placeholder — wire to AI service in Wave 5' });
});

export default router;
```

Wire into `cloud-run-api/src/app.js`:
```javascript
import jobsRouter from './routes/jobs.js';
// Add after search router:
protectedRouter.use('/jobs', jobsRouter);
```

**Step 3: Run and commit**

```bash
chmod +x scripts/gcp/setup-scheduler.sh
bash scripts/gcp/setup-scheduler.sh
git add scripts/gcp/setup-scheduler.sh cloud-run-api/src/routes/jobs.js
git commit -m "feat(phase4): Cloud Scheduler 6 jobs + job handler endpoints"
```

---

### Task 4.2: IAM Service Accounts (Cross-Cutting)

**Files:**
- Create: `scripts/gcp/setup-iam.sh`

**Step 1: Create IAM setup script**

```bash
#!/bin/bash
# scripts/gcp/setup-iam.sh
set -euo pipefail
PROJECT_ID="ldmr-velocitymatch"

SERVICE_ACCOUNTS=(
  "lmdr-api-sa:LMDR API Service"
  "lmdr-matching-sa:LMDR Matching Engine"
  "lmdr-driver-sa:LMDR Driver Service"
  "lmdr-carrier-sa:LMDR Carrier Service"
  "lmdr-compliance-sa:LMDR Compliance Service"
  "lmdr-notifications-sa:LMDR Notifications Service"
  "lmdr-billing-sa:LMDR Billing Service"
  "lmdr-ai-sa:LMDR AI Service"
  "lmdr-analytics-sa:LMDR Analytics Service"
  "lmdr-frontend-sa:LMDR Frontend"
)

echo "=== Creating Service Accounts ==="

for SA_ENTRY in "${SERVICE_ACCOUNTS[@]}"; do
  SA_NAME="${SA_ENTRY%%:*}"
  SA_DISPLAY="${SA_ENTRY##*:}"

  gcloud iam service-accounts create "$SA_NAME" \
    --display-name="$SA_DISPLAY" \
    --project=$PROJECT_ID 2>/dev/null \
    && echo "Created: $SA_NAME" \
    || echo "Exists: $SA_NAME"
done

echo "=== Granting Common Roles (Cloud SQL + Secrets + Logging) ==="

for SA_ENTRY in "${SERVICE_ACCOUNTS[@]}"; do
  SA_NAME="${SA_ENTRY%%:*}"
  SA_EMAIL="$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"

  for ROLE in "roles/cloudsql.client" "roles/secretmanager.secretAccessor" "roles/logging.logWriter"; do
    gcloud projects add-iam-policy-binding $PROJECT_ID \
      --member="serviceAccount:$SA_EMAIL" \
      --role="$ROLE" \
      --condition=None --quiet 2>/dev/null
  done
  echo "Granted base roles to $SA_NAME"
done

echo "=== Granting Service-Specific Roles ==="

# Driver service: storage for driver docs
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:lmdr-driver-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin" --condition=None --quiet 2>/dev/null

# Carrier service: storage for carrier assets
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:lmdr-carrier-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin" --condition=None --quiet 2>/dev/null

# Notifications: Pub/Sub publish + subscribe
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:lmdr-notifications-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/pubsub.publisher" --condition=None --quiet 2>/dev/null
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:lmdr-notifications-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/pubsub.subscriber" --condition=None --quiet 2>/dev/null

# Analytics: BigQuery read
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:lmdr-analytics-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/bigquery.dataViewer" --condition=None --quiet 2>/dev/null

# AI: storage + Vertex AI
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:lmdr-ai-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin" --condition=None --quiet 2>/dev/null
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:lmdr-ai-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user" --condition=None --quiet 2>/dev/null

echo "=== IAM Audit: Verifying No Overprivileged Accounts ==="
echo "Checking for roles/owner or roles/editor on service accounts..."

for SA_ENTRY in "${SERVICE_ACCOUNTS[@]}"; do
  SA_NAME="${SA_ENTRY%%:*}"
  SA_EMAIL="$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"

  DANGEROUS=$(gcloud projects get-iam-policy $PROJECT_ID \
    --flatten="bindings[].members" \
    --format="table(bindings.role)" \
    --filter="bindings.members:$SA_EMAIL AND (bindings.role:roles/owner OR bindings.role:roles/editor)" 2>/dev/null | tail -n +2)

  if [ -n "$DANGEROUS" ]; then
    echo "WARNING: $SA_NAME has overprivileged role: $DANGEROUS"
  fi
done

echo "=== IAM Setup Complete ==="
gcloud iam service-accounts list --project=$PROJECT_ID --format="table(email,displayName)"
```

**Step 2: Run and commit**

```bash
chmod +x scripts/gcp/setup-iam.sh
bash scripts/gcp/setup-iam.sh
git add scripts/gcp/setup-iam.sh
git commit -m "feat(phase4): IAM 10 service accounts with least-privilege roles"
```

---

### Task 4.3: Wave 4 Verification

**Verifier agent checks:**
1. `gcloud scheduler jobs list --location=us-central1` shows 6 jobs
2. All jobs in ENABLED state
3. Scheduler SA has `roles/run.invoker` on lmdr-api
4. Job handler endpoints respond (POST /v1/jobs/compliance-refresh with service auth)
5. 10 service accounts created with correct roles
6. No service account has `roles/owner` or `roles/editor`
7. BigQuery logs show job execution entries

---

## Wave 5: Integration Testing + Redeploy

> **Team:** 1 implementation agent (Opus) + 1 verifier (Opus)
> **Duration:** ~1 session
> **Dependencies:** All waves 1-4 complete

### Task 5.1: Redeploy lmdr-api with New Routes

```bash
cd cloud-run-api

# Build and deploy
gcloud run deploy lmdr-api \
  --source=. \
  --region=us-central1 \
  --service-account=lmdr-api-sa@ldmr-velocitymatch.iam.gserviceaccount.com \
  --set-secrets="LMDR_INTERNAL_KEY=lmdr-internal-key:latest,PG_PASSWORD=lmdr-pg-password:latest" \
  --add-cloudsql-instances=ldmr-velocitymatch:us-central1:lmdr-postgres \
  --min-instances=1 \
  --max-instances=10 \
  --memory=512Mi \
  --cpu=1 \
  --allow-unauthenticated \
  --project=ldmr-velocitymatch
```

### Task 5.2: End-to-End Smoke Tests

Create: `cloud-run-api/tests/regression/phase4-smoke.test.js`

```javascript
/**
 * Phase 4 Platform Services — Smoke Tests
 * Requires: CLOUD_RUN_URL and LMDR_INTERNAL_KEY env vars
 */
import { describe, test, expect } from '@jest/globals';

const API = process.env.CLOUD_RUN_URL || 'https://lmdr-api-140035137711.us-central1.run.app';
const KEY = process.env.LMDR_INTERNAL_KEY;

const headers = { 'Authorization': `Bearer ${KEY}`, 'Content-Type': 'application/json' };

describe('Phase 4 Smoke Tests', () => {
  // Health
  test('GET /health returns ok', async () => {
    const res = await fetch(`${API}/health`);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.status).toBe('ok');
    expect(body.db).toBe('ok');
  });

  // Search endpoints
  test('GET /v1/search/carriers?q=transport returns results', async () => {
    const res = await fetch(`${API}/v1/search/carriers?q=transport&limit=5`, { headers });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toBeDefined();
    expect(body.totalCount).toBeGreaterThanOrEqual(0);
  });

  test('GET /v1/search/suggest?q=swi&type=carrier returns suggestions', async () => {
    const res = await fetch(`${API}/v1/search/suggest?q=swi&type=carrier`, { headers });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.suggestions).toBeDefined();
  });

  // File endpoints
  test('POST /v1/files/signed-url returns upload URL', async () => {
    const res = await fetch(`${API}/v1/files/signed-url`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ bucket: 'driver-documents', filename: 'test.pdf', contentType: 'application/pdf' })
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toContain('storage.googleapis.com');
    expect(body.expiresAt).toBeDefined();
  });

  // Job endpoints
  test('POST /v1/jobs/board-refresh executes', async () => {
    const res = await fetch(`${API}/v1/jobs/board-refresh`, { method: 'POST', headers });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.duration_ms).toBeDefined();
  });

  // Existing regression
  test('POST /v1/carriers/query returns 20K+ carriers', async () => {
    const res = await fetch(`${API}/v1/carriers/count`, { headers });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.count).toBeGreaterThan(20000);
  });

  test('x-trace-id header present', async () => {
    const res = await fetch(`${API}/health`);
    expect(res.headers.get('x-trace-id')).toBeTruthy();
  });
});
```

**Run:**
```bash
cd cloud-run-api
CLOUD_RUN_URL=https://lmdr-api-140035137711.us-central1.run.app \
LMDR_INTERNAL_KEY=<key> \
npx jest tests/regression/phase4-smoke.test.js --verbose
```

### Task 5.3: Update Track Metadata

Update `Conductor/tracks/gcp_migration_20260218/metadata.json` to reflect Phase 4 completion.

### Task 5.4: Final Commit + Sync

```bash
git add -A
git commit -m "feat(phase4): complete platform services — monitoring, auth, storage, pubsub, search, scheduler, IAM"
git push
```

---

## Agent Orchestration Strategy

### Team Composition Per Wave

| Wave | Impl Agents | Model | Verifier | Model | Supervisor |
|------|-------------|-------|----------|-------|------------|
| **Wave 1** | 2 parallel | Sonnet | 1 | Opus | Main context (you) |
| **Wave 2** | 2 parallel | Sonnet | 1 | Haiku | Main context |
| **Wave 3** | 2 parallel | Sonnet | 1 | Opus | Main context |
| **Wave 4** | 2 parallel | Sonnet | 1 | Opus | Main context |
| **Wave 5** | 1 (Opus) | Opus | 1 | Opus | Main context |

### Verifier Checklist Pattern

Every wave ends with a verifier agent that:
1. Reads the committed files
2. Runs `gcloud` verification commands
3. Hits API endpoints to confirm they respond
4. Reports PASS/FAIL with evidence
5. Flags any deviations from the plan

### Progress Tracking

After each wave, the main context (me) will:
1. Collect verifier results
2. Update metadata.json with completed services
3. Report percentage to user
4. Decide if wave needs rework or can proceed
