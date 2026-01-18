# Phase 0: MCP Fundamentals

> **Goal**: Build a solid mental model of MCP before writing any code.
>
> **Deliverable**: You should be able to explain MCP to someone else.

---

## 1. What Problem Does MCP Solve?

### The Problem: Integration Hell

Before MCP, connecting AI assistants to external tools was fragmented:

```
                    ┌─────────────┐
                    │   Claude    │──── Custom Plugin A
                    └─────────────┘──── Custom Plugin B
                                  ──── Custom Plugin C
                    ┌─────────────┐
                    │   ChatGPT   │──── Different Plugin A
                    └─────────────┘──── Different Plugin B
                                  ──── Different Plugin C
                    ┌─────────────┐
                    │   Other AI  │──── Yet Another Plugin A
                    └─────────────┘──── Yet Another Plugin B
```

**Problems**:
- Each AI needed custom integrations
- Tool developers had to build for each platform
- No standard way to expose capabilities
- Security/permissions handled differently everywhere

### The Solution: Universal Standard

MCP provides a **single protocol** that any AI can use to connect to any tool:

```
                    ┌─────────────┐
                    │   Claude    │───┐
                    └─────────────┘   │
                    ┌─────────────┐   │    ┌─────────────┐
                    │   ChatGPT   │───┼────│ MCP Server  │
                    └─────────────┘   │    │ (Any Tool)  │
                    ┌─────────────┐   │    └─────────────┘
                    │   Other AI  │───┘
                    └─────────────┘
                         ALL use MCP Protocol
```

**Think of MCP like USB**:
- Before USB: Every device needed a different port
- After USB: One standard port works for everything
- MCP = "USB for AI integrations"

---

## 2. MCP Architecture: Hosts, Clients, Servers

### The Three Participants

```
┌─────────────────────────────────────────────────────────────┐
│                        MCP HOST                             │
│              (Claude Desktop, Claude Code, VS Code)         │
│                                                             │
│   ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│   │  Client  │    │  Client  │    │  Client  │              │
│   │    1     │    │    2     │    │    3     │              │
│   └────┬─────┘    └────┬─────┘    └────┬─────┘              │
└────────┼───────────────┼───────────────┼─────────────────-──┘
         │               │               │
         │ stdio         │ stdio         │ HTTP
         │               │               │
    ┌────▼─────┐    ┌────▼─────┐    ┌────▼─────┐
    │  Server  │    │  Server  │    │  Server  │
    │(Filesys) │    │ (GitHub) │    │ (Sentry) │
    │  LOCAL   │    │  LOCAL   │    │  REMOTE  │
    └──────────┘    └──────────┘    └──────────┘
```

### Definitions

| Component | What It Is | Examples |
|-----------|------------|----------|
| **Host** | The AI application that users interact with | Claude Desktop, Claude Code, VS Code with Copilot |
| **Client** | A connector inside the Host (one per Server) | Internal component - you don't build this |
| **Server** | A program that exposes tools/resources to AI | Our `medium-reader-mcp` server! |

### Key Insight

**You are building an MCP Server**. The Host (Claude Code) and Client are already built - you just need to create a Server that speaks the MCP protocol.

### How Does the Host Know About Servers?

The host **doesn't magically know** - it reads from a **configuration file** where you explicitly register servers.

#### Example: Adding Our Server to Claude Code

When you run:
```bash
claude mcp add medium-reader -- node /path/to/src/index.js
```

This creates an entry in `~/.claude.json`:

```json
{
  "mcpServers": {
    "medium-reader": {
      "command": "node",
      "args": ["/path/to/src/index.js"],
      "transport": "stdio"
    }
  }
}
```

#### Example: Remote Server (HTTP)

```json
{
  "mcpServers": {
    "sentry": {
      "url": "https://mcp.sentry.io/sse",
      "transport": "sse",
      "headers": {
        "Authorization": "Bearer xxx"
      }
    }
  }
}
```

#### The Discovery Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  1. Host starts (Claude Code launches)                          │
│                         │                                       │
│  2. Reads config file   ▼                                       │
│     "medium-reader": {                                          │
│       command: "node",     ──► "This is stdio transport!"       │
│       args: ["/path..."]       "I need to spawn a child process"│
│     }                                                           │
│                         │                                       │
│  3. Spawns process      ▼                                       │
│     $ node /path/to/src/index.js                                │
│                         │                                       │
│  4. Connects stdin/stdout and sends "initialize"                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. The JSON-RPC Protocol

MCP uses **JSON-RPC 2.0** - a simple protocol for remote procedure calls.

