import { LRUCache } from 'lru-cache';

/**
 * Configuration options for the cache.
 * @typedef {Object} CacheConfig
 * @property {number} max - The maximum number of items to store in the cache.
 * @property {number} ttl - The time-to-live for cache items in milliseconds.
 */
interface CacheConfig {
	max: number;
	ttl: number;
};

/**
 * A map of LRU caches, keyed by a string identifier.
 * @type {Map<string, LRUCache<string, any>>}
 */
const caches = new Map<string, LRUCache<string, any>>();

/**
 * The default maximum number of items for a cache.
 * @type {number}
 */
const DEFAULT_MAX = 1000;

/**
 * The default time-to-live for cache items in milliseconds (1 hour).
 * @type {number}
 */
const DEFAULT_TTL = 1000 * 60 * 60; // 1 hour

/**
 * Sets the configuration for a specific cache.
 * @param {string} key - The identifier for the cache.
 * @param {Partial<CacheConfig>} [config] - The configuration options for the cache.
 * @param {boolean} [forceUpdate=false] - Whether to force update an existing cache configuration.
 * 
 * @example
 * // Set up a cache for user profiles
 * setCacheConfig('userProfiles', { max: 500, ttl: 1000 * 60 * 5 }); // 500 items, 5 minutes TTL
 */
const setCacheConfig = (key: string, config?: Partial<CacheConfig>, forceUpdate = false): void => {
	if (!caches.has(key) || forceUpdate) {
		const cacheConfig: CacheConfig = {
			max: config?.max || DEFAULT_MAX,
			ttl: config?.ttl || DEFAULT_TTL,
		};
		caches.set(key, new LRUCache(cacheConfig));
	}
};

/**
 * Retrieves a value from the specified cache.
 * @template T
 * @param {string} key - The identifier for the cache.
 * @param {string} cacheKey - The key for the cached item.
 * @returns {T | undefined} The cached value, or undefined if not found.
 * 
 * @example
 * // Get a user profile from cache
 * const userProfile = getCache<UserProfile>('userProfiles', 'user123');
 */
const getCache = <T>(key: string, cacheKey: string): T | undefined => {
	if (!caches.has(key)) {
		setCacheConfig(key);
	}
	return caches.get(key)!.get(cacheKey) as T | undefined;
};

/**
 * Sets a value in the specified cache.
 * @template T
 * @param {string} key - The identifier for the cache.
 * @param {string} cacheKey - The key for the cached item.
 * @param {T} value - The value to cache.
 * 
 * @example
 * // Cache a user profile
 * setCache('userProfiles', 'user123', { id: 'user123', name: 'John Doe' });
 */
const setCache = <T>(key: string, cacheKey: string, value: T): void => {
	if (!caches.has(key)) {
		setCacheConfig(key);
	}
	caches.get(key)!.set(cacheKey, value);
};

export { setCacheConfig, getCache, setCache };
