# v2_Funnel Events

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tbl_funnel_events` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Description |
|------------|------|-------------|
| Driver ID | Single Line Text | Reference to DriverProfiles |
| Carrier DOT | Single Line Text | Carrier DOT number |
| From Stage | Single Line Text | Previous stage (null if new) |
| To Stage | Single Line Text | New stage |
| Stage Order | Number | Numeric stage position |
| Entered At | Date | When entered this stage |
| Exited At | Date | When left this stage |
| Time In Stage Hours | Number | Calculated duration |
| Drop Reason | Single Line Text | Reason for dropping out |
| Source Attribution ID | Single Line Text | FK to SourceAttribution |
| Is Conversion | Checkbox | True if this is a hire event |
| Event Metadata | Long Text / JSON | Additional context JSON |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Funnel Events': {
  'driver_id': 'Driver ID',
  'carrier_dot': 'Carrier DOT',
  'from_stage': 'From Stage',
  'to_stage': 'To Stage',
  'stage_order': 'Stage Order',
  'entered_at': 'Entered At',
  'exited_at': 'Exited At',
  'time_in_stage_hours': 'Time In Stage Hours',
  'drop_reason': 'Drop Reason',
  'source_attribution_id': 'Source Attribution ID',
  'is_conversion': 'Is Conversion',
  'event_metadata': 'Event Metadata',
},
```

## Notes

- Created for Recruiter Analytics Track
- Generated: 2026-01-30
