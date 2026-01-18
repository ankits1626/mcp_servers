# Phase 6.3: Code Refactoring - SOLID Principles & MCP Best Practices

> **Goal**: Refactor the bloated `index.ts` (~677 lines) into a modular, maintainable architecture following SOLID principles and 2025/2026 MCP best practices.

---

## The Problem

Our current `index.ts` violates multiple SOLID principles:

```
┌─────────────────────────────────────────────────────────────────┐
│                    CURRENT STATE: index.ts (677 lines)          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ❌ VIOLATIONS:                                                 │
│                                                                  │
│   1. Single Responsibility Principle (SRP)                      │
│      - Server setup                                              │
│      - Tool definitions (ping, echo, fetch_url, read_medium)    │
│      - Cookie management                                         │
│      - HTTP fetching                                             │
│      - GraphQL API calls                                         │
│      - HTML content extraction                                   │
│      - Markdown conversion                                       │
│      - URL validation                                            │
│                                                                  │
│   2. Open/Closed Principle (OCP)                                │
│      - Adding new tools requires modifying index.ts             │
│      - No plugin/extension mechanism                            │
│                                                                  │
│   3. Dependency Inversion Principle (DIP)                       │
│      - High-level tool logic depends on low-level fetch details │
│      - No abstraction layer between components                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Research Summary (2025/2026 Best Practices)

### MCP Server Best Practices

Based on research from [MCP Best Practices Guide](https://modelcontextprotocol.info/docs/best-practices/), [MarkTechPost](https://www.marktechpost.com/2025/07/23/7-mcp-server-best-practices-for-scalable-ai-integrations-in-2025/), and the [mcp-ts-template](https://github.com/cyanheads/mcp-ts-template):

| Principle | Description |
|-----------|-------------|
| **Single Responsibility** | Each MCP server should have one clear, well-defined purpose |
| **Tool Design** | Group related tasks; avoid mapping every function to a tool |
| **Schema Definitions** | Use Zod for clear input/output validation |
| **Separation of Concerns** | Protocol handling, transport, capabilities, and schemas as separate modules |
| **Logging** | Enable detailed logging during development |
| **Documentation** | Clear API references and tool descriptions |

### TypeScript SOLID Principles (2025)

Based on [Strapi's SOLID Guide](https://strapi.io/blog/solid-design-principles-javascript-typescript-guide), [LogRocket](https://blog.logrocket.com/applying-solid-principles-typescript/), and [Effective TypeScript 2025](https://www.dennisokeeffe.com/blog/2025-03-16-effective-typescript-principles-in-2025):

| Principle | Application |
|-----------|-------------|
| **SRP** | One class/module = one reason to change |
| **OCP** | Extend via new modules, don't modify existing |
| **LSP** | Substitutable implementations via interfaces |
| **ISP** | Small, focused interfaces over large ones |
| **DIP** | Depend on abstractions (interfaces), not concretions |

### Modern Patterns (2025-2026)

- **Composition over inheritance** - Use small, composable functions
- **Functional core, imperative shell** - Pure functions at the core, I/O at the edges
- **Parse, don't validate** - Use Zod to parse inputs into validated types
- **Shallow service layers** - Services shouldn't compose other services deeply

---

## Proposed Architecture

### Directory Structure

Based on the [mcp-ts-template](https://github.com/cyanheads/mcp-ts-template) and [official TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk):

```
src/
├── index.ts                    # Entry point - minimal, just wires things together
├── server.ts                   # MCP server setup and configuration
│
├── tools/                      # Tool definitions (one file per tool)
│   ├── index.ts                # Exports all tools
│   ├── ping.tool.ts            # Ping tool
│   ├── echo.tool.ts            # Echo tool
│   ├── fetch-url.tool.ts       # Generic URL fetcher
│   └── read-medium.tool.ts     # Medium article reader
│
├── services/                   # Business logic (SOLID: SRP)
│   ├── index.ts                # Exports all services
│   ├── cookie.service.ts       # Chrome cookie extraction
│   ├── medium-api.service.ts   # Medium GraphQL API
│   └── http.service.ts         # HTTP fetching utilities
│
├── extractors/                 # Content extraction (SOLID: SRP)
│   ├── index.ts                # Exports all extractors
│   ├── html.extractor.ts       # HTML → Article extraction
│   └── graphql.extractor.ts    # GraphQL → Markdown conversion
│
├── utils/                      # Pure utility functions
│   ├── index.ts                # Exports all utils
│   ├── url.utils.ts            # URL validation and parsing
│   └── markdown.utils.ts       # Markdown formatting helpers
│
├── types/                      # TypeScript type definitions
│   ├── index.ts                # Exports all types
│   ├── article.types.ts        # Article-related interfaces
│   ├── medium.types.ts         # Medium API types
│   └── chrome-cookies-secure.d.ts  # External module types
│
└── config/                     # Configuration
    └── constants.ts            # Headers, timeouts, etc.
