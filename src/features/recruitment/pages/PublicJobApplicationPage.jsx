import { useState } from 'react'
import { Form, Input, InputNumber, Button, Select, DatePicker, Upload, message, Result, Steps } from 'antd'
import { UploadOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { supabase } from '@/lib/supabaseClient'
import { useSubmitApplication } from '../hooks/useRecruitment'

const { TextArea } = Input

const PIPELINE_STEPS = [
  { title: 'Nop Ho so' },
  { title: 'Xem xet' },
  { title: 'Phong van' },
  { title: 'Ket qua' },
]

export default function PublicJobApplicationPage() {
  const [form] = Form.useForm()
  const [cvFile, setCvFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { mutateAsync: submitApplication, isPending } = useSubmitApplication()

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
        message.error('Loi tai len CV: ' + uploadError.message)
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
        position_applied: values.position,
        work_history: values.workHistory,
        years_of_experience: values.experience,
        education_summary: values.education,
        expected_salary: values.expectedSalary,
        available_from: values.availableFrom?.format('YYYY-MM-DD'),
        cover_letter: values.coverLetter,
        cv_url: cvUrl,
        stage: 'applied',
      })
      setSubmitted(true)
    } catch (err) {
      message.error('Gui don that bai: ' + err.message)
    }
  }

  if (submitted) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <Steps current={0} items={PIPELINE_STEPS} style={{ marginBottom: 32 }} />
          <Result
            icon={<CheckCircleOutlined style={{ color: '#16A34A' }} />}
            status="success"
            title="Ho so Da Nop Thanh Cong"
            subTitle={`Cam on ban da ung tuyen. Chung toi se lien he voi ban qua email trong 3-5 ngay lam viec.`}
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
              width: 44,
              height: 44,
              background: 'var(--color-primary, #4F46E5)',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span style={{ color: '#fff', fontWeight: 900, fontSize: 16 }}>PH</span>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0F172A' }}>PeopleHub</h1>
              <p style={{ margin: 0, fontSize: 13, color: '#64748B' }}>Nop Don Ung tuyen</p>
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
            Thong tin Ca nhan
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item
              name="fullName"
              label="Ho va Ten"
              rules={[{ required: true, message: 'Vui long nhap ho ten' }]}
            >
              <Input placeholder="Nguyen Van A" />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[{ required: true, type: 'email', message: 'Email khong hop le' }]}
            >
              <Input placeholder="email@example.com" />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item
              name="phone"
              label="So Dien thoai"
              rules={[{ required: true, message: 'Vui long nhap so dien thoai' }]}
            >
              <Input placeholder="0912 345 678" />
            </Form.Item>

            <Form.Item
              name="position"
              label="Vi tri Ung tuyen"
              rules={[{ required: true, message: 'Vui long nhap vi tri ung tuyen' }]}
            >
              <Input placeholder="Frontend Developer, HR Manager..." />
            </Form.Item>
          </div>

          {/* Experience & Education */}
          <h3 style={{ margin: '8px 0 16px', fontSize: 15, fontWeight: 700, color: '#1E293B', borderBottom: '1px solid #F1F5F9', paddingBottom: 8 }}>
            Kinh nghiem & Hoc van
          </h3>

          <Form.Item name="education" label="Trinh do Hoc van">
            <Input placeholder="Cu nhan Cong nghe Thong tin - DH Bach Khoa HCM" />
          </Form.Item>

          <Form.Item name="experience" label="So nam Kinh nghiem">
            <InputNumber min={0} max={50} style={{ width: '100%' }} placeholder="3" addonAfter="nam" />
          </Form.Item>

          <Form.Item name="workHistory" label="Lich su Cong viec">
            <TextArea
              rows={4}
              placeholder="Mo ta cac cong ty va vi tri da lam viec truoc day..."
            />
          </Form.Item>

          {/* Expectations */}
          <h3 style={{ margin: '8px 0 16px', fontSize: 15, fontWeight: 700, color: '#1E293B', borderBottom: '1px solid #F1F5F9', paddingBottom: 8 }}>
            Mong muon & Ho so
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Form.Item name="expectedSalary" label="Muc luong Mong muon (VND)">
              <InputNumber
                min={0}
                style={{ width: '100%' }}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                placeholder="15,000,000"
              />
            </Form.Item>

            <Form.Item name="availableFrom" label="Co the Bat dau tu">
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </div>

          <Form.Item name="coverLetter" label="Thu xin Viec (Cover Letter)">
            <TextArea rows={4} placeholder="Gioi thieu ban than va ly do muon ung tuyen..." />
          </Form.Item>

          <Form.Item name="cv" label="CV / Ho so (PDF, DOCX)">
            <Upload
              beforeUpload={handleCvUpload}
              maxCount={1}
              accept=".pdf,.doc,.docx"
            >
              <Button icon={<UploadOutlined />}>Chon file CV</Button>
            </Upload>
          </Form.Item>

          <Form.Item style={{ marginTop: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={isPending || uploading}
              block
              size="large"
              style={{ height: 48, borderRadius: 10, fontWeight: 700, fontSize: 15 }}
            >
              {uploading ? 'Dang tai len CV...' : 'Nop Don Ung tuyen'}
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
