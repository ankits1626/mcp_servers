# Exercise 9: Async Fetch

> **Goal**: Fetch real job data from the HackerNews API
> **Time**: ~30 minutes
> **Difficulty**: Intermediate

---

## What You'll Learn

- How to fetch data from an API
- async/await in React
- Loading states
- The HackerNews API structure

---

## Part 1: HackerNews API Overview

The HN API is free and requires no authentication.

**Base URL**: `https://hacker-news.firebaseio.com/v0`

**Endpoints we'll use:**

```text
GET /jobstories.json     → Returns array of job IDs: [123, 456, 789, ...]
GET /item/{id}.json      → Returns single item details
```

**Example job item:**

```json
{
  "id": 12345678,
  "type": "job",
  "by": "stripe",
  "time": 1704067200,
  "title": "Stripe is hiring a Senior Engineer (Remote)",
  "url": "https://stripe.com/jobs/123",
  "text": "<p>We're looking for...</p>"
}
```

---

## Part 2: Create API Functions

Create `src/api/hn.ts`:

```typescript
const BASE_URL = 'https://hacker-news.firebaseio.com/v0'

// Raw HN API response type
export interface HNItem {
  id: number
  type: string
  by?: string
  time: number
  title?: string
  url?: string
  text?: string
}

// Fetch the list of job IDs
export async function fetchJobIds(): Promise<number[]> {
  const response = await fetch(`${BASE_URL}/jobstories.json`)
  const ids = await response.json()
  return ids
}

// Fetch a single job by ID
export async function fetchJob(id: number): Promise<HNItem | null> {
  const response = await fetch(`${BASE_URL}/item/${id}.json`)
  const item = await response.json()
  return item
}

// Fetch multiple jobs by IDs
export async function fetchJobs(ids: number[]): Promise<HNItem[]> {
  const jobs = await Promise.all(
    ids.map(id => fetchJob(id))
  )
  // Filter out any null results
  return jobs.filter((job): job is HNItem => job !== null)
}
```

---

## Part 3: Transform API Data

The raw HN data needs processing. Update `src/api/hn.ts`:

```typescript
import type { Job } from '../types'

// Convert Unix timestamp to "X hours ago" format
function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp)

  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`
  return new Date(timestamp * 1000).toLocaleDateString()
}

// Extract company name from title
// "Stripe is hiring..." → "Stripe"
// "Senior Engineer at Vercel" → "Vercel"
function extractCompany(title: string): string {
  // Pattern: "Company is hiring..."
  const hiringMatch = title.match(/^(.+?)\s+(?:is\s+)?hiring/i)
  if (hiringMatch) return hiringMatch[1].trim()

  // Pattern: "... at Company"
  const atMatch = title.match(/at\s+(.+?)(?:\s*\(|$)/i)
  if (atMatch) return atMatch[1].trim()

  // Pattern: "Company: Title"
  const colonMatch = title.match(/^(.+?):\s/)
  if (colonMatch) return colonMatch[1].trim()

  // Fallback: first few words
  return title.split(' ').slice(0, 2).join(' ')
}

// Extract job title from HN title
function extractTitle(hnTitle: string): string {
  // Remove company prefix patterns
  let title = hnTitle
    .replace(/^.+?\s+(?:is\s+)?hiring\s*/i, '')
    .replace(/^.+?:\s*/, '')
    .replace(/\s*\([^)]+\)\s*$/, '')  // Remove trailing (Remote) etc.
    .trim()

  return title || hnTitle
}

// Transform HN item to our Job type
export function transformJob(item: HNItem): Job {
  return {
    id: item.id,
    company: extractCompany(item.title || ''),
    title: extractTitle(item.title || ''),
    postedTime: formatTimeAgo(item.time),
    url: item.url,
    description: item.text,
    by: item.by || 'unknown'
  }
}

// Fetch and transform jobs
export async function getJobs(limit: number = 30): Promise<Job[]> {
  const ids = await fetchJobIds()
  const limitedIds = ids.slice(0, limit)
  const rawJobs = await fetchJobs(limitedIds)
  return rawJobs.map(transformJob)
}
```

---

## Part 4: Fetch Jobs in App

Update `src/App.tsx`:

```tsx
import { useState, useEffect } from 'react'
import Header from './components/Header'
import JobTable from './components/JobTable'
import { getJobs } from './api/hn'
import type { Job } from './types'

function App() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  // Fetch jobs on mount
  useEffect(() => {
    async function loadJobs() {
      setIsLoading(true)
      try {
        const fetchedJobs = await getJobs(30)
        setJobs(fetchedJobs)
        setLastUpdated(new Date().toLocaleTimeString())
      } catch (error) {
        console.error('Failed to fetch jobs:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadJobs()
  }, [])

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <Header
        jobCount={jobs.length}
        lastUpdated={lastUpdated}
      />

      <main style={{ padding: '20px' }}>
        {isLoading ? (
          <div style={{
            padding: '60px 20px',
            textAlign: 'center',
            color: '#666'
          }}>
            Loading jobs...
          </div>
        ) : (
          <JobTable
            jobs={jobs}
            selectedJobId={selectedJob?.id}
            onSelectJob={setSelectedJob}
          />
        )}
      </main>
    </div>
  )
}

export default App
```

---

## Part 5: Add Loading Spinner

Create `src/components/LoadingSpinner.tsx`:

```tsx
function LoadingSpinner() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px 20px',
      color: '#666'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid #f0f0f0',
        borderTopColor: '#ff6600',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <p style={{ marginTop: '16px' }}>Loading jobs from HackerNews...</p>
    </div>
  )
}

