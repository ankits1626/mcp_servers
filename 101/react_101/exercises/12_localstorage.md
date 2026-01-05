# Exercise 12: localStorage

> **Goal**: Cache job data locally for instant loading and offline access
> **Time**: ~20 minutes
> **Difficulty**: Intermediate

---

## What You'll Learn

- How localStorage works
- Storing and retrieving JSON data
- Cache invalidation strategies
- Syncing localStorage with React state

---

## Part 1: What is localStorage?

**localStorage** is a browser API that stores data persistently:

- Data survives browser refreshes
- Data survives browser restarts
- ~5MB storage limit per domain
- Stores strings only (use JSON for objects)

```javascript
// Store a value
localStorage.setItem('key', 'value')

// Retrieve a value
const value = localStorage.getItem('key')  // 'value'

// Remove a value
localStorage.removeItem('key')

// Clear all localStorage
localStorage.clear()
```

---

## Part 2: Store Objects with JSON

localStorage only stores strings, so we need JSON:

```javascript
const jobs = [
  { id: 1, title: 'Engineer' },
  { id: 2, title: 'Designer' }
]

// Store: Convert object to JSON string
localStorage.setItem('hn-jobs', JSON.stringify(jobs))

// Retrieve: Parse JSON string back to object
const stored = localStorage.getItem('hn-jobs')
const parsedJobs = stored ? JSON.parse(stored) : []
```

---

## Part 3: Basic Cache Implementation

Update `src/App.tsx`:

```tsx
import { useState, useEffect } from 'react'
import { getJobs } from './api/hn'
import type { Job } from './types'

const STORAGE_KEY = 'hn-jobs-cache'
const CACHE_DURATION = 5 * 60 * 1000  // 5 minutes in milliseconds

interface CachedData {
  jobs: Job[]
  timestamp: number
}

function App() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  // Load from cache or fetch
  useEffect(() => {
    async function loadJobs() {
      // Try to load from cache first
      const cached = localStorage.getItem(STORAGE_KEY)

      if (cached) {
        try {
          const { jobs: cachedJobs, timestamp }: CachedData = JSON.parse(cached)
          const age = Date.now() - timestamp

          // Use cache if it's fresh
          if (age < CACHE_DURATION) {
            setJobs(cachedJobs)
            setLastUpdated(new Date(timestamp).toLocaleTimeString())
            setIsLoading(false)
            console.log('Loaded from cache')
            return
          }
        } catch (e) {
          console.warn('Invalid cache data')
          localStorage.removeItem(STORAGE_KEY)
        }
      }

      // Cache miss or expired - fetch fresh data
      setIsLoading(true)
      try {
        const fetchedJobs = await getJobs(30)
        setJobs(fetchedJobs)

        // Save to cache
        const cacheData: CachedData = {
          jobs: fetchedJobs,
          timestamp: Date.now()
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData))
        setLastUpdated(new Date().toLocaleTimeString())
        console.log('Fetched and cached')
      } catch (error) {
        console.error('Fetch failed:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadJobs()
  }, [])

  return (
    // ... render jobs
  )
}
```

---

## Part 4: Refresh & Clear Cache

Add buttons to force refresh or clear cache:

```tsx
function App() {
  // ... state

  // Force refresh (ignore cache)
  const handleRefresh = async () => {
    setIsLoading(true)
    try {
      const fetchedJobs = await getJobs(30)
      setJobs(fetchedJobs)

      // Update cache
      const cacheData: CachedData = {
        jobs: fetchedJobs,
        timestamp: Date.now()
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData))
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (error) {
      console.error('Refresh failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Clear cache and data
  const handleClearCache = () => {
    localStorage.removeItem(STORAGE_KEY)
    setJobs([])
    setLastUpdated('')
  }

  return (
    <div>
      <Header
        jobCount={jobs.length}
        lastUpdated={lastUpdated}
        onRefresh={handleRefresh}
        onClear={handleClearCache}
      />
      {/* ... */}
    </div>
  )
}
```

