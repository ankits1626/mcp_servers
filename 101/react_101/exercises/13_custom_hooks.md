# Exercise 13: Custom Hooks

> **Goal**: Extract reusable logic into custom hooks
> **Time**: ~25 minutes
> **Difficulty**: Intermediate

---

## What You'll Learn

- What custom hooks are
- Rules of hooks
- How to create custom hooks
- Common hook patterns (useLocalStorage, useFetch)

---

## Part 1: What Are Custom Hooks?

**Custom hooks** are functions that:

- Start with `use` (e.g., `useLocalStorage`, `useFetch`)
- Can use other hooks inside them
- Let you share logic between components

```tsx
// Before: Logic repeated in components
function ComponentA() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  useEffect(() => {
    const handle = () => setIsOnline(navigator.onLine)
    window.addEventListener('online', handle)
    window.addEventListener('offline', handle)
    return () => {
      window.removeEventListener('online', handle)
      window.removeEventListener('offline', handle)
    }
  }, [])
  // Use isOnline...
}

// After: Extract to custom hook
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  useEffect(() => {
    const handle = () => setIsOnline(navigator.onLine)
    window.addEventListener('online', handle)
    window.addEventListener('offline', handle)
    return () => {
      window.removeEventListener('online', handle)
      window.removeEventListener('offline', handle)
    }
  }, [])
  return isOnline
}

// Now both components can use it
function ComponentA() {
  const isOnline = useOnlineStatus()  // Clean!
}

function ComponentB() {
  const isOnline = useOnlineStatus()  // Reused!
}
```

---

## Part 2: Rules of Hooks

1. **Only call hooks at the top level** - Not inside loops, conditions, or nested functions
2. **Only call hooks from React functions** - Components or custom hooks
3. **Name custom hooks starting with `use`** - So React knows it's a hook

```tsx
// ❌ WRONG: Hook inside condition
function Component() {
  if (someCondition) {
    const [value, setValue] = useState(0)  // Error!
  }
}

// ✅ CORRECT: Hook at top level
function Component() {
  const [value, setValue] = useState(0)  // Good!

  if (someCondition) {
    // Use value here
  }
}
```

---

## Part 3: Create useLocalStorage Hook

Create `src/hooks/useLocalStorage.ts`:

```typescript
import { useState, useEffect } from 'react'

function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Initialize state with value from localStorage or initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch {
      return initialValue
    }
  })

  // Sync to localStorage whenever value changes
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(storedValue))
    } catch (error) {
      console.warn('Failed to save to localStorage:', error)
    }
  }, [key, storedValue])

  return [storedValue, setStoredValue]
}

export default useLocalStorage
```

### Usage

```tsx
function App() {
  // Works like useState, but persists to localStorage
  const [jobs, setJobs] = useLocalStorage<Job[]>('hn-jobs', [])
  const [theme, setTheme] = useLocalStorage('theme', 'light')

  // setJobs works just like regular setState
  const addJob = (job: Job) => {
    setJobs(prev => [...prev, job])
  }
}
```

---

## Part 4: Create useFetch Hook

Create `src/hooks/useFetch.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react'

interface UseFetchResult<T> {
  data: T | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

function useFetch<T>(
  fetchFn: () => Promise<T>,
  dependencies: unknown[] = []
): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await fetchFn()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }, dependencies)

  useEffect(() => {
    execute()
  }, [execute])

  return { data, isLoading, error, refetch: execute }
}

export default useFetch
```

### Usage

```tsx
function App() {
  const {
    data: jobs,
    isLoading,
    error,
    refetch
  } = useFetch(() => getJobs(30), [])

  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={refetch} />

  return <JobTable jobs={jobs || []} />
}
```

---

## Part 5: Create useJobs Hook

Combine everything into a domain-specific hook.

