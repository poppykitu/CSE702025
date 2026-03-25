import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getLeaveRequests, approveLeave, rejectLeave } from '../services/leaveService'

export const LEAVE_KEYS = {
  all: ['leaves'],
  list: () => ['leaves', 'list'],
}

export function useLeaveRequests() {
  return useQuery({
    queryKey: LEAVE_KEYS.list(),
    queryFn: getLeaveRequests,
  })
}

export function useApproveLeave() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, comment }) => approveLeave(id, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEAVE_KEYS.all })
    },
  })
}

export function useRejectLeave() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }) => rejectLeave(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEAVE_KEYS.all })
    },
  })
}
