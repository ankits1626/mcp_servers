# Chapter 0: What is React and Why?

## Goal
Understand what React is before writing any code.

---

## What We're Building

A **HackerNews Jobs Board** - a real app that:
- Fetches job listings from the HackerNews API
- Displays them in a table
- Lets you click to see details

---

## What is React?

React is a **JavaScript library for building user interfaces**.

Think of it like this:

```
Traditional Web Page:
HTML (structure) + CSS (style) + JavaScript (behavior)
     ↓
All separate, JS manipulates HTML directly

React:
JavaScript generates the HTML
     ↓
Everything lives together in "components"
```

---

## Why React?

**Problem:** Building interactive UIs with plain JavaScript is painful.

```javascript
// Plain JS: Update a counter
document.getElementById('count').innerText = newCount;
document.getElementById('button').disabled = newCount > 10;
document.getElementById('message').style.display = newCount > 5 ? 'block' : 'none';
// ... manually update every piece
```

**React's Solution:** Describe what the UI should look like, React updates it for you.

```jsx
// React: Describe the UI based on state
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <span>{count}</span>
      <button disabled={count > 10} onClick={() => setCount(count + 1)}>
        Add
      </button>
      {count > 5 && <p>You clicked a lot!</p>}
    </div>
  );
}
```

---

## Key Concept: Components

React apps are built from **components** - reusable pieces of UI.

```
Our Jobs Board will have:

┌─────────────────────────────────┐
│           <Header />            │
├─────────────────────────────────┤
│           <JobTable />          │
│  ┌───────────────────────────┐  │
│  │      <JobRow />           │  │
│  │      <JobRow />           │  │
│  │      <JobRow />           │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

Each component is a **function** that returns **what to display**.

---

## Key Concept: JSX

JSX = JavaScript + XML-like syntax

It looks like HTML but it's JavaScript:

```jsx
// This JSX:
<h1 className="title">Hello, {name}!</h1>

// Becomes this JavaScript:
React.createElement('h1', { className: 'title' }, 'Hello, ', name, '!')
```

JSX makes React code readable. You write HTML-like code inside JavaScript.

---

## Key Concept: State

**State** = Data that can change over time.

When state changes, React **re-renders** the component automatically.

```
User clicks "Load Jobs"
       ↓
State changes: jobs = [...fetched data...]
       ↓
React re-renders: Table now shows jobs
```

---

## Chapter 0 Checklist

Before moving on, make sure you understand:

- [ ] React is a library for building UIs with JavaScript
- [ ] Components are reusable pieces of UI (functions that return JSX)
- [ ] JSX is HTML-like syntax inside JavaScript
- [ ] State is data that changes; React re-renders when it changes
- [ ] We're building a Jobs Board with Header, JobTable, and JobRow components

---

## Questions to Discuss

1. Any part of this unclear?
2. Have you used plain JavaScript to update the DOM before?
3. Ready to set up our project in Chapter 1?

---

**Next Chapter:** Setting up our React project with Vite
