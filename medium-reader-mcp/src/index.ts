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
  name: "medium-reader-mcp",
  version: "1.0.0",
});

// =============================================================================
// 2. REGISTER TOOLS
// =============================================================================

/**
 * Register the "ping" tool
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
      message: z.string().optional().describe("Optional message to include in response"),
    },
  },
  async ({ message }: { message?: string }) => {
    const response = message ? `pong: ${message}` : "pong";

    return {
      content: [
        {
          type: "text" as const,
          text: response,
        },
      ],
    };
  }
);

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

// =============================================================================
// 3. START THE SERVER
// =============================================================================

async function main(): Promise<void> {
  // Create stdio transport (reads from stdin, writes to stdout)
  const transport = new StdioServerTransport();

  // Connect server to transport
  await server.connect(transport);

  // Log to stderr (stdout is reserved for JSON-RPC!)
  console.error("Medium Reader MCP Server running on stdio");
}

// Run and handle errors
main().catch((error: unknown) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