export default LoadingSpinner
```

Use it in App:

```tsx
{isLoading ? (
  <LoadingSpinner />
) : (
  <JobTable ... />
)}
```

---

## Part 6: Add Refresh Functionality

```tsx
function App() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  // Fetch jobs function (reusable)
  const loadJobs = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    try {
      const fetchedJobs = await getJobs(30)
      setJobs(fetchedJobs)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  // Initial load
  useEffect(() => {
    loadJobs()
  }, [])

  // Handle refresh button click
  const handleRefresh = () => {
    loadJobs(true)
  }

  return (
    <div>
      <Header
        jobCount={jobs.length}
        lastUpdated={lastUpdated}
        isRefreshing={isRefreshing}
        onRefresh={handleRefresh}
      />
      {/* ... */}
    </div>
  )
}
```

Update Header to show refresh button:

```tsx
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
          <h1 style={{ margin: 0, fontSize: '18px' }}>HN Jobs</h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '13px', opacity: 0.9 }}>
            {jobCount} jobs · {lastUpdated}
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
                cursor: isRefreshing ? 'wait' : 'pointer',
                fontSize: '13px'
              }}
            >
              {isRefreshing ? '↻ Refreshing...' : '↻ Refresh'}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
```

---

## Part 7: Understanding Promise.all

We use `Promise.all` to fetch multiple jobs in parallel:

```typescript
// Sequential: Slow! (30 requests one after another)
const jobs = []
for (const id of ids) {
  const job = await fetchJob(id)  // Wait for each one
  jobs.push(job)
}

// Parallel: Fast! (30 requests at the same time)
const jobs = await Promise.all(
  ids.map(id => fetchJob(id))  // Start all at once
)
```

**Performance difference:**

- Sequential: 30 jobs × 100ms = 3000ms
- Parallel: ~100ms (all requests overlap)

---

## Part 8: Abort Controller (Cleanup)

When the component unmounts during a fetch, we should cancel it:

```tsx
useEffect(() => {
  const controller = new AbortController()

  async function loadJobs() {
    try {
      const response = await fetch(url, {
        signal: controller.signal  // Pass abort signal
      })
      const data = await response.json()
      setJobs(data)
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch cancelled')
        return
      }
      console.error('Fetch failed:', error)
    }
  }

  loadJobs()

  // Cleanup: abort fetch if component unmounts
  return () => {
    controller.abort()
  }
}, [])
```

---

## Part 9: Complete App.tsx

```tsx
import { useState, useEffect } from 'react'
import Header from './components/Header'
import JobTable from './components/JobTable'
import LoadingSpinner from './components/LoadingSpinner'
import { getJobs } from './api/hn'
import type { Job } from './types'

function App() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  const loadJobs = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    try {
      const fetchedJobs = await getJobs(30)
      setJobs(fetchedJobs)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (error) {
      console.error('Failed to fetch jobs:', error)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadJobs()
  }, [])

  // Filter jobs by search
  const filteredJobs = jobs.filter(job =>
    job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <Header
        jobCount={filteredJobs.length}
        lastUpdated={lastUpdated}
        isRefreshing={isRefreshing}
        onRefresh={() => loadJobs(true)}
      />

      <div style={{ padding: '20px 20px 0' }}>
        <input
          type="text"
          placeholder="Search companies or titles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
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
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <JobTable
            jobs={filteredJobs}
            selectedJobId={selectedJob?.id}
            onSelectJob={setSelectedJob}
          />
        )}
      </main>
    </div>
  )
}

export default App
```

---

## Challenge: Add "Load More" Button

Instead of loading all jobs at once, load 10 at a time with a "Load More" button:

<details>
<summary>Click to see solution</summary>

```tsx
function App() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [allJobIds, setAllJobIds] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const jobsPerPage = 10

  // Initial load - get IDs and first batch
  useEffect(() => {
    async function initialLoad() {
      setIsLoading(true)
      const ids = await fetchJobIds()
      setAllJobIds(ids)

      const firstBatch = await fetchJobs(ids.slice(0, jobsPerPage))
      setJobs(firstBatch.map(transformJob))
      setIsLoading(false)
    }
    initialLoad()
  }, [])

  // Load more jobs
  const loadMore = async () => {
    setIsLoadingMore(true)
    const nextIds = allJobIds.slice(jobs.length, jobs.length + jobsPerPage)
    const moreJobs = await fetchJobs(nextIds)
    setJobs(prev => [...prev, ...moreJobs.map(transformJob)])
    setIsLoadingMore(false)
  }

  const hasMore = jobs.length < allJobIds.length

  return (
    <div>
      {/* ... */}
      <JobTable jobs={jobs} ... />

      {hasMore && (
        <button
          onClick={loadMore}
          disabled={isLoadingMore}
          style={{
            display: 'block',
            margin: '20px auto',
            padding: '12px 24px',
            backgroundColor: '#ff6600',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isLoadingMore ? 'wait' : 'pointer'
          }}
        >
          {isLoadingMore ? 'Loading...' : `Load More (${allJobIds.length - jobs.length} remaining)`}
        </button>
      )}
    </div>
  )
}
```

</details>

---

## Key Takeaways

1. Define async functions inside useEffect, then call them
2. Use **loading states** to show progress to users
3. **Promise.all** fetches multiple items in parallel
4. Transform API data into your app's format
5. Cleanup with AbortController when component unmounts
6. Separate API logic into `src/api/` folder

---

## What's Next?

What happens when the API fails? We need proper **Error Handling**!

**[→ Exercise 10: Error Handling](./10_errors.md)**
