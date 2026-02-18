# v2_Knowledge Articles

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `[PENDING]` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Description |
|------------|------|-------------|
| Title | Single Line Text | Article title |
| Slug | Single Line Text | URL-friendly slug |
| Content | Long Text / Multiline | Article body (Markdown) |
| Category ID | Single Line Text | Reference to ArticleCategories._id |
| Subcategory ID | Single Line Text | Nested category reference |
| Status | Single Select (`draft`, `published`, `archived`) | Article state |
| Visibility | Single Select (`public`, `logged_in`, `admin_only`) | Access level |
| Author ID | Single Line Text | Creator's ID |
| Author Email | Single Line Text | Creator's email |
| Tags | Multiple Select | Search tags |
| View Count | Number | Total article views |
| Helpful Votes | Number | "Yes" votes |
| Not Helpful Votes | Number | "No" votes |
| Meta Title | Single Line Text | SEO Title override |
| Meta Description | Long Text | SEO Description |
| Related Articles | Long Text | JSON array of related article IDs |
| Created At | Date / Time | Creation timestamp |
| Updated At | Date / Time | Last update timestamp |
| Published At | Date / Time | When article went live |
| Version | Number | Current version number |

## Backend Field Mapping (snake_case)

```javascript
'v2_Knowledge Articles': {
  'title': 'Title',
  'slug': 'Slug',
  'content': 'Content',
  'category_id': 'Category ID',
  'subcategory_id': 'Subcategory ID',
  'status': 'Status',
  'visibility': 'Visibility',
  'author_id': 'Author ID',
  'author_email': 'Author Email',
  'tags': 'Tags',
  'view_count': 'View Count',
  'helpful_votes': 'Helpful Votes',
  'not_helpful_votes': 'Not Helpful Votes',
  'meta_title': 'Meta Title',
  'meta_description': 'Meta Description',
  'related_articles': 'Related Articles',
  'created_at': 'Created At',
  'updated_at': 'Updated At',
  'published_at': 'Published At',
  'version': 'Version'
},
```
