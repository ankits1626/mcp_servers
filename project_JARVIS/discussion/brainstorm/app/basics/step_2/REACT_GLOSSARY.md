# React Glossary: Plain English Definitions

> **Purpose**: Demystify the jargon. Every term explained like you're 10.

---

## State

### What It Is

**State = Data that can change and affects what the user sees.**

Think of state as the "current situation" of your app.

### Real-World Analogy

A **light switch** has state:
- State: `on` or `off`
- When state changes, the light changes

A **shopping cart** has state:
- State: list of items `["apple", "banana"]`
- When state changes (add/remove), the cart display changes

### In Code

```tsx
// The light switch example
const [isOn, setIsOn] = useState(false);

// isOn = current state (false = off)
// setIsOn = function to change state
// useState(false) = starting state is "off"

<button onClick={() => setIsOn(!isOn)}>
  Light is {isOn ? 'ON' : 'OFF'}
</button>
```

### Why It's Called "State"

Like asking "what state is the app in right now?"
- Login form: "waiting for input" state vs "submitting" state vs "error" state
- Music player: "playing" state vs "paused" state
- Our JARVIS app: "idle" state vs "recording" state vs "transcribing" state

---

## Side Effect

### What It Is

**Side Effect = Anything that affects something OUTSIDE your component.**

Your component's main job is to return UI (what to display). Anything else is a "side effect."

### Real-World Analogy

Making a sandwich (main task) vs:
- Texting a friend while making it (side effect)
- Turning on music (side effect)
- Writing in a diary (side effect)

The sandwich doesn't need those things, but you do them anyway.

### Examples of Side Effects

| Side Effect | Why It's "Outside" |
|-------------|-------------------|
| Fetching data from an API | Talks to a server (outside your component) |
| Setting a timer | Uses browser's timer system (outside React) |
| Changing the page title | Modifies the DOM directly (outside React) |
| Saving to localStorage | Writes to browser storage (outside your component) |
| Adding event listeners | Attaches to the window/document (outside React) |
| Logging to console | Writes to browser console (outside your component) |

### In Code

```tsx
// Main job: return UI
function UserProfile({ userId }) {
  const [user, setUser] = useState(null);

  // SIDE EFFECT: Fetching data from outside
  useEffect(() => {
    fetch(`/api/users/${userId}`)  // ← Talks to server (outside)
      .then(res => res.json())
      .then(data => setUser(data));
  }, [userId]);

  // SIDE EFFECT: Changing document title (outside React)
  useEffect(() => {
    document.title = user?.name || 'Loading...';  // ← Modifies DOM
  }, [user]);

  // Main job: return UI
  return <div>{user?.name}</div>;
}
```

### Why Use `useEffect` for Side Effects?

React needs to know when to run side effects:
- Not during rendering (causes bugs)
- After the component is on screen
- Only when certain data changes

`useEffect` = "Hey React, run this side effect after rendering"

---

## Render / Rendering

### What It Is

**Render = React figuring out what to show on screen.**

When React "renders" a component, it:
1. Calls your component function
2. Gets back the JSX (UI description)
3. Compares with what's currently on screen
4. Updates only what changed

### Real-World Analogy

**Painting a portrait:**
- First render: Paint the whole picture
- Re-render: Only touch up what changed (new hairstyle? just repaint the hair)

### In Code

```tsx
function Greeting({ name }) {
  console.log('Rendering!');  // This runs every render

  return <h1>Hello, {name}</h1>;  // This is what gets "rendered"
}

// First render: "Hello, Alice"
// Props change to name="Bob"
// Re-render: "Hello, Bob" (React updates just the text)
```

### When Does Rendering Happen?

1. **Initial render** - Component appears for the first time
2. **State changes** - `setState` is called
3. **Props change** - Parent passes new props
4. **Parent re-renders** - Child re-renders too (by default)

---

## Props

### What It Is

**Props = Data passed FROM a parent TO a child component.**

Short for "properties." Think of them as function arguments for components.

### Real-World Analogy

A **letter** has props:
- `to`: "Grandma"
- `from`: "You"
- `message`: "Happy Birthday!"

You pass these "props" to the letter, and it displays them.

### In Code

```tsx
// Parent passes props
function App() {
  return <Greeting name="Alice" age={25} />;
  //               ↑ props: name and age
}

// Child receives props
function Greeting({ name, age }) {
  return <p>Hello {name}, you are {age} years old!</p>;
}
```

### Props vs State

