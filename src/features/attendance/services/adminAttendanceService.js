import { supabase } from '@/lib/supabaseClient'

export const adminAttendanceService = {
  getEmployeeAttendance: async (employeeId, month, year) => {
    // get records for a specific employee in a specific month/year
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`

    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('work_date', startDate)
      .lte('work_date', endDate)
      .order('work_date', { ascending: false })

    if (error) throw error
    return data
  },

  upsertRecord: async (payload) => {
    // payload: { id (optional), employee_id, work_date, check_in, check_out, status, note }
    const { data, error } = await supabase
      .from('attendance_records')
      .upsert(payload, { onConflict: 'employee_id, work_date' })
      .select()
      .single()

    if (error) throw error
    return data
  },
  
  deleteRecord: async (recordId) => {
    const { error } = await supabase
      .from('attendance_records')
      .delete()
      .eq('id', recordId)
    
    if (error) throw error
    return true
  }
}
