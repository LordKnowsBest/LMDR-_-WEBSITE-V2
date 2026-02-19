# Documents API Guide (v1)

## Endpoints
- `POST /v1/documents/cdl/extract`
- `POST /v1/documents/medcert/extract`
- `POST /v1/documents/verify`
- `POST /v1/documents/batch`
- `GET /v1/documents/batch/{job_id}`

## Auth + Tier
- Bearer API key required.
- `growth+` tier required for document endpoints.

## Input formats
- `data_url` with base64 payload, or
- `base64_data` + `mime_type`
- Max size: 10MB
- Supported mime types: JPEG, PNG, PDF

## Batch flow
1. Submit `POST /v1/documents/batch` with documents and optional `webhook_callback_url`.
2. Receive `batch_job_id` and status `processing`.
3. Poll `GET /v1/documents/batch/{job_id}`.
4. Optional webhook event: `documents.batch.completed`.
- Batch limit: maximum 25 documents per request.

## Verification notes
- `verify` returns check-level results plus confidence.
- Use returned `extracted_document_id` where available.

## References
- OpenAPI: `docs/api/openapi.external.v1.yaml`
- Examples: `docs/api/guides/documents-api-examples.v1.md`
- HR examples: `docs/api/guides/documents-hr-integration-examples.v1.md`
- Integration guide: `docs/api/guides/documents-integration-guide.v1.md`
- Postman: `docs/api/postman.documents.v1.collection.json`
