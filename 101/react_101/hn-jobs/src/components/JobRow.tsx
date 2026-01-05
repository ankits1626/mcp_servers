import type { JobRowProps } from '@/types'

function JobRow({ job, onSelect, isSelected = false }: JobRowProps) {
  return (
    <tr
      onClick={() => onSelect?.(job)}
      style={{
        borderBottom: '1px solid #f0f0f0',
        cursor: 'pointer',
        backgroundColor: isSelected ? '#d4530dff' : 'transparent',
        color: isSelected ? '#fff' : '#333'
      }}
    >
      <td style={{ padding: '12px 16px', fontWeight: 500 }}>
        {job.company}
      </td>
      <td style={{ padding: '12px 16px' }}>
        {job.title}
      </td>
      <td style={{ padding: '12px 16px', fontSize: '14px', opacity: 0.7 }}>
        {job.postedTime}
      </td>
      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
        {job.url ? (
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#ff6600' }}
            onClick={(e) => e.stopPropagation()}  // Don't trigger row click
          >
            ↗
          </a>
        ) : (
          <span style={{ color: '#ccc' }}>➜</span>
        )}
      </td>
    </tr>
  )
}

export default JobRow