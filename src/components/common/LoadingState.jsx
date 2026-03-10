import { Skeleton } from 'antd'
import { VIEW_MODE } from '@/utils/constants'

export default function LoadingState({ mode = VIEW_MODE.GRID, count = 8 }) {
  if (mode === VIEW_MODE.LIST) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 10,
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}>
            <Skeleton.Avatar active size={44} />
            <Skeleton active paragraph={{ rows: 1 }} style={{ flex: 1 }} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
      gap: 16,
    }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          padding: '0 0 16px',
        }}>
          <Skeleton.Image active style={{ width: '100%', height: 72, borderRadius: 0 }} />
          <div style={{ padding: '32px 16px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <Skeleton.Avatar active size={52} style={{ marginTop: -20 }} />
            <Skeleton active paragraph={{ rows: 2 }} style={{ width: '100%' }} />
          </div>
        </div>
      ))}
    </div>
  )
}
