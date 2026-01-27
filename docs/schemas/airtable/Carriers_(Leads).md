# Carriers (Leads)

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tbleRNuznju5bh6qI` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Company | Long Text / Multiline | `fld5wyhYjk3Xq4wx3` | - |
| DOT | Number (precision: 0) | `fldmfGI1RlvgSxPk3` | - |
| Phone | Phone Number | `fldsy553pQPUkDBVF` | - |
| Email | Long Text / Multiline | `fldd4gcoOReGxqaCF` | - |
| Email Domain (formula) | Formula → singleLineText | `fld6GctwnRPexJprr` | - |
| Power Units | Number (precision: 1) | `fldNHAe58PJzQKAVa` | - |
| Region Tag | Single Select (`WI`, `FL`, `CA`, `PA`, `TX`, `IL`, `CO`, `OK`, `RI`, `WY`, `IN`, `AR`, `AL`, `MT`, `NY`, `NC`, `VA`, `MI`, `WV`, `KS`, `MA`, `WA`, `GA`, `AZ`, `OH`, `TN`, `NE`, `NH`, `MO`, `MN`, `CT`, `OR`, `MD`, `NJ`, `NL`, `HI`, `SD`, `ID`, `LA`, `KY`, `ON`, `ND`, `SC`, `NV`, `UT`, `IA`, `DE`, `MS`, `NM`, `TA`, `AK`, `BC`, `JA`, `VT`, `PHY_STATE`, `ME`, `QC`, `PR`, `AB`, `CI`, `ZA`, `PE`, `MB`, `10000`, `GU`, `YT`, `DC`, `BN`, `MC`, `GJ`, `NB`, `SI`, `GT`, `SO`, `VC`, `CH`, `AG`, `NI`, `SK`, `NS`, `VI`, `DF`, `SL`, `AS`, `DG`, `QE`, `HD`) | `fldNgeRpkVjMmWvVF` | - |
| Status (Cold/Warm/Hot) | Single Select (`Cold`, `Warm`, `Hot`) | `fldsyyUl3n3krpo8f` | - |
| Verified | Checkbox | `fldKGUXQHSbuk5Va1` | - |
| Requests | Single Line Text | `fldmzyeeMYkU4OJry` | - |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'Carriers (Leads)': {
  'company': 'Company',
  'dot': 'DOT',
  'phone': 'Phone',
  'email': 'Email',
  'email_domain_formula': 'Email Domain (formula)',
  'power_units': 'Power Units',
  'region_tag': 'Region Tag',
  'status_cold_warm_hot': 'Status (Cold/Warm/Hot)',
  'verified': 'Verified',
  'requests': 'Requests',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
