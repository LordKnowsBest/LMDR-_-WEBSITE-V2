# Phase 2 Business Logic Migration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Migrate ~250 Wix `.jsw` business logic files to nine Cloud Run microservices using the Strangler Fig pattern. Each task produces a deployable service with tests. Tasks 1–9 build services. Task 10 wires the Strangler Fig routing. Tasks 11–12 add observability and documentation.

**GCP Project:** `ldmr-velocitymatch` | **Region:** `us-central1`

**Working directory root:** `C:\Users\nolan\LMDR_WEBSITE_V2\LMDR-_-WEBSITE-V2\`

**All service directories are siblings of `cloud-run-api/`:**
```
LMDR-_-WEBSITE-V2/
├── cloud-run-api/          ← Addendum 1 (lmdr-api) — already exists
├── packages/               ← Shared monorepo packages (Task 1)
│   ├── lmdr-db/
│   ├── lmdr-middleware/
│   └── lmdr-types/
└── services/
    ├── matching-engine/    ← Task 2
    ├── driver-service/     ← Task 3
    ├── carrier-service/    ← Task 4
    ├── compliance-service/ ← Task 5
    ├── notifications-service/ ← Task 6
    ├── billing-service/    ← Task 7
    ├── ai-service/         ← Task 8
    └── analytics-service/  ← Task 9
```

---

## MANUAL PREREQUISITES — Complete Before Any Task

| # | What | Where | Status |
|---|------|--------|--------|
| M1 | Cloud SQL proxy running (`08b_cloud_sql_proxy_adc.ps1`) | Local terminal | ☐ |
| M2 | Secret `lmdr-sendgrid-api-key` exists in Secret Manager | GCP Console → Secret Manager | ☐ |
| M3 | Secret `lmdr-twilio-account-sid` exists in Secret Manager | GCP Console → Secret Manager | ☐ |
| M4 | Secret `lmdr-twilio-auth-token` exists in Secret Manager | GCP Console → Secret Manager | ☐ |
| M5 | Secret `lmdr-openai-api-key` exists in Secret Manager | GCP Console → Secret Manager | ☐ |
| M6 | Secret `lmdr-vapi-private-key` exists in Secret Manager | GCP Console → Secret Manager | ☐ |
| M7 | Secret `lmdr-stripe-webhook-secret` exists in Secret Manager | GCP Console → Secret Manager | ☐ |
| M8 | Secret `lmdr-mvr-api-key` exists in Secret Manager | GCP Console → Secret Manager | ☐ |
| M9 | Secret `lmdr-bgcheck-api-key` exists in Secret Manager | GCP Console → Secret Manager | ☐ |
| M10 | Secret `lmdr-feature-flags` created with initial value (see Task 10) | GCP Console → Secret Manager | ☐ |
| M11 | Pub/Sub topic `lmdr-notifications` created | `gcloud pubsub topics create lmdr-notifications` | ☐ |
| M12 | Pub/Sub subscription `lmdr-notifications-sub` created | `gcloud pubsub subscriptions create lmdr-notifications-sub --topic=lmdr-notifications` | ☐ |
| M13 | Service account `lmdr-services-sa` created | See Task 1.4 | ☐ |

---

## Task 1: Shared Monorepo Infrastructure

**Estimated effort:** 2 days
**Prerequisite:** `cloud-run-api/` exists (Addendum 1 complete)

### 1.1 Create Root Workspace package.json

Create `LMDR-_-WEBSITE-V2/package.json`:

```json
{
  "name": "lmdr-gcp-monorepo",
  "private": true,
  "workspaces": [
    "packages/*",
    "services/*",
    "cloud-run-api"
  ],
  "scripts": {
    "build:packages": "npm run build --workspace=packages/lmdr-types --workspace=packages/lmdr-db --workspace=packages/lmdr-middleware",
    "test": "npm run test --workspaces --if-present",
    "lint": "eslint 'packages/**/*.ts' 'services/**/*.ts' 'cloud-run-api/src/**/*.js'"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint": "^8.57.0"
  }
}
```

### 1.2 Create @lmdr/types Package

Create directory: `packages/lmdr-types/`

**`packages/lmdr-types/package.json`:**
```json
{
  "name": "@lmdr/types",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  },
  "devDependencies": {
    "typescript": "^5.4.0"
  }
}
```

**`packages/lmdr-types/tsconfig.json`:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "declaration": true,
    "outDir": "dist",
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*.ts"]
}
```

**`packages/lmdr-types/src/index.ts`** — define all shared interfaces:

```typescript
export interface DriverProfile {
  _id: string;
  memberId: string;
  cdlClass: 'A' | 'B' | 'C';
  yearsExperience: number;
  homeState: string;
  freightPreference: string[];
  docsSubmitted: boolean;
  isSearchable: boolean;
  visibilityLevel: 'public' | 'private' | 'recruiter-only';
  onboardingStep: number;
  onboardingComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  _id: string;
  carrierId: string;
  title: string;
  state: string;
  city: string;
  lat: number;
  lng: number;
  cdlRequired: string;
  freightType: string;
  payPerMile: number;
  homeTime: string;
  status: 'open' | 'filled' | 'paused' | 'closed';
  postedAt: string;
}

export interface Carrier {
  _id: string;
  dotNumber: number;
  companyName: string;
  combinedScore: number;
  state: string;
  numTrucks: number;
  payPerMile: number;
  homeTime: string;
  freightType: string;
  isEnriched: boolean;
  lastEnrichedAt: string;
}

export interface MatchResult {
  jobId: string;
  carrierId: string;
  driverId: string;
  score: number;
  explanation: string;
  factors: Record<string, number>;
}

export interface NotificationPayload {
  recipientId: string;
  channel: 'email' | 'sms' | 'push';
  subject?: string;
  body: string;
  templateId?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditEvent {
  actorId: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  before?: unknown;
  after?: unknown;
  ipAddress?: string;
  timestamp: string;
}

export interface ComplianceStatus {
  driverId: string;
  mvrStatus: 'pending' | 'clear' | 'flagged' | 'failed';
  backgroundStatus: 'pending' | 'clear' | 'flagged' | 'failed';
  cdlVerified: boolean;
  lastChecked: string;
  expiresAt?: string;
}

export interface Invoice {
  _id: string;
  carrierId: string;
  driverId?: string;
  lineItems: InvoiceLineItem[];
  totalAmount: number;
  currency: 'USD';
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  dueDate: string;
  createdAt: string;
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
  };
}

export interface ApiError {
  error: string;
  code: string;
  statusCode: number;
}
```

Run: `npm run build --workspace=packages/lmdr-types`

### 1.3 Create @lmdr/db Package

Create directory: `packages/lmdr-db/`

**`packages/lmdr-db/package.json`:**
```json
{
  "name": "@lmdr/db",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc"
  },
  "dependencies": {
    "pg": "^8.11.3",
    "@google-cloud/cloud-sql-connector": "^1.3.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/pg": "^8.11.0"
  }
}
```

**`packages/lmdr-db/src/index.ts`** — re-exports pool and query helpers from `cloud-run-api/src/db/`:

