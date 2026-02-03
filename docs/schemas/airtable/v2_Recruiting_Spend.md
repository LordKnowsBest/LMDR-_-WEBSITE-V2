# v2_Recruiting Spend

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tbl_recruiting_spend` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Description |
|------------|------|-------------|
| Carrier DOT | Single Line Text | Carrier DOT number |
| Recruiter ID | Single Line Text | FK to Members (recruiter) |
| Period Start | Date | Spend period start |
| Period End | Date | Spend period end |
| Channel | Single Line Text | indeed, facebook, google, etc. |
| Campaign Name | Single Line Text | Optional campaign identifier |
| Spend Amount | Number | Amount in cents |
| Currency | Single Line Text | Currency code (default: USD) |
| Impressions | Number | Ad impressions |
| Clicks | Number | Ad clicks |
| Applications | Number | Applications from this spend |
| Hires | Number | Hires attributed to this spend |
| Cost Per Application | Number | Calculated: spend / applications |
| Cost Per Hire | Number | Calculated: spend / hires |
| Import Method | Single Line Text | manual, csv_upload, api_sync |
| Notes | Long Text | Optional notes |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Recruiting Spend': {
  'carrier_dot': 'Carrier DOT',
  'recruiter_id': 'Recruiter ID',
  'period_start': 'Period Start',
  'period_end': 'Period End',
  'channel': 'Channel',
  'campaign_name': 'Campaign Name',
  'spend_amount': 'Spend Amount',
  'currency': 'Currency',
  'impressions': 'Impressions',
  'clicks': 'Clicks',
  'applications': 'Applications',
  'hires': 'Hires',
  'cost_per_application': 'Cost Per Application',
  'cost_per_hire': 'Cost Per Hire',
  'import_method': 'Import Method',
  'notes': 'Notes',
},
```

## Notes

- Created for Recruiter Analytics Track
- Generated: 2026-01-30
