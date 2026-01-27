# v2_Road Utility Cache

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblqzfGCPZ3PKL7vz` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Wix ID | Single Line Text | `fldYdiAWHPqOzlhAh` | Original Wix record _id |
| Cache Key | Single Line Text | `fldRreXTGWk5rYEXZ` | Unique cache identifier |
| Cache Type | Single Line Text | `fldtI0hrKBEagLTKU` | Type of cached data |
| Data | Long Text / Multiline | `fldKZCtM89xvSSGxU` | Cached data as JSON |
| Expires At | Single Line Text | `fldBMdnhecCLviVqd` | Cache expiration timestamp (ISO 8601) |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Road Utility Cache': {
  'wix_id': 'Wix ID',
  'cache_key': 'Cache Key',
  'cache_type': 'Cache Type',
  'data': 'Data',
  'expires_at': 'Expires At',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
