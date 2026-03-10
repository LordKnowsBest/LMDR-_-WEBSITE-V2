# Cloud Run Express API — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Build a Node.js/Express REST API on Cloud Run that replaces `src/backend/dataAccess.jsw` and queries Cloud SQL directly instead of Airtable.

**Architecture:** Express app with a generic `:collection` router that maps any `collectionKey` to a JSONB SQL table, plus Firebase Auth and API-key middleware. Deployed to Cloud Run in `ldmr-velocitymatch / us-central1`.

**Tech Stack:** Node.js 20, Express 4, pg 8, @google-cloud/cloud-sql-connector, firebase-admin, Jest 29

**Working directory for all commands:** `C:\Users\nolan\LMDR_WEBSITE_V2\LMDR-_-WEBSITE-V2\cloud-run-api\`
(create this folder in Task 1 — it is a sibling of `src/`)

---

## ⚠️ MANUAL SETUP CHECKLIST — Do These Before Running Any Task

The following items **cannot be automated** and must be done by Levy before a fresh Claude session executes this plan. Each is marked `[MANUAL]`.

| # | What | Where | Status |
|---|------|--------|--------|
| M1 | Confirm Cloud SQL is reachable (proxy running) | Run `08b_cloud_sql_proxy_adc.ps1` | ☐ |
| M2 | Create Secret Manager secret `lmdr-pg-password` | See Task 0 below | ☐ |
| M3 | Create Secret Manager secret `lmdr-api-key-pepper` | See Task 0 below | ☐ |
| M4 | Create Cloud Run service account `lmdr-api-sa` | See Task 0 below | ☐ |
| M5 | Grant service account `roles/cloudsql.client` | See Task 0 below | ☐ |
| M6 | Grant service account `roles/secretmanager.secretAccessor` | See Task 0 below | ☐ |
| M7 | Run `gcloud auth configure-docker us-central1-docker.pkg.dev` | Terminal | ☐ |
| M8 | Confirm Firebase project ID is `ldmr-velocitymatch` | Firebase Console | ☐ |

---

## Task 0: Manual GCP Setup (Levy Does This, Not Claude)

> ⚠️ **MANUAL SETUP — Levy must complete ALL steps in this task before asking Claude to execute Tasks 1–10.**

**This task has no code. It is 8 shell commands you run once.**

### Step 1: Start the Cloud SQL Auth Proxy (keep this terminal open)

```powershell
# In a new PowerShell terminal — keep it open the entire time you work
cd "C:\Users\nolan\LMDR_WEBSITE_V2\LMDR-_-WEBSITE-V2\Conductor\tracks\gcp_migration_20260218\scripts"
.\08b_cloud_sql_proxy_adc.ps1
```

Expected output: `Proxy ready for new connections` — do NOT close this window.

### Step 2: Set your GCP project

```bash
gcloud config set project ldmr-velocitymatch
```

### Step 3: Create Secret Manager secret — Postgres password

```bash
# The password is in 08b_cloud_sql_proxy_adc.ps1 line 58
echo -n "cht7nLOGcOxpNm2ruPhO6ScqKBeqsF4o" | \
  gcloud secrets create lmdr-pg-password \
    --data-file=- \
    --replication-policy=automatic
```

> ⚠️ If the secret already exists: `gcloud secrets versions add lmdr-pg-password --data-file=-`

### Step 4: Create Secret Manager secret — API key pepper

```bash
# Generate a random 32-byte pepper and store it
openssl rand -hex 32 | \
  gcloud secrets create lmdr-api-key-pepper \
    --data-file=- \
    --replication-policy=automatic
```

> ⚠️ **Write down this pepper value** — if it changes, all existing API keys stop working.
> To read it back: `gcloud secrets versions access latest --secret=lmdr-api-key-pepper`

### Step 5: Create a dedicated Cloud Run service account

```bash
gcloud iam service-accounts create lmdr-api-sa \
  --display-name="LMDR API Service Account" \
  --project=ldmr-velocitymatch
```

### Step 6: Grant service account Cloud SQL access

```bash
gcloud projects add-iam-policy-binding ldmr-velocitymatch \
  --member="serviceAccount:lmdr-api-sa@ldmr-velocitymatch.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```

### Step 7: Grant service account Secret Manager access

```bash
gcloud projects add-iam-policy-binding ldmr-velocitymatch \
  --member="serviceAccount:lmdr-api-sa@ldmr-velocitymatch.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Step 8: Configure Docker for Artifact Registry

```bash
gcloud auth configure-docker us-central1-docker.pkg.dev
```

### Step 9: Verify everything

```bash
# Should show both secrets
gcloud secrets list --project=ldmr-velocitymatch

# Should show lmdr-api-sa
gcloud iam service-accounts list --project=ldmr-velocitymatch

# Should connect to the DB (proxy must be running from Step 1)
psql "host=127.0.0.1 port=5432 dbname=lmdr user=lmdr_user password=cht7nLOGcOxpNm2ruPhO6ScqKBeqsF4o" \
  -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"
```

Expected: A number ≥ 5 (the migrated tables).

> ✅ Once all 9 steps pass, tell Claude: "Task 0 complete, ready to execute Tasks 1–10."

---

## Task 1: Scaffold the Project

**Files:**
- Create: `cloud-run-api/package.json`
- Create: `cloud-run-api/.env.example`
- Create: `cloud-run-api/.gitignore`
- Create: `cloud-run-api/.dockerignore`

### Step 1: Create the directory and package.json

```bash
mkdir cloud-run-api
cd cloud-run-api
```

```json
// cloud-run-api/package.json
{
  "name": "lmdr-api",
  "version": "1.0.0",
  "description": "LMDR Cloud Run Express API",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js",
    "test": "cross-env NODE_OPTIONS=--experimental-vm-modules jest --config jest.config.js",
    "test:watch": "jest --watch"
  },
  "dependencies": {
    "@google-cloud/cloud-sql-connector": "^1.3.0",
    "express": "^4.18.2",
    "firebase-admin": "^12.0.0",
    "pg": "^8.13.0",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "cross-env": "^7.0.3",
    "jest": "^29.7.0",
    "supertest": "^6.3.4"
  }
}
```

### Step 2: Create .env.example

```bash
# cloud-run-api/.env.example
NODE_ENV=development

