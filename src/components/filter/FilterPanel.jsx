import { useState, useEffect } from 'react'
import { Checkbox, Radio, Divider, Button, Tooltip, Badge } from 'antd'
import { FilterOutlined, ReloadOutlined } from '@ant-design/icons'
import { useDepartments } from '@/hooks/useDepartments'
import { DEFAULT_FILTERS, EMPLOYEE_STATUS, WORK_TYPE, WORK_TYPE_LABELS, EMPLOYEE_STATUS_LABELS, EMPLOYEE_STATUS_COLORS } from '@/utils/constants'

const FILTER_WIDTH = 252

/**
 * FilterPanel — Sidebar lọc cố định bên trái
 * Includes: search hint, status filter, department filter, work type filter
 */
export default function FilterPanel({ filters, onChange }) {
  const { data: departments = [], isLoading } = useDepartments()

  const activeFilterCount = [
    filters.departmentIds.length > 0,
    filters.status !== 'all',
    filters.workTypes.length > 0,
  ].filter(Boolean).length

  const handleReset = () => onChange(DEFAULT_FILTERS)

  const handleDeptChange = (deptId, checked) => {
    const next = checked
      ? [...filters.departmentIds, deptId]
      : filters.departmentIds.filter(id => id !== deptId)
    onChange({ ...filters, departmentIds: next })
  }

  const handleWorkTypeChange = (wt, checked) => {
    const next = checked
      ? [...filters.workTypes, wt]
      : filters.workTypes.filter(t => t !== wt)
    onChange({ ...filters, workTypes: next })
  }

  return (
    <aside style={{
      width: FILTER_WIDTH,
      flexShrink: 0,
      background: 'var(--color-surface)',
      borderRight: '1px solid var(--color-border)',
      height: 'calc(100vh - 56px)',
      overflowY: 'auto',
      position: 'sticky',
      top: 56,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 16px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        background: 'var(--color-surface)',
        zIndex: 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <FilterOutlined style={{ color: 'var(--color-primary)', fontSize: 13 }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
            Bộ lọc
          </span>
          {activeFilterCount > 0 && (
            <Badge
              count={activeFilterCount}
              style={{ background: 'var(--color-primary)', fontSize: 10, height: 16, lineHeight: '16px', minWidth: 16 }}
            />
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button
            type="text"
            size="small"
            icon={<ReloadOutlined />}
            onClick={handleReset}
            style={{ fontSize: 12, color: 'var(--color-text-muted)', height: 26 }}
          >
            Đặt lại
          </Button>
        )}
      </div>

      <div style={{ padding: '12px 16px', flex: 1, overflowY: 'auto' }}>
        {/* STATUS FILTER */}
        <FilterSection title="Trạng thái">
          <Radio.Group
            value={filters.status}
            onChange={e => onChange({ ...filters, status: e.target.value })}
            style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
          >
            <Radio value="all" style={radioStyle}>
              <span style={radioLabelStyle}>Tất cả</span>
            </Radio>
            {Object.values(EMPLOYEE_STATUS).map(st => {
              const colors = EMPLOYEE_STATUS_COLORS[st]
              return (
                <Radio key={st} value={st} style={radioStyle}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: colors.color, flexShrink: 0,
                    }} />
                    <span style={radioLabelStyle}>{EMPLOYEE_STATUS_LABELS[st]}</span>
                  </span>
                </Radio>
              )
            })}
          </Radio.Group>
        </FilterSection>

        <Divider style={{ margin: '12px 0', borderColor: 'var(--color-border)' }} />

        {/* DEPARTMENT FILTER */}
        <FilterSection title="Phòng ban">
          {isLoading ? (
            <div style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>Đang tải...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {departments.map(dept => (
                <Checkbox
                  key={dept.id}
                  checked={filters.departmentIds.includes(dept.id)}
                  onChange={e => handleDeptChange(dept.id, e.target.checked)}
                  style={{ display: 'flex', alignItems: 'flex-start' }}
                >
                  <span style={{ fontSize: 12, color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                    {dept.name}
                  </span>
                </Checkbox>
              ))}
            </div>
          )}
        </FilterSection>

        <Divider style={{ margin: '12px 0', borderColor: 'var(--color-border)' }} />

        {/* WORK TYPE FILTER */}
        <FilterSection title="Loại hợp đồng">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {Object.entries(WORK_TYPE).map(([, value]) => (
              <Checkbox
                key={value}
                checked={filters.workTypes.includes(value)}
                onChange={e => handleWorkTypeChange(value, e.target.checked)}
              >
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  {WORK_TYPE_LABELS[value]}
                </span>
              </Checkbox>
            ))}
          </div>
        </FilterSection>
      </div>
    </aside>
  )
}

function FilterSection({ title, children }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        color: 'var(--color-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.8px',
        marginBottom: 10,
      }}>
        {title}
      </div>
      {children}
    </div>
  )
}

const radioStyle = { fontSize: 12, lineHeight: 1.5, marginBottom: 0 }
const radioLabelStyle = { fontSize: 12, color: 'var(--color-text-secondary)' }
