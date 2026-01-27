# Carriers (Master)

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblASqYQdQ5Jt5PFU` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| DOT_NUMBER | Number (precision: 0) | `fldRE9QWtBRVbVOqs` | - |
| LEGAL_NAME | Long Text / Multiline | `fldgfr8BuYa87vwbg` | - |
| DBA_NAME | Long Text / Multiline | `fldetGYVuuH8d2ABT` | - |
| CARRIER_OPERATION | Single Select (`A`, `B`, `C`, `CARRIER_OPERATION`, `US`) | `fldKCyM27ksTME2GF` | - |
| PHY_CITY | Long Text / Multiline | `fld7X9DY2Aztq8EMP` | - |
| PHY_STATE | Single Select (`WI`, `FL`, `CA`, `PA`, `TX`, `IL`, `CO`, `OK`, `RI`, `WY`, `IN`, `AR`, `AL`, `MT`, `NY`, `NC`, `VA`, `MI`, `WV`, `KS`, `MA`, `WA`, `GA`, `AZ`, `OH`, `TN`, `NE`, `NH`, `MO`, `MN`, `CT`, `OR`, `MD`, `NJ`, `NL`, `HI`, `SD`, `ID`, `LA`, `KY`, `ON`, `ND`, `SC`, `NV`, `UT`, `IA`, `DE`, `MS`, `NM`, `TA`, `AK`, `BC`, `JA`, `VT`, `PHY_STATE`, `ME`, `QC`, `PR`, `AB`, `CI`, `ZA`, `PE`, `MB`, `10000`, `GU`, `YT`, `DC`, `BN`, `MC`, `GJ`, `NB`, `SI`, `GT`, `SO`, `VC`, `CH`, `AG`, `NI`, `SK`, `NS`, `VI`, `DF`, `SL`, `AS`, `DG`, `QE`, `HD`) | `fld5wKszhSsKBrLH7` | - |
| PHY_ZIP | Long Text / Multiline | `fldvtQ2ri7DVQzhPj` | - |
| TELEPHONE | Long Text / Multiline | `fldVXKyTul3mp4puY` | - |
| EMAIL_ADDRESS | Long Text / Multiline | `fld2kHQDcYoqN0xBv` | - |
| NBR_POWER_UNIT | Number (precision: 0) | `fldtJF5kiRlsfFZMz` | - |
| DRIVER_TOTAL | Number (precision: 0) | `fldMxZ9vXXgkUZgkU` | - |
| RECENT_MILEAGE | Number (precision: 0) | `fldckODbaYQwXzGGM` | - |
| RECENT_MILEAGE_YEAR | Number (precision: 0) | `fldLkRnWdkKO6YpUC` | - |
| PRIORITY_SCORE | Number (precision: 1) | `fld57faFFOouY8JJN` | - |
| Fleet Score | Number (precision: 1) | `fldU4ZUkLHfKPjvbR` | - |
| Ratio Score | Number (precision: 1) | `flduMrqJjolEqk9E7` | - |
| Geo Score | Number (precision: 1) | `fldgMiOr3Lfhu4ZtZ` | - |
| Mileage Score | Number (precision: 1) | `fldD5ZTVpOVrK578P` | - |
| PAY_CPM | Number (precision: 1) | `fldbXssNdtiKMQiNQ` | - |
| TURNOVER_PERCENT | Number (precision: 1) | `fldEC17DtguY5fhjH` | - |
| ACCIDENT_RATE | Number (precision: 1) | `fldKmTnrdcBFqFovy` | - |
| AVG_TRUCK_AGE | Number (precision: 1) | `fldPVvt9aK3NvyHbb` | - |
| LOAD_TRUCK_RATIO | Number (precision: 1) | `fldraOjGeJPat54Eh` | - |
| FLEET_MPG | Number (precision: 1) | `fldfn0Eki3eqMA6aV` | - |
| RECRUITMENT_SCORE | Number (precision: 1) | `fldBcbtnoegndYiTb` | - |
| COMBINED_SCORE | Number (precision: 1) | `fldeJJaz7llfRRbk6` | - |
| Client Carriers | Linked Records → tblTRApW1GqJzq6Oo | `flds1uQZblGq8CI31` | - |
| Client Carriers 2 | Linked Records → tblTRApW1GqJzq6Oo | `fldNOmluVuZ6D01vA` | - |
| Jobs | Single Line Text | `fldfnqYWKWIwV3pCm` | - |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'Carriers (Master)': {
  'dot_number': 'DOT_NUMBER',
  'legal_name': 'LEGAL_NAME',
  'dba_name': 'DBA_NAME',
  'carrier_operation': 'CARRIER_OPERATION',
  'phy_city': 'PHY_CITY',
  'phy_state': 'PHY_STATE',
  'phy_zip': 'PHY_ZIP',
  'telephone': 'TELEPHONE',
  'email_address': 'EMAIL_ADDRESS',
  'nbr_power_unit': 'NBR_POWER_UNIT',
  'driver_total': 'DRIVER_TOTAL',
  'recent_mileage': 'RECENT_MILEAGE',
  'recent_mileage_year': 'RECENT_MILEAGE_YEAR',
  'priority_score': 'PRIORITY_SCORE',
  'fleet_score': 'Fleet Score',
  'ratio_score': 'Ratio Score',
  'geo_score': 'Geo Score',
  'mileage_score': 'Mileage Score',
  'pay_cpm': 'PAY_CPM',
  'turnover_percent': 'TURNOVER_PERCENT',
  'accident_rate': 'ACCIDENT_RATE',
  'avg_truck_age': 'AVG_TRUCK_AGE',
  'load_truck_ratio': 'LOAD_TRUCK_RATIO',
  'fleet_mpg': 'FLEET_MPG',
  'recruitment_score': 'RECRUITMENT_SCORE',
  'combined_score': 'COMBINED_SCORE',
  'client_carriers': 'Client Carriers',
  'client_carriers_2': 'Client Carriers 2',
  'jobs': 'Jobs',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
