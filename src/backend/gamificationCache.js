/**
 * Gamification Cache Service
 *
 * In-memory caching for frequently accessed gamification data.
 * Uses TTL-based expiration to balance freshness with performance.
 *
 * Cache keys:
 * - driver_prog_{driverId} - Driver progression data
 * - recruiter_prog_{recruiterId} - Recruiter progression data
 * - leaderboard_{type}_{period} - Leaderboard snapshots
 * - active_events - Currently active events
 * - event_multipliers - Current event multipliers
 */

// =============================================================================
// CACHE CONFIGURATION
// =============================================================================

const CACHE_CONFIG = {
    // Driver/recruiter progression - 30 second TTL (frequently updated)
    progression: {
        ttl: 30 * 1000,
        prefix: 'prog_'
    },
    // Leaderboards - 5 minute TTL (expensive queries, updated periodically)
    leaderboard: {
        ttl: 5 * 60 * 1000,
        prefix: 'lb_'
    },
    // Active events - 1 minute TTL (rarely changes)
    events: {
        ttl: 60 * 1000,
        prefix: 'evt_'
    },
    // Event multipliers - 1 minute TTL
    multipliers: {
        ttl: 60 * 1000,
        prefix: 'mult_'
    },
    // Achievement definitions - 10 minute TTL (rarely changes)
    definitions: {
        ttl: 10 * 60 * 1000,
        prefix: 'def_'
    },
    // User achievements - 1 minute TTL
    achievements: {
        ttl: 60 * 1000,
        prefix: 'ach_'
    },
    // User challenges - 30 second TTL
    challenges: {
        ttl: 30 * 1000,
        prefix: 'chal_'
    }
};

// =============================================================================
// IN-MEMORY CACHE STORE
// =============================================================================

// Cache storage: Map<key, { value, expiresAt }>
const cache = new Map();

// Statistics tracking
const stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    evictions: 0
};

// =============================================================================
// CORE CACHE FUNCTIONS
// =============================================================================

/**
 * Get a value from cache
 * @param {string} key - Cache key
 * @returns {*} Cached value or null if not found/expired
 */
export function get(key) {
    const entry = cache.get(key);

    if (!entry) {
        stats.misses++;
        return null;
    }

    // Check expiration
    if (Date.now() > entry.expiresAt) {
        cache.delete(key);
        stats.evictions++;
        stats.misses++;
        return null;
    }

    stats.hits++;
    return entry.value;
}

/**
 * Set a value in cache
 * @param {string} key - Cache key
 * @param {*} value - Value to cache
 * @param {number} ttl - Time to live in milliseconds
 */
export function set(key, value, ttl) {
    cache.set(key, {
        value,
        expiresAt: Date.now() + ttl
    });
    stats.sets++;
}

/**
 * Delete a specific cache key
 * @param {string} key - Cache key to delete
 */
export function del(key) {
    cache.delete(key);
}

/**
 * Delete all cache keys matching a prefix
 * @param {string} prefix - Prefix to match
 */
export function delByPrefix(prefix) {
    for (const key of cache.keys()) {
        if (key.startsWith(prefix)) {
            cache.delete(key);
        }
    }
}

/**
 * Clear entire cache
 */
export function clear() {
    cache.clear();
}

/**
 * Get cache statistics
 * @returns {object} Cache statistics
 */
export function getStats() {
    const hitRate = stats.hits + stats.misses > 0
        ? (stats.hits / (stats.hits + stats.misses) * 100).toFixed(2)
        : 0;

    return {
        size: cache.size,
        hits: stats.hits,
        misses: stats.misses,
        sets: stats.sets,
        evictions: stats.evictions,
        hitRate: `${hitRate}%`
    };
}

// =============================================================================
// TYPED CACHE HELPERS
// =============================================================================

/**
 * Get or set driver progression with caching
 * @param {string} driverId - Driver ID
 * @param {Function} fetchFn - Function to fetch data if not cached
 * @returns {Promise<object>} Driver progression data
 */
export async function getDriverProgression(driverId, fetchFn) {
    const key = `${CACHE_CONFIG.progression.prefix}driver_${driverId}`;
    const cached = get(key);

    if (cached) {
        return cached;
    }

    const data = await fetchFn();
    if (data) {
        set(key, data, CACHE_CONFIG.progression.ttl);
    }
    return data;
}

