# Model Context Protocol (MCP) with Claude Code

A complete guide to understanding how MCP works and how to use it with Claude Code.

---

## The Complete Flow: User Prompt to Response

**Scenario**: You ask Claude Code *"Get the transcript for this YouTube video"*

Here is exactly what happens, step by step:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE MCP FLOW (with actual JSON messages)            │
└─────────────────────────────────────────────────────────────────────────────┘


PHASE 1: STARTUP (happens once when Claude Code launches)
═══════════════════════════════════════════════════════════════════════════════

┌─────────────┐                           ┌─────────────┐
│ Claude Code │                           │  YouTube    │
│   (Host)    │                           │ MCP Server  │
└──────┬──────┘                           └──────┬──────┘
       │                                         │
       │  1. Spawn server process                │
       │    (npx @kimtaeyoon83/mcp-server-...)   │
       │ ──────────────────────────────────────► │
       │                                         │
       │  2. Send: initialize request            │
       │ ──────────────────────────────────────► │
       │                                         │
       │    {                                    │
       │      "jsonrpc": "2.0",                  │
       │      "id": 1,                           │
       │      "method": "initialize",            │
       │      "params": {                        │
       │        "protocolVersion": "2025-06-18", │
       │        "clientInfo": {                  │
       │          "name": "claude-code"          │
       │        }                                │
       │      }                                  │
       │    }                                    │
       │                                         │
       │  3. Receive: server capabilities        │
       │ ◄────────────────────────────────────── │
       │                                         │
       │    {                                    │
       │      "jsonrpc": "2.0",                  │
       │      "id": 1,                           │
       │      "result": {                        │
       │        "protocolVersion": "2025-06-18", │
       │        "capabilities": {                │
       │          "tools": {}                    │
       │        },                               │
       │        "serverInfo": {                  │
       │          "name": "youtube-transcript"   │
       │        }                                │
       │      }                                  │
       │    }                                    │
       │                                         │
       │  4. Send: tools/list request            │
       │ ──────────────────────────────────────► │
       │                                         │
       │    {                                    │
       │      "jsonrpc": "2.0",                  │
       │      "id": 2,                           │
       │      "method": "tools/list"             │
       │    }                                    │
       │                                         │
       │  5. Receive: available tools            │
       │ ◄────────────────────────────────────── │
       │                                         │
       │    {                                    │
       │      "jsonrpc": "2.0",                  │
       │      "id": 2,                           │
       │      "result": {                        │
       │        "tools": [{                      │
       │          "name": "get_transcript",      │
       │          "description": "Get YouTube    │
       │            video transcript",           │
       │          "inputSchema": {               │
       │            "type": "object",            │
       │            "properties": {              │
       │              "url": {"type": "string"}, │
       │              "lang": {"type": "string"} │
       │            },                           │
       │            "required": ["url"]          │
       │          }                              │
       │        }]                               │
       │      }                                  │
       │    }                                    │
       │                                         │
       │  6. Claude Code now knows:              │
       │     "I have a tool called               │
       │      get_transcript that takes          │
       │      a URL parameter"                   │
       │                                         │
└──────┴──────────────────────────────────────────┴──────┘


PHASE 2: USER REQUEST (happens each time you ask something)
═══════════════════════════════════════════════════════════════════════════════

