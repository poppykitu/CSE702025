/**
 * Constants & Enums cho toàn bộ app
 */

export const EMPLOYEE_STATUS = {
  ACTIVE: 'active',
  ONBOARDING: 'onboarding',
  TERMINATED: 'terminated',
}

export const EMPLOYEE_STATUS_LABELS = {
  active: 'Đang làm việc',
  onboarding: 'Đang onboarding',
  terminated: 'Đã nghỉ việc',
}

export const EMPLOYEE_STATUS_COLORS = {
  active: { color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
  onboarding: { color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
  terminated: { color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
}

export const WORK_TYPE = {
  FULL_TIME: 'full-time',
  PART_TIME: 'part-time',
  CONTRACT: 'contract',
  INTERN: 'intern',
}

export const WORK_TYPE_LABELS = {
  'full-time': 'Toàn thời gian',
  'part-time': 'Bán thời gian',
  'contract': 'Hợp đồng',
  'intern': 'Thực tập',
}

export const GENDER_LABELS = {
  male: 'Nam',
  female: 'Nữ',
  other: 'Khác',
  prefer_not_to_say: 'Không muốn nêu',
}

export const VIEW_MODE = {
  GRID: 'grid',
  LIST: 'list',
}

export const DEFAULT_FILTERS = {
  search: '',
  departmentIds: [],
  status: 'all',
  workTypes: [],
}

export const PAGE_SIZE = 24
