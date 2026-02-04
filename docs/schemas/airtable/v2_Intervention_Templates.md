# v2_Intervention Templates

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblXXXXXX` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Carrier DOT | Single Line Text | `fldXXXXXX` | DOT number of carrier (blank for system defaults) |
| Risk Type | Single Select (`SILENCE_SIGNAL`, `DETRACTOR_NPS`, `PAY_VOLATILITY`, `BURNOUT_RISK`, `SAFETY_INCIDENT`) | `fldXXXXXX` | Type of retention risk this template addresses |
| Template Name | Single Line Text | `fldXXXXXX` | Human-readable template name |
| Channel | Single Select (`sms`, `email`) | `fldXXXXXX` | Communication channel for delivery |
| Subject Line | Single Line Text | `fldXXXXXX` | Email subject line (empty for SMS) |
| Body Template | Long Text / Multiline | `fldXXXXXX` | Template body with {{variable}} placeholders |
| Tone | Single Select (`empathetic`, `professional`, `urgent`) | `fldXXXXXX` | Communication tone/style |
| Is Default | Checkbox | `fldXXXXXX` | True if this is a system-provided default template |
| Usage Count | Number (Integer) | `fldXXXXXX` | Number of times this template has been used |
| Success Rate | Number (Integer) | `fldXXXXXX` | Percentage of interventions with "improved" outcome (0-100) |
| Is Active | Checkbox | `fldXXXXXX` | Soft delete flag - false means deleted |
| Legacy Wix ID | Single Line Text | `fldXXXXXX` | Original Wix _id for migration reference |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Intervention Templates': {
  'carrier_dot': 'Carrier DOT',
  'risk_type': 'Risk Type',
  'template_name': 'Template Name',
  'channel': 'Channel',
  'subject_line': 'Subject Line',
  'body_template': 'Body Template',
  'tone': 'Tone',
  'is_default': 'Is Default',
  'usage_count': 'Usage Count',
  'success_rate': 'Success Rate',
  'is_active': 'Is Active',
  'legacy_wix_id': 'Legacy Wix ID',
},
```

## Template Variables

The following variables can be used in `Body Template` and `Subject Line`:

| Variable | Description |
|----------|-------------|
| `{{firstName}}` | Driver's first name |
| `{{lastName}}` | Driver's last name |
| `{{carrierName}}` | Carrier company name |
| `{{recruiterName}}` | Recruiter's name |
| `{{recruiterPhone}}` | Recruiter's phone number |
| `{{lastPayAmount}}` | Driver's last pay amount (for PAY_VOLATILITY) |

## Notes

- Default templates have blank `Carrier DOT` and `Is Default` = true
- Carriers can create custom templates that override defaults
- Default templates cannot be edited or deleted
- Success rate is automatically recalculated when intervention outcomes are logged
- Auto-generated schema documentation
- Generated: 2026-02-04
