import type { HeaderProps } from "@/types"

function Header({ jobCount, lastUpdated }: HeaderProps) {
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
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>
            HN Jobs
          </h1>
        </div>
        <div style={{ fontSize: '13px', opacity: 0.9 }}>
          {jobCount} jobs {lastUpdated && `· Updated ${lastUpdated}`}
        </div>
      </div>
    </header>
  )
}

export default Header