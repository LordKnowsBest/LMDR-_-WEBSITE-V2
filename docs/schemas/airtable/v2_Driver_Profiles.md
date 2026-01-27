# v2_Driver Profiles

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblFsLBfrwLJFqLLK` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Display Name | Single Line Text | `fldpZcdXvgqvFxHgK` | Driver full name |
| Email | Email | `fldppjIyIk48WIcwZ` | Contact email |
| Phone | Phone Number | `fldvTNTpxtWgDfcnc` | Contact phone |
| Home Zip | Single Line Text | `fldL1nXdRZsirM8KZ` | Home zip code for location matching |
| CDL Class | Single Select (`A`, `B`, `C`) | `fld393HCLzswgt6Gj` | CDL license class |
| Years Experience | Number (precision: 0) | `fldUO3SgwPcLtNUrr` | Years of CDL driving experience |
| Min CPM | Currency ($) | `fldiPwhAXc5ReXawx` | Minimum acceptable pay rate |
| Clean MVR | Single Select (`Yes`, `No`) | `fld7ugqbVIabXv9Oc` | No violations on motor vehicle record |
| Accidents 3yr | Number (precision: 0) | `fldRdjI0myt1TgEAD` | Accident count in last 3 years |
| Violations 3yr | Number (precision: 0) | `fldXXMNTf4tK6xAJX` | Violation count in last 3 years |
| Profile Score | Number (precision: 0) | `fldqwOXoCqnt8iMyQ` | Profile completeness score 0-100 |
| Wix Member ID | Single Line Text | `fldOlxyN9YlJoxk7G` | Wix _owner for auth linking |
| Legacy Wix ID | Single Line Text | `fldysXr99eC1dC9Og` | Original Wix _id for migration reference |
| First Name | Single Line Text | `flda6O9t29v73Ciqa` | - |
| Last Name | Single Line Text | `flde3yfTkQxwnuDoZ` | - |
| Date of Birth | Single Line Text | `fldN0q4sBFiNSZ8ny` | DOB as text |
| City | Single Line Text | `fldmXHNDGAUU3SbWL` | - |
| State | Single Line Text | `fldJuIvuXb4ktXOhn` | - |
| ZIP Code | Single Line Text | `fldRvdFK9G699ZjKQ` | - |
| CDL Number | Single Line Text | `fldusktO749oybyjX` | - |
| CDL State | Single Line Text | `fldBB89ZLGyyqnV4J` | - |
| CDL Expiration | Date | `fldTdQGDwiJ08SVNS` | - |
| CDL Front URL | URL | `fldTyUWOsk7AYmWvw` | - |
| CDL Back URL | URL | `fldK6o9NdvZqIBQAr` | - |
| Med Card URL | URL | `fldYjUMM6YMRozpX0` | - |
| Med Card Expiration | Date | `fldvBWQ5FiXBiapCm` | - |
| Resume URL | URL | `fldwP73iYu974hEgQ` | Link to resume file |
| Endorsements | Single Line Text | `fldRAMipxKn9dm5sg` | Comma-separated: H, N, T, X, P, S |
| Restrictions | Single Line Text | `fldSYFy86cbrXILss` | - |
| Employer 1 Name | Single Line Text | `fldjMKjl77V47ZlVX` | - |
| Employer 1 Duration | Single Line Text | `fldmlJwZtvmkcSpqE` | - |
| Employer 2 Name | Single Line Text | `fld9Lmx1UIB6JsYIr` | - |
| Employer 2 Duration | Single Line Text | `fldc4naeqllhapXcP` | - |
| Employer 3 Name | Single Line Text | `fldBYpupcncpCW83w` | - |
| Employer 3 Duration | Single Line Text | `fldlxmCrvDANMZUFl` | - |
| Companies Last 3 Years | Number (precision: 0) | `fldUuKRGQrskSZiz1` | - |
| Work History | Long Text / Multiline | `fldof82xD3kp6e31k` | - |
| Preferred Operation Type | Single Line Text | `fldYQOehWR09ro8Gx` | OTR, Regional, Local, Dedicated |
| Preferred Routes | Single Line Text | `fldVYRFnicrIN8n96` | Comma-separated route preferences |
| Home Time Preference | Single Line Text | `fldX7ed5MRtc28WG2` | - |
| Max Commute Miles | Number (precision: 0) | `fld4t6Zj2ongF3prn` | - |
| Max Turnover Percent | Number (precision: 0) | `fldEn8PlwAZUkJz4v` | - |
| Max Truck Age Years | Number (precision: 0) | `fldey4djlSRfl2QNa` | - |
| Fleet Size Preference | Single Line Text | `fld0XlEYxR5zDEvpa` | - |
| Equipment Experience | Single Line Text | `flduwOKmJCwmpwPnr` | Comma-separated equipment types |
| Availability | Single Line Text | `fldnGDVwrqqBFS8gi` | - |
| Status | Single Line Text | `fldBS577y8pX1dOLj` | - |
| Profile Status | Single Line Text | `fldewRLL51C8SzD7N` | - |
| Status History | Long Text / Multiline | `fld63DmafRIxZ4Rgz` | - |
| Docs Submitted | Single Line Text | `fld2Oytvspv6Czu2a` | - |
| MVR Status | Single Line Text | `fldfSDSPIE24q3zHS` | - |
| Visibility Level | Single Line Text | `fldRtfVVOlaaQORmP` | - |
| Application Date | Date | `fldJ32nsuYLq44nnr` | - |
| Created Date | Date | `fldE3g0f8otM7eZ0j` | - |
| Updated Date | Date | `fldB9GDDFLiRQ2yuC` | - |
| Last Search Date | Date | `fldiItFA6YCWMNNIw` | - |
| Total Searches | Number (precision: 0) | `fldzkihLHSOxE9Exq` | - |
| Docs Complete | Single Select (`Yes`, `No`) | `fldjbVTdxd3dZiXKu` | - |
| Is Searchable | Single Select (`Yes`, `No`) | `fld92PhhUiLQjM1s4` | - |
| Is Discoverable | Single Select (`Yes`, `No`) | `fldFg08YEkc4qPgQg` | - |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Driver Profiles': {
  'display_name': 'Display Name',
  'email': 'Email',
  'phone': 'Phone',
  'home_zip': 'Home Zip',
  'cdl_class': 'CDL Class',
  'years_experience': 'Years Experience',
  'min_cpm': 'Min CPM',
  'clean_mvr': 'Clean MVR',
  'accidents_3yr': 'Accidents 3yr',
  'violations_3yr': 'Violations 3yr',
  'profile_score': 'Profile Score',
  'wix_member_id': 'Wix Member ID',
  'legacy_wix_id': 'Legacy Wix ID',
  'first_name': 'First Name',
  'last_name': 'Last Name',
  'date_of_birth': 'Date of Birth',
  'city': 'City',
  'state': 'State',
  'zip_code': 'ZIP Code',
  'cdl_number': 'CDL Number',
  'cdl_state': 'CDL State',
  'cdl_expiration': 'CDL Expiration',
  'cdl_front_url': 'CDL Front URL',
  'cdl_back_url': 'CDL Back URL',
  'med_card_url': 'Med Card URL',
  'med_card_expiration': 'Med Card Expiration',
  'resume_url': 'Resume URL',
  'endorsements': 'Endorsements',
  'restrictions': 'Restrictions',
  'employer_1_name': 'Employer 1 Name',
  'employer_1_duration': 'Employer 1 Duration',
  'employer_2_name': 'Employer 2 Name',
  'employer_2_duration': 'Employer 2 Duration',
  'employer_3_name': 'Employer 3 Name',
  'employer_3_duration': 'Employer 3 Duration',
  'companies_last_3_years': 'Companies Last 3 Years',
  'work_history': 'Work History',
  'preferred_operation_type': 'Preferred Operation Type',
  'preferred_routes': 'Preferred Routes',
  'home_time_preference': 'Home Time Preference',
  'max_commute_miles': 'Max Commute Miles',
  'max_turnover_percent': 'Max Turnover Percent',
  'max_truck_age_years': 'Max Truck Age Years',
  'fleet_size_preference': 'Fleet Size Preference',
  'equipment_experience': 'Equipment Experience',
  'availability': 'Availability',
  'status': 'Status',
  'profile_status': 'Profile Status',
  'status_history': 'Status History',
  'docs_submitted': 'Docs Submitted',
  'mvr_status': 'MVR Status',
  'visibility_level': 'Visibility Level',
  'application_date': 'Application Date',
  'created_date': 'Created Date',
  'updated_date': 'Updated Date',
  'last_search_date': 'Last Search Date',
  'total_searches': 'Total Searches',
  'docs_complete': 'Docs Complete',
  'is_searchable': 'Is Searchable',
  'is_discoverable': 'Is Discoverable',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
