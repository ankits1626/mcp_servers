/**
 * GraphQL Extractor for Medium Reader
 *
 * Fetches full article content via Medium's GraphQL API.
 * This bypasses the client-side rendering limitation of HTML fetching.
 */

import { MEDIUM_URLS, GRAPHQL_HEADERS } from "../config/index.js";
import type { MediumGraphQLResponse, GraphQLResult } from "../types/index.js";
import { paragraphToMarkdown, formatArticleOutput } from "../utils/index.js";

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
 * Fetch article content via Medium's GraphQL API
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
  const query = {
    operationName: "PostViewerEdgeContentQuery",
    variables: { postId },
    query: POST_CONTENT_QUERY,
  };

  try {
    const response = await fetch(MEDIUM_URLS.GRAPHQL, {
      method: "POST",
      headers: {
        ...GRAPHQL_HEADERS,
        Cookie: cookieString,
      },
      body: JSON.stringify(query),
    });

    if (!response.ok) {
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
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}
