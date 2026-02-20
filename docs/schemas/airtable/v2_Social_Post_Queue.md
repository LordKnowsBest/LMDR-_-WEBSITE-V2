# v2_Social Post Queue

## Table Metadata

| Property | Value |
|----------|-------|
| Table ID | TBD |
| Base | Last Mile Driver recruiting |
| Base ID | `app9N1YCJ3gdhExA0` |

## Fields (Expected by Current Backend)

| Field Name | Type | Field ID | Description |
|------------|------|----------|-------------|
| Dedupe Key | Single Line Text | TBD | Idempotency key for duplicate suppression |
| Platform | Single Select (`facebook`, `instagram`) | TBD | Target platform |
| Post Type | Single Select (`text`, `link`, `photo`, `video`, `carousel`, `reels`) | TBD | Dispatch post type |
| Status | Single Select (`queued`, `processing`, `published`, `failed`, `partial`, `dead_letter`) | TBD | Queue lifecycle state |
| FB Post ID | Single Line Text | TBD | Facebook post/video ID on success |
| IG Media ID | Single Line Text | TBD | Instagram published media ID |
| IG Container ID | Single Line Text | TBD | Instagram media container ID |
| Error Type | Single Line Text | TBD | Normalized error category |
| Error Message | Long Text / Multiline | TBD | Raw or normalized error details |
| Retry Count | Number (precision: 0) | TBD | Retry attempt count |
| Scheduled For | Date with time | TBD | Scheduled execution timestamp |
| Published At | Date with time | TBD | Actual publish timestamp |
| Payload Snapshot | Long Text / Multiline | TBD | JSON snapshot of original request payload |
| Created At | Date with time | TBD | Record creation timestamp |
| Updated At | Date with time | TBD | Last update timestamp |

## Suggested Views / Indexes

- Dedupe index: `Dedupe Key`
- Queue operations view: `Status in (queued, processing)` sorted by `Scheduled For asc`
- Dead-letter triage view: `Status = dead_letter` sorted by `Updated At desc`
- Retry monitor view: `Status = failed` and `Retry Count < 3`

## Backend Field Mapping (snake_case)

Use these mappings in `airtableClient.jsw` FIELD_MAPPINGS:

```javascript
'v2_Social Post Queue': {
  'dedupe_key': 'Dedupe Key',
  'platform': 'Platform',
  'post_type': 'Post Type',
  'status': 'Status',
  'fb_post_id': 'FB Post ID',
  'ig_media_id': 'IG Media ID',
  'ig_container_id': 'IG Container ID',
  'error_type': 'Error Type',
  'error_message': 'Error Message',
  'retry_count': 'Retry Count',
  'scheduled_for': 'Scheduled For',
  'published_at': 'Published At',
  'payload_snapshot': 'Payload Snapshot',
  'created_at': 'Created At',
  'updated_at': 'Updated At',
},
```

## Notes

- Added for `graph_api_org_posting_20260219` Phase 2.4 and Phase 4 hardening
- `Platform` can be expanded to multi-select later if multi-platform single-record writes are introduced
- Updated: 2026-02-20
