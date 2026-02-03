# v2_Competitor Intel

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tbl_competitor_intel` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Description |
|------------|------|-------------|
| Competitor Name | Single Line Text | Carrier name |
| Competitor DOT | Single Line Text | DOT number (if known) |
| Intel Date | Date | Date info gathered |
| Source URL | URL | Job posting URL |
| Source Type | Single Line Text | job_posting, manual_entry, scrape |
| Region | Single Line Text | Geographic region |
| Job Type | Single Line Text | OTR, regional, local |
| CPM Min | Number | Minimum CPM |
| CPM Max | Number | Maximum CPM |
| Weekly Min | Number | Minimum weekly pay |
| Weekly Max | Number | Maximum weekly pay |
| Sign On Bonus | Number | Bonus amount |
| Sign On Terms | Long Text | Bonus terms |
| Benefits Summary | Long Text | Benefits highlights |
| Home Time | Single Line Text | Home time policy |
| Equipment Age | Single Line Text | Truck age |
| Requirements | Long Text / JSON | Requirements JSON |
| Verified | Checkbox | Verified flag |
| Verified By | Single Line Text | Verifier user ID |
| Notes | Long Text | Additional notes |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Competitor Intel': {
  'competitor_name': 'Competitor Name',
  'competitor_dot': 'Competitor DOT',
  'intel_date': 'Intel Date',
  'source_url': 'Source URL',
  'source_type': 'Source Type',
  'region': 'Region',
  'job_type': 'Job Type',
  'cpm_min': 'CPM Min',
  'cpm_max': 'CPM Max',
  'weekly_min': 'Weekly Min',
  'weekly_max': 'Weekly Max',
  'sign_on_bonus': 'Sign On Bonus',
  'sign_on_terms': 'Sign On Terms',
  'benefits_summary': 'Benefits Summary',
  'home_time': 'Home Time',
  'equipment_age': 'Equipment Age',
  'requirements': 'Requirements',
  'verified': 'Verified',
  'verified_by': 'Verified By',
  'notes': 'Notes',
},
```

## Notes

- Created for Recruiter Analytics Track
- Generated: 2026-01-30
