import { useState } from 'react'
import Header from '@/components/Header'
import JobRow from '@/components/JobRow'
// import TableHeader from '@/components/TableHeader'
import type { Job } from '@/types'


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
          padding: '12px 16px',
          backgroundColor: '#1809f5ff',
          borderBottom: '1px solid #7e0beaff',
          color: '#fff'
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

      <main>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: 'white'
        }}>
          <thead>
            <tr style={{ backgroundColor: '#f9f9f9', color: '#333' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Company</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Title</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Posted</th>
              <th style={{ padding: '12px 16px', width: '40px' }}></th>
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