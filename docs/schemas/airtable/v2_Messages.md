# v2_Messages

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tbl0WqKWIlZvSb0Z6` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Sender ID | Single Line Text | `fldM8109qKfYQPwHM` | Wix member ID of sender |
| Recipient ID | Single Line Text | `fldgCGD5rhd59KR2J` | Wix member ID of recipient |
| Subject | Single Line Text | `fldDRx7B3Xir9V848` | Message subject |
| Body | Long Text / Multiline | `fld5CH640SonGPlde` | Message content |
| Read | Single Select (`Yes`, `No`) | `fldwuFzoE9igwyF5t` | Message read status |
| Sent Date | Date | `fldFVnWK8IJSYSsZE` | When message was sent |
| Legacy Wix ID | Single Line Text | `fldMclzs2XjD1tyeV` | Original Wix _id for migration reference |
| Application ID | Single Line Text | `fldlgxE2gCbNsUCgG` | Wix application_id linking message to application context |
| Sender Type | Single Line Text | `fldRi2wn1ZmuCzGMY` | Type of sender (driver, recruiter, etc.) |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Messages': {
  'sender_id': 'Sender ID',
  'recipient_id': 'Recipient ID',
  'subject': 'Subject',
  'body': 'Body',
  'read': 'Read',
  'sent_date': 'Sent Date',
  'legacy_wix_id': 'Legacy Wix ID',
  'application_id': 'Application ID',
  'sender_type': 'Sender Type',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
