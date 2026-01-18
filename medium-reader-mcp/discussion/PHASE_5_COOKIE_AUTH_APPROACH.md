# Phase 5: Cookie-Based Authentication for Medium

> **Goal**: Fetch Medium articles using your own subscription via browser cookies

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Why Previous Approaches Failed](#2-why-previous-approaches-failed)
3. [Why Cookie-Based Authentication](#3-why-cookie-based-authentication)
4. [How Browser Authentication Works](#4-how-browser-authentication-works)
5. [Medium's Cookie Structure](#5-mediums-cookie-structure)
6. [Security Considerations](#6-security-considerations)
7. [Implementation Guide](#7-implementation-guide)
8. [Configuration Setup](#8-configuration-setup)
9. [Testing Strategy](#9-testing-strategy)

---

## 1. Problem Statement

### What We're Trying to Do

Fetch Medium article content programmatically so Claude can read and summarize articles for us.

### The Challenge

```
┌─────────────────────────────────────────────────────────────────┐
│                    THE MEDIUM ACCESS PROBLEM                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   When we fetch a Medium article URL directly:                  │
│                                                                  │
│   fetch("https://medium.com/@user/some-article")                │
│                                                                  │
│   Medium responds with:                                          │
│   • 403 Forbidden (blocked)                                     │
│   • Partial content with paywall overlay                        │
│   • Redirect to sign-in page                                    │
│                                                                  │
│   WHY?                                                           │
│   Medium has a metered paywall:                                 │
│   • Free tier: ~3 articles/month                                │
│   • After that: Requires $5/month membership                    │
│   • Some articles: Members-only from the start                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### The User's Situation

- **User HAS a Medium subscription** (paid member)
- User can read any article in their browser
- But programmatic fetch fails because it's not authenticated

---

## 2. Why Previous Approaches Failed

### Approach 1: Direct Fetch

```typescript
const response = await fetch(mediumUrl);
// Result: 403 Forbidden or partial content
```

**Why it failed**: No authentication. Medium sees an anonymous request.

### Approach 2: Freedium Proxy

```typescript
const freediumUrl = `https://freedium.cfd/${mediumUrl}`;
const response = await fetch(freediumUrl);
// Result: Connection failed / Service unavailable
```

**Why it failed**:
- Freedium service is unreliable (changes domains, goes down)
- Legal gray area (bypassing paywall for non-subscribers)
- Not a sustainable solution

### Approach 3: Unofficial Medium API

- Requires paid subscription ($10-50/month)
- Additional cost on top of Medium subscription
- Third-party dependency

---

## 3. Why Cookie-Based Authentication

### The Insight

When you browse Medium in your browser while logged in:

```
┌─────────────────────────────────────────────────────────────────┐
│              HOW YOUR BROWSER ACCESSES MEDIUM                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   1. You log into Medium                                        │
│      └── Medium sets cookies in your browser                    │
│                                                                  │
│   2. You visit an article                                       │
│      └── Browser automatically sends cookies with request       │
│                                                                  │
│   3. Medium receives request + cookies                          │
│      └── Sees you're a paying member                            │
│      └── Returns full article content                           │
│                                                                  │
│   THE KEY: Those cookies ARE your authentication!               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Why This Approach is Legitimate

| Concern | Answer |
|---------|--------|
| Is it legal? | Yes - you're using YOUR paid subscription |
| Is it ethical? | Yes - not bypassing paywall, using your own access |
| Is it against ToS? | Gray area, but for personal use it's like browser automation |
| Is it sustainable? | Yes - as long as you maintain your subscription |

### Comparison of Approaches

| Approach | Reliability | Cost | Legitimacy |
|----------|-------------|------|------------|
| Direct fetch | ❌ Fails | Free | N/A |
| Freedium proxy | ❌ Unreliable | Free | ⚠️ Gray area |
| Unofficial API | ✅ Works | $10-50/mo | ✅ Legit |
| **Cookie auth** | ✅ Works | Free* | ✅ Your subscription |

*Requires existing Medium subscription

---

## 4. How Browser Authentication Works

### The HTTP Cookie Mechanism

```
┌─────────────────────────────────────────────────────────────────┐
│                    COOKIE AUTHENTICATION FLOW                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   STEP 1: LOGIN                                                  │
│   ─────────────                                                  │
│   Browser ──► POST /login (email, password) ──► Medium          │
│   Browser ◄── Set-Cookie: sid=abc123; uid=xyz789 ◄── Medium     │
│                                                                  │
│   STEP 2: SUBSEQUENT REQUESTS                                   │
│   ────────────────────────────                                  │
│   Browser ──► GET /article (Cookie: sid=abc123; uid=xyz789) ──► │
│   Browser ◄── 200 OK + Full Article Content ◄── Medium          │
│                                                                  │
│   STEP 3: OUR APPROACH                                          │
│   ─────────────────────                                         │
│   We copy those cookies and use them in our fetch requests!     │
│                                                                  │
│   fetch(url, {                                                   │
│     headers: {                                                   │
│       Cookie: "sid=abc123; uid=xyz789"                          │
│     }                                                            │
│   })                                                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### What Cookies Contain

Cookies are small pieces of data that:
- Identify your session (who you are)
- Prove you're authenticated
- May contain preferences and tracking info

They're sent automatically by browsers, but we can send them manually in code.

---

## 5. Medium's Cookie Structure

### Key Cookies for Authentication

| Cookie Name | Purpose | Example Value |
|-------------|---------|---------------|
| `sid` | Session ID - proves you're logged in | `1:abc123def456...` |
| `uid` | User ID - identifies your account | `lo_abc123xyz...` |

### How to Get Your Cookies

```
┌─────────────────────────────────────────────────────────────────┐
│                 EXTRACTING MEDIUM COOKIES                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   1. Open Chrome/Firefox/Safari                                 │
│   2. Go to medium.com (make sure you're logged in)              │
│   3. Open Developer Tools (F12 or Cmd+Option+I)                 │
│   4. Go to: Application → Cookies → https://medium.com          │
│                                                                  │
│   Chrome:                                                        │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │ Application > Storage > Cookies > https://medium.com     │  │
│   │                                                          │  │
│   │ Name     │ Value                    │ Expires            │  │
│   │ ─────────┼──────────────────────────┼─────────────────── │  │
│   │ sid      │ 1:abc123def456ghi789... │ Session/Date       │  │
│   │ uid      │ lo_abc123xyz789...      │ Session/Date       │  │
│   └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│   5. Copy the values of 'sid' and 'uid'                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Cookie Expiration

- Cookies expire after some time (days to months)
- When they expire, you'll need to re-extract them
- You'll know they expired when requests start failing

---

## 6. Security Considerations

### What These Cookies Can Do

⚠️ **These cookies provide FULL access to your Medium account!**

Someone with your cookies can:
- Read all articles as you
- Post articles as you
- Change account settings
- Access billing information

### Security Best Practices

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY BEST PRACTICES                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   DO:                                                            │
│   ✅ Store cookies in environment variables (not in code)       │
│   ✅ Use .env files that are in .gitignore                      │
│   ✅ Rotate cookies periodically                                │
│   ✅ Use only for personal/local use                            │
│                                                                  │
│   DON'T:                                                         │
│   ❌ Commit cookies to git                                       │
│   ❌ Share cookies with others                                   │
│   ❌ Use in production/public services                          │
│   ❌ Log cookies in output                                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Environment Variables for Secrets

We'll use environment variables because:
1. They're not committed to git
2. They can be set per-machine
3. They're the standard for secrets
4. MCP server config supports passing env vars

---

## 7. Implementation Guide

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    IMPLEMENTATION ARCHITECTURE                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Environment Variables:                                        │
│   ├── MEDIUM_SID = "1:abc123..."                                │
│   └── MEDIUM_UID = "lo_xyz789..."                               │
│                                                                  │
│   MCP Server:                                                    │
│   ├── On startup: Read env vars                                 │
│   ├── On tool call: Build cookie header                         │
│   └── Fetch with authentication                                 │
│                                                                  │
│   Fallback Strategy:                                            │
│   ├── If cookies configured → Use authenticated fetch           │
│   └── If no cookies → Try unauthenticated (may fail)           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Code Structure

```typescript
// 1. Read cookies from environment
function getMediumCookies(): string | null {
  const sid = process.env.MEDIUM_SID;
  const uid = process.env.MEDIUM_UID;

  if (!sid || !uid) {
    return null;  // No cookies configured
  }

  return `sid=${sid}; uid=${uid}`;
}

// 2. Fetch with authentication
async function fetchMediumArticle(url: string): Promise<FetchResult> {
  const cookies = getMediumCookies();

  const headers: Record<string, string> = {
    "User-Agent": "Mozilla/5.0 ...",  // Look like a browser
    "Accept": "text/html...",
  };

  if (cookies) {
    headers["Cookie"] = cookies;
  }

  const response = await fetch(url, { headers });
  // ... handle response
}
```

### Browser-Like Headers

Medium checks headers to detect bots. We need to look like a real browser:

```typescript
const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  "Pragma": "no-cache",
};
```

---

## 8. Configuration Setup

### Step 1: Extract Your Cookies

1. Go to medium.com in your browser (logged in)
2. Open DevTools → Application → Cookies → medium.com
3. Find and copy `sid` and `uid` values

### Step 2: Set Environment Variables

**Option A: Shell export (temporary)**
```bash
export MEDIUM_SID="your-sid-value-here"
export MEDIUM_UID="your-uid-value-here"
```

**Option B: .env file (persistent, local)**
```bash
# Create .env file in project root
echo 'MEDIUM_SID="your-sid-value-here"' >> .env
echo 'MEDIUM_UID="your-uid-value-here"' >> .env
```

**Option C: MCP Server config (recommended)**

Update Claude Code MCP config to pass env vars:

```json
{
  "mcpServers": {
    "medium-reader": {
      "command": "node",
      "args": ["/path/to/dist/index.js"],
      "env": {
        "MEDIUM_SID": "your-sid-value-here",
        "MEDIUM_UID": "your-uid-value-here"
      }
    }
  }
}
```

### Step 3: Verify Configuration

The tool should report whether cookies are configured:
- With cookies: "Fetching with authentication..."
- Without cookies: "Warning: No cookies configured, may hit paywall"

---

## 9. Testing Strategy

### Test Cases

| Test | Expected Result |
|------|-----------------|
| Cookies configured + valid | Full article content |
| Cookies configured + expired | 401/403 + helpful error message |
| No cookies configured | Warning + attempt unauthenticated |
| Invalid Medium URL | "Not a Medium URL" error |

### Verifying Cookies Work

```bash
# Quick test with curl
curl -H "Cookie: sid=YOUR_SID; uid=YOUR_UID" \
     -H "User-Agent: Mozilla/5.0..." \
     "https://medium.com/@user/some-article"
```

If you get full HTML (not a paywall), cookies are working!

### When Cookies Expire

Signs your cookies have expired:
- Requests start returning 401 or 403
- You get redirected to login page
- Response contains "sign in" prompts

**Solution**: Re-extract cookies from browser and update config.

---

## Key Takeaways

1. **Cookie auth is legitimate** - You're using your own paid subscription
2. **Cookies = session** - They prove you're logged in
3. **Security matters** - Store in env vars, never commit
4. **Headers matter** - Look like a browser, not a bot
5. **Cookies expire** - Be prepared to refresh them

---

## What's Next?

After implementing cookie-based auth:
1. **Phase 6**: Extract clean content from HTML (cheerio)
2. **Phase 7**: Convert to Markdown (turndown)
3. **Phase 8**: Polish and error handling

---

**Status**: 📝 Documentation complete, ready for implementation

**Back to**: [Phase 5 Overview](./PHASE_5_MEDIUM_FETCHING.md) | [Learning Plan](./LEARNING_PLAN.md)
