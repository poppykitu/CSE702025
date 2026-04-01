import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import { MOCK_EMPLOYEES } from '@/utils/mockData'
import { normalizeSearch, formatDate } from '@/utils/helpers'
import { logAuditEvent, AUDIT_ACTIONS } from '@/services/auditService'

/**
 * Lấy danh sách nhân viên với filter và search
 */
export async function getEmployees({ search = '', departmentIds = [], status = 'all', workTypes = [] } = {}) {
  if (!isSupabaseConfigured) {
    return filterMockEmployees({ search, departmentIds, status, workTypes })
  }

  let query = supabase
    .from('profiles')
    .select(`
      *,
      departments!department_id (id, name, code),
      designations (id, title, level)
    `)
    .order('full_name', { ascending: true })

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,employee_id.ilike.%${search}%,phone.ilike.%${search}%`)
  }

  if (departmentIds.length > 0) {
    query = query.in('department_id', departmentIds)
  }

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  if (workTypes.length > 0) {
    query = query.in('work_type', workTypes)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

/**
 * Lấy thông tin chi tiết 1 nhân viên
 */
export async function getEmployeeById(id) {
  if (!isSupabaseConfigured) {
    const emp = MOCK_EMPLOYEES.find(e => e.id === id)
    if (!emp) throw new Error('Không tìm thấy nhân viên')
    return emp
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      departments!department_id (id, name, code, description),
      designations (id, title, level),
      manager:manager_id (id, full_name, avatar_url, employee_id)
    `)
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Tạo nhân viên mới
 */
export async function createEmployee(employeeData) {
  if (!isSupabaseConfigured) {
    // Mock: trả về data với id giả
    return { ...employeeData, id: `emp-${Date.now()}`, created_at: new Date().toISOString() }
  }

  const { data, error } = await supabase
    .from('profiles')
    .insert([employeeData])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Cập nhật thông tin nhân viên
 */
export async function updateEmployee(id, employeeData) {
  if (!isSupabaseConfigured) {
    return { ...employeeData, id }
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(employeeData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Log audit event
  logAuditEvent({
    tableName: 'profiles',
    recordId: id,
    action: AUDIT_ACTIONS.UPDATE_PROFILE,
    newData: data
  })

  return data
}

/**
 * Xóa mềm nhân viên (cập nhật status → terminated)
 */
export async function terminateEmployee(id, terminationDate) {
  if (!isSupabaseConfigured) {
    return { id, status: 'terminated', date_of_termination: terminationDate }
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ status: 'terminated', date_of_termination: terminationDate })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)

  // Log audit event
  logAuditEvent({
    tableName: 'profiles',
    recordId: id,
    action: 'TERMINATE',
    newData: { status: 'terminated', date: terminationDate }
  })

  return data
}

/**
 * Upload ảnh đại diện lên Supabase Storage
 */
export async function uploadAvatar(file, employeeId) {
  if (!isSupabaseConfigured) {
    return URL.createObjectURL(file)
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${employeeId}-${Date.now()}.${fileExt}`
  const filePath = `avatars/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true })

  if (uploadError) throw new Error(uploadError.message)

  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
  return data.publicUrl
}

/**
 * Upload hợp đồng bản mềm (PDF) lên Supabase Storage
 */
export async function uploadContract(file, employeeId) {
  if (!isSupabaseConfigured) {
    return URL.createObjectURL(file)
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${employeeId}-contract-${Date.now()}.${fileExt}`
  const filePath = `${employeeId}/${fileName}`

  const { error: uploadError } = await supabase.storage
    .from('employee_documents')
    .upload(filePath, file, { upsert: true })

  if (uploadError) throw new Error(uploadError.message)

  const { data } = supabase.storage.from('employee_documents').getPublicUrl(filePath)
  return data.publicUrl
}

/**
 * Lấy số lượng nhân viên theo từng phòng ban
 */
export async function getEmployeeCountByDepartment() {
  if (!isSupabaseConfigured) {
    const counts = {}
    MOCK_EMPLOYEES.forEach(e => {
      counts[e.department_id] = (counts[e.department_id] || 0) + 1
    })
    return counts
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('department_id')
    .neq('status', 'terminated')

  if (error) throw new Error(error.message)

  const counts = {}
  data.forEach(({ department_id }) => {
    counts[department_id] = (counts[department_id] || 0) + 1
  })
  return counts
}

// ========================
// MOCK FILTERING HELPERS
// ========================
function filterMockEmployees({ search, departmentIds, status, workTypes }) {
  let results = [...MOCK_EMPLOYEES]

  if (search) {
    const normalized = normalizeSearch(search)
    results = results.filter(emp =>
      normalizeSearch(emp.full_name).includes(normalized) ||
      normalizeSearch(emp.email).includes(normalized) ||
      normalizeSearch(emp.employee_id).includes(normalized)
    )
  }

  if (departmentIds.length > 0) {
    results = results.filter(emp => departmentIds.includes(emp.department_id))
  }

  if (status !== 'all') {
    results = results.filter(emp => emp.status === status)
  }

  if (workTypes.length > 0) {
    results = results.filter(emp => workTypes.includes(emp.work_type))
  }

  return results
}
