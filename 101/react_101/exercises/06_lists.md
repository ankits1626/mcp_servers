# Exercise 6: Lists and Keys

> **Goal**: Render arrays of data correctly with proper keys
> **Time**: ~15 minutes
> **Difficulty**: Beginner

---

## What You'll Learn

- How to render lists with `.map()`
- Why keys are required
- How to choose good keys
- Common list rendering patterns

---

## Part 1: Rendering Lists

To display a list of items, use JavaScript's `.map()` method:

```tsx
const jobs: Job[] = [
  { id: 1, company: "Stripe", title: "Engineer" },
  { id: 2, company: "Vercel", title: "Developer" },
  { id: 3, company: "Linear", title: "Designer" }
]

function JobList() {
  return (
    <ul>
      {jobs.map(job => (
        <li>{job.company} - {job.title}</li>
      ))}
    </ul>
  )
}
```

This transforms an array of data into an array of JSX elements.

---

## Part 2: The Key Warning

If you run the code above, you'll see a console warning:

> ⚠️ Warning: Each child in a list should have a unique "key" prop.

### Why Keys Matter

Keys help React identify which items have changed, been added, or removed.

```tsx
// Without keys - React doesn't know which item changed
<li>Stripe</li>
<li>Vercel</li>  ← If we remove this, React re-renders ALL items
<li>Linear</li>

// With keys - React knows exactly what changed
<li key="1">Stripe</li>
<li key="2">Vercel</li>  ← React removes only this item
<li key="3">Linear</li>
```

---

## Part 3: Adding Keys

Add a `key` prop to each item in the list:

```tsx
function JobList({ jobs }: { jobs: Job[] }) {
  return (
    <table>
      <tbody>
        {jobs.map(job => (
          <JobRow
            key={job.id}  // ← Unique key for each item
            job={job}
          />
        ))}
      </tbody>
    </table>
  )
}
```

### Key Rules

1. **Keys must be unique** among siblings
2. **Keys must be stable** - don't change between renders
3. **Keys should come from your data** - not from array index

---

## Part 4: Choosing Good Keys

### ✅ Good: Unique IDs from Data

```tsx
// Best: Use the ID from your data
{jobs.map(job => (
  <JobRow key={job.id} job={job} />
))}
```

### ❌ Bad: Array Index

```tsx
// Avoid: Index changes when items are reordered/removed
{jobs.map((job, index) => (
  <JobRow key={index} job={job} />  // Problems when list changes!
))}
```

**Why index is bad:**

```text
Initial:
  index 0 → Stripe (key="0")
  index 1 → Vercel (key="1")
  index 2 → Linear (key="2")

After removing Vercel:
  index 0 → Stripe (key="0")
  index 1 → Linear (key="1")  ← Linear now has Vercel's old key!

React thinks Linear IS Vercel and may not update correctly.
```

### When Index is OK

Only use index as key when:

- List is static (never changes)
- Items are never reordered
- Items are never filtered/removed

---

## Part 5: Create JobTable Component

Let's extract our table rendering into a component:

```tsx
// src/components/JobTable.tsx
import JobRow from './JobRow'
import type { Job } from '../types'

interface JobTableProps {
  jobs: Job[]
  selectedJobId?: number | null
  onSelectJob: (job: Job) => void
}

function JobTable({ jobs, selectedJobId, onSelectJob }: JobTableProps) {
  if (jobs.length === 0) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        color: '#666'
      }}>
        No jobs found
      </div>
    )
  }

  return (
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
        {jobs.map(job => (
          <JobRow
            key={job.id}
            job={job}
            isSelected={selectedJobId === job.id}
            onSelect={onSelectJob}
          />
        ))}
      </tbody>
    </table>
  )
}

export default JobTable
```

### Use in App

