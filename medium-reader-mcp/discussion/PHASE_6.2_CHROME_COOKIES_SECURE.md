# Phase 6.2: Chrome Cookies Secure - Direct Cookie Access

> **Goal**: Read cookies directly from Chrome's database without requiring browser restart or special flags

---

## The Problem with Previous Approaches

| Approach | Issue |
|----------|-------|
| Manual `.env` cookies | User must open DevTools, find cookies, copy/paste |
| Puppeteer with `userDataDir` | Chrome locks profile when running - can't use |
| CDP remote debugging | Requires starting Chrome with `--remote-debugging-port=9222` |

**None of these are user-friendly!**

---

## The Solution: `chrome-cookies-secure`

A Node.js package that reads Chrome's cookie SQLite database and decrypts cookies using the OS keychain.

**Repository**: [github.com/bertrandom/chrome-cookies-secure](https://github.com/bertrandom/chrome-cookies-secure)

**NPM**: [chrome-cookies-secure](https://www.npmjs.com/package/chrome-cookies-secure)

---

## How Chrome Stores Cookies

```
┌─────────────────────────────────────────────────────────────────┐
│                    CHROME COOKIE STORAGE                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Location (macOS):                                             │
│   ~/Library/Application Support/Google/Chrome/Default/Cookies   │
│                                                                  │
│   Format: SQLite Database                                       │
│                                                                  │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ cookies table                                           │   │
│   ├─────────────────────────────────────────────────────────┤   │
│   │ host_key        │ ".medium.com"                         │   │
│   │ name            │ "sid"                                 │   │
│   │ value           │ "" (empty for encrypted)              │   │
│   │ encrypted_value │ v10... (AES-128-CBC encrypted)        │   │
│   │ expires_utc     │ 13345678901234567                     │   │
│   │ path            │ "/"                                   │   │
│   │ is_secure       │ 1                                     │   │
│   │ is_httponly     │ 1                                     │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cookie Encryption Details

Chrome encrypts cookie values for security. The encryption varies by OS:

### macOS Encryption

```
┌─────────────────────────────────────────────────────────────────┐
│                    macOS COOKIE DECRYPTION                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   1. ENCRYPTION KEY                                             │
│      └── Stored in macOS Keychain under "Chrome Safe Storage"  │
│      └── Base64 encoded passphrase                              │
│                                                                  │
│   2. KEY DERIVATION                                             │
│      └── Algorithm: PBKDF2 (RFC 2898)                          │
│      └── Salt: "saltysalt" (fixed string)                      │
│      └── Iterations: 1003 (macOS), 1 (Linux)                   │
│      └── Output: 16-byte AES-128 key                           │
│                                                                  │
│   3. DECRYPTION                                                 │
│      └── Algorithm: AES-128-CBC                                 │
│      └── IV: 16 space characters (0x20)                        │
│      └── Prefix: "v10" indicates encrypted value               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Retrieving the Encryption Key

On macOS, you can manually get the key with:
```bash
security find-generic-password -ga "Chrome"
```

This will prompt for your password and show the Chrome Safe Storage password.

---

## How `chrome-cookies-secure` Works

```
┌─────────────────────────────────────────────────────────────────┐
│                    LIBRARY FLOW                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   1. getCookies("https://medium.com")                           │
│                     │                                            │
│                     ▼                                            │
│   2. Open SQLite database                                       │
│      ~/Library/.../Chrome/Default/Cookies                       │
│                     │                                            │
│                     ▼                                            │
│   3. Query cookies for domain                                   │
│      SELECT * FROM cookies WHERE host_key LIKE '%medium.com%'   │
│                     │                                            │
│                     ▼                                            │
│   4. Get encryption key from Keychain                           │
│      security find-generic-password -w -ga "Chrome"             │
│                     │                                            │
│      ┌──────────────┴──────────────┐                            │
│      │  First time: macOS prompts  │                            │
│      │  "Allow access to Chrome    │                            │
│      │   Safe Storage?"            │                            │
│      │  [Deny] [Always Allow]      │                            │
│      └─────────────────────────────┘                            │
│                     │                                            │
│                     ▼                                            │
│   5. Derive AES key using PBKDF2                                │
│      └── password + "saltysalt" + 1003 iterations              │
│                     │                                            │
│                     ▼                                            │
│   6. Decrypt each cookie value                                  │
│      └── AES-128-CBC with 16-space IV                          │
│                     │                                            │
│                     ▼                                            │
│   7. Return decrypted cookies                                   │
│      { sid: "actual-value", uid: "actual-value", ... }         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Installation

```bash
npm install chrome-cookies-secure
```

---

## Usage Example

```typescript
import chrome from 'chrome-cookies-secure';

// Get cookies for a URL (returns cookie string format)
const cookies = await chrome.getCookies('https://medium.com');
// Returns: "sid=abc123; uid=xyz789; other=value"

// Or get as object
const cookieObj = await chrome.getCookiesPromised('https://medium.com', 'object');
// Returns: { sid: "abc123", uid: "xyz789", other: "value" }
```

---

## API Options

```typescript
chrome.getCookies(url, format, callback)
chrome.getCookiesPromised(url, format)  // Promise-based

// Formats:
// - 'header'  → "name=value; name2=value2" (default)
// - 'object'  → { name: "value", name2: "value2" }
// - 'jar'     → tough-cookie CookieJar
// - 'set-cookie' → Array of Set-Cookie header strings
```

---

## Platform Support

| Platform | Encryption | Key Storage |
|----------|------------|-------------|
| **macOS** | AES-128-CBC | Keychain ("Chrome Safe Storage") |
| **Linux** | AES-128-CBC | GNOME Keyring or hardcoded key |
| **Windows** | DPAPI | Windows Credential Manager |

The library handles all platforms automatically.

---

## Important Notes

### 1. Keychain Permission Prompt
First time running, macOS will ask:
```
"Terminal" wants to use your confidential information
stored in "Chrome Safe Storage" in your keychain.

[Deny] [Always Allow] [Allow]
```

Click **"Always Allow"** for seamless operation.

### 2. Cookie Database Sync Delay
Chrome only writes cookies to the SQLite database every ~30 seconds. So there may be a slight delay between:
- Cookies in your browser
- Cookies available to this library

### 3. Chrome Must Be Installed
The library reads from Chrome's data directory. If Chrome isn't installed or uses a non-standard location, it won't work.

### 4. Profile Selection
By default, reads from the "Default" profile. Can specify other profiles:
```typescript
chrome.getCookies(url, 'header', callback, 'Profile 1');
```

---

## Integration Plan

```typescript
// New function to add to index.ts

import chrome from 'chrome-cookies-secure';

/**
 * Get Medium cookies directly from Chrome's database
 * No browser restart or DevTools needed!
 */
async function getChromeMediumCookies(): Promise<{ sid?: string; uid?: string } | null> {
  try {
    const cookies = await chrome.getCookiesPromised(
      'https://medium.com',
      'object'
    );

    if (cookies.sid && cookies.uid) {
      return { sid: cookies.sid, uid: cookies.uid };
    }

    return null;
  } catch (error) {
    console.error('Failed to read Chrome cookies:', error);
    return null;
  }
}

/**
 * Updated fetch flow:
 * 1. Try .env cookies first (if configured)
 * 2. Try Chrome cookies (auto-read from database)
 * 3. Fall back to unauthenticated fetch
 */
async function fetchWithAutoRefresh(url: string, timeout: number) {
  // Try .env cookies
  if (hasMediumCookies()) {
    const result = await fetchMediumArticle(url, timeout);
    if (result.success) return result;
  }

  // Try Chrome cookies
  const chromeCookies = await getChromeMediumCookies();
  if (chromeCookies) {
    // Temporarily set cookies and fetch
    process.env.MEDIUM_SID = chromeCookies.sid;
    process.env.MEDIUM_UID = chromeCookies.uid;
    const result = await fetchMediumArticle(url, timeout);
    if (result.success) return result;
  }

  // Fall back to unauthenticated
  return fetchMediumArticle(url, timeout);
}
```

---

## Advantages Over Other Approaches

| Feature | chrome-cookies-secure | CDP Debug Port | Manual .env |
|---------|----------------------|----------------|-------------|
| No browser restart | ✅ | ❌ | ✅ |
| No manual copying | ✅ | ✅ | ❌ |
| Works with running Chrome | ✅ | ❌ | ✅ |
| Auto-refresh on expiry | ✅ | ✅ | ❌ |
| User-friendly | ✅ | ❌ | ❌ |
| One-time setup | ✅ (keychain prompt) | ❌ | ❌ |

---

## Security Considerations

1. **Keychain Access**: The library needs keychain permission to decrypt cookies. This is a one-time prompt.

2. **Cookie Privacy**: Cookies are sensitive data. This library only reads them locally - nothing is sent externally.

3. **Process Memory**: Decrypted cookies exist in memory during script execution. Standard Node.js security practices apply.

---

## Potential Issues

### Issue 1: TypeScript Types
The package may not have TypeScript definitions. Solution:
```typescript
// Create types/chrome-cookies-secure.d.ts
declare module 'chrome-cookies-secure' {
  export function getCookies(
    url: string,
    format?: 'header' | 'object' | 'jar' | 'set-cookie',
    callback?: (err: Error | null, cookies: any) => void,
    profile?: string
  ): void;

  export function getCookiesPromised(
    url: string,
    format?: 'header' | 'object' | 'jar' | 'set-cookie',
    profile?: string
  ): Promise<any>;
}
```

### Issue 2: Keychain Prompt Not Appearing
If running in a context without UI (like an MCP server), the keychain prompt might not appear. Solution: Run once manually from terminal first to grant permission.

---

## Next Steps

1. Install the package: `npm install chrome-cookies-secure`
2. Add TypeScript types if needed
3. Implement `getChromeMediumCookies()` function
4. Update `fetchWithAutoRefresh()` to use Chrome cookies
5. Remove Puppeteer dependency (no longer needed)
6. Test with a real Medium article

---

## Sources

- [chrome-cookies-secure on NPM](https://www.npmjs.com/package/chrome-cookies-secure)
- [GitHub Repository](https://github.com/bertrandom/chrome-cookies-secure)
- [Chrome Cookie Encryption Format](https://gist.github.com/creachadair/937179894a24571ce9860e2475a2d2ec)
- [Decrypting Chrome Cookies](https://krptyk.com/2023/10/28/decrypting-chrome-cookies/)

---

**Status**: 📝 Documentation complete, ready for implementation
