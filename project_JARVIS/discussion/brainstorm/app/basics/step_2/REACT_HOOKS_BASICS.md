# React Hooks: useState & useEffect

> **Industry Standard in 2025**: Yes. Hooks are THE way to write React components since React 16.8 (2019). Class components are considered legacy. All modern React code uses hooks.

---

## What Are Hooks?

**Hooks** are special functions that let you "hook into" React features. They let functional components have state, side effects, and other React features that were previously only available in class components.

```tsx
// Old way (class component) - DON'T USE
class Counter extends React.Component {
  state = { count: 0 };
  render() {
    return <button onClick={() => this.setState({ count: this.state.count + 1 })}>
      {this.state.count}
    </button>;
  }
}

// Modern way (hooks) - USE THIS
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

---

## useState: Remember Things

### What Is useState?

`useState` lets a component **remember** information between renders. Without it, variables reset every time the component re-renders.

### The Problem

```tsx
// ❌ This doesn't work
function Counter() {
  let count = 0;  // Resets to 0 on every render!

  return (
    <button onClick={() => count++}>  {/* Changes count, but... */}
      Count: {count}                    {/* Still shows 0 */}
    </button>
  );
}
```

**Why it fails:**
1. Click button → `count++` runs → count becomes 1
2. But React doesn't know anything changed
3. No re-render happens
4. Even if it did, `let count = 0` would reset it

### The Solution: useState

```tsx
// ✅ This works
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
```

### Syntax Breakdown

```tsx
const [count, setCount] = useState(0);
//     ↑       ↑                   ↑
//     │       │                   └── Initial value
//     │       └── Function to UPDATE the value
//     └── Current value (read-only)
```

| Part | What It Is | Example |
|------|------------|---------|
| `count` | Current state value | `0`, `1`, `2`, ... |
| `setCount` | Setter function | `setCount(5)` sets count to 5 |
| `useState(0)` | Hook call with initial value | Starts at `0` |

### How It Works

```
Initial render:
  useState(0) → count = 0

User clicks button:
  setCount(1) called
    ↓
  React schedules re-render
    ↓
  Component function runs again
    ↓
  useState(0) → count = 1 (remembers previous value!)
    ↓
  UI updates to show "1"
```

### Rules of useState

```tsx
// ✅ Always call at top level
function MyComponent() {
  const [value, setValue] = useState(0);  // Good
  // ...
}

// ❌ Never call inside conditions
function MyComponent() {
  if (someCondition) {
    const [value, setValue] = useState(0);  // BAD!
  }
}

// ❌ Never call inside loops
function MyComponent() {
  for (let i = 0; i < 3; i++) {
    const [value, setValue] = useState(0);  // BAD!
  }
}
```

### Common useState Patterns

#### 1. Simple Value

```tsx
const [name, setName] = useState('');
const [age, setAge] = useState(0);
const [isLoggedIn, setIsLoggedIn] = useState(false);
```

#### 2. Object State

```tsx
const [user, setUser] = useState({ name: '', email: '' });

// Update entire object (must spread existing values)
setUser({ ...user, name: 'John' });

// Or use functional update
setUser(prev => ({ ...prev, name: 'John' }));
```

#### 3. Array State

```tsx
const [items, setItems] = useState<string[]>([]);

// Add item
setItems([...items, 'new item']);

// Remove item
setItems(items.filter(item => item !== 'remove me'));

// Update item
setItems(items.map(item =>
  item === 'old' ? 'new' : item
));
```

#### 4. Functional Updates (When New Value Depends on Old)

```tsx
// ❌ Might be stale in rapid updates
setCount(count + 1);

// ✅ Always uses latest value
setCount(prev => prev + 1);
```

#### 5. Lazy Initial State (For Expensive Computations)

```tsx
// ❌ Runs every render
const [data, setData] = useState(expensiveComputation());

