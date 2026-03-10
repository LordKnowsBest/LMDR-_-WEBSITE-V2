# LMDR GCP Migration — Phase 4 Addendum: Platform Services
## Implementation Plan

**Track:** `gcp_migration_20260218`
**Addendum:** `ADDENDUM_phase4_platform_services`
**GCP Project:** `ldmr-velocitymatch`
**Region:** `us-central1`
**Date:** 2026-03-09
**Estimated Duration:** 5 weeks
**Reference PRD:** `ADDENDUM_phase4_platform_services/PRD.md`

---

## Timeline Overview

| Week | Tasks | Focus |
|------|-------|-------|
| Week 1 | Task 1, Task 10 (partial) | Observability foundation + Firebase project setup |
| Week 2 | Task 2, Task 3, Task 4, Task 5, Task 6 | Auth flows + Storage + Pub/Sub + RTDB |
| Week 3 | Task 3 (frontend), Task 7, Task 8 | Auth frontend + Scheduler + Search |
| Week 4 | Task 9, Task 11 | AI service + IAM hardening |
| Week 5 | Task 12, Task 13 | Integration testing + Wix decommission |

---

## Task 1 — Firebase Project Setup

**Estimated time:** 1–2 days
**Owner:** Platform Engineer
**Pre-requisites:** GCP project `ldmr-velocitymatch` exists, billing enabled

### 1.1 Create Firebase Project Linked to GCP

```bash
# Firebase CLI must be installed: npm install -g firebase-tools
firebase login
firebase projects:addfirebase ldmr-velocitymatch
```

In Firebase Console (console.firebase.google.com):
- Select project `ldmr-velocitymatch`
- Upgrade to Blaze plan (required for Cloud Functions)
- Note the Firebase project config object (used in frontend)

### 1.2 Enable Authentication Providers

In Firebase Console → Authentication → Sign-in method:
- Enable **Email/Password** provider
- Enable **Google** provider
  - Support email: `platform@lmdr.io` (or team alias)
  - Authorized domain: add `lmdr.io` and the Cloud Run frontend URL

```bash
# Alternatively via gcloud (Firebase Auth APIs):
gcloud services enable identitytoolkit.googleapis.com \
  --project=ldmr-velocitymatch
```

### 1.3 Download and Store Firebase Admin SDK Service Account

In Firebase Console → Project Settings → Service Accounts:
- Click "Generate new private key"
- Save JSON file locally as `firebase-adminsdk-temp.json`

```bash
# Store in Secret Manager
gcloud secrets create firebase-admin-sdk \
  --project=ldmr-velocitymatch \
  --replication-policy=automatic

gcloud secrets versions add firebase-admin-sdk \
  --project=ldmr-velocitymatch \
  --data-file=firebase-adminsdk-temp.json

# Delete local copy immediately
rm firebase-adminsdk-temp.json
```

Verify:
```bash
gcloud secrets versions access latest \
  --secret=firebase-admin-sdk \
  --project=ldmr-velocitymatch | python3 -m json.tool | head -5
```

### 1.4 Install Firebase Admin SDK in Shared Middleware Package

File: `packages/lmdr-middleware/package.json`
```json
{
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "express": "^4.18.0"
  }
}
```

File: `packages/lmdr-middleware/src/firebase-admin.ts`
```typescript
import * as admin from 'firebase-admin';

let app: admin.app.App;

export function getFirebaseAdmin(): admin.app.App {
  if (!app) {
    const serviceAccount = JSON.parse(
      process.env.FIREBASE_ADMIN_SDK_JSON || '{}'
    );
    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://ldmr-velocitymatch-default-rtdb.firebaseio.com`
    });
  }
  return app;
}
```

File: `packages/lmdr-middleware/src/verifyFirebaseToken.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { getFirebaseAdmin } from './firebase-admin';

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    role: 'driver' | 'carrier' | 'admin';
    driverId?: string;
    carrierId?: string;
  };
}

export async function verifyFirebaseToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing Authorization header' });
    return;
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const admin = getFirebaseAdmin();
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decoded.uid,
      role: decoded.role as 'driver' | 'carrier' | 'admin',
      driverId: decoded.driverId,
      carrierId: decoded.carrierId,
    };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
```

File: `packages/lmdr-middleware/src/index.ts`
```typescript
export { verifyFirebaseToken, AuthenticatedRequest } from './verifyFirebaseToken';
export { getFirebaseAdmin } from './firebase-admin';
```

### 1.5 Create Auth Provisioner Cloud Function

File: `functions/lmdr-auth-provisioner/index.ts`
```typescript
import * as functions from 'firebase-functions/v2';
import fetch from 'node-fetch';

export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName } = user;
  // role is passed via custom metadata during registration
  // For the auth hook, we use a default; role is set by the client-side flow
  const response = await fetch(
    `${process.env.LMDR_API_URL}/internal/users/provision`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': process.env.INTERNAL_SECRET!,
      },
      body: JSON.stringify({ uid, email, displayName }),
    }
  );
  if (!response.ok) {
    console.error(`Failed to provision user ${uid}: ${response.status}`);
  }
});
```

Deploy:
```bash
cd functions/lmdr-auth-provisioner
npm install
firebase deploy --only functions:onUserCreated --project=ldmr-velocitymatch
```

Environment variables for the function:
```bash
firebase functions:config:set \
  lmdr.api_url="https://lmdr-api-<hash>-uc.a.run.app" \
  lmdr.internal_secret="<generate-with-openssl-rand-base64-32>" \
  --project=ldmr-velocitymatch
```

---

## Task 2 — Firebase Auth: User Provisioning Flow

**Estimated time:** 2 days
**Owner:** Backend Engineer
**Pre-requisites:** Task 1 complete; `lmdr-api` Cloud Run deployed (Phase 1 Addendum)

### 2.1 Add Internal Provisioning Endpoint to lmdr-api

File: `services/lmdr-api/src/routes/internal/users.ts`
```typescript
import { Router } from 'express';
import { getFirebaseAdmin } from '@lmdr/middleware';
import { pool } from '../../db';

const router = Router();

// Called by Cloud Function onUserCreated
// Protected by X-Internal-Secret header (not Firebase Auth)
router.post('/provision', async (req, res) => {
  const secret = req.headers['x-internal-secret'];
  if (secret !== process.env.INTERNAL_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { uid, email, displayName, role } = req.body;

  try {
    // Default role to 'driver' if not specified (carrier flow sets role explicitly)
    const userRole = role || 'driver';

    const client = await pool.connect();
    let entityId: string;

    if (userRole === 'driver') {
      const result = await client.query(
        `INSERT INTO drivers (firebase_uid, email, display_name, status)
         VALUES ($1, $2, $3, 'pending') RETURNING id`,
        [uid, email, displayName]
      );
      entityId = result.rows[0].id;
    } else if (userRole === 'carrier') {
      const result = await client.query(
        `INSERT INTO carriers (firebase_uid, email, display_name, status)
         VALUES ($1, $2, $3, 'pending') RETURNING id`,
        [uid, email, displayName]
      );
      entityId = result.rows[0].id;
    }
    client.release();

    // Set custom claims
    const admin = getFirebaseAdmin();
    const claims: Record<string, string> = { role: userRole };
    if (userRole === 'driver') claims.driverId = entityId!;
    if (userRole === 'carrier') claims.carrierId = entityId!;
    await admin.auth().setCustomUserClaims(uid, claims);

    res.json({ success: true, entityId });
  } catch (err) {
    console.error('Provisioning error:', err);
    res.status(500).json({ error: 'Provisioning failed' });
  }
});

export default router;
```

### 2.2 Admin User Provisioning Script

File: `scripts/provision-admin.ts`
```typescript
import * as admin from 'firebase-admin';

// Run once per admin user: ts-node scripts/provision-admin.ts <email>
async function provisionAdmin(email: string) {
  const serviceAccount = require('../firebase-adminsdk-local.json');
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });

  const user = await admin.auth().getUserByEmail(email);
  await admin.auth().setCustomUserClaims(user.uid, { role: 'admin' });
  console.log(`Admin claims set for ${email} (uid: ${user.uid})`);
}

