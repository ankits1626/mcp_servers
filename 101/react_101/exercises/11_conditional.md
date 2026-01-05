# Exercise 11: Conditional Rendering

> **Goal**: Show different views based on application state
> **Time**: ~20 minutes
> **Difficulty**: Beginner

---

## What You'll Learn

- Different ways to conditionally render content
- Building a list/detail navigation pattern
- The ternary operator vs logical AND
- Rendering based on state

---

## Part 1: Conditional Rendering Basics

React has several ways to conditionally render content:

### Method 1: Ternary Operator

```tsx
{condition ? <ComponentA /> : <ComponentB />}

// Example
{isLoggedIn ? <Dashboard /> : <LoginForm />}
```

### Method 2: Logical AND (&&)

```tsx
{condition && <Component />}

// Example: Only show if there's an error
{error && <ErrorMessage message={error} />}
```

### Method 3: Early Return

```tsx
function Component() {
  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage />
  return <MainContent />
}
```

### Method 4: Variables

```tsx
function Component() {
  let content

  if (isLoading) {
    content = <LoadingSpinner />
  } else if (error) {
    content = <ErrorMessage />
  } else {
    content = <MainContent />
  }

  return <div>{content}</div>
}
```

---

## Part 2: Build List ↔ Detail Navigation

Our app needs two views:

1. **List View** - Shows all jobs in a table
2. **Detail View** - Shows one job's full details

```text
┌─────────────────────────┐         ┌─────────────────────────┐
│      Job List           │         │      Job Detail         │
├─────────────────────────┤  Click  ├─────────────────────────┤
│ Stripe  | Engineer      │ ──────▶ │ ← Back                  │
│ Vercel  | Developer     │         │                         │
│ Linear  | Designer      │         │ Senior Engineer         │
│         ...             │ ◀────── │ at Stripe               │
│                         │  Back   │ Posted 2 hours ago      │
│                         │         │ [Full description...]   │
└─────────────────────────┘         └─────────────────────────┘
```

---

## Part 3: Create JobDetail Component

Create `src/components/JobDetail.tsx`:

```tsx
import type { Job } from '../types'

interface JobDetailProps {
  job: Job
  onBack: () => void
}

function JobDetail({ job, onBack }: JobDetailProps) {
  return (
    <div>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          background: 'none',
          border: 'none',
          color: '#ff6600',
          cursor: 'pointer',
          fontSize: '14px',
          padding: '0',
          marginBottom: '24px'
        }}
      >
        ← Back to Jobs
      </button>

      {/* Job header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          margin: '0 0 8px 0',
          fontSize: '24px',
          color: '#333'
        }}>
          {job.title}
        </h1>
        <p style={{
          margin: 0,
          color: '#666',
          fontSize: '16px'
        }}>
          at <strong>{job.company}</strong>
        </p>
        <p style={{
          margin: '8px 0 0 0',
          color: '#999',
          fontSize: '14px'
        }}>
          Posted {job.postedTime} by @{job.by}
        </p>
      </div>

      {/* Job description */}
      {job.description && (
        <div
          style={{
            backgroundColor: '#f9f9f9',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '24px',
            lineHeight: '1.6'
          }}
          dangerouslySetInnerHTML={{ __html: job.description }}
        />
      )}

      {/* Apply button */}
      {job.url && (
        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px',
            backgroundColor: '#ff6600',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '8px',
            fontWeight: 500
          }}
        >
          View on HackerNews ↗
        </a>
      )}
    </div>
  )
}

export default JobDetail
```

---

## Part 4: Implement Navigation in App

Update `src/App.tsx`:

```tsx
import { useState, useEffect } from 'react'
import Header from './components/Header'
import JobTable from './components/JobTable'
import JobDetail from './components/JobDetail'
import LoadingSpinner from './components/LoadingSpinner'
import ErrorMessage from './components/ErrorMessage'
import { getJobs } from './api/hn'
import type { Job } from './types'

function App() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const loadJobs = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const fetchedJobs = await getJobs(30)
      setJobs(fetchedJobs)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadJobs()
  }, [])

  // Handle navigation
  const handleSelectJob = (job: Job) => {
    setSelectedJob(job)
  }

  const handleBack = () => {
    setSelectedJob(null)
  }

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <Header
        jobCount={jobs.length}
        lastUpdated={lastUpdated}
        onRefresh={loadJobs}
      />

      <main style={{ padding: '20px' }}>
        {/* Conditional rendering based on state */}
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage message={error} onRetry={loadJobs} />
        ) : selectedJob ? (
          // Show detail view when a job is selected
          <JobDetail job={selectedJob} onBack={handleBack} />
        ) : (
          // Show list view otherwise
          <JobTable
            jobs={jobs}
            onSelectJob={handleSelectJob}
          />
        )}
      </main>
    </div>
  )
}

export default App
```

---

## Part 5: Update JobRow for Navigation

Make rows clickable to navigate:

```tsx
// src/components/JobRow.tsx
import type { Job } from '../types'

interface JobRowProps {
  job: Job
  onSelect: (job: Job) => void
}

function JobRow({ job, onSelect }: JobRowProps) {
  return (
    <tr
      onClick={() => onSelect(job)}
      style={{
        borderBottom: '1px solid #f0f0f0',
        cursor: 'pointer',
        transition: 'background-color 0.15s'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#f9f9f9'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent'
      }}
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
      <td style={{ padding: '12px 8px', textAlign: 'center', color: '#999' }}>
        →
      </td>
    </tr>
  )
}

export default JobRow
```

