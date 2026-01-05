# Exercise 7: Events

> **Goal**: Handle user interactions with event handlers
> **Time**: ~20 minutes
> **Difficulty**: Beginner

---

## What You'll Learn

- How to handle clicks, inputs, and other events
- Event handler naming conventions
- Passing data with event handlers
- Preventing default behavior
- TypeScript types for events

---

## Part 1: Basic Event Handling

In React, events use camelCase and pass functions:

```tsx
// HTML
<button onclick="handleClick()">Click me</button>

// React
<button onClick={handleClick}>Click me</button>
```

### Simple Click Handler

```tsx
function Button() {
  const handleClick = () => {
    console.log('Button clicked!')
  }

  return <button onClick={handleClick}>Click me</button>
}
```

### Inline Handler

For simple actions, you can use inline functions:

```tsx
<button onClick={() => console.log('Clicked!')}>
  Click me
</button>
```

---

## Part 2: Event Handler Conventions

### Naming Pattern

- Handler functions: `handle` + `EventName`
- Props: `on` + `EventName`

```tsx
// In a component
const handleClick = () => { ... }
const handleSubmit = () => { ... }
const handleSelectJob = () => { ... }

// When passing as props
<Button onClick={handleClick} />
<Form onSubmit={handleSubmit} />
<JobRow onSelect={handleSelectJob} />
```

### Component Example

```tsx
// Parent component defines handlers
function App() {
  const handleSelectJob = (job: Job) => {
    console.log('Selected:', job)
  }

  return <JobRow onSelect={handleSelectJob} />  // Pass as `on*` prop
}

// Child component receives as `on*` prop
function JobRow({ onSelect }: { onSelect: (job: Job) => void }) {
  const handleClick = () => {  // Internal handler is `handle*`
    onSelect(currentJob)
  }

  return <tr onClick={handleClick}>...</tr>
}
```

---

## Part 3: Common Event Types

### Click Events

```tsx
<button onClick={() => setCount(count + 1)}>
  Increment
</button>

<tr onClick={() => onSelect(job)}>
  {/* row content */}
</tr>
```

### Input/Change Events

```tsx
function SearchInput() {
  const [value, setValue] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
  }

  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
      placeholder="Search jobs..."
    />
  )
}
```

### Form Submit Events

```tsx
function SearchForm() {
  const [query, setQuery] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()  // Prevent page reload
    console.log('Searching for:', query)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <button type="submit">Search</button>
    </form>
  )
}
```

### Keyboard Events

```tsx
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter') {
    handleSubmit()
  }
  if (e.key === 'Escape') {
    handleCancel()
  }
}

<input onKeyDown={handleKeyDown} />
```

---

## Part 4: Passing Data to Handlers

### Problem: Passing Arguments

```tsx
// ❌ This calls the function immediately!
<button onClick={handleClick(job.id)}>Select</button>

// ✅ Wrap in arrow function
<button onClick={() => handleClick(job.id)}>Select</button>
```

### Real Example: JobRow

```tsx
function JobRow({ job, onSelect }: JobRowProps) {
  return (
    <tr onClick={() => onSelect(job)}>
      {/* Pass the job to the handler */}
    </tr>
  )
}

// Parent
function JobTable({ jobs, onSelectJob }) {
  return (
    <tbody>
      {jobs.map(job => (
        <JobRow
          key={job.id}
          job={job}
          onSelect={onSelectJob}  // Handler receives the job
        />
      ))}
    </tbody>
  )
}
```

---

## Part 5: Event Object

Event handlers receive an event object with useful info:

```tsx
const handleClick = (e: React.MouseEvent) => {
  console.log(e.target)        // Element that triggered the event
  console.log(e.currentTarget) // Element with the handler attached
  console.log(e.clientX)       // Mouse X position
  console.log(e.clientY)       // Mouse Y position
}

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  console.log(e.target.value)  // Input's current value
  console.log(e.target.name)   // Input's name attribute
}
```

---

## Part 6: Preventing Default Behavior

Some elements have default behaviors you may want to stop:

```tsx
// Links navigate away
<a href="/about" onClick={(e) => {
  e.preventDefault()  // Stop navigation
  showAboutModal()
}}>About</a>

// Forms submit and reload
<form onSubmit={(e) => {
  e.preventDefault()  // Stop form submission
  handleCustomSubmit()
}}>

// Right-click shows context menu
<div onContextMenu={(e) => {
  e.preventDefault()  // Stop context menu
  showCustomMenu()
}}>
```

---

## Part 7: Stop Propagation

