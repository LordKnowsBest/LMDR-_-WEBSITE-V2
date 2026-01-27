# v2_Driver Interests

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tbl6BEDNgbUXmwCG4` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Driver ID | Single Line Text | `fldbyJuWiZ12diogj` | Linked driver ID |
| Preferred Home Time | Single Select (`Weekly`, `Bi-weekly`, `Monthly`, `Flexible`) | `fld4KuyiGM3DeqNpK` | Home time preference |
| Max Miles From Home | Number (precision: 0) | `fldz6eqjWgOVQCiK4` | Maximum miles from home for regional routes |
| Willing to Team | Single Select (`Yes`, `No`, `Maybe`) | `fldMhI2Yb9oMbeCsx` | Willing to team drive |
| Legacy Wix ID | Single Line Text | `fldElocFGMRMibymk` | Original Wix _id for migration reference |
| Linked Driver | Single Line Text | `fldgXmuMCx4Xiufer` | Reference to DriverProfiles |
| Carrier DOT | Single Line Text | `fldEkqn4JkZy0NZXK` | - |
| Status | Single Line Text | `fldEP6Bj2dMV6ycNy` | interested, not_interested, applied |
| Interest Level | Number (precision: 0) | `fldIkjReb47SPsSVk` | 1-5 rating of interest |
| Notes | Single Line Text | `fldja3vVp1AikD2kN` | - |
| Created Date | Date | `fldo0bCrXAvWiOIQv` | - |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Driver Interests': {
  'driver_id': 'Driver ID',
  'preferred_home_time': 'Preferred Home Time',
  'max_miles_from_home': 'Max Miles From Home',
  'willing_to_team': 'Willing to Team',
  'legacy_wix_id': 'Legacy Wix ID',
  'linked_driver': 'Linked Driver',
  'carrier_dot': 'Carrier DOT',
  'status': 'Status',
  'interest_level': 'Interest Level',
  'notes': 'Notes',
  'created_date': 'Created Date',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
