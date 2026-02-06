# v2_Notification Rules

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblNotificationRules001` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Name | Single Line Text | `fldNotifRuleName001` | Rule name |
| Description | Long Text / Multiline | `fldNotifRuleDesc001` | Rule purpose |
| Is Active | Checkbox | `fldNotifRuleIsActive001` | Whether rule is active |
| Trigger Event | Single Select (`driver.registered`, `match.new`, `match.accepted`, `document.uploaded`, `carrier.verified`, `payment.received`) | `fldNotifRuleTrigger001` | Event that fires notification |
| Conditions | Long Text / Multiline | `fldNotifRuleConditions001` | JSON array of additional conditions |
| Channels | Long Text / Multiline | `fldNotifRuleChannels001` | JSON array of delivery channel configs |
| Throttling | Long Text / Multiline | `fldNotifRuleThrottling001` | JSON rate limiting rules |
| Scheduling | Long Text / Multiline | `fldNotifRuleScheduling001` | JSON timing rules (delay, quiet hours) |
| Content | Long Text / Multiline | `fldNotifRuleContent001` | JSON notification content by channel |
| Priority | Single Select (`high`, `medium`, `low`) | `fldNotifRulePriority001` | Notification priority level |
| Created By | Single Line Text | `fldNotifRuleCreatedBy001` | Admin ID who created |
| Created Date | Date | `fldNotifRuleCreatedDate001` | Creation timestamp |
| Updated Date | Date | `fldNotifRuleUpdatedDate001` | Last modification |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Notification Rules': {
  'name': 'Name',
  'description': 'Description',
  'is_active': 'Is Active',
  'trigger_event': 'Trigger Event',
  'conditions': 'Conditions',
  'channels': 'Channels',
  'throttling': 'Throttling',
  'scheduling': 'Scheduling',
  'content': 'Content',
  'priority': 'Priority',
  'created_by': 'Created By',
  'created_date': 'Created Date',
  'updated_date': 'Updated Date',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-02-04
