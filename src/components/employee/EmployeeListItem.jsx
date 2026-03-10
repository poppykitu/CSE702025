import { Link } from 'react-router-dom'
import { Button } from 'antd'
import {
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  EditOutlined,
} from '@ant-design/icons'
import EmployeeAvatar from './EmployeeAvatar'
import StatusBadge from './StatusBadge'
import { WORK_TYPE_LABELS } from '@/utils/constants'

/**
 * Employee List Item — List view
 * Horizontal row layout, compact và efficient
 */
export default function EmployeeListItem({ employee }) {
  const {
    id, employee_id, full_name, email, phone,
    avatar_url, status, work_type, work_location,
    departments, designations,
  } = employee

  return (
    <div
      className="employee-list-item"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '12px 20px',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 10,
        textDecoration: 'none',
      }}
    >
      <EmployeeAvatar name={full_name} avatarUrl={avatar_url} size={44} />

      {/* Main info */}
      <div style={{ minWidth: 0, flex: '0 0 220px' }}>
        <Link
          to={`/employees/${id}`}
          style={{ textDecoration: 'none' }}
        >
          <div style={{
            fontSize: 14, fontWeight: 600,
            color: 'var(--color-text-primary)',
            lineHeight: 1.3,
            marginBottom: 2,
          }}>
            {full_name}
          </div>
        </Link>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          {employee_id}
        </div>
      </div>

      {/* Department + Designation */}
      <div style={{ flex: '0 0 260px', minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 2 }}>
          {designations?.title || '—'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          {departments?.name || '—'}
        </div>
      </div>

      {/* Contact */}
      <div style={{ flex: '0 0 200px', minWidth: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 3,
        }}>
          <MailOutlined style={{ fontSize: 11, color: 'var(--color-text-muted)' }} />
          <span className="text-truncate">{email}</span>
        </div>
        {phone && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 12, color: 'var(--color-text-secondary)',
          }}>
            <PhoneOutlined style={{ fontSize: 11, color: 'var(--color-text-muted)' }} />
            <span>{phone}</span>
          </div>
        )}
      </div>

      {/* Work info */}
      <div style={{ flex: '0 0 160px', minWidth: 0 }}>
        {work_location && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 3,
          }}>
            <EnvironmentOutlined style={{ fontSize: 11, color: 'var(--color-text-muted)' }} />
            <span className="text-truncate">{work_location}</span>
          </div>
        )}
        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
          {WORK_TYPE_LABELS[work_type] || work_type}
        </div>
      </div>

      {/* Status */}
      <div style={{ flex: '0 0 140px' }}>
        <StatusBadge status={status} />
      </div>

      {/* Actions */}
      <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
        <Link to={`/employees/${id}/edit`}>
          <Button
            type="text"
            icon={<EditOutlined />}
            size="small"
            style={{ color: 'var(--color-text-muted)' }}
          />
        </Link>
      </div>
    </div>
  )
}
