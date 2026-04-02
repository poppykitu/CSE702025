import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabaseClient'

// =========================================================
// Fetch all applications (HR/Admin)
// =========================================================
export function useApplications(filters = {}) {
  return useQuery({
    queryKey: ['applications', filters],
    queryFn: async () => {
      let q = supabase
        .from('job_applications')
        .select(`
          *,
          departments(name),
          interviewer:profiles!job_applications_interviewer_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false })

      if (filters.stage) q = q.eq('stage', filters.stage)
      if (filters.department_id) q = q.eq('department_id', filters.department_id)

      const { data, error } = await q
      if (error) throw error
      return data
    },
  })
}

// =========================================================
// Submit a new public application (unauthenticated)
// =========================================================
export function useSubmitApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (formData) => {
      const { error } = await supabase
        .from('job_applications')
        .insert(formData)
      if (error) throw error
      return true
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applications'] }),
  })
}

// =========================================================
// Update application stage (pipeline progression)
// =========================================================
export function useUpdateApplicationStage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, stage, ...extraFields }) => {
      const { data, error } = await supabase
        .from('job_applications')
        .update({ stage, ...extraFields, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applications'] }),
  })
}

// =========================================================
// Schedule interview
// =========================================================
export function useScheduleInterview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, interview_time, interviewer_id }) => {
      const { data, error } = await supabase
        .from('job_applications')
        .update({
          stage: 'interview',
          interview_time,
          interviewer_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['applications'] }),
  })
}

// =========================================================
// Convert hired applicant to employee (via RPC)
// =========================================================
export function useHireApplicant() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ applicationId, hiredById }) => {
      const { data, error } = await supabase.rpc('convert_applicant_to_employee', {
        p_application_id: applicationId,
        p_hired_by_id: hiredById,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
    },
  })
}
