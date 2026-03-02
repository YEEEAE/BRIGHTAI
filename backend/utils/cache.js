/**
 * Cache Manager
 * Provides caching functionality with support for memory and Redis storage
 */

class CacheManager {
  /**
   * Create a new CacheManager instance
   * @param {object} options - Configuration options
   * @param {string} options.storage - Storage type: 'memory' or 'redis'
   * @param {number} options.ttl - Time to live in seconds (default: 300)
   * @param {number} options.maxSize - Maximum cache size for memory mode (default: 1000)
   * @param {object} options.redisClient - Redis client instance (required for redis storage)
   */
  constructor(options = {}) {
    this.storage = options.storage || 'memory';
    this.ttl = options.ttl || 300; // 5 minutes default
    this.maxSize = options.maxSize || 1000;
    
    if (this.storage === 'memory') {
      this.cache = new Map();
    } else if (this.storage === 'redis') {
      this.redisClient = options.redisClient;
      if (!this.redisClient) {
        console.warn('[Cache] Redis client not provided, falling back to memory storage');
        this.storage = 'memory';
        this.cache = new Map();
      }
    }
  }
  
  /**
   * Generate a cache key from endpoint and request body
   * @param {string} endpoint - The endpoint name
   * @param {object} body - The request body
   * @returns {string} Cache key
   */
  generateKey(endpoint, body) {
    // Sort object keys for consistent hashing
    const normalized = JSON.stringify(body, Object.keys(body).sort());
    return `${endpoint}:${this.hash(normalized)}`;
  }
  
  /**
   * Simple hash function for generating cache keys
   * @param {string} str - String to hash
   * @returns {string} Hash value
   */
  hash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
  
  /**
   * Get a value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any|null>} Cached value or null if not found/expired
   */
  async get(key) {
    if (this.storage === 'memory') {
      const item = this.cache.get(key);
      if (!item) {
        return null;
      }
      
      // Check if expired
      if (Date.now() > item.expiry) {
        this.cache.delete(key);
        return null;
      }
      
      return item.value;
    } else if (this.storage === 'redis') {
      try {
        const value = await this.redisClient.get(key);
        return value ? JSON.parse(value) : null;
      } catch (error) {
        console.error('[Cache] Redis get error:', error);
        return null;
      }
    }
    
    return null;
  }
  
  /**
   * Set a value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @returns {Promise<void>}
   */
  async set(key, value) {
    if (this.storage === 'memory') {
      this.cache.set(key, {
        value,
        expiry: Date.now() + (this.ttl * 1000)
      });
      
      // Enforce max size limit - remove oldest entry
      if (this.cache.size > this.maxSize) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
    } else if (this.storage === 'redis') {
      try {
        await this.redisClient.setex(key, this.ttl, JSON.stringify(value));
      } catch (error) {
        console.error('[Cache] Redis set error:', error);
      }
    }
  }
  
  /**
   * Clear all cached values
   * @returns {Promise<void>}
   */
  async clear() {
    if (this.storage === 'memory') {
      this.cache.clear();
    } else if (this.storage === 'redis') {
      try {
        // Note: This clears ALL keys in Redis, not just cache keys
        // In production, you might want to use a key pattern
        await this.redisClient.flushdb();
      } catch (error) {
        console.error('[Cache] Redis clear error:', error);
      }
    }
  }
  
  /**
   * Get cache statistics (memory mode only)
   * @returns {object} Cache statistics
   */
  getStats() {
    if (this.storage === 'memory') {
      return {
        size: this.cache.size,
        maxSize: this.maxSize,
        storage: this.storage
      };
    }
    
    return {
      storage: this.storage,
      message: 'Stats not available for Redis storage'
    };
  }
}

module.exports = { CacheManager };
