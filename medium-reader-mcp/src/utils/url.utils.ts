/**
 * URL Utilities for Medium Reader
 *
 * Pure functions for URL validation, parsing, and normalization.
 * No side effects, no external dependencies.
 */

/**
 * Medium URL formats we support:
 * - https://medium.com/@author/article-title-abc123
 * - https://medium.com/publication/article-title-abc123
 * - https://author.medium.com/article-title-abc123
 * - https://link.medium.com/abc123 (short links)
 * - https://medium.com/p/abc123 (direct post links)
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
 * Check if URL is a Medium short link (link.medium.com)
 *
 * @param urlString - The URL to check
 * @returns true if it's a short link
 */
export function isShortLink(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    return url.hostname.toLowerCase() === "link.medium.com";
  } catch {
    return false;
  }
}

/**
 * Check if URL is a subdomain Medium URL (author.medium.com)
 *
 * @param urlString - The URL to check
 * @returns true if it's a subdomain URL
 */
export function isSubdomainUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();
    return (
      hostname.endsWith(".medium.com") &&
      hostname !== "medium.com" &&
      hostname !== "link.medium.com"
    );
  } catch {
    return false;
  }
}

/**
 * Extract post ID from Medium URL
 *
 * Medium URLs end with the post ID after the last hyphen.
 * The post ID is typically a 10-12 character hexadecimal string.
 *
 * Handles various formats:
 * - /article-title-abc123def456 → abc123def456
 * - /p/abc123def456 → abc123def456
 * - /abc123 (short links) → abc123
 *
 * @param url - The Medium article URL
 * @returns The post ID or null if not found
 *
 * @example
 * extractPostId("https://medium.com/title-abc123def456") // "abc123def456"
 * extractPostId("https://medium.com/p/abc123def456") // "abc123def456"
 * extractPostId("https://link.medium.com/abc123") // "abc123"
 */
export function extractPostId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Handle short links: /abc123
    if (isShortLink(url)) {
      const shortMatch = pathname.match(/^\/([a-zA-Z0-9]+)$/);
      return shortMatch ? shortMatch[1] : null;
    }

    // Handle direct post links: /p/abc123
    const directMatch = pathname.match(/\/p\/([a-f0-9]+)$/i);
    if (directMatch) {
      return directMatch[1];
    }

    // Handle standard format: /title-abc123def456
    const match = pathname.match(/-([a-f0-9]+)$/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Normalize a Medium URL to a canonical format
 *
 * This handles:
 * - Removing query parameters (except necessary ones)
 * - Removing hash fragments
 * - Converting subdomain URLs to main domain format
 * - Cleaning up paths
 *
 * @param urlString - The URL to normalize
 * @returns Normalized URL or original if normalization fails
 *
 * @example
 * normalizeUrl("https://medium.com/article?source=rss") // "https://medium.com/article"
 * normalizeUrl("https://author.medium.com/article") // "https://author.medium.com/article" (kept as-is)
 */
export function normalizeUrl(urlString: string): string {
  try {
    const url = new URL(urlString);

    // Remove common tracking parameters
    const paramsToRemove = [
      "source",
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
      "gi",
      "sk",
    ];

    paramsToRemove.forEach((param) => {
      url.searchParams.delete(param);
    });

    // Remove hash fragment
    url.hash = "";

    // Reconstruct URL without unnecessary parameters
    return url.toString();
  } catch {
    return urlString;
  }
}

/**
 * Get the canonical URL for a Medium article
 *
 * For short links and other formats, this returns
 * a URL that can be used for fetching.
 *
 * Note: Short links (link.medium.com) need to be resolved
 * via HTTP redirect, so we return them as-is.
 *
 * @param urlString - The Medium URL
 * @returns Canonical URL for fetching
 */
export function getCanonicalUrl(urlString: string): string {
  // First normalize the URL
  const normalized = normalizeUrl(urlString);

  // Short links are returned as-is (they redirect)
  if (isShortLink(normalized)) {
    return normalized;
  }

  return normalized;
}

/**
 * Validate and prepare a URL for fetching
 *
 * @param urlString - The URL to validate
 * @returns Object with validation result and prepared URL
 */
export function validateAndPrepareUrl(urlString: string): {
  valid: boolean;
  isMedium: boolean;
  url: string;
  postId: string | null;
  isShortLink: boolean;
} {
  // Check if it's a valid URL
  try {
    new URL(urlString);
  } catch {
    return {
      valid: false,
      isMedium: false,
      url: urlString,
      postId: null,
      isShortLink: false,
    };
  }

  const isMedium = isMediumUrl(urlString);
  const canonicalUrl = getCanonicalUrl(urlString);
  const postId = extractPostId(canonicalUrl);
  const shortLink = isShortLink(urlString);

  return {
    valid: true,
    isMedium,
    url: canonicalUrl,
    postId,
    isShortLink: shortLink,
  };
}
