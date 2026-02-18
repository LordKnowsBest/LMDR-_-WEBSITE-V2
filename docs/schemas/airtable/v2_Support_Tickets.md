# v2_Support Tickets

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `[PENDING]` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Description |
|------------|------|-------------|
| Ticket Number | Single Line Text | Unique identifier (e.g., TKT-123456) |
| Subject | Single Line Text | Ticket subject line |
| Description | Long Text / Multiline | Detailed issue description |
| Status | Single Select (`open`, `pending`, `resolved`, `closed`) | Current ticket status |
| Priority | Single Select (`low`, `medium`, `high`, `urgent`) | Support priority level |
| Category | Single Line Text | Issue category (billing, technical, etc.) |
| User ID | Single Line Text | ID of the user who created the ticket |
| User Email | Single Line Text | Email of the user |
| User Role | Single Line Text | Role of the user (driver, carrier, recruiter) |
| Assigned To | Single Line Text | Admin User ID assigned to the ticket |
| Created At | Date / Time | Creation timestamp |
| Updated At | Date / Time | Last update timestamp |
| Response Due | Date / Time | SLA deadline for first response |
| Resolution Due | Date / Time | SLA deadline for resolution |
| Resolved At | Date / Time | When the ticket was marked resolved |
| Is Escalated | Checkbox | Whether the ticket has been escalated |
| Escalation Reason | Long Text / Multiline | Reason for escalation |
| Metadata | Long Text / Multiline | JSON blob for additional data |

## Backend Field Mapping (snake_case)

```javascript
'v2_Support Tickets': {
  'ticket_number': 'Ticket Number',
  'subject': 'Subject',
  'description': 'Description',
  'status': 'Status',
  'priority': 'Priority',
  'category': 'Category',
  'user_id': 'User ID',
  'user_email': 'User Email',
  'user_role': 'User Role',
  'assigned_to': 'Assigned To',
  'created_at': 'Created At',
  'updated_at': 'Updated At',
  'response_due': 'Response Due',
  'resolution_due': 'Resolution Due',
  'resolved_at': 'Resolved At',
  'is_escalated': 'Is Escalated',
  'escalation_reason': 'Escalation Reason',
  'metadata': 'Metadata'
},
```
