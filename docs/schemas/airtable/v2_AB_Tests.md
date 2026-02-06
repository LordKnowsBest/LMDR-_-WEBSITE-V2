# v2_AB Tests

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | TBD |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Key | Single Line Text | TBD | Unique test identifier |
| Name | Single Line Text | TBD | Human-readable name |
| Description | Long Text / Multiline | TBD | Hypothesis and test purpose |
| Status | Single Select (`draft`, `running`, `paused`, `completed`, `rolled_out`) | TBD | Current test status |
| Variants | Long Text / Multiline | TBD | JSON array of variant definitions |
| Traffic Allocation | Number (precision: 0) | TBD | % of eligible users in test (1-100) |
| Target Audience | Long Text / Multiline | TBD | JSON targeting criteria |
| Primary Metric | Long Text / Multiline | TBD | JSON: { name, type, goal } |
| Secondary Metrics | Long Text / Multiline | TBD | JSON array of metric definitions |
| Start Date | Date | TBD | When test started |
| End Date | Date | TBD | When test ended/will end |
| Min Sample Size | Number (precision: 0) | TBD | Required sample per variant |
| Confidence Level | Number (precision: 0) | TBD | Required significance (default 95) |
| Created By | Single Line Text | TBD | Admin ID who created |
| Results | Long Text / Multiline | TBD | JSON calculated results |
| Created Date | Date | TBD | Creation timestamp |
| Updated Date | Date | TBD | Last modification |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_AB Tests': {
  'key': 'Key',
  'name': 'Name',
  'description': 'Description',
  'status': 'Status',
  'variants': 'Variants',
  'traffic_allocation': 'Traffic Allocation',
  'target_audience': 'Target Audience',
  'primary_metric': 'Primary Metric',
  'secondary_metrics': 'Secondary Metrics',
  'start_date': 'Start Date',
  'end_date': 'End Date',
  'min_sample_size': 'Min Sample Size',
  'confidence_level': 'Confidence Level',
  'created_by': 'Created By',
  'results': 'Results',
  'created_date': 'Created Date',
  'updated_date': 'Updated Date',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-02-04
