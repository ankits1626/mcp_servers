/**
 * HTML Extractor for Medium Reader
 *
 * Extracts article content from Medium HTML pages.
 * Used as fallback when GraphQL API is unavailable.
 */

import * as cheerio from "cheerio";
import type { ExtractedArticle } from "../types/index.js";

/**
 * Extract title from Medium HTML
 *
 * @param $ - Cheerio instance
 * @returns Article title
 */
function extractTitle($: cheerio.CheerioAPI): string {
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
 *
 * @param $ - Cheerio instance
 * @returns Author name or null
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
 *
 * @param $ - Cheerio instance
 * @returns Date string or null
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

  const publishedTime = $("meta[property='article:published_time']").attr(
    "content"
  );
  if (publishedTime) {
    return publishedTime;
  }

  return null;
}

/**
 * Clean extracted text
 *
 * @param text - Raw text
 * @returns Cleaned text
 */
function cleanText(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/\n\s*\n/g, "\n\n")
    .trim();
}

/**
 * Extract and clean article content from Medium HTML
 *
 * @param $ - Cheerio instance
 * @returns Markdown-formatted content
 */
function extractContent($: cheerio.CheerioAPI): string {
  // Remove noise elements first
  $("script, style, nav, footer, aside, header").remove();
  $("[role='banner'], [role='navigation'], [role='complementary']").remove();
  $(
    "button, [data-testid='headerClapButton'], [data-testid='headerShareButton']"
  ).remove();
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

  article
    .find("h1, h2, h3, h4, h5, h6, p, li, blockquote, pre, figcaption")
    .each((_, el) => {
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
 * Extract article from Medium HTML
 *
 * @param html - Raw HTML string
 * @returns Extracted article with metadata
 */
export function extractArticle(html: string): ExtractedArticle {
  const $ = cheerio.load(html);

  const title = extractTitle($);
  const author = extractAuthor($);
  const date = extractDate($);
  const content = extractContent($);
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  return { title, author, date, content, wordCount };
}
