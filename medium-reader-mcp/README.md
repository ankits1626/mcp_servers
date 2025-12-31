# Medium Reader MCP

An MCP (Model Context Protocol) server for reading Medium articles.

> **Note**: This project is being built as a learning exercise to understand MCP and related technologies.

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
```

---

## Development

### Build

Compile TypeScript to JavaScript:

```bash
npm run build
```

This compiles `src/*.ts` → `dist/*.js`

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

### What You'll See

- **Tools tab**: Lists all available tools (e.g., `ping`)
- **Click a tool**: Test it with different inputs
- **Messages**: View the JSON-RPC messages being exchanged

---

## Available Tools

| Tool | Description |
|------|-------------|
| `ping` | A simple ping tool that returns "pong". Use this to test if the server is working. |

---

## Project Structure

```
medium-reader-mcp/
├── src/
│   └── index.ts        # Main MCP server code
├── dist/               # Compiled JavaScript (generated)
├── discussion/         # Learning documentation
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
├── biome.json          # Linter/formatter configuration
└── README.md           # This file
```

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
| `test` | (placeholder) | Run tests |

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
- [TypeScript Guide](discussion/DETOUR_TYPESCRIPT_GUIDE.md) - TypeScript best practices
- [Node/ES Versions](discussion/DETOUR_NODE_ES_VERSIONS.md) - Why we chose Node 20+ and ES2023

---

## License

MIT
