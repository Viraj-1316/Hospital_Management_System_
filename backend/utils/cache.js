/**
 * Simple In-Memory Cache for Render Free Tier
 * Reduces database queries for frequently accessed, rarely changing data
 */

class SimpleCache {
  constructor() {
    this.cache = new Map();
  }

  /**
   * Get item from cache
   * @param {string} key 
   * @returns {any|null} Cached value or null if expired/missing
   */
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  /**
   * Set item in cache with TTL
   * @param {string} key 
   * @param {any} value 
   * @param {number} ttlSeconds - Time to live in seconds (default: 5 minutes)
   */
  set(key, value, ttlSeconds = 300) {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttlSeconds * 1000)
    });
  }

  /**
   * Delete specific key
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all cached items
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Clear items matching a prefix (useful for invalidating related data)
   * @param {string} prefix 
   */
  clearByPrefix(prefix) {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
const cache = new SimpleCache();

module.exports = cache;
