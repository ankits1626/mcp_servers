# Medium Reader MCP

An MCP (Model Context Protocol) server for reading Medium articles with full paywall bypass support.

> **Note**: This project is being built as a learning exercise to understand MCP and related technologies.

---

## Features

- **Read Medium Articles** - Fetch and convert articles to clean Markdown
- **Paywall Bypass** - Uses your Chrome cookies for premium content access
- **GraphQL + HTML Fallback** - Primary GraphQL extraction with HTML backup
- **Retry with Exponential Backoff** - Automatic retry on transient failures
- **Rate Limiting** - Built-in protection (10 req/min per domain)
- **URL Normalization** - Handles various Medium URL formats

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        MCP Client (Claude)                      │
└─────────────────────────────────┬───────────────────────────────┘
                                  │ JSON-RPC over stdio
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                         MCP Server                              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                       index.ts                              ││
│  │              (Server setup & tool registration)             ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────┬───────────────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        ▼                         ▼                         ▼
┌───────────────┐       ┌─────────────────┐       ┌───────────────┐
│    Tools      │       │    Services     │       │   Extractors  │
├───────────────┤       ├─────────────────┤       ├───────────────┤
│ read-medium   │──────▶│ http.service    │──────▶│ graphql       │
│ ping          │       │ cookie.service  │       │ html          │
│ echo          │       │ retry.service   │       └───────────────┘
│ fetch_url     │       │ rate-limiter    │
└───────────────┘       └─────────────────┘
        │                       │
        ▼                       ▼
┌───────────────┐       ┌─────────────────┐
│    Utils      │       │     Types       │
├───────────────┤       ├─────────────────┤
│ url.utils     │       │ article.types   │
│ markdown.utils│       │ medium.types    │
│ error-messages│       │ retry.types     │
└───────────────┘       │ rate-limit.types│
                        └─────────────────┘
```

### Data Flow

```
User Request (URL)
       │
       ▼
┌──────────────┐     ┌──────────────┐
│ Rate Limiter │────▶│ URL Validate │
└──────────────┘     └──────────────┘
       │                    │
       ▼                    ▼
┌──────────────┐     ┌──────────────┐
│ Cookie Chain │     │ Post ID      │
│ ENV→Chrome   │     │ Extraction   │
└──────────────┘     └──────────────┘
       │                    │
       └────────┬───────────┘
                ▼
       ┌────────────────┐
       │ GraphQL Fetch  │◀──┐
       │ (with retry)   │   │ Retry on 5xx
       └────────────────┘───┘
                │
         success│fail
        ┌───────┴───────┐
        ▼               ▼
   ┌─────────┐   ┌─────────────┐
   │ Return  │   │ HTML Fetch  │◀──┐
   │ Content │   │ (fallback)  │   │ Retry
   └─────────┘   └─────────────┘───┘
                        │
                        ▼
                 ┌─────────────┐
                 │   Return    │
                 │   Content   │
                 └─────────────┘
```

---

## Prerequisites

- **Node.js 20+** (we test on 20, 22, and 24)
- **npm** (comes with Node.js)

---

## Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd medium-reader-mcp

# Install dependencies
npm install

# Build
npm run build
```

---

## Usage with Claude Code

Add to your Claude Code MCP configuration:

```json
{
  "mcpServers": {
    "medium-reader": {
      "command": "node",
      "args": ["/path/to/medium-reader-mcp/dist/index.js"]
    }
  }
}
```

### Reading Premium Articles

For premium (paywalled) content, the server automatically uses cookies from your Chrome browser. Just:

1. Log in to Medium in Chrome
2. The server will use your session cookies automatically

Or set `MEDIUM_COOKIE` environment variable:

```json
{
  "mcpServers": {
    "medium-reader": {
      "command": "node",
      "args": ["/path/to/medium-reader-mcp/dist/index.js"],
      "env": {
        "MEDIUM_COOKIE": "sid=your-session-id; uid=your-user-id"
      }
    }
  }
}
```

---

## Development

### Build

Compile TypeScript to JavaScript:

```bash
npm run build
```

This compiles `src/**/*.ts` → `dist/**/*.js`

### Run

```bash
npm start
```

Or build and run in one command:

```bash
npm run dev
```

### Linting & Formatting

