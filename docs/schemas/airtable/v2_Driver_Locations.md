# v2_Driver_Locations

## Fields

| Field Name | Type | Description |
|------------|------|-------------|
| carrier_dot | Number | FMCSA DOT number - carrier reference |
| driver_id | Single Line Text | Reference to FleetDrivers record |
| latitude | Number | GPS latitude coordinate |
| longitude | Number | GPS longitude coordinate |
| heading | Number | Compass heading in degrees (0-360) |
| speed_mph | Number | Current speed in miles per hour |
| location_city | Single Line Text | Geocoded city name |
| location_state | Single Line Text | Geocoded state code |
| location_address | Single Line Text | Geocoded street address |
| timestamp | Date | Timestamp of location reading |
| source | Single Line Text | ELD provider name that supplied the data |
| hos_status | Single Select | Hours of Service status (driving/on_duty/sleeper/off_duty) |
| hos_remaining | Number | Remaining hours of service in minutes |
| current_load_id | Single Line Text | Reference to active load assignment |
| destination | Multiple Line Text | JSON object with destination details (lat/lng/city/state/eta) |
| route_polyline | Multiple Line Text | Encoded polyline string for route visualization |

## Notes

- Auto-generated schema documentation
- Generated: 2026-02-05
