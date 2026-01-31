# v2_Match Notification Log

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblMatchLogXXXXXX` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Carrier DOT | Single Line Text | `fldCarrierDotXXXX` | DOT number of the carrier involved |
| Driver ID | Single Line Text | `fldDriverIdXXXXXX` | Member ID of the driver |
| Notification Type | Single Select | `fldNotifTypeXXXXX` | `email`, `sms`, `in_app` |
| Channel | Single Select | `fldChannelXXXXXXX` | `profile_viewed`, `contacted`, `new_match` |
| Recipient ID | Single Line Text | `fldRecipientXXXXX` | ID of the actual recipient (Member ID or Phone) |
| Status | Single Select | `fldStatusXXXXXXX` | `sent`, `failed` |
| Error Message | Long Text | `fldErrorMsgXXXXXX` | Error details if failed |
| Metadata | Long Text | `fldMetadataXXXXXX` | JSON string with extra context |
| Sent At | Date | `fldSentAtXXXXXXXX` | When the notification was attempted |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Match Notification Log': {
  'carrier_dot': 'Carrier DOT',
  'driver_id': 'Driver ID',
  'notification_type': 'Notification Type',
  'channel': 'Channel',
  'recipient_id': 'Recipient ID',
  'status': 'Status',
  'error_message': 'Error Message',
  'metadata': 'Metadata',
  'sent_at': 'Sent At'
},
```

## Notes

- Created for Driver Utility Expansion Phase 3
- Used for debugging and Audit trails of system notifications
