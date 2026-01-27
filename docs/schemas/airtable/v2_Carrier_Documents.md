# v2_Carrier Documents

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblVgdlHQTIpy9ifX` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Title | Single Line Text | `fldEOAWqVes8oNdQL` | - |
| Carrier DOT | Single Line Text | `fldhNpS1VrcorsBZ2` | - |
| Driver ID | Single Line Text | `fld9aep2SQsWqFP6X` | - |
| Document Type | Single Line Text | `fldbLw0at53TkcDCj` | - |
| Document Category | Single Line Text | `fldufOfRHrg3JZn7b` | - |
| File URL | URL | `fldbafJYDBuqWr4Me` | - |
| File Name | Single Line Text | `fldKYQgwdGuVTkmXL` | - |
| File Size | Number (precision: 0) | `fldKMRJTnfvcaA1cp` | - |
| MIME Type | Single Line Text | `fldDJWJhQsSREZ70p` | - |
| Days Until Expiry | Number (precision: 0) | `fld6Pzx6NVgsowqfD` | - |
| Version | Number (precision: 0) | `fldBOhjIaEaIIrtz2` | - |
| Previous Version ID | Single Line Text | `fldTkTxFE1GPbGeGp` | - |
| Status | Single Line Text | `fldVnS8TQbvaIYGy6` | - |
| Verification Status | Single Line Text | `fldN68Uj6Gm1XS70l` | - |
| Verified By | Single Line Text | `fldxjp42LbkpCoxeJ` | - |
| Notes | Long Text / Multiline | `fldd9HjI2VAOeUF1J` | - |
| Tags | Long Text / Multiline | `fldFaQ8SmKdgNAgm6` | - |
| Wix ID | Single Line Text | `fldex3YIWCWwqk0tA` | - |
| Issue Date | Date | `fld9EK45iYrTHOK7L` | - |
| Expiration Date | Date | `fld5R3VeG80hN1edp` | - |
| Verified Date | Single Line Text | `fld8xksSqU8ke1tBt` | DateTime stored as ISO string |
| Is Expired | Single Line Text | `flde7in8cfPSsHu9e` | Boolean stored as true/false string |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Carrier Documents': {
  'title': 'Title',
  'carrier_dot': 'Carrier DOT',
  'driver_id': 'Driver ID',
  'document_type': 'Document Type',
  'document_category': 'Document Category',
  'file_url': 'File URL',
  'file_name': 'File Name',
  'file_size': 'File Size',
  'mime_type': 'MIME Type',
  'days_until_expiry': 'Days Until Expiry',
  'version': 'Version',
  'previous_version_id': 'Previous Version ID',
  'status': 'Status',
  'verification_status': 'Verification Status',
  'verified_by': 'Verified By',
  'notes': 'Notes',
  'tags': 'Tags',
  'wix_id': 'Wix ID',
  'issue_date': 'Issue Date',
  'expiration_date': 'Expiration Date',
  'verified_date': 'Verified Date',
  'is_expired': 'Is Expired',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
