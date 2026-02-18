# v2_Canned Responses

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `[PENDING]` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Description |
|------------|------|-------------|
| Title | Single Line Text | Short label for agents |
| Shortcode | Single Line Text | Keyboard shortcut (e.g. /greet) |
| Category | Single Line Text | e.g. Billing, Greeting, Closing |
| Content | Long Text / Multiline | The response body |
| Usage Count | Number | Times used by agents |
| Created At | Date / Time | Creation timestamp |
| Updated At | Date / Time | Last update timestamp |

## Backend Field Mapping (snake_case)

```javascript
'v2_Canned Responses': {
  'title': 'Title',
  'shortcode': 'Shortcode',
  'category': 'Category',
  'content': 'Content',
  'usage_count': 'Usage Count',
  'created_at': 'Created At',
  'updated_at': 'Updated At'
},
```