```typescript
// Re-export from Phase 1 (Addendum 1) db layer
// The pool is configured once per process — services import this
export { pool } from './pool';
export { buildQuery, executeQuery } from './query';
export { getTableName } from './schema';
export type { QueryFilters, FilterClause, SortClause } from './types';
```

Copy `cloud-run-api/src/db/pool.js`, `query.js`, `schema.js` into `packages/lmdr-db/src/` and convert to TypeScript. This is the single source of truth — `cloud-run-api` also imports from `@lmdr/db` after this task.

### 1.4 Create @lmdr/middleware Package

Create directory: `packages/lmdr-middleware/`

**`packages/lmdr-middleware/package.json`:**
```json
{
  "name": "@lmdr/middleware",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc"
  },
  "dependencies": {
    "firebase-admin": "^12.0.0",
    "express": "^4.18.3",
    "@lmdr/db": "^1.0.0",
    "@lmdr/types": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/express": "^4.17.21"
  }
}
```

**`packages/lmdr-middleware/src/auth.ts`** — copy from `cloud-run-api/src/middleware/auth.js` and add TypeScript types.

**`packages/lmdr-middleware/src/rateLimiter.ts`** — copy from `cloud-run-api/src/middleware/rateLimiter.js`. Enhance to persist monthly usage to Cloud SQL instead of in-memory only.

**`packages/lmdr-middleware/src/requestLogger.ts`:**
```typescript
import { Request, Response, NextFunction } from 'express';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on('finish', () => {
    const log = {
      severity: res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARNING' : 'INFO',
      httpRequest: {
        requestMethod: req.method,
        requestUrl: req.originalUrl,
        status: res.statusCode,
        latency: `${Date.now() - start}ms`,
        userAgent: req.headers['user-agent'],
      },
      service: process.env.SERVICE_NAME,
    };
    console.log(JSON.stringify(log));
  });
  next();
}
```

**`packages/lmdr-middleware/src/errorHandler.ts`:**
```typescript
import { Request, Response, NextFunction } from 'express';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  console.error(JSON.stringify({ severity: 'ERROR', message: err.message, stack: err.stack, path: req.path }));
  res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
}
```

**`packages/lmdr-middleware/src/index.ts`:**
```typescript
export { authMiddleware } from './auth';
export { rateLimiter } from './rateLimiter';
export { requestLogger } from './requestLogger';
export { errorHandler } from './errorHandler';
```

Run: `npm run build:packages`

### 1.5 Root Cloud Build Config for Packages

Create `LMDR-_-WEBSITE-V2/cloudbuild-packages.yaml`:

```yaml
steps:
  - name: 'node:20'
    entrypoint: npm
    args: ['install', '--workspace=packages/lmdr-types', '--workspace=packages/lmdr-db', '--workspace=packages/lmdr-middleware']
  - name: 'node:20'
    entrypoint: npm
    args: ['run', 'build', '--workspace=packages/lmdr-types']
  - name: 'node:20'
    entrypoint: npm
    args: ['run', 'build', '--workspace=packages/lmdr-db']
  - name: 'node:20'
    entrypoint: npm
    args: ['run', 'build', '--workspace=packages/lmdr-middleware']
```

### 1.6 Create Shared Service Account

```bash
# Run in Cloud Shell or local gcloud terminal
gcloud iam service-accounts create lmdr-services-sa \
  --display-name="LMDR Microservices Service Account" \
  --project=ldmr-velocitymatch

gcloud projects add-iam-policy-binding ldmr-velocitymatch \
  --member="serviceAccount:lmdr-services-sa@ldmr-velocitymatch.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"

gcloud projects add-iam-policy-binding ldmr-velocitymatch \
  --member="serviceAccount:lmdr-services-sa@ldmr-velocitymatch.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding ldmr-velocitymatch \
  --member="serviceAccount:lmdr-services-sa@ldmr-velocitymatch.iam.gserviceaccount.com" \
  --role="roles/pubsub.publisher"

gcloud projects add-iam-policy-binding ldmr-velocitymatch \
  --member="serviceAccount:lmdr-services-sa@ldmr-velocitymatch.iam.gserviceaccount.com" \
  --role="roles/pubsub.subscriber"
```

### 1.7 Verification

```bash
# Verify package builds produce dist/ directories
ls packages/lmdr-types/dist/index.js
ls packages/lmdr-db/dist/index.js
ls packages/lmdr-middleware/dist/index.js
```

**Task 1 complete when:** All three packages build without TypeScript errors. Service account `lmdr-services-sa` exists with correct IAM bindings.

---

## Task 2: lmdr-matching-engine Service

**Estimated effort:** 5 days
**GCP service name:** `lmdr-matching-engine`
**Source categories:** 2 (Job Matching Engine), 12 (Search & Discovery)
**Wix .jsw files being migrated:** `carrierMatching.jsw`, `driverScoring.js`, `matchExplanationService.jsw`, `searchService.jsw`, `geoService.jsw`

### 2.1 Create Service Directory Structure

```
services/matching-engine/
├── package.json
├── tsconfig.json
├── Dockerfile
├── .dockerignore
├── .env.example
├── cloudbuild.yaml
├── src/
│   ├── app.ts                  ← Express app factory
│   ├── server.ts               ← Entry point
│   ├── routes/
│   │   ├── health.ts
│   │   ├── match.ts            ← /match/* endpoints
│   │   └── search.ts           ← /search/* endpoints
│   ├── services/
│   │   ├── matchingAlgorithm.ts   ← Port of carrierMatching.jsw
│   │   ├── driverScoring.ts       ← Port of driverScoring.js
│   │   ├── matchExplanation.ts    ← Port of matchExplanationService.jsw
│   │   ├── jobSearch.ts           ← Port of searchService.jsw (jobs)
│   │   └── driverSearch.ts        ← Port of searchService.jsw (drivers)
│   └── db/
│       └── queries.ts             ← SQL queries for matching tables
└── tests/
    ├── services/
    │   ├── matchingAlgorithm.test.ts
    │   └── driverScoring.test.ts
    └── routes/
        ├── match.test.ts
        └── search.test.ts
```

### 2.2 package.json

```json
{
  "name": "lmdr-matching-engine",
  "version": "1.0.0",
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "dev": "ts-node src/server.ts",
    "test": "jest --coverage",
    "lint": "eslint 'src/**/*.ts'"
  },
  "dependencies": {
    "express": "^4.18.3",
    "@lmdr/db": "^1.0.0",
    "@lmdr/middleware": "^1.0.0",
    "@lmdr/types": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "@types/express": "^4.17.21",
    "@types/node": "^20.0.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.0",
    "ts-node": "^10.9.2"
  }
}
```

### 2.3 Core Route Implementations

