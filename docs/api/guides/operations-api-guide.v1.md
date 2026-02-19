# Operations API Guide (v1)

## Endpoints
- `GET /v1/parking/search`
- `GET /v1/parking/location/{id}`
- `GET /v1/fuel/prices`
- `POST /v1/fuel/plan`
- `GET /v1/fuel/station/{id}`

## Tier Access
- Parking: Starter+
- Fuel APIs: Growth+

## Parking Detail Fields
- Parking search includes source attribution under:
  - `availability.data_source`
  - `availability.source_label`
  - `availability.confidence`
- Parking location detail includes:
  - `historical_availability[]`
  - `amenities[]`
  - `reviews[]`

## Notes
- Lat/lng query parameters are required for geo-search endpoints.
- Fuel planning accepts a JSON body and returns optimized stop recommendations.
- Fuel station detail includes card-adjusted pricing and state-level diesel trend average.

## References
- OpenAPI: `docs/api/openapi.external.v1.yaml`
- Examples: `docs/api/guides/operations-api-examples.v1.md`
- Integration guide: `docs/api/guides/operations-integration-guide.v1.md`
- Postman: `docs/api/postman.operations.v1.collection.json`
