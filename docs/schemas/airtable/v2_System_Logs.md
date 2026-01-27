# v2_System Logs

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblad0DNsCewKmQjr` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Log ID | Single Line Text | `fldSzdfVUqHYuKP9i` | Unique log identifier |
| Level | Single Select (`debug`, `info`, `warn`, `error`) | `fldPDnkxaTqf8E3Ci` | Log level |
| Service | Single Line Text | `fld7VzGosHMTY1y6a` | Service name |
| Message | Long Text / Multiline | `fldaYWu21x5WZoTYY` | Log message |
| Log Date | Date | `fldpQ7ONlYFqe040o` | When logged |
| Legacy Wix ID | Single Line Text | `fldn5jXiNeReKvJuV` | Original Wix _id for migration reference |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_System Logs': {
  'log_id': 'Log ID',
  'level': 'Level',
  'service': 'Service',
  'message': 'Message',
  'log_date': 'Log Date',
  'legacy_wix_id': 'Legacy Wix ID',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