**`src/routes/match.ts`:**
```typescript
import { Router, Request, Response } from 'express';
import { findJobsForDriver } from '../services/matchingAlgorithm';
import { findDriversForJob } from '../services/matchingAlgorithm';
import { getMatchExplanation } from '../services/matchExplanation';
import { authMiddleware } from '@lmdr/middleware';

const router = Router();
router.use(authMiddleware);

// POST /match/find-jobs
// Body: { driverProfile: DriverProfile, limit?: number }
// Returns: { matches: MatchResult[], total: number }
router.post('/find-jobs', async (req: Request, res: Response) => {
  const { driverProfile, limit = 20 } = req.body;
  if (!driverProfile) return res.status(400).json({ error: 'driverProfile required', code: 'MISSING_PARAM' });
  const matches = await findJobsForDriver(driverProfile, limit);
  res.json({ data: matches, meta: { total: matches.length } });
});

// POST /match/find-drivers
// Body: { jobSpec: Job, limit?: number }
// Returns: { drivers: DriverProfile[], scores: MatchResult[] }
router.post('/find-drivers', async (req: Request, res: Response) => {
  const { jobSpec, limit = 20 } = req.body;
  if (!jobSpec) return res.status(400).json({ error: 'jobSpec required', code: 'MISSING_PARAM' });
  const results = await findDriversForJob(jobSpec, limit);
  res.json({ data: results, meta: { total: results.length } });
});

// GET /match/explain/:driverId/:carrierId
router.get('/explain/:driverId/:carrierId', async (req: Request, res: Response) => {
  const explanation = await getMatchExplanation(req.params.driverId, req.params.carrierId);
  if (!explanation) return res.status(404).json({ error: 'No match found', code: 'NOT_FOUND' });
  res.json({ data: explanation });
});

export default router;
```

**`src/routes/search.ts`:**
```typescript
import { Router, Request, Response } from 'express';
import { searchJobs } from '../services/jobSearch';
import { searchDrivers } from '../services/driverSearch';
import { authMiddleware } from '@lmdr/middleware';

const router = Router();
router.use(authMiddleware);

// GET /search/jobs?lat=&lng=&radiusMiles=&cdlClass=&freightType=&limit=
router.get('/jobs', async (req: Request, res: Response) => {
  const { lat, lng, radiusMiles = 50, cdlClass, freightType, limit = 25, offset = 0 } = req.query;
  const results = await searchJobs({ lat: Number(lat), lng: Number(lng), radiusMiles: Number(radiusMiles), cdlClass: String(cdlClass || ''), freightType: String(freightType || ''), limit: Number(limit), offset: Number(offset) });
  res.json({ data: results.records, meta: { total: results.total } });
});

// GET /search/drivers?cdlClass=&state=&freightType=&limit=
router.get('/drivers', async (req: Request, res: Response) => {
  const { cdlClass, state, freightType, limit = 25, offset = 0 } = req.query;
  const results = await searchDrivers({ cdlClass: String(cdlClass || ''), state: String(state || ''), freightType: String(freightType || ''), limit: Number(limit), offset: Number(offset) });
  res.json({ data: results.records, meta: { total: results.total } });
});

export default router;
```

### 2.4 Matching Algorithm Port

**`src/services/matchingAlgorithm.ts`** — port logic from `carrierMatching.jsw` and `driverScoring.js`.

Key scoring factors to preserve from `.jsw` files:
- CDL class compatibility (0 or 1 — hard filter)
- State proximity (haversine distance score)
- Freight type match (weighted score)
- Experience threshold (binary + bonus)
- Home time match (weighted score)
- Pay range compatibility

```typescript
import { pool } from '@lmdr/db';
import type { DriverProfile, Job, MatchResult } from '@lmdr/types';

export async function findJobsForDriver(driver: DriverProfile, limit: number): Promise<MatchResult[]> {
  // 1. Fetch candidate jobs from Cloud SQL (open jobs matching CDL class)
  const { rows: jobs } = await pool.query<Job>(
    `SELECT data FROM airtable_v2_job_listings
     WHERE data->>'status' = 'open'
       AND data->>'cdlRequired' = $1
     LIMIT 500`,
    [driver.cdlClass]
  );
  // 2. Score each job against driver profile
  const scored = jobs.map(row => scoreDriverJobPair(driver, row.data as unknown as Job));
  // 3. Sort by score descending, return top N
  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

export async function findDriversForJob(job: Job, limit: number): Promise<MatchResult[]> {
  const { rows: drivers } = await pool.query<DriverProfile>(
    `SELECT data FROM airtable_v2_driver_profiles
     WHERE data->>'isSearchable' = 'true'
       AND data->>'cdlClass' = $1
     LIMIT 500`,
    [job.cdlRequired]
  );
  const scored = drivers.map(row => scoreDriverJobPair(row.data as unknown as DriverProfile, job));
  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

function scoreDriverJobPair(driver: DriverProfile, job: Job): MatchResult {
  let score = 0;
  const factors: Record<string, number> = {};

  // CDL match (hard filter — already applied in query, but validate)
  factors.cdlMatch = driver.cdlClass === job.cdlRequired ? 1 : 0;
  score += factors.cdlMatch * 30;

  // Freight type match
  factors.freightMatch = driver.freightPreference.includes(job.freightType) ? 1 : 0;
  score += factors.freightMatch * 25;

  // Experience bonus
  factors.experienceBonus = driver.yearsExperience >= 2 ? 0.5 : 0;
  score += factors.experienceBonus * 10;

  // State proximity (home state vs job state — simplistic; geo distance used in geo-enhanced version)
  factors.stateMatch = driver.homeState === job.state ? 1 : 0.3;
  score += factors.stateMatch * 20;

  return {
    jobId: job._id,
    carrierId: job.carrierId,
    driverId: driver._id,
    score: Math.round(score),
    explanation: buildExplanation(factors),
    factors,
  };
}

function buildExplanation(factors: Record<string, number>): string {
  const parts: string[] = [];
  if (factors.cdlMatch === 1) parts.push('CDL class matches');
  if (factors.freightMatch === 1) parts.push('freight type aligns with preference');
  if (factors.experienceBonus > 0) parts.push('experience threshold met');
  if (factors.stateMatch === 1) parts.push('same state as home');
  return parts.length ? parts.join(', ') : 'Basic compatibility match';
}
```

### 2.5 Dockerfile

```dockerfile
FROM node:20-slim
WORKDIR /app

# Copy monorepo root and shared packages
COPY package.json ./
COPY packages/ ./packages/

# Copy service
COPY services/matching-engine/ ./services/matching-engine/

# Install and build
RUN npm install --workspace=packages/lmdr-types --workspace=packages/lmdr-db --workspace=packages/lmdr-middleware --workspace=services/matching-engine
RUN npm run build --workspace=packages/lmdr-types
RUN npm run build --workspace=packages/lmdr-db
RUN npm run build --workspace=packages/lmdr-middleware
RUN npm run build --workspace=services/matching-engine

WORKDIR /app/services/matching-engine
EXPOSE 8080
ENV PORT=8080
ENV SERVICE_NAME=lmdr-matching-engine
CMD ["node", "dist/server.js"]
```

### 2.6 cloudbuild.yaml

