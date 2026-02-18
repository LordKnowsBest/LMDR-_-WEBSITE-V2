# v2_AB Test Assignments

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | TBD |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields (Expected by Current Backend)

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Test Key | Single Line Text | TBD | Test identifier (FK to AB Tests) |
| User ID | Single Line Text | TBD | Wix member ID |
| Variant ID | Single Line Text | TBD | Assigned variant (control, variant_a, etc.) |
| Assigned At | Date with time | TBD | Assignment timestamp |
| Converted | Checkbox | TBD | Whether user converted on primary metric |
| Conversion Events | Long Text / Multiline | TBD | JSON array of all conversion events |
| Created At | Date with time | TBD | Record creation timestamp |

## Suggested Views / Indexes

- Composite uniqueness to enforce one assignment per `(Test Key, User ID)`
- Views grouped by `Test Key` and `Variant ID`

## Backend Field Mapping (camelCase used in code)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_AB Test Assignments': {
  'testKey': 'Test Key',
  'userId': 'User ID',
  'variantId': 'Variant ID',
  'assignedAt': 'Assigned At',
  'converted': 'Converted',
  'conversionEvents': 'Conversion Events',
  'createdAt': 'Created At',
},
```

## Notes

- Updated for `admin_platform_config_20260120` implementation
- Updated: 2026-02-18
