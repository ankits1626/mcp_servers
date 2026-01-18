# Idea: WebFetch Hook for Medium URL Redirect

**Status**: Ready to Implement
**Priority**: High
**Added**: 2026-01-05

---

## Table of Contents

1. [Problem Statement](#problem-statement)
2. [Two Solutions Available](#two-solutions-available)
3. [Solution A: MCP Server Instructions (Soft Hint)](#solution-a-mcp-server-instructions-soft-hint)
4. [Solution B: PreToolUse Hook (Hard Block)](#solution-b-pretooluse-hook-hard-block)
5. [Background: What Are Hooks?](#background-what-are-hooks)
6. [Why Hooks Are Separate from MCP Server](#why-hooks-are-separate-from-mcp-server)
7. [Hook Implementation](#hook-implementation)
8. [Testing](#testing)
9. [Comparison: Instructions vs Hooks](#comparison-instructions-vs-hooks)
10. [References](#references)

---

## Problem Statement

When Claude Code encounters Medium URLs during web searches or user requests, it uses the **built-in WebFetch tool** to fetch the content. This fails for paywalled articles:

```
User asks about a topic
       │
       ▼
Claude does WebSearch → finds Medium article
       │
       ▼
Claude uses WebFetch → gets 403 (paywall)
       │
       ▼
Claude reports: "I couldn't access this article"
```

**The problem**: Claude Code doesn't know that a better tool exists (our MCP server) that can bypass paywalls using Chrome cookies. It just sees WebFetch fail and gives up or returns partial content.

---

## Two Solutions Available

We discovered TWO ways to solve this problem:

| Approach | Mechanism | Strength | Where Configured |
|----------|-----------|----------|------------------|
| **Solution A** | MCP `instructions` field | Soft hint to Claude | In MCP server code |
| **Solution B** | PreToolUse Hook | Hard block + redirect | In Claude Code settings |

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   SOLUTION A: Instructions                SOLUTION B: Hook              │
│   ════════════════════════                ═════════════════             │
│                                                                         │
│   ┌─────────────────────────┐            ┌─────────────────────────┐    │
│   │  MCP Server sends       │            │  Hook intercepts        │    │
│   │  instructions at        │            │  WebFetch BEFORE        │    │
│   │  initialization         │            │  it runs                │    │
│   └─────────────────────────┘            └─────────────────────────┘    │
│              │                                      │                   │
│              ▼                                      ▼                   │
│   ┌─────────────────────────┐            ┌─────────────────────────┐    │
│   │  Claude receives hint:  │            │  Hook returns:          │    │
│   │  "For Medium URLs,      │            │  DENY + "Use MCP tool"  │    │
│   │   prefer this tool"     │            │                         │    │
│   └─────────────────────────┘            └─────────────────────────┘    │
│              │                                      │                   │
│              ▼                                      ▼                   │
│   ┌─────────────────────────┐            ┌─────────────────────────┐    │
│   │  Claude MAY choose      │            │  Claude MUST use        │    │
│   │  to follow the hint     │            │  alternative tool       │    │
│   │  (not guaranteed)       │            │  (enforced)             │    │
│   └─────────────────────────┘            └─────────────────────────┘    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Recommendation**: Use BOTH together for maximum effectiveness.

---

## Solution A: MCP Server Instructions (Soft Hint)

### What Are Server Instructions?

The MCP specification includes an `instructions` field in the `InitializeResult`. This is sent to the client (Claude) when the server starts, and can be added to the system prompt.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                      MCP INITIALIZATION FLOW                             │
│                                                                          │
│   Claude Code                              MCP Server                    │
│       │                                        │                         │
│       │──── initialize request ───────────────►│                         │
│       │                                        │                         │
│       │◄─── InitializeResult ──────────────────│                         │
│       │     {                                  │                         │
│       │       "protocolVersion": "...",        │                         │
│       │       "capabilities": {...},           │                         │
│       │       "serverInfo": {...},             │                         │
│       │       "instructions": "..."  ◄─────────┼── THIS IS THE KEY!      │
│       │     }                                  │                         │
│       │                                        │                         │
│       ▼                                                                  │
│   Instructions added to Claude's context                                 │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### How It Works in Our Server

We can modify our MCP server to include instructions:

```typescript
// src/server/index.ts

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const SERVER_INSTRUCTIONS = `
## Medium Reader MCP Server

This server provides the \`read_medium_article\` tool for fetching Medium articles.

**IMPORTANT**: When you encounter Medium URLs (medium.com, *.medium.com, link.medium.com):
- DO NOT use WebFetch - it will fail on paywalled content
- USE the \`read_medium_article\` tool instead
- This tool uses authenticated Chrome cookies to bypass paywalls

Examples of Medium URLs to redirect:
- https://medium.com/@user/article-title-abc123
- https://towardsdatascience.medium.com/article-abc123
- https://link.medium.com/abc123

The tool returns full article content in clean Markdown format.
`;

export function createServer(): McpServer {
  const server = new McpServer(
    {
      name: SERVER_INFO.name,
      version: SERVER_INFO.version,
    },
    {
      instructions: SERVER_INSTRUCTIONS,  // <-- ADD THIS
    }
  );

  registerAllTools(server);
  return server;
}
```

### Pros and Cons

| Pros | Cons |
|------|------|
| Built into MCP server code | Claude may ignore the hint |
| No external configuration needed | Not enforced, just suggested |
| Works with any MCP client | Relies on Claude's judgment |
| Self-documenting | May not work in all contexts |

### Implementation Status

To implement this, we need to:
1. Check if `@modelcontextprotocol/sdk` supports the `instructions` field
2. Add the instructions to our server initialization
3. Test if Claude Code respects the instructions

---

## Solution B: PreToolUse Hook (Hard Block)

This is the **guaranteed** solution. Even if Claude ignores the instructions, the hook will block WebFetch and force Claude to use the MCP tool.

See the [Hook Implementation](#hook-implementation) section below.

---

## Background: What Are Hooks?

### The Concept

Hooks are **interceptors** - they let you run custom code at specific points during Claude Code's execution. Think of them like middleware in a web server.

```
┌──────────────────────────────────────────────────────────────────────┐
│                         CLAUDE CODE                                  │
│                                                                      │
│   User Request                                                       │
│        │                                                             │
│        ▼                                                             │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐           │
│   │ Claude  │───▶│ Decides │───▶│ HOOK    │───▶│ Tool    │           │
│   │ thinks  │    │ to use  │    │ FIRES   │    │ Runs    │           │
│   │         │    │ a tool  │    │ HERE    │    │         │           │
│   └─────────┘    └─────────┘    └─────────┘    └─────────┘           │
│                                      │                               │
│                                      ▼                               │
│                               Your Script                            │
│                               (allow/deny)                           │
└──────────────────────────────────────────────────────────────────────┘
```

### Hook Types

| Hook | When It Fires | What You Can Do |
|------|---------------|-----------------|
| **PreToolUse** | Before a tool runs | Allow, deny, or modify the input |
| **PostToolUse** | After a tool runs | Log results, modify output |
| **Notification** | On events | React to status changes |
| **Stop** | When Claude stops | Cleanup, final actions |

### How Claude Code Knows About Hooks

Hooks are configured in Claude Code's **settings file**, not in the MCP server:

```
~/.claude/settings.json        ← Global settings (all projects)
.claude/settings.json          ← Project-specific settings
```

When Claude Code starts, it reads these files and registers the hooks. Every time a tool is about to be used, it checks if any hooks match.

```
┌──────────────────────────────────────────────────────────────────────┐
│                    CLAUDE CODE STARTUP                               │
│                                                                      │
│  1. Read ~/.claude/settings.json                                     │
│  2. Read .claude/settings.json (if exists)                           │
│  3. Register hooks from "hooks" config                               │
│  4. Start MCP servers from "mcpServers" config                       │
│  5. Ready to process user requests                                   │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

### Hook Execution Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│  Claude decides: "I'll use WebFetch to get this URL"                 │
│                           │                                          │
│                           ▼                                          │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │              PRETOOLUSE HOOK CHECK                          │     │
│  │                                                             │     │
│  │  1. Does any hook match "WebFetch"?                         │     │
│  │     → Yes! Found: { matcher: "WebFetch", command: "..." }   │     │
│  │                                                             │     │
│  │  2. Run the command, passing tool input via stdin:          │     │
│  │     stdin → { "tool_name": "WebFetch",                      │     │
│  │              "tool_input": { "url": "https://medium..." }}  │     │
│  │                                                             │     │
│  │  3. Read stdout from the script:                            │     │
│  │     stdout ← { "hookSpecificOutput": {                      │     │
│  │                  "permissionDecision": "deny",              │     │
│  │                  "permissionDecisionReason": "Use MCP..." }}│     │
│  │                                                             │     │
│  │  4. Apply the decision:                                     │     │
│  │     - "allow" → proceed with WebFetch                       │     │
│  │     - "deny"  → stop, show reason to Claude                 │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                           │                                          │
│                           ▼                                          │
│  Claude sees: "WebFetch denied: Use MCP tool instead"                │
│  Claude thinks: "OK, I'll try the MCP tool"                          │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Why Hooks Are Separate from MCP Server

### The Key Distinction

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  MCP SERVER                          HOOKS                          │
│  ══════════                          ═════                          │
│                                                                     │
│  • Provides NEW tools               • Modifies EXISTING behavior    │
│  • Runs as separate process         • Runs inline in Claude Code    │
│  • Claude chooses when to use       • Intercepts before Claude acts │
│  • Can't intercept other tools      • Can intercept ANY tool        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Why We Can't Do This in the MCP Server

```
                     MCP Server CAN'T intercept WebFetch
                     ====================================

┌──────────────────┐         ┌──────────────────┐
│   Claude Code    │         │   MCP Server     │
│                  │         │                  │
│  ┌────────────┐  │         │  ┌────────────┐  │
│  │ WebFetch   │──┼────X────┼──│ Can't see  │  │
│  │ (built-in) │  │         │  │ WebFetch!  │  │
│  └────────────┘  │         │  └────────────┘  │
│                  │         │                  │
│  ┌────────────┐  │  JSON   │  ┌────────────┐  │
│  │ MCP Client │◄─┼─────────┼─►│ MCP Server │  │
│  └────────────┘  │  RPC    │  └────────────┘  │
└──────────────────┘         └──────────────────┘

The MCP server only sees requests FOR ITS OWN TOOLS.
It has no visibility into WebFetch, Bash, Read, etc.
```

### Why Shell Scripts?

Hooks are **shell commands** because:

1. **Language agnostic**: Use any language (bash, Python, Node, etc.)
2. **Process isolation**: Hook crashes don't crash Claude Code
3. **Simple protocol**: stdin/stdout JSON
4. **Existing tools**: Use `jq`, `grep`, any CLI tool
5. **Security**: Sandboxed execution

```
┌──────────────────────────────────────────────────────────────────────┐
│                     HOOK COMMUNICATION                               │
│                                                                      │
│   Claude Code                              Your Script               │
│       │                                        │                     │
│       │──── spawn process ────────────────────►│                     │
│       │                                        │                     │
│       │──── stdin (JSON) ─────────────────────►│                     │
│       │     { "tool_name": "WebFetch",         │                     │
│       │       "tool_input": {...} }            │                     │
│       │                                        │                     │
│       │◄─── stdout (JSON) ─────────────────────│                     │
│       │     { "hookSpecificOutput": {...} }    │                     │
│       │                                        │                     │
│       │◄─── process exits ─────────────────────│                     │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Solution Architecture

### Complete System View

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           YOUR MACHINE                                   │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                        CLAUDE CODE                                 │  │
│  │                                                                    │  │
│  │   ~/.claude/settings.json                                          │  │
│  │   ┌───────────────────────────────────────────────────────────┐    │  │
│  │   │ {                                                         │    │  │
│  │   │   "hooks": {                                              │    │  │
│  │   │     "PreToolUse": [{                                      │    │  │
│  │   │       "matcher": "WebFetch",                              │    │  │
│  │   │       "command": "/path/to/medium-redirect.sh"  ◄─────────┼────┼──┼─┐
│  │   │     }]                                                    │    │  │ │
│  │   │   },                                                      │    │  │ │
│  │   │   "mcpServers": {                                         │    │  │ │
│  │   │     "medium-reader": {                                    │    │  │ │
│  │   │       "command": "node",                                  │    │  │ │
│  │   │       "args": ["/path/to/dist/index.js"]  ◄───────────────┼────┼──┼─┼─┐
│  │   │     }                                                     │    │  │ │ │
│  │   │   }                                                       │    │  │ │ │
│  │   │ }                                                         │    │  │ │ │
│  │   └───────────────────────────────────────────────────────────┘    │  │ │ │
│  │                                                                    │  │ │ │
│  │   Built-in Tools        MCP Tools                                  │  │ │ │
│  │   ┌──────────────┐     ┌──────────────────────────────────────┐    │  │ │ │
│  │   │ • WebFetch   │     │ • mcp__medium-reader__read_medium... │    │  │ │ │
│  │   │ • WebSearch  │     │ • mcp__medium-reader__ping           │    │  │ │ │
│  │   │ • Bash       │     │ • mcp__medium-reader__echo           │    │  │ │ │
│  │   │ • Read       │     └──────────────────────────────────────┘    │  │ │ │
│  │   │ • Write      │                     ▲                           │  │ │ │
│  │   │ • Edit       │                     │                           │  │ │ │
│  │   └──────────────┘                     │ JSON-RPC                  │  │ │ │
│  │          │                             │                           │  │ │ │
│  └──────────┼─────────────────────────────┼───────────────────────────┘  │ │ │
│             │                             │                              │ │ │
│             ▼                             ▼                              │ │ │
│  ┌──────────────────────┐     ┌──────────────────────────────────────┐   │ │ │
│  │   medium-redirect.sh │     │         MCP SERVER PROCESS           │   │ │ │
│  │   (Hook Script)      │     │     (medium-reader-mcp/dist/)        │   │ │ │
│  │                      │     │                                      │◄──┼─┼─┘
│  │   Checks if URL is   │     │   Provides:                          │   │ │
│  │   medium.com and     │     │   • read_medium_article              │   │ │
│  │   denies WebFetch    │◄────┼───• Uses Chrome cookies              │   │ │
│  │   with helpful msg   │     │   • GraphQL + HTML extraction        │   │ │
│  └──────────────────────┘     └──────────────────────────────────────┘   │ │
│             ▲                                                            │ │
│             └────────────────────────────────────────────────────────────┘ │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Request Flow: Before vs After Hook

**WITHOUT Hook (current behavior):**

```
User: "What does this article say? https://medium.com/@user/premium-article"
                │
                ▼
┌───────────────────────────────────────────────────────────────┐
│ Claude: "I'll fetch that URL with WebFetch"                   │
│                    │                                          │
│                    ▼                                          │
│            ┌──────────────┐                                   │
│            │  WebFetch    │                                   │
│            │  (built-in)  │                                   │
│            └──────────────┘                                   │
│                    │                                          │
│                    ▼                                          │
│         HTTP GET medium.com/...                               │
│                    │                                          │
│                    ▼                                          │
│         403 Forbidden (paywall)                               │
│                    │                                          │
│                    ▼                                          │
│ Claude: "I couldn't access this article. It appears to be     │
│          behind a paywall."                                   │
└───────────────────────────────────────────────────────────────┘
```

**WITH Hook (our solution):**

```
User: "What does this article say? https://medium.com/@user/premium-article"
                │
                ▼
┌───────────────────────────────────────────────────────────────┐
│ Claude: "I'll fetch that URL with WebFetch"                   │
│                    │                                          │
│                    ▼                                          │
│         ┌─────────────────────────┐                           │
│         │    PreToolUse Hook      │                           │
│         │    (medium-redirect.sh) │                           │
│         └─────────────────────────┘                           │
│                    │                                          │
│                    ▼                                          │
│         Hook checks URL: "medium.com" ✓                       │
│                    │                                          │
│                    ▼                                          │
│         Hook returns: DENY + "Use mcp__medium-reader__..."    │
│                    │                                          │
│                    ▼                                          │
│ Claude: "WebFetch was denied. I should use the MCP tool."     │
│                    │                                          │
│                    ▼                                          │
│         ┌─────────────────────────────────────┐               │
│         │  mcp__medium-reader__read_medium... │               │
│         │  (our MCP server)                   │               │
│         └─────────────────────────────────────┘               │
│                    │                                          │
│                    ▼                                          │
│         MCP uses Chrome cookies → Full article content!       │
│                    │                                          │
│                    ▼                                          │
│ Claude: "Here's a summary of the article: ..."                │
└───────────────────────────────────────────────────────────────┘
```

---

## Hook Implementation

### Step 1: Create Hook Script

Create `hooks/medium-redirect.sh` in your project:

```bash
#!/bin/bash

# Read tool input from stdin (JSON)
INPUT=$(cat)

# Extract the URL from WebFetch input
URL=$(echo "$INPUT" | jq -r '.tool_input.url // ""')

# Check if it's a Medium URL
if [[ "$URL" == *"medium.com"* ]] || \
   [[ "$URL" == *".medium.com"* ]] || \
   [[ "$URL" =~ ^https?://[a-z0-9-]+\.medium\.com ]]; then

  # Deny WebFetch and suggest the MCP tool
  cat << 'EOF'
{
  "hookSpecificOutput": {
    "permissionDecision": "deny",
    "permissionDecisionReason": "This is a Medium URL. Use the mcp__medium-reader__read_medium_article tool instead. It can access paywalled content using your Chrome session cookies. Call it with: {\"url\": \"<the-medium-url>\"}"
  }
}
EOF
  exit 0
fi

# Allow all non-Medium URLs
echo '{"hookSpecificOutput": {"permissionDecision": "allow"}}'
exit 0
```

### Step 2: Configure Claude Code Settings

Add to `~/.claude/settings.json` (global) or `.claude/settings.json` (project):

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "WebFetch",
        "command": "/absolute/path/to/medium-reader-mcp/hooks/medium-redirect.sh"
      }
    ]
  }
}
```

### Step 3: Make Script Executable

```bash
chmod +x hooks/medium-redirect.sh
```

---

## Alternative: Node.js Hook (Cross-Platform)

For portability (Windows/Mac/Linux), use Node.js:

Create `hooks/medium-redirect.mjs`:

```javascript
#!/usr/bin/env node

import { createInterface } from 'readline';

const rl = createInterface({ input: process.stdin });

let input = '';
rl.on('line', (line) => { input += line; });
rl.on('close', () => {
  try {
    const data = JSON.parse(input);
    const url = data.tool_input?.url || '';

    // Check for Medium URLs
    const isMedium = url.includes('medium.com') ||
                     /^https?:\/\/[a-z0-9-]+\.medium\.com/.test(url);

    if (isMedium) {
      console.log(JSON.stringify({
        hookSpecificOutput: {
          permissionDecision: 'deny',
          permissionDecisionReason:
            'This is a Medium URL. Use the mcp__medium-reader__read_medium_article tool instead. ' +
            'It can access paywalled content using your Chrome session cookies. ' +
            `Call it with: {"url": "${url}"}`
        }
      }));
    } else {
      console.log(JSON.stringify({
        hookSpecificOutput: { permissionDecision: 'allow' }
      }));
    }
  } catch (e) {
    // On error, allow the request
    console.log(JSON.stringify({
      hookSpecificOutput: { permissionDecision: 'allow' }
    }));
  }
});
```

---

## URL Patterns to Match

| Pattern | Example | Matched |
|---------|---------|---------|
| `medium.com` | `https://medium.com/@user/article` | Yes |
| `*.medium.com` | `https://towardsdatascience.medium.com/article` | Yes |
| Subdomain | `https://betterprogramming.pub/article` | No* |
| Short link | `https://link.medium.com/abc123` | Yes |

*Note: Some Medium publications use custom domains (e.g., `betterprogramming.pub`). These won't be caught by domain matching alone.

---

## Testing

1. Configure the hook in settings
2. Restart Claude Code (to reload settings)
3. Ask: "Fetch this article: https://medium.com/@example/some-article"
4. Observe:
   - Without hook: WebFetch tries and may fail with 403
   - With hook: Claude uses `mcp__medium-reader__read_medium_article` directly

---

## Limitations

1. **Custom publication domains**: Medium publications with custom domains won't be intercepted
2. **Hook latency**: Adds small overhead to every WebFetch call
3. **jq dependency**: Bash version requires `jq` installed
4. **Settings file**: User must configure hooks manually

---

## Comparison: Instructions vs Hooks

| Aspect | Solution A: Instructions | Solution B: Hooks |
|--------|--------------------------|-------------------|
| **Enforcement** | Soft (suggestion) | Hard (enforced) |
| **Configuration** | In MCP server code | In Claude settings file |
| **Portability** | Works with any MCP client | Claude Code specific |
| **Reliability** | Claude may ignore | Guaranteed to work |
| **Setup complexity** | Just code change | External script + config |
| **Maintenance** | Part of server | Separate from server |

### Recommendation

**Use BOTH solutions together:**

1. **Instructions** (Solution A): Add to MCP server so Claude knows upfront to prefer our tool
2. **Hook** (Solution B): Acts as a safety net if Claude still tries WebFetch

```
┌──────────────────────────────────────────────────────────────────────┐
│                     DEFENSE IN DEPTH                                 │
│                                                                      │
│   Layer 1: Instructions                                              │
│   ┌─────────────────────────────────────────────────────────────┐    │
│   │  "Hey Claude, for Medium URLs use read_medium_article"      │    │
│   └─────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│                    Claude follows hint?                              │
│                      /            \                                  │
│                   Yes              No                                │
│                    │                │                                │
│                    ▼                ▼                                │
│              Uses MCP tool    Tries WebFetch                         │
│                    │                │                                │
│                    │                ▼                                │
│                    │    Layer 2: Hook blocks it                      │
│                    │    ┌───────────────────────┐                    │
│                    │    │ DENY: Use MCP instead │                    │
│                    │    └───────────────────────┘                    │
│                    │                │                                │
│                    ▼                ▼                                │
│              ┌──────────────────────────┐                            │
│              │   Uses MCP tool (works!) │                            │
│              └──────────────────────────┘                            │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## References

### MCP Server Instructions
- [MCP Specification - Lifecycle](https://modelcontextprotocol.io/specification/2025-06-18/basic/lifecycle) - InitializeResult instructions field
- [GitHub MCP Server Instructions](https://github.blog/changelog/2025-10-29-github-mcp-server-now-comes-with-server-instructions-better-tools-and-more/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)

### Claude Code Hooks
- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks)
- [How to Configure Hooks - Claude Blog](https://claude.com/blog/how-to-configure-hooks)
- [Hook Examples - Steve Kinney](https://stevekinney.com/courses/ai-development/claude-code-hook-examples)
- [WebFetch Tool Documentation](https://docs.claude.com/en/docs/agents-and-tools/tool-use/web-fetch-tool)

---

## Next Steps

1. [ ] Create `hooks/` directory in project
2. [ ] Add hook script (bash or Node.js)
3. [ ] Update README with hook setup instructions
4. [ ] Test with real Medium URLs
5. [ ] Consider expanding to custom publication domains
