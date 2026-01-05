# Exercise 1: Setup & First Component

> **Goal**: Create your first React component and understand JSX
> **Time**: ~15 minutes
> **Concepts**: JSX, Components, Basic Syntax

---

## What You'll Learn

- What a React component is
- How to write JSX
- How to render a component

---

## Part 1: Understanding Components

A **component** is just a function that returns UI:

```tsx
// This is a component!
function Header() {
  return <h1>Hello World</h1>;
}
```

That's it. A function that returns something that looks like HTML.

### Why Functions?

- Easy to understand
- Easy to test
- Easy to reuse
- Can accept parameters (called "props")

---

## Part 2: Understanding JSX

JSX is HTML-like syntax inside JavaScript. It looks like HTML but it's not:

```tsx
// This JSX:
const element = <h1 className="title">Hello</h1>;

// Becomes this JavaScript:
const element = React.createElement('h1', { className: 'title' }, 'Hello');
```

JSX is just syntactic sugar to make React code readable.

### JSX Rules

```tsx
// Rule 1: Use className instead of class
<div className="container">  ✅
<div class="container">      ❌

// Rule 2: Close all tags
<img src="photo.jpg" />      ✅
<input type="text" />        ✅
<br />                       ✅

// Rule 3: One root element
return (
  <div>                      ✅
    <h1>Title</h1>
    <p>Content</p>
  </div>
);

return (
  <h1>Title</h1>             ❌ (two roots!)
  <p>Content</p>
);

// Rule 4: Use {} for JavaScript
<p>Hello, {name}</p>         ✅ (variable)
<p>Sum: {2 + 2}</p>          ✅ (expression)
<p>{isAdmin && "Admin"}</p>  ✅ (conditional)
```

---

## Part 3: Hands-On Exercise

### Step 1: Create the Header Component

If using **JARVIS Playground**, edit the Playground.tsx file.
If using **standalone project**, edit App.tsx.

Create a simple Header component:

```tsx
// src/components/Header.tsx (or inside Playground.tsx)

function Header() {
  return (
    <header style={{
      backgroundColor: '#667eea',
      color: 'white',
      padding: '1rem',
      textAlign: 'center'
    }}>
      <h1>📝 Task Tracker</h1>
      <p>Stay organized, get things done</p>
    </header>
  );
}

export default Header;
```

### Step 2: Use the Component

```tsx
// In App.tsx or Playground.tsx

import Header from './components/Header';
// OR define Header in the same file

function App() {
  return (
    <div>
      <Header />
      <main>
        <p>Tasks will go here...</p>
      </main>
    </div>
  );
}
```

### Step 3: Run and See

```bash
pnpm dev  # or pnpm tauri dev
```

You should see:
- Purple header with "📝 Task Tracker"
- Subtitle "Stay organized, get things done"
- "Tasks will go here..." below

---

## Challenge: Make It Your Own

Try these modifications:

### Challenge 1: Change the Title

```tsx
<h1>🎯 My Todo App</h1>
```

### Challenge 2: Add Current Date

```tsx
function Header() {
  const today = new Date().toLocaleDateString();

  return (
    <header>
      <h1>📝 Task Tracker</h1>
      <p>Today is {today}</p>  {/* JavaScript in JSX */}
    </header>
  );
}
```

### Challenge 3: Add a Task Count (Hardcoded)

```tsx
function Header() {
  const taskCount = 5;  // We'll make this dynamic later

  return (
    <header>
      <h1>📝 Task Tracker</h1>
      <p>You have {taskCount} tasks</p>
    </header>
  );
}
```

---

## Common Mistakes

### Mistake 1: Forgetting to Export

```tsx
// ❌ Missing export
function Header() {
  return <h1>Hello</h1>;
}

// ✅ Add export
export default Header;
// OR
export function Header() { ... }
```

### Mistake 2: Using `class` Instead of `className`

```tsx
// ❌ Wrong
<div class="container">

// ✅ Correct
<div className="container">
```

### Mistake 3: Forgetting Closing Tags

```tsx
// ❌ Wrong
<img src="photo.jpg">
<input type="text">

// ✅ Correct
<img src="photo.jpg" />
<input type="text" />
```

### Mistake 4: Multiple Root Elements

```tsx
// ❌ Wrong - two roots
return (
  <h1>Title</h1>
  <p>Content</p>
);

// ✅ Option 1: Wrap in div
return (
  <div>
    <h1>Title</h1>
    <p>Content</p>
  </div>
);

// ✅ Option 2: Use Fragment
return (
  <>
    <h1>Title</h1>
    <p>Content</p>
  </>
);
```

---

## Key Takeaways

1. **Component** = A function that returns JSX
2. **JSX** = HTML-like syntax in JavaScript
3. Use `className` not `class`
4. Close all tags (even `<img />`, `<br />`)
5. Return one root element (use `<div>` or `<>` to wrap)
6. Use `{}` to embed JavaScript in JSX

---

## Your Code So Far

```tsx
// Header.tsx
function Header() {
  const today = new Date().toLocaleDateString();

  return (
    <header style={{
      backgroundColor: '#667eea',
      color: 'white',
      padding: '1rem',
      textAlign: 'center',
      borderRadius: '8px',
      marginBottom: '1rem'
    }}>
      <h1 style={{ margin: 0 }}>📝 Task Tracker</h1>
      <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>
        {today} · Stay organized
      </p>
    </header>
  );
}

export default Header;
```

---

## Next Exercise

You've created your first component! But it's static - the task count is hardcoded.

In the next exercise, we'll learn about **Props** - how to pass data INTO components.

**[→ Exercise 2: Props - Passing Data](./02_props.md)**
