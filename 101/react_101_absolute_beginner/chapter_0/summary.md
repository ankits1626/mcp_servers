# Chapter 0 Summary: React Foundations

## What We Learned

### 1. What is React?
- A JavaScript library for building UIs
- Components = reusable UI pieces (functions returning JSX)
- State = data that changes → triggers re-render

### 2. Build Tools (Vite)
- **Why needed:** Browsers don't understand JSX, TypeScript, or imports
- **What it does:** Transpiles, bundles, serves with hot reload
- **Transpile vs Compile:** Both transform code, but transpile outputs human-readable code (TS→JS), compile outputs machine code

### 3. Project Setup
```bash
npm create vite@latest playground -- --template react-ts
cd playground && npm install
npm run dev
```

### 4. Key Files

| File | Purpose |
|------|---------|
| `main.tsx` | Entry point - mounts React to DOM |
| `App.tsx` | Your main component |
| `index.html` | HTML shell with `<div id="root">` |

### 5. React 19 Specifics
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

### 6. Core Syntax

| Concept | Syntax | Example |
|---------|--------|---------|
| Component | `function Name() {}` | `function App() { return <h1>Hi</h1> }` |
| State | `useState(initial)` | `const [count, setCount] = useState(0)` |
| JSX Expression | `{value}` | `<p>{count}</p>` |
| Event | `onEvent={handler}` | `onClick={() => setCount(count + 1)}` |
| Fragment | `<>...</>` | `<><div/><div/></>` |
| Class attribute | `className` | `<div className="box">` |

---

## Chapter 0 Files

```
chapter_0/
├── start_chapter_0.md          # Core concepts intro
├── setup_react_project.md      # Project setup guide
├── what_is_build_tool.md       # Why we need Vite
├── transpile_vs_compile.md     # Transpile vs Compile
├── understanding_main_tsx.md   # Entry point explained
├── understanding_app_tsx.md    # Component anatomy
├── summary.md                  # This file
└── playground/                 # Your React app
```

---

## Ready for Chapter 1

You now understand:
- [x] What React is and why it exists
- [x] How build tools work
- [x] Project structure
- [x] Components, JSX, State basics

**Next:** We'll start building the HackerNews Jobs Board step by step.
