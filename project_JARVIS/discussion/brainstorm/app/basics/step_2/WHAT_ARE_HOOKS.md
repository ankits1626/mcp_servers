# What Are React Hooks?

> **The One-Line Answer**: Hooks are special functions that let you "plug into" React features from regular JavaScript functions.

---

## The Simplest Explanation

Think of React components as **recipes**. A recipe tells you how to make something, but it needs **tools** to actually do the work:

- Need to **remember** something? → Use `useState` (like a notepad)
- Need to **do something** after cooking? → Use `useEffect` (like a timer)
- Need to **share** something across recipes? → Use `useContext` (like a shared pantry)

**Hooks ARE those tools.**

```tsx
// A component is just a function that returns UI
function Counter() {
  // useState is a HOOK - it gives this function memory
  const [count, setCount] = useState(0);

  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

---

## Why Do Hooks Exist?

### The Problem: Functions Don't Remember

Regular JavaScript functions forget everything when they finish:

```javascript
function sayHello() {
  let count = 0;
  count++;
  console.log(`Hello! Count: ${count}`);
}

sayHello(); // "Hello! Count: 1"
sayHello(); // "Hello! Count: 1" ← Still 1! count resets each time
sayHello(); // "Hello! Count: 1"
```

React components are functions that run **every time the UI needs to update**. Without hooks, they'd forget everything:

```tsx
// ❌ Without hooks - count resets to 0 every render
function Counter() {
  let count = 0;  // This resets EVERY time React calls Counter()

  return (
    <button onClick={() => count++}>  {/* count becomes 1... */}
      {count}                           {/* ...but UI still shows 0 */}
    </button>
  );
}
```

### The Solution: Hooks Give Functions Memory

```tsx
// ✅ With hooks - count persists between renders
function Counter() {
  const [count, setCount] = useState(0);  // React remembers this!

  return (
    <button onClick={() => setCount(count + 1)}>
      {count}  {/* Shows 0, then 1, then 2... */}
    </button>
  );
}
```

**How?** React stores hook values **outside** the function, in a special place it manages. When the function runs again, React gives it back the stored values.

---

## The "Hook" Analogy

Imagine your component is a **fishing rod**, and React's features are **fish in a pond**:

```
                    React's Internal State
                    ┌─────────────────────┐
                    │  🐟 State values    │
                    │  🐟 Effects         │
    Your Component  │  🐟 Context         │
         🎣─────────│  🐟 Refs            │
     "useState()"   │  🐟 Memos           │
                    └─────────────────────┘

When you call useState(), you're "hooking" into React's
state management system to grab a state value.
```

The name "hook" comes from this idea: you're **hooking into** React's internal systems.

---

## The Rules of Hooks

Hooks have two simple rules:

### Rule 1: Only Call at the Top Level

```tsx
// ✅ GOOD: At the top level
function MyComponent() {
  const [name, setName] = useState('');
  const [age, setAge] = useState(0);
  // ...
}

// ❌ BAD: Inside a condition
function MyComponent() {
  if (someCondition) {
    const [name, setName] = useState('');  // BREAKS!
  }
}

// ❌ BAD: Inside a loop
function MyComponent() {
  for (let i = 0; i < 3; i++) {
    const [value, setValue] = useState(0);  // BREAKS!
  }
}
```

**Why?** React identifies hooks by their **order**. If you skip a hook sometimes, React gets confused:

```
Render 1:           Render 2 (condition false):
  Hook 1 → name       Hook 1 → age        ← MISMATCH!
  Hook 2 → age        (name hook skipped)
```

### Rule 2: Only Call in React Functions

```tsx
// ✅ GOOD: In a React component
function MyComponent() {
  const [value, setValue] = useState(0);
}

// ✅ GOOD: In a custom hook
function useMyHook() {
  const [value, setValue] = useState(0);
  return value;
}

// ❌ BAD: In a regular function
function calculateSomething() {
  const [value, setValue] = useState(0);  // BREAKS!
}
```

---

## The Built-in Hooks

React comes with several hooks. Here are the most common:

### 1. useState - Remember a Value

```tsx
const [count, setCount] = useState(0);
//     ↑        ↑              ↑
//   value   updater    initial value
```

**Use when:** You need to remember something that can change (user input, toggle states, counters, etc.)

### 2. useEffect - Do Something After Render

```tsx
useEffect(() => {
  // This runs AFTER the component renders
  document.title = `Count: ${count}`;
}, [count]);  // Only re-run when count changes
```

**Use when:** You need to interact with the "outside world" (APIs, DOM, timers, subscriptions)

### 3. useContext - Access Shared Data

```tsx
const theme = useContext(ThemeContext);
// Gets the nearest ThemeContext value from a parent
```

**Use when:** You need to share data across many components without passing props

### 4. useRef - Reference a Value Without Re-rendering

```tsx
const inputRef = useRef(null);
// inputRef.current can be mutated without causing re-render
```

**Use when:** You need to reference DOM elements or store mutable values that shouldn't trigger re-renders

### 5. useMemo - Cache Expensive Calculations

```tsx
const expensiveResult = useMemo(() => {
  return heavyCalculation(data);
}, [data]);  // Only recalculate when data changes
```

**Use when:** You have expensive calculations you don't want to repeat unnecessarily

### 6. useCallback - Cache a Function

```tsx
const handleClick = useCallback(() => {
  console.log(count);
}, [count]);  // New function only when count changes
```

**Use when:** Passing callbacks to optimized child components

---

## Custom Hooks: Making Your Own Tools

You can combine built-in hooks into custom hooks:

```tsx
// Custom hook - name MUST start with "use"
function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return width;
}

