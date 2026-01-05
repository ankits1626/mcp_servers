# Phase 8: Polish & Edge Cases - Execution Plan

> **Principle**: Each step is atomic and fully operational. Code must build and run after every step.

---

## Goal

Production-ready quality with robust error handling, retry logic, and edge case coverage.

---

## Execution Steps

### Step 1: Create Error Messages Module

**Files Created:**
- `src/utils/error-messages.utils.ts`
- Update `src/utils/index.ts`

**What It Does:**
- Centralized, user-friendly error message templates
- Actionable guidance for each error type
- Consistent formatting across all tools

**Error Categories:**
```typescript
- AUTH_REQUIRED      → Explains how to authenticate
- AUTH_EXPIRED       → Suggests re-login
- PAYWALL            → Explains premium content
- NETWORK_ERROR      → Suggests retry
- TIMEOUT            → Suggests increasing timeout
- INVALID_URL        → Shows valid URL formats
- NOT_MEDIUM_URL     → Clarifies tool scope
- RATE_LIMITED       → Explains wait time
- ARTICLE_NOT_FOUND  → 404 handling
```

**Test:** `npm run build` passes

**Commit:** `feat(phase8): add centralized error messages module`

---

### Step 2: Integrate Error Messages into HTTP Service

**Files Modified:**
- `src/services/http.service.ts`

**What It Does:**
- Replace inline error strings with error message functions
- Add context to errors (URL, status code, etc.)

**Test:** `npm run build` passes, errors are more descriptive

**Commit:** `feat(phase8): integrate error messages in HTTP service`

---

### Step 3: Integrate Error Messages into Read Medium Tool

**Files Modified:**
- `src/tools/read-medium.tool.ts`

**What It Does:**
- Use error message functions for tool-level errors
- Add helpful suggestions in error responses

**Test:** `npm run build` passes, test with invalid URL

**Commit:** `feat(phase8): integrate error messages in read-medium tool`

---

### Step 4: Add URL Normalization

**Files Modified:**
- `src/utils/url.utils.ts`

**What It Does:**
- Handle various Medium URL formats:
  - `https://medium.com/@user/article-abc123`
  - `https://medium.com/publication/article-abc123`
  - `https://user.medium.com/article-abc123`
  - `https://link.medium.com/abc123` (short links)
- Normalize to canonical format
- Extract post ID from all formats

**Test:** `npm run build` passes, test with various URL formats

**Commit:** `feat(phase8): add URL normalization for various Medium formats`

---

### Step 5: Add Retry Configuration Types

**Files Created:**
- `src/types/retry.types.ts`
- Update `src/types/index.ts`

**What It Does:**
- Define `RetryConfig` interface
- Define retryable error conditions

**Test:** `npm run build` passes

**Commit:** `feat(phase8): add retry configuration types`

---

### Step 6: Implement Retry Logic

**Files Created:**
- `src/services/retry.service.ts`
- Update `src/services/index.ts`

**What It Does:**
- Exponential backoff with jitter
- Configurable max retries (default: 3)
- Only retry on transient errors (5xx, network errors)
- Logging for retry attempts

**Test:** `npm run build` passes

**Commit:** `feat(phase8): implement retry service with exponential backoff`

---

### Step 7: Integrate Retry into HTTP Service

**Files Modified:**
- `src/services/http.service.ts`

**What It Does:**
- Wrap fetch calls with retry logic
- Add `retryable` flag to error results

**Test:** `npm run build` passes

**Commit:** `feat(phase8): integrate retry logic into HTTP service`

---

### Step 8: Add Rate Limiting Types

**Files Created:**
- `src/types/rate-limit.types.ts`
- Update `src/types/index.ts`

**What It Does:**
- Define `RateLimitConfig` interface
- Define rate limit state

**Test:** `npm run build` passes

**Commit:** `feat(phase8): add rate limiting types`

---

### Step 9: Implement Rate Limiter

**Files Created:**
- `src/services/rate-limiter.service.ts`
- Update `src/services/index.ts`

**What It Does:**
- Token bucket algorithm
- Configurable requests per minute (default: 10)
- Per-domain tracking
- Returns wait time when limited

**Test:** `npm run build` passes

**Commit:** `feat(phase8): implement rate limiter service`

