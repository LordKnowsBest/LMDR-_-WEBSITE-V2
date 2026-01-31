# v2_Survey Definitions

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `Pending Creation` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Description |
|------------|------|-------------|
| Trigger Event | Single Select | `ORIENTATION`, `DAY_7`, `DAY_30`, `EXIT` |
| Questions | Long Text | JSON array of question objects (e.g., `[{id: 'q1', text: '...', type: 'scale'}]`) |
| Is Active | Checkbox | Whether this survey is currently being sent |
| Legacy Wix ID | Single Line Text | - |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Survey Definitions': {
  'trigger_event': 'Trigger Event',
  'questions': 'Questions',
  'is_active': 'Is Active',
  'legacy_wix_id': 'Legacy Wix ID'
},
```

## Notes

- Part of "Driver Lifecycle & Disposition Intelligence" track
- Defines automated pulse surveys sent to drivers
