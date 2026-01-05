# Exercise 2: Components

> **Goal**: Break UI into reusable pieces
> **Time**: ~15 minutes
> **Difficulty**: Beginner

---

## What You'll Learn

- What a component is
- How to create components
- How to use components
- When to create a new component

---

## Part 1: What is a Component?

A **component** is a function that returns JSX. That's it!

```tsx
// This is a component
function Header() {
  return <h1>🔶 HN Jobs</h1>
}
```

Think of components like LEGO blocks:

- Build small pieces
- Combine them into bigger pieces
- Reuse the same piece multiple times

---

## Part 2: Your First Component

### Step 1: Create a Header Component

Create a new file `src/components/Header.tsx`:

```tsx
function Header() {
  return (
    <header style={{
      backgroundColor: '#ff6600',
      color: 'white',
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}>
      <span style={{ fontSize: '24px' }}>🔶</span>
      <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
        HN Jobs
      </h1>
    </header>
  )
}

export default Header
```

### Step 2: Use the Component

Update `src/App.tsx`:

```tsx
import Header from './components/Header'

function App() {
  return (
    <div>
      <Header />
      <p>Jobs will appear here...</p>
    </div>
  )
}

export default App
```

Notice:

- `import Header from './components/Header'` - import the component
- `<Header />` - use it like an HTML tag

---

## Part 3: Create More Components

### JobRow Component

This will display a single job in our table. Create `src/components/JobRow.tsx`:

```tsx
function JobRow() {
  return (
    <tr style={{
      borderBottom: '1px solid #f0f0f0'
    }}>
      <td style={{ padding: '12px 8px' }}>Stripe</td>
      <td style={{ padding: '12px 8px' }}>Senior Engineer</td>
      <td style={{ padding: '12px 8px', color: '#666' }}>2 hours ago</td>
      <td style={{ padding: '12px 8px', textAlign: 'center' }}>➜</td>
    </tr>
  )
}

export default JobRow
```

### Use Multiple JobRows

Update `src/App.tsx`:

```tsx
import Header from './components/Header'
import JobRow from './components/JobRow'

function App() {
  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <Header />

      <main style={{ padding: '20px' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: 'white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f9f9f9' }}>
              <th style={{ padding: '12px 8px', textAlign: 'left' }}>Company</th>
              <th style={{ padding: '12px 8px', textAlign: 'left' }}>Title</th>
              <th style={{ padding: '12px 8px', textAlign: 'left' }}>Posted</th>
              <th style={{ padding: '12px 8px', width: '40px' }}></th>
            </tr>
          </thead>
          <tbody>
            <JobRow />
            <JobRow />
            <JobRow />
          </tbody>
        </table>
      </main>
    </div>
  )
}

export default App
```

You now have 3 job rows! But they all show the same data...

We'll fix that with **props** in the next exercise.

---

## Part 4: Component Naming Rules

### Rule 1: Start with Capital Letter

```tsx
// ❌ WRONG: lowercase = HTML element
function header() { ... }
<header />  // This is the HTML <header> tag!

// ✅ CORRECT: PascalCase = React component
function Header() { ... }
<Header />  // This is your component
```

### Rule 2: One Component Per File (Recommended)

```text
src/
├── components/
│   ├── Header.tsx      # One component
│   ├── JobRow.tsx      # One component
│   ├── JobTable.tsx    # One component
│   └── JobDetail.tsx   # One component
└── App.tsx
```

### Rule 3: Export the Component

```tsx
// Named export
export function Header() { ... }
// Import: import { Header } from './Header'

// Default export (more common)
function Header() { ... }
export default Header
// Import: import Header from './Header'
```

---

## Part 5: When to Create a New Component?

Create a new component when you have:

1. **Repeated UI** - Same structure appears multiple times
2. **Logical section** - A distinct part of the page (header, table, detail view)
3. **Reusable piece** - Could be used in other parts of the app
4. **Complex section** - Too much code in one place

### Our HN Jobs App Structure

```text
┌─────────────────────────────────────┐
│             Header                  │  ← Header component
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐    │
│  │ Company | Title | Posted | ➜ │    │  ← Table header
│  ├─────────────────────────────┤    │
│  │ Stripe  | Eng   | 2h ago | ➜ │    │  ← JobRow component
│  ├─────────────────────────────┤    │
│  │ Vercel  | Dev   | 5h ago | ➜ │    │  ← JobRow component (reused!)
│  ├─────────────────────────────┤    │
│  │ Linear  | React | 1d ago | ➜ │    │  ← JobRow component (reused!)
│  └─────────────────────────────┘    │
│                                     │
│  [◀ Prev]  Page 1 of 5  [Next ▶]    │
└─────────────────────────────────────┘
```

---

## Challenge: Add Status Bar

Create a StatusBar component that shows:

- Number of jobs loaded
- Last updated time

File: `src/components/StatusBar.tsx`

<details>
<summary>Click to see solution</summary>

```tsx
// src/components/StatusBar.tsx
function StatusBar() {
  const jobCount = 45
  const lastUpdated = new Date().toLocaleTimeString()

  return (
    <div style={{
      backgroundColor: '#fffbf0',
      padding: '8px 16px',
      fontSize: '13px',
      color: '#666',
      borderBottom: '1px solid #f0f0f0'
    }}>
      {jobCount} jobs loaded · Last updated: {lastUpdated}
    </div>
  )
}

export default StatusBar
```

```tsx
// src/App.tsx
import Header from './components/Header'
import StatusBar from './components/StatusBar'
import JobRow from './components/JobRow'

function App() {
  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <Header />
      <StatusBar />

      <main style={{ padding: '20px' }}>
        {/* table code here */}
      </main>
    </div>
  )
}

export default App
```

</details>

---

## Key Takeaways

1. **Component** = A function that returns JSX
2. Component names must be **PascalCase** (start with capital)
3. Use `export default` to share components
4. Use `import` to bring in components
5. Components are like **reusable LEGO blocks**

---

## Your Project Structure

```text
hn-jobs/
├── src/
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── StatusBar.tsx
│   │   └── JobRow.tsx
│   ├── App.tsx
│   └── main.tsx
└── ...
```

---

## The Problem

Right now all JobRow components show the same data:

```tsx
<JobRow />  // "Stripe" - "Senior Engineer"
<JobRow />  // "Stripe" - "Senior Engineer" (same!)
<JobRow />  // "Stripe" - "Senior Engineer" (same!)
```

How do we make each one show different job data?

That's what **Props** are for!

**[→ Exercise 3: Props](./03_props.md)**
