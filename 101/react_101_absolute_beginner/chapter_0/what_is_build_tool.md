# What is a Build Tool and Why Do We Need It?

## The Problem

Browsers only understand 3 things:
- **HTML**
- **CSS**
- **JavaScript** (plain, old-school JS)

But modern React code looks like this:

```tsx
import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>
}
```

**Browsers can't run this directly because:**

| Feature | Why Browser Can't Handle It |
|---------|----------------------------|
| `import` statements | Browsers need `<script>` tags or ES modules |
| JSX (`<button>...`) | Not valid JavaScript |
| TypeScript (`.tsx`) | Browser only knows JavaScript |
| `./App.css` import | Can't import CSS into JS |

---

## The Solution: Build Tools

A build tool **transforms** your code into browser-friendly files.

```
Your Code                    Build Tool                Browser Code
─────────────────────────────────────────────────────────────────────

App.tsx          ─┐                              ┌─►  index.html
Header.tsx        │                              │
JobTable.tsx      ├──►  [VITE/WEBPACK]  ────────►├─►  bundle.js
App.css           │                              │
utils.ts         ─┘                              └─►  styles.css
```

---

## What Build Tools Do

### 1. **Transpile** (Convert Syntax)

JSX → JavaScript
```tsx
// Your code (JSX)
<button className="btn">Click</button>

// After build (plain JS)
React.createElement('button', { className: 'btn' }, 'Click')
```

TypeScript → JavaScript
```tsx
// Your code (TypeScript)
const name: string = "Alice"

// After build (JavaScript)
const name = "Alice"
```

### 2. **Bundle** (Combine Files)

```
src/
├── App.tsx
├── Header.tsx
├── JobTable.tsx
└── utils.ts

     ↓ Bundle

dist/
└── bundle.js    (all code in one file)
```

### 3. **Resolve Imports**

```tsx
// You write:
import { formatDate } from './utils'

// Build tool finds ./utils.ts and includes it
```

### 4. **Process CSS**

```tsx
// You write:
import './App.css'

// Build tool injects CSS into the page
```

### 5. **Dev Server + Hot Reload**

- Runs your app at `localhost:5173`
- Watches for file changes
- Updates browser instantly (no manual refresh)

---

## Without a Build Tool

You'd have to:

```html
<!-- Manually include every script -->
<script src="react.js"></script>
<script src="react-dom.js"></script>
<script src="header.js"></script>
<script src="job-table.js"></script>
<script src="app.js"></script>

<!-- No JSX allowed - write this instead -->
<script>
  React.createElement('div', null,
    React.createElement('h1', null, 'Hello')
  )
</script>

<!-- No TypeScript - just hope you don't have typos -->
<!-- No CSS imports - use <link> tags -->
<!-- No hot reload - refresh manually every time -->
```

---

## Popular Build Tools

| Tool | Notes |
|------|-------|
| **Vite** | Fast, modern, great for React (we use this) |
| **Webpack** | Older, very configurable, used by Create React App |
| **Parcel** | Zero config, good for beginners |
| **esbuild** | Extremely fast, powers Vite |

---

## Vite Specifically

Vite is fast because:

1. **Dev mode**: Serves files directly (no bundling), uses native ES modules
2. **Production**: Bundles with Rollup for optimized output

```
Development:
Browser ←──── Vite serves files on-demand ←──── Your .tsx files

Production:
Browser ←──── Optimized bundle.js ←──── Vite builds everything
```

---

## Summary

| Without Build Tool | With Build Tool |
|--------------------|-----------------|
| No JSX | JSX works |
| No TypeScript | TypeScript works |
| Manual `<script>` tags | `import` statements |
| Manual refresh | Hot reload |
| Many HTTP requests | Single bundled file |

**Build tool = translator between modern code and browsers.**

---

## Next

Now that you understand why we need Vite, go ahead and create the playground project from `setup_react_project.md`.