```yaml
# services/matching-engine/cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args:
      - build
      - '-t'
      - 'gcr.io/ldmr-velocitymatch/lmdr-matching-engine:$COMMIT_SHA'
      - '-f'
      - 'services/matching-engine/Dockerfile'
      - '.'

  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/ldmr-velocitymatch/lmdr-matching-engine:$COMMIT_SHA']

  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - run
      - deploy
      - lmdr-matching-engine
      - '--image=gcr.io/ldmr-velocitymatch/lmdr-matching-engine:$COMMIT_SHA'
      - '--region=us-central1'
      - '--platform=managed'
      - '--service-account=lmdr-services-sa@ldmr-velocitymatch.iam.gserviceaccount.com'
      - '--add-cloudsql-instances=ldmr-velocitymatch:us-central1:lmdr-postgres'
      - '--vpc-connector=lmdr-vpc-connector'
      - '--min-instances=1'
      - '--max-instances=20'
      - '--memory=512Mi'
      - '--cpu=1'
      - '--concurrency=80'
      - '--set-env-vars=NODE_ENV=production,SERVICE_NAME=lmdr-matching-engine,PG_DATABASE=lmdr,PG_USER=lmdr_user,CLOUD_SQL_INSTANCE=ldmr-velocitymatch:us-central1:lmdr-postgres'
      - '--set-secrets=PG_PASSWORD=lmdr-pg-password:latest'
      - '--no-allow-unauthenticated'

images:
  - 'gcr.io/ldmr-velocitymatch/lmdr-matching-engine:$COMMIT_SHA'
```

### 2.7 Deploy Command

```bash
cd C:\Users\nolan\LMDR_WEBSITE_V2\LMDR-_-WEBSITE-V2
gcloud builds submit --config=services/matching-engine/cloudbuild.yaml --project=ldmr-velocitymatch
```

**Task 2 complete when:** `GET https://lmdr-matching-engine-<hash>-uc.a.run.app/health` returns `{ status: 'ok' }`. Jest tests pass with ≥ 80% coverage.

---

## Task 3: lmdr-driver-service

**Estimated effort:** 4 days
**GCP service name:** `lmdr-driver-service`
**Source categories:** 1 (Driver Onboarding & Registration), 13 (File & Media Processing)
**Wix .jsw files:** `driverProfiles.jsw`, `onboardingService.jsw`, `documentCollectionService.jsw`, `documentUploadService.jsw`, `cdlPhotoService.jsw`

### 3.1 Directory Structure

```
services/driver-service/
├── package.json
├── tsconfig.json
├── Dockerfile
├── cloudbuild.yaml
└── src/
    ├── app.ts
    ├── server.ts
    ├── routes/
    │   ├── health.ts
    │   ├── drivers.ts       ← /drivers/* CRUD
    │   └── documents.ts     ← /drivers/:id/documents
    ├── services/
    │   ├── driverProfile.ts     ← Port of driverProfiles.jsw
    │   ├── onboarding.ts        ← Port of onboardingService.jsw — state machine
    │   └── documents.ts         ← Port of documentCollectionService.jsw
    └── db/
        └── queries.ts
```

### 3.2 Onboarding State Machine

Port the onboarding state machine from `onboardingService.jsw`. Steps are:

```typescript
// src/services/onboarding.ts
export const ONBOARDING_STEPS = [
  { step: 1, name: 'profile_created', next: 'documents_required' },
  { step: 2, name: 'documents_required', next: 'cdl_submitted' },
  { step: 3, name: 'cdl_submitted', next: 'background_check' },
  { step: 4, name: 'background_check', next: 'mvr_check' },
  { step: 5, name: 'mvr_check', next: 'profile_review' },
  { step: 6, name: 'profile_review', next: 'active' },
  { step: 7, name: 'active', next: null },
] as const;

export async function advanceOnboardingStep(driverId: string): Promise<{ step: number; name: string }> {
  // 1. Load current step from Cloud SQL
  // 2. Validate transition is allowed (all required docs for current step present)
  // 3. Update step in Cloud SQL
  // 4. Return new step
}
```

### 3.3 Key Routes

**`src/routes/drivers.ts`:**
```typescript
// POST /drivers — create driver profile
// GET  /drivers/:id — full driver profile
// PUT  /drivers/:id — update profile fields
// PUT  /drivers/:id/onboarding-step — advance state machine
// GET  /drivers/:id/onboarding-status — { step, name, nextRequired[] }
// PUT  /drivers/:id/visibility — { visibilityLevel, isSearchable }
```

### 3.4 Dockerfile and cloudbuild.yaml

Same pattern as Task 2. Replace `matching-engine` with `driver-service` throughout. Service-specific settings:

```yaml
- '--min-instances=1'
- '--max-instances=10'
- '--memory=512Mi'
- '--set-env-vars=SERVICE_NAME=lmdr-driver-service,...'
```

**Task 3 complete when:** Driver create → onboarding step advance → document metadata registration all succeed in integration test.

---

## Task 4: lmdr-carrier-service

**Estimated effort:** 5 days
**GCP service name:** `lmdr-carrier-service`
**Source categories:** 3 (Carrier Management), 4 (Dispatch & Scheduling)
**Wix .jsw files:** `carrierService.jsw`, `carrierAdminService.jsw`, `carrierPreferences.jsw`, `dispatchService.jsw`, `loadBoardService.jsw`, `shiftScheduler.jsw`

### 4.1 Directory Structure

```
services/carrier-service/
└── src/
    ├── routes/
    │   ├── carriers.ts     ← /carriers/* CRUD
    │   ├── jobs.ts         ← /carriers/:id/jobs
    │   └── dispatch.ts     ← /dispatch/*
    └── services/
        ├── carrierAccount.ts
        ├── carrierPreferences.ts
        ├── jobBoard.ts
        └── dispatch.ts
```

### 4.2 Dispatch Queue Implementation

Port `dispatchService.jsw` and `loadBoardService.jsw`:

```typescript
// src/services/dispatch.ts
export async function assignDriverToJob(driverId: string, jobId: string, assignedBy: string) {
  // 1. Verify job is open (from Cloud SQL)
  // 2. Verify driver is available and compliant
  // 3. Create assignment record in Cloud SQL
  // 4. Update job status to 'filled'
  // 5. Publish event to lmdr-notifications topic
}

export async function getDispatchQueue(): Promise<DispatchQueueItem[]> {
  // Returns open jobs ordered by urgency (start date ASC)
}
```

### 4.3 New Cloud SQL Tables Required

Add to `lmdr` database (migration script: `services/carrier-service/db/migrations/001_dispatch_tables.sql`):

```sql
CREATE TABLE IF NOT EXISTS dispatch_assignments (
  _id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  job_id       TEXT NOT NULL,
  driver_id    TEXT NOT NULL,
  carrier_id   TEXT NOT NULL,
  assigned_by  TEXT NOT NULL,
  assigned_at  TIMESTAMPTZ DEFAULT NOW(),
  status       TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed'))
);

CREATE INDEX idx_dispatch_job ON dispatch_assignments(job_id);
CREATE INDEX idx_dispatch_driver ON dispatch_assignments(driver_id);
```

### 4.4 cloudbuild.yaml

Same pattern as Task 2. Service name: `lmdr-carrier-service`. Min instances: 1. Max: 10.

**Task 4 complete when:** Carrier create → post job → assign driver → dispatch queue reflects assignment.

---

## Task 5: lmdr-compliance-service

**Estimated effort:** 4 days
**GCP service name:** `lmdr-compliance-service`
**Source categories:** 5 (Compliance & Document Management), 14 (Audit & Logging)
**Wix .jsw files:** `complianceService.jsw`, `mvrService.jsw`, `backgroundCheckService.jsw`, `auditService.jsw`, `complianceEventService.jsw`