Update Header to show both buttons:

```tsx
interface HeaderProps {
  jobCount: number
  lastUpdated?: string
  onRefresh?: () => void
  onClear?: () => void
}

function Header({ jobCount, lastUpdated, onRefresh, onClear }: HeaderProps) {
  return (
    <header style={{ /* ... */ }}>
      <div style={{ display: 'flex', gap: '8px' }}>
        {onRefresh && (
          <button onClick={onRefresh} style={{ /* ... */ }}>
            ↻ Refresh
          </button>
        )}
        {onClear && (
          <button
            onClick={onClear}
            style={{
              padding: '6px 12px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Clear
          </button>
        )}
      </div>
    </header>
  )
}
```

---

## Part 5: Show Cache Status

Let users know if data is from cache:

```tsx
function App() {
  const [isFromCache, setIsFromCache] = useState(false)

  useEffect(() => {
    async function loadJobs() {
      const cached = localStorage.getItem(STORAGE_KEY)

      if (cached) {
        const { jobs: cachedJobs, timestamp }: CachedData = JSON.parse(cached)
        const age = Date.now() - timestamp

        if (age < CACHE_DURATION) {
          setJobs(cachedJobs)
          setIsFromCache(true)  // Mark as cached
          setIsLoading(false)
          return
        }
      }

      // Fetch fresh...
      setIsFromCache(false)  // Mark as fresh
    }

    loadJobs()
  }, [])

  return (
    <div>
      <Header ... />

      {isFromCache && (
        <div style={{
          padding: '8px 20px',
          backgroundColor: '#f0f9ff',
          color: '#0369a1',
          fontSize: '13px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>📦 Showing cached data</span>
          <button
            onClick={handleRefresh}
            style={{
              background: 'none',
              border: 'none',
              color: '#0369a1',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Load fresh data
          </button>
        </div>
      )}

      <main>...</main>
    </div>
  )
}
```

---

## Part 6: Handle Storage Errors

localStorage can fail (quota exceeded, private browsing, etc.):

```typescript
function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value)
    return true
  } catch (error) {
    if (error instanceof DOMException) {
      if (error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded')
        // Try to clear old data
        localStorage.removeItem(key)
      } else if (error.name === 'SecurityError') {
        console.warn('localStorage blocked (private browsing?)')
      }
    }
    return false
  }
}

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch (error) {
    console.warn('localStorage read failed:', error)
    return null
  }
}
```

---

## Part 7: Cache Strategy Options

### Strategy 1: Time-Based Expiration

```typescript
const CACHE_DURATION = 5 * 60 * 1000  // 5 minutes

const isCacheValid = (timestamp: number) => {
  return Date.now() - timestamp < CACHE_DURATION
}
```

### Strategy 2: Stale-While-Revalidate

Show cached data immediately, then fetch fresh data in background:

```tsx
useEffect(() => {
  async function loadJobs() {
    // Immediately show cached data
    const cached = safeGetItem(STORAGE_KEY)
    if (cached) {
      const { jobs: cachedJobs } = JSON.parse(cached)
      setJobs(cachedJobs)
      setIsLoading(false)
    }

    // Always fetch fresh data in background
    try {
      const freshJobs = await getJobs(30)
      setJobs(freshJobs)
      saveToCache(freshJobs)
    } catch (error) {
      // Only show error if we have no cached data
      if (!cached) {
        setError('Failed to load jobs')
      }
    }
  }

  loadJobs()
}, [])
```

### Strategy 3: Version-Based Invalidation

```typescript
const CACHE_VERSION = 2  // Increment when data format changes

interface CachedData {
  version: number
  jobs: Job[]
  timestamp: number
}

// When reading cache:
if (cached.version !== CACHE_VERSION) {
  localStorage.removeItem(STORAGE_KEY)  // Invalidate old format
}
```

---

## Part 8: Complete Implementation

