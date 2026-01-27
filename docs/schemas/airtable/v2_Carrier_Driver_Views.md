# v2_Carrier Driver Views

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblP64bVibZyH8xlb` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Carrier DOT | Number (precision: 0) | `fldwxFsQJ4jhUTnFT` | Viewing carrier DOT |
| Driver ID | Single Line Text | `fldoHGD6kUzYdxXqW` | Viewed driver ID |
| View Date | Date | `fld72ZD61DiriPPFM` | When viewed |
| View Duration Sec | Number (precision: 0) | `fldexnjMKZWrjELMa` | Seconds spent viewing |
| Legacy Wix ID | Single Line Text | `fld6S3mIK9dyJxqSv` | Original Wix _id for migration reference |
| Recruiter ID | Single Line Text | `fldqFXlXTqAVWWCTe` | ID of recruiter who viewed the profile |
| View Type | Single Line Text | `fldkvGbEaVbYKG8V3` | Type of view (search_result, profile_view, etc.) |
| Billing Period | Single Line Text | `fldRtmrAFSMe3330L` | YYYY-MM format for billing cycle tracking |
| Match Score | Number (precision: 0) | `fldhUpDVRFnqve1Wv` | Match score when viewed from search results |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Carrier Driver Views': {
  'carrier_dot': 'Carrier DOT',
  'driver_id': 'Driver ID',
  'view_date': 'View Date',
  'view_duration_sec': 'View Duration Sec',
  'legacy_wix_id': 'Legacy Wix ID',
  'recruiter_id': 'Recruiter ID',
  'view_type': 'View Type',
  'billing_period': 'Billing Period',
  'match_score': 'Match Score',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
