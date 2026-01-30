# Airtable Routing: Full Implementation Guide

> Auto-injected when editing `src/backend/*.jsw` files.

## Required Helper Functions

Every backend service that accesses data MUST define and use these helpers:

```javascript
import { usesAirtable, getAirtableTableName } from 'backend/config';
import * as airtable from 'backend/airtableClient';

// Collection key mapping (at top of file)
const COLLECTION_KEYS = {
    carriers: 'carriers',
    drivers: 'driverProfiles',
    // ... add all collections this service uses
};

// Helper functions (define once per service file)
async function queryData(collectionKey, wixCollectionName, options = {}) {
    if (usesAirtable(collectionKey)) {
        const tableName = getAirtableTableName(collectionKey);
        const result = await airtable.queryRecords(tableName, {
            filterByFormula: options.filter || '',
            sort: options.sort,
            maxRecords: options.limit || 100
        });
        return result.records || [];
    }
    // Wix fallback
    let query = wixData.query(wixCollectionName);
    // ... build query
    const result = await query.find({ suppressAuth: true });
    return result.items;
}

async function insertData(collectionKey, wixCollectionName, data) {
    if (usesAirtable(collectionKey)) {
        const tableName = getAirtableTableName(collectionKey);
        return await airtable.createRecord(tableName, data);
    }
    return await wixData.insert(wixCollectionName, data, { suppressAuth: true });
}

async function updateData(collectionKey, wixCollectionName, data) {
    if (usesAirtable(collectionKey)) {
        const tableName = getAirtableTableName(collectionKey);
        return await airtable.updateRecord(tableName, data._id || data.id, data);
    }
    return await wixData.update(wixCollectionName, data, { suppressAuth: true });
}

async function getRecord(collectionKey, wixCollectionName, recordId) {
    if (usesAirtable(collectionKey)) {
        const tableName = getAirtableTableName(collectionKey);
        return await airtable.getRecord(tableName, recordId);
    }
    return await wixData.get(wixCollectionName, recordId, { suppressAuth: true });
}

async function removeData(collectionKey, wixCollectionName, recordId) {
    if (usesAirtable(collectionKey)) {
        const tableName = getAirtableTableName(collectionKey);
        return await airtable.deleteRecord(tableName, recordId);
    }
    return await wixData.remove(wixCollectionName, recordId, { suppressAuth: true });
}
```

## Before/After Example

```javascript
// WRONG - Bypasses dual-source routing, data goes to Wix only
const result = await wixData.query('Carriers').eq('status', 'active').find();
await wixData.insert('AuditLog', { action: 'login', timestamp: new Date() });

// CORRECT - Uses dual-source routing, data goes to Airtable
const result = await queryData(COLLECTION_KEYS.carriers, 'Carriers', {
    filter: `{Status} = "active"`
});
await insertData(COLLECTION_KEYS.auditLog, 'AuditLog', { action: 'login', timestamp: new Date() });
```

## Field Name Mapping

Wix uses `snake_case`, Airtable uses `Title Case`. When reading from Airtable, normalize field names:

```javascript
const normalizedRecords = (result.records || []).map(r => ({
    _id: r.id || r._id,
    carrier_name: r['Carrier Name'] || r.carrier_name,
    dot_number: r['Dot Number'] || r.dot_number,
    status: r.Status || r.status,
    created_date: r['Created Date'] || r._createdDate
}));
```

## Two Types of Collections

### Type 1: Migrated Collections (Legacy)

Collections that existed in Wix and were migrated to Airtable. These have a Wix fallback for rollback capability.

```javascript
// config.jsw - Migrated collection (has Wix fallback)
DATA_SOURCE.carriers = 'airtable'
AIRTABLE_TABLE_NAMES.carriers = 'v2_Carriers'
WIX_COLLECTION_NAMES.carriers = 'Carriers'  // Fallback exists
```

### Type 2: New Collections (Airtable-Only)

Collections created for new features. **NO Wix collection exists or is needed.**

```javascript
// config.jsw - New collection (Airtable-only, NO Wix fallback)
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

**Step 2: Add to config.jsw (TWO entries only)**
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

**Step 3: Use Simplified Helpers in Service**

For Airtable-only collections, use streamlined helpers without Wix fallback:

```javascript
import { getAirtableTableName } from 'backend/config';
import * as airtable from 'backend/airtableClient';

const COLLECTION_KEYS = {
    xpEvents: 'driverXpEvents',
    achievements: 'driverAchievements',
};

// Simplified helpers - Airtable only, no Wix fallback needed
async function queryData(collectionKey, options = {}) {
    const tableName = getAirtableTableName(collectionKey);
    const result = await airtable.queryRecords(tableName, {
        filterByFormula: options.filter || '',
        sort: options.sort,
        maxRecords: options.limit || 100
    });
    return result.records || [];
}

async function insertData(collectionKey, data) {
    const tableName = getAirtableTableName(collectionKey);
    return await airtable.createRecord(tableName, data);
}

async function updateData(collectionKey, recordId, data) {
    const tableName = getAirtableTableName(collectionKey);
    return await airtable.updateRecord(tableName, recordId, data);
}

async function getRecord(collectionKey, recordId) {
    const tableName = getAirtableTableName(collectionKey);
    return await airtable.getRecord(tableName, recordId);
}

