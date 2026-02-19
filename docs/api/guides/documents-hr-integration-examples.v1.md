# Documents HR Integration Examples (v1)

## ATS Intake: CDL + Med Cert Pair
```json
{
  "candidate_id": "cand_123",
  "documents": [
    {"type": "cdl", "mime_type": "image/jpeg", "base64_data": "..."},
    {"type": "medcert", "mime_type": "image/jpeg", "base64_data": "..."}
  ]
}
```

## Recommended Sequence
1. Submit `documents/batch` for candidate packets.
2. Poll `documents/batch/{job_id}` or receive webhook callback.
3. Store extraction IDs and run `documents/verify` for compliance confidence.
4. Route failed confidence checks to manual reviewer queue.

## Mapping Suggestions
- `extracted_data.full_name` -> ATS legal name
- `extracted_data.license_number` -> license tracking field
- `verification.expiration_valid` -> compliance status
- `verification.confidence` -> manual-review threshold flag
