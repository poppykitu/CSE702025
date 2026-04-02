import { useState } from 'react'
import {
  Table, Button, Select, Tag, Tabs, Statistic, Row, Col, Card,
  Tooltip, message, Modal, Spin, Typography, Alert, Divider, Badge, Drawer, Timeline, Progress
} from 'antd'
import {
  DollarOutlined, CalculatorOutlined, CheckCircleOutlined,
  TeamOutlined, ClockCircleOutlined, WarningOutlined,
  EyeOutlined, ArrowUpOutlined, ArrowDownOutlined, InfoCircleOutlined, ReloadOutlined
} from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/features/auth/context/AuthContext'

const { Title, Text } = Typography
const { Option } = Select

const currencyFmt = (val) =>
  val == null ? '—' : Number(val).toLocaleString('vi-VN') + ' ₫'

const STATUS_CONFIG = {
  draft:    { label: 'Nháp',       color: 'default'  },
  approved: { label: 'Đã duyệt',   color: 'success'  },
  paid:     { label: 'Đã trả',     color: 'blue'     },
}

// ─── Hook: Lấy payroll records theo tháng/năm ─────────────────────────────
function usePayrollRecords(month, year) {
  return useQuery({
    queryKey: ['payroll_records', month, year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll_records')
        .select(`
          *,
          employee:profiles!employee_id(
            id, full_name, employee_id, base_salary, allowance,
            departments!department_id(name)
          )
        `)
        .eq('month', month)
        .eq('year', year)
        .order('employee_id')
      if (error) throw error
      return data
    },
    enabled: !!month && !!year,
  })
}

// ─── Hook: Lấy tất cả nhân viên active ────────────────────────────────────
function useActiveEmployees() {
  return useQuery({
    queryKey: ['active_employees_payroll'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, employee_id, base_salary, allowance, work_schedule')
        .eq('status', 'active')
        .order('full_name')
      if (error) {
        console.error('[useActiveEmployees] error:', error)
        throw error
      }
      console.log('[useActiveEmployees] count:', data?.length)
      return data || []
    },
  })
}

