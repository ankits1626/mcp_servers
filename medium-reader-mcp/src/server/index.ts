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
 * Create and configure the MCP server
 *
 * @returns Configured MCP server instance
 */
export function createServer(): McpServer {
  const server = new McpServer({
    name: SERVER_INFO.name,
    version: SERVER_INFO.version,
  });

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
