# v2_Carrier Announcements

Fields (Airtable field name -> type):
- Carrier Id -> Single line text
- Title -> Single line text
- Slug -> Single line text
- Content -> Long text
- Content Plain -> Long text
- Priority -> Single select (normal, important, urgent)
- Status -> Single select (draft, scheduled, published, archived)
- Target Audience -> Long text (JSON)
- Scheduled At -> Date & time
- Published At -> Date & time
- Expires At -> Date & time
- Allow Comments -> Checkbox
- Created By -> Single line text
- Created At -> Date & time
- Updated At -> Date & time
- Read Count -> Number
- Total Recipients -> Number
- Attachments -> Long text (JSON array)

Recommended views/filters:
- Carrier Id
- Status
- Published At

Notes:
- JSON fields are stored as stringified JSON.
