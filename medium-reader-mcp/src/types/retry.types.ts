/**
 * Retry Configuration Types
 *
 * Types for configuring retry behavior with exponential backoff.
 */

/**
 * Configuration for retry behavior
 */
export interface RetryConfig {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries: number;

  /** Initial delay before first retry in ms (default: 1000) */
  initialDelayMs: number;

  /** Maximum delay between retries in ms (default: 10000) */
  maxDelayMs: number;

  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier: number;

  /** Add random jitter to delays to avoid thundering herd (default: true) */
  jitter: boolean;
}

/**
 * Result of a retry operation
 */
export interface RetryResult<T> {
  /** Whether the operation succeeded */
  success: boolean;

  /** The result if successful */
  result?: T;

  /** Error message if failed */
  error?: string;

  /** Number of attempts made */
  attempts: number;

  /** Whether the error is retryable */
  retryable: boolean;
}

/**
 * Error classification for retry decisions
 */
export enum RetryableErrorType {
  /** Network errors (ECONNRESET, ETIMEDOUT, etc.) */
  NETWORK = "NETWORK",

  /** Server errors (5xx status codes) */
  SERVER = "SERVER",

  /** Rate limiting (429 status code) */
  RATE_LIMIT = "RATE_LIMIT",

  /** Timeout errors */
  TIMEOUT = "TIMEOUT",

  /** Non-retryable errors (4xx except 429, parsing errors, etc.) */
  NON_RETRYABLE = "NON_RETRYABLE",
}

/**
 * Default retry configuration
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  jitter: true,
};
