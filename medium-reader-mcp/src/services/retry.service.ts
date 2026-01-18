/**
 * Retry Service
 *
 * Implements retry logic with exponential backoff and jitter.
 */

import type { RetryConfig, RetryResult } from "../types/retry.types.js";
import {
  RetryableErrorType,
  DEFAULT_RETRY_CONFIG,
} from "../types/retry.types.js";

/**
 * Classify an error to determine if it's retryable
 *
 * @param error - Error message or status code
 * @returns The error type classification
 */
export function classifyError(error: string | number): RetryableErrorType {
  // If it's a status code
  if (typeof error === "number") {
    if (error === 429) {
      return RetryableErrorType.RATE_LIMIT;
    }
    if (error >= 500 && error < 600) {
      return RetryableErrorType.SERVER;
    }
    // 4xx errors (except 429) are not retryable
    if (error >= 400 && error < 500) {
      return RetryableErrorType.NON_RETRYABLE;
    }
  }

  // If it's an error message
  const errorStr = String(error).toLowerCase();

  // Timeout errors
  if (
    errorStr.includes("timeout") ||
    errorStr.includes("timed out") ||
    errorStr.includes("aborted")
  ) {
    return RetryableErrorType.TIMEOUT;
  }

  // Network errors
  if (
    errorStr.includes("econnreset") ||
    errorStr.includes("econnrefused") ||
    errorStr.includes("etimedout") ||
    errorStr.includes("enotfound") ||
    errorStr.includes("network") ||
    errorStr.includes("socket") ||
    errorStr.includes("dns")
  ) {
    return RetryableErrorType.NETWORK;
  }

  // Server errors in message
  if (errorStr.includes("500") || errorStr.includes("502") ||
      errorStr.includes("503") || errorStr.includes("504")) {
    return RetryableErrorType.SERVER;
  }

  // Rate limiting in message
  if (errorStr.includes("429") || errorStr.includes("rate limit")) {
    return RetryableErrorType.RATE_LIMIT;
  }

  // Default to non-retryable for unknown errors
  return RetryableErrorType.NON_RETRYABLE;
}

/**
 * Check if an error type is retryable
 *
 * @param errorType - The classified error type
 * @returns true if the error is retryable
 */
export function isRetryable(errorType: RetryableErrorType): boolean {
  return errorType !== RetryableErrorType.NON_RETRYABLE;
}

/**
 * Calculate delay for next retry attempt using exponential backoff
 *
 * @param attempt - Current attempt number (0-based)
 * @param config - Retry configuration
 * @returns Delay in milliseconds
 */
export function calculateDelay(attempt: number, config: RetryConfig): number {
  // Exponential backoff: initialDelay * (multiplier ^ attempt)
  let delay =
    config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt);

  // Cap at max delay
  delay = Math.min(delay, config.maxDelayMs);

  // Add jitter (random variance of ±25%)
  if (config.jitter) {
    const jitterRange = delay * 0.25;
    const jitter = Math.random() * jitterRange * 2 - jitterRange;
    delay = Math.max(0, delay + jitter);
  }

  return Math.round(delay);
}

/**
 * Sleep for a specified duration
 *
 * @param ms - Duration in milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute an async operation with retry logic
 *
 * @param operation - The async operation to execute
 * @param config - Retry configuration (optional, uses defaults)
 * @returns RetryResult with the operation result or error
 *
 * @example
 * const result = await withRetry(
 *   async () => {
 *     const response = await fetch(url);
 *     if (!response.ok) throw new Error(`HTTP ${response.status}`);
 *     return response.text();
 *   },
 *   { maxRetries: 3 }
 * );
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<RetryResult<T>> {
  const fullConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: string = "";
  let attempts = 0;

  for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
    attempts = attempt + 1;

    try {
      const result = await operation();
      return {
        success: true,
        result,
        attempts,
        retryable: false,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      lastError = errorMessage;

      const errorType = classifyError(errorMessage);
      const canRetry = isRetryable(errorType);

      // Log retry attempt
      console.error(
        `Attempt ${attempts}/${fullConfig.maxRetries + 1} failed: ${errorMessage}`
      );

      // If not retryable or last attempt, return failure
      if (!canRetry || attempt === fullConfig.maxRetries) {
        return {
          success: false,
          error: lastError,
          attempts,
          retryable: canRetry,
        };
      }

      // Calculate and wait for delay before next attempt
      const delay = calculateDelay(attempt, fullConfig);
      console.error(`Retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  // Should never reach here, but TypeScript needs this
  return {
    success: false,
    error: lastError,
    attempts,
    retryable: false,
  };
}

/**
 * Create a retry wrapper for a specific configuration
 *
 * @param config - Retry configuration
 * @returns A function that wraps operations with retry logic
 *
 * @example
 * const retryWithConfig = createRetryWrapper({ maxRetries: 5 });
 * const result = await retryWithConfig(() => fetchData());
 */
export function createRetryWrapper(
  config: Partial<RetryConfig>
): <T>(operation: () => Promise<T>) => Promise<RetryResult<T>> {
  return <T>(operation: () => Promise<T>) => withRetry(operation, config);
}
