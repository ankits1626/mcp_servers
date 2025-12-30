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
 * Register the "ping" tool using registerTool (new API)
 *
 * server.registerTool() takes:
 *   1. Tool name (string)
 *   2. Options object { title, description, inputSchema }
 *   3. Handler function (async)
 */
server.registerTool(
  "ping",
  {
    title: "Ping Tool",
    description: "A simple ping tool that returns pong. Use this to test if the server is working.",
    inputSchema: {
      message: z.string().optional().describe("Optional message to include in response")
    }
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