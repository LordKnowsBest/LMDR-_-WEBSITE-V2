/**
 * LMDR Experiment SDK
 *
 * Sticky variant assignment + conversion tracking bridge.
 */

class LMDRExperimentManager {
  constructor() {
    this.assignments = {};
    this.userId = null;
    this.cacheKey = 'lmdr_experiment_assignments';
    this.ttl = 24 * 60 * 60 * 1000;
  }

  init(userId, assignments = null) {
    this.userId = userId;
    if (assignments && typeof assignments === 'object') {
      this.assignments = assignments;
      this._saveToCache();
      return;
    }
    this._loadFromCache();
  }

  async getVariant(testKey, userContext = {}) {
    if (this.assignments[testKey]) {
      return this.assignments[testKey];
    }

    if (typeof window !== 'undefined' && typeof window.lmdrGetExperimentVariant === 'function') {
      const variant = await window.lmdrGetExperimentVariant(testKey, this.userId, userContext);
      this.assignments[testKey] = variant || 'control';
      this._saveToCache();
      return this.assignments[testKey];
    }

    return 'control';
  }

  async getConfig(testKey, userContext = {}) {
    if (typeof window !== 'undefined' && typeof window.lmdrGetExperimentConfig === 'function') {
      return await window.lmdrGetExperimentConfig(testKey, this.userId, userContext);
    }
    return { variantId: await this.getVariant(testKey, userContext) };
  }

  async trackConversion(testKey, metric, value = 1) {
    if (typeof window !== 'undefined' && typeof window.lmdrTrackExperimentConversion === 'function') {
      return await window.lmdrTrackExperimentConversion(testKey, this.userId, metric, value);
    }
    return { success: false, error: 'No bridge handler configured' };
  }

  _saveToCache() {
    if (typeof localStorage === 'undefined') {
      return;
    }
    localStorage.setItem(this.cacheKey, JSON.stringify({
      userId: this.userId,
      assignments: this.assignments,
      timestamp: Date.now()
    }));
  }

  _loadFromCache() {
    if (typeof localStorage === 'undefined') {
      return;
    }
    const raw = localStorage.getItem(this.cacheKey);
    if (!raw) {
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      const isSameUser = parsed.userId === this.userId;
      const isFresh = (Date.now() - parsed.timestamp) < this.ttl;
      if (isSameUser && isFresh) {
        this.assignments = parsed.assignments || {};
      }
    } catch (error) {
      localStorage.removeItem(this.cacheKey);
    }
  }
}

export const LMDRExperiment = new LMDRExperimentManager();
