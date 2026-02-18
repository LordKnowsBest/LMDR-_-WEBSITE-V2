# v2_AB Tests

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | TBD |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields (Expected by Current Backend)

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
| Winner ID | Single Line Text | TBD | Declared winner variant ID |
| Created At | Date with time | TBD | Creation timestamp |
| Updated At | Date with time | TBD | Last modification |

## Suggested Views / Indexes

- Unique Key: `Key`
- Views by `Status` (`draft`, `running`, `paused`, `completed`)
- Sort by `Updated At desc`

## Backend Field Mapping (camelCase used in code)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_AB Tests': {
  'key': 'Key',
  'name': 'Name',
  'description': 'Description',
  'status': 'Status',
  'variants': 'Variants',
  'trafficAllocation': 'Traffic Allocation',
  'targetAudience': 'Target Audience',
  'primaryMetric': 'Primary Metric',
  'secondaryMetrics': 'Secondary Metrics',
  'startDate': 'Start Date',
  'endDate': 'End Date',
  'minSampleSize': 'Min Sample Size',
  'confidenceLevel': 'Confidence Level',
  'createdBy': 'Created By',
  'results': 'Results',
  'winnerId': 'Winner ID',
  'createdAt': 'Created At',
  'updatedAt': 'Updated At',
},
```

## Notes

- Updated for `admin_platform_config_20260120` implementation
- Updated: 2026-02-18
