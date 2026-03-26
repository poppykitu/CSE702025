import { useState } from 'react'
import { Table, DatePicker, Button, Tooltip, Popover, Form, TimePicker, message } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useMonthlyAttendanceForAll, useUpsertAttendance } from '../hooks/useAdminAttendance'
import isBetween from 'dayjs/plugin/isBetween'
dayjs.extend(isBetween)

export default function AdminTimesheetTab() {
  const [currentMonth, setCurrentMonth] = useState(dayjs())
  const month = currentMonth.month() + 1
  const year = currentMonth.year()
  const daysInMonth = currentMonth.daysInMonth()

  const { data: matrixData = [], isLoading } = useMonthlyAttendanceForAll(month, year)
  const upsertMutation = useUpsertAttendance()

  const handleSaveTime = async (employeeId, day, type, timeValue, existingRecordId) => {
    try {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      
      let checkInISO = undefined
      let checkOutISO = undefined

      if (type === 'in' && timeValue) {
        checkInISO = dayjs(`${dateStr} ${timeValue.format('HH:mm:ss')}`).toISOString()
      } else if (type === 'out' && timeValue) {
        checkOutISO = dayjs(`${dateStr} ${timeValue.format('HH:mm:ss')}`).toISOString()
      }

      await upsertMutation.mutateAsync({
        id: existingRecordId,
        employee_id: employeeId,
        work_date: dateStr,
        ...(type === 'in' ? { check_in: checkInISO || null } : {}),
        ...(type === 'out' ? { check_out: checkOutISO || null } : {}),
        status: 'present' // default to present if they have check_in/out
      })
      message.success('Đã lưu giờ chấm công')
    } catch (err) {
      // Error handled by mutation
    }
  }

  const renderTimeCell = (record, day, type) => {
    const dayRecord = record.records[day] || {}
    const timeValue = type === 'in' ? dayRecord.check_in : dayRecord.check_out
    const displayTime = timeValue ? dayjs(timeValue).format('HH:mm') : '--'
    
    // A small form to edit time
    const content = (
      <Form layout="vertical" onFinish={(values) => handleSaveTime(record.employee_id, day, type, values.time, dayRecord.id)}>
        <Form.Item name="time" initialValue={timeValue ? dayjs(timeValue) : null}>
          <TimePicker format="HH:mm" style={{ width: 120 }} />
        </Form.Item>
        <Button type="primary" htmlType="submit" size="small" loading={upsertMutation.isPending} block>
          Lưu
        </Button>
      </Form>
    )

    return (
      <Popover content={content} title={`Sửa giờ ${type === 'in' ? 'vào' : 'ra'} - Ngày ${day}/${month}`} trigger="click">
        <div style={{ 
          cursor: 'pointer', 
          padding: '4px 8px', 
          textAlign: 'center',
          background: timeValue ? 'var(--color-primary-bg)' : 'transparent',
          color: timeValue ? 'var(--color-primary)' : 'var(--color-text-muted)',
          borderRadius: 4,
          fontWeight: timeValue ? 600 : 400,
          border: '1px solid transparent',
        }} className="timesheet-cell">
          {displayTime}
        </div>
      </Popover>
    )
  }

  // Build dynamic columns
  const columns = [
    {
      title: 'Nhân viên',
      dataIndex: 'full_name',
      key: 'employee',
      fixed: 'left',
      width: 220,
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{text}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{record.employee_code}</div>
        </div>
      )
    }
  ]

  for (let i = 1; i <= daysInMonth; i++) {
    const isWeekend = dayjs(`${year}-${month}-${i}`).day() === 0 || dayjs(`${year}-${month}-${i}`).day() === 6
    columns.push({
      title: (
        <div style={{ textAlign: 'center', color: isWeekend ? '#ef4444' : 'inherit' }}>
          Ng. {i}
        </div>
      ),
      key: `day_${i}`,
      children: [
        {
          title: 'Vào',
          key: `in_${i}`,
          width: 70,
          render: (_, record) => renderTimeCell(record, i, 'in')
        },
        {
          title: 'Ra',
          key: `out_${i}`,
          width: 70,
          render: (_, record) => renderTimeCell(record, i, 'out')
        }
      ]
    })
  }

  return (
    <div className="admin-timesheet-container">
      <style>{`
        .timesheet-cell:hover { border-color: var(--color-primary) !important; }
        .ant-table-thead > tr > th { padding: 8px 4px !important; text-align: center; }
        .ant-table-tbody > tr > td { padding: 4px !important; }
      `}</style>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button icon={<LeftOutlined />} onClick={() => setCurrentMonth(prev => prev.subtract(1, 'month'))} />
          <DatePicker picker="month" value={currentMonth} onChange={(val) => setCurrentMonth(val || dayjs())} format="MM/YYYY" allowClear={false} />
          <Button icon={<RightOutlined />} onClick={() => setCurrentMonth(prev => prev.add(1, 'month'))} />
        </div>
        <div style={{ color: 'var(--color-text-muted)' }}>
          * Nhấn vào bất kỳ ô nào để nhập/sửa giờ trực tiếp.
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={matrixData}
        loading={isLoading}
        rowKey="key"
        scroll={{ x: 'max-content', y: 'calc(100vh - 280px)' }}
        size="small"
        pagination={false}
        bordered
      />
    </div>
  )
}
