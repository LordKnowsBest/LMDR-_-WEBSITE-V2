# v2_Article Versions

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `[PENDING]` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Description |
|------------|------|-------------|
| Article ID | Single Line Text | Reference to KnowledgeArticles._id |
| Content | Long Text / Multiline | Article body at this version |
| Title | Single Line Text | Title at this version |
| Version Number | Number | Sequential version |
| Created By | Single Line Text | Admin ID who saved this version |
| Created At | Date / Time | Save timestamp |
| Change Summary | Long Text | Description of updates |

## Backend Field Mapping (snake_case)

```javascript
'v2_Article Versions': {
  'article_id': 'Article ID',
  'content': 'Content',
  'title': 'Title',
  'version_number': 'Version Number',
  'created_by': 'Created By',
  'created_at': 'Created At',
  'change_summary': 'Change Summary'
},
```
