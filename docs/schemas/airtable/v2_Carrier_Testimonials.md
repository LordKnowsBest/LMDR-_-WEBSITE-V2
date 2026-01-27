# v2_Carrier Testimonials

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblRmnWn4LUNaACzH` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Carrier Name | Single Line Text | `fld02lFCRsiGd5VDh` | Carrier company name |
| Contact Name | Single Line Text | `fldUhUUun3BiBS3zA` | Person giving testimonial |
| Title | Single Line Text | `fldDvi0bVlPIYbkR7` | Contact's title |
| Quote | Long Text / Multiline | `fldxyWyel56GTT9q5` | Testimonial text |
| Rating | Number (precision: 0) | `fldCZoZ4S8Us96eDZ` | 1-5 star rating |
| Status | Single Select (`pending`, `approved`, `rejected`) | `fldZeRAeHWxfk34MF` | Approval status |
| Legacy Wix ID | Single Line Text | `fldshNT2IkKJ1J38V` | Original Wix _id for migration reference |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Carrier Testimonials': {
  'carrier_name': 'Carrier Name',
  'contact_name': 'Contact Name',
  'title': 'Title',
  'quote': 'Quote',
  'rating': 'Rating',
  'status': 'Status',
  'legacy_wix_id': 'Legacy Wix ID',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
