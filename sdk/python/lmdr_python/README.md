# lmdr-python

Python SDK for LMDR External API.

## Install

```bash
pip install lmdr-python
```

## Usage

```python
from lmdr_python import LmdrApiClient

client = LmdrApiClient(api_key='lmdr_live_xxx')
safety = client.get_carrier_safety('1234567')
```

## Methods
- `get_carrier_safety(dot_number)`
- `get_market_intelligence(region=None)`
- `get_fuel_prices(lat, lng, radius_miles=25)`
- `search_drivers(filters)`
- `extract_cdl(body)`
