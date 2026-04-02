import { useState } from 'react'
import {
  Tag, Button, Space, Modal, Form, Input, DatePicker,
  Select, Steps, Tooltip, Descriptions, Typography, message, Drawer, Empty
} from 'antd'
import {
  EyeOutlined, CheckOutlined, CloseOutlined, CalendarOutlined,
  UserOutlined, FileTextOutlined, TrophyOutlined, CopyOutlined, MailOutlined,
  PhoneOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useApplications, useUpdateApplicationStage, useScheduleInterview, useHireApplicant } from '../hooks/useRecruitment'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useEmployees } from '@/features/employees/hooks/useEmployees'
import { supabase } from '@/lib/supabaseClient'
import LoadingState from '@/components/common/LoadingState'

const { Text } = Typography
const { TextArea } = Input

// Pipeline stage configuration
const STAGES = [
  { key: 'sourcing',  label: 'Tìm nguồn', color: 'default',   step: 0 },
  { key: 'applied',   label: 'Đã nộp',    color: 'blue',     step: 1 },
  { key: 'review',    label: 'Xem xét',   color: 'gold',     step: 2 },
  { key: 'interview', label: 'Phỏng vấn', color: 'purple',   step: 3 },
  { key: 'hired',     label: 'Tuyển dụng',color: 'success',  step: 4 },
  { key: 'rejected',  label: 'Từ chối',   color: 'error',    step: 4 },
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
      message.success(`Chuyển sang giai đoạn: ${STAGES.find(s => s.key === nextStage)?.label}`)
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
        interview_location: values.interview_location || 'Không xác định',
      })

      // Goii Edge function send-interview de gui mail lich phong van toi ung vien
      await supabase.functions.invoke('send-interview', {
        body: {
          email: selectedApp.candidate_email,
          name: selectedApp.candidate_name,
          position: selectedApp.position_applied,
          time: values.interview_time.toISOString(),
          location: values.interview_location || 'Không xác định',
        }
      })

      message.success('Đã đặt lịch phỏng vấn. Email thông báo sẽ được gửi đến ứng viên.')
      setInterviewModal(false)
      interviewForm.resetFields()
    } catch (err) {
      message.error(err.message)
    }
  }

  const handleReject = async (values) => {
    try {
      await updateStage({ id: selectedApp.id, stage: 'rejected', rejection_reason: values.reason })
      message.success('Đã từ chối ứng viên.')
      setRejectModal(false)
      rejectForm.resetFields()
    } catch (err) {
      message.error(err.message)
    }
  }

  const handleHire = async (app) => {
    Modal.confirm({
      title: 'Xác nhận Tuyển dụng',
      content: `Tuyển ${app.candidate_name}? Hệ thống sẽ tự động tạo hồ sơ nhân viên và gửi email vào ${app.candidate_email} kèm mật khẩu đăng nhập.`,
      okText: 'Tuyển dụng',
      okType: 'primary',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const result = await hireApplicant({ applicationId: app.id, hiredById: profile.id })
          
          await supabase.functions.invoke('send-hired', {
            body: {
              email: app.candidate_email,
              name: app.candidate_name,
              password: result.default_password,
              position: app.position_applied
            }
          })
          
          message.success(`Đã tuyển ${app.candidate_name}. Email thông báo đã được gửi tới ${app.candidate_email}.`)
        } catch (err) {
          message.error('Lỗi tuyển dụng: ' + err.message)
        }
      },
    })
  }

  const handleCopyLink = () => {
    const link = `${window.location.origin}/apply`
    navigator.clipboard.writeText(link)
      .then(() => message.success('Đã sao chép link ứng tuyển vào bộ nhớ đệm!'))
      .catch(() => message.error('Không thể sao chép. Vui lòng sao chép thủ công: ' + link))
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

      message.success(`Đã gửi lời mời ứng tuyển đến ${values.email} thành công!`)
      setInviteModal(false)
      inviteForm.resetFields()
    } catch (err) {
      message.error('Gửi lời mời thất bại: ' + err.message)
    } finally {
      setInviteSending(false)
    }
  }

  const openDetail = (app) => {
    setSelectedApp(app)
    setDetailOpen(true)
  }

  return (
    <div style={{ padding: '24px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#0F172A', fontFamily: 'var(--font-title)' }}>Quản lý Tuyển dụng</h1>
          <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: 14 }}>
            Hệ thống Theo dõi Ứng viên (ATS) — {applications.length} hồ sơ
          </p>
        </div>
        <Space>
          <Button
            icon={<CopyOutlined />}
            onClick={handleCopyLink}
          >
            Sao chép Link Ứng tuyển
          </Button>
          <Button
            type="primary"
            icon={<MailOutlined />}
            onClick={() => setInviteModal(true)}
          >
            Gửi Lời mời Ứng tuyển
          </Button>
        </Space>
      </div>

      {/* Stage Filter */}
      <div style={{ marginBottom: 24, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <Button
          type={!filterStage ? 'primary' : 'default'}
          onClick={() => setFilterStage(null)}
          size="small"
        >
          Tất cả ({applications.length})
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

      {/* Main List View */}
      {isLoading ? (
        <LoadingState mode="list" />
      ) : applications.length === 0 ? (
        <div style={{ background: '#fff', padding: 48, borderRadius: 12, textAlign: 'center' }}>
          <Empty description={`Không có hồ sơ nào${filterStage ? ' trong giai đoạn này' : ''}.`} />
        </div>
      ) : (
        <div
          className="stagger-children" 
          style={{ 
            display: 'flex', flexDirection: 'column', gap: 8
          }}
        >
          {/* List header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            padding: '6px 20px',
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--color-text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.6px',
          }}>
            <div style={{ flex: '0 0 44px' }} />
            <div style={{ flex: '0 0 220px' }}>Ứng viên</div>
            <div style={{ flex: '0 0 240px' }}>Vị trí ứng tuyển</div>
            <div style={{ flex: '0 0 160px' }}>Liên hệ</div>
            <div style={{ flex: '0 0 140px' }}>Giai đoạn</div>
            <div style={{ marginLeft: 'auto', paddingRight: 12 }}>Hành động</div>
          </div>

          {applications.map(app => {
            const currentStage = STAGES.find(s => s.key === app.stage)

            return (
              <div
                key={app.id}
                className="employee-list-item"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '12px 20px',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 10,
                  textDecoration: 'none',
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 44, height: 44,
                  borderRadius: '50%',
                  background: 'var(--color-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, color: '#64748B', flexShrink: 0,
                  border: '1px solid var(--color-border)'
                }}>
                  <UserOutlined />
                </div>

                {/* Main info */}
                <div style={{ minWidth: 0, flex: '0 0 220px' }}>
                  <div style={{
                    fontSize: 14, fontWeight: 700,
                    color: 'var(--color-text-primary)',
                    lineHeight: 1.3,
                    marginBottom: 2,
                    cursor: 'pointer'
                  }} onClick={() => openDetail(app)}>
                    {app.candidate_name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    Ngày nộp: {dayjs(app.created_at).format('DD/MM/YYYY')}
                  </div>
                </div>

                {/* Position */}
                <div style={{ flex: '0 0 240px', minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 2 }}>
                    {app.position_applied}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    {app.departments?.name || '—'}
                  </div>
                </div>

                {/* Contact */}
                <div style={{ flex: '0 0 160px', minWidth: 0 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 3,
                  }}>
                    <MailOutlined style={{ fontSize: 11, color: 'var(--color-text-muted)' }} />
                    <span className="text-truncate" title={app.candidate_email}>{app.candidate_email}</span>
                  </div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    fontSize: 12, color: 'var(--color-text-secondary)',
                    opacity: app.phone ? 1 : 0
                  }}>
                    <PhoneOutlined style={{ fontSize: 11, color: 'var(--color-text-muted)' }} />
                    <span>{app.phone || '-'}</span>
                  </div>
                </div>

                {/* Status */}
                <div style={{ flex: '0 0 140px' }}>
                  <Tag color={currentStage?.color} style={{ margin: 0, fontWeight: 600 }}>
                    {currentStage?.label}
                  </Tag>
                </div>

                {/* Actions */}
                <div style={{ marginLeft: 'auto', flexShrink: 0, display: 'flex', gap: 8 }}>
                  <Tooltip title="Xem chi tiết">
                    <Button size="small" type="text" icon={<EyeOutlined />} onClick={() => openDetail(app)} />
                  </Tooltip>
                  {app.stage === 'applied' && (
                    <Tooltip title="Chuyển sang Xem xét">
                      <Button size="small" type="text" style={{ color: '#F59E0B' }} icon={<CheckOutlined />} onClick={() => handleAdvanceStage(app, 'review')} />
                    </Tooltip>
                  )}
                  {app.stage === 'review' && (
                    <Tooltip title="Đặt lịch Phỏng vấn">
                      <Button size="small" type="text" style={{ color: '#8B5CF6' }} icon={<CalendarOutlined />} onClick={() => { setSelectedApp(app); setInterviewModal(true) }} />
                    </Tooltip>
                  )}
                  {app.stage === 'interview' && (
                    <Tooltip title="Tuyển dụng">
                      <Button size="small" type="text" style={{ color: '#10B981' }} icon={<TrophyOutlined />} loading={isHiring} onClick={() => handleHire(app)} />
                    </Tooltip>
                  )}
                  {!['hired', 'rejected'].includes(app.stage) && (
                    <Tooltip title="Từ chối">
                      <Button size="small" type="text" danger icon={<CloseOutlined />} onClick={() => { setSelectedApp(app); setRejectModal(true) }} />
                    </Tooltip>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Detail Drawer */}
      <Drawer
        title={`Hồ sơ: ${selectedApp?.candidate_name}`}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        width={600}
        extra={selectedApp && (
          <Tag color={STAGES.find(s => s.key === selectedApp.stage)?.color} style={{ fontWeight: 700 }}>
            {STAGES.find(s => s.key === selectedApp.stage)?.label}
          </Tag>
        )}
      >
        {selectedApp && (
          <>
            <Steps
              current={stageStep(selectedApp.stage)}
              items={[
                { title: 'Nộp đơn' },
                { title: 'Xem xét' },
                { title: 'Phỏng vấn' },
                { title: selectedApp.stage === 'rejected' ? 'Từ chối' : 'Tuyển dụng' },
              ]}
              size="small"
              style={{ marginBottom: 24 }}
              status={selectedApp.stage === 'rejected' ? 'error' : undefined}
            />
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Email">{selectedApp.candidate_email}</Descriptions.Item>
              <Descriptions.Item label="Điện thoại">{selectedApp.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="Vị trí">{selectedApp.position_applied}</Descriptions.Item>
              <Descriptions.Item label="Kinh nghiệp">{selectedApp.years_of_experience} năm</Descriptions.Item>
              <Descriptions.Item label="Học vấn">{selectedApp.education_summary || '-'}</Descriptions.Item>
              <Descriptions.Item label="Lịch sử Công việc">{selectedApp.work_history || '-'}</Descriptions.Item>
              <Descriptions.Item label="Lương mong muốn">
                {selectedApp.expected_salary ? `${selectedApp.expected_salary.toLocaleString('vi-VN')} VND` : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="CV">
                {selectedApp.cv_url
                  ? <a href={selectedApp.cv_url} target="_blank" rel="noreferrer">Tải xuống CV</a>
                  : 'Chưa có'}
              </Descriptions.Item>
              {selectedApp.interview_time && (
                <>
                  <Descriptions.Item label="Giờ Phỏng vấn">
                    {dayjs(selectedApp.interview_time).format('DD/MM/YYYY HH:mm')}
                  </Descriptions.Item>
                  <Descriptions.Item label="Địa điểm Phỏng vấn">
                    {selectedApp.interview_location || 'Không rõ'}
                  </Descriptions.Item>
                </>
              )}
              {selectedApp.rejection_reason && (
                <Descriptions.Item label="Lý do Từ chối">{selectedApp.rejection_reason}</Descriptions.Item>
              )}
            </Descriptions>
          </>
        )}
      </Drawer>

      {/* Interview Scheduling Modal */}
      <Modal
        title="Đặt lịch Phỏng vấn"
        open={interviewModal}
        onCancel={() => setInterviewModal(false)}
        footer={null}
      >
        <Form form={interviewForm} layout="vertical" onFinish={handleScheduleInterview} initialValues={{ interview_location: 'Văn phòng công ty (Tầng 12)' }}>
          <Form.Item
            name="interview_time"
            label="Thời gian Phỏng vấn"
            rules={[{ required: true, message: 'Chọn thời gian phỏng vấn' }]}
          >
            <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item
            name="interviewer_id"
            label="Người phỏng vấn"
            rules={[{ required: true, message: 'Chọn người phỏng vấn' }]}
          >
            <Select
              placeholder="Chọn nhân viên phụ trách"
              showSearch
              optionFilterProp="label"
              options={allProfiles.map(p => ({
                value: p.id,
                label: `${p.full_name} — ${p.departments?.name || ''}`,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="interview_location"
            label="Địa điểm Phỏng vấn"
            rules={[{ required: true, message: 'Nhập địa điểm phỏng vấn' }]}
          >
            <Input placeholder="Vd: Google Meet hoặc Tầng 3 Tòa nhà X" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={isScheduling} block>
              Đặt lịch và Gửi Email Thông báo
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Rejection Modal */}
      <Modal
        title="Từ chối Ứng viên"
        open={rejectModal}
        onCancel={() => setRejectModal(false)}
        footer={null}
      >
        <Form form={rejectForm} layout="vertical" onFinish={handleReject}>
          <Form.Item name="reason" label="Lý do Từ chối" rules={[{ required: true }]}>
            <TextArea rows={3} placeholder="Kinh nghiệm chưa phù hợp, không đáp ứng yêu cầu..." />
          </Form.Item>
          <Button danger htmlType="submit" block loading={isUpdating}>
            Xác nhận Từ chối
          </Button>
        </Form>
      </Modal>

      {/* Invite Modal */}
      <Modal
        title="Gửi Lời mời Ứng tuyển"
        open={inviteModal}
        onCancel={() => { setInviteModal(false); inviteForm.resetFields() }}
        footer={null}
        width={480}
      >
        <div style={{ marginBottom: 20 }}>
          <p style={{ margin: 0, color: '#64748B', fontSize: 14 }}>
            Hệ thống sẽ gửi một email chứa link ứng tuyển công khai đến ứng viên. Ứng viên nhấn vào link sẽ được đưa thẳng đến trang nộp hồ sơ.
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
            label="Email Ứng viên"
            rules={[
              { required: true, message: 'Vui lòng nhập email ứng viên' },
              { type: 'email', message: 'Email không hợp lệ' },
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: '#94A3B8' }} />}
              placeholder="candidate@email.com"
              size="large"
            />
          </Form.Item>
          <Form.Item name="position" label="Vị trí Ứng tuyển (tùy chọn)">
            <Input placeholder="Frontend Developer, HR Manager..." />
          </Form.Item>
          <Form.Item name="note" label="Ghi chú thêm (tùy chọn)">
            <TextArea
              rows={3}
              placeholder="Xin chào, chúng tôi muốn mời bạn ứng tuyển vị trí..."
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
            Gửi Lời mời
          </Button>
        </Form>
      </Modal>
    </div>
  )
}
