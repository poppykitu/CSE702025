/**
 * Định nghĩa vai trò và quyền hạn tập trung
 * Hệ thống phân quyền đa cấp (RBAC)
 */

// Các vai trò trong hệ thống
export const ROLES = {
  ADMIN: 'admin',
  HR: 'hr',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
}

// Nhãn tiếng Việt cho từng vai trò
export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Quản trị viên',
  [ROLES.HR]: 'Nhân sự (HR)',
  [ROLES.MANAGER]: 'Quản lý bộ phận',
  [ROLES.EMPLOYEE]: 'Nhân viên',
}

// Màu sắc cho từng vai trò
export const ROLE_COLORS = {
  [ROLES.ADMIN]: { color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  [ROLES.HR]: { color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
  [ROLES.MANAGER]: { color: '#059669', bg: '#ECFDF5', border: '#A7F3D0' },
  [ROLES.EMPLOYEE]: { color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB' },
}

// Thứ tự cấp bậc (số cao = quyền lực lớn hơn)
export const ROLE_HIERARCHY = {
  [ROLES.ADMIN]: 4,
  [ROLES.HR]: 3,
  [ROLES.MANAGER]: 2,
  [ROLES.EMPLOYEE]: 1,
}

// Danh sách quyền hạn
export const PERMISSIONS = {
  // Quản lý nhân viên
  VIEW_ALL_EMPLOYEES: 'view_all_employees',
  VIEW_DEPARTMENT_EMPLOYEES: 'view_department_employees',
  VIEW_OWN_PROFILE: 'view_own_profile',
  CREATE_EMPLOYEE: 'create_employee',
  EDIT_ANY_EMPLOYEE: 'edit_any_employee',
  EDIT_OWN_PROFILE: 'edit_own_profile',
  DELETE_EMPLOYEE: 'delete_employee',
  TERMINATE_EMPLOYEE: 'terminate_employee',
  EDIT_SALARY: 'edit_salary',

  // Quản lý phòng ban
  VIEW_DEPARTMENTS: 'view_departments',
  MANAGE_DEPARTMENTS: 'manage_departments',

  // Nghỉ phép
  SUBMIT_LEAVE_REQUEST: 'submit_leave_request',
  APPROVE_LEAVE: 'approve_leave',
  VIEW_ALL_LEAVES: 'view_all_leaves',
  VIEW_DEPARTMENT_LEAVES: 'view_department_leaves',
  NOTE_LEAVE_HR: 'note_leave_hr',

  // Hệ thống
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_ADMIN_PANEL: 'view_admin_panel',
  MANAGE_SYSTEM_CONFIG: 'manage_system_config',
}

// Map role -> danh sách quyền
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    PERMISSIONS.VIEW_ALL_EMPLOYEES,
    PERMISSIONS.VIEW_DEPARTMENT_EMPLOYEES,
    PERMISSIONS.VIEW_OWN_PROFILE,
    PERMISSIONS.CREATE_EMPLOYEE,
    PERMISSIONS.EDIT_ANY_EMPLOYEE,
    PERMISSIONS.EDIT_OWN_PROFILE,
    PERMISSIONS.DELETE_EMPLOYEE,
    PERMISSIONS.TERMINATE_EMPLOYEE,
    PERMISSIONS.EDIT_SALARY,
    PERMISSIONS.VIEW_DEPARTMENTS,
    PERMISSIONS.MANAGE_DEPARTMENTS,
    PERMISSIONS.SUBMIT_LEAVE_REQUEST,
    PERMISSIONS.APPROVE_LEAVE,
    PERMISSIONS.VIEW_ALL_LEAVES,
    PERMISSIONS.VIEW_DEPARTMENT_LEAVES,
    PERMISSIONS.NOTE_LEAVE_HR,
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_ADMIN_PANEL,
    PERMISSIONS.MANAGE_SYSTEM_CONFIG,
  ],
  [ROLES.HR]: [
    PERMISSIONS.VIEW_ALL_EMPLOYEES,
    PERMISSIONS.VIEW_DEPARTMENT_EMPLOYEES,
    PERMISSIONS.VIEW_OWN_PROFILE,
    PERMISSIONS.CREATE_EMPLOYEE,
    PERMISSIONS.EDIT_ANY_EMPLOYEE,
    PERMISSIONS.EDIT_OWN_PROFILE,
    PERMISSIONS.TERMINATE_EMPLOYEE,
    PERMISSIONS.EDIT_SALARY,
    PERMISSIONS.VIEW_DEPARTMENTS,
    PERMISSIONS.MANAGE_DEPARTMENTS,
    PERMISSIONS.SUBMIT_LEAVE_REQUEST,
    PERMISSIONS.VIEW_ALL_LEAVES,
    PERMISSIONS.VIEW_DEPARTMENT_LEAVES,
    PERMISSIONS.NOTE_LEAVE_HR,
    PERMISSIONS.VIEW_DASHBOARD,
  ],
  [ROLES.MANAGER]: [
    PERMISSIONS.VIEW_DEPARTMENT_EMPLOYEES,
    PERMISSIONS.VIEW_OWN_PROFILE,
    PERMISSIONS.EDIT_OWN_PROFILE,
    PERMISSIONS.VIEW_DEPARTMENTS,
    PERMISSIONS.SUBMIT_LEAVE_REQUEST,
    PERMISSIONS.APPROVE_LEAVE,
    PERMISSIONS.VIEW_DEPARTMENT_LEAVES,
  ],
  [ROLES.EMPLOYEE]: [
    PERMISSIONS.VIEW_OWN_PROFILE,
    PERMISSIONS.EDIT_OWN_PROFILE,
    PERMISSIONS.SUBMIT_LEAVE_REQUEST,
  ],
}

// Loại nghỉ phép
export const LEAVE_TYPE_LABELS = {
  annual: 'Nghỉ phép năm',
  sick: 'Nghỉ ốm',
  personal: 'Nghỉ việc riêng',
  maternity: 'Nghỉ thai sản',
  other: 'Khác',
}

export const LEAVE_STATUS_LABELS = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  cancelled: 'Đã hủy',
}

export const LEAVE_STATUS_COLORS = {
  pending: { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  approved: { color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
  rejected: { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  cancelled: { color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB' },
}