// ✅ Runs only once
const [data, setData] = useState(() => expensiveComputation());
```

---

## useEffect: Do Things After Render

### What Is useEffect?

`useEffect` lets you perform **side effects** in your component. A side effect is anything that affects something outside the component:

- Fetching data from an API
- Setting up event listeners
- Manipulating the DOM directly
- Setting up timers
- Logging

### The Problem

```tsx
// ❌ This runs on EVERY render - performance disaster!
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  // This fetch runs every time component renders
  fetch(`/api/users/${userId}`)
    .then(res => res.json())
    .then(data => setUser(data));  // This triggers another render!
    // Infinite loop!

  return <div>{user?.name}</div>;
}
```

### The Solution: useEffect

```tsx
// ✅ This runs only when userId changes
import { useState, useEffect } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch(`/api/users/${userId}`)
      .then(res => res.json())
      .then(data => setUser(data));
  }, [userId]);  // ← Dependency array

  return <div>{user?.name}</div>;
}
```

### Syntax Breakdown

```tsx
useEffect(() => {
  // Effect code runs here
  console.log('Effect ran!');

  return () => {
    // Cleanup code runs here (optional)
    console.log('Cleanup ran!');
  };
}, [dep1, dep2]);  // Dependency array
```

| Part | What It Does |
|------|--------------|
| First argument | Function containing the effect |
| Return function | Cleanup (optional) - runs before next effect or unmount |
| Dependency array | Controls WHEN effect runs |

### The Dependency Array

The dependency array is **crucial**. It controls when the effect runs:

```tsx
// 1. No array = runs after EVERY render
useEffect(() => {
  console.log('Runs every render');
});

// 2. Empty array = runs ONCE after first render
useEffect(() => {
  console.log('Runs once on mount');
}, []);

// 3. With dependencies = runs when dependencies change
useEffect(() => {
  console.log(`userId changed to ${userId}`);
}, [userId]);

// 4. Multiple dependencies
useEffect(() => {
  console.log('name or age changed');
}, [name, age]);
```

### Visual Timeline

```
Component Lifecycle with useEffect:

Mount (first render):
  1. Component renders
  2. DOM updates
  3. useEffect runs ←

Update (when dependency changes):
  1. Component re-renders
  2. DOM updates
  3. Cleanup runs (if exists) ←
  4. useEffect runs ←

Unmount:
  1. Cleanup runs ←
  2. Component removed from DOM
```

### Cleanup Function

The cleanup function prevents memory leaks and stale data:

```tsx
useEffect(() => {
  // Setup: Add event listener
  const handleResize = () => console.log(window.innerWidth);
  window.addEventListener('resize', handleResize);

  // Cleanup: Remove event listener
  return () => {
    window.removeEventListener('resize', handleResize);
  };
}, []);
```

**When cleanup runs:**
- Before the effect runs again (on dependency change)
- When the component unmounts

### Common useEffect Patterns

#### 1. Fetch Data on Mount

```tsx
useEffect(() => {
  async function fetchData() {
    const response = await fetch('/api/data');
    const data = await response.json();
    setData(data);
  }
  fetchData();
}, []); // Empty array = only on mount
```

#### 2. Subscribe to Events

```tsx
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setIsOpen(false);
  };

  window.addEventListener('keydown', handleKeyPress);

  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);
```

#### 3. Set Up Timers

```tsx
useEffect(() => {
  const intervalId = setInterval(() => {
    setSeconds(s => s + 1);
  }, 1000);

  return () => clearInterval(intervalId);
}, []);
```

#### 4. Sync with External System (Our useMediaQuery)

```tsx
useEffect(() => {
  const mediaQuery = window.matchMedia(query);
  setMatches(mediaQuery.matches);

  const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
  mediaQuery.addEventListener('change', handler);

  return () => mediaQuery.removeEventListener('change', handler);
}, [query]);
```

#### 5. Update Document Title

```tsx
useEffect(() => {
  document.title = `You have ${count} messages`;
}, [count]);
```

---

## How They Work Together in useMediaQuery

Let's trace through our `useMediaQuery` hook:

```tsx
function useMediaQuery(query: string): boolean {
  // 1. useState: Remember if query matches
  const [matches, setMatches] = useState(() => {
    return window.matchMedia(query).matches;
  });

  // 2. useEffect: Set up listener for changes
  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    // Update if changed since initial render
    setMatches(mediaQuery.matches);

    // Listen for future changes
    const handler = (e: MediaQueryListEvent) => {
      setMatches(e.matches);  // Update state → triggers re-render
    };

    mediaQuery.addEventListener('change', handler);

    // Cleanup: remove listener
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);  // Re-run if query string changes

  return matches;
}
```

**Timeline:**

```
1. Component using useMediaQuery mounts
   └→ useState initializes matches = true (desktop)
   └→ useEffect runs, adds resize listener