Create `src/hooks/useJobs.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react'
import { getJobs } from '../api/hn'
import type { Job } from '../types'

const STORAGE_KEY = 'hn-jobs-cache'
const CACHE_VERSION = 1
const CACHE_DURATION = 5 * 60 * 1000  // 5 minutes

interface CachedData {
  version: number
  jobs: Job[]
  timestamp: number
}

interface UseJobsResult {
  jobs: Job[]
  isLoading: boolean
  error: string | null
  lastUpdated: string
  isFromCache: boolean
  refresh: () => Promise<void>
  clearCache: () => void
}

function useJobs(limit: number = 30): UseJobsResult {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState('')
  const [isFromCache, setIsFromCache] = useState(false)

  // Load from cache
  const loadFromCache = useCallback((): boolean => {
    try {
      const cached = localStorage.getItem(STORAGE_KEY)
      if (!cached) return false

      const data: CachedData = JSON.parse(cached)
      if (data.version !== CACHE_VERSION) {
        localStorage.removeItem(STORAGE_KEY)
        return false
      }

      const age = Date.now() - data.timestamp
      if (age > CACHE_DURATION) return false

      setJobs(data.jobs)
      setLastUpdated(new Date(data.timestamp).toLocaleTimeString())
      setIsFromCache(true)
      return true
    } catch {
      localStorage.removeItem(STORAGE_KEY)
      return false
    }
  }, [])

  // Save to cache
  const saveToCache = useCallback((jobsToCache: Job[]) => {
    try {
      const data: CachedData = {
        version: CACHE_VERSION,
        jobs: jobsToCache,
        timestamp: Date.now()
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (e) {
      console.warn('Failed to cache jobs:', e)
    }
  }, [])

  // Fetch jobs from API
  const fetchJobs = useCallback(async (useCache = true) => {
    setError(null)

    // Try cache first
    if (useCache && loadFromCache()) {
      setIsLoading(false)
      return
    }

    // Fetch from API
    setIsLoading(true)
    setIsFromCache(false)

    try {
      const fetchedJobs = await getJobs(limit)
      setJobs(fetchedJobs)
      saveToCache(fetchedJobs)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs')
    } finally {
      setIsLoading(false)
    }
  }, [limit, loadFromCache, saveToCache])

  // Initial load
  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  // Refresh (bypass cache)
  const refresh = useCallback(async () => {
    await fetchJobs(false)
  }, [fetchJobs])

  // Clear cache
  const clearCache = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setJobs([])
    setIsFromCache(false)
    setLastUpdated('')
  }, [])

  return {
    jobs,
    isLoading,
    error,
    lastUpdated,
    isFromCache,
    refresh,
    clearCache
  }
}

export default useJobs
```

---

## Part 6: Simplify App with Custom Hook

Now App is much cleaner:

```tsx
// src/App.tsx
import { useState } from 'react'
import Header from './components/Header'
import JobTable from './components/JobTable'
import JobDetail from './components/JobDetail'
import LoadingSpinner from './components/LoadingSpinner'
import ErrorMessage from './components/ErrorMessage'
import useJobs from './hooks/useJobs'
import type { Job } from './types'

function App() {
  const {
    jobs,
    isLoading,
    error,
    lastUpdated,
    isFromCache,
    refresh,
    clearCache
  } = useJobs(30)

  const [selectedJob, setSelectedJob] = useState<Job | null>(null)

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <Header
        jobCount={jobs.length}
        lastUpdated={lastUpdated}
        onRefresh={refresh}
        onClear={clearCache}
      />

      {isFromCache && (
        <div style={{
          padding: '8px 20px',
          backgroundColor: '#f0f9ff',
          color: '#0369a1',
          fontSize: '13px'
        }}>
          📦 Loaded from cache ·{' '}
          <button onClick={refresh} style={{ /* ... */ }}>
            Refresh
          </button>
        </div>
      )}

      <main style={{ padding: '20px' }}>
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage message={error} onRetry={refresh} />
        ) : selectedJob ? (
          <JobDetail job={selectedJob} onBack={() => setSelectedJob(null)} />
        ) : (
          <JobTable jobs={jobs} onSelectJob={setSelectedJob} />
        )}
      </main>
    </div>
  )
}

export default App
```

---

## Part 7: More Useful Hooks

### useDebounce

