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

## Example cURL
```bash
curl -X GET "https://www.lastmiledr.app/_functions/api_gateway/v1/fuel/prices?lat=35.1495&lng=-90.0490&radius=25" \
  -H "Authorization: Bearer lmdr_live_xxx"
```

## Notes
- Lat/lng query parameters are required for geo search endpoints.
- Fuel planning accepts JSON body and returns recommended stops.