# Postgres — used locally with Cloud SQL Auth Proxy running
PG_HOST=127.0.0.1
PG_PORT=5432
PG_DATABASE=lmdr
PG_USER=lmdr_user
PG_PASSWORD=cht7nLOGcOxpNm2ruPhO6ScqKBeqsF4o

# Used in Cloud Run instead of PG_HOST/PORT
CLOUD_SQL_INSTANCE=ldmr-velocitymatch:us-central1:lmdr-postgres

# Firebase
FIREBASE_PROJECT_ID=ldmr-velocitymatch

# API key auth
API_KEY_PEPPER=replace_with_value_from_secret_manager
```

### Step 3: Create .gitignore and .dockerignore

```
# .gitignore
node_modules/
.env
*.log
coverage/
dist/
```

```
# .dockerignore
node_modules/
.env
.git/
coverage/
*.test.js
tests/
```

### Step 4: Create jest.config.js

```js
// cloud-run-api/jest.config.js
export default {
  testEnvironment: 'node',
  transform: {},
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: ['src/**/*.js'],
  coverageThreshold: {
    global: { statements: 80, branches: 70, functions: 80, lines: 80 }
  }
};
```

### Step 5: Install dependencies

```bash
cd cloud-run-api
npm install
```

Expected: `node_modules/` created, no errors.

### Step 6: Commit

```bash
cd cloud-run-api
git add .
git commit -m "feat(cloud-run-api): scaffold Express API project"
```

---

## Task 2: DB Layer — Pool + Schema Map

**Files:**
- Create: `cloud-run-api/src/db/schema.js`
- Create: `cloud-run-api/src/db/pool.js`
- Create: `cloud-run-api/tests/db/schema.test.js`
- Create: `cloud-run-api/tests/db/pool.test.js`

### Step 1: Write the failing schema test

```js
// cloud-run-api/tests/db/schema.test.js
import { toSqlTableName, getTableName, COLLECTION_TABLE_MAP } from '../../src/db/schema.js';

describe('schema', () => {
  describe('toSqlTableName', () => {
    it('lowercases and underscores plain names', () => {
      expect(toSqlTableName('Client Carriers')).toBe('airtable_client_carriers');
    });
    it('removes parentheses', () => {
      expect(toSqlTableName('Carriers (Master)')).toBe('airtable_carriers_master');
    });
    it('handles v2_ prefix', () => {
      expect(toSqlTableName('v2_Driver Profiles')).toBe('airtable_v2_driver_profiles');
    });
    it('handles API acronym', () => {
      expect(toSqlTableName('v2_API Partners')).toBe('airtable_v2_api_partners');
    });
  });

  describe('getTableName', () => {
    it('resolves carriers collectionKey', () => {
      expect(getTableName('carriers')).toBe('airtable_carriers_master');
    });
    it('resolves driverProfiles collectionKey', () => {
      expect(getTableName('driverProfiles')).toBe('airtable_v2_driver_profiles');
    });
    it('resolves apiPartners collectionKey', () => {
      expect(getTableName('apiPartners')).toBe('airtable_v2_api_partners');
    });
    it('throws for unknown collection', () => {
      expect(() => getTableName('nonExistentCollection')).toThrow(/unknown collection/i);
    });
  });
});
```

### Step 2: Run test to confirm it fails

```bash
cd cloud-run-api
npm test -- tests/db/schema.test.js
```

Expected: FAIL — `Cannot find module '../../src/db/schema.js'`

### Step 3: Create src/db/schema.js

```js
// cloud-run-api/src/db/schema.js

/**
 * Converts an Airtable table name to its SQL table name.
 * Rule: lowercase, spaces→underscores, remove parens/special chars, prefix airtable_
 * Examples:
 *   'Carriers (Master)'   → 'airtable_carriers_master'
 *   'v2_Driver Profiles'  → 'airtable_v2_driver_profiles'
 *   'v2_API Partners'     → 'airtable_v2_api_partners'
 */
export function toSqlTableName(airtableName) {
  const slug = airtableName
    .toLowerCase()
    .replace(/[()]/g, '')        // remove parentheses
    .replace(/[^a-z0-9_]+/g, '_') // spaces and special chars → underscore
    .replace(/_+/g, '_')         // collapse multiple underscores
    .replace(/^_|_$/g, '');      // trim leading/trailing underscores
  return `airtable_${slug}`;
}

/**
 * Maps camelCase collectionKey → Airtable table name → SQL table name.
 * Source of truth: scripts/migrate-to-cloudsql.js AIRTABLE_TABLE_NAMES
 * NOTE: Add entries here as you migrate more collections.
 */
const AIRTABLE_TABLE_NAMES = {
  // Core
  carriers:              'Carriers (Master)',
  carrierAccounts:       'Carriers (Leads)',
  clientCarriers:        'Client Carriers',
  driverProfiles:        'v2_Driver Profiles',
  applications:          'v2_Applications',
  jobListings:           'v2_Job Listings',
  messages:              'v2_Messages',
  notifications:         'v2_Notifications',

  // API platform
  apiPartners:           'v2_API Partners',
  apiSubscriptions:      'v2_API Subscriptions',
  apiUsage:              'v2_API Usage',
  apiProducts:           'v2_API Products',

  // Gamification
  achievements:          'v2_Achievements',
  badges:                'v2_Badges',
  streaks:               'v2_Streaks',
  leaderboard:           'v2_Leaderboard',
  challenges:            'v2_Challenges',

  // Compliance
  complianceDocs:        'v2_Compliance Docs',
  dqFiles:               'v2_DQ Files',
  hosLogs:               'v2_HOS Logs',

  // Matching
  matchResults:          'v2_Match Results',
  savedSearches:         'v2_Saved Searches',

  // Communications
  emailCampaigns:        'v2_Email Campaigns',
  smsCampaigns:          'v2_SMS Campaigns',

  // Admin / Billing
  subscriptions:         'v2_Subscriptions',
  invoices:              'v2_Invoices',
  supportTickets:        'v2_Support Tickets',
};