| Props | State |
|-------|-------|
| Passed from parent | Created inside component |
| Read-only (can't change) | Can be changed with setter |
| Like function arguments | Like local variables that persist |

```tsx
function Counter({ initialCount }) {  // initialCount is a PROP
  const [count, setCount] = useState(initialCount);  // count is STATE

  // Can't do: initialCount = 5  ← Props are read-only!
  // Can do: setCount(5)          ← State can change
}
```

---

## Component

### What It Is

**Component = A reusable piece of UI.**

Like LEGO blocks. You build small pieces, then combine them into something bigger.

### Real-World Analogy

A **car** is made of components:
- Engine component
- Wheel component (used 4 times!)
- Door component (used 2-4 times)
- Dashboard component

Each can be built separately and combined.

### In Code

```tsx
// Small component
function Button({ label, onClick }) {
  return <button onClick={onClick}>{label}</button>;
}

// Bigger component using smaller ones
function LoginForm() {
  return (
    <form>
      <input type="email" />
      <input type="password" />
      <Button label="Sign In" onClick={handleLogin} />
      <Button label="Cancel" onClick={handleCancel} />
    </form>
  );
}

// Even bigger component
function App() {
  return (
    <div>
      <Header />
      <LoginForm />
      <Footer />
    </div>
  );
}
```

---

## Hook

### What It Is

**Hook = A function that lets you use React features in function components.**

Hooks "hook into" React's internal systems (state, effects, context, etc.).

### Real-World Analogy

**Plugins for your brain:**
- `useState` = memory plugin (remember things)
- `useEffect` = alarm plugin (do things at certain times)
- `useContext` = telepathy plugin (know what others know)

### In Code

```tsx
function Example() {
  // useState HOOK: gives your function memory
  const [count, setCount] = useState(0);

  // useEffect HOOK: runs code after render
  useEffect(() => {
    document.title = `Count: ${count}`;
  }, [count]);

  return <button onClick={() => setCount(count + 1)}>{count}</button>;
}
```

### Why "Hook"?

You're "hooking into" React's systems, like hooking a fish:

```
Your Component 🎣 ──── useState() ────→ 🐟 React's State System
                 ──── useEffect() ───→ 🐟 React's Effect System
                 ──── useContext() ──→ 🐟 React's Context System
```

---

## JSX

### What It Is

**JSX = HTML-like syntax inside JavaScript.**

It looks like HTML but it's actually JavaScript that creates React elements.

### Real-World Analogy

Writing a **recipe** that looks like the final dish:
- Instead of: "Create a div, add a heading inside, set the text..."
- You write: `<div><h1>Hello</h1></div>` (looks like the result!)

### In Code

```tsx
// This JSX:
const element = <h1 className="title">Hello, {name}!</h1>;

// Gets converted to this JavaScript:
const element = React.createElement('h1', { className: 'title' }, `Hello, ${name}!`);

// JSX is just easier to read and write!
```

### JSX Rules

```tsx
// 1. Use className instead of class
<div className="container">  // ✅
<div class="container">      // ❌ (class is reserved in JS)

// 2. Close all tags
<img src="photo.jpg" />      // ✅ (self-closing)
<img src="photo.jpg">        // ❌

// 3. Use curly braces for JavaScript
<p>Hello, {name}</p>         // ✅ variable
<p>Sum: {2 + 2}</p>          // ✅ expression
<p>Hello, name</p>           // Shows literal "name"

// 4. Return a single root element
return (
  <div>                      // ✅ One root
    <h1>Title</h1>
    <p>Content</p>
  </div>
);

return (
  <h1>Title</h1>             // ❌ Two roots
  <p>Content</p>
);
```

---

## Dependency Array

### What It Is

**Dependency Array = The list that tells useEffect WHEN to run.**

It's the `[...]` at the end of useEffect.

### Real-World Analogy

**A motion sensor light:**
- "Turn on when: [motion detected]" ← motion is the dependency
- If motion changes (detected → not detected), the light responds

### In Code

```tsx
// No array: Run after EVERY render
useEffect(() => {
  console.log('Runs every time');
});

// Empty array: Run ONCE after first render
useEffect(() => {
  console.log('Runs once on mount');
}, []);  // ← Empty = no dependencies

// With dependencies: Run when dependencies change
useEffect(() => {
  console.log(`userId changed to ${userId}`);
}, [userId]);  // ← Runs when userId changes

// Multiple dependencies
useEffect(() => {
  console.log('name or age changed');
}, [name, age]);  // ← Runs when name OR age changes
```

### Visual

```
Dependency Array     When Effect Runs
─────────────────    ────────────────
(none)               After every render
[]                   Once (on mount)
[userId]             When userId changes
[a, b]               When a OR b changes
```

---

## Mount / Unmount

### What It Is

**Mount = Component appears on screen for the first time.**
**Unmount = Component is removed from the screen.**

### Real-World Analogy

**Actors on a stage:**
- Mount = Actor walks onto stage
- Unmount = Actor exits the stage

### In Code

```tsx
function Popup({ isVisible }) {
  // This effect runs on MOUNT
  useEffect(() => {
    console.log('Popup appeared!');  // Mount

    // This runs on UNMOUNT
    return () => {
      console.log('Popup disappeared!');  // Unmount
    };
  }, []);

  return <div>I'm a popup!</div>;
}

// In parent:
{showPopup && <Popup />}
// showPopup: false → true = Popup MOUNTS
// showPopup: true → false = Popup UNMOUNTS
```

### Lifecycle

```
Component Lifecycle:
┌─────────┐     ┌─────────┐     ┌─────────┐
│  Mount  │ ──→ │ Update  │ ──→ │ Unmount │
│ (born)  │     │ (lives) │     │ (dies)  │
└─────────┘     └─────────┘     └─────────┘
```

---

## Callback

### What It Is

**Callback = A function you pass to be called later.**

"Call me back when X happens."

### Real-World Analogy

Leaving your phone number at a restaurant:
- "Call me back when my table is ready"
- The restaurant doesn't call immediately; they call back later when ready

### In Code

```tsx
// onClick is a CALLBACK
<button onClick={() => console.log('Clicked!')}>
  Click me
</button>
// "Hey button, call this function back when you're clicked"

// setTimeout uses a CALLBACK
setTimeout(() => {
  console.log('2 seconds passed!');
}, 2000);
// "Hey browser, call this function back in 2 seconds"

// Array methods use CALLBACKS
const doubled = [1, 2, 3].map((num) => num * 2);
// "Hey map, call this function back for each number"
```

### In React

```tsx
// Parent passes a callback to child
function Parent() {
  const handleChildClick = () => {
    console.log('Child was clicked!');
  };

  return <Child onClick={handleChildClick} />;
  //            ↑ Callback passed as prop
}

function Child({ onClick }) {
  return <button onClick={onClick}>Click me</button>;
  //                      ↑ Callback called when clicked
}
```

---

## Conditional Rendering

### What It Is

**Conditional Rendering = Showing different UI based on conditions.**

"If X, show A. Otherwise, show B."

### Real-World Analogy

A **restaurant sign:**
- If open: Show "OPEN" sign
- If closed: Show "CLOSED" sign

### In Code

```tsx
// Using ternary operator (? :)
function Greeting({ isLoggedIn }) {
  return isLoggedIn ? <h1>Welcome back!</h1> : <h1>Please log in</h1>;
}

// Using && (short-circuit)
function Notification({ hasMessages }) {
  return (
    <div>
      {hasMessages && <span>You have new messages!</span>}
      {/* Shows span only if hasMessages is true */}
    </div>
  );
}

// Using if/else
function Status({ status }) {
  if (status === 'loading') return <Spinner />;
  if (status === 'error') return <Error />;
  return <Content />;
}
```

### Our Use Case

```tsx
// In Layout.tsx - conditional rendering based on screen size
function Layout() {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  return (
    <div>
      {isDesktop ? <Sidebar /> : <BottomTabs />}
      {/* Desktop: show Sidebar */}
      {/* Mobile: show BottomTabs */}
    </div>
  );
}
```

---

## Event Handler

### What It Is

**Event Handler = A function that runs when something happens (an event).**

### Real-World Analogy

**A doorbell system:**
- Event: Someone presses the doorbell
- Handler: Play the "ding dong" sound

### Common Events

| Event | When It Fires |
|-------|---------------|
| `onClick` | User clicks |
| `onChange` | Input value changes |
| `onSubmit` | Form is submitted |
| `onMouseEnter` | Mouse enters element |
| `onKeyDown` | Key is pressed |
| `onFocus` | Element gets focus |
| `onBlur` | Element loses focus |

### In Code

```tsx
function Form() {
  const [name, setName] = useState('');

  // Event handler for click
  const handleClick = () => {
    alert('Button clicked!');
  };

  // Event handler for input change
  const handleChange = (e) => {
    setName(e.target.value);  // e.target.value = what user typed
  };

  // Event handler for form submit
  const handleSubmit = (e) => {
    e.preventDefault();  // Stop page refresh
    console.log('Submitted:', name);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={handleChange} />
      <button type="submit" onClick={handleClick}>Submit</button>
    </form>
  );
}
```

---

## Quick Reference Table

| Term | One-Line Definition |
|------|---------------------|
| **State** | Data that changes and affects what you see |
| **Props** | Data passed from parent to child |
| **Component** | Reusable piece of UI |
| **Hook** | Function to use React features |
| **JSX** | HTML-like syntax in JavaScript |
| **Render** | React figuring out what to show |
| **Side Effect** | Anything outside your component (API, DOM, timers) |
| **Mount** | Component appears on screen |
| **Unmount** | Component removed from screen |
| **Callback** | Function passed to be called later |
| **Event Handler** | Function that runs when user does something |
| **Dependency Array** | List that tells useEffect when to run |
| **Conditional Rendering** | Showing different UI based on conditions |

---

## Reading Order

Now that you know the jargon:

1. **[WHAT_ARE_HOOKS.md](./WHAT_ARE_HOOKS.md)** - What hooks are and why they exist
2. **[REACT_HOOKS_BASICS.md](./REACT_HOOKS_BASICS.md)** - Deep dive into useState and useEffect
3. **[MEDIA_QUERY_HOOK.md](./MEDIA_QUERY_HOOK.md)** - Custom hook example
4. **[CSS_VARIABLES.md](./CSS_VARIABLES.md)** - Theming system

---

*This file is part of the JARVIS learning documentation. Last updated: January 2026*
