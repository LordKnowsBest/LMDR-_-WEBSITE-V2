# v2_Survey Responses

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `Pending Creation` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Description |
|------------|------|-------------|
| Survey ID | Link to `v2_Survey Definitions` | The survey being responded to |
| Driver ID | Link to `v2_Driver Profiles` | The driver responding |
| Carrier ID | Link to `v2_Carriers` | The carrier associated with the survey |
| Scores | Long Text | JSON object of scores (e.g., `{'q1': 5, 'q2': 4}`) |
| Comments | Long Text | Open-ended feedback |
| Legacy Wix ID | Single Line Text | - |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Survey Responses': {
  'survey_id': 'Survey ID',
  'driver_id': 'Driver ID',
  'carrier_id': 'Carrier ID',
  'scores': 'Scores',
  'comments': 'Comments',
  'legacy_wix_id': 'Legacy Wix ID'
},
```

## Notes

- Part of "Driver Lifecycle & Disposition Intelligence" track
- Stores driver feedback for the "Algorithm Feedback Loop"