---

### Step 10: Integrate Rate Limiting into Read Medium Tool

**Files Modified:**
- `src/tools/read-medium.tool.ts`

**What It Does:**
- Check rate limit before fetching
- Return helpful error when rate limited

**Test:** `npm run build` passes

**Commit:** `feat(phase8): integrate rate limiting into read-medium tool`

---

### Step 11: Add Output Options Types

**Files Modified:**
- `src/types/article.types.ts`

**What It Does:**
- Add `OutputOptions` interface
- Add `maxWords`, `format` options

**Test:** `npm run build` passes

**Commit:** `feat(phase8): add output options types`

---

### Step 12: Implement Article Truncation

**Files Created:**
- `src/utils/article.utils.ts`
- Update `src/utils/index.ts`

**What It Does:**
- Truncate articles over N words
- Add "... [truncated]" indicator
- Preserve markdown structure

**Test:** `npm run build` passes

**Commit:** `feat(phase8): implement article truncation utility`

---

### Step 13: Add Output Format Option to Tool

**Files Modified:**
- `src/tools/read-medium.tool.ts`

**What It Does:**
- Add `maxWords` parameter (optional)
- Add `format` parameter: 'full' | 'summary'
- Apply truncation when needed

**Test:** `npm run build` passes, test with long article

**Commit:** `feat(phase8): add output format options to read-medium tool`

---

### Step 14: Update Constants with Defaults

**Files Modified:**
- `src/config/constants.ts`

**What It Does:**
- Add `RETRY_CONFIG` defaults
- Add `RATE_LIMIT_CONFIG` defaults
- Add `OUTPUT_CONFIG` defaults

**Test:** `npm run build` passes

**Commit:** `feat(phase8): add default configurations for retry, rate limit, output`

---

### Step 15: Final Testing & Documentation

**Files Modified:**
- `discussion/phase_8_polish/PHASE_8_POLISH.md`

**What It Does:**
- Run full test suite
- Document all new features
- Update progress tracking

**Test:** All tools work with edge cases

**Commit:** `docs(phase8): complete Phase 8 documentation`

---

## Progress Tracking

| Step | Description | Status |
|------|-------------|--------|
| 1 | Create Error Messages Module | ✅ Complete |
| 2 | Integrate Errors in HTTP Service | ✅ Complete |
| 3 | Integrate Errors in Read Medium Tool | ✅ Complete |
| 4 | URL Normalization | ✅ Complete |
| 5 | Retry Configuration Types | ✅ Complete |
| 6 | Implement Retry Logic | ✅ Complete |
| 7 | Integrate Retry into HTTP Service | ✅ Complete |
| 7b | Integrate Retry into GraphQL Extractor | ✅ Complete |
| 8 | Rate Limiting Types | ✅ Complete |
| 9 | Implement Rate Limiter | ✅ Complete |
| 10 | Integrate Rate Limiting | ✅ Complete |
| 11 | Output Options Types | ⏭️ Skipped |
| 12 | Article Truncation | ⏭️ Skipped |
| 13 | Output Format Option | ⏭️ Skipped |
| 14 | Update Constants | ⏭️ Skipped |
| 15 | Final Testing & Docs | ✅ Complete |

**Completion Date:** 2026-01-04
**Steps Completed:** 12/15 (Steps 11-14 deferred for future iteration)

---

## File Tree After Completion

```
src/
├── types/
│   ├── article.types.ts    # + OutputOptions
│   ├── retry.types.ts      # NEW
│   ├── rate-limit.types.ts # NEW
│   └── ...
│
├── utils/
│   ├── error-messages.utils.ts  # NEW
│   ├── article.utils.ts         # NEW
│   ├── url.utils.ts             # + normalization
│   └── ...
│
├── services/
│   ├── retry.service.ts         # NEW
│   ├── rate-limiter.service.ts  # NEW
│   ├── http.service.ts          # + retry integration
│   └── ...
│
└── tools/
    └── read-medium.tool.ts      # + rate limit, output options
```

---

## Rollback Strategy

Each step is atomic. If any step fails:
1. `git checkout .` to revert uncommitted changes
2. Or `git revert <commit>` to undo a specific commit
3. Code always remains functional

---

**Ready to execute?** Start with Step 1.