### Message Types

#### 1. Request (expects a response)
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

#### 2. Response (reply to a request)
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [...]
  }
}
```

#### 3. Notification (no response expected)
```json
{
  "jsonrpc": "2.0",
  "method": "notifications/tools/list_changed"
}
```

#### 4. Error Response
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32600,
    "message": "Invalid Request"
  }
}
```

### Why JSON-RPC?

- **Simple**: Just JSON over any transport
- **Stateless messages**: Each message is self-contained
- **Proven**: Used by Language Server Protocol (LSP) for years
- **Language agnostic**: Works with any programming language

---

## 4. What is LSP? (MCP's Inspiration)

MCP was **inspired by LSP** (Language Server Protocol). Understanding LSP helps understand MCP.

### The Problem LSP Solved (2016)

Before LSP, every IDE needed custom integration for every language:

```
         VS Code ──── Custom C++ support
                 ──── Custom Python support
                 ──── Custom TypeScript support

         IntelliJ ─── Different C++ support
                 ──── Different Python support
                 ──── Different TypeScript support

         Vim ──────── Yet another C++ support
                 ──── Yet another Python support
```

**M editors × N languages = M×N integrations** 😱

### LSP Solution

One protocol - any editor can talk to any language server:

```
┌──────────┐                      ┌──────────────────┐
│ VS Code  │◄────── LSP ─────────►│ Python Language  │
│          │                      │     Server       │
└──────────┘                      └──────────────────┘
     ▲                                    ▲
     │                                    │
     │ same                          same │
     │ protocol                   server! │
     ▼                                    │
┌──────────┐                              │
│   Vim    │◄────── LSP ──────────────────┘
└──────────┘
```

### What LSP Provides

| Feature | What It Does |
|---------|--------------|
| Go to definition | Jump to where a function is defined |
| Autocomplete | Suggest completions as you type |
| Hover info | Show docs when hovering over code |
| Find references | Find all usages of a symbol |
| Diagnostics | Show errors/warnings |

### LSP → MCP Comparison

| Aspect | LSP | MCP |
|--------|-----|-----|
| **Purpose** | Connect editors ↔ language tools | Connect AI ↔ external tools |
| **Protocol** | JSON-RPC 2.0 | JSON-RPC 2.0 |
| **Transport** | stdio, TCP | stdio, HTTP/SSE |
| **Created by** | Microsoft (2016) | Anthropic (2024) |

The MCP creators explicitly said: *"We looked at LSP and thought - this worked great for editors, let's do the same for AI."*

---

## 5. Transport Mechanisms (stdio vs HTTP)

Transport = How JSON-RPC messages flow between Client and Server

### Option 1: stdio (Standard Input/Output)

```
┌────────────┐                    ┌────────────┐
│   Client   │ ── stdin ────────► │   Server   │
│            │ ◄─ stdout ──────── │  (Process) │
└────────────┘                    └────────────┘
```

**How it works**:
- Host spawns Server as a child process
- Client writes JSON to Server's stdin
- Server writes JSON to its stdout
- Simple, no network, no ports

**Use for**: Local servers (filesystem, local databases)

**This is what we'll use** for `medium-reader-mcp`!

### Option 2: Streamable HTTP (SSE)

```
┌────────────┐                    ┌────────────┐
│   Client   │ ── HTTP POST ────► │   Server   │
│            │ ◄─ SSE stream ──── │  (Remote)  │
└────────────┘                    └────────────┘
```

**How it works**:
- Client sends requests via HTTP POST
- Server responds via Server-Sent Events (SSE)
- Can use bearer tokens for auth

**Use for**: Remote servers (cloud APIs, SaaS integrations)

---

## 6. MCP Primitives: Tools, Resources, Prompts

Servers expose capabilities through three **primitives**:

### Tools (We'll use this!)

**What**: Functions the AI can execute

```json
{
  "name": "read_medium_article",
  "description": "Fetch a Medium article's content",
  "inputSchema": {
    "type": "object",
    "properties": {
      "url": { "type": "string" }
    },
    "required": ["url"]
  }
}
```

**Key points**:
- AI decides when to call them
- Require user consent before execution
- Return structured content

### Resources

**What**: Data the AI can read (like files)

```json
{
  "uri": "file:///project/readme.md",
  "name": "README",
  "mimeType": "text/markdown"
}
```

**Key points**:
- Read-only data access
- URI-based addressing
- Good for file systems, databases

### Prompts

**What**: Reusable prompt templates

