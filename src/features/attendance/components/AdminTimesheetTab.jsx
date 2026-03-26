import { useState, useMemo } from 'react'
import { Table, DatePicker, Button, Popover, Form, TimePicker, message } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import isoweek from 'dayjs/plugin/isoWeek'
import 'dayjs/locale/vi'
import { useDateRangeAllAttendance, useUpsertAttendance } from '../hooks/useAdminAttendance'
import { useEmployees } from '@/features/employees/hooks/useEmployees'

dayjs.extend(isoweek)
dayjs.locale('vi') // Set locale to Vietnamese for week formatting

export default function AdminTimesheetTab() {
  // Use start of ISO week (Monday)
  const [currentWeekStart, setCurrentWeekStart] = useState(dayjs().startOf('isoWeek'))
  
  const startDateStr = currentWeekStart.format('YYYY-MM-DD')
  const endDateStr = currentWeekStart.add(6, 'day').format('YYYY-MM-DD')

  const { data: employees = [], isLoading: empLoading } = useEmployees()
  
  // Lấy dữ liệu 7 ngày theo tuần đã chọn
  const { data: attendanceRecords = [], isLoading: attLoading } = useDateRangeAllAttendance(startDateStr, endDateStr)
  
  const upsertMutation = useUpsertAttendance()
  const isLoading = empLoading || attLoading

  // Gộp dữ liệu: map key là "YYYY-MM-DD" thay vì day number để đề phòng tuần vắt ngang 2 tháng
  const matrixData = useMemo(() => {
    return employees.map(emp => {
      const empRecords = attendanceRecords.filter(r => r.employee_id === emp.id)
      const recordMap = {}
      empRecords.forEach(r => {
        recordMap[r.work_date] = r
      })
      return {
        key: emp.id,
        employee_id: emp.id,
        employee_code: emp.employee_id,
        full_name: emp.full_name,
        records: recordMap
      }
    })
  }, [employees, attendanceRecords])

  const handleSaveTime = async (employeeId, dateStr, type, timeValue, existingRecord) => {
    try {
      let checkIn = existingRecord?.check_in || null
      let checkOut = existingRecord?.check_out || null

      if (type === 'in') {
        checkIn = timeValue ? dayjs(`${dateStr} ${timeValue.format('HH:mm:ss')}`).toISOString() : null
      } else {
        checkOut = timeValue ? dayjs(`${dateStr} ${timeValue.format('HH:mm:ss')}`).toISOString() : null
      }

      await upsertMutation.mutateAsync({
        id: existingRecord?.id,
        employee_id: employeeId,
        work_date: dateStr,
        check_in: checkIn,
        check_out: checkOut,
        status: 'present'
      })
      message.success('Đã lưu giờ chấm công')
    } catch (err) { /* Handled in mutation */ }
  }

  const renderTimeCell = (record, dateStr, type) => {
    const dayRecord = record.records[dateStr] || null
    const timeValue = type === 'in' ? dayRecord?.check_in : dayRecord?.check_out
    const displayTime = timeValue ? dayjs(timeValue).format('HH:mm') : '--'
    
    const d = dayjs(dateStr)
    const displayDate = d.format('DD/MM')

    const content = (
      <Form
        layout="vertical"
        onFinish={(values) => handleSaveTime(record.employee_id, dateStr, type, values.time, dayRecord)}
      >
        <Form.Item name="time" initialValue={timeValue ? dayjs(timeValue) : null}>
          <TimePicker format="HH:mm" style={{ width: 120 }} />
        </Form.Item>
        <Button type="primary" htmlType="submit" size="small" loading={upsertMutation.isPending} block>
          Lưu
        </Button>
      </Form>
    )

    return (
      <Popover
        content={content}
        title={`Giờ ${type === 'in' ? 'vào' : 'ra'} - Ng.${displayDate}`}
        trigger="click"
        destroyTooltipOnHide
      >
        <div
          style={{
            cursor: 'pointer',
            padding: '4px',
            textAlign: 'center',
            background: timeValue ? 'rgba(16,185,129,0.1)' : 'transparent',
            color: timeValue ? '#059669' : 'var(--color-text-muted)',
            borderRadius: 4,
            fontWeight: timeValue ? 600 : 400,
            fontSize: 13,
            border: '1px solid transparent',
            minWidth: 44,
          }}
          className="timesheet-cell"
        >
          {displayTime}
        </div>
      </Popover>
    )
  }

  // Build dynamic columns
  const columns = [
    {
      title: 'Nhân viên',
      key: 'employee',
      fixed: 'left',
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{record.full_name}</div>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{record.employee_code}</div>
        </div>
      )
    }
  ]

  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

  for (let i = 0; i < 7; i++) {
    const d = currentWeekStart.add(i, 'day')
    const dateStr = d.format('YYYY-MM-DD')
    const isWeekend = d.day() === 0 || d.day() === 6
    const dayName = dayNames[d.day()]
    
    columns.push({
      title: (
        <div style={{ textAlign: 'center', color: isWeekend ? '#ef4444' : 'inherit' }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>{dayName}</div>
          <div style={{ fontSize: 11, fontWeight: 'normal', marginTop: 2 }}>{d.format('DD/MM')}</div>
        </div>
      ),
      key: `day_${i}`,
      children: [
        {
          title: <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 'normal' }}>Vào</span>,
          key: `in_${i}`,
          width: 60,
          render: (_, record) => renderTimeCell(record, dateStr, 'in')
        },
        {
          title: <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 'normal' }}>Ra</span>,
          key: `out_${i}`,
          width: 60,
          render: (_, record) => renderTimeCell(record, dateStr, 'out')
        }
      ]
    })
  }

  // Calculate week label for display
  const displayWeekRange = `${currentWeekStart.format('DD/MM/YYYY')} - ${currentWeekStart.add(6, 'day').format('DD/MM/YYYY')}`

  return (
    <div className="admin-timesheet-container">
      <style>{`
        .timesheet-cell:hover { border-color: #10B981 !important; background: rgba(16,185,129,0.08) !important; }
        .admin-timesheet-container .ant-table-thead > tr > th { padding: 8px 4px !important; text-align: center; }
        .admin-timesheet-container .ant-table-tbody > tr > td { padding: 4px !important; }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button icon={<LeftOutlined />} onClick={() => setCurrentWeekStart(prev => prev.subtract(1, 'week').startOf('isoWeek'))} />
          
          <div style={{ position: 'relative' }}>
            {/* We overlay text to show formatted range and hide the datepicker's input but keep its functionality */}
            <DatePicker 
              picker="week" 
              value={currentWeekStart} 
              onChange={val => setCurrentWeekStart((val || dayjs()).startOf('isoWeek'))} 
              allowClear={false}
              style={{ width: 220 }}
            />
          </div>

          <Button icon={<RightOutlined />} onClick={() => setCurrentWeekStart(prev => prev.add(1, 'week').startOf('isoWeek'))} />
        </div>
        <span style={{ fontSize: 13, color: 'var(--color-text-muted)', background: '#F8FAFC', padding: '6px 12px', borderRadius: 6, border: '1px solid #E2E8F0' }}>
          💡 Đang xem tuần: <strong>{displayWeekRange}</strong>. Nhấn vào ô để nhập giờ.
        </span>
      </div>

      <Table
        columns={columns}
        dataSource={matrixData}
        loading={isLoading}
        rowKey="key"
        scroll={{ x: 'max-content', y: 'calc(100vh - 320px)' }}
        size="middle"
        pagination={false}
        bordered
      />
    </div>
  )
}
