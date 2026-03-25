import { useState, useEffect } from 'react'
import {
  Form, Input, Select, DatePicker, Radio, Upload,
  Button, Row, Col, Divider, message,
} from 'antd'
import { UploadOutlined, LoadingOutlined, UserOutlined, FilePdfOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useDepartments, useDesignations } from '@/hooks/useDepartments'
import EmployeeAvatar from './EmployeeAvatar'
import { uploadAvatar } from '../services/employeeService'
import {
  EMPLOYEE_STATUS, EMPLOYEE_STATUS_LABELS,
  WORK_TYPE, WORK_TYPE_LABELS,
  GENDER_LABELS,
} from '@/utils/constants'

const { TextArea } = Input
const { Option } = Select

/**
 * EmployeeForm — Form dùng chung cho Add và Edit
 * Props:
 *   - initialValues: object (khi edit)
 *   - onSubmit(values): async function
 *   - loading: boolean
 *   - isEdit: boolean
 */
export default function EmployeeForm({ initialValues = {}, onSubmit, loading = false, isEdit = false }) {
  const [form] = Form.useForm()
  const [selectedDeptId, setSelectedDeptId] = useState(initialValues.department_id || null)
  const [avatarUrl, setAvatarUrl] = useState(initialValues.avatar_url || null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [contractUrl, setContractUrl] = useState(initialValues.contract_url || null)
  const [contractUploading, setContractUploading] = useState(false)

  const { data: departments = [] } = useDepartments()
  const { data: designations = [] } = useDesignations(selectedDeptId)

  // Populate form khi edit
  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      form.setFieldsValue({
        ...initialValues,
        date_of_birth: initialValues.date_of_birth ? dayjs(initialValues.date_of_birth) : null,
        date_of_joining: initialValues.date_of_joining ? dayjs(initialValues.date_of_joining) : null,
        date_of_termination: initialValues.date_of_termination ? dayjs(initialValues.date_of_termination) : null,
      })
      setAvatarUrl(initialValues.avatar_url || null)
      setContractUrl(initialValues.contract_url || null)
      setSelectedDeptId(initialValues.department_id || null)
    }
  }, [initialValues, form])

  const handleDeptChange = (deptId) => {
    setSelectedDeptId(deptId)
    form.setFieldValue('designation_id', undefined)
  }

  const handleAvatarUpload = async ({ file }) => {
    setAvatarUploading(true)
    try {
      const empId = form.getFieldValue('employee_id') || 'temp'
      const url = await uploadAvatar(file, empId)
      setAvatarUrl(url)
      form.setFieldValue('avatar_url', url)
      message.success('Tải ảnh lên thành công!')
    } catch (err) {
      message.error('Tải ảnh thất bại: ' + err.message)
    } finally {
      setAvatarUploading(false)
    }
  }

  const handleContractUpload = async ({ file }) => {
    setContractUploading(true)
    try {
      const empId = form.getFieldValue('employee_id') || 'temp'
      // Sẽ cập nhật uploadContract trong service sau
      const url = await uploadAvatar(file, `contract-${empId}`) 
      setContractUrl(url)
      form.setFieldValue('contract_url', url)
      message.success('Tải hợp đồng lên thành công!')
    } catch (err) {
      message.error('Tải hợp đồng thất bại: ' + err.message)
    } finally {
      setContractUploading(false)
    }
  }

  const handleFinish = async (values) => {
    const payload = {
      ...values,
      avatar_url: avatarUrl,
      contract_url: contractUrl,
      date_of_birth: values.date_of_birth ? values.date_of_birth.format('YYYY-MM-DD') : null,
      date_of_joining: values.date_of_joining ? values.date_of_joining.format('YYYY-MM-DD') : null,
      date_of_termination: values.date_of_termination ? values.date_of_termination.format('YYYY-MM-DD') : null,
    }
    await onSubmit(payload)
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      requiredMark={false}
      initialValues={{ status: 'onboarding', work_type: 'full-time', gender: 'male' }}
    >
      <Row gutter={[24, 0]}>
        {/* Avatar upload */}
        <Col span={24}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24, padding: '20px', background: 'var(--color-bg)', borderRadius: 12 }}>
            <div style={{ position: 'relative' }}>
              {avatarUploading ? (
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <LoadingOutlined style={{ fontSize: 24 }} />
                </div>
              ) : (
                <EmployeeAvatar
                  name={form.getFieldValue('full_name') || 'Preview'}
                  avatarUrl={avatarUrl}
                  size={72}
                />
              )}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--color-text-primary)' }}>
                Ảnh đại diện
              </div>
              <Upload
                showUploadList={false}
                accept="image/*"
                customRequest={handleAvatarUpload}
                beforeUpload={(file) => {
                  if (file.size > 5 * 1024 * 1024) {
                    message.error('File quá lớn! Tối đa 5MB.')
                    return false
                  }
                  return true
                }}
              >
                <Button icon={<UploadOutlined />} size="small">
                  {avatarUrl ? 'Đổi ảnh' : 'Tải ảnh lên'}
                </Button>
              </Upload>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
                JPG, PNG, GIF. Tối đa 5MB.
              </div>
            </div>
          </div>
        </Col>
      </Row>

      <FormSection title="Thông tin cơ bản">
        <Row gutter={[16, 0]}>
          <Col xs={24} md={12}>
            <Form.Item name="employee_id" label="Mã nhân viên" rules={[{ required: true, message: 'Bắt buộc' }]}>
              <Input placeholder="VD: EMP-001" style={{ fontFamily: 'var(--font-mono)' }} disabled={isEdit} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="full_name" label="Họ và tên" rules={[{ required: true, message: 'Bắt buộc' }]}>
              <Input placeholder="Nguyễn Văn An" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="email" label="Email công ty" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}>
              <Input placeholder="an.nguyen@company.vn" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="phone" label="Số điện thoại">
              <Input placeholder="0901234567" />
            </Form.Item>
          </Col>
        </Row>
      </FormSection>

      <FormSection title="Thông tin việc làm">
        <Row gutter={[16, 0]}>
          <Col xs={24} md={12}>
            <Form.Item name="department_id" label="Phòng ban" rules={[{ required: true, message: 'Bắt buộc' }]}>
              <Select placeholder="Chọn phòng ban" onChange={handleDeptChange} showSearch optionFilterProp="children">
                {departments.map(d => <Option key={d.id} value={d.id}>{d.name}</Option>)}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="designation_id" label="Chức danh" rules={[{ required: true, message: 'Bắt buộc' }]}>
              <Select placeholder="Chọn chức danh" disabled={!selectedDeptId} showSearch>
                {designations.map(d => <Option key={d.id} value={d.id}>{d.title}</Option>)}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
              <Select>
                {Object.values(EMPLOYEE_STATUS).map(s => (
                  <Option key={s} value={s}>{EMPLOYEE_STATUS_LABELS[s]}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="work_type" label="Loại hợp đồng" rules={[{ required: true }]}>
              <Select>
                {Object.values(WORK_TYPE).map(wt => (
                  <Option key={wt} value={wt}>{WORK_TYPE_LABELS[wt]}</Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="work_location" label="Địa điểm làm việc">
              <Input placeholder="VD: Hà Nội HQ, Remote" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="date_of_joining" label="Ngày vào làm">
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="contract_url" label="Bản mềm Hợp đồng (PDF)">
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Upload
                  showUploadList={false}
                  accept=".pdf"
                  customRequest={handleContractUpload}
                >
                  <Button icon={contractUploading ? <LoadingOutlined /> : <UploadOutlined />} size="small">
                    Tải lên PDF
                  </Button>
                </Upload>
                {contractUrl && (
                  <Button 
                    type="link" 
                    icon={<FilePdfOutlined />} 
                    size="small" 
                    onClick={() => window.open(contractUrl, '_blank')}
                  >
                    Xem bản hiện tại
                  </Button>
                )}
              </div>
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="bio" label="Giới thiệu ngắn">
              <TextArea rows={3} placeholder="Vài dòng về kinh nghiệm và chuyên môn..." maxLength={500} showCount />
            </Form.Item>
          </Col>
        </Row>
      </FormSection>

      <FormSection title="Thông tin cá nhân">
        <Row gutter={[16, 0]}>
          <Col xs={24} md={12}>
            <Form.Item name="gender" label="Giới tính">
              <Radio.Group>
                {Object.entries(GENDER_LABELS).slice(0, 3).map(([val, label]) => (
                  <Radio key={val} value={val}>{label}</Radio>
                ))}
              </Radio.Group>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="date_of_birth" label="Ngày sinh">
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="address" label="Địa chỉ">
              <Input placeholder="Số nhà, đường, quận/huyện, tỉnh/thành phố" />
            </Form.Item>
          </Col>
        </Row>
      </FormSection>

      {/* Submit */}
      <div style={{
        display: 'flex', gap: 12, justifyContent: 'flex-end',
        paddingTop: 8, borderTop: '1px solid var(--color-border)', marginTop: 8,
      }}>
        <Button htmlType="button" onClick={() => window.history.back()}>
          Huỷ
        </Button>
        <Button type="primary" htmlType="submit" loading={loading}>
          {isEdit ? 'Cập nhật' : 'Thêm nhân viên'}
        </Button>
      </div>
    </Form>
  )
}

function FormSection({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <Divider orientation="left" style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', letterSpacing: '0.5px', textTransform: 'uppercase', margin: '0 0 16px' }}>
        {title}
      </Divider>
      {children}
    </div>
  )
}
