# Audit Airtable Routing

Audit a backend service file for complete Airtable data routing integration.

## Usage
```
/audit-airtable [service-file-name]
```

Example: `/audit-airtable carrierLeadsService`

## What This Audit Checks

### 1. Schema Validation (NEW - Highest Priority)
- [ ] Schema doc exists at `docs/schemas/airtable/{CollectionName}.md`
- [ ] Field names in FIELD_MAPPINGS exactly match schema field names
- [ ] Field types are handled correctly:
  - **Single line text**: Arrays must be JSON.stringify()'d
  - **Single select**: Values must match exact case (usually lowercase)
  - **Date**: Must be YYYY-MM-DD string, not Date object
  - **Number**: Must be actual number, not string
- [ ] All schema fields have mappings if used by backend

### 2. Backend Service File
- [ ] Imports from `backend/config` (usesAirtable, getAirtableTableName)
- [ ] Imports from `backend/airtableClient`
- [ ] Uses dual-source routing pattern (if usesAirtable check)
- [ ] All collections used have routing logic
- [ ] No direct `wixData.*` calls bypassing routing (except AdminUsers, MemberNotifications)

### 3. Config.jsw Entries
- [ ] Collection key exists in DATA_SOURCE
- [ ] DATA_SOURCE value is 'airtable' (not 'wix')
- [ ] Collection key exists in AIRTABLE_TABLE_NAMES
- [ ] Collection key exists in WIX_COLLECTION_NAMES

### 4. AirtableClient.jsw Mappings
- [ ] TABLE_NAMES has entry for Wix collection name
- [ ] TABLE_NAMES has entry for v2_* table name (if used in config)
- [ ] FIELD_MAPPINGS has entry for this collection
- [ ] ALL fields used by backend are mapped in FIELD_MAPPINGS
- [ ] Filter formula field names match FIELD_MAPPINGS values
- [ ] Field names EXACTLY match Airtable column names (case-sensitive!)

### 5. Wix Page Code (if applicable)
- [ ] Imports backend service function
- [ ] Handles postMessage from HTML
- [ ] Calls backend with correct data shape
- [ ] Returns response to HTML

### 6. HTML Component (if applicable)
- [ ] Sends correct postMessage type
- [ ] Collects all required fields
- [ ] Handles success/error responses
- [ ] Has inline Tailwind config (not external lmdr-config.js)

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
| **Field name typo** | 422 "Unknown field name" | Check schema for exact spelling (e.g., "Linked Carrier ID" not "Linked Carrier") |
| **Array sent to text field** | 422 "cannot accept value" | Use JSON.stringify() for arrays going to Single line text |
| **Wrong case for single select** | 422 "cannot accept value" | Check schema for exact case (e.g., "emergency" not "Emergency") |
| **Date object sent** | 422 or wrong format | Use .toISOString().split('T')[0] for YYYY-MM-DD |

## Schema-First Workflow

**ALWAYS check the schema before writing Airtable integration code:**

1. Find schema at `docs/schemas/airtable/{CollectionName}.md`
2. Note exact field names (case-sensitive!)
3. Note field types and their format requirements
4. Write backend code to match schema exactly
5. Add field mappings to airtableClient.jsw

## Field Type Quick Reference

| Airtable Type | Backend Must Send | Example |
|---------------|-------------------|---------|
| Single line text | String | `"some value"` |
| Single line text (for arrays) | JSON string | `'["Class A", "Hazmat"]'` |
| Long text | String | `"multi\nline\ntext"` |
| Number (integer) | Number | `42` |
| Single select | Exact string | `"emergency"` (case-sensitive!) |
| Date | YYYY-MM-DD string | `"2026-01-27"` |
| Phone number | String | `"(555) 123-4567"` |

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
