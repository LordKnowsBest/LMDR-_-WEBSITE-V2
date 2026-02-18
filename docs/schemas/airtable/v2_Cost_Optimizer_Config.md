# v2_Cost Optimizer Config

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | TBD |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields (Expected by Current Backend)

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Config ID | Single Line Text | TBD | Singleton id (`global`) |
| Enabled | Checkbox | TBD | Master optimizer toggle |
| Quality Threshold | Number (precision: 2) | TBD | Minimum quality score for eligibility |
| Max Cost Per Request | Number (precision: 4) | TBD | Cost ceiling for optimizer candidates |
| Preferred Providers | Long Text / JSON | TBD | JSON array of preferred provider ids |
| Excluded Providers | Long Text / JSON | TBD | JSON array of blocked provider ids |
| Updated At | Date with time | TBD | Last update timestamp |
| Updated By | Single Line Text | TBD | Admin who changed config |

## Backend Field Mapping (camelCase used in code)

```javascript
'v2_Cost Optimizer Config': {
  'configId': 'Config ID',
  'enabled': 'Enabled',
  'qualityThreshold': 'Quality Threshold',
  'maxCostPerRequest': 'Max Cost Per Request',
  'preferredProviders': 'Preferred Providers',
  'excludedProviders': 'Excluded Providers',
  'updatedAt': 'Updated At',
  'updatedBy': 'Updated By',
},
```