```tsx
// src/App.tsx
import { useState } from 'react'
import Header from './components/Header'
import JobTable from './components/JobTable'
import type { Job } from './types'

const mockJobs: Job[] = [
  { id: 12345, company: "Stripe", title: "Senior Engineer", postedTime: "2 hours ago", by: "stripe" },
  { id: 12346, company: "Vercel", title: "Full Stack Developer", postedTime: "5 hours ago", by: "vercel" },
  { id: 12347, company: "Linear", title: "React Developer", postedTime: "1 day ago", by: "linear" },
  { id: 12348, company: "Anthropic", title: "ML Engineer", postedTime: "2 days ago", by: "anthropic" }
]

function App() {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <Header jobCount={mockJobs.length} />

      <main style={{ padding: '20px' }}>
        <JobTable
          jobs={mockJobs}
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

## Part 6: Filtering Lists

Often you'll want to filter before rendering:

```tsx
function App() {
  const [jobs] = useState<Job[]>(mockJobs)
  const [searchTerm, setSearchTerm] = useState('')

  // Filter jobs based on search
  const filteredJobs = jobs.filter(job =>
    job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div>
      <input
        type="text"
        placeholder="Search jobs..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          width: '100%',
          padding: '12px',
          marginBottom: '20px',
          border: '1px solid #ddd',
          borderRadius: '4px'
        }}
      />

      <JobTable
        jobs={filteredJobs}  // Pass filtered list
        selectedJobId={null}
        onSelectJob={() => {}}
      />

      <p style={{ color: '#666', marginTop: '12px' }}>
        Showing {filteredJobs.length} of {jobs.length} jobs
      </p>
    </div>
  )
}
```

---

## Part 7: Sorting Lists

```tsx
function App() {
  const [jobs] = useState<Job[]>(mockJobs)
  const [sortBy, setSortBy] = useState<'company' | 'title'>('company')

  // Sort jobs
  const sortedJobs = [...jobs].sort((a, b) => {
    if (sortBy === 'company') {
      return a.company.localeCompare(b.company)
    }
    return a.title.localeCompare(b.title)
  })

  return (
    <div>
      <div style={{ marginBottom: '12px' }}>
        Sort by:
        <button onClick={() => setSortBy('company')}>Company</button>
        <button onClick={() => setSortBy('title')}>Title</button>
      </div>

      <JobTable jobs={sortedJobs} ... />
    </div>
  )
}
```

**Note**: Use `[...jobs].sort()` to create a new array. Never mutate the original!

---

## Part 8: Empty States

Always handle the empty case:

```tsx
function JobTable({ jobs }: { jobs: Job[] }) {
  // Handle empty list
  if (jobs.length === 0) {
    return (
      <div style={{
        padding: '60px 20px',
        textAlign: 'center',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px'
      }}>
        <p style={{ fontSize: '18px', color: '#666' }}>
          No jobs found
        </p>
        <p style={{ fontSize: '14px', color: '#999' }}>
          Try adjusting your search or check back later
        </p>
      </div>
    )
  }

  return (
    <table>
      {/* ... render jobs */}
    </table>
  )
}
```

---

## Challenge: Add Pagination

Show only 10 jobs per page with Previous/Next buttons:

<details>
<summary>Click to see solution</summary>

```tsx
function App() {
  const [jobs] = useState<Job[]>(mockJobs)
  const [currentPage, setCurrentPage] = useState(1)
  const jobsPerPage = 10

  // Calculate pagination
  const totalPages = Math.ceil(jobs.length / jobsPerPage)
  const startIndex = (currentPage - 1) * jobsPerPage
  const paginatedJobs = jobs.slice(startIndex, startIndex + jobsPerPage)

  const goToPrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1))
  }

  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1))
  }

  return (
    <div>
      <JobTable jobs={paginatedJobs} ... />

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '16px',
        marginTop: '20px'
      }}>
        <button
          onClick={goToPrevPage}
          disabled={currentPage === 1}
          style={{
            padding: '8px 16px',
            cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
          }}
        >
          ◀ Prev
        </button>

        <span style={{ color: '#666' }}>
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={goToNextPage}
          disabled={currentPage === totalPages}
          style={{
            padding: '8px 16px',
            cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
          }}
        >
          Next ▶
        </button>
      </div>
    </div>
  )
}
```

</details>

---

## Key Takeaways

1. Use `.map()` to transform arrays into JSX elements
2. Always add a unique `key` prop to each item
3. **Good keys**: IDs from your data
4. **Bad keys**: Array indices (for dynamic lists)
5. Filter/sort before rendering, not inside `.map()`
6. Always handle empty states

---

## Your Project Structure

```text
hn-jobs/
├── src/
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── JobTable.tsx    # New component
│   │   ├── JobRow.tsx
│   │   └── JobDetail.tsx
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   └── main.tsx
└── ...
```

---

## What's Next?

We've been handling clicks with `onClick`, but there's more to events.

Let's learn about **Events** in React!

**[→ Exercise 7: Events](./07_events.md)**
