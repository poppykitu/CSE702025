import { useState } from 'react'
import { Button, message, Alert, Typography, Divider } from 'antd'
import { LockOutlined, SafetyOutlined, MailOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/features/auth/context/AuthContext'

const { Title, Text } = Typography

export default function SettingsPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSendResetEmail = async () => {
    setLoading(true)
    setErrorMsg('')

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user?.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      setSent(true)
      message.success('Đã gửi email đặt lại mật khẩu!')
    } catch (err) {
      setErrorMsg(err.message || 'Gửi email thất bại. Vui lòng thử lại.')
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

        {/* Card: Đặt lại mật khẩu */}
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
                Link đặt lại sẽ được gửi đến: <strong style={{ color: 'var(--color-text-secondary)' }}>{user?.email}</strong>
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div style={{ padding: '28px 24px' }}>
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

            {sent ? (
              /* Trạng thái đã gửi thành công */
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <CheckCircleOutlined style={{ fontSize: 52, color: '#10B981', marginBottom: 16 }} />
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-primary)', marginBottom: 8 }}>
                  Email đã được gửi!
                </div>
                <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.7, maxWidth: 380, margin: '0 auto 24px' }}>
                  Vui lòng kiểm tra hộp thư <strong>{user?.email}</strong> và nhấn vào link để đặt lại mật khẩu.
                </div>
                <Divider style={{ margin: '0 0 20px' }} />
                <Button
                  type="text"
                  size="small"
                  onClick={() => setSent(false)}
                  style={{ color: 'var(--color-text-muted)', fontSize: 13 }}
                >
                  Chưa nhận được? Gửi lại
                </Button>
              </div>
            ) : (
              /* Trạng thái ban đầu */
              <>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  padding: '16px 20px',
                  background: '#F8FAFC',
                  borderRadius: 10,
                  border: '1px solid var(--color-border)',
                  marginBottom: 24,
                }}>
                  <MailOutlined style={{ fontSize: 20, color: '#6366F1', marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 4 }}>
                      Quy trình đặt lại mật khẩu
                    </div>
                    <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: 'var(--color-text-secondary)', lineHeight: 1.9 }}>
                      <li>Nhấn nút bên dưới để gửi email xác nhận</li>
                      <li>Kiểm tra hộp thư <strong>{user?.email}</strong></li>
                      <li>Nhấn vào link trong email để đặt mật khẩu mới</li>
                    </ol>
                  </div>
                </div>

                <Button
                  type="primary"
                  size="large"
                  loading={loading}
                  onClick={handleSendResetEmail}
                  icon={<MailOutlined />}
                  style={{ width: '100%', height: 44, fontWeight: 600, fontSize: 15 }}
                >
                  {loading ? 'Đang gửi email...' : 'Gửi email đặt lại mật khẩu'}
                </Button>
              </>
            )}
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
