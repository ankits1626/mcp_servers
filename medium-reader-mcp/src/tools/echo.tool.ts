/**
 * Echo Tool
 *
 * Echoes back text with optional transformations.
 * Demonstrates required vs optional parameters, defaults, and constraints.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Register the echo tool with the MCP server
 *
 * @param server - MCP server instance
 */
export function registerEchoTool(server: McpServer): void {
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
    async ({
      text,
      uppercase,
      repeat,
    }: {
      text: string;
      uppercase: boolean;
      repeat: number;
    }) => {
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
}
