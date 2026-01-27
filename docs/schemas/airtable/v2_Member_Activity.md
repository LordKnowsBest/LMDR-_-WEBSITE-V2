# v2_Member Activity

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | `tblGqDBjIfRJ0ITPB` |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Member ID | Single Line Text | `fldMWYVU8WhDcSso0` | Wix member ID |
| Activity Type | Single Select (`profile_view`, `application`, `message_sent`, `login`, `profile_update`) | `fld7ZuLER5YAJFs46` | Type of activity |
| Target ID | Single Line Text | `fldBBlShPB5tRL88R` | ID of related entity |
| Activity Date | Date | `fld9kibzrO6fH4VH2` | When activity occurred |
| Legacy Wix ID | Single Line Text | `fldmP2tbLN4uMRJUr` | Original Wix _id for migration reference |
| Profile Views | Number (precision: 0) | `fldKVB8oxaQxSCgXZ` | Number of profile views |
| Profile Views Trend | Single Line Text | `fldQ7YsLDU6KXvc3L` | Trend indicator for profile views (stable, up, down) |
| Searches This Week | Number (precision: 0) | `fldnmVO86IoOGjcL2` | Number of searches performed this week |
| Match Score Trend | Single Line Text | `fldfZQlGCYkFPHjCR` | Trend indicator for match scores (stable, up, down) |
| Last Active | Date | `fld9KyxvwdP4OLFna` | When member was last active |

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Member Activity': {
  'member_id': 'Member ID',
  'activity_type': 'Activity Type',
  'target_id': 'Target ID',
  'activity_date': 'Activity Date',
  'legacy_wix_id': 'Legacy Wix ID',
  'profile_views': 'Profile Views',
  'profile_views_trend': 'Profile Views Trend',
  'searches_this_week': 'Searches This Week',
  'match_score_trend': 'Match Score Trend',
  'last_active': 'Last Active',
},
```

## Notes

- Auto-generated schema documentation
- Generated: 2026-01-27
