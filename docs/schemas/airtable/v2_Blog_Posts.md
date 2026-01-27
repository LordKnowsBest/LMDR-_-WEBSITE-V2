# v2_Blog Posts

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblIXXLjolC12H1od` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Title | Single Line Text | `fldtSBC1p5U5g2sbO` | Blog post title |
| Slug | Single Line Text | `fld14ohr2xeM42KSh` | URL slug |
| Content | Long Text / Multiline | `fld9yx5bsb1U8qpWG` | Post content (HTML/markdown) |
| Excerpt | Long Text / Multiline | `fldZpP5po7d7B9qYA` | Short excerpt |
| Category | Single Line Text | `fldDTrgRmx2IgqYv5` | Category name |
| Tags | Single Line Text | `fld3roSSdwWUPXqTm` | Comma-separated tags |
| Status | Single Select (`draft`, `published`, `archived`) | `fldlWpdoivxzuFQiH` | Publication status |
| Published Date | Date | `fldsL4qSKbcRzaj1Q` | Publication date |
| Legacy Wix ID | Single Line Text | `fldWxUak7cLecdYAy` | Original Wix _id for migration reference |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Blog Posts': {
  'title': 'Title',
  'slug': 'Slug',
  'content': 'Content',
  'excerpt': 'Excerpt',
  'category': 'Category',
  'tags': 'Tags',
  'status': 'Status',
  'published_date': 'Published Date',
  'legacy_wix_id': 'Legacy Wix ID',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
