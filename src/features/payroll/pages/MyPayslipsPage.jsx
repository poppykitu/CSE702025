import { Table, Card, Tag, Button, Typography, Space, Statistic, Row, Col } from 'antd'
import { FilePdfOutlined, DownloadOutlined, WalletOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { getMyPayslips } from '@/services/selfService'
import { useAuth } from '@/features/auth/context/AuthContext'

const { Title, Text } = Typography

export default function MyPayslipsPage() {
  const { profile } = useAuth()

  const { data: payslips = [], isLoading } = useQuery({
    queryKey: ['payslips', profile?.id],
    queryFn: () => getMyPayslips(profile?.id),
    enabled: !!profile?.id
  })

  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)

  const columns = [
    { 
      title: 'Kỳ lương', 
      key: 'period',
      render: (_, record) => (
        <div style={{ fontWeight: 600 }}>Tháng {record.month}/{record.year}</div>
      )
    },
    { 
      title: 'Lương cơ bản', 
      dataIndex: 'basic_salary', 
      key: 'basic_salary',
      render: (val) => formatCurrency(val)
    },
    { 
      title: 'Phụ cấp', 
      dataIndex: 'allowances', 
      key: 'allowances',
      render: (val) => <Text type="success">+{formatCurrency(val)}</Text>
    },
    { 
      title: 'Khấu trừ', 
      dataIndex: 'deductions', 
      key: 'deductions',
      render: (val) => <Text type="danger">-{formatCurrency(val)}</Text>
    },
    { 
      title: 'Thực nhận', 
      dataIndex: 'net_salary', 
      key: 'net_salary',
      render: (val) => <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{formatCurrency(val)}</span>
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Button 
          type="primary" 
          ghost 
          size="small" 
          icon={<DownloadOutlined />}
          onClick={() => record.file_url && window.open(record.file_url, '_blank')}
        >
          Tải PDF
        </Button>
      )
    }
  ]

  return (
    <div style={{ padding: 24, background: 'var(--color-bg)', minHeight: 'calc(100vh - 56px)' }}>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Phiếu lương của tôi</h1>
          <p style={{ color: 'var(--color-text-muted)' }}>Quản lý và tra cứu thu nhập hàng tháng</p>
        </div>
        <Card style={{ borderRadius: 12, background: 'var(--color-primary-bg)' }} bodyStyle={{ padding: '12px 24px' }}>
          <Statistic 
            title={<span style={{ color: 'var(--color-primary)' }}>Lương thực nhận kỳ tới (Dự kiến)</span>}
            value={payslips[0]?.net_salary || 0}
            formatter={(val) => formatCurrency(val)}
            prefix={<WalletOutlined />}
            valueStyle={{ fontSize: 22, fontWeight: 800, color: 'var(--color-primary)' }}
          />
        </Card>
      </div>

      <Card title="Danh sách phiếu lương" style={{ borderRadius: 12 }}>
        <Table 
          columns={columns} 
          dataSource={payslips} 
          rowKey="id" 
          loading={isLoading}
          size="middle"
          pagination={{ pageSize: 12 }}
          locale={{ emptyText: 'Chưa có thông tin lương' }}
        />
      </Card>
    </div>
  )
}
