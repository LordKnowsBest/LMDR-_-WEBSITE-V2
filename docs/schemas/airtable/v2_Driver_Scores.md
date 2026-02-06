# v2_Driver Scores

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | TBD |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| carrier_dot | Number (precision: 0) | TBD | DOT number of carrier (FK) |
| driver_id | Single Line Text | TBD | Reference to FleetDrivers |
| period_start | Date | TBD | Start date of scoring period |
| period_end | Date | TBD | End date of scoring period |
| period_type | Single Select (`weekly`, `monthly`, `quarterly`) | TBD | Type of scoring period |
| overall_score | Number (precision: 0) | TBD | Composite score 0-100 |
| safety_score | Number (precision: 0) | TBD | Safety component score 0-100 |
| safety_details | Long Text / Multiline | TBD | JSON: incidents/violations/metrics |
| efficiency_score | Number (precision: 0) | TBD | Efficiency component score 0-100 |
| efficiency_details | Long Text / Multiline | TBD | JSON: mpg/idle_time/route_adherence |
| service_score | Number (precision: 0) | TBD | Service component score 0-100 |
| service_details | Long Text / Multiline | TBD | JSON: on_time/damage_claims/customer_feedback |
| compliance_score | Number (precision: 0) | TBD | Compliance component score 0-100 |
| compliance_details | Long Text / Multiline | TBD | JSON: hos_violations/inspection_results |
| rank | Number (precision: 0) | TBD | Rank within carrier fleet |
| trend | Single Select (`improving`, `stable`, `declining`) | TBD | Performance trend direction |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Driver Scores': {
  'carrier_dot': 'carrier_dot',
  'driver_id': 'driver_id',
  'period_start': 'period_start',
  'period_end': 'period_end',
  'period_type': 'period_type',
  'overall_score': 'overall_score',
  'safety_score': 'safety_score',
  'safety_details': 'safety_details',
  'efficiency_score': 'efficiency_score',
  'efficiency_details': 'efficiency_details',
  'service_score': 'service_score',
  'service_details': 'service_details',
  'compliance_score': 'compliance_score',
  'compliance_details': 'compliance_details',
  'rank': 'rank',
  'trend': 'trend',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-02-05
