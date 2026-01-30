# Wix Collection Record Linking

> Auto-injected when editing services that link records across collections.

**IMPORTANT:** This pattern is essential for linking records across collections (drivers to carriers, applications to jobs, etc.).

## The Problem: Type Mismatch Silently Fails

Wix `wixData.query().eq()` performs **strict type comparison**. If you query a `NUMBER` field with a `string` value, it returns **zero results with no error**.

```javascript
// BROKEN - Form data is always a string, but dot_number is NUMBER type
const result = await wixData.query('Carriers')
  .eq('dot_number', formData.dotNumber)  // "4028497" !== 4028497
  .find();
// result.items = [] (silently fails!)
```

## The Solution: Always Convert Types Before Querying

```javascript
// CORRECT - Convert to match target field type
const dotNumberAsNumber = parseInt(formData.dotNumber.trim(), 10);
const result = await wixData.query('Carriers')
  .eq('dot_number', dotNumberAsNumber)  // 4028497 === 4028497
  .find();
```

## Universal Pattern for Record Linking via Lookup Field

When linking records (e.g., linking a staffing request to a carrier via DOT number):

```javascript
async function linkRecordViaLookup(lookupValue, lookupFieldName, targetCollection, targetFieldType) {
  // Step 1: Convert input to match target field type
  let convertedValue;
  if (targetFieldType === 'NUMBER') {
    convertedValue = parseInt(lookupValue.trim(), 10);
    if (isNaN(convertedValue)) return null;
  } else {
    convertedValue = lookupValue.trim();
  }

  // Step 2: Query target collection by lookup field
  const result = await wixData.query(targetCollection)
    .eq(lookupFieldName, convertedValue)
    .limit(1)
    .find({ suppressAuth: true });

  // Step 3: Return _id for reference field (Wix references always use _id)
  return result.items.length > 0 ? result.items[0]._id : null;
}

// Usage example:
const linkedCarrierId = await linkRecordViaLookup(
  leadData.dotNumber,    // User input (string)
  'dot_number',          // Field to query in target
  'Carriers',            // Target collection
  'NUMBER'               // Target field type
);
```

## Collection Field Types Reference

| Collection | Field | Type | Notes |
|------------|-------|------|-------|
| `Carriers` | `_id` | TEXT | Primary key, use for reference fields |
| `Carriers` | `dot_number` | NUMBER | FMCSA DOT number, convert strings before querying |
| `Carriers` | `mc_number` | NUMBER | Motor carrier number |
| `carrierStaffingRequests` | `linked_carrier_id` | REFERENCE -> Carriers | Store `_id` from Carriers |
| `Drivers` | `_id` | TEXT | Primary key |

## Key Rules

1. **Form data is ALWAYS strings** - HTML forms, postMessage, URL params all send strings
2. **Check target field type** - Use Wix MCP to verify field types before writing queries
3. **Reference fields store `_id`** - Never store lookup values (DOT, email) in reference fields
4. **Silent failures** - Type mismatches don't throw errors, they just return empty results
5. **Validate conversions** - Check `isNaN()` after `parseInt()` to catch invalid input
