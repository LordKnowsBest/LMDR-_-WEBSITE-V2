# v2_Driver-Carrier Interests

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblUvd2TwWp6wcvjI` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Driver ID | Single Line Text | `fldr0tuKqsdPu2CpN` | Linked driver ID |
| Carrier DOT | Number (precision: 0) | `fldKAYk10byPAibm5` | Linked carrier DOT number |
| Status | Single Select (`interested`, `applied`, `in_review`, `contacted`, `offer`, `hired`, `rejected`, `withdrawn`) | `fldvRUJNFQZZC47gm` | Application/interest status |
| Match Score | Number (precision: 0) | `fldicBoSc2WvuFkDc` | Algorithm match score |
| Applied Date | Date | `fldV2EPXwe3PA3BOZ` | Date driver applied |
| Status Updated | Date | `fldrO2rhHWDusMGFG` | Last status change date |
| Notes | Long Text / Multiline | `fldzXXTkYcSxKkcMi` | Recruiter notes |
| Legacy Wix ID | Single Line Text | `fld707i0xEvdaR2dk` | Original Wix _id for migration reference |
| Carrier Name | Single Line Text | `fldtrKP3SRlCdSa5Y` | - |
| Action | Single Line Text | `fldA1d3NQQ6L4MnFU` | - |
| Action Timestamp | Date | `fldEEHI7nOlj7H1dG` | - |
| Driver ZIP at Match | Single Line Text | `fld7GNlry0Dat4Ykf` | - |
| Outcome | Single Line Text | `fld3muGofvrBXmoRy` | - |
| Outcome Date | Date | `fldgZCrS7NCSUXvlM` | - |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Driver-Carrier Interests': {
  'driver_id': 'Driver ID',
  'carrier_dot': 'Carrier DOT',
  'status': 'Status',
  'match_score': 'Match Score',
  'applied_date': 'Applied Date',
  'status_updated': 'Status Updated',
  'notes': 'Notes',
  'legacy_wix_id': 'Legacy Wix ID',
  'carrier_name': 'Carrier Name',
  'action': 'Action',
  'action_timestamp': 'Action Timestamp',
  'driver_zip_at_match': 'Driver ZIP at Match',
  'outcome': 'Outcome',
  'outcome_date': 'Outcome Date',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
