/**
 * Validates if a given string is a valid Medium article URL.
 */
export function isMediumUrl(url) {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;

    // Check for standard Medium domains and publications
    const validDomains = [
      "medium.com",
      "towardsdatascience.com",
      "uxdesign.cc",
      "levelup.gitconnected.com",
    ];

    return validDomains.some((domain) => hostname.includes(domain));
  } catch (error) {
    return false; // Not a valid URL
  }
}
