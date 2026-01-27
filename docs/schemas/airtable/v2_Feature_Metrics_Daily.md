# v2_Feature Metrics Daily

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblnha4HK9iR4LqoY` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Feature ID | Single Line Text | `fld1V02ODSyFj2wED` | - |
| Date | Single Line Text | `fld6PGuC9WVIjk9Qa` | - |
| Unique Users | Number (precision: 0) | `fldKggCc95SAGsDM2` | - |
| Total Interactions | Number (precision: 0) | `fldZc1rJn4h4DHqgj` | - |
| Completion Rate | Number (precision: 2) | `fldcO47tPBrpp67aP` | - |
| Avg Duration (ms) | Number (precision: 0) | `fldqYjiqd6tRtcvRb` | - |
| Error Rate | Number (precision: 4) | `fld8gC9vXPlIZSr0l` | - |
| Abandon Rate | Number (precision: 4) | `fld8SI9l5dOgzBrg7` | - |
| By Role | Long Text / Multiline | `fldxSraKNJiTCCSKk` | - |
| By Device | Long Text / Multiline | `fld6dNzi865JeoRAy` | - |
| By Entry Point | Long Text / Multiline | `fldILbKF3oc3Cyw9o` | - |
| Top Errors | Long Text / Multiline | `fldpFdwxzUSKTlAbw` | - |
| Conversion Value Total | Number (precision: 2) | `fldDxLtwBOM7j5m2P` | - |
| Wix ID | Single Line Text | `fld8mRFcIHnpvvbxC` | - |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Feature Metrics Daily': {
  'feature_id': 'Feature ID',
  'date': 'Date',
  'unique_users': 'Unique Users',
  'total_interactions': 'Total Interactions',
  'completion_rate': 'Completion Rate',
  'avg_duration_ms': 'Avg Duration (ms)',
  'error_rate': 'Error Rate',
  'abandon_rate': 'Abandon Rate',
  'by_role': 'By Role',
  'by_device': 'By Device',
  'by_entry_point': 'By Entry Point',
  'top_errors': 'Top Errors',
  'conversion_value_total': 'Conversion Value Total',
  'wix_id': 'Wix ID',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
