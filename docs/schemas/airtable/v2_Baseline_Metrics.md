# v2_Baseline Metrics

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | TBD |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields (Expected by Current Backend)

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Metric | Single Line Text | TBD | Metric key (`errors`, `latency`, etc.) |
| Source | Single Line Text | TBD | Source service/system |
| Hour Of Day | Number (precision: 0) | TBD | UTC hour segment |
| Day Of Week | Number (precision: 0) | TBD | UTC day segment (0-6) |
| Mean | Number (precision: 4) | TBD | Baseline average |
| Std Dev | Number (precision: 4) | TBD | Baseline standard deviation |
| Sample Count | Number (precision: 0) | TBD | Number of observations |
| Last Updated | Date with time | TBD | Last baseline refresh |

## Backend Field Mapping (camelCase used in code)

```javascript
'v2_Baseline Metrics': {
  'metric': 'Metric',
  'source': 'Source',
  'hourOfDay': 'Hour Of Day',
  'dayOfWeek': 'Day Of Week',
  'mean': 'Mean',
  'stdDev': 'Std Dev',
  'sampleCount': 'Sample Count',
  'lastUpdated': 'Last Updated',
},
```

