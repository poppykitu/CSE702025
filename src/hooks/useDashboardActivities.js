import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import dayjs from 'dayjs'

export function useDashboardActivities() {
  return useQuery({
    queryKey: ['dashboard_activities'],
    queryFn: async () => {
      // 1. Fetch 5 most recent leave requests
      const { data: leaves } = await supabase
        .from('leave_requests')
        .select(`
          id, type, status, created_at,
          profiles!employee_id (full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5)

      // 2. Fetch 5 most recent attendance records
      const { data: attendance } = await supabase
        .from('attendance_records')
        .select(`
          id, work_date, check_in, status,
          profiles!employee_id (full_name)
        `)
        .order('work_date', { ascending: false })
        .order('check_in', { ascending: false })
        .limit(8)

      // Transform leaves to activity format
      const leaveActivities = (leaves || []).map(l => ({
        id: `leave-${l.id}`,
        title: `Đơn nghỉ phép: ${l.profiles?.full_name}`,
        subtitle: `${l.status === 'pending' ? 'Đang chờ phê duyệt' : 'Đã được xử lý'}`,
        time: l.created_at,
        type: 'leave'
      }))

      // Transform attendance to activity format (filter for late arrivals if possible)
      // For now, just show recent check-ins as "Chấm công mới"
      const attendanceActivities = (attendance || []).map(a => {
        const checkInTime = a.check_in ? dayjs(a.check_in).format('HH:mm') : null
        const isLate = a.check_in && dayjs(a.check_in).hour() >= 9 // Giả định sau 9h là muộn
        
        return {
          id: `att-${a.id}`,
          title: isLate ? `Đi muộn: ${a.profiles?.full_name}` : `Chấm công: ${a.profiles?.full_name}`,
          subtitle: isLate ? `Vào lúc ${checkInTime}` : `Vào lúc ${checkInTime || '--'}`,
          time: a.check_in || a.work_date,
          type: isLate ? 'late' : 'attendance'
        }
      })

      // Combine and sort by time
      return [...leaveActivities, ...attendanceActivities]
        .sort((a, b) => dayjs(b.time).diff(dayjs(a.time)))
        .slice(0, 10)
    },
    refetchInterval: 30000 // Refresh every 30s
  })
}
