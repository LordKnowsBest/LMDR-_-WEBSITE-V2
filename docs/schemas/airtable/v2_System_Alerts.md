# v2_System Alerts

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblEQe6jyPG2FlGek` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Wix ID | Single Line Text | `fldp87n8j8NWWAT8z` | Original Wix record _id |
| Type | Single Line Text | `fldbD8DYwooXDrOxX` | Alert type |
| Message | Long Text / Multiline | `fldthnvPLvQzHWsCU` | Alert message |
| Source | Single Line Text | `fld5dcGefCwpgAVWC` | Alert source system |
| Severity | Single Line Text | `fldta8Z8TkNo8EwH4` | Alert severity level |
| Resolved | Single Line Text | `fldFx0r07z6Rc6n2a` | Whether alert is resolved (true/false) |
| Resolved By | Single Line Text | `fldhApApF247oIGGZ` | User who resolved the alert |
| Resolved At | Single Line Text | `fldAgn6wBlCQN1RuS` | Resolution timestamp (ISO 8601) |
| Created At | Single Line Text | `fldF0ATq7iC7BXK1I` | Alert creation timestamp (ISO 8601) |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_System Alerts': {
  'wix_id': 'Wix ID',
  'type': 'Type',
  'message': 'Message',
  'source': 'Source',
  'severity': 'Severity',
  'resolved': 'Resolved',
  'resolved_by': 'Resolved By',
  'resolved_at': 'Resolved At',
  'created_at': 'Created At',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
