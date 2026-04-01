import { useState } from 'react'
import {
  Table, Tag, Button, Space, Modal, Form, Input, DatePicker,
  Select, Steps, Tooltip, Descriptions, Typography, message, Drawer
} from 'antd'
import {
  EyeOutlined, CheckOutlined, CloseOutlined, CalendarOutlined,
  UserOutlined, FileTextOutlined, TrophyOutlined, CopyOutlined, MailOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useApplications, useUpdateApplicationStage, useScheduleInterview, useHireApplicant } from '../hooks/useRecruitment'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useEmployees } from '@/features/employees/hooks/useEmployees'
import { supabase } from '@/lib/supabaseClient'

const { Text } = Typography
const { TextArea } = Input

// Pipeline stage configuration
const STAGES = [
  { key: 'sourcing',  label: 'Tim nguon', color: 'default',   step: 0 },
  { key: 'applied',   label: 'Da Nop',    color: 'blue',     step: 1 },
  { key: 'review',    label: 'Xem xet',   color: 'gold',     step: 2 },
  { key: 'interview', label: 'Phong van', color: 'purple',   step: 3 },
  { key: 'hired',     label: 'Tuyen dung',color: 'success',  step: 4 },
  { key: 'rejected',  label: 'Tu choi',   color: 'error',    step: 4 },
]

const stageStep = (stage) => STAGES.find(s => s.key === stage)?.step ?? 1

