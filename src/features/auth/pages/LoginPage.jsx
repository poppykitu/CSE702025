import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Form, Input, Button, message, Tabs } from 'antd'
import { MailOutlined, LockOutlined, TeamOutlined } from '@ant-design/icons'
import { signInWithEmail, signUpWithEmail, isSupabaseConfigured } from '@/lib/supabaseClient'
import GradientWaveBackground from '@/components/common/GradientWaveBackground'

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
            <Input prefix={<MailOutlined style={{ color: 'var(--color-primary)' }} />} placeholder="Email" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu' }]}>
            <Input.Password prefix={<LockOutlined style={{ color: 'var(--color-primary)' }} />} placeholder="Mật khẩu" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 44, borderRadius: 8, fontWeight: 700 }}>
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
            <Input prefix={<TeamOutlined style={{ color: 'var(--color-primary)' }} />} placeholder="Họ và tên" />
          </Form.Item>
          <Form.Item name="email" rules={[{ required: true, message: 'Vui lòng nhập email' }, { type: 'email', message: 'Email không hợp lệ' }]}>
            <Input prefix={<MailOutlined style={{ color: 'var(--color-primary)' }} />} placeholder="Email" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, min: 6, message: 'Mật khẩu tối thiểu 6 ký tự' }]}>
            <Input.Password prefix={<LockOutlined style={{ color: 'var(--color-primary)' }} />} placeholder="Mật khẩu" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block style={{ height: 44, borderRadius: 8, fontWeight: 700 }}>
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
      padding: 24,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <GradientWaveBackground />

      <div style={{
        width: '100%',
        maxWidth: 420,
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        borderRadius: 24,
        boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.3)',
        padding: '48px 40px',
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56,
            height: 56,
            background: 'var(--color-primary)',
            borderRadius: 14,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            boxShadow: '0 8px 16px rgba(var(--color-primary-rgb), 0.2)',
          }}>
            <TeamOutlined style={{ color: '#fff', fontSize: 26 }} />
          </div>
          <h1 style={{
            margin: 0,
            fontSize: 28,
            fontWeight: 900,
            color: '#0F172A',
            letterSpacing: '-1px',
          }}>
            People<span style={{ color: 'var(--color-primary)' }}>Hub</span>
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: 15, color: '#64748B', fontWeight: 500 }}>
            Hệ thống Quản trị Nhân sự Hiện đại
          </p>
        </div>

        <Tabs items={tabItems} centered />

        {!isSupabaseConfigured && (
          <div style={{
            marginTop: 24,
            padding: '12px 16px',
            background: 'rgba(254, 252, 232, 0.8)',
            border: '1px solid #FEF08A',
            borderRadius: 12,
            fontSize: 12,
            color: '#854D0E',
            lineHeight: 1.6,
          }}>
            <div style={{ fontWeight: 800, marginBottom: 4 }}>Bản thử nghiệm (Demo)</div>
            Bấm "Đăng nhập" để trải nghiệm ngay. Hệ thống đang tự động thiết lập các vai trò Admin/Nhân viên.
          </div>
        )}
      </div>
    </div>
  )
}
