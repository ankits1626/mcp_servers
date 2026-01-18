# Phase 4: HTTP Fetching

> **Goal**: Add real network capability to our MCP server - fetch content from any URL

---

## Table of Contents

1. [What We're Building](#1-what-were-building)
2. [The Fetch API in Node.js](#2-the-fetch-api-in-nodejs)
3. [Async Operations in MCP Tools](#3-async-operations-in-mcp-tools)
4. [Error Handling for Network Requests](#4-error-handling-for-network-requests)
5. [HTTP Concepts Review](#5-http-concepts-review)
6. [Tool Specification](#6-tool-specification)
7. [Implementation Guide](#7-implementation-guide)
8. [Testing Strategy](#8-testing-strategy)

---

## 1. What We're Building

A `fetch_url` tool that:
- Takes a URL as input
- Fetches the content from that URL
- Returns the raw HTML/text content
- Handles errors gracefully

```
┌─────────────────────────────────────────────────────────────────┐
│                     FETCH_URL TOOL FLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   User: "Fetch https://example.com"                             │
│                                                                  │
│   Claude: [Calls fetch_url tool]                                │
│                                                                  │
│   MCP Server:                                                    │
│   1. Validate URL                                                │
│   2. Make HTTP request                                           │
│   3. Wait for response                                           │
│   4. Return content (or error)                                   │
│                                                                  │
│   Claude: "Here's the content from example.com: ..."            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. The Fetch API in Node.js

### History

| Node Version | Fetch Support |
|--------------|---------------|
| < 18 | Not available (needed `node-fetch` package) |
| 18+ | Built-in (experimental) |
| 21+ | Stable, no warnings |

Since we're targeting Node 20+, we can use the **native `fetch()`** - no external packages needed!

### Basic Usage

```typescript
// Simple GET request
const response = await fetch("https://example.com");
const text = await response.text();

// With options
const response = await fetch("https://api.example.com/data", {
  method: "GET",
  headers: {
    "User-Agent": "MyApp/1.0",
    "Accept": "text/html",
  },
});
```

### The Response Object

```typescript
const response = await fetch(url);

// Properties
response.ok          // true if status 200-299
response.status      // HTTP status code (200, 404, 500, etc.)
response.statusText  // "OK", "Not Found", etc.
response.headers     // Headers object

// Methods (each returns a Promise)
response.text()      // Body as string
response.json()      // Body parsed as JSON
response.blob()      // Body as Blob (binary)
response.arrayBuffer() // Body as ArrayBuffer
```

### Important: Response Body is a Stream

You can only read the body **once**:

```typescript
const response = await fetch(url);
const text = await response.text();
const json = await response.json();  // ❌ Error! Body already consumed

// If you need both, read text first then parse:
const text = await response.text();
const json = JSON.parse(text);       // ✅ Works
```

---

## 3. Async Operations in MCP Tools

### Why Async Matters

Network requests are **asynchronous** - they take time and we don't want to block:

```
┌─────────────────────────────────────────────────────────────────┐
│                  SYNC VS ASYNC                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SYNCHRONOUS (blocking):                                        │
│  ────────────────────────                                       │
│  Start request ──────────────────────────────► Get response     │
│  [................ waiting, can't do anything ................] │
│                                                                  │
│  ASYNCHRONOUS (non-blocking):                                   │
│  ────────────────────────────                                   │
│  Start request ─►                                               │
│  Do other things ─►                                             │
│  Handle more requests ─►                                        │
│                         ◄── Response arrives, continue          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### MCP Tool Handlers are Already Async

Our tool handlers use `async`:

```typescript
server.registerTool(
  "fetch_url",
  { /* schema */ },
  async ({ url }) => {        // <-- async function
    const response = await fetch(url);  // <-- await the Promise
    const text = await response.text();
    return { content: [{ type: "text", text }] };
  }
);
```

### Understanding Promises and Async/Await

```typescript
// Promise-based (older style)
fetch(url)
  .then(response => response.text())
  .then(text => console.log(text))
  .catch(error => console.error(error));

// Async/await (modern style - what we use)
async function fetchContent(url: string) {
  try {
    const response = await fetch(url);
    const text = await response.text();
    return text;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
```

Both do the same thing, but `async/await` is cleaner and easier to read.

---

## 4. Error Handling for Network Requests

### Types of Errors

```
┌─────────────────────────────────────────────────────────────────┐
│                    NETWORK ERROR TYPES                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. NETWORK ERRORS (fetch throws)                               │
│     - DNS resolution failed                                      │
│     - Connection refused                                         │
│     - Network timeout                                            │
│     - No internet connection                                     │
│     → Caught in try/catch                                       │
│                                                                  │
│  2. HTTP ERRORS (fetch succeeds, but status != 2xx)             │
│     - 400 Bad Request                                            │
│     - 401 Unauthorized                                           │
│     - 403 Forbidden                                              │
│     - 404 Not Found                                              │
│     - 500 Internal Server Error                                  │
│     → Check response.ok or response.status                      │
│                                                                  │
│  3. CONTENT ERRORS (response OK, but content is wrong)          │
│     - Empty response                                             │
│     - Malformed HTML                                             │
│     - Unexpected content type                                    │
│     → Validate content after receiving                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Important: fetch() Doesn't Throw on HTTP Errors

This is a common gotcha:

```typescript
// ❌ WRONG - 404 won't throw!
try {
  const response = await fetch("https://example.com/nonexistent");
  const text = await response.text();  // This runs even for 404!
} catch (error) {
  // Only network errors land here
}

// ✅ CORRECT - Check response.ok
try {
  const response = await fetch("https://example.com/nonexistent");

  if (!response.ok) {
    // Handle HTTP errors (4xx, 5xx)
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const text = await response.text();
} catch (error) {
  // Now catches both network AND HTTP errors
}
```

### Error Response Pattern for MCP

```typescript
// Return errors as tool results with isError flag
async ({ url }) => {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      return {
        content: [{
          type: "text" as const,
          text: `HTTP error: ${response.status} ${response.statusText}`
        }],
        isError: true,
      };
    }

    const text = await response.text();
    return {
      content: [{ type: "text" as const, text }],
    };

  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      content: [{
        type: "text" as const,
        text: `Failed to fetch: ${message}`
      }],
      isError: true,
    };
  }
}
```

---

## 5. HTTP Concepts Review

### HTTP Request Components

```
┌─────────────────────────────────────────────────────────────────┐
│                     HTTP REQUEST                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  GET /article/123 HTTP/1.1        ← Method + Path + Version     │
│  Host: medium.com                 ← Required header             │
│  User-Agent: Mozilla/5.0...       ← Who's making request        │
│  Accept: text/html                ← What content we want        │
│  Accept-Language: en-US           ← Language preference         │
│  Cookie: session=abc123           ← Authentication (optional)   │
│                                                                  │
│  (empty line)                                                    │
│  (request body - empty for GET)                                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### HTTP Response Components

```
┌─────────────────────────────────────────────────────────────────┐
│                     HTTP RESPONSE                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  HTTP/1.1 200 OK                  ← Status line                 │
│  Content-Type: text/html          ← What type of content        │
│  Content-Length: 1234             ← Size in bytes               │
│  Cache-Control: max-age=3600      ← Caching instructions        │
│                                                                  │
│  (empty line)                                                    │
│  <!DOCTYPE html>                  ← Response body               │
│  <html>...</html>                                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Common Status Codes

| Code | Meaning | What to Do |
|------|---------|------------|
| 200 | OK | Success! Process the content |
| 301/302 | Redirect | fetch() follows automatically |
| 400 | Bad Request | Invalid URL or parameters |
| 401 | Unauthorized | Need authentication |
| 403 | Forbidden | Access denied (Medium paywall!) |
| 404 | Not Found | URL doesn't exist |
| 429 | Too Many Requests | Rate limited, slow down |
| 500 | Server Error | Try again later |

### Why Headers Matter

Some websites (like Medium) check headers to decide how to respond:

```typescript
// Without proper headers - might get blocked or different content
const response = await fetch(url);

// With headers - looks like a real browser
const response = await fetch(url, {
  headers: {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "en-US,en;q=0.9",
  },
});
```

---

## 6. Tool Specification

### Input Schema

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string (URL) | Yes | The URL to fetch |
| `timeout` | number | No | Timeout in milliseconds (default: 10000) |

### Output

- **Success**: Raw HTML/text content from the URL
- **Error**: Error message with `isError: true`

### Examples

```
Input:  { url: "https://example.com" }
Output: "<!doctype html><html>...</html>"

Input:  { url: "https://example.com/notfound" }
Output: "HTTP error: 404 Not Found" (isError: true)

Input:  { url: "not-a-valid-url" }
Output: "Invalid URL: not-a-valid-url" (isError: true)

Input:  { url: "https://unreachable.invalid" }
Output: "Failed to fetch: getaddrinfo ENOTFOUND..." (isError: true)
```

---

## 7. Implementation Guide

### Step 1: Add the Tool

```typescript
server.registerTool(
  "fetch_url",
  {
    title: "Fetch URL",
    description: "Fetches content from a URL and returns the raw HTML/text. Use this to retrieve web pages.",
    inputSchema: {
      url: z.string().url().describe("The URL to fetch"),
      timeout: z
        .number()
        .int()
        .min(1000)
        .max(30000)
        .default(10000)
        .describe("Timeout in milliseconds (default: 10000)"),
    },
  },
  async ({ url, timeout }: { url: string; timeout: number }) => {
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; MCP-Fetcher/1.0)",
          "Accept": "text/html,application/xhtml+xml,text/plain,*/*",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return {
          content: [{
            type: "text" as const,
            text: `HTTP error: ${response.status} ${response.statusText}`,
          }],
          isError: true,
        };
      }

      const text = await response.text();

      return {
        content: [{ type: "text" as const, text }],
      };

    } catch (error) {
      let message: string;

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          message = `Request timed out after ${timeout}ms`;
        } else {
          message = error.message;
        }
      } else {
        message = "Unknown error occurred";
      }

      return {
        content: [{
          type: "text" as const,
          text: `Failed to fetch: ${message}`,
        }],
        isError: true,
      };
    }
  }
);
```

### Step 2: Understanding AbortController

`AbortController` is how we implement timeouts:

```typescript
// Create a controller
const controller = new AbortController();

// Set up timeout to abort after X ms
const timeoutId = setTimeout(() => controller.abort(), 10000);

// Pass signal to fetch
const response = await fetch(url, {
  signal: controller.signal,  // <-- This connects them
});

// Clear timeout if fetch completes first
clearTimeout(timeoutId);
```

When `controller.abort()` is called, the fetch throws an `AbortError`.

---

## 8. Testing Strategy

### Test Cases

| Test | URL | Expected Result |
|------|-----|-----------------|
| Basic fetch | `https://example.com` | HTML content |
| HTTPS | `https://httpbin.org/html` | HTML page |
| 404 error | `https://httpbin.org/status/404` | HTTP error: 404 |
| 500 error | `https://httpbin.org/status/500` | HTTP error: 500 |
| Timeout | `https://httpbin.org/delay/15` | Request timed out |
| Invalid URL | `not-a-url` | Zod validation error |
| DNS failure | `https://this.domain.does.not.exist.invalid` | Network error |

### Using httpbin.org for Testing

[httpbin.org](https://httpbin.org) is a free service for testing HTTP:

- `/html` - Returns sample HTML
- `/status/404` - Returns 404 error
- `/status/500` - Returns 500 error
- `/delay/5` - Delays response by 5 seconds
- `/headers` - Returns request headers as JSON

### Manual Testing with Inspector

```bash
npm run build
npx @modelcontextprotocol/inspector node dist/index.js
```

Then test each case in the Inspector UI.

### Testing with Claude Code

```
You: "fetch https://example.com"

Claude: [Uses fetch_url tool]
        Here's the content from example.com:
        <!doctype html>
        <html>
        <head>
            <title>Example Domain</title>
        ...
```

---

## Key Takeaways

1. **Native fetch()** - Available in Node 20+, no packages needed
2. **fetch() doesn't throw on HTTP errors** - Check `response.ok`
3. **Use AbortController for timeouts** - fetch() doesn't have built-in timeout
4. **Headers matter** - Some sites block requests without proper headers
5. **Always handle errors** - Network requests can fail in many ways
6. **Return isError: true on failure** - Tells Claude the tool failed

---

## What's Next?

In **Phase 5**, we'll adapt this for Medium specifically:
- Handle Medium's 403 paywall
- Use Freedium as a proxy
- Validate Medium URLs

---

**Status**: 📝 Documentation complete, ready for implementation

**Back to**: [Phase 3](./PHASE_3_CONNECT_TO_CLAUDE_CODE.md) | [Learning Plan](./LEARNING_PLAN.md)
