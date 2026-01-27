# v2_Partner Onboarding

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tbl8VGIqRlnSE3LhW` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Partner Name | Single Line Text | `fld0bIhFPTZ64OdyG` | Partner company name |
| Contact Email | Email | `fldwFuq5AIlwEFPFQ` | Primary contact email |
| Contact Phone | Phone Number | `fld8SZonDMpAeDNMw` | Primary contact phone |
| Status | Single Select (`pending`, `in_progress`, `completed`, `stalled`) | `fldsPaWFOwsQ44wRA` | Onboarding status |
| Step | Number (precision: 0) | `fldSO3S8FkF6lUpRs` | Current onboarding step |
| Started Date | Date | `fldwD2cuTy23ssAIH` | When onboarding started |
| Legacy Wix ID | Single Line Text | `fldPPQqxUsPsPsux3` | Original Wix _id for migration reference |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Partner Onboarding': {
  'partner_name': 'Partner Name',
  'contact_email': 'Contact Email',
  'contact_phone': 'Contact Phone',
  'status': 'Status',
  'step': 'Step',
  'started_date': 'Started Date',
  'legacy_wix_id': 'Legacy Wix ID',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
