# Exercise 3: State - Remember Things

> **Goal**: Learn useState to make components interactive
> **Time**: ~25 minutes
> **Concepts**: useState, Events, State Updates

---

## What You'll Learn

- What state is and why it exists
- How to use the useState hook
- How to handle click events
- How to update state correctly

---

## Part 1: The Problem with Regular Variables

Let's try to make a counter with a regular variable:

```tsx
function Counter() {
  let count = 0;

  const handleClick = () => {
    count = count + 1;
    console.log(count);  // Shows 1, 2, 3...
  };

  return (
    <div>
      <p>Count: {count}</p>  {/* Always shows 0! */}
      <button onClick={handleClick}>Add</button>
    </div>
  );
}
```

**What happens:**
1. Click button → count becomes 1
2. Console shows 1 ✓
3. But UI still shows 0! ✗

**Why?** React doesn't know the variable changed. It needs to be told to re-render.

---

## Part 2: useState to the Rescue

`useState` is a hook that:
1. Remembers values between renders
2. Tells React to re-render when values change

```tsx
import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  //     ↑       ↑              ↑
  //   value   setter     initial value

  const handleClick = () => {
    setCount(count + 1);  // Triggers re-render!
  };

  return (
    <div>
      <p>Count: {count}</p>  {/* Now updates! */}
      <button onClick={handleClick}>Add</button>
    </div>
  );
}
```

### How It Works

```
1. Initial render:
   useState(0) returns [0, setCount]
   count = 0

2. User clicks button:
   setCount(1) is called
   React schedules a re-render

3. Re-render:
   useState(0) returns [1, setCount]  ← remembers!
   count = 1
   UI updates to show "1"
```

---

## Part 3: Hands-On Exercise

Let's make our Task toggleable!

### Step 1: Add State to App

```tsx
// App.tsx
import { useState } from 'react';
import Header from './components/Header';
import Task from './components/Task';

function App() {
  // State: list of tasks
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Learn React basics', completed: true },
    { id: 2, title: 'Understand props', completed: true },
    { id: 3, title: 'Master state', completed: false },
    { id: 4, title: 'Build Task Tracker', completed: false },
  ]);

  // Calculate counts from state
  const taskCount = tasks.length;
  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '1rem' }}>
      <Header taskCount={taskCount} completedCount={completedCount} />

      {tasks.map(task => (
        <Task
          key={task.id}
          title={task.title}
          completed={task.completed}
        />
      ))}
    </div>
  );
}
```

### Step 2: Add Toggle Function

```tsx
function App() {
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Learn React basics', completed: true },
    { id: 2, title: 'Understand props', completed: true },
    { id: 3, title: 'Master state', completed: false },
    { id: 4, title: 'Build Task Tracker', completed: false },
  ]);

  // Toggle a task's completed status
  const toggleTask = (id: number) => {
    setTasks(tasks.map(task =>
      task.id === id
        ? { ...task, completed: !task.completed }  // Toggle this one
        : task  // Keep others unchanged
    ));
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '1rem' }}>
      <Header
        taskCount={tasks.length}
        completedCount={tasks.filter(t => t.completed).length}
      />

      {tasks.map(task => (
        <Task
          key={task.id}
          title={task.title}
          completed={task.completed}
          onToggle={() => toggleTask(task.id)}  // Pass the handler
        />
      ))}
    </div>
  );
}
```

### Step 3: Update Task to Handle Clicks

```tsx
// Task.tsx
interface TaskProps {
  title: string;
  completed: boolean;
  onToggle: () => void;  // Callback from parent
}

function Task({ title, completed, onToggle }: TaskProps) {
  return (
    <div
      onClick={onToggle}  // Click anywhere to toggle
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '0.75rem 1rem',
        backgroundColor: 'white',
        borderRadius: '8px',
        marginBottom: '0.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        cursor: 'pointer',  // Show it's clickable
        transition: 'transform 0.1s ease'
      }}
    >
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

### Step 4: Test It!

Click on any task. It should:
- Toggle the checkbox icon (⬜ ↔ ✅)
- Update the strikethrough text
- Update the header counts

---

## Part 4: Understanding State Updates

### The Spread Operator Pattern

When updating objects/arrays in state, create NEW copies:

```tsx
// ❌ WRONG: Mutating state directly
const toggleTask = (id) => {
  const task = tasks.find(t => t.id === id);
  task.completed = !task.completed;  // Mutation!
  setTasks(tasks);  // Same array reference, React won't see the change
};

// ✅ RIGHT: Create new array with updated item
const toggleTask = (id) => {
  setTasks(tasks.map(task =>
    task.id === id
      ? { ...task, completed: !task.completed }  // New object
      : task
  ));
};
```

### Common State Update Patterns

```tsx
// Adding to array
setTasks([...tasks, newTask]);

// Removing from array
setTasks(tasks.filter(task => task.id !== idToRemove));

// Updating one item
setTasks(tasks.map(task =>
  task.id === id ? { ...task, title: 'New Title' } : task
));

// Updating object
setUser({ ...user, name: 'New Name' });
```

### Functional Updates (When New Depends on Old)

```tsx
// ❌ Might use stale state in rapid updates
setCount(count + 1);

