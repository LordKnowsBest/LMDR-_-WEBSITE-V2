# v2_Survey Config

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `[PENDING]` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Description |
|------------|------|-------------|
| Trigger Type | Single Line Text | Trigger key (e.g., ticket_resolved) |
| Survey Type | Single Line Text | nps, csat, etc. |
| Is Active | Checkbox | Whether trigger is enabled |
| Cooldown Days | Number | Min days between surveys per user |
| Sample Rate | Number | % of eligible users to survey (0-100) |
| Updated At | Date / Time | Last config update |

## Backend Field Mapping (snake_case)

```javascript
'v2_Survey Config': {
  'trigger_type': 'Trigger Type',
  'survey_type': 'Survey Type',
  'is_active': 'Is Active',
  'cooldown_days': 'Cooldown Days',
  'sample_rate': 'Sample Rate',
  'updated_at': 'Updated At'
},
```
