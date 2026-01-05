# Idea: Local Content Curation

**Status**: Parked
**Priority**: Nice-to-have
**Added**: 2026-01-05

---

## Problem

When fetching articles, it's hard to:
1. Debug issues with specific articles
2. Track what content was fetched
3. Identify patterns in fetch failures
4. Review article quality/formatting

---

## Proposed Solution

Create a local curation system that saves fetched articles for debugging and analysis.

### Storage Options

| Option | Pros | Cons |
|--------|------|------|
| **File-based (.md)** | Simple, browsable, git-friendly | No querying, manual cleanup |
| **SQLite database** | Searchable, structured, metadata | Heavier, requires setup |
| **JSON log file** | Append-only, good for debugging | Gets large, hard to browse |

### Metadata to Capture

**Basic:**
- URL
- Title
- Fetch date

**Full (Recommended):**
- URL, title, date
- Fetch timestamp
- Auth method used (env/chrome/none)
- Extractor used (graphql/html)
- Word count
- Success/failure status

**Debug:**
- All of the above
- Raw API response
- Error messages
- Retry attempts

---

## Implementation Sketch

```
src/
├── services/
│   └── curation.service.ts    # NEW
└── types/
    └── curation.types.ts      # NEW

curated/                       # NEW (gitignored)
├── 2026-01-05_article-title.md
├── 2026-01-05_another-article.md
└── index.json                 # Metadata index
```

### curation.service.ts

```typescript
interface CuratedArticle {
  url: string;
  title: string;
  fetchedAt: string;
  authMethod: 'env' | 'chrome' | 'none';
  extractor: 'graphql' | 'html';
  wordCount: number;
  success: boolean;
  error?: string;
  filePath: string;
}

export async function curateArticle(
  content: string,
  metadata: Omit<CuratedArticle, 'filePath'>
): Promise<void> {
  // 1. Generate filename from date + title
  // 2. Save .md file
  // 3. Update index.json
}

export async function getCurationIndex(): Promise<CuratedArticle[]> {
  // Read index.json
}
```

---

## Configuration

Add to constants:

```typescript
export const CURATION_CONFIG = {
  enabled: process.env.CURATE_ARTICLES === 'true',
  directory: './curated',
  maxFiles: 100,  // Auto-cleanup old files
};
```

---

## When to Implement

Consider implementing when:
1. Debugging fetch issues becomes frequent
2. Want to build a test corpus of articles
3. Need to analyze content quality patterns

---

## Related

- Phase 8: Error handling (completed)
- Future: Test suite with real article fixtures
