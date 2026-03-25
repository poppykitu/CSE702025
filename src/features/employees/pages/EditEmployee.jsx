import { Link, useNavigate, useParams } from 'react-router-dom'
import { message, Button, Skeleton } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import EmployeeForm from '@/features/employees/components/EmployeeForm'
import { useEmployee, useUpdateEmployee } from '@/features/employees/hooks/useEmployees'

export default function EditEmployee() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: employee, isLoading } = useEmployee(id)
  const updateMutation = useUpdateEmployee()

  const handleSubmit = async (values) => {
    try {
      await updateMutation.mutateAsync({ id, data: values })
      message.success('Đã cập nhật hồ sơ nhân viên!')
      navigate(`/employees/${id}`)
    } catch (err) {
      message.error('Cập nhật thất bại: ' + err.message)
    }
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 56px)', background: 'var(--color-bg)' }}>
      {/* Breadcrumb */}
      <div style={{
        padding: '12px 24px',
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex', alignItems: 'center', gap: 8,
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      }}>
        <Link to="/employees">
          <Button type="text" icon={<ArrowLeftOutlined />} size="small" style={{ color: 'var(--color-text-secondary)' }}>
            Nhân viên
          </Button>
        </Link>
        <span style={{ color: 'var(--color-border)' }}>/</span>
        <Link to={`/employees/${id}`} style={{ textDecoration: 'none' }}>
          <Button type="text" size="small" style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
            {employee?.full_name || '...'}
          </Button>
        </Link>
        <span style={{ color: 'var(--color-border)' }}>/</span>
        <span style={{ fontSize: 13, color: 'var(--color-text-primary)', fontWeight: 500 }}>Chỉnh sửa</span>
      </div>

      {/* Form */}
      <div style={{ maxWidth: 860, margin: '32px auto', padding: '0 24px' }}>
        <div
          className="animate-scale-in"
          style={{
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '28px 32px',
          }}
        >
          {isLoading ? (
            <Skeleton active paragraph={{ rows: 8 }} />
          ) : (
            <>
              <div style={{ marginBottom: 24 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-title)', color: 'var(--color-text-primary)', letterSpacing: '-0.3px' }}>
                  Chỉnh sửa hồ sơ
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
                  Cập nhật thông tin cho <strong>{employee?.full_name}</strong>
                </p>
              </div>
              <EmployeeForm
                initialValues={employee}
                onSubmit={handleSubmit}
                loading={updateMutation.isPending}
                isEdit={true}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