### 5.1 Directory Structure

```
services/compliance-service/
└── src/
    ├── routes/
    │   ├── compliance.ts   ← /compliance/*
    │   └── audit.ts        ← /audit/*
    └── services/
        ├── mvrCheck.ts          ← Wraps third-party MVR API
        ├── backgroundCheck.ts   ← Wraps third-party BG check API
        ├── complianceStatus.ts  ← Aggregates compliance state
        └── auditLog.ts          ← Writes to audit_events table
```

### 5.2 Async Compliance Checks via Cloud Tasks

Third-party MVR and background checks can take 30–120 seconds. Use Cloud Tasks for async execution:

```typescript
// src/services/mvrCheck.ts
import { CloudTasksClient } from '@google-cloud/tasks';

const tasksClient = new CloudTasksClient();

export async function triggerMvrCheck(driverId: string): Promise<{ checkId: string }> {
  const checkId = crypto.randomUUID();
  // 1. Create pending record in compliance_checks table
  // 2. Enqueue Cloud Task to call /internal/mvr-check/execute
  const queue = `projects/ldmr-velocitymatch/locations/us-central1/queues/lmdr-compliance`;
  await tasksClient.createTask({
    parent: queue,
    task: {
      httpRequest: {
        httpMethod: 'POST' as const,
        url: `${process.env.SELF_URL}/internal/mvr-check/execute`,
        body: Buffer.from(JSON.stringify({ checkId, driverId })).toString('base64'),
        headers: { 'Content-Type': 'application/json' },
        oidcToken: { serviceAccountEmail: 'lmdr-services-sa@ldmr-velocitymatch.iam.gserviceaccount.com' },
      },
    },
  });
  return { checkId };
}
```

### 5.3 Audit Log Table

```sql
CREATE TABLE IF NOT EXISTS audit_events (
  _id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  actor_id      TEXT NOT NULL,
  actor_role    TEXT NOT NULL,
  action        TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id   TEXT NOT NULL,
  before_state  JSONB,
  after_state   JSONB,
  ip_address    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_actor ON audit_events(actor_id);
CREATE INDEX idx_audit_resource ON audit_events(resource_type, resource_id);
CREATE INDEX idx_audit_created ON audit_events(created_at DESC);
```

### 5.4 Cloud Build + Deploy

Same pattern. Service name: `lmdr-compliance-service`. Add Cloud Tasks API grant to `lmdr-services-sa`:

```bash
gcloud projects add-iam-policy-binding ldmr-velocitymatch \
  --member="serviceAccount:lmdr-services-sa@ldmr-velocitymatch.iam.gserviceaccount.com" \
  --role="roles/cloudtasks.enqueuer"
```

**Task 5 complete when:** MVR check trigger creates Cloud Task, audit event write reflects in audit trail query.

---

## Task 6: lmdr-notifications-service

**Estimated effort:** 3 days
**GCP service name:** `lmdr-notifications-service`
**Source categories:** 6 (Notifications & Messaging)
**Wix .jsw files:** `notificationService.jsw`, `emailService.jsw`, `smsService.jsw`

### 6.1 Directory Structure

```
services/notifications-service/
└── src/
    ├── routes/
    │   └── notify.ts       ← /notify/*, /notifications/*
    ├── services/
    │   ├── email.ts         ← SendGrid integration
    │   ├── sms.ts           ← Twilio integration
    │   ├── push.ts          ← Push notification (FCM)
    │   └── history.ts       ← Notification history in Cloud SQL
    └── pubsub/
        └── subscriber.ts    ← Pub/Sub push handler
```

### 6.2 SendGrid Integration

```typescript
// src/services/email.ts
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function sendEmail(payload: NotificationPayload): Promise<void> {
  await sgMail.send({
    to: payload.recipientId,    // must be email address
    from: 'noreply@lastmiledr.app',
    subject: payload.subject ?? 'LMDR Notification',
    text: payload.body,
    templateId: payload.templateId,
    dynamicTemplateData: payload.metadata as Record<string, string>,
  });
}
```

### 6.3 Pub/Sub Subscriber

The service subscribes to `lmdr-notifications` for async retry delivery. Cloud Run receives push delivery from Pub/Sub:

```typescript
// src/pubsub/subscriber.ts
import { Router, Request, Response } from 'express';

const router = Router();

// Pub/Sub pushes to /pubsub/notifications (no auth — internal VPC only)
router.post('/notifications', async (req: Request, res: Response) => {
  const message = req.body?.message;
  if (!message) return res.status(400).send('No message');
  const data = JSON.parse(Buffer.from(message.data, 'base64').toString());
  try {
    await deliverNotification(data);
    res.status(204).send(); // ACK
  } catch (err) {
    res.status(500).send('NACK'); // Pub/Sub will retry
  }
});

export default router;
```

### 6.4 Notification History Table

```sql
CREATE TABLE IF NOT EXISTS notification_history (
  _id           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  recipient_id  TEXT NOT NULL,
  channel       TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'push')),
  subject       TEXT,
  body          TEXT NOT NULL,
  status        TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'read')),
  sent_at       TIMESTAMPTZ DEFAULT NOW(),
  read_at       TIMESTAMPTZ
);

CREATE INDEX idx_notif_recipient ON notification_history(recipient_id, sent_at DESC);
```

### 6.5 Dependencies in package.json

```json
{
  "dependencies": {
    "@sendgrid/mail": "^8.1.0",
    "twilio": "^5.0.0",
    "firebase-admin": "^12.0.0",
    "@lmdr/db": "^1.0.0",
    "@lmdr/middleware": "^1.0.0",
    "@lmdr/types": "^1.0.0",
    "express": "^4.18.3"
  }
}
```

### 6.6 cloudbuild.yaml Secrets

```yaml
- '--set-secrets=PG_PASSWORD=lmdr-pg-password:latest,SENDGRID_API_KEY=lmdr-sendgrid-api-key:latest,TWILIO_ACCOUNT_SID=lmdr-twilio-account-sid:latest,TWILIO_AUTH_TOKEN=lmdr-twilio-auth-token:latest'
```

**Task 6 complete when:** Email, SMS, and push all deliver in integration test. Pub/Sub subscriber ACKs correctly.

---

## Task 7: lmdr-billing-service

**Estimated effort:** 3 days
**GCP service name:** `lmdr-billing-service`
**Source categories:** 7 (Payments & Billing)
**Wix .jsw files:** `billingService.jsw`, `invoiceService.jsw`, `payoutService.jsw`

### 7.1 Directory Structure

```
services/billing-service/
└── src/
    ├── routes/
    │   ├── billing.ts      ← /billing/*
    │   └── webhooks.ts     ← /webhooks/stripe
    └── services/
        ├── rateCards.ts
        ├── invoices.ts
        └── payouts.ts
```

### 7.2 Stripe Webhook Handler

