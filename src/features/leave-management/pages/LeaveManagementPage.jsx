import { useState } from 'react'
import { Table, Tag, Button, Modal, message, Card, Select, Input, Space } from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CalendarOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { useAuth } from '@/features/auth/context/AuthContext'
import { usePermission } from '@/features/auth/hooks/usePermission'
import { PERMISSIONS, LEAVE_TYPE_LABELS, LEAVE_STATUS_LABELS, LEAVE_STATUS_COLORS } from '@/constants/roles'
import { formatDate } from '@/utils/helpers'
import { useLeaveRequests, useApproveLeave, useRejectLeave } from '../hooks/useLeaves'

export default function LeaveManagementPage() {
  const { profile, role } = useAuth()
  const { hasPermission } = usePermission()
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchText, setSearchText] = useState('')

  const { data: leaveRequests = [], isLoading } = useLeaveRequests()
  const approveMutation = useApproveLeave()
  const rejectMutation = useRejectLeave()

  const handleApprove = (record) => {
    let comment = ''
    Modal.confirm({
      title: 'Phê duyệt đơn nghỉ phép',
      content: (
        <div style={{ marginTop: 16 }}>
          <p style={{ marginBottom: 8 }}>Ghi chú hoặc lời nhắn cho nhân viên (tùy chọn):</p>
          <Input.TextArea 
            rows={3} 
            placeholder="VD: Chúc bạn có kỳ nghỉ vui vẻ..." 
            onChange={(e) => comment = e.target.value}
          />
        </div>
      ),
      okText: 'Phê duyệt',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await approveMutation.mutateAsync({ id: record.id, comment })
          message.success(`Đã phê duyệt đơn của ${record.profiles?.full_name}`)
        } catch (err) {
          message.error('Lỗi khi phê duyệt: ' + err.message)
        }
      },
    })
  }

  const handleReject = (record) => {
    let reason = ''
    Modal.confirm({
      title: 'Từ chối đơn nghỉ phép',
      icon: <CloseCircleOutlined style={{ color: '#DC2626' }} />,
      content: (
        <div style={{ marginTop: 16 }}>
          <p style={{ marginBottom: 8 }}>Vui lòng nhập lý do từ chối (bắt buộc):</p>
          <Input.TextArea 
            rows={3} 
            placeholder="VD: Dự án đang trong giai đoạn nước rút..." 
            onChange={(e) => reason = e.target.value}
          />
        </div>
      ),
      okText: 'Từ chối',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      onOk: async () => {
        if (!reason) {
          message.warning('Vui lòng nhập lý do từ chối')
          return Promise.reject()
        }
        try {
          await rejectMutation.mutateAsync({ id: record.id, reason })
          message.info(`Đã từ chối đơn của ${record.profiles?.full_name}`)
        } catch (err) {
          message.error('Lỗi khi thực hiện: ' + err.message)
        }
      },
    })
  }

  const handleHRNote = (record) => {
    setLeaveRequests(prev =>
      prev.map(r => r.id === record.id ? { ...r, hr_noted: true } : r)
    )
    message.success(`Đã ghi nhận vào hồ sơ của ${record.employee_name}`)
  }

  const filteredRequests = leaveRequests.filter(r => {
    if (filterStatus !== 'all' && r.status !== filterStatus) return false
    const name = r.profiles?.full_name || ''
    if (searchText && !name.toLowerCase().includes(searchText.toLowerCase())) return false
    return true
  })

  const columns = [
    {
      title: 'Nhân viên',
      key: 'employee',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{record.profiles?.full_name || 'N/A'}</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{record.profiles?.employee_id || '--'}</div>
        </div>
      ),
    },
    {
      title: 'Phòng ban',
      key: 'dept',
      render: (_, record) => <span style={{ fontSize: 12 }}>{record.departments?.name || '--'}</span>,
    },
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
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const sc = LEAVE_STATUS_COLORS[status] || {}
        return (
          <span style={{
            padding: '3px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
            color: sc.color, background: sc.bg, border: `1px solid ${sc.border}`,
          }}>
            {LEAVE_STATUS_LABELS[status] || status}
          </span>
        )
      },
    },
    {
      title: 'HR ghi nhận',
      dataIndex: 'hr_noted',
      key: 'hr_noted',
      render: (noted) => noted
        ? <Tag color="green">Đã ghi nhận</Tag>
        : <Tag color="default">Chưa</Tag>,
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space size={4}>
          {record.status === 'pending' && hasPermission(PERMISSIONS.APPROVE_LEAVE) && (
            <>
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleApprove(record)}
                style={{ fontSize: 12 }}
              >
                Duyệt
              </Button>
              <Button
                danger
                size="small"
                icon={<CloseCircleOutlined />}
                onClick={() => handleReject(record)}
                style={{ fontSize: 12 }}
              >
                Từ chối
              </Button>
            </>
          )}
          {record.status === 'approved' && !record.hr_noted && hasPermission(PERMISSIONS.NOTE_LEAVE_HR) && (
            <Button
              size="small"
              onClick={() => handleHRNote(record)}
              style={{ fontSize: 12 }}
            >
              Ghi nhận HR
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div style={{
      padding: 24,
      minHeight: 'calc(100vh - 56px)',
      background: 'var(--color-bg)',
    }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          margin: 0, fontSize: 24, fontWeight: 800,
          fontFamily: 'var(--font-title)',
          color: 'var(--color-text-primary)', letterSpacing: '-0.5px',
        }}>
          Quản lý nghỉ phép
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
          Xem và xử lý đơn nghỉ phép của nhân viên
        </p>
      </div>

      <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <Input
            placeholder="Tìm theo tên nhân viên..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 260 }}
          />
          <Select
            value={filterStatus}
            onChange={setFilterStatus}
            style={{ width: 160 }}
            options={[
              { value: 'all', label: 'Tất cả trạng thái' },
              { value: 'pending', label: 'Chờ duyệt' },
              { value: 'approved', label: 'Đã duyệt' },
              { value: 'rejected', label: 'Từ chối' },
            ]}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredRequests}
          rowKey="id"
          pagination={{ pageSize: 10 }}
          size="small"
          locale={{ emptyText: 'Không có đơn nghỉ phép nào' }}
        />
      </Card>
    </div>
  )
}
