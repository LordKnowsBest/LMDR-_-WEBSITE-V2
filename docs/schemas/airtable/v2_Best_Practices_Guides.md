# v2_Best Practices Guides

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tbl6ZdiYZUzgu8EVt` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Title | Single Line Text | `fldhAwZXYhxXLRSMA` | Guide title |
| Slug | Single Line Text | `fldxWsTaxKejwR6Pd` | URL slug |
| Content | Long Text / Multiline | `fld4gxAPBqHrdJ4Aq` | Guide content |
| Category | Single Line Text | `fldWxy6IABPKhBNXo` | Best practice category |
| Order | Number (precision: 0) | `fldmK2spIXQq1sY3L` | Display order |
| Legacy Wix ID | Single Line Text | `fldRx3SNiOAC9zQEN` | Original Wix _id for migration reference |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Best Practices Guides': {
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
