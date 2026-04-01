import { useParams, Link, useNavigate } from 'react-router-dom'
import { Button, Tabs, Descriptions, Tag, Modal, Skeleton, message, Timeline, Empty } from 'antd'
import {
  EditOutlined, ArrowLeftOutlined,
  MailOutlined, PhoneOutlined, EnvironmentOutlined,
  CalendarOutlined, TeamOutlined, UserOutlined,
  ExclamationCircleOutlined, FilePdfOutlined,
  BookOutlined, BankOutlined, ClockCircleOutlined,
} from '@ant-design/icons'
import { useEmployee } from '@/features/employees/hooks/useEmployees'
import { useTerminateEmployee } from '@/features/employees/hooks/useEmployees'
import EmployeeAvatar from '@/features/employees/components/EmployeeAvatar'
import StatusBadge from '@/features/employees/components/StatusBadge'
import {
  formatDate, calculateTenure, getAvatarColor,
} from '@/utils/helpers'
import { GENDER_LABELS, WORK_TYPE_LABELS, EMPLOYEE_STATUS } from '@/utils/constants'
import { usePermission } from '@/features/auth/hooks/usePermission'
import { useAuth } from '@/features/auth/context/AuthContext'
import { PERMISSIONS } from '@/constants/roles'
import DocumentsTab from '../components/DocumentsTab'
import AttendanceManageTab from '@/features/attendance/components/AttendanceManageTab'
import dayjs from 'dayjs'

