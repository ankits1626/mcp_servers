# Phase 5: Medium-Specific Fetching

> **Goal**: Handle Medium's paywall and fetch article content reliably

---

## Table of Contents

1. [The Medium Problem](#1-the-medium-problem)
2. [Understanding Medium URLs](#2-understanding-medium-urls)
3. [The Paywall and 403 Forbidden](#3-the-paywall-and-403-forbidden)
4. [Solution: Freedium Proxy](#4-solution-freedium-proxy)
5. [URL Validation and Transformation](#5-url-validation-and-transformation)
6. [Multi-Strategy Fetching](#6-multi-strategy-fetching)
7. [Tool Specification](#7-tool-specification)
8. [Implementation Guide](#8-implementation-guide)
9. [Testing Strategy](#9-testing-strategy)

---

## 1. The Medium Problem

When you try to fetch a Medium article directly:

```
┌─────────────────────────────────────────────────────────────────┐
│                    THE MEDIUM PROBLEM                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   You: fetch("https://medium.com/some-article")                 │
│                                                                  │
│   Medium: "403 Forbidden - You need to be a member!"            │
│                                                                  │
│   OR                                                             │
│                                                                  │
│   Medium: Returns partial content with paywall overlay          │
│                                                                  │
│   OR                                                             │
│                                                                  │
│   Medium: Redirects to sign-in page                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Why This Happens

Medium uses a **metered paywall**:
- First few articles: Free
- After that: Requires Medium membership ($5/month)
- Some articles: Members-only from the start

The paywall is enforced via:
1. Cookies tracking how many articles you've read
2. JavaScript that hides content
3. Server-side blocks for direct requests

---

## 2. Understanding Medium URLs

### Medium URL Formats

Medium articles can have several URL patterns:

```
┌─────────────────────────────────────────────────────────────────┐
│                    MEDIUM URL PATTERNS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. STANDARD MEDIUM.COM                                         │
│     https://medium.com/@username/article-title-abc123def456     │
│     https://medium.com/publication/article-title-abc123def456   │
│                                                                  │
│  2. CUSTOM DOMAINS (publications on their own domain)           │
│     https://blog.example.com/article-title-abc123def456         │
│     https://engineering.company.com/article-title               │
│                                                                  │
│  3. SHORT LINKS                                                  │
│     https://medium.com/p/abc123def456                           │
│     https://link.medium.com/abc123xyz                           │
│                                                                  │
│  4. WITH QUERY PARAMETERS                                        │
│     https://medium.com/@user/article?source=friends_link        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### The Article ID

Most Medium URLs end with a **12-character hexadecimal ID**:

```
https://medium.com/@user/my-article-title-a1b2c3d4e5f6
                                          └──────────┘
                                           Article ID
```

This ID is important because:
- It uniquely identifies the article
- Freedium uses it to fetch the article
- It's stable even if the title changes

---

## 3. The Paywall and 403 Forbidden

### What Happens with Direct Fetch

```typescript
const response = await fetch("https://medium.com/@user/some-article");
```

**Possible outcomes:**

| Scenario | Status | Content |
|----------|--------|---------|
| Free article | 200 | Full HTML (but JS-heavy) |
| Paywalled, first visit | 200 | Partial content + paywall |
| Paywalled, limit reached | 403 | "Forbidden" or redirect |
| Members-only | 403 | "Sign in to read" |

### Why Headers Don't Help Much

You might think browser-like headers would help:

```typescript
const response = await fetch(url, {
  headers: {
    "User-Agent": "Mozilla/5.0...",
    "Accept": "text/html...",
  }
});
```

But Medium's paywall is **cookie-based** and **account-based**, not just header-based. Without a valid session cookie from a paying member, you hit the wall.

---

## 4. Solution: Freedium Proxy

### What is Freedium?

[Freedium](https://freedium.cfd) is a service that:
- Takes a Medium URL
- Fetches the article content
- Returns clean HTML without paywall

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                    FREEDIUM FLOW                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Original URL:                                                  │
│   https://medium.com/@user/my-article-abc123def456              │
│                                                                  │
│   Transform to Freedium URL:                                    │
│   https://freedium.cfd/https://medium.com/@user/my-article-...  │
│                                                                  │
│   Freedium:                                                      │
│   1. Receives the request                                        │
│   2. Fetches article (has ways to bypass paywall)               │
│   3. Returns clean HTML with article content                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Freedium URL Format

Simply prepend `https://freedium.cfd/` to the original URL:

```
Original:  https://medium.com/@user/article-title-abc123
Freedium:  https://freedium.cfd/https://medium.com/@user/article-title-abc123
```

### Freedium Limitations

| Consideration | Details |
|---------------|---------|
| **Availability** | Service may go down or change domain |
| **Rate limiting** | May block if too many requests |
| **Not all articles** | Some may still fail |
| **Legal gray area** | Bypasses paywall (use responsibly) |

### Alternative Services

If Freedium is unavailable, alternatives exist:
- `https://readmedium.com/` - Similar service
- Google cache - Sometimes has cached versions
- Archive.org - May have archived copies

---

## 5. URL Validation and Transformation

### Detecting Medium URLs

We need to check if a URL is a Medium article:

```typescript
function isMediumUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Check for medium.com domain
    if (parsed.hostname === "medium.com" ||
        parsed.hostname.endsWith(".medium.com")) {
      return true;
    }

    // Note: Custom domains are harder to detect
    // We might need to try and see
    return false;
  } catch {
    return false;
  }
}
```

### The URL Class

Node.js has a built-in `URL` class for parsing URLs:

```typescript
const url = new URL("https://medium.com/@user/article?ref=home");

url.protocol   // "https:"
url.hostname   // "medium.com"
url.pathname   // "/@user/article"
url.search     // "?ref=home"
url.href       // Full URL string
```

### Transforming to Freedium

```typescript
function toFreediumUrl(mediumUrl: string): string {
  // Simply prepend the Freedium domain
  return `https://freedium.cfd/${mediumUrl}`;
}
```

---

## 6. Multi-Strategy Fetching

### The Strategy Pattern

Since fetching can fail, we try multiple approaches:

```
┌─────────────────────────────────────────────────────────────────┐
│                 MULTI-STRATEGY FETCHING                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Input: Medium URL                                              │
│                                                                  │
│   Strategy 1: Try Freedium                                      │
│   ├── Success? → Return content                                 │
│   └── Failed? → Try next strategy                               │
│                                                                  │
│   Strategy 2: Try direct fetch with headers                     │
│   ├── Success (200 + content)? → Return content                 │
│   └── Failed (403/partial)? → Try next strategy                 │
│                                                                  │
│   Strategy 3: Try alternative proxy                             │
│   ├── Success? → Return content                                 │
│   └── Failed? → Return error                                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation Approach

```typescript
async function fetchMediumArticle(url: string): Promise<string> {
  // Strategy 1: Freedium
  try {
    const freediumUrl = `https://freedium.cfd/${url}`;
    const response = await fetch(freediumUrl);
    if (response.ok) {
      return await response.text();
    }
  } catch {
    // Freedium failed, try next
  }

  // Strategy 2: Direct fetch
  try {
    const response = await fetch(url, {
      headers: { /* browser-like headers */ }
    });
    if (response.ok) {
      const text = await response.text();
      // Check if we got real content (not paywall)
      if (!isPaywallContent(text)) {
        return text;
      }
    }
  } catch {
    // Direct fetch failed
  }

  // All strategies failed
  throw new Error("Could not fetch article");
}
```

---

## 7. Tool Specification

### Tool: `read_medium`

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string (URL) | Yes | The Medium article URL |

### Output

- **Success**: HTML content of the article
- **Error**: Error message with `isError: true`

### Examples

```
Input:  { url: "https://medium.com/@user/article-abc123" }
Output: "<!DOCTYPE html><html>...(article content)...</html>"

Input:  { url: "https://example.com/not-medium" }
Output: "Not a Medium URL: https://example.com/not-medium" (isError: true)

Input:  { url: "https://medium.com/@user/deleted-article" }
Output: "Failed to fetch article: Article not found" (isError: true)
```

---

## 8. Implementation Guide

### Step 1: URL Validation Helper

```typescript
function isMediumUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();

    // Check for medium.com and subdomains
    return (
      hostname === "medium.com" ||
      hostname.endsWith(".medium.com") ||
      hostname === "link.medium.com"
    );
  } catch {
    return false;
  }
}
```

### Step 2: Freedium Fetch Helper

```typescript
async function fetchViaFreedium(
  mediumUrl: string,
  timeout: number
): Promise<{ success: boolean; content?: string; error?: string }> {
  const freediumUrl = `https://freedium.cfd/${mediumUrl}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(freediumUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MediumReader/1.0)",
        Accept: "text/html",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        error: `Freedium returned ${response.status}`,
      };
    }

    const content = await response.text();
    return { success: true, content };

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}
```

### Step 3: The Tool Registration

```typescript
server.registerTool(
  "read_medium",
  {
    title: "Read Medium Article",
    description:
      "Fetches and returns the content of a Medium article. Handles paywalled content.",
    inputSchema: {
      url: z.string().url().describe("The Medium article URL to fetch"),
    },
  },
  async ({ url }: { url: string }) => {
    // Validate it's a Medium URL
    if (!isMediumUrl(url)) {
      return {
        content: [{
          type: "text" as const,
          text: `Not a Medium URL: ${url}. This tool only works with medium.com articles.`,
        }],
        isError: true,
      };
    }

    // Try Freedium first
    const result = await fetchViaFreedium(url, 15000);

    if (result.success && result.content) {
      return {
        content: [{ type: "text" as const, text: result.content }],
      };
    }

    // Freedium failed
    return {
      content: [{
        type: "text" as const,
        text: `Failed to fetch Medium article: ${result.error}`,
      }],
      isError: true,
    };
  }
);
```

---

## 9. Testing Strategy

### Test URLs

| Type | URL | Expected |
|------|-----|----------|
| Valid Medium | `https://medium.com/@user/article-abc123` | Content |
| Short link | `https://medium.com/p/abc123` | Content (after redirect) |
| Not Medium | `https://example.com/article` | "Not a Medium URL" error |
| Invalid URL | `not-a-url` | Zod validation error |
| Non-existent | `https://medium.com/@user/fake-xyz123` | "Article not found" error |

### Finding Test Articles

To find a real Medium article for testing:
1. Go to medium.com
2. Find any article
3. Copy the URL
4. Test with both the tool and direct Freedium access

### Manual Freedium Test

Before testing the tool, verify Freedium works:

```bash
# In browser or curl
curl "https://freedium.cfd/https://medium.com/@user/some-article"
```

If Freedium is down, the tool will fail until an alternative is added.

---

## Key Concepts Learned

| Concept | What It Means |
|---------|---------------|
| **Paywall** | Content blocked unless you pay |
| **Proxy service** | Middleman that fetches on your behalf |
| **URL parsing** | Breaking down URL into components |
| **Multi-strategy** | Try multiple approaches, fallback on failure |
| **Graceful degradation** | Fail nicely when things don't work |

---

## What's Next?

In **Phase 6**, we'll extract clean content from the HTML:
- Parse HTML with cheerio
- Extract article title, author, body
- Remove navigation, ads, related articles
- Get clean, readable content

---

**Status**: 📝 Documentation complete, ready for implementation

**Back to**: [Phase 4](./PHASE_4_HTTP_FETCHING.md) | [Learning Plan](./LEARNING_PLAN.md)
