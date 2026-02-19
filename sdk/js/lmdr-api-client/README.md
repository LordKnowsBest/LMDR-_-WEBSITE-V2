# @lmdr/api-client

JavaScript SDK for LMDR External API.

## Install

```bash
npm install @lmdr/api-client
```

## Usage

```js
const { LmdrApiClient } = require('@lmdr/api-client');

const client = new LmdrApiClient({
  apiKey: process.env.LMDR_API_KEY
});

const safety = await client.getCarrierSafety('1234567');
```

## Methods
- `getCarrierSafety(dotNumber)`
- `getMarketIntelligence(query)`
- `getFuelPrices(query)`
- `searchDrivers(filters)`
- `extractCdl(body)`