// ─── Modal: Xem chi tiết lương dự kiến ────────────────────────────────────
function PayrollDetailModal({ open, onClose, employee, month, year }) {
  const now = dayjs()
  const startDate = dayjs(`${year}-${String(month).padStart(2, '0')}-01`).format('YYYY-MM-DD')
  // Nếu là tháng hiện tại → chỉ tính đến hôm nay; tháng khác → tính đến cuối tháng
  const isCurrentMonth = now.month() + 1 === month && now.year() === year
  const endDate = isCurrentMonth
    ? now.format('YYYY-MM-DD')
    : dayjs(`${year}-${String(month).padStart(2, '0')}-01`).endOf('month').format('YYYY-MM-DD')

  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['attendance_detail', employee?.employee_id, month, year],
    queryFn: async () => {
      if (!employee?.employee_id) return []
      // Lấy attendance records
      const { data: records, error } = await supabase
        .from('attendance_records')
        .select(`
          *,
          penalties:attendance_penalties(*)
        `)
        .eq('employee_id', employee?.employee_id)
        .gte('work_date', startDate)
        .lte('work_date', endDate)
        .order('work_date', { ascending: true })
      if (error) throw error
      return records
    },
    enabled: open && !!employee?.employee_id,
  })

  const records = attendanceData || []

  // Tổng hợp
  const daysPresent = records.filter(r => ['present', 'late', 'early_leave'].includes(r.status)).length
  const daysAbsent  = records.filter(r => r.status === 'absent').length
  const daysLeave   = records.filter(r => r.status === 'leave').length
  const lateTimes   = records.filter(r => r.penalties?.some(p => p.penalty_type === 'late'))
  const earlyTimes  = records.filter(r => r.penalties?.some(p => p.penalty_type === 'early_leave'))
  const totalPenalty = records.reduce((s, r) =>
    s + (r.penalties || []).reduce((ps, p) => ps + Number(p.penalty_amount || 0), 0), 0)

  const baseSalary  = Number(employee?.employee?.base_salary || employee?.base_salary || 0)
  const allowance   = Number(employee?.employee?.allowance  || employee?.allowance  || 0)
  const dailyRate   = (baseSalary + allowance) / 26
  const absDeduct   = daysAbsent * dailyRate
  const netExpected = Math.max(0, baseSalary + allowance - absDeduct - totalPenalty)

  const PENALTY_BRACKET_LABEL = (bracket) => `${bracket} phút (${bracket / 15} mốc × 25.000₫)`

  // Timeline chi tiết phạt
  const penaltyItems = []
  records.forEach(r => {
    ;(r.penalties || []).forEach(p => {
      penaltyItems.push({
        key: p.id,
        date: r.work_date,
        type: p.penalty_type,
        minutes: p.minutes_diff,
        bracket: p.bracket,
        amount: p.penalty_amount,
      })
    })
  })

  const penaltyColumns = [
    {
      title: 'Ngày', dataIndex: 'date', key: 'date', width: 100,
      render: d => dayjs(d).format('DD/MM/YYYY'),
    },
    {
      title: 'Loại', dataIndex: 'type', key: 'type', width: 100,
      render: t => t === 'late'
        ? <Tag color="orange" icon={<ArrowUpOutlined />}>Đến muộn</Tag>
        : <Tag color="blue" icon={<ArrowDownOutlined />}>Về sớm</Tag>,
    },
    {
      title: 'Thực tế', dataIndex: 'minutes', key: 'minutes', width: 90, align: 'center',
      render: m => <span style={{ fontFamily: 'monospace' }}>{m} phút</span>,
    },
    {
      title: 'Mốc phạt', dataIndex: 'bracket', key: 'bracket', width: 90, align: 'center',
      render: b => <Tag color="red">{b} phút</Tag>,
    },
    {
      title: 'Tiền phạt', dataIndex: 'amount', key: 'amount', align: 'right',
      render: v => <span style={{ fontFamily: 'monospace', color: '#EF4444', fontWeight: 700 }}>-{currencyFmt(v)}</span>,
    },
  ]

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={580}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--color-primary-bg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarOutlined style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{employee?.employee?.full_name}</div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>
              {employee?.employee?.employee_id} • Tháng {month}/{year}
              {isCurrentMonth && <Tag color="blue" style={{ marginLeft: 6, fontSize: 10 }}>Đến {now.format('DD/MM')}</Tag>}
            </div>
          </div>
        </div>
      }
      styles={{ body: { padding: '16px 24px' } }}
    >
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Thẻ tổng quan chấm công */}
          <Row gutter={[10, 10]}>
            {[
              { label: 'Có mặt', value: daysPresent, color: '#10B981', bg: '#F0FDF4' },
              { label: 'Vắng (trừ lương)', value: daysAbsent, color: '#EF4444', bg: '#FFF1F2' },
              { label: 'Nghỉ phép', value: daysLeave, color: '#6366F1', bg: '#EEF2FF' },
              { label: 'Số lần đến muộn', value: lateTimes.length, color: '#F97316', bg: '#FFF7ED' },
              { label: 'Số lần về sớm', value: earlyTimes.length, color: '#0EA5E9', bg: '#F0F9FF' },
            ].map((item) => (
              <Col span={8} key={item.label}>
                <div style={{ background: item.bg, borderRadius: 10, padding: '10px 14px',
                  border: `1px solid ${item.color}22` }}>
                  <div style={{ fontSize: 11, color: '#64748B', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: item.color }}>{item.value}</div>
                </div>
              </Col>
            ))}
          </Row>

          <Divider style={{ margin: '4px 0' }} />

          {/* Tính lương dự kiến */}
          <div style={{ background: '#F8FAFC', borderRadius: 12, padding: '16px 18px',
            border: '1px solid var(--color-border)' }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 14, display: 'flex',
              alignItems: 'center', gap: 6, color: 'var(--color-text-primary)' }}>
              <InfoCircleOutlined style={{ color: 'var(--color-primary)' }} />
              Tính lương dự kiến {isCurrentMonth ? `(đến ngày ${now.format('DD/MM/YYYY')})` : `tháng ${month}/${year}`}
            </div>

            {[
              { label: 'Lương cơ bản', value: baseSalary, color: '#0F172A', prefix: '' },
              { label: 'Phụ cấp', value: allowance, color: '#6366F1', prefix: '+ ' },
              { label: `Trừ ${daysAbsent} ngày vắng (${currencyFmt(Math.round(dailyRate))}/ngày)`, value: -absDeduct, color: '#F97316', prefix: '- ', show: daysAbsent > 0 },
              { label: `Phạt đi muộn/về sớm (${penaltyItems.length} lần)`, value: -totalPenalty, color: '#EF4444', prefix: '- ', show: totalPenalty > 0 },
            ].map((row, i) => (
              (row.show !== false) && (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between',
                  padding: '7px 0', borderBottom: '1px dashed #E2E8F0', fontSize: 13 }}>
                  <span style={{ color: '#64748B' }}>{row.label}</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, color: row.color }}>
                    {row.prefix}{currencyFmt(Math.abs(row.value))}
                  </span>
                </div>
              )
            ))}

            <div style={{ display: 'flex', justifyContent: 'space-between',
              paddingTop: 12, marginTop: 4,  fontSize: 16 }}>
              <span style={{ fontWeight: 800 }}>= Dự kiến thực nhận</span>
              <span style={{ fontFamily: 'monospace', fontWeight: 900, color: '#10B981', fontSize: 18 }}>
                {currencyFmt(netExpected)}
              </span>
            </div>
          </div>

          {/* Chi tiết phạt */}
          {penaltyItems.length > 0 && (
            <>
              <Divider orientation="left" style={{ margin: '0', fontSize: 12,
                color: '#EF4444', fontWeight: 700 }}>
                Chi tiết vi phạm ({penaltyItems.length} lần • -{currencyFmt(totalPenalty)})
              </Divider>
              <Table
                columns={penaltyColumns}
                dataSource={penaltyItems}
                rowKey="key"
                size="small"
                pagination={false}
                style={{ fontSize: 12 }}
              />
              <div style={{ fontSize: 11, color: '#94A3B8', textAlign: 'right' }}>
                * Mỗi mốc 15 phút = 25.000 ₫. Làm tròn lên mốc gần nhất.
              </div>
            </>
          )}

          {penaltyItems.length === 0 && records.length > 0 && (
            <Alert message="Không có vi phạm đi muộn/về sớm trong kỳ này 🎉" type="success" showIcon />
          )}
          {records.length === 0 && (
            <Alert message="Chưa có dữ liệu chấm công cho kỳ này." type="warning" showIcon />
          )}
        </div>
      )}
    </Drawer>
  )
}