```typescript
// src/routes/webhooks.ts
import Stripe from 'stripe';
import { Router, Request, Response } from 'express';
import { pool } from '@lmdr/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const router = Router();

// Raw body required for Stripe HMAC verification
router.post('/stripe', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return res.status(400).json({ error: 'Webhook signature invalid' });
  }
  // Handle event types
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
      break;
    case 'invoice.paid':
      await handleInvoicePaid(event.data.object as Stripe.Invoice);
      break;
  }
  res.json({ received: true });
});
```

### 7.3 Billing Tables

```sql
CREATE TABLE IF NOT EXISTS invoices (
  _id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  carrier_id   TEXT NOT NULL,
  driver_id    TEXT,
  line_items   JSONB NOT NULL,
  total_amount NUMERIC(10,2) NOT NULL,
  currency     TEXT DEFAULT 'USD',
  status       TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue')),
  due_date     DATE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rate_cards (
  _id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name         TEXT NOT NULL,
  carrier_id   TEXT,          -- NULL = global default
  rate_type    TEXT NOT NULL, -- 'per_mile', 'per_load', 'hourly'
  rate_amount  NUMERIC(10,4) NOT NULL,
  effective_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at   TIMESTAMPTZ
);
```

**Task 7 complete when:** Invoice create → payout calculate → Stripe webhook processes payment event.

---

## Task 8: lmdr-ai-service

**Estimated effort:** 4 days
**GCP service name:** `lmdr-ai-service`
**Source categories:** 8 (AI Intelligence Layer), 17 (Data Sync & ETL)
**Wix .jsw files:** `aiRouterService.jsw`, `ragService.jsw`, `vectorService.jsw`, `agentService.jsw`, `airtableSyncService.jsw`
**Wraps:** existing `services/ai-intelligence/` monorepo (if it exists; otherwise build as new service)

### 8.1 Directory Structure

```
services/ai-service/
├── package.json
├── Dockerfile
├── cloudbuild.yaml
└── src/
    ├── app.ts
    ├── server.ts
    ├── routes/
    │   ├── health.ts
    │   ├── recommend.ts    ← /ai/recommend-jobs
    │   ├── rag.ts          ← /ai/rag/*
    │   ├── vectors.ts      ← /ai/vectors/*
    │   ├── agent.ts        ← /ai/agent/turn
    │   └── sync.ts         ← /ai/sync/airtable
    └── services/
        ├── openaiClient.ts  ← OpenAI SDK wrapper
        ├── ragPipeline.ts   ← Port of ragService.jsw
        ├── vectorStore.ts   ← Port of vectorService.jsw
        ├── agentOrchestrator.ts ← Port of agentService.jsw
        └── airtableSync.ts  ← Port of airtableSyncService.jsw
```

### 8.2 OpenAI Client

```typescript
// src/services/openaiClient.ts
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function createEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

export async function createChatCompletion(messages: OpenAI.Chat.ChatCompletionMessageParam[], tools?: OpenAI.Chat.ChatCompletionTool[]) {
  return openai.chat.completions.create({
    model: 'gpt-4o',
    messages,
    tools,
    tool_choice: tools ? 'auto' : undefined,
  });
}
```

### 8.3 Agent Turn Port

Port `agentService.jsw` `handleAgentTurn()`:

```typescript
// src/services/agentOrchestrator.ts
export async function handleAgentTurn(role: string, userId: string, message: string, context: Record<string, unknown>) {
  // 1. Load recent conversation context from Cloud SQL
  // 2. Build role-scoped tool definitions
  // 3. Call OpenAI with messages + tools
  // 4. Execute tool_use responses in loop
  // 5. Persist turn to Cloud SQL (agent_conversations, agent_turns tables)
  // 6. Return final text response
}
```

### 8.4 cloudbuild.yaml Secrets

```yaml
- '--set-secrets=PG_PASSWORD=lmdr-pg-password:latest,OPENAI_API_KEY=lmdr-openai-api-key:latest,VAPI_PRIVATE_KEY=lmdr-vapi-private-key:latest'
- '--memory=1Gi'
- '--cpu=2'
```

**Task 8 complete when:** Job recommendation returns ranked results. RAG query returns relevant document excerpts. Agent turn logs persist to Cloud SQL.

---

## Task 9: lmdr-analytics-service

**Estimated effort:** 3 days
**GCP service name:** `lmdr-analytics-service`
**Source categories:** 9 (Analytics & Reporting), 10 (Authentication & Authorization partial)
**Wix .jsw files:** `observabilityService.jsw`, `reportingService.jsw`, `admin_audit_service.jsw`, `authService.jsw`, `roleService.jsw`

### 9.1 Directory Structure

```
services/analytics-service/
└── src/
    ├── routes/
    │   ├── analytics.ts    ← /analytics/*
    │   └── auth.ts         ← /auth/roles/*
    └── services/
        ├── dashboardMetrics.ts   ← Port of observabilityService.jsw
        ├── reportGenerator.ts    ← Port of reportingService.jsw
        └── roleManager.ts        ← Port of roleService.jsw
```

### 9.2 Dashboard Metrics Aggregation

```typescript
// src/services/dashboardMetrics.ts
import { pool } from '@lmdr/db';

export async function getDashboardMetrics() {
  const [drivers, carriers, jobs, assignments] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM airtable_v2_driver_profiles'),
    pool.query('SELECT COUNT(*) FROM airtable_carriers_master'),
    pool.query("SELECT COUNT(*) FROM airtable_v2_job_listings WHERE data->>'status' = 'open'"),
    pool.query("SELECT COUNT(*) FROM dispatch_assignments WHERE status = 'active'"),
  ]);
  return {
    totalDrivers: Number(drivers.rows[0].count),
    totalCarriers: Number(carriers.rows[0].count),
    openJobs: Number(jobs.rows[0].count),
    activeAssignments: Number(assignments.rows[0].count),
    generatedAt: new Date().toISOString(),
  };
}
```

### 9.3 Role Management

Port `roleService.jsw` to manage role assignments in Cloud SQL:

```sql
CREATE TABLE IF NOT EXISTS user_roles (
  uid       TEXT NOT NULL,
  role      TEXT NOT NULL CHECK (role IN ('admin', 'recruiter', 'carrier', 'driver')),
  carrier_id TEXT,
  driver_id  TEXT,
  granted_by TEXT NOT NULL,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (uid, role)
);
```

**Task 9 complete when:** Dashboard metrics endpoint returns aggregate counts. Role assignment persists and is queryable.

---

## Task 10: Strangler Fig Migration and Traffic Routing

**Estimated effort:** 3 days
**Prerequisite:** All Tasks 2–9 deployed and healthy.

### 10.1 Create lmdr-feature-flags Secret

```bash
gcloud secrets create lmdr-feature-flags --project=ldmr-velocitymatch

echo '{
  "matching_engine": "wix",
  "driver_service": "wix",
  "carrier_service": "wix",
  "compliance_service": "wix",
  "notifications_service": "wix",
  "billing_service": "wix",
  "ai_service": "wix",
  "analytics_service": "wix"
}' | gcloud secrets versions add lmdr-feature-flags --data-file=- --project=ldmr-velocitymatch
```

### 10.2 Create gcpClient.jsw in Wix Backend

Create `src/backend/gcpClient.jsw` — thin HTTP client that Wix `.jsw` files use to call Cloud Run:

