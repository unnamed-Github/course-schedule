export function SkeletonGrid() {
  return (
    <div className="animate-pulse space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="grid" style={{ gridTemplateColumns: '100px repeat(5, 1fr)', gap: '4px', minHeight: '80px' }}>
          <div className="rounded-2xl p-2" style={{ backgroundColor: 'var(--border-light)', opacity: 0.3 }} />
          {Array.from({ length: 5 }).map((_, j) => (
            <div key={j} className="rounded-2xl p-2" style={{ backgroundColor: 'var(--border-light)', opacity: 0.2 }} />
          ))}
        </div>
      ))}
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl p-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
      <div className="h-4 w-24 rounded mb-2" style={{ backgroundColor: 'var(--border-light)' }} />
      <div className="h-3 w-40 rounded mb-4" style={{ backgroundColor: 'var(--border-light)', opacity: 0.5 }} />
      <div className="h-20 rounded mb-3" style={{ backgroundColor: 'var(--border-light)', opacity: 0.3 }} />
    </div>
  )
}
