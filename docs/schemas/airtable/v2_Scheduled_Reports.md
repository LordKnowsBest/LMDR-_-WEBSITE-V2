# v2_Scheduled Reports

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | TBD |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields (Expected by Current Backend)

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Name | Single Line Text | TBD | Schedule name |
| Report Type | Single Line Text | TBD | Template/report type |
| Frequency | Single Select | TBD | `daily`, `weekly`, `monthly` |
| Day Of Week | Number (precision: 0) | TBD | For weekly runs (0-6 UTC) |
| Day Of Month | Number (precision: 0) | TBD | For monthly runs (1-28) |
| Time Of Day | Single Line Text | TBD | UTC HH:mm execution time |
| Format | Single Select | TBD | Output format (`csv`, `json`, `pdf`) |
| Filters | Long Text / JSON | TBD | Serialized report filters |
| Recipients | Long Text / JSON | TBD | Email recipient array |
| Enabled | Checkbox | TBD | Schedule active state |
| Last Run | Date with time | TBD | Last execution timestamp |
| Next Run | Date with time | TBD | Next execution timestamp |
| Created By | Single Line Text | TBD | Admin creator |
| Created At | Date with time | TBD | Creation timestamp |
| Updated At | Date with time | TBD | Last update timestamp |

## Backend Field Mapping (camelCase used in code)

```javascript
'v2_Scheduled Reports': {
  'name': 'Name',
  'reportType': 'Report Type',
  'frequency': 'Frequency',
  'dayOfWeek': 'Day Of Week',
  'dayOfMonth': 'Day Of Month',
  'timeOfDay': 'Time Of Day',
  'format': 'Format',
  'filters': 'Filters',
  'recipients': 'Recipients',
  'enabled': 'Enabled',
  'lastRun': 'Last Run',
  'nextRun': 'Next Run',
  'createdBy': 'Created By',
  'createdAt': 'Created At',
  'updatedAt': 'Updated At',
},
```

