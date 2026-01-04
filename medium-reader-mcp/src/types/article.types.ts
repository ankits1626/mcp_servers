/**
 * Extracted article structure from Medium
 */
export interface ExtractedArticle {
  title: string;
  author: string | null;
  date: string | null;
  content: string;
  wordCount: number;
}

/**
 * Result of fetching an article
 */
export interface FetchResult {
  success: boolean;
  content?: string;
  error?: string;
  authenticated: boolean;
}

/**
 * Result of GraphQL fetch
 */
export interface GraphQLResult {
  success: boolean;
  content?: string;
  title?: string;
  error?: string;
}
