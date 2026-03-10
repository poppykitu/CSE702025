import { EMPLOYEE_STATUS_LABELS, EMPLOYEE_STATUS_COLORS } from '@/utils/constants'

/**
 * Badge hiển thị trạng thái nhân viên
 * status: 'active' | 'onboarding' | 'terminated'
 */
export default function StatusBadge({ status, size = 'default' }) {
  const colors = EMPLOYEE_STATUS_COLORS[status] || EMPLOYEE_STATUS_COLORS.active
  const label = EMPLOYEE_STATUS_LABELS[status] || status

  const sizes = {
    small: { fontSize: 11, padding: '2px 8px', height: 20 },
    default: { fontSize: 12, padding: '3px 10px', height: 22 },
    large: { fontSize: 13, padding: '4px 12px', height: 26 },
  }

  const s = sizes[size] || sizes.default

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      fontSize: s.fontSize,
      fontWeight: 600,
      color: colors.color,
      background: colors.bg,
      border: `1px solid ${colors.border}`,
      borderRadius: 'var(--radius-full)',
      padding: s.padding,
      letterSpacing: '0.1px',
      whiteSpace: 'nowrap',
      lineHeight: 1,
      height: s.height,
    }}>
      <span style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: colors.color,
        flexShrink: 0,
      }} />
      {label}
    </span>
  )
}
