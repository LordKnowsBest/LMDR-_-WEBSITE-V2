# v2_Audit Log

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblbbX3WX0Z2jr4My` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Actor ID | Single Line Text | `fldhyWEJot5cN3Duv` | Wix member ID of actor |
| Action | Single Line Text | `fldjUHcu1T2Gs18be` | Action performed |
| Category | Single Select (`driver`, `carrier`, `system`, `auth`, `billing`) | `fldYtUhPEUfK3oZ8g` | Audit category |
| Target ID | Single Line Text | `fldKIY9PxTrjfsVgF` | ID of affected entity |
| Details | Long Text / Multiline | `fld8tqFX0zKlGbwkW` | JSON details |
| Action Date | Date | `fldqFgqrfS8GIZ2zV` | When action occurred |
| Legacy Wix ID | Single Line Text | `fldnxMw38e1lCoxcS` | Original Wix _id for migration reference |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Audit Log': {
  'actor_id': 'Actor ID',
  'action': 'Action',
  'category': 'Category',
  'target_id': 'Target ID',
  'details': 'Details',
  'action_date': 'Action Date',
  'legacy_wix_id': 'Legacy Wix ID',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
