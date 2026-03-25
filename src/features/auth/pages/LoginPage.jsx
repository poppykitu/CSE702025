import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Form, Input, Button, message, Tabs } from 'antd'
import { MailOutlined, LockOutlined, TeamOutlined } from '@ant-design/icons'
import { signInWithEmail, signUpWithEmail, isSupabaseConfigured } from '@/lib/supabaseClient'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [loading, setLoading] = useState(false)

  const from = location.state?.from?.pathname || '/'

  const handleLogin = async (values) => {
    if (!isSupabaseConfigured) {
      message.info('Đang chạy chế độ DEMO. Đăng nhập tự động.')
      navigate(from, { replace: true })
      return
    }

    setLoading(true)
    try {
      await signInWithEmail(values.email, values.password)
      message.success('Đăng nhập thành công!')
      navigate(from, { replace: true })
    } catch (err) {
      message.error('Đăng nhập thất bại: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (values) => {
    if (!isSupabaseConfigured) {
      message.info('Đang chạy chế độ DEMO. Không thể đăng ký.')
      return
    }

    setLoading(true)
    try {
      await signUpWithEmail(values.email, values.password, { full_name: values.fullName })
      message.success('Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.')
    } catch (err) {
      message.error('Đăng ký thất bại: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const tabItems = [
    {
      key: 'login',
      label: 'Đăng nhập',
      children: (
        <Form layout="vertical" onFinish={handleLogin} size="large" style={{ marginTop: 8 }}>
          <Form.Item name="email" rules={[{ required: true, message: 'Vui lòng nhập email' }, { type: 'email', message: 'Email không hợp lệ' }]}>
            <Input prefix={<MailOutlined style={{ color: 'var(--color-text-muted)' }} />} placeholder="Email" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}>
            <Input.Password prefix={<LockOutlined style={{ color: 'var(--color-text-muted)' }} />} placeholder="Mật khẩu" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 44, fontWeight: 600 }}>
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'signup',
      label: 'Đăng ký',
      children: (
        <Form layout="vertical" onFinish={handleSignUp} size="large" style={{ marginTop: 8 }}>
          <Form.Item name="fullName" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
            <Input prefix={<TeamOutlined style={{ color: 'var(--color-text-muted)' }} />} placeholder="Họ và tên" />
          </Form.Item>
          <Form.Item name="email" rules={[{ required: true, message: 'Vui lòng nhập email' }, { type: 'email', message: 'Email không hợp lệ' }]}>
            <Input prefix={<MailOutlined style={{ color: 'var(--color-text-muted)' }} />} placeholder="Email" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, min: 6, message: 'Mật khẩu tối thiểu 6 ký tự' }]}>
            <Input.Password prefix={<LockOutlined style={{ color: 'var(--color-text-muted)' }} />} placeholder="Mật khẩu" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 44, fontWeight: 600 }}>
              Đăng ký tài khoản
            </Button>
          </Form.Item>
        </Form>
      ),
    },
  ]

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
      padding: 24,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: '#fff',
        borderRadius: 16,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        padding: '40px 32px',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 48,
            height: 48,
            background: 'var(--color-primary, #4F46E5)',
            borderRadius: 12,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
          }}>
            <TeamOutlined style={{ color: '#fff', fontSize: 22 }} />
          </div>
          <h1 style={{
            margin: 0,
            fontSize: 24,
            fontWeight: 800,
            fontFamily: 'var(--font-title)',
            color: '#1E293B',
            letterSpacing: '-0.6px',
          }}>
            People<span style={{ color: 'var(--color-primary, #4F46E5)' }}>Hub</span>
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: 14, color: '#64748B' }}>
            Hệ thống quản lý nhân sự thông minh
          </p>
        </div>

        <Tabs items={tabItems} centered />

        {!isSupabaseConfigured && (
          <div style={{
            marginTop: 16,
            padding: '12px 16px',
            background: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: 8,
            fontSize: 12,
            color: '#92400E',
            lineHeight: 1.5,
          }}>
            <strong>CHẾ ĐỘ DEMO:</strong> Ứng dụng đang chạy với dữ liệu mẫu.
            Bấm "Đăng nhập" để vào trực tiếp. Sử dụng Role Switcher trên TopBar để chuyển đổi vai trò.
          </div>
        )}
      </div>
    </div>
  )
}
