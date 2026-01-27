# v2_Carrier Reviews

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblrpXtd42qf5B17J` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Carrier DOT | Number (precision: 0) | `fldsv5z5Bu7bjFDsG` | Reviewed carrier DOT |
| Driver ID | Single Line Text | `flde7kMkZnmvJyjs7` | Reviewing driver ID |
| Rating | Number (precision: 0) | `fldulR5n7l3QRXVmd` | 1-5 star rating |
| Title | Single Line Text | `fldvL8YJEJfwjnsjf` | Review title |
| Content | Long Text / Multiline | `fldhHFOja4NLbHbRF` | Review content |
| Status | Single Select (`pending`, `approved`, `rejected`) | `fldPPXqrsolidJCon` | Moderation status |
| Submitted Date | Date | `fldvNzXF5gLsBqHFP` | When review was submitted |
| Legacy Wix ID | Single Line Text | `fldw8YUY7o6nqRxbQ` | Original Wix _id for migration reference |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Carrier Reviews': {
  'carrier_dot': 'Carrier DOT',
  'driver_id': 'Driver ID',
  'rating': 'Rating',
  'title': 'Title',
  'content': 'Content',
  'status': 'Status',
  'submitted_date': 'Submitted Date',
  'legacy_wix_id': 'Legacy Wix ID',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