┌──────┐    ┌─────────────┐    ┌─────────┐    ┌─────────────┐    ┌─────────┐
│ You  │    │ Claude Code │    │  LLM    │    │ MCP Client  │    │  MCP    │
│      │    │   (Host)    │    │(Claude) │    │             │    │ Server  │
└──┬───┘    └──────┬──────┘    └────┬────┘    └──────┬──────┘    └────┬────┘
   │               │                │                │                │
   │ 1. "Get the transcript for     │                │                │
   │     youtube.com/watch?v=xyz"   │                │                │
   │ ─────────────────────────────► │                │                │
   │                                │                │                │
   │               │ 2. Forward to LLM with         │                │
   │               │    available tools list        │                │
   │               │ ─────────────────────────────► │                │
   │               │                                │                │
   │               │    System: "You have these     │                │
   │               │    tools available:            │                │
   │               │    - get_transcript(url)"      │                │
   │               │                                │                │
   │               │    User: "Get the transcript   │                │
   │               │    for youtube.com/watch?v=xyz"│                │
   │               │                                │                │
   │               │ 3. LLM decides: "I should     │                │
   │               │    call get_transcript"        │                │
   │               │ ◄───────────────────────────── │                │
   │               │                                │                │
   │               │    LLM Response:               │                │
   │               │    {                           │                │
   │               │      "tool_use": {             │                │
   │               │        "name": "get_transcript"│                │
   │               │        "arguments": {          │                │
   │               │          "url": "youtube.com/  │                │
   │               │                  watch?v=xyz"  │                │
   │               │        }                       │                │
   │               │      }                         │                │
   │               │    }                           │                │
   │               │                                │                │
   │               │ 4. Host routes to correct MCP client            │
   │               │ ──────────────────────────────────────────────► │
   │               │                                │                │
   │               │                                │ 5. Send JSON-RPC
   │               │                                │ ──────────────►│
   │               │                                │                │
   │               │    {                           │                │
   │               │      "jsonrpc": "2.0",         │                │
   │               │      "id": 3,                  │                │
   │               │      "method": "tools/call",   │                │
   │               │      "params": {               │                │
   │               │        "name": "get_transcript"│                │
   │               │        "arguments": {          │                │
   │               │          "url": "youtube.com/  │                │
   │               │                  watch?v=xyz"  │                │
   │               │        }                       │                │
   │               │      }                         │                │
   │               │    }                           │                │
   │               │                                │                │
   │               │                                │ 6. Server fetches
   │               │                                │    from YouTube
   │               │                                │    (HTTP request)
   │               │                                │                │
   │               │                                │ 7. Return result
   │               │                                │ ◄──────────────│
   │               │                                │                │
   │               │    {                           │                │
   │               │      "jsonrpc": "2.0",         │                │
   │               │      "id": 3,                  │                │
   │               │      "result": {               │                │
   │               │        "content": [{           │                │
   │               │          "type": "text",       │                │
   │               │          "text": "Welcome to   │                │
   │               │           this video about..." │                │
   │               │        }]                      │                │
   │               │      }                         │                │
   │               │    }                           │                │
   │               │                                │                │
   │               │ 8. Pass result back to Host    │                │
   │               │ ◄────────────────────────────────────────────── │
   │               │                                │                │
   │               │ 9. Send result to LLM          │                │
   │               │ ─────────────────────────────► │                │
   │               │                                │                │
   │               │    "Tool result:               │                │
   │               │     Welcome to this video..."  │                │
   │               │                                │                │
   │               │ 10. LLM generates final response                │
   │               │ ◄───────────────────────────── │                │
   │               │                                │                │
   │               │    "Here's the transcript:     │                │
   │               │     Welcome to this video..."  │                │
   │               │                                │                │
   │ 11. Display response to user   │                │                │
   │ ◄───────────────────────────── │                │                │
   │                                │                │                │
   │    "Here's the transcript:     │                │                │
   │     Welcome to this video..."  │                │                │
   │                                │                │                │
└──┴────────────────────────────────┴────────────────┴────────────────┴──┘
```

---

## Summary: The 11 Steps

| Step | What Happens | Who → Who |
|------|--------------|-----------|
| 1 | You type your request | You → Claude Code |
| 2 | Host adds available tools to prompt | Host → LLM |
| 3 | LLM decides which tool to call | LLM → Host |
| 4 | Host routes to correct MCP client | Host → Client |
| 5 | Client sends JSON-RPC `tools/call` | Client → Server |
| 6 | Server executes (calls YouTube API) | Server → External |
| 7 | Server returns JSON-RPC result | Server → Client |
| 8 | Client passes result to Host | Client → Host |
| 9 | Host sends tool result to LLM | Host → LLM |
| 10 | LLM generates natural language response | LLM → Host |
| 11 | Host displays response | Host → You |

---

## Key Insight

**The LLM never talks directly to the MCP server.**

```
YOU  ←→  HOST (Claude Code)  ←→  LLM (Claude)
              ↕
         MCP CLIENT
              ↕
         MCP SERVER
              ↕
         EXTERNAL API (YouTube, GitHub, etc.)
