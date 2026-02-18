# v2_Notification Rules

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblNotificationRules001` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields (Expected by Current Backend)

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Name | Single Line Text | `fldNotifRuleName001` | Rule name |
| Description | Long Text / Multiline | `fldNotifRuleDesc001` | Rule purpose |
| Is Active | Checkbox | `fldNotifRuleIsActive001` | Whether rule is active |
| Trigger Event | Single Line Text | `fldNotifRuleTrigger001` | Event that fires notification (e.g. `match.new`) |
| Conditions | Long Text / Multiline | `fldNotifRuleConditions001` | JSON array of additional conditions |
| Channels | Long Text / Multiline | `fldNotifRuleChannels001` | JSON array of delivery channel configs |
| Throttling | Long Text / Multiline | `fldNotifRuleThrottling001` | JSON rate limiting rules |
| Scheduling | Long Text / Multiline | `fldNotifRuleScheduling001` | JSON timing rules (delay, quiet hours) |
| Content | Long Text / Multiline | `fldNotifRuleContent001` | JSON notification content by channel |
| Priority | Single Select (`high`, `medium`, `low`) | `fldNotifRulePriority001` | Notification priority level |
| Created By | Single Line Text | `fldNotifRuleCreatedBy001` | Admin ID who created |
| Created At | Date with time | `fldNotifRuleCreatedDate001` | Creation timestamp |
| Updated At | Date with time | `fldNotifRuleUpdatedDate001` | Last modification |

## Suggested Views / Indexes

- Filtered views by `Trigger Event`, `Is Active`, `Priority`
- Sort by `Updated At desc`

## Backend Field Mapping (camelCase used in code)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Notification Rules': {
  'name': 'Name',
  'description': 'Description',
  'isActive': 'Is Active',
  'triggerEvent': 'Trigger Event',
  'conditions': 'Conditions',
  'channels': 'Channels',
  'throttling': 'Throttling',
  'scheduling': 'Scheduling',
  'content': 'Content',
  'priority': 'Priority',
  'createdBy': 'Created By',
  'createdAt': 'Created At',
  'updatedAt': 'Updated At',
},
```

## Notes

- Updated for `admin_platform_config_20260120` implementation
- Updated: 2026-02-18