export const COLLECTION_TABLE_MAP = Object.fromEntries(
  Object.entries(AIRTABLE_TABLE_NAMES).map(([key, name]) => [key, toSqlTableName(name)])
);

/**
 * Returns the SQL table name for a given collectionKey.
 * Throws if the collection is not mapped.
 */
export function getTableName(collectionKey) {
  const tableName = COLLECTION_TABLE_MAP[collectionKey];
  if (!tableName) {
    throw new Error(`Unknown collection: "${collectionKey}". Add it to src/db/schema.js`);
  }
  return tableName;
}
```

### Step 4: Run test to confirm it passes

```bash
npm test -- tests/db/schema.test.js
```

Expected: PASS (4 tests in `toSqlTableName`, 4 tests in `getTableName`)

### Step 5: Write pool.js

```js
// cloud-run-api/src/db/pool.js
import pg from 'pg';

const { Pool } = pg;

let pool;

export function getPool() {
  if (pool) return pool;

  const isCloudRun = !!process.env.CLOUD_SQL_INSTANCE;

  if (isCloudRun) {
    // In Cloud Run: use Cloud SQL Connector (Unix socket via env var)
    // @google-cloud/cloud-sql-connector auto-configures when
    // CLOUD_SQL_INSTANCE is set and the service account has cloudsql.client
    pool = new Pool({
      host: `/cloudsql/${process.env.CLOUD_SQL_INSTANCE}`,
      database: process.env.PG_DATABASE || 'lmdr',
      user: process.env.PG_USER || 'lmdr_user',
      password: process.env.PG_PASSWORD,
      max: 10,
    });
  } else {
    // Local dev: Cloud SQL Auth Proxy running on localhost:5432
    pool = new Pool({
      host: process.env.PG_HOST || '127.0.0.1',
      port: parseInt(process.env.PG_PORT || '5432'),
      database: process.env.PG_DATABASE || 'lmdr',
      user: process.env.PG_USER || 'lmdr_user',
      password: process.env.PG_PASSWORD || 'cht7nLOGcOxpNm2ruPhO6ScqKBeqsF4o',
      max: 5,
    });
  }

  pool.on('error', (err) => {
    console.error('Unexpected pg pool error:', err.message);
  });

  return pool;
}

export async function query(sql, params = []) {
  return getPool().query(sql, params);
}
```

### Step 6: Write pool smoke test

```js
// cloud-run-api/tests/db/pool.test.js
// NOTE: This test requires the Cloud SQL Auth Proxy to be running (Task 0, Step 1)
// Skip in CI unless a test Postgres container is available.

import { query } from '../../src/db/pool.js';

describe('pool (integration — requires proxy)', () => {
  it('connects and returns a result', async () => {
    const result = await query('SELECT 1 + 1 AS sum');
    expect(result.rows[0].sum).toBe(2);
  }, 10000);
});
```

### Step 7: Run pool test (proxy must be running)

```bash
npm test -- tests/db/pool.test.js
```

Expected: PASS — `connects and returns a result`

> ⚠️ If this fails with "connection refused", check that `08b_cloud_sql_proxy_adc.ps1` is still running.

### Step 8: Commit

```bash
git add src/db/ tests/db/
git commit -m "feat(db): add pg pool and collection→table schema map"
```

---

## Task 3: JSONB Query Builder

**Files:**
- Create: `cloud-run-api/src/db/query.js`
- Create: `cloud-run-api/tests/db/query.test.js`

### Step 1: Write failing tests

```js
// cloud-run-api/tests/db/query.test.js
import { buildWhereClause, buildSelectQuery, buildCountQuery } from '../../src/db/query.js';

describe('buildWhereClause', () => {
  it('handles eq operator', () => {
    const { sql, params } = buildWhereClause([
      { field: 'state', operator: 'eq', value: 'TX' }
    ]);
    expect(sql).toBe("data->>'state' = $1");
    expect(params).toEqual(['TX']);
  });

  it('handles gte operator with numeric cast', () => {
    const { sql, params } = buildWhereClause([
      { field: 'num_trucks', operator: 'gte', value: 5 }
    ]);
    expect(sql).toContain('::numeric >= $1');
    expect(params).toEqual([5]);
  });

  it('handles multiple filters with AND', () => {
    const { sql, params } = buildWhereClause([
      { field: 'state', operator: 'eq', value: 'TX' },
      { field: 'is_active', operator: 'eq', value: 'true' }
    ]);
    expect(sql).toContain(' AND ');
    expect(params).toHaveLength(2);
  });

  it('handles hasSome with array', () => {
    const { sql, params } = buildWhereClause([
      { field: 'freight_type', operator: 'hasSome', value: ['Dry Van', 'Reefer'] }
    ]);
    expect(sql).toContain("data->'freight_type' ?| $1");
    expect(params[0]).toEqual(['Dry Van', 'Reefer']);
  });

  it('handles contains with ILIKE', () => {
    const { sql, params } = buildWhereClause([
      { field: 'company_name', operator: 'contains', value: 'Transport' }
    ]);
    expect(sql).toContain('ILIKE');
    expect(params[0]).toBe('%Transport%');
  });

  it('returns empty string for no filters', () => {
    const { sql, params } = buildWhereClause([]);
    expect(sql).toBe('');
    expect(params).toEqual([]);
  });
});

describe('buildSelectQuery', () => {
  it('builds a query with limit and offset', () => {
    const { sql, params } = buildSelectQuery('airtable_carriers_master', {
      filters: [{ field: 'state', operator: 'eq', value: 'TX' }],
      limit: 25,
      skip: 0,
      sort: [{ field: 'combined_score', direction: 'desc' }]
    });
    expect(sql).toContain('SELECT');
    expect(sql).toContain('airtable_carriers_master');
    expect(sql).toContain('ORDER BY');
    expect(sql).toContain('LIMIT');
    expect(params).toContain('TX');
  });
});

describe('buildCountQuery', () => {
  it('builds a COUNT query', () => {
    const { sql, params } = buildCountQuery('airtable_carriers_master', {
      filters: [{ field: 'state', operator: 'eq', value: 'TX' }]
    });
    expect(sql).toContain('COUNT(*)');
    expect(sql).toContain('airtable_carriers_master');
    expect(params).toContain('TX');
  });
});
```

### Step 2: Run tests to confirm they fail

```bash
npm test -- tests/db/query.test.js
```

Expected: FAIL — `Cannot find module '../../src/db/query.js'`

### Step 3: Implement query.js

```js
// cloud-run-api/src/db/query.js

