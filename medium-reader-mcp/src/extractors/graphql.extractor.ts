/**
 * GraphQL Extractor for Medium Reader
 *
 * Fetches full article content via Medium's GraphQL API.
 * This bypasses the client-side rendering limitation of HTML fetching.
 */

import { MEDIUM_URLS, GRAPHQL_HEADERS, TIMEOUTS } from "../config/index.js";
import type { MediumGraphQLResponse, GraphQLResult } from "../types/index.js";
import { paragraphToMarkdown, formatArticleOutput } from "../utils/index.js";
import { withRetry, classifyError, isRetryable } from "../services/retry.service.js";

/**
 * GraphQL query to fetch post content
 */
const POST_CONTENT_QUERY = `
  query PostViewerEdgeContentQuery($postId: ID!) {
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
  }
`;

/**
 * Execute GraphQL fetch (single attempt)
 *
 * @param postId - The Medium post ID
 * @param cookieString - Authentication cookies
 * @returns GraphQLResult with content or error
 */
async function executeGraphQLFetch(
  postId: string,
  cookieString: string
): Promise<GraphQLResult> {
  const query = {
    operationName: "PostViewerEdgeContentQuery",
    variables: { postId },
    query: POST_CONTENT_QUERY,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUTS.GRAPHQL);

  try {
    const response = await fetch(MEDIUM_URLS.GRAPHQL, {
      method: "POST",
      headers: {
        ...GRAPHQL_HEADERS,
        Cookie: cookieString,
      },
      body: JSON.stringify(query),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // 5xx errors should trigger retry
      if (response.status >= 500) {
        throw new Error(`SERVER_ERROR_${response.status}`);
      }
      return {
        success: false,
        error: `GraphQL request failed: ${response.status}`,
      };
    }

    const data = (await response.json()) as MediumGraphQLResponse;

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
      .filter((text) => text.trim().length > 0)
      .join("\n\n");

    // Build full article
    const title = post.title || "Untitled";
    const author = post.creator?.name || null;
    const date = post.firstPublishedAt
      ? new Date(post.firstPublishedAt).toISOString().split("T")[0]
      : null;
    const wordCount = markdownContent.split(/\s+/).filter(Boolean).length;

    const output = formatArticleOutput(
      title,
      author,
      date,
      wordCount,
      markdownContent
    );

    return { success: true, content: output, title };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`TIMEOUT_${TIMEOUTS.GRAPHQL}`);
    }

    const message = error instanceof Error ? error.message : "Unknown error";

    // Check if this is a retryable error we threw
    if (message.startsWith("SERVER_ERROR_") || message.startsWith("TIMEOUT_")) {
      throw error; // Re-throw for retry handling
    }

    // Network errors should trigger retry
    const errorType = classifyError(message);
    if (isRetryable(errorType)) {
      throw error;
    }

    return { success: false, error: message };
  }
}

/**
 * Fetch article content via Medium's GraphQL API with retry logic
 *
 * This returns the full content, not just the preview!
 *
 * @param postId - The Medium post ID (extracted from URL)
 * @param cookieString - Authentication cookies
 * @returns GraphQLResult with formatted markdown content or error
 */
export async function fetchViaGraphQL(
  postId: string,
  cookieString: string
): Promise<GraphQLResult> {
  const result = await withRetry(
    async () => {
      const fetchResult = await executeGraphQLFetch(postId, cookieString);

      // If fetch returned a non-success result, check if we should retry
      if (!fetchResult.success) {
        const errorType = classifyError(fetchResult.error || "");
        if (isRetryable(errorType)) {
          throw new Error(fetchResult.error);
        }
        // Return non-retryable errors directly
        return fetchResult;
      }

      return fetchResult;
    },
    { maxRetries: 2 } // Fewer retries for GraphQL since we fall back to HTML
  );

  if (result.success && result.result) {
    return result.result;
  }

  // Handle retry failure
  const errorMessage = result.error || "Unknown error after retries";

  // Parse server error for better message
  if (errorMessage.startsWith("SERVER_ERROR_")) {
    const statusCode = parseInt(errorMessage.replace("SERVER_ERROR_", ""), 10);
    return {
      success: false,
      error: `GraphQL server error (${statusCode}). Will fall back to HTML.`,
    };
  }

  if (errorMessage.startsWith("TIMEOUT_")) {
    return {
      success: false,
      error: `GraphQL request timed out. Will fall back to HTML.`,
    };
  }

  return {
    success: false,
    error: errorMessage,
  };
}
