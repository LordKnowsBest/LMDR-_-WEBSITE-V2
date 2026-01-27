# v2_FMCSA Safety Data

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tbllWTOZjIXWyLCgX` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Carrier DOT | Number (precision: 0) | `fld3wsiUe2H6gUrY9` | Linked carrier DOT |
| Safety Data | Long Text / Multiline | `fldPXOyjQCX9NAclK` | JSON FMCSA safety payload |
| BASIC Scores | Long Text / Multiline | `flddJSgqI30S6XOkb` | JSON BASIC scores |
| Fetched Date | Date | `fldZeN6pqQqKMMaD5` | When data was fetched |
| Expires Date | Date | `fldkKixDBCZT3w1Xn` | TTL expiration date |
| Legacy Wix ID | Single Line Text | `fld19iXhlp6pcYPQ8` | Original Wix _id for migration reference |
| DOT Number | Single Line Text | `fld7olXBCG856RL6l` | FMCSA DOT Number (text format) |
| Legal Name | Single Line Text | `flddtU2VNBMuAYGRb` | Official carrier legal name from FMCSA |
| DBA Name | Single Line Text | `fldoDGaJudbfnRbg5` | Doing Business As name if any |
| Operating Status | Single Line Text | `fldpQa4WhToO6uICG` | AUTHORIZED or NOT AUTHORIZED |
| Is Authorized | Single Select (`Yes`, `No`) | `flduWm3MQjuogpVt1` | Quick authorization check |
| Safety Rating | Single Line Text | `fldHfww7EznwtqsVr` | SATISFACTORY, CONDITIONAL, UNSATISFACTORY, or NOT RATED |
| Safety Rating Code | Single Line Text | `fldjqpJqmEZ60g3iP` | S/C/U/N rating code |
| Safety Rating Date | Single Line Text | `fldsvOxdgIgN8nEbU` | When the safety rating was assigned |
| Total Drivers | Number (precision: 0) | `fldItYrhfH6wtyLVs` | Driver count from FMCSA |
| Total Power Units | Number (precision: 0) | `fldIMJ6qkZRHL3WsQ` | Fleet size from FMCSA |
| City | Single Line Text | `fldc2ln9zVkxHI4DL` | Physical address city |
| State | Single Line Text | `fld2RUZHuoa4l3wwJ` | Physical address state |
| ZIP | Single Line Text | `fld3RngbZAvvciZ0k` | Physical address ZIP code |
| MC Number | Single Line Text | `fldXWSjynMnhf9gsO` | Motor Carrier number |
| Telephone | Single Line Text | `fldFVNYXsOeAkJqdf` | Carrier phone number |
| MCS-150 Date | Single Line Text | `fldCkdnUnbXgna4BT` | Last MCS-150 update date |
| Has BASIC Alerts | Single Select (`Yes`, `No`) | `fld2LyrPQ8SiAoSPt` | Quick check for any BASIC alerts |
| Inspections | Long Text / Multiline | `fldCBUAgIsMR98sSv` | JSON string of inspection data |
| Crashes | Long Text / Multiline | `fldy0K6CLo2gRUzII` | JSON string of crash data |
| Lookup Count | Number (precision: 0) | `fldr2glWdHB8HwHSz` | How many times this carrier was looked up |
| Last Lookup Date | Date | `fldIqb50xXUkFEC41` | Last lookup timestamp |
| Data Source | Single Line Text | `fldYuqhRzXopjWVwd` | Always FMCSA_SAFER_API |
| MCS150 Mileage Year | Number (precision: 0) | `fldOiQkesFlFv3rsZ` | MCS-150 mileage year |
| Safety Review Date | Date | `fldOx0k5iVVzgbKFl` | Safety review date |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_FMCSA Safety Data': {
  'carrier_dot': 'Carrier DOT',
  'safety_data': 'Safety Data',
  'basic_scores': 'BASIC Scores',
  'fetched_date': 'Fetched Date',
  'expires_date': 'Expires Date',
  'legacy_wix_id': 'Legacy Wix ID',
  'dot_number': 'DOT Number',
  'legal_name': 'Legal Name',
  'dba_name': 'DBA Name',
  'operating_status': 'Operating Status',
  'is_authorized': 'Is Authorized',
  'safety_rating': 'Safety Rating',
  'safety_rating_code': 'Safety Rating Code',
  'safety_rating_date': 'Safety Rating Date',
  'total_drivers': 'Total Drivers',
  'total_power_units': 'Total Power Units',
  'city': 'City',
  'state': 'State',
  'zip': 'ZIP',
  'mc_number': 'MC Number',
  'telephone': 'Telephone',
  'mcs_150_date': 'MCS-150 Date',
  'has_basic_alerts': 'Has BASIC Alerts',
  'inspections': 'Inspections',
  'crashes': 'Crashes',
  'lookup_count': 'Lookup Count',
  'last_lookup_date': 'Last Lookup Date',
  'data_source': 'Data Source',
  'mcs150_mileage_year': 'MCS150 Mileage Year',
  'safety_review_date': 'Safety Review Date',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
