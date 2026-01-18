# Phase 6 Journey Map: Reading Premium Medium Articles

> **Goal**: Read full content from paywalled Medium articles using the user's existing subscription

---

## The Problem

Medium articles behind paywalls only show a preview (~200 words) when fetched programmatically. We needed to:
1. Authenticate requests using the user's Medium subscription
2. Extract the full article content for LLM processing

---

## Journey Timeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        PHASE 6 EVOLUTION                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Attempt 1: Manual .env Cookies                                             │
│      ↓ ❌ Poor UX - users must copy cookies from DevTools                   │
│                                                                              │
│  Attempt 2: Puppeteer Browser Automation                                    │
│      ↓ ❌ Cloudflare CAPTCHA detection blocked it                           │
│                                                                              │
│  Attempt 3: Just Open in Browser                                            │
│      ↓ ❌ Can't extract content for LLM use                                 │
│                                                                              │
│  Attempt 4: Chrome DevTools Protocol (CDP)                                  │
│      ↓ ❌ Requires --remote-debugging-port=9222 flag (not user-friendly)    │
│                                                                              │
│  Attempt 5: chrome-cookies-secure (Cookie Database)                         │
│      ↓ ⚠️ Cookies work but HTML still truncated (client-side rendering)     │
│                                                                              │
│  Attempt 6: GraphQL API + Chrome Cookies                                    │
│      ↓ ✅ SUCCESS! Full content retrieved                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Attempt 1: Manual .env Cookies

### Approach
User manually extracts `sid` and `uid` cookies from Chrome DevTools and adds them to `.env` file.

```env
MEDIUM_SID=1*abc123...
MEDIUM_UID=xyz789...
```

### Why It Failed
- **Poor UX**: Users must open DevTools → Application → Cookies → Copy values
- **Maintenance burden**: Cookies expire, requiring repeated manual updates
- **Error-prone**: Easy to copy wrong values

### Code (Still exists as fallback)
```typescript
function getMediumCookies(): string | null {
  const sid = process.env.MEDIUM_SID;
  const uid = process.env.MEDIUM_UID;
  if (!sid || !uid) return null;
  return `sid=${sid}; uid=${uid}`;
}
```

---

## Attempt 2: Puppeteer Browser Automation

### Approach
Launch Puppeteer browser, let user login, capture cookies automatically.

```typescript
const browser = await puppeteer.launch({ headless: false });
// User logs in manually
// Poll for cookies every 2 seconds
// Save to .env when found
```

### Why It Failed
- **Cloudflare detection**: Even with `puppeteer-extra-plugin-stealth`, got stuck in CAPTCHA loop
- **User feedback**: "stick to legit ways"

### Lesson Learned
Modern bot detection (Cloudflare) is very effective at detecting automated browsers.

---

## Attempt 3: Just Open in Browser

### Approach
Simply open the URL in the user's default browser where they're already logged in.

```typescript
function openInBrowser(url: string): Promise<void> {
  const command = process.platform === "darwin"
    ? `open "${url}"`
    : process.platform === "win32"
      ? `start "${url}"`
      : `xdg-open "${url}"`;
  exec(command);
}
```

### Why It Failed
- Opens correctly, user can read the article
- **But**: Can't extract content for LLM to process
- User feedback: "configure read_medium to read text from the open browser tab so LLM can use it"

### Lesson Learned
Opening in browser is a valid fallback, but doesn't solve the core problem.

---

## Attempt 4: Chrome DevTools Protocol (CDP)

### Approach
Connect to an already-running Chrome instance via remote debugging.

```typescript
async function connectToExistingChrome() {
  const browser = await puppeteer.connect({
    browserURL: "http://127.0.0.1:9222",
  });
  return browser;
}
```

### Requires
User must start Chrome with special flag:
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
```

### Why It Failed
- **Not user-friendly**: Requires closing Chrome and restarting with debug flag
- User feedback: "this is probably not the best way to do this starting chrome in debug mode is not user friendly"

### Lesson Learned
Good technical solution, but UX matters. Users won't change their browser startup routine.

---

## Attempt 5: chrome-cookies-secure

### Approach
Read cookies directly from Chrome's SQLite database without requiring browser restart.

```typescript
import { getCookiesPromised } from "chrome-cookies-secure";

