# Phase 1: Minimal MCP Server (Hello World)

> **Goal**: Build the smallest possible working MCP server
>
> **Test**: Server responds to `initialize` and lists a `ping` tool

---

## What We're Building

A minimal MCP server that:
1. Starts up and waits for JSON-RPC messages on stdin
2. Responds to `initialize` with server info and capabilities
3. Responds to `tools/list` with one tool: `ping`
4. Responds to `tools/call` for `ping` with "pong"

```
┌─────────────┐         stdio          ┌─────────────────┐
│   Client    │ ──── JSON-RPC ────────►│  Our Server     │
│  (Claude)   │ ◄──────────────────────│  (Node.js)      │
└─────────────┘                        └─────────────────┘
                                              │
                                              ▼
                                       Tools: [ping]
```

---

## Step 1: Project Setup

### 1.1 Create Directory Structure

```bash
cd medium-reader-mcp
mkdir -p src
```

### 1.2 Initialize npm Project

```bash
npm init -y
```

### 1.3 Install Dependencies

```bash
npm install @modelcontextprotocol/sdk zod
```

| Package | Purpose |
|---------|---------|
| `@modelcontextprotocol/sdk` | Official MCP SDK - Server class, transports, types |
| `zod` | Schema validation (required peer dependency) |

### 1.4 Configure package.json

Update `package.json`:

```json
{
  "name": "medium-reader-mcp",
  "version": "1.0.0",
  "type": "module",
  "main": "src/index.js",
  "bin": {
    "medium-reader-mcp": "./src/index.js"
  },
  "scripts": {
    "start": "node src/index.js"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "zod": "^3.25.0"
  }
}
```

**Key settings**:
- `"type": "module"` - Enables ES modules (import/export syntax)
- `"bin"` - Makes our server executable by name

---

## Step 2: Understand the SDK Components

Before writing code, let's understand what we're importing:

### 2.1 McpServer Class (High-Level API)

```javascript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
```

The `McpServer` class:

- High-level API for building MCP servers (recommended)
- Manages the MCP protocol lifecycle
- Provides simple methods like `server.tool()` to register tools
- Handles JSON-RPC message parsing and routing

> **Note**: The older `Server` class from `@modelcontextprotocol/sdk/server/index.js` is deprecated. Always use `McpServer`.

### 2.2 Stdio Transport

```javascript
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
```

The `StdioServerTransport`:

- Reads JSON-RPC from `process.stdin`
- Writes JSON-RPC to `process.stdout`
- Handles message framing (newline-delimited JSON)

### 2.3 Zod for Schemas

```javascript
import { z } from "zod";
```

Zod is used to:

- Define input schemas for tools
- Validate incoming arguments
- The SDK uses Zod internally for all schema validation

---

## Step 3: The Code

### 3.1 Create src/index.js

```javascript
#!/usr/bin/env node

/**
 * Medium Reader MCP Server - Phase 1: Hello World
 *
 * A minimal MCP server with one tool: ping
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// =============================================================================
// 1. CREATE SERVER INSTANCE
// =============================================================================

const server = new McpServer({
  name: "medium-reader-mcp",    // Server name (shown to clients)
  version: "1.0.0"              // Server version
});

// =============================================================================
// 2. REGISTER TOOLS
// =============================================================================

/**
 * Register the "ping" tool
 *
 * server.tool() takes:
 *   1. Tool name (string)
 *   2. Description (string)
 *   3. Input schema (Zod schema)
 *   4. Handler function (async)
 */
server.tool(
  "ping",
  "A simple ping tool that returns pong. Use this to test if the server is working.",
  {
    message: z.string().optional().describe("Optional message to include in response")
  },
  async ({ message }) => {
    const response = message ? `pong: ${message}` : "pong";

    return {
      content: [
        {
          type: "text",
          text: response
        }
      ]
    };
  }
);

// =============================================================================
// 3. START THE SERVER
// =============================================================================

async function main() {
  // Create stdio transport (reads from stdin, writes to stdout)
  const transport = new StdioServerTransport();

  // Connect server to transport
  await server.connect(transport);

  // Log to stderr (stdout is reserved for JSON-RPC!)
  console.error("Medium Reader MCP Server running on stdio");
}

// Run and handle errors
main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
```

