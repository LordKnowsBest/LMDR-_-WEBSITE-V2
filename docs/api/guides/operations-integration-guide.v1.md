# Operations Integration Guide for TMS Platforms (v1)

## Scope
- `GET /v1/parking/search`
- `GET /v1/parking/location/{id}`
- `GET /v1/fuel/prices`
- `POST /v1/fuel/plan`
- `GET /v1/fuel/station/{id}`

## Tiering
- Parking endpoints: Starter+
- Fuel endpoints: Growth+

## Suggested TMS Flow
1. Query `fuel/prices` before dispatch to estimate lane-level fuel expense.
2. Generate driver stop recommendations via `fuel/plan` once route is fixed.
3. In trip execution views, call `parking/search` for upcoming corridor windows.
4. Use `parking/location/{id}` and `fuel/station/{id}` for detail-side panels.

## Data Source and Confidence
- Parking availability includes `availability.data_source`, `availability.source_label`, and `availability.confidence`.
- Sensor-backed TPIMS sources should be prioritized over community-reported records when both are available.

## Reliability and Caching
- Parking search snapshots are short-lived and should be refreshed frequently in active trip sessions.
- Fuel detail responses include regional trend averages suitable for day-level cache in your TMS.

## Error Contracts
- `401 invalid_api_key`
- `403 forbidden_tier`
- `429 rate_limit_exceeded` with `Retry-After`

## References
- OpenAPI: `docs/api/openapi.external.v1.yaml`
- Examples: `docs/api/guides/operations-api-examples.v1.md`
- Postman: `docs/api/postman.operations.v1.collection.json`
