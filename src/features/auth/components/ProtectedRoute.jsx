import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/context/AuthContext'
import { usePermission } from '@/features/auth/hooks/usePermission'
import { Spin } from 'antd'

/**
 * Component bao bọc các route cần phân quyền
 * 
 * Props:
 *   allowedRoles: Mảng các role được phép truy cập (vd: ['admin', 'hr'])
 *   requiredPermission: Quyền cụ thể cần có (vd: PERMISSIONS.VIEW_DASHBOARD)
 *   redirectTo: Đường dẫn chuyển hướng khi không có quyền (mặc định: /unauthorized)
 *   children: Component con cần bảo vệ
 * 
 * Sử dụng:
 *   <ProtectedRoute allowedRoles={['admin', 'hr']}>
 *     <DashboardPage />
 *   </ProtectedRoute>
 */
export default function ProtectedRoute({
  children,
  allowedRoles,
  requiredPermission,
  redirectTo = '/unauthorized',
}) {
  const { user, loading } = useAuth()
  const { canAccess, hasPermission } = usePermission()
  const location = useLocation()

  // Đang tải thông tin user
  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--color-bg)',
      }}>
        <Spin size="large" tip="Đang kiểm tra quyền truy cập..." />
      </div>
    )
  }

  // Chưa đăng nhập -> chuyển đến trang Login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Kiểm tra role
  if (allowedRoles && !canAccess(allowedRoles)) {
    return <Navigate to={redirectTo} replace />
  }

  // Kiểm tra permission cụ thể
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to={redirectTo} replace />
  }

  return children
}
