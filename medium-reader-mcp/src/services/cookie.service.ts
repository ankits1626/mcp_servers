/**
 * Cookie Service for Medium Reader
 *
 * Handles cookie retrieval from environment variables and Chrome browser.
 */

import { getCookiesPromised } from "chrome-cookies-secure";

/**
 * Get Medium authentication cookies from environment variables
 *
 * @returns Cookie string in format "sid=...; uid=..." or null if not configured
 */
export function getEnvCookies(): string | null {
  const sid = process.env.MEDIUM_SID;
  const uid = process.env.MEDIUM_UID;

  if (!sid || !uid) {
    return null;
  }

  return `sid=${sid}; uid=${uid}`;
}

/**
 * Check if Medium cookies are configured in environment
 *
 * @returns true if MEDIUM_SID and MEDIUM_UID are set
 */
export function hasEnvCookies(): boolean {
  return getEnvCookies() !== null;
}

/**
 * Get ALL Medium cookies directly from Chrome's cookie database
 *
 * Uses chrome-cookies-secure to decrypt cookies from Chrome's SQLite DB.
 * No browser restart or special flags needed!
 *
 * @returns Cookie string in header format or null if not available
 *
 * @remarks
 * First time on macOS will prompt for Keychain access.
 * Click "Always Allow" to grant permanent access.
 */
export async function getChromeCookies(): Promise<string | null> {
  try {
    console.error("Reading cookies from Chrome...");

    const cookies = (await getCookiesPromised(
      "https://medium.com",
      "header"
    )) as string;

    if (cookies && cookies.length > 0) {
      console.error(
        `Found Medium cookies in Chrome (${cookies.split(";").length} cookies)`
      );
      return cookies;
    }

    console.error(
      "No Medium cookies found in Chrome. Please login to Medium in Chrome first."
    );
    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Failed to read Chrome cookies: ${message}`);

    // First time on macOS will prompt for Keychain access
    if (message.includes("security") || message.includes("keychain")) {
      console.error(
        "TIP: If prompted, click 'Always Allow' to grant Keychain access"
      );
    }

    return null;
  }
}

/**
 * Get cookies with fallback strategy
 *
 * Priority:
 * 1. Environment variables (if configured)
 * 2. Chrome browser cookies
 *
 * @returns Cookie string or null if no cookies available
 */
export async function getCookiesWithFallback(): Promise<string | null> {
  // Try env cookies first
  const envCookies = getEnvCookies();
  if (envCookies) {
    console.error("Using cookies from .env file...");
    return envCookies;
  }

  // Fall back to Chrome cookies
  return getChromeCookies();
}
