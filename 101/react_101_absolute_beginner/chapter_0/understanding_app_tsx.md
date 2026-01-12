# Understanding App.tsx

Let's break down the default Vite template line by line.

```tsx
import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
```

---

## Section 1: Imports

```tsx
import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
```

| Import | What It Is |
|--------|------------|
| `useState` | A React hook for managing state (data that changes) |
| `reactLogo` | An SVG image file - Vite converts it to a URL string |
| `viteLogo` | Another SVG from the `public/` folder (note the `/` path) |
| `./App.css` | CSS styles - Vite injects them into the page |

**Path difference:**
- `./assets/react.svg` → relative to this file (in `src/assets/`)
- `/vite.svg` → from the `public/` folder (served at root)

---

## Section 2: The Component Function

```tsx
function App() {
  // ... component logic and JSX
}

export default App
```

- `App` is a **function** that returns **JSX**
- `export default` makes it available to import elsewhere
- Component names must start with **Capital letter** (React rule)

---

## Section 3: State with useState

```tsx
const [count, setCount] = useState(0)
```

This is **array destructuring**. `useState(0)` returns an array with 2 items:

| Item | Name | Purpose |
|------|------|---------|
| `[0]` | `count` | The current value (starts at `0`) |
| `[1]` | `setCount` | Function to update the value |

**How state works:**

```
Initial render:     count = 0
                         ↓
User clicks button: setCount(1)
                         ↓
React re-renders:   count = 1   (UI updates automatically)
```

---

## Section 4: JSX Return

### The Fragment `<> </>`

```tsx
return (
  <>
    ...multiple elements...
  </>
)
```

- React components must return **one** element
- `<>...</>` is a **Fragment** - groups elements without adding a DOM node
- Alternative: `<React.Fragment>...</React.Fragment>`

**Without fragment (won't work):**
```tsx
return (
  <div>First</div>
  <div>Second</div>  // Error: Adjacent JSX elements must be wrapped
)
```

**With fragment (works):**
```tsx
return (
  <>
    <div>First</div>
    <div>Second</div>
  </>
)
```

---

### JSX Attributes

```tsx
<a href="https://vite.dev" target="_blank">
```

JSX attributes look like HTML but:

| HTML | JSX | Why |
|------|-----|-----|
| `class` | `className` | `class` is reserved in JavaScript |
| `for` | `htmlFor` | `for` is reserved in JavaScript |
| `onclick` | `onClick` | camelCase for all events |

---

### JavaScript in JSX: `{curly braces}`

```tsx
<img src={viteLogo} className="logo" alt="Vite logo" />
```

- `{viteLogo}` → Insert JavaScript value (the imported URL)
- `"logo"` → Plain string (no braces needed)

**Rule:** Use `{}` to embed any JavaScript expression in JSX.

```tsx
<h1>{2 + 2}</h1>           // Shows: 4
<p>{user.name}</p>         // Shows: value of user.name
<span>{isOn && "ON"}</span> // Shows: "ON" if isOn is true
```

---

### Event Handling

```tsx
<button onClick={() => setCount((count) => count + 1)}>
```

Breaking this down:

1. `onClick={...}` - Attach a click handler
2. `() => ...` - Arrow function (runs when clicked)
3. `setCount((count) => count + 1)` - Update state

**Why `(count) => count + 1` instead of `count + 1`?**

```tsx
// This works but can be stale in rapid clicks:
setCount(count + 1)

// This is safer - always uses latest value:
setCount((prevCount) => prevCount + 1)
```

The function form `(prev) => prev + 1` guarantees you're using the most recent state.

---

### Dynamic Text

```tsx
count is {count}
```

The `{count}` displays the current state value. When state changes, React re-renders and shows the new value.

---

## Visual Flow

```
1. App component renders
   ↓
2. useState(0) creates state: count = 0
   ↓
3. JSX shows "count is 0"
   ↓
4. User clicks button
   ↓
5. setCount runs → count becomes 1
   ↓
6. React re-renders App
   ↓
7. JSX now shows "count is 1"
   ↓
   (repeat on each click)
```

---

## Experiment Time!

Try these changes in your `App.tsx`:

### 1. Change the increment amount
```tsx
<button onClick={() => setCount((count) => count + 5)}>
```

### 2. Add a reset button
```tsx
<button onClick={() => setCount(0)}>Reset</button>
```

### 3. Show different text based on count
```tsx
<p>{count > 10 ? "That's a lot!" : "Keep clicking!"}</p>
```

### 4. Add a second state
```tsx
const [name, setName] = useState("World")

// In JSX:
<h1>Hello, {name}!</h1>
<input value={name} onChange={(e) => setName(e.target.value)} />
```

---

## Key Takeaways

| Concept | Example | Purpose |
|---------|---------|---------|
| Component | `function App() {}` | Reusable UI piece |
| State | `useState(0)` | Data that changes over time |
| JSX | `<button>Click</button>` | HTML-like syntax in JS |
| Fragment | `<>...</>` | Group elements without extra DOM |
| Expression | `{count}` | Embed JS in JSX |
| Event | `onClick={fn}` | Respond to user actions |
| Update state | `setCount(newValue)` | Trigger re-render |

---

## Next Steps

Now that you understand the default template:
1. Try the experiments above
2. Let me know when you're ready for the next concept
3. We'll start building toward our HackerNews Jobs Board!