Delay updates for better performance (e.g., search):

```typescript
import { useState, useEffect } from 'react'

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

// Usage: Debounced search
function SearchInput() {
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 300)

  // Only search when debounced value changes
  useEffect(() => {
    if (debouncedQuery) {
      searchAPI(debouncedQuery)
    }
  }, [debouncedQuery])

  return <input value={query} onChange={e => setQuery(e.target.value)} />
}
```

### useOnlineStatus

```typescript
import { useState, useEffect } from 'react'

function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}
```

### useMediaQuery

```typescript
import { useState, useEffect } from 'react'

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [query])

  return matches
}

// Usage
function Component() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  return isMobile ? <MobileLayout /> : <DesktopLayout />
}
```

---

## Part 8: Project Hook Structure

```text
hn-jobs/
├── src/
│   ├── hooks/
│   │   ├── index.ts           # Export all hooks
│   │   ├── useJobs.ts         # Job fetching & caching
│   │   ├── useLocalStorage.ts # localStorage sync
│   │   ├── useFetch.ts        # Generic fetch
│   │   ├── useDebounce.ts     # Debounce values
│   │   └── useOnlineStatus.ts # Online/offline detection
│   ├── components/
│   ├── api/
│   ├── types/
│   ├── App.tsx
│   └── main.tsx
└── ...
```

Export from index:

```typescript
// src/hooks/index.ts
export { default as useJobs } from './useJobs'
export { default as useLocalStorage } from './useLocalStorage'
export { default as useFetch } from './useFetch'
export { default as useDebounce } from './useDebounce'
export { default as useOnlineStatus } from './useOnlineStatus'
```

---

## Challenge: Create useSearchJobs Hook

Create a hook that combines job fetching with search filtering:

<details>
<summary>Click to see solution</summary>

```typescript
// src/hooks/useSearchJobs.ts
import { useState, useMemo } from 'react'
import useJobs from './useJobs'
import useDebounce from './useDebounce'

interface UseSearchJobsResult {
  // From useJobs
  allJobs: Job[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
  // Search specific
  searchQuery: string
  setSearchQuery: (query: string) => void
  filteredJobs: Job[]
}

function useSearchJobs(limit: number = 30): UseSearchJobsResult {
  const {
    jobs: allJobs,
    isLoading,
    error,
    refresh
  } = useJobs(limit)

  const [searchQuery, setSearchQuery] = useState('')
  const debouncedQuery = useDebounce(searchQuery, 200)

  const filteredJobs = useMemo(() => {
    if (!debouncedQuery.trim()) return allJobs

    const query = debouncedQuery.toLowerCase()
    return allJobs.filter(job =>
      job.company.toLowerCase().includes(query) ||
      job.title.toLowerCase().includes(query)
    )
  }, [allJobs, debouncedQuery])

  return {
    allJobs,
    isLoading,
    error,
    refresh,
    searchQuery,
    setSearchQuery,
    filteredJobs
  }
}

export default useSearchJobs
```

```tsx
// Usage in App
function App() {
  const {
    filteredJobs,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    refresh
  } = useSearchJobs(30)

  return (
    <div>
      <input
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        placeholder="Search jobs..."
      />
      <JobTable jobs={filteredJobs} />
    </div>
  )
}
```

</details>

---

## Key Takeaways

1. Custom hooks **start with `use`** (required!)
2. They can use **other hooks** inside them
3. They **extract and share** logic between components
4. Each hook call gets its **own isolated state**
5. Keep hooks **focused** on one purpose
6. Return **what consumers need** (data, loading, functions)

---

## Your Hook Pattern

```typescript
// Generic hook template
function useMyHook<T>(param: Param): Result<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const execute = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await someOperation(param)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    } finally {
      setIsLoading(false)
    }
  }, [param])

  useEffect(() => {
    execute()
  }, [execute])

  return { data, isLoading, error, refresh: execute }
}
```

---

## What's Next?

Our app works! Now let's make it look professional with proper **Styling**.

**[→ Exercise 14: Styling](./14_styling.md)**
