# v2_Compliance Alerts

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblmDwKU5lBpC7jjB` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Carrier DOT | Single Line Text | `fldjxlq1FD3yhkBIW` | - |
| Alert Type | Single Line Text | `fldgAPV8vDJQL2Sgi` | - |
| Severity | Single Line Text | `fldCl51vl4OcWWaBE` | - |
| Title | Single Line Text | `fldhKYggz8RAvCKkt` | - |
| Message | Long Text / Multiline | `fldderILyleHgyIly` | - |
| Related Entity Type | Single Line Text | `fld2cYLUYZr9dkRX8` | - |
| Related Entity ID | Single Line Text | `fldROvc0FxOtPEXif` | - |
| Status | Single Line Text | `fldPcf3EWqCFQsqEW` | - |
| Acknowledged By | Single Line Text | `fldS2F1WVfhiRtRvD` | - |
| Acknowledged Date | Single Line Text | `fldqtpVYSKYdHqdyK` | - |
| Resolved Date | Single Line Text | `fldZc75l6IUr0EUx3` | - |
| Auto Resolve On | Single Line Text | `fldngEPTXNoU21Daq` | - |
| Wix ID | Single Line Text | `fldCphJMVO6OWqnuP` | - |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Compliance Alerts': {
  'carrier_dot': 'Carrier DOT',
  'alert_type': 'Alert Type',
  'severity': 'Severity',
  'title': 'Title',
  'message': 'Message',
  'related_entity_type': 'Related Entity Type',
  'related_entity_id': 'Related Entity ID',
  'status': 'Status',
  'acknowledged_by': 'Acknowledged By',
  'acknowledged_date': 'Acknowledged Date',
  'resolved_date': 'Resolved Date',
  'auto_resolve_on': 'Auto Resolve On',
  'wix_id': 'Wix ID',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
