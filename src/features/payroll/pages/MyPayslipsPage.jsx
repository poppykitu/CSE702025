import { useState } from 'react'
import { Table, Card, Typography, Statistic, Row, Col, Tag, Descriptions, Divider, Empty } from 'antd'
import { WalletOutlined, DollarOutlined, WarningOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/features/auth/context/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import dayjs from 'dayjs'

const { Text, Title } = Typography

const currencyFmt = (val) =>
  val == null ? '—' : Number(val).toLocaleString('vi-VN') + ' ₫'

const STATUS_CONFIG = {
  draft:    { label: 'Nháp',       color: 'default'  },
  approved: { label: 'Đã duyệt',   color: 'success'  },
  paid:     { label: 'Đã trả',     color: 'blue'     },
}

// ─── Tab cá nhân ────────────────────────────────────────────────────────────
function PersonalPayslipsTab() {
  const { profile } = useAuth()
  const [selectedId, setSelectedId] = useState(null)

  const { data: payslips = [], isLoading } = useQuery({
    queryKey: ['my_payslips', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll_records')
        .select('*')
        .eq('employee_id', profile?.id)
        .in('status', ['approved', 'paid'])
        .order('year', { ascending: false })
        .order('month', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!profile?.id,
  })

  const selected = payslips.find(p => p.id === selectedId) || payslips[0]

  const totalNet = payslips.reduce((s, r) => s + Number(r.net_salary || 0), 0)
  const latestNet = payslips[0]?.net_salary || 0

  if (!isLoading && payslips.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <WalletOutlined style={{ fontSize: 56, color: '#CBD5E1', marginBottom: 16 }} />
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-muted)' }}>
          Chưa có phiếu lương nào
        </div>
        <div style={{ fontSize: 13, color: '#94A3B8', marginTop: 8 }}>
          Phiếu lương sẽ hiển thị tại đây sau khi Admin duyệt bảng lương hàng tháng.
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Tổng quan */}
      <Row gutter={[12, 12]} style={{ marginBottom: 24 }}>
        <Col xs={12} md={8}>
          <Card size="small" style={{ borderRadius: 10, background: '#F0FDF4', border: '1px solid #86EFAC' }}>
            <Statistic
              title={<span style={{ color: '#15803d', fontSize: 12, fontWeight: 600 }}>Lương tháng gần nhất</span>}
              value={latestNet}
              formatter={v => currencyFmt(v)}
              valueStyle={{ color: '#15803d', fontSize: 18, fontWeight: 800 }}
              prefix={<WalletOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} md={8}>
          <Card size="small" style={{ borderRadius: 10 }}>
            <Statistic
              title="Tổng thu nhập (đã duyệt)"
              value={totalNet}
              formatter={v => currencyFmt(v)}
              valueStyle={{ fontSize: 16 }}
            />
          </Card>
        </Col>
        <Col xs={12} md={8}>
          <Card size="small" style={{ borderRadius: 10 }}>
            <Statistic title="Số phiếu lương" value={payslips.length} suffix="phiếu" />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Danh sách phiếu */}
        <Col xs={24} md={8}>
          <Card title="Phiếu lương" size="small" style={{ borderRadius: 12 }}>
            {payslips.map(p => (
              <div
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                style={{
                  padding: '12px 14px',
                  cursor: 'pointer',
                  borderRadius: 8,
                  marginBottom: 6,
                  background: (selected?.id === p.id) ? 'var(--color-primary-bg)' : '#F8FAFC',
                  border: `1px solid ${(selected?.id === p.id) ? 'var(--color-primary)' : 'transparent'}`,
                  transition: 'all 0.15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>
                    Tháng {p.month}/{p.year}
                  </span>
                  <Tag color={STATUS_CONFIG[p.status]?.color} style={{ margin: 0 }}>
                    {STATUS_CONFIG[p.status]?.label}
                  </Tag>
                </div>
                <div style={{ fontFamily: 'monospace', fontWeight: 800, color: '#10B981', marginTop: 4, fontSize: 13 }}>
                  {currencyFmt(p.net_salary)}
                </div>
              </div>
            ))}
          </Card>
        </Col>

        {/* Chi tiết phiếu */}
        <Col xs={24} md={16}>
          {selected ? (
            <Card
              title={<span style={{ fontWeight: 700 }}>Chi tiết phiếu lương — Tháng {selected.month}/{selected.year}</span>}
              extra={<Tag color={STATUS_CONFIG[selected.status]?.color}>{STATUS_CONFIG[selected.status]?.label}</Tag>}
              size="small"
              style={{ borderRadius: 12 }}
            >
              <Descriptions column={2} size="small" style={{ marginBottom: 16 }}>
                <Descriptions.Item label="Công chuẩn">{selected.working_days_standard} ngày</Descriptions.Item>
                <Descriptions.Item label="Ngày có mặt">
                  <span style={{ color: '#10B981', fontWeight: 700 }}>{selected.days_present}</span>
                </Descriptions.Item>
                <Descriptions.Item label="Ngày nghỉ phép">{selected.days_on_leave} ngày</Descriptions.Item>
                <Descriptions.Item label="Ngày vắng">
                  <span style={{ color: selected.days_absent > 0 ? '#EF4444' : 'inherit', fontWeight: selected.days_absent > 0 ? 700 : 400 }}>
                    {selected.days_absent} ngày
                  </span>
                </Descriptions.Item>
              </Descriptions>

              <Divider style={{ margin: '12px 0' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Lương cơ bản</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{currencyFmt(selected.base_salary)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Phụ cấp</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#6366F1' }}>+{currencyFmt(selected.allowance)}</span>
                </div>
                {selected.deduction_absence > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Trừ ngày vắng ({selected.days_absent} ngày)</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#F97316' }}>-{currencyFmt(selected.deduction_absence)}</span>
                  </div>
                )}
                {selected.penalty_amount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Phạt đi muộn/về sớm</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#EF4444' }}>-{currencyFmt(selected.penalty_amount)}</span>
                  </div>
                )}

                <Divider style={{ margin: '8px 0' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18 }}>
                  <span style={{ fontWeight: 800, color: 'var(--color-text-primary)' }}>Thực nhận</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 900, color: '#10B981' }}>
                    {currencyFmt(selected.net_salary)}
                  </span>
                </div>
              </div>

              {selected.notes && (
                <div style={{ marginTop: 16, padding: '10px 14px', background: '#F8FAFC', borderRadius: 8, fontSize: 12, color: '#64748B' }}>
                  📝 {selected.notes}
                </div>
              )}
            </Card>
          ) : (
            <Card size="small" style={{ borderRadius: 12, textAlign: 'center', padding: '40px 0' }}>
              <Empty description="Chọn tháng để xem chi tiết" />
            </Card>
          )}
        </Col>
      </Row>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function MyPayslipsPage() {
  return (
    <div style={{ padding: 24, background: 'var(--color-bg)', minHeight: 'calc(100vh - 56px)' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <div style={{ width: 36, height: 36, background: '#F0FDF4', borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <WalletOutlined style={{ color: '#10B981', fontSize: 18 }} />
          </div>
          <Title level={4} style={{ margin: 0, fontFamily: 'var(--font-title)' }}>Phiếu lương của tôi</Title>
        </div>
        <Text style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>
          Xem chi tiết thu nhập và lịch sử phiếu lương hàng tháng.
        </Text>
      </div>

      <PersonalPayslipsTab />
    </div>
  )
}