const NUMERIC_OPS = new Set(['gt', 'gte', 'lt', 'lte']);

/**
 * Builds a parameterized WHERE clause from the dataAccess.jsw filter DSL.
 * Returns { sql: string, params: any[] }
 */
export function buildWhereClause(filters = []) {
  if (!filters || filters.length === 0) return { sql: '', params: [] };

  const parts = [];
  const params = [];
  let paramIndex = 1;

  for (const { field, operator, value } of filters) {
    const fieldPath = `data->>'${field}'`;
    const arrFieldPath = `data->'${field}'`;

    switch (operator) {
      case 'eq':
        parts.push(`${fieldPath} = $${paramIndex}`);
        params.push(String(value));
        paramIndex++;
        break;

      case 'ne':
        parts.push(`${fieldPath} != $${paramIndex}`);
        params.push(String(value));
        paramIndex++;
        break;

      case 'gt':
        parts.push(`(${fieldPath})::numeric > $${paramIndex}`);
        params.push(value);
        paramIndex++;
        break;

      case 'gte':
        parts.push(`(${fieldPath})::numeric >= $${paramIndex}`);
        params.push(value);
        paramIndex++;
        break;

      case 'lt':
        parts.push(`(${fieldPath})::numeric < $${paramIndex}`);
        params.push(value);
        paramIndex++;
        break;

      case 'lte':
        parts.push(`(${fieldPath})::numeric <= $${paramIndex}`);
        params.push(value);
        paramIndex++;
        break;

      case 'contains':
        parts.push(`${fieldPath} ILIKE $${paramIndex}`);
        params.push(`%${value}%`);
        paramIndex++;
        break;

      case 'startsWith':
        parts.push(`${fieldPath} ILIKE $${paramIndex}`);
        params.push(`${value}%`);
        paramIndex++;
        break;

      case 'hasSome':
        parts.push(`${arrFieldPath} ?| $${paramIndex}`);
        params.push(value);
        paramIndex++;
        break;

      case 'hasAll':
        parts.push(`${arrFieldPath} ?& $${paramIndex}`);
        params.push(value);
        paramIndex++;
        break;

      case 'isEmpty':
        parts.push(`(${fieldPath} IS NULL OR ${fieldPath} = '')`);
        break;

      case 'isNotEmpty':
        parts.push(`(${fieldPath} IS NOT NULL AND ${fieldPath} != '')`);
        break;

      default:
        throw new Error(`Unsupported filter operator: "${operator}"`);
    }
  }

  return { sql: parts.join(' AND '), params };
}

/**
 * Builds a full SELECT query for a JSONB table.
 */
export function buildSelectQuery(tableName, { filters = [], limit = 50, skip = 0, sort = [] } = {}) {
  const { sql: whereSql, params } = buildWhereClause(filters);
  const safeLimit = Math.min(parseInt(limit) || 50, 500);
  const safeSkip = parseInt(skip) || 0;

  let paramIndex = params.length + 1;
  let sql = `SELECT _id, airtable_id, _created_at, _updated_at, data FROM ${tableName}`;

  if (whereSql) sql += ` WHERE ${whereSql}`;

  if (sort && sort.length > 0) {
    const orderParts = sort.map(({ field, direction }) => {
      const dir = direction?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
      return `data->>'${field}' ${dir}`;
    });
    sql += ` ORDER BY ${orderParts.join(', ')}`;
  } else {
    sql += ' ORDER BY _created_at DESC';
  }

  sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(safeLimit, safeSkip);

  return { sql, params };
}

/**
 * Builds a COUNT(*) query for a JSONB table.
 */
export function buildCountQuery(tableName, { filters = [] } = {}) {
  const { sql: whereSql, params } = buildWhereClause(filters);
  let sql = `SELECT COUNT(*) AS count FROM ${tableName}`;
  if (whereSql) sql += ` WHERE ${whereSql}`;
  return { sql, params };
}
```

### Step 4: Run tests to confirm they pass

```bash
npm test -- tests/db/query.test.js
```

Expected: PASS (all 9 tests)

### Step 5: Commit

```bash
git add src/db/query.js tests/db/query.test.js
git commit -m "feat(db): JSONB filter DSL to parameterized SQL query builder"
```

---

## Task 4: Auth Middleware

**Files:**
- Create: `cloud-run-api/src/middleware/auth.js`
- Create: `cloud-run-api/tests/middleware/auth.test.js`

### Step 1: Write the failing tests

```js
// cloud-run-api/tests/middleware/auth.test.js
import { parseBearerToken, isApiKey } from '../../src/middleware/auth.js';

describe('parseBearerToken', () => {
  it('extracts token from valid Bearer header', () => {
    expect(parseBearerToken('Bearer abc123')).toBe('abc123');
  });
  it('returns null for missing header', () => {
    expect(parseBearerToken(undefined)).toBeNull();
  });
  it('returns null for non-Bearer scheme', () => {
    expect(parseBearerToken('Basic abc123')).toBeNull();
  });
});

describe('isApiKey', () => {
  it('identifies lmdr_live_ prefix', () => {
    expect(isApiKey('lmdr_live_abc123')).toBe(true);
  });
  it('identifies lmdr_test_ prefix', () => {
    expect(isApiKey('lmdr_test_abc123')).toBe(true);
  });
  it('returns false for Firebase tokens', () => {
    expect(isApiKey('eyJhbGciOiJSUzI1NiJ9...')).toBe(false);
  });
});
```

### Step 2: Run test to confirm it fails

```bash
npm test -- tests/middleware/auth.test.js
```

Expected: FAIL — `Cannot find module`

### Step 3: Implement auth.js

```js
// cloud-run-api/src/middleware/auth.js
import crypto from 'crypto';
import admin from 'firebase-admin';
import { query } from '../db/pool.js';

// Initialize Firebase Admin once
let firebaseInitialized = false;
function ensureFirebase() {
  if (firebaseInitialized) return;
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'ldmr-velocitymatch',
  });
  firebaseInitialized = true;
}

