# v2_FAQs

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblEAENXYM4Q3gEC0` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Question | Single Line Text | `fldieAXQRX3bXjLWC` | FAQ question |
| Answer | Long Text / Multiline | `fldF7VyVncU3GDj7R` | FAQ answer |
| Category | Single Line Text | `fldBQL8HGqKRGg5dK` | FAQ category |
| Order | Number (precision: 0) | `fldOySAcJe8PfYGnc` | Display order |
| Legacy Wix ID | Single Line Text | `fldoGPUR9WeQveBTy` | Original Wix _id for migration reference |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_FAQs': {
  'question': 'Question',
  'answer': 'Answer',
  'category': 'Category',
  'order': 'Order',
  'legacy_wix_id': 'Legacy Wix ID',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
