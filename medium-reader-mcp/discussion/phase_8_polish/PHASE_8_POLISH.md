# Phase 8: Polish & Edge Cases

**Goal**: Production-ready quality with robust error handling.

---

## Current State Audit

### What We Have
- ✅ Basic error handling (network errors, timeouts, HTTP errors)
- ✅ Auth failure detection (401, 403, paywall detection)
- ✅ Cookie fallback chain (env → Chrome → unauthenticated)
- ✅ Timeout handling with AbortController

### What's Missing
1. **Retry Logic** - No retries on transient failures
2. **Rate Limiting** - No protection against hammering Medium
3. **Long Article Handling** - No truncation/chunking for very long articles
4. **Better Error Messages** - Could be more user-friendly
5. **URL Format Handling** - Various Medium URL formats not fully tested

---

## Implementation Plan

### Step 1: Enhanced Error Messages
Make errors actionable with clear next steps.

**Current:**
```
Failed to fetch Medium article: HTTP 403 Forbidden
```

**Better:**
```
Access denied (403). This article requires Medium membership.

To read premium articles:
1. Login to Medium in Chrome
2. The server will automatically use your Chrome cookies

If already logged in, your session may have expired. Try logging in again.
```

### Step 2: Retry Logic with Exponential Backoff
Add retry for transient failures (5xx, network errors).

```typescript
interface RetryConfig {
  maxRetries: number;      // Default: 3
  initialDelayMs: number;  // Default: 1000
  maxDelayMs: number;      // Default: 10000
  retryableErrors: string[]; // 5xx, ECONNRESET, etc.
}
```

### Step 3: Rate Limiting
Simple in-memory rate limiter to prevent abuse.

```typescript
interface RateLimitConfig {
  requestsPerMinute: number;  // Default: 10
  burstLimit: number;         // Default: 3
}
```

### Step 4: Long Article Handling
For articles over a certain word count, offer options.

```typescript
interface OutputOptions {
  maxWords?: number;        // Truncate after N words
  includeSummary?: boolean; // Add TL;DR at top
  format?: 'full' | 'summary' | 'outline';
}
```

### Step 5: URL Normalization
Handle various Medium URL formats:
- `https://medium.com/@user/article-title-abc123`
- `https://medium.com/publication/article-title-abc123`
- `https://user.medium.com/article-title-abc123`
- `https://link.medium.com/abc123` (short links)
- Mobile URLs, AMP URLs, etc.

---

## Execution Order

| Step | Description | Risk | Effort |
|------|-------------|------|--------|
| 1 | Enhanced Error Messages | Low | Small |
| 2 | URL Normalization | Low | Small |
| 3 | Retry Logic | Medium | Medium |
| 4 | Rate Limiting | Low | Small |
| 5 | Long Article Handling | Low | Medium |

---

## Testing Checklist

- [ ] Valid Medium URL → Returns article
- [ ] Invalid URL → Clear error message
- [ ] Non-Medium URL → "This tool only works with medium.com"
- [ ] Premium article without auth → Explains how to authenticate
- [ ] Premium article with auth → Returns full content
- [ ] Network timeout → Suggests retry
- [ ] 500 error → Retries automatically
- [ ] Very long article → Handles gracefully
- [ ] Short link (link.medium.com) → Resolves and fetches

---

## Files to Modify

1. `src/services/http.service.ts` - Retry logic, rate limiting
2. `src/utils/url.utils.ts` - URL normalization
3. `src/tools/read-medium.tool.ts` - Output options, error formatting
4. `src/types/article.types.ts` - New config types
5. `src/config/constants.ts` - Default configs

---

Ready to implement Step 1 (Enhanced Error Messages)?
