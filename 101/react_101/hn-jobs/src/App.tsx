import { useState } from "react";
import Header from "@/components/Header";
import JobRow from "@/components/JobRow";
// import TableHeader from '@/components/TableHeader'
import type { Job } from "@/types";
import JobTable from "./components/JobTable";

const mockJobs: Job[] = [
  {
    id: 12345,
    company: "Stripe",
    title: "Senior Engineer",
    postedTime: "2 hours ago",
    by: "stripe",
  },
  {
    id: 12346,
    company: "Vercel",
    title: "Full Stack Developer",
    postedTime: "5 hours ago",
    by: "vercel",
  },
  {
    id: 12347,
    company: "Linear",
    title: "React Developer",
    postedTime: "1 day ago",
    by: "linear",
  },
  {
    id: 12348,
    company: "Anthropic",
    title: "ML Engineer",
    postedTime: "2 days ago",
    by: "anthropic",
  },
];

function App() {
  const [jobs] = useState<Job[]>(mockJobs);
  // State: currently selected job (null = no selection)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter jobs based on search
  const filteredJobs = jobs.filter(
    (job) =>
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <Header jobCount={mockJobs.length} />

      {/* Show which job is selected */}
      {selectedJob && (
        <div
          style={{
            padding: "12px 16px",
            backgroundColor: "#1809f5ff",
            borderBottom: "1px solid #7e0beaff",
            color: "#fff",
          }}
        >
          Selected: {selectedJob.title} at {selectedJob.company}
          <button
            onClick={() => setSelectedJob(null)}
            style={{ marginLeft: "12px", cursor: "pointer" }}
          >
            Clear
          </button>
        </div>
      )}

      <input
        type="text"
        placeholder="Search jobs..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          width: "100%",
          padding: "12px",
          marginBottom: "20px",
          border: "1px solid #ddd",
          borderRadius: "4px",
        }}
      />

      <main>
        <JobTable
          jobs={filteredJobs}
          selectedJobId={selectedJob?.id}
          onSelectJob={setSelectedJob}
        />
      </main>
    </div>
  );
}

export default App;