```

The Host (Claude Code) is the orchestrator:
- It receives your message
- It tells the LLM what tools are available
- When the LLM says "call this tool", the Host executes it via MCP
- It feeds the result back to the LLM
- It shows you the final response

---

## What is MCP?

**Model Context Protocol (MCP)** is an open standard introduced by Anthropic (November 2024) that standardizes how AI applications connect to external tools, data sources, and services.

### The USB-C Analogy

Think of MCP as the **USB-C port for AI**:
- Before USB-C: Every device had different connectors (N×M problem)
- After USB-C: One standard port connects everything (M+N problem)

Similarly:
- Before MCP: Custom integrations for every tool + every AI app
- After MCP: One protocol connects any tool to any AI app

```
┌─────────────────────────────────────────────────────────────┐
│                    BEFORE MCP (N×M)                         │
│                                                             │
│   Claude ──┬── Custom connector ── GitHub                   │
│            ├── Custom connector ── Slack                    │
│            └── Custom connector ── Database                 │
│                                                             │
│   ChatGPT ─┬── Different connector ── GitHub                │
│            ├── Different connector ── Slack                 │
│            └── Different connector ── Database              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    AFTER MCP (M+N)                          │
│                                                             │
│   Claude  ─┐                    ┌── GitHub MCP Server       │
│            │                    │                           │
│   ChatGPT ─┼──── MCP Protocol ──┼── Slack MCP Server        │
│            │                    │                           │
│   Cursor  ─┘                    └── Database MCP Server     │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Architecture

### Three Key Components

```
┌────────────────────────────────────────────────────────────┐
│                         HOST                               │
│  (Claude Code, Cursor, ChatGPT Desktop)                    │
│                                                            │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│   │ Client 1 │  │ Client 2 │  │ Client 3 │                │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘                │
└────────┼─────────────┼─────────────┼───────────────────────┘
         │             │             │
         │ JSON-RPC    │ JSON-RPC    │ JSON-RPC
         │             │             │
    ┌────▼────┐   ┌────▼────┐   ┌────▼────┐
    │ Server  │   │ Server  │   │ Server  │
    │ GitHub  │   │ Sentry  │   │ YouTube │
    └─────────┘   └─────────┘   └─────────┘
```

| Component | Role | Example |
|-----------|------|---------|
| **Host** | AI application that needs external context | Claude Code, Cursor, ChatGPT |
| **Client** | Connector within host (1:1 with server) | Built into the host |
| **Server** | Exposes tools/resources via standard API | GitHub MCP, YouTube Transcript MCP |

---

## What Servers Expose (Primitives)

MCP servers can expose three types of capabilities:

### 1. Tools (Model-Controlled)

Functions the AI decides to call based on context.

```
User: "What are the open issues in my repo?"
        ↓
Claude decides to call: mcp__github__list_issues
        ↓
Server executes and returns issue list
        ↓
Claude formats and presents results
```

### 2. Resources (Application-Controlled)

Data sources the AI can access (like GET endpoints).

```
User: "Analyze @github:issue://123"
        ↓
Host fetches resource automatically
        ↓
Content added to conversation context
        ↓
Claude analyzes the issue
```

### 3. Prompts (User-Controlled)

Pre-defined templates invoked by user.

```
User: "/mcp__github__pr_review 456"
        ↓
Prompt template expanded with PR #456
        ↓
Claude receives structured review request
```

---

## Transport Mechanisms

How clients communicate with servers:

| Transport | Use Case | Example |
|-----------|----------|---------|
| **stdio** | Local processes | `npx youtube-transcript-mcp` |
| **HTTP** | Remote servers | `https://mcp.github.com` |
| **SSE** | Streaming (deprecated) | Legacy servers |

### stdio (Local)

```
┌──────────────┐     stdin/stdout     ┌──────────────┐
│    Claude    │ ◄──────────────────► │  Local MCP   │
│     Code     │                      │   Process    │
└──────────────┘                      └──────────────┘
```

### HTTP (Remote)

```
┌──────────────┐     HTTPS + JSON     ┌──────────────┐
│    Claude    │ ◄──────────────────► │  Remote MCP  │
│     Code     │                      │   Server     │
└──────────────┘                      └──────────────┘
```

---

## Using MCP with Claude Code

### Adding Servers

```bash
# HTTP server (remote)
claude mcp add --transport http github https://api.githubcopilot.com/mcp/

# stdio server (local npm package)
claude mcp add --transport stdio youtube -- npx -y @kimtaeyoon83/mcp-server-youtube-transcript

# With environment variables
claude mcp add --transport stdio db --env DB_URL=postgresql://... -- npx dbhub
```

### Managing Servers

```bash
claude mcp list              # List all servers
claude mcp get <name>        # Get server details
claude mcp remove <name>     # Remove a server
```

### Inside Claude Code

```bash
/mcp                         # Check status, authenticate
@resource                    # Reference MCP resources
/mcp__server__prompt         # Use MCP prompts
```

