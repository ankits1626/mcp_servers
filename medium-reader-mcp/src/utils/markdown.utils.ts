/**
 * Markdown Utilities for Medium Reader
 *
 * Pure functions for converting Medium content to Markdown.
 * No side effects, no external dependencies.
 */

import type { MediumParagraph, Markup } from "../types/index.js";

/**
 * Apply markup formatting to text
 *
 * Processes markups in reverse order to avoid index shifting.
 *
 * @param text - The original text
 * @param markups - Array of markup objects
 * @returns Text with markdown formatting applied
 */
export function applyMarkups(text: string, markups?: Markup[]): string {
  if (!markups || markups.length === 0) {
    return text;
  }

  let result = text;

  // Sort markups by start position in reverse to avoid index shifting
  const sortedMarkups = [...markups].sort((a, b) => b.start - a.start);

  for (const markup of sortedMarkups) {
    const before = result.substring(0, markup.start);
    const content = result.substring(markup.start, markup.end);
    const after = result.substring(markup.end);

    switch (markup.type) {
      case "A":
        if (markup.href) {
          result = `${before}[${content}](${markup.href})${after}`;
        }
        break;
      case "STRONG":
        result = `${before}**${content}**${after}`;
        break;
      case "EM":
        result = `${before}*${content}*${after}`;
        break;
      case "CODE":
        result = `${before}\`${content}\`${after}`;
        break;
    }
  }

  return result;
}

/**
 * Format text based on paragraph type
 *
 * @param text - The text content
 * @param type - The Medium paragraph type
 * @returns Markdown-formatted text
 */
export function formatByType(text: string, type: string): string {
  switch (type) {
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
 * Convert a Medium paragraph to Markdown
 *
 * @param paragraph - The Medium paragraph object
 * @returns Markdown-formatted string
 *
 * @example
 * paragraphToMarkdown({ text: "Hello", type: "H2" }) // "## Hello"
 */
export function paragraphToMarkdown(paragraph: MediumParagraph): string {
  const textWithMarkups = applyMarkups(paragraph.text, paragraph.markups);
  return formatByType(textWithMarkups, paragraph.type);
}

/**
 * Format an article with metadata header
 *
 * @param title - Article title
 * @param author - Author name (optional)
 * @param date - Publication date (optional)
 * @param wordCount - Word count
 * @param content - Article content
 * @returns Formatted article string
 */
export function formatArticleOutput(
  title: string,
  author: string | null,
  date: string | null,
  wordCount: number,
  content: string
): string {
  return [
    `# ${title}`,
    "",
    author ? `**Author:** ${author}` : null,
    date ? `**Date:** ${date}` : null,
    `**Word count:** ${wordCount}`,
    "",
    "---",
    "",
    content,
  ]
    .filter((line) => line !== null)
    .join("\n");
}
