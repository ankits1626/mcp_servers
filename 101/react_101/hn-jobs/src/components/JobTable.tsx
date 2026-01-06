import JobRow from "./JobRow";
import type { Job } from "@/types";

interface JobTableProps {
  jobs: Job[];
  selectedJobId?: number | null;
  onSelectJob: (job: Job) => void;
}

function JobTable({ jobs, selectedJobId, onSelectJob }: JobTableProps) {
  if (jobs.length === 0) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          color: "#666",
        }}
      >
        No jobs found
      </div>
    );
  }
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        backgroundColor: "white",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      <thead>
        <tr style={{ backgroundColor: "#f9f9f9" }}>
          <th style={{ padding: "12px 8px", textAlign: "left" }}>Company</th>
          <th style={{ padding: "12px 8px", textAlign: "left" }}>Title</th>
          <th style={{ padding: "12px 8px", textAlign: "left" }}>Posted</th>
          <th style={{ padding: "12px 8px", width: "40px" }}></th>
        </tr>
      </thead>
      <tbody>
        {jobs.map((job) => (
          <JobRow
            key={job.id}
            job={job}
            isSelected={selectedJobId === job.id}
            onSelect={onSelectJob}
          />
        ))}
      </tbody>
    </table>
  );
}

export default JobTable;
