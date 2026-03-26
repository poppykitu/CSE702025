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

  getMonthlyAttendanceForAll: async (month, year) => {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`

    // 1. Fetch all active employees
    const { data: profiles, error: profileErr } = await supabase
      .from('profiles')
      .select('id, full_name, employee_id')
      .order('full_name', { ascending: true })
    if (profileErr) throw profileErr

    // 2. Fetch all attendance records in this month
    const { data: records, error: recordErr } = await supabase
      .from('attendance_records')
      .select('*')
      .gte('work_date', startDate)
      .lte('work_date', endDate)
    if (recordErr) throw recordErr

    // 3. Transform into a matrix structure for Antd Table
    const formattedData = profiles.map(emp => {
      const empRecords = records.filter(r => r.employee_id === emp.id)
      const recordMap = {}
      
      empRecords.forEach(r => {
        // use day number as key (e.g. "1", "25")
        const day = parseInt(r.work_date.split('-')[2], 10)
        recordMap[day] = r
      })

      return {
        key: emp.id,
        employee_id: emp.id,
        employee_code: emp.employee_id,
        full_name: emp.full_name,
        records: recordMap
      }
    })

    return formattedData
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
