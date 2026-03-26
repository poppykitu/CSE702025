import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminAttendanceService } from '@/features/attendance/services/adminAttendanceService'
import { message } from 'antd'

export function useAdminEmployeeAttendance(employeeId, month, year) {
  return useQuery({
    queryKey: ['admin_attendance', employeeId, month, year],
    queryFn: () => adminAttendanceService.getEmployeeAttendance(employeeId, month, year),
    enabled: !!employeeId,
  })
}

export function useMonthlyAttendanceForAll(month, year) {
  return useQuery({
    queryKey: ['admin_monthly_attendance', month, year],
    queryFn: () => adminAttendanceService.getMonthlyAttendanceForAll(month, year)
  })
}

export function useUpsertAttendance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: adminAttendanceService.upsertRecord,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin_attendance', variables.employee_id] })
      queryClient.invalidateQueries({ queryKey: ['admin_monthly_attendance'] })
      queryClient.invalidateQueries({ queryKey: ['attendance'] }) // global if needed
    },
    onError: (err) => message.error('Không thể lưu bản ghi chấm công: ' + err.message)
  })
}

export function useDeleteAttendance() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: adminAttendanceService.deleteRecord,
    onSuccess: () => {
      queryClient.invalidateQueries(['admin_attendance'])
    },
    onError: (err) => message.error('Không thể xóa bản ghi chấm công: ' + err.message)
  })
}
