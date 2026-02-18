# v2_Ticket Comments

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `[PENDING]` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Description |
|------------|------|-------------|
| Ticket ID | Single Line Text | Reference to SupportTickets._id |
| User ID | Single Line Text | Author of the comment |
| User Email | Single Line Text | Author's email |
| User Role | Single Line Text | Author's role |
| Content | Long Text / Multiline | Comment body |
| Is Internal | Checkbox | Visible to agents only |
| Created At | Date / Time | Creation timestamp |

## Backend Field Mapping (snake_case)

```javascript
'v2_Ticket Comments': {
  'ticket_id': 'Ticket ID',
  'user_id': 'User ID',
  'user_email': 'User Email',
  'user_role': 'User Role',
  'content': 'Content',
  'is_internal': 'Is Internal',
  'created_at': 'Created At'
},
```
