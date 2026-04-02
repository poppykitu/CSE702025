import { useState, useMemo } from 'react'
import {
  Tabs, Tag, Button, Space, Modal, Form, Input, DatePicker, InputNumber,
  Select, Steps, Tooltip, Descriptions, Typography, message, Drawer, Empty, Progress
} from 'antd'
import {
  EyeOutlined, CheckOutlined, CloseOutlined, CalendarOutlined,
  UserOutlined, TrophyOutlined, CopyOutlined, MailOutlined,
  PhoneOutlined, PlusOutlined, AppstoreAddOutlined, DeleteOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { 
  useApplications, useUpdateApplicationStage, useScheduleInterview, 
  useOnboardEmployee, useRecruitmentPlans, useCreatePlan, useUpdatePlanStatus,
  useDeleteApplication
} from '../hooks/useRecruitment'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useEmployees } from '@/features/employees/hooks/useEmployees'
import { useDepartments } from '@/hooks/useDepartments'
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
  const [activeTab, setActiveTab] = useState('plans')
  const [filterPlan, setFilterPlan] = useState(null)

  const handleViewPlanDetails = (planId) => {
    setFilterPlan(planId)
    setActiveTab('applications')
  }

  return (
    <div style={{ padding: '24px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: '#0F172A', fontFamily: 'var(--font-title)' }}>
          Quản lý Tuyển dụng
        </h1>
        <p style={{ margin: '4px 0 0', color: '#64748B', fontSize: 14 }}>
          Hệ thống Theo dõi ứng viên (ATS) và Quản lý Chiến dịch Tuyển dụng
        </p>
      </div>

      <Tabs 
        activeKey={activeTab}
        onChange={setActiveTab}
        size="large"
        items={[
          { key: 'plans', label: 'Kế hoạch Tuyển dụng', children: <PlansTab profile={profile} onViewDetails={handleViewPlanDetails} /> },
          { key: 'applications', label: 'Hồ sơ Ứng viên', children: <ApplicationsTab profile={profile} filterPlan={filterPlan} setFilterPlan={setFilterPlan} /> }
        ]}
      />
    </div>
  )
}

// ========================================================
// TAB 1: KẾ HOẠCH TUYỂN DỤNG (PLANS)
// ========================================================
function PlansTab({ profile, onViewDetails }) {
  const { data: plans, isLoading } = useRecruitmentPlans()
  const { mutateAsync: createPlan, isPending: isCreating } = useCreatePlan()
  const { mutateAsync: updateStatus } = useUpdatePlanStatus()
  const { data: departments = [] } = useDepartments()
  
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()

  const generateCode = (title) => {
    // Generate code rule: first chars + Random number
    // "Frontend Dev" => "FEDEV-3912", "Nhân viên Sales" => "NVS-8121"
    const prefix = title.replace(/[^a-zA-Z0-9\s]/g, '').split(' ').map(w => w[0]?.toUpperCase()).join('').substring(0, 4)
    const random = Math.floor(1000 + Math.random() * 9000)
    return `${prefix || 'REQ'}-${random}`
  }

  const handleCreate = async (values) => {
    try {
      const code = generateCode(values.position_title)
      await createPlan({
        ...values,
        code
      })
      message.success(`Đã tạo chiến dịch tuyển dụng. Mã hệ thống: ${code}`)
      setModalOpen(false)
      form.resetFields()
    } catch(err) {
      message.error(err.message)
    }
  }

  const handleCopyLink = (code) => {
    const link = `${window.location.origin}/apply?plan=${code}`
    navigator.clipboard.writeText(link)
      .then(() => message.success('Đã sao chép link ứng tuyển!'))
  }

  const toggleStatus = async (plan) => {
    const newStatus = plan.status === 'active' ? 'closed' : 'active'
    Modal.confirm({
      title: `Chuyển trạng thái kế hoạch?`,
      content: newStatus === 'closed' 
        ? 'Khi Đóng, ứng viên sẽ KHÔNG THỂ nộp hồ sơ qua đường link hệ thống.'
        : 'Khi Mở lại, đường link nộp hồ sơ sẽ tiếp tục nhận ứng viên.',
      okText: 'Xác nhận',
      onOk: async () => {
        try {
          await updateStatus({ id: plan.id, status: newStatus })
          message.success('Đã cập nhật trạng thái.')
        } catch(err) { message.error(err.message) }
      }
    })
  }

  if (isLoading) return <LoadingState mode="list" />

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          Tạo Kế hoạch mới
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {plans?.map(plan => {
          const hiredCount = plan.applications?.filter(a => a.stage === 'hired').length || 0
          const totalApps = plan.applications?.length || 0
          const progress = Math.min((hiredCount / plan.kpi_count) * 100, 100)
          
          return (
            <div key={plan.id} style={{
              background: '#fff', border: '1px solid var(--color-border)',
              borderRadius: 12, padding: 20, position: 'relative'
            }}>
              <Tag color={plan.status === 'active' ? 'blue' : 'default'} style={{ position: 'absolute', top: 16, right: 16 }}>
                {plan.status === 'active' ? 'Đang tuyển' : 'Đã đóng'}
              </Tag>
              
              <div style={{ fontSize: 13, color: 'var(--color-primary)', fontWeight: 700, marginBottom: 4 }}>
                Mã: {plan.code}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>{plan.title}</div>
              <div style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>
                Vị trí: {plan.position_title} <br/>
                Phòng: {plan.departments?.name || 'Tất cả'}
              </div>

              {/* KPI Progress */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                  <span>Tiến độ Tuyển dụng</span>
                  <span>{hiredCount} / {plan.kpi_count} người</span>
                </div>
                <Progress percent={progress} size="small" status={hiredCount >= plan.kpi_count ? 'success' : 'active'} showInfo={false} />
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Đã nhận {totalApps} đơn ứng tuyển.</div>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Button size="small" type="primary" icon={<CopyOutlined/>} 
                  onClick={() => handleCopyLink(plan.code)}
                  disabled={plan.status === 'closed'}
                >
                  Sao chép Link
                </Button>
                <Button size="small" onClick={() => onViewDetails(plan.id)}>
                   DS Ứng viên
                </Button>
                
                <Tooltip title={plan.status === 'active' ? 'Đóng / Kết thúc chiến dịch' : 'Mở lại chiến dịch'}>
                  <Button size="small" type="text" danger={plan.status === 'active'} style={{ backgroundColor: plan.status === 'active' ? '#EF44441A' : 'rgba(0,0,0,0.04)', borderRadius: 4 }} icon={plan.status === 'active' ? <DeleteOutlined /> : <CheckOutlined />} onClick={() => toggleStatus(plan)} />
                </Tooltip>
              </div>
            </div>
          )
        })}
        {plans?.length === 0 && <Empty description="Chưa có Kế hoạch tuyển dụng nào" style={{ gridColumn: '1 / -1', padding: 40 }} />}
      </div>

      <Modal title="Tạo Kế hoạch Tuyển dụng" open={modalOpen} onCancel={() => setModalOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="title" label="Tên Chiến dịch" rules={[{required:true}]}>
            <Input placeholder="Vd: Tuyển dụng IT Q3/2026" />
          </Form.Item>
          <Form.Item name="position_title" label="Vị trí ứng tuyển" rules={[{required:true}]}>
            <Input placeholder="Vd: Kỹ sư Frontend" />
          </Form.Item>
          <Form.Item name="department_id" label="Phòng ban trực thuộc" rules={[{required:true}]}>
            <Select 
              options={departments.map(d => ({ value: d.id, label: d.name }))}
              placeholder="Chọn phòng ban"
            />
          </Form.Item>
          <Form.Item name="kpi_count" label="Chỉ tiêu số người cần tuyển (KPI)" initialValue={1} rules={[{required:true}]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={isCreating} block size="large">
            Tạo & Sinh Link Tuyển dụng
          </Button>
        </Form>
      </Modal>
    </div>
  )
}

// ========================================================
// TAB 2: HỒ SƠ ỨNG VIÊN (APPLICATIONS)
// ========================================================
function ApplicationsTab({ profile, filterPlan, setFilterPlan }) {
  const [filterStage, setFilterStage] = useState(null)
  
  const [selectedApp, setSelectedApp] = useState(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [interviewModal, setInterviewModal] = useState(false)
  const [rejectModal, setRejectModal] = useState(false)
  
  const [interviewForm] = Form.useForm()
  const [rejectForm] = Form.useForm()

  const { data: allPlans = [] } = useRecruitmentPlans()
  const { data: applications = [], isLoading } = useApplications({ 
    stage: filterStage,
    plan_id: filterPlan
  })
  
  const { data: allProfiles = [] } = useEmployees()
  const { mutateAsync: updateStage, isPending: isUpdating } = useUpdateApplicationStage()
  const { mutateAsync: scheduleInterview, isPending: isScheduling } = useScheduleInterview()
  const { mutateAsync: onboardEmployee, isPending: isOnboarding } = useOnboardEmployee()
  const { mutateAsync: updatePlanStatus } = useUpdatePlanStatus()
  const { mutateAsync: deleteApp } = useDeleteApplication()

  const handleDelete = (app) => {
    Modal.confirm({
      title: 'Xóa hồ sơ ứng viên?',
      content: `Bạn có chắc chắn muốn xóa bản ghi ứng viên ${app.candidate_name}? Hành động này không thể khôi phục.`,
      okText: 'Xóa vĩnh viễn',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await deleteApp(app.id)
          message.success('Đã xóa hồ sơ ứng viên khỏi hệ thống.')
        } catch (err) {
          message.error('Lỗi khi xóa: ' + err.message)
        }
      }
    })
  }

  // Logic: Check KPI and Close Plan if reached
  const checkKPIAndAutoClosePlan = async (planId) => {
    if(!planId) return
    const plan = allPlans.find(p => p.id === planId)
    if(!plan) return
    const hiredCount = plan.applications?.filter(a => a.stage === 'hired').length || 0
    if (hiredCount >= plan.kpi_count && plan.status === 'active') {
      await updatePlanStatus({ id: planId, status: 'closed' })
      message.info(`Kế hoạch ${plan.code} đã đạt đủ KPI ứng viên và tự động Đóng.`)
    }
  }

  // Logic: Re-open if rejected someone when plan was closed
  const checkKPIAndAutoOpenPlan = async (planId) => {
    if(!planId) return
    const plan = allPlans.find(p => p.id === planId)
    if(!plan) return
    const hiredCount = plan.applications?.filter(a => a.stage === 'hired').length || 0
    // If was full, but now somebody rejected -> open again!
    if (hiredCount < plan.kpi_count && plan.status === 'closed') {
      await updatePlanStatus({ id: planId, status: 'active' })
      message.info(`Kế hoạch ${plan.code} đã mở lại do thiếu KPI sau khi đổi trạng thái ứng viên.`)
    }
  }

  const handleAdvanceStage = async (app, nextStage) => {
    try {
      await updateStage({ id: app.id, stage: nextStage })
      message.success(`Chuyển sang giai đoạn: ${STAGES.find(s => s.key === nextStage)?.label}`)
    } catch (err) { message.error(err.message) }
  }

  const handleScheduleInterview = async (values) => {
    try {
      await scheduleInterview({
        id: selectedApp.id,
        interview_time: values.interview_time.toISOString(),
        interviewer_id: values.interviewer_id,
        interview_location: values.interview_location || 'Không xác định',
      })
      await supabase.functions.invoke('send-interview', {
        body: {
          email: selectedApp.candidate_email,
          name: selectedApp.candidate_name,
          position: selectedApp.position_applied,
          time: values.interview_time.toISOString(),
          location: values.interview_location || 'Không xác định',
        }
      })
      message.success('Đã đặt lịch phỏng vấn. Email thông báo cẽ được gửi đến ứng viên.')
      setInterviewModal(false)
      interviewForm.resetFields()
    } catch (err) { message.error(err.message) }
  }

  const handleReject = async (values) => {
    try {
      await updateStage({ id: selectedApp.id, stage: 'rejected', rejection_reason: values.reason })
      await checkKPIAndAutoOpenPlan(selectedApp.plan_id)
      message.success('Đã từ chối ứng viên.')
      setRejectModal(false)
      rejectForm.resetFields()
    } catch (err) { message.error(err.message) }
  }

  const handleHire = async (app) => {
    Modal.confirm({
      title: 'Xác nhận Tuyển dụng',
      content: `Tuyển ${app.candidate_name}? Hệ thống sẽ tự động tạo cấu hình tài khoản và gửi thông tin đăng nhập tự động.`,
      okText: 'Tuyển dụng',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          // Edge function xử lý trọn gói: Auth Account, Profile RPC, Auto Close Plan và email Resend
          await onboardEmployee({ applicationId: app.id, hiredById: profile.id })
          
          // Fallback UI Check KPI locally dể reload plan icon nếu cần
          await checkKPIAndAutoClosePlan(app.plan_id)
          
          message.success(`Đã tuyển dụng ${app.candidate_name} thành công.`)
        } catch (err) { message.error('Lỗi: ' + err.message) }
      },
    })
  }

  const openDetail = (app) => {
    setSelectedApp(app)
    setDetailOpen(true)
  }

  return (
    <div>
      {/* Filter Menu */}
      <div style={{ marginBottom: 24, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <Select
          allowClear
          placeholder="Lọc theo Kế hoạch (Campaign)"
          value={filterPlan}
          onChange={setFilterPlan}
          style={{ width: 280 }}
          options={allPlans.map(p => ({ value: p.id, label: `${p.code} - ${p.title}` }))}
        />
        
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button type={!filterStage ? 'primary' : 'default'} onClick={() => setFilterStage(null)} size="small">
            Tất cả
          </Button>
          {STAGES.filter(s => s.key !== 'sourcing').map(s => (
            <Button
              key={s.key}
              type={filterStage === s.key ? 'primary' : 'default'}
              onClick={() => setFilterStage(s.key === filterStage ? null : s.key)}
              size="small"
            >
              {s.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Main List View */}
      {isLoading ? (
        <LoadingState mode="list" />
      ) : applications.length === 0 ? (
        <div style={{ background: '#fff', padding: 48, borderRadius: 12, textAlign: 'center' }}>
          <Empty description={`Không có hồ sơ nào phù hợp.`} />
        </div>
      ) : (
        <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* List header */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16, padding: '6px 20px',
            fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)',
            textTransform: 'uppercase', letterSpacing: '0.6px',
          }}>
            <div style={{ flex: '0 0 44px' }} />
            <div style={{ flex: '0 0 220px' }}>Ứng viên</div>
            <div style={{ flex: '0 0 240px' }}>Vị trí / Chiến dịch</div>
            <div style={{ flex: '0 0 250px' }}>Liên hệ</div>
            <div style={{ flex: '0 0 140px' }}>Giai đoạn</div>
            <div style={{ marginLeft: 'auto', paddingRight: 12 }}>Hành động</div>
          </div>

          {applications.map(app => {
            const currentStage = STAGES.find(s => s.key === app.stage)
            const actionBtnStyle = (isActive, activeColor) => ({
              color: isActive ? activeColor : undefined,
              backgroundColor: isActive ? `${activeColor}1A` : 'rgba(0,0,0,0.03)', // Mờ 10% nếu active, xám nhẹ nếu disable
              borderRadius: 4,
            })
            
            return (
              <div key={app.id} className="employee-list-item" style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: '12px 20px',
                background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                borderRadius: 10
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', background: 'var(--color-bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, color: '#64748B', flexShrink: 0, border: '1px solid var(--color-border)'
                }}><UserOutlined /></div>

                <div style={{ minWidth: 0, flex: '0 0 220px' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)', cursor: 'pointer', marginBottom: 2}} onClick={() => openDetail(app)}>
                    {app.candidate_name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                    Nộp lúc: {dayjs(app.created_at).format('DD/MM/YYYY')}
                  </div>
                </div>

                <div style={{ flex: '0 0 240px', minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 2 }}>
                    {app.position_applied}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--color-primary)' }}>
                    {app.plan?.code ? `[${app.plan.code}]` : ''} {app.departments?.name || '—'}
                  </div>
                </div>

                <div style={{ flex: '0 0 250px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 3 }}>
                    <MailOutlined style={{ fontSize: 11, color: 'var(--color-text-muted)' }} />
                    <span className="text-truncate" title={app.candidate_email}>{app.candidate_email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--color-text-secondary)', opacity: app.phone ? 1 : 0 }}>
                    <PhoneOutlined style={{ fontSize: 11, color: 'var(--color-text-muted)' }} />
                    <span>{app.phone || '-'}</span>
                  </div>
                </div>

                <div style={{ flex: '0 0 140px' }}>
                  <Tag color={currentStage?.color} style={{ margin: 0, fontWeight: 600 }}>{currentStage?.label}</Tag>
                </div>

                <div style={{ marginLeft: 'auto', flexShrink: 0, display: 'flex', gap: 8 }}>
                  <Tooltip title="Xem chi tiết">
                    <Button size="small" type="text" style={{ backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: 4 }} icon={<EyeOutlined />} onClick={() => openDetail(app)} />
                  </Tooltip>
                  <Tooltip title="Chuyển sang Xem xét">
                    <Button size="small" type="text" disabled={app.stage !== 'applied'} style={actionBtnStyle(app.stage === 'applied', '#F59E0B')} icon={<CheckOutlined />} onClick={() => handleAdvanceStage(app, 'review')} />
                  </Tooltip>
                  <Tooltip title="Đặt lịch Phỏng vấn">
                    <Button size="small" type="text" disabled={app.stage !== 'review'} style={actionBtnStyle(app.stage === 'review', '#8B5CF6')} icon={<CalendarOutlined />} onClick={() => { setSelectedApp(app); setInterviewModal(true) }} />
                  </Tooltip>
                  <Tooltip title="Tuyển dụng">
                    <Button size="small" type="text" disabled={app.stage !== 'interview'} style={actionBtnStyle(app.stage === 'interview', '#10B981')} icon={<TrophyOutlined />} loading={isOnboarding} onClick={() => handleHire(app)} />
                  </Tooltip>
                  <Tooltip title="Từ chối">
                    <Button size="small" type="text" disabled={['hired', 'rejected'].includes(app.stage)} danger={!['hired', 'rejected'].includes(app.stage)} style={actionBtnStyle(!['hired', 'rejected'].includes(app.stage), '#EF4444')} icon={<CloseOutlined />} onClick={() => { setSelectedApp(app); setRejectModal(true) }} />
                  </Tooltip>
                  <Tooltip title="Xoá bản ghi">
                    <Button size="small" type="text" disabled={!['hired', 'rejected'].includes(app.stage)} style={actionBtnStyle(['hired', 'rejected'].includes(app.stage), '#EF4444')} icon={<DeleteOutlined />} onClick={() => handleDelete(app)} />
                  </Tooltip>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* DETAIL DRAWER & MODALS (Reused) */}
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
              items={[{ title: 'Nộp đơn' }, { title: 'Xem xét' }, { title: 'Phỏng vấn' }, { title: selectedApp.stage === 'rejected' ? 'Từ chối' : 'Tuyển dụng' }]}
              size="small" style={{ marginBottom: 24 }} status={selectedApp.stage === 'rejected' ? 'error' : undefined}
            />
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Email">{selectedApp.candidate_email}</Descriptions.Item>
              <Descriptions.Item label="Điện thoại">{selectedApp.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="Chiến dịch">{selectedApp.plan?.code || 'Không có'}</Descriptions.Item>
              <Descriptions.Item label="Vị trí">{selectedApp.position_applied}</Descriptions.Item>
              <Descriptions.Item label="Kinh nghiệp">{selectedApp.years_of_experience} năm</Descriptions.Item>
              <Descriptions.Item label="Học vấn">{selectedApp.education_summary || '-'}</Descriptions.Item>
              <Descriptions.Item label="Lịch sử">{selectedApp.work_history || '-'}</Descriptions.Item>
              {selectedApp.interview_time && (
                <Descriptions.Item label="Phỏng vấn">
                  Lúc {dayjs(selectedApp.interview_time).format('DD/MM/YYYY HH:mm')} tại {selectedApp.interview_location || '—'}
                </Descriptions.Item>
              )}
            </Descriptions>
          </>
        )}
      </Drawer>

      <Modal title="Đặt lịch Phỏng vấn" open={interviewModal} onCancel={() => setInterviewModal(false)} footer={null}>
        <Form form={interviewForm} layout="vertical" onFinish={handleScheduleInterview} initialValues={{ interview_location: 'Văn phòng công ty' }}>
          <Form.Item name="interview_time" label="Thời gian Phỏng vấn" rules={[{ required: true }]}>
            <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="interviewer_id" label="Người phỏng vấn" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" options={allProfiles.map(p => ({ value: p.id, label: `${p.full_name}` }))} />
          </Form.Item>
          <Form.Item name="interview_location" label="Địa điểm" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={isScheduling} block>Đặt lịch & Gửi Thông báo</Button>
        </Form>
      </Modal>

      <Modal title="Từ chối Ứng viên" open={rejectModal} onCancel={() => setRejectModal(false)} footer={null}>
        <Form form={rejectForm} layout="vertical" onFinish={handleReject}>
          <Form.Item name="reason" label="Lý do Từ chối" rules={[{ required: true }]}>
            <TextArea rows={3} />
          </Form.Item>
          <Button danger htmlType="submit" block loading={isUpdating}>Xác nhận Từ chối</Button>
        </Form>
      </Modal>
    </div>
  )
}
