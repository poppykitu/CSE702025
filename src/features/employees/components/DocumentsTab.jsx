import { useState } from 'react'
import { Table, Button, Tag, Space, Modal, Upload, message, Select, Input } from 'antd'
import { 
  FileOutlined, 
  UploadOutlined, 
  DeleteOutlined, 
  DownloadOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileImageOutlined
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getEmployeeDocuments, uploadEmployeeDocument, deleteDocument } from '../services/documentService'
import { useAuth } from '@/features/auth/context/AuthContext'

const CATEGORY_LABELS = {
  'Contract': 'Hợp đồng',
  'Insurance': 'Bảo hiểm',
  'ID': 'Giấy tờ định danh',
  'Other': 'Khác'
}

export default function DocumentsTab({ employeeId }) {
  const { isAdmin, isHR } = useAuth()
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [uploadData, setUploadData] = useState({ title: '', category: 'Contract', file: null })

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents', employeeId],
    queryFn: () => getEmployeeDocuments(employeeId)
  })

  const uploadMutation = useMutation({
    mutationFn: (vars) => uploadEmployeeDocument(employeeId, vars.file, vars.title, vars.category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', employeeId] })
      message.success('Tải lên tài liệu thành công')
      setIsModalOpen(false)
      setUploadData({ title: '', category: 'Contract', file: null })
    },
    onError: (err) => message.error('Lỗi: ' + err.message)
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', employeeId] })
      message.success('Đã xóa tài liệu')
    }
  })

  const columns = [
    {
      title: 'Tên tài liệu',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Space>
          {record.file_type === 'PDF' && <FilePdfOutlined style={{ color: '#E11D48' }} />}
          {(record.file_type === 'DOC' || record.file_type === 'DOCX') && <FileWordOutlined style={{ color: '#2563EB' }} />}
          {(record.file_type === 'JPG' || record.file_type === 'PNG') && <FileImageOutlined style={{ color: '#059669' }} />}
          {!['PDF', 'DOC', 'DOCX', 'JPG', 'PNG'].includes(record.file_type) && <FileOutlined />}
          <span style={{ fontWeight: 500 }}>{text}</span>
        </Space>
      )
    },
    {
      title: 'Phân loại',
      dataIndex: 'category',
      key: 'category',
      render: (cat) => <Tag color="blue">{CATEGORY_LABELS[cat] || cat}</Tag>
    },
    {
      title: 'Định dạng',
      dataIndex: 'file_type',
      key: 'file_type',
      render: (type) => <Tag>{type}</Tag>
    },
    {
      title: 'Ngày tải lên',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString('vi-VN')
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="text" 
            icon={<DownloadOutlined />} 
            onClick={() => window.open(record.file_url, '_blank')}
          />
          {(isAdmin || isHR) && (
            <Button 
              type="text" 
              danger 
              icon={<DeleteOutlined />} 
              onClick={() => {
                Modal.confirm({
                  title: 'Xác nhận xóa tài liệu?',
                  content: 'Hành động này không thể hoàn tác.',
                  onOk: () => deleteMutation.mutate(record.id)
                })
              }}
            />
          )}
        </Space>
      )
    }
  ]

  return (
    <div style={{ padding: '8px 0 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Tài liệu nhân sự</h3>
        {(isAdmin || isHR) && (
          <Button type="primary" icon={<UploadOutlined />} onClick={() => setIsModalOpen(true)}>
            Tải lên tài liệu
          </Button>
        )}
      </div>

      <Table 
        dataSource={documents} 
        columns={columns} 
        rowKey="id" 
        loading={isLoading}
        size="small"
        pagination={false}
      />

      <Modal
        title="Tải lên tài liệu mới"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={() => {
          if (!uploadData.title || !uploadData.file) {
            message.warning('Vui lòng nhập đầy đủ thông tin')
            return
          }
          uploadMutation.mutate(uploadData)
        }}
        confirmLoading={uploadMutation.isPending}
        okText="Tải lên"
        cancelText="Hủy"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
          <div>
            <div style={{ marginBottom: 8 }}>Tiêu đề tài liệu:</div>
            <Input 
              placeholder="VD: Hợp đồng lao động 2024" 
              value={uploadData.title}
              onChange={(e) => setUploadData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div>
            <div style={{ marginBottom: 8 }}>Loại tài liệu:</div>
            <Select 
              style={{ width: '100%' }} 
              value={uploadData.category}
              onChange={(val) => setUploadData(prev => ({ ...prev, category: val }))}
              options={Object.entries(CATEGORY_LABELS).map(([k, v]) => ({ value: k, label: v }))}
            />
          </div>
          <div>
            <Upload
              beforeUpload={(file) => {
                setUploadData(prev => ({ ...prev, file }))
                return false
              }}
              maxCount={1}
              fileList={uploadData.file ? [uploadData.file] : []}
              onRemove={() => setUploadData(prev => ({ ...prev, file: null }))}
            >
              <Button icon={<UploadOutlined />}>Chọn File</Button>
            </Upload>
          </div>
        </div>
      </Modal>
    </div>
  )
}