// ✅ Always uses latest state
setCount(prevCount => prevCount + 1);

// For our tasks:
setTasks(prevTasks => prevTasks.map(task =>
  task.id === id ? { ...task, completed: !task.completed } : task
));
```

---

## Part 5: Add Delete Functionality

### Update App.tsx

```tsx
function App() {
  const [tasks, setTasks] = useState([...]);

  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  // NEW: Delete a task
  const deleteTask = (id: number) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  return (
    <div>
      <Header ... />
      {tasks.map(task => (
        <Task
          key={task.id}
          title={task.title}
          completed={task.completed}
          onToggle={() => toggleTask(task.id)}
          onDelete={() => deleteTask(task.id)}  // NEW
        />
      ))}
    </div>
  );
}
```

### Update Task.tsx

```tsx
interface TaskProps {
  title: string;
  completed: boolean;
  onToggle: () => void;
  onDelete: () => void;  // NEW
}

function Task({ title, completed, onToggle, onDelete }: TaskProps) {
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
      <span
        onClick={onToggle}
        style={{ marginRight: '0.75rem', fontSize: '1.25rem', cursor: 'pointer' }}
      >
        {completed ? '✅' : '⬜'}
      </span>
      <span
        onClick={onToggle}
        style={{
          textDecoration: completed ? 'line-through' : 'none',
          color: completed ? '#888' : '#333',
          flex: 1,
          cursor: 'pointer'
        }}
      >
        {title}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();  // Don't trigger parent onClick
          onDelete();
        }}
        style={{
          background: 'none',
          border: 'none',
          color: '#ef4444',
          cursor: 'pointer',
          fontSize: '1.25rem',
          padding: '0 0.5rem'
        }}
      >
        ✕
      </button>
    </div>
  );
}
```

---

## Challenge Exercises

### Challenge 1: Add "Complete All" Button

```tsx
function App() {
  // ... existing code ...

  const completeAll = () => {
    setTasks(prev => prev.map(task => ({ ...task, completed: true })));
  };

  return (
    <div>
      <Header ... />
      <button onClick={completeAll}>Complete All</button>
      {/* tasks */}
    </div>
  );
}
```

### Challenge 2: Add "Clear Completed" Button

```tsx
const clearCompleted = () => {
  setTasks(prev => prev.filter(task => !task.completed));
};
```

### Challenge 3: Add a Counter Component

```tsx
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <button onClick={() => setCount(c => c - 1)}>-</button>
      <span>{count}</span>
      <button onClick={() => setCount(c => c + 1)}>+</button>
    </div>
  );
}
```

---

## Common Mistakes

### Mistake 1: Mutating State Directly

```tsx
// ❌ Wrong
tasks.push(newTask);
setTasks(tasks);

// ✅ Right
setTasks([...tasks, newTask]);
```

### Mistake 2: Forgetting the Array Dependency

```tsx
// ❌ Uses stale 'tasks' if called rapidly
const addTask = () => {
  setTasks([...tasks, newTask]);
};

// ✅ Uses latest state
const addTask = () => {
  setTasks(prev => [...prev, newTask]);
};
```

### Mistake 3: Calling State Setter in Render

```tsx
// ❌ Infinite loop!
function Component() {
  const [count, setCount] = useState(0);
  setCount(count + 1);  // Called every render!
  return <div>{count}</div>;
}

// ✅ Only update in event handlers or useEffect
function Component() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      {count}
    </button>
  );
}
```

---

## Your Code So Far

```tsx
// App.tsx
import { useState } from 'react';
import Header from './components/Header';
import Task from './components/Task';

interface TaskType {
  id: number;
  title: string;
  completed: boolean;
}

function App() {
  const [tasks, setTasks] = useState<TaskType[]>([
    { id: 1, title: 'Learn React basics', completed: true },
    { id: 2, title: 'Understand props', completed: true },
    { id: 3, title: 'Master state', completed: false },
    { id: 4, title: 'Build Task Tracker', completed: false },
  ]);

  const toggleTask = (id: number) => {
    setTasks(prev => prev.map(task =>
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id: number) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '1rem' }}>
      <Header
        taskCount={tasks.length}
        completedCount={tasks.filter(t => t.completed).length}
      />

      {tasks.map(task => (
        <Task
          key={task.id}
          title={task.title}
          completed={task.completed}
          onToggle={() => toggleTask(task.id)}
          onDelete={() => deleteTask(task.id)}
        />
      ))}
    </div>
  );
}

export default App;
```

---

## Key Takeaways

1. **useState** returns `[value, setter]`
2. Call the setter to update state AND trigger re-render
3. Never mutate state directly - create new copies
4. Use functional updates `setState(prev => ...)` when new value depends on old
5. Callbacks (like `onToggle`) let children communicate with parents

---

## Next Exercise

We're rendering tasks with `.map()`, but there's a warning: "Each child should have a unique key prop."

Let's learn about **Lists and Keys** properly.

**[→ Exercise 4: Lists - Rendering Arrays](./04_lists.md)**
