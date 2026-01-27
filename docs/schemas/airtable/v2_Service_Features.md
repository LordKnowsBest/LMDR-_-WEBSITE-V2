# v2_Service Features

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblrIHqMYKCLubxR4` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Name | Single Line Text | `fldrQlFPmqWHYmKvW` | Feature name |
| Description | Long Text / Multiline | `fldsXtNMuum75Ag0Y` | Feature description |
| Tier | Single Select (`Free`, `Pro`, `Enterprise`) | `fldRxmDDis0jQJ0QX` | Minimum tier required |
| Icon | Single Line Text | `fldCpym94V0Kbktlw` | Icon name/class |
| Order | Number (precision: 0) | `fldUdiXENNUvILDlR` | Display order |
| Legacy Wix ID | Single Line Text | `fldfm3Tbi069wVACB` | Original Wix _id for migration reference |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Service Features': {
  'name': 'Name',
  'description': 'Description',
  'tier': 'Tier',
  'icon': 'Icon',
  'order': 'Order',
  'legacy_wix_id': 'Legacy Wix ID',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