---

## Part 6: Common Conditional Patterns

### Pattern 1: Show/Hide

```tsx
const [isExpanded, setIsExpanded] = useState(false)

return (
  <div>
    <button onClick={() => setIsExpanded(!isExpanded)}>
      {isExpanded ? 'Hide' : 'Show'} Details
    </button>
    {isExpanded && <Details />}
  </div>
)
```

### Pattern 2: Loading/Content/Error

```tsx
if (isLoading) return <Loading />
if (error) return <Error message={error} />
return <Content data={data} />
```

### Pattern 3: Empty State

```tsx
{jobs.length === 0 ? (
  <EmptyState message="No jobs found" />
) : (
  <JobTable jobs={jobs} />
)}
```

### Pattern 4: Auth-based

```tsx
{user ? (
  <Dashboard user={user} />
) : (
  <LoginPage onLogin={handleLogin} />
)}
```

---

## Part 7: Avoid Common Pitfalls

### Pitfall 1: && with Numbers

```tsx
// ❌ BUG: Shows "0" when count is 0
{count && <span>{count} items</span>}

// ✅ CORRECT: Explicit boolean check
{count > 0 && <span>{count} items</span>}
```

### Pitfall 2: Nested Ternaries

```tsx
// ❌ Hard to read
{isLoading ? <Loading /> : error ? <Error /> : data ? <Content /> : <Empty />}

// ✅ Use early returns or variables
if (isLoading) return <Loading />
if (error) return <Error />
if (!data) return <Empty />
return <Content />
```

### Pitfall 3: Forgetting Keys in Conditional Lists

```tsx
// ❌ Missing key
{items.map(item => item.visible && <Item data={item} />)}

// ✅ With key
{items.map(item => item.visible && <Item key={item.id} data={item} />)}
```

---

## Part 8: Add Header Back Button

Show a back button in the header when viewing details:

```tsx
// src/components/Header.tsx
interface HeaderProps {
  jobCount: number
  lastUpdated?: string
  showBackButton?: boolean
  onBack?: () => void
  onRefresh?: () => void
}

function Header({
  jobCount,
  lastUpdated,
  showBackButton,
  onBack,
  onRefresh
}: HeaderProps) {
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {showBackButton && onBack && (
            <button
              onClick={onBack}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '4px'
              }}
            >
              ←
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>🔶</span>
            <h1 style={{ margin: 0, fontSize: '18px' }}>HN Jobs</h1>
          </div>
        </div>

        {!showBackButton && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '13px', opacity: 0.9 }}>
              {jobCount} jobs · {lastUpdated}
            </span>
            {onRefresh && (
              <button
                onClick={onRefresh}
                style={{
                  padding: '6px 12px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                ↻ Refresh
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
```

Use in App:

```tsx
<Header
  jobCount={jobs.length}
  lastUpdated={lastUpdated}
  showBackButton={!!selectedJob}
  onBack={handleBack}
  onRefresh={loadJobs}
/>
```

---

## Challenge: Add Transition Animation

Add a fade transition when switching between views:

<details>
<summary>Click to see solution</summary>

```tsx
// src/App.tsx
import { useState, useEffect } from 'react'

function App() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayedJob, setDisplayedJob] = useState<Job | null>(null)

  // Handle smooth transition
  const handleSelectJob = (job: Job) => {
    setIsTransitioning(true)
    setTimeout(() => {
      setSelectedJob(job)
      setDisplayedJob(job)
      setIsTransitioning(false)
    }, 150)
  }

  const handleBack = () => {
    setIsTransitioning(true)
    setTimeout(() => {
      setSelectedJob(null)
      setDisplayedJob(null)
      setIsTransitioning(false)
    }, 150)
  }

  return (
    <main style={{
      padding: '20px',
      opacity: isTransitioning ? 0 : 1,
      transition: 'opacity 0.15s ease-in-out'
    }}>
      {displayedJob ? (
        <JobDetail job={displayedJob} onBack={handleBack} />
      ) : (
        <JobTable jobs={jobs} onSelectJob={handleSelectJob} />
      )}
    </main>
  )
}
```

</details>

---

## Key Takeaways

1. **Ternary `? :`** - Choose between two options
2. **Logical AND `&&`** - Show something or nothing
3. **Early return** - Best for multiple conditions
4. Avoid `&&` with numbers (use explicit `> 0` check)
5. Keep conditional logic simple and readable
6. Use state to track which view to show

---

## Your Navigation Pattern

```tsx
// List ↔ Detail navigation:
const [selectedItem, setSelectedItem] = useState<Item | null>(null)

// Show list or detail based on selection
{selectedItem ? (
  <DetailView item={selectedItem} onBack={() => setSelectedItem(null)} />
) : (
  <ListView items={items} onSelect={setSelectedItem} />
)}
```

---

## What's Next?

Every time we refresh, we fetch all jobs again. Let's cache them in **localStorage** for faster loading!

**[→ Exercise 12: localStorage](./12_localstorage.md)**
