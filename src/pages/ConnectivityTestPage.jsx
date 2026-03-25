import { useState, useEffect } from 'react'
import { Card, Table, Tag, Button, Result, Spin, Divider, Alert } from 'antd'
import { Link } from 'react-router-dom'
import { CheckCircleOutlined, ExclamationCircleOutlined, ArrowLeftOutlined, DatabaseOutlined } from '@ant-design/icons'
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'

export default function ConnectivityTestPage() {
  const [loading, setLoading] = useState(false)
  const [profiles, setProfiles] = useState([])
  const [error, setError] = useState(null)
  const [dbInfo, setDbInfo] = useState(null)

  const checkConnection = async () => {
    setLoading(true)
    setError(null)
    try {
      // 1. Kiem tra phien ban/ket noi co ban
      const { data, error: connError } = await supabase.from('profiles').select('id, full_name, email, role').limit(5)
      
      if (connError) {
        throw connError
      }
      
      setProfiles(data || [])
      setDbInfo({
        url: import.meta.env.VITE_SUPABASE_URL,
        status: 'Connected'
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isSupabaseConfigured) {
      checkConnection()
    }
  }, [])

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80, render: id => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{id.slice(0, 8)}...</span> },
    { title: 'Họ tên', dataIndex: 'full_name', key: 'full_name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { 
      title: 'Vai trò', 
      dataIndex: 'role', 
      key: 'role',
      render: role => <Tag color={role === 'admin' ? 'purple' : 'blue'}>{role.toUpperCase()}</Tag>
    },
  ]

  return (
    <div style={{ padding: 40, background: 'var(--color-bg)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link to="/">
            <Button icon={<ArrowLeftOutlined />}>Quay lại Dashboard</Button>
          </Link>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-title)' }}>
            Kiểm tra kết nối Supabase
          </h1>
        </div>

        {!isSupabaseConfigured ? (
          <Result
            status="warning"
            title="Chưa cấu hình Supabase"
            subTitle="Vui lòng kiểm tra file .env để điền VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY."
            extra={<Alert message="Hiện tại ứng dụng đang chạy ở chế độ Mock Data" type="info" showIcon />}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Card hoverable style={{ borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
                <div style={{ 
                  width: 48, height: 48, borderRadius: 12, 
                  background: error ? '#FEF2F2' : '#F0FDF4', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center' 
                }}>
                  {error ? (
                    <ExclamationCircleOutlined style={{ fontSize: 24, color: '#DC2626' }} />
                  ) : (
                    <CheckCircleOutlined style={{ fontSize: 24, color: '#16A34A' }} />
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>Trạng thái kết nối</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>
                    {loading ? <Spin size="small" /> : (error ? 'Kết nối thất bại' : 'Đã kết nối thành công')}
                  </div>
                </div>
              </div>
              
              <Divider style={{ margin: '16px 0' }} />
              
              <div style={{ fontSize: 12 }}>
                <strong>URL:</strong> <code style={{ color: 'var(--color-primary)' }}>{dbInfo?.url || import.meta.env.VITE_SUPABASE_URL}</code>
              </div>
            </Card>

            {error && (
              <Alert
                message="Lỗi kết nối database"
                description={
                  <div>
                    <p>{error}</p>
                    <p style={{ margin: 0, fontSize: 12 }}>
                      Gợi ý: Hãy đảm bảo bạn đã chạy script [migration_rbac.sql] trên Supabase Dashboard để tạo bảng <code>profiles</code>.
                    </p>
                  </div>
                }
                type="error"
                showIcon
              />
            )}

            <Card 
              title={<><DatabaseOutlined /> Dữ liệu từ bảng <code>profiles</code></>}
              style={{ borderRadius: 12 }}
              extra={<Button size="small" onClick={checkConnection} loading={loading}>Tải lại</Button>}
            >
              <Table 
                dataSource={profiles} 
                columns={columns} 
                rowKey="id" 
                pagination={false}
                locale={{ emptyText: 'Chưa có dũ liệu hoặc bảng profiles trống' }}
              />
            </Card>
            
            <Alert 
              message="Mẹo kiểm tra" 
              description="Nếu bảng trên có dữ liệu, nghĩa là ứng dụng đã đọc được database mới của bạn thành công. Nếu báo lỗi 'relation profiles does not exist', hãy chạy script migration." 
              type="info" 
              showIcon 
            />
          </div>
        )}
      </div>
    </div>
  )
}
