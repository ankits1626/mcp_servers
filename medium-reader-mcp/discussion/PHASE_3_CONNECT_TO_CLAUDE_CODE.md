# Phase 3: Connect to Claude Code

> **Goal**: Understand how Claude Code discovers and connects to MCP servers, then configure our server to work with Claude Code

---

## Table of Contents

1. [What is Claude Code?](#1-what-is-claude-code)
2. [How Claude Code Finds MCP Servers](#2-how-claude-code-finds-mcp-servers)
3. [MCP Configuration File](#3-mcp-configuration-file)
4. [The `claude mcp` Commands](#4-the-claude-mcp-commands)
5. [Server Lifecycle with Claude Code](#5-server-lifecycle-with-claude-code)
6. [Debugging MCP Connections](#6-debugging-mcp-connections)
7. [Configuration Scopes](#7-configuration-scopes)
8. [Step-by-Step: Add Our Server](#8-step-by-step-add-our-server)

---

## 1. What is Claude Code?

Claude Code is Anthropic's **CLI tool** for interacting with Claude. It's different from:

| Product | What It Is |
|---------|------------|
| **Claude.ai** | Web interface for chatting with Claude |
| **Claude API** | Programmatic API for developers |
| **Claude Code** | Terminal-based AI assistant with tool capabilities |

### Claude Code's Superpower: MCP Integration

Claude Code can connect to **MCP servers** to gain new abilities:

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLAUDE CODE ARCHITECTURE                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────┐                                              │
│   │  Claude Code │ ◄──── You type commands here                 │
│   │    (Host)    │                                              │
│   └──────┬───────┘                                              │
│          │                                                       │
│          │ Connects to MCP Servers                              │
│          │                                                       │
│   ┌──────┴───────────────────────────────────────┐              │
│   │                                              │              │
│   ▼                  ▼                  ▼        │              │
│ ┌─────────┐    ┌─────────┐    ┌─────────────────┐│              │
│ │ Built-in│    │ Your    │    │ Third-party     ││              │
│ │ Tools   │    │ Server  │    │ Servers         ││              │
│ │ (Read,  │    │ (medium-│    │ (GitHub, Slack, ││              │
│ │ Write,  │    │ reader) │    │ Postgres, etc.) ││              │
│ │ Bash)   │    │         │    │                 ││              │
│ └─────────┘    └─────────┘    └─────────────────┘│              │
│                                                  │              │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. How Claude Code Finds MCP Servers

Claude Code reads configuration files to know which servers to connect to.

### The Discovery Process

```
┌─────────────────────────────────────────────────────────────────┐
│               MCP SERVER DISCOVERY PROCESS                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. STARTUP                                                      │
│     Claude Code starts                                           │
│                                                                  │
│  2. READ CONFIGURATION                                           │
│     Looks for MCP config in:                                    │
│     a. ~/.claude/settings.json (global)                         │
│     b. ./.claude/settings.json (project)                        │
│     c. ./.mcp.json (project, legacy)                            │
│                                                                  │
│  3. SPAWN SERVERS                                                │
│     For each configured server:                                  │
│     - Start the command (e.g., "node dist/index.js")            │
│     - Connect via stdio transport                                │
│     - Send "initialize" request                                  │
│                                                                  │
│  4. CAPABILITY EXCHANGE                                          │
│     - Server responds with capabilities                          │
│     - Claude Code sends "tools/list" request                    │
│     - Server responds with available tools                       │
│                                                                  │
│  5. READY                                                        │
│     Claude Code now knows about all tools from all servers      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. MCP Configuration File

### File Locations

| Location | Scope | When to Use |
|----------|-------|-------------|
| `~/.claude/settings.json` | Global | Tools you want everywhere |
| `./.claude/settings.json` | Project | Project-specific tools |
| `./.mcp.json` | Project (legacy) | Older format, still works |

### Configuration Structure

The MCP servers are defined in the `mcpServers` section:

```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["/absolute/path/to/dist/index.js"],
      "env": {
        "OPTIONAL_ENV_VAR": "value"
      }
    }
  }
}
```

### Field Explanations

| Field | Required | Description |
|-------|----------|-------------|
| `server-name` | Yes | Unique identifier for this server |
| `command` | Yes | The executable to run |
| `args` | Yes | Array of command-line arguments |
| `env` | No | Environment variables to set |

### Example: Multiple Servers

```json
{
  "mcpServers": {
    "medium-reader": {
      "command": "node",
      "args": ["/Users/ankit/code/learn/mcp_servers/medium-reader-mcp/dist/index.js"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "ghp_xxxx"
      }
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "postgresql://user:pass@localhost/db"
      }
    }
  }
}
```

---

## 4. The `claude mcp` Commands

Claude Code provides CLI commands to manage MCP servers:

### List Configured Servers

```bash
claude mcp list
```

Shows all configured servers and their status.

### Add a Server

```bash
# Basic syntax
claude mcp add <name> -- <command> [args...]

# Example: Add our server
claude mcp add medium-reader -- node /path/to/dist/index.js

# With scope (local = project only)
claude mcp add --scope local medium-reader -- node /path/to/dist/index.js
```

### Remove a Server

```bash
claude mcp remove <name>
```

### Get Server Details

```bash
claude mcp get <name>
```

### What `claude mcp add` Does

When you run `claude mcp add`, it:

1. Validates the command exists
2. Updates the appropriate settings file
3. Does NOT restart Claude Code (you need to do that)

```
┌─────────────────────────────────────────────────────────────────┐
│               WHAT "claude mcp add" DOES                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   $ claude mcp add medium-reader -- node /path/to/dist/index.js │
│                                                                  │
│   1. Parses command: "node" with args ["/path/to/dist/index.js"]│
│                                                                  │
│   2. Updates ~/.claude/settings.json:                           │
│      {                                                           │
│        "mcpServers": {                                          │
│          "medium-reader": {                                      │
│            "command": "node",                                    │
│            "args": ["/path/to/dist/index.js"]                   │
│          }                                                       │
│        }                                                         │
│      }                                                           │
│                                                                  │
│   3. Prints confirmation                                         │
│                                                                  │
│   NOTE: Server won't be active until Claude Code restarts       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Server Lifecycle with Claude Code

### Startup Sequence

```
┌─────────────────────────────────────────────────────────────────┐
│                    SERVER STARTUP SEQUENCE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Claude Code                          Your Server               │
│  ───────────                          ───────────               │
│       │                                                          │
│       │  spawn process                                          │
│       │─────────────────────────────────►│                      │
│       │                                  │ (server starts)      │
│       │                                  │                      │
│       │  {"method": "initialize", ...}   │                      │
│       │─────────────────────────────────►│                      │
│       │                                  │                      │
│       │  {"result": {"capabilities":...}}│                      │
│       │◄─────────────────────────────────│                      │
│       │                                  │                      │
│       │  {"method": "tools/list"}        │                      │
│       │─────────────────────────────────►│                      │
│       │                                  │                      │
│       │  {"result": {"tools": [...]}}    │                      │
│       │◄─────────────────────────────────│                      │
│       │                                  │                      │
│       │  (ready to use tools)            │                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### During Conversation

When you ask Claude to use a tool:

```
User: "ping the server"

Claude Code thinks: "I have a 'ping' tool from medium-reader server"

Claude Code sends:
{
  "jsonrpc": "2.0",
  "id": 123,
  "method": "tools/call",
  "params": {
    "name": "ping",
    "arguments": {}
  }
}

Your server responds:
{
  "jsonrpc": "2.0",
  "id": 123,
  "result": {
    "content": [{"type": "text", "text": "pong"}]
  }
}

Claude sees the result and responds to user:
"The server responded with: pong"
```

### Shutdown

When Claude Code exits:

1. Sends SIGTERM to all spawned server processes
2. Servers should handle this gracefully
3. If server doesn't exit, SIGKILL after timeout

---

## 6. Debugging MCP Connections

### Common Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| Server not found | Wrong path in config | Use absolute path |
| Server crashes on start | Code error | Test with `node dist/index.js` first |
| Tools not appearing | Server not sending tools | Check `tools/list` response |
| Permission denied | Script not executable | Check file permissions |

### Debug Techniques

#### 1. Test Server Manually

Before connecting to Claude Code, test your server works:

```bash
# Build
npm run build

# Test with inspector
npx @modelcontextprotocol/inspector node dist/index.js
```

#### 2. Check Claude Code Logs

Claude Code logs MCP activity. Look for errors in:
- Terminal output when starting Claude Code
- Any error messages about MCP servers

#### 3. Verify Configuration

```bash
# See what's configured
claude mcp list

# Check specific server
claude mcp get medium-reader
```

#### 4. Check Server Stderr

Your server can write to stderr for debugging (but NOT stdout - that's for JSON-RPC):

```typescript
console.error("Server starting...");  // OK - goes to stderr
console.log("Hello");                 // BAD - corrupts JSON-RPC on stdout
```

---

## 7. Configuration Scopes

### Global vs Project Scope

```
┌─────────────────────────────────────────────────────────────────┐
│                    CONFIGURATION SCOPES                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  GLOBAL (~/.claude/settings.json)                               │
│  ─────────────────────────────────                              │
│  • Available in ALL projects                                    │
│  • Good for: general-purpose tools (GitHub, Slack)              │
│  • Added with: claude mcp add <name> -- ...                     │
│                                                                  │
│  PROJECT (./.claude/settings.json)                              │
│  ─────────────────────────────────                              │
│  • Only available in THIS project                               │
│  • Good for: project-specific tools                             │
│  • Added with: claude mcp add --scope local <name> -- ...       │
│  • Can be committed to git for team sharing                     │
│                                                                  │
│  RESOLUTION ORDER                                                │
│  ────────────────                                                │
│  1. Project settings (higher priority)                          │
│  2. Global settings (lower priority)                            │
│  • Project settings can override global                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### When to Use Each

| Scope | Use Case | Example |
|-------|----------|---------|
| Global | Tools you use across all projects | GitHub, Slack, general utilities |
| Project | Tools specific to one codebase | Database for this project, custom tools |

---

## 8. Step-by-Step: Add Our Server

### Prerequisites

1. Server is built: `npm run build`
2. Server works with inspector (tested)
3. Claude Code is installed

### Option A: Using CLI (Recommended)

```bash
# Get the absolute path to your server
cd /Users/ankit/code/learn/mcp_servers/medium-reader-mcp
pwd  # Copy this path

# Add to Claude Code (global scope)
claude mcp add medium-reader -- node /Users/ankit/code/learn/mcp_servers/medium-reader-mcp/dist/index.js

# Or project scope (only in current directory)
claude mcp add --scope local medium-reader -- node /Users/ankit/code/learn/mcp_servers/medium-reader-mcp/dist/index.js
```

### Option B: Edit Config Manually

Edit `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "medium-reader": {
      "command": "node",
      "args": ["/Users/ankit/code/learn/mcp_servers/medium-reader-mcp/dist/index.js"]
    }
  }
}
```

### Verify It's Configured

```bash
claude mcp list
```

Should show `medium-reader` in the list.

### Restart Claude Code

**Important**: After adding a server, you need to restart Claude Code for it to pick up the changes.

### Test the Integration

In a new Claude Code session:

```
You: "use the ping tool"

Claude: I'll use the ping tool to test the server.
        [Calls ping tool]
        The server responded with: pong
```

Or with a message:

```
You: "ping with message 'hello from claude'"

Claude: [Calls ping tool with message "hello from claude"]
        The server responded with: pong: hello from claude
```

---

## Key Concepts Summary

| Concept | What It Means |
|---------|---------------|
| **Host** | Claude Code - the application that uses MCP |
| **Server** | Your code - provides tools to the host |
| **stdio transport** | Communication via stdin/stdout |
| **Configuration** | JSON file telling Claude Code which servers to start |
| **Scope** | Global (all projects) vs Local (this project) |
| **Lifecycle** | Spawn → Initialize → Exchange capabilities → Ready |

---

## What's Next?

Once our server is connected to Claude Code:
- Test the `ping` tool in a real conversation
- See how Claude decides when to use tools
- In **Phase 4**, we'll add real functionality: HTTP fetching

---

**Status**: 📝 Documentation complete, ready for implementation

**Back to**: [Phase 2](./PHASE_2_TOOL_EXECUTION.md) | [Learning Plan](./LEARNING_PLAN.md)