export default function EmployeeDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: employee, isLoading, isError } = useEmployee(id)
  const terminateMutation = useTerminateEmployee()
  const { hasPermission } = usePermission()
  const canEdit = hasPermission(PERMISSIONS.EDIT_ANY_EMPLOYEE)
  const canTerminate = hasPermission(PERMISSIONS.TERMINATE_EMPLOYEE)

  if (isLoading) {
    return (
      <div style={{ padding: 24 }}>
        <Skeleton.Button style={{ width: 100, marginBottom: 24 }} active />
        <Skeleton avatar={{ size: 80 }} paragraph={{ rows: 4 }} active />
      </div>
    )
  }

  if (isError || !employee) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ color: 'var(--color-text-muted)', marginBottom: 16 }}>Không tìm thấy nhân viên</div>
        <Link to="/employees"><Button icon={<ArrowLeftOutlined />}>Quay lại</Button></Link>
      </div>
    )
  }

  const headerColor = getAvatarColor(employee.full_name)
  const isTerminated = employee.status === EMPLOYEE_STATUS.TERMINATED

  const handleTerminate = () => {
    Modal.confirm({
      title: 'Cho nhân viên nghỉ việc?',
      icon: <ExclamationCircleOutlined style={{ color: '#DC2626' }} />,
      content: `Xác nhận cho ${employee.full_name} nghỉ việc từ ngày hôm nay. Thao tác này có thể hoàn tác sau.`,
      okText: 'Xác nhận nghỉ việc',
      okButtonProps: { danger: true },
      cancelText: 'Huỷ',
      onOk: async () => {
        await terminateMutation.mutateAsync({
          id,
          terminationDate: dayjs().format('YYYY-MM-DD'),
        })
        message.success('Đã cập nhật trạng thái nhân viên')
        navigate('/employees')
      },
    })
  }

  const tabItems = [
    {
      key: 'employment',
      label: 'Thong tin viec lam',
      children: <EmploymentTab employee={employee} />,
    },
    {
      key: 'personal',
      label: 'Thong tin ca nhan',
      children: <PersonalTab employee={employee} />,
    },
    {
      key: 'academic',
      label: (
        <span><BookOutlined style={{ marginRight: 5 }} />Hoc van</span>
      ),
      children: <AcademicTab employee={employee} />,
    },
    {
      key: 'experience',
      label: (
        <span><BankOutlined style={{ marginRight: 5 }} />Kinh nghiem</span>
      ),
      children: <WorkExperienceTab employee={employee} />,
    },
    {
      key: 'schedule',
      label: (
        <span><ClockCircleOutlined style={{ marginRight: 5 }} />Lich lam viec</span>
      ),
      children: <WorkScheduleTab employee={employee} />,
    },
    {
      key: 'documents',
      label: 'Tai lieu',
      children: <DocumentsTab employeeId={id} />,
    },
  ]

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: 'var(--color-bg)' }}>
      {/* Back nav */}
      <div style={{
        padding: '12px 24px',
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      }}>
        <Link to="/employees">
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            size="small"
            style={{ color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}
          >
            Nhân viên
          </Button>
        </Link>
        <span style={{ color: 'var(--color-border)' }}>/</span>
        <span style={{ fontSize: 13, color: 'var(--color-text-primary)', fontWeight: 500 }}>
          {employee.full_name}
        </span>
      </div>

      {/* Profile Header Card */}
      <div style={{ padding: '24px 24px 0', maxWidth: 960, margin: '0 auto' }}>
        <div
          className="animate-fade-in-up"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            marginBottom: 20,
          }}
        >
          {/* Banner */}
          <div style={{
            height: 160,
            background: `linear-gradient(135deg, ${headerColor}20 0%, ${headerColor}08 50%, #F1F5F9 100%)`,
            borderBottom: `1px solid ${headerColor}15`,
            position: 'relative',
          }}>
            {/* Actions top-right - chỉ hiển thị khi có quyền */}
            <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8 }}>
              {!isTerminated && canEdit && (
                <Link to={`/employees/${id}/edit`}>
                  <Button icon={<EditOutlined />} size="small" style={{ background: 'rgba(255,255,255,0.9)' }}>
                    Chỉnh sửa
                  </Button>
                </Link>
              )}
              {!isTerminated && canTerminate && (
                <Button
                  size="small"
                  danger
                  onClick={handleTerminate}
                  loading={terminateMutation.isPending}
                  style={{ background: 'rgba(255,255,255,0.9)' }}
                >
                  Cho nghỉ việc
                </Button>
              )}
            </div>
          </div>

          {/* Profile info row */}
          <div style={{
            padding: '0 28px 24px',
            display: 'flex',
            gap: 24,
            alignItems: 'flex-end',
            marginTop: -16,
          }}>
            {/* Avatar */}
            <div style={{
              padding: 4,
              background: 'var(--color-surface)',
              borderRadius: '50%',
              boxShadow: '0 0 0 3px var(--color-border)',
              backdropFilter: 'blur(10px)',
              flexShrink: 0,
            }}>
              <EmployeeAvatar
                name={employee.full_name}
                avatarUrl={employee.avatar_url}
                size={72}
              />
            </div>

            {/* Name + meta */}
            <div style={{ paddingBottom: 4, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                <h1 style={{
                  margin: 0, fontSize: 26, fontWeight: 800,
                  fontFamily: 'var(--font-title)',
                  color: 'var(--color-text-primary)', lineHeight: 1.2,
                  letterSpacing: '-0.6px',
                }}>
                  {employee.full_name}
                </h1>
                <StatusBadge status={employee.status} />
              </div>

              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {employee.designations && (
                  <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                    {employee.designations.title}
                  </span>
                )}
                {employee.departments && (
                  <span style={{
                    fontSize: 12, color: 'var(--color-primary)',
                    background: 'var(--color-primary-bg)',
                    padding: '2px 8px', borderRadius: 4, fontWeight: 600,
                  }}>
                    {employee.departments.name}
                  </span>
                )}
                <span style={{
                  fontSize: 12, color: 'var(--color-text-muted)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {employee.employee_id}
                </span>
              </div>
            </div>

            {/* Quick stats right side */}
            <div style={{
              display: 'flex', gap: 20, paddingBottom: 4,
              flexShrink: 0,
            }}>
              {employee.date_of_joining && (
                <QuickStat
                  icon={<CalendarOutlined />}
                  label="Năm làm việc"
                  value={calculateTenure(employee.date_of_joining)}
                />
              )}
              {employee.email && (
                <QuickStat icon={<MailOutlined />} label="Email" value={employee.email} />
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div
          className="animate-fade-in-up"
          style={{
            animationDelay: '80ms',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '0 24px',
            marginBottom: 24,
          }}
        >
          <Tabs items={tabItems} />
        </div>
      </div>
    </div>
  )
}

function QuickStat({ icon, label, value }) {
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', maxWidth: 180 }} className="text-truncate">
        {value}
      </div>
    </div>
  )
}

function EmploymentTab({ employee }) {
  const { isAdmin, isHR } = useAuth()
  const sharedProps = {
    column: 2,
    size: "small",
    style: { padding: '8px 0 16px' },
    labelStyle: { display: 'flex', alignItems: 'center', height: '32px' },
    contentStyle: { display: 'flex', alignItems: 'center', height: '32px' }
  }

  return (
    <Descriptions {...sharedProps}>
      <Descriptions.Item label="Mã nhân viên">
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{employee.employee_id}</span>
      </Descriptions.Item>
      <Descriptions.Item label="Phòng ban">
        {employee.departments?.name || '—'}
      </Descriptions.Item>
      <Descriptions.Item label="Chức danh">
        {employee.designations?.title || '—'}
      </Descriptions.Item>
      <Descriptions.Item label="Quản lý trực tiếp">
        {employee.manager ? employee.manager.full_name : '—'}
      </Descriptions.Item>
      <Descriptions.Item label="Loại hợp đồng">
        {WORK_TYPE_LABELS[employee.work_type] || '—'}
      </Descriptions.Item>
      <Descriptions.Item label="Bản mềm Hợp đồng">
        {employee.contract_url ? (
          <Button 
            type="link" 
            size="small" 
            icon={<FilePdfOutlined />} 
            onClick={() => window.open(employee.contract_url, '_blank')}
            style={{ padding: 0, height: '32px', display: 'flex', alignItems: 'center' }}
          >
            Tải xuống/Xem PDF
          </Button>
        ) : (
          <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Chưa có bản mềm</span>
        )}
      </Descriptions.Item>
      <Descriptions.Item label="Địa điểm làm việc">
        {employee.work_location || '—'}
      </Descriptions.Item>
      <Descriptions.Item label="Ngày vào làm">
        {formatDate(employee.date_of_joining)}
      </Descriptions.Item>
      {employee.date_of_termination && (
        <Descriptions.Item label="Ngày nghỉ việc">
          <span style={{ color: '#DC2626' }}>{formatDate(employee.date_of_termination)}</span>
        </Descriptions.Item>
      )}
      {employee.bio && (
        <Descriptions.Item label="Giới thiệu" span={2}>
          <div style={{ height: 'auto', minHeight: '32px', display: 'flex', alignItems: 'flex-start', paddingTop: '6px' }}>
            <span style={{ fontStyle: 'italic', color: 'var(--color-text-secondary)' }}>
              {employee.bio}
            </span>
          </div>
        </Descriptions.Item>
      )}
    </Descriptions>
  )
}

function PersonalTab({ employee }) {
  const sharedProps = {
    column: 2,
    size: "small",
    style: { padding: '8px 0 16px' },
    labelStyle: { display: 'flex', alignItems: 'center', height: '32px' },
    contentStyle: { display: 'flex', alignItems: 'center', height: '32px' }
  }

  return (
    <Descriptions {...sharedProps}>
      <Descriptions.Item label="Email">
        <a href={`mailto:${employee.email}`} style={{ color: 'var(--color-primary)' }}>
          {employee.email}
        </a>
      </Descriptions.Item>
      <Descriptions.Item label="Dien thoai">
        {employee.phone || '—'}
      </Descriptions.Item>
      <Descriptions.Item label="Gioi tinh">
        {GENDER_LABELS[employee.gender] || '—'}
      </Descriptions.Item>
      <Descriptions.Item label="Ngay sinh">
        {formatDate(employee.date_of_birth)}
      </Descriptions.Item>
      <Descriptions.Item label="Dia chi" span={2}>
        <div style={{ height: 'auto', minHeight: '32px', display: 'flex', alignItems: 'center' }}>
          {employee.address || '—'}
        </div>
      </Descriptions.Item>
    </Descriptions>
  )
}

// ============================================================
// AcademicTab — Hoc van (academic_background JSONB)
// ============================================================
function AcademicTab({ employee }) {
  const records = employee.academic_background || []

  if (records.length === 0) {
    return <Empty description="Chua co thong tin hoc van" style={{ padding: '40px 0' }} />
  }

  return (
    <div style={{ padding: '16px 0' }}>
      <Timeline
        items={records.map((item, i) => ({
          key: i,
          color: 'blue',
          children: (
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 10,
              padding: '12px 16px',
              marginBottom: 4,
            }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{item.degree}</div>
              <div style={{ fontSize: 13, color: '#4F46E5', fontWeight: 600, marginTop: 2 }}>{item.institution}</div>
              <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                {item.field && <span style={{ marginRight: 12 }}>{item.field}</span>}
                {item.year && <Tag color="blue">{item.year}</Tag>}
              </div>
              {item.note && <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 6, fontStyle: 'italic' }}>{item.note}</div>}
            </div>
          ),
        }))}
      />
    </div>
  )
}

