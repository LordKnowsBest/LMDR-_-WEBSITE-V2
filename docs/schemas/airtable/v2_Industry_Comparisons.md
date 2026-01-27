# v2_Industry Comparisons

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblUHBoeFMibABoBR` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Title | Single Line Text | `fldMW0iTb8MqN0y1q` | Comparison title |
| Competitor | Single Line Text | `fldyRryN4P9DtWsKF` | Competitor name |
| Comparison Data | Long Text / Multiline | `fld7p4PJdKVvtb8N6` | JSON comparison data |
| Summary | Long Text / Multiline | `flduxM5BJXKYkr56R` | Comparison summary |
| Order | Number (precision: 0) | `flddwMQpcRStAQ12F` | Display order |
| Legacy Wix ID | Single Line Text | `fldfHle9nAZSdQYOf` | Original Wix _id for migration reference |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Industry Comparisons': {
  'title': 'Title',
  'competitor': 'Competitor',
  'comparison_data': 'Comparison Data',
  'summary': 'Summary',
  'order': 'Order',
  'legacy_wix_id': 'Legacy Wix ID',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
