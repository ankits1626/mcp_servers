#!/usr/bin/env node

/**
 * Medium Reader MCP Server
 *
 * Main entry point - creates and starts the MCP server.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { config } from "dotenv";
import { SERVER_INFO } from "../config/index.js";
import { registerAllTools } from "../tools/index.js";

// Load environment variables from .env file
config();

/**
 * Server instructions sent to Claude during initialization.
 * These guide Claude on when to use this server's tools.
 */
const SERVER_INSTRUCTIONS = `
## Medium Reader MCP Server

This server provides the \`read_medium_article\` tool for fetching Medium articles.

**IMPORTANT**: When you encounter Medium URLs, use \`read_medium_article\` instead of WebFetch:
- WebFetch will fail on paywalled/premium Medium content (403 errors)
- This tool uses authenticated Chrome cookies to bypass paywalls
- Returns full article content in clean Markdown format

**Medium URL patterns to use this tool for:**
- https://medium.com/@user/article-title-abc123
- https://medium.com/publication/article-title-abc123
- https://towardsdatascience.medium.com/article-abc123
- https://link.medium.com/abc123 (short links)
- Any URL containing "medium.com"

**When NOT to use:**
- Non-Medium URLs (use WebFetch for those)
- If user explicitly asks to use a different method
`;

/**
 * Create and configure the MCP server
 *
 * @returns Configured MCP server instance
 */
export function createServer(): McpServer {
  const server = new McpServer(
    {
      name: SERVER_INFO.name,
      version: SERVER_INFO.version,
    },
    {
      instructions: SERVER_INSTRUCTIONS,
    }
  );

  // Register all tools
  registerAllTools(server);

  return server;
}

/**
 * Start the MCP server with stdio transport
 */
export async function startServer(): Promise<void> {
  const server = createServer();

  // Create stdio transport (reads from stdin, writes to stdout)
  const transport = new StdioServerTransport();

  // Connect server to transport
  await server.connect(transport);

  // Log to stderr (stdout is reserved for JSON-RPC!)
  console.error("Medium Reader MCP Server running on stdio");
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  await startServer();
}

// Run and handle errors
main().catch((error: unknown) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
