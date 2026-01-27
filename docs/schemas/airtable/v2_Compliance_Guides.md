# v2_Compliance Guides

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tbl826kjTdygp4kmR` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Title | Single Line Text | `fldzcJGcnlBU6UbDt` | Guide title |
| Slug | Single Line Text | `fldzOmIEY0ZFYYt9r` | URL slug |
| Content | Long Text / Multiline | `fldHnLgjwIMegTw4R` | Guide content |
| Category | Single Line Text | `fldyc5Qa8exNGxXsm` | Compliance category |
| Order | Number (precision: 0) | `fldXFlPAWNFbfD5UM` | Display order |
| Legacy Wix ID | Single Line Text | `fldRb062PRKiWTIOh` | Original Wix _id for migration reference |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Compliance Guides': {
  'title': 'Title',
  'slug': 'Slug',
  'content': 'Content',
  'category': 'Category',
  'order': 'Order',
  'legacy_wix_id': 'Legacy Wix ID',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
