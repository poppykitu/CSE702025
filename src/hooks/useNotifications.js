import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/features/auth/context/AuthContext'

export function useNotifications() {
  const { role } = useAuth()
  
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      // For Admin/HR, notifications are pending leave requests
      if (role === 'admin' || role === 'hr') {
        const { data } = await supabase
          .from('leave_requests')
          .select(`
            id, type, created_at,
            profiles!employee_id (full_name)
          `)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(10)
        
        return (data || []).map(l => ({
          id: l.id,
          title: 'Đơn nghỉ phép mới',
          description: `${l.profiles?.full_name} xin nghỉ phép`,
          time: l.created_at,
          link: '/leaves'
        }))
      }
      
      return [] // Other roles can have different logic
    },
    refetchInterval: 60000 // 1 minute
  })
}
