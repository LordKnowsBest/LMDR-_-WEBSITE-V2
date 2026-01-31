# v2_Termination Logs

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `Pending Creation` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Description |
|------------|------|-------------|
| Driver ID | Link to `v2_Driver Profiles` | The terminated driver |
| Carrier ID | Link to `v2_Carriers` | The carrier |
| Tenure Days | Number | Days employed (Termination Date - Hire Date) |
| Is Early Churn | Checkbox | True if Tenure Days < 30 |
| Category | Single Select | `OPERATIONS`, `COMPENSATION`, `PERSONAL`, `COMPLIANCE`, `CULTURE`, `OTHER` |
| Reason Code | Single Line Text | Specific code (e.g., `PAY_DISPUTE`, `NO_FREIGHT`) |
| Notes | Long Text | Recruiter notes on termination |
| Driver Feedback | Long Text | Optional feedback from driver (if resigned) |
| Source | Single Select | `RECRUITER`, `DRIVER` |
| Rehire Eligible | Checkbox | Would the carrier hire this driver again? |
| Legacy Wix ID | Single Line Text | - |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Termination Logs': {
  'driver_id': 'Driver ID',
  'carrier_id': 'Carrier ID',
  'tenure_days': 'Tenure Days',
  'is_early_churn': 'Is Early Churn',
  'category': 'Category',
  'reason_code': 'Reason Code',
  'notes': 'Notes',
  'driver_feedback': 'Driver Feedback',
  'source': 'Source',
  'rehire_eligible': 'Rehire Eligible',
  'legacy_wix_id': 'Legacy Wix ID'
},
```

## Notes

- Part of "Driver Lifecycle & Disposition Intelligence" track
- Captures granular "Truth Source" for churn analysis
