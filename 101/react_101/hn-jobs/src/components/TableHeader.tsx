function TableHeader() {
  return (
    <thead>
      <tr style={{ backgroundColor: '#f9f9f9', color: '#333' }}>
        <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 600 }}>Company</th>
        <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 600 }}>Title</th>
        <th style={{ padding: '12px 8px', textAlign: 'left', fontWeight: 600 }}>Posted</th>
        <th style={{ padding: '12px 8px', width: '40px' }}></th>
      </tr>
    </thead>
  )
}

export default TableHeader
