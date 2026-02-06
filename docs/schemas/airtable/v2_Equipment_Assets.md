# v2_Equipment Assets

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | TBD |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| carrier_dot | Number (precision: 0) | TBD | DOT number of carrier (FK) |
| asset_type | Single Select (`truck`, `trailer`, `other`) | TBD | Type of equipment asset |
| unit_number | Single Line Text | TBD | Carrier's internal unit identifier |
| vin | Single Line Text | TBD | Vehicle Identification Number |
| make | Single Line Text | TBD | Manufacturer |
| model | Single Line Text | TBD | Model name |
| year | Number (precision: 0) | TBD | Year manufactured |
| license_plate | Single Line Text | TBD | License plate number |
| license_state | Single Line Text | TBD | State where registered |
| registration_expiry | Date | TBD | Registration expiration date |
| status | Single Select (`active`, `maintenance`, `out_of_service`, `sold`) | TBD | Current equipment status |
| current_mileage | Number (precision: 0) | TBD | Current odometer reading |
| last_service_date | Date | TBD | Most recent service date |
| next_service_due | Long Text / Multiline | TBD | JSON: date/type/mileage |
| fuel_type | Single Select (`diesel`, `natural_gas`, `electric`) | TBD | Fuel type |
| eld_device_id | Single Line Text | TBD | ELD device identifier |
| gps_device_id | Single Line Text | TBD | GPS device identifier |
| current_driver_id | Single Line Text | TBD | Reference to FleetDrivers |
| notes | Long Text / Multiline | TBD | Internal notes |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Equipment Assets': {
  'carrier_dot': 'carrier_dot',
  'asset_type': 'asset_type',
  'unit_number': 'unit_number',
  'vin': 'vin',
  'make': 'make',
  'model': 'model',
  'year': 'year',
  'license_plate': 'license_plate',
  'license_state': 'license_state',
  'registration_expiry': 'registration_expiry',
  'status': 'status',
  'current_mileage': 'current_mileage',
  'last_service_date': 'last_service_date',
  'next_service_due': 'next_service_due',
  'fuel_type': 'fuel_type',
  'eld_device_id': 'eld_device_id',
  'gps_device_id': 'gps_device_id',
  'current_driver_id': 'current_driver_id',
  'notes': 'notes',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-02-05
