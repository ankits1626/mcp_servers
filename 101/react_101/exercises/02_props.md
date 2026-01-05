# Exercise 2: Props - Passing Data

> **Goal**: Learn how to pass data from parent to child components
> **Time**: ~20 minutes
> **Concepts**: Props, Component Composition, TypeScript Types

---

## What You'll Learn

- What props are and why they exist
- How to pass props to components
- How to define prop types with TypeScript
- Component composition patterns

---

## Part 1: What Are Props?

**Props** = Properties = Data passed to a component

Think of props like function arguments:

```tsx
// Regular function with arguments
function greet(name) {
  return `Hello, ${name}!`;
}
greet('Alice');  // "Hello, Alice!"

// Component with props (same idea!)
function Greeting({ name }) {
  return <h1>Hello, {name}!</h1>;
}
<Greeting name="Alice" />  // <h1>Hello, Alice!</h1>
```

---

## Part 2: Props Syntax

### Passing Props (Parent)

```tsx
// Props look like HTML attributes
<Task title="Learn React" completed={false} priority={1} />
//    ↑ string        ↑ boolean       ↑ number
```

### Receiving Props (Child)

```tsx
// Method 1: Destructure in parameter
function Task({ title, completed, priority }) {
  return <div>{title}</div>;
}

// Method 2: Use props object
function Task(props) {
  return <div>{props.title}</div>;
}
```

### TypeScript Props (Recommended)

```tsx
// Define the shape of props
interface TaskProps {
  title: string;
  completed: boolean;
  priority?: number;  // ? means optional
}

// Use the type
function Task({ title, completed, priority = 1 }: TaskProps) {
  return <div>{title}</div>;
}
```

---

## Part 3: Hands-On Exercise

### Step 1: Create a Task Component

```tsx
// src/components/Task.tsx

interface TaskProps {
  title: string;
  completed: boolean;
}

function Task({ title, completed }: TaskProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '0.75rem 1rem',
      backgroundColor: 'white',
      borderRadius: '8px',
      marginBottom: '0.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <span style={{
        marginRight: '0.75rem',
        fontSize: '1.25rem'
      }}>
        {completed ? '✅' : '⬜'}
      </span>
      <span style={{
        textDecoration: completed ? 'line-through' : 'none',
        color: completed ? '#888' : '#333'
      }}>
        {title}
      </span>
    </div>
  );
}

export default Task;
```

### Step 2: Use Task Component with Different Props

```tsx
// In App.tsx or Playground.tsx

import Header from './components/Header';
import Task from './components/Task';

function App() {
  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '1rem' }}>
      <Header />

      {/* Each Task gets different props */}
      <Task title="Learn React basics" completed={true} />
      <Task title="Understand props" completed={true} />
      <Task title="Master state" completed={false} />
      <Task title="Build Task Tracker" completed={false} />
    </div>
  );
}
```

### Step 3: Update Header to Accept Props

```tsx
// src/components/Header.tsx

interface HeaderProps {
  title?: string;        // Optional with default
  taskCount: number;
  completedCount: number;
}

function Header({
  title = '📝 Task Tracker',  // Default value
  taskCount,
  completedCount
}: HeaderProps) {
  return (
    <header style={{
      backgroundColor: '#667eea',
      color: 'white',
      padding: '1rem',
      textAlign: 'center',
      borderRadius: '8px',
      marginBottom: '1rem'
    }}>
      <h1 style={{ margin: 0 }}>{title}</h1>
      <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9 }}>
        {taskCount} tasks · {completedCount} completed
      </p>
    </header>
  );
}

export default Header;
```

### Step 4: Pass Data to Header

```tsx
// In App.tsx

function App() {
  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '1rem' }}>
      <Header taskCount={4} completedCount={2} />

      <Task title="Learn React basics" completed={true} />
      <Task title="Understand props" completed={true} />
      <Task title="Master state" completed={false} />
      <Task title="Build Task Tracker" completed={false} />
    </div>
  );
}
```

---

## Part 4: The Children Prop

React has a special prop called `children` - it's whatever you put BETWEEN the opening and closing tags:

```tsx
// The Button component
interface ButtonProps {
  children: React.ReactNode;  // Special type for JSX content
  onClick?: () => void;
}

function Button({ children, onClick }: ButtonProps) {
  return (
    <button onClick={onClick} style={{
      padding: '0.5rem 1rem',
      backgroundColor: '#667eea',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    }}>
      {children}
    </button>
  );
}

// Usage - children is "Click me!"
<Button onClick={() => alert('Clicked!')}>
  Click me!
</Button>

// Usage - children can be JSX too
<Button>
  <span>🚀</span> Launch
</Button>
```

