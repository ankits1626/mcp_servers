/**
 * HTTP Service for Medium Reader
 *
 * Handles HTTP fetching with authentication, error handling, and retry logic.
 */

import { BROWSER_HEADERS, TIMEOUTS } from "../config/index.js";
import type { FetchResult } from "../types/index.js";
import type { RetryConfig } from "../types/retry.types.js";
import {
  formatError,
  authRequiredError,
  authExpiredError,
  paywallError,
  timeoutError,
  networkError,
  serverError,
  articleNotFoundError,
  rateLimitedError,
  ErrorCode,
} from "../utils/error-messages.utils.js";
import {
  getChromeCookies,
  hasEnvCookies,
  getEnvCookies,
} from "./cookie.service.js";
import { withRetry, classifyError, isRetryable } from "./retry.service.js";
import { RetryableErrorType } from "../types/retry.types.js";

/**
 * Check if an error indicates authentication failure
 *
 * @param error - Error message to check
 * @returns true if error is auth-related
 */
export function isAuthError(error?: string): boolean {
  if (!error) return false;
  return (
    error.includes("403") ||
    error.includes("401") ||
    error.includes("paywall") ||
    error.includes("expired") ||
    error.includes("Authentication failed") ||
    error.includes(ErrorCode.AUTH_REQUIRED) ||
    error.includes(ErrorCode.AUTH_EXPIRED) ||
    error.includes(ErrorCode.PAYWALL)
  );
}

/**
 * Check if an error should trigger a retry
 *
 * @param error - Error message
 * @param statusCode - HTTP status code (optional)
 * @returns true if the error is retryable
 */
export function shouldRetry(error?: string, statusCode?: number): boolean {
  if (statusCode) {
    const errorType = classifyError(statusCode);
    return isRetryable(errorType);
  }

  if (error) {
    const errorType = classifyError(error);
    return isRetryable(errorType);
  }

  return false;
}

/**
 * Fetch a URL with optional cookie authentication (single attempt)
 *
 * @param url - URL to fetch
 * @param timeout - Timeout in milliseconds
 * @param cookieString - Optional cookie string for authentication
 * @returns FetchResult with success status and content or error
 */
export async function fetchWithCookies(
  url: string,
  timeout: number,
  cookieString: string | null
): Promise<FetchResult> {
  const authenticated = cookieString !== null;
  const headers: Record<string, string> = { ...BROWSER_HEADERS };

  if (cookieString) {
    headers.Cookie = cookieString;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      signal: controller.signal,
      headers,
      redirect: "follow",
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Handle specific status codes with user-friendly messages
      if (response.status === 401 || response.status === 403) {
        const error = authenticated
          ? authExpiredError()
          : authRequiredError(response.status);
        return {
          success: false,
          error: formatError(error),
          authenticated,
        };
      }

      if (response.status === 404) {
        return {
          success: false,
          error: formatError(articleNotFoundError(url)),
          authenticated,
        };
      }

      if (response.status === 429) {
        return {
          success: false,
          error: formatError(rateLimitedError(60000)),
          authenticated,
        };
      }

      if (response.status >= 500) {
        // For 5xx errors, throw to trigger retry
        throw new Error(`SERVER_ERROR_${response.status}`);
      }

      // Generic HTTP error
      return {
        success: false,
        error: `HTTP ${response.status} ${response.statusText}`,
        authenticated,
      };
    }

    const content = await response.text();

    // Check if we got a paywall page
    if (
      content.includes("Get unlimited access") ||
      content.includes("Read without limits")
    ) {
      return {
        success: false,
        error: formatError(paywallError(authenticated)),
        authenticated,
      };
    }

    return { success: true, content, authenticated };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      // Timeout - throw to trigger retry
      throw new Error(`TIMEOUT_${timeout}`);
    }

    const message = error instanceof Error ? error.message : "Unknown error";

    // Check if this is a retryable error we threw
    if (message.startsWith("SERVER_ERROR_") || message.startsWith("TIMEOUT_")) {
      throw error; // Re-throw for retry handling
    }

    // Network errors - throw to trigger retry
    const errorType = classifyError(message);
    if (errorType === RetryableErrorType.NETWORK) {
      throw error;
    }

    // Non-retryable error
    return {
      success: false,
      error: formatError(networkError(message)),
      authenticated,
    };
  }
}