/**
 * Invalidate driver progression cache
 * @param {string} driverId - Driver ID
 */
export function invalidateDriverProgression(driverId) {
    del(`${CACHE_CONFIG.progression.prefix}driver_${driverId}`);
}

/**
 * Get or set recruiter progression with caching
 * @param {string} recruiterId - Recruiter ID
 * @param {Function} fetchFn - Function to fetch data if not cached
 * @returns {Promise<object>} Recruiter progression data
 */
export async function getRecruiterProgression(recruiterId, fetchFn) {
    const key = `${CACHE_CONFIG.progression.prefix}recruiter_${recruiterId}`;
    const cached = get(key);

    if (cached) {
        return cached;
    }

    const data = await fetchFn();
    if (data) {
        set(key, data, CACHE_CONFIG.progression.ttl);
    }
    return data;
}

/**
 * Invalidate recruiter progression cache
 * @param {string} recruiterId - Recruiter ID
 */
export function invalidateRecruiterProgression(recruiterId) {
    del(`${CACHE_CONFIG.progression.prefix}recruiter_${recruiterId}`);
}

/**
 * Get or set leaderboard with caching
 * @param {string} type - Leaderboard type
 * @param {string} period - Time period
 * @param {Function} fetchFn - Function to fetch data if not cached
 * @returns {Promise<object>} Leaderboard data
 */
export async function getLeaderboard(type, period, fetchFn) {
    const key = `${CACHE_CONFIG.leaderboard.prefix}${type}_${period}`;
    const cached = get(key);

    if (cached) {
        return cached;
    }

    const data = await fetchFn();
    if (data) {
        set(key, data, CACHE_CONFIG.leaderboard.ttl);
    }
    return data;
}

/**
 * Invalidate all leaderboard caches
 */
export function invalidateLeaderboards() {
    delByPrefix(CACHE_CONFIG.leaderboard.prefix);
}

/**
 * Get or set active events with caching
 * @param {Function} fetchFn - Function to fetch data if not cached
 * @returns {Promise<Array>} Active events
 */
export async function getActiveEvents(fetchFn) {
    const key = `${CACHE_CONFIG.events.prefix}active`;
    const cached = get(key);

    if (cached) {
        return cached;
    }

    const data = await fetchFn();
    if (data) {
        set(key, data, CACHE_CONFIG.events.ttl);
    }
    return data;
}

/**
 * Invalidate events cache
 */
export function invalidateEvents() {
    delByPrefix(CACHE_CONFIG.events.prefix);
}

/**
 * Get or set event multipliers with caching
 * @param {string} type - 'xp' or 'points'
 * @param {Function} fetchFn - Function to fetch data if not cached
 * @returns {Promise<number>} Multiplier value
 */
export async function getEventMultiplier(type, fetchFn) {
    const key = `${CACHE_CONFIG.multipliers.prefix}${type}`;
    const cached = get(key);

    if (cached !== null) {
        return cached;
    }

    const data = await fetchFn();
    set(key, data, CACHE_CONFIG.multipliers.ttl);
    return data;
}

/**
 * Invalidate multiplier caches
 */
export function invalidateMultipliers() {
    delByPrefix(CACHE_CONFIG.multipliers.prefix);
}

/**
 * Get or set achievement definitions with caching
 * @param {string} userType - 'driver' or 'recruiter'
 * @param {Function} fetchFn - Function to fetch data if not cached
 * @returns {Promise<Array>} Achievement definitions
 */
export async function getAchievementDefinitions(userType, fetchFn) {
    const key = `${CACHE_CONFIG.definitions.prefix}achievements_${userType}`;
    const cached = get(key);

    if (cached) {
        return cached;
    }

    const data = await fetchFn();
    if (data) {
        set(key, data, CACHE_CONFIG.definitions.ttl);
    }
    return data;
}

/**
 * Get or set badge definitions with caching
 * @param {string} userType - 'driver' or 'recruiter'
 * @param {Function} fetchFn - Function to fetch data if not cached
 * @returns {Promise<Array>} Badge definitions
 */
export async function getBadgeDefinitions(userType, fetchFn) {
    const key = `${CACHE_CONFIG.definitions.prefix}badges_${userType}`;
    const cached = get(key);

    if (cached) {
        return cached;
    }

    const data = await fetchFn();
    if (data) {
        set(key, data, CACHE_CONFIG.definitions.ttl);
    }
    return data;
}

