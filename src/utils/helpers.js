import dayjs from 'dayjs'
import 'dayjs/locale/vi'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)
dayjs.locale('vi')

/**
 * Lấy chữ cái đầu từ tên đầy đủ để làm avatar fallback
 * "Nguyễn Văn An" → "NA"
 */
export function getInitials(name = '') {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

/**
 * Format ngày theo định dạng Việt Nam
 */
export function formatDate(date, format = 'DD/MM/YYYY') {
  if (!date) return '—'
  return dayjs(date).format(format)
}

/**
 * Format ngày tương đối: "3 tháng trước"
 */
export function formatRelativeDate(date) {
  if (!date) return '—'
  return dayjs(date).fromNow()
}

/**
 * Tính số năm làm việc
 */
export function calculateTenure(dateOfJoining) {
  if (!dateOfJoining) return null
  const years = dayjs().diff(dayjs(dateOfJoining), 'year')
  const months = dayjs().diff(dayjs(dateOfJoining), 'month') % 12
  if (years === 0) return `${months} tháng`
  if (months === 0) return `${years} năm`
  return `${years} năm ${months} tháng`
}

/**
 * Generate màu avatar từ tên (consistent color per name)
 */
export function getAvatarColor(name = '') {
  const colors = [
    '#2563EB', '#7C3AED', '#059669', '#D97706',
    '#DC2626', '#0891B2', '#7C3AED', '#DB2777',
    '#16A34A', '#EA580C', '#0284C7', '#9333EA',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

/**
 * Chuẩn hóa chuỗi tìm kiếm (bỏ dấu tiếng Việt)
 */
export function normalizeSearch(str = '') {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Tạo employee_id tuần tự từ số
 * generateEmployeeId(42) → "EMP-042"
 */
export function generateEmployeeId(num) {
  return `EMP-${String(num).padStart(3, '0')}`
}

/**
 * Truncate text với ellipsis
 */
export function truncate(str, maxLength = 50) {
  if (!str || str.length <= maxLength) return str
  return str.substring(0, maxLength) + '...'
}
