import { Link, useLocation } from 'react-router-dom'
import { Avatar, Dropdown, Badge } from 'antd'
import {
  TeamOutlined,
  BellOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useAuth } from '@/context/AuthContext'
import { isSupabaseConfigured } from '@/lib/supabaseClient'

export default function TopBar() {
  const { user, signOut } = useAuth()
  const location = useLocation()

  const navItems = [
    { path: '/employees', label: 'Nhân viên', icon: <TeamOutlined /> },
  ]

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
        to="/employees"
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

      {/* Nav */}
      <nav style={{ display: 'flex', gap: 4, flex: 1 }}>
        {navItems.map(item => {
          const isActive = location.pathname.startsWith(item.path)
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 6,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                background: isActive ? 'var(--color-primary-bg)' : 'transparent',
                transition: 'all var(--transition-fast)',
              }}
            >
              {item.icon}
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {!isSupabaseConfigured && (
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
            DEMO MODE
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
              style={{ background: 'var(--color-primary)', fontSize: 13, fontWeight: 600 }}
            >
              HR
            </Avatar>
            <div style={{ lineHeight: 1.3 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                {user?.email?.split('@')[0] || 'Admin'}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>HR Manager</div>
            </div>
          </div>
        </Dropdown>
      </div>
    </header>
  )
}
