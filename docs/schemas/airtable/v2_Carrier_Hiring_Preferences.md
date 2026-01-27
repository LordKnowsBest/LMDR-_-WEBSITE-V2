# v2_Carrier Hiring Preferences

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblTRpjFCWD9JKwyj` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Carrier DOT | Number (precision: 0) | `fldYzEisNIEyI7No1` | Linked carrier DOT number |
| Min Experience Years | Number (precision: 0) | `fldmrp0QnLVB6Ivsp` | Minimum years of experience required |
| Required CDL Class | Single Select (`A`, `B`, `C`, `Any`) | `fldmxdUY1YQUbZqAA` | Required CDL class |
| Accepts Recent Grads | Single Select (`Yes`, `No`) | `flddxgLaDK9CvjXHo` | Willing to hire recent CDL graduates |
| Max Accidents 3yr | Number (precision: 0) | `fldXpuOXfp586TEKS` | Maximum accidents allowed in last 3 years |
| Max Violations 3yr | Number (precision: 0) | `fldDc4IrTq4MbRDjq` | Maximum violations allowed in last 3 years |
| Legacy Wix ID | Single Line Text | `fld3iH95isDUH0lt4` | Original Wix _id for migration reference |
| Is Active | Single Select (`Yes`, `No`) | `fldG1RCIfXTRo7hTE` | - |
| Required CDL Types | Single Line Text | `fldmxMihfD3yhxJC5` | Array of CDL classes: A, B, C |
| Required Endorsements | Single Line Text | `fld0MpEgwe785RHjP` | Array: H, T, N, P, X, S |
| Max Experience Years | Number (precision: 0) | `fld050bfMJSzG35Mc` | - |
| Equipment Types | Single Line Text | `flduHPFZU0DGIJ0ok` | Dry Van, Reefer, Flatbed, Tanker, etc. |
| Target ZIP Codes | Single Line Text | `fldkAUwFfxhpg5Ier` | - |
| Target States | Single Line Text | `fldbsbpCl1Ig7ZKFl` | - |
| Target Radius Miles | Number (precision: 0) | `fldG91Vn27Mo0VnZA` | - |
| Urgency | Single Line Text | `fld9Ds8l4SYxpNqIX` | immediate, 2_week, 30_day, ongoing |
| Offered Pay Min CPM | Number (precision: 0) | `fldUl5llhrpneS5mB` | - |
| Offered Pay Max CPM | Number (precision: 0) | `fldkCmKUAm4oxOiZL` | - |
| Weight Salary Fit | Number (precision: 0) | `fldIfcpQ82DNAX5gk` | Custom weight for salary fit scoring (0-100). Default: 10 |
| Weight Engagement | Number (precision: 0) | `fld0DqYP06umnL5Qq` | Custom weight for engagement scoring (0-100). Default: 5 |
| Weight Location | Number (precision: 0) | `fldI4M0R7TmmE4R3S` | Custom weight for location scoring (0-100). Default: 20 |
| Weight Availability | Number (precision: 0) | `fldYVUwax3mlg1jvB` | Custom weight for availability scoring (0-100). Default: 15 |
| Weight Experience | Number (precision: 0) | `fldbFn8kYuWxaghpz` | Custom weight for experience scoring (0-100). Default: 20 |
| Weight Qualifications | Number (precision: 0) | `fldkqU8neCBRvwBPL` | Custom weight for qualifications scoring (0-100). Default: 30 |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Carrier Hiring Preferences': {
  'carrier_dot': 'Carrier DOT',
  'min_experience_years': 'Min Experience Years',
  'required_cdl_class': 'Required CDL Class',
  'accepts_recent_grads': 'Accepts Recent Grads',
  'max_accidents_3yr': 'Max Accidents 3yr',
  'max_violations_3yr': 'Max Violations 3yr',
  'legacy_wix_id': 'Legacy Wix ID',
  'is_active': 'Is Active',
  'required_cdl_types': 'Required CDL Types',
  'required_endorsements': 'Required Endorsements',
  'max_experience_years': 'Max Experience Years',
  'equipment_types': 'Equipment Types',
  'target_zip_codes': 'Target ZIP Codes',
  'target_states': 'Target States',
  'target_radius_miles': 'Target Radius Miles',
  'urgency': 'Urgency',
  'offered_pay_min_cpm': 'Offered Pay Min CPM',
  'offered_pay_max_cpm': 'Offered Pay Max CPM',
  'weight_salary_fit': 'Weight Salary Fit',
  'weight_engagement': 'Weight Engagement',
  'weight_location': 'Weight Location',
  'weight_availability': 'Weight Availability',
  'weight_experience': 'Weight Experience',
  'weight_qualifications': 'Weight Qualifications',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
