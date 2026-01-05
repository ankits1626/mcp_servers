# Exercise 10: Error Handling

> **Goal**: Handle API failures gracefully with user-friendly error states
> **Time**: ~20 minutes
> **Difficulty**: Intermediate

---

## What You'll Learn

- Try/catch with async/await
- Error state management
- User-friendly error messages
- Retry functionality
- Error boundaries (React 19)

---

## Part 1: What Can Go Wrong?

When fetching data, many things can fail:

- **Network errors** - No internet, server down
- **HTTP errors** - 404 Not Found, 500 Server Error
- **Parsing errors** - Invalid JSON response
- **Timeout** - Request takes too long
- **CORS errors** - Cross-origin issues

---

## Part 2: Add Error State

Update `src/App.tsx` to track errors:

```tsx
import { useState, useEffect } from 'react'

function App() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadJobs = async () => {
    setIsLoading(true)
    setError(null)  // Clear previous errors

    try {
      const fetchedJobs = await getJobs(30)
      setJobs(fetchedJobs)
    } catch (err) {
      // Convert error to user-friendly message
      setError(
        err instanceof Error
          ? err.message
          : 'An unexpected error occurred'
      )
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadJobs()
  }, [])

  // Render based on state
  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage message={error} onRetry={loadJobs} />
  return <JobTable jobs={jobs} />
}
```

---

## Part 3: Create Error Component

Create `src/components/ErrorMessage.tsx`:

```tsx
interface ErrorMessageProps {
  message: string
  onRetry?: () => void
}

function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div style={{
      padding: '40px 20px',
      textAlign: 'center',
      backgroundColor: '#fff5f5',
      borderRadius: '8px',
      border: '1px solid #fed7d7'
    }}>
      <div style={{
        fontSize: '48px',
        marginBottom: '16px'
      }}>
        😕
      </div>

      <h2 style={{
        margin: '0 0 8px 0',
        color: '#c53030',
        fontSize: '18px'
      }}>
        Something went wrong
      </h2>

      <p style={{
        margin: '0 0 20px 0',
        color: '#742a2a',
        fontSize: '14px'
      }}>
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            padding: '10px 20px',
            backgroundColor: '#ff6600',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Try Again
        </button>
      )}
    </div>
  )
}

export default ErrorMessage
```

---

## Part 4: Better Error Messages

Map technical errors to user-friendly messages:

```typescript
// src/api/hn.ts

export class FetchError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public isNetworkError?: boolean
  ) {
    super(message)
    this.name = 'FetchError'
  }
}

export async function fetchJobIds(): Promise<number[]> {
  try {
    const response = await fetch(`${BASE_URL}/jobstories.json`)

    if (!response.ok) {
      throw new FetchError(
        getErrorMessage(response.status),
        response.status
      )
    }

    return await response.json()
  } catch (error) {
    if (error instanceof FetchError) {
      throw error
    }

    // Network error (no connection, DNS failure, etc.)
    throw new FetchError(
      'Unable to connect. Please check your internet connection.',
      undefined,
      true
    )
  }
}

function getErrorMessage(statusCode: number): string {
  switch (statusCode) {
    case 400:
      return 'Invalid request. Please try again.'
    case 401:
    case 403:
      return 'Access denied.'
    case 404:
      return 'Jobs not found. The API may have changed.'
    case 429:
      return 'Too many requests. Please wait a moment.'
    case 500:
    case 502:
    case 503:
      return 'HackerNews is temporarily unavailable. Please try again later.'
    default:
      return `Server error (${statusCode}). Please try again.`
  }
}
```

---

## Part 5: Handle Partial Failures

When fetching multiple jobs, some might fail while others succeed:

```typescript
export async function fetchJobs(ids: number[]): Promise<HNItem[]> {
  const results = await Promise.allSettled(
    ids.map(id => fetchJob(id))
  )

  // Filter out failed requests, keep successful ones
  const jobs: HNItem[] = []
  let failCount = 0

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value !== null) {
      jobs.push(result.value)
    } else {
      failCount++
    }
  }

  // Log but don't fail if only some requests failed
  if (failCount > 0) {
    console.warn(`${failCount} job(s) failed to load`)
  }

  // Only throw if ALL requests failed
  if (jobs.length === 0 && ids.length > 0) {
    throw new FetchError('Failed to load any jobs. Please try again.')
  }

  return jobs
}
```

**Promise.allSettled vs Promise.all:**

- `Promise.all` - Fails immediately if ANY promise rejects
- `Promise.allSettled` - Waits for ALL promises, returns status for each

