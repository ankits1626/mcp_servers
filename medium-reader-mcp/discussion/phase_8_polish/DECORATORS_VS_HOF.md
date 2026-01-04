# Decorators vs Higher-Order Functions (2025)

> Research conducted January 2025 to validate our implementation approach.

---

## Question

Should we use TypeScript decorators for retry logic instead of higher-order functions?

## Answer

**Both approaches are valid in 2025**, but higher-order functions are the better choice for our functional codebase.

---

## 2025 Status

### TypeScript Decorators

| Aspect | Status |
|--------|--------|
| TypeScript 5.0+ | ✅ Native Stage 3 decorator support (no flag needed) |
| JavaScript | ⚠️ Stage 3 TC39 proposal (not yet standard) |
| Node.js | ⚠️ May require transpilation |

### Key Limitation

> "TypeScript decorators don't support decorating a function directly. However, you can achieve similar functionality by using higher-order functions."
> — [TypeScript Documentation](https://www.typescriptlang.org/docs/handbook/decorators.html)

---

## Comparison

### Decorators

```typescript
// Requires class-based structure
class HttpService {
  @Retryable({ maxRetries: 3, backoff: 'exponential' })
  async fetchWithCookies(url: string): Promise<Response> {
    return fetch(url);
  }
}
```

**Pros:**
- Clean, declarative syntax (`@Retryable`)
- Less boilerplate code
- Good for class-based codebases (NestJS, Angular)

**Cons:**
- Only works on **class methods**, not standalone functions
- Requires restructuring functional code to classes
- Still experimental in some environments

### Higher-Order Functions (Our Approach)

```typescript
// Works with any function
const result = await withRetry(
  () => fetchWithCookies(url, timeout, cookies),
  { maxRetries: 3 }
);
```

**Pros:**
- Works with **any function** (standalone or method)
- No special TypeScript config needed
- Better for functional programming style
- Tree-shakeable (smaller bundles)
- Easier to test

**Cons:**
- Slightly more verbose
- Less "magical" syntax

---

## Why We Chose Higher-Order Functions

1. **Our code is functional** — We use standalone functions (`fetchWithCookies()`, `fetchWithAutoAuth()`), not classes.

2. **Decorators require classes** — Converting to classes would be a significant refactor with no benefit.

3. **Flexibility** — HOFs work anywhere, decorators only on class members.

4. **Industry validation** — Popular libraries like [ts-retry](https://www.npmjs.com/package/ts-retry) support both patterns, acknowledging that "most handlers are written as functions."

---

## When to Use Each

| Use Case | Recommended Approach |
|----------|---------------------|
| NestJS / Angular services | Decorators |
| Express / Fastify handlers | Higher-Order Functions |
| AWS Lambda handlers | Higher-Order Functions |
| Functional TypeScript | Higher-Order Functions |
| Class-based OOP code | Decorators |

---

## Our Implementation

```typescript
// src/services/retry.service.ts
export async function withRetry<T>(
  operation: () => Promise<T>,
  config?: Partial<RetryConfig>
): Promise<RetryResult<T>> {
  // Exponential backoff with jitter
  // Classifies errors as retryable or not
  // Returns structured result with attempt count
}
```

Usage:
```typescript
const result = await withRetry(
  async () => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.text();
  },
  { maxRetries: 3, initialDelayMs: 1000 }
);
```

---

## Sources

- [TypeScript Decorators Documentation](https://www.typescriptlang.org/docs/handbook/decorators.html)
- [TypeScript 5.0 Release Notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html)
- [typescript-retry-decorator](https://github.com/vcfvct/typescript-retry-decorator)
- [ts-retry](https://www.npmjs.com/package/ts-retry)
- [ts-retry-promise](https://www.npmjs.com/package/ts-retry-promise)
- [LogRocket: Practical Guide to TypeScript Decorators](https://blog.logrocket.com/practical-guide-typescript-decorators/)
- [Forever Functional: Decorators as HOFs](https://blog.openreplay.com/forever-functional-decorators-higher-order-functions/)

---

## Conclusion

**Our higher-order function approach is correct for our functional codebase.** Decorators are equally valid but would require converting to a class-based architecture, which adds complexity without benefit for our use case.

---

*Research date: January 2025*