### 3.2 Make it Executable

```bash
chmod +x src/index.js
```

---

## Step 4: Understanding the Code

### 4.1 The Shebang Line

```javascript
#!/usr/bin/env node
```

This tells the OS to run this file with Node.js when executed directly.

### 4.2 Server Creation

```javascript
const server = new McpServer({
  name: "medium-reader-mcp",
  version: "1.0.0"
});
```

- Single config object with server metadata
- Capabilities are inferred from what you register (tools, resources, etc.)

### 4.3 Tool Registration with server.tool()

```javascript
server.tool(
  "ping",                              // 1. Tool name
  "Description of what it does",       // 2. Description
  { message: z.string().optional() },  // 3. Input schema (Zod)
  async ({ message }) => {             // 4. Handler function
    return {
      content: [{ type: "text", text: "pong" }]
    };
  }
);
```

The `server.tool()` method:

- Automatically handles both `tools/list` and `tools/call`
- Validates inputs using your Zod schema
- Routes calls to your handler function
- Much cleaner than the old `setRequestHandler` approach!

### 4.4 Zod Schema for Input

```javascript
{
  message: z.string().optional().describe("Optional message")
}
```

- Each property is a Zod type
- `.optional()` makes it not required
- `.describe()` adds documentation for the AI

### 4.5 Why console.error?

```javascript
console.error("Server running...");  // ✅ Goes to stderr
console.log("...");                   // ❌ DON'T USE - goes to stdout
```

**Critical**: stdout is reserved for JSON-RPC messages! Any logging must go to stderr.

---

## Step 5: Testing

### 5.1 Test Method 1: Manual JSON-RPC

You can send JSON-RPC messages manually to test:

```bash
# In terminal, start the server
node src/index.js
```

Then type (paste) this JSON and press Enter:

```json
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}
```

Expected response (server writes to stdout):
```json
{"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2024-11-05","capabilities":{"tools":{}},"serverInfo":{"name":"medium-reader-mcp","version":"1.0.0"}}}
```

### 5.2 Test Method 2: Echo Test Script

Create a test script `test-server.sh`:

```bash
#!/bin/bash

# Test initialize
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | node src/index.js

echo ""
echo "---"

# Test tools/list (need to send initialized notification first)
(
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}'
echo '{"jsonrpc":"2.0","method":"notifications/initialized"}'
echo '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'
) | node src/index.js
```

### 5.3 Test Method 3: Using MCP Inspector (Recommended)

The MCP team provides an inspector tool:

```bash
# Install globally
npm install -g @modelcontextprotocol/inspector

# Run against your server
mcp-inspector node src/index.js
```

This opens a web UI where you can:
- See server capabilities
- Browse available tools
- Call tools interactively
- View JSON-RPC messages

---

## Step 6: What's Happening Under the Hood

### 6.1 The Complete Message Flow

