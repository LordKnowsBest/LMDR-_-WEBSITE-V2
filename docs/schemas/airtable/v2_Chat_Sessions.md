# v2_Chat Sessions

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `[PENDING]` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Description |
|------------|------|-------------|
| User ID | Single Line Text | Wix member ID of customer |
| User Email | Single Line Text | Customer email |
| User Role | Single Line Text | Customer role |
| Topic | Single Line Text | Selected chat category |
| Status | Single Select (`queued`, `active`, `ended`, `converted`) | Current state |
| Assigned To | Single Line Text | Admin ID handling the chat |
| Created At | Date / Time | Session start |
| Updated At | Date / Time | Last activity |
| Queue Start At | Date / Time | When session entered queue |
| Active Since | Date / Time | When agent joined |
| Ended At | Date / Time | When chat was closed |
| Rating | Number | 1-5 satisfaction score |
| Ticket ID | Single Line Text | Reference to SupportTickets if converted |
| Metadata | Long Text | JSON session data |

## Backend Field Mapping (snake_case)

```javascript
'v2_Chat Sessions': {
  'user_id': 'User ID',
  'user_email': 'User Email',
  'user_role': 'User Role',
  'topic': 'Topic',
  'status': 'Status',
  'assigned_to': 'Assigned To',
  'created_at': 'Created At',
  'updated_at': 'Updated At',
  'queue_start_at': 'Queue Start At',
  'active_since': 'Active Since',
  'ended_at': 'Ended At',
  'rating': 'Rating',
  'ticket_id': 'Ticket ID',
  'metadata': 'Metadata'
},
```
