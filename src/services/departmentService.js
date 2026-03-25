import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import { MOCK_DEPARTMENTS, MOCK_DESIGNATIONS } from '@/utils/mockData'

/**
 * Lay danh sach tat ca phong ban
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
 * Lay thong tin chi tiet 1 phong ban
 */
export async function getDepartmentById(id) {
  if (!isSupabaseConfigured) {
    const dept = MOCK_DEPARTMENTS.find(d => d.id === id)
    if (!dept) throw new Error('Khong tim thay phong ban')
    return dept
  }

  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Tao phong ban moi
 */
export async function createDepartment(departmentData) {
  if (!isSupabaseConfigured) {
    const newDept = {
      ...departmentData,
      id: `dept-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    MOCK_DEPARTMENTS.push(newDept)
    return newDept
  }

  const { data, error } = await supabase
    .from('departments')
    .insert([departmentData])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Cap nhat thong tin phong ban
 */
export async function updateDepartment(id, departmentData) {
  if (!isSupabaseConfigured) {
    const idx = MOCK_DEPARTMENTS.findIndex(d => d.id === id)
    if (idx !== -1) {
      MOCK_DEPARTMENTS[idx] = { ...MOCK_DEPARTMENTS[idx], ...departmentData, updated_at: new Date().toISOString() }
      return MOCK_DEPARTMENTS[idx]
    }
    return { ...departmentData, id }
  }

  const { data, error } = await supabase
    .from('departments')
    .update(departmentData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

/**
 * Xoa phong ban
 */
export async function deleteDepartment(id) {
  if (!isSupabaseConfigured) {
    const idx = MOCK_DEPARTMENTS.findIndex(d => d.id === id)
    if (idx !== -1) {
      MOCK_DEPARTMENTS.splice(idx, 1)
    }
    return { id }
  }

  const { data, error } = await supabase
    .from('departments')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  return data
}

/**
 * Lay danh sach chuc danh (optionally filtered by department)
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
