import { useQuery } from '@tanstack/react-query'
import { getDepartments, getDesignations } from '@/services/departmentService'

export const DEPT_KEYS = {
  all: ['departments'],
  designations: (deptId) => ['designations', deptId],
}

export function useDepartments() {
  return useQuery({
    queryKey: DEPT_KEYS.all,
    queryFn: getDepartments,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  })
}

export function useDesignations(departmentId = null) {
  return useQuery({
    queryKey: DEPT_KEYS.designations(departmentId),
    queryFn: () => getDesignations(departmentId),
    staleTime: 1000 * 60 * 10,
  })
}