```

---

## File Breakdown

### 1. Entry Point (`index.ts`)

**Responsibility**: Wire everything together and start server

```typescript
// src/index.ts - ~15 lines
import { createServer } from "./server.js";

async function main(): Promise<void> {
  const server = createServer();
  await server.start();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
```

### 2. Server Setup (`server.ts`)

**Responsibility**: Create MCP server and register tools

```typescript
// src/server.ts - ~30 lines
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./tools/index.js";

export function createServer() {
  const server = new McpServer({
    name: "medium-reader-mcp",
    version: "1.0.0",
  });

  registerTools(server);

  return {
    async start() {
      const transport = new StdioServerTransport();
      await server.connect(transport);
      console.error("Medium Reader MCP Server running on stdio");
    }
  };
}
```

### 3. Tools Directory

Each tool in its own file with clear schema:

```typescript
// src/tools/read-medium.tool.ts - ~50 lines
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MediumApiService } from "../services/medium-api.service.js";
import { isMediumUrl, extractPostId } from "../utils/url.utils.js";

export function registerReadMediumTool(server: McpServer): void {
  const mediumService = new MediumApiService();

  server.registerTool(
    "read_medium",
    {
      title: "Read Medium Article",
      description: "Fetches and extracts content from a Medium article.",
      inputSchema: {
        url: z.string().url().describe("The Medium article URL"),
        raw: z.boolean().default(false).describe("Return raw HTML"),
      },
    },
    async ({ url, raw }) => {
      // Tool logic using injected service
      const result = await mediumService.fetchArticle(url, raw);
      return { content: [{ type: "text", text: result }] };
    }
  );
}
```

### 4. Services Directory

**SRP**: Each service handles one concern

```typescript
// src/services/cookie.service.ts - ~40 lines
import { getCookiesPromised } from "chrome-cookies-secure";

export class CookieService {
  async getMediumCookies(): Promise<string | null> {
    try {
      const cookies = await getCookiesPromised("https://medium.com", "header");
      return cookies && cookies.length > 0 ? cookies as string : null;
    } catch (error) {
      console.error("Failed to read Chrome cookies:", error);
      return null;
    }
  }
}
```

```typescript
// src/services/medium-api.service.ts - ~80 lines
import { CookieService } from "./cookie.service.js";
import { HttpService } from "./http.service.js";
import { GraphQLExtractor } from "../extractors/graphql.extractor.js";
import { HtmlExtractor } from "../extractors/html.extractor.js";

export class MediumApiService {
  private cookieService = new CookieService();
  private httpService = new HttpService();
  private graphqlExtractor = new GraphQLExtractor();
  private htmlExtractor = new HtmlExtractor();

  async fetchArticle(url: string, raw: boolean): Promise<string> {
    // Orchestrates: cookies → GraphQL → fallback to HTML
  }
}
```

### 5. Extractors Directory

**SRP**: Content transformation logic

```typescript
// src/extractors/graphql.extractor.ts - ~100 lines
import { MediumParagraph, ExtractedArticle } from "../types/medium.types.js";
import { paragraphToMarkdown } from "../utils/markdown.utils.js";

export class GraphQLExtractor {
  async fetch(postId: string, cookies: string): Promise<ExtractedArticle | null> {
    // GraphQL fetch logic
  }

  private convertToMarkdown(paragraphs: MediumParagraph[]): string {
    return paragraphs.map(paragraphToMarkdown).join("\n\n");
  }
}
```

### 6. Utils Directory

**Pure functions**, no side effects:

```typescript
// src/utils/url.utils.ts - ~30 lines
export function isMediumUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();
    return hostname === "medium.com" || hostname.endsWith(".medium.com");
  } catch {
    return false;
  }
}

export function extractPostId(url: string): string | null {
  const match = new URL(url).pathname.match(/-([a-f0-9]+)$/i);
  return match ? match[1] : null;
}
```

```typescript
// src/utils/markdown.utils.ts - ~50 lines
import { MediumParagraph } from "../types/medium.types.js";

export function paragraphToMarkdown(p: MediumParagraph): string {
  let text = applyMarkups(p.text, p.markups);
  return formatByType(text, p.type);
}

function applyMarkups(text: string, markups?: Markup[]): string { ... }
function formatByType(text: string, type: string): string { ... }
```

### 7. Types Directory

**ISP**: Small, focused interfaces

```typescript
// src/types/article.types.ts
export interface ExtractedArticle {
  title: string;
  author: string | null;
  date: string | null;
  content: string;
  wordCount: number;
}

// src/types/medium.types.ts
export interface MediumParagraph {
  text: string;
  type: string;
  markups?: Markup[];
}

