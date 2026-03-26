import { useState } from 'react'
import { Table, Button, Space, Tag, DatePicker, Popconfirm } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useAdminEmployeeAttendance, useDeleteAttendance } from '../hooks/useAdminAttendance'
import AttendanceManageModal from './AttendanceManageModal'

const STATUS_MAP = {
  present: { color: 'green', label: 'Có mặt' },
  absent: { color: 'red', label: 'Vắng mặt' },
  late: { color: 'warning', label: 'Đi trễ' },
  early_leave: { color: 'default', label: 'Về sớm' }
}

export default function AttendanceManageTab({ employeeId }) {
  const [currentMonth, setCurrentMonth] = useState(dayjs())
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)

  const month = currentMonth.month() + 1
  const year = currentMonth.year()

  const { data: records = [], isLoading } = useAdminEmployeeAttendance(employeeId, month, year)
  const deleteMutation = useDeleteAttendance()

  const columns = [
    {
      title: 'Ngày làm việc',
      dataIndex: 'work_date',
      key: 'work_date',
      render: (text) => <span style={{ fontWeight: 500 }}>{dayjs(text).format('DD/MM/YYYY')}</span>
    },
    {
      title: 'Giờ vào',
      dataIndex: 'check_in',
      key: 'check_in',
      render: (text) => text ? dayjs(text).format('HH:mm') : '—'
    },
    {
      title: 'Giờ ra',
      dataIndex: 'check_out',
      key: 'check_out',
      render: (text) => text ? dayjs(text).format('HH:mm') : '—'
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const config = STATUS_MAP[status] || STATUS_MAP.present
        return <Tag color={config.color}>{config.label}</Tag>
      }
    },
    {
      title: 'Ghi chú',
      dataIndex: 'note',
      key: 'note',
      render: (text) => text || '—'
    },
    {
      title: 'Thao tác',
      key: 'action',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="text" 
            size="small" 
            icon={<EditOutlined />} 
            onClick={() => {
              setEditingRecord(record)
              setModalOpen(true)
            }}
          />
          <Popconfirm
            title="Xóa bản ghi này?"
            okText="Xóa"
            cancelText="Huỷ"
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <Button type="text" danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <DatePicker 
          picker="month" 
          value={currentMonth} 
          onChange={(val) => setCurrentMonth(val || dayjs())} 
          format="MM/YYYY"
          allowClear={false}
        />
        <Button 
          type="primary" 
          icon={<PlusOutlined />} 
          onClick={() => {
            setEditingRecord(null)
            setModalOpen(true)
          }}
        >
          Thêm Chấm công
        </Button>
      </div>

      <Table 
        columns={columns} 
        dataSource={records} 
        rowKey="id" 
        loading={isLoading}
        pagination={{ pageSize: 10 }}
        size="middle"
      />

      <AttendanceManageModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        employeeId={employeeId}
        initialRecord={editingRecord}
      />
    </div>
  )
}
