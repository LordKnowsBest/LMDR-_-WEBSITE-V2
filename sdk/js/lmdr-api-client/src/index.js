'use strict';

class LmdrApiClient {
  constructor(config = {}) {
    this.baseUrl = String(config.baseUrl || 'https://www.lastmiledr.app/_functions/api_gateway').replace(/\/$/, '');
    this.apiKey = String(config.apiKey || '').trim();
    this.fetchImpl = config.fetch || globalThis.fetch;
    if (!this.fetchImpl) {
      throw new Error('A fetch implementation is required');
    }
  }

  setApiKey(apiKey) {
    this.apiKey = String(apiKey || '').trim();
  }

  async request(method, path, options = {}) {
    if (!this.apiKey) throw new Error('API key is required');
    const query = options.query || null;
    const body = options.body || null;

    const url = new URL(this.baseUrl + path);
    if (query && typeof query === 'object') {
      Object.keys(query).forEach((key) => {
        const value = query[key];
        if (value !== undefined && value !== null) url.searchParams.set(key, String(value));
      });
    }

    const response = await this.fetchImpl(url.toString(), {
      method,
      headers: {
        Authorization: 'Bearer ' + this.apiKey,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const payload = await response.json();
    if (!response.ok) {
      const message = payload?.error?.message || 'Request failed';
      const error = new Error(message);
      error.status = response.status;
      error.payload = payload;
      throw error;
    }
    return payload?.data ?? payload;
  }

  getCarrierSafety(dotNumber) {
    return this.request('GET', '/v1/safety/carrier/' + encodeURIComponent(dotNumber));
  }

  getMarketIntelligence(query = {}) {
    return this.request('GET', '/v1/intelligence/market', { query });
  }

  getFuelPrices(query = {}) {
    return this.request('GET', '/v1/fuel/prices', { query });
  }

  searchDrivers(filters = {}) {
    return this.request('POST', '/v1/matching/drivers/search', { body: filters });
  }

  extractCdl(body = {}) {
    return this.request('POST', '/v1/documents/cdl/extract', { body });
  }
}

module.exports = {
  LmdrApiClient
};