provisionAdmin(process.argv[2]);
```

### 2.3 Email Template Customization

In Firebase Console → Authentication → Templates:
- **Password reset:** Update sender name to "LMDR Platform", subject: "Reset your LMDR password", customize body with LMDR branding
- **Email verification:** Subject: "Verify your LMDR account email"
- **Email change notification:** Subject: "Your LMDR email address was changed"

### 2.4 Update lmdr-api to Use verifyFirebaseToken Middleware

File: `services/lmdr-api/src/app.ts`
```typescript
import { verifyFirebaseToken } from '@lmdr/middleware';

// Public routes (no auth required)
app.use('/internal', internalRouter);  // X-Internal-Secret protected
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// All other routes require Firebase Auth
app.use(verifyFirebaseToken);
app.use('/api', apiRouter);
```

Repeat this pattern for all 8 remaining Phase 2 services.

---

## Task 3 — Firebase Auth: Frontend Integration

**Estimated time:** 2–3 days
**Owner:** Frontend Engineer
**Pre-requisites:** Task 1 complete; Firebase project config available; `lmdr-frontend` deployed (Phase 3)

### 3.1 Install Firebase SDK in Frontend

```bash
cd frontend
npm install firebase
```

### 3.2 Firebase Initialization

File: `frontend/src/lib/firebase.ts`
```typescript
import { initializeApp, getApps } from 'firebase/app';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: 'ldmr-velocitymatch',
  storageBucket: 'ldmr-velocitymatch.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: 'https://ldmr-velocitymatch-default-rtdb.firebaseio.com',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export default app;
```

Add to `frontend/.env.local` (and Cloud Run environment variables):
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ldmr-velocitymatch.firebaseapp.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### 3.3 Auth Utility Functions

File: `frontend/src/lib/auth.ts`
```typescript
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import app from './firebase';

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export const signIn = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const signUp = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

export const signOut = () => firebaseSignOut(auth);

export const getIdToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  return user ? user.getIdToken() : null;
};

export const currentUser = (): User | null => auth.currentUser;

export const onAuthChange = (callback: (user: User | null) => void) =>
  onAuthStateChanged(auth, callback);
