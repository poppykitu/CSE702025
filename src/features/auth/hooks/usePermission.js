import { useAuth } from '@/features/auth/context/AuthContext'
import { ROLE_PERMISSIONS, ROLE_HIERARCHY } from '@/constants/roles'

/**
 * Custom hook kiem tra quyen truy cap cua nguoi dung hien tai
 * 
 * Su dung:
 *   const { role, hasPermission, canAccess } = usePermission()
 *   if (hasPermission(PERMISSIONS.CREATE_EMPLOYEE)) { ... }
 *   if (canAccess(['admin', 'hr'])) { ... }
 */
export function usePermission() {
  const { profile } = useAuth()
  const role = profile?.role || 'employee'

  // Kiem tra co quyen cu the khong
  const hasPermission = (permission) => {
    const perms = ROLE_PERMISSIONS[role] || []
    return perms.includes(permission)
  }

  // Kiem tra co thuoc cac role duoc phep khong
  const canAccess = (allowedRoles = []) => {
    return allowedRoles.includes(role)
  }

  // Kiem tra role hien tai co cap bac >= role yeu cau khong
  const hasMinRole = (minRole) => {
    return (ROLE_HIERARCHY[role] || 0) >= (ROLE_HIERARCHY[minRole] || 0)
  }

  return {
    role,
    hasPermission,
    canAccess,
    hasMinRole,
    isAdmin: role === 'admin',
    isHR: role === 'hr',
    isManager: role === 'manager',
    isEmployee: role === 'employee',
  }
}
