# Medium Reader MCP Server - Implementation Plan

## Overview

Build an MCP server that allows Claude Code to read Medium articles (bypassing the 403 Forbidden error).

## Problem Statement

Claude Code's WebFetch tool cannot access Medium articles directly - it receives 403 Forbidden errors. We need an MCP server that can fetch Medium content using alternative methods.

---

## Architecture

```
┌─────────────┐     JSON-RPC      ┌─────────────────┐     HTTP      ┌─────────────┐
│ Claude Code │ ◄───(stdio)─────► │ Medium Reader   │ ◄───────────► │  Freedium   │
│   (Host)    │                   │   MCP Server    │               │   Proxy     │
└─────────────┘                   └─────────────────┘               └─────────────┘
                                          │
                                          │ (fallback)
                                          ▼
                                  ┌─────────────────┐
                                  │ Direct fetch    │
                                  │ with headers    │
                                  └─────────────────┘
```

---

## Tech Stack

| Component | Technology | Why |
|-----------|------------|-----|
| Runtime | Node.js (v18+) | MCP SDK is JS/TS native |
| MCP SDK | `@modelcontextprotocol/sdk` | Official SDK |
| HTTP Client | `node-fetch` or native `fetch` | Simple HTTP requests |
| HTML Parser | `cheerio` | Extract article content from HTML |
| HTML to Markdown | `turndown` | Convert to clean markdown |

---

## Tools to Implement

### 1. `read_medium_article`

**Purpose**: Fetch and return a Medium article's content

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "url": {
      "type": "string",
      "description": "Medium article URL"
    },
    "format": {
      "type": "string",
      "enum": ["markdown", "text", "html"],
      "default": "markdown",
      "description": "Output format"
    }
  },
  "required": ["url"]
}
```

**Output**: Article content with title, author, and body

---

## Implementation Steps

### Step 1: Project Setup

```bash
mkdir medium-reader-mcp
cd medium-reader-mcp
npm init -y
```

**package.json**:
```json
{
  "name": "medium-reader-mcp",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "medium-reader-mcp": "./src/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "cheerio": "^1.0.0",
    "turndown": "^7.2.0"
  }
}
```

### Step 2: Create MCP Server Skeleton

**File**: `src/index.js`

```javascript
#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server(
  { name: "medium-reader-mcp", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// TODO: Add tool handlers (Step 4)

const transport = new StdioServerTransport();
await server.connect(transport);
```

### Step 3: Implement Article Fetcher

**File**: `src/fetcher.js`

Implement these functions:

1. `fetchViaFreedium(url)` - Primary method
   - Convert Medium URL to Freedium URL: `https://freedium.cfd/MEDIUM_URL`
   - Fetch HTML from Freedium
   - Parse and extract article content

2. `fetchDirect(url)` - Fallback method
   - Fetch directly with browser-like headers
   - User-Agent, Accept, Accept-Language headers
   - May work for non-paywalled articles

3. `extractArticle(html)` - Content extraction
   - Use cheerio to parse HTML
   - Extract: title, author, publish date, content
   - Remove ads, related articles, comments

4. `convertToMarkdown(html)` - Format conversion
   - Use turndown library
   - Preserve headings, lists, code blocks, images

**Pseudo-code**:
```javascript
async function fetchMediumArticle(url, format = "markdown") {
  // Validate URL is Medium
  if (!isMediumUrl(url)) {
    throw new Error("Not a Medium URL");
  }

  let html;

  // Try Freedium first
  try {
    html = await fetchViaFreedium(url);
  } catch (e) {
    // Fallback to direct fetch
    html = await fetchDirect(url);
  }

  // Extract article content
  const article = extractArticle(html);

  // Convert to requested format
  if (format === "markdown") {
    return convertToMarkdown(article);
  } else if (format === "text") {
    return stripHtml(article);
  }
  return article;
}
```

### Step 4: Register MCP Tool Handler

**In `src/index.js`**, add:

```javascript
import { fetchMediumArticle } from "./fetcher.js";

// List available tools
server.setRequestHandler("tools/list", async () => ({
  tools: [
    {
      name: "read_medium_article",
      description: "Fetch and read a Medium article. Bypasses paywall and 403 errors.",
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "Medium article URL" },
          format: {
            type: "string",
            enum: ["markdown", "text", "html"],
            default: "markdown"
          }
        },
        required: ["url"]
      }
    }
  ]
}));

// Handle tool calls
server.setRequestHandler("tools/call", async (request) => {
  if (request.params.name === "read_medium_article") {
    const { url, format } = request.params.arguments;

    try {
      const content = await fetchMediumArticle(url, format);
      return {
        content: [{ type: "text", text: content }]
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: `Error: ${error.message}` }],
        isError: true
      };
    }
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});
```

### Step 5: Add Shebang and Make Executable

```bash
chmod +x src/index.js
```

First line of `src/index.js` must be:
```javascript
#!/usr/bin/env node
```

---

## File Structure

```
medium-reader-mcp/
├── package.json
├── README.md
├── src/
│   ├── index.js          # MCP server entry point
│   ├── fetcher.js        # Article fetching logic
│   └── utils.js          # URL validation, helpers
```

---

## Testing

### Manual Test

```bash
# Install dependencies
npm install

# Test the fetcher directly
node -e "import('./src/fetcher.js').then(m => m.fetchMediumArticle('https://medium.com/...'))"
```

### Test with Claude Code

```bash
# Add to Claude Code
claude mcp add --transport stdio medium -- node /path/to/medium-reader-mcp/src/index.js

# Restart Claude Code, then ask:
# "Read this Medium article: https://medium.com/..."
```

---

## Edge Cases to Handle

| Case | Handling |
|------|----------|
| Invalid URL | Return error "Not a valid Medium URL" |
| Freedium down | Fallback to direct fetch with headers |
| Rate limited | Add delay/retry logic |
| Very long article | Truncate with note |
| Article not found | Return 404 error message |
| Images | Convert to markdown image syntax |
| Code blocks | Preserve with proper fencing |

---

## Freedium URL Patterns

Medium URLs come in multiple formats:

```
https://medium.com/@username/article-slug-abc123
https://medium.com/publication/article-slug-abc123
https://username.medium.com/article-slug-abc123
https://towardsdatascience.com/article-slug-abc123  (Medium publication)
```

Convert to Freedium:
```
https://freedium.cfd/https://medium.com/@username/article-slug-abc123
```

---

## Installation Instructions (for README.md)

```markdown
## Installation

### From source
git clone <repo>
cd medium-reader-mcp
npm install

### Add to Claude Code
claude mcp add --transport stdio medium -- node /full/path/to/src/index.js

### Verify
claude mcp list
```

---

## Success Criteria

- [ ] Can fetch public Medium articles
- [ ] Can fetch paywalled Medium articles (via Freedium)
- [ ] Returns clean markdown output
- [ ] Handles errors gracefully
- [ ] Works with Claude Code via `claude mcp add`

---

## References

- [MCP SDK Documentation](https://modelcontextprotocol.io/docs)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Freedium](https://freedium.cfd) - Medium paywall bypass
- [Cheerio](https://cheerio.js.org/) - HTML parsing
- [Turndown](https://github.com/mixmark-io/turndown) - HTML to Markdown
