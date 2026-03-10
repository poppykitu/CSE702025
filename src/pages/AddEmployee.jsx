import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { message } from 'antd'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import EmployeeForm from '@/components/form/EmployeeForm'
import { useCreateEmployee } from '@/hooks/useEmployees'

export default function AddEmployee() {
  const navigate = useNavigate()
  const createMutation = useCreateEmployee()

  const handleSubmit = async (values) => {
    try {
      await createMutation.mutateAsync(values)
      message.success(`Đã thêm nhân viên ${values.full_name} thành công!`)
      navigate('/employees')
    } catch (err) {
      message.error('Thêm nhân viên thất bại: ' + err.message)
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
      }}>
        <Link to="/employees">
          <Button type="text" icon={<ArrowLeftOutlined />} size="small" style={{ color: 'var(--color-text-secondary)' }}>
            Nhân viên
          </Button>
        </Link>
        <span style={{ color: 'var(--color-border)' }}>/</span>
        <span style={{ fontSize: 13, color: 'var(--color-text-primary)', fontWeight: 500 }}>
          Thêm nhân viên mới
        </span>
      </div>

      {/* Form container */}
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
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--color-text-primary)' }}>
              Thêm nhân viên mới
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
              Điền đầy đủ thông tin hồ sơ nhân viên dưới đây.
            </p>
          </div>
          <EmployeeForm
            onSubmit={handleSubmit}
            loading={createMutation.isPending}
            isEdit={false}
          />
        </div>
      </div>
    </div>
  )
}