---

## Challenge: Extend the Task Component

### Challenge 1: Add Priority Prop

```tsx
interface TaskProps {
  title: string;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high';  // Union type
}

function Task({ title, completed, priority = 'medium' }: TaskProps) {
  const priorityColors = {
    low: '#10b981',     // green
    medium: '#f59e0b',  // orange
    high: '#ef4444'     // red
  };

  return (
    <div style={{ /* ... */ }}>
      <span style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: priorityColors[priority],
        marginRight: '0.75rem'
      }} />
      {/* ... rest of component */}
    </div>
  );
}
```

### Challenge 2: Add Created Date

```tsx
interface TaskProps {
  title: string;
  completed: boolean;
  createdAt: Date;
}

function Task({ title, completed, createdAt }: TaskProps) {
  const formattedDate = createdAt.toLocaleDateString();

  return (
    <div>
      <span>{completed ? '✅' : '⬜'}</span>
      <div>
        <p>{title}</p>
        <small>Created: {formattedDate}</small>
      </div>
    </div>
  );
}

// Usage
<Task
  title="Learn Props"
  completed={false}
  createdAt={new Date()}
/>
```

---

## Props vs Variables

```tsx
// ❌ Wrong: Hardcoded values
function Task() {
  const title = "Hardcoded task";  // Can't change from outside!
  return <div>{title}</div>;
}

// ✅ Right: Props make it reusable
function Task({ title }) {
  return <div>{title}</div>;
}

// Now you can use it multiple times with different data
<Task title="Task 1" />
<Task title="Task 2" />
<Task title="Task 3" />
```

---

## Key Rules About Props

### Rule 1: Props Are Read-Only

```tsx
// ❌ NEVER modify props
function Task({ title }) {
  title = "Modified";  // DON'T DO THIS!
  return <div>{title}</div>;
}

// ✅ Props are for READING only
function Task({ title }) {
  return <div>{title}</div>;
}
```

### Rule 2: Data Flows Down

```
Parent (App)
   │
   │ passes props
   ↓
Child (Task)
```

Props flow ONE direction: parent → child. Child cannot send props back up. (We'll learn how to communicate upward in Exercise 3 with callbacks.)

### Rule 3: Be Explicit About Types

```tsx
// ❌ Implicit any (TypeScript warns)
function Task({ title, completed }) { ... }

// ✅ Explicit types
interface TaskProps {
  title: string;
  completed: boolean;
}
function Task({ title, completed }: TaskProps) { ... }
```

---

## Common Mistakes

### Mistake 1: Forgetting Curly Braces for Non-Strings

```tsx
// ❌ Wrong - "false" is a string, not boolean
<Task completed="false" />

// ✅ Correct - use {} for non-strings
<Task completed={false} />
<Task count={42} />
<Task items={['a', 'b', 'c']} />
<Task onClick={() => console.log('clicked')} />
```

### Mistake 2: Typos in Prop Names

```tsx
// ❌ Parent passes 'title', child expects 'name'
<Task title="Learn React" />

function Task({ name }) {  // undefined!
  return <div>{name}</div>;
}

// ✅ Names must match
<Task title="Learn React" />

function Task({ title }) {
  return <div>{title}</div>;
}
```

---

## Your Code So Far

```tsx
// Task.tsx
interface TaskProps {
  title: string;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high';
}

function Task({ title, completed, priority = 'medium' }: TaskProps) {
  const priorityColors = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444'
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      padding: '0.75rem 1rem',
      backgroundColor: 'white',
      borderRadius: '8px',
      marginBottom: '0.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      <span style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: priorityColors[priority],
        marginRight: '0.75rem'
      }} />
      <span style={{ marginRight: '0.75rem', fontSize: '1.25rem' }}>
        {completed ? '✅' : '⬜'}
      </span>
      <span style={{
        textDecoration: completed ? 'line-through' : 'none',
        color: completed ? '#888' : '#333',
        flex: 1
      }}>
        {title}
      </span>
    </div>
  );
}

export default Task;
```

---

## Key Takeaways

1. **Props** = Data passed from parent to child
2. Props look like HTML attributes: `<Task title="..." />`
3. Use TypeScript interfaces to define prop types
4. Props are **read-only** - never modify them
5. Use `{}` for non-string values: `completed={false}`
6. `children` is a special prop for nested content

---

## Next Exercise

Props are great, but they're static - we hardcoded the tasks and completion status. What if we want to toggle a task's completion by clicking it?

We need **State** - data that can CHANGE over time.

**[→ Exercise 3: State - Remember Things](./03_state.md)**