async function getChromeMediumCookies(): Promise<string | null> {
  const cookies = await getCookiesPromised("https://medium.com", "header");
  return cookies; // Returns all 14 cookies as "name1=value1; name2=value2"
}
```

### How It Works
```
┌─────────────────────────────────────────────────────────────────┐
│                    COOKIE DECRYPTION FLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   1. Locate Chrome's SQLite database                            │
│      ~/Library/Application Support/Google/Chrome/Default/Cookies│
│                                                                  │
│   2. Query cookies for medium.com domain                        │
│                                                                  │
│   3. Get encryption key from macOS Keychain                     │
│      (First time: prompts "Allow access to Chrome Safe Storage?")│
│                                                                  │
│   4. Decrypt cookie values using AES-128-CBC                    │
│      - Salt: "saltysalt"                                        │
│      - Iterations: 1003                                         │
│      - IV: 16 space characters                                  │
│                                                                  │
│   5. Return decrypted cookies                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Initial Problem: Only 2 Cookies
First implementation only extracted `sid` and `uid`:
```typescript
// OLD - Wrong approach
if (cookies.sid && cookies.uid) {
  return { sid: cookies.sid, uid: cookies.uid };
}
```

### Fixed: All 14 Cookies
```typescript
// NEW - Correct approach
const cookies = await getCookiesPromised("https://medium.com", "header");
// Returns: "g_state=...; xsrf=...; sid=...; uid=...; cf_clearance=...; ..."
```

### Why It Still Failed
Even with all cookies, the **HTML response was truncated** (~200 words).

**Root cause discovered**: Medium uses **client-side JavaScript** to load premium content. The initial HTML is just a shell. The actual content is loaded via JavaScript after page render.

```
HTML Response: 126KB but only ~200 words of article text
Why? Content loaded via JavaScript, not in initial HTML
```

---

## Attempt 6: GraphQL API ✅ SUCCESS

### Discovery
Medium loads article content via a GraphQL API at `https://medium.com/_/graphql`. This API returns the **full structured content** directly.

### How We Found It
Testing showed:
- HTML fetch: ~200 words (truncated)
- GraphQL API: ~6,000 words (full article!)

### Implementation

```typescript
async function fetchViaGraphQL(postId: string, cookieString: string) {
  const query = {
    operationName: "PostViewerEdgeContentQuery",
    variables: { postId },
    query: `query PostViewerEdgeContentQuery($postId: ID!) {
      post(id: $postId) {
        title
        content(postMeteringOptions: {}) {
          bodyModel {
            paragraphs {
              text
              type
              markups { type, start, end, href }
            }
          }
        }
        creator { name }
        firstPublishedAt
      }
    }`
  };

  const response = await fetch("https://medium.com/_/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": cookieString,
      "Accept": "application/json",  // Critical! Must be application/json
      "Origin": "https://medium.com",
    },
    body: JSON.stringify(query),
  });

  return response.json();
}
```

### Key Details

**Extracting Post ID from URL:**
```typescript
// URL: https://medium.com/.../your-ai-agent-is-failing-b9705dbea706
// Post ID: b9705dbea706 (hex string after last hyphen)

function extractPostId(url: string): string | null {
  const match = new URL(url).pathname.match(/-([a-f0-9]+)$/i);
  return match ? match[1] : null;
}
```

**Converting Paragraph Types to Markdown:**
```typescript
function paragraphToMarkdown(p: MediumParagraph): string {
  switch (p.type) {
    case "H2": return `## ${p.text}`;
    case "H3": return `# ${p.text}`;
    case "P": return p.text;
    case "PRE": return `\`\`\`\n${p.text}\n\`\`\``;
    case "BQ": case "PQ": return `> ${p.text}`;
    case "ULI": return `- ${p.text}`;
    case "OLI": return `1. ${p.text}`;
    case "IMG": return `*[Image: ${p.text}]*`;
    default: return p.text;
  }
}
```

**Applying Markups (Bold, Links, etc.):**
```typescript
// Markups define formatting ranges within text
// { type: "A", start: 10, end: 20, href: "https://..." }
// { type: "STRONG", start: 5, end: 15 }

