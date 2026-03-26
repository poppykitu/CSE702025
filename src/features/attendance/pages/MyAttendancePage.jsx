import { useState } from 'react'
import { Table, Tag, Card, Row, Col, Statistic, Calendar, Tabs, Select } from 'antd'
import { ClockCircleOutlined, CheckCircleOutlined, WarningOutlined, UserOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { getMyAttendance } from '@/services/selfService'
import { useAuth } from '@/features/auth/context/AuthContext'
import { formatDate } from '@/utils/helpers'
import { useEmployees } from '@/features/employees/hooks/useEmployees'
import AttendanceManageTab from '@/features/attendance/components/AttendanceManageTab'

const ATTENDANCE_LABELS = {
  'present': { label: 'Có mặt', color: 'green' },
  'late': { label: 'Đi muộn', color: 'orange' },
  'absent': { label: 'Vắng mặt', color: 'red' },
  'early_leave': { label: 'Về sớm', color: 'blue' }
}

function PersonalAttendanceTab() {
  const { profile } = useAuth()
  
  const { data: records = [], isLoading } = useQuery({
    queryKey: ['attendance', profile?.id],
    queryFn: () => getMyAttendance(profile?.id),
    enabled: !!profile?.id
  })

  const stats = {
    present: records.filter(r => r.status === 'present').length,
    late: records.filter(r => r.status === 'late').length,
    absent: records.filter(r => r.status === 'absent').length
  }

  const columns = [
    { title: 'Ngày', dataIndex: 'work_date', key: 'work_date', render: (date) => formatDate(date) },
    { title: 'Giờ vào', dataIndex: 'check_in', key: 'check_in', render: (time) => time ? new Date(time).toLocaleTimeString() : '--' },
    { title: 'Giờ ra', dataIndex: 'check_out', key: 'check_out', render: (time) => time ? new Date(time).toLocaleTimeString() : '--' },
    { 
      title: 'Trạng thái', 
      dataIndex: 'status', 
      key: 'status',
      render: (status) => (
        <Tag color={ATTENDANCE_LABELS[status]?.color}>
          {ATTENDANCE_LABELS[status]?.label || status}
        </Tag>
      )
    },
    { title: 'Ghi chú', dataIndex: 'note', key: 'note' }
  ]

  return (
    <>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic title="Số ngày công" value={stats.present} prefix={<CheckCircleOutlined style={{ color: '#16A34A' }} />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic title="Đi muộn" value={stats.late} prefix={<ClockCircleOutlined style={{ color: '#D97706' }} />} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic title="Vắng mặt" value={stats.absent} prefix={<WarningOutlined style={{ color: '#DC2626' }} />} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card title="Lịch sử chi tiết" style={{ borderRadius: 12 }}>
            <Table 
              columns={columns} 
              dataSource={records} 
              rowKey="id" 
              loading={isLoading} 
              size="small"
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Lịch làm việc" style={{ borderRadius: 12 }}>
            <Calendar fullscreen={false} />
          </Card>
        </Col>
      </Row>
    </>
  )
}

function AdminAttendanceTab() {
  const { data: employees = [], isLoading } = useEmployees()
  const [selectedEmpId, setSelectedEmpId] = useState(null)

  return (
    <Card bordered={false} style={{ borderRadius: 12, minHeight: 400 }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontWeight: 500 }}>Chọn nhân viên cần quản lý chấm công:</span>
        <Select
          showSearch
          style={{ width: 300 }}
          placeholder="Tìm nhân viên..."
          loading={isLoading}
          onChange={(val) => setSelectedEmpId(val)}
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          options={employees.map(emp => ({
            value: emp.id,
            label: `${emp.full_name} (${emp.employee_id || 'N/A'})`
          }))}
        />
      </div>

      {selectedEmpId ? (
        <AttendanceManageTab employeeId={selectedEmpId} />
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>
          <UserOutlined style={{ fontSize: 48, marginBottom: 16, opacity: 0.2 }} />
          <p>Vui lòng chọn một nhân viên để xem và quản lý chấm công</p>
        </div>
      )}
    </Card>
  )
}

export default function MyAttendancePage() {
  const { isAdmin, isHR } = useAuth()
  
  const items = [
    {
      key: 'personal',
      label: 'Cá nhân của tôi',
      children: <PersonalAttendanceTab />
    }
  ]

  if (isAdmin || isHR) {
    items.push({
      key: 'manage',
      label: 'Quản lý toàn công ty (Admin)',
      children: <AdminAttendanceTab />
    })
  }

  return (
    <div style={{ padding: 24, background: 'var(--color-bg)', minHeight: 'calc(100vh - 56px)' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Chấm công</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Xem lịch sử chấm công và điểm danh</p>
      </div>

      <Tabs items={items} type="line" size="large" />
    </div>
  )
}
