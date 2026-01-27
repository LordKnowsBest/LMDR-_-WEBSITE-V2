# v2_Prompt Library

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblK6ZmrQdxtAgem0` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Name | Single Line Text | `fldYahMZQ7xDERe9l` | Prompt name |
| Category | Single Select (`enrichment`, `matching`, `analysis`, `generation`) | `fld6mh29BwrrwNnXZ` | Prompt category |
| Prompt Text | Long Text / Multiline | `fldZ3iMe9eF6Vyl32` | The prompt template |
| Version | Number (precision: 0) | `fldQUMXfcRaGUOTiL` | Version number |
| Active | Single Select (`Yes`, `No`) | `fldMgZLbVx3ITehVb` | Is this the active version |
| Legacy Wix ID | Single Line Text | `fldw2CPJdlQXsDkjK` | Original Wix _id for migration reference |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Prompt Library': {
  'name': 'Name',
  'category': 'Category',
  'prompt_text': 'Prompt Text',
  'version': 'Version',
  'active': 'Active',
  'legacy_wix_id': 'Legacy Wix ID',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