### Configuration Scopes

| Scope | Location | Sharing |
|-------|----------|---------|
| `local` | `~/.claude.json` | Private to you, this project |
| `project` | `.mcp.json` | Shared via git |
| `user` | `~/.claude.json` | Private, all projects |

```bash
claude mcp add --scope project ...  # Team shares this
claude mcp add --scope user ...     # Personal, everywhere
```

---

## Example: YouTube Transcript Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  YOUTUBE TRANSCRIPT EXAMPLE                 │
└─────────────────────────────────────────────────────────────┘

1. Setup (once):
   $ claude mcp add --transport stdio yt -- npx -y @kimtaeyoon83/mcp-server-youtube-transcript

2. User Request:
   You: "Get transcript for https://youtube.com/watch?v=xyz and summarize"

3. Claude Code Flow:
   ┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐
   │  You    │ ───► │ Claude  │ ───► │ Client  │ ───► │ YT MCP  │
   │         │      │  Code   │      │         │      │ Server  │
   └─────────┘      └────┬────┘      └─────────┘      └────┬────┘
                         │                                  │
                         │   Tool: get_transcript           │
                         │   Params: {url: "..."}           │
                         │                                  ▼
                         │                           ┌─────────────┐
                         │                           │  YouTube    │
                         │                           │  API/Site   │
                         │                           └──────┬──────┘
                         │                                  │
                         │ ◄─────── Transcript text ────────┘
                         │
                         ▼
                    Claude summarizes
                    using its own intelligence
                         │
                         ▼
   ┌─────────┐
   │ Summary │
   │ output  │
   └─────────┘
```

---

## Security Considerations

### Trust Model

```
┌────────────────────────────────────────────┐
│           SECURITY BOUNDARIES              │
├────────────────────────────────────────────┤
│                                            │
│  User ◄──── Consent required ────► Tools   │
│                                            │
│  Data ◄──── Explicit approval ───► Server  │
│                                            │
│  LLM  ◄──── Controlled access ───► APIs    │
│                                            │
└────────────────────────────────────────────┘
```

### Key Principles

1. **User Consent** - Explicit approval before tool execution
2. **Data Privacy** - No unauthorized data transmission
3. **Tool Safety** - Tools = arbitrary code, treat with caution
4. **Server Trust** - Only use servers from trusted sources

### Claude Code Protections

- Permission prompts before tool use
- Trust verification for new MCP servers
- OAuth 2.1 for remote server authentication

---

## Popular MCP Servers

| Server | Purpose | Install |
|--------|---------|---------|
| GitHub | Code, PRs, issues | `claude mcp add --transport http github https://api.githubcopilot.com/mcp/` |
| Sentry | Error monitoring | `claude mcp add --transport http sentry https://mcp.sentry.dev/mcp` |
| YouTube Transcript | Video transcripts | `claude mcp add --transport stdio yt -- npx -y @kimtaeyoon83/mcp-server-youtube-transcript` |
| Filesystem | Local files | `claude mcp add --transport stdio fs -- npx -y @modelcontextprotocol/server-filesystem /path` |
| PostgreSQL | Database queries | `claude mcp add --transport stdio db -- npx -y @bytebase/dbhub --dsn "..."` |

Find more: [MCP Servers Registry](https://github.com/modelcontextprotocol/servers)

---

## Quick Reference

### Commands

```bash
# Add servers
claude mcp add --transport http <name> <url>
claude mcp add --transport stdio <name> -- <command>

# Manage
claude mcp list
claude mcp get <name>
claude mcp remove <name>

# Import from Claude Desktop
claude mcp add-from-claude-desktop

# Inside Claude Code
/mcp                    # Status & auth
```

### Tool Naming Convention

```
mcp__<server-name>__<tool-name>

Examples:
mcp__github__search_repositories
mcp__youtube__get_transcript
mcp__sentry__get_issues
```

---

## Sources

- [Anthropic MCP Announcement](https://www.anthropic.com/news/model-context-protocol)
- [MCP Specification](https://modelcontextprotocol.io/specification/2025-11-25)
- [IBM: What is MCP](https://www.ibm.com/think/topics/model-context-protocol)
- [MCP Introduction - Phil Schmid](https://www.philschmid.de/mcp-introduction)
- [Complete MCP Guide - KeywordsAI](https://www.keywordsai.co/blog/introduction-to-mcp)
- [MCP Explained - Composio](https://composio.dev/blog/what-is-model-context-protocol-mcp-explained)
