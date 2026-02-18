# v2_Anomaly Alerts

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | TBD |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields (Expected by Current Backend)

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Type | Single Line Text | TBD | Alert type (`error_spike`, `latency_drift`, etc.) |
| Severity | Single Select | TBD | `info`, `warning`, `critical` |
| Source | Single Line Text | TBD | Service or source system |
| Metric | Single Line Text | TBD | Metric monitored by rule |
| Expected Value | Number | TBD | Baseline/threshold expected value |
| Actual Value | Number | TBD | Measured value at detection |
| Deviation | Number (precision: 4) | TBD | Relative deviation from expected |
| Message | Long Text / Multiline | TBD | Human-readable anomaly message |
| Detected At | Date with time | TBD | Detection timestamp |
| Resolved At | Date with time | TBD | Resolution timestamp |
| Resolution Notes | Long Text / Multiline | TBD | Optional resolver notes |
| Acknowledged | Checkbox | TBD | Acknowledgement state |
| Acknowledged At | Date with time | TBD | Acknowledgement timestamp |
| Auto Resolved | Checkbox | TBD | True if auto-resolved |
| Escalated | Checkbox | TBD | True if escalated after SLA breach |
| Escalated At | Date with time | TBD | Escalation timestamp |

## Backend Field Mapping (camelCase used in code)

```javascript
'v2_Anomaly Alerts': {
  'type': 'Type',
  'severity': 'Severity',
  'source': 'Source',
  'metric': 'Metric',
  'expectedValue': 'Expected Value',
  'actualValue': 'Actual Value',
  'deviation': 'Deviation',
  'message': 'Message',
  'detectedAt': 'Detected At',
  'resolvedAt': 'Resolved At',
  'resolutionNotes': 'Resolution Notes',
  'acknowledged': 'Acknowledged',
  'acknowledgedAt': 'Acknowledged At',
  'autoResolved': 'Auto Resolved',
  'escalated': 'Escalated',
  'escalatedAt': 'Escalated At',
},
```

