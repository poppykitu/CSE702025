import { Link, useLocation } from 'react-router-dom'
import { Avatar, Dropdown, Badge, Select } from 'antd'
import {
  TeamOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  SwapOutlined,
} from '@ant-design/icons'
import { useAuth } from '@/features/auth/context/AuthContext'
import { isSupabaseConfigured } from '@/lib/supabaseClient'
import { ROLE_LABELS, ROLE_COLORS, ROLES } from '@/constants/roles'

export default function TopBar() {
  const { user, profile, role, signOut, switchMockRole } = useAuth()
  const location = useLocation()

  const roleColor = ROLE_COLORS[role] || ROLE_COLORS.employee

  const userMenuItems = [
    { key: 'profile', label: 'Hồ sơ của tôi', icon: <UserOutlined /> },
    { key: 'settings', label: 'Cài đặt', icon: <SettingOutlined /> },
    { type: 'divider' },
    { key: 'logout', label: 'Đăng xuất', icon: <LogoutOutlined />, danger: true, onClick: signOut },
  ]

  return (
    <header style={{
      height: 56,
      background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      display: 'flex',
      alignItems: 'center',
      paddingInline: 24,
      gap: 0,
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: 'var(--shadow-sm)',
    }}>
      {/* Logo */}
      <Link
        to="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          textDecoration: 'none',
          marginRight: 32,
          flexShrink: 0,
        }}
      >
        <div style={{
          width: 32,
          height: 32,
          background: 'var(--color-primary)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <TeamOutlined style={{ color: '#fff', fontSize: 16 }} />
        </div>
        <span style={{
          fontFamily: 'var(--font-sans)',
          fontWeight: 700,
          fontSize: 17,
          color: 'var(--color-text-primary)',
          letterSpacing: '-0.3px',
        }}>
          People<span style={{ color: 'var(--color-primary)' }}>Hub</span>
        </span>
      </Link>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Demo mode: Role switcher */}
        {!isSupabaseConfigured && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              fontSize: 11,
              padding: '3px 8px',
              background: '#FFFBEB',
              color: '#D97706',
              border: '1px solid #FDE68A',
              borderRadius: 4,
              fontWeight: 500,
              letterSpacing: '0.3px',
            }}>
              DEMO
            </div>
            <Select
              size="small"
              value={role}
              onChange={(val) => switchMockRole(val)}
              style={{ width: 140, fontSize: 12 }}
              options={[
                { value: ROLES.ADMIN, label: ROLE_LABELS[ROLES.ADMIN] },
                { value: ROLES.HR, label: ROLE_LABELS[ROLES.HR] },
                { value: ROLES.MANAGER, label: ROLE_LABELS[ROLES.MANAGER] },
                { value: ROLES.EMPLOYEE, label: ROLE_LABELS[ROLES.EMPLOYEE] },
              ]}
              suffixIcon={<SwapOutlined />}
            />
          </div>
        )}

        <Badge count={2} size="small">
          <button style={{
            width: 34,
            height: 34,
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            background: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--color-text-secondary)',
            transition: 'all var(--transition-fast)',
          }}>
            <BellOutlined />
          </button>
        </Badge>

        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: 8,
            transition: 'background var(--transition-fast)',
          }}>
            <Avatar
              size={32}
              style={{
                background: roleColor.color,
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {(profile?.full_name || 'U').charAt(0).toUpperCase()}
            </Avatar>
            <div style={{ lineHeight: 1.3 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {profile?.full_name || user?.email?.split('@')[0] || 'User'}
              </div>
              <div style={{
                fontSize: 11,
                color: roleColor.color,
                fontWeight: 500,
              }}>
                {ROLE_LABELS[role] || 'Nhân viên'}
              </div>
            </div>
          </div>
        </Dropdown>
      </div>
    </header>
  )
}