Prevent events from bubbling up to parent elements:

```tsx
function JobRow({ job, onSelect }) {
  return (
    <tr onClick={() => onSelect(job)}>
      <td>{job.company}</td>
      <td>{job.title}</td>
      <td>
        {job.url && (
          <a
            href={job.url}
            onClick={(e) => {
              e.stopPropagation()  // Don't trigger row's onClick
            }}
          >
            Apply ↗
          </a>
        )}
      </td>
    </tr>
  )
}
```

Without `stopPropagation()`, clicking the link would:

1. Navigate to the URL
2. AND select the job row

---

## Part 8: TypeScript Event Types

Common event types:

```typescript
// Mouse events
React.MouseEvent<HTMLButtonElement>
React.MouseEvent<HTMLDivElement>

// Form events
React.FormEvent<HTMLFormElement>

// Change events
React.ChangeEvent<HTMLInputElement>
React.ChangeEvent<HTMLSelectElement>
React.ChangeEvent<HTMLTextAreaElement>

// Keyboard events
React.KeyboardEvent<HTMLInputElement>

// Focus events
React.FocusEvent<HTMLInputElement>
```

### Example with Full Types

```tsx
interface JobRowProps {
  job: Job
  onSelect: (job: Job) => void
}

function JobRow({ job, onSelect }: JobRowProps) {
  const handleClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
    onSelect(job)
  }

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.stopPropagation()
  }

  return (
    <tr onClick={handleClick}>
      <td>{job.company}</td>
      <td>
        <a href={job.url} onClick={handleLinkClick}>Apply</a>
      </td>
    </tr>
  )
}
```

---

## Part 9: Add Search to HN Jobs

Let's add a search input to filter jobs:

```tsx
// src/App.tsx
import { useState } from 'react'
import Header from './components/Header'
import JobTable from './components/JobTable'
import type { Job } from './types'

const mockJobs: Job[] = [/* ... */]

function App() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  // Filter jobs by search query
  const filteredJobs = mockJobs.filter(job =>
    job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <Header jobCount={filteredJobs.length} />

      <div style={{ padding: '20px 20px 0' }}>
        <input
          type="text"
          placeholder="Search companies or job titles..."
          value={searchQuery}
          onChange={handleSearchChange}
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: '16px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      <main style={{ padding: '20px' }}>
        <JobTable
          jobs={filteredJobs}
          selectedJobId={selectedJob?.id}
          onSelectJob={setSelectedJob}
        />
      </main>
    </div>
  )
}

export default App
```

---

## Challenge: Add Keyboard Navigation

Allow using arrow keys to navigate the job list:

<details>
<summary>Click to see solution</summary>

```tsx
function App() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev =>
        Math.min(prev + 1, filteredJobs.length - 1)
      )
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    }

    if (e.key === 'Enter' && selectedIndex >= 0) {
      setSelectedJob(filteredJobs[selectedIndex])
    }

    if (e.key === 'Escape') {
      setSelectedIndex(-1)
      setSelectedJob(null)
    }
  }

  // Keep selected job in sync with index
  useEffect(() => {
    if (selectedIndex >= 0 && selectedIndex < filteredJobs.length) {
      setSelectedJob(filteredJobs[selectedIndex])
    }
  }, [selectedIndex, filteredJobs])

  return (
    <div
      tabIndex={0}  // Make div focusable
      onKeyDown={handleKeyDown}
      style={{ outline: 'none' }}
    >
      {/* ... rest of app */}
    </div>
  )
}
```

</details>

---

## Key Takeaways

1. React events use **camelCase**: `onClick`, `onChange`, `onSubmit`
2. Pass **functions**, not function calls: `onClick={handleClick}`
3. Use `e.preventDefault()` to stop default behaviors
4. Use `e.stopPropagation()` to stop event bubbling
5. TypeScript provides event types like `React.MouseEvent<HTMLElement>`
6. Naming: handlers are `handle*`, props are `on*`

---

## Your Code So Far

```tsx
// Event handler patterns used:

// Click with data
<tr onClick={() => onSelect(job)}>

// Input change
<input onChange={(e) => setSearch(e.target.value)} />

// Prevent default
<form onSubmit={(e) => { e.preventDefault(); ... }}>

// Stop propagation
<a onClick={(e) => { e.stopPropagation(); ... }}>
```

---

## What's Next?

We have static mock data. Time to fetch real jobs from the HackerNews API!

For that, we need **useEffect** - the hook for side effects.

**[→ Exercise 8: useEffect](./08_useeffect.md)**
