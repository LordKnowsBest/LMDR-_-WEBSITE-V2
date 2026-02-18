# v2_Compliance Reports

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | TBD |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields (Expected by Current Backend)

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Report Type | Single Line Text | TBD | `admin_activity`, `data_access`, `security_events`, etc. |
| Name | Single Line Text | TBD | Report display name |
| Description | Long Text / Multiline | TBD | Optional report description |
| Date Range Start | Date with time | TBD | Start of included data window |
| Date Range End | Date with time | TBD | End of included data window |
| Filters | Long Text / JSON | TBD | Serialized filter payload |
| Format | Single Select | TBD | `csv`, `json`, `pdf` |
| Status | Single Select | TBD | `generating`, `completed`, `failed`, `expired` |
| File URL | URL / Text | TBD | Storage URL or internal reference |
| File Content | Long Text / Multiline | TBD | Inline payload for internal downloads |
| File Size | Number (precision: 0) | TBD | Size in bytes/characters |
| Record Count | Number (precision: 0) | TBD | Number of exported records |
| Requested By | Single Line Text | TBD | Requesting admin |
| Requested At | Date with time | TBD | Request timestamp |
| Completed At | Date with time | TBD | Completion timestamp |
| Expires At | Date with time | TBD | Download expiry timestamp |
| Scheduled ID | Single Line Text | TBD | Optional foreign key to scheduled report |
| Error Message | Long Text / Multiline | TBD | Generation failure details |

## Backend Field Mapping (camelCase used in code)

```javascript
'v2_Compliance Reports': {
  'reportType': 'Report Type',
  'name': 'Name',
  'description': 'Description',
  'dateRangeStart': 'Date Range Start',
  'dateRangeEnd': 'Date Range End',
  'filters': 'Filters',
  'format': 'Format',
  'status': 'Status',
  'fileUrl': 'File URL',
  'fileContent': 'File Content',
  'fileSize': 'File Size',
  'recordCount': 'Record Count',
  'requestedBy': 'Requested By',
  'requestedAt': 'Requested At',
  'completedAt': 'Completed At',
  'expiresAt': 'Expires At',
  'scheduledId': 'Scheduled ID',
  'errorMessage': 'Error Message',
},
```

