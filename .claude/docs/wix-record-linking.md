# Wix Collection Record Linking

> Auto-injected when editing services that link records across collections.

**IMPORTANT:** This pattern is essential for linking records across collections (drivers to carriers, applications to jobs, etc.).

## The Problem: Type Mismatch Silently Fails

Wix `wixData.query().eq()` and Airtable filter formulas perform **strict type comparison**. If you query a `NUMBER` field with a `string` value, it returns **zero results with no error**.

```javascript
// BROKEN - Form data is always a string, but dot_number is NUMBER type
const result = await dataAccess.queryRecords('carriers', {
  filters: { dot_number: formData.dotNumber }  // "4028497" !== 4028497
});
// result.items = [] (silently fails!)
```

## The Solution: Always Convert Types Before Querying

The centralized **`dataAccess.jsw`** layer is the primary interface for all database operations. However, you MUST ensure values match the target field type.

```javascript
// CORRECT - Convert to match target field type
const dotNumberAsNumber = parseInt(formData.dotNumber.trim(), 10);
const result = await dataAccess.queryRecords('carriers', {
  filters: { dot_number: dotNumberAsNumber }  // 4028497 === 4028497
});
```

## Universal Pattern for Record Linking via Lookup Field

When linking records (e.g., linking a staffing request to a carrier via DOT number) using the `dataAccess` layer:

```javascript
import * as dataAccess from 'backend/dataAccess';

async function linkRecordViaLookup(lookupValue, lookupFieldName, targetCollection, targetFieldType) {
  // Step 1: Convert input to match target field type
  let convertedValue;
  if (targetFieldType === 'NUMBER') {
    convertedValue = parseInt(lookupValue.trim(), 10);
    if (isNaN(convertedValue)) return null;
  } else {
    convertedValue = String(lookupValue).trim();
  }

  // Step 2: Query target collection by lookup field
  const result = await dataAccess.queryRecords(targetCollection, {
    filters: { [lookupFieldName]: convertedValue },
    limit: 1,
    suppressAuth: true
  });

  // Step 3: Return _id for reference field (References always use the Record ID)
  return result.items.length > 0 ? result.items[0]._id : null;
}

// Usage example:
const linkedCarrierId = await linkRecordViaLookup(
  leadData.dotNumber,    // User input (string)
  'dot_number',          // Field to query in target
  'carriers',            // Target collection key
  'NUMBER'               // Target field type
);
```

## Collection Field Types Reference

| Collection Key | Field | Type | Notes |
|----------------|-------|------|-------|
| `carriers` | `_id` | TEXT | Primary key, use for reference fields |
| `carriers` | `dot_number` | NUMBER | FMCSA DOT number, convert strings before querying |
| `carriers` | `mc_number` | NUMBER | Motor carrier number |
| `carrierStaffingRequests` | `linked_carrier_id` | REFERENCE -> Carriers | Store `_id` from Carriers |
| `driverProfiles` | `_id` | TEXT | Primary key |

## Key Rules

1. **Form data is ALWAYS strings** - HTML forms, postMessage, URL params all send strings.
2. **Convert to `Number` manually** - Velo/Airtable will NOT auto-convert strings to numbers in queries.
3. **Reference fields store `_id`** - Never store lookup values (DOT, MC number) in reference fields.
4. **Use `dataAccess`** - Never call `wixData` or `airtable` directly.
5. **Validate conversions** - Always check `isNaN()` after `parseInt()` to catch invalid user input.