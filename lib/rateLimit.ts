import { TimeUnit } from '#/types';
import { headers } from 'next/headers';
import { parseDuration } from '#/lib/utils';

/**
 * The default time window for rate limiting in milliseconds (30 seconds).
 * @type {number}
 */
const DEFAULT_TIME_WINDOW = 30 * 1000; // 30 seconds

/**
 * The default request limit within the time window (5 requests).
 * @type {number}
 */
const DEFAULT_REQUEST_LIMIT = 5; // 5 requests per 30 seconds

/**
 * Configuration options for rate limiting.
 * @typedef {Object} RateLimitConfig
 * @property {number} timeWindow - The time window for rate limiting in milliseconds.
 * @property {number} requestLimit - The maximum number of requests allowed within the time window.
 */
interface RateLimitConfig {
  timeWindow: number;
  requestLimit: number;
};

/**
 * A map of rate limit configurations, keyed by a string identifier.
 * @type {Map<string, RateLimitConfig>}
 */
const rateLimitConfigs = new Map<string, RateLimitConfig>();

/**
 * A map of request counters for each rate limit key and IP address.
 * @type {Map<string, Map<string, number>>}
 */
const requestCounters = new Map<string, Map<string, number>>();

/**
 * A map of reset timers for each rate limit key.
 * @type {Map<string, NodeJS.Timeout>}
 */
const resetTimers = new Map<string, NodeJS.Timeout>();

/**
 * Resets the request counters for a specific rate limit key.
 * @param {string} key - The identifier for the rate limit configuration.
 */
const resetCounters = (key: string): void => {
  requestCounters.get(key)?.clear();
  clearTimeout(resetTimers.get(key));
  const config = rateLimitConfigs.get(key) || { timeWindow: DEFAULT_TIME_WINDOW, requestLimit: DEFAULT_REQUEST_LIMIT };
  resetTimers.set(key, setTimeout(() => resetCounters(key), config.timeWindow));
};

/**
 * Sets the configuration for a specific rate limit.
 * @param {string} key - The identifier for the rate limit configuration.
 * @param {`${number} ${TimeUnit}`} [timeWindow] - The time window for rate limiting as a string (e.g., '30 s', '1 m', '1 h').
 * @param {number} [requestLimit] - The maximum number of requests allowed within the time window.
 * @param {boolean} [forceUpdate=false] - Whether to force update an existing rate limit configuration.
 * 
 * @example
 * // Set up a rate limit for API calls
 * setRateLimitConfig('apiCalls', '1 m', 100); // 100 requests per minute
 * 
 * @example
 * // Set up a rate limit for file uploads
 * setRateLimitConfig('fileUploads', '1 h', 10); // 10 requests per hour
 */
const setRateLimitConfig = (key: string, timeWindow?: `${number} ${TimeUnit}`, requestLimit?: number, forceUpdate = false): void => {
  if (!rateLimitConfigs.has(key) || forceUpdate) {
    const config: RateLimitConfig = {
      timeWindow: parseDuration(timeWindow ?? '30 s') / 1000 || DEFAULT_TIME_WINDOW,
      requestLimit: requestLimit || DEFAULT_REQUEST_LIMIT
    };

    rateLimitConfigs.set(key, config);
    requestCounters.set(key, new Map<string, number>());
    resetCounters(key);
  }
};

/**
 * Checks if the current request exceeds the rate limit for the specified key.
 * @param {string} key - The identifier for the rate limit configuration.
 * @returns {Promise<boolean>} A promise that resolves to true if the rate limit is exceeded, false otherwise.
 * 
 * @example
 * // Check rate limit for API calls
 * const isLimited = await rateLimit('apiCalls');
 * if (isLimited) {
 *   throw new Error('Rate limit exceeded');
 * }
 * 
 * @example
 * // Check rate limit for file uploads
 * const isLimited = await rateLimit('fileUploads');
 * if (isLimited) {
 *   return res.status(429).json({ error: 'Too many file uploads. Please try again later.' });
 * }
 */
const rateLimit = async (key: string): Promise<boolean> => {
  if (!rateLimitConfigs.has(key)) {
    setRateLimitConfig(key);
  }

  const ipHeader = headers().get('x-forwarded-for');
  const [ip] = ipHeader?.match(/[^,]+/) ?? ['unknown'];

  const config = rateLimitConfigs.get(key)!;
  const counter = requestCounters.get(key)!;
  const requestCount = counter.get(ip) || 0;

  if (requestCount >= config.requestLimit) {
    return true;
  } else {
    counter.set(ip, requestCount + 1);
    console.log(`Request count for IP: ${ip} on key: ${key} = ${requestCount + 1}`);
    return false;
  }
};

export { rateLimit, setRateLimitConfig };
