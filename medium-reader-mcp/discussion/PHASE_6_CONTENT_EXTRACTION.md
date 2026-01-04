# Phase 6: Content Extraction

> **Goal**: Parse HTML and extract clean article content using cheerio

---

## Table of Contents

1. [The Problem: Raw HTML is Messy](#1-the-problem-raw-html-is-messy)
2. [What is Cheerio?](#2-what-is-cheerio)
3. [How HTML Parsing Works](#3-how-html-parsing-works)
4. [CSS Selectors Crash Course](#4-css-selectors-crash-course)
5. [Medium's HTML Structure](#5-mediums-html-structure)
6. [Extraction Strategy](#6-extraction-strategy)
7. [Implementation Guide](#7-implementation-guide)
8. [Testing Strategy](#8-testing-strategy)

---

## 1. The Problem: Raw HTML is Messy

When we fetch a Medium article, we get the **entire HTML page**:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Article Title - Medium</title>
  <script>/* analytics, tracking, etc. */</script>
  <style>/* thousands of lines of CSS */</style>
</head>
<body>
  <nav><!-- Navigation, logo, sign-in buttons --></nav>
  <header><!-- Author info, claps, share buttons --></header>

  <article>
    <!-- THE ACTUAL CONTENT WE WANT -->
    <h1>Article Title</h1>
    <p>The actual article text...</p>
  </article>

  <aside><!-- Related articles, recommendations --></aside>
  <footer><!-- More links, copyright --></footer>
  <script>/* More JavaScript */</script>
</body>
</html>
```

### What We Want vs What We Get

| We Get | We Want |
|--------|---------|
| ~500KB of HTML | ~10KB of content |
| Navigation, headers, footers | Just the article |
| Scripts, styles, tracking | Clean text |
| Ads, recommendations | Title, author, body |
| Complex nested divs | Simple structure |

---

## 2. What is Cheerio?

[Cheerio](https://cheerio.js.org/) is a fast, flexible HTML parsing library for Node.js. It provides a **jQuery-like API** for traversing and manipulating HTML.

### Why Cheerio?

| Feature | Benefit |
|---------|---------|
| **jQuery-like syntax** | Familiar if you know web dev |
| **Server-side** | Works in Node.js (no browser needed) |
| **Fast** | Much faster than browser-based parsing |
| **Lightweight** | Small package, few dependencies |
| **No JS execution** | Just parses HTML structure |

### Basic Usage

```typescript
import * as cheerio from "cheerio";

// Load HTML into cheerio
const html = "<html><body><h1>Hello</h1><p>World</p></body></html>";
const $ = cheerio.load(html);

// Select elements (just like jQuery!)
const title = $("h1").text();        // "Hello"
const paragraph = $("p").text();     // "World"

// More complex selections
$("article p").each((i, el) => {
  console.log($(el).text());
});
```

### The `$` Convention

The `$` variable name is a convention from jQuery. It's the "query function" that lets you select elements:

```typescript
const $ = cheerio.load(html);

// $ is now a function that finds elements
$("h1")           // Find all <h1> elements
$(".author")      // Find elements with class "author"
$("#main")        // Find element with id "main"
$("article > p")  // Find <p> directly inside <article>
```

---

## 3. How HTML Parsing Works

### The DOM Tree

HTML is a tree structure (DOM = Document Object Model):

```
┌─────────────────────────────────────────────────────────────────┐
│                        HTML AS A TREE                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   <html>                                                         │
│   ├── <head>                                                     │
│   │   ├── <title>                                               │
│   │   └── <style>                                               │
│   └── <body>                                                     │
│       ├── <nav>                                                  │
│       ├── <article>                    ◄── We want this!        │
│       │   ├── <h1>Title</h1>                                    │
│       │   ├── <p>First paragraph</p>                            │
│       │   ├── <p>Second paragraph</p>                           │
│       │   └── <figure>                                          │
│       │       └── <img src="...">                               │
│       └── <footer>                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Parsing Steps

```
┌─────────────────────────────────────────────────────────────────┐
│                     HTML PARSING PIPELINE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   1. LOAD                                                        │
│      Raw HTML string → Cheerio object                           │
│                                                                  │
│   2. SELECT                                                      │
│      Use CSS selectors to find elements                         │
│                                                                  │
│   3. EXTRACT                                                     │
│      Get text, attributes, or inner HTML                        │
│                                                                  │
│   4. CLEAN                                                       │
│      Remove unwanted elements, trim whitespace                  │
│                                                                  │
│   5. OUTPUT                                                      │
│      Return clean content                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. CSS Selectors Crash Course

CSS selectors are patterns for selecting HTML elements. Cheerio uses them to find content.

### Basic Selectors

| Selector | Meaning | Example |
|----------|---------|---------|
| `tag` | Element by tag name | `p` → all `<p>` elements |
| `.class` | Element by class | `.author` → `<span class="author">` |
| `#id` | Element by ID | `#main` → `<div id="main">` |
| `*` | All elements | `*` → everything |

### Combinators

| Selector | Meaning | Example |
|----------|---------|---------|
| `A B` | B inside A (any depth) | `article p` → `<p>` anywhere in `<article>` |
| `A > B` | B directly inside A | `article > p` → `<p>` direct child of `<article>` |
| `A + B` | B immediately after A | `h1 + p` → `<p>` right after `<h1>` |
| `A ~ B` | B after A (sibling) | `h1 ~ p` → any `<p>` sibling after `<h1>` |

### Attribute Selectors

| Selector | Meaning | Example |
|----------|---------|---------|
| `[attr]` | Has attribute | `[data-field]` |
| `[attr="val"]` | Attribute equals | `[type="text"]` |
| `[attr*="val"]` | Attribute contains | `[class*="author"]` |
| `[attr^="val"]` | Attribute starts with | `[href^="https"]` |

### Pseudo-selectors

| Selector | Meaning |
|----------|---------|
| `:first-child` | First child element |
| `:last-child` | Last child element |
| `:nth-child(n)` | Nth child (1-indexed) |
| `:not(sel)` | Elements not matching selector |

### Examples for Medium

```typescript
// Article title
$("article h1").first().text()

// Author name
$("a[data-testid='authorName']").text()

// All paragraphs in article
$("article p").map((i, el) => $(el).text()).get()

// Images
$("article img").map((i, el) => $(el).attr("src")).get()

// Remove scripts
$("script").remove()
```

---

## 5. Medium's HTML Structure

Medium's HTML is complex and changes over time. Here's the general structure:

### Key Elements to Find

```
┌─────────────────────────────────────────────────────────────────┐
│                    MEDIUM ARTICLE STRUCTURE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   TITLE                                                          │
│   └── Usually in <h1> or element with specific data attribute   │
│                                                                  │
│   AUTHOR                                                         │
│   └── <a> tag with data-testid="authorName" or similar          │
│                                                                  │
│   PUBLISH DATE                                                   │
│   └── <time> element or <span> with date text                   │
│                                                                  │
│   ARTICLE BODY                                                   │
│   └── <article> tag containing:                                 │
│       ├── <p> paragraphs                                        │
│       ├── <h2>, <h3> subheadings                                │
│       ├── <figure> with <img> for images                        │
│       ├── <pre><code> for code blocks                           │
│       ├── <blockquote> for quotes                               │
│       └── <ul>, <ol> for lists                                  │
│                                                                  │
│   THINGS TO REMOVE                                               │
│   ├── <nav> navigation                                          │
│   ├── <script> JavaScript                                       │
│   ├── <style> CSS                                               │
│   ├── <aside> sidebars                                          │
│   ├── <footer> footers                                          │
│   ├── Clap buttons, share buttons                               │
│   ├── "Related articles" sections                               │
│   └── Newsletter signup forms                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Medium's Data Attributes

Medium uses `data-*` attributes for testing and tracking:

```html
<a data-testid="authorName">John Doe</a>
<div data-testid="storyPublishDate">Jan 1, 2025</div>
<section data-testid="post-content">...</section>
```

These are more reliable selectors than class names (which may be minified/randomized).

---

## 6. Extraction Strategy

### Multi-Step Approach

```
┌─────────────────────────────────────────────────────────────────┐
│                   EXTRACTION STRATEGY                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Step 1: LOAD HTML                                             │
│   └── const $ = cheerio.load(html)                              │
│                                                                  │
│   Step 2: REMOVE NOISE                                          │
│   └── $("script, style, nav, footer, aside").remove()           │
│                                                                  │
│   Step 3: EXTRACT METADATA                                      │
│   ├── title = $("h1").first().text()                            │
│   ├── author = $("[data-testid='authorName']").text()           │
│   └── date = $("time").first().attr("datetime")                 │
│                                                                  │
│   Step 4: EXTRACT BODY                                          │
│   └── body = $("article").html() or $("section[data-*]").html() │
│                                                                  │
│   Step 5: CLEAN BODY                                            │
│   ├── Remove remaining unwanted elements                        │
│   ├── Normalize whitespace                                       │
│   └── Handle special elements (code, images)                    │
│                                                                  │
│   Step 6: FORMAT OUTPUT                                         │
│   └── Return structured object with title, author, date, body   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Fallback Selectors

Since Medium's structure changes, use fallback patterns:

```typescript
function extractTitle($: cheerio.CheerioAPI): string {
  // Try multiple selectors in order of reliability
  return (
    $("h1[data-testid='storyTitle']").text() ||
    $("article h1").first().text() ||
    $("h1").first().text() ||
    $("title").text().replace(" - Medium", "") ||
    "Untitled"
  );
}
```

---

## 7. Implementation Guide

### Step 1: Install Cheerio

```bash
npm install cheerio
```

### Step 2: Create Extraction Function

```typescript
import * as cheerio from "cheerio";

interface ExtractedArticle {
  title: string;
  author: string | null;
  date: string | null;
  content: string;
  wordCount: number;
}

function extractArticle(html: string): ExtractedArticle {
  const $ = cheerio.load(html);

  // Remove noise first
  $("script, style, nav, footer, aside, [role='banner'], [role='navigation']").remove();
  $("button, [data-testid='headerClapButton']").remove();

  // Extract metadata
  const title = extractTitle($);
  const author = extractAuthor($);
  const date = extractDate($);

  // Extract and clean body
  const content = extractContent($);
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  return { title, author, date, content, wordCount };
}

function extractTitle($: cheerio.CheerioAPI): string {
  return (
    $("h1").first().text().trim() ||
    $("title").text().replace(/\s*[-–|].*$/, "").trim() ||
    "Untitled"
  );
}

function extractAuthor($: cheerio.CheerioAPI): string | null {
  const author = (
    $("[data-testid='authorName']").first().text() ||
    $("a[rel='author']").first().text() ||
    $("[class*='author'] a").first().text()
  ).trim();

  return author || null;
}

function extractDate($: cheerio.CheerioAPI): string | null {
  const timeEl = $("time").first();
  return timeEl.attr("datetime") || timeEl.text().trim() || null;
}

function extractContent($: cheerio.CheerioAPI): string {
  // Find the article body
  const article = $("article").first();

  if (article.length === 0) {
    // Fallback: get main content area
    return $("main").text().trim() || $("body").text().trim();
  }

  // Get text content, preserving some structure
  const paragraphs: string[] = [];

  article.find("p, h1, h2, h3, h4, li, blockquote").each((_, el) => {
    const text = $(el).text().trim();
    if (text) {
      paragraphs.push(text);
    }
  });

  return paragraphs.join("\n\n");
}
```

### Step 3: Update the Tool

```typescript
server.registerTool(
  "read_medium",
  {
    title: "Read Medium Article",
    description: "Fetches and extracts clean content from a Medium article.",
    inputSchema: {
      url: z.string().url().describe("The Medium article URL"),
      raw: z.boolean().default(false).describe("Return raw HTML instead of extracted text"),
    },
  },
  async ({ url, raw }: { url: string; raw: boolean }) => {
    // ... fetch logic ...

    if (raw) {
      return { content: [{ type: "text", text: result.content }] };
    }

    // Extract clean content
    const article = extractArticle(result.content);

    const output = [
      `# ${article.title}`,
      article.author ? `By: ${article.author}` : null,
      article.date ? `Date: ${article.date}` : null,
      `Word count: ${article.wordCount}`,
      "",
      article.content,
    ].filter(Boolean).join("\n");

    return { content: [{ type: "text", text: output }] };
  }
);
```

---

## 8. Testing Strategy

### Test Cases

| Test | Input | Expected |
|------|-------|----------|
| Basic article | Medium URL | Title, author, content extracted |
| No author visible | Some articles | Author = null, no crash |
| Code blocks | Technical article | Code preserved |
| Images | Article with images | Image references noted |
| Long article | 10k+ words | Full content, correct word count |
| Malformed HTML | Broken page | Graceful fallback |

### Debugging Tips

```typescript
// Log what cheerio finds
console.error("Found h1:", $("h1").length);
console.error("Found article:", $("article").length);
console.error("Title text:", $("h1").first().text());

// See the HTML structure
console.error("Article HTML:", $("article").html()?.substring(0, 500));
```

### Iteration Process

1. Fetch a real Medium article
2. Save the HTML locally for testing
3. Try different selectors
4. Check output against original
5. Handle edge cases

---

## Key Concepts Learned

| Concept | What It Means |
|---------|---------------|
| **DOM** | Document Object Model - HTML as a tree |
| **Cheerio** | jQuery-like HTML parser for Node.js |
| **CSS Selectors** | Patterns for finding HTML elements |
| **Data attributes** | `data-*` attributes for reliable selection |
| **Fallback patterns** | Try multiple selectors for robustness |

---

## What's Next?

In **Phase 7**, we'll convert the extracted HTML to Markdown:
- Use **turndown** library
- Handle code blocks, images, links
- Create clean, readable output

---

**Status**: 📝 Documentation complete, ready for implementation

**Back to**: [Phase 5](./PHASE_5_COOKIE_AUTH_APPROACH.md) | [Learning Plan](./LEARNING_PLAN.md)