// ─── Tab 1: Bảng lương tháng ──────────────────────────────────────────────
function PayrollListTab({ profile }) {
  const now = dayjs()
  const [month, setMonth] = useState(now.month() + 1)
  const [year, setYear] = useState(now.year())
  const [detailRecord, setDetailRecord] = useState(null)
  const queryClient = useQueryClient()

  const { data: records = [], isLoading } = usePayrollRecords(month, year)

  const approveMutation = useMutation({
    mutationFn: async ({ employee_id }) => {
      const { error } = await supabase.rpc('approve_payroll_record', {
        p_employee_id: employee_id,
        p_month: month,
        p_year: year,
        p_approved_by: profile?.id,
      })
      if (error) throw error
    },
    onSuccess: () => {
      message.success('Đã duyệt phiếu lương!')
      queryClient.invalidateQueries(['payroll_records', month, year])
    },
    onError: (err) => message.error('Lỗi: ' + err.message),
  })

  // Tổng hợp
  const totalNet = records.reduce((s, r) => s + Number(r.net_salary || 0), 0)
  const totalPenalty = records.reduce((s, r) => s + Number(r.penalty_amount || 0), 0)
  const draftCount = records.filter(r => r.status === 'draft').length

  const columns = [
    {
      title: 'Nhân viên',
      dataIndex: ['employee', 'full_name'],
      key: 'name',
      fixed: 'left',
      width: 180,
      render: (name, row) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{name}</div>
          <div style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>
            {row.employee?.employee_id}
          </div>
        </div>
      ),
    },
    { title: 'Phòng ban', dataIndex: ['employee', 'department', 'name'], key: 'dept', width: 130 },
    {
      title: 'Công chuẩn', dataIndex: 'working_days_standard', key: 'std',
      width: 90, align: 'center',
      render: v => <Tag color="blue">{v} ngày</Tag>
    },
    {
      title: 'Có mặt', dataIndex: 'days_present', key: 'present',
      width: 80, align: 'center',
      render: v => <span style={{ color: '#10B981', fontWeight: 700 }}>{v}</span>
    },
    {
      title: 'Vắng', dataIndex: 'days_absent', key: 'absent',
      width: 70, align: 'center',
      render: v => v > 0 ? <span style={{ color: '#EF4444', fontWeight: 700 }}>{v}</span> : <span style={{ color: '#94A3B8' }}>0</span>
    },
    {
      title: 'Lương CB', dataIndex: 'base_salary', key: 'base',
      width: 130, align: 'right',
      render: v => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{currencyFmt(v)}</span>
    },
    {
      title: 'Phụ cấp', dataIndex: 'allowance', key: 'allow',
      width: 110, align: 'right',
      render: v => <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#6366F1' }}>{currencyFmt(v)}</span>
    },
    {
      title: 'Tiền phạt', dataIndex: 'penalty_amount', key: 'penalty',
      width: 110, align: 'right',
      render: v => v > 0
        ? <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#EF4444' }}>-{currencyFmt(v)}</span>
        : <span style={{ color: '#94A3B8' }}>0 ₫</span>
    },
    {
      title: 'Khấu trừ vắng', dataIndex: 'deduction_absence', key: 'deduct',
      width: 130, align: 'right',
      render: v => v > 0
        ? <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#F97316' }}>-{currencyFmt(v)}</span>
        : <span style={{ color: '#94A3B8' }}>0 ₫</span>
    },
    {
      title: 'Thực nhận',
      dataIndex: 'net_salary', key: 'net',
      width: 140, align: 'right', fixed: 'right',
      render: v => (
        <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 13, color: '#10B981' }}>
          {currencyFmt(v)}
        </span>
      )
    },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status',
      width: 100, align: 'center', fixed: 'right',
      render: (s) => <Tag color={STATUS_CONFIG[s]?.color}>{STATUS_CONFIG[s]?.label}</Tag>
    },
    {
      title: '',
      key: 'action', width: 120, align: 'center', fixed: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          <Tooltip title="Xem lương dự kiến">
            <Button
              size="small" icon={<EyeOutlined />}
              onClick={(e) => { e.stopPropagation(); setDetailRecord(row) }}
            />
          </Tooltip>
          {row.status === 'draft' && (
            <Tooltip title="Duyệt phiếu lương">
              <Button
                size="small" type="primary" ghost
                icon={<CheckCircleOutlined />}
                onClick={(e) => { e.stopPropagation(); approveMutation.mutate({ employee_id: row.employee_id }) }}
                loading={approveMutation.isLoading}
              />
            </Tooltip>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      {/* Bộ lọc tháng/năm */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <Text strong>Xem bảng lương tháng:</Text>
        <Select value={month} onChange={setMonth} style={{ width: 100 }}>
          {Array.from({ length: 12 }, (_, i) => (
            <Option key={i + 1} value={i + 1}>Tháng {i + 1}</Option>
          ))}
        </Select>
        <Select value={year} onChange={setYear} style={{ width: 90 }}>
          {[2023, 2024, 2025, 2026].map(y => <Option key={y} value={y}>{y}</Option>)}
        </Select>
        <Button 
          icon={<ReloadOutlined />} 
          loading={isLoading}
          onClick={() => queryClient.invalidateQueries(['payroll_records', month, year])}
        >
          Làm mới
        </Button>
        <div style={{ marginLeft: 'auto' }}>
          <Text style={{ fontSize: 12, color: '#94A3B8' }}>
            {records.length} phiếu • {draftCount} chờ duyệt
          </Text>
        </div>
      </div>

      {/* Tổng hợp */}
      {records.length > 0 && (
        <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
          <Col xs={12} md={6}>
            <Card size="small" style={{ borderRadius: 10 }}>
              <Statistic title="Tổng lương thực nhận" value={totalNet} formatter={v => currencyFmt(v)}
                valueStyle={{ color: '#10B981', fontSize: 16, fontWeight: 800 }} />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card size="small" style={{ borderRadius: 10 }}>
              <Statistic title="Tổng tiền phạt" value={totalPenalty} formatter={v => currencyFmt(v)}
                valueStyle={{ color: '#EF4444', fontSize: 16 }} />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card size="small" style={{ borderRadius: 10 }}>
              <Statistic title="Số nhân viên" value={records.length} suffix="người"
                valueStyle={{ fontSize: 16 }} />
            </Card>
          </Col>
          <Col xs={12} md={6}>
            <Card size="small" style={{ borderRadius: 10 }}>
              <Statistic title="Chờ duyệt" value={draftCount} suffix="phiếu"
                valueStyle={{ color: draftCount > 0 ? '#F97316' : '#10B981', fontSize: 16 }} />
            </Card>
          </Col>
        </Row>
      )}

      <Table
        columns={columns}
        dataSource={records}
        rowKey="id"
        loading={isLoading}
        size="small"
        scroll={{ x: 1450 }}
        pagination={false}
        onRow={(record) => ({
          onClick: () => setDetailRecord(record),
          style: { cursor: 'pointer' },
        })}
        locale={{ emptyText: 'Chưa có bảng lương cho tháng này. Vào tab "Tạo bảng lương" để tính.' }}
      />

      <PayrollDetailModal
        open={!!detailRecord}
        onClose={() => setDetailRecord(null)}
        employee={detailRecord}
        month={month}
        year={year}
      />
    </div>
  )
}

// ─── Tab 2: Tạo bảng lương ────────────────────────────────────────────────
function GeneratePayrollTab({ profile }) {
  const now = dayjs()
  const [month, setMonth] = useState(now.month() + 1)
  const [year, setYear] = useState(now.year())
  const [preview, setPreview] = useState([])
  const [calculating, setCalculating] = useState(false)
  const [saving, setSaving] = useState(false)
  const queryClient = useQueryClient()

  const { data: employees = [] } = useActiveEmployees()

  const handleCalculate = async () => {
    if (employees.length === 0) {
      message.warning('Không có nhân viên nào đang hoạt động.')
      return
    }
    setCalculating(true)
    setPreview([])
    try {
      const results = []
      for (const emp of employees) {
        const { data, error } = await supabase.rpc('calculate_monthly_payroll', {
          p_employee_id: emp.id,
          p_month: month,
          p_year: year,
          p_generated_by: profile?.id,
        })
        if (error) {
          results.push({ ...emp, error: error.message })
        } else {
          results.push({ ...data, full_name: emp.full_name })
        }
      }
      setPreview(results)
      message.success(`Đã tính xong ${results.length} phiếu lương. Xem preview bên dưới.`)
    } catch (err) {
      message.error('Lỗi: ' + err.message)
    } finally {
      setCalculating(false)
    }
  }

  const previewColumns = [
    {
      title: 'Nhân viên', dataIndex: 'full_name', key: 'name', width: 160,
      render: (name) => <div style={{ fontWeight: 600 }}>{name}</div>
    },
    { title: 'Có mặt', dataIndex: 'days_present', key: 'p', width: 80, align: 'center',
      render: v => <span style={{ color: '#10B981', fontWeight: 700 }}>{v ?? '—'}</span> },
    { title: 'Vắng', dataIndex: 'days_absent', key: 'a', width: 70, align: 'center',
      render: v => v > 0 ? <span style={{ color: '#EF4444', fontWeight: 700 }}>{v}</span> : 0 },
    { title: 'Lương CB', dataIndex: 'base_salary', key: 'b', width: 130, align: 'right',
      render: v => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{currencyFmt(v)}</span> },
    { title: 'Phụ cấp', dataIndex: 'allowance', key: 'al', width: 110, align: 'right',
      render: v => <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#6366F1' }}>{currencyFmt(v)}</span> },
    { title: 'Phạt', dataIndex: 'penalty_amount', key: 'pen', width: 110, align: 'right',
      render: v => v > 0 ? <span style={{ color: '#EF4444', fontFamily: 'monospace', fontSize: 12 }}>-{currencyFmt(v)}</span> : <span style={{ color: '#94A3B8' }}>0 ₫</span> },
    { title: 'Khấu trừ', dataIndex: 'deduction_absence', key: 'ded', width: 120, align: 'right',
      render: v => v > 0 ? <span style={{ color: '#F97316', fontFamily: 'monospace', fontSize: 12 }}>-{currencyFmt(v)}</span> : <span style={{ color: '#94A3B8' }}>0 ₫</span> },
    {
      title: 'Thực nhận (dự kiến)', dataIndex: 'net_salary', key: 'net', width: 160, align: 'right',
      render: v => <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 14, color: '#10B981' }}>{currencyFmt(v)}</span>
    },
  ]

  const totalNetPreview = preview.reduce((s, r) => s + Number(r.net_salary || 0), 0)

  return (
    <div>
      <Alert
        message="Mỗi lần tính lại sẽ ghi đè phiếu cũ (nếu đã tồn tại dạng nháp). Phiếu đã duyệt sẽ KHÔNG bị ghi đè."
        type="info" showIcon style={{ marginBottom: 20 }}
      />

      {/* Chọn tháng + nút tính */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24,
        padding: '16px 20px', background: 'var(--color-surface)', borderRadius: 12,
        border: '1px solid var(--color-border)' }}>
        <CalculatorOutlined style={{ fontSize: 22, color: 'var(--color-primary)' }} />
        <Text strong style={{ fontSize: 15 }}>Tính lương tháng:</Text>
        <Select value={month} onChange={setMonth} style={{ width: 100 }}>
          {Array.from({ length: 12 }, (_, i) => (
            <Option key={i + 1} value={i + 1}>Tháng {i + 1}</Option>
          ))}
        </Select>
        <Select value={year} onChange={setYear} style={{ width: 90 }}>
          {[2024, 2025, 2026].map(y => <Option key={y} value={y}>{y}</Option>)}
        </Select>
        <Button
          type="primary"
          icon={<CalculatorOutlined />}
          loading={calculating}
          onClick={handleCalculate}
          style={{ marginLeft: 8, height: 36, fontWeight: 600 }}
        >
          {calculating ? `Đang tính (${employees.length} NV)...` : `Tính lương cho ${employees.length} nhân viên`}
        </Button>
      </div>

      {/* Preview kết quả */}
      {preview.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text strong>
              Kết quả dự kiến — Tháng {month}/{year}
              <Tag color="orange" style={{ marginLeft: 8 }}>Chưa duyệt</Tag>
            </Text>
            <Text style={{ fontSize: 15, fontWeight: 800, color: '#10B981' }}>
              Tổng thực nhận: {currencyFmt(totalNetPreview)}
            </Text>
          </div>
          <Table
            columns={previewColumns}
            dataSource={preview}
            rowKey="employee_id"
            size="small"
            scroll={{ x: 1000 }}
            pagination={false}
          />
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Text style={{ fontSize: 12, color: '#94A3B8' }}>
              💡 Các phiếu đã được lưu dạng nháp. Vào tab "Bảng lương tháng" để xem và phê duyệt từng phiếu.
            </Text>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function PayrollPage() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()

  const handleTabChange = (key) => {
    if (key === 'list') {
      // Tự động làm mới khi người dùng bấm trở lại tab Bảng lương tháng
      queryClient.invalidateQueries(['payroll_records'])
    }
  }

  const tabItems = [
    {
      key: 'list',
      label: <><DollarOutlined /> Bảng lương tháng</>,
      children: <PayrollListTab profile={profile} />,
    },
    {
      key: 'generate',
      label: <><CalculatorOutlined /> Tạo & Tính lương</>,
      children: <GeneratePayrollTab profile={profile} />,
    },
  ]

  return (
    <div style={{ padding: 24, background: 'var(--color-bg)', minHeight: 'calc(100vh - 56px)' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ width: 36, height: 36, background: 'var(--color-primary-bg)', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <DollarOutlined style={{ color: 'var(--color-primary)', fontSize: 18 }} />
          </div>
          <Title level={4} style={{ margin: 0, fontFamily: 'var(--font-title)' }}>Quản lý Bảng lương</Title>
        </div>
        <Text style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
          Tính lương tháng, xem chi tiết phiếu lương và phê duyệt bảng lương toàn công ty.
        </Text>
      </div>

      <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)', padding: '0 24px 24px' }}>
        <Tabs items={tabItems} type="line" size="large" onChange={handleTabChange} />
      </div>
    </div>
  )
}
