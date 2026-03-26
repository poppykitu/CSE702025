import { Card, Row, Col, Statistic, Table, Tag, Progress, Avatar, Space, Grid } from 'antd'
import {
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  ArrowUpOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  CalendarOutlined,
} from '@ant-design/icons'
import { motion } from 'framer-motion'
import { useEmployees } from '@/features/employees/hooks/useEmployees'
import { useDepartments } from '@/hooks/useDepartments'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useDashboardActivities } from '@/hooks/useDashboardActivities'
import { ROLE_LABELS } from '@/constants/roles'
import { formatDate } from '@/utils/helpers'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'

dayjs.extend(relativeTime)
dayjs.locale('vi')

const { useBreakpoint } = Grid

export default function DashboardPage() {
  const { profile, role } = useAuth()
  const { data: employees = [] } = useEmployees({})
  const { data: departments = [] } = useDepartments()
  const { data: activities = [], isLoading: isActLoading } = useDashboardActivities()
  const screens = useBreakpoint()

  const activeCount = employees.filter(e => e.status === 'active').length
  const onboardingCount = employees.filter(e => e.status === 'onboarding').length

  // Responsive Bento Layout logic
  const getGridConfig = () => {
    if (screens.lg) return { columns: 4, rowHeight: '160px' }
    if (screens.md) return { columns: 2, rowHeight: '180px' }
    return { columns: 1, rowHeight: 'auto' }
  }

  const { columns, rowHeight } = getGridConfig()

  const bentoGridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gridAutoRows: `minmax(${rowHeight}, auto)`,
    gap: '20px',
    padding: '0 0 40px 0'
  }

  const cardBaseStyle = {
    borderRadius: '20px',
    border: '1px solid var(--color-border)',
    background: 'var(--color-surface)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
    overflow: 'hidden',
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  }

  return (
    <div style={{ padding: 24, background: 'var(--color-bg)', minHeight: '100%' }}>
      {/* Header Section */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, letterSpacing: '-1px', color: 'var(--color-text-primary)' }}>
            Trung tâm Điều hành
          </h1>
          <p style={{ margin: '8px 0 0', color: 'var(--color-text-muted)', fontSize: 14 }}>
            Chào mừng trở lại, <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{profile?.full_name}</span>. Hệ thống đang hoạt động ổn định.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <Tag color="blue" style={{ borderRadius: 20, padding: '4px 12px', fontWeight: 600 }}>{formatDate(new Date())}</Tag>
        </div>
      </div>

      <div style={bentoGridStyle}>

        {/* CARD 1: Profile & Quick Status (2x1) */}
        <div style={{
          ...cardBaseStyle,
          gridColumn: screens.lg ? 'span 2' : 'span 1',
          gridRow: 'span 1',
          position: 'relative',
          background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
          color: 'var(--color-text-primary)'
        }}>
          <div style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 20, zIndex: 1 }}>
            <Avatar size={80} style={{ backgroundColor: 'var(--color-primary)', border: '4px solid #fff', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
              {profile?.full_name?.charAt(0)}
            </Avatar>
            <div>
              <h2 style={{ color: 'var(--color-text-primary)', margin: 0, fontSize: 24, fontWeight: 900 }}>{profile?.full_name}</h2>
              <p style={{ color: 'var(--color-text-muted)', margin: '4px 0 12px', fontSize: 13, fontWeight: 500 }}>{ROLE_LABELS[role]}</p>
              <Space>
                <Tag color="#0284C7" icon={<CheckCircleOutlined />} style={{ borderRadius: 6, fontWeight: 600 }}>Đã xác thực</Tag>
                <Tag color="#0EA5E9" icon={<ThunderboltOutlined />} style={{ borderRadius: 6, fontWeight: 600 }}>Online</Tag>
              </Space>
            </div>
          </div>
          <div style={{ position: 'absolute', right: -20, bottom: -20, opacity: 0.15, color: 'var(--color-primary)' }}>
            <TeamOutlined style={{ fontSize: 130 }} />
          </div>
        </div>

        {/* CARD 2: Total Employees (1x1) */}
        <div style={{ ...cardBaseStyle, gridColumn: 'span 1' }}>
          <div style={{ padding: 24 }}>
            <Statistic
              title={<span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Tổng nhân viên</span>}
              value={employees.length}
              prefix={<TeamOutlined style={{ color: 'var(--color-primary)', marginRight: 8 }} />}
              valueStyle={{ fontSize: 36, fontWeight: 900 }}
            />
            <div style={{ marginTop: 12, fontSize: 13, color: '#16A34A', fontWeight: 600 }}>
              <ArrowUpOutlined /> 12% so với tháng trước
            </div>
          </div>
        </div>

        {/* CARD 3: Active Status (1x1) */}
        <div style={{ ...cardBaseStyle, gridColumn: 'span 1' }}>
          <div style={{ padding: 24 }}>
            <Statistic
              title={<span style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Đang làm việc</span>}
              value={activeCount}
              valueStyle={{ fontSize: 36, fontWeight: 900, color: '#16A34A' }}
            />
            <Progress percent={Math.round((activeCount / employees.length) * 100)} size="small" strokeColor="#16A34A" showInfo={false} />
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text-muted)' }}>
              Hiệu suất điểm danh: 98%
            </div>
          </div>
        </div>

        {/* CARD 4: Recent Activities (1x2) */}
        <div style={{ ...cardBaseStyle, gridColumn: 'span 1', gridRow: (screens.lg || screens.md) ? 'span 2' : 'span 1' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 800 }}>Hoạt động mới</span>
            <Tag color="cyan">Thời gian thực</Tag>
          </div>
          <div style={{ flex: 1, padding: '12px 24px', overflowY: 'auto' }}>
            {isActLoading ? (
              <div style={{ paddingTop: 20, textAlign: 'center', color: 'var(--color-text-muted)' }}>Đang tải...</div>
            ) : activities.length === 0 ? (
              <div style={{ paddingTop: 24, textAlign: 'center', fontSize: 13, color: 'var(--color-text-muted)' }}>Chưa có hoạt động mới nào</div>
            ) : (
              activities.map(act => (
                <div key={act.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--color-border-subtle)', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', marginTop: 6,
                      background: act.type === 'late' ? '#ef4444' : (act.type === 'leave' ? '#f59e0b' : '#10b981')
                    }} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2, color: 'var(--color-text-primary)' }}>{act.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                        {act.subtitle} • {dayjs(act.time).fromNow()}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CARD 5: Department Distribution (2x1) */}
        <div style={{ ...cardBaseStyle, gridColumn: screens.lg ? 'span 2' : 'span 1' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)' }}>
            <span style={{ fontWeight: 800 }}>Cơ cấu phòng ban</span>
          </div>
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {departments.length === 0 ? (
              <div style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Đang tải dữ liệu...</div>
            ) : (
              departments.slice(0, 3).map(dept => {
                const count = employees.filter(e => e.department_id === dept.id).length
                const percent = employees.length > 0 ? Math.round((count / employees.length) * 100) : 0
                return (
                  <div key={dept.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{dept.name}</span>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{count} người</span>
                    </div>
                    <Progress percent={percent} status="active" strokeColor="var(--color-primary)" showInfo={false} />
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* CARD 6: Salary Stats (1x1) */}
        <div style={{ ...cardBaseStyle, gridColumn: 'span 1', background: 'var(--color-primary-bg)', border: '1px solid #d6ebfaff' }}>
          <div style={{ padding: 24, h: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Statistic
              title={<span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>Tổng Quỹ Lương</span>}
              value={450000000}
              prefix={<DollarOutlined />}
              valueStyle={{ fontSize: 24, fontWeight: 900, color: 'var(--color-primary)' }}
            />
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-primary)' }}>
              Ước tính kỳ lương Tháng 03
            </div>
          </div>
        </div>

        {/* CARD 7: New Hires (2x1) */}
        <div style={{ ...cardBaseStyle, gridColumn: screens.lg ? 'span 2' : 'span 1' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-border)' }}>
            <span style={{ fontWeight: 800 }}>Nhân sự mới tham gia</span>
          </div>
          <div style={{ padding: '12px 24px' }}>
            <Table
              dataSource={employees.slice(0, 3)}
              pagination={false}
              size="small"
              showHeader={false}
              rowKey="id"
              columns={[
                {
                  render: (_, record) => (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar size="small" style={{ backgroundColor: 'var(--color-secondary)' }}>{record.full_name?.charAt(0)}</Avatar>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{record.full_name}</div>
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{record.departments?.name}</div>
                      </div>
                    </div>
                  )
                },
                {
                  render: (_, record) => <Tag color="blue">{formatDate(record.date_of_joining)}</Tag>
                }
              ]}
            />
          </div>
        </div>

        {/* CARD 8: Onboarding Queue (1x1) */}
        <div style={{ ...cardBaseStyle, gridColumn: 'span 1' }}>
          <div style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 8 }}>Chờ Onboarding</div>
            <div style={{ fontSize: 48, fontWeight: 900, color: '#D97706' }}>{onboardingCount}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 8 }}>
              {[1, 2, 3].map(i => <Avatar key={i} size={24} style={{ border: '2px solid #fff' }} />)}
            </div>
          </div>
        </div>

        {/* CARD 9: Leave Requests (1x1) */}
        <div style={{ ...cardBaseStyle, gridColumn: 'span 1' }}>
          <div style={{ padding: 24, h: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <CalendarOutlined style={{ fontSize: 32, color: 'var(--color-primary)', marginBottom: 12 }} />
            <div style={{ fontSize: 20, fontWeight: 800 }}>8 Đơn nghỉ phép</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Đang chờ phê duyệt</div>
          </div>
        </div>

      </div>
    </div>
  )
}
