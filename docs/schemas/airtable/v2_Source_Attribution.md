# v2_Source Attribution

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tbl_source_attribution` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Description |
|------------|------|-------------|
| Driver ID | Single Line Text | Reference to DriverProfiles |
| Session ID | Single Line Text | Anonymous session ID |
| Carrier DOT | Single Line Text | Carrier that hired (if applicable) |
| UTM Source | Single Line Text | Traffic source (indeed, facebook, google) |
| UTM Medium | Single Line Text | Marketing medium (cpc, cpm, email) |
| UTM Campaign | Single Line Text | Campaign name/ID |
| UTM Content | Single Line Text | Ad variation identifier |
| UTM Term | Single Line Text | Keyword |
| Referrer URL | Long Text | Full referrer URL |
| Landing Page | Long Text | First page visited |
| First Touch Source | Single Line Text | Original source |
| First Touch Date | Date | Original visit date |
| Last Touch Source | Single Line Text | Source at conversion |
| Last Touch Date | Date | Last touch before conversion |
| Conversion Date | Date | When driver applied/registered |
| Hire Date | Date | When driver was hired |
| Attribution Model | Single Line Text | first_touch, last_touch, etc. |
| Touchpoint Count | Number | Number of touchpoints |
| Touchpoint History | Long Text / JSON | Full journey [{source, date, page}] |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Source Attribution': {
  'driver_id': 'Driver ID',
  'session_id': 'Session ID',
  'carrier_dot': 'Carrier DOT',
  'utm_source': 'UTM Source',
  'utm_medium': 'UTM Medium',
  'utm_campaign': 'UTM Campaign',
  'utm_content': 'UTM Content',
  'utm_term': 'UTM Term',
  'referrer_url': 'Referrer URL',
  'landing_page': 'Landing Page',
  'first_touch_source': 'First Touch Source',
  'first_touch_date': 'First Touch Date',
  'last_touch_source': 'Last Touch Source',
  'last_touch_date': 'Last Touch Date',
  'conversion_date': 'Conversion Date',
  'hire_date': 'Hire Date',
  'attribution_model': 'Attribution Model',
  'touchpoint_count': 'Touchpoint Count',
  'touchpoint_history': 'Touchpoint History',
},
```

## Notes

- Created for Recruiter Analytics Track
- Generated: 2026-01-30
