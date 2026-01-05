# Exercise 8: useEffect

> **Goal**: Understand side effects and the useEffect hook
> **Time**: ~25 minutes
> **Difficulty**: Intermediate

---

## What You'll Learn

- What side effects are
- How useEffect works
- The dependency array
- Cleanup functions
- Common useEffect patterns

---

## Part 1: What is a Side Effect?

A **side effect** is anything that interacts with the outside world:

- Fetching data from an API
- Updating the document title
- Setting up timers
- Reading/writing to localStorage
- Subscribing to events

These can't happen during render - they need to happen *after* React updates the DOM.

```tsx
// ❌ WRONG: Side effect during render
function App() {
  document.title = 'HN Jobs'  // Side effect!
  fetch('/api/jobs')          // Side effect!
  return <div>...</div>
}

// ✅ RIGHT: Side effects in useEffect
function App() {
  useEffect(() => {
    document.title = 'HN Jobs'
  }, [])

  return <div>...</div>
}
```

---

## Part 2: useEffect Basics

```tsx
import { useEffect } from 'react'

function Component() {
  useEffect(() => {
    // This code runs AFTER the component renders
    console.log('Component rendered!')
  })

  return <div>Hello</div>
}
```

### The Dependency Array

The second argument controls WHEN the effect runs:

```tsx
// Run after EVERY render
useEffect(() => {
  console.log('Every render')
})

// Run ONCE after first render (mount)
useEffect(() => {
  console.log('Only on mount')
}, [])  // Empty array = no dependencies

// Run when 'count' changes
useEffect(() => {
  console.log('Count changed:', count)
}, [count])  // Re-run when count changes

// Run when 'a' OR 'b' changes
useEffect(() => {
  console.log('a or b changed')
}, [a, b])
```

---

## Part 3: Practical Example - Document Title

Update the browser tab title based on job count:

```tsx
function App() {
  const [jobs, setJobs] = useState<Job[]>([])

  // Update document title when jobs change
  useEffect(() => {
    document.title = `${jobs.length} Jobs | HN Jobs`
  }, [jobs.length])  // Re-run when job count changes

  return <div>...</div>
}
```

**How it works:**

1. Component renders with empty jobs
2. useEffect runs: title = "0 Jobs | HN Jobs"
3. Jobs are loaded, component re-renders
4. useEffect runs again: title = "45 Jobs | HN Jobs"

---

## Part 4: Cleanup Functions

Some effects need cleanup when the component unmounts or before the effect re-runs:

```tsx
useEffect(() => {
  // Setup: subscribe to something
  const subscription = someAPI.subscribe()

  // Cleanup: unsubscribe when done
  return () => {
    subscription.unsubscribe()
  }
}, [])
```

### Timer Example

```tsx
function Timer() {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    // Setup: start the interval
    const intervalId = setInterval(() => {
      setSeconds(s => s + 1)
    }, 1000)

    // Cleanup: clear the interval
    return () => {
      clearInterval(intervalId)
    }
  }, [])  // Empty deps = run once, clean up on unmount

  return <p>Seconds: {seconds}</p>
}
```

**Without cleanup**: The interval keeps running even after the component is removed, causing memory leaks!

---

## Part 5: Effect Lifecycle

```text
┌─────────────────────────────────────────────────────────────┐
│                    Component Lifecycle                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  MOUNT (first render)                                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 1. Component renders                                  │   │
│  │ 2. DOM updates                                        │   │
│  │ 3. useEffect runs ─────────────────────────────────▶ │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  UPDATE (re-render when deps change)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 1. Component re-renders                               │   │
│  │ 2. DOM updates                                        │   │
│  │ 3. Cleanup from PREVIOUS effect runs ◀───────────────│   │
│  │ 4. NEW effect runs ──────────────────────────────────▶│   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  UNMOUNT (component removed)                                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 1. Cleanup runs ◀────────────────────────────────────│   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Part 6: Common Patterns

### Pattern 1: Fetch Data on Mount

```tsx
function JobList() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchJobs() {
      setIsLoading(true)
      const response = await fetch('https://api.example.com/jobs')
      const data = await response.json()
      setJobs(data)
      setIsLoading(false)
    }

    fetchJobs()
  }, [])  // Empty deps = fetch once on mount

  if (isLoading) return <p>Loading...</p>
  return <ul>{jobs.map(j => <li key={j.id}>{j.title}</li>)}</ul>
}
```

### Pattern 2: Sync with External System

```tsx
function WindowSize() {
  const [width, setWidth] = useState(window.innerWidth)

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth)

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return <p>Window width: {width}px</p>
}
```

### Pattern 3: React to Prop/State Changes

```tsx
function JobDetail({ jobId }: { jobId: number }) {
  const [job, setJob] = useState<Job | null>(null)

  useEffect(() => {
    // Fetch new job details when jobId changes
    async function fetchJob() {
      const response = await fetch(`/api/jobs/${jobId}`)
      const data = await response.json()
      setJob(data)
    }

    fetchJob()
  }, [jobId])  // Re-run when jobId changes

  return job ? <div>{job.title}</div> : <p>Loading...</p>
}
```

---

## Part 7: Update HN Jobs App

Add a "last updated" timer that counts up:

```tsx
// src/App.tsx
import { useState, useEffect } from 'react'

