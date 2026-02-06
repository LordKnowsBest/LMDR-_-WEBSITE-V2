# v2_Fleet Drivers

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
| driver_id | Single Line Text | TBD | Reference to DriverProfiles |
| employee_id | Single Line Text | TBD | Carrier's internal employee ID |
| status | Single Select (`active`, `driving`, `resting`, `on_leave`, `medical_leave`, `suspended`, `terminated`) | TBD | Current driver status |
| status_updated_at | Date | TBD | Last status change timestamp |
| hire_date | Date | TBD | Date driver was hired |
| termination_date | Date | TBD | Date driver was terminated (if applicable) |
| home_terminal | Single Line Text | TBD | Home terminal location |
| current_location | Long Text / Multiline | TBD | JSON: lat/lng/city/state/updated_at |
| assigned_equipment_id | Single Line Text | TBD | Reference to EquipmentAssets |
| license_state | Single Line Text | TBD | State where CDL is issued |
| license_expiry | Date | TBD | CDL expiration date |
| medical_card_expiry | Date | TBD | Medical card expiration date |
| endorsements | Long Text / Multiline | TBD | JSON array of CDL endorsements |
| phone_primary | Phone Number | TBD | Primary contact phone |
| phone_secondary | Phone Number | TBD | Secondary contact phone |
| email | Email | TBD | Contact email |
| emergency_contact | Long Text / Multiline | TBD | JSON: name/relationship/phone |
| notes | Long Text / Multiline | TBD | Internal notes |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Fleet Drivers': {
  'carrier_dot': 'carrier_dot',
  'driver_id': 'driver_id',
  'employee_id': 'employee_id',
  'status': 'status',
  'status_updated_at': 'status_updated_at',
  'hire_date': 'hire_date',
  'termination_date': 'termination_date',
  'home_terminal': 'home_terminal',
  'current_location': 'current_location',
  'assigned_equipment_id': 'assigned_equipment_id',
  'license_state': 'license_state',
  'license_expiry': 'license_expiry',
  'medical_card_expiry': 'medical_card_expiry',
  'endorsements': 'endorsements',
  'phone_primary': 'phone_primary',
  'phone_secondary': 'phone_secondary',
  'email': 'email',
  'emergency_contact': 'emergency_contact',
  'notes': 'notes',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-02-05
