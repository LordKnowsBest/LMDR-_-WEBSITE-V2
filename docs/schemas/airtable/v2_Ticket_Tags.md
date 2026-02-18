# v2_Ticket Tags

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `[PENDING]` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Description |
|------------|------|-------------|
| Tag Name | Single Line Text | The label (e.g., "Urgent", "Bug") |
| Color | Single Line Text | HEX code or Tailwind class |
| Usage Count | Number | Times used across tickets |

## Backend Field Mapping (snake_case)

```javascript
'v2_Ticket Tags': {
  'tag_name': 'Tag Name',
  'color': 'Color',
  'usage_count': 'Usage Count'
},
```
