# v2_CSA Score History

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblFWeKNke9gkBSAl` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Carrier DOT | Single Line Text | `fld9Lw21cQpjlTQI2` | - |
| Overall Percentile | Number (precision: 1) | `fldLwDH3Aqb7OPnU6` | - |
| BASICS Scores | Long Text / Multiline | `fldfGshrW9v5ZQ1wp` | - |
| Active Alerts | Long Text / Multiline | `fldFR4l5O4uQtehRX` | - |
| Inspections (30 Day) | Number (precision: 0) | `fldcJwvgDmcDcw5HU` | - |
| Violations (30 Day) | Number (precision: 0) | `fldg1PC207mVxjVUM` | - |
| Crashes (30 Day) | Number (precision: 0) | `fld6rQ3mjhBtTLp3B` | - |
| Trend vs Prior | Long Text / Multiline | `fldBY5uR71Tq3iO1X` | - |
| Source | Single Line Text | `fldudKVEmxNVojRDn` | - |
| Wix ID | Single Line Text | `fldTqbzBfTO8kk9HN` | - |
| Snapshot Date | Date | `fldlBd5Ph0aMmUTXr` | - |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_CSA Score History': {
  'carrier_dot': 'Carrier DOT',
  'overall_percentile': 'Overall Percentile',
  'basics_scores': 'BASICS Scores',
  'active_alerts': 'Active Alerts',
  'inspections_30_day': 'Inspections (30 Day)',
  'violations_30_day': 'Violations (30 Day)',
  'crashes_30_day': 'Crashes (30 Day)',
  'trend_vs_prior': 'Trend vs Prior',
  'source': 'Source',
  'wix_id': 'Wix ID',
  'snapshot_date': 'Snapshot Date',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
