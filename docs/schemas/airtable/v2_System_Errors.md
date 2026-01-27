# v2_System Errors

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tbl785DHUjP1y8hM4` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Wix ID | Single Line Text | `fldlTRnueiGM9mxV2` | Original Wix record _id |
| Timestamp | Single Line Text | `fldFuqdqZLOX0Hsp9` | Error timestamp (ISO 8601) |
| Level | Single Line Text | `fldU0AZowKxwrUWxW` | Log level (error, warn, info) |
| Level Num | Number (precision: 0) | `fldgxFzUDtr8jwZEa` | Numeric log level |
| Source | Single Line Text | `fldtLSDGly20MmUW3` | Error source module |
| Message | Long Text / Multiline | `fldRjBhLYCQ3JjbBU` | Error message |
| Details | Long Text / Multiline | `fld9jYXOW7WR2bOsX` | Error details as JSON |
| Trace ID | Single Line Text | `fldAVhtuWxdHoVSnT` | Distributed trace identifier |
| Span ID | Single Line Text | `flduffcI6y5yscqOf` | Span identifier |
| Parent Span ID | Single Line Text | `fldtSTIh7915RrT7T` | Parent span identifier |
| User ID | Single Line Text | `fld9HyQIvYqVadbDM` | Associated user ID |
| Session ID | Single Line Text | `fldTErFKlJRUbQQ9w` | Session identifier |
| Duration | Number (precision: 0) | `fldo40aqm7w2Htntp` | Operation duration in ms |
| Tags | Single Line Text | `fldp5yjH5rNjnXU9H` | Error tags |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_System Errors': {
  'wix_id': 'Wix ID',
  'timestamp': 'Timestamp',
  'level': 'Level',
  'level_num': 'Level Num',
  'source': 'Source',
  'message': 'Message',
  'details': 'Details',
  'trace_id': 'Trace ID',
  'span_id': 'Span ID',
  'parent_span_id': 'Parent Span ID',
  'user_id': 'User ID',
  'session_id': 'Session ID',
  'duration': 'Duration',
  'tags': 'Tags',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
