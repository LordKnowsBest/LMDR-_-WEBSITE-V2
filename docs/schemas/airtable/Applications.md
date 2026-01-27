# Applications

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tbldmLAOcYmk7aurh` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| First Name | Long Text / Multiline | `fldOY2PDpAqe0nql4` | - |
| Last Name | Long Text / Multiline | `fldH4CTlJkOihn3HN` | - |
| Phone Number | Long Text / Multiline | `fldDTooI1YGzE5idE` | - |
| Call Count Button | Single Select (`0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`, `10`) | `fldYTz88AQeTADCoI` | - |
| Record ID | Auto Number | `fld41QEdLbqteppOv` | Generates a unique Record ID using the last name, submission date, and a random number. |
| Driver Category | Single Line Text | `fldgLu75vuMCbhw2P` | - |
| Submission Date | Long Text / Multiline | `fldbJwoQTkUHiqo2u` | - |
| Last Update Date | Last Modified Time (Auto) | `fldltD2FUY9g9hOXa` | - |
| Notes | Long Text / Multiline | `fld9Za56KzfYUUr3m` | - |
| Email | Long Text / Multiline | `fldffofIfbNY5S5XY` | - |
| CDL Class | Single Select (`Class A`, `Class B`, `Class C`) | `fldBe6gRunslq33E9` | - |
| Do you have a valid CDL? | Checkbox | `fldWI9w1ur8Z6YX6N` | - |
| Birthdate | Single Line Text | `fldB8pxSzBHF4ofXY` | - |
| Years of Experience | Single Select (`More than 5 years`, `More than 10 years`, `Less then 3 years`, `Less than 1 year`, `No Experience`, `Less than 6 months`) | `fldw9QcnG8uEeU1Nu` | - |
| State of Issue | Single Line Text | `fld9uQTk6jJuZqkZq` | - |
| Any violations in the last 3 years? | Single Line Text | `fldUrcyY7kTewRyak` | - |
| Any Accidents in the last 3 years? | Single Line Text | `fld7bF8N1HQr9C5i0` | - |
| Endorsements? | Long Text / Multiline | `fldk8cabs73X2hYwb` | - |
| Route Types - First Option | Single Line Text | `fldZgQsWjThiyfsRH` | - |
| Route Types - Second Option | Single Line Text | `fldx1nUjfeBIcNggm` | - |
| Route Types - Third Option | Single Line Text | `fld1v1706Orin1mfQ` | - |
| When can you start? | Single Line Text | `fldN7VaaOUHtz98Qi` | - |
| Total_Score | Number (precision: 0) | `fldsBfU7jnOoNcd2n` | - |
| RoutePreferenceVector | Formula → singleLineText | `fldXlKZxvL82qjKLh` | - |
| HasHazmatEndorsement | Formula → number | `flduEwQCTFbkTQcNQ` | - |
| HasTankerEndorsement | Formula → number | `fldVCeBLZa1js1mwD` | - |
| IsOTRFriendly | Formula → number | `fldGh5vYCrMexoC1l` | - |
| IsRegionalFriendly | Formula → number | `fldHbuIXB3nTd01lO` | - |
| IsLocalFriendly | Formula → number | `fld4L4FCZ2RyQxvpM` | - |
| HasCDLClassA | Formula → number | `fldb4kqJSZqDXK3rO` | - |
| HasCDLClassB | Formula → number | `fldSXcet1JnLD2kTi` | - |
| HasCDLClassC | Formula → number | `fld13QEUPpLKtAwNW` | - |
| CleanRecord | Formula → number | `fldDltv7f8KQ17P5v` | - |
| YearsExpNum | Formula → number | `fld0T718QaoRPZlNY` | - |
| Upload front of CDL | Long Text / Multiline | `fldK9cm8K4lBpIJZF` | - |
| Upload back of CDL | Long Text / Multiline | `fldCRknJOdqKCPaLJ` | - |
| Upload valid med card | Long Text / Multiline | `fldcrMzfp1yZqjUGe` | - |
| BACKGROUND CHECK CONSENT | Single Line Text | `fldVM1FoQzGv3bHAG` | - |
| FINAL CONSENT | Single Line Text | `fldrJzJjHevtm3tcB` | - |
| SSN will be required for the verification phase | Single Line Text | `fldopcGhXro9gMGlw` | - |
| I understand that LMDR sends job matches and updates via: Phone calls -Text messages - Email* | Checkbox | `fldrf9TVYu68pYuMn` | - |
| Job Matches | Single Line Text | `fldGW9reyE0KkSL5S` | - |
| Job Matches 2 | Single Line Text | `fld5rbAU9ly2xobLV` | - |
| Retention | Single Line Text | `fldl38F5EWjWXZXly` | - |
| Status | Single Line Text | `fldtYlw6ChIrbQgcg` | - |
| Text Type | Single Select (`Friendly`, `Urgent`, `Humorous`) | `fldQvmGl5bi3EduXn` | - |
| Last Call Time | Date & Time | `fld93w6gr0SnGDEA5` | - |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'Applications': {
  'first_name': 'First Name',
  'last_name': 'Last Name',
  'phone_number': 'Phone Number',
  'call_count_button': 'Call Count Button',
  'record_id': 'Record ID',
  'driver_category': 'Driver Category',
  'submission_date': 'Submission Date',
  'last_update_date': 'Last Update Date',
  'notes': 'Notes',
  'email': 'Email',
  'cdl_class': 'CDL Class',
  'do_you_have_a_valid_cdl': 'Do you have a valid CDL?',
  'birthdate': 'Birthdate',
  'years_of_experience': 'Years of Experience',
  'state_of_issue': 'State of Issue',
  'any_violations_in_the_last_3_years': 'Any violations in the last 3 years?',
  'any_accidents_in_the_last_3_years': 'Any Accidents in the last 3 years?',
  'endorsements': 'Endorsements?',
  'route_types_first_option': 'Route Types - First Option',
  'route_types_second_option': 'Route Types - Second Option',
  'route_types_third_option': 'Route Types - Third Option',
  'when_can_you_start': 'When can you start?',
  'total_score': 'Total_Score',
  'routepreferencevector': 'RoutePreferenceVector',
  'hashazmatendorsement': 'HasHazmatEndorsement',
  'hastankerendorsement': 'HasTankerEndorsement',
  'isotrfriendly': 'IsOTRFriendly',
  'isregionalfriendly': 'IsRegionalFriendly',
  'islocalfriendly': 'IsLocalFriendly',
  'hascdlclassa': 'HasCDLClassA',
  'hascdlclassb': 'HasCDLClassB',
  'hascdlclassc': 'HasCDLClassC',
  'cleanrecord': 'CleanRecord',
  'yearsexpnum': 'YearsExpNum',
  'upload_front_of_cdl': 'Upload front of CDL',
  'upload_back_of_cdl': 'Upload back of CDL',
  'upload_valid_med_card': 'Upload valid med card',
  'background_check_consent': 'BACKGROUND CHECK CONSENT',
  'final_consent': 'FINAL CONSENT',
  'ssn_will_be_required_for_the_verification_phase': 'SSN will be required for the verification phase',
  'i_understand_that_lmdr_sends_job_matches_and_updates_via_phone_calls_text_messages_email': 'I understand that LMDR sends job matches and updates via: Phone calls -Text messages - Email*',
  'job_matches': 'Job Matches',
  'job_matches_2': 'Job Matches 2',
  'retention': 'Retention',
  'status': 'Status',
  'text_type': 'Text Type',
  'last_call_time': 'Last Call Time',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
