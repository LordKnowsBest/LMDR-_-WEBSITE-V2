# Documents Integration Guide (v1)

## Scope
- `POST /v1/documents/cdl/extract`
- `POST /v1/documents/medcert/extract`
- `POST /v1/documents/verify`
- `POST /v1/documents/batch`
- `GET /v1/documents/batch/{job_id}`

## Typical HR / Background Check Workflow
1. Submit CDL or med cert document using base64 payload.
2. Persist returned `extraction_id` in your ATS/HRIS integration records.
3. Run `verify` for downstream confidence checks.
4. For high volume, use `documents/batch` and webhook callbacks.

## Validation and Limits
- Supported formats: JPEG, PNG, PDF.
- Max document size: 10MB per file.
- Med cert extraction includes examiner registry and expiration validity checks.

## Batch Webhook Event
- Event type: `documents.batch.completed`
- Payload includes `batch_job_id`, `status`, `total`, `completed`, `completed_at`.

## References
- OpenAPI: `docs/api/openapi.external.v1.yaml`
- Examples: `docs/api/guides/documents-api-examples.v1.md`
- Postman: `docs/api/postman.documents.v1.collection.json`