export interface Markup {
  type: string;
  start: number;
  end: number;
  href?: string;
}

export interface GraphQLResponse {
  data?: {
    post?: MediumPost;
  };
  errors?: Array<{ message: string }>;
}
```

### 8. Config Directory

**Constants and configuration**:

```typescript
// src/config/constants.ts
export const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...",
  "Accept": "text/html,application/xhtml+xml...",
  // ...
};

export const TIMEOUTS = {
  DEFAULT: 15000,
  GRAPHQL: 10000,
};

export const MEDIUM_GRAPHQL_URL = "https://medium.com/_/graphql";
```

---

## Before vs After Comparison

| Metric | Before | After |
|--------|--------|-------|
| Files | 1 | ~15 |
| `index.ts` lines | 677 | ~15 |
| Largest file | 677 lines | ~100 lines |
| Testability | Hard (everything coupled) | Easy (isolated units) |
| Adding new tool | Modify index.ts | Add new `.tool.ts` file |
| Reusability | None | Services can be reused |

---

## SOLID Compliance

### ✅ Single Responsibility Principle

| Module | Single Responsibility |
|--------|----------------------|
| `index.ts` | Entry point only |
| `server.ts` | Server setup only |
| `*.tool.ts` | Tool definition only |
| `cookie.service.ts` | Cookie extraction only |
| `medium-api.service.ts` | Medium API orchestration |
| `graphql.extractor.ts` | GraphQL → Markdown |
| `html.extractor.ts` | HTML → Article |
| `url.utils.ts` | URL validation |

### ✅ Open/Closed Principle

- **Adding new tools**: Create new `*.tool.ts` file, register in `tools/index.ts`
- **No modification** of existing files required

### ✅ Liskov Substitution Principle

- Services implement interfaces
- Extractors are interchangeable (GraphQL or HTML)

### ✅ Interface Segregation Principle

- Small, focused interfaces (`ExtractedArticle`, `MediumParagraph`)
- No "god interfaces" with unused methods

### ✅ Dependency Inversion Principle

- Tools depend on service abstractions, not implementations
- Services can be swapped (e.g., mock for testing)

---

## Implementation Steps

1. **Create directory structure**
   ```bash
   mkdir -p src/{tools,services,extractors,utils,types,config}
   ```

2. **Extract types first** (no dependencies)
   - `types/article.types.ts`
   - `types/medium.types.ts`

3. **Extract config/constants**
   - `config/constants.ts`

4. **Extract pure utils** (only depend on types)
   - `utils/url.utils.ts`
   - `utils/markdown.utils.ts`

5. **Extract services** (depend on utils, types, config)
   - `services/cookie.service.ts`
   - `services/http.service.ts`
   - `services/medium-api.service.ts`

6. **Extract extractors** (depend on types, utils)
   - `extractors/html.extractor.ts`
   - `extractors/graphql.extractor.ts`

7. **Extract tools** (depend on services)
   - `tools/ping.tool.ts`
   - `tools/echo.tool.ts`
   - `tools/fetch-url.tool.ts`
   - `tools/read-medium.tool.ts`

8. **Create server.ts** (depends on tools)

9. **Slim down index.ts** (just entry point)

10. **Update imports and test**

---

## Testing Strategy

With modular code, we can now unit test:

```typescript
// tests/utils/url.utils.test.ts
import { isMediumUrl, extractPostId } from "../../src/utils/url.utils";

describe("URL Utils", () => {
  test("isMediumUrl recognizes medium.com", () => {
    expect(isMediumUrl("https://medium.com/article")).toBe(true);
  });

  test("extractPostId gets ID from URL", () => {
    expect(extractPostId("https://medium.com/title-abc123")).toBe("abc123");
  });
});
```

---

## Sources

- [MCP Best Practices Guide](https://modelcontextprotocol.info/docs/best-practices/)
- [7 MCP Server Best Practices for 2025 - MarkTechPost](https://www.marktechpost.com/2025/07/23/7-mcp-server-best-practices-for-scalable-ai-integrations-in-2025/)
- [mcp-ts-template - Production-grade TypeScript template](https://github.com/cyanheads/mcp-ts-template)
- [Official MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [SOLID Principles Guide - Strapi](https://strapi.io/blog/solid-design-principles-javascript-typescript-guide)
- [Applying SOLID Principles to TypeScript - LogRocket](https://blog.logrocket.com/applying-solid-principles-typescript/)
- [Effective TypeScript Principles in 2025](https://www.dennisokeeffe.com/blog/2025-03-16-effective-typescript-principles-in-2025)
- [TypeScript Best Practices 2025 - Bacancy](https://www.bacancytechnology.com/blog/typescript-best-practices)

---

**Status**: 📝 Plan documented, ready for implementation

**Next Step**: Implement refactoring following the steps above
