# v2_Parking Reports

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblyL7f79Hf6ym4kn` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Location ID | Single Line Text | `fldilze7fys4lZIXG` | - |
| Driver ID | Single Line Text | `fldKuSKthl8ejEFbG` | - |
| Spaces Available | Number (precision: 0) | `fldSyg4EFo30EM0Jw` | - |
| Notes | Long Text / Multiline | `fldmPIG98CZTEB6cT` | - |
| Reported At | Single Line Text | `fldKN1p3pICK6lNRo` | - |
| Wix ID | Single Line Text | `fldMFthD0BR7djKxY` | - |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Parking Reports': {
  'location_id': 'Location ID',
  'driver_id': 'Driver ID',
  'spaces_available': 'Spaces Available',
  'notes': 'Notes',
  'reported_at': 'Reported At',
  'wix_id': 'Wix ID',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
