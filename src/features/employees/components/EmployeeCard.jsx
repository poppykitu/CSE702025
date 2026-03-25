import { Link } from 'react-router-dom'
import { Tooltip } from 'antd'
import { MailOutlined, PhoneOutlined, EnvironmentOutlined } from '@ant-design/icons'
import EmployeeAvatar from './EmployeeAvatar'
import StatusBadge from './StatusBadge'
import { getAvatarColor } from '@/utils/helpers'

/**
 * Employee Card — Grid view
 * Phong cách tinh tế: gradient header theo màu avatar, thông tin gọn gàng
 */
export default function EmployeeCard({ employee }) {
  const {
    id, full_name, email, phone,
    avatar_url, status, work_location,
    departments, designations,
  } = employee

  const headerColor = getAvatarColor(full_name)

  return (
    <Link
      to={`/employees/${id}`}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div
        className="employee-card animate-fade-in-up"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        {/* Header gradient band */}
        <div style={{
          height: 72,
          background: `linear-gradient(135deg, ${headerColor}18 0%, ${headerColor}08 100%)`,
          borderBottom: `1px solid ${headerColor}15`,
          position: 'relative',
        }}>
          {/* Department badge top-right */}
          {departments && (
            <span style={{
              position: 'absolute',
              top: 10,
              right: 12,
              fontSize: 10,
              fontWeight: 700,
              color: headerColor,
              background: `${headerColor}15`,
              padding: '2px 7px',
              borderRadius: 4,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
            }}>
              {departments.code}
            </span>
          )}
        </div>

        {/* Avatar — overlaps header */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: -28,
          marginBottom: 0,
          padding: '0 16px',
        }}>
          <div style={{
            padding: 3,
            background: 'var(--color-surface)',
            borderRadius: '50%',
            boxShadow: '0 0 0 2px var(--color-border)',
            backdropFilter: 'blur(10px)',
          }}>
            <EmployeeAvatar name={full_name} avatarUrl={avatar_url} size={52} />
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '10px 16px 16px', textAlign: 'center' }}>
          {/* Name */}
          <div
            className="text-truncate"
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--color-text-primary)',
              marginBottom: 2,
              letterSpacing: '-0.2px',
            }}
          >
            {full_name}
          </div>

          {/* Designation */}
          {designations && (
            <div
              className="text-truncate"
              style={{
                fontSize: 12,
                color: 'var(--color-text-secondary)',
                marginBottom: 8,
              }}
            >
              {designations.title}
            </div>
          )}

          {/* Status badge */}
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'center' }}>
            <StatusBadge status={status} size="small" />
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid var(--color-border)', marginBottom: 12 }} />

          {/* Contact info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, textAlign: 'left' }}>
            <Tooltip title={email}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, color: 'var(--color-text-secondary)',
              }}>
                <MailOutlined style={{ color: 'var(--color-text-muted)', flexShrink: 0, fontSize: 11 }} />
                <span className="text-truncate">{email}</span>
              </div>
            </Tooltip>

            {phone && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, color: 'var(--color-text-secondary)',
              }}>
                <PhoneOutlined style={{ color: 'var(--color-text-muted)', flexShrink: 0, fontSize: 11 }} />
                <span>{phone}</span>
              </div>
            )}

            {work_location && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, color: 'var(--color-text-secondary)',
              }}>
                <EnvironmentOutlined style={{ color: 'var(--color-text-muted)', flexShrink: 0, fontSize: 11 }} />
                <span className="text-truncate">{work_location}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
