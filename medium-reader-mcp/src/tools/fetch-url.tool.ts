/**
 * Fetch URL Tool
 *
 * Generic URL fetcher that returns raw HTML/text content.
 * Works with any URL, not just Medium.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

/**
 * Register the fetch_url tool with the MCP server
 *
 * @param server - MCP server instance
 */
export function registerFetchUrlTool(server: McpServer): void {
  server.registerTool(
    "fetch_url",
    {
      title: "Fetch URL",
      description:
        "Fetcher content from a URL and returns the raw HTML/text. Use this to retrieve web pages.",
      inputSchema: {
        url: z.string().url().describe("The URL to fetch"),
        timeout: z
          .number()
          .int()
          .min(1000)
          .max(30000)
          .default(10000)
          .describe("Timeout in milliseconds (default: 10000)"),
      },
    },
    async ({ url, timeout }: { url: string; timeout: number }) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; MCP-Fetcher/1.0)",
            Accept: "text/html,application/xhtml+xml,text/plain,*/*",
          },
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          return {
            content: [
              {
                type: "text" as const,
                text: `HTTP error: ${response.status} ${response.statusText}`,
              },
            ],
            isError: true,
          };
        }

        const text = await response.text();

        return {
          content: [{ type: "text" as const, text }],
        };
      } catch (error) {
        let message: string;
        if (error instanceof Error) {
          if (error.name === "AbortError") {
            message = `Request timed out after ${timeout}ms`;
          } else {
            message = error.message;
          }
        } else {
          message = "Unknown error occurred.";
        }

        return {
          content: [
            {
              type: "text" as const,
              text: `Failed to fetch: ${message}`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
