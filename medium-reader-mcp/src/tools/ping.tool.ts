/**
 * Ping Tool
 *
 * A simple tool to test if the server is working.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Register the ping tool with the MCP server
 *
 * @param server - MCP server instance
 */
export function registerPingTool(server: McpServer): void {
  server.registerTool(
    "ping",
    {
      title: "Ping Tool",
      description:
        "A simple ping tool that returns pong. Use this to test if the server is working.",
      inputSchema: {
        message: z
          .string()
          .optional()
          .describe("Optional message to include in response"),
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
}