2. User resizes window to mobile width
   └→ Browser fires 'change' event
   └→ handler() runs
   └→ setMatches(false) called
   └→ Component re-renders with matches = false
   └→ UI switches from Sidebar to BottomTabs

3. Component unmounts
   └→ Cleanup runs, removes listener
   └→ No memory leak!
```

---

## Common Mistakes

### useState Mistakes

```tsx
// ❌ Mutating state directly
const [user, setUser] = useState({ name: 'John' });
user.name = 'Jane';  // Bad! Won't trigger re-render

// ✅ Create new object
setUser({ ...user, name: 'Jane' });
```

```tsx
// ❌ Forgetting state updates are async
setCount(count + 1);
console.log(count);  // Still shows old value!

// ✅ Use effect to react to state changes
useEffect(() => {
  console.log(count);  // Shows new value
}, [count]);
```

### useEffect Mistakes

```tsx
// ❌ Missing dependency
const [userId, setUserId] = useState(1);

useEffect(() => {
  fetch(`/api/users/${userId}`);  // Uses userId but not in deps!
}, []);  // ESLint will warn about this

// ✅ Include all dependencies
useEffect(() => {
  fetch(`/api/users/${userId}`);
}, [userId]);
```

```tsx
// ❌ Forgetting cleanup
useEffect(() => {
  window.addEventListener('resize', handleResize);
  // Memory leak! Listener never removed
}, []);

// ✅ Always clean up subscriptions
useEffect(() => {
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

---

## Quick Reference

### useState

| Syntax | When to Use |
|--------|-------------|
| `useState(initialValue)` | Simple initial value |
| `useState(() => compute())` | Expensive initial computation |
| `setState(newValue)` | Replace state entirely |
| `setState(prev => ...)` | New value depends on old value |

### useEffect

| Dependency Array | When Effect Runs |
|-----------------|------------------|
| None | After every render |
| `[]` | Once after mount |
| `[a, b]` | When `a` or `b` changes |

### Mental Model

```
useState  = "Remember this value between renders"
useEffect = "Do this after render, and clean up when done"
```

---

## References

### Official Documentation

- [React Docs: useState](https://react.dev/reference/react/useState)
- [React Docs: useEffect](https://react.dev/reference/react/useEffect)
- [React Docs: Synchronizing with Effects](https://react.dev/learn/synchronizing-with-effects)

### Learning Resources

- [React Docs: State - A Component's Memory](https://react.dev/learn/state-a-components-memory)
- [React Docs: You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)
- [Dan Abramov: A Complete Guide to useEffect](https://overreacted.io/a-complete-guide-to-useeffect/)

### Video Tutorials

- [Fireship: React Hooks Explained](https://www.youtube.com/watch?v=TNhaISOUy6Q)
- [Web Dev Simplified: Learn useState In 15 Minutes](https://www.youtube.com/watch?v=O6P86uwfdR0)
- [Web Dev Simplified: Learn useEffect In 13 Minutes](https://www.youtube.com/watch?v=0ZJgIjIuY7U)

---

## Next Steps

Now that you understand useState and useEffect:

1. Read [MEDIA_QUERY_HOOK.md](./MEDIA_QUERY_HOOK.md) to see them in action
2. Continue with [STEP_2_NAVIGATION_MENU.md](../STEP_2_NAVIGATION_MENU.md)
3. Experiment in Playground to solidify understanding

---

*This file is part of the JARVIS learning documentation. Last updated: January 2026*
