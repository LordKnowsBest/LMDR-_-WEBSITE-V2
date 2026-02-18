# v2_Anomaly Rules

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | TBD |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields (Expected by Current Backend)

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Name | Single Line Text | TBD | Rule name |
| Type | Single Line Text | TBD | Rule type identifier |
| Metric | Single Line Text | TBD | Monitored metric |
| Condition | Single Line Text | TBD | Condition operator (`ratio_gt`, `ratio_lt`, etc.) |
| Threshold | Number (precision: 4) | TBD | Trigger threshold |
| Window Minutes | Number (precision: 0) | TBD | Lookback window in minutes |
| Severity | Single Select | TBD | `info`, `warning`, `critical` |
| Enabled | Checkbox | TBD | Rule enabled state |
| Cooldown Minutes | Number (precision: 0) | TBD | Alert spam cooldown window |
| Notify Email | Checkbox | TBD | Email on trigger |
| Notify Dashboard | Checkbox | TBD | Dashboard notification on trigger |
| Created At | Date with time | TBD | Creation timestamp |
| Updated At | Date with time | TBD | Last update timestamp |

## Backend Field Mapping (camelCase used in code)

```javascript
'v2_Anomaly Rules': {
  'name': 'Name',
  'type': 'Type',
  'metric': 'Metric',
  'condition': 'Condition',
  'threshold': 'Threshold',
  'windowMinutes': 'Window Minutes',
  'severity': 'Severity',
  'enabled': 'Enabled',
  'cooldownMinutes': 'Cooldown Minutes',
  'notifyEmail': 'Notify Email',
  'notifyDashboard': 'Notify Dashboard',
  'createdAt': 'Created At',
  'updatedAt': 'Updated At',
},
```