// Usage in any component
function MyComponent() {
  const width = useWindowWidth();  // Just works!
  return <p>Window is {width}px wide</p>;
}
```

**Our `useMediaQuery` hook is a custom hook!** It combines `useState` and `useEffect` to detect screen size.

---

## Visual: How Hooks Work

```
┌─────────────────────────────────────────────────────────────────┐
│                     REACT'S INTERNAL MEMORY                      │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  Counter component's hooks:                              │    │
│  │    Slot 0: count = 5                                     │    │
│  │    Slot 1: effect (document.title)                       │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              ↑
                              │ Hooks connect here
                              │
┌─────────────────────────────────────────────────────────────────┐
│  function Counter() {                                            │
│    const [count, setCount] = useState(0);  ← Reads from Slot 0  │
│                                                                  │
│    useEffect(() => {                       ← Reads from Slot 1  │
│      document.title = `Count: ${count}`;                        │
│    }, [count]);                                                  │
│                                                                  │
│    return <button onClick={() => setCount(count + 1)}>          │
│      {count}                                                     │
│    </button>;                                                    │
│  }                                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Before vs After Hooks (History)

Before hooks (pre-2019), you needed **class components** for state:

```tsx
// ❌ OLD WAY: Class component (verbose, confusing 'this')
class Counter extends React.Component {
  constructor(props) {
    super(props);
    this.state = { count: 0 };
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick() {
    this.setState({ count: this.state.count + 1 });
  }

  render() {
    return (
      <button onClick={this.handleClick}>
        {this.state.count}
      </button>
    );
  }
}

// ✅ NEW WAY: Function component with hooks (clean, simple)
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <button onClick={() => setCount(count + 1)}>
      {count}
    </button>
  );
}
```

**Hooks won.** As of 2025, virtually all new React code uses hooks. Class components are legacy.

---

## Quick Reference

| Hook | Purpose | Example |
|------|---------|---------|
| `useState` | Remember a value | `const [x, setX] = useState(0)` |
| `useEffect` | Side effects | `useEffect(() => { ... }, [deps])` |
| `useContext` | Access context | `const ctx = useContext(MyContext)` |
| `useRef` | Mutable reference | `const ref = useRef(null)` |
| `useMemo` | Cache calculation | `const val = useMemo(() => ..., [deps])` |
| `useCallback` | Cache function | `const fn = useCallback(() => ..., [deps])` |
| `useReducer` | Complex state | `const [state, dispatch] = useReducer(reducer, init)` |

---

## Key Takeaways

1. **Hooks are functions** that let you use React features in function components
2. **useState** = memory between renders
3. **useEffect** = do something after render
4. **Custom hooks** = reusable logic (like `useMediaQuery`)
5. **Rules**: Always call at top level, only in React functions
6. **Convention**: Custom hooks start with `use` (e.g., `useMediaQuery`)

---

## References

### Official Documentation

- [React Docs: Introducing Hooks](https://react.dev/reference/react/hooks)
- [React Docs: Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)
- [React Docs: Built-in Hooks](https://react.dev/reference/react/hooks)

### Learning Resources

- [React Docs: State - A Component's Memory](https://react.dev/learn/state-a-components-memory)
- [React Docs: Reusing Logic with Custom Hooks](https://react.dev/learn/reusing-logic-with-custom-hooks)

### Video Tutorials

- [Fireship: React Hooks Explained in 8 Minutes](https://www.youtube.com/watch?v=TNhaISOUy6Q)
- [Web Dev Simplified: Learn React Hooks](https://www.youtube.com/playlist?list=PLZlA0Gpn_vH8EtggFGERCwMY5u5hOjf-h)

---

## Reading Order

Now that you understand what hooks are:

1. **[REACT_HOOKS_BASICS.md](./REACT_HOOKS_BASICS.md)** - Deep dive into useState and useEffect
2. **[MEDIA_QUERY_HOOK.md](./MEDIA_QUERY_HOOK.md)** - See hooks in action (our custom hook)
3. **[CSS_VARIABLES.md](./CSS_VARIABLES.md)** - Theming system
4. **[STEP_2_NAVIGATION_MENU.md](../STEP_2_NAVIGATION_MENU.md)** - Put it all together

---

*This file is part of the JARVIS learning documentation. Last updated: January 2026*
