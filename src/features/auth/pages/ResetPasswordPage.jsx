import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Alert, Spin } from 'antd'
import { LockOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { supabase, updatePassword, isSupabaseConfigured } from '@/lib/supabaseClient'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(true)
  const [sessionValid, setSessionValid] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  // Check if user arrived via a valid Magic Link (RECOVERY event)
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSessionValid(true)
      setVerifying(false)
      return
    }

    // Listen for the RECOVERY event from the Magic Link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionValid(true)
      }
      setVerifying(false)
    })

    // Also check if session already exists from redirect
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSessionValid(true)
        setVerifying(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSubmit = async ({ password }) => {
    setLoading(true)
    setError(null)

    try {
      if (isSupabaseConfigured) {
        await updatePassword(password)
      }
      setSuccess(true)

      // Auto-redirect to dashboard after 2 seconds
      setTimeout(() => navigate('/dashboard'), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (verifying) {
    return (
      <div style={{ ...pageStyle }}>
        <Spin size="large" tip="Dang xac thuc lien ket..." />
      </div>
    )
  }

  if (!sessionValid) {
    return (
      <div style={pageStyle}>
        <div style={cardStyle}>
          <Alert
            type="error"
            showIcon
            message="Lien ket khong hop le hoac da het han"
            description="Vui long thu gui lai yeu cau dat lai mat khau."
            style={{ borderRadius: 12 }}
          />
          <Button
            type="primary"
            block
            onClick={() => navigate('/forgot-password')}
            style={{ marginTop: 20, height: 44, borderRadius: 8, fontWeight: 700 }}
          >
            Thu Lai
          </Button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div style={pageStyle}>
        <div style={{ ...cardStyle, textAlign: 'center' }}>
          <CheckCircleOutlined style={{ fontSize: 52, color: '#16A34A', marginBottom: 16 }} />
          <h2 style={{ margin: 0, fontWeight: 800, color: '#0F172A' }}>Mat khau Da Duoc Cap nhat</h2>
          <p style={{ color: '#64748B', marginTop: 8 }}>
            Dang chuyen den Dashboard...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 52,
            height: 52,
            background: 'var(--color-primary)',
            borderRadius: 14,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 14,
          }}>
            <LockOutlined style={{ color: '#fff', fontSize: 24 }} />
          </div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#0F172A' }}>
            Dat lai Mat khau
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: '#64748B' }}>
            Nhap mat khau moi (khong can mat khau cu)
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
            name="password"
            label="Mat khau moi"
            rules={[
              { required: true, message: 'Vui long nhap mat khau moi' },
              { min: 8, message: 'Mat khau toi thieu 8 ky tu' },
            ]}
            hasFeedback
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: 'var(--color-primary)' }} />}
              placeholder="Toi thieu 8 ky tu"
            />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="Xac nhan Mat khau moi"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Vui long xac nhan mat khau' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('Mat khau xac nhan khong khop'))
                },
              }),
            ]}
            hasFeedback
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: 'var(--color-primary)' }} />}
              placeholder="Nhap lai mat khau"
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
              Cap nhat Mat khau
            </Button>
          </Form.Item>
        </Form>
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
