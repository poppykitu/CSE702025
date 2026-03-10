import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import { MOCK_DEPARTMENTS, MOCK_DESIGNATIONS } from '@/utils/mockData'

/**
 * Lấy danh sách tất cả phòng ban
 */
export async function getDepartments() {
  if (!isSupabaseConfigured) {
    return MOCK_DEPARTMENTS
  }

  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('name', { ascending: true })

  if (error) throw new Error(error.message)
  return data
}

/**
 * Lấy danh sách chức danh (optionally filtered by department)
 */
export async function getDesignations(departmentId = null) {
  if (!isSupabaseConfigured) {
    if (departmentId) {
      return MOCK_DESIGNATIONS.filter(d => d.department_id === departmentId)
    }
    return MOCK_DESIGNATIONS
  }

  let query = supabase.from('designations').select('*').order('title')
  if (departmentId) {
    query = query.eq('department_id', departmentId)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}
