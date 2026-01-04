# Phase 6.3 Refactoring - Execution Plan

> **Principle**: Each step is atomic and fully operational. Code must build and run after every step.

---

## Strategy: Strangler Fig Pattern

Instead of a big-bang rewrite, we'll:
1. Create new modules alongside existing code
2. Re-export from new locations
3. Gradually migrate imports
4. Delete old code only after everything works

---

## Execution Steps

### Step 1: Extract Types (No Breaking Changes)
**Files Created:**
- `src/types/article.types.ts`
- `src/types/medium.types.ts`
- `src/types/index.ts`

**What It Does:**
- Moves `ExtractedArticle`, `MediumParagraph`, `Markup` interfaces to separate files
- `index.ts` still has its own copies (no changes yet)

**Test:** `npm run build` passes, `read_medium` tool works

**Commit:** `refactor: extract type definitions to src/types/`

---

### Step 2: Extract Config/Constants (No Breaking Changes)
**Files Created:**
- `src/config/constants.ts`
- `src/config/index.ts`

**What It Does:**
- Moves `BROWSER_HEADERS`, `TIMEOUTS`, `MEDIUM_URLS`, `SERVER_INFO` to config
- `index.ts` still has its own copies (no changes yet)

**Test:** `npm run build` passes

**Commit:** `refactor: extract constants to src/config/`

---

### Step 3: Extract URL Utils (No Breaking Changes)
**Files Created:**
- `src/utils/url.utils.ts`
- `src/utils/index.ts`

**What It Does:**
- Moves `isMediumUrl()`, `extractPostId()` to utils
- `index.ts` still has its own copies

**Test:** `npm run build` passes

**Commit:** `refactor: extract URL utilities to src/utils/`

---

### Step 4: Extract Markdown Utils (No Breaking Changes)
**Files Created:**
- `src/utils/markdown.utils.ts`
- Update `src/utils/index.ts`

**What It Does:**
- Moves `paragraphToMarkdown()` and helper functions
- `index.ts` still has its own copies

**Test:** `npm run build` passes

**Commit:** `refactor: extract markdown utilities to src/utils/`

---

### Step 5: Extract Cookie Service (No Breaking Changes)
**Files Created:**
- `src/services/cookie.service.ts`
- `src/services/index.ts`

**What It Does:**
- Moves `getChromeMediumCookies()`, `getMediumCookies()`, `hasMediumCookies()`
- `index.ts` still has its own copies

**Test:** `npm run build` passes

**Commit:** `refactor: extract cookie service to src/services/`

---

### Step 6: Extract HTTP Service (No Breaking Changes)
**Files Created:**
- `src/services/http.service.ts`
- Update `src/services/index.ts`

**What It Does:**
- Moves `fetchMediumArticleWithCookies()`, `fetchWithAutoRefresh()`, `isAuthError()`
- `index.ts` still has its own copies

**Test:** `npm run build` passes

**Commit:** `refactor: extract HTTP service to src/services/`

---

### Step 7: Extract GraphQL Extractor (No Breaking Changes)
**Files Created:**
- `src/extractors/graphql.extractor.ts`
- `src/extractors/index.ts`

**What It Does:**
- Moves `fetchViaGraphQL()` and related GraphQL logic
- Uses types from `src/types/` and utils from `src/utils/`
- `index.ts` still has its own copies

**Test:** `npm run build` passes

**Commit:** `refactor: extract GraphQL extractor to src/extractors/`

---

### Step 8: Extract HTML Extractor (No Breaking Changes)
**Files Created:**
- `src/extractors/html.extractor.ts`
- Update `src/extractors/index.ts`

**What It Does:**
- Moves `extractArticle()`, `extractTitle()`, `extractAuthor()`, `extractDate()`, `extractContent()`, `cleanText()`
- `index.ts` still has its own copies

**Test:** `npm run build` passes

**Commit:** `refactor: extract HTML extractor to src/extractors/`

---

### Step 9: Extract Ping Tool (No Breaking Changes)
**Files Created:**
- `src/tools/ping.tool.ts`
- `src/tools/index.ts`

**What It Does:**
- Moves ping tool registration to separate file
- Exports `registerPingTool(server)` function
- `index.ts` still registers the tool directly

**Test:** `npm run build` passes

**Commit:** `refactor: extract ping tool to src/tools/`

---

### Step 10: Extract Echo Tool (No Breaking Changes)
**Files Created:**
- `src/tools/echo.tool.ts`
- Update `src/tools/index.ts`

**What It Does:**
- Moves echo tool registration
- Exports `registerEchoTool(server)` function

**Test:** `npm run build` passes

**Commit:** `refactor: extract echo tool to src/tools/`

---

### Step 11: Extract Fetch URL Tool (No Breaking Changes)
**Files Created:**
- `src/tools/fetch-url.tool.ts`
- Update `src/tools/index.ts`

