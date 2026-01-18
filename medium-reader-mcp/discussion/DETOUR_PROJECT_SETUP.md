# Detour: Project Setup - Linting, Formatting & CI

> **Goal**: Set up professional development tooling for our Node.js MCP project

---

## Overview

We want:

| Tool | Purpose |
|------|---------|
| **Biome** | Linting + Formatting (replaces ESLint + Prettier) |
| **TypeScript** | Static type checking (even for .js files with JSDoc) |
| **GitHub Actions** | CI pipeline to run all checks |

> **Note**: Tox is a Python tool. For Node.js, we use npm scripts + GitHub Actions instead.

---

## Why Biome Instead of ESLint + Prettier?

| Aspect | ESLint + Prettier | Biome |
|--------|-------------------|-------|
| **Speed** | Baseline | 15-25x faster |
| **Config files** | 3-4 files | 1 file (`biome.json`) |
| **Dependencies** | 127+ npm packages | Single binary |
| **Language** | JavaScript | Rust (compiled) |

Biome is the modern 2025 choice - one tool does both linting and formatting.

Sources:
- [Biome vs ESLint: The Ultimate 2025 Showdown](https://medium.com/@harryespant/biome-vs-eslint-the-ultimate-2025-showdown-for-javascript-developers-speed-features-and-3e5130be4a3c)
- [Why I Chose Biome Over ESLint+Prettier](https://dev.to/saswatapal/why-i-chose-biome-over-eslintprettier-20x-faster-linting-one-tool-to-rule-them-all-10kf)

---

## Step 1: Install Dev Dependencies

```bash
npm install -D @biomejs/biome typescript @types/node
```

| Package | Purpose |
|---------|---------|
| `@biomejs/biome` | Linting + Formatting (replaces ESLint + Prettier) |
| `typescript` | Type checking |
| `@types/node` | Node.js type definitions |

That's it! Just 3 dev dependencies instead of 8+.

---

## Step 2: Biome Configuration

Create `biome.json`:

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "include": ["src/**/*.js", "src/**/*.ts"],
    "ignore": ["node_modules", "dist", "coverage"]
  },
  "organizeImports": {
    "enabled": true
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": {
        "noConsoleLog": "error"
      },
      "style": {
        "noUnusedTemplateLiteral": "error"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "semicolons": "always",
      "trailingCommas": "es5"
    }
  }
}
```

**Key rules**:

- `noConsoleLog: "error"` - Prevents `console.log` (important for MCP - use `console.error` instead!)
- `recommended: true` - Enables all recommended lint rules
- Formatting matches Prettier defaults

---

## Step 3: TypeScript Configuration

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noEmit": true,
    "allowJs": true,
    "checkJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "declaration": false,
    "outDir": "./dist"
  },
  "include": ["src/**/*.js"],
  "exclude": ["node_modules", "dist"]
}
```

**Key settings**:

- `allowJs: true` - Check JavaScript files
- `checkJs: true` - Enable type checking for JS
- `noEmit: true` - Don't output files, just check types
- `strict: true` - Enable all strict checks

This lets us use **JSDoc comments** for type hints without converting to TypeScript:

```javascript
/**
 * @param {string} url - The Medium article URL
 * @returns {Promise<string>} The article content
 */
async function fetchArticle(url) {
  // TypeScript will check this!
}
```

---

## Step 4: Update package.json Scripts

Add to `package.json`:

```json
{
  "scripts": {
    "start": "node src/index.js",
    "lint": "biome lint src/",
    "lint:fix": "biome lint --write src/",
    "format": "biome format --write src/",
    "format:check": "biome format src/",
    "check": "biome check src/",
    "check:fix": "biome check --write src/",
    "typecheck": "tsc --noEmit",
    "ci": "npm run check && npm run typecheck",
    "test": "echo \"No tests yet\" && exit 0"
  }
}
```

| Script | Purpose |
|--------|---------|
| `npm run lint` | Check for lint errors |
| `npm run lint:fix` | Auto-fix lint errors |
| `npm run format` | Format all files |
| `npm run format:check` | Check if files are formatted |
| `npm run check` | Run both lint + format check |
| `npm run check:fix` | Fix both lint + format issues |
| `npm run typecheck` | Run TypeScript type checking |
| `npm run ci` | Run all checks (for CI) |

---

## Step 5: GitHub Actions CI

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main, ankit/*]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [18.x, 20.x, 22.x]

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Run Biome (lint + format)
        run: npm run check

      - name: Run type check
        run: npm run typecheck

      - name: Run tests
        run: npm test
```

**What this does**:

1. Triggers on push to `main` or `ankit/*` branches, and on PRs
2. Tests against Node 18, 20, and 22
3. Runs Biome check (lint + format) → type check → tests

---

## Step 6: VS Code Integration (Optional)

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "biomejs.biome",
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  }
}
```

This auto-formats and organizes imports on save.

> **Note**: Install the [Biome VS Code extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome)

---

## File Structure After Setup

```text
medium-reader-mcp/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions
├── .vscode/
│   └── settings.json           # VS Code settings
├── src/
│   └── index.js
├── discussion/
│   └── ...
├── biome.json                  # Biome config (lint + format)
├── tsconfig.json               # TypeScript config
├── .gitignore
├── package.json
└── package-lock.json
```

---

## Usage

```bash
# Check everything (what CI runs)
npm run ci

# Fix all auto-fixable issues (lint + format)
npm run check:fix

# Individual commands
npm run lint          # Lint only
npm run format        # Format only
npm run typecheck     # Type check only
```

---

## Why Not Tox?

| Tool | Language | Purpose |
|------|----------|---------|
| **Tox** | Python | Test across multiple Python versions |
| **npm scripts + GH Actions** | Node.js | Same thing, but for Node.js ecosystem |

Tox is Python-specific. For Node.js, we use:

- `npm scripts` for local development
- `GitHub Actions` with matrix builds for multi-version testing

---

## Implementation Checklist

- [ ] Install dev dependencies (`npm install -D @biomejs/biome typescript @types/node`)
- [ ] Create `biome.json`
- [ ] Create `tsconfig.json`
- [ ] Update `package.json` scripts
- [ ] Create `.github/workflows/ci.yml`
- [ ] Create `.vscode/settings.json` (optional)
- [ ] Run `npm run ci` to verify setup
- [ ] Commit and push to trigger CI

---

**Status**: 📝 Ready to implement

**Back to**: [Phase 1 - Hello World](./PHASE_1_HELLO_WORLD.md)
