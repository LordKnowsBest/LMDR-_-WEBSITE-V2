# v2_Carriers

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblV6KfgWmjIIeVEi` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Legal Name | Single Line Text | `fldodYySGP5UKY7fu` | Carrier legal business name |
| DOT Number | Number (precision: 0) | `fldkjPgH31HlATNQv` | FMCSA DOT number - primary lookup key |
| MC Number | Number (precision: 0) | `fld7uzZpR8RT6tmyX` | Motor carrier number |
| City | Single Line Text | `flddF7sQG9NpkrGNp` | Physical city location |
| State | Single Line Text | `fldQyqR7ou4N7zE2f` | 2-letter state code |
| Pay Rate Min | Currency ($) | `fldye2Kj7rqFRy6AG` | Minimum CPM pay rate |
| Pay Rate Max | Currency ($) | `fld39bkcivxyELwVL` | Maximum CPM pay rate |
| Fleet Size | Number (precision: 0) | `fldZWpeg9qpIdNv5I` | Total trucks in fleet |
| Truck Age Avg | Number (precision: 0) | `fldOXMbKCEFB4krtw` | Average fleet truck age in years |
| Turnover Rate Pct | Number (precision: 0) | `fldG3ZUzaAWqjk3tc` | Annual driver turnover rate as decimal (0.15 = 15%) |
| Legacy Wix ID | Single Line Text | `fldsLNlraGNYw7Gf2` | Original Wix _id for migration reference |
| Title | Single Line Text | `fldEqU7pB6bhxasxv` | Title field from Wix |
| Created Date | Date | `fldCIUurf0OtqrYcF` | Wix _createdDate field |
| Updated Date | Date | `fld3GWzw8ghnGqoU3` | Wix _updatedDate field |
| Owner | Single Line Text | `fldbOWjJVY4lah7aE` | Wix _owner field |
| DBA Name | Single Line Text | `fldBz6vL3JrCSl7Ji` | Wix dba_name field |
| Carrier Operation | Single Line Text | `fldDQIWsKQWNbvxAP` | Wix carrier_operation field |
| Zip Code | Number (precision: 0) | `flduAsecRKUGTczmT` | Wix phy_zip field |
| Telephone | Single Line Text | `fld1BObu82o7acCd9` | Wix telephone field |
| Email Address | Single Line Text | `fldDXkZH1hEHjKUlC` | Wix email_address field |
| Power Units | Number (precision: 0) | `fldTKm4ejAd8ZrU1U` | Wix nbr_power_unit field |
| Driver Total | Number (precision: 0) | `fldzYxC0mDVH9h1C0` | Wix driver_total field |
| Recent Mileage | Number (precision: 0) | `fld1hyFrwcEYvMcR8` | Wix recent_mileage field |
| Recent Mileage Year | Number (precision: 0) | `fldLNr8LBGljC7Lfs` | Wix recent_mileage_year field |
| Priority Score | Number (precision: 0) | `fldzM0gjmzLK71gGR` | Wix priority_score field |
| Fleet Score | Number (precision: 0) | `fld0np7lQTsYp6Kqm` | Wix fleetScore field |
| Ratio Score | Number (precision: 0) | `fldscBATCvsuXsIaO` | Wix ratioScore field |
| Geo Score | Number (precision: 0) | `fldTVrtcTJJhmlPxl` | Wix geoScore field |
| Mileage Score | Number (precision: 0) | `fldnvUgpIaH8NoaUR` | Wix mileageScore field |
| Pay CPM | Number (precision: 0) | `fldO2WQokM6Ja7bdA` | Wix pay_cpm field - cents per mile |
| Accident Rate | Number (precision: 0) | `fld0KaEU72VLy9PUR` | Wix accident_rate field |
| Load Truck Ratio | Number (precision: 0) | `fld9mhcH74Q9D6rm2` | Wix load_truck_ratio field |
| Fleet MPG | Number (precision: 0) | `fldRNcgag8b0cNgYX` | Wix fleet_mpg field |
| Recruitment Score | Number (precision: 0) | `fld6UgATR3j9f3TKc` | Wix recruitment_score field |
| Combined Score | Number (precision: 0) | `fldvLtYMoVHH2dJPn` | Wix combined_score field |
| Client Carriers | Single Line Text | `fldYmgIx3BaBLPdNg` | Wix clientCarriers field |
| Client Carriers 2 | Single Line Text | `fldgfhE75yOtgad16` | Wix clientCarriers2 field |
| Jobs | Single Line Text | `fld0WKCiLZzGN05ZL` | Wix jobs field |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Carriers': {
  'legal_name': 'Legal Name',
  'dot_number': 'DOT Number',
  'mc_number': 'MC Number',
  'city': 'City',
  'state': 'State',
  'pay_rate_min': 'Pay Rate Min',
  'pay_rate_max': 'Pay Rate Max',
  'fleet_size': 'Fleet Size',
  'truck_age_avg': 'Truck Age Avg',
  'turnover_rate_pct': 'Turnover Rate Pct',
  'legacy_wix_id': 'Legacy Wix ID',
  'title': 'Title',
  'created_date': 'Created Date',
  'updated_date': 'Updated Date',
  'owner': 'Owner',
  'dba_name': 'DBA Name',
  'carrier_operation': 'Carrier Operation',
  'zip_code': 'Zip Code',
  'telephone': 'Telephone',
  'email_address': 'Email Address',
  'power_units': 'Power Units',
  'driver_total': 'Driver Total',
  'recent_mileage': 'Recent Mileage',
  'recent_mileage_year': 'Recent Mileage Year',
  'priority_score': 'Priority Score',
  'fleet_score': 'Fleet Score',
  'ratio_score': 'Ratio Score',
  'geo_score': 'Geo Score',
  'mileage_score': 'Mileage Score',
  'pay_cpm': 'Pay CPM',
  'accident_rate': 'Accident Rate',
  'load_truck_ratio': 'Load Truck Ratio',
  'fleet_mpg': 'Fleet MPG',
  'recruitment_score': 'Recruitment Score',
  'combined_score': 'Combined Score',
  'client_carriers': 'Client Carriers',
  'client_carriers_2': 'Client Carriers 2',
  'jobs': 'Jobs',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
