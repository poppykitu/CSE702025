import { supabase } from '@/lib/supabaseClient'

/**
 * Service xử lý ghi nhật ký hệ thống (Audit Logging)
 * Theo tiêu chuẩn bảo mật HRM chuyên nghiệp
 */

export const AUDIT_ACTIONS = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  UPDATE_PROFILE: 'UPDATE_PROFILE',
  APPROVE_LEAVE: 'APPROVE_LEAVE',
  REJECT_LEAVE: 'REJECT_LEAVE'
}

/**
 * Ghi lại một hành động nghiệp vụ vào nhật ký audit_logs
 * @param {string} tableName - Tên bảng liên quan (nếu có)
 * @param {string} recordId - ID của bản ghi liên quan (nếu có)
 * @param {string} action - Hành động thực hiện (INSERT, UPDATE, LOGIN, etc.)
 * @param {object} newData - Dữ liệu mới (nếu có)
 * @param {object} oldData - Dữ liệu cũ (nếu có)
 */
export async function logAuditEvent({
  tableName = 'system',
  recordId = '00000000-0000-0000-0000-000000000000',
  action,
  newData = null,
  oldData = null
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    const { error } = await supabase
      .from('audit_logs')
      .insert([{
        table_name: tableName,
        record_id: recordId,
        action: action,
        new_data: newData,
        old_data: oldData,
        performed_by: user.id
      }])

    if (error) {
      console.error('[AuditService] Lỗi khi ghi nhật ký:', error.message)
    }
  } catch (err) {
    console.error('[AuditService] Lỗi hệ thống:', err)
  }
}