```

### 3.4 Auth Context

File: `frontend/src/contexts/AuthContext.tsx`
```typescript
'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange } from '../lib/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  role: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  role: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    return onAuthChange(async (u) => {
      setUser(u);
      if (u) {
        const idTokenResult = await u.getIdTokenResult();
        setRole((idTokenResult.claims.role as string) || null);
      } else {
        setRole(null);
      }
      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, role }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### 3.5 API Client with Auto-Token Injection

File: `frontend/src/lib/api-client.ts`
```typescript
import { getIdToken } from './auth';

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = await getIdToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json();
}
```

### 3.6 Update Next.js Middleware for Protected Routes

File: `frontend/src/middleware.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PATHS = ['/dashboard', '/profile', '/jobs/apply', '/carrier'];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PATHS.some((p) => path.startsWith(p));

  if (isProtected) {
    // Firebase session cookie verification happens client-side via AuthContext
    // Server-side: check for presence of session cookie set post-login
    const session = request.cookies.get('lmdr-session');
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/carrier/:path*'],
};
```

---

## Task 4 — Cloud Storage Buckets Setup

**Estimated time:** 1–2 days
**Owner:** Platform Engineer
**Pre-requisites:** GCP project billing enabled, IAM service accounts from Task 1 created

### 4.1 Create Buckets

```bash
# Driver documents — private, versioned, 7-year retention
gcloud storage buckets create gs://lmdr-driver-documents \
  --project=ldmr-velocitymatch \
  --location=us-central1 \
  --uniform-bucket-level-access \
  --public-access-prevention

# Carrier assets — private, versioned, 7-year retention
gcloud storage buckets create gs://lmdr-carrier-assets \
  --project=ldmr-velocitymatch \
  --location=us-central1 \
  --uniform-bucket-level-access \
  --public-access-prevention

# Static assets — public, CDN-backed
gcloud storage buckets create gs://lmdr-static-assets \
  --project=ldmr-velocitymatch \
  --location=us-central1 \
  --uniform-bucket-level-access

# AI training data — private
gcloud storage buckets create gs://lmdr-ai-training-data \
  --project=ldmr-velocitymatch \
  --location=us-central1 \
  --uniform-bucket-level-access \
  --public-access-prevention
```

### 4.2 Enable Versioning

```bash
gcloud storage buckets update gs://lmdr-driver-documents --versioning
gcloud storage buckets update gs://lmdr-carrier-assets --versioning
```

### 4.3 Set Lifecycle Policies

File: `infra/storage/driver-documents-lifecycle.json`
```json
{
  "rule": [
    {
      "action": { "type": "Delete" },
      "condition": {
        "age": 2555,
        "matchesPrefix": ["tmp/"]
      }
    },
    {
      "action": { "type": "Delete" },
      "condition": {
        "age": 1,
        "matchesPrefix": ["tmp/"],
        "isLive": true
      }
    }
  ]
}
```

```bash
gcloud storage buckets update gs://lmdr-driver-documents \
  --lifecycle-file=infra/storage/driver-documents-lifecycle.json

gcloud storage buckets update gs://lmdr-carrier-assets \
  --lifecycle-file=infra/storage/driver-documents-lifecycle.json
```

### 4.4 Configure CORS for Browser Direct Upload

File: `infra/storage/cors-config.json`
```json
[
  {
    "origin": ["https://lmdr.io", "https://www.lmdr.io", "http://localhost:3000"],
    "method": ["PUT", "GET", "OPTIONS"],
    "responseHeader": ["Content-Type", "x-goog-resumable"],
    "maxAgeSeconds": 3600
  }
]
```

```bash
gcloud storage buckets update gs://lmdr-driver-documents \
  --cors-file=infra/storage/cors-config.json

gcloud storage buckets update gs://lmdr-carrier-assets \
  --cors-file=infra/storage/cors-config.json
```

### 4.5 Grant Service Account IAM on Buckets

```bash
# Driver service: objectAdmin on driver-documents
gcloud storage buckets add-iam-policy-binding gs://lmdr-driver-documents \
  --member="serviceAccount:lmdr-driver-sa@ldmr-velocitymatch.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"

# Carrier service: objectAdmin on carrier-assets
gcloud storage buckets add-iam-policy-binding gs://lmdr-carrier-assets \
  --member="serviceAccount:lmdr-carrier-sa@ldmr-velocitymatch.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"

# Compliance service: objectViewer on driver-documents
gcloud storage buckets add-iam-policy-binding gs://lmdr-driver-documents \
  --member="serviceAccount:lmdr-compliance-sa@ldmr-velocitymatch.iam.gserviceaccount.com" \
  --role="roles/storage.objectViewer"

# AI service: objectAdmin on ai-training-data
gcloud storage buckets add-iam-policy-binding gs://lmdr-ai-training-data \
  --member="serviceAccount:lmdr-ai-sa@ldmr-velocitymatch.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"

# Public read on static-assets
gcloud storage buckets add-iam-policy-binding gs://lmdr-static-assets \
  --member="allUsers" \
  --role="roles/storage.objectViewer"
```

### 4.6 Signed URL Endpoint in lmdr-driver-service

File: `services/lmdr-driver-service/src/routes/files.ts`
```typescript
import { Router } from 'express';
import { Storage } from '@google-cloud/storage';
import { AuthenticatedRequest, verifyFirebaseToken } from '@lmdr/middleware';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const storage = new Storage();

const BUCKET_MAP: Record<string, string> = {
  cdl: 'lmdr-driver-documents',
  insurance: 'lmdr-driver-documents',
  w9: 'lmdr-driver-documents',
  logo: 'lmdr-carrier-assets',
  contract: 'lmdr-carrier-assets',
};

router.post('/files/signed-url', verifyFirebaseToken, async (req: AuthenticatedRequest, res) => {
  const { fileName, contentType, purpose } = req.body;
  const bucketName = BUCKET_MAP[purpose];
  if (!bucketName) return res.status(400).json({ error: 'Invalid purpose' });

  const fileKey = `${req.user!.uid}/${purpose}/${uuidv4()}-${fileName}`;
  const [signedUrl] = await storage.bucket(bucketName).file(fileKey).getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    contentType,
  });

  res.json({ signedUrl, fileKey, bucket: bucketName });
});

export default router;
```

### 4.7 Create Pub/Sub Notification on lmdr-driver-documents

```bash
# Create the Pub/Sub topic (Task 5 will create all topics; this links GCS to it)
gcloud pubsub topics create lmdr-file-uploaded \
  --project=ldmr-velocitymatch

# Create GCS notification
gcloud storage buckets notifications create gs://lmdr-driver-documents \
  --topic=lmdr-file-uploaded \
  --project=ldmr-velocitymatch \
  --event-types=OBJECT_FINALIZE \
  --payload-format=JSON_API_V1
```

---

## Task 5 — Pub/Sub Topics and Subscriptions Setup

**Estimated time:** 1 day
**Owner:** Platform Engineer
**Pre-requisites:** Cloud Run services deployed (Phase 2), Task 4 complete (lmdr-file-uploaded topic exists)

### 5.1 Create All Pub/Sub Topics

```bash
for TOPIC in lmdr-notifications lmdr-compliance-events lmdr-job-events lmdr-driver-events; do
  gcloud pubsub topics create $TOPIC --project=ldmr-velocitymatch
done

# DLQ topics
for TOPIC in lmdr-notifications lmdr-compliance-events lmdr-job-events lmdr-driver-events lmdr-file-uploaded; do
  gcloud pubsub topics create ${TOPIC}-dlq --project=ldmr-velocitymatch
done
```

### 5.2 Create Push Subscriptions to Cloud Run Services

```bash
# lmdr-notifications → lmdr-notifications-service
gcloud pubsub subscriptions create lmdr-notifications-sub \
  --topic=lmdr-notifications \
  --project=ldmr-velocitymatch \
  --push-endpoint="https://lmdr-notifications-<hash>-uc.a.run.app/pubsub/notifications" \
  --push-auth-service-account=lmdr-notifications-sa@ldmr-velocitymatch.iam.gserviceaccount.com \
  --ack-deadline=60 \
  --max-delivery-attempts=5 \
  --dead-letter-topic=lmdr-notifications-dlq \
  --min-retry-delay=10s \
  --max-retry-delay=300s

# lmdr-file-uploaded → lmdr-compliance-service
gcloud pubsub subscriptions create lmdr-file-uploaded-sub \
  --topic=lmdr-file-uploaded \
  --project=ldmr-velocitymatch \
  --push-endpoint="https://lmdr-compliance-<hash>-uc.a.run.app/pubsub/file-uploaded" \
  --push-auth-service-account=lmdr-compliance-sa@ldmr-velocitymatch.iam.gserviceaccount.com \
  --ack-deadline=120 \
  --max-delivery-attempts=5 \
  --dead-letter-topic=lmdr-file-uploaded-dlq

# lmdr-compliance-events → lmdr-compliance-service
gcloud pubsub subscriptions create lmdr-compliance-events-sub \
  --topic=lmdr-compliance-events \
  --project=ldmr-velocitymatch \
  --push-endpoint="https://lmdr-compliance-<hash>-uc.a.run.app/pubsub/compliance-events" \
  --push-auth-service-account=lmdr-compliance-sa@ldmr-velocitymatch.iam.gserviceaccount.com \
  --ack-deadline=60 \
  --max-delivery-attempts=5 \
  --dead-letter-topic=lmdr-compliance-events-dlq

# lmdr-job-events → lmdr-matching-engine + lmdr-notifications-service (two subscriptions)
gcloud pubsub subscriptions create lmdr-job-events-matching-sub \
  --topic=lmdr-job-events \
  --project=ldmr-velocitymatch \
  --push-endpoint="https://lmdr-matching-<hash>-uc.a.run.app/pubsub/job-events" \
  --push-auth-service-account=lmdr-matching-sa@ldmr-velocitymatch.iam.gserviceaccount.com \
  --ack-deadline=60

# lmdr-driver-events → lmdr-compliance-service + lmdr-matching-engine
gcloud pubsub subscriptions create lmdr-driver-events-sub \
  --topic=lmdr-driver-events \
  --project=ldmr-velocitymatch \
  --push-endpoint="https://lmdr-compliance-<hash>-uc.a.run.app/pubsub/driver-events" \
  --push-auth-service-account=lmdr-compliance-sa@ldmr-velocitymatch.iam.gserviceaccount.com \
  --ack-deadline=60
```

Replace `<hash>` values with the actual Cloud Run service URL hashes from Phase 2 deployment.

### 5.3 Create Shared Pub/Sub Utility Package

File: `packages/lmdr-pubsub/src/publisher.ts`
```typescript
import { PubSub } from '@google-cloud/pubsub';

const pubsub = new PubSub({ projectId: 'ldmr-velocitymatch' });

export async function publishEvent(
  topicName: string,
  data: Record<string, unknown>,
  attributes?: Record<string, string>
): Promise<string> {
  const topic = pubsub.topic(topicName);
  const messageId = await topic.publishMessage({
    json: data,
    attributes,
  });
  return messageId;
}
```

File: `packages/lmdr-pubsub/src/subscriber.ts`
```typescript
import { Request, Response } from 'express';

export interface PubSubMessage {
  messageId: string;
  publishTime: string;
  data: Record<string, unknown>;
  attributes?: Record<string, string>;
}

export function parsePubSubMessage(req: Request, res: Response): PubSubMessage | null {
  try {
    const message = req.body?.message;
    if (!message) { res.status(400).send('No message'); return null; }
    const data = JSON.parse(Buffer.from(message.data, 'base64').toString());
    return { messageId: message.messageId, publishTime: message.publishTime, data, attributes: message.attributes };
  } catch {
    res.status(400).send('Invalid message format');
    return null;
  }
}
```

---

## Task 6 — Firebase Realtime Database Setup

**Estimated time:** 1–2 days
**Owner:** Backend + Frontend Engineers
**Pre-requisites:** Task 1 complete (Firebase project created), Task 3 in progress (frontend Firebase SDK installed)

### 6.1 Enable Firebase Realtime Database

In Firebase Console → Realtime Database → Create Database:
- Location: `us-central1`
- Start in **locked mode** (security rules below will be applied immediately)

```bash
# Verify RTDB is enabled
firebase database:instances:list --project=ldmr-velocitymatch
```

### 6.2 Deploy Security Rules

File: `firebase/database.rules.json`
```json
{
  "rules": {
    "drivers": {
      "$driverId": {
        ".read": "auth != null && (auth.token.role === 'admin' || auth.uid === $driverId)",
        ".write": "auth != null && (auth.token.role === 'admin' || auth.uid === $driverId)",
        "notifications": {
          ".read": "auth != null && auth.uid === $driverId"
        }
      }
    },
    "jobs": {
      "$jobId": {
        ".read": "auth != null",
        ".write": "auth != null && (auth.token.role === 'carrier' || auth.token.role === 'admin')"
      }
    },
    "dispatch": {
      "$carrierId": {
        ".read": "auth != null && (auth.token.role === 'admin' || auth.token.carrierId === $carrierId)",
        ".write": "auth != null && auth.token.role === 'admin'"
      }
    }
  }
}
```

```bash
firebase deploy --only database --project=ldmr-velocitymatch
```

### 6.3 Server SDK Wrapper Package

File: `packages/lmdr-rtdb/src/index.ts`
```typescript
import { getFirebaseAdmin } from '@lmdr/middleware';

export async function setDriverStatus(
  driverId: string,
  status: 'online' | 'offline' | 'on-trip'
): Promise<void> {
  const db = getFirebaseAdmin().database();
  await db.ref(`/drivers/${driverId}/status`).set(status);
  await db.ref(`/drivers/${driverId}/lastSeen`).set(new Date().toISOString());
}

export async function incrementNotificationCount(driverId: string): Promise<void> {
  const db = getFirebaseAdmin().database();
  const ref = db.ref(`/drivers/${driverId}/notifications/unread_count`);
  await ref.transaction((count) => (count || 0) + 1);
}

export async function setJobApplicationsCount(jobId: string, count: number): Promise<void> {
  const db = getFirebaseAdmin().database();
  await db.ref(`/jobs/${jobId}/applications_count`).set(count);
}

export async function setDispatchQueueDepth(carrierId: string, depth: number): Promise<void> {
  const db = getFirebaseAdmin().database();
  await db.ref(`/dispatch/${carrierId}/queue_depth`).set(depth);
}
```

### 6.4 Frontend Real-time Hooks

File: `frontend/src/hooks/useDriverStatus.ts`
```typescript
import { useEffect, useState } from 'react';
import { getDatabase, ref, onValue, off } from 'firebase/database';
import app from '../lib/firebase';

export function useDriverStatus(driverId: string) {
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!driverId) return;
    const db = getDatabase(app);
    const statusRef = ref(db, `/drivers/${driverId}/status`);
    onValue(statusRef, (snapshot) => setStatus(snapshot.val()));
    return () => off(statusRef);
  }, [driverId]);

  return status;
}
```

File: `frontend/src/hooks/useNotificationCount.ts`
```typescript
import { useEffect, useState } from 'react';
import { getDatabase, ref, onValue, off } from 'firebase/database';
import app from '../lib/firebase';

export function useNotificationCount(driverId: string) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!driverId) return;
    const db = getDatabase(app);
    const countRef = ref(db, `/drivers/${driverId}/notifications/unread_count`);
    onValue(countRef, (snapshot) => setCount(snapshot.val() || 0));
    return () => off(countRef);
  }, [driverId]);

  return count;
}
```

---

## Task 7 — Cloud Scheduler + Cloud Tasks Setup

**Estimated time:** 1–2 days
**Owner:** Platform Engineer
**Pre-requisites:** All Phase 2 Cloud Run services deployed; Cloud Run service URLs known

### 7.1 Create Service Account and Queue

```bash
# Create scheduler service account
gcloud iam service-accounts create lmdr-scheduler \
  --display-name="LMDR Scheduler" \
  --project=ldmr-velocitymatch

# Create Cloud Tasks queue
gcloud tasks queues create lmdr-scheduled-tasks \
  --location=us-central1 \
  --project=ldmr-velocitymatch \
  --max-attempts=5 \
  --max-retry-duration=3600s \
  --min-backoff=10s \
  --max-backoff=300s \
  --max-doublings=4
```

### 7.2 Grant Cloud Run Invoker Per Service

```bash
SERVICES=(
  "lmdr-compliance-service"
  "lmdr-notifications-service"
  "lmdr-carrier-service"
  "lmdr-ai-service"
  "lmdr-api"
  "lmdr-billing-service"
)

for SERVICE in "${SERVICES[@]}"; do
  gcloud run services add-iam-policy-binding $SERVICE \
    --region=us-central1 \
    --project=ldmr-velocitymatch \
    --member="serviceAccount:lmdr-scheduler@ldmr-velocitymatch.iam.gserviceaccount.com" \
    --role="roles/run.invoker"
done
```

### 7.3 Create Cloud Scheduler Jobs

```bash
# 1. Daily compliance refresh — 2:00 AM CT
gcloud scheduler jobs create http compliance-refresh \
  --location=us-central1 \
  --project=ldmr-velocitymatch \
  --schedule="0 2 * * *" \
  --time-zone="America/Chicago" \
  --uri="https://cloudtasks.googleapis.com/v2/projects/ldmr-velocitymatch/locations/us-central1/queues/lmdr-scheduled-tasks/tasks" \
  --message-body='{"httpRequest":{"url":"https://lmdr-compliance-<hash>-uc.a.run.app/jobs/compliance-refresh","httpMethod":"POST","oidcToken":{"serviceAccountEmail":"lmdr-scheduler@ldmr-velocitymatch.iam.gserviceaccount.com"}}}' \
  --oauth-service-account-email=lmdr-scheduler@ldmr-velocitymatch.iam.gserviceaccount.com \
  --oauth-token-scope=https://www.googleapis.com/auth/cloud-tasks

# 2. Weekly earnings digest — Monday 6:00 AM CT
gcloud scheduler jobs create http weekly-earnings-digest \
  --location=us-central1 \
  --project=ldmr-velocitymatch \
  --schedule="0 6 * * 1" \
  --time-zone="America/Chicago" \
  --uri="https://lmdr-notifications-<hash>-uc.a.run.app/jobs/weekly-earnings-digest" \
  --oidc-service-account-email=lmdr-scheduler@ldmr-velocitymatch.iam.gserviceaccount.com \
  --oidc-token-audience="https://lmdr-notifications-<hash>-uc.a.run.app"

# 3. Hourly job board refresh
gcloud scheduler jobs create http hourly-board-refresh \
  --location=us-central1 \
  --project=ldmr-velocitymatch \
  --schedule="0 * * * *" \
  --time-zone="America/Chicago" \
  --uri="https://lmdr-carrier-<hash>-uc.a.run.app/jobs/refresh-board" \
  --oidc-service-account-email=lmdr-scheduler@ldmr-velocitymatch.iam.gserviceaccount.com \
  --oidc-token-audience="https://lmdr-carrier-<hash>-uc.a.run.app"

# 4. Daily Airtable sync — 3:00 AM CT
gcloud scheduler jobs create http daily-airtable-sync \
  --location=us-central1 \
  --project=ldmr-velocitymatch \
  --schedule="0 3 * * *" \
  --time-zone="America/Chicago" \
  --uri="https://lmdr-ai-<hash>-uc.a.run.app/sync/airtable" \
  --oidc-service-account-email=lmdr-scheduler@ldmr-velocitymatch.iam.gserviceaccount.com \
  --oidc-token-audience="https://lmdr-ai-<hash>-uc.a.run.app"

# 5. RTDB cleanup — every 6 hours
gcloud scheduler jobs create http rtdb-cleanup \
  --location=us-central1 \
  --project=ldmr-velocitymatch \
  --schedule="0 */6 * * *" \
  --time-zone="America/Chicago" \
  --uri="https://lmdr-api-<hash>-uc.a.run.app/jobs/rtdb-cleanup" \
  --oidc-service-account-email=lmdr-scheduler@ldmr-velocitymatch.iam.gserviceaccount.com \
  --oidc-token-audience="https://lmdr-api-<hash>-uc.a.run.app"

# 6. Monthly invoice generation — 1st of month 1:00 AM CT
gcloud scheduler jobs create http monthly-invoice-generation \
  --location=us-central1 \
  --project=ldmr-velocitymatch \
  --schedule="0 1 1 * *" \
  --time-zone="America/Chicago" \
  --uri="https://lmdr-billing-<hash>-uc.a.run.app/jobs/generate-monthly-invoices" \
  --oidc-service-account-email=lmdr-scheduler@ldmr-velocitymatch.iam.gserviceaccount.com \
  --oidc-token-audience="https://lmdr-billing-<hash>-uc.a.run.app"

# 7. Weekly RAG refresh — Sunday 4:00 AM CT
gcloud scheduler jobs create http weekly-rag-refresh \
  --location=us-central1 \
  --project=ldmr-velocitymatch \
  --schedule="0 4 * * 0" \
  --time-zone="America/Chicago" \
  --uri="https://lmdr-ai-<hash>-uc.a.run.app/jobs/refresh-rag" \
  --oidc-service-account-email=lmdr-scheduler@ldmr-velocitymatch.iam.gserviceaccount.com \
  --oidc-token-audience="https://lmdr-ai-<hash>-uc.a.run.app"
```

### 7.4 OIDC Verification Middleware for Scheduled Job Endpoints

File: `packages/lmdr-middleware/src/verifySchedulerToken.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client();

export async function verifySchedulerToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing OIDC token' });
    return;
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.CLOUD_RUN_SERVICE_URL,
    });
    const payload = ticket.getPayload();
    if (payload?.email !== 'lmdr-scheduler@ldmr-velocitymatch.iam.gserviceaccount.com') {
      res.status(403).json({ error: 'Unauthorized scheduler account' });
      return;
    }
    next();
  } catch {
    res.status(401).json({ error: 'Invalid OIDC token' });
  }
}
```

### 7.5 Add Job Endpoints to Each Service

Example — `services/lmdr-compliance-service/src/routes/jobs.ts`:
```typescript
import { Router } from 'express';
import { verifySchedulerToken } from '@lmdr/middleware';

const router = Router();

router.post('/jobs/compliance-refresh', verifySchedulerToken, async (req, res) => {
  // Query all drivers with license_expiry within 30 days
  // Update compliance_status in Cloud SQL
  // Publish to lmdr-compliance-events topic
  res.json({ status: 'started', timestamp: new Date().toISOString() });
});

export default router;
```

Replicate pattern for each of the 7 scheduler targets.

### 7.6 Verify Each Job with Manual Trigger

```bash
for JOB in compliance-refresh weekly-earnings-digest hourly-board-refresh \
  daily-airtable-sync rtdb-cleanup monthly-invoice-generation weekly-rag-refresh; do
  echo "Triggering $JOB..."
  gcloud scheduler jobs run $JOB \
    --location=us-central1 \
    --project=ldmr-velocitymatch
  sleep 5
done
```

---

## Task 8 — PostgreSQL Full-Text Search Setup

**Estimated time:** 2–3 days
**Owner:** Backend Engineer
**Pre-requisites:** Cloud SQL `lmdr-postgres` instance running (Phase 1); `lmdr-matching-engine` deployed (Phase 2)

### 8.1 Connect to Cloud SQL and Enable Extensions

```bash
# Connect via Cloud SQL Proxy
cloud_sql_proxy ldmr-velocitymatch:us-central1:lmdr-postgres --port=5432 &
psql -h localhost -U lmdr_admin -d lmdr
```

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Verify
SELECT extname FROM pg_extension;
```

### 8.2 Add Search Columns to drivers Table

```sql
ALTER TABLE drivers
  ADD COLUMN IF NOT EXISTS search_vector tsvector,
  ADD COLUMN IF NOT EXISTS location geography(Point, 4326),
  ADD COLUMN IF NOT EXISTS skills_text TEXT;

-- Backfill skills_text from existing JSON skills column (adjust to your schema)
UPDATE drivers SET skills_text = array_to_string(
  ARRAY(SELECT jsonb_array_elements_text(skills)), ' '
) WHERE skills IS NOT NULL;

-- Backfill search_vector
UPDATE drivers SET search_vector =
  to_tsvector('english',
    coalesce(first_name, '') || ' ' ||
    coalesce(last_name, '') || ' ' ||
    coalesce(city, '') || ' ' ||
    coalesce(state, '') || ' ' ||
    coalesce(skills_text, '') || ' ' ||
    coalesce(license_class, '')
  );

-- Backfill location from existing lat/lng columns (adjust column names)
UPDATE drivers SET location = ST_MakePoint(longitude, latitude)::geography
  WHERE longitude IS NOT NULL AND latitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_drivers_search ON drivers USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_drivers_location ON drivers USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_drivers_name_trgm ON drivers USING GIN(
  (first_name || ' ' || last_name) gin_trgm_ops
);
```

### 8.3 Add Auto-Update Triggers

```sql
CREATE OR REPLACE FUNCTION update_driver_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    to_tsvector('english',
      coalesce(NEW.first_name, '') || ' ' ||
      coalesce(NEW.last_name, '') || ' ' ||
      coalesce(NEW.city, '') || ' ' ||
      coalesce(NEW.state, '') || ' ' ||
      coalesce(NEW.skills_text, '') || ' ' ||
      coalesce(NEW.license_class, '')
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER drivers_search_vector_trigger
  BEFORE INSERT OR UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION update_driver_search_vector();
```

### 8.4 Add Search Columns to jobs Table

```sql
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS search_vector tsvector,
  ADD COLUMN IF NOT EXISTS location geography(Point, 4326);

UPDATE jobs SET search_vector =
  to_tsvector('english',
    coalesce(title, '') || ' ' ||
    coalesce(description, '') || ' ' ||
    coalesce(city, '') || ' ' ||
    coalesce(state, '') || ' ' ||
    coalesce(job_type, '')
  );

CREATE INDEX IF NOT EXISTS idx_jobs_search ON jobs USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs USING GIST(location);

CREATE OR REPLACE FUNCTION update_job_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    to_tsvector('english',
      coalesce(NEW.title, '') || ' ' ||
      coalesce(NEW.description, '') || ' ' ||
      coalesce(NEW.city, '') || ' ' ||
      coalesce(NEW.job_type, '')
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jobs_search_vector_trigger
  BEFORE INSERT OR UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_job_search_vector();
```

### 8.5 Create lmdr-search Package

File: `packages/lmdr-search/src/drivers.ts`
```typescript
import { Pool, PoolClient } from 'pg';

interface DriverSearchParams {
  q?: string;
  lat?: number;
  lng?: number;
  radiusMiles?: number;
  licenseClass?: string;
  limit?: number;
  offset?: number;
}

export async function searchDrivers(pool: Pool, params: DriverSearchParams) {
  const { q, lat, lng, radiusMiles = 50, licenseClass, limit = 20, offset = 0 } = params;

  const conditions: string[] = ['d.status = $1'];
  const values: unknown[] = ['active'];
  let paramIdx = 2;

  if (q) {
    conditions.push(`d.search_vector @@ plainto_tsquery('english', $${paramIdx})`);
    values.push(q);
    paramIdx++;
  }

  if (lat && lng) {
    const radiusMeters = radiusMiles * 1609.34;
    conditions.push(
      `ST_DWithin(d.location, ST_MakePoint($${paramIdx}, $${paramIdx + 1})::geography, $${paramIdx + 2})`
    );
    values.push(lng, lat, radiusMeters);
    paramIdx += 3;
  }

  if (licenseClass) {
    conditions.push(`d.license_class = $${paramIdx}`);
    values.push(licenseClass);
    paramIdx++;
  }

  const rankExpr = q
    ? `ts_rank(d.search_vector, plainto_tsquery('english', $2)) DESC,`
    : '';

  const sql = `
    SELECT d.id, d.first_name, d.last_name, d.city, d.state,
           d.license_class, d.status,
           ${lat && lng ? `ST_Distance(d.location, ST_MakePoint($2, $3)::geography) / 1609.34 AS distance_miles,` : ''}
           ${q ? `ts_rank(d.search_vector, plainto_tsquery('english', $2)) AS rank,` : ''}
           COUNT(*) OVER() AS total_count
    FROM drivers d
    WHERE ${conditions.join(' AND ')}
    ORDER BY ${rankExpr} d.created_at DESC
    LIMIT $${paramIdx} OFFSET $${paramIdx + 1}
  `;

  values.push(limit, offset);
  const result = await pool.query(sql, values);
  return result.rows;
}
```

### 8.6 Implement Search Endpoints in lmdr-matching-engine

File: `services/lmdr-matching-engine/src/routes/search.ts`
```typescript
import { Router } from 'express';
import { verifyFirebaseToken } from '@lmdr/middleware';
import { searchDrivers } from '@lmdr/search';
import { pool } from '../../db';

const router = Router();

router.get('/search/drivers', verifyFirebaseToken, async (req, res) => {
  const { q, location, radius, licenseClass, limit = '20', offset = '0' } = req.query as Record<string, string>;
  const [lat, lng] = location?.split(',').map(Number) || [];

  const results = await searchDrivers(pool, {
    q, lat, lng,
    radiusMiles: radius ? Number(radius) : 50,
    licenseClass,
    limit: Number(limit),
    offset: Number(offset),
  });

  res.json({ results, count: results[0]?.total_count || 0 });
});

router.get('/search/suggest', verifyFirebaseToken, async (req, res) => {
  const { q, type = 'driver' } = req.query as Record<string, string>;
  const table = type === 'job' ? 'jobs' : 'drivers';
  const nameCol = type === 'job' ? 'title' : "(first_name || ' ' || last_name)";

  const result = await pool.query(
    `SELECT DISTINCT ${nameCol} AS suggestion
     FROM ${table}
     WHERE ${nameCol} % $1
     ORDER BY similarity(${nameCol}, $1) DESC
     LIMIT 10`,
    [q]
  );
  res.json({ suggestions: result.rows.map((r) => r.suggestion) });
});

export default router;
```

---

## Task 9 — lmdr-ai-service Production Containerization

**Estimated time:** 3–4 days
**Owner:** AI/ML Engineer + Platform Engineer
**Pre-requisites:** `services/ai-intelligence/` reviewed; Cloud SQL `pgvector` extension enabled; OpenAI key in Secret Manager

### 9.1 Review Existing AI Service Structure

```bash
ls -la services/ai-intelligence/
# Expected: src/, requirements.txt or package.json, README
```

### 9.2 Enable pgvector Extension

```sql
-- Connect to Cloud SQL lmdr database
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type VARCHAR(50) NOT NULL,
  document_id UUID NOT NULL,
  content_hash VARCHAR(64) NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_embeddings_vector
  ON document_embeddings
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_embeddings_doc_type
  ON document_embeddings (document_type, document_id);
```

### 9.3 Store OpenAI Key in Secret Manager

```bash
echo -n "sk-..." | gcloud secrets create openai-api-key \
  --project=ldmr-velocitymatch \
  --replication-policy=automatic \
  --data-file=-

# Grant AI service account access
gcloud secrets add-iam-policy-binding openai-api-key \
  --project=ldmr-velocitymatch \
  --member="serviceAccount:lmdr-ai-sa@ldmr-velocitymatch.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 9.4 Write Production Dockerfile

File: `services/ai-intelligence/Dockerfile`
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nodejs
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
USER nodejs
EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production
CMD ["node", "dist/server.js"]
```

### 9.5 Deploy Cloud Run Service

```bash
# Build and push image
gcloud builds submit services/ai-intelligence \
  --tag=us-central1-docker.pkg.dev/ldmr-velocitymatch/lmdr-services/lmdr-ai-service:latest \
  --project=ldmr-velocitymatch

# Deploy to Cloud Run
gcloud run deploy lmdr-ai-service \
  --image=us-central1-docker.pkg.dev/ldmr-velocitymatch/lmdr-services/lmdr-ai-service:latest \
  --region=us-central1 \
  --project=ldmr-velocitymatch \
  --service-account=lmdr-ai-sa@ldmr-velocitymatch.iam.gserviceaccount.com \
  --no-allow-unauthenticated \
  --memory=4Gi \
  --cpu=2 \
  --min-instances=1 \
  --max-instances=10 \
  --set-secrets="FIREBASE_ADMIN_SDK_JSON=firebase-admin-sdk:latest,OPENAI_API_KEY=openai-api-key:latest" \
  --set-env-vars="NODE_ENV=production,DB_HOST=/cloudsql/ldmr-velocitymatch:us-central1:lmdr-postgres" \
  --add-cloudsql-instances=ldmr-velocitymatch:us-central1:lmdr-postgres
```

### 9.6 Wire AI Service Endpoints

Ensure the following routes are implemented in `services/ai-intelligence/src/routes/`:
- `POST /ai/recommend-jobs` — accepts `{ driverId }`, returns ranked job list
- `POST /ai/rag/query` — accepts `{ query, context? }`, returns RAG response
- `POST /ai/vectors/upsert` — accepts `{ documentType, documentId, content }`, generates and stores embedding
- `POST /ai/vectors/search` — accepts `{ query, documentType?, limit? }`, returns similar documents
- `POST /ai/sync/airtable` — pulls from Airtable API, upserts to Cloud SQL
- `POST /jobs/refresh-rag` — rebuilds RAG corpus from Cloud SQL documents
- `GET /health` — returns `{ status: 'ok', model: '...' }`

---

## Task 10 — Observability Stack Deployment

**Estimated time:** 2 days
**Owner:** Platform Engineer
**Pre-requisites:** All Cloud Run services deployed

### 10.1 Install Shared Logging Library

```bash
# In each Cloud Run service
npm install @google-cloud/logging @google-cloud/trace-agent
```

File: `packages/lmdr-middleware/src/logger.ts`
```typescript
import { Logging } from '@google-cloud/logging';

const logging = new Logging({ projectId: 'ldmr-velocitymatch' });

export function createLogger(serviceName: string) {
  const log = logging.log(serviceName);
  return {
    info: (message: string, meta: Record<string, unknown> = {}) =>
      log.write(log.entry({ severity: 'INFO', ...meta }, message)),
    error: (message: string, meta: Record<string, unknown> = {}) =>
      log.write(log.entry({ severity: 'ERROR', ...meta }, message)),
    warn: (message: string, meta: Record<string, unknown> = {}) =>
      log.write(log.entry({ severity: 'WARNING', ...meta }, message)),
  };
}
```

Add to each service's `src/server.ts`:
```typescript
require('@google-cloud/trace-agent').start({ projectId: 'ldmr-velocitymatch' });
```

### 10.2 Create Log Bucket and Sink

```bash
# Create log bucket with 90-day retention
gcloud logging buckets create lmdr-logs \
  --location=us-central1 \
  --project=ldmr-velocitymatch \
  --retention-days=90

# Create log sink routing all Cloud Run logs to lmdr-logs bucket
gcloud logging sinks create lmdr-all-services-sink \
  logging.googleapis.com/projects/ldmr-velocitymatch/locations/us-central1/buckets/lmdr-logs \
  --log-filter='resource.type="cloud_run_revision"' \
  --project=ldmr-velocitymatch
```

### 10.3 Create Cloud Monitoring Alerting Policies

```bash
# Error rate alert (any service > 1% errors for 5 min)
gcloud alpha monitoring policies create \
  --policy-from-file=infra/monitoring/error-rate-alert.yaml \
  --project=ldmr-velocitymatch
```

File: `infra/monitoring/error-rate-alert.yaml`
```yaml
displayName: "LMDR - High Error Rate"
conditions:
  - displayName: "Error rate > 1%"
    conditionThreshold:
      filter: >
        resource.type = "cloud_run_revision"
        AND metric.type = "run.googleapis.com/request_count"
        AND metric.labels.response_code_class = "5xx"
      comparison: COMPARISON_GT
      thresholdValue: 0.01
      duration: 300s
      aggregations:
        - alignmentPeriod: 60s
          perSeriesAligner: ALIGN_RATE
notificationChannels:
  - projects/ldmr-velocitymatch/notificationChannels/<channel-id>
alertStrategy:
  autoClose: 1800s
```

### 10.4 Create Uptime Checks

```bash
for SERVICE in lmdr-api lmdr-matching-engine lmdr-driver-service lmdr-carrier-service \
  lmdr-compliance-service lmdr-notifications-service lmdr-billing-service \
  lmdr-ai-service lmdr-analytics-service lmdr-frontend; do

  gcloud monitoring uptime-checks create https \
    --display-name="${SERVICE}-health" \
    --uri="https://${SERVICE}-<hash>-uc.a.run.app/health" \
    --check-interval=60s \
    --timeout=10s \
    --project=ldmr-velocitymatch
done
```

### 10.5 Enable Cloud SQL Insights

```bash
gcloud sql instances patch lmdr-postgres \
  --database-flags=cloudsql.enable_query_insights=on \
  --project=ldmr-velocitymatch
```

### 10.6 Create GCP Billing Budget Alert

```bash
gcloud billing budgets create \
  --billing-account=<BILLING_ACCOUNT_ID> \
  --display-name="LMDR Monthly Budget" \
  --budget-amount=1000USD \
  --threshold-rule=percent=0.8,basis=CURRENT_SPEND \
  --threshold-rule=percent=1.0,basis=CURRENT_SPEND \
  --notifications-rule-pubsub-topic=projects/ldmr-velocitymatch/topics/lmdr-billing-alerts
```

---

## Task 11 — IAM Hardening and Security Review

**Estimated time:** 1–2 days
**Owner:** Platform Engineer + Security Reviewer
**Pre-requisites:** All Phase 4 services deployed

### 11.1 Audit All Service Accounts

```bash
# List all service accounts in project
gcloud iam service-accounts list --project=ldmr-velocitymatch

# For each SA, verify no overly broad roles
gcloud projects get-iam-policy ldmr-velocitymatch \
  --format=json | jq '.bindings[] | select(.role | test("owner|editor"))'
```

Expected result: empty. If any SA has `roles/owner` or `roles/editor`, remove immediately:
```bash
gcloud projects remove-iam-policy-binding ldmr-velocitymatch \
  --member="serviceAccount:<sa-email>" \
  --role="roles/editor"
```

### 11.2 Enable Cloud Armor on Load Balancer

```bash
# Create security policy
gcloud compute security-policies create lmdr-waf-policy \
  --project=ldmr-velocitymatch \
  --description="LMDR WAF - OWASP Top 10"

# Enable pre-configured OWASP ModSecurity WAF rules
gcloud compute security-policies rules create 1000 \
  --security-policy=lmdr-waf-policy \
  --expression="evaluatePreconfiguredExpr('xss-stable')" \
  --action=deny-403 \
  --project=ldmr-velocitymatch

gcloud compute security-policies rules create 1001 \
  --security-policy=lmdr-waf-policy \
  --expression="evaluatePreconfiguredExpr('sqli-stable')" \
  --action=deny-403 \
  --project=ldmr-velocitymatch

# Attach to backend service
gcloud compute backend-services update lmdr-backend-service \
  --security-policy=lmdr-waf-policy \
  --global \
  --project=ldmr-velocitymatch
```

### 11.3 Rotate Secrets Older Than 90 Days

```bash
# List all secret versions with creation date
gcloud secrets list --project=ldmr-velocitymatch --format=json | \
  jq -r '.[].name' | while read SECRET; do
  gcloud secrets versions list $SECRET \
    --project=ldmr-velocitymatch \
    --format="table(name,state,createTime)"
done
```

Rotate any secret with a version older than 90 days by adding a new version and disabling the old one.

### 11.4 Enable Binary Authorization

```bash
gcloud services enable binaryauthorization.googleapis.com \
  --project=ldmr-velocitymatch

gcloud container binauthz policy import infra/binauthz/policy.yaml \
  --project=ldmr-velocitymatch
```

File: `infra/binauthz/policy.yaml`
```yaml
globalPolicyEvaluationMode: ENABLE
defaultAdmissionRule:
  evaluationMode: REQUIRE_ATTESTATION
  enforcementMode: ENFORCED_BLOCK_AND_AUDIT_LOG
  requireAttestationsBy:
    - projects/ldmr-velocitymatch/attestors/cloud-build-attestor
```

---

## Task 12 — End-to-End Integration Testing

**Estimated time:** 3–5 days
**Owner:** QA Engineer + Backend Engineer

### 12.1 Driver Full Journey Test

```
1. Driver signs up via Firebase Email/Password
2. Verifies email (check Firebase console for email delivery)
3. Uploads CDL photo (POST /files/signed-url → PUT signed URL)
4. Cloud Storage event fires → Pub/Sub lmdr-file-uploaded → lmdr-compliance-service
5. Compliance service validates document, updates Cloud SQL
6. Driver status updates in Firebase RTDB (/drivers/{id}/status)
7. Driver searches for jobs (GET /search/jobs?q=...)
8. Driver applies to job
9. Notification fires via Pub/Sub lmdr-notifications → lmdr-notifications-service
10. Notification count increments in RTDB (/drivers/{id}/notifications/unread_count)
```

Automated test file: `tests/e2e/driver-journey.test.ts`

### 12.2 Carrier Full Journey Test

```
1. Carrier signs up via Google OAuth
2. Uploads company logo (POST /files/signed-url with purpose=logo)
3. Posts a job (POST /api/jobs)
4. Searches drivers (GET /search/drivers?q=CDL+A&location=41.8,-87.6&radius=25)
5. Hires driver (POST /api/jobs/{id}/hire)
6. Views driver compliance (GET /api/drivers/{id}/compliance)
7. Receives monthly invoice (trigger monthly-invoice-generation scheduler job manually)
```

### 12.3 Scheduler Smoke Tests

```bash
for JOB in compliance-refresh weekly-earnings-digest hourly-board-refresh \
  daily-airtable-sync rtdb-cleanup monthly-invoice-generation weekly-rag-refresh; do
  echo "=== Running $JOB ==="
  gcloud scheduler jobs run $JOB \
    --location=us-central1 \
    --project=ldmr-velocitymatch
  echo "Check Cloud Logging for job execution..."
  sleep 30
done
```

### 12.4 Load Test

```bash
# Install k6
npm install -g k6

# Run load test: 100 concurrent users, 5 minutes
k6 run tests/load/marketplace-search.js \
  --vus=100 \
  --duration=5m
```

File: `tests/load/marketplace-search.js`
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'https://lmdr-matching-engine-<hash>-uc.a.run.app';
const TOKEN = __ENV.TEST_TOKEN;

export default function () {
  const res = http.get(
    `${BASE_URL}/search/drivers?q=cdl&location=41.8781,-87.6298&radius=50`,
    { headers: { Authorization: `Bearer ${TOKEN}` } }
  );
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response under 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

---

## Task 13 — Wix Decommission Checklist

**Estimated time:** 1–2 days
**Owner:** Platform Engineer + Product Owner
**Pre-requisites:** Task 12 complete; all integration tests passing; stakeholder sign-off received

### Decommission Verification Steps

Before executing any decommission step, verify the replacement is working at 100% traffic.

```
[ ] 1. All users migrated to Firebase Auth
       - Firebase Auth MAU count matches previous Wix member count (within 5%)
       - Zero users logging in via Wix session in last 48 hours (check access logs)

[ ] 2. All files migrated from Wix Media Manager to Cloud Storage
       - Script: scripts/verify-storage-migration.ts
         Compares Wix Media Manager file count vs Cloud Storage object count
       - All driver document URLs in Cloud SQL point to gs:// paths (not Wix CDN)

[ ] 3. All Wix Velo cron jobs disabled
       - In Wix Editor/Dashboard: disable all scheduled jobs
       - Verify 7 Cloud Scheduler jobs are active and have run successfully

[ ] 4. All Wix real-time functionality replaced
       - Firebase RTDB active with real data (check Firebase Console)
       - Zero Wix real-time API calls in last 24 hours

[ ] 5. All Wix backend APIs (Wix Velo) disabled
       - Wix backend functions deleted or disabled
       - All API traffic routing to Cloud Run services (verify via Cloud Monitoring)

[ ] 6. DNS fully pointed to GCP Load Balancer
       - nslookup lmdr.io → GCP LB IP (not Wix IP)
       - SSL certificate valid on GCP LB

[ ] 7. Final Wix data export archived
       ```bash
       # Export all Wix data collections to JSON
       # Upload to lmdr-ai-training-data bucket as archive
       gcloud storage cp wix-export-*.json gs://lmdr-ai-training-data/wix-archive/
       ```

[ ] 8. Wix premium subscription cancelled
       - Obtain confirmation email from Wix
       - Note billing cycle end date

[ ] 9. Wix site set to private/deactivated
       - In Wix Dashboard: Settings → Site Availability → set to Private
       - Verify lmdr.io no longer resolves to Wix (DNS already updated in step 6)

[ ] 10. Post-decommission monitoring
        - Monitor Cloud Monitoring for 48 hours post-decommission
        - Watch error rates for unexpected spikes (would indicate missed Wix dependency)
        - Keep Wix account accessible (not deleted) for 30 days as safety net
```

### Final Sign-off

| Stakeholder | Role | Sign-off Date |
|-------------|------|--------------|
| | Engineering Lead | |
| | Product Owner | |
| | Operations | |

---

## Appendix: Quick Reference Commands

```bash
# Check all Cloud Run services status
gcloud run services list --region=us-central1 --project=ldmr-velocitymatch

# View recent logs for a service
gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="lmdr-api"' \
  --limit=50 --project=ldmr-velocitymatch --format=json | jq '.[].jsonPayload'

# List all Cloud Scheduler jobs and next run time
gcloud scheduler jobs list --location=us-central1 --project=ldmr-velocitymatch

# List all Pub/Sub topics
gcloud pubsub topics list --project=ldmr-velocitymatch

# List all Cloud Storage buckets
gcloud storage buckets list --project=ldmr-velocitymatch

# List all Secret Manager secrets
gcloud secrets list --project=ldmr-velocitymatch

# Check Firebase Auth user count
firebase auth:export users.json --project=ldmr-velocitymatch
wc -l users.json
```