export function parseBearerToken(authHeader) {
  if (!authHeader) return null;
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  return parts[1];
}

export function isApiKey(token) {
  return token?.startsWith('lmdr_live_') || token?.startsWith('lmdr_test_');
}

async function hashApiKey(apiKey) {
  const pepper = process.env.API_KEY_PEPPER || '';
  return crypto.createHash('sha256').update(apiKey + pepper).digest('hex');
}

async function resolveApiKey(token) {
  const hash = await hashApiKey(token);
  const result = await query(
    `SELECT _id, data FROM airtable_v2_api_partners WHERE data->>'api_key_hash' = $1 LIMIT 1`,
    [hash]
  );
  if (result.rows.length === 0) return null;
  const partner = result.rows[0];
  return {
    type: 'apiKey',
    partnerId: partner._id,
    tier: partner.data.tier || 'starter',
    partnerData: partner.data,
  };
}

async function resolveFirebaseToken(token) {
  ensureFirebase();
  const decoded = await admin.auth().verifyIdToken(token);
  return {
    type: 'firebase',
    uid: decoded.uid,
    email: decoded.email,
    role: decoded.role || 'user',
    carrierId: decoded.carrierId,
    driverId: decoded.driverId,
  };
}

/**
 * Express middleware. Attaches req.auth on success, returns 401 on failure.
 * Set options.optional = true to allow unauthenticated requests through.
 */
export function authenticate({ optional = false } = {}) {
  return async (req, res, next) => {
    const token = parseBearerToken(req.headers.authorization);

    if (!token) {
      if (optional) return next();
      return res.status(401).json({ error: 'Authorization header required' });
    }

    try {
      req.auth = isApiKey(token)
        ? await resolveApiKey(token)
        : await resolveFirebaseToken(token);

      if (!req.auth) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      next();
    } catch (err) {
      return res.status(401).json({ error: 'Authentication failed', detail: err.message });
    }
  };
}

/** Guard that requires admin role */
export function requireAdmin() {
  return (req, res, next) => {
    if (req.auth?.role !== 'admin' && req.auth?.type !== 'apiKey') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  };
}
```

### Step 4: Run tests to confirm they pass

```bash
npm test -- tests/middleware/auth.test.js
```

Expected: PASS (5 tests)

### Step 5: Commit

```bash
git add src/middleware/auth.js tests/middleware/auth.test.js
git commit -m "feat(auth): Firebase ID token + LMDR API key middleware"
```

---

## Task 5: Rate Limit Middleware

**Files:**
- Create: `cloud-run-api/src/middleware/rateLimiter.js`
- Create: `cloud-run-api/tests/middleware/rateLimiter.test.js`

### Step 1: Write the failing tests

```js
// cloud-run-api/tests/middleware/rateLimiter.test.js
import { TIER_LIMITS, checkMinuteLimit } from '../../src/middleware/rateLimiter.js';

describe('TIER_LIMITS', () => {
  it('has correct starter limits', () => {
    expect(TIER_LIMITS.starter.perMinute).toBe(10);
    expect(TIER_LIMITS.starter.perMonth).toBe(5000);
  });
  it('has correct growth limits', () => {
    expect(TIER_LIMITS.growth.perMinute).toBe(60);
    expect(TIER_LIMITS.growth.perMonth).toBe(50000);
  });
  it('enterprise has unlimited monthly', () => {
    expect(TIER_LIMITS.enterprise.perMonth).toBe(Infinity);
  });
});

describe('checkMinuteLimit', () => {
  it('allows requests under limit', () => {
    const result = checkMinuteLimit('partner-1', 'starter', 5);
    expect(result.allowed).toBe(true);
  });
  it('blocks when over limit', () => {
    const result = checkMinuteLimit('partner-2', 'starter', 11);
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });
});
```

### Step 2: Run tests to confirm they fail

```bash
npm test -- tests/middleware/rateLimiter.test.js
```

Expected: FAIL — `Cannot find module`

### Step 3: Implement rateLimiter.js

```js
// cloud-run-api/src/middleware/rateLimiter.js

export const TIER_LIMITS = {
  starter:    { perMinute: 10,  perMonth: 5000 },
  growth:     { perMinute: 60,  perMonth: 50000 },
  enterprise: { perMinute: 300, perMonth: Infinity },
  custom:     { perMinute: 600, perMonth: Infinity },
};

// In-memory minute buckets: Map<partnerId, { count, windowStart }>
const minuteBuckets = new Map();

export function checkMinuteLimit(partnerId, tier, currentCount) {
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.starter;
  const allowed = currentCount < limits.perMinute;
  return {
    allowed,
    remaining: Math.max(0, limits.perMinute - currentCount),
    limit: limits.perMinute,
    retryAfter: allowed ? 0 : 60,
  };
}

function getMinuteBucket(partnerId) {
  const now = Date.now();
  const windowStart = Math.floor(now / 60000) * 60000;
  const existing = minuteBuckets.get(partnerId);

  if (!existing || existing.windowStart !== windowStart) {
    const fresh = { count: 0, windowStart };
    minuteBuckets.set(partnerId, fresh);
    return fresh;
  }
  return existing;
}

/**
 * Express middleware. Applies per-minute rate limiting to API key requests.
 * Firebase Auth requests (internal) are not rate-limited at this layer.
 */
export function rateLimiter() {
  return (req, res, next) => {
    if (!req.auth || req.auth.type !== 'apiKey') return next();

    const { partnerId, tier } = req.auth;
    const bucket = getMinuteBucket(partnerId);
    bucket.count++;

    const result = checkMinuteLimit(partnerId, tier, bucket.count);
    const limits = TIER_LIMITS[tier] || TIER_LIMITS.starter;

    res.set({
      'X-RateLimit-Limit': String(limits.perMinute),
      'X-RateLimit-Remaining': String(result.remaining),
      'X-RateLimit-Reset': String(Math.floor(bucket.windowStart / 1000) + 60),
    });

    if (!result.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: result.retryAfter,
      });
    }

    next();
  };
}
```

### Step 4: Run tests to confirm they pass

```bash
npm test -- tests/middleware/rateLimiter.test.js
```

Expected: PASS (5 tests)

### Step 5: Commit

```bash
git add src/middleware/rateLimiter.js tests/middleware/rateLimiter.test.js
git commit -m "feat(ratelimit): tier-based in-memory rate limiter"
```

---

## Task 6: Express App + Health Endpoint

**Files:**
- Create: `cloud-run-api/src/app.js`
- Create: `cloud-run-api/server.js`
- Create: `cloud-run-api/src/routes/health.js`
- Create: `cloud-run-api/tests/routes/health.test.js`

### Step 1: Write the failing health test

```js
// cloud-run-api/tests/routes/health.test.js
import request from 'supertest';
import { createApp } from '../../src/app.js';

