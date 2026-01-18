import { isMediumUrl } from "./utils.js";
import TurndownService from "turndown";
import * as cheerio from "cheerio";

const turndownService = new TurndownService();

export async function fetchMediumArticle(url, format = "markdown") {
  // Validate URL as per implementation plan
  if (!isMediumUrl(url)) {
    throw new Error("Not a valid Medium URL");
  }

  // Primary method: Fetch via Freedium to bypass 403 errors
  const freediumUrl = `https://freedium.cfd/${url}`;

  try {
    const response = await fetch(freediumUrl);
    if (!response.ok)
      throw new Error(`Failed to fetch: ${response.statusText}`);

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract content
    const title = $("h1").first().text();
    const articleContent = $(".main-content").html() || $("article").html();

    if (format === "markdown") {
      return `# ${title}\n\n${turndownService.turndown(articleContent)}`;
    }
    return articleContent;
  } catch (error) {
    throw new Error(`Fetcher Error: ${error.message}`);
  }
}