export default function RecruitmentManagementPage() {
  const { profile } = useAuth()
  const [filterStage, setFilterStage] = useState(null)
  const [selectedApp, setSelectedApp] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [interviewModal, setInterviewModal] = useState(false)
  const [rejectModal, setRejectModal] = useState(false)
  const [inviteModal, setInviteModal] = useState(false)
  const [inviteSending, setInviteSending] = useState(false)
  const [interviewForm] = Form.useForm()
  const [rejectForm] = Form.useForm()
  const [inviteForm] = Form.useForm()

  const { data: applications = [], isLoading } = useApplications(filterStage ? { stage: filterStage } : {})
  const { data: allProfiles = [] } = useEmployees()
  const { mutateAsync: updateStage, isPending: isUpdating } = useUpdateApplicationStage()
  const { mutateAsync: scheduleInterview, isPending: isScheduling } = useScheduleInterview()
  const { mutateAsync: hireApplicant, isPending: isHiring } = useHireApplicant()

  const handleAdvanceStage = async (app, nextStage) => {
    try {
      await updateStage({ id: app.id, stage: nextStage })
      message.success(`Chuyen sang giai doan: ${STAGES.find(s => s.key === nextStage)?.label}`)
    } catch (err) {
      message.error(err.message)
    }
  }

  const handleScheduleInterview = async (values) => {
    try {
      await scheduleInterview({
        id: selectedApp.id,
        interview_time: values.interview_time.toISOString(),
        interviewer_id: values.interviewer_id,
      })
      message.success('Da dat lich phong van. Email thong bao se duoc gui den ung vien.')
      setInterviewModal(false)
      interviewForm.resetFields()
    } catch (err) {
      message.error(err.message)
    }
  }

  const handleReject = async (values) => {
    try {
      await updateStage({ id: selectedApp.id, stage: 'rejected', rejection_reason: values.reason })
      message.success('Da tu choi ung vien.')
      setRejectModal(false)
      rejectForm.resetFields()
    } catch (err) {
      message.error(err.message)
    }
  }

  const handleHire = async (app) => {
    Modal.confirm({
      title: 'Xac nhan Tuyen dung',
      content: `Tuyen ${app.candidate_name}? He thong se tu dong tao ho so nhan vien va gui Magic Link thiet lap tai khoan.`,
      okText: 'Tuyen dung',
      okType: 'primary',
      cancelText: 'Huy',
      onOk: async () => {
        try {
          const result = await hireApplicant({ applicationId: app.id, hiredById: profile.id })
          // Send onboarding Magic Link
          await sendMagicLink(app.candidate_email, '/dashboard')
          message.success(`Da tuyen ${app.candidate_name}. Magic Link da gui den ${app.candidate_email}`)
        } catch (err) {
          message.error(err.message)
        }
      },
    })
  }

  const handleCopyLink = () => {
    const link = `${window.location.origin}/apply`
    navigator.clipboard.writeText(link)
      .then(() => message.success('Da sao chep link ung tuyen vao bo nho dem!'))
      .catch(() => message.error('Khong the sao chep. Vui long sao chep thu cong: ' + link))
  }

  const handleSendInvite = async (values) => {
    setInviteSending(true)
    try {
      const { data, error } = await supabase.functions.invoke('send-invite', {
        body: {
          email: values.email,
          note: values.note,
          position: values.position,
          sender_name: profile?.full_name || 'PeopleHub HR Team',
        },
      })

      if (error) throw new Error(error.message)
      if (data?.error) throw new Error(data.error)

      message.success(`Da gui loi moi ung tuyen den ${values.email} thanh cong!`)
      setInviteModal(false)
      inviteForm.resetFields()
    } catch (err) {
      message.error('Gui loi moi that bai: ' + err.message)
    } finally {
      setInviteSending(false)
    }
  }

  const openDetail = (app) => {
    setSelectedApp(app)
    setDetailOpen(true)
  }

  const columns = [
    {
      title: 'Ung vien',
      dataIndex: 'candidate_name',
      render: (name, rec) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{name}</div>
          <div style={{ fontSize: 12, color: '#64748B' }}>{rec.candidate_email}</div>
        </div>
      ),
    },
    {
      title: 'Vi tri',
      dataIndex: 'position_applied',
      render: (pos, rec) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: 13 }}>{pos}</div>
          {rec.departments && <div style={{ fontSize: 12, color: '#64748B' }}>{rec.departments.name}</div>}
        </div>
      ),
    },
    {
      title: 'Luong mong muon',
      dataIndex: 'expected_salary',
      render: (s) => s ? `${(s || 0).toLocaleString('vi-VN')} VND` : '-',
    },
    {
      title: 'Giai doan',
      dataIndex: 'stage',
      render: (stage) => {
        const s = STAGES.find(x => x.key === stage)
        return <Tag color={s?.color}>{s?.label || stage}</Tag>
      },
    },
    {
      title: 'Ngay nop',
      dataIndex: 'created_at',
      render: (d) => dayjs(d).format('DD/MM/YYYY'),
    },
    {
      title: 'Hanh dong',
      key: 'actions',
      render: (_, rec) => (
        <Space>
          <Tooltip title="Xem chi tiet">
            <Button size="small" icon={<EyeOutlined />} onClick={() => openDetail(rec)} />
          </Tooltip>

          {rec.stage === 'applied' && (
            <Tooltip title="Chuyen sang Xem xet">
              <Button size="small" type="primary" ghost onClick={() => handleAdvanceStage(rec, 'review')}>
                Xem xet
              </Button>
            </Tooltip>
          )}

          {rec.stage === 'review' && (
            <Tooltip title="Dat lich Phong van">
              <Button
                size="small"
                icon={<CalendarOutlined />}
                onClick={() => { setSelectedApp(rec); setInterviewModal(true) }}
              >
                Phong van
              </Button>
            </Tooltip>
          )}

          {rec.stage === 'interview' && (
            <Tooltip title="Tuyen dung">
              <Button
                size="small"
                type="primary"
                icon={<TrophyOutlined />}
                loading={isHiring}
                onClick={() => handleHire(rec)}
              >
                Tuyen dung
              </Button>
            </Tooltip>
          )}

          {!['hired', 'rejected'].includes(rec.stage) && (
            <Tooltip title="Tu choi">
              <Button
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => { setSelectedApp(rec); setRejectModal(true) }}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: '24px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#0F172A' }}>Quan ly Tuyen dung</h1>
          <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: 14 }}>
            He thong Theo doi Ung vien (ATS) — {applications.length} ho so
          </p>
        </div>
        <Space>
          <Button
            icon={<CopyOutlined />}
            onClick={handleCopyLink}
          >
            Sao chep Link Ung tuyen
          </Button>
          <Button
            type="primary"
            icon={<MailOutlined />}
            onClick={() => setInviteModal(true)}
          >
            Gui Loi moi Ung tuyen
          </Button>
        </Space>
      </div>

      {/* Stage Filter */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button
          type={!filterStage ? 'primary' : 'default'}
          onClick={() => setFilterStage(null)}
          size="small"
        >
          Tat ca ({applications.length})
        </Button>
        {STAGES.filter(s => s.key !== 'sourcing').map(s => (
          <Button
            key={s.key}
            type={filterStage === s.key ? 'primary' : 'default'}
            onClick={() => setFilterStage(s.key === filterStage ? null : s.key)}
            size="small"
          >
            {s.label} ({applications.filter(a => a.stage === s.key).length})
          </Button>
        ))}
      </div>

      {/* Main Table */}
      <Table
        dataSource={applications}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 10, showTotal: (t) => `${t} ho so` }}
        size="middle"
        style={{ background: '#fff', borderRadius: 12 }}
      />

      {/* Detail Drawer */}
      <Drawer
        title={`Ho so: ${selectedApp?.candidate_name}`}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        width={600}
        extra={selectedApp && (
          <Tag color={STAGES.find(s => s.key === selectedApp.stage)?.color}>
            {STAGES.find(s => s.key === selectedApp.stage)?.label}
          </Tag>
        )}
      >
        {selectedApp && (
          <>
            <Steps
              current={stageStep(selectedApp.stage)}
              items={[
                { title: 'Nop don' },
                { title: 'Xem xet' },
                { title: 'Phong van' },
                { title: selectedApp.stage === 'rejected' ? 'Tu choi' : 'Tuyen dung' },
              ]}
              size="small"
              style={{ marginBottom: 24 }}
              status={selectedApp.stage === 'rejected' ? 'error' : undefined}
            />
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Email">{selectedApp.candidate_email}</Descriptions.Item>
              <Descriptions.Item label="Dien thoai">{selectedApp.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="Vi tri">{selectedApp.position_applied}</Descriptions.Item>
              <Descriptions.Item label="Kinh nghiem">{selectedApp.years_of_experience} nam</Descriptions.Item>
              <Descriptions.Item label="Hoc van">{selectedApp.education_summary || '-'}</Descriptions.Item>
              <Descriptions.Item label="Lich su Cong viec">{selectedApp.work_history || '-'}</Descriptions.Item>
              <Descriptions.Item label="Luong mong muon">
                {selectedApp.expected_salary ? `${selectedApp.expected_salary.toLocaleString('vi-VN')} VND` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="CV">
                {selectedApp.cv_url
                  ? <a href={selectedApp.cv_url} target="_blank" rel="noreferrer">Tai xuong CV</a>
                  : 'Chua co'}
              </Descriptions.Item>
              {selectedApp.interview_time && (
                <Descriptions.Item label="Gio Phong van">
                  {dayjs(selectedApp.interview_time).format('DD/MM/YYYY HH:mm')}
                </Descriptions.Item>
              )}
              {selectedApp.rejection_reason && (
                <Descriptions.Item label="Ly do Tu choi">{selectedApp.rejection_reason}</Descriptions.Item>
              )}
            </Descriptions>
          </>
        )}
      </Drawer>

      {/* Interview Scheduling Modal */}
      <Modal
        title="Dat lich Phong van"
        open={interviewModal}
        onCancel={() => setInterviewModal(false)}
        footer={null}
      >
        <Form form={interviewForm} layout="vertical" onFinish={handleScheduleInterview}>
          <Form.Item
            name="interview_time"
            label="Thoi gian Phong van"
            rules={[{ required: true, message: 'Chon thoi gian phong van' }]}
          >
            <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="interviewer_id"
            label="Nguoi phong van"
            rules={[{ required: true, message: 'Chon nguoi phong van' }]}
          >
            <Select
              placeholder="Chon nhan vien phu trach"
              showSearch
              optionFilterProp="label"
              options={allProfiles.map(p => ({
                value: p.id,
                label: `${p.full_name} — ${p.departments?.name || ''}`,
              }))}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isScheduling} block>
              Dat lich va Gui Email Thong bao
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Rejection Modal */}
      <Modal
        title="Tu choi Ung vien"
        open={rejectModal}
        onCancel={() => setRejectModal(false)}
        footer={null}
      >
        <Form form={rejectForm} layout="vertical" onFinish={handleReject}>
          <Form.Item name="reason" label="Ly do Tu choi" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="Kinh nghiem chua phu hop, khong dap ung yeu cau..." />
          </Form.Item>
          <Button danger htmlType="submit" block loading={isUpdating}>
            Xac nhan Tu choi
          </Button>
        </Form>
      </Modal>

      {/* Invite Modal */}
      <Modal
        title="Gui Loi moi Ung tuyen"
        open={inviteModal}
        onCancel={() => { setInviteModal(false); inviteForm.resetFields() }}
        footer={null}
        width={480}
      >
        <div style={{ marginBottom: 20 }}>
          <p style={{ margin: 0, color: '#64748B', fontSize: 14 }}>
            He thong se gui mot email chua link ung tuyen cong khai den ung vien. Ung vien nhan vao link se duoc dua thang den trang nop ho so.
          </p>
          <div style={{
            marginTop: 12,
            padding: '10px 14px',
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}>
            <span style={{ fontSize: 13, color: '#475569', wordBreak: 'break-all' }}>
              {window.location.origin}/apply
            </span>
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={handleCopyLink}
              type="text"
            />
          </div>
        </div>
        <Form form={inviteForm} layout="vertical" onFinish={handleSendInvite}>
          <Form.Item
            name="email"
            label="Email Ung vien"
            rules={[
              { required: true, message: 'Vui long nhap email ung vien' },
              { type: 'email', message: 'Email khong hop le' },
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: '#94A3B8' }} />}
              placeholder="candidate@email.com"
              size="large"
            />
          </Form.Item>
          <Form.Item name="position" label="Vi tri Ung tuyen (tuy chon)">
            <Input placeholder="Frontend Developer, HR Manager..." />
          </Form.Item>
          <Form.Item name="note" label="Ghi chu them (tuy chon)">
            <TextArea
              rows={3}
              placeholder="Xin chao, chung toi muon moi ban ung tuyen vi tri..."
            />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={inviteSending}
            block
            size="large"
            icon={<MailOutlined />}
          >
            Gui Loi moi
          </Button>
        </Form>
      </Modal>
    </div>
  )
}
