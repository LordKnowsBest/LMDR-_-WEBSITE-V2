# Client Carriers

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblTRApW1GqJzq6Oo` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Client Name | Single Line Text | `flddZbPayOqLBWTLX` | - |
| Supported Lane | Single Select (`OTR`, `Local`, `Regional`) | `fldP2x7Et3iEethFl` | - |
| Carrier DOT Number | Linked Records → tblASqYQdQ5Jt5PFU | `fldWtfNsCqHXpKFRh` | - |
| Legal Name | Long Text / Multiline | `fldM14CozAQv53B0i` | - |
| Email | Email | `fldh0oyAb1tRX7nQY` | - |
| Phone Number | Phone Number | `fldxY01jotSM6mGRM` | - |
| Linked Carrier | Linked Records → tblASqYQdQ5Jt5PFU | `fldbA9wu3L527u8kA` | - |
| Primary Contact | Single Line Text | `flduUbfvdazvhDeKV` | - |
| Agreement Date | Date | `fldKPukDMDG1hUwBd` | - |
| Hiring Area | Long Text / Multiline | `fldwrQ2XPgYVEezVo` | - |
| Job Listings | Long Text / Multiline | `fldgC2znIzuWXhOAM` | - |
| Status | Single Select (`Active`, `Inactive`, `Pending`, `Terminated`) | `fldn4TNCDO9KHuj0k` | - |
| SLA / Notes | Long Text / Multiline | `fldE7pRkrxRgSynce` | - |
| Rating | Rating | `fldUmYpnHaSD1uTta` | - |
| Jobs | Single Line Text | `fldoBAFB5DWeK3eKp` | - |
| Carrier Performance Reviews | Single Line Text | `fldDUSpxIFZuyCgWV` | - |
| Carrier Primary Contact | Single Line Text | `fldlXr5vX222a8rsV` | - |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'Client Carriers': {
  'client_name': 'Client Name',
  'supported_lane': 'Supported Lane',
  'carrier_dot_number': 'Carrier DOT Number',
  'legal_name': 'Legal Name',
  'email': 'Email',
  'phone_number': 'Phone Number',
  'linked_carrier': 'Linked Carrier',
  'primary_contact': 'Primary Contact',
  'agreement_date': 'Agreement Date',
  'hiring_area': 'Hiring Area',
  'job_listings': 'Job Listings',
  'status': 'Status',
  'sla_notes': 'SLA / Notes',
  'rating': 'Rating',
  'jobs': 'Jobs',
  'carrier_performance_reviews': 'Carrier Performance Reviews',
  'carrier_primary_contact': 'Carrier Primary Contact',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
