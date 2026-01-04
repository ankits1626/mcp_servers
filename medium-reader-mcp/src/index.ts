#!/usr/bin/env node

/**
 * Medium Reader MCP Server
 *
 * An MCP server for fetching Medium articles with authentication support.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as cheerio from "cheerio";
import { getCookiesPromised } from "chrome-cookies-secure";
import { config } from "dotenv";
import { z } from "zod";

// Load environment variables from .env file
config();

// =============================================================================
// CREATE SERVER INSTANCE
// =============================================================================

const server = new McpServer({
  name: "medium-reader-mcp",
  version: "1.0.0",
});

// =============================================================================
// REGISTER TOOLS
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
// HELPER FUNCTIONS
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
// CHROME COOKIE HELPERS (Phase 6.2)
// =============================================================================

/**
 * Get ALL Medium cookies directly from Chrome's cookie database
 * Uses chrome-cookies-secure to decrypt cookies from Chrome's SQLite DB
 * No browser restart or special flags needed!
 *
 * Returns cookies in "header" format: "name1=value1; name2=value2"
 */
async function getChromeMediumCookies(): Promise<string | null> {
  try {
    console.error("Reading cookies from Chrome...");
    // Get cookies in header format (returns all cookies as a single string)
    const cookies = (await getCookiesPromised(
      "https://medium.com",
      "header"
    )) as string;

    if (cookies && cookies.length > 0) {
      console.error(`Found Medium cookies in Chrome (${cookies.split(';').length} cookies)`);
      return cookies;
    }

    console.error("No Medium cookies found in Chrome. Please login to Medium in Chrome first.");
    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Failed to read Chrome cookies: ${message}`);
    // First time on macOS will prompt for Keychain access
    if (message.includes("security") || message.includes("keychain")) {
      console.error(
        "TIP: If prompted, click 'Always Allow' to grant Keychain access"
      );
    }
    return null;
  }
}

/**
 * Check if an error indicates authentication failure
 */
function isAuthError(error?: string): boolean {
  if (!error) return false;
  return (
    error.includes("403") ||
    error.includes("401") ||
    error.includes("paywall") ||
    error.includes("expired") ||
    error.includes("Authentication failed")
  );
}

/**
 * Fetch Medium article with cookies passed directly
 * This version takes a cookie string directly instead of using env vars
 */
async function fetchMediumArticleWithCookies(
  url: string,
  timeout: number,
  cookieString: string | null
): Promise<{ success: boolean; content?: string; error?: string; authenticated: boolean }> {
  const authenticated = cookieString !== null;
  const headers: Record<string, string> = { ...BROWSER_HEADERS };

  if (cookieString) {
    headers.Cookie = cookieString;
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
      if (response.status === 401 || response.status === 403) {
        if (authenticated) {
          return {
            success: false,
            error: `Authentication failed (${response.status}). Cookies may have expired.`,
            authenticated,
          };
        }
        return {
          success: false,
          error: `Access denied (${response.status}). This article may require a Medium subscription.`,
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

    // Check if we got a paywall page
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
        error: "Article is behind paywall.",
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

/**
 * Fetch Medium article with automatic cookie detection
 * Priority:
 * 1. Try .env cookies first (if configured)
 * 2. Try Chrome cookies (auto-read from database - ALL cookies)
 * 3. Fall back to unauthenticated fetch
 */
async function fetchWithAutoRefresh(
  url: string,
  timeout: number
): Promise<{
  success: boolean;
  content?: string;
  error?: string;
  authenticated: boolean;
}> {
  // 1. Try .env cookies first
  if (hasMediumCookies()) {
    console.error("Using cookies from .env file...");
    const result = await fetchMediumArticle(url, timeout);
    if (result.success) {
      return result;
    }
    // If auth error with .env cookies, try Chrome cookies
    if (isAuthError(result.error)) {
      console.error(".env cookies failed, trying Chrome cookies...");
    } else {
      return result; // Non-auth error, return as-is
    }
  }

  // 2. Try Chrome cookies (all of them, not just sid/uid)
  const chromeCookies = await getChromeMediumCookies();
  if (chromeCookies) {
    console.error("Using ALL cookies from Chrome...");
    const result = await fetchMediumArticleWithCookies(url, timeout, chromeCookies);
    if (result.success) {
      return result;
    }
    console.error(`Chrome cookies failed: ${result.error}`);
  }

  // 3. Fall back to unauthenticated fetch
  console.error("No valid cookies found. Trying unauthenticated fetch...");
  return fetchMediumArticleWithCookies(url, timeout, null);
}

// =============================================================================
// GRAPHQL API (Phase 6.2 - Full Article Content)
// =============================================================================

/**
 * Extract post ID from Medium URL
 * Medium URLs end with the post ID after the last hyphen
 * Example: https://medium.com/.../your-ai-agent-is-failing-b9705dbea706
 *          -> postId = "b9705dbea706"
 */
function extractPostId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    // Post ID is the last segment after the final hyphen
    const match = pathname.match(/-([a-f0-9]+)$/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Medium paragraph types from GraphQL API
 */
interface MediumParagraph {
  text: string;
  type: string;
  markups?: Array<{
    type: string;
    start: number;
    end: number;
    href?: string;
  }>;
}

/**
 * Convert Medium paragraph type to markdown
 */
function paragraphToMarkdown(p: MediumParagraph): string {
  let text = p.text;

  // Apply markups (links, bold, italic, etc.)
  if (p.markups && p.markups.length > 0) {
    // Sort markups by start position in reverse to avoid index shifting
    const sortedMarkups = [...p.markups].sort((a, b) => b.start - a.start);
    for (const markup of sortedMarkups) {
      const before = text.substring(0, markup.start);
      const content = text.substring(markup.start, markup.end);
      const after = text.substring(markup.end);

      if (markup.type === "A" && markup.href) {
        text = `${before}[${content}](${markup.href})${after}`;
      } else if (markup.type === "STRONG") {
        text = `${before}**${content}**${after}`;
      } else if (markup.type === "EM") {
        text = `${before}*${content}*${after}`;
      } else if (markup.type === "CODE") {
        text = `${before}\`${content}\`${after}`;
      }
    }
  }

  // Format based on paragraph type
  switch (p.type) {
    case "H2":
      return `## ${text}`;
    case "H3":
      return `# ${text}`;
    case "H4":
      return `### ${text}`;
    case "P":
      return text;
    case "PRE":
      return `\`\`\`\n${text}\n\`\`\``;
    case "BQ":
    case "PQ":
      return `> ${text}`;
    case "ULI":
      return `- ${text}`;
    case "OLI":
      return `1. ${text}`;
    case "IMG":
      return `*[Image: ${text}]*`;
    case "IFRAME":
      return `*[Embed: ${text}]*`;
    default:
      return text;
  }
}

