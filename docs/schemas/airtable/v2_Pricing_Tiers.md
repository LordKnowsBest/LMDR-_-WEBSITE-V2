# v2_Pricing Tiers

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tbl3tjTRDgX2yqx9r` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Name | Single Line Text | `fldQNPAwAe84GuN4o` | Tier name |
| Price Monthly | Currency ($) | `flddzpxfYz6V7C9nJ` | Monthly price |
| Price 6Month | Currency ($) | `fldMJfJvoGUGycwFf` | 6-month prepaid price |
| Job Posts | Single Line Text | `fldiajavv2bScELYU` | Job posts allowed |
| Driver Views | Single Line Text | `fldswpGZsOyb6YukX` | Monthly driver views |
| Features | Long Text / Multiline | `fldLsSOJczH60QlsI` | Feature list |
| Order | Number (precision: 0) | `fld4oL6kDLkr6OR4V` | Display order |
| Legacy Wix ID | Single Line Text | `fldyYLeVn13Y8dVTV` | Original Wix _id for migration reference |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Pricing Tiers': {
  'name': 'Name',
  'price_monthly': 'Price Monthly',
  'price_6month': 'Price 6Month',
  'job_posts': 'Job Posts',
  'driver_views': 'Driver Views',
  'features': 'Features',
  'order': 'Order',
  'legacy_wix_id': 'Legacy Wix ID',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