```javascript
// src/backend/gcpClient.jsw
import { fetch } from 'wix-fetch';
import { getSecret } from 'wix-secrets-backend';

const SERVICE_URLS = {
  'matching-engine': 'https://lmdr-matching-engine-<hash>-uc.a.run.app',
  'driver-service':  'https://lmdr-driver-service-<hash>-uc.a.run.app',
  'carrier-service': 'https://lmdr-carrier-service-<hash>-uc.a.run.app',
  'compliance-service': 'https://lmdr-compliance-service-<hash>-uc.a.run.app',
  'notifications-service': 'https://lmdr-notifications-service-<hash>-uc.a.run.app',
  'billing-service': 'https://lmdr-billing-service-<hash>-uc.a.run.app',
  'ai-service':      'https://lmdr-ai-service-<hash>-uc.a.run.app',
  'analytics-service': 'https://lmdr-analytics-service-<hash>-uc.a.run.app',
};

let _flags = null;
let _flagsLoadedAt = 0;
const FLAGS_TTL_MS = 60_000;

async function getFeatureFlags() {
  if (_flags && Date.now() - _flagsLoadedAt < FLAGS_TTL_MS) return _flags;
  try {
    const raw = await getSecret('lmdr-feature-flags');
    _flags = JSON.parse(raw);
    _flagsLoadedAt = Date.now();
  } catch (e) {
    _flags = {}; // Default to Wix on error
  }
  return _flags;
}

export async function getServiceFlag(serviceName) {
  const flags = await getFeatureFlags();
  return flags[serviceName.replace(/-/g, '_')] ?? 'wix';
}

export async function httpPost(serviceName, path, body) {
  const baseUrl = SERVICE_URLS[serviceName];
  if (!baseUrl) throw new Error(`Unknown service: ${serviceName}`);
  const resp = await fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`${serviceName} ${path} returned ${resp.status}`);
  return resp.json();
}

export async function httpGet(serviceName, path) {
  const baseUrl = SERVICE_URLS[serviceName];
  const resp = await fetch(`${baseUrl}${path}`, { method: 'GET' });
  if (!resp.ok) throw new Error(`${serviceName} ${path} returned ${resp.status}`);
  return resp.json();
}
```

**Note:** Replace `<hash>` values with actual Cloud Run service URLs after Task 2–9 deployments.

### 10.3 Wrap Each .jsw File for Strangler Fig Routing

For each migrated `.jsw` function, add routing wrapper. Example for `carrierMatching.jsw`:

```javascript
// src/backend/carrierMatching.jsw (modified)
import { getServiceFlag, httpPost } from 'backend/gcpClient';

// Internal implementation (existing code — renamed)
async function _findMatchingJobsLocal(driverProfile) {
  // ... existing carrierMatching.jsw logic unchanged ...
}

// Public export — now flag-aware
export async function findMatchingJobs(driverProfile) {
  const flag = await getServiceFlag('matching-engine');

  if (flag === 'gcp') {
    return httpPost('matching-engine', '/match/find-jobs', { driverProfile });
  }

  if (flag === 'dual') {
    const [wixResult, gcpResult] = await Promise.allSettled([
      _findMatchingJobsLocal(driverProfile),
      httpPost('matching-engine', '/match/find-jobs', { driverProfile })
    ]);
    // Log discrepancy to Cloud Logging via observabilityService
    if (wixResult.status === 'fulfilled') {
      return wixResult.value;
    }
  }

  return _findMatchingJobsLocal(driverProfile);
}
```

Repeat this pattern for all exported functions in the 8 service scopes. Work through one service at a time.

### 10.4 Cutover Script

```bash
# Cutover a service from Wix to GCP (after 72h dual-mode validation)
# Usage: bash cutover.sh matching_engine
SERVICE=$1
CURRENT=$(gcloud secrets versions access latest \
  --secret=lmdr-feature-flags \
  --project=ldmr-velocitymatch)

UPDATED=$(echo "$CURRENT" | python3 -c "
import json, sys
flags = json.load(sys.stdin)
flags['$SERVICE'] = 'gcp'
print(json.dumps(flags, indent=2))
")

echo "$UPDATED" | gcloud secrets versions add lmdr-feature-flags \
  --data-file=- \
  --project=ldmr-velocitymatch

echo "Flag for $SERVICE set to 'gcp'. Takes effect within 60s."
```

Save as: `scripts/cutover.sh`

### 10.5 End-to-End Integration Tests

Create `tests/e2e/phase2-integration.test.ts`. Each test:
1. Creates required entities via Cloud Run API
2. Executes the business logic operation
3. Validates Cloud SQL state matches expected outcome

Test scenarios (minimum required before full cutover):
- Driver onboarding lifecycle (Steps 1–7)
- Job post → driver match → dispatch assign
- Compliance check → audit event → status query
- Notification email delivery (SendGrid sandbox)
- Invoice generate → payout calculate
- AI job recommendation returns ranked list
- Analytics dashboard returns non-zero counts

Run: `npx jest tests/e2e/ --testTimeout=30000`

**Task 10 complete when:** All e2e tests pass with all services running in `"gcp"` mode against a staging environment.

---

## Task 11: Service Mesh and Observability

**Estimated effort:** 2 days
**Prerequisite:** All services deployed.

### 11.1 Structured Logging

All services use `@lmdr/middleware`'s `requestLogger` (Task 1.4). This emits JSON to stdout, which Cloud Logging automatically ingests. Verify logs are queryable:

```bash
gcloud logging read \
  'resource.type="cloud_run_revision" AND resource.labels.service_name="lmdr-matching-engine"' \
  --project=ldmr-velocitymatch \
  --limit=10 \
  --format=json
```

### 11.2 Cloud Monitoring Dashboards

Create one dashboard per service via GCP Console (Monitoring → Dashboards → Create):

Required charts per dashboard:
- Request count (metric: `run.googleapis.com/request_count`)
- P95 request latency (metric: `run.googleapis.com/request_latencies`)
- Container instance count (metric: `run.googleapis.com/container/instance_count`)
- Error rate (filter: `response_code_class >= 500`)

Create dashboards for: `lmdr-matching-engine`, `lmdr-driver-service`, `lmdr-carrier-service`, `lmdr-compliance-service`, `lmdr-notifications-service`, `lmdr-billing-service`, `lmdr-ai-service`, `lmdr-analytics-service`.

### 11.3 Alerting Policies

Create via gcloud for each service:

```bash
# Error rate alert (> 5% 5xx in 5-minute window)
gcloud alpha monitoring policies create \
  --policy-from-file=scripts/alerts/error-rate-policy.json \
  --project=ldmr-velocitymatch
```

`scripts/alerts/error-rate-policy.json`:
```json
{
  "displayName": "LMDR Services — High Error Rate",
  "conditions": [{
    "displayName": "5xx error rate > 5%",
    "conditionThreshold": {
      "filter": "resource.type = \"cloud_run_revision\" AND metric.type = \"run.googleapis.com/request_count\" AND metric.labels.response_code_class = \"5xx\"",
      "comparison": "COMPARISON_GT",
      "thresholdValue": 0.05,
      "duration": "300s",
      "aggregations": [{ "alignmentPeriod": "60s", "crossSeriesReducer": "REDUCE_SUM", "perSeriesAligner": "ALIGN_RATE" }]
    }
  }],
  "alertStrategy": { "notificationRateLimit": { "period": "3600s" } }
}
```

