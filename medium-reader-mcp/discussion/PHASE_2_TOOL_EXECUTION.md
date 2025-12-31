# Phase 2: Tool Execution Deep Dive

> **Goal**: Understand how MCP tools work - input schemas, validation, execution, and response handling

---

## Table of Contents

1. [What is Tool Execution?](#1-what-is-tool-execution)
2. [The Tool Lifecycle](#2-the-tool-lifecycle)
3. [Input Schemas with Zod](#3-input-schemas-with-zod)
4. [Response Structure](#4-response-structure)
5. [Error Handling](#5-error-handling)
6. [Our Current Implementation](#6-our-current-implementation)
7. [Exercise: Add a New Tool](#7-exercise-add-a-new-tool)

---

## 1. What is Tool Execution?

In MCP, **tools** are functions that the AI can call. Think of them as:

```
┌─────────────────────────────────────────────────────────────────┐
│                     TOOL = FUNCTION FOR AI                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Like a function in programming:                                │
│                                                                  │
│   function ping(message?: string): string {                      │
│     return message ? `pong: ${message}` : "pong";               │
│   }                                                              │
│                                                                  │
│   But exposed to AI via MCP:                                     │
│   - AI sees: name, description, input schema                     │
│   - AI sends: tool name + arguments                              │
│   - Server runs: the function                                    │
│   - AI receives: the result                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Why Tools Matter

Tools turn the AI from a "text generator" into an "agent" that can:
- Fetch data from the internet
- Read/write files
- Query databases
- Call APIs
- Execute code
- And more...

---

## 2. The Tool Lifecycle

When Claude calls a tool, here's what happens:

```
┌──────────────────────────────────────────────────────────────────┐
│                     TOOL EXECUTION LIFECYCLE                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. DISCOVERY (happens once at startup)                          │
│     ┌──────────┐                      ┌──────────┐               │
│     │  Claude  │ ── tools/list ────►  │  Server  │               │
│     │          │ ◄── list of tools ── │          │               │
│     └──────────┘                      └──────────┘               │
│                                                                   │
│  2. USER REQUEST                                                  │
│     User: "Ping the server with hello"                           │
│                                                                   │
│  3. AI DECIDES TO CALL TOOL                                      │
│     Claude analyzes request, chooses tool, prepares arguments    │
│                                                                   │
│  4. TOOL CALL                                                     │
│     ┌──────────┐                      ┌──────────┐               │
│     │  Claude  │ ── tools/call ────►  │  Server  │               │
│     │          │    {                 │          │               │
│     │          │      name: "ping",   │          │               │
│     │          │      args: {         │          │               │
│     │          │        message:      │          │               │
│     │          │          "hello"     │          │               │
│     │          │      }               │          │               │
│     │          │    }                 │          │               │
│     └──────────┘                      └──────────┘               │
│                                                                   │
│  5. EXECUTION                                                     │
│     Server validates input, runs handler, prepares response      │
│                                                                   │
│  6. RESPONSE                                                      │
│     ┌──────────┐                      ┌──────────┐               │
│     │  Claude  │ ◄── result ──────── │  Server  │               │
│     │          │    {                 │          │               │
│     │          │      content: [{     │          │               │
│     │          │        type: "text", │          │               │
│     │          │        text: "pong:  │          │               │
│     │          │               hello" │          │               │
│     │          │      }]              │          │               │
│     │          │    }                 │          │               │
│     └──────────┘                      └──────────┘               │
│                                                                   │
│  7. AI PROCESSES RESULT                                          │
│     Claude incorporates result into response to user             │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### JSON-RPC Messages

**tools/list request** (discovery):
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list"
}
```

**tools/list response**:
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "ping",
        "description": "A simple ping tool that returns pong",
        "inputSchema": {
          "type": "object",
          "properties": {
            "message": {
              "type": "string",
              "description": "Optional message to include"
            }
          }
        }
      }
    ]
  }
}
```

**tools/call request** (execution):
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "ping",
    "arguments": {
      "message": "hello"
    }
  }
}
```

**tools/call response**:
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "pong: hello"
      }
    ]
  }
}
```

---

## 3. Input Schemas with Zod

### What is Zod?

[Zod](https://zod.dev/) is a TypeScript-first schema validation library. The MCP SDK uses it to:

1. **Define** what inputs a tool accepts
2. **Validate** inputs at runtime
3. **Generate** JSON Schema for tool discovery

### Basic Zod Types

```typescript
import { z } from "zod";

// String
z.string()                          // any string
z.string().min(1)                   // non-empty string
z.string().url()                    // valid URL
z.string().email()                  // valid email

// Number
z.number()                          // any number
z.number().int()                    // integer only
z.number().min(0)                   // >= 0
z.number().max(100)                 // <= 100

// Boolean
z.boolean()

// Arrays
z.array(z.string())                 // array of strings
z.array(z.number()).min(1)          // non-empty number array

// Objects
z.object({
  name: z.string(),
  age: z.number()
})

// Optional
z.string().optional()               // string | undefined

// Default values
z.string().default("hello")         // defaults to "hello" if not provided

// Unions
z.union([z.string(), z.number()])   // string | number

// Literals
z.literal("yes")                    // only accepts "yes"
z.enum(["small", "medium", "large"]) // only these values
```

### Describing Inputs

The `.describe()` method adds documentation that Claude sees:

```typescript
z.string().describe("The URL of the Medium article to fetch")
```

This becomes part of the JSON Schema that Claude uses to understand what to pass.

### Example: Complex Input Schema

```typescript
const inputSchema = {
  url: z.string().url().describe("The URL to fetch"),
  format: z.enum(["html", "markdown", "text"])
    .default("markdown")
    .describe("Output format"),
  includeImages: z.boolean()
    .default(true)
    .describe("Whether to include image references"),
  maxLength: z.number()
    .int()
    .min(100)
    .max(100000)
    .optional()
    .describe("Maximum characters to return")
};
```

---

## 4. Response Structure

### Content Types

MCP tool responses must return a `content` array with typed items:

```typescript
// Text response (most common)
{
  content: [
    { type: "text", text: "The result text here" }
  ]
}

// Image response
{
  content: [
    {
      type: "image",
      data: "base64encodeddata...",
      mimeType: "image/png"
    }
  ]
}

// Multiple content items
{
  content: [
    { type: "text", text: "Here's the article:" },
    { type: "text", text: "# Title\n\nContent..." }
  ]
}
```

### The `isError` Flag

You can mark a response as an error:

```typescript
{
  content: [
    { type: "text", text: "Failed to fetch URL: Connection timeout" }
  ],
  isError: true
}
```

This tells Claude that the tool failed, and it should inform the user.

---

## 5. Error Handling

### Types of Errors

```
┌─────────────────────────────────────────────────────────────────┐
│                       ERROR TYPES                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. VALIDATION ERRORS (bad input)                               │
│     - Missing required parameter                                 │
│     - Wrong type (string instead of number)                     │
│     - Failed constraint (URL not valid)                         │
│     → SDK handles these automatically with Zod                  │
│                                                                  │
│  2. EXECUTION ERRORS (tool failed)                              │
│     - Network timeout                                            │
│     - File not found                                             │
│     - External service down                                      │
│     → You handle these in your handler                          │
│                                                                  │
│  3. UNEXPECTED ERRORS (bugs)                                    │
│     - Null pointer                                               │
│     - Unhandled exception                                        │
│     → Wrap handlers in try/catch                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Best Practices for Error Handling

```typescript
server.registerTool(
  "fetch_url",
  {
    title: "Fetch URL",
    description: "Fetches content from a URL",
    inputSchema: {
      url: z.string().url().describe("The URL to fetch"),
    },
  },
  async ({ url }: { url: string }) => {
    try {
      const response = await fetch(url);

      // Check HTTP status
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
      // Network errors, timeouts, etc.
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [{
          type: "text" as const,
          text: `Failed to fetch URL: ${message}`
        }],
        isError: true,
      };
    }
  }
);
```

---

## 6. Our Current Implementation

Let's look at what we built in Phase 1:

```typescript
// src/index.ts

server.registerTool(
  "ping",                           // Tool name
  {
    title: "Ping Tool",             // Human-readable title
    description: "A simple ping tool that returns pong. Use this to test if the server is working.",
    inputSchema: {
      message: z.string()
        .optional()
        .describe("Optional message to include in response"),
    },
  },
  async ({ message }: { message?: string }) => {
    // Handler function - runs when tool is called
    const response = message ? `pong: ${message}` : "pong";

    return {
      content: [{ type: "text" as const, text: response }],
    };
  }
);
```

### Breaking It Down

| Part | Purpose |
|------|---------|
| `"ping"` | Name Claude uses to call the tool |
| `title` | Human-readable name shown in tool list |
| `description` | Helps Claude decide when to use this tool |
| `inputSchema` | Defines what arguments the tool accepts |
| `message: z.string().optional()` | One optional string parameter |
| Handler function | The actual logic that runs |
| Return value | Content array with text result |

---

## 7. Exercise: Add a New Tool

Let's add an `echo` tool that demonstrates more Zod features.

### Specification

| Property | Value |
|----------|-------|
| Name | `echo` |
| Description | Echoes back the input with optional transformations |
| Input: `text` | Required string to echo |
| Input: `uppercase` | Optional boolean, default false |
| Input: `repeat` | Optional number (1-10), default 1 |

### Expected Behavior

```
echo({ text: "hello" })
→ "hello"

echo({ text: "hello", uppercase: true })
→ "HELLO"

echo({ text: "hi", repeat: 3 })
→ "hi\nhi\nhi"

echo({ text: "yo", uppercase: true, repeat: 2 })
→ "YO\nYO"
```

### Implementation

Add this to `src/index.ts`:

```typescript
server.registerTool(
  "echo",
  {
    title: "Echo Tool",
    description: "Echoes back text with optional transformations. Use for testing input handling.",
    inputSchema: {
      text: z.string().min(1).describe("The text to echo back"),
      uppercase: z.boolean().default(false).describe("Convert to uppercase"),
      repeat: z.number().int().min(1).max(10).default(1).describe("How many times to repeat"),
    },
  },
  async ({ text, uppercase, repeat }: { text: string; uppercase: boolean; repeat: number }) => {
    let result = text;

    if (uppercase) {
      result = result.toUpperCase();
    }

    const lines = Array(repeat).fill(result).join("\n");

    return {
      content: [{ type: "text" as const, text: lines }],
    };
  }
);
```

### Test It

1. Build: `npm run build`
2. Run inspector: `npx @modelcontextprotocol/inspector node dist/index.js`
3. Try different inputs in the inspector UI

---

## Key Takeaways

1. **Tools are functions** exposed to the AI via MCP
2. **Zod schemas** define and validate inputs
3. **Descriptions matter** - they help Claude use tools correctly
4. **Always handle errors** - return `isError: true` on failure
5. **Content is an array** - you can return multiple items
6. **The SDK handles JSON-RPC** - you just write the handler logic

---

## What's Next?

In **Phase 3**, we'll connect our server to Claude Code and test our tools in a real AI conversation.

---

**Status**: ✅ Complete (documentation)

**Back to**: [Learning Plan](./LEARNING_PLAN.md) | [Phase 1](./PHASE_1_HELLO_WORLD.md)
