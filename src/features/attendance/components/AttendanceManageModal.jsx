import { useState, useEffect } from 'react'
import { Modal, Form, DatePicker, TimePicker, Select, Input, message } from 'antd'
import dayjs from 'dayjs'
import { useUpsertAttendance } from '../hooks/useAdminAttendance'

export default function AttendanceManageModal({ open, onClose, employeeId, initialRecord = null }) {
  const [form] = Form.useForm()
  const upsertMutation = useUpsertAttendance()

  useEffect(() => {
    if (open) {
      if (initialRecord) {
        form.setFieldsValue({
          work_date: dayjs(initialRecord.work_date),
          check_in: initialRecord.check_in ? dayjs(initialRecord.check_in) : null,
          check_out: initialRecord.check_out ? dayjs(initialRecord.check_out) : null,
          status: initialRecord.status || 'present',
          note: initialRecord.note,
        })
      } else {
        form.resetFields()
        form.setFieldsValue({
          work_date: dayjs(),
          status: 'present'
        })
      }
    }
  }, [open, initialRecord, form])

  const handleFinish = async (values) => {
    try {
      // Build ISO strings for check_in / check_out combining date & time
      const dateStr = values.work_date.format('YYYY-MM-DD')
      let checkInISO = null
      let checkOutISO = null

      if (values.check_in) {
        const timeStr = values.check_in.format('HH:mm:ss')
        checkInISO = dayjs(`${dateStr} ${timeStr}`).toISOString()
      }
      
      if (values.check_out) {
        const timeStr = values.check_out.format('HH:mm:ss')
        checkOutISO = dayjs(`${dateStr} ${timeStr}`).toISOString()
      }

      await upsertMutation.mutateAsync({
        id: initialRecord?.id, // undefined means insert, value means update
        employee_id: employeeId,
        work_date: dateStr,
        check_in: checkInISO,
        check_out: checkOutISO,
        status: values.status,
        note: values.note
      })

      message.success('Đã lưu thông tin chấm công')
      onClose()
    } catch (error) {
       // Error handled in mutation definition
    }
  }

  return (
    <Modal
      title={initialRecord ? "Cập nhật Chấm công" : "Thêm Bản ghi Chấm công"}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={upsertMutation.isPending}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
      >
        <Form.Item name="work_date" label="Ngày làm việc" rules={[{ required: true }]}>
          <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" disabled={!!initialRecord} />
        </Form.Item>
        
        <div style={{ display: 'flex', gap: 16 }}>
          <Form.Item name="check_in" label="Giờ vào" style={{ flex: 1 }}>
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item name="check_out" label="Giờ ra" style={{ flex: 1 }}>
            <TimePicker format="HH:mm" style={{ width: '100%' }} />
          </Form.Item>
        </div>

        <Form.Item name="status" label="Trạng thái" rules={[{ required: true }]}>
          <Select>
            <Select.Option value="present">Có mặt</Select.Option>
            <Select.Option value="absent">Vắng mặt (Không phép)</Select.Option>
            <Select.Option value="late">Đi trễ</Select.Option>
            <Select.Option value="early_leave">Về sớm</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="note" label="Ghi chú">
          <Input.TextArea rows={2} placeholder="Nhập ghi chú nếu có..." />
        </Form.Item>
      </Form>
    </Modal>
  )
}
