# v2_Feature Registry

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tbl14sM9Rsab13MBz` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Feature ID | Single Line Text | `fldOnUst5cWOJMAeI` | - |
| Display Name | Single Line Text | `fldqqfP2ZEtZ3dISI` | - |
| Description | Long Text / Multiline | `fldWENlydnRx46Pkw` | - |
| Category | Single Line Text | `fldXTlJFscAI3QNA2` | - |
| Launch Date | Single Line Text | `fldwL1Pg9RxbSqQ07` | - |
| Status | Single Line Text | `fldLZlN3tMVXuE8wa` | - |
| Expected Usage Pattern | Single Line Text | `fldkKbUiBNiL4xcQB` | - |
| Target Roles | Long Text / Multiline | `fldAeqyUo46EXZplM` | - |
| Owner | Single Line Text | `fldgT3Gz4AjM4vQE8` | - |
| Success Metric | Single Line Text | `fldBiGNLDRnIA0ZNw` | - |
| Retirement Threshold | Number (precision: 0) | `fld4q3axV7434ZW2T` | - |
| Related Features | Long Text / Multiline | `fldQzNaw27uYwBwFB` | - |
| Documentation URL | Single Line Text | `fld2GpRy57cGc1huh` | - |
| Wix ID | Single Line Text | `fldTeQ6kLjls7pBY5` | - |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Feature Registry': {
  'feature_id': 'Feature ID',
  'display_name': 'Display Name',
  'description': 'Description',
  'category': 'Category',
  'launch_date': 'Launch Date',
  'status': 'Status',
  'expected_usage_pattern': 'Expected Usage Pattern',
  'target_roles': 'Target Roles',
  'owner': 'Owner',
  'success_metric': 'Success Metric',
  'retirement_threshold': 'Retirement Threshold',
  'related_features': 'Related Features',
  'documentation_url': 'Documentation URL',
  'wix_id': 'Wix ID',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
