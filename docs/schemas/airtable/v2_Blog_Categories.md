# v2_Blog Categories

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblU0tifuRoFQp15X` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Name | Single Line Text | `fldW1Ecdb3x8bh1K7` | Category name |
| Slug | Single Line Text | `fldFiynlaTmfJ0T9I` | URL slug |
| Description | Long Text / Multiline | `fldm7m7IQr3k1oiLP` | Category description |
| Order | Number (precision: 0) | `fldOTvJWe6cx2CfAG` | Display order |
| Legacy Wix ID | Single Line Text | `fldXOEZxpanj31Tu7` | Original Wix _id for migration reference |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Blog Categories': {
  'name': 'Name',
  'slug': 'Slug',
  'description': 'Description',
  'order': 'Order',
  'legacy_wix_id': 'Legacy Wix ID',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