Create similar policies for:
- P99 latency > 1000ms
- Cold start count > 10 per 5 minutes
- Instance count = 0 for min-instance services

### 11.4 Cloud Trace Setup

Add OpenTelemetry auto-instrumentation to each service's `server.ts`:

```typescript
// src/server.ts (at very top, before any imports)
import { NodeTracerProvider } from '@opentelemetry/sdk-node';
import { TraceExporter } from '@google-cloud/opentelemetry-cloud-trace-exporter';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';

const provider = new NodeTracerProvider({
  traceExporter: new TraceExporter(),
  instrumentations: [new HttpInstrumentation(), new ExpressInstrumentation()],
});
provider.register();
```

Add to each service's `package.json` dependencies:
```json
"@opentelemetry/sdk-node": "^0.51.0",
"@google-cloud/opentelemetry-cloud-trace-exporter": "^2.0.0",
"@opentelemetry/instrumentation-http": "^0.51.0",
"@opentelemetry/instrumentation-express": "^0.38.0"
```

**Task 11 complete when:** Cloud Monitoring shows all 9 services with latency and error rate charts. At least one alert policy is active.

---

## Task 12: Documentation and Runbook

**Estimated effort:** 2 days
**Prerequisite:** All services deployed and cutover to `"gcp"` mode.

### 12.1 OpenAPI Specs

Generate OpenAPI 3.0 spec for each service using `swagger-jsdoc`:

```bash
npm install swagger-jsdoc swagger-ui-express --workspace=services/matching-engine
```

Add to each `app.ts`:
```typescript
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

const spec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: { title: 'lmdr-matching-engine', version: '1.0.0' },
    servers: [{ url: process.env.SERVICE_URL }],
  },
  apis: ['./src/routes/*.ts'],
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));
app.get('/openapi.json', (_, res) => res.json(spec));
```

Annotate all routes with JSDoc `@swagger` blocks. Export and save as `services/<name>/openapi.yaml` in Cloud Build step.

### 12.2 Inter-Service Communication Diagram

Create `docs/phase2-service-diagram.md` with a Mermaid architecture diagram:

```
services/
└── docs/
    └── phase2-service-diagram.md
```

Content:
```markdown
## LMDR Phase 2 Service Mesh

\`\`\`mermaid
graph TD
  Wix[Wix Frontend] -->|HTTP + Feature Flag| lmdr-api
  Wix -->|Strangler Fig gcpClient.jsw| matching[lmdr-matching-engine]
  Wix -->|Strangler Fig gcpClient.jsw| driver[lmdr-driver-service]
  Wix -->|Strangler Fig gcpClient.jsw| carrier[lmdr-carrier-service]

  matching -->|reads| CloudSQL[(Cloud SQL lmdr-postgres)]
  driver -->|reads/writes| CloudSQL
  driver -->|HTTP| compliance[lmdr-compliance-service]
  driver -->|HTTP| notify[lmdr-notifications-service]
  carrier -->|reads/writes| CloudSQL
  carrier -->|HTTP| notify
  carrier -->|HTTP| billing[lmdr-billing-service]
  compliance -->|writes| CloudSQL
  compliance -->|Cloud Tasks| ThirdParty[MVR / BG Check APIs]
  notify -->|Pub/Sub| PubSub{{lmdr-notifications topic}}
  notify -->|SendGrid| Email[Email]
  notify -->|Twilio| SMS[SMS]
  ai[lmdr-ai-service] -->|reads| CloudSQL
  ai -->|OpenAI API| OpenAI[OpenAI]
  analytics[lmdr-analytics-service] -->|reads| CloudSQL
\`\`\`
```

### 12.3 Deployment Runbook

Create `services/RUNBOOK.md`:

```markdown
# LMDR Phase 2 Deployment Runbook

## Deploy a Single Service
cd LMDR-_-WEBSITE-V2
gcloud builds submit --config=services/<name>/cloudbuild.yaml --project=ldmr-velocitymatch

## Check Service Health
curl https://lmdr-<name>-<hash>-uc.a.run.app/health

## View Logs (last 100 lines)
gcloud logging read 'resource.labels.service_name="lmdr-<name>"' --limit=100 --format=json --project=ldmr-velocitymatch

## Set Feature Flag
echo '{"matching_engine":"gcp",...}' | gcloud secrets versions add lmdr-feature-flags --data-file=- --project=ldmr-velocitymatch

## Rollback a Service to Previous Revision
gcloud run services update-traffic lmdr-<name> --to-revisions=PREVIOUS=100 --region=us-central1 --project=ldmr-velocitymatch

## Rollback a Service to Wix (via feature flag)
bash scripts/cutover.sh <service_key> wix
```

### 12.4 Incident Response Guide

Create `services/INCIDENT_RESPONSE.md`. Cover:
- How to identify which service is failing (Cloud Monitoring → Incidents)
- Flag rollback procedure (< 60 seconds)
- Cloud Run revision rollback procedure (< 30 seconds)
- Cloud SQL connection exhaustion (check `max_connections`, reduce pool sizes)
- Pub/Sub message backlog (monitor `subscription/num_undelivered_messages`)
- Third-party API outage (compliance, SendGrid, Twilio) — fallback behavior per service

### 12.5 Update CLAUDE.md

Add a section to `LMDR-_-WEBSITE-V2/CLAUDE.md` documenting:
- The 9 Cloud Run service names and their base URLs
- The `lmdr-feature-flags` secret and how to change it
- The `gcpClient.jsw` import pattern for Wix `.jsw` wrappers
- The Cloud SQL tables added in Phase 2 (dispatch_assignments, audit_events, notification_history, invoices, rate_cards, user_roles)

**Task 12 complete when:** OpenAPI specs accessible at `/docs` for all services. Runbook and incident response docs committed to repo.

---

## Completion Checklist

| # | Task | Service | Status |
|---|------|---------|--------|
| 1 | Shared monorepo + packages | Infrastructure | ☐ |
| 2 | lmdr-matching-engine deployed | Matching + Search | ☐ |
| 3 | lmdr-driver-service deployed | Driver + Files | ☐ |
| 4 | lmdr-carrier-service deployed | Carrier + Dispatch | ☐ |
| 5 | lmdr-compliance-service deployed | Compliance + Audit | ☐ |
| 6 | lmdr-notifications-service deployed | Notifications | ☐ |
| 7 | lmdr-billing-service deployed | Billing | ☐ |
| 8 | lmdr-ai-service deployed | AI + ETL | ☐ |
| 9 | lmdr-analytics-service deployed | Analytics + Auth | ☐ |
| 10 | Strangler Fig wrappers + e2e tests | Migration | ☐ |
| 11 | Observability dashboards + alerts | Platform | ☐ |
| 12 | OpenAPI docs + runbook committed | Documentation | ☐ |
| — | All feature flags set to `"gcp"` | Cutover | ☐ |
| — | Airtable dependency for reads = 0 req/hour | Validation | ☐ |

---

*End of PLAN.md*
