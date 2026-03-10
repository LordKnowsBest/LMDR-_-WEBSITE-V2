# Data Routing Guide (Post-GCP Migration)

> Auto-injected when editing `src/backend/*.jsw` files.
>
> **IMPORTANT (2026-03-10):** Airtable has been fully disconnected. `airtableClient.jsw` has been DELETED.
> `AIRTABLE_PAT` secret has been removed from Wix. ALL data now routes through Cloud Run (Cloud SQL)
> except for 4 frozen Wix system collections.

## Current Data Architecture

```
Wix .jsw Backend Service
    |
    v
dataAccess.jsw
    |
    ├── Cloud Run path (ALL non-Wix collections)
    |   └── cloudRunClient.jsw
    |       └── HTTP → lmdr-api Cloud Run service
    |           └── Cloud SQL (PostgreSQL 15) — lmdr-postgres
    |
    └── Wix path (4 frozen collections ONLY)
        └── wixData.query() / wixData.insert() / etc.
```

**Cloud Run API URL:** `https://lmdr-api-140035137711.us-central1.run.app`
**Auth:** `LMDR_INTERNAL_KEY` bearer token (Wix Secret)
**Cloud SQL Instance:** `ldmr-velocitymatch:us-central1:lmdr-postgres`
**Database:** `lmdr`, User: `lmdr_user`

## Unified Data Access Layer (Required)

Every backend service that accesses data MUST use the centralized **`dataAccess.jsw`** layer. This layer automatically routes to Cloud Run (Cloud SQL) or Wix based on configuration.

**Import:** `import * as dataAccess from 'backend/dataAccess';`

**Pattern:**
```javascript
// 1. Define collection keys (camelCase from configData.js)
const COLLECTIONS = {
    carriers: 'carriers',
    drivers: 'driverProfiles',
    // ... add all collections this service uses
};

// 2. Main operations
// Query
const result = await dataAccess.queryRecords(COLLECTIONS.carriers, {
    filters: { status: 'active' },
    limit: 50
});

// Get Single
const driver = await dataAccess.getRecord(COLLECTIONS.drivers, driverId);

// Insert
const newRecord = await dataAccess.insertRecord(COLLECTIONS.drivers, {
    first_name: 'John',
    last_name: 'Doe'
});

// Update
await dataAccess.updateRecord(COLLECTIONS.drivers, {
    ...driver,
    _id: driverId,
    status: 'verified'
});
```

## Before/After Example

```javascript
// WRONG - Bypasses data routing
const result = await wixData.query('Carriers').eq('status', 'active').find();

// ALSO WRONG - airtableClient.jsw no longer exists
import { queryRecords } from 'backend/airtableClient';

// CORRECT - Uses unified data access layer
const result = await dataAccess.queryRecords(COLLECTIONS.carriers, {
    filters: { status: 'active' }
});
```

## Field Names

**Backend Rule:** Always use `snake_case` for field names in your data objects. The Cloud SQL JSONB tables store field names as they were in Airtable (Title Case in the `data` column). The Cloud Run API handles mapping transparently.

## Frozen Wix Collections (ONLY THESE use wixData directly)

| Collection | Config Key | Reason |
|------------|-----------|--------|
| `AdminUsers` | `adminUsers` | Auth/permissions — Wix system dependency |
| `MemberNotifications` | `memberNotifications` | Wix member system integration |
| `Members/Badges` | `memberBadges` | Wix system collection |
| `Members/PrivateMembersData` | `memberPrivateData` | Wix system collection |

**Everything else routes to Cloud Run (Cloud SQL).**

## Adding New Collections

New collections are created as Cloud SQL tables (no longer in Airtable):

**Step 1:** Add the table to Cloud SQL via the Cloud Run API migration scripts or direct SQL

**Step 2:** Add to `configData.js`:
```javascript
// The collection key must exist so getDataSource() returns 'cloudrun'
// Most collections automatically route to cloudrun since usesAirtable() returns false
```

**Step 3:** Use `dataAccess` in your service (same pattern as above)

## Checklist: Modifying Backend Services

1. **Check for direct `wixData.*` calls** — Replace with `dataAccess.*` (unless it's one of the 4 frozen Wix collections)
2. **Check for `airtableClient` imports** — This file no longer exists; replace with `dataAccess.*`
3. **Verify helper definitions** — Ensure you are NOT defining local `queryData`/`insertData` helpers
4. **Check COLLECTION_KEYS** — Ensure all collections used by the service are mapped in `configData.js`
5. **Type Safety** — Convert numeric strings from forms to `Number` before querying

## Routing Audit Checklist

### Step 1: Backend Service File (*.jsw)
```
[] Imports `* as dataAccess` from 'backend/dataAccess'
[] Uses `COLLECTION_KEYS` for all data operations
[] All field names in records use snake_case (backend standard)
[] Filter objects use standard dataAccess operators (eq, gte, etc.)
[] NO imports from 'backend/airtableClient' (file deleted)
```

### Step 2: configData.js - Data Source Routing
```
[] Collection is listed in configData.js
[] getDataSource(collectionKey) returns 'cloudrun' for non-Wix collections
[] usesAirtable() returns false for ALL collections
```

## Allowed Direct Wix Calls

The ONLY acceptable direct `wixData.*` calls are:
1. **Inside the `dataAccess.jsw` layer itself** (the Wix implementation path for frozen collections)
2. **For `AdminUsers` collection** (auth must stay in Wix)
3. **For `MemberNotifications` collection** (Wix member integration)
4. **For `Members/Badges` or `Members/PrivateMembersData`** (system collections)

---

## Historical Context (Pre-Migration)

> The following is kept for historical reference only. This was the architecture before March 2026.

Previously, data routed through `airtableClient.jsw` to Airtable's REST API. Collections had a `DATA_SOURCE` mapping
of `'airtable'` or `'wix'` in `configData.js`. The `AIRTABLE_TABLE_NAMES` and `FIELD_MAPPINGS` objects handled
snake_case to Title Case conversion. This entire path has been removed:
- `airtableClient.jsw` — DELETED
- `AIRTABLE_PAT` secret — DELETED from Wix
- `usesAirtable()` — stubbed to return `false`
- `DATA_SOURCE` entries — no longer reference `'airtable'`