```json
{
  "name": "code_review",
  "description": "Review code for issues",
  "arguments": [
    { "name": "language", "required": true }
  ]
}
```

**Key points**:
- Pre-defined interaction patterns
- Can include arguments
- User-triggered (not AI-triggered)

### For Our Project

We'll implement **one Tool**: `read_medium_article`

Resources and Prompts are optional - not needed for our use case.

---

## 7. MCP Lifecycle

The complete flow from connection to operation:

```
    CLIENT                              SERVER
       │                                   │
       │─────── initialize ───────────────►│
       │        {protocolVersion,          │
       │         capabilities,             │
       │         clientInfo}               │
       │                                   │
       │◄────── response ─────────────────│
       │        {protocolVersion,          │
       │         capabilities,             │
       │         serverInfo}               │
       │                                   │
       │─────── initialized ──────────────►│
       │        (notification)             │
       │                                   │
       │         === READY ===             │
       │                                   │
       │─────── tools/list ───────────────►│
       │                                   │
       │◄────── {tools: [...]} ───────────│
       │                                   │
       │─────── tools/call ───────────────►│
       │        {name, arguments}          │
       │                                   │
       │◄────── {content: [...]} ─────────│
       │                                   │
```

### Step by Step

1. **Initialize**: Client sends protocol version and capabilities
2. **Response**: Server responds with its version and capabilities
3. **Initialized**: Client confirms ready (notification)
4. **Operation**: Client can now call tools/list, tools/call, etc.

### Capability Negotiation

During `initialize`, both sides declare what they support:

**Client might say**: "I support sampling and roots"
**Server might say**: "I support tools and resources"

This allows graceful degradation - old clients work with new servers.

---

## 8. Protocol Version (2025)

### Latest Version: `2025-11-25`

The MCP spec is actively evolving. Key additions in 2025:

| Feature | Description |
|---------|-------------|
| **Streamable HTTP** | New transport replacing HTTP+SSE |
| **OAuth 2.1** | Standardized authorization |
| **Elicitation** | Server can request user input |
| **Tool Annotations** | Better hints for AI (readOnly, destructive, etc.) |
| **Audio Content** | Support for audio data in responses |

### Version Negotiation

Client and Server agree on a version during `initialize`:

```json
// Client sends
{ "protocolVersion": "2025-11-25" }

// Server responds with version it supports
{ "protocolVersion": "2025-06-18" }

// They use the lower common version
```

---

## 9. Security Model

MCP has explicit security principles:

### User Consent

- **Tools require explicit consent** before execution
- User must approve AI actions
- Clear UI for reviewing what tools can do

### Data Privacy

- No user data transmitted without consent
- Servers should document what data they access
- Hosts should provide access controls

### Tool Safety

- Tool descriptions are considered **untrusted**
- Don't blindly trust what a tool claims to do
- Validate inputs and outputs

---

## 10. Summary: Mental Model

```
┌─────────────────────────────────────────────────────────────┐
│                     THE BIG PICTURE                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  USER ──► HOST (Claude Code)                                │
│              │                                              │
│              ▼                                              │
│           CLIENT ◄──── JSON-RPC over stdio ────► SERVER     │
│                                                    │        │
│                                              OUR CODE!      │
│                                                    │        │
│                                                    ▼        │
│                                              TOOLS:         │
│                                              - read_medium  │
│                                                _article     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Key Takeaways

1. **MCP = Standard protocol** for AI ↔ Tool communication
2. **We build a Server** that exposes tools via JSON-RPC
3. **stdio transport** = our server runs as a child process
4. **Tools** = functions the AI can call
5. **Lifecycle** = initialize → capability exchange → operation

---

## 11. What's Next?

Now that you understand MCP conceptually, we'll build it:

**Phase 1**: Create a minimal MCP server that responds to `initialize` and exposes a `ping` tool.

This will make the theory concrete!

---

## References

- [MCP Architecture Overview](https://modelcontextprotocol.io/docs/learn/architecture)
- [MCP Specification 2025-11-25](https://modelcontextprotocol.io/specification/2025-11-25)
- [Anthropic MCP Announcement](https://www.anthropic.com/news/model-context-protocol)
- [MCP GitHub Repository](https://github.com/modelcontextprotocol/modelcontextprotocol)
- [Why MCP uses JSON-RPC](https://medium.com/@dan.avila7/why-model-context-protocol-uses-json-rpc-64d466112338)

---

**Status**: ✅ Complete

**Next**: [Phase 1 - Minimal MCP Server](./PHASE_1_HELLO_WORLD.md)
