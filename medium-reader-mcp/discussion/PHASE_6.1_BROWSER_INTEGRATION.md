# Phase 6.1: Browser Integration - Research & Best Practices (2025)

> **Goal**: Connect to user's existing browser session to read paywalled Medium articles

---

## The Problem

We need to read Medium articles that are behind a paywall. The user has a Medium subscription and is logged in via their browser. We need to:
1. Access the article content using the user's authenticated session
2. Extract the content for the LLM to process

---

## Research Summary (2025)

Based on web research, here are the validated approaches:

### Approach 1: Chrome DevTools Protocol (CDP) - RECOMMENDED

Connect to an already-running Chrome instance via remote debugging.

**How it works:**
1. User starts Chrome with `--remote-debugging-port=9222`
2. Puppeteer/Playwright connects via `http://localhost:9222`
3. Opens a new tab, navigates to the article
4. Extracts HTML content
5. Closes the tab (not the browser)

**Pros:**
- Uses user's existing logged-in session
- No need to copy/manage cookies manually
- Works with any site the user is logged into
- User's browser stays open

**Cons:**
- Requires Chrome to be started with special flag
- Only one connection at a time to debugging port

**Sources:**
- [Connecting Puppeteer to Existing Chrome Window](https://medium.com/@jaredpotter1/connecting-puppeteer-to-existing-chrome-window-8a10828149e0)
- [Puppeteer Issue #3543 - Using with current Chrome](https://github.com/puppeteer/puppeteer/issues/3543)
- [Puppeteer.connect() API](https://pptr.dev/api/puppeteer.puppeteer.connect)

---

### Approach 2: userDataDir (Persistent Profile)

Launch Puppeteer with a specific Chrome profile directory.

```javascript
const browser = await puppeteer.launch({
  userDataDir: '/path/to/chrome/profile',
  args: ['--profile-directory=Default']
});
```

**Pros:**
- Preserves cookies, localStorage, sessions
- Works across script restarts

**Cons:**
- Cannot use if Chrome is already running with that profile (file lock!)
- Need to know the exact profile path

**Sources:**
- [Managing Sessions and Cookies in Puppeteer](https://www.browserless.io/blog/manage-sessions)
- [Puppeteer Issue #1316 - userDataDir troubles](https://github.com/puppeteer/puppeteer/issues/1316)

---

### Approach 3: Cookie Extraction & Injection

Extract cookies from Chrome's database and inject them into Puppeteer.

**Pros:**
- Can work alongside running Chrome

**Cons:**
- Cookies are encrypted (platform-specific decryption needed)
- Complex implementation
- May break with Chrome updates

**Sources:**
- [Using Cookies to Mirror Chrome Profile](https://dev.to/rubengmurray/using-cookies-puppeteer-nodejs-to-mirror-a-chrome-profile-on-macos-1l6m)
- [Puppeteer Cookies Guide](https://pptr.dev/guides/cookies)

---

## Puppeteer vs Playwright (2025)

| Feature | Puppeteer | Playwright |
|---------|-----------|------------|
| **Developer** | Google | Microsoft (ex-Puppeteer team) |
| **Browser Support** | Chrome/Chromium only | Chrome, Firefox, WebKit |
| **CDP Connection** | `puppeteer.connect()` | `chromium.connectOverCDP()` |
| **Language Support** | JavaScript/TypeScript | JS, Python, .NET, Java |
| **Auto-wait** | Manual | Built-in |
| **Parallel Execution** | Manual | Built-in browser contexts |

**Verdict**: Both support connecting to existing Chrome via CDP. Playwright is newer with more features, but Puppeteer is simpler for Chrome-only use cases.

**Sources:**
- [Playwright vs Puppeteer 2025 - BrowserStack](https://www.browserstack.com/guide/playwright-vs-puppeteer)
- [Playwright vs Puppeteer - Apify](https://blog.apify.com/playwright-vs-puppeteer/)
- [Playwright Migration Guide](https://playwright.dev/docs/puppeteer)

---

## Our Implementation

We chose **CDP Connection (Approach 1)** with fallback to launching a fresh browser.

### Code Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    BROWSER FETCH FLOW                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   read_medium(url)                                              │
│         │                                                        │
│         ▼                                                        │
│   ┌─────────────────────────────────────────┐                   │
│   │ Try direct fetch with cookies (.env)?   │                   │
│   └─────────────────────────────────────────┘                   │
│         │                                                        │
│     SUCCESS ──────────► Return content                          │
│         │                                                        │
│     FAIL (no cookies or auth error)                             │
│         │                                                        │
│         ▼                                                        │
│   ┌─────────────────────────────────────────┐                   │
│   │ Try connect to Chrome on port 9222      │                   │
│   └─────────────────────────────────────────┘                   │
│         │                                                        │
│     SUCCESS ──┐                                                 │
│         │     │                                                  │
│     FAIL      ▼                                                  │
│         │   ┌─────────────────────────────────────────┐         │
│         │   │ Open new tab in user's Chrome           │         │
│         │   │ Navigate to URL                          │         │
│         │   │ Extract HTML                             │         │
│         │   │ Close tab (keep browser open)            │         │
│         │   └─────────────────────────────────────────┘         │
│         │     │                                                  │
│         │     ▼                                                  │
│         │   Return content                                      │
│         │                                                        │
│         ▼                                                        │
│   ┌─────────────────────────────────────────┐                   │
│   │ Launch fresh browser (no auth)          │                   │
│   │ Show tip to start Chrome with debug     │                   │
│   └─────────────────────────────────────────┘                   │
│         │                                                        │
│         ▼                                                        │
│   Return content (may hit paywall)                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### How to Start Chrome with Remote Debugging

**macOS:**
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222
```

**Windows:**
```cmd
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
```

**Linux:**
```bash
google-chrome --remote-debugging-port=9222
```

### Best Practices Followed

1. **Don't close user's browser** - Only close the tab, not the browser instance
2. **Graceful fallback** - If no debugging port, launch fresh browser with helpful message
3. **Check port 9222** - Standard Chrome debugging port
4. **Use browserURL** - Simpler than WebSocket endpoint which changes each launch

---

## Key Implementation Code

```typescript
async function connectToExistingChrome() {
  try {
    const browser = await puppeteer.connect({
      browserURL: "http://127.0.0.1:9222",
    });
    return browser;
  } catch {
    return null; // Chrome not running with debugging
  }
}

async function fetchWithBrowser(url: string) {
  const browser = await connectToExistingChrome();

  if (browser) {
    // Use existing Chrome (user is logged in!)
    const page = await browser.newPage();
    await page.goto(url);
    const html = await page.content();
    await page.close(); // Close tab, not browser!
    return { success: true, content: html };
  } else {
    // Fall back to fresh browser (no auth)
    console.error("TIP: Start Chrome with --remote-debugging-port=9222");
    // ... launch fresh browser
  }
}
```

---

## Alternative Considered: Playwright

Playwright offers similar functionality with `connectOverCDP`:

```typescript
const browser = await chromium.connectOverCDP('http://localhost:9222');
const context = browser.contexts()[0];
const page = context.pages()[0];
```

We chose Puppeteer because:
1. Already installed as a dependency
2. Simpler API for Chrome-only use case
3. Smaller bundle size

**Sources:**
- [Playwright connectOverCDP](https://playwright.dev/docs/api/class-browsertype#browser-type-connect-over-cdp)
- [Connecting Playwright to Existing Browser](https://www.browserstack.com/guide/playwright-connect-to-existing-browser)

---

## Future Improvements

1. **Auto-detect Chrome debugging** - Could try to enable debugging automatically
2. **Browser extension** - Create extension to expose page content without CDP
3. **Cookie sync** - Periodically sync cookies from user's browser

---

## Key Lessons Learned

| Lesson | Description |
|--------|-------------|
| **CDP is the answer** | Chrome DevTools Protocol lets you connect to running Chrome |
| **Profile locking** | Can't use `userDataDir` if Chrome is already running |
| **Tab vs Browser** | Close the tab, not the browser when done |
| **Fallback gracefully** | Always have a fallback if primary method fails |

---

**Status**: Implemented

**Sources:**
- [Puppeteer Connect API](https://pptr.dev/api/puppeteer.puppeteer.connect)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [Browserless Session Management](https://www.browserless.io/blog/manage-sessions)
- [Playwright vs Puppeteer 2025](https://www.browserstack.com/guide/playwright-vs-puppeteer)
