# Documents API Examples (v1)

Base URL: `https://www.lastmiledr.app/_functions/api_gateway`

## CDL Extraction
```bash
curl -X POST "https://www.lastmiledr.app/_functions/api_gateway/v1/documents/cdl/extract" \
  -H "Authorization: Bearer lmdr_live_replace_me" \
  -H "Content-Type: application/json" \
  -d '{
    "mime_type": "image/jpeg",
    "base64_data": "REPLACE_WITH_BASE64"
  }'
```

## Medical Certificate Extraction
```bash
curl -X POST "https://www.lastmiledr.app/_functions/api_gateway/v1/documents/medcert/extract" \
  -H "Authorization: Bearer lmdr_live_replace_me" \
  -H "Content-Type: application/json" \
  -d '{
    "mime_type": "image/png",
    "base64_data": "REPLACE_WITH_BASE64"
  }'
```

## Verification
```bash
curl -X POST "https://www.lastmiledr.app/_functions/api_gateway/v1/documents/verify" \
  -H "Authorization: Bearer lmdr_live_replace_me" \
  -H "Content-Type: application/json" \
  -d '{
    "extracted_document_id": "ext_123"
  }'
```

## Batch Processing
```bash
curl -X POST "https://www.lastmiledr.app/_functions/api_gateway/v1/documents/batch" \
  -H "Authorization: Bearer lmdr_live_replace_me" \
  -H "Content-Type: application/json" \
  -d '{
    "documents": [
      {"type": "cdl", "mime_type": "image/png", "base64_data": "REPLACE1"},
      {"type": "medcert", "mime_type": "image/png", "base64_data": "REPLACE2"}
    ],
    "webhook_callback_url": "https://partner.example/webhooks/lmdr-docs"
  }'
```
