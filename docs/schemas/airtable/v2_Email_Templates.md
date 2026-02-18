# v2_Email Templates

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblEmailTemplates001` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields (Expected by Current Backend)

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
| Created At | Date with time | `fldTemplateCreatedDate001` | Creation timestamp |
| Updated At | Date with time | `fldTemplateUpdatedDate001` | Last modification |

## Suggested Views / Indexes

- Unique Key: `Template Key`
- Filtered views by `Category`, `Is Active`
- Sort by `Updated At desc`

## Backend Field Mapping (camelCase used in code)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Email Templates': {
  'templateKey': 'Template Key',
  'name': 'Name',
  'category': 'Category',
  'subject': 'Subject',
  'preheader': 'Preheader',
  'htmlContent': 'HTML Content',
  'plainTextContent': 'Plain Text Content',
  'variables': 'Variables',
  'isActive': 'Is Active',
  'version': 'Version',
  'previousVersions': 'Previous Versions',
  'testVariants': 'Test Variants',
  'createdBy': 'Created By',
  'createdAt': 'Created At',
  'updatedAt': 'Updated At',
},
```

## Notes

- Updated for `admin_platform_config_20260120` implementation
- Updated: 2026-02-18
