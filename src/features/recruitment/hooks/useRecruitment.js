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
          interviewer:profiles!job_applications_interviewer_id_fkey(full_name, email),
          plan:recruitment_plans(code, title, status)
        `)
        .order('created_at', { ascending: false })

      if (filters.stage) q = q.eq('stage', filters.stage)
      if (filters.department_id) q = q.eq('department_id', filters.department_id)
      if (filters.plan_id) q = q.eq('plan_id', filters.plan_id)

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
    mutationFn: async ({ id, interview_time, interviewer_id, interview_location }) => {
      const { data, error } = await supabase
        .from('job_applications')
        .update({
          stage: 'interview',
          interview_time,
          interviewer_id,
          interview_location,
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
// Onboard employee (Edge Function handles Auth + DB + Email)
// =========================================================
export function useOnboardEmployee() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ applicationId, hiredById }) => {
      const { data, error } = await supabase.functions.invoke('onboard-employee', {
        body: { applicationId, hiredById }
      })
      if (error) throw new Error(error.message)
      if (data?.error) throw new Error(data.error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['employees'] })
      queryClient.invalidateQueries({ queryKey: ['recruitment_plans'] })
    },
  })
}

// =========================================================
// Fetch recruitment plans
// =========================================================
export function useRecruitmentPlans(filters = {}) {
  return useQuery({
    queryKey: ['recruitment_plans', filters],
    queryFn: async () => {
      let q = supabase
        .from('recruitment_plans')
        .select(`
          *,
          departments(name),
          applications:job_applications(id, stage)
        `)
        .order('created_at', { ascending: false })

      if (filters.status) q = q.eq('status', filters.status)
      if (filters.code) q = q.eq('code', filters.code)

      const { data, error } = await q
      if (error) throw error
      return data
    },
  })
}

// =========================================================
// Create recruitment plan
// =========================================================
export function useCreatePlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (planData) => {
      const { data, error } = await supabase
        .from('recruitment_plans')
        .insert(planData)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recruitment_plans'] }),
  })
}

// =========================================================
// Update plan status
// =========================================================
export function useUpdatePlanStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }) => {
      const { data, error } = await supabase
        .from('recruitment_plans')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recruitment_plans'] }),
  })
}

// =========================================================
// Delete application 
// =========================================================
export function useDeleteApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (applicationId) => {
      const { error } = await supabase
        .from('job_applications')
        .delete()
        .eq('id', applicationId)
      if (error) throw error
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      queryClient.invalidateQueries({ queryKey: ['recruitment_plans'] })
    },
  })
}
