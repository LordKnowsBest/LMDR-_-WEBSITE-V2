# v2_Recruiter Carriers

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblTmVE8Ng1Ed4Td1` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Recruiter ID | Single Line Text | `fldqBqJ5lkXOGyLJ7` | Wix member ID of recruiter |
| Carrier DOT | Number (precision: 0) | `fldi39YpW7BeH9RZu` | Associated carrier DOT |
| Role | Single Select (`owner`, `admin`, `recruiter`) | `fldeslbXHxbjcdnPs` | Recruiter role for this carrier |
| Added Date | Date | `fldTr8e6z2OZaauyc` | When link was created |
| Legacy Wix ID | Single Line Text | `fldXB9rsDKAK0Hubf` | Original Wix _id for migration reference |
| Carrier Name | Single Line Text | `fldkMS81zQVTyuAhv` | Carrier name for display |
| Is Active | Single Select (`Yes`, `No`) | `fldNFtjHIK3a2eOGg` | Whether the carrier is active |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Recruiter Carriers': {
  'recruiter_id': 'Recruiter ID',
  'carrier_dot': 'Carrier DOT',
  'role': 'Role',
  'added_date': 'Added Date',
  'legacy_wix_id': 'Legacy Wix ID',
  'carrier_name': 'Carrier Name',
  'is_active': 'Is Active',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
