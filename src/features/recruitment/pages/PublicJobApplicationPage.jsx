import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Form, Input, InputNumber, Button, Select, DatePicker, Upload, message, Result, Steps, Spin } from 'antd'
import { UploadOutlined, CheckCircleOutlined, WarningOutlined } from '@ant-design/icons'
import { supabase } from '@/lib/supabaseClient'
import { useSubmitApplication } from '../hooks/useRecruitment'

const { TextArea } = Input

const PIPELINE_STEPS = [
  { title: 'Nộp Hồ sơ' },
  { title: 'Xem xét' },
  { title: 'Phỏng vấn' },
  { title: 'Kết quả' },
]

export default function PublicJobApplicationPage() {
  const [form] = Form.useForm()
  const [cvFile, setCvFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  
  const [searchParams] = useSearchParams()
  const planCode = searchParams.get('plan')
  
  const [planData, setPlanData] = useState(null)
  const [planStatus, setPlanStatus] = useState(planCode ? 'loading' : 'open') // loading | active | closed | not_found
  
  const { mutateAsync: submitApplication, isPending } = useSubmitApplication()

  // Fetch Plan Detail
  useEffect(() => {
    if (!planCode) return
    
    async function fetchPlan() {
      try {
        const { data, error } = await supabase
          .from('recruitment_plans')
          .select('*')
          .eq('code', planCode)
          .single()

        if (error || !data) {
          setPlanStatus('not_found')
          return
        }

        if (data.status === 'closed') {
          setPlanStatus('closed')
          return
        }

        setPlanData(data)
        setPlanStatus('active')
        form.setFieldsValue({ position: data.position_title })
      } catch (err) {
        setPlanStatus('not_found')
      }
    }
    fetchPlan()
  }, [planCode, form])

  const handleCvUpload = async (file) => {
    setCvFile(file)
    return false // prevent auto-upload
  }

  const handleSubmit = async (values) => {
    let cvUrl = null

    // Upload CV to Supabase Storage
    if (cvFile) {
      setUploading(true)
      const fileExt = cvFile.name.split('.').pop()
      const fileName = `${Date.now()}-${values.email.replace('@', '_')}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('candidate_resumes')
        .upload(fileName, cvFile)

      if (uploadError) {
        message.error('Lỗi tải lên CV: ' + uploadError.message)
        setUploading(false)
        return
      }

      const { data: urlData } = supabase.storage.from('candidate_resumes').getPublicUrl(uploadData.path)
      cvUrl = urlData.publicUrl
      setUploading(false)
    }

    try {
      await submitApplication({
        candidate_name: values.fullName,
        candidate_email: values.email,
        phone: values.phone,
        position_applied: planData ? planData.position_title : values.position,
        work_history: values.workHistory,
        years_of_experience: values.experience,
        education_summary: values.education,
        expected_salary: values.expectedSalary,
        available_from: values.availableFrom?.format('YYYY-MM-DD'),
        cover_letter: values.coverLetter,
        cv_url: cvUrl,
        stage: 'applied',
        plan_id: planData ? planData.id : null,
        department_id: planData ? planData.department_id : null
      })
      setSubmitted(true)
    } catch (err) {
      message.error('Gửi đơn thất bại: ' + err.message)
    }
  }

  // --- RENDERING VIEWS ---

  if (planStatus === 'loading') {
    return (
      <div style={pageStyle}>
        <div style={{ ...cardStyle, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 100 }}>
          <Spin size="large" />
          <h3 style={{ marginTop: 24, color: '#64748B' }}>Đang tải thông tin Tuyển dụng...</h3>
        </div>
      </div>
    )
  }

  if (planStatus === 'closed' || planStatus === 'not_found') {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <Result
            icon={<WarningOutlined style={{ color: '#F59E0B' }} />}
            status="warning"
            title={planStatus === 'closed' ? "Đã đủ chỉ tiêu tuyển dụng" : "Không tìm thấy Chiến dịch"}
            subTitle={planStatus === 'closed' 
              ? "Cảm ơn sự quan tâm của bạn. Vị trí này hiện tại đã nhận đủ hồ sơ và tạm thời ngưng tuyển." 
              : "Đường dẫn ứng tuyển không hợp lệ hoặc chiến dịch đã bị xóa khỏi hệ thống."}
            extra={
              <Button type="primary" onClick={() => window.location.href = '/'}>
                Về Trang chủ
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <Steps current={0} items={PIPELINE_STEPS} style={{ marginBottom: 32 }} />
          <Result
            icon={<CheckCircleOutlined style={{ color: '#16A34A' }} />}
            status="success"
            title="Hồ sơ đã Xong"
            subTitle={`Cảm ơn bạn đã ứng tuyển vào vị trí ${planData ? planData.position_title : ''}. Chúng tôi sẽ liên hệ với bạn trong vòng 3-5 ngày làm việc.`}
          />
        </div>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 44, height: 44, background: 'var(--color-primary, #4F46E5)',
              borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 16 }}>PH</span>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0F172A' }}>PeopleHub</h1>
              <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>
                Nộp Đơn Ứng tuyển {planData ? `— Kế hoạch: ${planData.title}` : ''}
              </p>
            </div>
          </div>
          <Steps current={-1} items={PIPELINE_STEPS} size="small" />
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          size="large"
          scrollToFirstError
        >
          {/* Personal Information */}
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#1E293B', borderBottom: '1px solid #F1F5F9', paddingBottom: 8 }}>
            Thông tin Cá nhân
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="fullName" label="Họ và Tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
              <Input placeholder="Nguyễn Văn A" />
            </Form.Item>
            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}>
              <Input placeholder="email@example.com" />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="phone" label="Số Điện thoại" rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}>
              <Input placeholder="0912 345 678" />
            </Form.Item>

            <Form.Item name="position" label="Vị trí Ứng tuyển" rules={[{ required: true, message: 'Vui lòng nhập vị trí ứng tuyển' }]}>
              <Input placeholder="Frontend Developer, HR Manager..." disabled={!!planData} />
            </Form.Item>
          </div>

          {/* Experience & Education */}
          <h3 style={{ margin: '8px 0 16px', fontSize: 15, fontWeight: 700, color: '#1E293B', borderBottom: '1px solid #F1F5F9', paddingBottom: 8 }}>
            Kinh nghiệm & Học vấn
          </h3>

          <Form.Item name="education" label="Trình độ Học vấn">
            <Input placeholder="Cử nhân Công nghệ Thông tin - ĐH Bách Khoa HCM" />
          </Form.Item>
          <Form.Item name="experience" label="Số năm Kinh nghiệm">
            <InputNumber min={0} max={50} style={{ width: '100%' }} placeholder="3" addonAfter="năm" />
          </Form.Item>
          <Form.Item name="workHistory" label="Lịch sử Công việc">
            <TextArea rows={4} placeholder="Mô tả các công ty và vị trí đã làm việc trước đây..." />
          </Form.Item>

          {/* Expectations */}
          <h3 style={{ margin: '8px 0 16px', fontSize: 15, fontWeight: 700, color: '#1E293B', borderBottom: '1px solid #F1F5F9', paddingBottom: 8 }}>
            Mong muốn & Hồ sơ
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="expectedSalary" label="Mức lương Mong muốn (VND)">
              <InputNumber
                min={0} style={{ width: '100%' }}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                placeholder="15,000,000"
              />
            </Form.Item>
            <Form.Item name="availableFrom" label="Có thể Bắt đầu từ">
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </div>

          <Form.Item name="coverLetter" label="Thư xin Việc (Cover Letter)">
            <TextArea rows={4} placeholder="Giới thiệu bản thân và lý do muốn ứng tuyển..." />
          </Form.Item>

          <Form.Item name="cv" label="CV / Hồ sơ (PDF, DOCX)">
            <Upload beforeUpload={handleCvUpload} maxCount={1} accept=".pdf,.doc,.docx">
              <Button icon={<UploadOutlined />}>Chọn file CV</Button>
            </Upload>
          </Form.Item>

          <Form.Item style={{ marginTop: 8 }}>
            <Button
              type="primary" htmlType="submit"
              loading={isPending || uploading} block size="large"
              style={{ height: 48, borderRadius: 10, fontWeight: 700, fontSize: 15 }}
            >
              {uploading ? 'Đang tải lên CV...' : 'Nộp Đơn Ứng tuyển'}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}

const pageStyle = {
  minHeight: '100vh',
  background: '#F8FAFC',
  padding: '32px 24px',
  display: 'flex',
  justifyContent: 'center',
}

const cardStyle = {
  width: '100%',
  maxWidth: 720,
  background: '#fff',
  borderRadius: 20,
  boxShadow: '0 8px 40px rgba(0,0,0,0.07)',
  border: '1px solid #E2E8F0',
  padding: '40px 48px',
  height: 'fit-content',
}
