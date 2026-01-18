/**
 * Rate Limiter Service
 *
 * Implements a sliding window rate limiter to prevent
 * excessive requests to Medium's servers.
 */

import type {
  RateLimitConfig,
  RateLimitState,
  RateLimitResult,
} from "../types/rate-limit.types.js";
import { DEFAULT_RATE_LIMIT_CONFIG } from "../types/rate-limit.types.js";

/**
 * In-memory storage for rate limit buckets
 * Key: domain or "global"
 * Value: RateLimitState
 */
const buckets: Map<string, RateLimitState> = new Map();

/**
 * Extract domain from URL for per-domain rate limiting
 *
 * @param url - URL to extract domain from
 * @returns Domain string or "global" if extraction fails
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.toLowerCase();
  } catch {
    return "global";
  }
}

/**
 * Get the bucket key based on configuration
 *
 * @param url - URL being rate limited
 * @param config - Rate limit configuration
 * @returns Bucket key (domain or "global")
 */
function getBucketKey(url: string, config: RateLimitConfig): string {
  return config.perDomain ? extractDomain(url) : "global";
}

/**
 * Get or create a rate limit bucket
 *
 * @param key - Bucket key
 * @param config - Rate limit configuration
 * @returns Current bucket state
 */
function getOrCreateBucket(
  key: string,
  config: RateLimitConfig
): RateLimitState {
  const now = Date.now();
  let bucket = buckets.get(key);

  // Create new bucket if doesn't exist
  if (!bucket) {
    bucket = {
      count: 0,
      windowStart: now,
      resetAt: now + config.windowMs,
    };
    buckets.set(key, bucket);
    return bucket;
  }

  // Reset bucket if window has expired
  if (now >= bucket.resetAt) {
    bucket = {
      count: 0,
      windowStart: now,
      resetAt: now + config.windowMs,
    };
    buckets.set(key, bucket);
  }

  return bucket;
}

/**
 * Check if a request is allowed under rate limits
 *
 * @param url - URL being requested
 * @param config - Rate limit configuration (optional, uses defaults)
 * @returns RateLimitResult with allowed status and metadata
 */
export function checkRateLimit(
  url: string,
  config: Partial<RateLimitConfig> = {}
): RateLimitResult {
  const fullConfig: RateLimitConfig = {
    ...DEFAULT_RATE_LIMIT_CONFIG,
    ...config,
  };

  const key = getBucketKey(url, fullConfig);
  const bucket = getOrCreateBucket(key, fullConfig);
  const now = Date.now();

  const remaining = Math.max(0, fullConfig.maxRequests - bucket.count);
  const resetInMs = Math.max(0, bucket.resetAt - now);

  return {
    allowed: bucket.count < fullConfig.maxRequests,
    remaining,
    resetInMs,
    count: bucket.count,
  };
}

/**
 * Record a request against the rate limit
 *
 * @param url - URL being requested
 * @param config - Rate limit configuration (optional, uses defaults)
 * @returns RateLimitResult after recording the request
 */
export function recordRequest(
  url: string,
  config: Partial<RateLimitConfig> = {}
): RateLimitResult {
  const fullConfig: RateLimitConfig = {
    ...DEFAULT_RATE_LIMIT_CONFIG,
    ...config,
  };

  const key = getBucketKey(url, fullConfig);
  const bucket = getOrCreateBucket(key, fullConfig);
  const now = Date.now();

  // Increment count
  bucket.count++;

  const remaining = Math.max(0, fullConfig.maxRequests - bucket.count);
  const resetInMs = Math.max(0, bucket.resetAt - now);

  return {
    allowed: bucket.count <= fullConfig.maxRequests,
    remaining,
    resetInMs,
    count: bucket.count,
  };
}

/**
 * Check rate limit and record request in one operation
 *
 * @param url - URL being requested
 * @param config - Rate limit configuration (optional, uses defaults)
 * @returns RateLimitResult - if allowed is false, request should be rejected
 */
export function consumeRateLimit(
  url: string,
  config: Partial<RateLimitConfig> = {}
): RateLimitResult {
  const check = checkRateLimit(url, config);

  if (!check.allowed) {
    return check;
  }

  return recordRequest(url, config);
}

/**
 * Reset rate limit for a specific URL/domain
 *
 * @param url - URL to reset rate limit for
 * @param config - Rate limit configuration (optional)
 */
export function resetRateLimit(
  url: string,
  config: Partial<RateLimitConfig> = {}
): void {
  const fullConfig: RateLimitConfig = {
    ...DEFAULT_RATE_LIMIT_CONFIG,
    ...config,
  };

  const key = getBucketKey(url, fullConfig);
  buckets.delete(key);
}

/**
 * Reset all rate limits
 */
export function resetAllRateLimits(): void {
  buckets.clear();
}

/**
 * Get current rate limit status for a URL
 *
 * @param url - URL to check
 * @param config - Rate limit configuration (optional)
 * @returns Current status or null if no bucket exists
 */
export function getRateLimitStatus(
  url: string,
  config: Partial<RateLimitConfig> = {}
): RateLimitResult | null {
  const fullConfig: RateLimitConfig = {
    ...DEFAULT_RATE_LIMIT_CONFIG,
    ...config,
  };

  const key = getBucketKey(url, fullConfig);
  const bucket = buckets.get(key);

  if (!bucket) {
    return null;
  }

  const now = Date.now();

  // Check if window expired
  if (now >= bucket.resetAt) {
    return null;
  }

  const remaining = Math.max(0, fullConfig.maxRequests - bucket.count);
  const resetInMs = Math.max(0, bucket.resetAt - now);

  return {
    allowed: bucket.count < fullConfig.maxRequests,
    remaining,
    resetInMs,
    count: bucket.count,
  };
}
