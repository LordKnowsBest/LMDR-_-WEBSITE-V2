# v2_Feature Flags

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | TBD |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields (Expected by Current Backend)

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Key | Single Line Text | TBD | Unique flag identifier, snake_case (e.g. `new_driver_dashboard`) |
| Name | Single Line Text | TBD | Human-readable display name |
| Description | Long Text / Multiline | TBD | Flag purpose and usage notes |
| Enabled | Checkbox | TBD | Master on/off switch |
| Rollout Percentage | Number (precision: 0) | TBD | 0-100 global rollout |
| Target Rules | Long Text / Multiline | TBD | JSON array of ordered targeting rules |
| Default Value | Checkbox | TBD | Fallback value when no rules match |
| Environment | Single Select (`production`, `staging`, `development`) | TBD | Deployment environment |
| Category | Single Select (`ui`, `backend`, `experiment`, `killswitch`) | TBD | Flag category |
| Expires At | Date | TBD | Optional auto-disable date |
| Created At | Date with time | TBD | Creation timestamp |
| Updated At | Date with time | TBD | Last modification timestamp |
| Created By | Single Line Text | TBD | Admin/member identifier |

## Suggested Views / Indexes

- Unique Key: `Key`
- Filtered views by `Environment`, `Category`, `Enabled`
- Sort by `Updated At desc`

## Backend Field Mapping (camelCase used in code)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Feature Flags': {
  'key': 'Key',
  'name': 'Name',
  'description': 'Description',
  'enabled': 'Enabled',
  'rolloutPercentage': 'Rollout Percentage',
  'targetRules': 'Target Rules',
  'defaultValue': 'Default Value',
  'environment': 'Environment',
  'category': 'Category',
  'expiresAt': 'Expires At',
  'createdAt': 'Created At',
  'updatedAt': 'Updated At',
  'createdBy': 'Created By',
},
```

## Notes

- Updated for `admin_platform_config_20260120` implementation
- Updated: 2026-02-18
