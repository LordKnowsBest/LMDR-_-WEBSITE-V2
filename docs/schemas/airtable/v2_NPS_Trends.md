# v2_NPS Trends

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `[PENDING]` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Description |
|------------|------|-------------|
| Period Date | Single Line Text | e.g. "2026-02-17" |
| Granularity | Single Select (`daily`, `weekly`, `monthly`) | Time bucket |
| NPS Score | Number | Calculated score for period |
| Total Responses | Number | Count of responses in period |
| Promoters | Number | Count of promoters |
| Detractors | Number | Count of detractors |

## Backend Field Mapping (snake_case)

```javascript
'v2_NPS Trends': {
  'period_date': 'Period Date',
  'granularity': 'Granularity',
  'nps_score': 'NPS Score',
  'total_responses': 'Total Responses',
  'promoters': 'Promoters',
  'detractors': 'Detractors'
},
```