```
CLIENT                                         SERVER
   │                                              │
   │  {"jsonrpc":"2.0","id":1,                   │
   │   "method":"initialize",                    │
   │   "params":{...}}                           │
   │────────────────────────────────────────────►│
   │                                              │
   │  {"jsonrpc":"2.0","id":1,                   │
   │   "result":{                                │
   │     "protocolVersion":"...",                │
   │     "capabilities":{"tools":{}},            │
   │     "serverInfo":{...}                      │
   │   }}                                        │
   │◄────────────────────────────────────────────│
   │                                              │
   │  {"jsonrpc":"2.0",                          │
   │   "method":"notifications/initialized"}     │
   │────────────────────────────────────────────►│
   │                                              │
   │         === CONNECTION READY ===             │
   │                                              │
   │  {"jsonrpc":"2.0","id":2,                   │
   │   "method":"tools/list"}                    │
   │────────────────────────────────────────────►│
   │                                              │
   │  {"jsonrpc":"2.0","id":2,                   │
   │   "result":{"tools":[{"name":"ping",...}]}} │
   │◄────────────────────────────────────────────│
   │                                              │
   │  {"jsonrpc":"2.0","id":3,                   │
   │   "method":"tools/call",                    │
   │   "params":{"name":"ping",                  │
   │             "arguments":{}}}                │
   │────────────────────────────────────────────►│
   │                                              │
   │  {"jsonrpc":"2.0","id":3,                   │
   │   "result":{"content":[                     │
   │     {"type":"text","text":"pong"}           │
   │   ]}}                                       │
   │◄────────────────────────────────────────────│
```

### 6.2 What the SDK Handles For You

| Task | SDK Handles It |
|------|----------------|
| Parsing JSON-RPC messages | ✅ |
| Validating message format | ✅ |
| Routing to correct handler | ✅ |
| Protocol version negotiation | ✅ |
| Capability exchange | ✅ |
| Error formatting | ✅ |
| Message framing | ✅ |

You only need to:
1. Define your tools
2. Implement tool logic
3. Return results

---

## Step 7: File Structure After Phase 1

```
medium-reader-mcp/
├── package.json
├── package-lock.json
├── node_modules/
├── src/
│   └── index.js          # Our MCP server
├── discussion/
│   ├── LEARNING_PLAN.md
│   ├── PHASE_0_MCP_FUNDAMENTALS.md
│   └── PHASE_1_HELLO_WORLD.md   # This file
└── IMPLEMENTATION_PLAN.md
```

---

## Step 8: Success Criteria

Before moving to Phase 2, verify:

- [ ] `npm install` completes without errors
- [ ] Server starts without crashing: `node src/index.js`
- [ ] Server responds to initialize request
- [ ] `tools/list` returns the ping tool
- [ ] `tools/call` for ping returns "pong"
- [ ] MCP Inspector can connect and show the tool (optional)

---

## Common Issues

### Issue: "Cannot find module"

```
Error: Cannot find module '@modelcontextprotocol/sdk/server/mcp.js'
```

**Fix**: Make sure `package.json` has `"type": "module"` and run `npm install`

### Issue: Server outputs garbled text

**Cause**: Using `console.log()` instead of `console.error()`

**Fix**: Only use `console.error()` for logging

### Issue: "'Server' is deprecated"

**Cause**: Using the old `Server` class instead of `McpServer`

**Fix**: Import from the correct path:

```javascript
// ❌ Old (deprecated)
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

// ✅ New (recommended)
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
```

---

## Key Learnings

1. **McpServer is the high-level API** - Use `McpServer`, not the deprecated `Server` class
2. **server.tool()** - Simple method to register tools with name, description, schema, handler
3. **Zod for schemas** - Input validation uses Zod, not raw JSON Schema
4. **Content format** - Results are arrays of content blocks with type and text
5. **stderr for logs** - Never pollute stdout with non-JSON-RPC data

---

## What's Next?

**Phase 2**: Make the `ping` tool accept arguments and return dynamic responses. Add input validation.

---

## References

- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
- [Building MCP Servers Guide](https://dev.to/shadid12/how-to-build-mcp-servers-with-typescript-sdk-1c28)
- [MCP SDK on npm](https://www.npmjs.com/package/@modelcontextprotocol/sdk)

---

**Status**: 📝 Ready to implement

**Previous**: [Phase 0 - MCP Fundamentals](./PHASE_0_MCP_FUNDAMENTALS.md)

**Next**: [Phase 2 - Tool Execution](./PHASE_2_TOOL_EXECUTION.md)