```tsx
// src/App.tsx
import { useState, useEffect } from 'react'
import Header from './components/Header'
import JobTable from './components/JobTable'
import JobDetail from './components/JobDetail'
import LoadingSpinner from './components/LoadingSpinner'
import ErrorMessage from './components/ErrorMessage'
import { getJobs } from './api/hn'
import type { Job } from './types'

const STORAGE_KEY = 'hn-jobs-cache'
const CACHE_VERSION = 1
const CACHE_DURATION = 5 * 60 * 1000

interface CachedData {
  version: number
  jobs: Job[]
  timestamp: number
}

function App() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [isFromCache, setIsFromCache] = useState(false)

  // Load jobs from cache or API
  const loadJobs = async (forceRefresh = false) => {
    setError(null)

    // Try cache first (unless forcing refresh)
    if (!forceRefresh) {
      try {
        const cached = localStorage.getItem(STORAGE_KEY)
        if (cached) {
          const data: CachedData = JSON.parse(cached)

          if (data.version === CACHE_VERSION) {
            const age = Date.now() - data.timestamp

            if (age < CACHE_DURATION) {
              setJobs(data.jobs)
              setLastUpdated(new Date(data.timestamp).toLocaleTimeString())
              setIsFromCache(true)
              setIsLoading(false)
              return
            }
          }
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      }
    }

    // Fetch from API
    setIsLoading(true)
    try {
      const fetchedJobs = await getJobs(30)
      setJobs(fetchedJobs)

      // Save to cache
      const cacheData: CachedData = {
        version: CACHE_VERSION,
        jobs: fetchedJobs,
        timestamp: Date.now()
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData))
      } catch (e) {
        console.warn('Failed to cache:', e)
      }

      setLastUpdated(new Date().toLocaleTimeString())
      setIsFromCache(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setIsLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    loadJobs()
  }, [])

  // Clear cache
  const handleClear = () => {
    localStorage.removeItem(STORAGE_KEY)
    setJobs([])
    setIsFromCache(false)
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
        onRefresh={() => loadJobs(true)}
        onClear={handleClear}
      />

      {isFromCache && (
        <div style={{
          padding: '8px 20px',
          backgroundColor: '#f0f9ff',
          color: '#0369a1',
          fontSize: '13px',
          borderBottom: '1px solid #bae6fd'
        }}>
          📦 Loaded from cache ·{' '}
          <button
            onClick={() => loadJobs(true)}
            style={{
              background: 'none',
              border: 'none',
              color: '#0369a1',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0
            }}
          >
            Refresh
          </button>
        </div>
      )}

      <main style={{ padding: '20px' }}>
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage message={error} onRetry={() => loadJobs(true)} />
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

## Challenge: Add Offline Support

Show a message when offline and fall back to cached data:

<details>
<summary>Click to see solution</summary>

```tsx
function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // Listen for online/offline events
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

  return (
    <div>
      {!isOnline && (
        <div style={{
          padding: '8px 20px',
          backgroundColor: '#fef3c7',
          color: '#92400e',
          fontSize: '13px',
          textAlign: 'center'
        }}>
          📶 You're offline. Showing cached data.
        </div>
      )}

      {/* Rest of app */}
    </div>
  )
}
```

</details>

---

## Key Takeaways

1. **localStorage** persists data across sessions
2. Use **JSON.stringify/parse** for objects
3. Always **handle errors** (quota, security)
4. Include **timestamp** for cache invalidation
5. Include **version** for format changes
6. Show users when data is cached

---

## Your Project Structure

```text
hn-jobs/
├── src/
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── JobTable.tsx
│   │   ├── JobRow.tsx
│   │   ├── JobDetail.tsx
│   │   ├── LoadingSpinner.tsx
│   │   └── ErrorMessage.tsx
│   ├── api/
│   │   └── hn.ts
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
└── ...
```

---

## What's Next?

Our app works, but we have repeated logic for fetching, caching, and error handling. Let's extract this into **Custom Hooks** for reuse!

**[→ Exercise 13: Custom Hooks](./13_custom_hooks.md)**