/**
 * Fetch article content via Medium's GraphQL API
 * This returns the full content, not just the preview!
 */
async function fetchViaGraphQL(
  postId: string,
  cookieString: string
): Promise<{ success: boolean; content?: string; title?: string; error?: string }> {
  const url = "https://medium.com/_/graphql";

  const query = {
    operationName: "PostViewerEdgeContentQuery",
    variables: { postId },
    query: `query PostViewerEdgeContentQuery($postId: ID!) {
      post(id: $postId) {
        id
        title
        content(postMeteringOptions: {}) {
          bodyModel {
            paragraphs {
              text
              type
              markups {
                type
                start
                end
                href
              }
            }
          }
        }
        creator {
          name
        }
        firstPublishedAt
      }
    }`
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cookie": cookieString,
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Origin": "https://medium.com",
      },
      body: JSON.stringify(query),
    });

    if (!response.ok) {
      return { success: false, error: `GraphQL request failed: ${response.status}` };
    }

    const data = await response.json() as {
      data?: {
        post?: {
          title?: string;
          creator?: { name?: string };
          firstPublishedAt?: number;
          content?: {
            bodyModel?: {
              paragraphs?: MediumParagraph[];
            };
          };
        };
      };
      errors?: Array<{ message: string }>;
    };

    if (data.errors && data.errors.length > 0) {
      return { success: false, error: data.errors[0].message };
    }

    const post = data.data?.post;
    if (!post || !post.content?.bodyModel?.paragraphs) {
      return { success: false, error: "No content in GraphQL response" };
    }

    // Convert paragraphs to markdown
    const paragraphs = post.content.bodyModel.paragraphs;
    const markdownContent = paragraphs
      .map(paragraphToMarkdown)
      .filter(text => text.trim().length > 0)
      .join("\n\n");

    // Build full article
    const title = post.title || "Untitled";
    const author = post.creator?.name || null;
    const date = post.firstPublishedAt
      ? new Date(post.firstPublishedAt).toISOString().split("T")[0]
      : null;

    const wordCount = markdownContent.split(/\s+/).filter(Boolean).length;

    const output = [
      `# ${title}`,
      "",
      author ? `**Author:** ${author}` : null,
      date ? `**Date:** ${date}` : null,
      `**Word count:** ${wordCount}`,
      "",
      "---",
      "",
      markdownContent,
    ]
      .filter((line) => line !== null)
      .join("\n");

    return { success: true, content: output, title };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}

// =============================================================================
// CONTENT EXTRACTION (HTML fallback)
// =============================================================================

/**
 * Extracted article structure
 */
interface ExtractedArticle {
  title: string;
  author: string | null;
  date: string | null;
  content: string;
  wordCount: number;
}

/**
 * Extract title from Medium HTML
 */
function extractTitle($: cheerio.CheerioAPI): string {
  // Try multiple selectors in order of reliability
  return (
    $("h1").first().text().trim() ||
    $("title")
      .text()
      .replace(/\s*[-–|].*$/, "")
      .trim() ||
    "Untitled"
  );
}

/**
 * Extract author from Medium HTML
 */
