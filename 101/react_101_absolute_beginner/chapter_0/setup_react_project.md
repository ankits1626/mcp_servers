# Setting Up a React Project

> **Your Stack:** React 19.2 + Vite 7.2 + TypeScript 5.9 (as of January 2025)

## The Tool: Vite

**Vite** (pronounced "veet") is a build tool that:
- Creates a ready-to-use React project
- Runs a dev server with hot reload
- Bundles your code for production

---

## Step 1: Create the Project

Open terminal and run:

```bash
npm create vite@latest playground -- --template react-ts
```

Breaking this down:

| Part | Meaning |
|------|---------|
| `npm create vite@latest` | Use Vite's project creator |
| `playground` | Your project folder name |
| `--template react-ts` | Use React + TypeScript template |

---

## Step 2: Install Dependencies

```bash
cd playground
npm install
```

This reads `package.json` and downloads all required packages into `node_modules/`.

---

## Step 3: Start the Dev Server

```bash
npm run dev
```

Output:
```
  VITE v7.2.4  ready in 300 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

Open `http://localhost:5173/` in your browser.

---

## What You Get

```
playground/
├── node_modules/       # Downloaded packages (don't touch)
├── public/             # Static files (favicon, etc.)
├── src/
│   ├── App.tsx         # Your main component ← START HERE
│   ├── App.css         # Styles for App
│   ├── main.tsx        # Entry point (mounts React)
│   └── index.css       # Global styles
├── index.html          # HTML template
├── package.json        # Project config & dependencies
├── tsconfig.json       # TypeScript config
└── vite.config.ts      # Vite config
```

---

## Your Installed Versions

```json
{
  "dependencies": {
    "react": "^19.2.0",
    "react-dom": "^19.2.0"
  },
  "devDependencies": {
    "typescript": "~5.9.3",
    "vite": "^7.2.4"
  }
}
```

---

## The Important Files

### `src/main.tsx` - Entry Point (React 19 Style)

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

**React 19 Notes:**
- Import `StrictMode` directly (not `React.StrictMode`)
- Import `createRoot` from `'react-dom/client'` (not `'react-dom'`)
- `ReactDOM.render()` was removed in React 19 - always use `createRoot`

This says: "Find the `root` div in HTML, render the `<App />` component there."

### `src/App.tsx` - Your Main Component

```tsx
function App() {
  return (
    <div>
      <h1>Hello React!</h1>
    </div>
  )
}

export default App
```

This is where you'll write your code.

### `index.html` - The HTML Shell

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite + React + TS</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

Just a shell. React fills in the `root` div.

---

## Key Commands

| Command | What it does |
|---------|--------------|
| `npm run dev` | Start dev server (localhost:5173) |
| `npm run build` | Build for production (runs `tsc -b && vite build`) |
| `npm run lint` | Run ESLint to check code quality |
| `npm run preview` | Preview production build locally |

---

## React 19 Key Changes

| Feature | React 18 | React 19 |
|---------|----------|----------|
| Mounting | `createRoot` (new) | `createRoot` (only option) |
| `ReactDOM.render()` | Deprecated | **Removed** |
| StrictMode | Double-renders components | Double-renders + re-runs Effects + re-runs ref callbacks |
| Ref forwarding | Required `forwardRef` | Automatic (refs passed as props) |

**StrictMode in React 19** runs extra checks in development:
- Re-renders components twice (catches impure renders)
- Re-runs Effects twice (catches missing cleanup)
- Re-runs ref callbacks twice (catches missing ref cleanup)

These double-runs only happen in development, not production.

---

## Try It Yourself

1. Create the project with the commands above
2. Open `src/App.tsx`
3. Change the text inside `<h1>` and save
4. Watch the browser update instantly (hot reload!)

---

## Next

Once you have the playground running, tell me and we'll explore:
- JSX syntax
- Creating components
- Using state

---

## References

- [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
- [StrictMode Documentation](https://react.dev/reference/react/StrictMode)
- [createRoot API](https://incepter.github.io/how-react-works/docs/react-dom/how.createroot.works/)
