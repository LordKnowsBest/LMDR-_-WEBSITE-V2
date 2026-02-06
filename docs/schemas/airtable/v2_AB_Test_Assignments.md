# v2_AB Test Assignments

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | TBD |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Assignment ID | Single Line Text | TBD | Auto-generated {testKey}_{userId} |
| Test Key | Single Line Text | TBD | Test identifier (FK to AB Tests) |
| User ID | Single Line Text | TBD | Wix member ID |
| Variant ID | Single Line Text | TBD | Assigned variant (control, variant_a, etc.) |
| Assigned At | Date | TBD | Assignment timestamp |
| Converted | Checkbox | TBD | Whether user converted on primary metric |
| Conversion Events | Long Text / Multiline | TBD | JSON array of all conversion events |
| Created Date | Date | TBD | Record creation timestamp |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_AB Test Assignments': {
  'assignment_id': 'Assignment ID',
  'test_key': 'Test Key',
  'user_id': 'User ID',
  'variant_id': 'Variant ID',
  'assigned_at': 'Assigned At',
  'converted': 'Converted',
  'conversion_events': 'Conversion Events',
  'created_date': 'Created Date',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-02-04
