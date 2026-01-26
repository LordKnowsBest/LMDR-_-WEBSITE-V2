# Audit Airtable Routing

Audit a backend service file for complete Airtable data routing integration.

## Usage
```
/audit-airtable [service-file-name]
```

Example: `/audit-airtable carrierLeadsService`

## What This Audit Checks

### 1. Backend Service File
- [ ] Imports from `backend/config` (usesAirtable, getAirtableTableName)
- [ ] Imports from `backend/airtableClient`
- [ ] Uses dual-source routing pattern (if usesAirtable check)
- [ ] All collections used have routing logic
- [ ] No direct `wixData.*` calls bypassing routing (except AdminUsers, MemberNotifications)

### 2. Config.jsw Entries
- [ ] Collection key exists in DATA_SOURCE
- [ ] DATA_SOURCE value is 'airtable' (not 'wix')
- [ ] Collection key exists in AIRTABLE_TABLE_NAMES
- [ ] Collection key exists in WIX_COLLECTION_NAMES

### 3. AirtableClient.jsw Mappings
- [ ] TABLE_NAMES has entry for Wix collection name
- [ ] TABLE_NAMES has entry for v2_* table name (if used in config)
- [ ] FIELD_MAPPINGS has entry for this collection
- [ ] ALL fields used by backend are mapped in FIELD_MAPPINGS
- [ ] Filter formula field names match FIELD_MAPPINGS values

### 4. Wix Page Code (if applicable)
- [ ] Imports backend service function
- [ ] Handles postMessage from HTML
- [ ] Calls backend with correct data shape
- [ ] Returns response to HTML

### 5. HTML Component (if applicable)
- [ ] Sends correct postMessage type
- [ ] Collects all required fields
- [ ] Handles success/error responses

## Audit Process

When invoked, I will:

1. **Read the backend service file** to identify:
   - All collections/tables it accesses
   - All field names it uses
   - Any filter formulas used
   - Import statements

2. **Cross-reference config.jsw** to verify:
   - Each collection is routed to Airtable
   - Table names are correctly mapped

3. **Cross-reference airtableClient.jsw** to verify:
   - TABLE_NAMES entries exist
   - FIELD_MAPPINGS entries exist for all used fields

4. **Find related page code** to verify:
   - PostMessage bridge is correctly implemented
   - Backend function is imported and called

5. **Generate a report** with:
   - ✅ Items that pass
   - ❌ Items that fail with specific fix instructions
   - Code snippets to add for any missing mappings

## Common Issues Found

| Issue | Impact | Fix |
|-------|--------|-----|
| Missing field mapping | Data stored under wrong name | Add to FIELD_MAPPINGS |
| Wrong filter field name | Query returns empty | Check actual Airtable column name |
| Missing TABLE_NAMES entry | Table lookup fails | Add entry pointing to actual table |
| Config uses v2_* but no alias | Lookups fail | Add v2_* alias in TABLE_NAMES |

## Output Format

```
## Airtable Routing Audit: [service-name]

### Summary
- Collections Found: X
- Fields Mapped: Y/Z
- Issues Found: N

### Collections Audit
| Collection | In Config | In TABLE_NAMES | In FIELD_MAPPINGS | Status |
|------------|-----------|----------------|-------------------|--------|
| carriers   | ✅        | ✅             | ✅                | PASS   |
| drivers    | ✅        | ❌             | ❌                | FAIL   |

### Field Mapping Audit
| Backend Field | Expected Airtable Field | Mapped? | Status |
|---------------|-------------------------|---------|--------|
| company_name  | Company Name            | ✅      | PASS   |
| source_url    | Source URL              | ❌      | FAIL   |

### Required Fixes
1. Add to TABLE_NAMES: `'v2_Drivers': 'v2_Driver Profiles'`
2. Add to FIELD_MAPPINGS['DriverProfiles']: `'source_url': 'Source URL'`

### Code to Add
[Specific code snippets for each fix]
```
