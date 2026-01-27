# v2_Stripe Events

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblKbezKGpwRVC9wT` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Event ID | Single Line Text | `fldMCom48CfctgqU3` | Stripe event ID |
| Event Type | Single Line Text | `fld0W0TuElwh3ZnEo` | Stripe event type |
| Processed | Single Select (`Yes`, `No`) | `fldCgSQVvnHkOaGiF` | Processing status |
| Processed Date | Date | `fldFJo0fRNk8ca153` | When event was processed |
| Legacy Wix ID | Single Line Text | `fld2uMrE1viEYFf7T` | Original Wix _id for migration reference |
| Carrier DOT | Number (precision: 0) | `fldSTyb3Ai2NisFrD` | Carrier DOT number from event |
| Data Summary | Long Text / Multiline | `fldM7rG3hVnExmNVi` | JSON summary of event data (truncated) |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Stripe Events': {
  'event_id': 'Event ID',
  'event_type': 'Event Type',
  'processed': 'Processed',
  'processed_date': 'Processed Date',
  'legacy_wix_id': 'Legacy Wix ID',
  'carrier_dot': 'Carrier DOT',
  'data_summary': 'Data Summary',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
