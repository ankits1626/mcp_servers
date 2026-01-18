/**
 * Error Messages Utility
 *
 * Centralized, user-friendly error messages with actionable guidance.
 */

/**
 * Error codes for categorizing errors
 */
export enum ErrorCode {
  AUTH_REQUIRED = "AUTH_REQUIRED",
  AUTH_EXPIRED = "AUTH_EXPIRED",
  PAYWALL = "PAYWALL",
  NETWORK_ERROR = "NETWORK_ERROR",
  TIMEOUT = "TIMEOUT",
  INVALID_URL = "INVALID_URL",
  NOT_MEDIUM_URL = "NOT_MEDIUM_URL",
  RATE_LIMITED = "RATE_LIMITED",
  ARTICLE_NOT_FOUND = "ARTICLE_NOT_FOUND",
  SERVER_ERROR = "SERVER_ERROR",
  UNKNOWN = "UNKNOWN",
}

/**
 * Structured error with code and user-friendly message
 */
export interface StructuredError {
  code: ErrorCode;
  message: string;
  details?: string;
  suggestion?: string;
}

/**
 * Format a structured error into a user-friendly string
 */
export function formatError(error: StructuredError): string {
  const parts = [error.message];

  if (error.details) {
    parts.push(`\nDetails: ${error.details}`);
  }

  if (error.suggestion) {
    parts.push(`\n\n${error.suggestion}`);
  }

  return parts.join("");
}

/**
 * Authentication required error
 */
export function authRequiredError(statusCode?: number): StructuredError {
  return {
    code: ErrorCode.AUTH_REQUIRED,
    message: `Access denied${statusCode ? ` (${statusCode})` : ""}. This article requires Medium membership.`,
    suggestion: `To read premium articles:
1. Login to Medium in Chrome browser
2. The server will automatically use your Chrome cookies

Alternatively, set MEDIUM_SID and MEDIUM_UID in your .env file.`,
  };
}

/**
 * Authentication expired error
 */
export function authExpiredError(): StructuredError {
  return {
    code: ErrorCode.AUTH_EXPIRED,
    message: "Authentication failed. Your session may have expired.",
    suggestion: `To fix this:
1. Open Chrome and go to medium.com
2. Log out and log back in
3. Try fetching the article again

The server will automatically pick up your refreshed cookies.`,
  };
}

/**
 * Paywall detected error
 */
export function paywallError(authenticated: boolean): StructuredError {
  if (authenticated) {
    return {
      code: ErrorCode.PAYWALL,
      message: "Got paywall page despite being authenticated.",
      suggestion: `Your cookies may have expired. Try:
1. Open Chrome and go to medium.com
2. Log out and log back in
3. Try fetching the article again`,
    };
  }

  return {
    code: ErrorCode.PAYWALL,
    message: "This article is behind Medium's paywall.",
    suggestion: `To read premium articles:
1. Login to Medium in Chrome browser
2. The server will automatically use your Chrome cookies`,
  };
}

/**
 * Network error
 */
export function networkError(details?: string): StructuredError {
  return {
    code: ErrorCode.NETWORK_ERROR,
    message: "Network error occurred while fetching the article.",
    details,
    suggestion: "Please check your internet connection and try again.",
  };
}

/**
 * Timeout error
 */
export function timeoutError(timeoutMs: number): StructuredError {
  return {
    code: ErrorCode.TIMEOUT,
    message: `Request timed out after ${timeoutMs}ms.`,
    suggestion: `The server may be slow or unresponsive. You can:
1. Try again in a few moments
2. Check if medium.com is accessible in your browser`,
  };
}

/**
 * Invalid URL format error
 */
export function invalidUrlError(url: string): StructuredError {
  return {
    code: ErrorCode.INVALID_URL,
    message: `Invalid URL format: ${url}`,
    suggestion: `Please provide a valid Medium article URL, for example:
• https://medium.com/@author/article-title-abc123
• https://medium.com/publication/article-title-abc123
• https://author.medium.com/article-title-abc123`,
  };
}

/**
 * Not a Medium URL error
 */
export function notMediumUrlError(url: string): StructuredError {
  return {
    code: ErrorCode.NOT_MEDIUM_URL,
    message: `Not a Medium URL: ${url}`,
    details: "This tool only works with medium.com articles.",
    suggestion: `Valid Medium URL formats:
• https://medium.com/@author/article-title-abc123
• https://medium.com/publication/article-title-abc123
• https://author.medium.com/article-title-abc123
• https://link.medium.com/abc123`,
  };
}

/**
 * Rate limited error
 */
export function rateLimitedError(waitTimeMs: number): StructuredError {
  const waitSeconds = Math.ceil(waitTimeMs / 1000);
  return {
    code: ErrorCode.RATE_LIMITED,
    message: `Rate limited. Please wait ${waitSeconds} second${waitSeconds !== 1 ? "s" : ""} before trying again.`,
    suggestion:
      "To avoid rate limiting, wait a few seconds between requests.",
  };
}

/**
 * Article not found error
 */
export function articleNotFoundError(url: string): StructuredError {
  return {
    code: ErrorCode.ARTICLE_NOT_FOUND,
    message: "Article not found (404).",
    details: `URL: ${url}`,
    suggestion: `The article may have been:
• Deleted by the author
• Moved to a different URL
• Made private

Please verify the URL is correct.`,
  };
}

/**
 * Server error (5xx)
 */
export function serverError(statusCode: number): StructuredError {
  return {
    code: ErrorCode.SERVER_ERROR,
    message: `Medium server error (${statusCode}).`,
    suggestion: `Medium's servers may be experiencing issues. Try:
1. Wait a few moments and try again
2. Check if medium.com is accessible in your browser`,
  };
}

/**
 * Unknown error
 */
export function unknownError(details?: string): StructuredError {
  return {
    code: ErrorCode.UNKNOWN,
    message: "An unexpected error occurred.",
    details,
    suggestion: "Please try again. If the problem persists, check your network connection.",
  };
}

/**
 * Create appropriate error based on HTTP status code
 */
export function errorFromStatusCode(
  statusCode: number,
  authenticated: boolean,
  url?: string
): StructuredError {
  switch (statusCode) {
    case 401:
    case 403:
      return authenticated ? authExpiredError() : authRequiredError(statusCode);
    case 404:
      return articleNotFoundError(url || "unknown");
    case 429:
      return rateLimitedError(60000); // Default 1 minute wait
    default:
      if (statusCode >= 500) {
        return serverError(statusCode);
      }
      return unknownError(`HTTP ${statusCode}`);
  }
}
