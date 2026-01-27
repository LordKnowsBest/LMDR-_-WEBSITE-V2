# v2_Incident Reports

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblJXGGiynfjTJ0t5` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Incident Number | Single Line Text | `fldhXvt3YdcdaqDkZ` | - |
| Carrier DOT | Single Line Text | `fldvrNwXGHrsrdOmK` | - |
| Incident Type | Single Line Text | `fldDg30Exq1qsGs8u` | - |
| Incident Date | Single Line Text | `fld6fk94TX4CKQwRg` | - |
| Reported Date | Single Line Text | `fldcZVLT97QkmYhXR` | - |
| Driver ID | Single Line Text | `fldSSL6HAZ2brLeZn` | - |
| Driver Name | Single Line Text | `fldf8jR3pHg4uwHKi` | - |
| Vehicle ID | Single Line Text | `fldUmC0uRQ2ZqG9rw` | - |
| Location | Long Text / Multiline | `fldmAxwmlo52fBh37` | - |
| Description | Long Text / Multiline | `fldyzeVbND0pWwTSN` | - |
| Severity | Single Line Text | `fld5sPl3rvz92j95R` | - |
| DOT Reportable | Single Line Text | `fld6E5jgNcqRLRcbc` | - |
| DOT Report Status | Single Line Text | `fldu9UYJ1H12KSy9f` | - |
| Investigation Status | Single Line Text | `fldQCA1Teh4Pya6fK` | - |
| Root Cause | Long Text / Multiline | `fldk7uy0nl9SNCfqi` | - |
| Corrective Actions | Long Text / Multiline | `flds1pGIguZ5MvGDa` | - |
| Wix ID | Single Line Text | `fldvkBqbbAOi5msUm` | - |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Incident Reports': {
  'incident_number': 'Incident Number',
  'carrier_dot': 'Carrier DOT',
  'incident_type': 'Incident Type',
  'incident_date': 'Incident Date',
  'reported_date': 'Reported Date',
  'driver_id': 'Driver ID',
  'driver_name': 'Driver Name',
  'vehicle_id': 'Vehicle ID',
  'location': 'Location',
  'description': 'Description',
  'severity': 'Severity',
  'dot_reportable': 'DOT Reportable',
  'dot_report_status': 'DOT Report Status',
  'investigation_status': 'Investigation Status',
  'root_cause': 'Root Cause',
  'corrective_actions': 'Corrective Actions',
  'wix_id': 'Wix ID',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
