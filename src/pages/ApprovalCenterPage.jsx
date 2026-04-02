import { useState } from 'react'
import {
  Table, Tag, Button, Space, Tabs, Modal, Form, Input,
  Select, message, Badge, Empty, Typography
} from 'antd'
import {
  CheckOutlined, CloseOutlined, FileTextOutlined,
  UserOutlined, CalendarOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/features/auth/context/AuthContext'

dayjs.extend(relativeTime)

const { TextArea } = Input
const { Text } = Typography

import { getLeaveRequests } from '@/features/leave-management/services/leaveService'

// =========================================================
// Data hooks (inline for this page)
// =========================================================
function usePendingLeaves() {
  return useQuery({
    queryKey: ['approval-leaves'],
    queryFn: async () => {
      const data = await getLeaveRequests()
      return (data || [])
        .filter(rec => rec.status === 'pending')
        .map(rec => ({
          ...rec,
          employee: {
            ...rec.profiles,
            departments: rec.departments
          }
        }))
    },
    refetchInterval: 30000,
  })
}

function useApproveLeave() {
  const qc = useQueryClient()
  const { profile } = useAuth()
  return useMutation({
    mutationFn: async ({ id, action, reason }) => {
      const { error } = await supabase
        .from('leave_requests')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          approved_by: profile.id,
          approved_at: new Date().toISOString(),
          reject_reason: reason || null,
        })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['approval-leaves'] })
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

const LEAVE_TYPE_LABELS = {
  annual: 'Nghỉ năm',
  sick: 'Nghỉ ốm',
  personal: 'Việc riêng',
  maternity: 'Thai sản',
  other: 'Khác',
}

const STATUS_COLOR = { pending: 'gold', approved: 'success', rejected: 'error', cancelled: 'default' }

// =========================================================
// Main Page
// =========================================================
export default function ApprovalCenterPage() {
  const { data: leaves = [], isLoading: leavesLoading } = usePendingLeaves()
  const { mutateAsync: approveLeave, isPending } = useApproveLeave()
  const [rejectModal, setRejectModal] = useState(false)
  const [selectedLeave, setSelectedLeave] = useState(null)
  const [rejectForm] = Form.useForm()

  const handleApprove = async (leave) => {
    Modal.confirm({
      title: 'Xác nhận Phê duyệt',
      content: `Phê duyệt đơn nghỉ phép của ${leave.employee?.full_name}?`,
      okText: 'Phê duyệt',
      okType: 'primary',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await approveLeave({ id: leave.id, action: 'approve' })
          message.success('Đã phê duyệt đơn nghỉ phép.')
        } catch (err) {
          message.error(err.message)
        }
      },
    })
  }

  const handleOpenReject = (leave) => {
    setSelectedLeave(leave)
    setRejectModal(true)
  }

  const handleReject = async (values) => {
    try {
      await approveLeave({ id: selectedLeave.id, action: 'reject', reason: values.reason })
      message.success('Đã từ chối đơn nghỉ phép.')
      setRejectModal(false)
      rejectForm.resetFields()
    } catch (err) {
      message.error(err.message)
    }
  }

  const leaveColumns = [
    {
      title: 'Nhân viên',
      dataIndex: 'employee',
      render: (emp) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{emp?.full_name}</div>
          <div style={{ fontSize: 11, color: '#64748B' }}>
            {emp?.employee_id} — {emp?.departments?.name}
          </div>
        </div>
      ),
    },
    {
      title: 'Loại nghỉ',
      dataIndex: 'type',
      render: (type) => <Tag color="blue">{LEAVE_TYPE_LABELS[type] || type}</Tag>,
    },
    {
      title: 'Thời gian',
      render: (_, rec) => (
        <div style={{ fontSize: 13 }}>
          <div>{dayjs(rec.start_date).format('DD/MM/YYYY')} — {dayjs(rec.end_date).format('DD/MM/YYYY')}</div>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {dayjs(rec.end_date).diff(dayjs(rec.start_date), 'day') + 1} ngày
          </Text>
        </div>
      ),
    },
    {
      title: 'Lý do',
      dataIndex: 'reason',
      ellipsis: true,
      render: (r) => r || <Text type="secondary">Không có lý do</Text>,
    },
    {
      title: 'Nộp lúc',
      dataIndex: 'created_at',
      render: (d) => dayjs(d).fromNow(),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, rec) => (
        <Space>
          <Button
            size="small"
            type="primary"
            icon={<CheckOutlined />}
            loading={isPending}
            onClick={() => handleApprove(rec)}
          >
            Duyệt
          </Button>
          <Button
            size="small"
            danger
            icon={<CloseOutlined />}
            onClick={() => handleOpenReject(rec)}
          >
            Từ chối
          </Button>
        </Space>
      ),
    },
  ]

  const tabItems = [
    {
      key: 'leaves',
      label: (
        <span>
          <CalendarOutlined style={{ marginRight: 6 }} />
          Đơn Nghỉ phép
          {leaves.length > 0 && (
            <Badge count={leaves.length} style={{ marginLeft: 8, backgroundColor: '#EF4444' }} />
          )}
        </span>
      ),
      children: (
        <Table
          dataSource={leaves}
          columns={leaveColumns}
          rowKey="id"
          loading={leavesLoading}
          locale={{ emptyText: <Empty description="Không có đơn nghỉ phép cần phê duyệt" /> }}
          pagination={{ pageSize: 8 }}
          size="middle"
        />
      ),
    },
    {
      key: 'profiles',
      label: (
        <span>
          <UserOutlined style={{ marginRight: 6 }} />
          Cập nhật Hồ sơ
        </span>
      ),
      children: (
        <Empty
          description="Tính năng phê duyệt cập nhật hồ sơ sẽ được tích hợp trong phiên bản tiếp theo."
          style={{ padding: '48px 0' }}
        />
      ),
    },
  ]

  return (
    <div style={{ padding: '24px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#0F172A' }}>
          Phê duyệt
        </h1>
        <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: 14 }}>
          Xem xét và xử lý tất cả các yêu cầu đang chờ phê duyệt
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Đơn nghỉ phép chờ duyệt', count: leaves.length, color: '#F59E0B', bg: '#FFFBEB', icon: <CalendarOutlined /> },
          { label: 'Cập nhật hồ sơ chờ duyệt', count: 0, color: '#4F46E5', bg: '#EEF2FF', icon: <UserOutlined /> },
          { label: 'Hồ sơ ứng tuyển mới', count: 0, color: '#0891B2', bg: '#CFFAFE', icon: <FileTextOutlined /> },
        ].map((card, i) => (
          <div key={i} style={{
            background: card.bg,
            border: `1px solid ${card.color}30`,
            borderRadius: 12,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}>
            <div style={{ fontSize: 28, color: card.color }}>{card.icon}</div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, color: card.color, lineHeight: 1 }}>{card.count}</div>
              <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ background: '#fff', borderRadius: 14, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9' }}>
        <Tabs
          items={tabItems}
          style={{ padding: '0 20px' }}
          tabBarStyle={{ marginBottom: 0 }}
        />
      </div>

      {/* Reject Modal */}
      <Modal
        title={`Từ chối đơn nghỉ phép — ${selectedLeave?.employee?.full_name}`}
        open={rejectModal}
        onCancel={() => { setRejectModal(false); rejectForm.resetFields() }}
        footer={null}
      >
        <Form form={rejectForm} layout="vertical" onFinish={handleReject}>
          <Form.Item
            name="reason"
            label="Lý do từ chối"
            rules={[{ required: true, message: 'Vui lòng nhập lý do từ chối' }]}
          >
            <TextArea rows={3} placeholder="Nhân viên cần có mặt trong giai đoạn này..." />
          </Form.Item>
          <Button danger htmlType="submit" block loading={isPending}>
            Xác nhận Từ chối
          </Button>
        </Form>
      </Modal>
    </div>
  )
}
