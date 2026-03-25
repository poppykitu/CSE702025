import { useState } from 'react'
import { Card, Descriptions, Button, Form, Input, DatePicker, Select, Modal, Table, Tag, message } from 'antd'
import {
  UserOutlined,
  EditOutlined,
  CalendarOutlined,
  FileTextOutlined,
  MailOutlined,
  PhoneOutlined,
} from '@ant-design/icons'
import { useAuth } from '@/features/auth/context/AuthContext'
import { GENDER_LABELS, WORK_TYPE_LABELS, EMPLOYEE_STATUS } from '@/utils/constants'
import { ROLE_LABELS, LEAVE_TYPE_LABELS, LEAVE_STATUS_LABELS, LEAVE_STATUS_COLORS } from '@/constants/roles'
import { formatDate } from '@/utils/helpers'
import dayjs from 'dayjs'

export default function SelfServicePage() {
  const { profile } = useAuth()
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false)
  const [leaveForm] = Form.useForm()

  // Mock leave requests cho DEMO
  const [leaveRequests] = useState([
    {
      id: '1',
      type: 'annual',
      start_date: '2026-04-01',
      end_date: '2026-04-03',
      reason: 'Nghỉ phép gia đình',
      status: 'pending',
      created_at: '2026-03-20',
    },
    {
      id: '2',
      type: 'sick',
      start_date: '2026-03-10',
      end_date: '2026-03-10',
      reason: 'Khám sức khỏe định kỳ',
      status: 'approved',
      created_at: '2026-03-08',
    },
  ])

  const handleSubmitLeave = (values) => {
    message.success('Đã gửi đơn nghỉ phép thành công! Đang chờ quản lý phê duyệt.')
    setIsLeaveModalOpen(false)
    leaveForm.resetFields()
  }

  const leaveColumns = [
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      render: (type) => LEAVE_TYPE_LABELS[type] || type,
    },
    {
      title: 'Từ ngày',
      dataIndex: 'start_date',
      key: 'start_date',
      render: (date) => formatDate(date),
    },
    {
      title: 'Đến ngày',
      dataIndex: 'end_date',
      key: 'end_date',
      render: (date) => formatDate(date),
    },
    {
      title: 'Lý do',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusColor = LEAVE_STATUS_COLORS[status] || {}
        return (
          <span style={{
            padding: '3px 10px',
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 600,
            color: statusColor.color,
            background: statusColor.bg,
            border: `1px solid ${statusColor.border}`,
          }}>
            {LEAVE_STATUS_LABELS[status] || status}
          </span>
        )
      },
    },
  ]

  return (
    <div style={{
      padding: 24,
      minHeight: 'calc(100vh - 56px)',
      background: 'var(--color-bg)',
    }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          margin: 0, fontSize: 24, fontWeight: 800,
          fontFamily: 'var(--font-title)',
          color: 'var(--color-text-primary)', letterSpacing: '-0.5px',
        }}>
          Hồ sơ cá nhân
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
          Xem và cập nhật thông tin cá nhân của bạn
        </p>
      </div>

      {/* Profile Card */}
      <Card
        bordered={false}
        style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 20 }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserOutlined />
            <span style={{ fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-title)' }}>Thông tin cá nhân</span>
          </div>
        }
      >
        <Descriptions column={2} size="small">
          <Descriptions.Item label="Họ tên">
            <span style={{ fontWeight: 600 }}>{profile?.full_name || '--'}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Mã nhân viên">
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{profile?.employee_id || '--'}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            <span>{profile?.email || '--'}</span>
          </Descriptions.Item>
          <Descriptions.Item label="Vai trò">
            <Tag color="blue">{ROLE_LABELS[profile?.role] || 'Nhân viên'}</Tag>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Leave Requests */}
      <Card
        bordered={false}
        style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CalendarOutlined />
              <span style={{ fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-title)' }}>Đơn nghỉ phép của tôi</span>
            </div>
            <Button
              type="primary"
              icon={<FileTextOutlined />}
              onClick={() => setIsLeaveModalOpen(true)}
              size="small"
            >
              Tạo đơn nghỉ phép
            </Button>
          </div>
        }
      >
        <Table
          columns={leaveColumns}
          dataSource={leaveRequests}
          rowKey="id"
          pagination={false}
          size="small"
          locale={{ emptyText: 'Chưa có đơn nghỉ phép nào' }}
        />
      </Card>

      {/* Leave Request Modal */}
      <Modal
        title="Tạo đơn nghỉ phép mới"
        open={isLeaveModalOpen}
        onCancel={() => setIsLeaveModalOpen(false)}
        footer={null}
        width={500}
      >
        <Form
          form={leaveForm}
          layout="vertical"
          onFinish={handleSubmitLeave}
          style={{ marginTop: 16 }}
        >
          <Form.Item name="type" label="Loại nghỉ phép" rules={[{ required: true, message: 'Vui lòng chọn loại nghỉ phép' }]}>
            <Select
              placeholder="Chọn loại"
              options={Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
            />
          </Form.Item>
          <Form.Item name="dateRange" label="Thời gian" rules={[{ required: true, message: 'Vui lòng chọn ngày' }]}>
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="reason" label="Lý do" rules={[{ required: true, message: 'Vui lòng nhập lý do' }]}>
            <Input.TextArea rows={3} placeholder="Nhập lý do xin nghỉ phép..." />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block style={{ height: 40 }}>
              Gửi đơn nghỉ phép
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