async function removeData(collectionKey, recordId) {
    const tableName = getAirtableTableName(collectionKey);
    return await airtable.deleteRecord(tableName, recordId);
}
```

## Checklist: Adding a New Collection

1. Create table in Airtable with `v2_` prefix
2. Add to `DATA_SOURCE` as `'airtable'`
3. Add to `AIRTABLE_TABLE_NAMES`
4. Do NOT add to `WIX_COLLECTION_NAMES`
5. Do NOT create a Wix collection
6. Use simplified Airtable-only helpers in service

## Checklist: Modifying Backend Services

1. **Check for direct `wixData.*` calls** - Search for `wixData.query`, `wixData.insert`, `wixData.update`, `wixData.get`, `wixData.remove`
2. **Verify helpers exist** - Ensure the service has `queryData`, `insertData`, `updateData`, `getRecord`, `removeData` defined
3. **Check COLLECTION_KEYS** - Ensure all collections used by the service are mapped
4. **Replace bypasses** - Convert direct `wixData.*` calls to use the helpers
5. **Handle field name mapping** - Normalize Airtable responses to match expected field names

## Full Airtable Routing Audit Checklist

When auditing a backend service for complete Airtable integration, check ALL of these:

### Step 1: Backend Service File (*.jsw)
```
[] Imports `usesAirtable`, `getAirtableTableName` from 'backend/config'
[] Imports `* as airtable` from 'backend/airtableClient'
[] Uses `usesAirtable(collectionKey)` before data operations
[] Uses `getAirtableTableName(collectionKey)` to get table name
[] All field names in records use snake_case (backend standard)
[] Filter formulas use CORRECT Airtable field names (check FIELD_MAPPINGS)
```

### Step 2: config.jsw - Data Source Routing
```
[] Collection is listed in DATA_SOURCE object
[] Value is 'airtable' (not 'wix') for collections that should route to Airtable
[] Collection key in AIRTABLE_TABLE_NAMES matches the table name in Airtable
[] Collection key in WIX_COLLECTION_NAMES matches for fallback
```

### Step 3: airtableClient.jsw - Table Mappings
```
[] TABLE_NAMES has entry for the Wix collection name
[] TABLE_NAMES has entry for the v2_* table name (if config uses that)
[] Table name points to actual table where data exists
```

### Step 4: airtableClient.jsw - Field Mappings
```
[] FIELD_MAPPINGS has entry for the collection/table name
[] ALL fields used by backend are mapped (snake_case -> Title Case)
[] Filter formula field names match what's in FIELD_MAPPINGS values
[] Date fields mapped correctly (submitted_date, created_date, etc.)
[] Reference fields mapped (linked_carrier_id, driver_id, etc.)
```

### Step 5: Wix Page Code (*.js in src/pages/)
```
[] Imports the backend service function
[] Handles postMessage from HTML component
[] Calls backend function with correct data shape
[] Returns response via postMessage to HTML
```

### Step 6: HTML Component
```
[] Form collects all required fields
[] postMessage sends correct message type
[] Listens for response message type
[] Handles success/error states
```

## Common Airtable Field Mapping Issues

| Issue | Symptom | Fix |
|-------|---------|-----|
| Backend uses `additional_notes` but mapping has `notes` | Data goes to wrong field or gets lost | Add `'additional_notes': 'Notes'` to FIELD_MAPPINGS |
| Filter uses `{DOT Number}` but table has `DOT_NUMBER` | Query returns empty results | Check actual Airtable field name, update filter formula |
| Config routes to `v2_Carriers` but TABLE_NAMES has `Carriers` | Table not found error | Add `'v2_Carriers': 'Carriers (Master)'` to TABLE_NAMES |
| Missing date field mapping | Dates stored as wrong field name | Add `'submitted_date': 'Submitted Date'` etc. |
| Backend sends camelCase field | Field not mapped, stored as-is | Ensure backend normalizes to snake_case before insert |

## Airtable Field Name Reference

**Carriers (Master) table uses UPPERCASE:**
- `DOT_NUMBER`, `LEGAL_NAME`, `PHY_STATE`, `PHY_CITY`, etc.

**v2_* tables use Title Case:**
- `Company Name`, `Contact Name`, `Submitted Date`, `Status`, etc.

**Backend services use snake_case:**
- `company_name`, `contact_name`, `submitted_date`, `status`, etc.

## How to Add a New Collection to Airtable Routing

1. **Add to config.jsw DATA_SOURCE:**
   ```javascript
   myNewCollection: 'airtable',
   ```

2. **Add to config.jsw AIRTABLE_TABLE_NAMES:**
   ```javascript
   myNewCollection: 'v2_My New Collection',
   ```

3. **Add to config.jsw WIX_COLLECTION_NAMES:**
   ```javascript
   myNewCollection: 'MyNewCollection',
   ```

4. **Add to airtableClient.jsw TABLE_NAMES:**
   ```javascript
   'MyNewCollection': 'v2_My New Collection',
   'v2_My New Collection': 'v2_My New Collection', // Self-reference for direct lookups
   ```

5. **Add to airtableClient.jsw FIELD_MAPPINGS:**
   ```javascript
   'MyNewCollection': {
     'field_one': 'Field One',
     'field_two': 'Field Two',
     'created_date': 'Created Date',
     // ... all fields the backend uses
   },
   ```

## Allowed Direct Wix Calls

The ONLY acceptable direct `wixData.*` calls are:
1. **Inside the helper functions themselves** (the Wix fallback path)
2. **For `AdminUsers` collection** (auth must stay in Wix)
3. **For `MemberNotifications` collection** (Wix member integration)