// Process in reverse order to avoid index shifting
const sortedMarkups = [...p.markups].sort((a, b) => b.start - a.start);
for (const markup of sortedMarkups) {
  const before = text.substring(0, markup.start);
  const content = text.substring(markup.start, markup.end);
  const after = text.substring(markup.end);

  if (markup.type === "A") text = `${before}[${content}](${markup.href})${after}`;
  if (markup.type === "STRONG") text = `${before}**${content}**${after}`;
  if (markup.type === "EM") text = `${before}*${content}*${after}`;
}
```

---

## Final Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    FINAL FLOW                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   read_medium(url)                                              │
│         │                                                        │
│         ▼                                                        │
│   ┌─────────────────────────────────────────┐                   │
│   │ 1. Extract post ID from URL             │                   │
│   │    e.g., "b9705dbea706"                 │                   │
│   └─────────────────────────────────────────┘                   │
│         │                                                        │
│         ▼                                                        │
│   ┌─────────────────────────────────────────┐                   │
│   │ 2. Read ALL cookies from Chrome DB      │                   │
│   │    (14 cookies via chrome-cookies-secure)│                   │
│   └─────────────────────────────────────────┘                   │
│         │                                                        │
│         ▼                                                        │
│   ┌─────────────────────────────────────────┐                   │
│   │ 3. Call GraphQL API with cookies        │                   │
│   │    POST https://medium.com/_/graphql    │                   │
│   └─────────────────────────────────────────┘                   │
│         │                                                        │
│     SUCCESS ───► Convert paragraphs to Markdown                 │
│         │        Return full article (~6000 words)              │
│         │                                                        │
│     FAIL                                                         │
│         │                                                        │
│         ▼                                                        │
│   ┌─────────────────────────────────────────┐                   │
│   │ 4. Fallback: HTML fetch + extraction    │                   │
│   │    (May be truncated for premium)       │                   │
│   └─────────────────────────────────────────┘                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Test Results

**Before (HTML scraping):**
```
Title: Your AI Agent Is Failing Because of Context, Not the Model
Word count: 208
Content: [Truncated preview with "Member-only story" text]
```

**After (GraphQL API):**
```
Title: Your AI Agent Is Failing Because of Context, Not the Model
Author: Vivedha Elango
Date: 2026-01-03
Word count: 6,115
Content: [Full article with proper markdown formatting]
```

---

## Key Lessons Learned

| Lesson | Description |
|--------|-------------|
| **Modern sites use client-side rendering** | HTML response may be a shell; real content loaded via JS/API |
| **APIs > Scraping** | GraphQL/REST APIs provide structured data, more reliable than HTML parsing |
| **Bot detection is sophisticated** | Puppeteer stealth plugins no longer fool Cloudflare |
| **UX matters** | Technically valid solutions (CDP debug port) fail if they burden users |
| **Send ALL cookies** | Premium features may require cookies beyond the obvious auth ones |
| **Accept header matters** | GraphQL endpoint returns HTML if Accept header isn't `application/json` |

---

## Dependencies Added

```json
{
  "chrome-cookies-secure": "^1.1.1"
}
```

Removed:
- `puppeteer` (no longer needed)
- `puppeteer-extra`
- `puppeteer-extra-plugin-stealth`

---

## Files Modified

- `src/index.ts` - Added GraphQL fetching, chrome-cookies-secure integration
- `src/types/chrome-cookies-secure.d.ts` - TypeScript type definitions
- `package.json` - Updated dependencies

---

## Future Improvements

1. **Caching**: Cache GraphQL responses to avoid repeated API calls
2. **Rate limiting**: Add backoff if Medium rate-limits requests
3. **Firefox/Safari support**: chrome-cookies-secure only works with Chrome
4. **Image handling**: Currently images shown as `*[Image: caption]*`, could fetch actual images

---

**Status**: ✅ Complete

**Duration**: ~6 iterations over the course of development

**Final solution**: GraphQL API + chrome-cookies-secure for cookie authentication
