# Exercise 5: State

> **Goal**: Learn useState to make components interactive and remember data
> **Time**: ~25 minutes
> **Difficulty**: Beginner

---

## What You'll Learn

- What state is and why we need it
- How to use the useState hook
- How to update state correctly
- State vs Props

---

## Part 1: The Problem with Regular Variables

Let's try to track which job is selected with a regular variable:

```tsx
function App() {
  let selectedJobId = null  // Regular variable

  const handleSelectJob = (job: Job) => {
    selectedJobId = job.id  // Update the variable
    console.log('Selected:', selectedJobId)  // Shows the new value
  }

  return (
    <div>
      {/* But the UI never updates! */}
      <p>Selected: {selectedJobId}</p>
    </div>
  )
}
```

**What happens:**

1. Click a job → `selectedJobId` becomes `12345`
2. Console shows `12345` ✓
3. But UI still shows `null`! ✗

**Why?** React doesn't know the variable changed. It needs to be told to re-render.

---

## Part 2: useState to the Rescue

`useState` is a hook that:

1. **Remembers** values between renders
2. **Triggers re-render** when values change

```tsx
import { useState } from 'react'

function App() {
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null)
  //      ↑               ↑                            ↑
  //    value          setter                   initial value

  const handleSelectJob = (job: Job) => {
    setSelectedJobId(job.id)  // This triggers a re-render!
  }

  return (
    <div>
      <p>Selected: {selectedJobId}</p>  {/* Now updates! */}
    </div>
  )
}
```

### How It Works

```text
1. Initial render:
   useState(null) returns [null, setSelectedJobId]
   selectedJobId = null

2. User clicks a job:
   setSelectedJobId(12345) is called
   React schedules a re-render

3. Re-render:
   useState(null) returns [12345, setSelectedJobId]  ← remembers!
   selectedJobId = 12345
   UI updates to show "12345"
```

---

## Part 3: Track Selected Job

Let's implement job selection in our app.

### Step 1: Add State to App

```tsx
// src/App.tsx
import { useState } from 'react'
import Header from './components/Header'
import JobRow from './components/JobRow'
import type { Job } from './types'

const mockJobs: Job[] = [
  { id: 12345, company: "Stripe", title: "Senior Engineer", postedTime: "2 hours ago", by: "stripe" },
  { id: 12346, company: "Vercel", title: "Full Stack Developer", postedTime: "5 hours ago", by: "vercel" },
  { id: 12347, company: "Linear", title: "React Developer", postedTime: "1 day ago", by: "linear" },
  { id: 12348, company: "Anthropic", title: "ML Engineer", postedTime: "2 days ago", by: "anthropic" }
]

function App() {
  // State: currently selected job (null = no selection)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <Header jobCount={mockJobs.length} />

      {/* Show which job is selected */}
      {selectedJob && (
        <div style={{
          padding: '12px 20px',
          backgroundColor: '#fff3e0',
          borderBottom: '1px solid #ffcc80'
        }}>
          Selected: {selectedJob.title} at {selectedJob.company}
          <button
            onClick={() => setSelectedJob(null)}
            style={{ marginLeft: '12px', cursor: 'pointer' }}
          >
            Clear
          </button>
        </div>
      )}

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
            {mockJobs.map(job => (
              <JobRow
                key={job.id}
                job={job}
                isSelected={selectedJob?.id === job.id}
                onSelect={setSelectedJob}
              />
            ))}
          </tbody>
        </table>
      </main>
    </div>
  )
}

export default App
```

### Step 2: Update JobRow to Show Selection

```tsx
// src/components/JobRow.tsx
import type { Job } from '../types'

interface JobRowProps {
  job: Job
  isSelected?: boolean
  onSelect?: (job: Job) => void
}

function JobRow({ job, isSelected = false, onSelect }: JobRowProps) {
  return (
    <tr
      style={{
        borderBottom: '1px solid #f0f0f0',
        cursor: 'pointer',
        backgroundColor: isSelected ? '#fff3e0' : 'transparent'
      }}
      onClick={() => onSelect?.(job)}
    >
      <td style={{ padding: '12px 8px', fontWeight: 500 }}>
        {job.company}
      </td>
      <td style={{ padding: '12px 8px' }}>
        {job.title}
      </td>
      <td style={{ padding: '12px 8px', color: '#666', fontSize: '14px' }}>
        {job.postedTime}
      </td>
      <td style={{ padding: '12px 8px', textAlign: 'center' }}>
        {job.url ? (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#ff6600' }}
            onClick={(e) => e.stopPropagation()}
          >
            ↗
          </a>
        ) : (
          <span style={{ color: '#999' }}>➜</span>
        )}
      </td>
    </tr>
  )
}

export default JobRow
```

Click a row - it highlights! Click another - selection moves!

---

## Part 4: Multiple State Variables

You can have multiple pieces of state:

