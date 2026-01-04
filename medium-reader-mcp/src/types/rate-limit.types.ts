/**
 * Rate Limiting Types
 *
 * Types for configuring and managing rate limiting.
 */

/**
 * Configuration for rate limiting
 */
export interface RateLimitConfig {
  /** Maximum requests allowed per window (default: 10) */
  maxRequests: number;

  /** Time window in milliseconds (default: 60000 = 1 minute) */
  windowMs: number;

  /** Whether to track per-domain or globally (default: true) */
  perDomain: boolean;
}

/**
 * State of a rate limit bucket
 */
export interface RateLimitState {
  /** Number of requests made in current window */
  count: number;

  /** Timestamp when the window started */
  windowStart: number;

  /** Timestamp when rate limit will reset */
  resetAt: number;
}

/**
 * Result of a rate limit check
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;

  /** Remaining requests in current window */
  remaining: number;

  /** Time in ms until rate limit resets */
  resetInMs: number;

  /** Current request count in window */
  count: number;
}

/**
 * Default rate limit configuration
 */
export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60000, // 1 minute
  perDomain: true,
};
