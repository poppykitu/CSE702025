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

// =========================================================
// Data hooks (inline for this page)
// =========================================================
function usePendingLeaves() {
  return useQuery({
    queryKey: ['approval-leaves'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leave_requests')
        .select(`
          *,
          employee:profiles!employee_id(full_name, email, employee_id, departments(name))
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
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
  annual: 'Nghi nam',
  sick: 'Nghi om',
  personal: 'Viec rieng',
  maternity: 'Thai san',
  other: 'Khac',
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
      title: 'Xac nhan Phe duyet',
      content: `Phe duyet don nghi phep cua ${leave.employee?.full_name}?`,
      okText: 'Phe duyet',
      okType: 'primary',
      cancelText: 'Huy',
      onOk: async () => {
        try {
          await approveLeave({ id: leave.id, action: 'approve' })
          message.success('Da phe duyet don nghi phep.')
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
      message.success('Da tu choi don nghi phep.')
      setRejectModal(false)
      rejectForm.resetFields()
    } catch (err) {
      message.error(err.message)
    }
  }

  const leaveColumns = [
    {
      title: 'Nhan vien',
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
      title: 'Loai nghi',
      dataIndex: 'type',
      render: (type) => <Tag color="blue">{LEAVE_TYPE_LABELS[type] || type}</Tag>,
    },
    {
      title: 'Thoi gian',
      render: (_, rec) => (
        <div style={{ fontSize: 13 }}>
          <div>{dayjs(rec.start_date).format('DD/MM/YYYY')} — {dayjs(rec.end_date).format('DD/MM/YYYY')}</div>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {dayjs(rec.end_date).diff(dayjs(rec.start_date), 'day') + 1} ngay
          </Text>
        </div>
      ),
    },
    {
      title: 'Ly do',
      dataIndex: 'reason',
      ellipsis: true,
      render: (r) => r || <Text type="secondary">Khong co ly do</Text>,
    },
    {
      title: 'Nop luc',
      dataIndex: 'created_at',
      render: (d) => dayjs(d).fromNow(),
    },
    {
      title: 'Hanh dong',
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
            Duyet
          </Button>
          <Button
            size="small"
            danger
            icon={<CloseOutlined />}
            onClick={() => handleOpenReject(rec)}
          >
            Tu choi
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
          Don Nghi phep
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
          locale={{ emptyText: <Empty description="Khong co don nghi phep can phe duyet" /> }}
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
          Cap nhat Ho so
        </span>
      ),
      children: (
        <Empty
          description="Tinh nang phe duyet cap nhat ho so se duoc tich hop trong phien tiep theo."
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
          Trung tam Phe duyet
        </h1>
        <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: 14 }}>
          Xem xet va xu ly tat ca cac yeu cau dang cho phe duyet
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Don nghi phep cho duyet', count: leaves.length, color: '#F59E0B', bg: '#FFFBEB', icon: <CalendarOutlined /> },
          { label: 'Cap nhat ho so cho duyet', count: 0, color: '#4F46E5', bg: '#EEF2FF', icon: <UserOutlined /> },
          { label: 'Ho so ung tuyen moi', count: 0, color: '#0891B2', bg: '#CFFAFE', icon: <FileTextOutlined /> },
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
        title={`Tu choi don nghi phep — ${selectedLeave?.employee?.full_name}`}
        open={rejectModal}
        onCancel={() => { setRejectModal(false); rejectForm.resetFields() }}
        footer={null}
      >
        <Form form={rejectForm} layout="vertical" onFinish={handleReject}>
          <Form.Item
            name="reason"
            label="Ly do tu choi"
            rules={[{ required: true, message: 'Vui long nhap ly do tu choi' }]}
          >
            <TextArea rows={3} placeholder="Nhan vien can co mat trong giai doan nay..." />
          </Form.Item>
          <Button danger htmlType="submit" block loading={isPending}>
            Xac nhan Tu choi
          </Button>
        </Form>
      </Modal>
    </div>
  )
}
