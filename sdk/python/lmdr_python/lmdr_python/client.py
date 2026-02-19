import requests


class LmdrApiClient:
    def __init__(self, api_key: str, base_url: str = 'https://www.lastmiledr.app/_functions/api_gateway', timeout: int = 30):
        self.api_key = (api_key or '').strip()
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout

    def _request(self, method: str, path: str, params=None, json=None):
        if not self.api_key:
            raise ValueError('API key is required')

        response = requests.request(
            method=method,
            url=f'{self.base_url}{path}',
            params=params,
            json=json,
            timeout=self.timeout,
            headers={
                'Authorization': f'Bearer {self.api_key}',
                'Content-Type': 'application/json'
            }
        )
        payload = response.json()
        if response.status_code >= 400:
            message = payload.get('error', {}).get('message', 'Request failed')
            raise RuntimeError(f'{response.status_code}: {message}')
        return payload.get('data', payload)

    def get_carrier_safety(self, dot_number: str):
        return self._request('GET', f'/v1/safety/carrier/{dot_number}')

    def get_market_intelligence(self, region: str = None):
        params = {'region': region} if region else None
        return self._request('GET', '/v1/intelligence/market', params=params)

    def get_fuel_prices(self, lat: float, lng: float, radius_miles: int = 25):
        return self._request('GET', '/v1/fuel/prices', params={
            'lat': lat,
            'lng': lng,
            'radius_miles': radius_miles
        })

    def search_drivers(self, filters: dict):
        return self._request('POST', '/v1/matching/drivers/search', json=filters or {})

    def extract_cdl(self, body: dict):
        return self._request('POST', '/v1/documents/cdl/extract', json=body or {})
