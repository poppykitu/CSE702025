import { useState, useEffect } from 'react'
import { Table, Button, Modal, Form, Input, Select, message, Card, Space, Popconfirm } from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ApartmentOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { usePermission } from '@/features/auth/hooks/usePermission'
import { PERMISSIONS } from '@/constants/roles'
import { isSupabaseConfigured } from '@/lib/supabaseClient'
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from '@/services/departmentService'
import { MOCK_EMPLOYEES } from '@/utils/mockData'

export default function DepartmentManagementPage() {
  const { hasPermission } = usePermission()
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDept, setEditingDept] = useState(null)
  const [searchText, setSearchText] = useState('')
  const [form] = Form.useForm()

  const canManage = hasPermission(PERMISSIONS.MANAGE_DEPARTMENTS)

  const fetchDepartments = async () => {
    setLoading(true)
    try {
      const data = await getDepartments()
      // Thêm số lượng nhân viên cho mỗi phòng ban
      const enriched = data.map(dept => {
        // Trong DEMO mode, đếm từ MOCK_EMPLOYEES
        let count = 0
        if (!isSupabaseConfigured) {
          count = MOCK_EMPLOYEES.filter(
            e => e.department_id === dept.id && e.status !== 'terminated'
          ).length
        }
        return { ...dept, employee_count: count }
      })
      setDepartments(enriched)
    } catch (err) {
      message.error('Không thể tải danh sách phòng ban: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDepartments()
  }, [])

  const handleOpenCreate = () => {
    setEditingDept(null)
    form.resetFields()
    setIsModalOpen(true)
  }

  const handleOpenEdit = (dept) => {
    setEditingDept(dept)
    form.setFieldsValue({
      name: dept.name,
      code: dept.code,
      description: dept.description,
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (values) => {
    try {
      if (editingDept) {
        await updateDepartment(editingDept.id, values)
        message.success(`Đã cập nhật phòng ban "${values.name}"`)
      } else {
        await createDepartment(values)
        message.success(`Đã tạo phòng ban "${values.name}"`)
      }
      setIsModalOpen(false)
      form.resetFields()
      setEditingDept(null)
      fetchDepartments()
    } catch (err) {
      message.error('Thao tác thất bại: ' + err.message)
    }
  }

  const handleDelete = async (dept) => {
    if (dept.employee_count > 0) {
      message.warning(`Không thể xóa phòng ban "${dept.name}" vì còn ${dept.employee_count} nhân viên.`)
      return
    }
    try {
      await deleteDepartment(dept.id)
      message.success(`Đã xóa phòng ban "${dept.name}"`)
      fetchDepartments()
    } catch (err) {
      message.error('Xóa thất bại: ' + err.message)
    }
  }

  const filteredDepts = departments.filter(d => {
    if (!searchText) return true
    const s = searchText.toLowerCase()
    return d.name.toLowerCase().includes(s) || (d.code && d.code.toLowerCase().includes(s))
  })

  const columns = [
    {
      title: 'Tên phòng ban',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{text}</div>
          {record.description && (
            <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
              {record.description}
            </div>
          )}
        </div>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Mã',
      dataIndex: 'code',
      key: 'code',
      width: 100,
      render: (code) => (
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--color-primary)',
          background: 'var(--color-primary-bg)',
          padding: '2px 8px',
          borderRadius: 4,
        }}>
          {code || '--'}
        </span>
      ),
    },
    {
      title: 'Số nhân viên',
      dataIndex: 'employee_count',
      key: 'employee_count',
      width: 120,
      align: 'center',
      render: (count) => (
        <span style={{
          fontWeight: 700,
          fontSize: 14,
          color: count > 0 ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
        }}>
          {count ?? '--'}
        </span>
      ),
      sorter: (a, b) => (a.employee_count || 0) - (b.employee_count || 0),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 120,
      render: (date) => {
        if (!date) return '--'
        return new Date(date).toLocaleDateString('vi-VN')
      },
    },
  ]

  // Thêm cột thao tác nếu có quyền
  if (canManage) {
    columns.push({
      title: 'Thao tác',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space size={4}>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleOpenEdit(record)}
            style={{ fontSize: 12 }}
          >
            Sửa
          </Button>
          <Popconfirm
            title={`Xóa phòng ban "${record.name}"?`}
            description={record.employee_count > 0
              ? `Phòng ban còn ${record.employee_count} nhân viên, không thể xóa.`
              : 'Thao tác này không thể hoàn tác.'
            }
            onConfirm={() => handleDelete(record)}
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true, disabled: record.employee_count > 0 }}
          >
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              style={{ fontSize: 12 }}
            >
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    })
  }

  return (
    <div style={{
      padding: 24,
      minHeight: 'calc(100vh - 56px)',
      background: 'var(--color-bg)',
    }}>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{
            margin: 0, fontSize: 24, fontWeight: 800,
            fontFamily: 'var(--font-title)',
            color: 'var(--color-text-primary)', letterSpacing: '-0.5px',
          }}>
            Quản lý phòng ban
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--color-text-muted)' }}>
            Tạo, chỉnh sửa và xóa phòng ban trong tổ chức
          </p>
        </div>
        {canManage && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleOpenCreate}
            style={{ height: 38, fontWeight: 600 }}
          >
            Thêm phòng ban
          </Button>
        )}
      </div>

      <Card bordered={false} style={{ borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <div style={{ marginBottom: 16 }}>
          <Input
            placeholder="Tìm phòng ban..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredDepts}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          size="small"
          locale={{ emptyText: 'Chưa có phòng ban nào' }}
        />
      </Card>

      {/* Modal thêm/sửa phòng ban */}
      <Modal
        title={editingDept ? `Chỉnh sửa: ${editingDept.name}` : 'Thêm phòng ban mới'}
        open={isModalOpen}
        onCancel={() => { setIsModalOpen(false); setEditingDept(null) }}
        footer={null}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="name"
            label="Tên phòng ban"
            rules={[{ required: true, message: 'Vui lòng nhập tên phòng ban' }]}
          >
            <Input placeholder="Ví dụ: Kỹ thuật - Engineering" />
          </Form.Item>
          <Form.Item
            name="code"
            label="Mã phòng ban"
            rules={[{ required: true, message: 'Vui lòng nhập mã phòng ban' }]}
          >
            <Input placeholder="Ví dụ: ENG" style={{ textTransform: 'uppercase' }} />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} placeholder="Mô tả ngắn về phòng ban..." />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block style={{ height: 40 }}>
              {editingDept ? 'Cập nhật phòng ban' : 'Tạo phòng ban'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
