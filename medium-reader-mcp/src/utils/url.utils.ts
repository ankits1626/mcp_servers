/**
 * URL Utilities for Medium Reader
 *
 * Pure functions for URL validation and parsing.
 * No side effects, no external dependencies.
 */

/**
 * Check if a URL is a Medium article URL
 *
 * @param urlString - The URL to check
 * @returns true if the URL is a Medium URL
 *
 * @example
 * isMediumUrl("https://medium.com/article") // true
 * isMediumUrl("https://example.com") // false
 */
export function isMediumUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();

    return (
      hostname === "medium.com" ||
      hostname.endsWith(".medium.com") ||
      hostname === "link.medium.com"
    );
  } catch {
    return false;
  }
}

/**
 * Extract post ID from Medium URL
 *
 * Medium URLs end with the post ID after the last hyphen.
 * The post ID is a 12-character hexadecimal string.
 *
 * @param url - The Medium article URL
 * @returns The post ID or null if not found
 *
 * @example
 * extractPostId("https://medium.com/title-abc123def456") // "abc123def456"
 * extractPostId("https://example.com/page") // null
 */
export function extractPostId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    // Post ID is the last segment after the final hyphen
    const match = pathname.match(/-([a-f0-9]+)$/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
