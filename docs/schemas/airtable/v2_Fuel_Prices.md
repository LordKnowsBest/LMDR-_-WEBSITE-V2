# v2_Fuel Prices

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblEVPGgODkYIjXxH` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Station ID | Single Line Text | `fldmT0glaoPC8Viz0` | - |
| Station Name | Single Line Text | `fldgUIYuBXfM1XXYA` | - |
| Location | Long Text / Multiline | `fldJrrQ1P8AZWFT2L` | - |
| Address | Single Line Text | `fldrGkETD2WBCvMlE` | - |
| City | Single Line Text | `fldr1vXkXS4zuiVDN` | - |
| State | Single Line Text | `fldKFZ4Etcw8DWFon` | - |
| Diesel Price | Number (precision: 3) | `fldqmjuUGub8SSiC9` | - |
| Retail Price | Number (precision: 3) | `fldswmD0Sm33sJa2S` | - |
| DEF Price | Number (precision: 3) | `fldHhUo9P9J6KrFMB` | - |
| Accepted Cards | Long Text / Multiline | `fldLwdCNHKGoOFe1V` | - |
| Amenities | Long Text / Multiline | `fldzOlhBqSX5AB1Uz` | - |
| Last Updated | Single Line Text | `fldFRRvlirriLQxdk` | - |
| Wix ID | Single Line Text | `fldmSZFO54pSTy9jR` | - |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Fuel Prices': {
  'station_id': 'Station ID',
  'station_name': 'Station Name',
  'location': 'Location',
  'address': 'Address',
  'city': 'City',
  'state': 'State',
  'diesel_price': 'Diesel Price',
  'retail_price': 'Retail Price',
  'def_price': 'DEF Price',
  'accepted_cards': 'Accepted Cards',
  'amenities': 'Amenities',
  'last_updated': 'Last Updated',
  'wix_id': 'Wix ID',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
