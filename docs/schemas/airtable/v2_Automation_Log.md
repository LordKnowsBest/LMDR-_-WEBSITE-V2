# v2_Automation Log

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblXXXXXX` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Rule ID | Single Line Text | `fldXXXXXX` | Reference to the automation rule that was executed |
| Carrier DOT | Single Line Text | `fldXXXXXX` | DOT number of the carrier |
| Driver ID | Single Line Text | `fldXXXXXX` | ID of the driver affected by the automation |
| Interest ID | Single Line Text | `fldXXXXXX` | Reference to the DriverCarrierInterests record |
| Trigger Event | Single Select (`status_change`, `document_uploaded`, `cdl_verified`, `background_check_clear`, `no_response_7d`, `driver_message`) | `fldXXXXXX` | Event that triggered the rule |
| From Stage | Single Select (`interested`, `applied`, `in_review`, `contacted`, `offer`, `hired`, `rejected`, `withdrawn`) | `fldXXXXXX` | Pipeline stage before automation |
| To Stage | Single Select (`interested`, `applied`, `in_review`, `contacted`, `offer`, `hired`, `rejected`, `withdrawn`) | `fldXXXXXX` | Pipeline stage after automation (blank if no transition) |
| Executed At | Date/Time | `fldXXXXXX` | Timestamp when the automation was executed |
| Success | Checkbox | `fldXXXXXX` | Whether the automation executed successfully |
| Error Message | Long Text / Multiline | `fldXXXXXX` | Error details if execution failed |
| Legacy Wix ID | Single Line Text | `fldXXXXXX` | Original Wix _id for migration reference |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Automation Log': {
  'rule_id': 'Rule ID',
  'carrier_dot': 'Carrier DOT',
  'driver_id': 'Driver ID',
  'interest_id': 'Interest ID',
  'trigger_event': 'Trigger Event',
  'from_stage': 'From Stage',
  'to_stage': 'To Stage',
  'executed_at': 'Executed At',
  'success': 'Success',
  'error_message': 'Error Message',
  'legacy_wix_id': 'Legacy Wix ID',
},
```

## Notes

- Logs every automation rule execution for audit and debugging
- Failed executions (Success = false) include error details in Error Message
- Query by Carrier DOT to see automation history for a specific carrier
- Used by `getAutomationLog(carrierDot)` to display recent automation activity
- Auto-generated schema documentation
- Generated: 2026-02-04
