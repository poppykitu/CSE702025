import { InboxOutlined, UserAddOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { Link } from 'react-router-dom'

export default function EmptyState({
  title = 'Không tìm thấy nhân viên',
  description = 'Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.',
  showAddButton = false,
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px 24px',
      textAlign: 'center',
    }}>
      <div style={{
        width: 72,
        height: 72,
        borderRadius: '50%',
        background: 'var(--color-bg)',
        border: '2px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
      }}>
        <InboxOutlined style={{ fontSize: 28, color: 'var(--color-text-muted)' }} />
      </div>
      <div style={{
        fontSize: 16, fontWeight: 600,
        color: 'var(--color-text-primary)',
        marginBottom: 8,
      }}>
        {title}
      </div>
      <div style={{
        fontSize: 14, color: 'var(--color-text-muted)',
        maxWidth: 320, lineHeight: 1.6, marginBottom: 24,
      }}>
        {description}
      </div>
      {showAddButton && (
        <Link to="/employees/new">
          <Button type="primary" icon={<UserAddOutlined />}>
            Thêm nhân viên mới
          </Button>
        </Link>
      )}
    </div>
  )
}
