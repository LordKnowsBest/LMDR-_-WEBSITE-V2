# v2_NPS Responses

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `[PENDING]` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Description |
|------------|------|-------------|
| User ID | Single Line Text | ID of the respondent |
| User Email | Single Line Text | Email of the respondent |
| User Role | Single Line Text | Role (driver, carrier, etc.) |
| Score | Number | Feedback score (0-10) |
| Comment | Long Text / Multiline | Optional feedback text |
| Category | Single Select (`promoter`, `detractor`, `passive`) | Calculated category |
| Survey Type | Single Select (`nps`, `csat`, `ces`) | Type of satisfaction survey |
| Trigger Type | Single Select (`ticket_resolved`, `chat_ended`, `periodic`) | What triggered the survey |
| Created At | Date / Time | Response timestamp |
| Metadata | Long Text / Multiline | JSON for contextual data |

## Backend Field Mapping (snake_case)

```javascript
'v2_NPS Responses': {
  'user_id': 'User ID',
  'user_email': 'User Email',
  'user_role': 'User Role',
  'score': 'Score',
  'comment': 'Comment',
  'category': 'Category',
  'survey_type': 'Survey Type',
  'trigger_type': 'Trigger Type',
  'created_at': 'Created At',
  'metadata': 'Metadata'
},
```
