# v2_Feature Flags

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | TBD |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Key | Single Line Text | TBD | Unique flag identifier, snake_case (e.g., new_driver_dashboard) |
| Name | Single Line Text | TBD | Human-readable display name |
| Description | Long Text / Multiline | TBD | Flag purpose and usage notes |
| Enabled | Checkbox | TBD | Master on/off switch |
| Rollout Percentage | Number (precision: 0) | TBD | 0-100, percentage of users who see feature |
| Target Rules | Long Text / Multiline | TBD | JSON array of targeting conditions |
| Default Value | Checkbox | TBD | Value when no rules match |
| Environment | Single Select (`production`, `staging`, `development`) | TBD | Deployment environment |
| Category | Single Select (`ui`, `backend`, `experiment`, `killswitch`) | TBD | Flag category |
| Created By | Single Line Text | TBD | Admin ID who created |
| Expires At | Date | TBD | Optional auto-disable date |
| Created Date | Date | TBD | Creation timestamp |
| Updated Date | Date | TBD | Last modification |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Feature Flags': {
  'key': 'Key',
  'name': 'Name',
  'description': 'Description',
  'enabled': 'Enabled',
  'rollout_percentage': 'Rollout Percentage',
  'target_rules': 'Target Rules',
  'default_value': 'Default Value',
  'environment': 'Environment',
  'category': 'Category',
  'created_by': 'Created By',
  'expires_at': 'Expires At',
  'created_date': 'Created Date',
  'updated_date': 'Updated Date',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-02-04
