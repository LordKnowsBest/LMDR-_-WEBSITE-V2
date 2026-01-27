# v2_Team Members

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblfz9TwcgJ6bPuF2` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Name | Single Line Text | `fldkNE6cISNjJOPza` | Team member name |
| Title | Single Line Text | `fld9jF8Mchbw9Tr0L` | Job title |
| Bio | Long Text / Multiline | `fld2I8exIL619ZH8H` | Short bio |
| Photo URL | URL | `flddjKnOmUiRWY91r` | Profile photo URL |
| Order | Number (precision: 0) | `fldaa3DRfYJRMlICR` | Display order |
| Legacy Wix ID | Single Line Text | `fldLuAjlhHuUzDWFg` | Original Wix _id for migration reference |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Team Members': {
  'name': 'Name',
  'title': 'Title',
  'bio': 'Bio',
  'photo_url': 'Photo URL',
  'order': 'Order',
  'legacy_wix_id': 'Legacy Wix ID',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