**What It Does:**
- Moves fetch_url tool registration
- Exports `registerFetchUrlTool(server)` function

**Test:** `npm run build` passes

**Commit:** `refactor: extract fetch-url tool to src/tools/`

---

### Step 12: Extract Read Medium Tool (No Breaking Changes)
**Files Created:**
- `src/tools/read-medium.tool.ts`
- Update `src/tools/index.ts`

**What It Does:**
- Moves read_medium tool registration
- Uses services and extractors from new modules
- Exports `registerReadMediumTool(server)` function

**Test:** `npm run build` passes

**Commit:** `refactor: extract read-medium tool to src/tools/`

---

### Step 13: Create Server Module (No Breaking Changes)
**Files Created:**
- `src/server.ts`

**What It Does:**
- Creates `createServer()` function
- Imports and registers all tools from `src/tools/`
- Returns server instance with `start()` method
- `index.ts` still works independently

**Test:** `npm run build` passes

**Commit:** `refactor: create server module`

---

### Step 14: Switch index.ts to Use New Modules (BREAKING - Full Migration)
**Files Modified:**
- `src/index.ts` - Slim down to ~15 lines

**What It Does:**
- Remove ALL duplicated code from index.ts
- Import and use `createServer()` from `src/server.ts`
- Entry point only

**Test:**
- `npm run build` passes
- Test all tools: ping, echo, fetch_url, read_medium
- Test with real Medium article

**Commit:** `refactor: migrate index.ts to use modular architecture`

---

### Step 15: Cleanup and Documentation
**Files Modified:**
- Remove any dead code
- Update README if needed
- Add JSDoc comments where missing

**Test:** `npm run build` passes

**Commit:** `refactor: cleanup and documentation`

---

## File Tree After Completion

```
src/
├── index.ts              # ~15 lines - entry point only
├── server.ts             # Server creation and tool registration
│
├── tools/
│   ├── index.ts          # Exports registerAllTools()
│   ├── ping.tool.ts
│   ├── echo.tool.ts
│   ├── fetch-url.tool.ts
│   └── read-medium.tool.ts
│
├── services/
│   ├── index.ts
│   ├── cookie.service.ts
│   └── http.service.ts
│
├── extractors/
│   ├── index.ts
│   ├── graphql.extractor.ts
│   └── html.extractor.ts
│
├── utils/
│   ├── index.ts
│   ├── url.utils.ts
│   └── markdown.utils.ts
│
├── types/
│   ├── index.ts
│   ├── article.types.ts
│   ├── medium.types.ts
│   └── chrome-cookies-secure.d.ts
│
└── config/
    ├── index.ts
    └── constants.ts
```

---

## Rollback Strategy

Each step is atomic. If any step fails:
1. `git checkout .` to revert uncommitted changes
2. Or `git revert <commit>` to undo a specific commit
3. Code always remains functional

---

## Progress Tracking

| Step | Description | Status |
|------|-------------|--------|
| 1 | Extract Types | ✅ Done |
| 2 | Extract Config | ✅ Done |
| 3 | Extract URL Utils | ✅ Done |
| 4 | Extract Markdown Utils | ✅ Done |
| 5 | Extract Cookie Service | ✅ Done |
| 6 | Extract HTTP Service | ✅ Done |
| 7 | Extract GraphQL Extractor | ✅ Done |
| 8 | Extract HTML Extractor | ✅ Done |
| 9 | Extract Ping Tool | ✅ Done |
| 10 | Extract Echo Tool | ✅ Done |
| 11 | Extract Fetch URL Tool | ✅ Done |
| 12 | Extract Read Medium Tool | ✅ Done |
| 13 | Create Server Module | ✅ Done |
| 14 | Migrate index.ts | ✅ Done |
| 15 | Cleanup | ✅ Done |

---

## Final Results

**Before:** `src/index.ts` = 976 lines (monolithic)

**After:**
- `src/index.ts` = 9 lines (entry point only)
- 22 modular files with single responsibilities
- All 4 tools working: ping, echo, fetch_url, read_medium

**Architecture:**
```
src/
├── index.ts              # 9 lines - entry point
├── server/index.ts       # 62 lines - server creation
├── tools/                # 4 tools, ~300 lines total
├── services/             # 2 services, ~265 lines total
├── extractors/           # 2 extractors, ~280 lines total
├── utils/                # 2 utils, ~190 lines total
├── types/                # 3 type files, ~100 lines total
└── config/               # 1 constants file, ~55 lines total
```

**SOLID Compliance:**
- ✅ Single Responsibility: Each module has one job
- ✅ Open/Closed: Easy to add new tools without modifying existing
- ✅ Dependency Inversion: Tools depend on abstractions (services)
- ✅ Interface Segregation: Small, focused interfaces
