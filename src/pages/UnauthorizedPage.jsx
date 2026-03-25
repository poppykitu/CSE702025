import { useState, useEffect } from 'react'
import { Result, Button, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'

const { Text } = Typography

export default function UnauthorizedPage() {
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)

    const redirect = setTimeout(() => {
      navigate('/')
    }, 5000)

    return () => {
      clearInterval(timer)
      clearTimeout(redirect)
    }
  }, [navigate])

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg)',
    }}>
      <Result
        status="403"
        title="403"
        subTitle={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span>Rất tiếc, bạn không có quyền truy cập vào trang này.</span>
            <Text type="secondary">
              Tự động quay lại trang chủ sau <Text strong style={{ color: 'var(--color-primary)' }}>{countdown}</Text> giây...
            </Text>
          </div>
        }
        extra={
          <Button type="primary" onClick={() => navigate('/')} style={{ borderRadius: 8 }}>
            Quay lại ngay
          </Button>
        }
      />
    </div>
  )
}
