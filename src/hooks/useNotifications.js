import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/features/auth/context/AuthContext'

// Fetch all unread notifications for current user from system_notifications table
export function useNotifications() {
  const { profile, role } = useAuth()

  return useQuery({
    queryKey: ['notifications', profile?.id],
    queryFn: async () => {
      if (!profile?.id) return []

      // Try system_notifications first (Phase 2 table)
      const { data: sysNotifs, error: sysError } = await supabase
        .from('system_notifications')
        .select('*')
        .eq('recipient_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20)

      // If system_notifications table exists and has data, use it
      if (!sysError) {
        return (sysNotifs || []).map(n => ({
          id: n.id,
          title: n.title,
          description: n.body,
          time: n.created_at,
          is_read: n.is_read,
          reference_id: n.reference_id,
          reference_table: n.reference_table,
          type: n.type,
          link: resolveLink(n),
        }))
      }

      // Fallback: derive notifications from leave_requests for Admin/HR
      if (role === 'admin' || role === 'hr') {
        const { data } = await supabase
          .from('leave_requests')
          .select('id, type, created_at, profiles!employee_id(full_name)')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(10)

        return (data || []).map(l => ({
          id: l.id,
          title: 'Don nghi phep can phe duyet',
          description: `${l.profiles?.full_name} xin nghi phep`,
          time: l.created_at,
          is_read: false,
          link: '/leaves',
          type: 'leave_request',
        }))
      }

      return []
    },
    refetchInterval: 30000, // 30 seconds
    enabled: !!profile?.id,
  })
}

// Mark a single notification as read
export function useMarkNotificationRead() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async (notificationId) => {
      const { error } = await supabase
        .from('system_notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', profile?.id] }),
  })
}

// Mark all notifications as read
export function useMarkAllRead() {
  const queryClient = useQueryClient()
  const { profile } = useAuth()

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('system_notifications')
        .update({ is_read: true })
        .eq('recipient_id', profile.id)
        .eq('is_read', false)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications', profile?.id] }),
  })
}

// Helper: resolve link from notification type
function resolveLink(notification) {
  switch (notification.type) {
    case 'leave_request':       return '/approval-center'
    case 'profile_update':      return '/approval-center'
    case 'application_received': return '/recruitment'
    case 'interview_scheduled': return '/recruitment'
    case 'applicant_hired':     return '/employees'
    default:                    return '/dashboard'
  }
}
