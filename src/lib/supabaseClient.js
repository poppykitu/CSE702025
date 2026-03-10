import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase] Biến môi trường VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY chưa được cấu hình.\n' +
    'Ứng dụng sẽ chạy với mock data. Tạo file .env từ .env.example để kết nối Supabase thật.'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)

/**
 * Kiểm tra xem Supabase có được cấu hình hay không
 */
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)