/**
 * Invalidate definition caches
 */
export function invalidateDefinitions() {
    delByPrefix(CACHE_CONFIG.definitions.prefix);
}

/**
 * Get or set user achievements with caching
 * @param {string} userId - User ID
 * @param {string} userType - 'driver' or 'recruiter'
 * @param {Function} fetchFn - Function to fetch data if not cached
 * @returns {Promise<Array>} User achievements
 */
export async function getUserAchievements(userId, userType, fetchFn) {
    const key = `${CACHE_CONFIG.achievements.prefix}${userType}_${userId}`;
    const cached = get(key);

    if (cached) {
        return cached;
    }

    const data = await fetchFn();
    if (data) {
        set(key, data, CACHE_CONFIG.achievements.ttl);
    }
    return data;
}

/**
 * Invalidate user achievements cache
 * @param {string} userId - User ID
 * @param {string} userType - 'driver' or 'recruiter'
 */
export function invalidateUserAchievements(userId, userType) {
    del(`${CACHE_CONFIG.achievements.prefix}${userType}_${userId}`);
}

/**
 * Get or set user challenges with caching
 * @param {string} userId - User ID
 * @param {string} userType - 'driver' or 'recruiter'
 * @param {Function} fetchFn - Function to fetch data if not cached
 * @returns {Promise<Array>} User challenges
 */
export async function getUserChallenges(userId, userType, fetchFn) {
    const key = `${CACHE_CONFIG.challenges.prefix}${userType}_${userId}`;
    const cached = get(key);

    if (cached) {
        return cached;
    }

    const data = await fetchFn();
    if (data) {
        set(key, data, CACHE_CONFIG.challenges.ttl);
    }
    return data;
}

/**
 * Invalidate user challenges cache
 * @param {string} userId - User ID
 * @param {string} userType - 'driver' or 'recruiter'
 */
export function invalidateUserChallenges(userId, userType) {
    del(`${CACHE_CONFIG.challenges.prefix}${userType}_${userId}`);
}

// =============================================================================
// BATCH INVALIDATION
// =============================================================================

/**
 * Invalidate all caches for a specific user
 * @param {string} userId - User ID
 * @param {string} userType - 'driver' or 'recruiter'
 */
export function invalidateUserCaches(userId, userType) {
    if (userType === 'driver') {
        invalidateDriverProgression(userId);
    } else {
        invalidateRecruiterProgression(userId);
    }
    invalidateUserAchievements(userId, userType);
    invalidateUserChallenges(userId, userType);
}

/**
 * Invalidate all gamification caches
 * Used after major updates or configuration changes
 */
export function invalidateAll() {
    clear();
}

// =============================================================================
// CACHE WARMING
// =============================================================================

/**
 * Pre-warm cache for a user
 * Call this when a user logs in to reduce latency on first requests
 * @param {string} userId - User ID
 * @param {string} userType - 'driver' or 'recruiter'
 * @param {object} warmFunctions - Object containing fetch functions
 */
export async function warmUserCache(userId, userType, warmFunctions) {
    const promises = [];

    if (warmFunctions.getProgression) {
        if (userType === 'driver') {
            promises.push(getDriverProgression(userId, warmFunctions.getProgression));
        } else {
            promises.push(getRecruiterProgression(userId, warmFunctions.getProgression));
        }
    }

    if (warmFunctions.getAchievements) {
        promises.push(getUserAchievements(userId, userType, warmFunctions.getAchievements));
    }

    if (warmFunctions.getChallenges) {
        promises.push(getUserChallenges(userId, userType, warmFunctions.getChallenges));
    }

    await Promise.all(promises);
}

// =============================================================================
// CACHE CLEANUP (Periodic)
// =============================================================================

/**
 * Clean up expired cache entries
 * Call this periodically to prevent memory bloat
 * @returns {number} Number of entries cleaned
 */
export function cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of cache.entries()) {
        if (now > entry.expiresAt) {
            cache.delete(key);
            cleaned++;
        }
    }

    stats.evictions += cleaned;
    return cleaned;
}

// Export config for testing/debugging
export { CACHE_CONFIG };
