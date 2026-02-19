# Operations API Examples (v1)

Base URL: `https://www.lastmiledr.app/_functions/api_gateway`

## Parking Search
```bash
curl -X GET "https://www.lastmiledr.app/_functions/api_gateway/v1/parking/search?lat=35.1495&lng=-90.0490&radius=25&amenities=restroom,showers&min_spaces=5" \
  -H "Authorization: Bearer lmdr_live_replace_me"
```

## Parking Location Details
```bash
curl -X GET "https://www.lastmiledr.app/_functions/api_gateway/v1/parking/location/loc_123" \
  -H "Authorization: Bearer lmdr_live_replace_me"
```

## Fuel Price Search
```bash
curl -X GET "https://www.lastmiledr.app/_functions/api_gateway/v1/fuel/prices?lat=35.1495&lng=-90.0490&radius=25&fuel_cards=comdata,efs" \
  -H "Authorization: Bearer lmdr_live_replace_me"
```

## Route Fuel Planner
```bash
curl -X POST "https://www.lastmiledr.app/_functions/api_gateway/v1/fuel/plan" \
  -H "Authorization: Bearer lmdr_live_replace_me" \
  -H "Content-Type: application/json" \
  -d '{
    "route_points": [
      {"lat": 35.1495, "lng": -90.0490},
      {"lat": 36.1627, "lng": -86.7816}
    ],
    "total_distance_miles": 220,
    "fuel_cards": ["comdata"],
    "tank_capacity_gallons": 120,
    "current_fuel_gallons": 30,
    "mpg": 6.5
  }'
```

## Fuel Station Details
```bash
curl -X GET "https://www.lastmiledr.app/_functions/api_gateway/v1/fuel/station/st_123" \
  -H "Authorization: Bearer lmdr_live_replace_me"
```