We use [Biome](https://biomejs.dev/) for linting and formatting.

```bash
# Check for issues
npm run check

# Auto-fix issues
npm run check:fix

# Format only
npm run format

# Lint only
npm run lint
```

### Type Checking

```bash
npm run typecheck
```

### Full CI Check

Runs linting, formatting, and type checking:

```bash
npm run ci
```

---

## Testing with MCP Inspector

The [MCP Inspector](https://github.com/modelcontextprotocol/inspector) is a visual debugging tool for MCP servers.

### Run the Inspector

```bash
# Build first
npm run build

# Start with Inspector
npx @modelcontextprotocol/inspector node dist/index.js
```

This will:

1. Start your MCP server
2. Open a web UI at **http://localhost:6274**
3. Let you interactively test the tools

---

## Available Tools

| Tool | Description |
|------|-------------|
| `read_medium_article` | Fetch a Medium article and return as Markdown. Supports premium content with auth. |
| `ping` | Simple ping tool that returns "pong". Use to test server connectivity. |
| `echo` | Echo back text with optional transformations. |
| `fetch_url` | Fetch raw content from any URL. |

### Example: read_medium_article

```json
{
  "name": "read_medium_article",
  "arguments": {
    "url": "https://medium.com/@user/article-title-abc123"
  }
}
```

**Supported URL formats:**

- `https://medium.com/@user/article-abc123`
- `https://medium.com/publication/article-abc123`
- `https://user.medium.com/article-abc123`
- `https://link.medium.com/abc123` (short links)

---

## Project Structure

```
medium-reader-mcp/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── config/               # Configuration constants
│   │   ├── constants.ts
│   │   └── index.ts
│   ├── types/                # TypeScript type definitions
│   │   ├── article.types.ts
│   │   ├── medium.types.ts
│   │   ├── retry.types.ts
│   │   ├── rate-limit.types.ts
│   │   └── index.ts
│   ├── utils/                # Utility functions
│   │   ├── url.utils.ts
│   │   ├── markdown.utils.ts
│   │   ├── error-messages.utils.ts
│   │   └── index.ts
│   ├── services/             # Core services
│   │   ├── http.service.ts
│   │   ├── cookie.service.ts
│   │   ├── retry.service.ts
│   │   ├── rate-limiter.service.ts
│   │   └── index.ts
│   ├── extractors/           # Content extractors
│   │   ├── graphql.extractor.ts
│   │   ├── html.extractor.ts
│   │   └── index.ts
│   └── tools/                # MCP tool handlers
│       ├── read-medium.tool.ts
│       └── index.ts
├── dist/                     # Compiled JavaScript (generated)
├── discussion/               # Learning documentation
├── package.json
├── tsconfig.json
├── biome.json
└── README.md
```

---

## Error Handling

The server provides user-friendly error messages with actionable suggestions:

| Error | Message |
|-------|---------|
| Premium content | "This article requires Medium membership. Log in to Chrome to access." |
| Session expired | "Your Medium session has expired. Please log in again." |
| Rate limited | "Too many requests. Please wait X seconds before trying again." |
| Invalid URL | "Not a valid Medium URL. Supported formats: medium.com/@user/..." |
| Network error | "Network error occurred. The request will be retried automatically." |

---

## Rate Limiting

Built-in rate limiting protects against excessive requests:

- **Default**: 10 requests per minute per domain
- **Sliding window** algorithm
- Automatic reset after window expires

---

## Retry Logic

Automatic retry with exponential backoff for transient failures:

- **Max retries**: 3 (HTTP), 2 (GraphQL)
- **Initial delay**: 1 second
- **Backoff multiplier**: 2x
- **Jitter**: Enabled (prevents thundering herd)

**Retried errors**: 5xx server errors, network errors, timeouts

---

## Scripts Reference

| Script | Command | Description |
|--------|---------|-------------|
| `build` | `tsc` | Compile TypeScript |
| `start` | `node dist/index.js` | Run the server |
| `dev` | `tsc && node dist/index.js` | Build and run |
| `check` | `biome check src/` | Check linting + formatting |
| `check:fix` | `biome check --write src/` | Auto-fix issues |
| `lint` | `biome lint src/` | Lint only |
| `format` | `biome format --write src/` | Format only |
| `typecheck` | `tsc --noEmit` | Type check without emitting |
| `ci` | `npm run check && npm run build` | Full CI check |

---

## Configuration

### TypeScript (`tsconfig.json`)

- **Target**: ES2023 (for Node.js 20+)
- **Module**: NodeNext (ES Modules)
- **Strict**: Enabled for maximum type safety

### Biome (`biome.json`)

- **No console.log**: Enforced (MCP servers use stdio for communication)
- **console.error/warn**: Allowed for debugging

---

## Learning Resources

See the `discussion/` folder for detailed documentation:

- [Learning Plan](discussion/LEARNING_PLAN.md) - Overall roadmap
- [Phase 0: MCP Fundamentals](discussion/PHASE_0_MCP_FUNDAMENTALS.md) - Theory and architecture
- [Phase 1: Hello World](discussion/PHASE_1_HELLO_WORLD.md) - Building the minimal server
- [Phase 6: Refactoring](discussion/phase_6_refactoring/) - Modular architecture
- [Phase 8: Polish](discussion/phase_8_polish/) - Error handling, retry, rate limiting
- [TypeScript Guide](discussion/DETOUR_TYPESCRIPT_GUIDE.md) - TypeScript best practices

---

## License

MIT