```tsx
function App() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [jobs, setJobs] = useState<Job[]>(mockJobs)

  // Each has its own value and setter
}
```

---

## Part 5: State Update Rules

### Rule 1: Never Mutate State Directly

```tsx
// ❌ WRONG: Mutating state
const [jobs, setJobs] = useState<Job[]>([])

const addJob = (newJob: Job) => {
  jobs.push(newJob)  // Mutation! React won't see this
  setJobs(jobs)       // Same reference, no re-render
}

// ✅ CORRECT: Create new array
const addJob = (newJob: Job) => {
  setJobs([...jobs, newJob])  // New array with new job
}
```

### Rule 2: State Updates Are Asynchronous

```tsx
const [count, setCount] = useState(0)

const handleClick = () => {
  setCount(count + 1)
  console.log(count)  // Still shows OLD value!
}

// State updates are batched and applied later
```

### Rule 3: Use Functional Updates for Dependent State

```tsx
// ❌ Might use stale state
setCount(count + 1)
setCount(count + 1)  // Both use same old value!

// ✅ Always uses latest state
setCount(prev => prev + 1)
setCount(prev => prev + 1)  // Each gets updated value
```

---

## Part 6: Common State Patterns

### Toggle State

```tsx
const [isOpen, setIsOpen] = useState(false)

const toggle = () => setIsOpen(prev => !prev)

// Usage
<button onClick={toggle}>
  {isOpen ? 'Close' : 'Open'}
</button>
```

### Update Object State

```tsx
const [filters, setFilters] = useState({
  company: '',
  remote: false
})

// Update one property
const setCompanyFilter = (company: string) => {
  setFilters(prev => ({ ...prev, company }))
}
```

### Update Array State

```tsx
const [jobs, setJobs] = useState<Job[]>([])

// Add item
setJobs(prev => [...prev, newJob])

// Remove item
setJobs(prev => prev.filter(job => job.id !== idToRemove))

// Update item
setJobs(prev => prev.map(job =>
  job.id === targetId ? { ...job, title: 'New Title' } : job
))
```

---

## Part 7: State vs Props

| State | Props |
|-------|-------|
| Managed inside component | Passed from parent |
| Can be changed | Read-only |
| Triggers re-render when changed | Triggers re-render when parent updates |
| `const [x, setX] = useState()` | `function Comp({ x })` |

```tsx
function Parent() {
  const [count, setCount] = useState(0)  // State in parent

  return <Child count={count} />  // Passed as props to child
}

function Child({ count }: { count: number }) {
  // count is a prop here - read-only!
  return <p>Count: {count}</p>
}
```

---

## Challenge: Add Refresh Button

Add a "Refresh" button to the header that:

1. Shows "Refreshing..." while updating
2. Updates the "last updated" time

<details>
<summary>Click to see solution</summary>

```tsx
// src/App.tsx
import { useState } from 'react'

function App() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>("just now")

  const handleRefresh = async () => {
    setIsRefreshing(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    setLastUpdated(new Date().toLocaleTimeString())
    setIsRefreshing(false)
  }

  return (
    <div>
      <Header
        jobCount={mockJobs.length}
        lastUpdated={lastUpdated}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />
      {/* ... rest of app */}
    </div>
  )
}
```

```tsx
// src/components/Header.tsx
interface HeaderProps {
  jobCount: number
  lastUpdated?: string
  isRefreshing?: boolean
  onRefresh?: () => void
}

function Header({ jobCount, lastUpdated, isRefreshing, onRefresh }: HeaderProps) {
  return (
    <header style={{
      backgroundColor: '#ff6600',
      color: 'white',
      padding: '12px 16px'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '24px' }}>🔶</span>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
            HN Jobs
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', opacity: 0.9 }}>
            {jobCount} jobs {lastUpdated && `· ${lastUpdated}`}
          </span>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              style={{
                padding: '6px 12px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '4px',
                color: 'white',
                cursor: isRefreshing ? 'not-allowed' : 'pointer',
                fontSize: '13px'
              }}
            >
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
```

</details>

---

## Key Takeaways

1. **useState** returns `[value, setter]`
2. Call the setter to update state AND trigger re-render
3. Never mutate state directly - create new values
4. Use functional updates `setState(prev => ...)` when new value depends on old
5. State is local to a component; props come from parents
6. Multiple state variables = multiple useState calls

---

## Your Code So Far

```tsx
// Key patterns used:
const [selectedJob, setSelectedJob] = useState<Job | null>(null)
const [isLoading, setIsLoading] = useState(false)
const [lastUpdated, setLastUpdated] = useState("just now")

// Clearing state
setSelectedJob(null)

// Updating based on previous
setIsLoading(prev => !prev)
```

---

## What's Next?

We're passing jobs as an array to `mockJobs.map()`. But there's a warning:

> "Each child in a list should have a unique 'key' prop"

Let's learn about **Lists and Keys** properly.

**[→ Exercise 6: Lists](./06_lists.md)**
