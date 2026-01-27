# v2_Company Milestones

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tbluy4iuhOpNoe1Ba` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Title | Single Line Text | `fldjeiJQKStm9TR7M` | Milestone title |
| Description | Long Text / Multiline | `fld8euXp4er4KY2f6` | Milestone description |
| Date | Date | `fld31haWTRnD6vnip` | When milestone occurred |
| Order | Number (precision: 0) | `fldHSqPJzb4PdVeYQ` | Display order |
| Legacy Wix ID | Single Line Text | `fldASVVUSzMVaknvv` | Original Wix _id for migration reference |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Company Milestones': {
  'title': 'Title',
  'description': 'Description',
  'date': 'Date',
  'order': 'Order',
  'legacy_wix_id': 'Legacy Wix ID',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
