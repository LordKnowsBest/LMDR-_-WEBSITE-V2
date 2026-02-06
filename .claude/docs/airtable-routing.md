# Airtable Routing: Full Implementation Guide

> Auto-injected when editing `src/backend/*.jsw` files.

## Unified Data Access Layer (Recommended)

Every backend service that accesses data MUST use the centralized **`dataAccess.jsw`** layer. This layer automatically handles routing to Wix or Airtable based on configuration, ensures consistent response formats, and integrates with the observability system.

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
// WRONG - Bypasses dual-source routing, data goes to Wix only
const result = await wixData.query('Carriers').eq('status', 'active').find();
await wixData.insert('AuditLog', { action: 'login', timestamp: new Date() });

// CORRECT - Uses unified data access layer
const result = await dataAccess.queryRecords(COLLECTIONS.carriers, {
    filters: { status: 'active' }
});
await dataAccess.insertRecord(COLLECTIONS.auditLog, { 
    action: 'login', 
    timestamp: new Date() 
});
```

## Field Name Mapping

Wix uses `snake_case`, Airtable uses `Title Case`. The `dataAccess` layer handles these transformations automatically using the `FIELD_MAPPINGS` defined in `airtableClient.jsw`.

**Backend Rule:** Always use `snake_case` for field names in your data objects.

## Two Types of Collections

### Type 1: Migrated Collections (Legacy)

Collections that existed in Wix and were migrated to Airtable. These have a Wix fallback for rollback capability.

```javascript
// configData.js - Migrated collection (has Wix fallback)
DATA_SOURCE.carriers = 'airtable'
AIRTABLE_TABLE_NAMES.carriers = 'v2_Carriers'
WIX_COLLECTION_NAMES.carriers = 'Carriers'  // Fallback exists
```

### Type 2: New Collections (Airtable-Only)

Collections created for new features. **NO Wix collection exists or is needed.**

```javascript
// configData.js - New collection (Airtable-only, NO Wix fallback)
DATA_SOURCE.driverXpEvents = 'airtable'
AIRTABLE_TABLE_NAMES.driverXpEvents = 'v2_Driver XP Events'
// NO entry in WIX_COLLECTION_NAMES - there's no Wix collection!
```

## Adding New Collections (For New Features)

**Step 1: Create Airtable Table**
```
Base: Last Mile Driver recruiting (app9N1YCJ3gdhExA0)
Table name: v2_{Feature Name}  (e.g., v2_Driver XP Events)
```

**Step 2: Add to configData.js (TWO entries only)**
```javascript
// In DATA_SOURCE
export const DATA_SOURCE = {
  // ... existing
  driverXpEvents: 'airtable',  // NEW
};

// In AIRTABLE_TABLE_NAMES
export const AIRTABLE_TABLE_NAMES = {
  // ... existing
  driverXpEvents: 'v2_Driver XP Events',  // NEW
};

// DO NOT add to WIX_COLLECTION_NAMES - no Wix collection exists!
```

**Step 3: Use dataAccess in Service**

Simply pass the new collection key to `dataAccess` methods. It will detect the source automatically.

## Checklist: Adding a New Collection

1. Create table in Airtable with `v2_` prefix
2. Add to `DATA_SOURCE` as `'airtable'` in `configData.js`
3. Add to `AIRTABLE_TABLE_NAMES` in `configData.js`
4. Do NOT add to `WIX_COLLECTION_NAMES`
5. Do NOT create a Wix collection
6. Add field mappings to `FIELD_MAPPINGS` in `airtableClient.jsw`

## Checklist: Modifying Backend Services

1. **Check for direct `wixData.*` calls** - Replace with `dataAccess.*`
2. **Check for raw `airtable.*` calls** - Replace with `dataAccess.*`
3. **Verify helper definitions** - Ensure you are NOT defining local `queryData`/`insertData` helpers; use the `dataAccess` module instead.
4. **Check COLLECTION_KEYS** - Ensure all collections used by the service are mapped correctly.
5. **Type Safety** - Convert numeric strings from forms to `Number` before querying.

## Full Airtable Routing Audit Checklist

### Step 1: Backend Service File (*.jsw)
```
[] Imports `* as dataAccess` from 'backend/dataAccess'
[] Uses `COLLECTION_KEYS` for all data operations
[] All field names in records use snake_case (backend standard)
[] Filter objects use standard dataAccess operators (eq, gte, etc.)
[] Distributed tracing: Pass `traceId` in options if available
```

### Step 2: configData.js - Data Source Routing
```
[] Collection is listed in DATA_SOURCE object
[] Value is 'airtable' (not 'wix') for collections that should route to Airtable
[] Collection key in AIRTABLE_TABLE_NAMES matches the table name in Airtable
```

### Step 3: airtableClient.jsw - Table Mappings
```
[] TABLE_NAMES has entry for the collection key
[] Table name points to actual table where data exists (v2_ prefix)
```

### Step 4: airtableClient.jsw - Field Mappings
```
[] FIELD_MAPPINGS has entry for the collection key
[] ALL fields used by backend are mapped (snake_case -> Title Case)
[] Date fields mapped correctly
[] Reference fields mapped correctly
```

## Common Airtable Field Mapping Issues

| Issue | Symptom | Fix |
|-------|---------|-----|
| Backend uses `additional_notes` but mapping has `notes` | Data goes to wrong field or gets lost | Add `'additional_notes': 'Notes'` to FIELD_MAPPINGS |
| Filter uses `{DOT Number}` but table has `DOT_NUMBER` | Query returns empty results | Check actual Airtable field name, update FIELD_MAPPINGS |
| Config routes to `v2_Carriers` but TABLE_NAMES has `Carriers` | Table not found error | Ensure TABLE_NAMES entry matches configData key |

## Allowed Direct Wix Calls

The ONLY acceptable direct `wixData.*` calls are:
1. **Inside the `dataAccess.jsw` layer itself** (the Wix implementation path)
2. **For `AdminUsers` collection** (auth must stay in Wix)
3. **For `MemberNotifications` collection** (Wix member integration)
4. **For `Members/Badges` or `Members/PrivateMembersData`** (system collections)