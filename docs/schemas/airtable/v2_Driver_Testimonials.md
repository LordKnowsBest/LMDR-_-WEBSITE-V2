# v2_Driver Testimonials

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblt1qNbHiGOhRgZY` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Driver Name | Single Line Text | `fldqhg8fc8fRiAuXk` | Driver name |
| Quote | Long Text / Multiline | `flddfaBIn6Mk0dRbT` | Testimonial text |
| Hired By | Single Line Text | `fldpsXS4HEVuQZN5M` | Carrier that hired them |
| Rating | Number (precision: 0) | `fldQOqyQcstVA8uj5` | 1-5 star rating |
| Status | Single Select (`pending`, `approved`, `rejected`) | `fldenXAZNXBQxw7qu` | Approval status |
| Legacy Wix ID | Single Line Text | `fldD3NVZoJeJcv0c9` | Original Wix _id for migration reference |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Driver Testimonials': {
  'driver_name': 'Driver Name',
  'quote': 'Quote',
  'hired_by': 'Hired By',
  'rating': 'Rating',
  'status': 'Status',
  'legacy_wix_id': 'Legacy Wix ID',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
