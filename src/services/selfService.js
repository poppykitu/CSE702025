import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient'

export async function getMyAttendance(employeeId) {
  if (!isSupabaseConfigured) return []
  
  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('employee_id', employeeId)
    .order('work_date', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

export async function getMyPayslips(employeeId) {
  if (!isSupabaseConfigured) return []

  const { data, error } = await supabase
    .from('payslips')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('status', 'paid') // Only show paid ones to employees
    .order('year', { ascending: false })
    .order('month', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}
