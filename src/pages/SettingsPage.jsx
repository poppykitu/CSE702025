import { useState } from 'react'
import { Form, Input, Button, message, Alert, Typography, Divider } from 'antd'
import { LockOutlined, SafetyOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/features/auth/context/AuthContext'

const { Title, Text } = Typography

export default function SettingsPage() {
  const { user, profile } = useAuth()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const handleChangePassword = async (values) => {
    setLoading(true)
    setSuccessMsg('')
    setErrorMsg('')

    try {
      const { error } = await supabase.auth.updateUser({
        password: values.newPassword
      })

      if (error) throw error

      message.success('Đổi mật khẩu thành công!')
      setSuccessMsg('Mật khẩu đã được cập nhật. Vui lòng dùng mật khẩu mới trong lần đăng nhập tiếp theo.')
      form.resetFields()
    } catch (err) {
      setErrorMsg(err.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: 'var(--color-bg)' }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px',
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}>
        <div style={{
          width: 32, height: 32,
          background: 'var(--color-primary-bg)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <SafetyOutlined style={{ color: 'var(--color-primary)', fontSize: 15 }} />
        </div>
        <div>
          <Title level={5} style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-title)' }}>
            Cài đặt
          </Title>
          <Text style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            Quản lý thông tin bảo mật tài khoản
          </Text>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 680, margin: '32px auto', padding: '0 24px' }}>

        {/* Card: Đổi mật khẩu */}
        <div className="animate-scale-in" style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}>
          {/* Card Header */}
          <div style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <div style={{
              width: 38, height: 38,
              background: '#EEF2FF',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <LockOutlined style={{ color: '#4F46E5', fontSize: 17 }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text-primary)' }}>
                Đặt lại mật khẩu
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
                Đăng nhập với: <strong style={{ color: 'var(--color-text-secondary)' }}>{user?.email}</strong>
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div style={{ padding: '24px' }}>
            {successMsg && (
              <Alert
                message={successMsg}
                type="success"
                showIcon
                style={{ marginBottom: 20 }}
                closable
                onClose={() => setSuccessMsg('')}
              />
            )}
            {errorMsg && (
              <Alert
                message={errorMsg}
                type="error"
                showIcon
                style={{ marginBottom: 20 }}
                closable
                onClose={() => setErrorMsg('')}
              />
            )}

            <Form
              form={form}
              layout="vertical"
              onFinish={handleChangePassword}
              requiredMark={false}
            >
              <Form.Item
                name="newPassword"
                label="Mật khẩu mới"
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu mới' },
                  { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                  placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
                  size="large"
                  iconRender={(visible) => visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />}
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Xác nhận mật khẩu mới"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Vui lòng xác nhận mật khẩu' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve()
                      }
                      return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'))
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                  placeholder="Nhập lại mật khẩu mới"
                  size="large"
                  iconRender={(visible) => visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />}
                />
              </Form.Item>

              <Divider style={{ margin: '8px 0 20px' }} />

              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
                icon={<LockOutlined />}
                style={{ width: '100%', height: 44, fontWeight: 600, fontSize: 15 }}
              >
                {loading ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
              </Button>
            </Form>
          </div>
        </div>

        {/* Ghi chú bảo mật */}
        <div style={{
          marginTop: 16,
          padding: '12px 16px',
          background: '#FFFBEB',
          border: '1px solid #FDE68A',
          borderRadius: 8,
          fontSize: 13,
          color: '#78350f',
          lineHeight: 1.6,
        }}>
          💡 <strong>Gợi ý bảo mật:</strong> Sử dụng mật khẩu kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt. Không dùng lại mật khẩu từ các tài khoản khác.
        </div>
      </div>
    </div>
  )
}