describe('GET /health', () => {
  let app;
  beforeEach(() => { app = createApp(); });

  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.version).toBeDefined();
    expect(res.body.timestamp).toBeDefined();
  });

  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/unknown');
    expect(res.status).toBe(404);
  });
});
```

### Step 2: Run test to confirm it fails

```bash
npm test -- tests/routes/health.test.js
```

Expected: FAIL — `Cannot find module '../../src/app.js'`

### Step 3: Create routes/health.js

```js
// cloud-run-api/src/routes/health.js
import { Router } from 'express';
import { query } from '../db/pool.js';

const router = Router();

router.get('/', async (req, res) => {
  let dbStatus = 'ok';
  try {
    await query('SELECT 1');
  } catch {
    dbStatus = 'error';
  }

  res.json({
    status: 'ok',
    version: process.env.npm_package_version || '1.0.0',
    timestamp: new Date().toISOString(),
    db: dbStatus,
  });
});

export default router;
```

### Step 4: Create src/app.js

```js
// cloud-run-api/src/app.js
import express from 'express';
import healthRouter from './routes/health.js';
import collectionRouter from './routes/collection.js';
import { authenticate } from './middleware/auth.js';
import { rateLimiter } from './middleware/rateLimiter.js';

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // Public routes
  app.use('/health', healthRouter);

  // Authenticated API routes
  app.use('/v1', authenticate(), rateLimiter(), collectionRouter);

  // 404 catch-all
  app.use((req, res) => res.status(404).json({ error: 'Not found' }));

  // Error handler
  app.use((err, req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  });

  return app;
}
```

### Step 5: Create server.js

```js
// cloud-run-api/server.js
import 'dotenv/config';
import { createApp } from './src/app.js';

const PORT = process.env.PORT || 8080;
const app = createApp();

app.listen(PORT, () => {
  console.log(`LMDR API listening on :${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
```

Note: `collection.js` is a stub for now (Task 7). Create an empty stub so `app.js` can import it:

```js
// cloud-run-api/src/routes/collection.js  (STUB — filled in Task 7)
import { Router } from 'express';
const router = Router();
export default router;
```

### Step 6: Run health tests to confirm they pass

```bash
npm test -- tests/routes/health.test.js
```

Expected: PASS (2 tests)

### Step 7: Smoke test the server manually

```bash
# Start the server (proxy must be running from Task 0 Step 1)
cd cloud-run-api
node server.js &

# Hit the health endpoint
curl http://localhost:8080/health
```

Expected:
```json
{"status":"ok","version":"1.0.0","timestamp":"...","db":"ok"}
```

Stop the server: `kill %1` (or Ctrl+C)

### Step 8: Commit

```bash
git add src/app.js server.js src/routes/health.js src/routes/collection.js tests/routes/health.test.js
git commit -m "feat(app): Express app factory, health endpoint, server entry point"
```

---

## Task 7: Generic Collection Router

**Files:**
- Modify: `cloud-run-api/src/routes/collection.js` (replace stub)
- Create: `cloud-run-api/tests/routes/collection.test.js`

This is the power move — **one router handles all 120+ collections** via JSONB.

### Step 1: Write the failing integration tests

```js
// cloud-run-api/tests/routes/collection.test.js
// NOTE: Requires Cloud SQL Auth Proxy running and lmdr DB populated.

import request from 'supertest';
import { createApp } from '../../src/app.js';

// Mock auth middleware so tests don't need real Firebase tokens
jest.mock('../../src/middleware/auth.js', () => ({
  authenticate: () => (req, res, next) => {
    req.auth = { type: 'firebase', uid: 'test-user', role: 'admin' };
    next();
  },
  requireAdmin: () => (req, res, next) => next(),
}));
jest.mock('../../src/middleware/rateLimiter.js', () => ({
  rateLimiter: () => (req, res, next) => next(),
}));

describe('Collection router', () => {
  let app;
  beforeEach(() => { app = createApp(); });

  describe('POST /v1/:collection/query', () => {
    it('returns records array for valid collection', async () => {
      const res = await request(app)
        .post('/v1/carriers/query')
        .send({ filters: [], limit: 5 });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.records)).toBe(true);
      expect(typeof res.body.total).toBe('number');
    });

    it('returns 400 for unknown collection', async () => {
      const res = await request(app)
        .post('/v1/unknownCollection/query')
        .send({ filters: [] });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /v1/:collection/:id', () => {
    it('returns 404 for non-existent id', async () => {
      const res = await request(app).get('/v1/carriers/does-not-exist-id');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /v1/:collection/count', () => {
    it('returns a count for carriers', async () => {
      const res = await request(app).get('/v1/carriers/count');
      expect(res.status).toBe(200);
      expect(typeof res.body.count).toBe('number');
    });
  });
});
```

### Step 2: Run tests to confirm they fail

```bash
npm test -- tests/routes/collection.test.js
```

Expected: FAIL — tests run but hit stub (empty router)

### Step 3: Implement collection.js

```js
// cloud-run-api/src/routes/collection.js
import { Router } from 'express';
import { getTableName } from '../db/schema.js';
import { buildSelectQuery, buildCountQuery, buildWhereClause } from '../db/query.js';
import { query } from '../db/pool.js';
import { v5 as uuidv5 } from 'uuid';

const router = Router();
const UUID_NAMESPACE = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

function resolveTable(collectionKey, res) {
  try {
    return getTableName(collectionKey);
  } catch {
    res.status(400).json({ error: `Unknown collection: "${collectionKey}"` });
    return null;
  }
}

function formatRecord(row) {
  return { _id: row._id, airtableId: row.airtable_id, ...row.data, _createdDate: row._created_at, _updatedDate: row._updated_at };
}

// POST /v1/:collection/query
router.post('/:collection/query', async (req, res, next) => {
  try {
    const table = resolveTable(req.params.collection, res);
    if (!table) return;

    const { filters = [], limit = 50, skip = 0, sort = [] } = req.body;
    const { sql, params } = buildSelectQuery(table, { filters, limit, skip, sort });
    const { sql: countSql, params: countParams } = buildCountQuery(table, { filters });

    const [dataResult, countResult] = await Promise.all([
      query(sql, params),
      query(countSql, countParams),
    ]);

    res.json({
      records: dataResult.rows.map(formatRecord),
      total: parseInt(countResult.rows[0].count),
      limit: Math.min(parseInt(limit) || 50, 500),
      skip: parseInt(skip) || 0,
    });
  } catch (err) { next(err); }
});

// GET /v1/:collection/count
router.get('/:collection/count', async (req, res, next) => {
  try {
    const table = resolveTable(req.params.collection, res);
    if (!table) return;

    const filters = req.query.filters ? JSON.parse(req.query.filters) : [];
    const { sql, params } = buildCountQuery(table, { filters });
    const result = await query(sql, params);
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) { next(err); }
});

// GET /v1/:collection/field/:field/:value  (findByField shorthand)
router.get('/:collection/field/:field/:value', async (req, res, next) => {
  try {
    const table = resolveTable(req.params.collection, res);
    if (!table) return;

    const filters = [{ field: req.params.field, operator: 'eq', value: req.params.value }];
    const { sql, params } = buildSelectQuery(table, { filters, limit: 100 });
    const result = await query(sql, params);
    res.json({ records: result.rows.map(formatRecord) });
  } catch (err) { next(err); }
});

// GET /v1/:collection/:id
router.get('/:collection/:id', async (req, res, next) => {
  try {
    const table = resolveTable(req.params.collection, res);
    if (!table) return;

    const result = await query(
      `SELECT _id, airtable_id, _created_at, _updated_at, data FROM ${table} WHERE _id = $1 OR airtable_id = $1 LIMIT 1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json({ record: formatRecord(result.rows[0]) });
  } catch (err) { next(err); }
});

