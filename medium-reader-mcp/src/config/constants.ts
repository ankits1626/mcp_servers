/**
 * Configuration constants for the Medium Reader MCP Server
 */

/**
 * Browser-like headers to avoid bot detection
 */
export const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
};

/**
 * GraphQL-specific headers
 */
export const GRAPHQL_HEADERS = {
  "Content-Type": "application/json",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  Accept: "application/json",
  Origin: "https://medium.com",
};

/**
 * Timeout values in milliseconds
 */
export const TIMEOUTS = {
  DEFAULT: 15000,
  GRAPHQL: 10000,
} as const;

/**
 * Medium API endpoints
 */
export const MEDIUM_URLS = {
  GRAPHQL: "https://medium.com/_/graphql",
  BASE: "https://medium.com",
} as const;

/**
 * Server metadata
 */
export const SERVER_INFO = {
  name: "medium-reader-mcp",
  version: "1.0.0",
} as const;
