# v2_Notification Queue

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblNotificationQueue001` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields (Expected by Current Backend)

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Rule ID | Single Line Text | `fldNotifQueueRuleID001` | FK to Notification Rules |
| User ID | Single Line Text | `fldNotifQueueUserID001` | Recipient Wix member ID |
| Channel | Single Select (`email`, `sms`, `push`, `in_app`) | `fldNotifQueueChannel001` | Delivery channel |
| Event Data | Long Text / Multiline | `fldNotifQueueEventData001` | JSON event payload |
| Channel Config | Long Text / Multiline | `fldNotifQueueChannelConfig001` | JSON channel config |
| Status | Single Select (`pending`, `sent`, `failed`) | `fldNotifQueueStatus001` | Current status |
| Scheduled For | Date with time | `fldNotifQueueScheduledFor001` | When to send |
| Sent At | Date with time | `fldNotifQueueSentAt001` | Actual send time |
| Priority | Single Select (`high`, `medium`, `low`) | `fldNotifQueuePriority001` | Notification priority level |
| Attempts | Number (precision: 0) | `fldNotifQueueAttempts001` | Retry attempts |
| Max Attempts | Number (precision: 0) | `fldNotifQueueMaxAttempts001` | Retry cap |
| Error | Single Line Text | `fldNotifQueueError001` | Error message if failed |
| Created At | Date with time | `fldNotifQueueCreatedAt001` | Record creation timestamp |
| Updated At | Date with time | `fldNotifQueueUpdatedAt001` | Last update timestamp |

## Suggested Views / Indexes

- Views by `Status` (`pending`, `failed`, `sent`)
- View sorted by `Priority desc`, `Scheduled For asc`
- View filtered where `Scheduled For <= now`

## Backend Field Mapping (camelCase used in code)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Notification Queue': {
  'ruleId': 'Rule ID',
  'userId': 'User ID',
  'channel': 'Channel',
  'eventData': 'Event Data',
  'channelConfig': 'Channel Config',
  'status': 'Status',
  'scheduledFor': 'Scheduled For',
  'sentAt': 'Sent At',
  'priority': 'Priority',
  'attempts': 'Attempts',
  'maxAttempts': 'Max Attempts',
  'error': 'Error',
  'createdAt': 'Created At',
  'updatedAt': 'Updated At',
},
```

## Notes

- Updated for `admin_platform_config_20260120` implementation
- Updated: 2026-02-18