function extractAuthor($: cheerio.CheerioAPI): string | null {
  const author = (
    $("[data-testid='authorName']").first().text() ||
    $("a[rel='author']").first().text() ||
    $("[class*='author'] a").first().text() ||
    $("meta[name='author']").attr("content") ||
    ""
  ).trim();

  return author || null;
}

/**
 * Extract publish date from Medium HTML
 */
function extractDate($: cheerio.CheerioAPI): string | null {
  const timeEl = $("time").first();
  const datetime = timeEl.attr("datetime");
  if (datetime) {
    return datetime;
  }

  const timeText = timeEl.text().trim();
  if (timeText) {
    return timeText;
  }

  // Try meta tags
  const publishedTime = $("meta[property='article:published_time']").attr("content");
  if (publishedTime) {
    return publishedTime;
  }

  return null;
}

/**
 * Extract and clean article content from Medium HTML
 */
function extractContent($: cheerio.CheerioAPI): string {
  // Remove noise elements first
  $("script, style, nav, footer, aside, header").remove();
  $("[role='banner'], [role='navigation'], [role='complementary']").remove();
  $("button, [data-testid='headerClapButton'], [data-testid='headerShareButton']").remove();
  $("[class*='metabar'], [class*='sidebar'], [class*='footer']").remove();

  // Find the article body
  const article = $("article").first();

  if (article.length === 0) {
    // Fallback: try to find main content area
    const main = $("main").first();
    if (main.length > 0) {
      return cleanText(main.text());
    }
    return cleanText($("body").text());
  }

  // Extract text from content elements, preserving structure
  const paragraphs: string[] = [];

  article.find("h1, h2, h3, h4, h5, h6, p, li, blockquote, pre, figcaption").each((_, el) => {
    const $el = $(el);
    const tagName = el.tagName.toLowerCase();
    let text = $el.text().trim();

    if (!text) return;

    // Add markdown-style formatting for headings
    if (tagName === "h1") {
      text = `# ${text}`;
    } else if (tagName === "h2") {
      text = `## ${text}`;
    } else if (tagName === "h3") {
      text = `### ${text}`;
    } else if (tagName === "h4") {
      text = `#### ${text}`;
    } else if (tagName === "blockquote") {
      text = `> ${text}`;
    } else if (tagName === "li") {
      text = `• ${text}`;
    } else if (tagName === "pre") {
      text = `\`\`\`\n${text}\n\`\`\``;
    }

    paragraphs.push(text);
  });

  return paragraphs.join("\n\n");
}

/**
 * Clean extracted text
 */
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, " ") // Normalize whitespace
    .replace(/\n\s*\n/g, "\n\n") // Normalize paragraph breaks
    .trim();
}

/**
 * Extract article from Medium HTML
 */
function extractArticle(html: string): ExtractedArticle {
  const $ = cheerio.load(html);

  const title = extractTitle($);
  const author = extractAuthor($);
  const date = extractDate($);
  const content = extractContent($);
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  return { title, author, date, content, wordCount };
}

// =============================================================================
// MEDIUM-SPECIFIC TOOL
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
      "Fetches and extracts clean content from a Medium article. Uses your Medium subscription cookies for authentication if configured in .env file.",
    inputSchema: {
      url: z.string().url().describe("The Medium article URL to fetch"),
      raw: z.boolean().default(false).describe("Return raw HTML instead of extracted text"),
    },
  },
  async ({ url, raw }: { url: string; raw: boolean }) => {
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

    // Extract post ID for GraphQL API
    const postId = extractPostId(url);

    // Try GraphQL API first (gets full content for premium articles)
    if (postId && !raw) {
      console.error(`Trying GraphQL API for post ID: ${postId}`);
      const chromeCookies = await getChromeMediumCookies();

      if (chromeCookies) {
        const graphqlResult = await fetchViaGraphQL(postId, chromeCookies);
        if (graphqlResult.success && graphqlResult.content) {
          console.error("GraphQL API succeeded - returning full content");
          return {
            content: [{ type: "text" as const, text: graphqlResult.content }],
          };
        }
        console.error(`GraphQL failed: ${graphqlResult.error}, falling back to HTML`);
      }
    }

    // Fall back to HTML fetch (for raw mode or if GraphQL fails)
    const result = await fetchWithAutoRefresh(url, 15000);

    if (result.success && result.content) {
      // Return raw HTML if requested
      if (raw) {
        return {
          content: [{ type: "text" as const, text: result.content }],
        };
      }

      // Extract clean content from HTML
      const article = extractArticle(result.content);

      const output = [
        `# ${article.title}`,
        "",
        article.author ? `**Author:** ${article.author}` : null,
        article.date ? `**Date:** ${article.date}` : null,
        `**Word count:** ${article.wordCount}`,
        "",
        "---",
        "",
        article.content,
      ]
        .filter((line) => line !== null)
        .join("\n");

      return {
        content: [{ type: "text" as const, text: output }],
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
// START THE SERVER
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
