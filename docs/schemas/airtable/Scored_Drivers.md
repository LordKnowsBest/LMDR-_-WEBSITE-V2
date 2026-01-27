# Scored Drivers

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblmD5tjWkPTKbaqN` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Driver ID | Single Line Text | `fldfveW3BtDXfxdAb` | - |
| First name | Single Line Text | `fldkPjnQASRTxO4Uh` | - |
| Last Name | Single Line Text | `fldXBMNm3DqE4UVec` | - |
| Phone | Phone Number | `fld3F6l3w4qvBXoxI` | - |
| Status | Single Select (`New`, `Pending`, `Verified`, `Declined`, `Hired`, `Bad Number`, `demetriusdaye1987@gmail.com`, `emmanuel.d.johnson@outlook.com`, `miles.quianad@gmail.com`, `nia_dotson@outlook.com`, `emma.tijani@gmail.com`, `zwillis619@gmail.com`, `sshareefah@gmail.com`, `stephan225rich@gmail.com`, `josephbarrow28@icloud.com`, `c2392404023@gmail.com`, `rickeyderrick@icloud.com`, `shanewilliams774@gmail.com`, `sincereliving89@gmail.com`, `pearcefrazier26@yahoo.com`, `keithsmoothd@gmail.com`, `taylor198923@gmail.com`, `Npendergrass94@icloud.com`, `elydia3711@yahoo.com`, `aaronmorris777@gmail.com`, `cfitz93.cf@gmail.com`, `ibhatt368@gmail.com`, `levy@lastmiledr.app`, `mlindsay1976@outlook.com`, `senriarc@yahoo.com`, `matthewarthur@outlook.com`, `qbridges@yahoo.com`, `tatumricky777@gmail.com`, `trfimason@gmail.com`, `domonique.roland@gmail.com`, `geraldhines81@icloud.com`, `fields1976@live.com`, `deekeppard@gmail.com`, `maat.intergratedsol@gmail.com`, `durrell1347@gmail.com`, `markeeffluellen@gmail.com`, `gmyles18@gmail.com`, `laurodelacerda@ymail.com`) | `fld1fSsm2y7ycmowJ` | - |
| Notes | Long Text / Multiline | `fld2uVXUgByWvDJCz` | - |
| Email | Email | `fldzvnDfcF9GqL065` | - |
| Date of birth | Date | `fldQyz1lq4pJpwneu` | - |
| Do You Have a valid CDL? | Checkbox | `fldpj8shL5rN2cehE` | - |
| cdl_class | Single Select (`Class A`, `Class B`, `Class C`, `1 violation`, `No violations`, `2 violations`, `3+ violations`) | `fldUBsoHtZ8Qj2EoL` | - |
| State of Issue | Single Line Text | `fldS43O7CW6XkOoEk` | - |
| endorsements | Single Select (`Hazmat`, `Tanker`, `Doubles`, `Hazmat, 
Tanker, 
Doubles`, `Hazmat, 
Doubles`, `None`, `Hazmat, 
Tanker`, `Tanker, 
Doubles`, `Doubles, 
Tanker`, `Hazmat, Tanker, Doubles`, `Tanker, Doubles`, `Hazmat, Tanker`, `Doubles, Tanker`, `Tanker, 
Hazmat, 
Doubles`) | `fldSqaIlXWVaM2OrD` | - |
| years_experience | Number (precision: 1) | `fldXAm0FmMSGUQ4Qo` | - |
| accidents_3yr | Single Select (`No violations`, `1 accident`, `2 accidents`, `3+ accidents`, `No accidents`, `Local`, `Regional`, `OTR`) | `fldKvWznKppGUDj7d` | - |
| violations_3yr | Multiple Select (`No violations`, `1 violation`, `2 violations`, `3 violations`, `3+ violations`, `Local`, `Regional`, `OTR`) | `fldTnwKPbouXkaFKF` | - |
| Route Types - First Option | Multiple Select (`OTR`, `Regional`, `Local`) | `fldlmHSW6c3Beqax1` | - |
| Route Types - Second Option | Multiple Select (`OTR`, `Regional`, `Local`) | `fldfTq5Ak9xTYF9sk` | - |
| Route Types - Third Option | Multiple Select (`OTR`, `Regional`, `Local`) | `fldwVdPWIPrTm9KkO` | - |
| Background Consent | Checkbox | `fldsotqopv1ieyMXO` | - |
| Final Consent | Checkbox | `fldx8gKMqAeGOcwkV` | - |
| Start Date Availability | Single Line Text | `fldbn0njpRbH8W78G` | - |
| Priority Score | Number (precision: 1) | `fldDOp7XU9IUyBldq` | - |
| Ending | Single Line Text | `fld08HzPmlxv6MU8s` | - |
| Last Date Modified | Last Modified Time (Auto) | `fldWQ9UHUZsPknVSY` | - |
| Job Matches | Single Line Text | `fldLbGqnfbDZjTyhs` | - |
| Driver Category | Single Select (`High-Value OTR`, `Experienced Regional`, `Local Ready`, `Hazmat Certified`, `Tanker Endorsed`, `General OTR`, `General Regional`, `Local CDL`, `Local Low Score – Experienced`, `Local Low Score – Trainee`, `CDL Driver Low Score – Violations`, `CDL Driver Low Score – Clean`, `Other`) | `fldRPppgXnkKWDYRv` | - |
| Job Matches 2 | Single Line Text | `fld7XaKbVYTJHKxfi` | - |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'Scored Drivers': {
  'driver_id': 'Driver ID',
  'first_name': 'First name',
  'last_name': 'Last Name',
  'phone': 'Phone',
  'status': 'Status',
  'notes': 'Notes',
  'email': 'Email',
  'date_of_birth': 'Date of birth',
  'do_you_have_a_valid_cdl': 'Do You Have a valid CDL?',
  'cdl_class': 'cdl_class',
  'state_of_issue': 'State of Issue',
  'endorsements': 'endorsements',
  'years_experience': 'years_experience',
  'accidents_3yr': 'accidents_3yr',
  'violations_3yr': 'violations_3yr',
  'route_types_first_option': 'Route Types - First Option',
  'route_types_second_option': 'Route Types - Second Option',
  'route_types_third_option': 'Route Types - Third Option',
  'background_consent': 'Background Consent',
  'final_consent': 'Final Consent',
  'start_date_availability': 'Start Date Availability',
  'priority_score': 'Priority Score',
  'ending': 'Ending',
  'last_date_modified': 'Last Date Modified',
  'job_matches': 'Job Matches',
  'driver_category': 'Driver Category',
  'job_matches_2': 'Job Matches 2',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
