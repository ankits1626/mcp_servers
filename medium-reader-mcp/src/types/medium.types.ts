/**
 * Markup within a Medium paragraph (bold, links, etc.)
 */
export interface Markup {
  type: string;
  start: number;
  end: number;
  href?: string;
}

/**
 * Medium paragraph from GraphQL API
 */
export interface MediumParagraph {
  text: string;
  type: string;
  markups?: Markup[];
}

/**
 * Medium post from GraphQL API
 */
export interface MediumPost {
  id: string;
  title?: string;
  creator?: {
    name?: string;
  };
  firstPublishedAt?: number;
  content?: {
    bodyModel?: {
      paragraphs?: MediumParagraph[];
    };
  };
}

/**
 * GraphQL API response structure
 */
export interface MediumGraphQLResponse {
  data?: {
    post?: MediumPost;
  };
  errors?: Array<{ message: string }>;
}