// POST /v1/:collection  (insert)
router.post('/:collection', async (req, res, next) => {
  try {
    const table = resolveTable(req.params.collection, res);
    if (!table) return;

    const { _id, ...fields } = req.body;
    const id = _id || uuidv5(Date.now().toString() + Math.random(), UUID_NAMESPACE);
    const now = new Date().toISOString();

    const result = await query(
      `INSERT INTO ${table} (_id, _created_at, _updated_at, data)
       VALUES ($1, $2, $2, $3)
       RETURNING _id, airtable_id, _created_at, _updated_at, data`,
      [id, now, JSON.stringify(fields)]
    );
    res.status(201).json({ record: formatRecord(result.rows[0]) });
  } catch (err) { next(err); }
});

// PUT /v1/:collection/:id  (update)
router.put('/:collection/:id', async (req, res, next) => {
  try {
    const table = resolveTable(req.params.collection, res);
    if (!table) return;

    const { _id, _createdDate, _updatedDate, ...fields } = req.body;
    const result = await query(
      `UPDATE ${table}
       SET data = data || $1::jsonb, _updated_at = NOW()
       WHERE _id = $2
       RETURNING _id, airtable_id, _created_at, _updated_at, data`,
      [JSON.stringify(fields), req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json({ record: formatRecord(result.rows[0]) });
  } catch (err) { next(err); }
});

// POST /v1/:collection/upsert
router.post('/:collection/upsert', async (req, res, next) => {
  try {
    const table = resolveTable(req.params.collection, res);
    if (!table) return;

    const { _id, ...fields } = req.body;
    if (!_id) return res.status(400).json({ error: '_id required for upsert' });

    const result = await query(
      `INSERT INTO ${table} (_id, _created_at, _updated_at, data)
       VALUES ($1, NOW(), NOW(), $2)
       ON CONFLICT (_id) DO UPDATE
         SET data = EXCLUDED.data, _updated_at = NOW()
       RETURNING _id, airtable_id, _created_at, _updated_at, data,
                 (xmax = 0) AS created`,
      [_id, JSON.stringify(fields)]
    );
    const row = result.rows[0];
    res.json({ record: formatRecord(row), created: row.created });
  } catch (err) { next(err); }
});

// DELETE /v1/:collection/:id
router.delete('/:collection/:id', async (req, res, next) => {
  try {
    const table = resolveTable(req.params.collection, res);
    if (!table) return;

    const result = await query(
      `DELETE FROM ${table} WHERE _id = $1 RETURNING _id`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json({ deleted: true, _id: result.rows[0]._id });
  } catch (err) { next(err); }
});

export default router;
```

### Step 4: Run tests to confirm they pass

```bash
npm test -- tests/routes/collection.test.js
```

Expected: PASS (all 4 tests)

### Step 5: Run all tests together

```bash
npm test
```

Expected: All tests pass, no failures.

### Step 6: Commit

```bash
git add src/routes/collection.js tests/routes/collection.test.js
git commit -m "feat(routes): generic JSONB collection router — all 120+ collections via :collection param"
```

---

## Task 8: Dockerfile

**Files:**
- Create: `cloud-run-api/Dockerfile`

### Step 1: Write the Dockerfile

```dockerfile
# cloud-run-api/Dockerfile
FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src/ ./src/
COPY server.js ./

ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "server.js"]
```

### Step 2: Build and test the image locally

```bash
cd cloud-run-api
docker build -t lmdr-api:local .
docker run --rm -p 8080:8080 \
  -e PG_HOST=host.docker.internal \
  -e PG_DATABASE=lmdr \
  -e PG_USER=lmdr_user \
  -e PG_PASSWORD=cht7nLOGcOxpNm2ruPhO6ScqKBeqsF4o \
  -e FIREBASE_PROJECT_ID=ldmr-velocitymatch \
  -e NODE_ENV=development \
  lmdr-api:local &

curl http://localhost:8080/health
```

Expected: `{"status":"ok","db":"ok",...}`

Stop the container: `docker stop $(docker ps -q --filter ancestor=lmdr-api:local)`

### Step 3: Commit

```bash
git add Dockerfile .dockerignore
git commit -m "feat(docker): production Dockerfile for Cloud Run"
```

---

## Task 9: Deploy to Cloud Run

> ⚠️ **MANUAL STEP REQUIRED before this task:**
> Confirm Task 0 is complete — service account created, secrets stored, Docker configured.

### Step 1: Push image to Google Artifact Registry

```bash
# First, ensure the Artifact Registry repo exists (run once)
gcloud artifacts repositories create lmdr-api \
  --repository-format=docker \
  --location=us-central1 \
  --project=ldmr-velocitymatch

# Build and push
cd cloud-run-api
docker build -t us-central1-docker.pkg.dev/ldmr-velocitymatch/lmdr-api/lmdr-api:latest .
docker push us-central1-docker.pkg.dev/ldmr-velocitymatch/lmdr-api/lmdr-api:latest
```

### Step 2: Deploy to Cloud Run

```bash
gcloud run deploy lmdr-api \
  --image=us-central1-docker.pkg.dev/ldmr-velocitymatch/lmdr-api/lmdr-api:latest \
  --region=us-central1 \
  --project=ldmr-velocitymatch \
  --service-account=lmdr-api-sa@ldmr-velocitymatch.iam.gserviceaccount.com \
  --add-cloudsql-instances=ldmr-velocitymatch:us-central1:lmdr-postgres \
  --set-secrets="PG_PASSWORD=lmdr-pg-password:latest,API_KEY_PEPPER=lmdr-api-key-pepper:latest" \
  --set-env-vars="CLOUD_SQL_INSTANCE=ldmr-velocitymatch:us-central1:lmdr-postgres,PG_DATABASE=lmdr,PG_USER=lmdr_user,FIREBASE_PROJECT_ID=ldmr-velocitymatch,NODE_ENV=production" \
  --port=8080 \
  --min-instances=1 \
  --max-instances=10 \
  --memory=512Mi \
  --allow-unauthenticated
```

> ⚠️ `--allow-unauthenticated` means **Cloud Run** doesn't require a Google identity — your app-level auth middleware handles authentication. This is correct.

### Step 3: Test the live deployment

```bash
# Get the Cloud Run URL
SERVICE_URL=$(gcloud run services describe lmdr-api \
  --region=us-central1 \
  --project=ldmr-velocitymatch \
  --format='value(status.url)')

echo "API URL: $SERVICE_URL"

# Hit health
curl "$SERVICE_URL/health"
```

Expected: `{"status":"ok","db":"ok","version":"1.0.0",...}`

### Step 4: Run a live query test

```bash
# Try querying carriers (will get 401 — expected, auth middleware working)
curl -X POST "$SERVICE_URL/v1/carriers/query" \
  -H "Content-Type: application/json" \
  -d '{"filters":[],"limit":3}'
```

Expected: `{"error":"Authorization header required"}` — correct behavior.

### Step 5: Commit the deployment config

```bash
# Save the service URL for the team
echo "SERVICE_URL=$SERVICE_URL" >> .env.cloud-run
git add .env.cloud-run
git commit -m "chore: record Cloud Run service URL"
```

---

## Task 10: Wire Frontend to the API

> ⚠️ **MANUAL SETUP REQUIRED — Levy decides how/when to cut over.**
> This task documents the connection point but the actual cutover (changing Wix frontend to call the Cloud Run URL instead of `.jsw` imports) must be tested by Levy in a staging environment first.

### What changes in the Wix/Firebase frontend

Every place the frontend currently calls a `.jsw` function like:

```js
// BEFORE — Wix .jsw import
import { queryRecords } from 'backend/dataAccess.jsw';
const results = await queryRecords('carriers', { filters: [...], limit: 25 });
```

It will change to an HTTP call:

```js
// AFTER — Cloud Run API call
const API_URL = 'https://lmdr-api-<hash>-uc.a.run.app';

async function queryRecords(collection, params) {
  const token = await firebase.auth().currentUser.getIdToken();
  const res = await fetch(`${API_URL}/v1/${collection}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(params),
  });
  return res.json();
}
```

### Recommended cutover sequence (Levy does this manually)

1. **Step 1:** Deploy Cloud Run API (Task 9 complete) ✅
2. **Step 2:** Test a single low-risk collection (e.g., `GET /v1/carriers/count`) from Wix Dev Mode
3. **Step 3:** Verify the JSONB data matches what was in Airtable for 5–10 sample records
4. **Step 4:** Switch one non-critical service file (e.g., `publicStatsService.jsw`) to use HTTP calls
5. **Step 5:** Monitor error rates in Cloud Run logs for 24 hours
6. **Step 6:** Progressively switch remaining `.jsw` files over 1–2 sprints
7. **Step 7:** Once all reads are from Cloud SQL, disable Airtable API key (saves cost)

### How to verify data integrity before cutover

```bash
# Run this while proxy is open — compare Cloud SQL record count vs Airtable
node scripts/migrate-to-cloudsql.js --verify
```

---

## Summary of Manual Setup Items

| When | Item | How |
|------|------|-----|
| Before Task 1 | Cloud SQL Auth Proxy running | `.\08b_cloud_sql_proxy_adc.ps1` |
| Before Task 9 | Secret `lmdr-pg-password` in Secret Manager | Task 0, Step 3 |
| Before Task 9 | Secret `lmdr-api-key-pepper` in Secret Manager | Task 0, Step 4 |
| Before Task 9 | Service account `lmdr-api-sa` created | Task 0, Step 5 |
| Before Task 9 | Service account granted `roles/cloudsql.client` | Task 0, Step 6 |
| Before Task 9 | Service account granted `roles/secretmanager.secretAccessor` | Task 0, Step 7 |
| Before Task 9 | Docker configured for Artifact Registry | Task 0, Step 8 |
| Task 10 | Frontend cutover decision + staging test | Levy's call |
| Task 10 | Disable Airtable API key after full cutover | Airtable console |

---

*End of Plan — After saving, use `superpowers:executing-plans` in a new session to implement task by task.*
