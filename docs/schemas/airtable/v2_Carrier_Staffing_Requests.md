# v2_Carrier Staffing Requests

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tbljbMzcysYTk8PT8` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Company Name | Single Line Text | `fldjkndA8XPklYV2O` | Requesting company name |
| Contact Name | Single Line Text | `fldVIoYTGWSgnr7wL` | Contact person name |
| Email | Email | `fldjg1dQFmJDaxqeK` | Contact email |
| Phone | Phone Number | `fld7ZncN5EJXDfoA6` | Contact phone |
| DOT Number | Number (precision: 0) | `fldhS3jiUOkiYKN7F` | Carrier DOT if provided |
| Staffing Type | Single Select (`emergency`, `strategic`) | `fld97JDic2VtMAiG0` | Type of staffing need |
| Drivers Needed | Number (precision: 0) | `fldwAuYVYPRSHiUOH` | Number of drivers needed |
| Notes | Long Text / Multiline | `fldGofjoRLVk3ugcz` | Additional notes |
| Status | Single Select (`new`, `contacted`, `qualified`, `converted`, `closed`) | `fldsuHN3mog3OdEs1` | Lead status |
| Submitted Date | Date | `fldKRFO7Sk3qi2nAm` | When request was submitted |
| Legacy Wix ID | Single Line Text | `fldgSVLffkDOa3YCy` | Original Wix _id for migration reference |
| Driver Types | Single Line Text | `fldzJMdlb2VFV4oOp` | Driver types needed (JSON array as string) |
| Linked Carrier ID | Single Line Text | `fldfDz38bvexQsHRi` | Reference to Carriers table (Wix _id) |
| Last Updated | Date | `fldWS4ry6gKbbfgOo` | Last update timestamp |
| Source | Single Line Text | `fldWMf9MAgTa7JpRy` | Lead source identifier |
| Source URL | URL | `fld308zIY3HjANIgB` | URL of the source page |
| Status History | Long Text / Multiline | `fldcqcKBxL7ZOHG7C` | JSON string of status history |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Carrier Staffing Requests': {
  'company_name': 'Company Name',
  'contact_name': 'Contact Name',
  'email': 'Email',
  'phone': 'Phone',
  'dot_number': 'DOT Number',
  'staffing_type': 'Staffing Type',
  'drivers_needed': 'Drivers Needed',
  'notes': 'Notes',
  'status': 'Status',
  'submitted_date': 'Submitted Date',
  'legacy_wix_id': 'Legacy Wix ID',
  'driver_types': 'Driver Types',
  'linked_carrier_id': 'Linked Carrier ID',
  'last_updated': 'Last Updated',
  'source': 'Source',
  'source_url': 'Source URL',
  'status_history': 'Status History',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
