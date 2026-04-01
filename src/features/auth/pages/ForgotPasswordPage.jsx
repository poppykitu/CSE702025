import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Form, Input, Button, Alert, Result } from 'antd'
import { MailOutlined } from '@ant-design/icons'
import { requestPasswordReset, isSupabaseConfigured } from '@/lib/supabaseClient'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async ({ email }) => {
    if (!isSupabaseConfigured) {
      setSent(true)
      return
    }

    setLoading(true)
    setError(null)
    try {
      await requestPasswordReset(email)
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <Result
            status="success"
            title="Email Khoi phuc Da Gui"
            subTitle="Vui long kiem tra hop thu den. Nhan vao link trong email de dat lai mat khau. Link co hieu luc trong 60 phut."
            extra={[
              <Button key="login" type="primary" onClick={() => navigate('/login')}>
                Quay lai Dang nhap
              </Button>,
            ]}
          />
        </div>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0F172A' }}>
            Quen Mat khau
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: '#64748B' }}>
            Nhap email de nhan link dat lai mat khau
          </p>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            style={{ marginBottom: 20, borderRadius: 8 }}
          />
        )}

        <Form layout="vertical" onFinish={handleSubmit} size="large">
          <Form.Item
            name="email"
            label="Dia chi Email"
            rules={[
              { required: true, message: 'Vui long nhap email' },
              { type: 'email', message: 'Email khong hop le' },
            ]}
          >
            <Input
              prefix={<MailOutlined style={{ color: 'var(--color-primary)' }} />}
              placeholder="email@congty.vn"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              style={{ height: 44, borderRadius: 8, fontWeight: 700 }}
            >
              Gui Link Khoi phuc
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', fontSize: 13, color: '#64748B' }}>
          Da nho ra mat khau?{' '}
          <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            Dang nhap
          </Link>
        </div>
      </div>
    </div>
  )
}

const pageStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#F8FAFC',
  padding: 24,
}

const cardStyle = {
  width: '100%',
  maxWidth: 440,
  background: '#fff',
  borderRadius: 20,
  boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
  border: '1px solid #E2E8F0',
  padding: '40px 36px',
}
