import { useState, useMemo } from 'react'
import { Table, DatePicker, Button, Popover, Form, TimePicker, message } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useQuery } from '@tanstack/react-query'
import { useUpsertAttendance } from '../hooks/useAdminAttendance'
import { useEmployees } from '@/features/employees/hooks/useEmployees'
import { adminAttendanceService } from '../services/adminAttendanceService'

// Standalone hook to fetch ALL attendance records in a month (no employee filter)
function useMonthlyAllAttendance(month, year) {
  return useQuery({
    queryKey: ['monthly_all_attendance', month, year],
    queryFn: () => adminAttendanceService.getAllAttendanceInMonth(month, year)
  })
}

export default function AdminTimesheetTab() {
  const [currentMonth, setCurrentMonth] = useState(dayjs())
  const month = currentMonth.month() + 1
  const year = currentMonth.year()
  const daysInMonth = currentMonth.daysInMonth()

  // Dùng useEmployees (đã hoạt động) để lấy danh sách nhân viên
  const { data: employees = [], isLoading: empLoading } = useEmployees()
  
  // Lấy tất cả bản ghi chấm công trong tháng
  const { data: attendanceRecords = [], isLoading: attLoading } = useMonthlyAllAttendance(month, year)
  
  const upsertMutation = useUpsertAttendance()
  const isLoading = empLoading || attLoading

  // Gộp dữ liệu employees + attendance thành matrix format
  const matrixData = useMemo(() => {
    return employees.map(emp => {
      const empRecords = attendanceRecords.filter(r => r.employee_id === emp.id)
      const recordMap = {}
      empRecords.forEach(r => {
        const day = parseInt(r.work_date.split('-')[2], 10)
        recordMap[day] = r
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

  const handleSaveTime = async (employeeId, day, type, timeValue, existingRecord) => {
    try {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      
      // Merge existing times so we don't overwrite the other field
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

  const renderTimeCell = (record, day, type) => {
    const dayRecord = record.records[day] || null
    const timeValue = type === 'in' ? dayRecord?.check_in : dayRecord?.check_out
    const displayTime = timeValue ? dayjs(timeValue).format('HH:mm') : '--'
    
    const content = (
      <Form
        layout="vertical"
        onFinish={(values) => handleSaveTime(record.employee_id, day, type, values.time, dayRecord)}
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
        title={`Giờ ${type === 'in' ? 'vào' : 'ra'} - Ng.${day}/${month}`}
        trigger="click"
        destroyTooltipOnHide
      >
        <div
          style={{
            cursor: 'pointer',
            padding: '2px 4px',
            textAlign: 'center',
            background: timeValue ? 'rgba(16,185,129,0.1)' : 'transparent',
            color: timeValue ? '#059669' : 'var(--color-text-muted)',
            borderRadius: 4,
            fontWeight: timeValue ? 600 : 400,
            fontSize: 12,
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
          <div style={{ fontWeight: 600, fontSize: 13 }}>{record.full_name}</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{record.employee_code}</div>
        </div>
      )
    }
  ]

  for (let i = 1; i <= daysInMonth; i++) {
    const d = dayjs(`${year}-${String(month).padStart(2,'0')}-${String(i).padStart(2,'0')}`)
    const isWeekend = d.day() === 0 || d.day() === 6
    columns.push({
      title: (
        <div style={{ textAlign: 'center', color: isWeekend ? '#ef4444' : 'inherit', fontSize: 11 }}>
          {i}
        </div>
      ),
      key: `day_${i}`,
      children: [
        {
          title: <span style={{ fontSize: 10, color: '#6b7280' }}>Vào</span>,
          key: `in_${i}`,
          width: 56,
          render: (_, record) => renderTimeCell(record, i, 'in')
        },
        {
          title: <span style={{ fontSize: 10, color: '#6b7280' }}>Ra</span>,
          key: `out_${i}`,
          width: 56,
          render: (_, record) => renderTimeCell(record, i, 'out')
        }
      ]
    })
  }

  return (
    <div className="admin-timesheet-container">
      <style>{`
        .timesheet-cell:hover { border-color: #10B981 !important; background: rgba(16,185,129,0.08) !important; }
        .admin-timesheet-container .ant-table-thead > tr > th { padding: 6px 2px !important; text-align: center; }
        .admin-timesheet-container .ant-table-tbody > tr > td { padding: 3px 2px !important; }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Button size="small" icon={<LeftOutlined />} onClick={() => setCurrentMonth(prev => prev.subtract(1, 'month'))} />
          <DatePicker picker="month" value={currentMonth} onChange={val => setCurrentMonth(val || dayjs())} format="MM/YYYY" allowClear={false} />
          <Button size="small" icon={<RightOutlined />} onClick={() => setCurrentMonth(prev => prev.add(1, 'month'))} />
        </div>
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          💡 Nhấn vào ô để chỉnh giờ vào/ra của nhân viên
        </span>
      </div>

      <Table
        columns={columns}
        dataSource={matrixData}
        loading={isLoading}
        rowKey="key"
        scroll={{ x: 'max-content', y: 'calc(100vh - 320px)' }}
        size="small"
        pagination={false}
        bordered
      />
    </div>
  )
}