---

## Part 6: Timeout Handling

Add timeout to prevent infinite loading:

```typescript
async function fetchWithTimeout(
  url: string,
  timeoutMs: number = 10000
): Promise<Response> {
  const controller = new AbortController()

  const timeoutId = setTimeout(() => {
    controller.abort()
  }, timeoutMs)

  try {
    const response = await fetch(url, {
      signal: controller.signal
    })
    return response
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new FetchError(
        'Request timed out. Please check your connection and try again.'
      )
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}
```

---

## Part 7: Complete Error Handling in App

```tsx
// src/App.tsx
import { useState, useEffect } from 'react'
import Header from './components/Header'
import JobTable from './components/JobTable'
import LoadingSpinner from './components/LoadingSpinner'
import ErrorMessage from './components/ErrorMessage'
import { getJobs } from './api/hn'
import type { Job } from './types'

function App() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const loadJobs = async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }
    setError(null)

    try {
      const fetchedJobs = await getJobs(30)
      setJobs(fetchedJobs)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (err) {
      const message = err instanceof Error
        ? err.message
        : 'Failed to load jobs. Please try again.'
      setError(message)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
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
        isRefreshing={isRefreshing}
        onRefresh={() => loadJobs(true)}
      />

      <main style={{ padding: '20px' }}>
        {isLoading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage
            message={error}
            onRetry={() => loadJobs()}
          />
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

## Part 8: Inline Error for Refresh

When refreshing, show error differently (don't replace the content):

```tsx
function App() {
  const [refreshError, setRefreshError] = useState<string | null>(null)

  const loadJobs = async (isRefresh = false) => {
    // ...
    try {
      const fetchedJobs = await getJobs(30)
      setJobs(fetchedJobs)
      setRefreshError(null)  // Clear refresh error on success
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load'

      if (isRefresh) {
        // For refresh: show inline error, keep existing data
        setRefreshError(message)
      } else {
        // For initial load: show full error state
        setError(message)
      }
    }
  }

  return (
    <div>
      <Header ... />

      {/* Inline refresh error banner */}
      {refreshError && (
        <div style={{
          padding: '12px 20px',
          backgroundColor: '#fff5f5',
          color: '#c53030',
          borderBottom: '1px solid #fed7d7',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>⚠️ Refresh failed: {refreshError}</span>
          <button onClick={() => setRefreshError(null)}>✕</button>
        </div>
      )}

      <main>
        {/* ... */}
      </main>
    </div>
  )
}
```

---

## Part 9: Error Boundaries (React 19)

For unexpected render errors, use Error Boundaries:

```tsx
// src/components/ErrorBoundary.tsx
import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
```

Wrap your app:

```tsx
// src/main.tsx
import ErrorBoundary from './components/ErrorBoundary'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
)
```

---

## Challenge: Add Retry with Exponential Backoff

Automatically retry failed requests with increasing delays:

<details>
<summary>Click to see solution</summary>

```typescript
// src/api/hn.ts

async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetchFn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error')

      // Don't retry on client errors (4xx)
      if (error instanceof FetchError && error.statusCode && error.statusCode < 500) {
        throw error
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt)  // 1s, 2s, 4s
        console.log(`Retry ${attempt + 1}/${maxRetries} after ${delay}ms`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError!
}

// Usage
export async function fetchJobIds(): Promise<number[]> {
  return fetchWithRetry(async () => {
    const response = await fetch(`${BASE_URL}/jobstories.json`)
    if (!response.ok) throw new FetchError(getErrorMessage(response.status))
    return response.json()
  })
}
```

</details>

---

## Key Takeaways

1. Always wrap async operations in **try/catch**
2. Keep **error state** separate from loading state
3. Show **user-friendly messages**, not technical errors
4. Provide **retry functionality** for recoverable errors
5. Use **Promise.allSettled** for partial success scenarios
6. Add **timeout** to prevent infinite loading
7. Use **Error Boundaries** for unexpected render errors

---

## Your Error Handling Pattern

```tsx
// The standard pattern for async operations:
const [data, setData] = useState<T | null>(null)
const [isLoading, setIsLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

const loadData = async () => {
  setIsLoading(true)
  setError(null)
  try {
    const result = await fetchData()
    setData(result)
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Unknown error')
  } finally {
    setIsLoading(false)
  }
}
```

---

## What's Next?

We can view the job list, but clicking a job should show its details. That requires **Conditional Rendering** - showing different views based on state.

**[→ Exercise 11: Conditional Rendering](./11_conditional.md)**
