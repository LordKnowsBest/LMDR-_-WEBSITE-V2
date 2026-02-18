# v2_AI Provider Costs

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | TBD |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields (Expected by Current Backend)

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Provider ID | Single Line Text | TBD | Provider identifier (`anthropic`, `openai`, `google`, etc.) |
| Model ID | Single Line Text | TBD | Model identifier used by router |
| Cost Input | Number (precision: 6) | TBD | Cost per 1k input tokens |
| Cost Output | Number (precision: 6) | TBD | Cost per 1k output tokens |
| Quality Score | Number (precision: 2) | TBD | Rolling quality score (0.0 - 1.0) |
| Avg Latency Ms | Number (precision: 0) | TBD | Average observed latency in milliseconds |
| Availability Rate | Number (precision: 2) | TBD | Success rate (0.0 - 1.0) |
| Is Active | Checkbox | TBD | Eligible for optimizer routing |
| Last Updated | Date with time | TBD | Last metric refresh |

## Backend Field Mapping (camelCase used in code)

```javascript
'v2_AI Provider Costs': {
  'providerId': 'Provider ID',
  'modelId': 'Model ID',
  'costInput': 'Cost Input',
  'costOutput': 'Cost Output',
  'qualityScore': 'Quality Score',
  'avgLatencyMs': 'Avg Latency Ms',
  'availabilityRate': 'Availability Rate',
  'isActive': 'Is Active',
  'lastUpdated': 'Last Updated',
},
```

