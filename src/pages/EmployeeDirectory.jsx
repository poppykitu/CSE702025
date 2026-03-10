import { useState, useDeferredValue } from 'react'
import { Link } from 'react-router-dom'
import { Button, Typography } from 'antd'
import { UserAddOutlined, TeamOutlined } from '@ant-design/icons'
import { useEmployees } from '@/hooks/useEmployees'
import FilterPanel from '@/components/filter/FilterPanel'
import SearchBar from '@/components/filter/SearchBar'
import EmployeeCard from '@/components/employee/EmployeeCard'
import EmployeeListItem from '@/components/employee/EmployeeListItem'
import ViewToggle from '@/components/common/ViewToggle'
import EmptyState from '@/components/common/EmptyState'
import LoadingState from '@/components/common/LoadingState'
import { DEFAULT_FILTERS, VIEW_MODE } from '@/utils/constants'

const { Title } = Typography

export default function EmployeeDirectory() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [viewMode, setViewMode] = useState(VIEW_MODE.GRID)

  // Debounce search để tránh quá nhiều request
  const deferredFilters = useDeferredValue(filters)
  const { data: employees = [], isLoading, isError } = useEmployees(deferredFilters)

  const handleFilterChange = (newFilters) => setFilters(newFilters)
  const handleSearch = (value) => setFilters(prev => ({ ...prev, search: value }))

  const isStale = filters !== deferredFilters

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)' }}>
      {/* Left: Filter Panel */}
      <FilterPanel filters={filters} onChange={handleFilterChange} />

      {/* Right: Main content */}
      <div style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Content Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--color-border)',
          background: 'var(--color-surface)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}>
          {/* Title + count */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <div style={{
              width: 32, height: 32,
              background: 'var(--color-primary-bg)',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <TeamOutlined style={{ color: 'var(--color-primary)', fontSize: 14 }} />
            </div>
            <div>
              <Title level={5} style={{
                margin: 0, fontSize: 15, fontWeight: 700,
                color: 'var(--color-text-primary)', lineHeight: 1.2,
              }}>
                Danh sách nhân viên
              </Title>
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                {isLoading ? 'Đang tải...' : `${employees.length} nhân viên`}
              </span>
            </div>
          </div>

          {/* Search bar */}
          <div style={{ flex: '0 1 320px' }}>
            <SearchBar
              value={filters.search}
              onChange={handleSearch}
            />
          </div>

          {/* View toggle */}
          <ViewToggle mode={viewMode} onChange={setViewMode} />

          {/* Add button */}
          <Link to="/employees/new">
            <Button type="primary" icon={<UserAddOutlined />} style={{ height: 36 }}>
              Thêm nhân viên
            </Button>
          </Link>
        </div>

        {/* Employee Grid/List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: 24,
          opacity: isStale ? 0.7 : 1,
          transition: 'opacity 0.2s',
        }}>
          {isError ? (
            <EmptyState
              title="Đã xảy ra lỗi"
              description="Không thể tải danh sách nhân viên. Vui lòng thử lại."
            />
          ) : isLoading ? (
            <LoadingState mode={viewMode} />
          ) : employees.length === 0 ? (
            <EmptyState
              title="Không tìm thấy nhân viên"
              description={
                filters.search
                  ? `Không có kết quả cho "${filters.search}". Thử từ khóa khác hoặc xóa bộ lọc.`
                  : 'Chưa có nhân viên nào. Hãy thêm nhân viên đầu tiên!'
              }
              showAddButton={!filters.search}
            />
          ) : viewMode === VIEW_MODE.GRID ? (
            <div
              className="stagger-children"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 16,
              }}
            >
              {employees.map(emp => (
                <EmployeeCard key={emp.id} employee={emp} />
              ))}
            </div>
          ) : (
            <div
              className="stagger-children"
              style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              {/* List header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '6px 20px',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--color-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
              }}>
                <div style={{ flex: '0 0 44px' }} />
                <div style={{ flex: '0 0 220px' }}>Nhân viên</div>
                <div style={{ flex: '0 0 260px' }}>Vị trí / Phòng ban</div>
                <div style={{ flex: '0 0 200px' }}>Liên hệ</div>
                <div style={{ flex: '0 0 160px' }}>Địa điểm</div>
                <div style={{ flex: '0 0 140px' }}>Trạng thái</div>
                <div style={{ marginLeft: 'auto' }} />
              </div>
              {employees.map(emp => (
                <EmployeeListItem key={emp.id} employee={emp} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
