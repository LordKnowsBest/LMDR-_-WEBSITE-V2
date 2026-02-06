# v2_Email Templates

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblEmailTemplates001` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Template Key | Single Line Text | `fldTemplateKey001` | Unique identifier (e.g., welcome_driver) |
| Name | Single Line Text | `fldTemplateName001` | Human-readable name |
| Category | Single Select (`onboarding`, `transactional`, `notification`, `marketing`) | `fldTemplateCategory001` | Template category |
| Subject | Single Line Text | `fldTemplateSubject001` | Email subject line (supports {{variables}}) |
| Preheader | Single Line Text | `fldTemplatePreheader001` | Preview text in email clients |
| HTML Content | Long Text / Multiline | `fldTemplateHTMLContent001` | Full HTML email content |
| Plain Text Content | Long Text / Multiline | `fldTemplatePlainText001` | Plain text fallback |
| Variables | Long Text / Multiline | `fldTemplateVariables001` | JSON array of available merge variables |
| Is Active | Checkbox | `fldTemplateIsActive001` | Whether template is in use |
| Version | Number (precision: 0) | `fldTemplateVersion001` | Version number |
| Previous Versions | Long Text / Multiline | `fldTemplatePrevVersions001` | JSON array of version history |
| Test Variants | Long Text / Multiline | `fldTemplateTestVariants001` | JSON A/B test variants (if any) |
| Created By | Single Line Text | `fldTemplateCreatedBy001` | Admin ID who created |
| Created Date | Date | `fldTemplateCreatedDate001` | Creation timestamp |
| Updated Date | Date | `fldTemplateUpdatedDate001` | Last modification |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Email Templates': {
  'template_key': 'Template Key',
  'name': 'Name',
  'category': 'Category',
  'subject': 'Subject',
  'preheader': 'Preheader',
  'html_content': 'HTML Content',
  'plain_text_content': 'Plain Text Content',
  'variables': 'Variables',
  'is_active': 'Is Active',
  'version': 'Version',
  'previous_versions': 'Previous Versions',
  'test_variants': 'Test Variants',
  'created_by': 'Created By',
  'created_date': 'Created Date',
  'updated_date': 'Updated Date',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-02-04
