# JavaScript SDK Examples

```js
const { LmdrApiClient } = require('@lmdr/api-client');

const client = new LmdrApiClient({ apiKey: process.env.LMDR_API_KEY });

const safety = await client.getCarrierSafety('1234567');
const market = await client.getMarketIntelligence({ region: 'TX' });
const fuel = await client.getFuelPrices({ lat: 32.7767, lng: -96.797, radius_miles: 25 });
```
