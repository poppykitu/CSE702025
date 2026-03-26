import { useState } from 'react'
import { Table, Card, Typography, Statistic, Tabs, Select, Descriptions } from 'antd'
import { DownloadOutlined, WalletOutlined, UserOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { getMyPayslips } from '@/services/selfService'
import { useAuth } from '@/features/auth/context/AuthContext'
import { useEmployees, useEmployee } from '@/features/employees/hooks/useEmployees'
import { Button } from 'antd'

const { Text } = Typography

function PersonalPayslipsTab() {
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
    <>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
        <Card style={{ borderRadius: 12, background: 'var(--color-primary-bg)', minWidth: 300 }} bodyStyle={{ padding: '12px 24px' }}>
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
    </>
  )
}

function SalaryManageView({ employeeId }) {
  const { data: employee, isLoading } = useEmployee(employeeId)

  if (isLoading) return <div>Đang tải dữ liệu nhân viên...</div>
  if (!employee) return <div>Không tìm thấy dữ liệu.</div>

  const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)

  return (
    <div style={{ padding: '8px 0' }}>
      <Descriptions column={1} size="small" style={{ padding: '8px 0 16px' }}
        labelStyle={{ display: 'flex', alignItems: 'center', height: '32px', width: '180px' }}
        contentStyle={{ display: 'flex', alignItems: 'center', height: '32px' }}>
        <Descriptions.Item label="Nhân viên">
          <strong>{employee.full_name}</strong> ({employee.employee_id})
        </Descriptions.Item>
        <Descriptions.Item label="Mức lương cơ bản">
          <span style={{ fontWeight: 600, color: '#10B981', fontSize: 16 }}>
            {employee.base_salary 
              ? formatCurrency(employee.base_salary) 
              : <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', fontWeight: 'normal', fontSize: 14 }}>Chưa thiết lập (Cập nhật trong form chỉnh sửa nhân sự)</span>}
          </span>
        </Descriptions.Item>
      </Descriptions>
      <div style={{ marginTop: 16, padding: '16px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: 13 }}>
          💡 <strong>Ghi chú:</strong> Chức năng Quản lý Bảng lương chi tiết (tính phép, chuyên cần, khấu trừ, xuất phiếu lương) sẽ được hiển thị và thao tác tại đây khi tính năng tính lương tự động được kích hoạt. Hiện tại Admin có thể xem Mức lương cơ bản tại đây.
        </p>
      </div>
    </div>
  )
}

function AdminPayslipsTab() {
  const { data: employees = [], isLoading } = useEmployees()
  const [selectedEmpId, setSelectedEmpId] = useState(null)

  return (
    <Card bordered={false} style={{ borderRadius: 12, minHeight: 400 }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ fontWeight: 500 }}>Chọn nhân viên cần xem mức lương:</span>
        <Select
          showSearch
          style={{ width: 300 }}
          placeholder="Tìm nhân viên..."
          loading={isLoading}
          onChange={(val) => setSelectedEmpId(val)}
          filterOption={(input, option) =>
            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
          }
          options={employees.map(emp => ({
            value: emp.id,
            label: `${emp.full_name} (${emp.employee_id || 'N/A'})`
          }))}
        />
      </div>

      {selectedEmpId ? (
        <SalaryManageView employeeId={selectedEmpId} />
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-muted)' }}>
          <UserOutlined style={{ fontSize: 48, marginBottom: 16, opacity: 0.2 }} />
          <p>Vui lòng chọn một nhân viên để xem thông tin lương và phiếu lương</p>
        </div>
      )}
    </Card>
  )
}

export default function MyPayslipsPage() {
  const { isAdmin, isHR } = useAuth()
  
  const items = [
    {
      key: 'personal',
      label: 'Cá nhân của tôi',
      children: <PersonalPayslipsTab />
    }
  ]

  if (isAdmin || isHR) {
    items.push({
      key: 'manage',
      label: 'Quản lý toàn công ty (Admin)',
      children: <AdminPayslipsTab />
    })
  }

  return (
    <div style={{ padding: 24, background: 'var(--color-bg)', minHeight: 'calc(100vh - 56px)' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Bảng lương</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Quản lý và tra cứu thông tin thu nhập</p>
      </div>

      <Tabs items={items} type="line" size="large" />
    </div>
  )
}
