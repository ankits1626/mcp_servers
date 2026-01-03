#!/usr/bin/env node

/**
 * Medium Reader MCP Server
 *
 * An MCP server for fetching Medium articles with authentication support.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { config } from "dotenv";
import { z } from "zod";

// Load environment variables from .env file
config();

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
    description: "Echoes back text with optional transformations. Use for testing input handling.",
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

// =============================================================================
// 3. HELPER FUNCTIONS
// =============================================================================

/**
 * Browser-like headers to avoid bot detection
 */
const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
};

/**
 * Check if a URL is a Medium article URL
 */
function isMediumUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    const hostname = url.hostname.toLowerCase();

    return (
      hostname === "medium.com" ||
      hostname.endsWith(".medium.com") ||
      hostname === "link.medium.com"
    );
  } catch {
    return false;
  }
}

/**
 * Get Medium authentication cookies from environment variables
 * Returns null if not configured
 */
function getMediumCookies(): string | null {
  const sid = process.env.MEDIUM_SID;
  const uid = process.env.MEDIUM_UID;

  if (!sid || !uid) {
    return null;
  }

  return `sid=${sid}; uid=${uid}`;
}

/**
 * Check if Medium cookies are configured
 */
function hasMediumCookies(): boolean {
  return getMediumCookies() !== null;
}

/**
 * Fetch a Medium article with optional authentication
 */
async function fetchMediumArticle(
  url: string,
  timeout: number
): Promise<{ success: boolean; content?: string; error?: string; authenticated: boolean }> {
  const cookies = getMediumCookies();
  const authenticated = cookies !== null;

  const headers: Record<string, string> = { ...BROWSER_HEADERS };

  if (cookies) {
    headers.Cookie = cookies;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      signal: controller.signal,
      headers,
      redirect: "follow",
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Check for auth-related errors
      if (response.status === 401 || response.status === 403) {
        if (authenticated) {
          return {
            success: false,
            error: `Authentication failed (${response.status}). Your cookies may have expired. Please refresh them from your browser.`,
            authenticated,
          };
        }
        return {
          success: false,
          error: `Access denied (${response.status}). This article may require a Medium subscription. Configure MEDIUM_SID and MEDIUM_UID in .env file.`,
          authenticated,
        };
      }
      return {
        success: false,
        error: `HTTP ${response.status} ${response.statusText}`,
        authenticated,
      };
    }

    const content = await response.text();

    // Check if we got a paywall page instead of real content
    if (content.includes("Get unlimited access") || content.includes("Read without limits")) {
      if (authenticated) {
        return {
          success: false,
          error: "Got paywall despite authentication. Cookies may have expired.",
          authenticated,
        };
      }
      return {
        success: false,
        error: "Article is behind paywall. Configure MEDIUM_SID and MEDIUM_UID in .env file.",
        authenticated,
      };
    }

    return { success: true, content, authenticated };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return {
        success: false,
        error: `Request timed out after ${timeout}ms`,
        authenticated,
      };
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message, authenticated };
  }
}

// =============================================================================
// 4. MEDIUM-SPECIFIC TOOL
// =============================================================================

/**
 * Read Medium Article Tool
 *
 * Fetches Medium articles using cookie-based authentication
 */
server.registerTool(
  "read_medium",
  {
    title: "Read Medium Article",
    description:
      "Fetches and returns the content of a Medium article. Uses your Medium subscription cookies for authentication if configured in .env file.",
    inputSchema: {
      url: z.string().url().describe("The Medium article URL to fetch"),
    },
  },
  async ({ url }: { url: string }) => {
    // Validate it's a Medium URL
    if (!isMediumUrl(url)) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Not a Medium URL: ${url}. This tool only works with medium.com articles.`,
          },
        ],
        isError: true,
      };
    }

    // Log auth status to stderr (for debugging)
    const hasAuth = hasMediumCookies();
    console.error(
      hasAuth
        ? "Fetching Medium article with authentication..."
        : "Warning: No Medium cookies configured. May hit paywall."
    );

    // Fetch the article
    const result = await fetchMediumArticle(url, 15000);

    if (result.success && result.content) {
      const authNote = result.authenticated ? "(authenticated)" : "(unauthenticated)";
      return {
        content: [
          {
            type: "text" as const,
            text: `<!-- Fetched ${authNote} -->\n${result.content}`,
          },
        ],
      };
    }

    // Fetch failed
    return {
      content: [
        {
          type: "text" as const,
          text: `Failed to fetch Medium article: ${result.error}`,
        },
      ],
      isError: true,
    };
  }
);

// =============================================================================
// 5. START THE SERVER
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
