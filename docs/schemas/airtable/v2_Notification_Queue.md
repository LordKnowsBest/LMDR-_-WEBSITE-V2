# v2_Notification Queue

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblNotificationQueue001` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Queue ID | Single Line Text | `fldNotifQueueID001` | Auto-generated unique ID |
| Rule ID | Single Line Text | `fldNotifQueueRuleID001` | FK to Notification Rules |
| User ID | Single Line Text | `fldNotifQueueUserID001` | Recipient Wix member ID |
| Channel | Single Select (`email`, `sms`, `push`, `in_app`) | `fldNotifQueueChannel001` | Delivery channel |
| Content | Long Text / Multiline | `fldNotifQueueContent001` | JSON rendered notification content |
| Status | Single Select (`pending`, `sent`, `failed`, `cancelled`) | `fldNotifQueueStatus001` | Current status |
| Scheduled For | Date | `fldNotifQueueScheduledFor001` | When to send |
| Sent At | Date | `fldNotifQueueSentAt001` | Actual send time |
| Priority | Single Select (`high`, `medium`, `low`) | `fldNotifQueuePriority001` | Notification priority level |
| Error Message | Single Line Text | `fldNotifQueueError001` | Error message if failed |
| Created Date | Date | `fldNotifQueueCreatedDate001` | Record creation timestamp |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Notification Queue': {
  'queue_id': 'Queue ID',
  'rule_id': 'Rule ID',
  'user_id': 'User ID',
  'channel': 'Channel',
  'content': 'Content',
  'status': 'Status',
  'scheduled_for': 'Scheduled For',
  'sent_at': 'Sent At',
  'priority': 'Priority',
  'error_message': 'Error Message',
  'created_date': 'Created Date',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-02-04
