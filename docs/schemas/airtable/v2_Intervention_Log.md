# v2_Intervention Log

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblXXXXXX` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Template ID | Single Line Text | `fldXXXXXX` | Reference to the intervention template used |
| Driver ID | Single Line Text | `fldXXXXXX` | ID of the driver who received the intervention |
| Recruiter ID | Single Line Text | `fldXXXXXX` | Wix member ID of recruiter who sent the intervention |
| Carrier DOT | Single Line Text | `fldXXXXXX` | DOT number of the carrier |
| Sent At | Date/Time | `fldXXXXXX` | Timestamp when intervention was sent |
| Channel Used | Single Select (`sms`, `email`) | `fldXXXXXX` | Communication channel used for delivery |
| Message Sent | Long Text / Multiline | `fldXXXXXX` | Rendered message content that was actually sent |
| Outcome | Single Select (`improved`, `no_change`, `worsened`, `unknown`) | `fldXXXXXX` | Result of the intervention |
| Outcome Date | Date/Time | `fldXXXXXX` | When the outcome was recorded |
| Is Active | Checkbox | `fldXXXXXX` | Soft delete flag - false means deleted |
| Legacy Wix ID | Single Line Text | `fldXXXXXX` | Original Wix _id for migration reference |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Intervention Log': {
  'template_id': 'Template ID',
  'driver_id': 'Driver ID',
  'recruiter_id': 'Recruiter ID',
  'carrier_dot': 'Carrier DOT',
  'sent_at': 'Sent At',
  'channel_used': 'Channel Used',
  'message_sent': 'Message Sent',
  'outcome': 'Outcome',
  'outcome_date': 'Outcome Date',
  'is_active': 'Is Active',
  'legacy_wix_id': 'Legacy Wix ID',
},
```

## Outcome Values

| Outcome | Description |
|---------|-------------|
| `improved` | Driver engagement/retention improved after intervention |
| `no_change` | No measurable change in driver behavior |
| `worsened` | Situation deteriorated after intervention |
| `unknown` | Default state - outcome not yet recorded |

## Notes

- Outcome starts as `unknown` and is updated via `logInterventionOutcome()`
- When outcome is logged, the associated template's success_rate is recalculated
- Success rate = (improved interventions / total interventions with known outcome) * 100
- `Message Sent` contains the fully rendered template with variables substituted
- Auto-generated schema documentation
- Generated: 2026-02-04
