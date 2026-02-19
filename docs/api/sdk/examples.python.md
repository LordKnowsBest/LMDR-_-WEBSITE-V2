# Python SDK Examples

```python
from lmdr_python import LmdrApiClient

client = LmdrApiClient(api_key='lmdr_live_xxx')

safety = client.get_carrier_safety('1234567')
market = client.get_market_intelligence(region='TX')
fuel = client.get_fuel_prices(lat=32.7767, lng=-96.797, radius_miles=25)
```
