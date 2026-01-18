# Step-by-Step Guide: Creating and Testing MCP Tools

> **Goal**: Learn the complete workflow for adding a new tool to an MCP server

---

## Overview

We'll create an `echo` tool that:
- Takes a required `text` input
- Optionally transforms it (uppercase, repeat)
- Returns the result

---

## Step 1: Define the Tool Specification

Before writing code, define what the tool does:

| Property | Value |
|----------|-------|
| **Name** | `echo` |
| **Purpose** | Echo back text with optional transformations |
| **Inputs** | |
| - `text` | Required string (min 1 char) |
| - `uppercase` | Optional boolean, default `false` |
| - `repeat` | Optional integer 1-10, default `1` |
| **Output** | The transformed text |

### Example Inputs/Outputs

```
Input:  { text: "hello" }
Output: "hello"

Input:  { text: "hello", uppercase: true }
Output: "HELLO"

Input:  { text: "hi", repeat: 3 }
Output: "hi\nhi\nhi"

Input:  { text: "yo", uppercase: true, repeat: 2 }
Output: "YO\nYO"
```

---

## Step 2: Write the Tool Code

Open `src/index.ts` and add the tool registration **before** the `main()` function:

```typescript
/**
 * Echo Tool
 *
 * Demonstrates:
 * - Required vs optional parameters
 * - Default values
 * - Number constraints (min/max)
 * - String transformation
 */
server.registerTool(
  "echo",
  {
    title: "Echo Tool",
    description:
      "Echoes back text with optional transformations. Use for testing input handling.",
    inputSchema: {
      text: z.string().min(1).describe("The text to echo back"),
      uppercase: z.boolean().default(false).describe("Convert to uppercase"),
      repeat: z
        .number()
        .int()
        .min(1)
        .max(10)
        .default(1)
        .describe("How many times to repeat (1-10)"),
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

### Code Breakdown

| Part | What It Does |
|------|--------------|
| `"echo"` | Tool name - what Claude calls |
| `title` | Human-readable name |
| `description` | Helps Claude decide when to use the tool |
| `z.string().min(1)` | Required string, at least 1 character |
| `z.boolean().default(false)` | Optional boolean, defaults to false |
| `z.number().int().min(1).max(10).default(1)` | Optional integer 1-10, defaults to 1 |
| `.describe(...)` | Documentation for Claude |
| Handler function | The actual logic |
| `type: "text" as const` | TypeScript needs this for type safety |

---

## Step 3: Check for Lint Errors

Before building, check for issues:

```bash
npm run check
```

If there are formatting issues:

```bash
npm run check:fix
```

---

## Step 4: Build the Project

Compile TypeScript to JavaScript:

```bash
npm run build
```

Expected output:
```
> medium-reader-mcp@1.0.0 build
> tsc
```

No output = success. If there are type errors, they'll appear here.

---

## Step 5: Test with MCP Inspector

Start the inspector:

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

This opens a browser at `http://localhost:6274`

### In the Inspector UI:

1. **Look at the Tools tab** - You should see both `ping` and `echo`

2. **Click on `echo`** - You'll see the input form

3. **Test Case 1: Basic echo**
   ```
   text: hello
   ```
   Expected result: `hello`

4. **Test Case 2: Uppercase**
   ```
   text: hello
   uppercase: true
   ```
   Expected result: `HELLO`

5. **Test Case 3: Repeat**
   ```
   text: hi
   repeat: 3
   ```
   Expected result:
   ```
   hi
   hi
   hi
   ```

6. **Test Case 4: All options**
   ```
   text: yo
   uppercase: true
   repeat: 2
   ```
   Expected result:
   ```
   YO
   YO
   ```

7. **Test Case 5: Validation error**
   ```
   text: (leave empty)
   ```
   Expected: Error about minimum length

8. **Test Case 6: Max repeat**
   ```
   text: x
   repeat: 15
   ```
   Expected: Error about maximum value (10)

---

## Step 6: Verify JSON-RPC Messages (Optional)

In the Inspector, you can see the raw JSON-RPC messages. Here's what they look like:

