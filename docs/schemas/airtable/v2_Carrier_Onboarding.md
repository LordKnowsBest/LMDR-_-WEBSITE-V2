# v2_Carrier Onboarding

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblzELQ1Kbbmsmf44` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Carrier DOT | Number (precision: 0) | `fldyf8E8kS4AH6yNc` | Carrier DOT number |
| Company Name | Single Line Text | `fldAnHChfvKNUX8QV` | Carrier company name |
| Contact Email | Email | `fldIU0GpjRxBPXC93` | Primary contact email |
| Status | Single Select (`pending`, `in_progress`, `completed`, `stalled`) | `fldFdrhz0l6sVgbcv` | Onboarding status |
| Step | Number (precision: 0) | `fldlCY2GYWW8WPmkz` | Current onboarding step |
| Started Date | Date | `fldbGlPmCLR1cIw72` | When onboarding started |
| Legacy Wix ID | Single Line Text | `fldgCcsgz6SFmP3dK` | Original Wix _id for migration reference |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Carrier Onboarding': {
  'carrier_dot': 'Carrier DOT',
  'company_name': 'Company Name',
  'contact_email': 'Contact Email',
  'status': 'Status',
  'step': 'Step',
  'started_date': 'Started Date',
  'legacy_wix_id': 'Legacy Wix ID',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