// ============================================================
// WorkExperienceTab — Kinh nghiem (work_experience JSONB)
// ============================================================
function WorkExperienceTab({ employee }) {
  const records = employee.work_experience || []

  if (records.length === 0) {
    return <Empty description="Chua co lich su cong tac" style={{ padding: '40px 0' }} />
  }

  return (
    <div style={{ padding: '16px 0' }}>
      <Timeline
        items={records.map((item, i) => ({
          key: i,
          color: item.to ? 'gray' : 'green',
          children: (
            <div style={{
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: 10,
              padding: '12px 16px',
              marginBottom: 4,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#0F172A' }}>{item.title}</div>
                  <div style={{ fontSize: 13, color: '#4F46E5', fontWeight: 600, marginTop: 2 }}>{item.company}</div>
                </div>
                <Tag color={item.to ? 'default' : 'success'}>
                  {item.from} — {item.to || 'Hien tai'}
                </Tag>
              </div>
              {item.description && (
                <div style={{ fontSize: 13, color: '#475569', marginTop: 8, lineHeight: 1.6 }}>
                  {item.description}
                </div>
              )}
            </div>
          ),
        }))}
      />
    </div>
  )
}

// ============================================================
// WorkScheduleTab — Lich lam viec (work_schedule JSONB)
// ============================================================
const DAY_LABELS = {
  Mon: 'Thu 2', Tue: 'Thu 3', Wed: 'Thu 4',
  Thu: 'Thu 5', Fri: 'Thu 6', Sat: 'Thu 7', Sun: 'CN'
}
const ALL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function WorkScheduleTab({ employee }) {
  const schedule = employee.work_schedule || {}
  const hasSchedule = schedule.shift_start || schedule.work_days?.length > 0

  if (!hasSchedule) {
    return <Empty description="Chua co lich lam viec" style={{ padding: '40px 0' }} />
  }

  return (
    <div style={{ padding: '20px 0' }}>
      {/* Shift time */}
      {schedule.shift_start && schedule.shift_end && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          background: '#EEF2FF',
          border: '1px solid #C7D2FE',
          borderRadius: 12,
          padding: '16px 24px',
          marginBottom: 20,
        }}>
          <ClockCircleOutlined style={{ fontSize: 28, color: '#4F46E5' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 18, color: '#0F172A', fontFamily: 'monospace' }}>
              {schedule.shift_start} — {schedule.shift_end}
            </div>
            <div style={{ fontSize: 12, color: '#6366F1', fontWeight: 500 }}>Gio lam viec</div>
          </div>
        </div>
      )}

      {/* Work days grid */}
      {schedule.work_days && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Ngay lam viec</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ALL_DAYS.map(day => {
              const active = schedule.work_days.includes(day)
              return (
                <div key={day} style={{
                  width: 52,
                  height: 52,
                  borderRadius: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: active ? '#4F46E5' : '#F1F5F9',
                  border: `2px solid ${active ? '#4F46E5' : '#E2E8F0'}`,
                  cursor: 'default',
                  transition: 'all 0.2s',
                }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: active ? '#fff' : '#94A3B8' }}>
                    {DAY_LABELS[day]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {schedule.note && (
        <div style={{ marginTop: 16, fontSize: 13, color: '#64748B', fontStyle: 'italic' }}>
          Ghi chu: {schedule.note}
        </div>
      )}
    </div>
  )
}
