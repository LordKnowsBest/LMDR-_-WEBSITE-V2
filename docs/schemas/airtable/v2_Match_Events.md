# v2_Match Events

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblvhmr0wsMnfpfKo` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Driver ID | Single Line Text | `fldVqohyvUSy7dyf0` | Driver involved in match |
| Carrier DOT | Number (precision: 0) | `fldtDdFjZpOgGbmHh` | Carrier involved in match |
| Match Score | Number (precision: 0) | `fld2ohQhWAgFKcHP8` | Calculated match score |
| Event Type | Single Select (`match_calculated`, `match_viewed`, `match_applied`, `match_rejected`) | `fldIUNxcnapSAwAW4` | Type of match event |
| Event Date | Date | `fld50PWwz9I8quPRz` | When event occurred |
| Legacy Wix ID | Single Line Text | `fldQeh7WmSfdaWTN0` | Original Wix _id for migration reference |
| Driver Name | Single Line Text | `fldWKldebA4ZyjNk7` | Driver's name (optional input) |
| Action | Single Line Text | `fld4ExusV1eWBM8SE` | matched, clicked, interested |
| Timestamp | Date | `fldhjLbEaKEAxzEXL` | When it happened |
| Carrier Name | Single Line Text | `fldJJ9QGSKxanrcqy` | - |
| Driver ZIP | Number (precision: 0) | `fldRcKBwAk4w7s0RA` | - |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Match Events': {
  'driver_id': 'Driver ID',
  'carrier_dot': 'Carrier DOT',
  'match_score': 'Match Score',
  'event_type': 'Event Type',
  'event_date': 'Event Date',
  'legacy_wix_id': 'Legacy Wix ID',
  'driver_name': 'Driver Name',
  'action': 'Action',
  'timestamp': 'Timestamp',
  'carrier_name': 'Carrier Name',
  'driver_zip': 'Driver ZIP',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
