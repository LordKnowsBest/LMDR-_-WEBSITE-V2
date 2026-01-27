# v2_Profile Views

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblEfhgmaWHzLUu0y` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Carrier DOT | Number (precision: 0) | `fldn2w95M9cFDM5cs` | Viewing carrier DOT |
| Driver ID | Single Line Text | `flduvYlXaA7tqJPAE` | Viewed driver ID |
| View Date | Date | `fldteFzGYrZdGT44Q` | When profile was viewed |
| Legacy Wix ID | Single Line Text | `fldxKiSvn3j1PpSPK` | Original Wix _id for migration reference |
| Recruiter ID | Single Line Text | `fld784MANPqIvMbcr` | ID of recruiter who viewed the profile |
| View Type | Single Line Text | `fldNAEu0X7WVhToV4` | Type of view (search_result, profile_view, etc.) |
| Billing Period | Single Line Text | `fldeUmbjEdOwsQS3A` | YYYY-MM format for billing cycle tracking |
| Match Score | Number (precision: 0) | `fldifRDBuYLNBYw2E` | Match score when viewed from search results |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Profile Views': {
  'carrier_dot': 'Carrier DOT',
  'driver_id': 'Driver ID',
  'view_date': 'View Date',
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
