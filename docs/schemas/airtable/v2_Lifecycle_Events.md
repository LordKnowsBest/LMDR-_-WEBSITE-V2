# v2_Lifecycle Events

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `Pending Creation` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Description |
|------------|------|-------------|
| Driver ID | Link to `v2_Driver Profiles` | The driver involved in the event |
| Carrier ID | Link to `v2_Carriers` | The carrier involved in the event |
| Event Type | Single Select | `APPLICATION_SUBMITTED`, `INTERVIEW_SCHEDULED`, `INTERVIEW_COMPLETED`, `HIRED_ACTIVE`, `ORIENTATION_COMPLETE`, `FIRST_DISPATCH`, `30_DAY_MILESTONE`, `SURVEY_SENT`, `SURVEY_COMPLETED`, `INCIDENT_REPORTED`, `TERMINATED`, `RESIGNED` |
| Event Date | Date & Time | When the event occurred |
| Metadata | Long Text | JSON string containing additional context (e.g., match score, interview slot) |
| Created By | Single Line Text | User ID who triggered the event |
| Legacy Wix ID | Single Line Text | - |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Lifecycle Events': {
  'driver_id': 'Driver ID',
  'carrier_id': 'Carrier ID',
  'event_type': 'Event Type',
  'event_date': 'Event Date',
  'metadata': 'Metadata',
  'created_by': 'Created By',
  'legacy_wix_id': 'Legacy Wix ID'
},
```

## Notes

- Part of "Driver Lifecycle & Disposition Intelligence" track
- Acts as the "Black Box" timeline for driver tenure
