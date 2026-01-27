# CDL DRIVERS NJ FB CAMPAIGN

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblyZiY0KiO2erz1A` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| full_name | Long Text / Multiline | `fld68RU4gw1TzNAau` | - |
| is_organic | Checkbox | `fldPPEcCcLErlGRM2` | - |
| platform | Single Select (`fb`, `ig`) | `fldpFVZ1nEeLWjBLv` | - |
| what_type_of_cdl_do_you_currently_hold? | Single Select (`<test lead: dummy data for what_type_of_cdl_do_you_currently_hold?>`, `cdl_a`, `cdl_b`, `cdl_a|cdl_b`, `cdl_b|cdl_a`) | `fld5UFkMuktghN1mD` | - |
| are_you_able_to_start_within_the_next_7–14_days? | Single Select (`<test lead: dummy data for are_you_able_to_start_within_the_next_7–14_days?>`, `yes`, `unsure`, `no`, `yes|unsure`, `unsure|no`) | `fldArvoEASAgYk5fT` | - |
| email | Long Text / Multiline | `fldtoOICF190iUOG5` | - |
| phone | Long Text / Multiline | `fldOx45yAkfpNuweD` | - |
| Phone (E164) | Formula → singleLineText | `fld6uoojprZXIN7Qq` | - |
| State (from Area Code) | aiText | `fldRBdV2Ulcy29tHh` | - |
| inbox_url | Long Text / Multiline | `fld5LT51xYYYoJdyD` | - |
| created_time | Date & Time | `fldOkOkFI6FvIX9tq` | - |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'CDL DRIVERS NJ FB CAMPAIGN': {
  'full_name': 'full_name',
  'is_organic': 'is_organic',
  'platform': 'platform',
  'what_type_of_cdl_do_you_currently_hold': 'what_type_of_cdl_do_you_currently_hold?',
  'are_you_able_to_start_within_the_next_7_14_days': 'are_you_able_to_start_within_the_next_7–14_days?',
  'email': 'email',
  'phone': 'phone',
  'phone_e164': 'Phone (E164)',
  'state_from_area_code': 'State (from Area Code)',
  'inbox_url': 'inbox_url',
  'created_time': 'created_time',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
