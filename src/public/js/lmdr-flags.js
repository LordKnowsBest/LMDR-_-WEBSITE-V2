/**
 * LMDR Feature Flags SDK
 * 
 * Provides client-side access to feature flags with caching.
 */

class LMDRFlagsManager {
  constructor() {
    this.flags = {};
    this.userId = null;
    this.context = {};
    this.initialized = false;
    this.cacheKey = 'lmdr_flags_cache';
    this.ttl = 5 * 60 * 1000; // 5 minutes client-side cache
  }

  /**
   * Initialize the SDK with user data and fetch flags
   * 
   * @param {string} userId - Current user ID
   * @param {Object} context - User context (role, tier, etc.)
   * @param {Object} [evaluations] - Optional pre-fetched evaluations
   */
  async init(userId, context = {}, evaluations = null) {
    this.userId = userId;
    this.context = context;

    if (evaluations) {
      this.flags = evaluations;
      this.initialized = true;
      this._saveToCache();
      return;
    }

    // Try loading from cache first for immediate use
    this._loadFromCache();

    // Fetch fresh flags from backend (via Page Code)
    // In Wix, we can't directly call backend from public JS if it's used in HTML components
    // So we rely on the caller to provide evaluations or we use a global handler
    if (typeof window !== 'undefined' && window.lmdrFetchFlags) {
      try {
        const freshFlags = await window.lmdrFetchFlags(userId, context);
        this.flags = freshFlags;
        this.initialized = true;
        this._saveToCache();
      } catch (error) {
        console.warn('[LMDRFlags] Failed to fetch fresh flags:', error.message);
      }
    }
  }

  /**
   * Synchronous check for a feature flag
   */
  isEnabled(flagKey) {
    return !!this.flags[flagKey];
  }

  /**
   * Get variant for a flag (for now returns 'on'/'off')
   */
  getVariant(flagKey) {
    return this.flags[flagKey] ? 'on' : 'control';
  }

  /**
   * Track flag usage
   */
  track(flagKey, event, metadata = {}) {
    if (typeof window !== 'undefined' && window.lmdrTrackFlag) {
      window.lmdrTrackFlag(flagKey, event, metadata);
    }
  }

  _saveToCache() {
    if (typeof localStorage !== 'undefined') {
      const cacheData = {
        flags: this.flags,
        timestamp: Date.now(),
        userId: this.userId
      };
      localStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
    }
  }

  _loadFromCache() {
    if (typeof localStorage !== 'undefined') {
      const cached = localStorage.getItem(this.cacheKey);
      if (cached) {
        try {
          const data = JSON.parse(cached);
          // Only use cache if it's the same user and not expired
          if (data.userId === this.userId && (Date.now() - data.timestamp < this.ttl)) {
            this.flags = data.flags;
            this.initialized = true;
          }
        } catch (e) {
          localStorage.removeItem(this.cacheKey);
        }
      }
    }
  }
}

export const LMDRFlags = new LMDRFlagsManager();
