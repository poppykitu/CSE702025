import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import { logAuditEvent, AUDIT_ACTIONS } from '@/services/auditService'

/**
 * Service xử lý các yêu cầu nghỉ phép
 */

export async function getLeaveRequests() {
  if (!isSupabaseConfigured) return []

  const { data, error } = await supabase
    .from('leave_requests')
    .select(`
      *,
      profiles!employee_id (id, full_name, employee_id),
      departments (id, name)
    `)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function getMyLeaveRequests(employeeId) {
  if (!isSupabaseConfigured || !employeeId) return []

  const { data, error } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function createLeaveRequest(payload) {
  if (!isSupabaseConfigured) return

  const { data, error } = await supabase
    .from('leave_requests')
    .insert([payload])
    .select()
    .single()

  if (error) throw new Error(error.message)

  logAuditEvent({
    tableName: 'leave_requests',
    recordId: data.id,
    action: AUDIT_ACTIONS.CREATE_LEAVE, // Make sure this exists or use a generic one
    newData: payload
  })

  return data
}

export async function approveLeave(id, comment = '') {
  if (!isSupabaseConfigured) return

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('Không thể xác thực người dùng. Vui lòng đăng nhập lại.')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) throw new Error('Không tìm thấy hồ sơ người dùng.')

  const { data, error } = await supabase
    .from('leave_requests')
    .update({
      status: 'approved',
      approved_by: profile.id,
      approved_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)

  logAuditEvent({
    tableName: 'leave_requests',
    recordId: id,
    action: AUDIT_ACTIONS.APPROVE_LEAVE,
    newData: { status: 'approved', comment }
  })

  return data
}

export async function rejectLeave(id, reason = '') {
  if (!isSupabaseConfigured) return

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) throw new Error('Không thể xác thực người dùng. Vui lòng đăng nhập lại.')

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) throw new Error('Không tìm thấy hồ sơ người dùng.')

  const { data, error } = await supabase
    .from('leave_requests')
    .update({
      status: 'rejected',
      reject_reason: reason,
      approved_by: profile.id,
      approved_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)

  logAuditEvent({
    tableName: 'leave_requests',
    recordId: id,
    action: AUDIT_ACTIONS.REJECT_LEAVE,
    newData: { status: 'rejected', reason }
  })

  return data
}
