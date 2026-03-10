import { AppstoreOutlined, BarsOutlined } from '@ant-design/icons'
import { VIEW_MODE } from '@/utils/constants'

export default function ViewToggle({ mode, onChange }) {
  const buttons = [
    { value: VIEW_MODE.GRID, icon: <AppstoreOutlined />, label: 'Grid' },
    { value: VIEW_MODE.LIST, icon: <BarsOutlined />, label: 'List' },
  ]

  return (
    <div style={{
      display: 'inline-flex',
      background: 'var(--color-bg)',
      border: '1px solid var(--color-border)',
      borderRadius: 8,
      padding: 2,
      gap: 2,
    }}>
      {buttons.map(btn => (
        <button
          key={btn.value}
          onClick={() => onChange(btn.value)}
          title={btn.label}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 30,
            height: 30,
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14,
            transition: 'all var(--transition-fast)',
            background: mode === btn.value ? 'var(--color-surface)' : 'transparent',
            color: mode === btn.value ? 'var(--color-primary)' : 'var(--color-text-muted)',
            boxShadow: mode === btn.value ? 'var(--shadow-sm)' : 'none',
          }}
        >
          {btn.icon}
        </button>
      ))}
    </div>
  )
}
