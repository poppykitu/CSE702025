import { createClient } from '@supabase/supabase-js'

/**
 * File tien ich duoc tao theo yeu cau cua nguoi dung
 * su dung bien moi truong tu .env
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('[Supabase Utility] Missing environment variables!')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
)

// Export helper de kiem tra du lieu nhanh (Todo example)
export const fetchTodos = async () => {
  const { data, error } = await supabase.from('todos').select('*')
  if (error) throw error
  return data
}
