# MCP Learning Plan - Medium Reader Project

A phased approach to learn MCP by building a Medium article reader.

---

## Phase 0: Understand MCP Fundamentals (Theory)

**Goal**: Understand the "why" and "how" before writing code

### Topics to Cover:
1. What problem does MCP solve?
2. MCP architecture: Hosts, Clients, Servers
3. The JSON-RPC protocol - what messages look like
4. Transport mechanisms (stdio vs SSE vs HTTP)
5. MCP primitives: Tools, Resources, Prompts
6. Lifecycle: initialization → capability exchange → operation

### Deliverable:
- No code, just solid mental model
- You should be able to explain MCP to someone else

### Status: [ ] Not Started

---

## Phase 1: Minimal MCP Server (Hello World)

**Goal**: Smallest possible working MCP server

### What We Build:
- Server that responds to `initialize` and `tools/list`
- One dummy tool: `ping` → returns "pong"
- No external dependencies beyond MCP SDK

### Test:
```bash
# Run server manually, send JSON-RPC via stdin, see response
echo '{"jsonrpc":"2.0","id":1,"method":"initialize"...}' | node src/index.js
```

### Learn:
- MCP SDK basics (Server, Transport)
- Tool registration pattern
- How Claude Code discovers tools

### Status: [ ] Not Started

---

## Phase 2: Add Tool Execution

**Goal**: Make the tool actually do something

### What We Build:
- Handle `tools/call` request
- `ping` tool accepts input: `{ "message": "hello" }`
- Returns: `"pong: hello"`

### Test:
```bash
# Send tool/call request, verify response
```

### Learn:
- Input schema definition
- Request/response handling
- Error responses

### Status: [ ] Not Started

---

## Phase 3: Connect to Claude Code

**Goal**: See our server work inside Claude Code

### What We Build:
- Nothing new - just configuration

### Test:
```bash
claude mcp add medium-reader -- node /path/to/src/index.js
# Then in Claude Code: "use the ping tool"
```

### Learn:
- How Claude Code discovers MCP servers
- The `claude mcp` commands
- Debugging MCP connections

### Status: [ ] Not Started

---

## Phase 4: HTTP Fetching

**Goal**: Add real network capability

### What We Build:
- New tool: `fetch_url` - fetches any URL and returns content
- Uses native `fetch()`
- Returns raw HTML

### Test:
- In Claude Code: "fetch https://example.com"
- Verify HTML returned

### Learn:
- Async operations in MCP tools
- Returning larger content
- Error handling for network failures

### Status: [ ] Not Started

---

## Phase 5: Medium-Specific Fetching

**Goal**: Handle Medium's 403 problem

### What We Build:
- URL validation (is it a Medium URL?)
- Freedium proxy integration
- Fallback to direct fetch with headers

### Test:
- Fetch a real Medium article URL
- Verify content returned (even if messy HTML)

### Learn:
- Multi-strategy fetching
- URL transformation
- Handling external service failures

### Status: [ ] Not Started

---

## Phase 6: Content Extraction

**Goal**: Clean article content from HTML

### What We Build:
- Add `cheerio` for HTML parsing
- Extract: title, author, article body
- Remove: ads, nav, comments, related articles

### Test:
- Fetch Medium article → get clean HTML with just article content

### Learn:
- HTML parsing with cheerio
- DOM traversal and selection
- Content extraction strategies

### Status: [ ] Not Started

---

## Phase 7: Markdown Conversion

**Goal**: Return clean, readable markdown

### What We Build:
- Add `turndown` for HTML→Markdown
- Configure for code blocks, images, links
- Format output nicely

### Test:
- Full flow: URL → Freedium → Parse → Markdown
- Readable article in Claude Code

### Learn:
- HTML to Markdown conversion
- Output formatting
- The complete tool implementation

### Status: [ ] Not Started

---

## Phase 8: Polish & Edge Cases

**Goal**: Production-ready quality

### What We Build:
- Proper error messages
- Rate limiting / retry logic
- Very long article handling
- Multiple output formats (markdown/text/html)

### Test:
- Various Medium URL formats
- Error cases (invalid URL, 404, timeout)

### Learn:
- Robust error handling
- User-friendly error messages
- Configuration options

### Status: [ ] Not Started

---

## Summary Table

| Phase | Focus | New Concept | Testable Output |
|-------|-------|-------------|-----------------|
| 0 | Theory | MCP architecture | Mental model |
| 1 | Hello World | SDK basics | Server responds to init |
| 2 | Tool execution | Input/output handling | ping → pong |
| 3 | Integration | Claude Code config | Works in Claude |
| 4 | HTTP | Async network calls | Fetch any URL |
| 5 | Medium fetch | Proxy strategies | Get Medium HTML |
| 6 | Parsing | cheerio/DOM | Clean article HTML |
| 7 | Markdown | turndown | Readable output |
| 8 | Polish | Error handling | Production ready |

---

## Progress Log

### Session 1 - [Date]
- Created learning plan
- Next: Phase 0 - MCP Theory

---

*This document tracks our learning journey through MCP.*
