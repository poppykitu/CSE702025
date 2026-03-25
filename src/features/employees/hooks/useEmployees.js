import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  terminateEmployee,
} from '@/features/employees/services/employeeService'

// Query keys
export const EMPLOYEE_KEYS = {
  all: ['employees'],
  list: (filters) => ['employees', 'list', filters],
  detail: (id) => ['employees', 'detail', id],
}

/**
 * Hook lấy danh sách nhân viên (với filter)
 */
export function useEmployees(filters = {}) {
  return useQuery({
    queryKey: EMPLOYEE_KEYS.list(filters),
    queryFn: () => getEmployees(filters),
    staleTime: 1000 * 60 * 2, // 2 phút
    gcTime: 1000 * 60 * 10,   // 10 phút
  })
}

/**
 * Hook lấy thông tin chi tiết 1 nhân viên
 */
export function useEmployee(id) {
  return useQuery({
    queryKey: EMPLOYEE_KEYS.detail(id),
    queryFn: () => getEmployeeById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  })
}

/**
 * Hook tạo nhân viên mới
 */
export function useCreateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_KEYS.all })
    },
  })
}

/**
 * Hook cập nhật nhân viên
 */
export function useUpdateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }) => updateEmployee(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_KEYS.all })
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_KEYS.detail(id) })
    },
  })
}

/**
 * Hook cho nghỉ việc nhân viên
 */
export function useTerminateEmployee() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, terminationDate }) => terminateEmployee(id, terminationDate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EMPLOYEE_KEYS.all })
    },
  })
}
