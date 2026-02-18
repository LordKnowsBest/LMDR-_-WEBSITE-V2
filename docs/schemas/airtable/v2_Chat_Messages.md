# v2_Chat Messages

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `[PENDING]` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Description |
|------------|------|-------------|
| Session ID | Single Line Text | Reference to ChatSessions._id |
| Sender ID | Single Line Text | Author ID |
| Sender Email | Single Line Text | Author email |
| Sender Type | Single Select (`user`, `agent`, `system`) | Type of message author |
| Content | Long Text / Multiline | Message body |
| Created At | Date / Time | Message timestamp |

## Backend Field Mapping (snake_case)

```javascript
'v2_Chat Messages': {
  'session_id': 'Session ID',
  'sender_id': 'Sender ID',
  'sender_email': 'Sender Email',
  'sender_type': 'Sender Type',
  'content': 'Content',
  'created_at': 'Created At'
},
```
