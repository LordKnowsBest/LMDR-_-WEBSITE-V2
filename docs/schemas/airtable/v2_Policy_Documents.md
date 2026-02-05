# v2_Policy Documents

Fields (Airtable field name -> type):
- Carrier Id -> Single line text
- Title -> Single line text
- Slug -> Single line text
- Category -> Single select (handbook, safety, sop, compliance, hr)
- Description -> Long text
- Content Type -> Single select (markdown, pdf, external_link)
- Content -> Long text
- External Url -> Single line text
- Current Version -> Number
- Version History -> Long text (JSON array)
- Requires Acknowledgment -> Checkbox
- Acknowledgment Deadline -> Date & time
- Target Audience -> Long text (JSON)
- Is Mandatory -> Checkbox
- Status -> Single select (draft, published, archived)
- Published At -> Date & time
- Created By -> Single line text
- Created At -> Date & time
- Updated At -> Date & time
- Acknowledgment Count -> Number
- Total Required -> Number

Recommended views/filters:
- Carrier Id
- Status
- Requires Acknowledgment

Notes:
- JSON fields are stored as stringified JSON.
