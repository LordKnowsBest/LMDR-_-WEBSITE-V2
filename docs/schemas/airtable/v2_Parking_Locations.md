# v2_Parking Locations

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblcmCLcErM1rARfB` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| External ID | Single Line Text | `fldW5jT3BfsB9puur` | - |
| Source | Single Line Text | `fldPeevngOu2QP7mb` | - |
| Name | Single Line Text | `fldk1h66MvcBGekvP` | - |
| Location | Long Text / Multiline | `fldgz5SHa0jnAyexG` | - |
| Address | Long Text / Multiline | `fldCE9hOPQc1VVkcc` | - |
| Total Spaces | Number (precision: 0) | `fld2vVbUlWKomUPWn` | - |
| Available Spaces | Number (precision: 0) | `fldCLWOmJNwPXwvoQ` | - |
| Amenities | Long Text / Multiline | `fldUS7EF2WA8fLKrV` | - |
| Average Rating | Number (precision: 1) | `fld8mORnh1HaG5VGU` | - |
| Is Open | Single Line Text | `fld3jLjk0Gmbs8ygC` | - |
| Data Confidence | Single Line Text | `fldKXHCGevROVNyMs` | - |
| Highway | Single Line Text | `fldB6Bt3LS3XaRncw` | - |
| Last Availability Update | Single Line Text | `fldOFpXYWO1xu2OLl` | - |
| Wix ID | Single Line Text | `fldI1i1cqCiYNOgi2` | - |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Parking Locations': {
  'external_id': 'External ID',
  'source': 'Source',
  'name': 'Name',
  'location': 'Location',
  'address': 'Address',
  'total_spaces': 'Total Spaces',
  'available_spaces': 'Available Spaces',
  'amenities': 'Amenities',
  'average_rating': 'Average Rating',
  'is_open': 'Is Open',
  'data_confidence': 'Data Confidence',
  'highway': 'Highway',
  'last_availability_update': 'Last Availability Update',
  'wix_id': 'Wix ID',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
