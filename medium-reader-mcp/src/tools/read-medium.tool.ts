/**
 * Read Medium Tool
 *
 * Fetches and extracts clean content from Medium articles.
 * Uses GraphQL API for premium content, falls back to HTML extraction.
 */

import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { isMediumUrl, extractPostId } from "../utils/index.js";
import { formatArticleOutput } from "../utils/markdown.utils.js";
import {
  formatError,
  notMediumUrlError,
  invalidUrlError,
  rateLimitedError,
} from "../utils/error-messages.utils.js";
import { getChromeCookies } from "../services/cookie.service.js";
import { fetchWithAutoAuth } from "../services/http.service.js";
import { consumeRateLimit } from "../services/rate-limiter.service.js";
import { fetchViaGraphQL } from "../extractors/graphql.extractor.js";
import { extractArticle } from "../extractors/html.extractor.js";
import { TIMEOUTS } from "../config/index.js";

/**
 * Register the read_medium tool with the MCP server
 *
 * @param server - MCP server instance
 */
export function registerReadMediumTool(server: McpServer): void {
  server.registerTool(
    "read_medium",
    {
      title: "Read Medium Article",
      description:
        "Fetches and extracts clean content from a Medium article. Uses your Medium subscription cookies for authentication if configured in .env file.",
      inputSchema: {
        url: z.string().url().describe("The Medium article URL to fetch"),
        raw: z
          .boolean()
          .default(false)
          .describe("Return raw HTML instead of extracted text"),
      },
    },
    async ({ url, raw }: { url: string; raw: boolean }) => {
      // Validate URL format
      try {
        new URL(url);
      } catch {
        return {
          content: [
            {
              type: "text" as const,
              text: formatError(invalidUrlError(url)),
            },
          ],
          isError: true,
        };
      }

      // Validate it's a Medium URL
      if (!isMediumUrl(url)) {
        return {
          content: [
            {
              type: "text" as const,
              text: formatError(notMediumUrlError(url)),
            },
          ],
          isError: true,
        };
      }

      // Check rate limit before making any requests
      const rateLimitResult = consumeRateLimit(url);
      if (!rateLimitResult.allowed) {
        console.error(
          `Rate limited: ${rateLimitResult.remaining} remaining, resets in ${rateLimitResult.resetInMs}ms`
        );
        return {
          content: [
            {
              type: "text" as const,
              text: formatError(rateLimitedError(rateLimitResult.resetInMs)),
            },
          ],
          isError: true,
        };
      }

      // Extract post ID for GraphQL API
      const postId = extractPostId(url);

      // Try GraphQL API first (gets full content for premium articles)
      if (postId && !raw) {
        console.error(`Trying GraphQL API for post ID: ${postId}`);
        const chromeCookies = await getChromeCookies();

        if (chromeCookies) {
          const graphqlResult = await fetchViaGraphQL(postId, chromeCookies);
          if (graphqlResult.success && graphqlResult.content) {
            console.error("GraphQL API succeeded - returning full content");
            return {
              content: [{ type: "text" as const, text: graphqlResult.content }],
            };
          }
          console.error(
            `GraphQL failed: ${graphqlResult.error}, falling back to HTML`
          );
        }
      }

      // Fall back to HTML fetch (for raw mode or if GraphQL fails)
      const result = await fetchWithAutoAuth(url, TIMEOUTS.DEFAULT);

      if (result.success && result.content) {
        // Return raw HTML if requested
        if (raw) {
          return {
            content: [{ type: "text" as const, text: result.content }],
          };
        }

        // Extract clean content from HTML
        const article = extractArticle(result.content);

        const output = formatArticleOutput(
          article.title,
          article.author,
          article.date,
          article.wordCount,
          article.content
        );

        return {
          content: [{ type: "text" as const, text: output }],
        };
      }

      // Fetch failed - error already formatted by http.service
      return {
        content: [
          {
            type: "text" as const,
            text: `Failed to fetch Medium article:\n\n${result.error}`,
          },
        ],
        isError: true,
      };
    }
  );
}
