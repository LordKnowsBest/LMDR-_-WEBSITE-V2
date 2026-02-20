# v2_Social Audit Log

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | TBD |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields (Expected by Current Backend)

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Event Type | Single Select (`post_dispatched`, `post_published`, `post_failed`, `post_retried`, `post_dead_lettered`, `token_refreshed`, `token_health_alert`, `kill_switch_triggered`) | TBD | Audit event name |
| Platform | Single Select (`facebook`, `instagram`, `system`) | TBD | Platform context for event |
| Actor | Single Line Text | TBD | Initiator (`system`, admin id, or service) |
| Queue Record ID | Single Line Text | TBD | Foreign key to social post queue record |
| Details | Long Text / Multiline | TBD | JSON metadata for diagnostics |
| Timestamp | Date with time | TBD | Event timestamp |

## Suggested Views / Indexes

- Timeline view sorted by `Timestamp desc`
- Incident view: `Event Type in (post_failed, post_dead_lettered, token_health_alert)`
- Queue correlation view grouped by `Queue Record ID`

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Social Audit Log': {
  'event_type': 'Event Type',
  'platform': 'Platform',
  'actor': 'Actor',
  'queue_record_id': 'Queue Record ID',
  'details': 'Details',
  'timestamp': 'Timestamp',
},
```

## Notes

- Added for `graph_api_org_posting_20260219` Phase 4.3 auditability requirements
- Updated: 2026-02-20