function App() {
  const [jobs] = useState<Job[]>(mockJobs)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [timeAgo, setTimeAgo] = useState('just now')

  // Update the "time ago" display every minute
  useEffect(() => {
    const updateTimeAgo = () => {
      const seconds = Math.floor((Date.now() - lastUpdated.getTime()) / 1000)

      if (seconds < 60) {
        setTimeAgo('just now')
      } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60)
        setTimeAgo(`${minutes} min ago`)
      } else {
        const hours = Math.floor(seconds / 3600)
        setTimeAgo(`${hours} hr ago`)
      }
    }

    // Update immediately
    updateTimeAgo()

    // Then update every minute
    const intervalId = setInterval(updateTimeAgo, 60000)

    // Cleanup
    return () => clearInterval(intervalId)
  }, [lastUpdated])

  // Update document title
  useEffect(() => {
    document.title = `${jobs.length} Jobs | HN Jobs`
  }, [jobs.length])

  return (
    <div>
      <Header
        jobCount={jobs.length}
        lastUpdated={timeAgo}
      />
      {/* ... */}
    </div>
  )
}
```

---

## Part 8: Dependency Array Rules

### Include All Values Used Inside

```tsx
// ❌ Missing dependency
useEffect(() => {
  document.title = `${count} clicks`  // Uses 'count'
}, [])  // But 'count' not in deps array!

// ✅ Include all dependencies
useEffect(() => {
  document.title = `${count} clicks`
}, [count])  // Now it re-runs when count changes
```

### ESLint Will Help

The `react-hooks/exhaustive-deps` ESLint rule warns about missing dependencies.

### Functions in Dependencies

```tsx
// ❌ Creates new function each render, effect runs every time
useEffect(() => {
  fetchData()
}, [fetchData])

// ✅ Move function inside useEffect
useEffect(() => {
  async function fetchData() {
    const data = await fetch(url)
    setData(data)
  }
  fetchData()
}, [url])

// ✅ Or use useCallback for stable function reference
const fetchData = useCallback(async () => {
  const data = await fetch(url)
  setData(data)
}, [url])

useEffect(() => {
  fetchData()
}, [fetchData])
```

---

## Part 9: Common Mistakes

### Mistake 1: Infinite Loop

```tsx
// ❌ Infinite loop!
useEffect(() => {
  setCount(count + 1)  // Updates state
})  // No deps = runs every render = loop!

// ✅ Add proper dependencies
useEffect(() => {
  setCount(count + 1)
}, [])  // Only on mount
```

### Mistake 2: Missing Cleanup

```tsx
// ❌ Memory leak - interval keeps running
useEffect(() => {
  setInterval(() => setSeconds(s => s + 1), 1000)
}, [])

// ✅ Clean up the interval
useEffect(() => {
  const id = setInterval(() => setSeconds(s => s + 1), 1000)
  return () => clearInterval(id)
}, [])
```

### Mistake 3: Async Function Directly

```tsx
// ❌ useEffect callback can't be async
useEffect(async () => {
  const data = await fetch(url)
}, [])

// ✅ Define async function inside
useEffect(() => {
  async function fetchData() {
    const data = await fetch(url)
  }
  fetchData()
}, [])
```

---

## Challenge: Auto-Refresh Jobs

Add functionality to auto-refresh jobs every 5 minutes:

<details>
<summary>Click to see solution</summary>

```tsx
function App() {
  const [jobs, setJobs] = useState<Job[]>(mockJobs)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!autoRefresh) return  // Don't set up interval if disabled

    const refreshJobs = async () => {
      console.log('Auto-refreshing jobs...')
      // In reality, fetch from API here
      // const newJobs = await fetchJobs()
      // setJobs(newJobs)
      setLastUpdated(new Date())
    }

    const intervalId = setInterval(refreshJobs, 5 * 60 * 1000)  // 5 minutes

    return () => clearInterval(intervalId)
  }, [autoRefresh])

  return (
    <div>
      <Header
        jobCount={jobs.length}
        lastUpdated={formatTimeAgo(lastUpdated)}
      />

      <label style={{ padding: '12px 20px', display: 'block' }}>
        <input
          type="checkbox"
          checked={autoRefresh}
          onChange={(e) => setAutoRefresh(e.target.checked)}
        />
        {' '}Auto-refresh every 5 minutes
      </label>

      {/* ... rest of app */}
    </div>
  )
}
```

</details>

---

## Key Takeaways

1. **useEffect** runs code after render (side effects)
2. **Empty deps `[]`** = run once on mount
3. **With deps `[a, b]`** = run when a or b change
4. **No deps** = run after every render (rarely needed)
5. **Return cleanup function** for subscriptions/timers
6. Include all used values in dependency array
7. Define async functions inside the effect

---

## What's Next?

Now we understand useEffect, let's actually fetch real data from the HackerNews API!

**[→ Exercise 9: Async Fetch](./09_fetch.md)**
