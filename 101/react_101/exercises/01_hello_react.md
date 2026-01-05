# Exercise 1: Hello React

> **Goal**: Understand what JSX is and write your first React code
> **Time**: ~15 minutes
> **Difficulty**: Beginner

---

## What You'll Learn

- What a JavaScript bundler is
- How Vite works
- What JSX is (it's just JavaScript!)
- How to display content
- Basic JSX syntax rules

---

## Part 0: Setup Your Project

### Create the React App

```bash
cd /Users/ankit/code/learn/mcp_servers/101/react_101
pnpm create vite@latest hn-jobs
```

You'll be prompted with interactive questions:

```text
◆ Select a framework:
  → React

◆ Select a variant:
  → TypeScript

◆ Use rolldown-vite (Experimental)?
  → No
```

Then install and run:

```bash
cd hn-jobs
pnpm install
pnpm dev
```

Open http://localhost:5173 - you should see the Vite + React starter page.

---

## Part 0.5: What Just Happened? (Understanding Bundlers)

You just created a React project with **Vite** as the bundler. But what does that mean?

### What is a JavaScript Bundler?

A **bundler** takes your many source files and combines them into fewer files optimized for the browser.

```text
YOUR CODE (many files)                    BROWSER (few files)
─────────────────────                     ────────────────────

src/
├── App.tsx                               dist/
├── components/           ──BUNDLER──▶    ├── index.html
│   ├── Header.tsx                        ├── main.js      (all JS combined)
│   └── JobTable.tsx                      └── style.css    (all CSS combined)
├── hooks/
│   └── useJobs.ts
└── types/
    └── index.ts
```

### Why Do We Need Bundlers?

**Problem 1: Too Many HTTP Requests**

```text
Without bundler:
Browser requests: Header.js, JobRow.js, JobTable.js, useJobs.js...
                  (50+ separate requests = SLOW)

With bundler:
Browser requests: main.js
                  (1 request = FAST)
```

**Problem 2: Browser Doesn't Understand Modern Code**

```tsx
// You write (modern):
import { useState } from 'react'
const x = data?.value ?? 'default'

// Bundler transforms to (older JS that browsers understand):
var React = require('react')
var x = data && data.value ? data.value : 'default'
```

**Problem 3: Browser Doesn't Understand TypeScript**

```tsx
// You write:
function greet(name: string): string {
  return `Hello, ${name}`
}

// Bundler transforms to (no types):
function greet(name) {
  return "Hello, " + name
}
```

### What a Bundler Does

```text
┌─────────────────────────────────────────────────────────────┐
│                        BUNDLER                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. RESOLVE imports                                          │
│     import X from './file' → finds the actual file           │
│                                                              │
│  2. TRANSFORM code                                           │
│     TypeScript → JavaScript                                  │
│     JSX → React.createElement()                              │
│     Modern JS → Older JS (for browser support)               │
│                                                              │
│  3. BUNDLE into fewer files                                  │
│     50 files → 1 main.js                                     │
│                                                              │
│  4. OPTIMIZE                                                 │
│     Remove unused code (tree-shaking)                        │
│     Minify: `function greet` → `function g`                  │
│     Compress                                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Popular Bundlers

| Bundler | Written In | Speed | Notes |
|---------|-----------|-------|-------|
| **Webpack** | JavaScript | Slow | Most popular, very configurable |
| **Rollup** | JavaScript | Medium | Great for libraries, clean output |
| **esbuild** | Go | Very Fast | 10-100x faster than Webpack |
| **Vite** | JS + esbuild + Rollup | Very Fast | What we're using! |
| **Rolldown** | Rust | Very Fast | New, experimental |

### How Vite Works

```text
┌─────────────────────────────────────────────────────────────┐
│                          VITE                                │
├──────────────────────────┬──────────────────────────────────┤
│     DEVELOPMENT          │         PRODUCTION               │
├──────────────────────────┼──────────────────────────────────┤
│                          │                                   │
│  Uses: esbuild           │  Uses: Rollup                    │
│                          │                                   │
│  - No bundling!          │  - Full bundling                 │
│  - Transforms on-demand  │  - Tree-shaking                  │
│  - Super fast refresh    │  - Minification                  │
│                          │  - Optimized for browsers        │
│                          │                                   │
└──────────────────────────┴──────────────────────────────────┘
```

**In development**: Vite doesn't bundle at all! It serves files directly and transforms them on-the-fly. That's why `pnpm dev` starts instantly.

**For production**: Vite uses Rollup to create optimized bundles for deployment.

### What About Rolldown?

When creating the project, you were asked about "rolldown-vite":

- **Rolldown** is a new Rust-based bundler being developed as a future replacement for Rollup
- It's **experimental** - not ready for production
- We selected **No** because the standard Vite is stable and proven
- Once Rolldown matures (late 2025/2026), it may become the default

### Simple Analogy

```text
WITHOUT BUNDLER (bad):
📦 📦 📦 📦 📦 📦 📦 📦 📦 📦  (10 small boxes)
- Each needs separate shipping label
- Multiple delivery trips
- Lots of packaging waste

WITH BUNDLER (good):
📦 (1 big box with everything inside)
- One shipping label
- One delivery trip
- Efficient packaging
```

---

## Part 1: Clean Up Starter Code

Let's replace the default Vite template with our HN Jobs app.

Delete unnecessary files:

```bash
rm src/App.css src/index.css src/assets/react.svg
```

Replace `src/main.tsx`:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

Replace `src/App.tsx`:

```tsx
function App() {
  return (
    <div>
      <h1>🔶 HN Jobs</h1>
    </div>
  )
}

export default App
```

Now open http://localhost:5173 - you should see "🔶 HN Jobs"

---

## Part 2: What is JSX?

Open `src/App.tsx`. You'll see:

```tsx
function App() {
  return (
    <div>
      <h1>🔶 HN Jobs</h1>
    </div>
  )
}

export default App
```

That `<div>` and `<h1>` inside JavaScript? That's **JSX**.

**JSX = JavaScript XML** - a syntax that lets you write HTML-like code inside JavaScript.

It looks like HTML, but it's actually JavaScript. When your code runs, the bundler converts it:

```tsx
// What you write (JSX):
<h1>🔶 HN Jobs</h1>

// What it becomes (JavaScript):
React.createElement('h1', null, '🔶 HN Jobs')
```

JSX is just a nicer way to write `React.createElement()` calls.

---

## Part 3: Your First Changes

### Step 1: Add a Subtitle

Edit `src/App.tsx`:

```tsx
function App() {
  return (
    <div>
      <h1>🔶 HN Jobs</h1>
      <p>Find your next opportunity from HackerNews</p>
    </div>
  )
}

export default App
```

Save the file. The browser updates automatically! (That's Vite's hot reload.)

### Step 2: Add JavaScript Inside JSX

Use curly braces `{}` to embed JavaScript:

```tsx
function App() {
  const appName = "HN Jobs"
  const jobCount = 45

  return (
    <div>
      <h1>🔶 {appName}</h1>
      <p>{jobCount} jobs available</p>
      <p>Last updated: {new Date().toLocaleTimeString()}</p>
    </div>
  )
}

export default App
```

**Key insight**: Anything inside `{}` is JavaScript. You can put:

- Variables: `{appName}`
- Expressions: `{2 + 2}` → shows 4
- Function calls: `{new Date().toLocaleTimeString()}`

---

## Part 4: JSX Rules

### Rule 1: One Root Element

```tsx
// ❌ ERROR: Two root elements
function App() {
  return (
    <h1>Title</h1>
    <p>Content</p>
  )
}

// ✅ CORRECT: Wrap in a single element
function App() {
  return (
    <div>
      <h1>Title</h1>
      <p>Content</p>
    </div>
  )
}

// ✅ ALSO CORRECT: Use Fragment (empty tags)
function App() {
  return (
    <>
      <h1>Title</h1>
      <p>Content</p>
    </>
  )
}
```

### Rule 2: Close All Tags

```tsx
// ❌ ERROR: Unclosed tags
<img src="logo.png">
<input type="text">
<br>

// ✅ CORRECT: Self-closing tags
<img src="logo.png" />
<input type="text" />
<br />
```

### Rule 3: className, not class

```tsx
// ❌ ERROR: 'class' is a reserved word in JavaScript
<div class="header">

// ✅ CORRECT: Use 'className'
<div className="header">
```

### Rule 4: camelCase for Attributes

```tsx
// HTML uses lowercase:
<button onclick="...">
<label for="...">

// JSX uses camelCase:
<button onClick={...}>
<label htmlFor="...">
```

---

## Challenge: Build This Header

Try to create this output:

```text
🔶 HN Jobs
─────────────────────
45 jobs · Updated: 10:30:45 AM

Browse the latest job postings from HackerNews
```

Here's a starting point:

```tsx
function App() {
  const jobCount = 45
  const lastUpdated = new Date().toLocaleTimeString()

  return (
    <div>
      {/* Your code here */}
    </div>
  )
}
```

<details>
<summary>Click to see solution</summary>

```tsx
function App() {
  const jobCount = 45
  const lastUpdated = new Date().toLocaleTimeString()

  return (
    <div>
      <h1>🔶 HN Jobs</h1>
      <hr />
      <p>{jobCount} jobs · Updated: {lastUpdated}</p>
      <br />
      <p>Browse the latest job postings from HackerNews</p>
    </div>
  )
}

export default App
```

</details>

---

## Key Takeaways

1. **Bundlers** combine your files and transform modern code for browsers
2. **Vite** uses esbuild (fast) for dev, Rollup for production builds
3. **JSX** = HTML-like syntax inside JavaScript
4. Use `{}` to embed JavaScript expressions
5. Must have **one root element** (use `<div>` or `<>`)
6. **Close all tags** (including `<img />`, `<br />`)
7. Use **className** instead of class
8. Use **camelCase** for attributes (onClick, htmlFor)

---

## Your Code So Far

```tsx
// src/App.tsx
function App() {
  const appName = "HN Jobs"
  const jobCount = 45
  const lastUpdated = new Date().toLocaleTimeString()

  return (
    <div>
      <h1>🔶 {appName}</h1>
      <hr />
      <p>{jobCount} jobs · Updated: {lastUpdated}</p>
    </div>
  )
}

export default App
```

---

## What's Next?

You've written JSX in one big function. But what if you want to reuse parts of your UI?

That's where **Components** come in - reusable pieces of UI.

**[→ Exercise 2: Components](./02_components.md)**
