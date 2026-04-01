import { Link, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  TeamOutlined,
  ApartmentOutlined,
  CalendarOutlined,
  UserOutlined,
  SettingOutlined,
  FileTextOutlined,
  WalletOutlined,
  HistoryOutlined,
  SolutionOutlined,
  CheckSquareOutlined,
} from '@ant-design/icons'
import { usePermission } from '@/features/auth/hooks/usePermission'
import { PERMISSIONS, ROLE_LABELS, ROLE_COLORS } from '@/constants/roles'
import { useAuth } from '@/features/auth/context/AuthContext'

// Định nghĩa các menu item và quyền truy cập tương ứng
const ALL_NAV_ITEMS = [
  {
    key: 'dashboard',
    path: '/dashboard',
    label: 'Tổng quan',
    icon: <DashboardOutlined />,
    permission: PERMISSIONS.VIEW_DASHBOARD,
  },
  {
    key: 'employees',
    path: '/employees',
    label: 'Nhân viên',
    icon: <TeamOutlined />,
    roles: ['admin', 'hr', 'manager'],
  },
  {
    key: 'departments',
    path: '/departments',
    label: 'Phòng ban',
    icon: <ApartmentOutlined />,
    permission: PERMISSIONS.MANAGE_DEPARTMENTS,
  },
  {
    key: 'leaves',
    path: '/leaves',
    label: 'Nghỉ phép',
    icon: <CalendarOutlined />,
    roles: ['admin', 'hr', 'manager'],
  },
  {
    key: 'my-profile',
    path: '/my-profile',
    label: 'Hồ sơ của tôi',
    icon: <UserOutlined />,
    roles: ['employee'],
  },
  {
    key: 'my-leaves',
    path: '/my-leaves',
    label: 'Đơn nghỉ phép',
    icon: <FileTextOutlined />,
    roles: ['employee', 'manager'],
  },
  {
    key: 'my-attendance',
    path: '/my-attendance',
    label: 'Chấm công',
    icon: <HistoryOutlined />,
    roles: ['employee', 'manager', 'hr', 'admin'],
  },
  {
    key: 'my-payslips',
    path: '/my-payslips',
    label: 'Bang luong',
    icon: <WalletOutlined />,
    roles: ['employee', 'manager', 'hr', 'admin'],
  },
  {
    key: 'recruitment',
    path: '/recruitment',
    label: 'Tuyen dung',
    icon: <SolutionOutlined />,
    roles: ['admin', 'hr'],
  },
  {
    key: 'approval-center',
    path: '/approval-center',
    label: 'Trung tam Phe duyet',
    icon: <CheckSquareOutlined />,
    roles: ['admin', 'hr'],
  },
]

export default function Sidebar({ collapsed }) {
  const location = useLocation()
  const { role, hasPermission, canAccess } = usePermission()
  const { profile } = useAuth()

  // Lọc menu items theo role và permission
  const visibleItems = ALL_NAV_ITEMS.filter(item => {
    if (item.permission) return hasPermission(item.permission)
    if (item.roles) return canAccess(item.roles)
    return true
  })

  const roleColor = ROLE_COLORS[role] || ROLE_COLORS.employee

  return (
    <aside style={{
      width: collapsed ? 64 : 220,
      background: 'var(--color-surface)',
      borderRight: '1px solid var(--color-border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      flexShrink: 0,
      overflow: 'hidden',
      transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    }}>
      {/* Role badge */}
      {!collapsed && (
        <div style={{
          padding: '16px 16px 12px',
          borderBottom: '1px solid var(--color-border)',
        }}>
          <div style={{
            fontSize: 11,
            fontWeight: 600,
            color: roleColor.color,
            background: roleColor.bg,
            border: `1px solid ${roleColor.border}`,
            borderRadius: 6,
            padding: '6px 10px',
            textAlign: 'center',
            letterSpacing: '0.3px',
            textTransform: 'uppercase',
          }}>
            {ROLE_LABELS[role] || 'Nhân viên'}
          </div>
          {profile?.full_name && (
            <div style={{
              fontSize: 12,
              color: 'var(--color-text-muted)',
              marginTop: 8,
              textAlign: 'center',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {profile.full_name}
            </div>
          )}
        </div>
      )}

      {/* Navigation items */}
      <nav style={{
        flex: 1,
        padding: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        overflowY: 'auto',
      }}>
        {visibleItems.map(item => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path))

          return (
            <Link
              key={item.key}
              to={item.path}
              title={collapsed ? item.label : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: collapsed ? 0 : 10,
                padding: collapsed ? '12px 0' : '10px 12px',
                borderRadius: 8,
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                background: isActive ? 'var(--color-primary-bg)' : 'transparent',
                transition: 'all 0.15s ease',
                letterSpacing: '-0.1px',
              }}
            >
              <span style={{ fontSize: 18, lineHeight: 1, opacity: isActive ? 1 : 0.7 }}>
                {item.icon}
              </span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--color-border)',
          fontSize: 10,
          color: 'var(--color-text-muted)',
          textAlign: 'center',
        }}>
          PeopleHub v2.0
        </div>
      )}
    </aside>
  )
}