/**
 * Fetch a URL with retry logic
 *
 * @param url - URL to fetch
 * @param timeout - Timeout in milliseconds
 * @param cookieString - Optional cookie string for authentication
 * @param retryConfig - Optional retry configuration
 * @returns FetchResult with content or error
 */
export async function fetchWithRetry(
  url: string,
  timeout: number,
  cookieString: string | null,
  retryConfig?: Partial<RetryConfig>
): Promise<FetchResult> {
  const authenticated = cookieString !== null;

  const result = await withRetry(
    async () => {
      const fetchResult = await fetchWithCookies(url, timeout, cookieString);

      // If fetch returned a non-retryable error, don't retry
      if (!fetchResult.success) {
        // Check if this error should be retried
        if (!shouldRetry(fetchResult.error)) {
          // Return the result wrapped in a way that stops retries
          return fetchResult;
        }
        // Throw to trigger retry
        throw new Error(fetchResult.error);
      }

      return fetchResult;
    },
    retryConfig
  );

  if (result.success && result.result) {
    return result.result;
  }

  // Handle retry failure
  const errorMessage = result.error || "Unknown error after retries";

  // Parse the error to provide better message
  if (errorMessage.startsWith("SERVER_ERROR_")) {
    const statusCode = parseInt(errorMessage.replace("SERVER_ERROR_", ""), 10);
    return {
      success: false,
      error: formatError(serverError(statusCode)),
      authenticated,
    };
  }

  if (errorMessage.startsWith("TIMEOUT_")) {
    const timeoutMs = parseInt(errorMessage.replace("TIMEOUT_", ""), 10);
    return {
      success: false,
      error: formatError(timeoutError(timeoutMs)),
      authenticated,
    };
  }

  return {
    success: false,
    error: errorMessage,
    authenticated,
  };
}

/**
 * Fetch Medium article with automatic cookie detection, fallback, and retry
 *
 * Priority:
 * 1. Try .env cookies first (if configured)
 * 2. Try Chrome cookies (auto-read from database)
 * 3. Fall back to unauthenticated fetch
 *
 * Each attempt uses retry logic for transient failures.
 *
 * @param url - Medium article URL
 * @param timeout - Timeout in milliseconds (default: 15000)
 * @returns FetchResult with content or error
 */
export async function fetchWithAutoAuth(
  url: string,
  timeout: number = TIMEOUTS.DEFAULT
): Promise<FetchResult> {
  // 1. Try .env cookies first
  if (hasEnvCookies()) {
    console.error("Using cookies from .env file...");
    const envCookies = getEnvCookies();
    const result = await fetchWithRetry(url, timeout, envCookies);

    if (result.success) {
      return result;
    }

    // If auth error with .env cookies, try Chrome cookies
    if (isAuthError(result.error)) {
      console.error(".env cookies failed, trying Chrome cookies...");
    } else {
      return result; // Non-auth error, return as-is
    }
  }

  // 2. Try Chrome cookies
  const chromeCookies = await getChromeCookies();
  if (chromeCookies) {
    console.error("Using ALL cookies from Chrome...");
    const result = await fetchWithRetry(url, timeout, chromeCookies);
    if (result.success) {
      return result;
    }
    console.error(`Chrome cookies failed: ${result.error}`);
  }

  // 3. Fall back to unauthenticated fetch
  console.error("No valid cookies found. Trying unauthenticated fetch...");
  return fetchWithRetry(url, timeout, null);
}
