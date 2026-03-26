import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getLeaveRequests, getMyLeaveRequests, createLeaveRequest, approveLeave, rejectLeave } from '../services/leaveService'

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

export function useMyLeaveRequests(employeeId) {
  return useQuery({
    queryKey: ['leaves', 'my', employeeId],
    queryFn: () => getMyLeaveRequests(employeeId),
    enabled: !!employeeId,
  })
}

export function useCreateLeave() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => createLeaveRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LEAVE_KEYS.all })
      queryClient.invalidateQueries({ queryKey: ['leaves', 'my'] })
    },
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