### tools/list Response

```json
{
  "tools": [
    {
      "name": "ping",
      "description": "A simple ping tool..."
    },
    {
      "name": "echo",
      "description": "Echoes back text with optional transformations...",
      "inputSchema": {
        "type": "object",
        "properties": {
          "text": {
            "type": "string",
            "minLength": 1,
            "description": "The text to echo back"
          },
          "uppercase": {
            "type": "boolean",
            "default": false,
            "description": "Convert to uppercase"
          },
          "repeat": {
            "type": "integer",
            "minimum": 1,
            "maximum": 10,
            "default": 1,
            "description": "How many times to repeat (1-10)"
          }
        },
        "required": ["text"]
      }
    }
  ]
}
```

### tools/call Request

```json
{
  "method": "tools/call",
  "params": {
    "name": "echo",
    "arguments": {
      "text": "hello",
      "uppercase": true,
      "repeat": 2
    }
  }
}
```

### tools/call Response

```json
{
  "content": [
    {
      "type": "text",
      "text": "HELLO\nHELLO"
    }
  ]
}
```

---

## Step 7: Stop the Inspector

Press `Ctrl+C` in the terminal to stop the inspector.

---

## Complete Workflow Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    TOOL CREATION WORKFLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. DEFINE                                                       │
│     └── Write spec: name, inputs, outputs, examples             │
│                                                                  │
│  2. CODE                                                         │
│     └── Add server.registerTool() in src/index.ts               │
│                                                                  │
│  3. LINT                                                         │
│     └── npm run check (fix with npm run check:fix)              │
│                                                                  │
│  4. BUILD                                                        │
│     └── npm run build                                            │
│                                                                  │
│  5. TEST                                                         │
│     └── npx @modelcontextprotocol/inspector node dist/index.js  │
│                                                                  │
│  6. ITERATE                                                      │
│     └── Fix issues, rebuild, retest                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Quick Commands

```bash
# Check + Build + Test (one-liner)
npm run ci && npx @modelcontextprotocol/inspector node dist/index.js

# Or step by step:
npm run check      # Lint/format check
npm run build      # Compile TypeScript
npx @modelcontextprotocol/inspector node dist/index.js  # Test
```

---

## Common Issues

### Issue: "Property 'X' does not exist"

**Cause**: TypeScript type mismatch in handler parameters

**Fix**: Ensure handler parameter types match schema:
```typescript
// Schema has: text, uppercase, repeat
// Handler must have same names and types:
async ({ text, uppercase, repeat }: {
  text: string;
  uppercase: boolean;
  repeat: number
}) => { ... }
```

### Issue: Biome lint error about console

**Cause**: Using `console.log` (not allowed in MCP servers)

**Fix**: Use `console.error` for debugging instead

### Issue: Tool not appearing in Inspector

**Cause**: Build not run, or server crashed

**Fix**:
1. Check terminal for errors
2. Run `npm run build` again
3. Restart inspector

### Issue: "as const" TypeScript error

**Cause**: TypeScript needs literal types for content

**Fix**: Add `as const` to type literals:
```typescript
{ type: "text" as const, text: result }
```

---

## Your Turn!

Now that you've seen the workflow, try creating your own tool:

### Challenge: Create a `reverse` tool

| Property | Value |
|----------|-------|
| Name | `reverse` |
| Input: `text` | Required string |
| Output | The text reversed |

Example:
```
Input:  { text: "hello" }
Output: "olleh"
```

<details>
<summary>Solution (click to reveal)</summary>

```typescript
server.registerTool(
  "reverse",
  {
    title: "Reverse Tool",
    description: "Reverses the input text",
    inputSchema: {
      text: z.string().min(1).describe("The text to reverse"),
    },
  },
  async ({ text }: { text: string }) => {
    const reversed = text.split("").reverse().join("");
    return {
      content: [{ type: "text" as const, text: reversed }],
    };
  }
);
```

</details>

---

**Status**: ✅ Complete

**Back to**: [Phase 2](./PHASE_2_TOOL_EXECUTION.md) | [Learning Plan](./LEARNING_PLAN.md)
