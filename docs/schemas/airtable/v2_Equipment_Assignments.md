# v2_Equipment Assignments

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
| equipment_id | Single Line Text | TBD | Reference to EquipmentAssets |
| driver_id | Single Line Text | TBD | Reference to FleetDrivers |
| assigned_date | Date | TBD | Date equipment was assigned |
| unassigned_date | Date | TBD | Date equipment was unassigned (if applicable) |
| assignment_type | Single Select (`primary`, `temporary`, `slip_seat`) | TBD | Type of assignment |
| reason | Single Line Text | TBD | Reason for assignment |
| starting_mileage | Number (precision: 0) | TBD | Odometer reading at assignment |
| ending_mileage | Number (precision: 0) | TBD | Odometer reading at unassignment |
| notes | Long Text / Multiline | TBD | Internal notes |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Equipment Assignments': {
  'carrier_dot': 'carrier_dot',
  'equipment_id': 'equipment_id',
  'driver_id': 'driver_id',
  'assigned_date': 'assigned_date',
  'unassigned_date': 'unassigned_date',
  'assignment_type': 'assignment_type',
  'reason': 'reason',
  'starting_mileage': 'starting_mileage',
  'ending_mileage': 'ending_mileage',
  'notes': 'notes',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-02-05
