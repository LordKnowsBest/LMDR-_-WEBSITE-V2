# v2_Qualification Files

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tbl4kd5AVgFfUBXbA` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Driver Name | Single Line Text | `fldq7W1bEYs4j5atr` | - |
| Carrier DOT | Single Line Text | `fldRtNkkAVWlKbBHc` | - |
| Driver ID | Single Line Text | `fldDXJcXrWQYBGzvU` | - |
| Completeness Score | Number (precision: 0) | `fldTmREmSuIHmN49w` | - |
| Status | Single Line Text | `fldZ0KbdPvVdR1jAC` | - |
| Last Audit Date | Single Line Text | `fldUfvjToLfls3GK0` | - |
| Checklist | Long Text / Multiline | `fldnJlhZtPf1UjBHI` | - |
| Missing Items | Long Text / Multiline | `fldNPaiuqvos91H0h` | - |
| Expiring Soon | Long Text / Multiline | `fldAS6m58lIA5yhYZ` | - |
| Alerts | Long Text / Multiline | `fld8mxwAD2RYEiDgt` | - |
| Wix ID | Single Line Text | `fldWfPdQ8IsYpsoVT` | - |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Qualification Files': {
  'driver_name': 'Driver Name',
  'carrier_dot': 'Carrier DOT',
  'driver_id': 'Driver ID',
  'completeness_score': 'Completeness Score',
  'status': 'Status',
  'last_audit_date': 'Last Audit Date',
  'checklist': 'Checklist',
  'missing_items': 'Missing Items',
  'expiring_soon': 'Expiring Soon',
  'alerts': 'Alerts',
  'wix_id': 'Wix ID',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
