// ===================
// Data Entities
// ===================

export interface Job {
  id: number
  company: string
  title: string
  postedTime: string
  url?: string        // Optional
  description?: string // Optional
  by: string          // Who posted it
}

// ===================
// Component Props
// ===================

export interface HeaderProps {
  jobCount: number
  lastUpdated?: string
}

export interface JobRowProps {
  job: Job
  onSelect?: (job: Job) => void
  isSelected?: boolean
}