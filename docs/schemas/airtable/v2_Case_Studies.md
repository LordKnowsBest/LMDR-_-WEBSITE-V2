# v2_Case Studies

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblfAE5kXf5uQgiOv` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Title | Single Line Text | `fldWh4GxSUVLKHFP3` | Case study title |
| Company | Single Line Text | `fldNmuryauAa0Ucsi` | Customer company |
| Challenge | Long Text / Multiline | `fldfcN6L2S6Iw3PeP` | The challenge faced |
| Solution | Long Text / Multiline | `fldfWYsgya7KAoFcr` | How LMDR helped |
| Results | Long Text / Multiline | `fldyXqNER9GNcCclE` | Outcomes achieved |
| Quote | Long Text / Multiline | `fld7KKDYJ2AFIS0gW` | Customer quote |
| Status | Single Select (`draft`, `published`) | `fldGrXazCybT9azpv` | Publication status |
| Legacy Wix ID | Single Line Text | `fldWxmBcGkj4urjpT` | Original Wix _id for migration reference |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Case Studies': {
  'title': 'Title',
  'company': 'Company',
  'challenge': 'Challenge',
  'solution': 'Solution',
  'results': 'Results',
  'quote': 'Quote',
  'status': 'Status',
  'legacy_wix_id': 'Legacy Wix ID',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
