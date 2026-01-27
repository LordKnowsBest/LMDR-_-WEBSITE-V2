# v2_Job Postings

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblmlnIg03XcKWx1U` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Title | Single Line Text | `fldEM6LVd1vYKG9JH` | Job title |
| Carrier DOT | Number (precision: 0) | `fldPcsbvOTNhFbdBY` | Posting carrier DOT |
| Description | Long Text / Multiline | `fld0jefutZIzEPCZn` | Job description |
| Status | Single Select (`pending`, `approved`, `rejected`) | `fldPmTUuozM8CcDxk` | Moderation status |
| Submitted Date | Date | `fldXIleA6csrkTiNF` | When posted |
| Legacy Wix ID | Single Line Text | `flddMpjQRbuQJrXlW` | Original Wix _id for migration reference |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Job Postings': {
  'title': 'Title',
  'carrier_dot': 'Carrier DOT',
  'description': 'Description',
  'status': 'Status',
  'submitted_date': 'Submitted Date',
  'legacy_wix_id': 'Legacy Wix ID',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
